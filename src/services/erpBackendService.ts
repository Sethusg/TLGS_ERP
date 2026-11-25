import {
  AuditLog,
  BirthdayItem,
  BusRoute,
  Circular,
  CRMLead,
  ErpRole,
  ExamRecord,
  FeeReceipt,
  LeaveRequest,
  LibraryBook,
  LoginHistoryEntry,
  NewsItem,
  SchoolAsset,
  SchoolClass,
  SchoolSubject,
  Staff,
  Student,
  SystemUser,
  TimetableEntry,
  TransferCertificate,
} from '../types';
import {
  AcademicYearOption,
  OrganizationOption,
  SchoolOption,
} from '../data/schoolContext';
import { resolveApiUrl } from '../utils/platformRuntime';

export interface AuthenticatedErpUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: ErpRole;
  organizationId: string | null;
  schoolId: string | null;
  campusId: string | null;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

export interface SetupStatusResponse {
  setupRequired: boolean;
  organizationCount: number;
  schoolCount: number;
}

export interface PersistedErpState {
  organizations: OrganizationOption[];
  schools: SchoolOption[];
  academicYears: AcademicYearOption[];
  departments: any[];
  documents: any[];
  students: Student[];
  staff: Staff[];
  users: SystemUser[];
  classes: SchoolClass[];
  subjects: SchoolSubject[];
  timetables: TimetableEntry[];
  feeReceipts: FeeReceipt[];
  expenses: {
    id: string;
    date: string;
    category: string;
    description: string;
    referenceNo: string;
    amount: number;
    status: string;
    schoolId?: string;
    campusId?: string;
  }[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  circulars: Circular[];
  tcRecords: TransferCertificate[];
  libraryBooks: LibraryBook[];
  assets: SchoolAsset[];
  busRoutes: BusRoute[];
  exams: ExamRecord[];
  newsItems: NewsItem[];
  birthdays: BirthdayItem[];
  auditLogs: AuditLog[];
  loginHistory: LoginHistoryEntry[];
  subjectAllocations: any[];
}

// Keep session token strictly in JS memory (never localStorage)
let activeBearerToken: string | null = null;

export function setErpSessionToken(token: string | null): void {
  activeBearerToken = token;
}

export function getErpSessionToken(): string | null {
  return activeBearerToken;
}

async function apiJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (activeBearerToken) {
    headers.Authorization = `Bearer ${activeBearerToken}`;
  }

  const res = await fetch(resolveApiUrl(url), {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with HTTP ${res.status}`);
  }
  return data as T;
}

export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  return apiJson<SetupStatusResponse>('/api/v1/auth/setup-status');
}

export async function setupInitialSuperAdmin(payload: {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ token: string; user: AuthenticatedErpUser }> {
  const res = await apiJson<{ token: string; user: AuthenticatedErpUser }>(
    '/api/v1/auth/setup-super-admin',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setErpSessionToken(res.token);
  return res;
}

export async function loginWithCredentials(
  username: string,
  password: string
): Promise<{ token: string; user: AuthenticatedErpUser }> {
  const res = await apiJson<{ token: string; user: AuthenticatedErpUser }>(
    '/api/v1/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }
  );
  setErpSessionToken(res.token);
  return res;
}

export async function logoutSession(): Promise<void> {
  try {
    if (activeBearerToken) {
      await apiJson('/api/v1/auth/logout', { method: 'POST' });
    }
  } finally {
    setErpSessionToken(null);
  }
}

export async function loadPersistedErpState(): Promise<PersistedErpState> {
  return apiJson<PersistedErpState>('/api/v1/erp/state');
}

export async function saveErpCollection<T>(
  collection: string,
  items: T[]
): Promise<void> {
  if (!activeBearerToken) return;
  await apiJson(`/api/v1/erp/collection/${encodeURIComponent(collection)}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export async function fetchActiveRoles(options?: {
  assignableOnly?: boolean;
}): Promise<{
  roles: {
    id: string;
    code: string;
    name: ErpRole;
    scope: 'Platform' | 'Organization' | 'School' | 'Campus' | 'Personal';
    description: string;
    isSystemRole: boolean;
    isActive: boolean;
  }[];
}> {
  const qs = new URLSearchParams({
    activeOnly: 'true',
    ...(options?.assignableOnly ? { assignable: 'true' } : {}),
  });
  return apiJson(`/api/v1/roles?${qs.toString()}`);
}

export interface DependentHierarchyOptionsResponse {
  organizations: OrganizationOption[];
  schools: SchoolOption[];
  campuses: { id: string; name: string; code: string; city: string }[];
  academicYears: AcademicYearOption[];
  classes: SchoolClass[];
  students: {
    id: string;
    name: string;
    admissionNo: string;
    grade: string;
    section: string;
    schoolId?: string;
    campusId?: string;
  }[];
}

export async function fetchDependentHierarchyOptions(params?: {
  organizationId?: string;
  schoolId?: string;
}): Promise<DependentHierarchyOptionsResponse> {
  const qs = new URLSearchParams();
  if (params?.organizationId) qs.set('organizationId', params.organizationId);
  if (params?.schoolId) qs.set('schoolId', params.schoolId);
  const query = qs.toString();
  return apiJson<DependentHierarchyOptionsResponse>(
    `/api/v1/hierarchy/options${query ? `?${query}` : ''}`
  );
}

export interface UserAccountMutationPayload {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId?: string;
  role: ErpRole;
  password?: string;
  organizationId?: string | null;
  accessScope?: 'all_schools' | 'single_school' | 'selected_schools';
  schoolId?: string | null;
  campusId?: string | null;
  schoolIds?: string[];
  campusIds?: string[];
  academicYearId?: string | null;
  classId?: string | null;
  section?: string | null;
  linkedStudentIds?: string[];
  department?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  status?: 'Active' | 'Inactive';
}

export async function createAuthenticatedUserAccount(
  payload: UserAccountMutationPayload & { password: string }
): Promise<{ user: SystemUser }> {
  return apiJson<{ user: SystemUser }>('/api/v1/auth/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAuthenticatedUserAccount(
  userId: string,
  payload: Partial<UserAccountMutationPayload>
): Promise<{ user: SystemUser }> {
  return apiJson<{ user: SystemUser }>(
    `/api/v1/auth/users/${encodeURIComponent(userId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
}

