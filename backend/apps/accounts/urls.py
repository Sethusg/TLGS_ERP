"""JWT Authentication, Role-Permission Matrix, and User Management APIs."""
from django.db import transaction
from django.urls import include, path
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.models import (
    ErpUser,
    LoginHistory,
    Role,
    RoleModulePermission,
    UserSchoolAccess,
    UserStudentLink,
)
from apps.core.permissions import HasErpModulePermission
from apps.core.viewsets import record_audit_event


class RoleModulePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoleModulePermission
        fields = [
            "id",
            "module_key",
            "can_create",
            "can_read",
            "can_update",
            "can_delete",
            "can_activate",
            "can_deactivate",
        ]


class RoleSerializer(serializers.ModelSerializer):
    module_permissions = RoleModulePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = "__all__"


class ErpUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_code = serializers.CharField(source="role.code", read_only=True)
    role_scope = serializers.CharField(source="role.scope_level", read_only=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    school_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    campus_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    linked_student_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )
    assigned_school_ids = serializers.SerializerMethodField(read_only=True)
    assigned_campus_ids = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ErpUser
        fields = [
            "id",
            "username",
            "email",
            "full_name",
            "phone",
            "role",
            "role_name",
            "role_code",
            "role_scope",
            "organization",
            "access_scope",
            "school",
            "campus",
            "school_ids",
            "campus_ids",
            "linked_student_ids",
            "assigned_school_ids",
            "assigned_campus_ids",
            "created_by",
            "role_assigned_by",
            "is_active",
            "is_deleted",
            "last_login",
            "created_at",
            "password",
        ]
        read_only_fields = ("last_login", "created_at", "is_deleted", "created_by", "role_assigned_by")

    def get_assigned_school_ids(self, obj):
        return list(obj.school_accesses.filter(is_active=True).values_list("school_id", flat=True).distinct())

    def get_assigned_campus_ids(self, obj):
        return list(
            obj.school_accesses.filter(is_active=True, campus_id__isnull=False)
            .values_list("campus_id", flat=True)
            .distinct()
        )

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        is_super_admin = bool(
            actor and (actor.is_superuser or (actor.role and actor.role.code == "SUPER_ADMIN"))
        )
        role_obj = attrs.get("role")
        if role_obj:
            if not role_obj.is_active:
                raise serializers.ValidationError({"role": "Selected role is inactive."})
            if role_obj.code == "SUPER_ADMIN" and not is_super_admin:
                raise serializers.ValidationError(
                    {"role": "Only a Central Super Admin can assign Super Administrator."}
                )
        scope = attrs.get("access_scope")
        if scope == "all_schools" and not is_super_admin:
            raise serializers.ValidationError(
                {"access_scope": "All Schools access requires Central Super Admin authorization."}
            )
        return attrs

    def _sync_access_links(self, user, school_ids, campus_ids, linked_student_ids, actor):
        if school_ids is not None:
            UserSchoolAccess.objects.filter(user=user).delete()
            if user.access_scope != "all_schools":
                for sid in school_ids:
                    if campus_ids:
                        for cid in campus_ids:
                            UserSchoolAccess.objects.get_or_create(
                                user=user,
                                school_id=sid,
                                campus_id=cid,
                                defaults={
                                    "organization": user.organization,
                                    "assigned_by": actor if actor and actor.is_authenticated else None,
                                    "is_active": True,
                                },
                            )
                    else:
                        UserSchoolAccess.objects.get_or_create(
                            user=user,
                            school_id=sid,
                            campus_id=None,
                            defaults={
                                "organization": user.organization,
                                "assigned_by": actor if actor and actor.is_authenticated else None,
                                "is_active": True,
                            },
                        )
        if linked_student_ids is not None:
            UserStudentLink.objects.filter(parent_user=user).delete()
            for student_id in linked_student_ids:
                UserStudentLink.objects.get_or_create(
                    parent_user=user,
                    student_id=student_id,
                    defaults={"created_by": actor if actor and actor.is_authenticated else None},
                )

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        school_ids = validated_data.pop("school_ids", None)
        campus_ids = validated_data.pop("campus_ids", None)
        linked_student_ids = validated_data.pop("linked_student_ids", None)
        if not password:
            raise serializers.ValidationError({"password": "Password (min 8 chars) is required."})
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        if actor and actor.is_authenticated:
            validated_data["created_by"] = actor
            validated_data["role_assigned_by"] = actor
        user = ErpUser(**validated_data)
        user.set_password(password)
        user.save()
        self._sync_access_links(user, school_ids, campus_ids, linked_student_ids, actor)
        return user

    @transaction.atomic
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        school_ids = validated_data.pop("school_ids", None)
        campus_ids = validated_data.pop("campus_ids", None)
        linked_student_ids = validated_data.pop("linked_student_ids", None)
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if actor and actor.is_authenticated:
            instance.role_assigned_by = actor
        if password:
            instance.set_password(password)
        instance.save()
        self._sync_access_links(instance, school_ids, campus_ids, linked_student_ids, actor)
        return instance


class ErpTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["full_name"] = user.full_name
        token["role_code"] = user.role.code if user.role else ("SUPER_ADMIN" if user.is_superuser else "USER")
        token["role_scope"] = user.role.scope_level if user.role else "Central"
        token["organization_id"] = user.organization_id
        token["school_id"] = user.school_id
        token["campus_id"] = user.campus_id
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        request = self.context.get("request")
        LoginHistory.objects.create(
            user=self.user,
            school=self.user.school,
            campus=self.user.campus,
            ip_address=request.META.get("REMOTE_ADDR") if request else None,
            user_agent=(request.META.get("HTTP_USER_AGENT", "")[:250]) if request else "",
            status="Success",
        )
        data["user"] = ErpUserSerializer(self.user).data
        return data


class ErpTokenObtainPairView(TokenObtainPairView):
    serializer_class = ErpTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user_profile(request):
    user = request.user
    perms = (
        RoleModulePermissionSerializer(user.role.module_permissions.all(), many=True).data
        if user.role
        else []
    )
    return Response({"user": ErpUserSerializer(user).data, "permissions": perms})


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.prefetch_related("module_permissions").all()
    serializer_class = RoleSerializer
    permission_classes = [HasErpModulePermission]
    erp_module_key = "ADMIN"
    search_fields = ["name", "code"]

    def get_queryset(self):
        qs = super().get_queryset()
        active_only = self.request.query_params.get("activeOnly", "true").lower()
        if active_only != "false":
            qs = qs.filter(is_active=True)
        assignable = self.request.query_params.get("assignable", "false").lower() == "true"
        actor = self.request.user
        is_super = bool(actor and (actor.is_superuser or (actor.role and actor.role.code == "SUPER_ADMIN")))
        if assignable and not is_super:
            qs = qs.exclude(code="SUPER_ADMIN")
        return qs


class ErpUserViewSet(viewsets.ModelViewSet):
    queryset = ErpUser.objects.select_related("role", "organization", "school", "campus").filter(
        is_deleted=False
    )
    serializer_class = ErpUserSerializer
    permission_classes = [HasErpModulePermission]
    erp_module_key = "ADMIN"
    search_fields = ["username", "full_name", "email"]
    filterset_fields = ["role", "organization", "school", "campus", "is_active"]

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def deactivate(self, request, pk=None):
        user_obj = self.get_object()
        user_obj.is_active = False
        user_obj.save(update_fields=["is_active", "updated_at"])
        record_audit_event(
            request,
            module_key="ADMIN",
            action_name="DEACTIVATE",
            entity_type="ErpUser",
            entity_id=user_obj.pk,
            remarks=f"Deactivated user account {user_obj.username}",
        )
        return Response(self.get_serializer(user_obj).data)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def reactivate(self, request, pk=None):
        user_obj = self.get_object()
        user_obj.is_active = True
        user_obj.save(update_fields=["is_active", "updated_at"])
        record_audit_event(
            request,
            module_key="ADMIN",
            action_name="REACTIVATE",
            entity_type="ErpUser",
            entity_id=user_obj.pk,
            remarks=f"Reactivated user account {user_obj.username}",
        )
        return Response(self.get_serializer(user_obj).data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        user_obj = self.get_object()
        user_obj.is_deleted = True
        user_obj.is_active = False
        user_obj.deleted_at = timezone.now()
        user_obj.save(update_fields=["is_deleted", "is_active", "deleted_at", "updated_at"])
        record_audit_event(
            request,
            module_key="ADMIN",
            action_name="SOFT_DELETE",
            entity_type="ErpUser",
            entity_id=user_obj.pk,
            remarks=f"Soft-deleted user account {user_obj.username}",
        )
        return Response({"success": True, "id": user_obj.pk}, status=status.HTTP_200_OK)


router = DefaultRouter()
router.register("roles", RoleViewSet, basename="role")
router.register("users", ErpUserViewSet, basename="user")

urlpatterns = [
    path("login/", ErpTokenObtainPairView.as_view(), name="jwt-login"),
    path("refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),
    path("me/", current_user_profile, name="auth-me"),
    path("", include(router.urls)),
]
