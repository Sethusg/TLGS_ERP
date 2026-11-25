"""DRF ViewSets and URL routing for Academics including bulk subject allocation & dependency checks."""
from django.db import transaction
from django.urls import include, path
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter

from apps.academics.models import (
    ClassSection,
    ClassSubjectAllocation,
    SchoolClass,
    Subject,
    TimetableEntry,
)
from apps.core.viewsets import TenantScopedModelViewSet, record_audit_event


class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = "__all__"


class ClassSectionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    class_teacher_name = serializers.CharField(source="class_teacher.full_name", read_only=True)

    class Meta:
        model = ClassSection
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class ClassSubjectAllocationSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="school_class.name", read_only=True)
    section_name = serializers.CharField(source="section.name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    subject_code = serializers.CharField(source="subject.code", read_only=True)
    teacher_name = serializers.CharField(source="assigned_teacher.full_name", read_only=True)

    class Meta:
        model = ClassSubjectAllocation
        fields = "__all__"

    def validate(self, attrs):
        teacher = attrs.get("assigned_teacher") or getattr(self.instance, "assigned_teacher", None)
        school = attrs.get("school") or getattr(self.instance, "school", None)
        if teacher and school and teacher.school_id != school.id:
            raise serializers.ValidationError(
                {"assigned_teacher": "Assigned teacher must belong to the selected school."}
            )
        return attrs


class TimetableEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = TimetableEntry
        fields = "__all__"


class SchoolClassViewSet(TenantScopedModelViewSet):
    queryset = SchoolClass.objects.select_related("school", "campus", "academic_year").all()
    serializer_class = SchoolClassSerializer
    erp_module_key = "ACADEMICS"
    search_fields = ["name", "code"]
    filterset_fields = ["school", "campus", "academic_year", "is_active"]


class ClassSectionViewSet(TenantScopedModelViewSet):
    queryset = ClassSection.objects.select_related("school_class", "class_teacher").all()
    serializer_class = ClassSectionSerializer
    erp_module_key = "ACADEMICS"
    search_fields = ["name", "room_number"]
    filterset_fields = ["school", "campus", "school_class", "is_active"]


class SubjectViewSet(TenantScopedModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    erp_module_key = "ACADEMICS"
    search_fields = ["name", "code"]
    filterset_fields = ["school", "subject_type", "classification", "is_active"]


class ClassSubjectAllocationViewSet(TenantScopedModelViewSet):
    queryset = ClassSubjectAllocation.objects.select_related(
        "school", "campus", "academic_year", "school_class", "section", "subject", "assigned_teacher"
    ).all()
    serializer_class = ClassSubjectAllocationSerializer
    erp_module_key = "ACADEMICS"
    search_fields = ["subject__name", "subject__code", "assigned_teacher__full_name", "school_class__name"]
    filterset_fields = [
        "organization",
        "school",
        "campus",
        "academic_year",
        "school_class",
        "section",
        "subject_type",
        "is_active",
    ]

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        tt_count = instance.timetable_entries.filter(is_deleted=False).count()
        if tt_count > 0:
            return Response(
                {
                    "success": False,
                    "detail": (
                        f"Cannot delete allocation because it is referenced by {tt_count} active "
                        "timetable entries. Deactivate the allocation instead."
                    ),
                    "dependencies": {"timetables": tt_count},
                },
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="bulk-allocate")
    @transaction.atomic
    def bulk_allocate(self, request):
        items = request.data.get("allocations", [])
        overwrite_duplicates = bool(request.data.get("overwrite_duplicates", False))
        if not isinstance(items, list) or not items:
            return Response(
                {"success": False, "detail": "Provide a non-empty `allocations` list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_count = 0
        updated_count = 0
        duplicates = []

        for row in items:
            existing = ClassSubjectAllocation.objects.filter(
                academic_year_id=row.get("academic_year"),
                campus_id=row.get("campus"),
                school_class_id=row.get("school_class"),
                section_id=row.get("section"),
                subject_id=row.get("subject"),
                is_deleted=False,
            ).first()

            if existing and not overwrite_duplicates:
                duplicates.append(
                    {
                        "existing_id": existing.id,
                        "section": existing.section_id,
                        "subject": existing.subject_id,
                    }
                )
                continue

            serializer = self.get_serializer(instance=existing, data=row)
            serializer.is_valid(raise_exception=True)
            if existing:
                serializer.save(updated_by=request.user)
                updated_count += 1
            else:
                serializer.save(created_by=request.user, updated_by=request.user)
                created_count += 1

        if duplicates and not overwrite_duplicates:
            transaction.set_rollback(True)
            return Response(
                {
                    "success": False,
                    "detail": "Duplicate subject allocations detected. Confirm overwrite to proceed.",
                    "duplicates": duplicates,
                },
                status=status.HTTP_409_CONFLICT,
            )

        record_audit_event(
            request,
            module_key="ACADEMICS",
            action_name="CREATE",
            entity_type="ClassSubjectAllocation",
            entity_id="BULK",
            remarks=f"Bulk subject allocation completed ({created_count} created, {updated_count} updated)",
        )
        return Response(
            {"success": True, "created": created_count, "updated": updated_count},
            status=status.HTTP_201_CREATED,
        )


class TimetableEntryViewSet(TenantScopedModelViewSet):
    queryset = TimetableEntry.objects.select_related("allocation", "school", "campus").all()
    serializer_class = TimetableEntrySerializer
    erp_module_key = "ACADEMICS"
    filterset_fields = ["school", "campus", "academic_year", "day_of_week"]


router = DefaultRouter()
router.register("classes", SchoolClassViewSet, basename="class")
router.register("sections", ClassSectionViewSet, basename="section")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("subject-allocations", ClassSubjectAllocationViewSet, basename="subject-allocation")
router.register("timetables", TimetableEntryViewSet, basename="timetable")

urlpatterns = [path("", include(router.urls))]
