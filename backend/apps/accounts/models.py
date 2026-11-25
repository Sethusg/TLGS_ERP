"""Custom User, RBAC Role, Module Permissions, and Login History models."""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class Role(models.Model):
    SCOPE_CHOICES = [
        ("Central", "Central Super Admin"),
        ("Organization", "Organization Level"),
        ("School", "School Level"),
        ("Campus", "Campus Level"),
        ("Self", "Self / Portal"),
    ]

    code = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=100, unique=True)
    scope_level = models.CharField(max_length=20, choices=SCOPE_CHOICES, default="School")
    description = models.CharField(max_length=255, blank=True, default="")
    is_system_role = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class RoleModulePermission(models.Model):
    role = models.ForeignKey(
        Role, on_delete=models.CASCADE, related_name="module_permissions"
    )
    module_key = models.CharField(max_length=64)
    can_create = models.BooleanField(default=False)
    can_read = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_activate = models.BooleanField(default=False)
    can_deactivate = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "role_module_permissions"
        constraints = [
            models.UniqueConstraint(
                fields=["role", "module_key"], name="uq_role_module_permission"
            )
        ]


class ErpUserManager(BaseUserManager):
    def create_user(self, username: str, email: str, password: str | None = None, **extra_fields):
        if not username:
            raise ValueError("Username is required.")
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username: str, email: str, password: str, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(username, email, password, **extra_fields)


class ErpUser(AbstractBaseUser, PermissionsMixin):
    ACCESS_SCOPE_CHOICES = [
        ("all_schools", "All Schools"),
        ("single_school", "Single School"),
        ("selected_schools", "Selected Schools"),
    ]

    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=32, blank=True, default="")
    role = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL, related_name="users")
    organization = models.ForeignKey(
        "tenants.Organization", null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )
    access_scope = models.CharField(
        max_length=24, choices=ACCESS_SCOPE_CHOICES, default="single_school"
    )
    school = models.ForeignKey(
        "tenants.School", null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )
    campus = models.ForeignKey(
        "tenants.Campus", null=True, blank=True, on_delete=models.SET_NULL, related_name="users"
    )
    created_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="created_users"
    )
    role_assigned_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="role_assigned_users"
    )
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = ErpUserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email", "full_name"]

    class Meta:
        db_table = "users"
        ordering = ["full_name"]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.username})"


class UserSchoolAccess(models.Model):
    """Multi-school and campus-level access assignments for an ERP user."""

    user = models.ForeignKey(ErpUser, on_delete=models.CASCADE, related_name="school_accesses")
    organization = models.ForeignKey(
        "tenants.Organization", null=True, blank=True, on_delete=models.SET_NULL
    )
    school = models.ForeignKey("tenants.School", on_delete=models.CASCADE, related_name="user_accesses")
    campus = models.ForeignKey(
        "tenants.Campus", null=True, blank=True, on_delete=models.SET_NULL, related_name="user_accesses"
    )
    is_active = models.BooleanField(default=True, db_index=True)
    assigned_by = models.ForeignKey(
        ErpUser, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_school_accesses"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_school_access"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "school", "campus"], name="uq_user_school_campus_access"
            )
        ]


class UserStudentLink(models.Model):
    """Parent/Guardian to Student linkage for Parent role accounts."""

    parent_user = models.ForeignKey(ErpUser, on_delete=models.CASCADE, related_name="linked_students")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="parent_links")
    relationship = models.CharField(max_length=50, default="Parent/Guardian")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        ErpUser, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_student_links"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user_student_links"
        constraints = [
            models.UniqueConstraint(
                fields=["parent_user", "student"], name="uq_parent_student_link"
            )
        ]


class LoginHistory(models.Model):
    STATUS_CHOICES = [
        ("Success", "Success"),
        ("Failed", "Failed"),
        ("Locked", "Locked"),
    ]

    user = models.ForeignKey(ErpUser, on_delete=models.CASCADE, related_name="login_history")
    school = models.ForeignKey("tenants.School", null=True, blank=True, on_delete=models.SET_NULL)
    campus = models.ForeignKey("tenants.Campus", null=True, blank=True, on_delete=models.SET_NULL)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Success")
    logged_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "login_history"
        ordering = ["-logged_in_at"]

