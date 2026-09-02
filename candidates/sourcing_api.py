"""API layer for the sourcing module (candidate & job aggregation)."""
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Candidate, Job, SavedSearch, SourcingResult
from .serializers import CandidateSerializer, JobSerializer
from .sourcing import get_provider, list_providers
from .sourcing.base import SourcingError
from .sourcing.providers import normalise_candidate_import, normalise_job_import


# --------------------------------------------------------------------------- #
class SourcingResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourcingResult
        fields = (
            "id",
            "saved_search",
            "kind",
            "provider",
            "external_id",
            "title",
            "subtitle",
            "location",
            "url",
            "score",
            "raw",
            "status",
            "imported_candidate",
            "imported_job",
            "created_at",
        )
        read_only_fields = fields


class SavedSearchSerializer(serializers.ModelSerializer):
    result_count = serializers.IntegerField(source="results.count", read_only=True)

    class Meta:
        model = SavedSearch
        fields = (
            "id",
            "name",
            "kind",
            "provider",
            "query",
            "is_active",
            "auto_import",
            "last_run_at",
            "last_result_count",
            "result_count",
            "created_at",
        )
        read_only_fields = ("last_run_at", "last_result_count")


# --------------------------------------------------------------------------- #
def _store_results(rows, *, kind, provider_slug, saved_search=None):
    """Upsert provider rows into SourcingResult, return the stored objects."""
    stored = []
    for row in rows:
        obj, created = SourcingResult.objects.get_or_create(
            kind=kind,
            provider=provider_slug,
            external_id=row["external_id"],
            defaults={
                "saved_search": saved_search,
                "title": row.get("title", "")[:255],
                "subtitle": (row.get("subtitle") or "")[:400],
                "location": (row.get("location") or "")[:150],
                "url": row.get("url") or "",
                "score": row.get("score"),
                "raw": row.get("raw", {}),
            },
        )
        if not created and obj.status == SourcingResult.STATUS_NEW:
            obj.title = row.get("title", obj.title)[:255]
            obj.subtitle = (row.get("subtitle") or obj.subtitle)[:400]
            obj.score = row.get("score", obj.score)
            obj.raw = row.get("raw", obj.raw)
            if saved_search and not obj.saved_search_id:
                obj.saved_search = saved_search
            obj.save()
        stored.append(obj)
    return stored


def _import_candidate(result, owner):
    payload = normalise_candidate_import(result.raw, result)
    cdata = payload["candidate"]
    existing = Candidate.objects.filter(email=cdata["email"]).first()
    if existing:
        candidate = existing
    else:
        serializer = CandidateSerializer(data={**cdata, "skills": payload["skills"]})
        serializer.is_valid(raise_exception=True)
        candidate = serializer.save(owner=owner)
    result.status = SourcingResult.STATUS_IMPORTED
    result.imported_candidate = candidate
    result.save(update_fields=["status", "imported_candidate"])
    return candidate


def _import_job(result, user):
    kwargs = normalise_job_import(result.raw, result)
    job = Job.objects.create(hiring_manager=user, **kwargs)
    result.status = SourcingResult.STATUS_IMPORTED
    result.imported_job = job
    result.save(update_fields=["status", "imported_job"])
    return job


# --------------------------------------------------------------------------- #
class SourcingProvidersView(APIView):
    def get(self, request):
        kind = request.query_params.get("kind")
        return Response(list_providers(kind))


class SourcingSearchView(APIView):
    def post(self, request):
        kind = request.data.get("kind")
        provider_slug = request.data.get("provider")
        query = request.data.get("query") or {}
        save_as = request.data.get("save_as")

        if kind not in ("candidates", "jobs"):
            return Response({"detail": "نوع نامعتبر است."}, status=400)

        try:
            provider = get_provider(provider_slug)
            if provider.kind != kind:
                return Response({"detail": "ارائه‌دهنده با نوع جست‌وجو همخوانی ندارد."}, status=400)
            rows = provider.search(query)
        except SourcingError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except (ValueError, TypeError):
            return Response({"detail": "پارامترهای جست‌وجو نامعتبر است."}, status=400)

        saved_search = None
        if save_as:
            saved_search = SavedSearch.objects.create(
                name=save_as,
                kind=kind,
                provider=provider_slug,
                query=query,
                created_by=request.user,
                last_run_at=timezone.now(),
                last_result_count=len(rows),
            )

        stored = _store_results(
            rows, kind=kind, provider_slug=provider_slug, saved_search=saved_search
        )
        return Response(
            {
                "count": len(stored),
                "saved_search": SavedSearchSerializer(saved_search).data
                if saved_search
                else None,
                "results": SourcingResultSerializer(stored, many=True).data,
            }
        )


class SavedSearchViewSet(viewsets.ModelViewSet):
    serializer_class = SavedSearchSerializer
    queryset = SavedSearch.objects.all()
    pagination_class = None
    filterset_fields = ["kind", "is_active"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def run(self, request, pk=None):
        search = self.get_object()
        try:
            provider = get_provider(search.provider)
            rows = provider.search(search.query)
        except SourcingError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        stored = _store_results(
            rows, kind=search.kind, provider_slug=search.provider, saved_search=search
        )
        search.last_run_at = timezone.now()
        search.last_result_count = len(stored)
        search.save(update_fields=["last_run_at", "last_result_count"])

        imported = []
        if search.auto_import:
            for result in stored:
                if result.status != SourcingResult.STATUS_NEW:
                    continue
                try:
                    if search.kind == "candidates":
                        imported.append(_import_candidate(result, request.user).id)
                    else:
                        imported.append(_import_job(result, request.user).id)
                except Exception:  # noqa: BLE001 - keep the batch going
                    continue

        return Response(
            {
                "count": len(stored),
                "auto_imported": len(imported),
                "results": SourcingResultSerializer(stored, many=True).data,
            }
        )


class SourcingResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SourcingResultSerializer
    queryset = SourcingResult.objects.select_related(
        "imported_candidate", "imported_job"
    )
    filterset_fields = ["kind", "status", "provider", "saved_search"]
    search_fields = ["title", "subtitle", "location"]

    def get_queryset(self):
        return super().get_queryset()

    @action(detail=True, methods=["post"], url_path="import")
    def import_result(self, request, pk=None):
        result = self.get_object()
        if result.status == SourcingResult.STATUS_IMPORTED:
            return Response({"detail": "این مورد قبلاً وارد شده است."}, status=400)
        try:
            with transaction.atomic():
                if result.kind == "candidates":
                    obj = _import_candidate(result, request.user)
                    return Response(
                        {"kind": "candidate", "object": CandidateSerializer(obj).data},
                        status=status.HTTP_201_CREATED,
                    )
                obj = _import_job(result, request.user)
                return Response(
                    {"kind": "job", "object": JobSerializer(obj).data},
                    status=status.HTTP_201_CREATED,
                )
        except serializers.ValidationError as exc:
            return Response(exc.detail, status=400)

    @action(detail=False, methods=["post"], url_path="bulk-import")
    def bulk_import(self, request):
        ids = request.data.get("ids", [])
        results = self.get_queryset().filter(
            id__in=ids, status=SourcingResult.STATUS_NEW
        )
        imported, failed = [], []
        for result in results:
            try:
                with transaction.atomic():
                    if result.kind == "candidates":
                        obj = _import_candidate(result, request.user)
                    else:
                        obj = _import_job(result, request.user)
                imported.append({"result": result.id, "object": obj.id})
            except Exception:  # noqa: BLE001
                failed.append(result.id)
        return Response({"imported": len(imported), "failed": failed})

    @action(detail=True, methods=["post"])
    def dismiss(self, request, pk=None):
        result = self.get_object()
        result.status = SourcingResult.STATUS_DISMISSED
        result.save(update_fields=["status"])
        return Response({"status": result.status})
