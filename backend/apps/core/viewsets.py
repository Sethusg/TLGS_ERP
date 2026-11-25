"""Reusable multi-tenant ViewSet providing full CRUD, activate/deactivate, soft-delete, and audit logging."""
from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import HasErpModulePermission


def record_audit_event(
    request,
    *,
    module_key: str,
    action_name: str,
    entity_type: str,
    entity_id: str,
    remarks: str,
    organization_id=None,
    school_id=None,
    campus_id=None,
):
    """Persist an audit log record inside the active transaction."""
    from apps.operations.models import AuditLog

    user = getattr(request, "user", None)
    AuditLog.objects.create(
        organization_id=organization_id or getattr(user, "organization_id", None),
        school_id=school_id or getattr(user, "school_id", None),
        campus_id=campus_id or getattr(user, "campus_id", None),
        actor_user=user if getattr(user, "is_authenticated", False) else None,
        actor_username=getattr(user, "username", "system"),
        actor_role=getattr(getattr(user, "role", None), "name", "Super Administrator"),
        module_key=module_key,
        action=action_name,
        entity_type=entity_type,
        entity_id=str(entity_id),
        remarks=remarks,
        ip_address=request.META.get("REMOTE_ADDR"),
    )


class TenantScopedModelViewSet(viewsets.ModelViewSet):
    """
    Standard ViewSet for every LEADERS ERP module.
    Supports:
      - Automatic Organization -> School -> Campus -> Academic Year tenant isolation
      - Add (POST), View (GET), Edit/Update (PUT/PATCH), Deactivate, Reactivate, Soft Delete
      - Query params: organization_id, school_id, campus_id, academic_year_id, status (active|inactive|all|deleted)
      - Automatic atomic AuditLog recording
    """

    permission_classes = [HasErpModulePermission]
    erp_module_key = "SYSTEM"

    def _has_field(self, field_name: str) -> bool:
        return any(f.name == field_name for f in self.queryset.model._meta.fields)

    def get_queryset(self):
        model = self.queryset.model
        status_view = self.request.query_params.get("status", "active").lower()

        if status_view == "all":
            qs = model.all_objects.filter(is_deleted=False)
        elif status_view == "inactive":
            qs = model.all_objects.filter(is_deleted=False, is_active=False)
        elif status_view == "deleted":
            qs = model.all_objects.filter(is_deleted=True)
        else:
            qs = model.objects.filter(is_active=True)

        user = self.request.user
        role_scope = getattr(getattr(user, "role", None), "scope_level", "Central")

        # 1. Server-side mandatory tenant isolation based on authenticated user's role
        if not getattr(user, "is_superuser", False) and role_scope != "Central":
            if role_scope == "Organization" and user.organization_id and self._has_field("organization"):
                qs = qs.filter(organization_id=user.organization_id)
            elif role_scope == "School" and user.school_id and self._has_field("school"):
                qs = qs.filter(school_id=user.school_id)
            elif role_scope in ("Campus", "Self"):
                if user.school_id and self._has_field("school"):
                    qs = qs.filter(school_id=user.school_id)
                if user.campus_id and self._has_field("campus"):
                    qs = qs.filter(campus_id=user.campus_id)

        # 2. Client-supplied dropdown filters (applied strictly within authorized scope)
        for param, field in (
            ("organization_id", "organization"),
            ("school_id", "school"),
            ("campus_id", "campus"),
            ("academic_year_id", "academic_year"),
        ):
            val = self.request.query_params.get(param)
            if val and val != "all" and self._has_field(field):
                qs = qs.filter(**{f"{field}_id": val})

        return qs

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        record_audit_event(
            self.request,
            module_key=self.erp_module_key,
            action_name="CREATE",
            entity_type=instance.__class__.__name__,
            entity_id=instance.pk,
            remarks=f"Created {instance.__class__.__name__} #{instance.pk}",
            organization_id=getattr(instance, "organization_id", None),
            school_id=getattr(instance, "school_id", None),
            campus_id=getattr(instance, "campus_id", None),
        )

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save(updated_by=self.request.user)
        record_audit_event(
            self.request,
            module_key=self.erp_module_key,
            action_name="UPDATE",
            entity_type=instance.__class__.__name__,
            entity_id=instance.pk,
            remarks=f"Updated {instance.__class__.__name__} #{instance.pk}",
            organization_id=getattr(instance, "organization_id", None),
            school_id=getattr(instance, "school_id", None),
            campus_id=getattr(instance, "campus_id", None),
        )

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.soft_delete(actor=request.user)
        record_audit_event(
            request,
            module_key=self.erp_module_key,
            action_name="SOFT_DELETE",
            entity_type=instance.__class__.__name__,
            entity_id=instance.pk,
            remarks=f"Soft-deleted {instance.__class__.__name__} #{instance.pk}",
            organization_id=getattr(instance, "organization_id", None),
            school_id=getattr(instance, "school_id", None),
            campus_id=getattr(instance, "campus_id", None),
        )
        return Response(
            {"success": True, "message": "Record soft-deleted successfully.", "id": instance.pk},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def deactivate(self, request, pk=None):
        instance = self.get_object()
        instance.deactivate(actor=request.user)
        record_audit_event(
            request,
            module_key=self.erp_module_key,
            action_name="DEACTIVATE",
            entity_type=instance.__class__.__name__,
            entity_id=instance.pk,
            remarks=f"Deactivated {instance.__class__.__name__} #{instance.pk}",
            organization_id=getattr(instance, "organization_id", None),
            school_id=getattr(instance, "school_id", None),
            campus_id=getattr(instance, "campus_id", None),
        )
        return Response(self.get_serializer(instance).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reactivate(self, request, pk=None):
        model = self.queryset.model
        qs = model.all_objects.all()
        user = request.user
        role_scope = getattr(getattr(user, "role", None), "scope_level", "Central")
        if not getattr(user, "is_superuser", False) and role_scope != "Central":
            if role_scope == "Organization" and user.organization_id and self._has_field("organization"):
                qs = qs.filter(organization_id=user.organization_id)
            elif role_scope == "School" and user.school_id and self._has_field("school"):
                qs = qs.filter(school_id=user.school_id)
            elif role_scope in ("Campus", "Self"):
                if user.school_id and self._has_field("school"):
                    qs = qs.filter(school_id=user.school_id)
                if user.campus_id and self._has_field("campus"):
                    qs = qs.filter(campus_id=user.campus_id)

        instance = qs.filter(pk=pk).first()
        if instance is None:
            return Response(
                {"success": False, "detail": "Record not found within authorized tenant scope."},
                status=status.HTTP_404_NOT_FOUND,
            )
        instance.reactivate(actor=request.user)
        record_audit_event(
            request,
            module_key=self.erp_module_key,
            action_name="REACTIVATE",
            entity_type=instance.__class__.__name__,
            entity_id=instance.pk,
            remarks=f"Reactivated {instance.__class__.__name__} #{instance.pk}",
            organization_id=getattr(instance, "organization_id", None),
            school_id=getattr(instance, "school_id", None),
            campus_id=getattr(instance, "campus_id", None),
        )
        return Response(self.get_serializer(instance).data)
