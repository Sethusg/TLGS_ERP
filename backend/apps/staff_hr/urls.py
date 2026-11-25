"""DRF endpoints for Staff, Departments, and HR Leave Management."""
from django.urls import include, path
from rest_framework import serializers
from rest_framework.routers import DefaultRouter

from apps.core.viewsets import TenantScopedModelViewSet
from apps.staff_hr.models import Department, LeaveRequest, Staff


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class StaffSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.short_name", read_only=True)
    campus_name = serializers.CharField(source="campus.name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Staff
        fields = "__all__"


class LeaveRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source="staff.full_name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = "__all__"


class DepartmentViewSet(TenantScopedModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    erp_module_key = "STAFFS"
    search_fields = ["name", "code"]


class StaffViewSet(TenantScopedModelViewSet):
    queryset = Staff.objects.select_related("school", "campus", "department").all()
    serializer_class = StaffSerializer
    erp_module_key = "STAFFS"
    search_fields = ["full_name", "employee_code", "designation", "email"]
    filterset_fields = ["organization", "school", "campus", "staff_category", "department", "is_active"]


class LeaveRequestViewSet(TenantScopedModelViewSet):
    queryset = LeaveRequest.objects.select_related("staff", "school", "campus").all()
    serializer_class = LeaveRequestSerializer
    erp_module_key = "HR"
    search_fields = ["staff__full_name", "reason"]
    filterset_fields = ["school", "campus", "status", "leave_type"]


router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="department")
router.register("staff", StaffViewSet, basename="staff")
router.register("leaves", LeaveRequestViewSet, basename="leave")

urlpatterns = [path("", include(router.urls))]
