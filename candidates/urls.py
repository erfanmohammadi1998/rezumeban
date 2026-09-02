"""
API routes.

The candidate / CV-management endpoints (``core``) are always registered.
The recruitment / ATS endpoints (jobs, applications, interviews, pipeline,
public portal, dashboards) are only mounted when the ``recruitment`` module
is enabled — see ``settings.RECRUITMENT_MODULE_ENABLED``.
"""
from django.conf import settings
from django.urls import path
from rest_framework.routers import DefaultRouter

from .sourcing_api import (
    SavedSearchViewSet,
    SourcingProvidersView,
    SourcingResultViewSet,
    SourcingSearchView,
)
from .views import (
    ActivityView,
    ApplicationViewSet,
    CandidateStatsView,
    CandidateViewSet,
    DashboardView,
    DepartmentViewSet,
    InterviewViewSet,
    JobTemplateViewSet,
    JobViewSet,
    NoteViewSet,
    OfferViewSet,
    PipelineStageViewSet,
    PublicApplyView,
    PublicJobDetailView,
    PublicJobListView,
    ReportsView,
    ScorecardTemplateViewSet,
    TagViewSet,
    TalentPoolViewSet,
    TeamView,
)

# --- core: CV / candidate management ---------------------------------------- #
core_router = DefaultRouter()
core_router.register("candidates", CandidateViewSet, basename="candidate")
core_router.register("notes", NoteViewSet, basename="note")
core_router.register("tags", TagViewSet, basename="tag")

core_urls = [
    path("activity/", ActivityView.as_view(), name="activity"),
    path("team/", TeamView.as_view(), name="team"),
    path("stats/candidates/", CandidateStatsView.as_view(), name="candidate-stats"),
    *core_router.urls,
]

# --- recruitment: ATS + public portal ------------------------------------- #
recruitment_router = DefaultRouter()
recruitment_router.register("jobs", JobViewSet, basename="job")
recruitment_router.register("applications", ApplicationViewSet, basename="application")
recruitment_router.register("interviews", InterviewViewSet, basename="interview")
recruitment_router.register("departments", DepartmentViewSet, basename="department")
recruitment_router.register(
    "pipeline-stages", PipelineStageViewSet, basename="pipelinestage"
)
recruitment_router.register("offers", OfferViewSet, basename="offer")
recruitment_router.register("talent-pools", TalentPoolViewSet, basename="talentpool")
recruitment_router.register(
    "scorecards", ScorecardTemplateViewSet, basename="scorecard"
)
recruitment_router.register(
    "job-templates", JobTemplateViewSet, basename="jobtemplate"
)

recruitment_urls = [
    path("stats/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("stats/reports/", ReportsView.as_view(), name="reports"),
    path("public/jobs/", PublicJobListView.as_view(), name="public-jobs"),
    path("public/jobs/<str:slug>/", PublicJobDetailView.as_view(), name="public-job"),
    path("public/apply/", PublicApplyView.as_view(), name="public-apply"),
    *recruitment_router.urls,
]

# --- sourcing: candidate & job aggregation from external sources ---------- #
sourcing_router = DefaultRouter()
sourcing_router.register(
    "sourcing/saved-searches", SavedSearchViewSet, basename="savedsearch"
)
sourcing_router.register(
    "sourcing/results", SourcingResultViewSet, basename="sourcingresult"
)

sourcing_urls = [
    path(
        "sourcing/providers/",
        SourcingProvidersView.as_view(),
        name="sourcing-providers",
    ),
    path("sourcing/search/", SourcingSearchView.as_view(), name="sourcing-search"),
    *sourcing_router.urls,
]

urlpatterns = list(core_urls)
if settings.RECRUITMENT_MODULE_ENABLED:
    urlpatterns += recruitment_urls
if settings.SOURCING_MODULE_ENABLED:
    urlpatterns += sourcing_urls
