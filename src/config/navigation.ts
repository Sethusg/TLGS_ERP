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
} from 'lucide-react';
import { NavSection } from '../types';

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
    description: 'Executive multi-school overview, KPIs, charts, and daily operations',
    icon: LayoutDashboard,
    subItems: [
      { label: 'Executive Overview', actionId: 'dashboard-overview' },
      { label: 'Attendance & Fleet', actionId: 'dashboard-operations' },
      { label: 'Admissions & CRM', actionId: 'dashboard-crm' },
    ],
  },
  {
    index: 2,
    id: 'ORGANIZATION',
    label: 'Organization Management',
    shortLabel: 'Organization',
    description: 'Trusts, schools, campuses, academic years, and institutional wings',
    icon: Building2,
    subItems: [
      { label: 'Organizations & Trusts', actionId: 'org-trusts' },
      { label: 'Schools & Affiliations', actionId: 'org-schools' },
      { label: 'Campuses & Branches', actionId: 'org-campuses' },
      { label: 'Academic Years', actionId: 'org-academic-years' },
      { label: 'Departments & Wings', actionId: 'org-departments' },
    ],
  },
  {
    index: 3,
    id: 'ACADEMICS',
    label: 'Academic Management',
    shortLabel: 'Academics',
    description: 'Curriculum, LMS, timetables, homework, and live classroom delivery',
    icon: BookOpen,
    subItems: [
      { label: 'LMS & Curriculum', actionId: 'academics-lms', targetSection: 'LMS' },
      { label: 'Home Work & Assignments', actionId: 'academics-homework' },
      { label: 'Class Timetable', actionId: 'academics-timetable' },
      { label: 'Exam Schedule', actionId: 'academics-exam-schedule' },
      { label: 'Live Classrooms', actionId: 'academics-live-class' },
      { label: 'Academic Calendar', actionId: 'school-calendar', targetSection: 'SCHOOL' },
    ],
  },
  {
    index: 4,
    id: 'STUDENT',
    label: 'Student Management',
    shortLabel: 'Students',
    description: 'Student directory, admissions, bulk updates, TC issuance, and ID cards',
    icon: GraduationCap,
    subItems: [
      { label: 'Student Directory', actionId: 'student-user-details' },
      { label: 'Students Report', actionId: 'student-report' },
      { label: 'Bulk Student Update', actionId: 'student-bulk-update' },
      { label: 'Transfer Certificates (TC)', actionId: 'tc-manage', targetSection: 'TC' },
      { label: 'Student ID Studio', actionId: 'id-student', targetSection: 'ID_CARDS' },
    ],
  },
  {
    index: 5,
    id: 'STAFFS',
    label: 'Staff Management',
    shortLabel: 'Staff',
    description: 'Faculty directory, department assignments, leaves, and staff ID cards',
    icon: Users,
    subItems: [
      { label: 'Staff Directory', actionId: 'staff-info' },
      { label: 'Leave Calendar', actionId: 'staff-leave-calendar' },
      { label: 'Leave Requests', actionId: 'staff-leave-request' },
      { label: 'Apply Staff Leave', actionId: 'staff-leave-apply' },
      { label: 'Staff Analytics', actionId: 'staff-report' },
      { label: 'Staff ID Studio', actionId: 'id-staff', targetSection: 'ID_CARDS' },
    ],
  },
  {
    index: 6,
    id: 'ATTENDANCE',
    label: 'Attendance Management',
    shortLabel: 'Attendance',
    description: 'Daily student & staff roll call, biometric/QR logs, and defaulter alerts',
    icon: CalendarCheck,
    subItems: [
      { label: 'Student Attendance', actionId: 'att-student-daily' },
      { label: 'Staff Attendance', actionId: 'att-staff-daily' },
      { label: 'Biometric & QR Logs', actionId: 'att-biometric' },
      { label: 'Attendance Summary', actionId: 'att-summary' },
    ],
  },
  {
    index: 7,
    id: 'FEE MANAGEMENT',
    label: 'Fee Management',
    shortLabel: 'Fees',
    description: 'Fee collection counter, structures, student assignments, and concessions',
    icon: CreditCard,
    subItems: [
      { label: 'Fee Collection', actionId: 'fee-collection' },
      { label: 'Fee Admin & Structures', actionId: 'fee-admin' },
      { label: 'Fee Assignment', actionId: 'fee-assignment' },
      { label: 'Manage Concessions', actionId: 'fee-concession' },
      { label: 'Fee Reports', actionId: 'fee-report' },
    ],
  },
  {
    index: 8,
    id: 'MARKCHART',
    label: 'Examination Management',
    shortLabel: 'Examinations',
    description: 'Exam creation, grading markcharts, student enrollment, and report cards',
    icon: ClipboardCheck,
    subItems: [
      { label: 'Exams Overview', actionId: 'markchart-exams' },
      { label: 'Student Enrollment', actionId: 'markchart-enrollment' },
      { label: 'Report Cards', actionId: 'markchart-reports' },
      { label: 'Exam Analytics', actionId: 'markchart-analytics' },
      { label: 'Subjects & Grading', actionId: 'markchart-subjects' },
      { label: 'Exam Settings', actionId: 'markchart-settings' },
    ],
  },
  {
    index: 9,
    id: 'HR',
    label: 'Human Resources',
    shortLabel: 'HR & Payroll',
    description: 'Payroll processing, recruitment pipeline, appraisals, and HR policies',
    icon: Briefcase,
    subItems: [
      { label: 'Payroll & Payslips', actionId: 'hr-payroll' },
      { label: 'Recruitment & Onboarding', actionId: 'hr-recruitment' },
      { label: 'Contracts & Appraisals', actionId: 'hr-appraisals' },
      { label: 'Leave & HR Policies', actionId: 'hr-policies' },
      { label: 'Staff Payroll Ledger', actionId: 'staff-payroll', targetSection: 'STAFFS' },
    ],
  },
  {
    index: 10,
    id: 'FINANCE',
    label: 'Finance and Accounts',
    shortLabel: 'Finance',
    description: 'General ledger, income & expenses, budgets, vendor payables, and POS revenue',
    icon: Landmark,
    subItems: [
      { label: 'General Ledger', actionId: 'fin-ledger' },
      { label: 'Income & Expenses', actionId: 'fin-income-expense' },
      { label: 'Campus Budgets', actionId: 'fin-budgets' },
      { label: 'Vendor Invoices', actionId: 'fin-vendors' },
      { label: 'Canteen & POS Terminal', actionId: 'canteen-pos', targetSection: 'CANTEEN' },
    ],
  },
  {
    index: 11,
    id: 'LIBRARY',
    label: 'Library Management',
    shortLabel: 'Library',
    description: 'Book catalog, circulation issue & return, members, and overdue tracking',
    icon: Library,
    subItems: [
      { label: 'Book Catalog', actionId: 'lib-catalog' },
      { label: 'Issue & Return Desk', actionId: 'lib-circulation' },
      { label: 'Library Members', actionId: 'lib-members' },
      { label: 'Overdue & Fines', actionId: 'lib-fines' },
    ],
  },
  {
    index: 12,
    id: 'TRANSPORT',
    label: 'Transport Management',
    shortLabel: 'Transport',
    description: 'Live bus GPS tracking, route optimization, stop schedules, and fleet logs',
    icon: Bus,
    subItems: [
      { label: 'Live Bus Locations', actionId: 'transport-bus-locations' },
      { label: 'Routes & Stops', actionId: 'transport-routes' },
      { label: 'Fleet Reports', actionId: 'transport-reports' },
    ],
  },
  {
    index: 13,
    id: 'HOSTEL',
    label: 'Hostel Management',
    shortLabel: 'Hostel',
    description: 'Residential blocks, room allocation, mess plans, and gate pass logs',
    icon: BedDouble,
    subItems: [
      { label: 'Hostels & Blocks', actionId: 'hostel-blocks' },
      { label: 'Room Allocation', actionId: 'hostel-rooms' },
      { label: 'Mess & Meal Plans', actionId: 'hostel-mess' },
      { label: 'Gate Pass & Visitors', actionId: 'hostel-gatepass' },
    ],
  },
  {
    index: 14,
    id: 'INVENTORY',
    label: 'Inventory Management',
    shortLabel: 'Inventory',
    description: 'Institutional fixed assets, lab equipment, supplies stock, and distribution',
    icon: Boxes,
    subItems: [
      { label: 'Asset Register', actionId: 'asset-view', targetSection: 'ASSET' },
      { label: 'Add Institutional Asset', actionId: 'asset-add', targetSection: 'ASSET' },
      { label: 'Check Out / Check In', actionId: 'asset-checkout', targetSection: 'ASSET' },
      { label: 'Supplies & Stationery', actionId: 'supplies-masters', targetSection: 'SUPPLIES' },
      { label: 'Stock Entry & Billing', actionId: 'supplies-stock-entry', targetSection: 'SUPPLIES' },
      { label: 'Inventory Reports', actionId: 'asset-report', targetSection: 'ASSET' },
    ],
  },
  {
    index: 15,
    id: 'COMMUNICATIONS',
    label: 'Communication Management',
    shortLabel: 'Communications',
    description: 'Bulk SMS/Email/WhatsApp broadcasts, circulars, parent notes, and news',
    icon: MessageSquare,
    subItems: [
      { label: 'Bulk Broadcast', actionId: 'comm-broadcast' },
      { label: 'Message Templates', actionId: 'comm-templates' },
      { label: 'Delivery History', actionId: 'comm-history' },
      { label: 'School Circulars', actionId: 'school-circulars', targetSection: 'SCHOOL' },
      { label: 'Parent Messaging', actionId: 'contact-messaging', targetSection: 'CONTACT' },
      { label: 'News & Events', actionId: 'school-news', targetSection: 'SCHOOL' },
    ],
  },
  {
    index: 16,
    id: 'REPORTS',
    label: 'Reports and Analytics',
    shortLabel: 'Reports',
    description: 'Multi-school executive analytics, financial audits, and export center',
    icon: BarChart3,
    subItems: [
      { label: 'Executive Summary', actionId: 'rep-executive' },
      { label: 'Enrollment Analytics', actionId: 'rep-enrollment' },
      { label: 'Attendance Insights', actionId: 'rep-attendance' },
      { label: 'Financial Analytics', actionId: 'rep-finance' },
      { label: 'Export Center', actionId: 'rep-export' },
    ],
  },
  {
    index: 17,
    id: 'ADMIN',
    label: 'System Administration',
    shortLabel: 'System Admin',
    description: 'Users, RBAC permissions, academic masters, audit logs, and system backups',
    icon: ShieldCheck,
    subItems: [
      { label: 'Users & RBAC Masters', actionId: 'admin-users' },
      { label: 'Audit Logs', actionId: 'admin-audit', targetSection: 'SETTINGS' },
      { label: 'Backup & Restore', actionId: 'settings-backup', targetSection: 'SETTINGS' },
      { label: 'System Settings', actionId: 'settings-general', targetSection: 'SETTINGS' },
    ],
  },
];

export function getMenusForRole(userRole?: string): MainMenuItemDef[] {
  if (userRole === 'cashier') {
    return MAIN_ERP_MENUS.filter((m) => ['HOME', 'FINANCE', 'FEE MANAGEMENT'].includes(m.id));
  }
  if (userRole === 'accountant') {
    return MAIN_ERP_MENUS.filter((m) =>
      ['HOME', 'FEE MANAGEMENT', 'FINANCE', 'HR', 'REPORTS'].includes(m.id)
    );
  }
  if (userRole === 'teacher') {
    return MAIN_ERP_MENUS.filter((m) =>
      ['HOME', 'ACADEMICS', 'STUDENT', 'ATTENDANCE', 'MARKCHART', 'LIBRARY', 'COMMUNICATIONS'].includes(m.id)
    );
  }
  return MAIN_ERP_MENUS;
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

export function getSectionDisplayTitle(section: NavSection): string {
  const direct = MAIN_ERP_MENUS.find((m) => m.id === section);
  if (direct) return direct.label;
  switch (section) {
    case 'LMS':
      return 'Academic Management · LMS';
    case 'TC':
      return 'Student Management · Transfer Certificates';
    case 'ID_CARDS':
      return 'ID Card Studio';
    case 'CANTEEN':
      return 'Finance & Accounts · Canteen POS';
    case 'ASSET':
      return 'Inventory Management · Fixed Assets';
    case 'SUPPLIES':
      return 'Inventory Management · Supplies & Stock';
    case 'CONTACT':
      return 'Communication Management · Parent Messaging';
    case 'SCHOOL':
      return 'Communication & Campus · Circulars & Events';
    case 'SETTINGS':
      return 'System Administration · Settings & Audit';
    default:
      return section;
  }
}

export const PROFILE_MENU_ITEMS = [
  { label: 'Customize Logo & Colours', actionId: 'profile-customize-nav' },
  { label: 'Organization Management', actionId: 'profile-org' },
  { label: 'User Activity & Audit Log', actionId: 'profile-user-activity' },
  { label: 'Quick Broadcast', actionId: 'profile-quick-sms' },
  { label: 'Reports & Analytics', actionId: 'profile-reports' },
  { label: 'System Settings', actionId: 'profile-settings' },
  { label: 'Log Out', actionId: 'profile-logout' },
];
