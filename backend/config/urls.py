"""Root URL routing for LEADERS Multi-School ERP REST API."""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(_request):
    return Response(
        {
            "status": "ok",
            "service": "leaders-multischool-erp-api",
            "database": "leaders_multischool_erp",
        }
    )


urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/v1/health/", health_check, name="erp-health"),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("api/v1/docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-docs"),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/tenants/", include("apps.tenants.urls")),
    path("api/v1/academics/", include("apps.academics.urls")),
    path("api/v1/students/", include("apps.students.urls")),
    path("api/v1/staff-hr/", include("apps.staff_hr.urls")),
    path("api/v1/operations/", include("apps.operations.urls")),
    path("api/v1/analytics/", include("apps.analytics.urls")),
]
