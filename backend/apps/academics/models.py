"""Academic models: Classes, Sections, Subjects, Subject Allocations & Timetables."""
from django.db import models
from apps.core.models import TimeStampedAuditModel


class SchoolClass(TimeStampedAuditModel):
    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT, related_name="classes")
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT, related_name="classes")
    academic_year = models.ForeignKey("tenants.AcademicYear", on_delete=models.RESTRICT)
    name = models.CharField(max_length=80)
    code = models.CharField(max_length=32)
    display_order = models.PositiveSmallIntegerField(default=1)

    class Meta:
        db_table = "classes"
        ordering = ["display_order", "name"]
        constraints = [
            models.UniqueConstraint(
                fields=["campus", "academic_year", "code"], name="uq_class_campus_ay_code"
            )
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.campus.code})"


class ClassSection(TimeStampedAuditModel):
    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT)
    school_class = models.ForeignKey(
        SchoolClass, on_delete=models.RESTRICT, related_name="sections", db_column="class_id"
    )
    name = models.CharField(max_length=24)
    room_number = models.CharField(max_length=40, blank=True, default="")
    capacity = models.PositiveSmallIntegerField(default=40)
    class_teacher = models.ForeignKey(
        "staff_hr.Staff", null=True, blank=True, on_delete=models.SET_NULL, related_name="homeroom_sections"
    )

    class Meta:
        db_table = "sections"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school_class", "name"], name="uq_section_class_name")
        ]


class Subject(TimeStampedAuditModel):
    TYPE_CHOICES = [
        ("Core", "Core"),
        ("Elective", "Elective"),
        ("Optional", "Optional"),
        ("Language", "Language"),
    ]
    DELIVERY_CHOICES = [
        ("Theory", "Theory"),
        ("Practical", "Practical"),
        ("Theory & Practical", "Theory & Practical"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT, related_name="subjects")
    campus = models.ForeignKey("tenants.Campus", null=True, blank=True, on_delete=models.RESTRICT)
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=140)
    subject_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="Core")
    classification = models.CharField(max_length=24, choices=DELIVERY_CHOICES, default="Theory")
    default_max_marks = models.PositiveSmallIntegerField(default=100)

    class Meta:
        db_table = "subjects"
        ordering = ["code"]
        constraints = [
            models.UniqueConstraint(fields=["school", "code"], name="uq_subject_school_code")
        ]


class ClassSubjectAllocation(TimeStampedAuditModel):
    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT)
    academic_year = models.ForeignKey("tenants.AcademicYear", on_delete=models.RESTRICT)
    school_class = models.ForeignKey(SchoolClass, on_delete=models.RESTRICT, db_column="class_id")
    section = models.ForeignKey(ClassSection, on_delete=models.RESTRICT)
    subject = models.ForeignKey(Subject, on_delete=models.RESTRICT)
    assigned_teacher = models.ForeignKey(
        "staff_hr.Staff", on_delete=models.RESTRICT, related_name="subject_allocations"
    )
    subject_type = models.CharField(max_length=20, choices=Subject.TYPE_CHOICES, default="Core")
    classification = models.CharField(
        max_length=24, choices=Subject.DELIVERY_CHOICES, default="Theory"
    )
    weekly_periods = models.PositiveSmallIntegerField(default=5)
    total_marks = models.PositiveSmallIntegerField(default=100)

    class Meta:
        db_table = "class_subject_allocations"
        constraints = [
            models.UniqueConstraint(
                fields=["academic_year", "campus", "school_class", "section", "subject", "is_deleted"],
                name="uq_class_subject_allocation",
            )
        ]


class TimetableEntry(TimeStampedAuditModel):
    DAYS = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT)
    academic_year = models.ForeignKey("tenants.AcademicYear", on_delete=models.RESTRICT)
    allocation = models.ForeignKey(
        ClassSubjectAllocation, on_delete=models.RESTRICT, related_name="timetable_entries"
    )
    day_of_week = models.CharField(max_length=16, choices=DAYS)
    period_number = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=40, blank=True, default="")

    class Meta:
        db_table = "timetables"
        ordering = ["day_of_week", "period_number"]
