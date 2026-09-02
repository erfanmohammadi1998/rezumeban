from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Department(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    COLORS = (
        ("slate", "Slate"),
        ("blue", "Blue"),
        ("green", "Green"),
        ("amber", "Amber"),
        ("red", "Red"),
        ("purple", "Purple"),
        ("pink", "Pink"),
    )

    name = models.CharField(max_length=60, unique=True)
    color = models.CharField(max_length=20, choices=COLORS, default="slate")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class PipelineStage(models.Model):
    KIND_ACTIVE = "active"
    KIND_WON = "won"
    KIND_LOST = "lost"
    KINDS = (
        (KIND_ACTIVE, "Active"),
        (KIND_WON, "Won"),
        (KIND_LOST, "Lost"),
    )

    name = models.CharField(max_length=80)
    order = models.PositiveIntegerField(default=0)
    kind = models.CharField(max_length=20, choices=KINDS, default=KIND_ACTIVE)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name


class Job(TimeStampedModel):
    EMPLOYMENT_TYPES = (
        ("full_time", "Full-time"),
        ("part_time", "Part-time"),
        ("contract", "Contract"),
        ("internship", "Internship"),
        ("temporary", "Temporary"),
    )
    STATUS_DRAFT = "draft"
    STATUS_OPEN = "open"
    STATUS_ON_HOLD = "on_hold"
    STATUS_CLOSED = "closed"
    STATUSES = (
        (STATUS_DRAFT, "Draft"),
        (STATUS_OPEN, "Open"),
        (STATUS_ON_HOLD, "On hold"),
        (STATUS_CLOSED, "Closed"),
    )

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=230, unique=True, blank=True)
    department = models.ForeignKey(
        Department,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="jobs",
    )
    location = models.CharField(max_length=150, blank=True, default="")
    employment_type = models.CharField(
        max_length=20, choices=EMPLOYMENT_TYPES, default="full_time"
    )
    is_remote = models.BooleanField(default=False)

    description = models.TextField(blank=True, default="")
    requirements = models.TextField(blank=True, default="")

    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    openings = models.PositiveIntegerField(default=1)

    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_OPEN)
    hiring_manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="managed_jobs",
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title, allow_unicode=True) or "job"
            slug = base
            counter = 2
            while Job.objects.exclude(pk=self.pk).filter(slug=slug).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug

        if self.status == self.STATUS_OPEN and self.published_at is None:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def is_public(self):
        return self.status == self.STATUS_OPEN


class Candidate(TimeStampedModel):
    SOURCES = (
        ("website", "Website"),
        ("linkedin", "LinkedIn"),
        ("referral", "Referral"),
        ("job_board", "Job board"),
        ("agency", "Agency"),
        ("event", "Event"),
        ("other", "Other"),
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default="")

    headline = models.CharField(max_length=200, blank=True, default="")
    location = models.CharField(max_length=150, blank=True, default="")
    address = models.CharField(max_length=255, blank=True, default="")
    summary = models.TextField(blank=True, default="")

    photo = models.ImageField(
        upload_to="candidates/photos/", null=True, blank=True
    )
    resume = models.FileField(
        upload_to="candidates/resumes/", null=True, blank=True
    )

    linkedin_url = models.URLField(blank=True, default="")
    github_url = models.URLField(blank=True, default="")
    portfolio_url = models.URLField(blank=True, default="")

    source = models.CharField(max_length=20, choices=SOURCES, default="website")
    expected_salary = models.PositiveIntegerField(null=True, blank=True)
    current_salary = models.PositiveIntegerField(null=True, blank=True)

    rating = models.PositiveSmallIntegerField(default=0)  # 0..5
    is_favorite = models.BooleanField(default=False)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_candidates",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="candidates")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class WorkExperience(models.Model):
    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="work_experiences"
    )
    company_name = models.CharField(max_length=150)
    position = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.position} at {self.company_name}"


class Education(models.Model):
    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="educations"
    )
    degree = models.CharField(max_length=100)
    field_of_study = models.CharField(max_length=150)
    university = models.CharField(max_length=150)
    start_year = models.IntegerField(null=True, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-graduation_year"]

    def __str__(self):
        return f"{self.degree} - {self.university}"


class Skill(models.Model):
    LEVELS = (
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
        ("Expert", "Expert"),
    )

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="skills"
    )
    name = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=LEVELS, default="Intermediate")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Application(TimeStampedModel):
    STATUS_ACTIVE = "active"
    STATUS_HIRED = "hired"
    STATUS_REJECTED = "rejected"
    STATUS_WITHDRAWN = "withdrawn"
    STATUSES = (
        (STATUS_ACTIVE, "Active"),
        (STATUS_HIRED, "Hired"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_WITHDRAWN, "Withdrawn"),
    )

    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="applications"
    )
    job = models.ForeignKey(
        Job, on_delete=models.CASCADE, related_name="applications"
    )
    stage = models.ForeignKey(
        PipelineStage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="applications",
    )
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_ACTIVE)
    applied_at = models.DateTimeField(default=timezone.now)
    source = models.CharField(max_length=20, blank=True, default="")
    cover_letter = models.TextField(blank=True, default="")
    rejection_reason = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-applied_at"]
        unique_together = ("candidate", "job")

    def __str__(self):
        return f"{self.candidate} → {self.job}"


class ApplicationStageHistory(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="stage_history"
    )
    from_stage = models.ForeignKey(
        PipelineStage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    to_stage = models.ForeignKey(
        PipelineStage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class Interview(TimeStampedModel):
    TYPES = (
        ("phone", "Phone screen"),
        ("video", "Video call"),
        ("onsite", "On-site"),
        ("technical", "Technical"),
        ("hr", "HR"),
        ("final", "Final"),
    )
    STATUS_SCHEDULED = "scheduled"
    STATUS_COMPLETED = "completed"
    STATUS_CANCELLED = "cancelled"
    STATUS_NO_SHOW = "no_show"
    STATUSES = (
        (STATUS_SCHEDULED, "Scheduled"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_NO_SHOW, "No-show"),
    )
    RECOMMENDATIONS = (
        ("strong_yes", "Strong yes"),
        ("yes", "Yes"),
        ("no", "No"),
        ("strong_no", "Strong no"),
    )

    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="interviews"
    )
    title = models.CharField(max_length=150, default="Interview")
    interview_type = models.CharField(max_length=20, choices=TYPES, default="video")
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    location = models.CharField(max_length=300, blank=True, default="")
    interviewers = models.ManyToManyField(
        settings.AUTH_USER_MODEL, blank=True, related_name="interviews"
    )
    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_SCHEDULED)

    score = models.PositiveSmallIntegerField(null=True, blank=True)  # 1..5
    recommendation = models.CharField(
        max_length=20, choices=RECOMMENDATIONS, blank=True, default=""
    )
    feedback = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"{self.title} — {self.application.candidate}"


class Note(TimeStampedModel):
    candidate = models.ForeignKey(
        Candidate, on_delete=models.CASCADE, related_name="notes"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notes",
    )
    body = models.TextField()

    class Meta:
        ordering = ["-created_at"]


class SavedSearch(TimeStampedModel):
    KIND_CANDIDATES = "candidates"
    KIND_JOBS = "jobs"
    KINDS = ((KIND_CANDIDATES, "Candidates"), (KIND_JOBS, "Jobs"))

    name = models.CharField(max_length=150)
    kind = models.CharField(max_length=20, choices=KINDS)
    provider = models.CharField(max_length=50)
    query = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    auto_import = models.BooleanField(default=False)
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_result_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="saved_searches",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "saved searches"

    def __str__(self):
        return self.name


class SourcingResult(models.Model):
    STATUS_NEW = "new"
    STATUS_IMPORTED = "imported"
    STATUS_DISMISSED = "dismissed"
    STATUSES = (
        (STATUS_NEW, "New"),
        (STATUS_IMPORTED, "Imported"),
        (STATUS_DISMISSED, "Dismissed"),
    )

    saved_search = models.ForeignKey(
        SavedSearch,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="results",
    )
    kind = models.CharField(max_length=20, choices=SavedSearch.KINDS)
    provider = models.CharField(max_length=50)
    external_id = models.CharField(max_length=200)

    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=400, blank=True, default="")
    location = models.CharField(max_length=150, blank=True, default="")
    url = models.URLField(blank=True, default="")
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    raw = models.JSONField(default=dict, blank=True)

    status = models.CharField(max_length=20, choices=STATUSES, default=STATUS_NEW)
    imported_candidate = models.ForeignKey(
        Candidate,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sourcing_results",
    )
    imported_job = models.ForeignKey(
        Job,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="sourcing_results",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "-created_at"]
        unique_together = ("kind", "provider", "external_id")

    def __str__(self):
        return self.title


class Activity(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="activities",
    )
    verb = models.CharField(max_length=255)
    candidate = models.ForeignKey(
        Candidate,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    job = models.ForeignKey(
        Job,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    application = models.ForeignKey(
        Application,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "activities"

    def __str__(self):
        return self.verb
