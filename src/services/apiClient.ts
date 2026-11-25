/**
 * Multi-School Management ERP API Service Layer (Frontend Scaffold)
 *
 * Planned Business Backend: Python Django REST Framework (DRF)
 * Planned Relational Database: MySQL 8+
 *
 * Note: During the initial UI milestone, all application views operate on
 * clearly marked local sample preview data. Endpoint functions below define
 * the integration contract for connecting to Django REST APIs in the next phase.
 */

export interface ApiClientConfig {
  baseUrl: string;
  mode: 'preview-local' | 'django-rest';
}

export const ERP_API_CONFIG: ApiClientConfig = {
  baseUrl:
    (typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_DJANGO_API_BASE_URL) ||
    '/api/v1',
  mode: 'preview-local',
};

export interface DjangoEndpointMap {
  organizations: string;
  schools: string;
  campuses: string;
  academicYears: string;
  subjectAllocations: string;
  students: string;
  staff: string;
  attendance: string;
  fees: string;
  examinations: string;
  hr: string;
  finance: string;
  library: string;
  transport: string;
  hostel: string;
  inventory: string;
  communications: string;
  reports: string;
  admin: string;
}

export const DJANGO_ERP_ENDPOINTS: DjangoEndpointMap = {
  organizations: '/organizations/',
  schools: '/schools/',
  campuses: '/campuses/',
  academicYears: '/academic-years/',
  subjectAllocations: '/subject-allocations/',
  students: '/students/',
  staff: '/staff/',
  attendance: '/attendance/',
  fees: '/fees/',
  examinations: '/examinations/',
  hr: '/hr/',
  finance: '/finance/',
  library: '/library/',
  transport: '/transport/',
  hostel: '/hostel/',
  inventory: '/inventory/',
  communications: '/communications/',
  reports: '/reports/',
  admin: '/admin/',
};

export function buildErpApiUrl(
  resource: keyof DjangoEndpointMap,
  queryParams?: Record<string, string | undefined>
): string {
  const base = `${ERP_API_CONFIG.baseUrl.replace(/\/$/, '')}${DJANGO_ERP_ENDPOINTS[resource]}`;
  if (!queryParams) return base;
  const search = new URLSearchParams();
  Object.entries(queryParams).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, v);
  });
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}
