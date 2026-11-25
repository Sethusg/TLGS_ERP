"""Staff, Department, Leave Request, and Payroll models for LEADERS ERP."""
from django.db import models
from apps.core.models import TimeStampedAuditModel


class Department(TimeStampedAuditModel):
    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", null=True, blank=True, on_delete=models.RESTRICT)
    code = models.CharField(max_length=32)
    name = models.CharField(max_length=120)

    class Meta:
        db_table = "departments"
        constraints = [
            models.UniqueConstraint(fields=["school", "code"], name="uq_department_school_code")
        ]


class Staff(TimeStampedAuditModel):
    CATEGORY_CHOICES = [
        ("Teaching", "Teaching"),
        ("Non-Teaching", "Non-Teaching"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT, related_name="staff_members")
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT, related_name="staff_members")
    user = models.OneToOneField("accounts.ErpUser", null=True, blank=True, on_delete=models.SET_NULL)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    employee_code = models.CharField(max_length=40)
    full_name = models.CharField(max_length=160)
    staff_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="Teaching")
    designation = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=32, blank=True, default="")
    join_date = models.DateField()
    qualification = models.CharField(max_length=150, blank=True, default="")
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = "staff"
        ordering = ["full_name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "employee_code"], name="uq_staff_school_code")
        ]

    def __str__(self) -> str:
        return f"{self.employee_code} - {self.full_name}"


class LeaveRequest(TimeStampedAuditModel):
    TYPE_CHOICES = [
        ("Casual", "Casual"),
        ("Sick", "Sick"),
        ("Earned", "Earned"),
        ("Maternity", "Maternity"),
        ("Unpaid", "Unpaid"),
    ]
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    organization = models.ForeignKey("tenants.Organization", on_delete=models.RESTRICT)
    school = models.ForeignKey("tenants.School", on_delete=models.RESTRICT)
    campus = models.ForeignKey("tenants.Campus", on_delete=models.RESTRICT)
    staff = models.ForeignKey(Staff, on_delete=models.RESTRICT, related_name="leave_requests")
    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="Pending")
    reviewed_by = models.ForeignKey(
        "accounts.ErpUser", null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_leaves"
    )

    class Meta:
        db_table = "hr_leave_requests"
        ordering = ["-created_at"]
