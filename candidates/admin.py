from django.contrib import admin

from .models import (
    Activity,
    Application,
    ApplicationStageHistory,
    Candidate,
    Department,
    Education,
    Interview,
    Job,
    Note,
    PipelineStage,
    Skill,
    Tag,
    WorkExperience,
)


class WorkExperienceInline(admin.TabularInline):
    model = WorkExperience
    extra = 0


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0


class NoteInline(admin.TabularInline):
    model = Note
    extra = 0


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "headline", "source", "rating", "created_at")
    list_filter = ("source", "rating", "is_favorite", "tags")
    search_fields = ("first_name", "last_name", "email", "headline")
    inlines = [WorkExperienceInline, EducationInline, SkillInline, NoteInline]
    filter_horizontal = ("tags",)


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "department", "status", "employment_type", "openings", "created_at")
    list_filter = ("status", "employment_type", "is_remote", "department")
    search_fields = ("title", "description")
    prepopulated_fields = {"slug": ("title",)}


class StageHistoryInline(admin.TabularInline):
    model = ApplicationStageHistory
    extra = 0


class InterviewInline(admin.TabularInline):
    model = Interview
    extra = 0


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("candidate", "job", "stage", "status", "applied_at")
    list_filter = ("status", "stage", "job")
    search_fields = ("candidate__first_name", "candidate__last_name", "job__title")
    inlines = [StageHistoryInline, InterviewInline]


@admin.register(Interview)
class InterviewAdmin(admin.ModelAdmin):
    list_display = ("title", "application", "interview_type", "scheduled_at", "status")
    list_filter = ("status", "interview_type")


@admin.register(PipelineStage)
class PipelineStageAdmin(admin.ModelAdmin):
    list_display = ("name", "order", "kind")
    list_editable = ("order",)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("verb", "actor", "candidate", "job", "created_at")
    list_filter = ("created_at",)


admin.site.register(Department)
admin.site.register(Tag)
admin.site.register(Note)
admin.site.site_header = "TalentBase Admin"
admin.site.site_title = "TalentBase"
admin.site.index_title = "مدیریت سیستم"
