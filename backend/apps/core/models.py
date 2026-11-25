"""Core abstract models and shared audit mixins for LEADERS Multi-School ERP."""
from django.conf import settings
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def active(self):
        return self.filter(is_deleted=False, is_active=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class AllRecordsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class TimeStampedAuditModel(models.Model):
    """Base model with created/updated audit metadata, activation toggle, and soft deletion."""

    is_active = models.BooleanField(default=True, db_index=True)
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SoftDeleteManager()
    all_objects = AllRecordsManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def soft_delete(self, actor=None):
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.deleted_by = actor
        self.updated_by = actor
        self.save(
            update_fields=[
                "is_deleted",
                "is_active",
                "deleted_at",
                "deleted_by",
                "updated_by",
                "updated_at",
            ]
        )

    def deactivate(self, actor=None):
        self.is_active = False
        self.updated_by = actor
        self.save(update_fields=["is_active", "updated_by", "updated_at"])

    def reactivate(self, actor=None):
        if self.is_deleted:
            self.is_deleted = False
            self.deleted_at = None
            self.deleted_by = None
        self.is_active = True
        self.updated_by = actor
        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
                "deleted_by",
                "is_active",
                "updated_by",
                "updated_at",
            ]
        )
