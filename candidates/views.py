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

from . import notifications
from .models import (
    Activity,
    Application,
    ApplicationStageHistory,
    Candidate,
    Department,
    Interview,
    Job,
    JobRequisition,
    JobTemplate,
    Note,
    Offer,
    PipelineStage,
    ScorecardTemplate,
    Tag,
    TalentPool,
    Task,
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
    JobRequisitionSerializer,
    JobSerializer,
    JobTemplateSerializer,
    NoteSerializer,
    OfferSerializer,
    PipelineStageSerializer,
    ProfileSerializer,
    PublicApplySerializer,
    PublicJobSerializer,
    RegisterSerializer,
    ScorecardTemplateSerializer,
    TagSerializer,
    TalentPoolDetailSerializer,
    TalentPoolSerializer,
    TaskSerializer,
    UserSerializer,
)


def log_activity(actor, verb, **kwargs):
    return Activity.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        verb=verb,
        **kwargs,
    )


def _notify_mentions(actor, text, candidate):
    """Email any @username mentioned in a note body."""
    import re

    usernames = set(re.findall(r"@([A-Za-z0-9_.-]{2,30})", text or ""))
    if not usernames:
        return
    users = User.objects.filter(
        username__in=usernames, is_active=True
    ).exclude(id=getattr(actor, "id", None))
    for u in users:
        log_activity(
            actor, f"@{u.username} در یادداشت «{candidate.full_name}» منشن شد",
            candidate=candidate,
        )
    notifications.team_email(
        users,
        f"در یادداشتی برای «{candidate.full_name}» منشن شدید",
        f"{getattr(actor, 'get_full_name', lambda: '')() or actor} شما را منشن کرد:\n\n{text}",
    )


# --------------------------------------------------------------------------- #
#  Auth
# --------------------------------------------------------------------------- #
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        from django.conf import settings

        # Open self-registration is a security risk for a private ATS.
        # Allowed only when explicitly enabled, or for the very first user
        # (who becomes a superuser so the instance is usable out of the box).
        first_user = not User.objects.exists()
        if not (settings.ALLOW_OPEN_REGISTRATION or first_user):
            return Response(
                {"detail": "ثبت‌نام باز نیست. برای دسترسی با مدیر سامانه تماس بگیرید."},
                status=status.HTTP_403_FORBIDDEN,
            )
        response = super().create(request, *args, **kwargs)
        if first_user:
            User.objects.filter(username=request.data.get("username")).update(
                is_staff=True, is_superuser=True
            )
        return response


class MeView(APIView):
    def get(self, request):
        data = UserSerializer(request.user).data
        data["is_staff"] = request.user.is_staff
        data["is_superuser"] = request.user.is_superuser
        return Response(data)


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

    @action(detail=False, methods=["get"])
    def duplicates(self, request):
        """Group candidates that share an email or a phone number."""
        from collections import defaultdict

        buckets = defaultdict(set)
        rows = Candidate.objects.values("id", "email", "phone", "first_name", "last_name")
        by_id = {}
        for r in rows:
            by_id[r["id"]] = r
            if r["email"]:
                buckets[("email", r["email"].strip().lower())].add(r["id"])
            phone = (r["phone"] or "").strip()
            if len(phone) >= 7:
                buckets[("phone", phone[-10:])].add(r["id"])

        groups = []
        seen = set()
        for (key_type, key), ids in buckets.items():
            if len(ids) < 2 or frozenset(ids) in seen:
                continue
            seen.add(frozenset(ids))
            members = Candidate.objects.filter(id__in=ids).prefetch_related(
                "tags", "skills", "applications"
            )
            groups.append(
                {
                    "match_on": key_type,
                    "value": key,
                    "candidates": CandidateListSerializer(members, many=True).data,
                }
            )
        return Response({"groups": groups, "count": len(groups)})

    @action(detail=True, methods=["post"])
    def merge(self, request, pk=None):
        """Merge another candidate (``source``) into this one, then delete it."""
        target = self.get_object()
        try:
            source = Candidate.objects.get(pk=request.data.get("source"))
        except (Candidate.DoesNotExist, ValueError, TypeError):
            return Response(
                {"detail": "کاندیدای مبدأ نامعتبر است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if source.pk == target.pk:
            return Response(
                {"detail": "نمی‌توان یک کاندیدا را با خودش ادغام کرد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # move related rows
        source.work_experiences.update(candidate=target)
        source.educations.update(candidate=target)
        source.skills.update(candidate=target)
        source.notes.update(candidate=target)
        source.activities.update(candidate=target)
        for app in source.applications.all():
            if not target.applications.filter(job=app.job).exists():
                app.candidate = target
                app.save(update_fields=["candidate"])
        target.tags.add(*source.tags.all())

        # fill blank fields on the target from the source
        for field in ("phone", "headline", "location", "summary", "linkedin_url",
                      "github_url", "portfolio_url"):
            if not getattr(target, field) and getattr(source, field):
                setattr(target, field, getattr(source, field))
        if not target.photo and source.photo:
            target.photo = source.photo
        if not target.resume and source.resume:
            target.resume = source.resume
        target.rating = max(target.rating, source.rating)
        target.is_favorite = target.is_favorite or source.is_favorite
        target.save()

        log_activity(
            request.user,
            f"کاندیدای تکراری «{source.full_name}» در «{target.full_name}» ادغام شد",
            candidate=target,
        )
        source.delete()
        return Response(CandidateSerializer(target).data)

    @action(detail=False, methods=["post"])
    def import_csv(self, request):
        """Bulk-create candidates from an uploaded CSV file."""
        import csv
        import io

        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "فایلی ارسال نشد."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            text = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response(
                {"detail": "فایل باید با کدگذاری UTF-8 باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reader = csv.DictReader(io.StringIO(text))
        aliases = {
            "first_name": ["first_name", "نام", "firstname", "name"],
            "last_name": ["last_name", "نام خانوادگی", "lastname", "family"],
            "email": ["email", "ایمیل", "mail"],
            "phone": ["phone", "تلفن", "mobile", "موبایل"],
            "headline": ["headline", "عنوان شغلی", "title", "position"],
            "location": ["location", "موقعیت", "شهر", "city"],
        }

        def pick(row, field):
            for a in aliases[field]:
                for k, v in row.items():
                    if k and k.strip().lower() == a.lower() and v:
                        return v.strip()
            return ""

        created, skipped, errors = 0, 0, []
        for i, row in enumerate(reader, start=2):
            email = pick(row, "email")
            first = pick(row, "first_name")
            last = pick(row, "last_name")
            if not email and not (first and last):
                errors.append(f"سطر {i}: ایمیل یا نام کامل لازم است")
                continue
            if email and Candidate.objects.filter(email__iexact=email).exists():
                skipped += 1
                continue
            if not last and first and " " in first:
                first, last = first.split(" ", 1)
            try:
                Candidate.objects.create(
                    first_name=first or "نامشخص",
                    last_name=last or "-",
                    email=email
                    or f"import-{timezone.now().timestamp():.0f}-{i}@import.local",
                    phone=pick(row, "phone"),
                    headline=pick(row, "headline"),
                    location=pick(row, "location"),
                    source="other",
                )
                created += 1
            except Exception as exc:  # noqa: BLE001
                errors.append(f"سطر {i}: {exc}")

        if created:
            log_activity(request.user, f"{created} کاندیدا از فایل CSV وارد شد")
        return Response(
            {"created": created, "skipped": skipped, "errors": errors[:20]}
        )

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
        _notify_mentions(request.user, note.body, candidate)
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
        if request.data.get("notify"):
            notifications.stage_changed(application, new_stage)
        return Response(ApplicationSerializer(application).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        application = self.get_object()
        reason = request.data.get("reason", "")
        application.status = Application.STATUS_REJECTED
        application.rejection_reason = reason
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
        if request.data.get("notify"):
            notifications.application_rejected(application, reason)
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
        if str(self.request.data.get("send_invite", "")).lower() in ("1", "true", "on"):
            notifications.interview_invite(interview)

    def perform_update(self, serializer):
        interview = serializer.save()
        if interview.status == Interview.STATUS_COMPLETED and interview.feedback:
            log_activity(
                self.request.user,
                f"بازخورد مصاحبه «{interview.title}» ثبت شد",
                candidate=interview.application.candidate,
                application=interview.application,
            )

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        interview = self.get_object()
        notifications.interview_invite(interview)
        log_activity(
            request.user,
            f"دعوت مصاحبه «{interview.title}» ارسال شد",
            candidate=interview.application.candidate,
            application=interview.application,
        )
        return Response({"detail": "دعوت‌نامه‌ها ارسال شد."})

    @action(detail=True, methods=["get"])
    def ics(self, request, pk=None):
        from django.http import HttpResponse

        interview = self.get_object()
        text = notifications.build_interview_ics(interview)
        resp = HttpResponse(text, content_type="text/calendar; charset=utf-8")
        resp["Content-Disposition"] = f'attachment; filename="interview-{interview.id}.ics"'
        return resp


# --------------------------------------------------------------------------- #
#  Scorecards / offers / talent pools / job templates
# --------------------------------------------------------------------------- #
class ScorecardTemplateViewSet(viewsets.ModelViewSet):
    queryset = ScorecardTemplate.objects.all()
    serializer_class = ScorecardTemplateSerializer
    pagination_class = None


class JobTemplateViewSet(viewsets.ModelViewSet):
    queryset = JobTemplate.objects.select_related("department")
    serializer_class = JobTemplateSerializer
    pagination_class = None


class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.select_related(
        "application__candidate", "application__job", "created_by"
    )
    serializer_class = OfferSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status", "application", "application__job"]
    ordering_fields = ["created_at", "start_date", "expires_on"]

    def perform_create(self, serializer):
        offer = serializer.save(created_by=self.request.user)
        log_activity(
            self.request.user,
            f"پیش‌نویس پیشنهاد برای «{offer.application.candidate.full_name}» ساخته شد",
            candidate=offer.application.candidate,
            job=offer.application.job,
            application=offer.application,
        )

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        offer = self.get_object()
        offer.status = Offer.STATUS_SENT
        offer.sent_at = timezone.now()
        offer.save(update_fields=["status", "sent_at", "updated_at"])
        notifications.offer_sent(offer)
        log_activity(
            request.user,
            f"پیشنهاد همکاری برای «{offer.application.candidate.full_name}» ارسال شد",
            candidate=offer.application.candidate,
            job=offer.application.job,
            application=offer.application,
        )
        return Response(OfferSerializer(offer).data)

    def _respond(self, offer, accepted):
        offer.status = Offer.STATUS_ACCEPTED if accepted else Offer.STATUS_DECLINED
        offer.responded_at = timezone.now()
        offer.save(update_fields=["status", "responded_at", "updated_at"])
        app = offer.application
        if accepted:
            won = PipelineStage.objects.filter(kind=PipelineStage.KIND_WON).first()
            app.status = Application.STATUS_HIRED
            if won:
                app.stage = won
            app.save()
        return offer

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        offer = self._respond(self.get_object(), True)
        log_activity(
            request.user,
            f"پیشنهاد «{offer.application.candidate.full_name}» پذیرفته شد",
            candidate=offer.application.candidate,
            application=offer.application,
        )
        return Response(OfferSerializer(offer).data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        offer = self._respond(self.get_object(), False)
        log_activity(
            request.user,
            f"پیشنهاد «{offer.application.candidate.full_name}» رد شد",
            candidate=offer.application.candidate,
            application=offer.application,
        )
        return Response(OfferSerializer(offer).data)


class TalentPoolViewSet(viewsets.ModelViewSet):
    queryset = TalentPool.objects.select_related("owner").prefetch_related("candidates")
    pagination_class = None

    def get_serializer_class(self):
        if self.action in ("retrieve",):
            return TalentPoolDetailSerializer
        return TalentPoolSerializer

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def add(self, request, pk=None):
        pool = self.get_object()
        ids = request.data.get("candidate_ids") or []
        pool.candidates.add(*Candidate.objects.filter(id__in=ids))
        return Response({"count": pool.candidates.count()})

    @action(detail=True, methods=["post"])
    def remove(self, request, pk=None):
        pool = self.get_object()
        ids = request.data.get("candidate_ids") or []
        pool.candidates.remove(*Candidate.objects.filter(id__in=ids))
        return Response({"count": pool.candidates.count()})


# --------------------------------------------------------------------------- #
#  Tasks / requisitions
# --------------------------------------------------------------------------- #
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related(
        "assignee", "created_by", "candidate", "job"
    )
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["assignee", "done", "candidate", "job"]
    ordering_fields = ["due_date", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get("mine") == "true":
            qs = qs.filter(assignee=self.request.user)
        if self.request.query_params.get("overdue") == "true":
            qs = qs.filter(done=False, due_date__lt=timezone.localdate())
        return qs

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        if not task.assignee_id:
            task.assignee = self.request.user
            task.save(update_fields=["assignee"])
        if task.assignee and task.assignee != self.request.user:
            notifications.team_email(
                [task.assignee],
                f"وظیفهٔ جدید: {task.title}",
                f"{self.request.user} وظیفه‌ای به شما محول کرد"
                + (f" (مهلت {task.due_date})" if task.due_date else "")
                + f":\n\n{task.description or task.title}",
            )

    def perform_update(self, serializer):
        was_done = serializer.instance.done
        task = serializer.save()
        if task.done and not was_done:
            task.done_at = timezone.now()
            task.save(update_fields=["done_at"])
        elif not task.done and was_done:
            task.done_at = None
            task.save(update_fields=["done_at"])

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        task = self.get_object()
        task.done = not task.done
        task.done_at = timezone.now() if task.done else None
        task.save(update_fields=["done", "done_at"])
        return Response(TaskSerializer(task).data)


class JobRequisitionViewSet(viewsets.ModelViewSet):
    queryset = JobRequisition.objects.select_related(
        "department", "requested_by", "reviewed_by", "job"
    )
    serializer_class = JobRequisitionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["status", "department", "urgency"]
    ordering_fields = ["created_at", "target_start"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # staff / superusers review everything; others see their own only
        if not (user.is_staff or user.is_superuser):
            qs = qs.filter(requested_by=user)
        return qs

    def perform_create(self, serializer):
        req = serializer.save(requested_by=self.request.user)
        if str(self.request.data.get("submit", "")).lower() in ("1", "true", "on"):
            req.status = JobRequisition.STATUS_SUBMITTED
            req.save(update_fields=["status"])
            self._notify_reviewers(req)

    def _notify_reviewers(self, req):
        reviewers = User.objects.filter(is_active=True, is_staff=True)
        notifications.team_email(
            reviewers,
            f"درخواست جذب نیرو: {req.title}",
            f"{req.requested_by} درخواست جذب «{req.title}» "
            f"({req.headcount} نفر، فوریت: {req.get_urgency_display()}) را ثبت کرد.\n\n"
            f"دلیل: {req.reason}",
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        req = self.get_object()
        req.status = JobRequisition.STATUS_SUBMITTED
        req.save(update_fields=["status", "updated_at"])
        self._notify_reviewers(req)
        return Response(JobRequisitionSerializer(req).data)

    def _review(self, req, new_status, note):
        req.status = new_status
        req.review_note = note or ""
        req.reviewed_by = self.request.user
        req.reviewed_at = timezone.now()
        req.save()
        if req.requested_by and req.requested_by.email:
            notifications.team_email(
                [req.requested_by],
                f"درخواست جذب «{req.title}» — {req.get_status_display()}",
                f"وضعیت درخواست شما: {req.get_status_display()}"
                + (f"\nیادداشت: {note}" if note else ""),
            )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        req = self.get_object()
        self._review(req, JobRequisition.STATUS_APPROVED, request.data.get("note"))
        # optionally spin up a draft job
        if str(request.data.get("create_job", "")).lower() in ("1", "true", "on"):
            job = Job.objects.create(
                title=req.title,
                department=req.department,
                employment_type=req.employment_type,
                openings=req.headcount,
                requirements=req.requirements,
                description=req.reason,
                status=Job.STATUS_DRAFT,
                hiring_manager=req.requested_by,
            )
            req.job = job
            req.save(update_fields=["job"])
        log_activity(request.user, f"درخواست جذب «{req.title}» تأیید شد")
        return Response(JobRequisitionSerializer(req).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        req = self.get_object()
        self._review(req, JobRequisition.STATUS_REJECTED, request.data.get("note"))
        log_activity(request.user, f"درخواست جذب «{req.title}» رد شد")
        return Response(JobRequisitionSerializer(req).data)

    @action(detail=True, methods=["post"])
    def hold(self, request, pk=None):
        req = self.get_object()
        self._review(req, JobRequisition.STATUS_ON_HOLD, request.data.get("note"))
        return Response(JobRequisitionSerializer(req).data)


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

        funnel, time_in_stage = _hiring_funnel()
        sources = _source_effectiveness()

        return Response(
            {
                "jobs_by_department": jobs_by_dept,
                "applications_by_status": apps_by_status,
                "applications_by_job": apps_by_job,
                "interviews_by_type": interviews_by_type,
                "rating_distribution": rating_distribution,
                "avg_time_to_hire": avg_time_to_hire,
                "total_hires": hired.count(),
                "funnel": funnel,
                "time_in_stage": time_in_stage,
                "source_effectiveness": sources,
            }
        )


def _hiring_funnel():
    """For each pipeline stage: how many applications ever reached it, and the
    average number of days spent in that stage (from stage history)."""
    stages = list(PipelineStage.objects.order_by("order", "id"))
    reached = {s.id: 0 for s in stages}
    durations = {s.id: [] for s in stages}

    histories = (
        ApplicationStageHistory.objects.select_related("to_stage", "from_stage")
        .order_by("application_id", "created_at")
    )
    by_app = {}
    for h in histories:
        by_app.setdefault(h.application_id, []).append(h)

    for entries in by_app.values():
        for i, h in enumerate(entries):
            if h.to_stage_id in reached:
                reached[h.to_stage_id] += 1
                left = (
                    entries[i + 1].created_at
                    if i + 1 < len(entries)
                    else timezone.now()
                )
                durations[h.to_stage_id].append((left - h.created_at).days)

    funnel = [
        {
            "stage": s.name,
            "kind": s.kind,
            "order": s.order,
            "reached": reached[s.id],
            "current": s.applications.count(),
        }
        for s in stages
    ]
    time_in_stage = [
        {
            "stage": s.name,
            "avg_days": round(sum(durations[s.id]) / len(durations[s.id]), 1)
            if durations[s.id]
            else 0,
        }
        for s in stages
    ]
    return funnel, time_in_stage


def _source_effectiveness():
    rows = (
        Application.objects.values("source")
        .annotate(
            applicants=Count("id"),
            hired=Count("id", filter=Q(status=Application.STATUS_HIRED)),
        )
        .order_by("-applicants")
    )
    out = []
    for r in rows:
        applicants = r["applicants"] or 0
        out.append(
            {
                "source": r["source"] or "نامشخص",
                "applicants": applicants,
                "hired": r["hired"],
                "hire_rate": round(100 * r["hired"] / applicants, 1) if applicants else 0,
            }
        )
    return out


class ReportsExportView(APIView):
    def get(self, request):
        import csv

        from django.http import HttpResponse

        funnel, time_in_stage = _hiring_funnel()
        tis = {t["stage"]: t["avg_days"] for t in time_in_stage}
        resp = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        resp["Content-Disposition"] = 'attachment; filename="hiring-funnel.csv"'
        w = csv.writer(resp)
        w.writerow(["مرحله", "نوع", "تعداد کل ورودی", "اکنون در این مرحله", "میانگین روز"])
        for row in funnel:
            w.writerow(
                [
                    row["stage"],
                    row["kind"],
                    row["reached"],
                    row["current"],
                    tis.get(row["stage"], 0),
                ]
            )
        w.writerow([])
        w.writerow(["منبع", "تعداد", "استخدام‌شده", "نرخ استخدام ٪"])
        for s in _source_effectiveness():
            w.writerow([s["source"], s["applicants"], s["hired"], s["hire_rate"]])
        return resp


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
    throttle_scope = "public_apply"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"detail": "درخواست شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم."},
            status=status.HTTP_201_CREATED,
        )
