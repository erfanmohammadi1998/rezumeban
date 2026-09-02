from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from .models import (
    Activity,
    Application,
    ApplicationStageHistory,
    Candidate,
    Department,
    Education,
    Interview,
    Job,
    JobTemplate,
    Note,
    Offer,
    PipelineStage,
    ScorecardTemplate,
    Skill,
    Tag,
    TalentPool,
    WorkExperience,
)


# --------------------------------------------------------------------------- #
#  Auth / users
# --------------------------------------------------------------------------- #
class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "full_name")

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("رمز عبور فعلی نادرست است.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")
        read_only_fields = ("id", "username")


# --------------------------------------------------------------------------- #
#  Small models
# --------------------------------------------------------------------------- #
class DepartmentSerializer(serializers.ModelSerializer):
    job_count = serializers.IntegerField(source="jobs.count", read_only=True)

    class Meta:
        model = Department
        fields = ("id", "name", "job_count")


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ("id", "name", "color")


class PipelineStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PipelineStage
        fields = ("id", "name", "order", "kind")


# --------------------------------------------------------------------------- #
#  Candidate sub-resources
# --------------------------------------------------------------------------- #
class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = (
            "id",
            "company_name",
            "position",
            "start_date",
            "end_date",
            "is_current",
            "description",
        )


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = (
            "id",
            "degree",
            "field_of_study",
            "university",
            "start_year",
            "graduation_year",
            "description",
        )


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "name", "level")


class NoteSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Note
        fields = ("id", "candidate", "author", "body", "created_at")
        read_only_fields = ("author", "created_at")


class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = (
            "id",
            "actor",
            "verb",
            "candidate",
            "job",
            "application",
            "meta",
            "created_at",
        )


# --------------------------------------------------------------------------- #
#  Candidate
# --------------------------------------------------------------------------- #
class CandidateListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    application_count = serializers.IntegerField(
        source="applications.count", read_only=True
    )
    top_skills = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = (
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "headline",
            "location",
            "photo",
            "source",
            "rating",
            "is_favorite",
            "owner",
            "tags",
            "top_skills",
            "application_count",
            "created_at",
        )

    def get_top_skills(self, obj):
        return [s.name for s in obj.skills.all()[:5]]


class CandidateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    work_experiences = WorkExperienceSerializer(many=True, required=False)
    educations = EducationSerializer(many=True, required=False)
    skills = SkillSerializer(many=True, required=False)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="tags",
    )
    owner = UserSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source="owner",
    )
    notes = NoteSerializer(many=True, read_only=True)
    applications = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = (
            "id",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "headline",
            "location",
            "address",
            "summary",
            "photo",
            "resume",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "source",
            "expected_salary",
            "current_salary",
            "rating",
            "is_favorite",
            "owner",
            "owner_id",
            "tags",
            "tag_ids",
            "work_experiences",
            "educations",
            "skills",
            "notes",
            "applications",
            "created_at",
            "updated_at",
        )

    def get_applications(self, obj):
        try:
            apps = obj.applications.all()
        except Exception:  # noqa: BLE001 - recruitment module may be off
            return []
        out = []
        for a in apps:
            out.append(
                {
                    "id": a.id,
                    "job_title": a.job.title,
                    "job_slug": a.job.slug,
                    "stage": a.stage.name if a.stage else None,
                    "status": a.status,
                    "status_display": a.get_status_display(),
                    "applied_at": a.applied_at,
                    "interviews": [
                        {
                            "id": iv.id,
                            "title": iv.title,
                            "interview_type": iv.interview_type,
                            "scheduled_at": iv.scheduled_at,
                            "status": iv.status,
                            "score": iv.score,
                        }
                        for iv in a.interviews.all()
                    ],
                }
            )
        return out

    def _replace_nested(self, candidate, field, model, items):
        if items is None:
            return
        getattr(candidate, field).all().delete()
        model.objects.bulk_create(
            [model(candidate=candidate, **item) for item in items]
        )

    @transaction.atomic
    def create(self, validated_data):
        experiences = validated_data.pop("work_experiences", None)
        educations = validated_data.pop("educations", None)
        skills = validated_data.pop("skills", None)
        tags = validated_data.pop("tags", None)

        candidate = Candidate.objects.create(**validated_data)

        if tags is not None:
            candidate.tags.set(tags)
        self._replace_nested(candidate, "work_experiences", WorkExperience, experiences)
        self._replace_nested(candidate, "educations", Education, educations)
        self._replace_nested(candidate, "skills", Skill, skills)
        return candidate

    @transaction.atomic
    def update(self, instance, validated_data):
        experiences = validated_data.pop("work_experiences", None)
        educations = validated_data.pop("educations", None)
        skills = validated_data.pop("skills", None)
        tags = validated_data.pop("tags", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if tags is not None:
            instance.tags.set(tags)
        self._replace_nested(instance, "work_experiences", WorkExperience, experiences)
        self._replace_nested(instance, "educations", Education, educations)
        self._replace_nested(instance, "skills", Skill, skills)
        return instance


# --------------------------------------------------------------------------- #
#  Jobs
# --------------------------------------------------------------------------- #
class JobSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source="department",
    )
    hiring_manager = UserSerializer(read_only=True)
    hiring_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source="hiring_manager",
    )
    application_count = serializers.IntegerField(
        source="applications.count", read_only=True
    )
    active_application_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    employment_type_display = serializers.CharField(
        source="get_employment_type_display", read_only=True
    )

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "slug",
            "department",
            "department_id",
            "location",
            "employment_type",
            "employment_type_display",
            "is_remote",
            "description",
            "requirements",
            "salary_min",
            "salary_max",
            "openings",
            "status",
            "status_display",
            "hiring_manager",
            "hiring_manager_id",
            "published_at",
            "application_count",
            "active_application_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("slug", "published_at")

    def get_active_application_count(self, obj):
        return obj.applications.filter(status=Application.STATUS_ACTIVE).count()


class PublicJobSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", default=None, read_only=True)
    employment_type_display = serializers.CharField(
        source="get_employment_type_display", read_only=True
    )

    class Meta:
        model = Job
        fields = (
            "id",
            "title",
            "slug",
            "department",
            "location",
            "employment_type",
            "employment_type_display",
            "is_remote",
            "description",
            "requirements",
            "salary_min",
            "salary_max",
            "published_at",
        )


# --------------------------------------------------------------------------- #
#  Applications / pipeline
# --------------------------------------------------------------------------- #
class CandidateMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Candidate
        fields = ("id", "full_name", "email", "headline", "photo", "rating")


class JobMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ("id", "title", "slug", "status")


class ApplicationStageHistorySerializer(serializers.ModelSerializer):
    from_stage = PipelineStageSerializer(read_only=True)
    to_stage = PipelineStageSerializer(read_only=True)
    changed_by = UserSerializer(read_only=True)

    class Meta:
        model = ApplicationStageHistory
        fields = ("id", "from_stage", "to_stage", "changed_by", "note", "created_at")


class InterviewSerializer(serializers.ModelSerializer):
    interviewers = UserSerializer(many=True, read_only=True)
    interviewer_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="interviewers",
    )
    candidate = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    interview_type_display = serializers.CharField(
        source="get_interview_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Interview
        fields = (
            "id",
            "application",
            "candidate",
            "job",
            "title",
            "interview_type",
            "interview_type_display",
            "scheduled_at",
            "duration_minutes",
            "location",
            "interviewers",
            "interviewer_ids",
            "status",
            "status_display",
            "score",
            "recommendation",
            "feedback",
            "scorecard",
            "criteria_scores",
            "created_at",
        )

    def get_candidate(self, obj):
        return CandidateMiniSerializer(obj.application.candidate).data

    def get_job(self, obj):
        return JobMiniSerializer(obj.application.job).data


class ApplicationSerializer(serializers.ModelSerializer):
    candidate = CandidateMiniSerializer(read_only=True)
    candidate_id = serializers.PrimaryKeyRelatedField(
        queryset=Candidate.objects.all(), write_only=True, source="candidate"
    )
    job = JobMiniSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), write_only=True, source="job"
    )
    stage = PipelineStageSerializer(read_only=True)
    stage_id = serializers.PrimaryKeyRelatedField(
        queryset=PipelineStage.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source="stage",
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    interviews = InterviewSerializer(many=True, read_only=True)
    stage_history = ApplicationStageHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = (
            "id",
            "candidate",
            "candidate_id",
            "job",
            "job_id",
            "stage",
            "stage_id",
            "status",
            "status_display",
            "applied_at",
            "source",
            "cover_letter",
            "rejection_reason",
            "interviews",
            "stage_history",
            "created_at",
        )

    def validate(self, attrs):
        candidate = attrs.get("candidate")
        job = attrs.get("job")
        if candidate and job and not self.instance:
            if Application.objects.filter(candidate=candidate, job=job).exists():
                raise serializers.ValidationError(
                    "این کاندیدا قبلاً برای این آگهی ثبت شده است."
                )
        return attrs

    def create(self, validated_data):
        if not validated_data.get("stage"):
            validated_data["stage"] = PipelineStage.objects.order_by("order").first()
        return super().create(validated_data)


class ApplicationBoardSerializer(serializers.ModelSerializer):
    """Compact payload for the kanban board."""

    candidate = CandidateMiniSerializer(read_only=True)
    next_interview = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "candidate",
            "stage",
            "status",
            "applied_at",
            "next_interview",
        )

    def get_next_interview(self, obj):
        nxt = (
            obj.interviews.filter(status=Interview.STATUS_SCHEDULED)
            .order_by("scheduled_at")
            .first()
        )
        return nxt.scheduled_at if nxt else None


# --------------------------------------------------------------------------- #
#  Public application form
# --------------------------------------------------------------------------- #
class PublicApplySerializer(serializers.Serializer):
    job = serializers.SlugRelatedField(
        slug_field="slug",
        queryset=Job.objects.filter(status=Job.STATUS_OPEN),
    )
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    headline = serializers.CharField(max_length=200, required=False, allow_blank=True)
    location = serializers.CharField(max_length=150, required=False, allow_blank=True)
    linkedin_url = serializers.URLField(required=False, allow_blank=True)
    summary = serializers.CharField(required=False, allow_blank=True)
    cover_letter = serializers.CharField(required=False, allow_blank=True)
    resume = serializers.FileField(required=False)

    @transaction.atomic
    def create(self, validated_data):
        job = validated_data["job"]
        candidate, _ = Candidate.objects.get_or_create(
            email=validated_data["email"],
            defaults={
                "first_name": validated_data["first_name"],
                "last_name": validated_data["last_name"],
                "phone": validated_data.get("phone", ""),
                "headline": validated_data.get("headline", ""),
                "location": validated_data.get("location", ""),
                "linkedin_url": validated_data.get("linkedin_url", ""),
                "summary": validated_data.get("summary", ""),
                "source": "website",
            },
        )
        if validated_data.get("resume"):
            candidate.resume = validated_data["resume"]
            candidate.save(update_fields=["resume"])

        if Application.objects.filter(candidate=candidate, job=job).exists():
            raise serializers.ValidationError(
                {"detail": "شما قبلاً برای این آگهی درخواست داده‌اید."}
            )

        application = Application.objects.create(
            candidate=candidate,
            job=job,
            stage=PipelineStage.objects.order_by("order").first(),
            source="website",
            cover_letter=validated_data.get("cover_letter", ""),
        )
        Activity.objects.create(
            verb=f"درخواست جدید برای «{job.title}»",
            candidate=candidate,
            job=job,
            application=application,
        )
        return application


# --------------------------------------------------------------------------- #
#  Dashboard
# --------------------------------------------------------------------------- #
class DashboardStatsSerializer(serializers.Serializer):
    total_candidates = serializers.IntegerField()
    open_jobs = serializers.IntegerField()
    active_applications = serializers.IntegerField()
    interviews_this_week = serializers.IntegerField()
    hires_this_month = serializers.IntegerField()
    new_candidates_this_week = serializers.IntegerField()
    pipeline = serializers.ListField()
    sources = serializers.ListField()
    applications_trend = serializers.ListField()
    upcoming_interviews = InterviewSerializer(many=True)
    recent_activity = ActivitySerializer(many=True)


# --------------------------------------------------------------------------- #
#  Scorecards / offers / talent pools / job templates
# --------------------------------------------------------------------------- #
class ScorecardTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScorecardTemplate
        fields = ("id", "name", "criteria", "is_default", "created_at")


class OfferSerializer(serializers.ModelSerializer):
    candidate = serializers.SerializerMethodField()
    job = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Offer
        fields = (
            "id",
            "application",
            "candidate",
            "job",
            "title",
            "salary",
            "start_date",
            "expires_on",
            "status",
            "status_display",
            "body",
            "created_by",
            "sent_at",
            "responded_at",
            "created_at",
        )
        read_only_fields = ("status", "sent_at", "responded_at")

    def get_candidate(self, obj):
        return CandidateMiniSerializer(obj.application.candidate).data

    def get_job(self, obj):
        return JobMiniSerializer(obj.application.job).data


class TalentPoolSerializer(serializers.ModelSerializer):
    candidate_count = serializers.IntegerField(
        source="candidates.count", read_only=True
    )
    owner = UserSerializer(read_only=True)

    class Meta:
        model = TalentPool
        fields = (
            "id",
            "name",
            "description",
            "owner",
            "candidate_count",
            "created_at",
        )


class TalentPoolDetailSerializer(TalentPoolSerializer):
    candidates = CandidateListSerializer(many=True, read_only=True)

    class Meta(TalentPoolSerializer.Meta):
        fields = TalentPoolSerializer.Meta.fields + ("candidates",)


class JobTemplateSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
        source="department",
    )

    class Meta:
        model = JobTemplate
        fields = (
            "id",
            "name",
            "title",
            "department",
            "department_id",
            "employment_type",
            "is_remote",
            "description",
            "requirements",
            "created_at",
        )
