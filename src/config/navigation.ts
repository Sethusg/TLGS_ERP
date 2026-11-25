import React from 'react';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  ClipboardCheck,
  Briefcase,
  Landmark,
  Library,
  Bus,
  BedDouble,
  Boxes,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  FolderKanban,
  Award,
  Globe,
  Bell,
  FileText,
  Settings,
  Layers,
  HeartHandshake,
  Sparkles,
  Compass,
  Cpu,
  ShoppingCart,
} from 'lucide-react';
import {
  ErpRole,
  ManagedMainMenu,
  MenuIconName,
  MenuVisibilityMap,
  NavSection,
  RolePermissionMatrix,
} from '../types';
import {
  DEFAULT_ROLE_PERMISSIONS,
  canAccessModule,
  normalizeLegacyRole,
} from './rbac';

export const MENU_ICON_REGISTRY: Record<
  MenuIconName,
  React.ComponentType<{ className?: string }>
> = {
  LayoutDashboard,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  ClipboardCheck,
  Briefcase,
  Landmark,
  Library,
  Bus,
  BedDouble,
  Boxes,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  FolderKanban,
  Award,
  Globe,
  Bell,
  FileText,
  Settings,
  Layers,
  HeartHandshake,
  Sparkles,
  Compass,
  Cpu,
  ShoppingCart,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICON_REGISTRY) as MenuIconName[];

export function getMenuIconComponent(
  iconName?: MenuIconName
): React.ComponentType<{ className?: string }> {
  if (!iconName) return FolderKanban;
  return MENU_ICON_REGISTRY[iconName] || FolderKanban;
}

export const DEFAULT_ORGANIZATIONS: { id: string; name: string }[] = [];

const BUILTIN_ICON_MAP: Partial<Record<NavSection, MenuIconName>> = {
  HOME: 'LayoutDashboard',
  ORGANIZATION: 'Building2',
  ACADEMICS: 'BookOpen',
  STUDENT: 'GraduationCap',
  STAFFS: 'Users',
  ATTENDANCE: 'CalendarCheck',
  'FEE MANAGEMENT': 'CreditCard',
  MARKCHART: 'ClipboardCheck',
  HR: 'Briefcase',
  FINANCE: 'Landmark',
  LIBRARY: 'Library',
  TRANSPORT: 'Bus',
  HOSTEL: 'BedDouble',
  INVENTORY: 'Boxes',
  POS: 'ShoppingCart',
  COMMUNICATIONS: 'MessageSquare',
  REPORTS: 'BarChart3',
  ADMIN: 'ShieldCheck',
};

export interface SubMenuItemDef {
  label: string;
  actionId: string;
  targetSection?: NavSection;
}

export interface MainMenuItemDef {
  index: number;
  id: NavSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems: SubMenuItemDef[];
}

export const MAIN_ERP_MENUS: MainMenuItemDef[] = [
  {
    index: 1,
    id: 'HOME',
    label: 'Dashboard',
    shortLabel: 'Dashboard',
    description: 'Overall, school-wise, and campus-wise KPIs, statistics, and daily alerts',
    icon: LayoutDashboard,
    subItems: [
      { label: 'Overall Dashboard', actionId: 'dash-overall' },
      { label: 'School-wise Dashboard', actionId: 'dash-school' },
      { label: 'Campus-wise Dashboard', actionId: 'dash-campus' },
      { label: 'Student Statistics', actionId: 'dash-students' },
      { label: 'Staff Statistics', actionId: 'dash-staff' },
      { label: 'Fee Collection Summary', actionId: 'dash-fees' },
      { label: 'Attendance Summary', actionId: 'dash-attendance' },
      { label: 'Admission Summary', actionId: 'dash-admissions' },
      { label: 'Financial Overview', actionId: 'dash-finance' },
      { label: 'Notifications', actionId: 'dash-notifications' },
      { label: 'Recent Activities', actionId: 'dash-activities' },
    ],
  },
  {
    index: 2,
    id: 'ORGANIZATION',
    label: 'Organization Management',
    shortLabel: 'Organization',
    description: 'Organizations, schools, campuses, boards, school documents, and academic years',
    icon: Building2,
    subItems: [
      { label: 'Organization Profile', actionId: 'org-profile' },
      { label: 'School Management', actionId: 'org-schools' },
      { label: 'Campus Management', actionId: 'org-campuses' },
      { label: 'School Configuration', actionId: 'org-config' },
      { label: 'Academic Board Configuration', actionId: 'org-boards' },
      { label: 'School Documents', actionId: 'org-documents' },
      { label: 'Academic Year Management', actionId: 'org-academic-years' },
    ],
  },
  {
    index: 3,
    id: 'ACADEMICS',
    label: 'Academic Management',
    shortLabel: 'Academics',
    description: 'Academic years, classes, sections, subjects, timetables, lesson plans, and homework',
    icon: BookOpen,
    subItems: [
      { label: 'Academic Year', actionId: 'org-academic-years', targetSection: 'ORGANIZATION' },
      { label: 'Classes', actionId: 'acad-classes', targetSection: 'ADMIN' },
      { label: 'Sections', actionId: 'acad-sections', targetSection: 'ADMIN' },
      { label: 'Subjects', actionId: 'acad-subjects', targetSection: 'ADMIN' },
      { label: 'Subject Allocation', actionId: 'academics-lms', targetSection: 'LMS' },
      { label: 'Class Teacher Allocation', actionId: 'acad-class-teacher', targetSection: 'ADMIN' },
      { label: 'Timetable', actionId: 'academics-timetable' },
      { label: 'Lesson Planning', actionId: 'academics-lms', targetSection: 'LMS' },
      { label: 'Syllabus Management', actionId: 'academics-exam-schedule' },
      { label: 'Academic Calendar', actionId: 'school-calendar', targetSection: 'SCHOOL' },
      { label: 'Homework', actionId: 'academics-homework' },
      { label: 'Assignments', actionId: 'academics-live-class' },
    ],
  },
  {
    index: 4,
    id: 'STUDENT',
    label: 'Student Management',
    shortLabel: 'Students',
    description: 'Registration, admissions, profiles, parent details, ID cards, promotions, TC, and alumni',
    icon: GraduationCap,
    subItems: [
      { label: 'Student Registration', actionId: 'student-user-details' },
      { label: 'New Admission', actionId: 'student-new-admission' },
      { label: 'Admission Enquiries', actionId: 'dash-admissions', targetSection: 'HOME' },
      { label: 'Application Processing', actionId: 'student-applications' },
      { label: 'Student Profile', actionId: 'student-profile' },
      { label: 'Parent / Guardian Details', actionId: 'student-parents' },
      { label: 'Student Documents', actionId: 'student-documents' },
      { label: 'Student ID Cards', actionId: 'id-student', targetSection: 'ID_CARDS' },
      { label: 'Student Promotion', actionId: 'student-bulk-update' },
      { label: 'Transfer Certificate', actionId: 'tc-manage', targetSection: 'TC' },
      { label: 'Student Withdrawal', actionId: 'tc-create', targetSection: 'TC' },
      { label: 'Alumni Management', actionId: 'student-report' },
    ],
  },
  {
    index: 5,
    id: 'STAFFS',
    label: 'Staff Management',
    shortLabel: 'Staff',
    description: 'Staff registration, profiles, departments, designations, leaves, ID cards, and exits',
    icon: Users,
    subItems: [
      { label: 'Staff Registration', actionId: 'staff-info' },
      { label: 'Staff Profile', actionId: 'staff-profile' },
      { label: 'Department Management', actionId: 'org-departments', targetSection: 'ORGANIZATION' },
      { label: 'Designation Management', actionId: 'staff-designations' },
      { label: 'Staff Attendance', actionId: 'att-staff-daily', targetSection: 'ATTENDANCE' },
      { label: 'Staff Leave', actionId: 'staff-leave-request' },
      { label: 'Staff ID Cards', actionId: 'id-staff', targetSection: 'ID_CARDS' },
      { label: 'Staff Documents', actionId: 'staff-documents' },
      { label: 'Staff Work Allocation', actionId: 'staff-leave-calendar' },
      { label: 'Staff Performance', actionId: 'hr-appraisals', targetSection: 'HR' },
      { label: 'Staff Exit Management', actionId: 'staff-report' },
    ],
  },
  {
    index: 6,
    id: 'ATTENDANCE',
    label: 'Attendance Management',
    shortLabel: 'Attendance',
    description: 'Daily student & staff roll call, biometric integration, manual entry, and alerts',
    icon: CalendarCheck,
    subItems: [
      { label: 'Student Daily Attendance', actionId: 'att-student-daily' },
      { label: 'Staff Daily Attendance', actionId: 'att-staff-daily' },
      { label: 'Biometric Integration', actionId: 'att-biometric' },
      { label: 'Manual Attendance', actionId: 'att-manual' },
      { label: 'Class-wise Attendance', actionId: 'att-classwise' },
      { label: 'Absence Notifications', actionId: 'att-alerts' },
      { label: 'Attendance Reports', actionId: 'att-summary' },
    ],
  },
  {
    index: 7,
    id: 'FEE MANAGEMENT',
    label: 'Fee Management',
    shortLabel: 'Fees',
    description: 'Fee categories, structures, student assignments, online collection, receipts, and defaulters',
    icon: CreditCard,
    subItems: [
      { label: 'Fee Categories', actionId: 'fee-categories' },
      { label: 'Fee Structure', actionId: 'fee-admin' },
      { label: 'Class-wise Fee Allocation', actionId: 'fee-class-alloc' },
      { label: 'Student Fee Assignment', actionId: 'fee-assignment' },
      { label: 'Fee Collection', actionId: 'fee-collection' },
      { label: 'Online Payment Integration', actionId: 'fee-online' },
      { label: 'Receipt Generation', actionId: 'fee-receipts' },
      { label: 'Discounts', actionId: 'fee-concession' },
      { label: 'Scholarships', actionId: 'fee-scholarships' },
      { label: 'Due Management', actionId: 'fee-dues' },
      { label: 'Refund Management', actionId: 'fee-refunds' },
      { label: 'Fee Defaulters', actionId: 'fee-defaulters' },
      { label: 'Collection Reports', actionId: 'fee-report' },
    ],
  },
  {
    index: 8,
    id: 'MARKCHART',
    label: 'Examination Management',
    shortLabel: 'Examinations',
    description: 'Exam categories, schedules, marks entry, grade setup, report cards, and rank lists',
    icon: ClipboardCheck,
    subItems: [
      { label: 'Examination Categories', actionId: 'markchart-settings' },
      { label: 'Exam Schedule', actionId: 'academics-exam-schedule', targetSection: 'ACADEMICS' },
      { label: 'Subject Marks', actionId: 'markchart-subjects' },
      { label: 'Marks Entry', actionId: 'markchart-exams' },
      { label: 'Grade Configuration', actionId: 'markchart-grades' },
      { label: 'Report Card Generation', actionId: 'markchart-reports' },
      { label: 'Progress Reports', actionId: 'markchart-enrollment' },
      { label: 'Rank Lists', actionId: 'markchart-ranks' },
      { label: 'Academic Performance Reports', actionId: 'markchart-analytics' },
    ],
  },
  {
    index: 9,
    id: 'HR',
    label: 'Human Resources',
    shortLabel: 'HR & Payroll',
    description: 'Employee records, recruitment, leaves, payroll, salary components, and payslips',
    icon: Briefcase,
    subItems: [
      { label: 'Employee Management', actionId: 'staff-info', targetSection: 'STAFFS' },
      { label: 'Recruitment', actionId: 'hr-recruitment' },
      { label: 'Leave Management', actionId: 'staff-leave-request', targetSection: 'STAFFS' },
      { label: 'Payroll', actionId: 'hr-payroll' },
      { label: 'Salary Components', actionId: 'hr-salary-components' },
      { label: 'Payslip Generation', actionId: 'staff-payroll', targetSection: 'STAFFS' },
      { label: 'Employee Documents', actionId: 'hr-appraisals' },
      { label: 'HR Reports', actionId: 'hr-policies' },
    ],
  },
  {
    index: 10,
    id: 'FINANCE',
    label: 'Finance and Accounts',
    shortLabel: 'Finance',
    description: 'Income, expenses, account heads, cash book, bank accounts, vouchers, and canteen POS',
    icon: Landmark,
    subItems: [
      { label: 'Income', actionId: 'fin-income-expense' },
      { label: 'Expenses', actionId: 'fin-expenses' },
      { label: 'Account Heads', actionId: 'fin-ledger' },
      { label: 'Cash Book', actionId: 'fin-cashbook' },
      { label: 'Bank Accounts', actionId: 'fin-budgets' },
      { label: 'Payment Vouchers', actionId: 'fin-vendors' },
      { label: 'Receipt Vouchers', actionId: 'fin-receipt-vouchers' },
      { label: 'Financial Reports', actionId: 'rep-finance', targetSection: 'REPORTS' },
      { label: 'Canteen & POS Terminal', actionId: 'canteen-pos', targetSection: 'CANTEEN' },
    ],
  },
  {
    index: 11,
    id: 'LIBRARY',
    label: 'Library Management',
    shortLabel: 'Library',
    description: 'Book categories, inventory, issue & return circulation, reservations, and fines',
    icon: Library,
    subItems: [
      { label: 'Book Categories', actionId: 'lib-categories' },
      { label: 'Book Inventory', actionId: 'lib-catalog' },
      { label: 'Book Issue', actionId: 'lib-circulation' },
      { label: 'Book Return', actionId: 'lib-return' },
      { label: 'Reservations', actionId: 'lib-members' },
      { label: 'Fine Management', actionId: 'lib-fines' },
      { label: 'Library Reports', actionId: 'lib-reports' },
    ],
  },
  {
    index: 12,
    id: 'TRANSPORT',
    label: 'Transport Management',
    shortLabel: 'Transport',
    description: 'Vehicles, drivers, routes, stops, student route allocations, and maintenance logs',
    icon: Bus,
    subItems: [
      { label: 'Vehicle Management', actionId: 'transport-bus-locations' },
      { label: 'Driver Management', actionId: 'transport-drivers' },
      { label: 'Route Management', actionId: 'transport-routes' },
      { label: 'Stop Management', actionId: 'transport-stops' },
      { label: 'Student Route Allocation', actionId: 'transport-allocation' },
      { label: 'Transport Fees', actionId: 'fee-admin', targetSection: 'FEE MANAGEMENT' },
      { label: 'Vehicle Documents', actionId: 'transport-docs' },
      { label: 'Maintenance Records', actionId: 'transport-reports' },
    ],
  },
  {
    index: 13,
    id: 'HOSTEL',
    label: 'Hostel Management',
    shortLabel: 'Hostel',
    description: 'Hostels, rooms, beds, student allocation, attendance, visitors, mess, and hostel fees',
    icon: BedDouble,
    subItems: [
      { label: 'Hostel Management', actionId: 'hostel-blocks' },
      { label: 'Rooms', actionId: 'hostel-rooms' },
      { label: 'Beds', actionId: 'hostel-beds' },
      { label: 'Student Allocation', actionId: 'hostel-allocation' },
      { label: 'Hostel Attendance', actionId: 'hostel-attendance' },
      { label: 'Visitor Register', actionId: 'hostel-gatepass' },
      { label: 'Mess Management', actionId: 'hostel-mess' },
      { label: 'Hostel Fees', actionId: 'hostel-fees' },
      { label: 'Hostel Reports', actionId: 'hostel-reports' },
    ],
  },
  {
    index: 14,
    id: 'INVENTORY',
    label: 'Inventory and Asset Management',
    shortLabel: 'Inventory',
    description: 'Asset categories, registration, allocation, stock management, POs, vendors, and disposal',
    icon: Boxes,
    subItems: [
      { label: 'Asset Categories', actionId: 'asset-view', targetSection: 'ASSET' },
      { label: 'Asset Registration', actionId: 'asset-add', targetSection: 'ASSET' },
      { label: 'Asset Allocation', actionId: 'asset-checkout', targetSection: 'ASSET' },
      { label: 'Stock Management', actionId: 'supplies-masters', targetSection: 'SUPPLIES' },
      { label: 'Purchase Orders', actionId: 'supplies-stock-entry', targetSection: 'SUPPLIES' },
      { label: 'Vendors', actionId: 'fin-vendors', targetSection: 'FINANCE' },
      { label: 'Goods Receipt', actionId: 'supplies-grn', targetSection: 'SUPPLIES' },
      { label: 'Stock Issue', actionId: 'supplies-issue', targetSection: 'SUPPLIES' },
      { label: 'Maintenance', actionId: 'asset-maintenance', targetSection: 'ASSET' },
      { label: 'Asset Disposal', actionId: 'asset-report', targetSection: 'ASSET' },
    ],
  },
  {
    index: 15,
    id: 'POS',
    label: 'POS – Point of Sale',
    shortLabel: 'Point of Sale',
    description: 'Retail billing, barcode checkout, GST invoicing, purchases, inventory, returns, cash registers, and POS analytics',
    icon: ShoppingCart,
    subItems: [
      { label: 'POS Dashboard', actionId: 'pos-dashboard' },
      { label: 'New Sale / Billing', actionId: 'pos-billing' },
      { label: 'Sales History', actionId: 'pos-sales' },
      { label: 'Sales Returns', actionId: 'pos-returns' },
      { label: 'Products', actionId: 'pos-products' },
      { label: 'Product Categories', actionId: 'pos-categories' },
      { label: 'Brands', actionId: 'pos-brands' },
      { label: 'Barcode Management', actionId: 'pos-barcodes' },
      { label: 'Stock Management', actionId: 'pos-stock' },
      { label: 'Purchase Management', actionId: 'pos-purchases' },
      { label: 'Suppliers', actionId: 'pos-suppliers' },
      { label: 'Customers', actionId: 'pos-customers' },
      { label: 'Payments', actionId: 'pos-payments' },
      { label: 'Expenses', actionId: 'pos-expenses' },
      { label: 'Cash Register', actionId: 'pos-register' },
      { label: 'Discounts', actionId: 'pos-discounts' },
      { label: 'GST / Tax Management', actionId: 'pos-gst' },
      { label: 'Inventory Transfers', actionId: 'pos-transfers' },
      { label: 'POS Reports', actionId: 'pos-reports' },
      { label: 'POS Settings', actionId: 'pos-settings' },
    ],
  },
  {
    index: 16,
    id: 'COMMUNICATIONS',
    label: 'Communication Management',
    shortLabel: 'Communications',
    description: 'SMS, Email, WhatsApp Official API, parent & staff alerts, circulars, and events',
    icon: MessageSquare,
    subItems: [
      { label: 'SMS Integration', actionId: 'comm-broadcast' },
      { label: 'Email Notifications', actionId: 'comm-templates' },
      { label: 'WhatsApp Official API Integration', actionId: 'comm-whatsapp' },
      { label: 'Parent Notifications', actionId: 'contact-messaging', targetSection: 'CONTACT' },
      { label: 'Staff Notifications', actionId: 'comm-history' },
      { label: 'Circulars', actionId: 'school-circulars', targetSection: 'SCHOOL' },
      { label: 'Announcements', actionId: 'school-news', targetSection: 'SCHOOL' },
      { label: 'Event Notifications', actionId: 'school-calendar', targetSection: 'SCHOOL' },
    ],
  },
  {
    index: 17,
    id: 'REPORTS',
    label: 'Reports and Analytics',
    shortLabel: 'Reports',
    description: 'Student, admission, attendance, fee, exam, staff, payroll, school & campus exports',
    icon: BarChart3,
    subItems: [
      { label: 'Student Reports', actionId: 'rep-enrollment' },
      { label: 'Admission Reports', actionId: 'rep-admissions' },
      { label: 'Attendance Reports', actionId: 'rep-attendance' },
      { label: 'Fee Reports', actionId: 'rep-finance' },
      { label: 'Examination Reports', actionId: 'rep-exams' },
      { label: 'Staff Reports', actionId: 'rep-staff' },
      { label: 'Payroll Reports', actionId: 'rep-payroll' },
      { label: 'Inventory Reports', actionId: 'rep-inventory' },
      { label: 'School-wise Reports', actionId: 'rep-executive' },
      { label: 'Campus-wise Reports', actionId: 'rep-campus' },
      { label: 'Export to Excel and PDF', actionId: 'rep-export' },
    ],
  },
  {
    index: 18,
    id: 'ADMIN',
    label: 'System Administration',
    shortLabel: 'System Admin',
    description: 'Users, roles, CRUD & POS permissions, menus, settings, MySQL schema, audit logs & backups',
    icon: ShieldCheck,
    subItems: [
      { label: 'User Management', actionId: 'admin-users' },
      { label: 'Role Management', actionId: 'admin-roles' },
      { label: 'Permission Management', actionId: 'admin-permissions' },
      { label: 'Menu Management', actionId: 'admin-menus' },
      { label: 'School Settings', actionId: 'admin-school-settings' },
      { label: 'Academic Settings', actionId: 'admin-academic-settings' },
      { label: 'Notification Settings', actionId: 'admin-notification-settings' },
      { label: 'API Configuration', actionId: 'admin-api-config' },
      { label: 'MySQL Database Architecture', actionId: 'admin-database-schema' },
      { label: 'Audit Logs', actionId: 'admin-audit' },
      { label: 'Login History', actionId: 'admin-login-history' },
      { label: 'Backup Management', actionId: 'settings-backup', targetSection: 'SETTINGS' },
      { label: 'Web & Windows Desktop App', actionId: 'settings-desktop', targetSection: 'SETTINGS' },
      { label: 'System Monitoring', actionId: 'admin-monitoring' },
    ],
  },
];

export function createInitialManagedMenus(): ManagedMainMenu[] {
  return MAIN_ERP_MENUS.map((menu) => {
    const iconName: MenuIconName = BUILTIN_ICON_MAP[menu.id] || 'FolderKanban';
    return {
      id: menu.id,
      section: menu.id,
      label: menu.label,
      shortLabel: menu.shortLabel,
      description: menu.description,
      iconName,
      order: menu.index,
      isActive: true,
      isVisible: true,
      isSystem: true,
      allowedOrganizations: [],
      allowedRoles: [],
      allowedSchoolIds: [],
      allowedCampusIds: [],
      subItems: menu.subItems.map((sub, idx) => ({
        id: `${menu.id}::${sub.actionId}::${idx + 1}`,
        parentId: menu.id,
        label: sub.label,
        description: `${sub.label} workspace under ${menu.label}`,
        iconName,
        actionId: sub.actionId,
        targetSection: sub.targetSection || menu.id,
        order: idx + 1,
        isActive: true,
        isVisible: true,
        isSystem: true,
        allowedRoles: [],
        allowedSchoolIds: [],
        allowedCampusIds: [],
      })),
    };
  });
}

export interface SidebarResolvedSubItem {
  id: string;
  label: string;
  actionId: string;
  targetSection: NavSection;
  iconName: MenuIconName;
}

export interface SidebarResolvedMainMenu {
  menuId: string;
  index: number;
  id: NavSection;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems: SidebarResolvedSubItem[];
}

export function getVisibleSidebarMenus(
  managedMenus: ManagedMainMenu[],
  userRole?: string,
  permissionMatrix: RolePermissionMatrix = DEFAULT_ROLE_PERMISSIONS,
  selectedSchoolId: string = 'all',
  selectedCampusId: string = 'all'
): SidebarResolvedMainMenu[] {
  const normalizedRole: ErpRole = normalizeLegacyRole(
    userRole || 'Super Administrator'
  );
  const isSuperAdmin = normalizedRole === 'Super Administrator';

  return [...managedMenus]
    .sort((a, b) => a.order - b.order)
    .filter((menu) => {
      // Inactive menus are strictly hidden from navigation (managed inside Menu Management)
      if (!menu.isActive) return false;
      // Menus marked hidden are excluded for standard roles
      if (!menu.isVisible && !isSuperAdmin) return false;

      // Explicit role restriction check
      if (
        menu.allowedRoles &&
        menu.allowedRoles.length > 0 &&
        !isSuperAdmin &&
        !menu.allowedRoles.includes(normalizedRole)
      ) {
        return false;
      }

      // School scope restriction check
      if (
        menu.allowedSchoolIds &&
        menu.allowedSchoolIds.length > 0 &&
        selectedSchoolId !== 'all' &&
        !menu.allowedSchoolIds.includes(selectedSchoolId)
      ) {
        return false;
      }

      // Campus scope restriction check
      if (
        menu.allowedCampusIds &&
        menu.allowedCampusIds.length > 0 &&
        selectedCampusId !== 'all' &&
        !menu.allowedCampusIds.includes(selectedCampusId)
      ) {
        return false;
      }

      // RBAC module access check for built-in ERP modules
      if (menu.section !== 'CUSTOM_MENU') {
        return canAccessModule(normalizedRole, menu.section, permissionMatrix);
      }

      return true;
    })
    .map((menu) => {
      const visibleSubs: SidebarResolvedSubItem[] = [...menu.subItems]
        .sort((a, b) => a.order - b.order)
        .filter((sub) => {
          if (!sub.isActive) return false;
          if (!sub.isVisible && !isSuperAdmin) return false;
          if (
            sub.allowedRoles &&
            sub.allowedRoles.length > 0 &&
            !isSuperAdmin &&
            !sub.allowedRoles.includes(normalizedRole)
          ) {
            return false;
          }
          if (
            sub.allowedSchoolIds &&
            sub.allowedSchoolIds.length > 0 &&
            selectedSchoolId !== 'all' &&
            !sub.allowedSchoolIds.includes(selectedSchoolId)
          ) {
            return false;
          }
          if (
            sub.allowedCampusIds &&
            sub.allowedCampusIds.length > 0 &&
            selectedCampusId !== 'all' &&
            !sub.allowedCampusIds.includes(selectedCampusId)
          ) {
            return false;
          }
          return true;
        })
        .map((sub) => ({
          id: sub.id,
          label: sub.label,
          actionId: sub.actionId,
          targetSection: sub.targetSection || menu.section,
          iconName: sub.iconName,
        }));

      return {
        menuId: menu.id,
        index: menu.order,
        id: menu.section,
        label: menu.label,
        shortLabel: menu.shortLabel,
        description: menu.description,
        icon: getMenuIconComponent(menu.iconName),
        subItems: visibleSubs,
      };
    });
}

export function getMenusForRole(
  userRole?: string,
  permissionMatrix: RolePermissionMatrix = DEFAULT_ROLE_PERMISSIONS,
  menuVisibility: MenuVisibilityMap = {}
): MainMenuItemDef[] {
  const normalizedRole: ErpRole = normalizeLegacyRole(
    userRole || 'Super Administrator'
  );
  return MAIN_ERP_MENUS.filter((menu) => {
    if (menuVisibility[menu.id] === false && normalizedRole !== 'Super Administrator') {
      return false;
    }
    return canAccessModule(normalizedRole, menu.id, permissionMatrix);
  });
}

export function resolveParentMenuId(section: NavSection): NavSection {
  switch (section) {
    case 'LMS':
      return 'ACADEMICS';
    case 'TC':
    case 'ID_CARDS':
      return 'STUDENT';
    case 'CANTEEN':
      return 'FINANCE';
    case 'ASSET':
    case 'SUPPLIES':
      return 'INVENTORY';
    case 'CONTACT':
    case 'SCHOOL':
      return 'COMMUNICATIONS';
    case 'SETTINGS':
      return 'ADMIN';
    default:
      return section;
  }
}

export function getSectionDisplayTitle(
  section: NavSection,
  managedMenus?: ManagedMainMenu[],
  activeSubItem?: string
): string {
  if (section === 'CUSTOM_MENU' && managedMenus) {
    for (const m of managedMenus) {
      if (activeSubItem && m.id === activeSubItem) return m.label;
      const sub = m.subItems.find((s) => s.actionId === activeSubItem);
      if (sub) return `${m.label} · ${sub.label}`;
    }
    return 'Custom ERP Module';
  }
  const dynamicMatch = managedMenus?.find((m) => m.section === section);
  if (dynamicMatch) return dynamicMatch.label;
  const direct = MAIN_ERP_MENUS.find((m) => m.id === section);
  if (direct) return direct.label;
  switch (section) {
    case 'LMS':
      return 'Academic Management · LMS & Curriculum';
    case 'TC':
      return 'Student Management · Transfer Certificates';
    case 'ID_CARDS':
      return 'ID Card Studio';
    case 'CANTEEN':
      return 'Finance & Accounts · Canteen POS';
    case 'ASSET':
      return 'Inventory & Asset Management · Fixed Assets';
    case 'SUPPLIES':
      return 'Inventory & Asset Management · Stock & POs';
    case 'CONTACT':
      return 'Communication Management · Parent Notifications';
    case 'SCHOOL':
      return 'Communication & Campus · Circulars & Events';
    case 'SETTINGS':
      return 'System Administration · Backup & Settings';
    default:
      return section;
  }
}

export const PROFILE_MENU_ITEMS = [
  { label: 'Customize Logo & Colours', actionId: 'profile-customize-nav' },
  { label: 'Organization Management', actionId: 'profile-org' },
  { label: 'Roles & Permissions (RBAC)', actionId: 'profile-rbac' },
  { label: 'Login History & Audit Log', actionId: 'profile-user-activity' },
  { label: 'MySQL 8+ Schema Explorer', actionId: 'profile-db-schema' },
  { label: 'Reports & Analytics', actionId: 'profile-reports' },
  { label: 'Log Out', actionId: 'profile-logout' },
];
