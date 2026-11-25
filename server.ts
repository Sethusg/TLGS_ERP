import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createPosRouter,
  DEFAULT_SERVER_POS_PERMISSIONS,
  ensurePosStoreCollections,
} from './server/posRoutes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Persistent server-side database directory (zero demo data on fresh install)
const DATA_DIR = path.join(__dirname, '.erp-data');
const STORE_PATH = path.join(DATA_DIR, 'tlgs_erp_store.json');

const SESSION_SECRET =
  process.env.ERP_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

type UserAccessScope = 'all_schools' | 'single_school' | 'selected_schools';

interface StoredRole {
  id: string;
  code: string;
  name: string;
  scope: 'Platform' | 'Organization' | 'School' | 'Campus' | 'Personal';
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
}

interface StoredAuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleId?: string;
  role: string;
  organizationId: string | null;
  accessScope?: UserAccessScope;
  schoolId: string | null;
  campusId: string | null;
  schoolIds?: string[];
  campusIds?: string[];
  academicYearId?: string | null;
  classId?: string | null;
  section?: string | null;
  linkedStudentIds?: string[];
  dob?: string;
  gender?: string;
  address?: string;
  createdBy?: string;
  roleAssignedBy?: string;
  passwordSalt: string;
  passwordHash: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

const DEFAULT_SYSTEM_ROLES: StoredRole[] = [
  { id: 'role-01', code: 'SUPER_ADMIN', name: 'Super Administrator', scope: 'Platform', description: 'Central Super Admin with unrestricted multi-organization and multi-school governance.', isSystemRole: true, isActive: true },
  { id: 'role-02', code: 'ORG_ADMIN', name: 'Organization Administrator', scope: 'Organization', description: 'Governs multiple schools and consolidated reporting within an assigned organization.', isSystemRole: true, isActive: true },
  { id: 'role-03', code: 'SCHOOL_ADMIN', name: 'School Administrator', scope: 'School', description: 'Full operational administration for a single assigned school.', isSystemRole: true, isActive: true },
  { id: 'role-04', code: 'CAMPUS_ADMIN', name: 'Campus Administrator', scope: 'Campus', description: 'Operational head for one or more assigned campus branches.', isSystemRole: true, isActive: true },
  { id: 'role-05', code: 'PRINCIPAL', name: 'Principal', scope: 'School', description: 'Academic & institutional head overseeing curriculum, staff, and student performance.', isSystemRole: true, isActive: true },
  { id: 'role-06', code: 'VICE_PRINCIPAL', name: 'Vice Principal', scope: 'Campus', description: 'Campus academic operations, timetables, discipline, and faculty coordination.', isSystemRole: true, isActive: true },
  { id: 'role-07', code: 'ACAD_COORD', name: 'Academic Coordinator', scope: 'Campus', description: 'Manages classes, sections, subjects, allocations, exams, and LMS content.', isSystemRole: true, isActive: true },
  { id: 'role-08', code: 'CLASS_TEACHER', name: 'Class Teacher', scope: 'Campus', description: 'Homeroom mentor handling daily student attendance, homework, and parent comms.', isSystemRole: true, isActive: true },
  { id: 'role-09', code: 'TEACHER', name: 'Teacher', scope: 'Campus', description: 'Subject teacher managing timetable classes, assignments, and marks entry.', isSystemRole: true, isActive: true },
  { id: 'role-10', code: 'ACCOUNTANT', name: 'Accountant', scope: 'School', description: 'Manages fee structures, fee collection, receipts, ledgers, and expenses.', isSystemRole: true, isActive: true },
  { id: 'role-11', code: 'HR_MANAGER', name: 'HR Manager', scope: 'School', description: 'Oversees recruitment, staff profiles, leaves, appraisals, and payroll.', isSystemRole: true, isActive: true },
  { id: 'role-12', code: 'LIBRARIAN', name: 'Librarian', scope: 'Campus', description: 'Controls book inventory, cataloguing, issue/return circulation, and fines.', isSystemRole: true, isActive: true },
  { id: 'role-13', code: 'TRANSPORT_MGR', name: 'Transport Manager', scope: 'School', description: 'Manages fleet vehicles, drivers, bus routes, stops, and student transport.', isSystemRole: true, isActive: true },
  { id: 'role-14', code: 'HOSTEL_WARDEN', name: 'Hostel Warden', scope: 'Campus', description: 'Supervises hostel blocks, rooms, beds, mess, attendance, and gate passes.', isSystemRole: true, isActive: true },
  { id: 'role-15', code: 'INVENTORY_MGR', name: 'Inventory Manager', scope: 'School', description: 'Manages fixed assets, procurement, stock items, and maintenance logs.', isSystemRole: true, isActive: true },
  { id: 'role-16', code: 'FRONT_OFFICE', name: 'Front Office / Receptionist', scope: 'Campus', description: 'Handles admission enquiries, visitor desk, and front-office circulars.', isSystemRole: true, isActive: true },
  { id: 'role-17', code: 'IT_SUPPORT', name: 'IT Support', scope: 'School', description: 'Supports ERP configuration, devices, user troubleshooting, and monitoring.', isSystemRole: true, isActive: true },
  { id: 'role-18', code: 'PARENT', name: 'Parent', scope: 'Personal', description: 'Guardian portal linked to student attendance, fees, report cards, and notices.', isSystemRole: true, isActive: true },
  { id: 'role-19', code: 'STUDENT', name: 'Student', scope: 'Personal', description: 'Student portal for timetable, homework, LMS resources, and exam results.', isSystemRole: true, isActive: true },
  { id: 'role-20', code: 'POS_ADMIN', name: 'POS Administrator', scope: 'School', description: 'Full control over POS billing, products, barcodes, inventory, purchases, returns, cash registers, GST, reports, and POS settings.', isSystemRole: true, isActive: true },
  { id: 'role-21', code: 'POS_MANAGER', name: 'POS Manager', scope: 'Campus', description: 'Supervises campus POS counters, approves sales returns, discounts, cash register closings, purchases, and POS reports.', isSystemRole: true, isActive: true },
  { id: 'role-22', code: 'POS_CASHIER', name: 'POS Cashier', scope: 'Campus', description: 'Operates assigned POS billing counters, barcode checkout, customer lookup, hold/resume bills, and shift cash register.', isSystemRole: true, isActive: true },
  { id: 'role-23', code: 'POS_INVENTORY', name: 'POS Inventory Manager', scope: 'Campus', description: 'Manages POS products, categories, brands, barcodes, purchases, suppliers, stock adjustments, and inter-campus transfers.', isSystemRole: true, isActive: true },
  { id: 'role-24', code: 'POS_ACCOUNTANT', name: 'POS Accountant', scope: 'School', description: 'Reconciles POS payments, GST summaries, daily expenses, supplier payouts, cash register audits, and accounting ledger postings.', isSystemRole: true, isActive: true },
];

interface ErpDatabaseStore {
  version: number;
  initializedAt: string;
  roles: StoredRole[];
  authUsers: StoredAuthUser[];
  organizations: any[];
  schools: any[];
  academicYears: any[];
  departments: any[];
  documents: any[];
  students: any[];
  staff: any[];
  users: any[];
  classes: any[];
  subjects: any[];
  timetables: any[];
  feeReceipts: any[];
  expenses: any[];
  leaveRequests: any[];
  crmLeads: any[];
  circulars: any[];
  tcRecords: any[];
  libraryBooks: any[];
  assets: any[];
  busRoutes: any[];
  exams: any[];
  newsItems: any[];
  birthdays: any[];
  auditLogs: any[];
  loginHistory: any[];
  subjectAllocations: any[];
  posDiscounts: any[];
  posSales: any[];
  posProducts: any[];
  posInventory: any[];
  posCategories?: any[];
  posBrands?: any[];
  posBarcodes?: any[];
  posCustomers?: any[];
  posSuppliers?: any[];
  posPayments?: any[];
  posReturns?: any[];
  posPurchases?: any[];
  posTransfers?: any[];
  posCounters?: any[];
  posRegisters?: any[];
  posExpenses?: any[];
  posSettings?: any[];
  posAccountingPostings?: any[];
  posPermissions?: Record<string, any>;
}

const ALLOWED_COLLECTIONS = new Set<keyof ErpDatabaseStore>([
  'organizations',
  'schools',
  'academicYears',
  'departments',
  'documents',
  'students',
  'staff',
  'users',
  'classes',
  'subjects',
  'timetables',
  'feeReceipts',
  'expenses',
  'leaveRequests',
  'crmLeads',
  'circulars',
  'tcRecords',
  'libraryBooks',
  'assets',
  'busRoutes',
  'exams',
  'newsItems',
  'birthdays',
  'auditLogs',
  'loginHistory',
  'subjectAllocations',
  'posDiscounts',
  'posSales',
  'posProducts',
  'posInventory',
]);

function createEmptyStore(): ErpDatabaseStore {
  return {
    version: 2,
    initializedAt: new Date().toISOString(),
    roles: DEFAULT_SYSTEM_ROLES.map((r) => ({ ...r })),
    authUsers: [],
    organizations: [],
    schools: [],
    academicYears: [],
    departments: [],
    documents: [],
    students: [],
    staff: [],
    users: [],
    classes: [],
    subjects: [],
    timetables: [],
    feeReceipts: [],
    expenses: [],
    leaveRequests: [],
    crmLeads: [],
    circulars: [],
    tcRecords: [],
    libraryBooks: [],
    assets: [],
    busRoutes: [],
    exams: [],
    newsItems: [],
    birthdays: [],
    auditLogs: [],
    loginHistory: [],
    subjectAllocations: [],
    posDiscounts: [],
    posSales: [],
    posProducts: [],
    posInventory: [],
    posCategories: [],
    posBrands: [],
    posBarcodes: [],
    posCustomers: [],
    posSuppliers: [],
    posPayments: [],
    posReturns: [],
    posPurchases: [],
    posTransfers: [],
    posCounters: [],
    posRegisters: [],
    posExpenses: [],
    posSettings: [],
    posAccountingPostings: [],
    posPermissions: JSON.parse(JSON.stringify(DEFAULT_SERVER_POS_PERMISSIONS)),
  };
}

function loadStore(): ErpDatabaseStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const fresh = createEmptyStore();
      fs.writeFileSync(STORE_PATH, JSON.stringify(fresh, null, 2), 'utf8');
      return fresh;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    const merged = { ...createEmptyStore(), ...parsed };
    if (!Array.isArray(merged.roles) || merged.roles.length === 0) {
      merged.roles = DEFAULT_SYSTEM_ROLES.map((r) => ({ ...r }));
    } else {
      // Non-destructively ensure newly added default roles (e.g. POS roles) exist
      const existingNames = new Set(merged.roles.map((r: StoredRole) => r.name.toLowerCase()));
      for (const defRole of DEFAULT_SYSTEM_ROLES) {
        if (!existingNames.has(defRole.name.toLowerCase())) {
          merged.roles.push({ ...defRole });
        }
      }
    }
    ensurePosStoreCollections(merged);
    return merged;
  } catch {
    return createEmptyStore();
  }
}

function persistStore(store: ErpDatabaseStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpPath, STORE_PATH);
}

function hashPassword(password: string, salt?: string): {
  salt: string;
  hash: string;
} {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto
    .scryptSync(password, actualSalt, 64)
    .toString('hex');
  return { salt: actualSalt, hash: derived };
}

function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

interface SessionPayload {
  sub: string;
  username: string;
  role: string;
  organizationId: string | null;
  accessScope: UserAccessScope;
  schoolId: string | null;
  campusId: string | null;
  schoolIds: string[];
  campusIds: string[];
  exp: number;
  jti: string;
}

const revokedTokens = new Set<string>();

function signSessionToken(user: StoredAuthUser): string {
  const payload: SessionPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    organizationId: user.organizationId,
    accessScope:
      user.accessScope ||
      (user.role === 'Super Administrator' || !user.schoolId || user.schoolId === 'all'
        ? 'all_schools'
        : 'single_school'),
    schoolId: user.schoolId,
    campusId: user.campusId,
    schoolIds: Array.isArray(user.schoolIds)
      ? user.schoolIds
      : user.schoolId && user.schoolId !== 'all'
      ? [user.schoolId]
      : [],
    campusIds: Array.isArray(user.campusIds)
      ? user.campusIds
      : user.campusId && user.campusId !== 'all'
      ? [user.campusId]
      : [],
    exp: Date.now() + TOKEN_TTL_MS,
    jti: crypto.randomBytes(12).toString('hex'),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url'
  );
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!payload.exp || Date.now() > payload.exp) return null;
    if (revokedTokens.has(payload.jti)) return null;
    return payload;
  } catch {
    return null;
  }
}

function sanitizeAuthUser(user: StoredAuthUser) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId || null,
    role: user.role,
    organizationId: user.organizationId,
    accessScope: user.accessScope || (user.schoolId ? 'single_school' : 'all_schools'),
    schoolId: user.schoolId,
    campusId: user.campusId,
    schoolIds: user.schoolIds || (user.schoolId ? [user.schoolId] : []),
    campusIds: user.campusIds || (user.campusId ? [user.campusId] : []),
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  };
}

function isCentralSuperAdmin(role: string): boolean {
  return role === 'Super Administrator';
}

function isSchoolAuthorizedForSession(
  schoolId: string | undefined,
  session: SessionPayload
): boolean {
  if (isCentralSuperAdmin(session.role)) return true;
  if (session.accessScope === 'all_schools') return true;
  if (!schoolId || schoolId === 'all') return true;
  if (session.schoolIds && session.schoolIds.length > 0) {
    return session.schoolIds.includes(schoolId);
  }
  if (session.schoolId && session.schoolId !== 'all') {
    return schoolId === session.schoolId;
  }
  return true;
}

function filterTenantItems<T extends Record<string, any>>(
  items: T[],
  session: SessionPayload
): T[] {
  if (isCentralSuperAdmin(session.role)) return items;
  if (session.accessScope === 'all_schools' && !session.organizationId) return items;
  return items.filter((item) => {
    if (item.schoolId && !isSchoolAuthorizedForSession(item.schoolId, session)) {
      return false;
    }
    if (
      session.campusIds &&
      session.campusIds.length > 0 &&
      item.campusId &&
      item.campusId !== 'all' &&
      !session.campusIds.includes(item.campusId)
    ) {
      return false;
    } else if (
      session.campusId &&
      session.campusId !== 'all' &&
      item.campusId &&
      item.campusId !== 'all' &&
      item.campusId !== session.campusId
    ) {
      return false;
    }
    return true;
  });
}

interface AuthedRequest extends Request {
  erpSession?: SessionPayload;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = process.env.PORT || 3000;
  const httpServer = http.createServer(app);

  let db: ErpDatabaseStore = loadStore();

  const requireAuth = (
    req: AuthedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    const token = header.slice('Bearer '.length).trim();
    const session = verifySessionToken(token);
    if (!session) {
      res.status(401).json({ error: 'Invalid or expired session token.' });
      return;
    }
    const activeUser = db.authUsers.find(
      (u) => u.id === session.sub && u.isActive && !u.isDeleted
    );
    if (!activeUser) {
      res.status(403).json({ error: 'User account is inactive or removed.' });
      return;
    }
    req.erpSession = session;
    next();
  };

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      database: 'connected',
      cleanDatabase: db.organizations.length === 0 && db.students.length === 0,
      setupRequired: db.authUsers.filter((u) => !u.isDeleted).length === 0,
      timestamp: new Date().toISOString(),
    });
  });

  // ---------------------------------------------------------------------------
  // Protected Initial Setup & Authentication APIs (No Public Super Admin Signup)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/auth/setup-status', (_req, res) => {
    const activeAdmins = db.authUsers.filter((u) => !u.isDeleted);
    res.json({
      setupRequired: activeAdmins.length === 0,
      organizationCount: db.organizations.length,
      schoolCount: db.schools.length,
    });
  });

  app.post('/api/v1/auth/setup-super-admin', (req, res) => {
    const existingUsers = db.authUsers.filter((u) => !u.isDeleted);
    if (existingUsers.length > 0) {
      res.status(403).json({
        error:
          'Initial Central Super Admin setup is already completed and permanently locked.',
      });
      return;
    }

    const { username, fullName, email, phone, password } = req.body || {};
    if (
      typeof username !== 'string' ||
      username.trim().length < 3 ||
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof password !== 'string' ||
      password.length < 10
    ) {
      res.status(400).json({
        error:
          'Valid full name, username (min 3 chars), email, and strong password (min 10 chars) are required.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const { salt, hash } = hashPassword(password);
    const superAdmin: StoredAuthUser = {
      id: `usr-super-${Date.now()}`,
      username: username.trim().toLowerCase(),
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      role: 'Super Administrator',
      organizationId: null,
      schoolId: null,
      campusId: null,
      passwordSalt: salt,
      passwordHash: hash,
      isActive: true,
      isDeleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLogin: nowIso,
    };

    db.authUsers.push(superAdmin);
    db.users.push({
      id: superAdmin.id,
      username: superAdmin.username,
      fullName: superAdmin.fullName,
      email: superAdmin.email,
      role: 'Super Administrator',
      status: 'Active',
      lastLogin: nowIso,
      schoolId: 'all',
      campusId: 'all',
    });
    db.loginHistory.unshift({
      id: `lh-${Date.now()}`,
      userId: superAdmin.id,
      username: superAdmin.username,
      fullName: superAdmin.fullName,
      role: superAdmin.role,
      schoolId: 'all',
      campusId: 'all',
      timestamp: nowIso,
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
    });
    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      timestamp: nowIso,
      userID: superAdmin.username,
      userName: superAdmin.fullName,
      actionType: 'CREATE',
      referenceID: superAdmin.id,
      remarks: 'Initial Central Super Admin account provisioned on clean ERP installation.',
    });
    persistStore(db);

    const token = signSessionToken(superAdmin);
    res.status(201).json({
      token,
      user: sanitizeAuthUser(superAdmin),
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const normalized = username.trim().toLowerCase();
    const user = db.authUsers.find(
      (u) =>
        !u.isDeleted &&
        (u.username.toLowerCase() === normalized ||
          u.email.toLowerCase() === normalized)
    );

    if (
      !user ||
      !verifyPassword(password, user.passwordSalt, user.passwordHash)
    ) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        error: 'This account is deactivated. Contact your Central Super Admin.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    user.lastLogin = nowIso;
    db.loginHistory.unshift({
      id: `lh-${Date.now()}`,
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      schoolId: user.schoolId || 'all',
      campusId: user.campusId || 'all',
      timestamp: nowIso,
      status: 'Success',
      ipAddress: req.ip || '127.0.0.1',
    });
    persistStore(db);

    const token = signSessionToken(user);
    res.json({
      token,
      user: sanitizeAuthUser(user),
    });
  });

  app.get('/api/v1/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const user = db.authUsers.find((u) => u.id === req.erpSession?.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: sanitizeAuthUser(user) });
  });

  app.post('/api/v1/auth/logout', requireAuth, (req: AuthedRequest, res) => {
    if (req.erpSession?.jti) {
      revokedTokens.add(req.erpSession.jti);
    }
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Dynamic Role Management & Dependent Hierarchy Options APIs
  // ---------------------------------------------------------------------------
  app.get('/api/v1/roles', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    const activeOnly = req.query.activeOnly !== 'false';
    const assignableOnly = req.query.assignable === 'true';

    let list = db.roles || DEFAULT_SYSTEM_ROLES;
    if (activeOnly) {
      list = list.filter((r) => r.isActive);
    }
    if (assignableOnly && !isCentralSuperAdmin(session.role)) {
      list = list.filter((r) => r.name !== 'Super Administrator');
      if (session.role !== 'Organization Administrator') {
        list = list.filter((r) => r.name !== 'Organization Administrator');
      }
    }
    res.json({ roles: list });
  });

  app.post('/api/v1/roles', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    if (!isCentralSuperAdmin(session.role)) {
      res.status(403).json({
        error: 'Only Central Super Admin can create new dynamic roles.',
      });
      return;
    }
    const { name, code, scope, description, isActive } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Role name (min 2 characters) is required.' });
      return;
    }
    const cleanName = name.trim();
    if (db.roles.some((r) => r.name.toLowerCase() === cleanName.toLowerCase())) {
      res.status(409).json({ error: `Role "${cleanName}" already exists.` });
      return;
    }
    const validScopes = new Set(['Platform', 'Organization', 'School', 'Campus', 'Personal']);
    const resolvedScope = (validScopes.has(scope) ? scope : 'Campus') as StoredRole['scope'];
    const created: StoredRole = {
      id: `role-custom-${Date.now()}`,
      code:
        (typeof code === 'string' && code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_')) ||
        cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
      name: cleanName,
      scope: resolvedScope,
      description: typeof description === 'string' ? description.trim() : '',
      isSystemRole: false,
      isActive: isActive !== false,
    };
    db.roles.push(created);
    persistStore(db);
    res.status(201).json({ role: created });
  });

  app.put('/api/v1/roles/:id', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    if (!isCentralSuperAdmin(session.role)) {
      res.status(403).json({ error: 'Only Central Super Admin can update roles.' });
      return;
    }
    const idx = db.roles.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Role not found.' });
      return;
    }
    const b = req.body || {};
    db.roles[idx] = {
      ...db.roles[idx],
      description: typeof b.description === 'string' ? b.description.trim() : db.roles[idx].description,
      isActive: typeof b.isActive === 'boolean' ? b.isActive : db.roles[idx].isActive,
    };
    persistStore(db);
    res.json({ role: db.roles[idx] });
  });

  app.get('/api/v1/hierarchy/options', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    const organizationId =
      typeof req.query.organizationId === 'string' && req.query.organizationId !== 'all'
        ? req.query.organizationId
        : null;
    const schoolId =
      typeof req.query.schoolId === 'string' && req.query.schoolId !== 'all'
        ? req.query.schoolId
        : null;

    const authorizedOrgs = isCentralSuperAdmin(session.role)
      ? db.organizations
      : db.organizations.filter(
          (o) => !session.organizationId || o.id === session.organizationId
        );

    let authorizedSchools = isCentralSuperAdmin(session.role)
      ? db.schools
      : db.schools.filter((s) => isSchoolAuthorizedForSession(s.id, session));

    if (organizationId) {
      authorizedSchools = authorizedSchools.filter(
        (s) => s.organizationId === organizationId || !s.organizationId
      );
    }

    const selectedSchoolObj = schoolId
      ? authorizedSchools.find((s) => s.id === schoolId)
      : null;

    let campuses = selectedSchoolObj ? selectedSchoolObj.campuses || [] : [];
    if (
      !isCentralSuperAdmin(session.role) &&
      session.campusIds &&
      session.campusIds.length > 0
    ) {
      campuses = campuses.filter((c: any) => session.campusIds.includes(c.id));
    }

    const classes = schoolId
      ? filterTenantItems(db.classes, session).filter((c) => c.schoolId === schoolId)
      : filterTenantItems(db.classes, session);

    const students = schoolId
      ? filterTenantItems(db.students, session).filter((st) => st.schoolId === schoolId)
      : filterTenantItems(db.students, session);

    res.json({
      organizations: authorizedOrgs,
      schools: authorizedSchools,
      campuses,
      academicYears: db.academicYears,
      classes,
      students: students.map((st: any) => ({
        id: st.id,
        name: st.name,
        admissionNo: st.admissionNo,
        grade: st.grade,
        section: st.section,
        schoolId: st.schoolId,
        campusId: st.campusId,
      })),
    });
  });

  // Helper to resolve & enforce school access scope during User Create / Update
  function resolveValidatedUserAccess(
    body: any,
    session: SessionPayload
  ): {
    error?: { status: number; message: string };
    roleRecord?: StoredRole;
    organizationId: string | null;
    accessScope: UserAccessScope;
    schoolId: string | null;
    campusId: string | null;
    schoolIds: string[];
    campusIds: string[];
  } {
    const {
      roleId,
      role,
      organizationId,
      accessScope,
      schoolId,
      campusId,
      schoolIds,
      campusIds,
    } = body || {};

    const activeRoles = (db.roles || DEFAULT_SYSTEM_ROLES).filter((r) => r.isActive);
    const matchedRole =
      (roleId && activeRoles.find((r) => r.id === roleId)) ||
      (role && activeRoles.find((r) => r.name === role));

    if (!matchedRole) {
      return {
        error: {
          status: 400,
          message: 'Selected role does not exist or is inactive in Role Management.',
        },
        organizationId: null,
        accessScope: 'single_school',
        schoolId: null,
        campusId: null,
        schoolIds: [],
        campusIds: [],
      };
    }

    if (
      matchedRole.name === 'Super Administrator' &&
      !isCentralSuperAdmin(session.role)
    ) {
      return {
        error: {
          status: 403,
          message: 'Only a Central Super Admin can assign the Super Administrator role.',
        },
        organizationId: null,
        accessScope: 'single_school',
        schoolId: null,
        campusId: null,
        schoolIds: [],
        campusIds: [],
      };
    }

    if (
      matchedRole.name === 'Organization Administrator' &&
      !isCentralSuperAdmin(session.role) &&
      session.role !== 'Organization Administrator'
    ) {
      return {
        error: {
          status: 403,
          message: 'You are not authorized to assign Organization Administrator.',
        },
        organizationId: null,
        accessScope: 'single_school',
        schoolId: null,
        campusId: null,
        schoolIds: [],
        campusIds: [],
      };
    }

    const requestedScope: UserAccessScope =
      accessScope === 'all_schools' ||
      accessScope === 'selected_schools' ||
      accessScope === 'single_school'
        ? accessScope
        : schoolId === 'all' || !schoolId
        ? 'all_schools'
        : 'single_school';

    if (
      requestedScope === 'all_schools' &&
      !isCentralSuperAdmin(session.role) &&
      session.role !== 'Organization Administrator'
    ) {
      return {
        error: {
          status: 403,
          message: 'All Schools access requires Central Super Admin or Organization Admin authorization.',
        },
        organizationId: null,
        accessScope: 'single_school',
        schoolId: null,
        campusId: null,
        schoolIds: [],
        campusIds: [],
      };
    }

    const resolvedOrgId =
      organizationId && organizationId !== 'all'
        ? String(organizationId)
        : session.organizationId || null;

    let resolvedSchoolIds: string[] = Array.isArray(schoolIds)
      ? schoolIds.filter((s: unknown): s is string => typeof s === 'string' && s !== 'all' && s.trim().length > 0)
      : [];
    let resolvedCampusIds: string[] = Array.isArray(campusIds)
      ? campusIds.filter((c: unknown): c is string => typeof c === 'string' && c !== 'all' && c.trim().length > 0)
      : [];

    if (requestedScope === 'all_schools') {
      resolvedSchoolIds = [];
      resolvedCampusIds = [];
    } else if (requestedScope === 'single_school') {
      const targetSchool =
        schoolId && schoolId !== 'all'
          ? String(schoolId)
          : resolvedSchoolIds[0] || session.schoolId || null;
      if (targetSchool && !isSchoolAuthorizedForSession(targetSchool, session)) {
        return {
          error: {
            status: 403,
            message: 'You cannot assign users to an unauthorized school.',
          },
          organizationId: resolvedOrgId,
          accessScope: requestedScope,
          schoolId: null,
          campusId: null,
          schoolIds: [],
          campusIds: [],
        };
      }
      resolvedSchoolIds = targetSchool ? [targetSchool] : [];
      if (campusId && campusId !== 'all' && resolvedCampusIds.length === 0) {
        resolvedCampusIds = [String(campusId)];
      }
    } else {
      // selected_schools
      for (const sid of resolvedSchoolIds) {
        if (!isSchoolAuthorizedForSession(sid, session)) {
          return {
            error: {
              status: 403,
              message: 'One or more selected schools are outside your authorized scope.',
            },
            organizationId: resolvedOrgId,
            accessScope: requestedScope,
            schoolId: null,
            campusId: null,
            schoolIds: [],
            campusIds: [],
          };
        }
      }
    }

    const primarySchoolId =
      requestedScope === 'all_schools'
        ? null
        : resolvedSchoolIds[0] || (schoolId && schoolId !== 'all' ? String(schoolId) : null);
    const primaryCampusId =
      requestedScope === 'all_schools'
        ? null
        : resolvedCampusIds[0] || (campusId && campusId !== 'all' ? String(campusId) : null);

    return {
      roleRecord: matchedRole,
      organizationId: resolvedOrgId,
      accessScope: requestedScope,
      schoolId: primarySchoolId,
      campusId: primaryCampusId,
      schoolIds: resolvedSchoolIds,
      campusIds: resolvedCampusIds,
    };
  }

  // Super Admin / Authorized Admin creates real ERP user accounts with hashed passwords & school access
  app.post('/api/v1/auth/users', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    if (
      session.role !== 'Super Administrator' &&
      session.role !== 'Organization Administrator' &&
      session.role !== 'School Administrator'
    ) {
      res.status(403).json({
        error: 'Only authorized administrators may create user accounts.',
      });
      return;
    }

    const {
      username,
      fullName,
      email,
      phone,
      password,
      academicYearId,
      classId,
      section,
      linkedStudentIds,
      dob,
      gender,
      address,
      department,
      status,
    } = req.body || {};

    if (
      typeof username !== 'string' ||
      username.trim().length < 3 ||
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      res.status(400).json({
        error:
          'Full name, username (min 3 chars), valid email, and password (min 8 chars) are required.',
      });
      return;
    }

    const validated = resolveValidatedUserAccess(req.body, session);
    if (validated.error || !validated.roleRecord) {
      res
        .status(validated.error?.status || 400)
        .json({ error: validated.error?.message || 'Invalid role or access scope.' });
      return;
    }

    const normalizedUser = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    if (
      db.authUsers.some(
        (u) =>
          !u.isDeleted &&
          (u.username.toLowerCase() === normalizedUser ||
            u.email.toLowerCase() === normalizedEmail)
      )
    ) {
      res.status(409).json({
        error: 'A user account with this username or email already exists.',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const { salt, hash } = hashPassword(password);
    const isActiveFlag = status !== 'Inactive';

    const created: StoredAuthUser = {
      id: `usr-${Date.now()}`,
      username: normalizedUser,
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : '',
      roleId: validated.roleRecord.id,
      role: validated.roleRecord.name,
      organizationId: validated.organizationId,
      accessScope: validated.accessScope,
      schoolId: validated.schoolId,
      campusId: validated.campusId,
      schoolIds: validated.schoolIds,
      campusIds: validated.campusIds,
      academicYearId: academicYearId || null,
      classId: classId || null,
      section: section || null,
      linkedStudentIds: Array.isArray(linkedStudentIds) ? linkedStudentIds : [],
      dob: typeof dob === 'string' ? dob : undefined,
      gender: typeof gender === 'string' ? gender : undefined,
      address: typeof address === 'string' ? address : undefined,
      createdBy: session.username,
      roleAssignedBy: session.username,
      passwordSalt: salt,
      passwordHash: hash,
      isActive: isActiveFlag,
      isDeleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLogin: null,
    };

    db.authUsers.push(created);
    const uiUser = {
      id: created.id,
      username: created.username,
      fullName: created.fullName,
      email: created.email,
      phone: created.phone,
      roleId: created.roleId,
      role: created.role,
      organizationId: created.organizationId || 'all',
      accessScope: created.accessScope,
      schoolId: created.schoolId || 'all',
      campusId: created.campusId || 'all',
      schoolIds: created.schoolIds || [],
      campusIds: created.campusIds || [],
      academicYearId: created.academicYearId || undefined,
      classId: created.classId || undefined,
      section: created.section || undefined,
      linkedStudentIds: created.linkedStudentIds || [],
      department: typeof department === 'string' ? department : 'General',
      dob: created.dob,
      gender: created.gender,
      address: created.address,
      status: isActiveFlag ? 'Active' : 'Inactive',
      createdBy: created.createdBy,
      roleAssignedBy: created.roleAssignedBy,
      createdDate: nowIso,
      lastLogin: 'Never logged in',
    };
    db.users.unshift(uiUser);
    persistStore(db);

    res.status(201).json({ user: uiUser });
  });

  // Update existing user role, access scope, school/campus assignments, or active status
  app.put('/api/v1/auth/users/:id', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    if (
      session.role !== 'Super Administrator' &&
      session.role !== 'Organization Administrator' &&
      session.role !== 'School Administrator'
    ) {
      res.status(403).json({
        error: 'Only authorized administrators may modify user accounts.',
      });
      return;
    }

    const userId = req.params.id;
    const authTarget = db.authUsers.find((u) => u.id === userId && !u.isDeleted);
    const uiIdx = db.users.findIndex((u) => u.id === userId);
    if (!authTarget && uiIdx === -1) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const validated = resolveValidatedUserAccess(req.body, session);
    if (validated.error || !validated.roleRecord) {
      res
        .status(validated.error?.status || 400)
        .json({ error: validated.error?.message || 'Invalid role or access scope.' });
      return;
    }

    const {
      fullName,
      email,
      phone,
      password,
      academicYearId,
      classId,
      section,
      linkedStudentIds,
      dob,
      gender,
      address,
      department,
      status,
    } = req.body || {};

    const nowIso = new Date().toISOString();
    const isActiveFlag = status !== 'Inactive';

    if (authTarget) {
      if (typeof fullName === 'string' && fullName.trim()) authTarget.fullName = fullName.trim();
      if (typeof email === 'string' && email.includes('@')) authTarget.email = email.trim().toLowerCase();
      if (typeof phone === 'string') authTarget.phone = phone.trim();
      authTarget.roleId = validated.roleRecord.id;
      authTarget.role = validated.roleRecord.name;
      authTarget.organizationId = validated.organizationId;
      authTarget.accessScope = validated.accessScope;
      authTarget.schoolId = validated.schoolId;
      authTarget.campusId = validated.campusId;
      authTarget.schoolIds = validated.schoolIds;
      authTarget.campusIds = validated.campusIds;
      authTarget.academicYearId = academicYearId || null;
      authTarget.classId = classId || null;
      authTarget.section = section || null;
      authTarget.linkedStudentIds = Array.isArray(linkedStudentIds) ? linkedStudentIds : [];
      if (typeof dob === 'string') authTarget.dob = dob;
      if (typeof gender === 'string') authTarget.gender = gender;
      if (typeof address === 'string') authTarget.address = address;
      authTarget.roleAssignedBy = session.username;
      authTarget.isActive = isActiveFlag;
      authTarget.updatedAt = nowIso;
      if (typeof password === 'string' && password.length >= 8) {
        const { salt, hash } = hashPassword(password);
        authTarget.passwordSalt = salt;
        authTarget.passwordHash = hash;
      }
    }

    const existingUi = uiIdx >= 0 ? db.users[uiIdx] : {};
    const updatedUi = {
      ...existingUi,
      id: userId,
      username: authTarget?.username || existingUi.username,
      fullName:
        (typeof fullName === 'string' && fullName.trim()) ||
        authTarget?.fullName ||
        existingUi.fullName,
      email:
        (typeof email === 'string' && email.trim().toLowerCase()) ||
        authTarget?.email ||
        existingUi.email,
      phone: typeof phone === 'string' ? phone.trim() : existingUi.phone || '',
      roleId: validated.roleRecord.id,
      role: validated.roleRecord.name,
      organizationId: validated.organizationId || 'all',
      accessScope: validated.accessScope,
      schoolId: validated.schoolId || 'all',
      campusId: validated.campusId || 'all',
      schoolIds: validated.schoolIds,
      campusIds: validated.campusIds,
      academicYearId: academicYearId || undefined,
      classId: classId || undefined,
      section: section || undefined,
      linkedStudentIds: Array.isArray(linkedStudentIds) ? linkedStudentIds : [],
      department: typeof department === 'string' ? department : existingUi.department || 'General',
      dob: typeof dob === 'string' ? dob : existingUi.dob,
      gender: typeof gender === 'string' ? gender : existingUi.gender,
      address: typeof address === 'string' ? address : existingUi.address,
      status: isActiveFlag ? 'Active' : 'Inactive',
      roleAssignedBy: session.username,
    };

    if (uiIdx >= 0) {
      db.users[uiIdx] = updatedUi;
    } else {
      db.users.unshift(updatedUi);
    }
    persistStore(db);

    res.json({ user: updatedUi });
  });

  // ---------------------------------------------------------------------------
  // Persisted Multi-Tenant ERP State & Collection APIs
  // ---------------------------------------------------------------------------
  app.get('/api/v1/erp/state', requireAuth, (req: AuthedRequest, res) => {
    const session = req.erpSession!;
    res.json({
      organizations: isCentralSuperAdmin(session.role)
        ? db.organizations
        : db.organizations.filter(
            (o) => !session.organizationId || o.id === session.organizationId
          ),
      schools: isCentralSuperAdmin(session.role)
        ? db.schools
        : db.schools.filter((s) => isSchoolAuthorizedForSession(s.id, session)),
      academicYears: db.academicYears,
      departments: filterTenantItems(db.departments, session),
      documents: filterTenantItems(db.documents, session),
      students: filterTenantItems(db.students, session),
      staff: filterTenantItems(db.staff, session),
      users: filterTenantItems(db.users, session),
      classes: filterTenantItems(db.classes, session),
      subjects: filterTenantItems(db.subjects, session),
      timetables: filterTenantItems(db.timetables, session),
      feeReceipts: filterTenantItems(db.feeReceipts, session),
      expenses: filterTenantItems(db.expenses, session),
      leaveRequests: filterTenantItems(db.leaveRequests, session),
      crmLeads: filterTenantItems(db.crmLeads, session),
      circulars: filterTenantItems(db.circulars, session),
      tcRecords: filterTenantItems(db.tcRecords, session),
      libraryBooks: filterTenantItems(db.libraryBooks, session),
      assets: filterTenantItems(db.assets, session),
      busRoutes: filterTenantItems(db.busRoutes, session),
      exams: filterTenantItems(db.exams, session),
      newsItems: filterTenantItems(db.newsItems, session),
      birthdays: filterTenantItems(db.birthdays, session),
      auditLogs: filterTenantItems(db.auditLogs, session),
      loginHistory: filterTenantItems(db.loginHistory, session),
      subjectAllocations: filterTenantItems(db.subjectAllocations, session),
    });
  });

  app.put(
    '/api/v1/erp/collection/:name',
    requireAuth,
    (req: AuthedRequest, res) => {
      const session = req.erpSession!;
      const name = req.params.name as keyof ErpDatabaseStore;
      if (!ALLOWED_COLLECTIONS.has(name)) {
        res.status(400).json({ error: `Unsupported collection: ${name}` });
        return;
      }

      if (
        (name === 'organizations' ||
          name === 'schools' ||
          name === 'academicYears') &&
        session.role !== 'Super Administrator' &&
        session.role !== 'Organization Administrator'
      ) {
        res.status(403).json({
          error:
            'Only Central Super Admin or Organization Admin can modify institutional hierarchy records.',
        });
        return;
      }

      const items = req.body?.items;
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Request body must include an items array.' });
        return;
      }

      // Preserve records belonging to other tenants when a scoped role updates
      if (!isCentralSuperAdmin(session.role) && session.schoolId) {
        const existing = (db[name] as any[]) || [];
        const otherTenantRecords = existing.filter(
          (item) => item.schoolId && item.schoolId !== session.schoolId
        );
        const scopedIncoming = items.map((item) => ({
          ...item,
          schoolId: item.schoolId || session.schoolId,
          campusId:
            session.campusId && session.campusId !== 'all'
              ? session.campusId
              : item.campusId,
        }));
        (db[name] as any[]) = [...scopedIncoming, ...otherTenantRecords];
      } else {
        (db[name] as any[]) = items;
      }

      persistStore(db);
      res.json({
        success: true,
        collection: name,
        count: (db[name] as any[]).length,
      });
    }
  );

  // Clean Legacy / POS REST Endpoints (zero demo data, backed by persisted store)
  app.get('/api/students', requireAuth, (req: AuthedRequest, res) => {
    res.json(filterTenantItems(db.students, req.erpSession!));
  });

  app.post('/api/students', requireAuth, (req: AuthedRequest, res) => {
    const newStudent = { id: `std-${Date.now()}`, ...req.body };
    db.students.unshift(newStudent);
    persistStore(db);
    res.status(201).json(newStudent);
  });

  app.get('/api/staff', requireAuth, (req: AuthedRequest, res) => {
    res.json(filterTenantItems(db.staff, req.erpSession!));
  });

  // Mount Complete Multi-School Point of Sale (POS) API Router
  app.use(
    '/api/v1/pos',
    createPosRouter({
      getDb: () => db,
      persist: () => persistStore(db),
      requireAuth,
      isSchoolAuthorized: isSchoolAuthorizedForSession,
      filterTenant: filterTenantItems,
    })
  );

  app.get('/api/pos/discounts', requireAuth, (_req, res) => {
    res.json(db.posDiscounts);
  });

  app.post('/api/pos/discounts', requireAuth, (req, res) => {
    const newRule = {
      id: `disc-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.posDiscounts.push(newRule);
    persistStore(db);
    res.status(201).json(newRule);
  });

  app.get('/api/pos/sales', requireAuth, (_req, res) => {
    res.json(db.posSales);
  });

  app.post('/api/pos/sales', requireAuth, (req, res) => {
    const sale = {
      id: `sale-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.posSales.unshift(sale);
    persistStore(db);
    res.status(201).json(sale);
  });

  app.get('/api/pos/products', requireAuth, (_req, res) => {
    res.json(db.posProducts);
  });

  app.post('/api/pos/products', requireAuth, (req, res) => {
    const product = { id: `prod-${Date.now()}`, ...req.body };
    db.posProducts.push(product);
    persistStore(db);
    res.status(201).json(product);
  });

  app.get('/api/pos/inventory', requireAuth, (_req, res) => {
    res.json(db.posInventory);
  });

  app.post('/api/pos/inventory', requireAuth, (req, res) => {
    const movement = {
      id: `mov-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...req.body,
    };
    db.posInventory.unshift(movement);
    persistStore(db);
    res.status(201).json(movement);
  });

  // Vite middleware integration for development (shares port 3000 HTTP/WS cleanly)
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        ws: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`TLGS-ERP Server running on port ${PORT}`);
  });
}

startServer();
