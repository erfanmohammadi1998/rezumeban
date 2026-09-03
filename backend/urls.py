from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.http import FileResponse, Http404, JsonResponse
from django.urls import include, path, re_path
from django.views.generic import View
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from candidates.views import ChangePasswordView, MeView, ProfileView, RegisterView

_SPA_INDEX = settings.BASE_DIR / "frontend" / "dist" / "index.html"


class SpaView(View):
    """Serve the built React app for any non-API path (client-side routing)."""

    def get(self, _request, *_args, **_kwargs):
        if not _SPA_INDEX.exists():
            raise Http404("frontend not built — run `npm run build`")
        return FileResponse(open(_SPA_INDEX, "rb"), content_type="text/html")


class ThrottledTokenView(TokenObtainPairView):
    throttle_scope = "auth"


class ThrottledRegisterView(RegisterView):
    throttle_scope = "auth"


def health(_request):
    db_ok = True
    try:
        connection.ensure_connection()
    except Exception:  # noqa: BLE001
        db_ok = False
    status = 200 if db_ok else 503
    return JsonResponse(
        {"status": "ok" if db_ok else "degraded", "database": db_ok}, status=status
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz/", health, name="health"),
    path("api/health/", health),
    path("api/", include("candidates.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/auth/register/", ThrottledRegisterView.as_view(), name="register"),
    path(
        "api/auth/token/", ThrottledTokenView.as_view(), name="token_obtain_pair"
    ),
    path(
        "api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"
    ),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/auth/profile/", ProfileView.as_view(), name="profile"),
    path(
        "api/auth/change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA fallback — must be last. Any path that isn't the API / admin / media
# returns index.html so the React router can handle it. WhiteNoise still
# serves real static files (assets, favicon, manifest) before this runs.
if _SPA_INDEX.exists():
    urlpatterns += [
        re_path(r"^(?!api/|admin/|media/|static/|healthz/).*$", SpaView.as_view()),
    ]
