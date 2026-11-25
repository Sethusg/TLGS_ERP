import { getErpSessionToken } from './erpBackendService';
import { resolveApiUrl } from '../utils/platformRuntime';

export interface MySqlHealthResponse {
  ok: boolean;
  engine: 'mysql8' | 'local-file-fallback';
  configured: boolean;
  connected: boolean;
  database: string;
  host: string;
  port: number;
  mysqlVersion: string | null;
  tableCount: number;
  latencyMs: number;
  error: string | null;
}

export interface PaginatedApiResponse<T> {
  storageSource: 'mysql' | 'local-store';
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function coreRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getErpSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(resolveApiUrl(`/api/v1${path}`), {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with HTTP ${res.status}`);
  }
  return data as T;
}

export function fetchMySqlDbHealth(): Promise<MySqlHealthResponse> {
  return coreRequest<MySqlHealthResponse>('/db/health');
}

export function listOrganizationsApi(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedApiResponse<any>> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return coreRequest(`/organizations${suffix}`);
}

export function createOrganizationApi(payload: Record<string, unknown>) {
  return coreRequest('/organizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listSchoolsApi(params?: {
  organizationId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedApiResponse<any>> {
  const qs = new URLSearchParams();
  if (params?.organizationId) qs.set('organizationId', params.organizationId);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return coreRequest(`/schools${suffix}`);
}

export function createSchoolApi(payload: Record<string, unknown>) {
  return coreRequest('/schools', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createCampusApi(payload: Record<string, unknown>) {
  return coreRequest('/campuses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listUsersApi(params?: {
  schoolId?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedApiResponse<any>> {
  const qs = new URLSearchParams();
  if (params?.schoolId) qs.set('schoolId', params.schoolId);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params?.search) qs.set('search', params.search);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return coreRequest(`/users${suffix}`);
}

export function deactivateUserApi(userId: string) {
  return coreRequest(`/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
