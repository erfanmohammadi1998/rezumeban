from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from candidates.views import (
    ChangePasswordView,
    MeView,
    ProfileView,
    RegisterView,
)


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("candidates.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),

    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
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
