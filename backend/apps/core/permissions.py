"""Role-Based Access Control (RBAC) and Multi-Tenant Isolation permissions."""
from rest_framework.permissions import BasePermission


class IsCentralSuperAdmin(BasePermission):
    """Strictly restricts endpoints (e.g., Database Query Assistant) to Central Super Admins."""

    message = "Access restricted to Central Super Administrators only."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if user.is_superuser:
            return True
        return bool(
            user.role
            and user.role.is_active
            and user.role.code in {"SUPER_ADMIN", "CENTRAL_SUPER_ADMIN"}
        )


class HasErpModulePermission(BasePermission):
    """Enforces module-level CRUD + Activate/Deactivate RBAC permissions from MySQL."""

    ACTION_TO_FIELD = {
        "list": "can_read",
        "retrieve": "can_read",
        "create": "can_create",
        "update": "can_update",
        "partial_update": "can_update",
        "destroy": "can_delete",
        "deactivate": "can_deactivate",
        "reactivate": "can_activate",
        "bulk_allocate": "can_create",
    }

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or not user.is_active:
            return False
        if user.is_superuser:
            return True
        if not user.role or not user.role.is_active:
            return False
        if user.role.code in {"SUPER_ADMIN", "CENTRAL_SUPER_ADMIN"}:
            return True

        module_key = getattr(view, "erp_module_key", None)
        if not module_key:
            return True

        action = getattr(view, "action", None) or (
            "list" if request.method in ("GET", "HEAD", "OPTIONS") else "update"
        )
        perm_field = self.ACTION_TO_FIELD.get(action, "can_read")

        return user.role.module_permissions.filter(
            module_key=module_key, **{perm_field: True}
        ).exists()
