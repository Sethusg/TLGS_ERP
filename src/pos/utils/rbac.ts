/**
 * Role-Based Access Control (RBAC) definitions, permissions registry,
 * and default roles for the School Management ERP & Canteen POS.
 */

export type PermissionCode =
  | 'pos.access'
  | 'pos.sales.view'
  | 'pos.sales.create'
  | 'pos.sales.refund'
  | 'pos.products.view'
  | 'pos.products.manage'
  | 'pos.inventory.view'
  | 'pos.inventory.manage'
  | 'pos.reports.view'
  | 'students.view'
  | 'students.create'
  | 'fees.view'
  | 'fees.collect'
  | 'exams.view'
  | 'staff.view'
  | 'users.manage'
  | 'roles.manage'
  | 'settings.manage';

export interface PermissionDefinition {
  code: PermissionCode;
  name: string;
  module: string;
  description: string;
}

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  { code: 'pos.access', name: 'Access POS Terminal', module: 'Canteen POS', description: 'Permission to open and use the Canteen POS terminal' },
  { code: 'pos.sales.view', name: 'View Sales & Receipts', module: 'Canteen POS', description: 'View transaction history and past receipts' },
  { code: 'pos.sales.create', name: 'Create Sales & Checkout', module: 'Canteen POS', description: 'Process customer and student orders at checkout' },
  { code: 'pos.sales.refund', name: 'Authorize Refunds & Voids', module: 'Canteen POS', description: 'Process bill refunds, cancellations, and voids' },
  { code: 'pos.products.view', name: 'View Product Catalogue', module: 'Canteen Inventory', description: 'View items, prices, and stock counts' },
  { code: 'pos.products.manage', name: 'Manage Products', module: 'Canteen Inventory', description: 'Add, edit, or delete items in the menu catalogue' },
  { code: 'pos.inventory.view', name: 'View Inventory Movements', module: 'Canteen Inventory', description: 'Inspect stock movement audit logs' },
  { code: 'pos.inventory.manage', name: 'Manage Stock Adjustments', module: 'Canteen Inventory', description: 'Record manual stock restocks and write-offs' },
  { code: 'pos.reports.view', name: 'View Financial Reports', module: 'Reports', description: 'Access daily sales summaries and Z-reports' },
  { code: 'students.view', name: 'View Student Records', module: 'Student Management', description: 'View admission records, classes, and wallets' },
  { code: 'students.create', name: 'Register Students', module: 'Student Management', description: 'Enroll new students and import rosters' },
  { code: 'fees.view', name: 'View Fee Records', module: 'Fee Management', description: 'Inspect student fee structures and receipts' },
  { code: 'fees.collect', name: 'Collect Fees', module: 'Fee Management', description: 'Record fee payments and print challans' },
  { code: 'exams.view', name: 'View Examinations & Marks', module: 'Examinations', description: 'Inspect grade sheets and exam leaderboards' },
  { code: 'staff.view', name: 'View Staff Records', module: 'Staff Management', description: 'Inspect faculty rosters and payroll registers' },
  { code: 'users.manage', name: 'Manage System Users', module: 'Administration', description: 'Create and activate cashier and staff accounts' },
  { code: 'roles.manage', name: 'Manage Roles & Permissions', module: 'Administration', description: 'Create and edit security roles and access privileges' },
  { code: 'settings.manage', name: 'Manage Store Settings', module: 'Administration', description: 'Configure thermal printers, currency, and tax rates' },
];

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  permissions: PermissionCode[];
  createdAt: string;
}

const ROLES_STORAGE_KEY = 'gsr_pos_roles_registry';

export function getStoredRoles(): Role[] {
  try {
    const raw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(INITIAL_ROLES));
      return INITIAL_ROLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ROLES;
  }
}

export function saveStoredRoles(roles: Role[]): void {
  try {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  } catch {
    // ignore
  }
}

export function getUserEffectivePermissions(userRoleCode: string, customRoles?: Role[]): PermissionCode[] {
  const roles = customRoles || getStoredRoles();
  const matched = roles.find((r) => r.code === userRoleCode && r.isActive);
  if (matched) {
    return matched.permissions;
  }
  // Fallbacks by role name / role code
  if (userRoleCode === 'admin' || userRoleCode === 'super_admin') {
    return ALL_PERMISSIONS.map((p) => p.code);
  }
  if (userRoleCode === 'cashier') {
    return ['pos.access', 'pos.sales.view', 'pos.sales.create', 'pos.products.view'];
  }
  if (userRoleCode === 'manager') {
    return ['pos.access', 'pos.sales.view', 'pos.sales.create', 'pos.sales.refund', 'pos.products.view', 'pos.products.manage', 'pos.inventory.view', 'pos.inventory.manage', 'pos.reports.view', 'students.view'];
  }
  if (userRoleCode === 'accountant') {
    return ['pos.reports.view', 'fees.view', 'fees.collect'];
  }
  if (userRoleCode === 'teacher') {
    return ['students.view', 'exams.view'];
  }
  return ['pos.access', 'pos.sales.view'];
}

export function hasPermission(userRoleCode: string, permission: PermissionCode, customRoles?: Role[]): boolean {
  const perms = getUserEffectivePermissions(userRoleCode, customRoles);
  return perms.includes(permission);
}

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    code: 'admin',
    description: 'Full unconstrained access to all ERP modules, roles, and settings.',
    isActive: true,
    permissions: ALL_PERMISSIONS.map((p) => p.code),
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-cashier',
    name: 'POS Cashier',
    code: 'cashier',
    description: 'Restricted to Canteen POS billing, order creation, and receipt printing.',
    isActive: true,
    permissions: [
      'pos.access',
      'pos.sales.view',
      'pos.sales.create',
      'pos.products.view',
    ],
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-manager',
    name: 'Canteen Manager',
    code: 'manager',
    description: 'Manages products, inventory adjustments, shift reconciliations, and reports.',
    isActive: true,
    permissions: [
      'pos.access',
      'pos.sales.view',
      'pos.sales.create',
      'pos.sales.refund',
      'pos.products.view',
      'pos.products.manage',
      'pos.inventory.view',
      'pos.inventory.manage',
      'pos.reports.view',
      'students.view',
    ],
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    code: 'accountant',
    description: 'Manages financial reports, fee collections, and register reconciliations.',
    isActive: true,
    permissions: [
      'pos.reports.view',
      'fees.view',
      'fees.collect',
    ],
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-teacher',
    name: 'Teacher',
    code: 'teacher',
    description: 'View student records, attendance, timetables, and mark sheets.',
    isActive: true,
    permissions: [
      'students.view',
      'exams.view',
    ],
    createdAt: '2026-01-01T08:00:00Z',
  },
  {
    id: 'role-auditor',
    name: 'Auditor',
    code: 'auditor',
    description: 'Read-only access to transaction logs, sales reports, and shift reconciliations.',
    isActive: true,
    permissions: [
      'pos.sales.view',
      'pos.reports.view',
      'pos.inventory.view',
    ],
    createdAt: '2026-01-01T08:00:00Z',
  },
];
