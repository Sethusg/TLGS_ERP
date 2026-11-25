"""Student, Parent/Guardian, and Admission Enquiry models."""
from django.db import models
from apps.core.models import TimeStampedAuditModel


class ParentGuardian(TimeStampedAuditModel):
    RELATION_CHOICES = [
        ("Father", "Father"),
        ("Mother", "Mother"),
        ("Guardian", "Guardian"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    user = models.ForeignKey("accounts.ErpUser", null=True, blank=True, on_delete=models.SET_NULL)
    full_name = models.CharField(max_length=160)
    relation = models.CharField(max_length=16, choices=RELATION_CHOICES, default="Father")
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True, default="")
    occupation = models.CharField(max_length=120, blank=True, default="")
    address = models.TextField(blank=True, default="")

    class Meta:
        db_table = "parents_guardians"


class Student(TimeStampedAuditModel):
    GENDER_CHOICES = [("Male", "Male"), ("Female", "Female"), ("Other", "Other")]
    STATUS_CHOICES = [
        ("Active", "Active"),
        ("Promoted", "Promoted"),
        ("Transferred", "Transferred"),
        ("Withdrawn", "Withdrawn"),
        ("Alumni", "Alumni"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT, related_name="students")
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT, related_name="students")
    academic_year = models.ForeignKey("tenants.AcademicYear", on_delete=models.RESTRICT)
    school_class = models.ForeignKey("academics.SchoolClass", on_delete=models.RESTRICT, db_column="class_id")
    section = models.ForeignKey("academics.ClassSection", on_delete=models.RESTRICT)
    primary_guardian = models.ForeignKey(ParentGuardian, null=True, blank=True, on_delete=models.SET_NULL)
    user = models.OneToOneField("accounts.ErpUser", null=True, blank=True, on_delete=models.SET_NULL)
    admission_number = models.CharField(max_length=48)
    roll_number = models.CharField(max_length=24, blank=True, default="")
    full_name = models.CharField(max_length=160)
    gender = models.CharField(max_length=12, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    admission_date = models.DateField()
    blood_group = models.CharField(max_length=10, blank=True, default="")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Active")

    class Meta:
        db_table = "students"
        ordering = ["full_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "academic_year", "admission_number"],
                name="uq_student_school_ay_admno",
            )
        ]


class AdmissionEnquiry(TimeStampedAuditModel):
    STAGE_CHOICES = [
        ("Enquiry", "Enquiry"),
        ("Application", "Application"),
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT)
    academic_year = models.ForeignKey("tenants.AcademicYear", on_delete=models.RESTRICT)
    parent_name = models.CharField(max_length=160)
    student_name = models.CharField(max_length=160)
    phone = models.CharField(max_length=32)
    grade_applying = models.CharField(max_length=60)
    source = models.CharField(max_length=60, default="Website")
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default="Enquiry")
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "admission_enquiries"
        ordering = ["-created_at"]
