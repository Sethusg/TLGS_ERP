import * as XLSX from 'xlsx';
import {
  ErpRole,
  SchoolClass,
  SchoolSubject,
  Staff,
  SystemUser,
  TimetableEntry,
} from '../types';
import { ALL_ERP_ROLES, normalizeLegacyRole } from '../config/rbac';
import { SchoolOption } from '../data/schoolContext';

export type AdminBulkEntityType = 'users' | 'classes' | 'subjects' | 'timetables';

export interface FieldGuideRow {
  column: string;
  required: 'Required' | 'Optional';
  format: string;
  example: string;
  notes: string;
}

export interface AdminImportSchemaDef {
  entity: AdminBulkEntityType;
  label: string;
  singularLabel: string;
  templateFileName: string;
  matchKeyDescription: string;
  fields: FieldGuideRow[];
}

export const ADMIN_IMPORT_SCHEMAS: Record<AdminBulkEntityType, AdminImportSchemaDef> = {
  users: {
    entity: 'users',
    label: 'Application Users',
    singularLabel: 'User Account',
    templateFileName: 'erp_users_import_template',
    matchKeyDescription: 'Matches existing accounts by Username or Email',
    fields: [
      {
        column: 'username',
        required: 'Required',
        format: 'Text (unique)',
        example: 'teacher_arun',
        notes: 'Unique login username (lowercase recommended)',
      },
      {
        column: 'fullName',
        required: 'Required',
        format: 'Text',
        example: 'Arun Prakash R.',
        notes: 'Full display name of the ERP user',
      },
      {
        column: 'email',
        required: 'Required',
        format: 'Email',
        example: 'arun.prakash@leadersgroup.edu.in',
        notes: 'Institutional email address',
      },
      {
        column: 'phone',
        required: 'Optional',
        format: 'Phone',
        example: '+91 98401 55210',
        notes: 'Contact mobile number',
      },
      {
        column: 'role',
        required: 'Required',
        format: 'One of 19 ERP Roles',
        example: 'Class Teacher',
        notes: 'e.g., Super Administrator, Principal, Accountant, Teacher, Class Teacher, Librarian, Student, Parent',
      },
      {
        column: 'schoolId',
        required: 'Optional',
        format: 'School ID, Name, or all',
        example: 'sch-leaders-cbse',
        notes: 'Defaults to active school context if blank; use "all" for Platform/Org scope',
      },
      {
        column: 'campusId',
        required: 'Optional',
        format: 'Campus ID, Name, or all',
        example: 'cmp-chennai-hq',
        notes: 'Defaults to active campus or "all" if blank',
      },
      {
        column: 'department',
        required: 'Optional',
        format: 'Text',
        example: 'Academics',
        notes: 'Assigned department or administrative unit',
      },
      {
        column: 'status',
        required: 'Optional',
        format: 'Active | Inactive',
        example: 'Active',
        notes: 'Defaults to Active if left blank',
      },
    ],
  },
  classes: {
    entity: 'classes',
    label: 'Classes & Teachers',
    singularLabel: 'Class',
    templateFileName: 'erp_classes_teachers_import_template',
    matchKeyDescription: 'Matches existing classes by Grade Name + School',
    fields: [
      {
        column: 'gradeName',
        required: 'Required',
        format: 'Text',
        example: 'Class 8',
        notes: 'Grade or class label (e.g., PRE-KG, Class 1, Class 10)',
      },
      {
        column: 'curriculum',
        required: 'Required',
        format: 'CBSE | ICSE | IB | Cambridge IGCSE | State Board | Matriculation',
        example: 'CBSE',
        notes: 'Education board / curriculum stream',
      },
      {
        column: 'sections',
        required: 'Required',
        format: 'Comma-separated',
        example: 'A, B, C',
        notes: 'Sections offered under this grade (e.g., A, B, C)',
      },
      {
        column: 'roomNo',
        required: 'Required',
        format: 'Text',
        example: 'Block B - Room 204',
        notes: 'Primary homeroom block and room number',
      },
      {
        column: 'classTeacher',
        required: 'Optional',
        format: 'Staff Name or Emp ID',
        example: 'Priyanka Sen',
        notes: 'Auto-matched against live Staff directory by Name or Emp ID',
      },
      {
        column: 'schoolId',
        required: 'Optional',
        format: 'School ID or Name',
        example: 'sch-leaders-cbse',
        notes: 'Defaults to active school context if blank',
      },
      {
        column: 'campusId',
        required: 'Optional',
        format: 'Campus ID or Name',
        example: 'cmp-chennai-hq',
        notes: 'Defaults to active campus context if blank',
      },
    ],
  },
  subjects: {
    entity: 'subjects',
    label: 'Subjects',
    singularLabel: 'Subject',
    templateFileName: 'erp_subjects_import_template',
    matchKeyDescription: 'Matches existing subjects by Subject Code',
    fields: [
      {
        column: 'code',
        required: 'Required',
        format: 'Text (unique)',
        example: 'MATH-101',
        notes: 'Unique curriculum subject code (uppercase recommended)',
      },
      {
        column: 'name',
        required: 'Required',
        format: 'Text',
        example: 'Mathematics (Standard)',
        notes: 'Official subject title',
      },
      {
        column: 'type',
        required: 'Required',
        format: 'Core | Elective | Co-Scholastic',
        example: 'Core',
        notes: 'Curriculum classification',
      },
      {
        column: 'maxMarks',
        required: 'Required',
        format: 'Number (1-500)',
        example: '100',
        notes: 'Maximum examination marks',
      },
      {
        column: 'gradeLevel',
        required: 'Required',
        format: 'Text',
        example: 'Class 9 - Class 10',
        notes: 'Applicable grades or wing level',
      },
      {
        column: 'schoolId',
        required: 'Optional',
        format: 'School ID or Name',
        example: 'sch-leaders-cbse',
        notes: 'Defaults to active school context if blank',
      },
    ],
  },
  timetables: {
    entity: 'timetables',
    label: 'Timetables',
    singularLabel: 'Timetable Period',
    templateFileName: 'erp_timetables_import_template',
    matchKeyDescription: 'Matches existing slots by Grade + Section + Day + Period No',
    fields: [
      {
        column: 'grade',
        required: 'Required',
        format: 'Text',
        example: 'Class 10',
        notes: 'Target class / grade name',
      },
      {
        column: 'section',
        required: 'Required',
        format: 'Text',
        example: 'A',
        notes: 'Target section (e.g., A, B, C)',
      },
      {
        column: 'day',
        required: 'Required',
        format: 'Monday - Saturday',
        example: 'Monday',
        notes: 'Day of the week (accepts full name or Mon/Tue/Wed/Thu/Fri/Sat)',
      },
      {
        column: 'periodNo',
        required: 'Required',
        format: 'Number (1-12)',
        example: '1',
        notes: 'Period sequence number',
      },
      {
        column: 'timeSlot',
        required: 'Required',
        format: 'Text',
        example: '08:30 AM - 09:15 AM',
        notes: 'Start and end time range',
      },
      {
        column: 'subjectName',
        required: 'Required',
        format: 'Text',
        example: 'Mathematics',
        notes: 'Subject scheduled for the slot',
      },
      {
        column: 'teacherName',
        required: 'Required',
        format: 'Staff Name or Emp ID',
        example: 'Priyanka Sen',
        notes: 'Assigned faculty (auto-matched against live Staff directory)',
      },
      {
        column: 'schoolId',
        required: 'Optional',
        format: 'School ID or Name',
        example: 'sch-leaders-cbse',
        notes: 'Defaults to active school context if blank',
      },
      {
        column: 'campusId',
        required: 'Optional',
        format: 'Campus ID or Name',
        example: 'cmp-chennai-hq',
        notes: 'Defaults to active campus context if blank',
      },
    ],
  },
};

export interface ParsedAdminImportRow<T = unknown> {
  rowNumber: number;
  action: 'create' | 'update' | 'error';
  existingId?: string;
  summaryTitle: string;
  summarySubtitle: string;
  badgeText?: string;
  errors: string[];
  warnings: string[];
  payload?: T;
}

export interface AdminBulkParseResult<T = unknown> {
  entity: AdminBulkEntityType;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  createCount: number;
  updateCount: number;
  rows: ParsedAdminImportRow<T>[];
}

const VALID_CURRICULA: SchoolClass['curriculum'][] = [
  'CBSE',
  'ICSE',
  'IB',
  'Cambridge IGCSE',
  'State Board',
  'Matriculation',
];

const VALID_DAYS: TimetableEntry['day'][] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DAY_ALIASES: Record<string, TimetableEntry['day']> = {
  mon: 'Monday',
  monday: 'Monday',
  tue: 'Tuesday',
  tues: 'Tuesday',
  tuesday: 'Tuesday',
  wed: 'Wednesday',
  wednesday: 'Wednesday',
  thu: 'Thursday',
  thur: 'Thursday',
  thurs: 'Thursday',
  thursday: 'Thursday',
  fri: 'Friday',
  friday: 'Friday',
  sat: 'Saturday',
  saturday: 'Saturday',
};

function normalizeHeaderKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getField(
  normalizedRow: Record<string, string>,
  aliases: string[]
): string {
  for (const alias of aliases) {
    const val = normalizedRow[normalizeHeaderKey(alias)];
    if (val !== undefined && val !== '') {
      return val.trim();
    }
  }
  return '';
}

function resolveRole(raw: string): ErpRole | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const exact = ALL_ERP_ROLES.find(
    (r) =>
      r.role.toLowerCase() === cleaned.toLowerCase() ||
      r.shortCode.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact.role;
  const lower = cleaned.toLowerCase();
  if (
    lower === 'superadmin' ||
    lower === 'super admin' ||
    lower === 'admin' ||
    lower === 'org admin' ||
    lower === 'school admin' ||
    lower === 'campus admin' ||
    lower === 'hr' ||
    lower === 'accounts'
  ) {
    return normalizeLegacyRole(cleaned);
  }
  return null;
}

function resolveSchoolId(
  raw: string,
  schools: SchoolOption[],
  defaultSchoolId: string,
  allowAll = false
): string {
  const trimmed = raw.trim();
  if (!trimmed) return defaultSchoolId;
  if (allowAll && trimmed.toLowerCase() === 'all') return 'all';
  const match = schools.find(
    (s) =>
      s.id.toLowerCase() === trimmed.toLowerCase() ||
      s.shortName.toLowerCase() === trimmed.toLowerCase() ||
      s.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.id : defaultSchoolId;
}

function resolveCampusId(
  raw: string,
  schoolId: string,
  schools: SchoolOption[],
  defaultCampusId: string,
  allowAll = false
): string {
  const trimmed = raw.trim();
  if (!trimmed) return defaultCampusId;
  if (allowAll && trimmed.toLowerCase() === 'all') return 'all';
  const school = schools.find((s) => s.id === schoolId);
  const candidates = school
    ? school.campuses
    : schools.flatMap((s) => s.campuses);
  const match = candidates.find(
    (c) =>
      c.id.toLowerCase() === trimmed.toLowerCase() ||
      c.name.toLowerCase() === trimmed.toLowerCase()
  );
  return match ? match.id : defaultCampusId;
}

function resolveCurriculum(raw: string): SchoolClass['curriculum'] | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === 'igcse' || trimmed === 'cambridge') return 'Cambridge IGCSE';
  if (trimmed === 'state') return 'State Board';
  if (trimmed === 'matric') return 'Matriculation';
  const found = VALID_CURRICULA.find((c) => c.toLowerCase() === trimmed);
  return found || null;
}

function resolveSubjectType(raw: string): SchoolSubject['type'] | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed === 'core' || trimmed === 'mandatory') return 'Core';
  if (trimmed === 'elective' || trimmed === 'optional') return 'Elective';
  if (
    trimmed === 'co-scholastic' ||
    trimmed === 'coscholastic' ||
    trimmed === 'co scholastic' ||
    trimmed === 'activity'
  ) {
    return 'Co-Scholastic';
  }
  return null;
}

function matchStaffMember(raw: string, staffList: Staff[]): Staff | undefined {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return undefined;
  return staffList.find(
    (s) =>
      s.name.toLowerCase() === trimmed ||
      s.empId.toLowerCase() === trimmed ||
      s.name.toLowerCase().includes(trimmed)
  );
}

export function buildSampleTemplateRows(
  entity: AdminBulkEntityType,
  schools: SchoolOption[],
  staffList: Staff[]
): Record<string, string | number>[] {
  const firstSchool = schools[0]?.id || 'sch-leaders-cbse';
  const secondSchool = schools[1]?.id || firstSchool;
  const firstCampus = schools[0]?.campuses[0]?.id || 'cmp-chennai-hq';
  const secondCampus = schools[1]?.campuses[0]?.id || firstCampus;
  const activeStaff = staffList.filter((s) => s.status !== 'Archived');
  const teacher1 = activeStaff[0]?.name || 'Priyanka Sen';
  const teacher2 = activeStaff[1]?.name || 'Nalini Swaminathan';
  const teacher3 = activeStaff[2]?.name || 'Rajeshwar Prasad';

  switch (entity) {
    case 'users':
      return [
        {
          username: 'coord_karthik',
          fullName: 'Karthik Narayanan',
          email: 'karthik.n@leadersgroup.edu.in',
          phone: '+91 98401 66110',
          role: 'Academic Coordinator',
          schoolId: firstSchool,
          campusId: firstCampus,
          department: 'Academics',
          status: 'Active',
        },
        {
          username: 'teacher_divya',
          fullName: 'Divya Bharathi S.',
          email: 'divya.b@leadersgroup.edu.in',
          phone: '+91 98402 77214',
          role: 'Class Teacher',
          schoolId: firstSchool,
          campusId: firstCampus,
          department: 'Mathematics',
          status: 'Active',
        },
        {
          username: 'accountant_ravi',
          fullName: 'Ravichandran M.',
          email: 'ravi.accounts@leadersgroup.edu.in',
          phone: '+91 98403 88322',
          role: 'Accountant',
          schoolId: secondSchool,
          campusId: 'all',
          department: 'Finance & Accounts',
          status: 'Active',
        },
        {
          username: 'librarian_geetha',
          fullName: 'Geetha Krishnan',
          email: 'geetha.lib@leadersgroup.edu.in',
          phone: '+91 98404 99430',
          role: 'Librarian',
          schoolId: secondSchool,
          campusId: secondCampus,
          department: 'Central Library',
          status: 'Active',
        },
      ];

    case 'classes':
      return [
        {
          gradeName: 'Class 6',
          curriculum: 'CBSE',
          sections: 'A, B, C',
          roomNo: 'Block B - Room 201',
          classTeacher: teacher1,
          schoolId: firstSchool,
          campusId: firstCampus,
        },
        {
          gradeName: 'Class 7',
          curriculum: 'CBSE',
          sections: 'A, B',
          roomNo: 'Block B - Room 205',
          classTeacher: teacher2,
          schoolId: firstSchool,
          campusId: firstCampus,
        },
        {
          gradeName: 'Grade 8 (ICSE)',
          curriculum: 'ICSE',
          sections: 'A, B',
          roomNo: 'Academic Wing - 302',
          classTeacher: teacher3,
          schoolId: secondSchool,
          campusId: secondCampus,
        },
      ];

    case 'subjects':
      return [
        {
          code: 'PHY-101',
          name: 'Physics (Mechanics & Optics)',
          type: 'Core',
          maxMarks: 100,
          gradeLevel: 'Class 11 - Class 12',
          schoolId: firstSchool,
        },
        {
          code: 'CS-204',
          name: 'Computer Science & Python',
          type: 'Elective',
          maxMarks: 100,
          gradeLevel: 'Class 9 - Class 12',
          schoolId: firstSchool,
        },
        {
          code: 'ROB-050',
          name: 'Robotics & AI Tinkering Lab',
          type: 'Co-Scholastic',
          maxMarks: 50,
          gradeLevel: 'Class 6 - Class 10',
          schoolId: secondSchool,
        },
      ];

    case 'timetables':
      return [
        {
          grade: 'Class 10',
          section: 'A',
          day: 'Tuesday',
          periodNo: 1,
          timeSlot: '08:30 AM - 09:15 AM',
          subjectName: 'Mathematics',
          teacherName: teacher1,
          schoolId: firstSchool,
          campusId: firstCampus,
        },
        {
          grade: 'Class 10',
          section: 'A',
          day: 'Tuesday',
          periodNo: 2,
          timeSlot: '09:15 AM - 10:00 AM',
          subjectName: 'Physics',
          teacherName: teacher2,
          schoolId: firstSchool,
          campusId: firstCampus,
        },
        {
          grade: 'Class 10',
          section: 'B',
          day: 'Wednesday',
          periodNo: 3,
          timeSlot: '10:15 AM - 11:00 AM',
          subjectName: 'English Literature',
          teacherName: teacher3,
          schoolId: firstSchool,
          campusId: firstCampus,
        },
      ];
  }
}

export function downloadAdminSampleTemplate(
  entity: AdminBulkEntityType,
  format: 'xlsx' | 'csv',
  schools: SchoolOption[],
  staffList: Staff[]
): void {
  const schema = ADMIN_IMPORT_SCHEMAS[entity];
  const sampleRows = buildSampleTemplateRows(entity, schools, staffList);

  const dataSheet = XLSX.utils.json_to_sheet(sampleRows);
  dataSheet['!cols'] = schema.fields.map((f) => ({
    wch: Math.max(f.column.length + 4, f.example.length + 6, 18),
  }));

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(dataSheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.templateFileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Import Data');

  const guideRows = schema.fields.map((f) => ({
    Column: f.column,
    Requirement: f.required,
    'Allowed Format / Values': f.format,
    Example: f.example,
    Notes: f.notes,
  }));
  const guideSheet = XLSX.utils.json_to_sheet(guideRows);
  guideSheet['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 36 },
    { wch: 28 },
    { wch: 52 },
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Field Guide');

  XLSX.writeFile(workbook, `${schema.templateFileName}.xlsx`);
}

export async function parseAdminImportFile(
  file: File,
  entity: AdminBulkEntityType,
  context: {
    schools: SchoolOption[];
    staffList: Staff[];
    defaultSchoolId: string;
    defaultCampusId: string;
    existingUsers: SystemUser[];
    existingClasses: SchoolClass[];
    existingSubjects: SchoolSubject[];
    existingTimetables: TimetableEntry[];
  }
): Promise<AdminBulkParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawObjects = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  const rows: ParsedAdminImportRow[] = [];
  const seenKeys = new Set<string>();

  const defaultSchool =
    context.defaultSchoolId === 'all'
      ? context.schools[0]?.id || 'sch-leaders-cbse'
      : context.defaultSchoolId;
  const defaultCampus =
    context.defaultCampusId === 'all'
      ? context.schools.find((s) => s.id === defaultSchool)?.campuses[0]?.id ||
        'cmp-chennai-hq'
      : context.defaultCampusId;

  rawObjects.forEach((rawObj, idx) => {
    const rowNumber = idx + 2; // Excel row number (header = row 1)
    const normalized: Record<string, string> = {};
    Object.entries(rawObj).forEach(([k, v]) => {
      normalized[normalizeHeaderKey(k)] = String(v ?? '').trim();
    });

    // Skip completely empty rows
    const hasAnyValue = Object.values(normalized).some((v) => v.length > 0);
    if (!hasAnyValue) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (entity === 'users') {
      const username = getField(normalized, ['username', 'user_name', 'login', 'userId']);
      const fullName = getField(normalized, ['fullName', 'full_name', 'name', 'displayName']);
      const email = getField(normalized, ['email', 'emailAddress', 'email_id']);
      const phone = getField(normalized, ['phone', 'mobile', 'phoneNumber', 'contact']);
      const roleRaw = getField(normalized, ['role', 'userRole', 'rbacRole']);
      const schoolRaw = getField(normalized, ['schoolId', 'school', 'schoolName']);
      const campusRaw = getField(normalized, ['campusId', 'campus', 'campusName']);
      const department = getField(normalized, ['department', 'dept']) || 'General';
      const statusRaw = getField(normalized, ['status', 'accountStatus']);

      if (!username) errors.push('Missing required "username".');
      if (!fullName) errors.push('Missing required "fullName".');
      if (!email || !email.includes('@')) errors.push('Valid "email" is required.');

      const resolvedRole = resolveRole(roleRaw);
      if (!resolvedRole) {
        errors.push(`Invalid role "${roleRaw || '(blank)'}". Must match one of the 19 ERP roles.`);
      }

      const status: 'Active' | 'Inactive' =
        statusRaw.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';

      const dedupeKey = username.toLowerCase();
      if (username && seenKeys.has(dedupeKey)) {
        errors.push(`Duplicate username "${username}" within uploaded file.`);
      }
      if (username) seenKeys.add(dedupeKey);

      const resolvedSchool = resolveSchoolId(
        schoolRaw,
        context.schools,
        resolvedRole === 'Super Administrator' ||
          resolvedRole === 'Organization Administrator'
          ? 'all'
          : defaultSchool,
        true
      );
      const resolvedCampus = resolveCampusId(
        campusRaw,
        resolvedSchool,
        context.schools,
        resolvedSchool === 'all' ? 'all' : defaultCampus,
        true
      );

      const existing = context.existingUsers.find(
        (u) =>
          (username && u.username.toLowerCase() === username.toLowerCase()) ||
          (email && u.email.toLowerCase() === email.toLowerCase())
      );

      if (errors.length > 0) {
        rows.push({
          rowNumber,
          action: 'error',
          summaryTitle: fullName || username || `Row ${rowNumber}`,
          summarySubtitle: email || roleRaw || 'Invalid user record',
          errors,
          warnings,
        });
        return;
      }

      const payload: Omit<SystemUser, 'id'> = {
        username,
        fullName,
        email,
        phone: phone || '+91 98400 00000',
        role: resolvedRole!,
        schoolId: resolvedSchool,
        campusId: resolvedCampus,
        department,
        status,
        lastLogin: existing?.lastLogin || 'Never (Bulk Imported)',
        passwordResetRequired: true,
      };

      rows.push({
        rowNumber,
        action: existing ? 'update' : 'create',
        existingId: existing?.id,
        summaryTitle: `${fullName} (@${username})`,
        summarySubtitle: `${resolvedRole} · ${email}`,
        badgeText: status,
        errors: [],
        warnings,
        payload,
      });
      return;
    }

    if (entity === 'classes') {
      const gradeName = getField(normalized, ['gradeName', 'grade', 'className', 'class']);
      const curriculumRaw = getField(normalized, ['curriculum', 'board', 'curriculumBoard', 'educationBoard']);
      const sectionsRaw = getField(normalized, ['sections', 'section', 'sectionList']);
      const roomNo = getField(normalized, ['roomNo', 'roomNumber', 'room', 'classroom']);
      const teacherRaw = getField(normalized, ['classTeacher', 'classTeacherIncharge', 'teacher', 'teacherName']);
      const schoolRaw = getField(normalized, ['schoolId', 'school', 'schoolName']);
      const campusRaw = getField(normalized, ['campusId', 'campus', 'campusName']);

      if (!gradeName) errors.push('Missing required "gradeName".');
      const curriculum = resolveCurriculum(curriculumRaw);
      if (!curriculum) {
        errors.push(
          `Invalid curriculum "${curriculumRaw || '(blank)'}". Allowed: ${VALID_CURRICULA.join(', ')}.`
        );
      }

      const sections = sectionsRaw
        .split(/[,;|/]/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (sections.length === 0) {
        errors.push('At least one section is required (e.g., "A, B, C").');
      }
      if (!roomNo) errors.push('Missing required "roomNo".');

      const resolvedSchool = resolveSchoolId(
        schoolRaw,
        context.schools,
        defaultSchool,
        false
      );
      const resolvedCampus = resolveCampusId(
        campusRaw,
        resolvedSchool,
        context.schools,
        defaultCampus,
        false
      );

      let resolvedTeacher = teacherRaw;
      if (teacherRaw) {
        const matchedStaff = matchStaffMember(teacherRaw, context.staffList);
        if (matchedStaff) {
          resolvedTeacher = matchedStaff.name;
        } else {
          warnings.push(`Teacher "${teacherRaw}" not found in Staff directory; stored as text.`);
        }
      }

      const dedupeKey = `${resolvedSchool}::${gradeName.toLowerCase()}`;
      if (gradeName && seenKeys.has(dedupeKey)) {
        errors.push(`Duplicate grade "${gradeName}" for the same school in file.`);
      }
      if (gradeName) seenKeys.add(dedupeKey);

      const existing = context.existingClasses.find(
        (c) =>
          c.gradeName.toLowerCase() === gradeName.toLowerCase() &&
          (c.schoolId || 'sch-leaders-cbse') === resolvedSchool
      );

      if (errors.length > 0) {
        rows.push({
          rowNumber,
          action: 'error',
          summaryTitle: gradeName || `Row ${rowNumber}`,
          summarySubtitle: `${curriculumRaw || 'No Board'} · ${roomNo || 'No Room'}`,
          errors,
          warnings,
        });
        return;
      }

      const payload: Omit<SchoolClass, 'id'> = {
        schoolId: resolvedSchool,
        campusId: resolvedCampus,
        gradeName,
        curriculum: curriculum!,
        sections,
        roomNo,
        classTeacher: resolvedTeacher || undefined,
      };

      rows.push({
        rowNumber,
        action: existing ? 'update' : 'create',
        existingId: existing?.id,
        summaryTitle: `${gradeName} (${curriculum})`,
        summarySubtitle: `Sections: ${sections.join(', ')} · Room: ${roomNo} · Teacher: ${resolvedTeacher || 'Unassigned'}`,
        badgeText: `${sections.length} sec`,
        errors: [],
        warnings,
        payload,
      });
      return;
    }

    if (entity === 'subjects') {
      const code = getField(normalized, ['code', 'subjectCode', 'subCode']).toUpperCase();
      const name = getField(normalized, ['name', 'subjectName', 'title']);
      const typeRaw = getField(normalized, ['type', 'subjectType', 'category']);
      const maxMarksRaw = getField(normalized, ['maxMarks', 'max_marks', 'marks', 'totalMarks']);
      const gradeLevel = getField(normalized, ['gradeLevel', 'grade_level', 'grades', 'applicableGrades']);
      const schoolRaw = getField(normalized, ['schoolId', 'school', 'schoolName']);

      if (!code) errors.push('Missing required "code".');
      if (!name) errors.push('Missing required "name".');
      const subjectType = resolveSubjectType(typeRaw);
      if (!subjectType) {
        errors.push(
          `Invalid subject type "${typeRaw || '(blank)'}". Allowed: Core, Elective, Co-Scholastic.`
        );
      }

      const maxMarks = Number(maxMarksRaw);
      if (!maxMarksRaw || Number.isNaN(maxMarks) || maxMarks <= 0 || maxMarks > 500) {
        errors.push('Valid "maxMarks" (1 to 500) is required.');
      }
      if (!gradeLevel) errors.push('Missing required "gradeLevel".');

      if (code && seenKeys.has(code)) {
        errors.push(`Duplicate subject code "${code}" within uploaded file.`);
      }
      if (code) seenKeys.add(code);

      const resolvedSchool = resolveSchoolId(
        schoolRaw,
        context.schools,
        defaultSchool,
        false
      );

      const existing = context.existingSubjects.find(
        (s) => s.code.toLowerCase() === code.toLowerCase()
      );

      if (errors.length > 0) {
        rows.push({
          rowNumber,
          action: 'error',
          summaryTitle: code || name || `Row ${rowNumber}`,
          summarySubtitle: `${name || 'No Name'} · ${typeRaw || 'No Type'}`,
          errors,
          warnings,
        });
        return;
      }

      const payload: Omit<SchoolSubject, 'id'> = {
        schoolId: resolvedSchool,
        code,
        name,
        type: subjectType!,
        maxMarks: Math.round(maxMarks),
        gradeLevel,
      };

      rows.push({
        rowNumber,
        action: existing ? 'update' : 'create',
        existingId: existing?.id,
        summaryTitle: `${code} — ${name}`,
        summarySubtitle: `${subjectType} · Max Marks: ${Math.round(maxMarks)} · ${gradeLevel}`,
        badgeText: subjectType!,
        errors: [],
        warnings,
        payload,
      });
      return;
    }

    // Timetables
    const grade = getField(normalized, ['grade', 'gradeName', 'className', 'class']);
    const section = getField(normalized, ['section', 'sec']).toUpperCase();
    const dayRaw = getField(normalized, ['day', 'dayOfWeek', 'weekday']);
    const periodNoRaw = getField(normalized, ['periodNo', 'periodNumber', 'period', 'slotNo']);
    const timeSlot = getField(normalized, ['timeSlot', 'time', 'timing', 'slotTime']);
    const subjectName = getField(normalized, ['subjectName', 'subject']);
    const teacherRaw = getField(normalized, ['teacherName', 'teacher', 'faculty', 'staffName']);
    const schoolRaw = getField(normalized, ['schoolId', 'school', 'schoolName']);
    const campusRaw = getField(normalized, ['campusId', 'campus', 'campusName']);

    if (!grade) errors.push('Missing required "grade".');
    if (!section) errors.push('Missing required "section".');
    const resolvedDay = DAY_ALIASES[dayRaw.toLowerCase()];
    if (!resolvedDay) {
      errors.push(`Invalid day "${dayRaw || '(blank)'}". Allowed: ${VALID_DAYS.join(', ')}.`);
    }
    const periodNo = Number(periodNoRaw);
    if (!periodNoRaw || Number.isNaN(periodNo) || periodNo < 1 || periodNo > 12) {
      errors.push('Valid "periodNo" (1 to 12) is required.');
    }
    if (!timeSlot) errors.push('Missing required "timeSlot".');
    if (!subjectName) errors.push('Missing required "subjectName".');
    if (!teacherRaw) errors.push('Missing required "teacherName".');

    const resolvedSchool = resolveSchoolId(
      schoolRaw,
      context.schools,
      defaultSchool,
      false
    );
    const resolvedCampus = resolveCampusId(
      campusRaw,
      resolvedSchool,
      context.schools,
      defaultCampus,
      false
    );

    let resolvedTeacher = teacherRaw;
    if (teacherRaw) {
      const matchedStaff = matchStaffMember(teacherRaw, context.staffList);
      if (matchedStaff) {
        resolvedTeacher = matchedStaff.name;
      } else {
        warnings.push(`Teacher "${teacherRaw}" not found in Staff directory; stored as text.`);
      }
    }

    const dedupeKey = `${resolvedSchool}::${grade.toLowerCase()}::${section}::${resolvedDay || ''}::${periodNo}`;
    if (grade && section && resolvedDay && !Number.isNaN(periodNo)) {
      if (seenKeys.has(dedupeKey)) {
        errors.push(
          `Duplicate timetable slot (${grade} ${section} · ${resolvedDay} P${periodNo}) in file.`
        );
      }
      seenKeys.add(dedupeKey);
    }

    const existing = context.existingTimetables.find(
      (t) =>
        t.grade.toLowerCase() === grade.toLowerCase() &&
        t.section.toUpperCase() === section &&
        t.day === resolvedDay &&
        t.periodNo === Math.round(periodNo) &&
        (t.schoolId || 'sch-leaders-cbse') === resolvedSchool
    );

    if (errors.length > 0) {
      rows.push({
        rowNumber,
        action: 'error',
        summaryTitle: `${grade || 'No Grade'} ${section || ''} · ${dayRaw || 'No Day'}`,
        summarySubtitle: `${subjectName || 'No Subject'} · ${teacherRaw || 'No Teacher'}`,
        errors,
        warnings,
      });
      return;
    }

    const payload: Omit<TimetableEntry, 'id'> = {
      schoolId: resolvedSchool,
      campusId: resolvedCampus,
      grade,
      section,
      day: resolvedDay!,
      periodNo: Math.round(periodNo),
      timeSlot,
      subjectName,
      teacherName: resolvedTeacher,
    };

    rows.push({
      rowNumber,
      action: existing ? 'update' : 'create',
      existingId: existing?.id,
      summaryTitle: `${grade} Sec ${section} · ${resolvedDay} P${Math.round(periodNo)}`,
      summarySubtitle: `${subjectName} · ${resolvedTeacher} · ${timeSlot}`,
      badgeText: `P${Math.round(periodNo)}`,
      errors: [],
      warnings,
      payload,
    });
  });

  const validRows = rows.filter((r) => r.action !== 'error').length;
  const errorRows = rows.filter((r) => r.action === 'error').length;
  const createCount = rows.filter((r) => r.action === 'create').length;
  const updateCount = rows.filter((r) => r.action === 'update').length;

  return {
    entity,
    fileName: file.name,
    totalRows: rows.length,
    validRows,
    errorRows,
    createCount,
    updateCount,
    rows,
  };
}
