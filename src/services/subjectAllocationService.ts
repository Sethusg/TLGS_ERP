import {
  ExamRecord,
  Staff,
  SubjectAllocation,
  TimetableEntry,
} from '../types';
import { SchoolOption } from '../data/schoolContext';

const STORAGE_KEY = 'leaders_erp_subject_allocations_v1';

export function resolveOrganizationId(orgName: string): string {
  const lower = orgName.toLowerCase();
  if (lower.includes('baccalaureate') || lower.includes('ib')) {
    return 'org-global-ib';
  }
  return 'org-leaders-trust';
}

export function buildAllocationUniqueKey(params: {
  academicYearId: string;
  schoolId: string;
  campusId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
}): string {
  return [
    params.academicYearId.trim().toLowerCase(),
    params.schoolId.trim().toLowerCase(),
    params.campusId.trim().toLowerCase(),
    params.classId.trim().toLowerCase(),
    params.sectionId.trim().toUpperCase(),
    params.subjectId.trim().toLowerCase(),
  ].join('::');
}

export function getEligibleTeachersForScope(
  staffList: Staff[],
  schoolId: string,
  campusId: string
): Staff[] {
  return staffList.filter((st) => {
    if (st.status === 'Archived' || st.status === 'Resigned') return false;
    const stSchool = st.schoolId || 'sch-leaders-cbse';
    if (schoolId && schoolId !== 'all' && stSchool !== 'all' && stSchool !== schoolId) {
      return false;
    }
    if (
      campusId &&
      campusId !== 'all' &&
      st.campusId &&
      st.campusId !== 'all' &&
      st.campusId !== campusId
    ) {
      return false;
    }
    return true;
  });
}

export function isTeacherEligibleForScope(
  teacher: Staff | undefined,
  schoolId: string,
  campusId: string
): { eligible: boolean; reason?: string } {
  if (!teacher) {
    return { eligible: false, reason: 'Selected teacher does not exist in Staff Master.' };
  }
  if (teacher.status === 'Archived' || teacher.status === 'Resigned') {
    return {
      eligible: false,
      reason: `${teacher.name} is currently ${teacher.status} and cannot be assigned.`,
    };
  }
  const stSchool = teacher.schoolId || 'sch-leaders-cbse';
  if (schoolId && schoolId !== 'all' && stSchool !== 'all' && stSchool !== schoolId) {
    return {
      eligible: false,
      reason: `${teacher.name} belongs to a different school (${stSchool}) and is not eligible for this school.`,
    };
  }
  if (
    campusId &&
    campusId !== 'all' &&
    teacher.campusId &&
    teacher.campusId !== 'all' &&
    teacher.campusId !== campusId
  ) {
    return {
      eligible: false,
      reason: `${teacher.name} is assigned to a different campus (${teacher.campusId}) and is not eligible for this campus.`,
    };
  }
  return { eligible: true };
}

export interface AllocationDependencyReport {
  hasDependencies: boolean;
  timetableCount: number;
  examRecordCount: number;
  details: string[];
}

export function checkAllocationDependencies(
  allocation: SubjectAllocation,
  timetables: TimetableEntry[],
  exams: ExamRecord[]
): AllocationDependencyReport {
  const details: string[] = [];

  const matchingTimetables = timetables.filter((t) => {
    const tSchool = t.schoolId || 'sch-leaders-cbse';
    return (
      tSchool === allocation.schoolId &&
      t.grade.toLowerCase() === allocation.className.toLowerCase() &&
      t.section.toUpperCase() === allocation.sectionId.toUpperCase() &&
      t.subjectName.toLowerCase().includes(allocation.subjectName.toLowerCase().split(' ')[0])
    );
  });

  if (matchingTimetables.length > 0) {
    details.push(
      `Referenced by ${matchingTimetables.length} active Timetable period slot(s) (${matchingTimetables
        .slice(0, 2)
        .map((t) => `${t.day} P${t.periodNo}`)
        .join(', ')}).`
    );
  }

  const matchingExams = exams.filter((ex) => {
    const exSchool = ex.schoolId || 'sch-leaders-cbse';
    if (
      exSchool !== allocation.schoolId ||
      ex.grade.toLowerCase() !== allocation.className.toLowerCase() ||
      ex.section.toUpperCase() !== allocation.sectionId.toUpperCase()
    ) {
      return false;
    }
    return ex.subjects.some((s) =>
      s.name.toLowerCase().includes(allocation.subjectName.toLowerCase().split(' ')[0])
    );
  });

  if (matchingExams.length > 0) {
    details.push(
      `Referenced by ${matchingExams.length} Examination Markchart record(s) (${matchingExams[0].examName}).`
    );
  }

  return {
    hasDependencies: matchingTimetables.length > 0 || matchingExams.length > 0,
    timetableCount: matchingTimetables.length,
    examRecordCount: matchingExams.length,
    details,
  };
}

export const INITIAL_SUBJECT_ALLOCATIONS: SubjectAllocation[] = [];

export function loadPersistedAllocations(): SubjectAllocation[] {
  return [];
}

export function savePersistedAllocations(_allocations: SubjectAllocation[]): void {
  // Persisted via backend APIs rather than browser localStorage
}

export function resetPersistedAllocations(): SubjectAllocation[] {
  return [];
}

export function getSchoolOrganizationMeta(
  schoolId: string,
  schools: SchoolOption[]
): { organizationId: string; organizationName: string } {
  const school = schools.find((s) => s.id === schoolId);
  const orgName = school?.organizationName || 'Unassigned Organization';
  return {
    organizationId: school?.organizationId || resolveOrganizationId(orgName),
    organizationName: orgName,
  };
}

/**
 * Planned Python Django REST Framework + MySQL 8+ Backend Blueprint
 * Prepared for seamless integration once the Django backend service is deployed.
 */
export const DJANGO_SUBJECT_ALLOCATION_BLUEPRINT = {
  mysqlDDL: `-- Normalized MySQL 8+ Table: subject_allocations
CREATE TABLE subject_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED NOT NULL,
  school_id BIGINT UNSIGNED NOT NULL,
  campus_id BIGINT UNSIGNED NOT NULL,
  academic_year_id BIGINT UNSIGNED NOT NULL,
  class_id BIGINT UNSIGNED NOT NULL,
  section_id BIGINT UNSIGNED NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  assigned_teacher_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('Core','Elective','Optional','Language') NOT NULL DEFAULT 'Core',
  weekly_periods TINYINT UNSIGNED NOT NULL DEFAULT 5,
  total_marks SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  classification ENUM('Theory','Practical','Theory & Practical') NOT NULL DEFAULT 'Theory',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  deleted_at DATETIME NULL,
  created_by_id BIGINT UNSIGNED NOT NULL,
  updated_by_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subject_allocation_scope (
    academic_year_id, school_id, campus_id, class_id, section_id, subject_id, is_deleted
  ),
  KEY idx_alloc_tenant_year (school_id, campus_id, academic_year_id),
  KEY idx_alloc_class_section (class_id, section_id, is_active),
  KEY idx_alloc_teacher (assigned_teacher_id, academic_year_id),
  CONSTRAINT fk_sa_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
  CONSTRAINT fk_sa_school FOREIGN KEY (school_id) REFERENCES schools(id),
  CONSTRAINT fk_sa_campus FOREIGN KEY (campus_id) REFERENCES campuses(id),
  CONSTRAINT fk_sa_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
  CONSTRAINT fk_sa_class FOREIGN KEY (class_id) REFERENCES school_classes(id),
  CONSTRAINT fk_sa_section FOREIGN KEY (section_id) REFERENCES class_sections(id),
  CONSTRAINT fk_sa_subject FOREIGN KEY (subject_id) REFERENCES subjects(id),
  CONSTRAINT fk_sa_teacher FOREIGN KEY (assigned_teacher_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

  djangoModelAndViewSet: `# academics/models.py & academics/views.py (Django REST Framework)
from django.db import models, transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class SubjectAllocation(models.Model):
    SUBJECT_TYPES = [('Core','Core'),('Elective','Elective'),('Optional','Optional'),('Language','Language')]
    CLASSIFICATIONS = [('Theory','Theory'),('Practical','Practical'),('Theory & Practical','Theory & Practical')]

    organization = models.ForeignKey('organizations.Organization', on_delete=models.PROTECT)
    school = models.ForeignKey('organizations.School', on_delete=models.PROTECT)
    campus = models.ForeignKey('organizations.Campus', on_delete=models.PROTECT)
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.PROTECT)
    school_class = models.ForeignKey('academics.SchoolClass', on_delete=models.PROTECT)
    section = models.ForeignKey('academics.Section', on_delete=models.PROTECT)
    subject = models.ForeignKey('academics.Subject', on_delete=models.PROTECT)
    assigned_teacher = models.ForeignKey('staff.StaffMember', on_delete=models.PROTECT)
    subject_type = models.CharField(max_length=20, choices=SUBJECT_TYPES, default='Core')
    weekly_periods = models.PositiveSmallIntegerField(default=5)
    total_marks = models.PositiveSmallIntegerField(default=100)
    classification = models.CharField(max_length=25, choices=CLASSIFICATIONS, default='Theory')
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey('accounts.User', related_name='+', on_delete=models.PROTECT)
    updated_by = models.ForeignKey('accounts.User', related_name='+', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subject_allocations'
        constraints = [
            models.UniqueConstraint(
                fields=['academic_year','school','campus','school_class','section','subject'],
                condition=models.Q(is_deleted=False),
                name='uq_active_subject_allocation_scope',
            )
        ]

class SubjectAllocationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]  # + HasModuleRBACPermission('ACADEMICS')

    def get_queryset(self):
        return SubjectAllocation.objects.filter(
            is_deleted=False, school_id=self.request.tenant_school_id
        ).select_related('school','campus','academic_year','school_class','section','subject','assigned_teacher')

    def perform_destroy(self, instance):
        if instance.timetable_slots.exists() or instance.exam_marks.exists():
            raise ValidationError('Cannot delete allocation referenced by timetables or examinations. Deactivate instead.')
        instance.is_deleted = True
        instance.is_active = False
        instance.deleted_at = timezone.now()
        instance.updated_by = self.request.user
        instance.save()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = True
        obj.updated_by = request.user
        obj.save(update_fields=['is_active', 'updated_by', 'updated_at'])
        return Response({'status': 'activated'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        obj = self.get_object()
        obj.is_active = False
        obj.updated_by = request.user
        obj.save(update_fields=['is_active', 'updated_by', 'updated_at'])
        return Response({'status': 'deactivated'})

    @action(detail=False, methods=['post'], url_path='bulk-allocate')
    @transaction.atomic
    def bulk_allocate(self, request):
        # Atomic multi-section x multi-subject allocation with duplicate validation
        ...`,
};
