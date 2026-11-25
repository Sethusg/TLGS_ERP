"""Multi-tenant hierarchy models: Organization -> School -> Campus -> Academic Year."""
from django.db import models
from apps.core.models import TimeStampedAuditModel


class Organization(TimeStampedAuditModel):
    code = models.CharField(max_length=32, unique=True)
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=100)
    registration_no = models.CharField(max_length=100, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    city = models.CharField(max_length=100, blank=True, default="")
    address = models.TextField(blank=True, default="")
    established_year = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        db_table = "organizations"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class School(TimeStampedAuditModel):
    BOARD_CHOICES = [
        ("CBSE", "CBSE"),
        ("ICSE", "ICSE"),
        ("IB", "IB"),
        ("Cambridge IGCSE", "Cambridge IGCSE"),
        ("State Board", "State Board"),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.RESTRICT, related_name="schools"
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=200)
    short_name = models.CharField(max_length=100)
    board = models.CharField(max_length=32, choices=BOARD_CHOICES, default="CBSE")
    affiliation_no = models.CharField(max_length=80, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    website = models.URLField(blank=True, default="")

    class Meta:
        db_table = "schools"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "code"], name="uq_school_org_code"
            )
        ]

    def __str__(self) -> str:
        return f"{self.short_name} ({self.board})"


class Campus(TimeStampedAuditModel):
    organization = models.ForeignKey(
        Organization, on_delete=models.RESTRICT, related_name="campuses"
    )
    school = models.ForeignKey(
        School, on_delete=models.RESTRICT, related_name="campuses"
    )
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=180)
    city = models.CharField(max_length=100)
    address = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    principal_name = models.CharField(max_length=150, blank=True, default="")

    class Meta:
        db_table = "campuses"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "code"], name="uq_campus_school_code"
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code})"


class AcademicYear(TimeStampedAuditModel):
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Archived", "Archived"),
        ("Upcoming", "Upcoming"),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.RESTRICT, related_name="academic_years"
    )
    school = models.ForeignKey(
        School,
        null=True,
        blank=True,
        on_delete=models.RESTRICT,
        related_name="academic_years",
    )
    label = models.CharField(max_length=32)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Active")
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = "academic_years"
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "school", "label"],
                name="uq_ay_org_school_label",
            )
        ]

    def __str__(self) -> str:
        return self.label
