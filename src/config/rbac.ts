import {
  AccessScope,
  CrudPermissionSet,
  ErpRole,
  MenuOperationPermissions,
  NavSection,
  RoleMenuPermissionMap,
  RolePermissionMatrix,
} from '../types';

export interface RoleDefinition {
  index: number;
  role: ErpRole;
  shortCode: string;
  scope: AccessScope;
  description: string;
  defaultSection: NavSection;
  defaultSubItem: string;
  sampleAccount: {
    username: string;
    fullName: string;
    initials: string;
    email: string;
    schoolId: string;
    campusId: string;
    department: string;
  };
}

export const CORE_MODULE_IDS: NavSection[] = [
  'HOME',
  'ORGANIZATION',
  'ACADEMICS',
  'STUDENT',
  'STAFFS',
  'ATTENDANCE',
  'FEE MANAGEMENT',
  'MARKCHART',
  'HR',
  'FINANCE',
  'LIBRARY',
  'TRANSPORT',
  'HOSTEL',
  'INVENTORY',
  'COMMUNICATIONS',
  'REPORTS',
  'ADMIN',
];

const FULL: CrudPermissionSet = { create: true, read: true, update: true, delete: true };
const CRU: CrudPermissionSet = { create: true, read: true, update: true, delete: false };
const RU: CrudPermissionSet = { create: false, read: true, update: true, delete: false };
const READ: CrudPermissionSet = { create: false, read: true, update: false, delete: false };
const NONE: CrudPermissionSet = { create: false, read: false, update: false, delete: false };

function allModules(perm: CrudPermissionSet): Partial<Record<NavSection, CrudPermissionSet>> {
  const result: Partial<Record<NavSection, CrudPermissionSet>> = {};
  CORE_MODULE_IDS.forEach((m) => {
    result[m] = { ...perm };
  });
  return result;
}

function buildRolePerms(
  overrides: Partial<Record<NavSection, CrudPermissionSet>>
): Partial<Record<NavSection, CrudPermissionSet>> {
  const base = allModules(NONE);
  return { ...base, ...overrides };
}

export const ALL_ERP_ROLES: RoleDefinition[] = [
  {
    index: 1,
    role: 'Super Administrator',
    shortCode: 'SUPER_ADMIN',
    scope: 'Platform',
    description: 'Unrestricted platform governance across all organizations, schools, campuses, roles, and MySQL architecture.',
    defaultSection: 'HOME',
    defaultSubItem: 'dash-overall',
    sampleAccount: {
      username: 'superadmin_sethu',
      fullName: 'Dr. Sethu Ramanathan',
      initials: 'SR',
      email: 'superadmin@leadersgroup.edu.in',
      schoolId: 'all',
      campusId: 'all',
      department: 'Executive Governance',
    },
  },
  {
    index: 2,
    role: 'Organization Administrator',
    shortCode: 'ORG_ADMIN',
    scope: 'Organization',
    description: 'Centralized oversight of affiliated schools, multi-campus policies, finance, HR, and cross-school reporting.',
    defaultSection: 'ORGANIZATION',
    defaultSubItem: 'org-profile',
    sampleAccount: {
      username: 'org_meera',
      fullName: 'Meera Sundararajan',
      initials: 'MS',
      email: 'org.admin@leadersgroup.edu.in',
      schoolId: 'all',
      campusId: 'all',
      department: 'Trust Operations',
    },
  },
  {
    index: 3,
    role: 'School Administrator',
    shortCode: 'SCH_ADMIN',
    scope: 'School',
    description: 'Full operational administration isolated strictly to one assigned school and all its campuses.',
    defaultSection: 'HOME',
    defaultSubItem: 'dash-school',
    sampleAccount: {
      username: 'sch_admin_cbse',
      fullName: 'Vikramaditya Rao',
      initials: 'VR',
      email: 'school.admin@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'School Administration',
    },
  },
  {
    index: 4,
    role: 'Campus Administrator',
    shortCode: 'CMP_ADMIN',
    scope: 'Campus',
    description: 'Day-to-day operational control locked strictly to one assigned campus branch.',
    defaultSection: 'HOME',
    defaultSubItem: 'dash-campus',
    sampleAccount: {
      username: 'cmp_admin_chn01',
      fullName: 'Karthikeyan N.',
      initials: 'KN',
      email: 'campus.chn01@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Campus Operations',
    },
  },
  {
    index: 5,
    role: 'Principal',
    shortCode: 'PRINCIPAL',
    scope: 'School',
    description: 'Academic and institutional head of a school with approval rights over academics, staff, exams, and circulars.',
    defaultSection: 'HOME',
    defaultSubItem: 'dash-school',
    sampleAccount: {
      username: 'principal_icse',
      fullName: 'Dr. Revathi Subramanian',
      initials: 'RS',
      email: 'principal@leadersicse.edu.in',
      schoolId: 'sch-leaders-icse',
      campusId: 'all',
      department: 'Academic Leadership',
    },
  },
  {
    index: 6,
    role: 'Vice Principal',
    shortCode: 'VICE_PRINCIPAL',
    scope: 'Campus',
    description: 'Oversees campus discipline, timetables, faculty attendance, examinations, and student affairs.',
    defaultSection: 'ACADEMICS',
    defaultSubItem: 'acad-timetable',
    sampleAccount: {
      username: 'vp_malini',
      fullName: 'Malini Swaminathan',
      initials: 'MW',
      email: 'vp.main@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Academic Leadership',
    },
  },
  {
    index: 7,
    role: 'Academic Coordinator',
    shortCode: 'ACAD_COORD',
    scope: 'Campus',
    description: 'Manages classes, sections, subjects, syllabus, lesson plans, timetables, and exam schedules.',
    defaultSection: 'ACADEMICS',
    defaultSubItem: 'acad-classes',
    sampleAccount: {
      username: 'coord_kavitha',
      fullName: 'Kavitha Menon',
      initials: 'KM',
      email: 'academics@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Curriculum & Quality',
    },
  },
  {
    index: 8,
    role: 'Admission Officer',
    shortCode: 'ADMISSION_OFF',
    scope: 'School',
    description: 'Handles admission enquiries, application processing, new student registration, documents, and TC records.',
    defaultSection: 'STUDENT',
    defaultSubItem: 'std-enquiries',
    sampleAccount: {
      username: 'admissions_divya',
      fullName: 'Divya Narayanan',
      initials: 'DN',
      email: 'admissions@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'Admissions Desk',
    },
  },
  {
    index: 9,
    role: 'Accountant',
    shortCode: 'ACCOUNTANT',
    scope: 'School',
    description: 'Manages fee structures, fee collection, receipts, refunds, general ledger, vouchers, and financial reports.',
    defaultSection: 'FEE MANAGEMENT',
    defaultSubItem: 'fee-collection',
    sampleAccount: {
      username: 'accountant_anita',
      fullName: 'Anita Subramanian',
      initials: 'AS',
      email: 'accounts@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'Finance & Accounts',
    },
  },
  {
    index: 10,
    role: 'HR Manager',
    shortCode: 'HR_MANAGER',
    scope: 'School',
    description: 'Manages staff directory, recruitment, leave approvals, payroll, salary components, and payslips.',
    defaultSection: 'HR',
    defaultSubItem: 'hr-payroll',
    sampleAccount: {
      username: 'hr_deepak',
      fullName: 'Deepak Venkataraman',
      initials: 'DV',
      email: 'hr@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'Human Resources',
    },
  },
  {
    index: 11,
    role: 'Teacher',
    shortCode: 'TEACHER',
    scope: 'Campus',
    description: 'Delivers classes, homework, assignments, lesson plans, subject marks entry, and library access.',
    defaultSection: 'ACADEMICS',
    defaultSubItem: 'acad-homework',
    sampleAccount: {
      username: 'teacher_rajesh',
      fullName: 'Dr. Rajesh Sharma',
      initials: 'RS',
      email: 'rajesh.sharma@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Sciences',
    },
  },
  {
    index: 12,
    role: 'Class Teacher',
    shortCode: 'CLASS_TEACHER',
    scope: 'Campus',
    description: 'All Teacher permissions plus daily class attendance, student promotion review, and parent communication.',
    defaultSection: 'ATTENDANCE',
    defaultSubItem: 'att-student-daily',
    sampleAccount: {
      username: 'classteacher_priya',
      fullName: 'Priya Natarajan',
      initials: 'PN',
      email: 'priya.n@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-adambakkam',
      department: 'Mathematics',
    },
  },
  {
    index: 13,
    role: 'Librarian',
    shortCode: 'LIBRARIAN',
    scope: 'Campus',
    description: 'Operates library book catalog, issue/return circulation, reservations, fines, and library analytics.',
    defaultSection: 'LIBRARY',
    defaultSubItem: 'lib-inventory',
    sampleAccount: {
      username: 'librarian_arjun',
      fullName: 'Arjun Deshmukh',
      initials: 'AD',
      email: 'library@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Library Services',
    },
  },
  {
    index: 14,
    role: 'Transport Manager',
    shortCode: 'TRANSPORT_MGR',
    scope: 'School',
    description: 'Manages fleet vehicles, drivers, routes, stops, student route allocation, maintenance, and transport fees.',
    defaultSection: 'TRANSPORT',
    defaultSubItem: 'trn-routes',
    sampleAccount: {
      username: 'transport_murugan',
      fullName: 'S. Muruganandam',
      initials: 'SM',
      email: 'transport@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'Fleet & Logistics',
    },
  },
  {
    index: 15,
    role: 'Hostel Warden',
    shortCode: 'HOSTEL_WARDEN',
    scope: 'Campus',
    description: 'Manages hostel blocks, rooms, beds, student allocation, hostel attendance, visitors, and mess plans.',
    defaultSection: 'HOSTEL',
    defaultSubItem: 'hst-allocation',
    sampleAccount: {
      username: 'warden_suresh',
      fullName: 'Suresh Babu K.',
      initials: 'SB',
      email: 'hostel@leadersib.edu.in',
      schoolId: 'sch-leaders-ib',
      campusId: 'cmp-ecr',
      department: 'Residential Life',
    },
  },
  {
    index: 16,
    role: 'Inventory Manager',
    shortCode: 'INVENTORY_MGR',
    scope: 'School',
    description: 'Controls institutional assets, vendors, purchase orders, goods receipt, stock issues, and disposals.',
    defaultSection: 'INVENTORY',
    defaultSubItem: 'inv-stock',
    sampleAccount: {
      username: 'inventory_ramesh',
      fullName: 'Ramesh Iyer',
      initials: 'RI',
      email: 'inventory@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'all',
      department: 'Procurement & Stores',
    },
  },
  {
    index: 17,
    role: 'Front Office Staff',
    shortCode: 'FRONT_OFFICE',
    scope: 'Campus',
    description: 'Handles walk-in enquiries, visitor register, circulars, student directory lookup, and fee receipt desk.',
    defaultSection: 'COMMUNICATIONS',
    defaultSubItem: 'comm-circulars',
    sampleAccount: {
      username: 'frontoffice_lakshmi',
      fullName: 'Lakshmi Prabha',
      initials: 'LP',
      email: 'frontdesk@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Front Office',
    },
  },
  {
    index: 18,
    role: 'Parent',
    shortCode: 'PARENT',
    scope: 'Personal',
    description: 'Read-only portal for ward attendance, fee receipts, exam report cards, timetable, bus route, and notices.',
    defaultSection: 'HOME',
    defaultSubItem: 'dash-overall',
    sampleAccount: {
      username: 'parent_sharma',
      fullName: 'Rajesh Sharma (Parent)',
      initials: 'PS',
      email: 'rajesh.sharma@example.com',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Parent Portal',
    },
  },
  {
    index: 19,
    role: 'Student',
    shortCode: 'STUDENT',
    scope: 'Personal',
    description: 'Self-service student access to timetable, homework, assignments, attendance summary, report cards, and library.',
    defaultSection: 'ACADEMICS',
    defaultSubItem: 'acad-homework',
    sampleAccount: {
      username: 'student_aarav',
      fullName: 'Aarav Sharma (Class 10-A)',
      initials: 'AS',
      email: 'aarav.sharma@leaderscbse.edu.in',
      schoolId: 'sch-leaders-cbse',
      campusId: 'cmp-chennai-hq',
      department: 'Class 10 - Section A',
    },
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionMatrix = {
  'Super Administrator': allModules(FULL),
  'Organization Administrator': {
    ...allModules(FULL),
    ADMIN: CRU,
  },
  'School Administrator': {
    ...allModules(FULL),
    ORGANIZATION: RU,
    ADMIN: CRU,
  },
  'Campus Administrator': buildRolePerms({
    HOME: READ,
    ORGANIZATION: READ,
    ACADEMICS: CRU,
    STUDENT: CRU,
    STAFFS: CRU,
    ATTENDANCE: FULL,
    'FEE MANAGEMENT': CRU,
    MARKCHART: CRU,
    HR: READ,
    FINANCE: READ,
    LIBRARY: CRU,
    TRANSPORT: CRU,
    HOSTEL: CRU,
    INVENTORY: CRU,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
    ADMIN: READ,
  }),
  Principal: buildRolePerms({
    HOME: READ,
    ORGANIZATION: READ,
    ACADEMICS: FULL,
    STUDENT: CRU,
    STAFFS: CRU,
    ATTENDANCE: CRU,
    'FEE MANAGEMENT': READ,
    MARKCHART: FULL,
    HR: RU,
    FINANCE: READ,
    LIBRARY: READ,
    TRANSPORT: READ,
    HOSTEL: READ,
    INVENTORY: READ,
    COMMUNICATIONS: FULL,
    REPORTS: READ,
    ADMIN: READ,
  }),
  'Vice Principal': buildRolePerms({
    HOME: READ,
    ACADEMICS: FULL,
    STUDENT: CRU,
    STAFFS: RU,
    ATTENDANCE: CRU,
    MARKCHART: CRU,
    LIBRARY: READ,
    TRANSPORT: READ,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  'Academic Coordinator': buildRolePerms({
    HOME: READ,
    ACADEMICS: FULL,
    STUDENT: READ,
    STAFFS: READ,
    ATTENDANCE: READ,
    MARKCHART: FULL,
    LIBRARY: READ,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  'Admission Officer': buildRolePerms({
    HOME: READ,
    STUDENT: FULL,
    'FEE MANAGEMENT': READ,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  Accountant: buildRolePerms({
    HOME: READ,
    STUDENT: READ,
    'FEE MANAGEMENT': FULL,
    HR: READ,
    FINANCE: FULL,
    TRANSPORT: READ,
    HOSTEL: READ,
    INVENTORY: READ,
    REPORTS: READ,
  }),
  'HR Manager': buildRolePerms({
    HOME: READ,
    STAFFS: FULL,
    ATTENDANCE: CRU,
    HR: FULL,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  Teacher: buildRolePerms({
    HOME: READ,
    ACADEMICS: CRU,
    STUDENT: READ,
    ATTENDANCE: CRU,
    MARKCHART: CRU,
    LIBRARY: READ,
    COMMUNICATIONS: CRU,
  }),
  'Class Teacher': buildRolePerms({
    HOME: READ,
    ACADEMICS: CRU,
    STUDENT: RU,
    ATTENDANCE: FULL,
    MARKCHART: CRU,
    LIBRARY: READ,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  Librarian: buildRolePerms({
    HOME: READ,
    STUDENT: READ,
    LIBRARY: FULL,
    REPORTS: READ,
  }),
  'Transport Manager': buildRolePerms({
    HOME: READ,
    STUDENT: READ,
    TRANSPORT: FULL,
    'FEE MANAGEMENT': READ,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  'Hostel Warden': buildRolePerms({
    HOME: READ,
    STUDENT: READ,
    ATTENDANCE: CRU,
    HOSTEL: FULL,
    COMMUNICATIONS: CRU,
    REPORTS: READ,
  }),
  'Inventory Manager': buildRolePerms({
    HOME: READ,
    INVENTORY: FULL,
    FINANCE: READ,
    REPORTS: READ,
  }),
  'Front Office Staff': buildRolePerms({
    HOME: READ,
    STUDENT: CRU,
    'FEE MANAGEMENT': CRU,
    HOSTEL: READ,
    COMMUNICATIONS: CRU,
  }),
  Parent: buildRolePerms({
    HOME: READ,
    ACADEMICS: READ,
    ATTENDANCE: READ,
    'FEE MANAGEMENT': READ,
    MARKCHART: READ,
    TRANSPORT: READ,
    COMMUNICATIONS: READ,
  }),
  Student: buildRolePerms({
    HOME: READ,
    ACADEMICS: READ,
    ATTENDANCE: READ,
    MARKCHART: READ,
    LIBRARY: READ,
    COMMUNICATIONS: READ,
  }),
};

export function getRoleDefinition(role: ErpRole): RoleDefinition {
  return ALL_ERP_ROLES.find((r) => r.role === role) || ALL_ERP_ROLES[0];
}

export function normalizeLegacyRole(input: string): ErpRole {
  const exact = ALL_ERP_ROLES.find(
    (r) => r.role.toLowerCase() === input.trim().toLowerCase()
  );
  if (exact) return exact.role;
  const lower = input.trim().toLowerCase();
  if (lower === 'admin' || lower === 'super admin') return 'Super Administrator';
  if (lower === 'org_admin') return 'Organization Administrator';
  if (lower === 'school_admin') return 'School Administrator';
  if (lower === 'campus_admin') return 'Campus Administrator';
  if (lower === 'accountant' || lower === 'cashier') return 'Accountant';
  if (lower === 'teacher') return 'Teacher';
  if (lower === 'manager') return 'Inventory Manager';
  if (lower === 'transport staff') return 'Transport Manager';
  return 'Super Administrator';
}

export function getModuleCrud(
  role: ErpRole,
  moduleId: NavSection,
  matrix: RolePermissionMatrix
): CrudPermissionSet {
  const roleMap = matrix[role] || DEFAULT_ROLE_PERMISSIONS[role];
  const direct = roleMap?.[moduleId];
  if (direct) return direct;
  // Map deep-link sections to their parent permission module
  if (moduleId === 'LMS') return roleMap?.ACADEMICS || NONE;
  if (moduleId === 'TC' || moduleId === 'ID_CARDS') return roleMap?.STUDENT || NONE;
  if (moduleId === 'CANTEEN') return roleMap?.FINANCE || NONE;
  if (moduleId === 'ASSET' || moduleId === 'SUPPLIES') return roleMap?.INVENTORY || NONE;
  if (moduleId === 'CONTACT' || moduleId === 'SCHOOL') return roleMap?.COMMUNICATIONS || NONE;
  if (moduleId === 'SETTINGS') return roleMap?.ADMIN || NONE;
  if (moduleId === 'CUSTOM_MENU') return READ;
  return NONE;
}

export function canAccessModule(
  role: ErpRole,
  moduleId: NavSection,
  matrix: RolePermissionMatrix
): boolean {
  if (moduleId === 'CUSTOM_MENU') return true;
  const crud = getModuleCrud(role, moduleId, matrix);
  return crud.read || crud.create || crud.update || crud.delete;
}

export function canSwitchSchool(role: ErpRole): boolean {
  const scope = getRoleDefinition(role).scope;
  return scope === 'Platform' || scope === 'Organization';
}

export function canSwitchCampus(role: ErpRole): boolean {
  const scope = getRoleDefinition(role).scope;
  return scope === 'Platform' || scope === 'Organization' || scope === 'School';
}

const MENU_FULL: MenuOperationPermissions = {
  view: true,
  add: true,
  edit: true,
  delete: true,
  activate: true,
  deactivate: true,
};

const MENU_ORG_ADMIN: MenuOperationPermissions = {
  view: true,
  add: true,
  edit: true,
  delete: false,
  activate: true,
  deactivate: true,
};

const MENU_SCHOOL_ADMIN: MenuOperationPermissions = {
  view: true,
  add: false,
  edit: true,
  delete: false,
  activate: true,
  deactivate: true,
};

const MENU_VIEW_ONLY: MenuOperationPermissions = {
  view: true,
  add: false,
  edit: false,
  delete: false,
  activate: false,
  deactivate: false,
};

const MENU_NONE: MenuOperationPermissions = {
  view: false,
  add: false,
  edit: false,
  delete: false,
  activate: false,
  deactivate: false,
};

export const DEFAULT_MENU_OPERATION_PERMISSIONS: RoleMenuPermissionMap = {
  'Super Administrator': { ...MENU_FULL },
  'Organization Administrator': { ...MENU_ORG_ADMIN },
  'School Administrator': { ...MENU_SCHOOL_ADMIN },
  'Campus Administrator': { ...MENU_VIEW_ONLY },
  Principal: { ...MENU_VIEW_ONLY },
  'Vice Principal': { ...MENU_VIEW_ONLY },
  'Academic Coordinator': { ...MENU_NONE },
  'Admission Officer': { ...MENU_NONE },
  Accountant: { ...MENU_NONE },
  'HR Manager': { ...MENU_NONE },
  Teacher: { ...MENU_NONE },
  'Class Teacher': { ...MENU_NONE },
  Librarian: { ...MENU_NONE },
  'Transport Manager': { ...MENU_NONE },
  'Hostel Warden': { ...MENU_NONE },
  'Inventory Manager': { ...MENU_NONE },
  'Front Office Staff': { ...MENU_NONE },
  Parent: { ...MENU_NONE },
  Student: { ...MENU_NONE },
};

export function getMenuOperationPermissions(
  role: ErpRole,
  menuPermMap: RoleMenuPermissionMap = DEFAULT_MENU_OPERATION_PERMISSIONS
): MenuOperationPermissions {
  if (role === 'Super Administrator') return { ...MENU_FULL };
  return menuPermMap[role] || DEFAULT_MENU_OPERATION_PERMISSIONS[role] || { ...MENU_NONE };
}

