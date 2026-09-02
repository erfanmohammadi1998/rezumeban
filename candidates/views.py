from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Prefetch, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Activity,
    Application,
    ApplicationStageHistory,
    Candidate,
    Department,
    Interview,
    Job,
    Note,
    PipelineStage,
    Tag,
)
from .serializers import (
    ActivitySerializer,
    ApplicationBoardSerializer,
    ApplicationSerializer,
    CandidateListSerializer,
    CandidateSerializer,
    ChangePasswordSerializer,
    DepartmentSerializer,
    InterviewSerializer,
    JobSerializer,
    NoteSerializer,
    PipelineStageSerializer,
    ProfileSerializer,
    PublicApplySerializer,
    PublicJobSerializer,
    RegisterSerializer,
    TagSerializer,
    UserSerializer,
)


def log_activity(actor, verb, **kwargs):
    return Activity.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        verb=verb,
        **kwargs,
    )


# --------------------------------------------------------------------------- #
#  Auth
# --------------------------------------------------------------------------- #
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "رمز عبور با موفقیت تغییر کرد."})


class TeamView(APIView):
    def get(self, request):
        users = User.objects.filter(is_active=True).order_by("username")
        return Response(UserSerializer(users, many=True).data)


# --------------------------------------------------------------------------- #
#  Small catalog resources
# --------------------------------------------------------------------------- #
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    pagination_class = None
    search_fields = ["name"]


class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    pagination_class = None
    search_fields = ["name"]


class PipelineStageViewSet(viewsets.ModelViewSet):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
    pagination_class = None


# --------------------------------------------------------------------------- #
#  Candidates
# --------------------------------------------------------------------------- #
class CandidateViewSet(viewsets.ModelViewSet):
    queryset = (
        Candidate.objects.all()
        .select_related("owner")
        .prefetch_related("tags", "skills", "work_experiences", "educations")
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "source": ["exact"],
        "rating": ["exact", "gte"],
        "is_favorite": ["exact"],
        "owner": ["exact"],
        "tags": ["exact"],
    }
    search_fields = [
        "first_name",
        "last_name",
        "email",
        "headline",
        "summary",
        "location",
        "work_experiences__company_name",
        "work_experiences__position",
        "skills__name",
    ]
    ordering_fields = ["created_at", "rating", "first_name", "last_name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return CandidateListSerializer
        return CandidateSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "notes__author",
                "applications__job",
                "applications__stage",
                "applications__interviews",
            )
        return qs.distinct()

    def perform_create(self, serializer):
        candidate = serializer.save()
        log_activity(
            self.request.user,
            f"کاندیدای «{candidate.full_name}» اضافه شد",
            candidate=candidate,
        )

    def perform_update(self, serializer):
        candidate = serializer.save()
        log_activity(
            self.request.user,
            f"اطلاعات «{candidate.full_name}» به‌روزرسانی شد",
            candidate=candidate,
        )

    @action(detail=True, methods=["post"])
    def toggle_favorite(self, request, pk=None):
        candidate = self.get_object()
        candidate.is_favorite = not candidate.is_favorite
        candidate.save(update_fields=["is_favorite"])
        return Response({"is_favorite": candidate.is_favorite})

    @action(detail=False, methods=["post"])
    def bulk_tag(self, request):
        ids = request.data.get("ids") or []
        tag_ids = request.data.get("tag_ids") or []
        tags = Tag.objects.filter(id__in=tag_ids)
        candidates = Candidate.objects.filter(id__in=ids)
        for candidate in candidates:
            candidate.tags.add(*tags)
        log_activity(
            request.user, f"برچسب‌گذاری گروهی روی {candidates.count()} کاندیدا"
        )
        return Response({"updated": candidates.count()})

    @action(detail=False, methods=["post"])
    def bulk_delete(self, request):
        ids = request.data.get("ids") or []
        qs = Candidate.objects.filter(id__in=ids)
        count = qs.count()
        qs.delete()
        log_activity(request.user, f"حذف گروهی {count} کاندیدا")
        return Response({"deleted": count})

    @action(detail=False, methods=["get"])
    def export(self, request):
        import csv

        from django.http import HttpResponse

        qs = self.filter_queryset(self.get_queryset())
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="candidates.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "نام",
                "نام خانوادگی",
                "ایمیل",
                "تلفن",
                "عنوان شغلی",
                "موقعیت",
                "منبع",
                "امتیاز",
                "نشان‌شده",
                "مهارت‌ها",
                "تاریخ ثبت",
            ]
        )
        for c in qs.prefetch_related("skills"):
            writer.writerow(
                [
                    c.first_name,
                    c.last_name,
                    c.email,
                    c.phone,
                    c.headline,
                    c.location,
                    c.get_source_display(),
                    c.rating,
                    "بله" if c.is_favorite else "خیر",
                    "، ".join(s.name for s in c.skills.all()),
                    c.created_at.strftime("%Y-%m-%d"),
                ]
            )
        return response

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        candidate = self.get_object()
        try:
            rating = int(request.data.get("rating"))
        except (TypeError, ValueError):
            return Response(
                {"detail": "امتیاز نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST
            )
        candidate.rating = max(0, min(5, rating))
        candidate.save(update_fields=["rating"])
        return Response({"rating": candidate.rating})

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        candidate = self.get_object()
        items = candidate.activities.select_related("actor")[:50]
        return Response(ActivitySerializer(items, many=True).data)

    @action(detail=True, methods=["get", "post"])
    def notes(self, request, pk=None):
        candidate = self.get_object()
        if request.method == "GET":
            return Response(
                NoteSerializer(candidate.notes.select_related("author"), many=True).data
            )
        serializer = NoteSerializer(data={**request.data, "candidate": candidate.id})
        serializer.is_valid(raise_exception=True)
        note = serializer.save(author=request.user, candidate=candidate)
        log_activity(
            request.user, f"یادداشتی برای «{candidate.full_name}» ثبت شد", candidate=candidate
        )
        return Response(NoteSerializer(note).data, status=status.HTTP_201_CREATED)


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related("author", "candidate")
    serializer_class = NoteSerializer
    filterset_fields = ["candidate"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


# --------------------------------------------------------------------------- #
#  Jobs
# --------------------------------------------------------------------------- #
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.select_related("department", "hiring_manager").order_by(
        "-created_at"
    )
    serializer_class = JobSerializer
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        "status": ["exact"],
        "employment_type": ["exact"],
        "department": ["exact"],
        "is_remote": ["exact"],
    }
    search_fields = ["title", "description", "location"]
    ordering_fields = ["created_at", "title", "published_at"]

    def perform_create(self, serializer):
        job = serializer.save()
        log_activity(self.request.user, f"آگهی «{job.title}» ایجاد شد", job=job)

    def perform_update(self, serializer):
        job = serializer.save()
        log_activity(self.request.user, f"آگهی «{job.title}» ویرایش شد", job=job)

    @action(detail=True, methods=["get"])
    def board(self, request, slug=None):
        """Kanban board grouped by pipeline stage."""
        job = self.get_object()
        stages = PipelineStage.objects.all()
        applications = (
            job.applications.select_related("candidate", "stage")
            .prefetch_related("interviews")
        )
        by_stage = {stage.id: [] for stage in stages}
        unassigned = []
        for app in applications:
            data = ApplicationBoardSerializer(app).data
            if app.stage_id in by_stage:
                by_stage[app.stage_id].append(data)
            else:
                unassigned.append(data)
        columns = [
            {
                "stage": PipelineStageSerializer(stage).data,
                "applications": by_stage[stage.id],
            }
            for stage in stages
        ]
        return Response({"columns": columns, "unassigned": unassigned})

    @action(detail=True, methods=["get"])
    def applications(self, request, slug=None):
        job = self.get_object()
        qs = job.applications.select_related("candidate", "stage", "job")
        page = self.paginate_queryset(qs)
        serializer = ApplicationSerializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


# --------------------------------------------------------------------------- #
#  Applications / pipeline
# --------------------------------------------------------------------------- #
class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = (
        Application.objects.select_related("candidate", "job", "stage")
        .prefetch_related("interviews", "stage_history__from_stage", "stage_history__to_stage")
    )
    serializer_class = ApplicationSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["job", "candidate", "stage", "status"]
    ordering_fields = ["applied_at", "created_at"]

    def perform_create(self, serializer):
        application = serializer.save()
        ApplicationStageHistory.objects.create(
            application=application,
            to_stage=application.stage,
            changed_by=self.request.user,
            note="ثبت درخواست",
        )
        log_activity(
            self.request.user,
            f"«{application.candidate.full_name}» به آگهی «{application.job.title}» اضافه شد",
            candidate=application.candidate,
            job=application.job,
            application=application,
        )

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        application = self.get_object()
        stage_id = request.data.get("stage_id")
        note = request.data.get("note", "")
        try:
            new_stage = PipelineStage.objects.get(pk=stage_id)
        except PipelineStage.DoesNotExist:
            return Response(
                {"detail": "مرحله نامعتبر است."}, status=status.HTTP_400_BAD_REQUEST
            )

        old_stage = application.stage
        if old_stage == new_stage:
            return Response(ApplicationSerializer(application).data)

        application.stage = new_stage
        if new_stage.kind == PipelineStage.KIND_WON:
            application.status = Application.STATUS_HIRED
        elif new_stage.kind == PipelineStage.KIND_LOST:
            application.status = Application.STATUS_REJECTED
        else:
            application.status = Application.STATUS_ACTIVE
        application.save(update_fields=["stage", "status", "updated_at"])

        ApplicationStageHistory.objects.create(
            application=application,
            from_stage=old_stage,
            to_stage=new_stage,
            changed_by=request.user,
            note=note,
        )
        log_activity(
            request.user,
            f"«{application.candidate.full_name}» به مرحله «{new_stage.name}» منتقل شد",
            candidate=application.candidate,
            job=application.job,
            application=application,
        )
        return Response(ApplicationSerializer(application).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        application = self.get_object()
        application.status = Application.STATUS_REJECTED
        application.rejection_reason = request.data.get("reason", "")
        lost_stage = PipelineStage.objects.filter(kind=PipelineStage.KIND_LOST).first()
        if lost_stage:
            application.stage = lost_stage
        application.save()
        log_activity(
            request.user,
            f"درخواست «{application.candidate.full_name}» رد شد",
            candidate=application.candidate,
            job=application.job,
            application=application,
        )
        return Response(ApplicationSerializer(application).data)


# --------------------------------------------------------------------------- #
#  Interviews
# --------------------------------------------------------------------------- #
class InterviewViewSet(viewsets.ModelViewSet):
    queryset = (
        Interview.objects.select_related("application__candidate", "application__job")
        .prefetch_related("interviewers")
    )
    serializer_class = InterviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status", "interview_type", "application", "application__job"]
    ordering_fields = ["scheduled_at", "created_at"]
    ordering = ["scheduled_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        upcoming = self.request.query_params.get("upcoming")
        if upcoming == "true":
            qs = qs.filter(
                scheduled_at__gte=timezone.now(), status=Interview.STATUS_SCHEDULED
            )
        return qs

    def perform_create(self, serializer):
        interview = serializer.save()
        log_activity(
            self.request.user,
            f"مصاحبه «{interview.title}» برای «{interview.application.candidate.full_name}» تنظیم شد",
            candidate=interview.application.candidate,
            job=interview.application.job,
            application=interview.application,
        )

    def perform_update(self, serializer):
        interview = serializer.save()
        if interview.status == Interview.STATUS_COMPLETED and interview.feedback:
            log_activity(
                self.request.user,
                f"بازخورد مصاحبه «{interview.title}» ثبت شد",
                candidate=interview.application.candidate,
                application=interview.application,
            )


# --------------------------------------------------------------------------- #
#  Dashboard / reports
# --------------------------------------------------------------------------- #
class DashboardView(APIView):
    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        week_ahead = now + timedelta(days=7)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {
                "stage": stage.name,
                "kind": stage.kind,
                "count": stage.applications.filter(
                    status=Application.STATUS_ACTIVE
                ).count(),
            }
            for stage in PipelineStage.objects.all()
        ]

        sources = list(
            Candidate.objects.values("source")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        trend = []
        for i in range(29, -1, -1):
            day = (now - timedelta(days=i)).date()
            trend.append(
                {
                    "date": day.isoformat(),
                    "count": Application.objects.filter(applied_at__date=day).count(),
                }
            )

        upcoming = (
            Interview.objects.filter(
                scheduled_at__gte=now,
                scheduled_at__lte=week_ahead,
                status=Interview.STATUS_SCHEDULED,
            )
            .select_related("application__candidate", "application__job")
            .order_by("scheduled_at")[:8]
        )

        recent = Activity.objects.select_related("actor")[:12]

        data = {
            "total_candidates": Candidate.objects.count(),
            "open_jobs": Job.objects.filter(status=Job.STATUS_OPEN).count(),
            "active_applications": Application.objects.filter(
                status=Application.STATUS_ACTIVE
            ).count(),
            "interviews_this_week": Interview.objects.filter(
                scheduled_at__gte=week_ago, scheduled_at__lte=week_ahead
            ).count(),
            "hires_this_month": Application.objects.filter(
                status=Application.STATUS_HIRED, updated_at__gte=month_start
            ).count(),
            "new_candidates_this_week": Candidate.objects.filter(
                created_at__gte=week_ago
            ).count(),
            "pipeline": pipeline,
            "sources": sources,
            "applications_trend": trend,
            "upcoming_interviews": InterviewSerializer(upcoming, many=True).data,
            "recent_activity": ActivitySerializer(recent, many=True).data,
        }
        return Response(data)


class CandidateStatsView(APIView):
    """Lightweight, always-available overview for the CV-only build."""

    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        qs = Candidate.objects.all()

        trend = []
        for i in range(29, -1, -1):
            day = (now - timedelta(days=i)).date()
            trend.append(
                {
                    "date": day.isoformat(),
                    "count": qs.filter(created_at__date=day).count(),
                }
            )

        return Response(
            {
                "total_candidates": qs.count(),
                "new_candidates_this_week": qs.filter(created_at__gte=week_ago).count(),
                "favorites": qs.filter(is_favorite=True).count(),
                "avg_rating": round(
                    sum(qs.values_list("rating", flat=True)) / max(qs.count(), 1), 1
                ),
                "sources": list(
                    qs.values("source").annotate(count=Count("id")).order_by("-count")
                ),
                "rating_distribution": list(
                    qs.values("rating").annotate(count=Count("id")).order_by("rating")
                ),
                "candidates_trend": trend,
                "recent_activity": ActivitySerializer(
                    Activity.objects.select_related("actor")[:12], many=True
                ).data,
                "latest_candidates": CandidateListSerializer(
                    qs.select_related("owner").prefetch_related("tags", "skills")[:6],
                    many=True,
                ).data,
            }
        )


class ReportsView(APIView):
    def get(self, request):
        jobs_by_dept = list(
            Department.objects.annotate(count=Count("jobs")).values("name", "count")
        )
        apps_by_status = list(
            Application.objects.values("status").annotate(count=Count("id"))
        )
        apps_by_job = list(
            Job.objects.annotate(count=Count("applications"))
            .values("title", "count")
            .order_by("-count")[:8]
        )
        interviews_by_type = list(
            Interview.objects.values("interview_type").annotate(count=Count("id"))
        )
        rating_distribution = list(
            Candidate.objects.values("rating").annotate(count=Count("id")).order_by("rating")
        )

        hired = Application.objects.filter(status=Application.STATUS_HIRED)
        durations = [
            (a.updated_at - a.applied_at).days for a in hired if a.updated_at and a.applied_at
        ]
        avg_time_to_hire = round(sum(durations) / len(durations), 1) if durations else 0

        return Response(
            {
                "jobs_by_department": jobs_by_dept,
                "applications_by_status": apps_by_status,
                "applications_by_job": apps_by_job,
                "interviews_by_type": interviews_by_type,
                "rating_distribution": rating_distribution,
                "avg_time_to_hire": avg_time_to_hire,
                "total_hires": hired.count(),
            }
        )


class ActivityView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    queryset = Activity.objects.select_related("actor", "candidate", "job")
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["candidate", "job", "application"]


# --------------------------------------------------------------------------- #
#  Public portal
# --------------------------------------------------------------------------- #
class PublicJobListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicJobSerializer
    queryset = Job.objects.filter(status=Job.STATUS_OPEN).select_related("department")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = {"employment_type": ["exact"], "is_remote": ["exact"]}
    search_fields = ["title", "description", "location"]


class PublicJobDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicJobSerializer
    lookup_field = "slug"
    queryset = Job.objects.filter(status=Job.STATUS_OPEN).select_related("department")


class PublicApplyView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicApplySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "درخواست شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم."},
            status=status.HTTP_201_CREATED,
        )
