"""DRF serializers, ViewSets, and URLs for Organizations, Schools, Campuses & Academic Years."""
from django.urls import include, path
from rest_framework import serializers
from rest_framework.routers import DefaultRouter

from apps.core.viewsets import TenantScopedModelViewSet
from apps.tenants.models import AcademicYear, Campus, Organization, School


class OrganizationSerializer(serializers.ModelSerializer):
    school_count = serializers.IntegerField(source="schools.count", read_only=True)
    campus_count = serializers.IntegerField(source="campuses.count", read_only=True)

    class Meta:
        model = Organization
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by")


class SchoolSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source="organization.name", read_only=True)
    campus_count = serializers.IntegerField(source="campuses.count", read_only=True)

    class Meta:
        model = School
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by")


class CampusSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.short_name", read_only=True)
    organization_name = serializers.CharField(source="organization.short_name", read_only=True)

    class Meta:
        model = Campus
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by")


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by", "deleted_at", "deleted_by")


class OrganizationViewSet(TenantScopedModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    erp_module_key = "ORGANIZATION"
    search_fields = ["name", "short_name", "code", "city"]
    filterset_fields = ["is_active", "city"]


class SchoolViewSet(TenantScopedModelViewSet):
    queryset = School.objects.select_related("organization").all()
    serializer_class = SchoolSerializer
    erp_module_key = "ORGANIZATION"
    search_fields = ["name", "short_name", "code", "affiliation_no"]
    filterset_fields = ["organization", "board", "is_active"]


class CampusViewSet(TenantScopedModelViewSet):
    queryset = Campus.objects.select_related("organization", "school").all()
    serializer_class = CampusSerializer
    erp_module_key = "ORGANIZATION"
    search_fields = ["name", "code", "city", "principal_name"]
    filterset_fields = ["organization", "school", "city", "is_active"]


class AcademicYearViewSet(TenantScopedModelViewSet):
    queryset = AcademicYear.objects.select_related("organization", "school").all()
    serializer_class = AcademicYearSerializer
    erp_module_key = "ORGANIZATION"
    search_fields = ["label"]
    filterset_fields = ["organization", "school", "status", "is_current", "is_active"]


router = DefaultRouter()
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("schools", SchoolViewSet, basename="school")
router.register("campuses", CampusViewSet, basename="campus")
router.register("academic-years", AcademicYearViewSet, basename="academic-year")

urlpatterns = [path("", include(router.urls))]
