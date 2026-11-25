/**
 * TLGS-ERP Dashboard API Service
 *
 * Uses existing API client configuration (ERP_API_CONFIG) to fetch live multi-school
 * dashboard metrics scoped by organization, school, campus, and academic year.
 *
 * Strictly honest behavior:
 *  - Never fabricates fake API responses when an endpoint is unavailable.
 *  - Reports missing/unavailable endpoints explicitly so the UI can display
 *    meaningful status messages and empty states.
 */
import { ERP_API_CONFIG } from './apiClient';

export interface DashboardScopeParams {
  organizationId: string;
  schoolId: string;
  campusId: string;
  academicYearId: string;
}

export interface DashboardKpiResponse {
  totalStudents: number;
  totalStudentsChangePct?: number | null;
  totalTeachers: number;
  totalTeachersChangePct?: number | null;
  feesCollectionAmount: number;
  feesCollectionChangePct?: number | null;
  totalExpensesAmount: number;
  totalExpensesChangePct?: number | null;
}

export interface AttendanceSummaryResponse {
  present: number;
  absent: number;
  leave: number;
  attendancePercentage: number;
}

export interface MonthlyFeeCollectionPoint {
  month: string; // 'Jan' .. 'Dec'
  monthIndex: number; // 0 .. 11
  amount: number;
  isCurrentMonth: boolean;
}

export interface DashboardTransactionItem {
  id: string;
  date: string;
  payerName: string;
  category: string;
  referenceNo: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Partial' | 'Failed';
}

export interface DashboardNotificationItem {
  id: string;
  title: string;
  timestamp: string;
  type: 'timetable' | 'admission' | 'attendance' | 'report' | 'fee';
  isRead?: boolean;
}

export interface SchoolComparisonRow {
  schoolId: string;
  schoolName: string;
  board: string;
  campusCount: number;
  totalStudents: number;
  totalTeachers: number;
  feesCollectionAmount: number;
  totalExpensesAmount: number | null;
}

export interface DashboardApiResult {
  kpis: DashboardKpiResponse | null;
  attendance: AttendanceSummaryResponse | null;
  monthlyFees: MonthlyFeeCollectionPoint[] | null;
  recentTransactions: DashboardTransactionItem[] | null;
  notifications: DashboardNotificationItem[] | null;
  schoolComparisons: SchoolComparisonRow[] | null;
  missingEndpoints: string[];
  errorMessage: string | null;
  fetchedAt: string;
}

export const DASHBOARD_API_ENDPOINTS = {
  summary: '/analytics/dashboard/',
  attendance: '/attendance/summary/',
  monthlyFees: '/fees/monthly-collection/',
  recentTransactions: '/finance/recent-transactions/',
  expenses: '/finance/expenses/',
  notifications: '/communications/notifications/',
} as const;

function buildScopedUrl(path: string, scope: DashboardScopeParams): string {
  const base = ERP_API_CONFIG.baseUrl.replace(/\/$/, '');
  const params = new URLSearchParams();
  if (scope.organizationId && scope.organizationId !== 'all') {
    params.set('organization_id', scope.organizationId);
  }
  if (scope.schoolId && scope.schoolId !== 'all') {
    params.set('school_id', scope.schoolId);
  }
  if (scope.campusId && scope.campusId !== 'all') {
    params.set('campus_id', scope.campusId);
  }
  if (scope.academicYearId) {
    params.set('academic_year_id', scope.academicYearId);
  }
  const qs = params.toString();
  return qs ? `${base}${path}?${qs}` : `${base}${path}`;
}

async function fetchJsonEndpoint<T>(
  url: string,
  signal?: AbortSignal
): Promise<{ data: T | null; unavailable: boolean; status?: number }> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { data: null, unavailable: true, status: res.status };
    }
    const json = (await res.json()) as T;
    return { data: json, unavailable: false, status: res.status };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    return { data: null, unavailable: true };
  }
}

export async function fetchDashboardData(
  scope: DashboardScopeParams,
  signal?: AbortSignal
): Promise<DashboardApiResult> {
  const base = ERP_API_CONFIG.baseUrl.replace(/\/$/, '');
  const missingEndpoints: string[] = [];

  const [
    summaryRes,
    attendanceRes,
    monthlyFeesRes,
    transactionsRes,
    notificationsRes,
    expensesRes,
  ] = await Promise.all([
    fetchJsonEndpoint<{
      kpis?: DashboardKpiResponse;
      school_comparisons?: SchoolComparisonRow[];
    }>(buildScopedUrl(DASHBOARD_API_ENDPOINTS.summary, scope), signal),
    fetchJsonEndpoint<AttendanceSummaryResponse>(
      buildScopedUrl(DASHBOARD_API_ENDPOINTS.attendance, scope),
      signal
    ),
    fetchJsonEndpoint<MonthlyFeeCollectionPoint[]>(
      buildScopedUrl(DASHBOARD_API_ENDPOINTS.monthlyFees, scope),
      signal
    ),
    fetchJsonEndpoint<DashboardTransactionItem[]>(
      buildScopedUrl(DASHBOARD_API_ENDPOINTS.recentTransactions, scope),
      signal
    ),
    fetchJsonEndpoint<DashboardNotificationItem[]>(
      buildScopedUrl(DASHBOARD_API_ENDPOINTS.notifications, scope),
      signal
    ),
    fetchJsonEndpoint<{ totalExpensesAmount?: number }>(
      buildScopedUrl(DASHBOARD_API_ENDPOINTS.expenses, scope),
      signal
    ),
  ]);

  if (summaryRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.summary}`);
  }
  if (attendanceRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.attendance}`);
  }
  if (monthlyFeesRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.monthlyFees}`);
  }
  if (transactionsRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.recentTransactions}`);
  }
  if (expensesRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.expenses}`);
  }
  if (notificationsRes.unavailable) {
    missingEndpoints.push(`GET ${base}${DASHBOARD_API_ENDPOINTS.notifications}`);
  }

  const kpis = summaryRes.data?.kpis ?? null;
  if (kpis && typeof expensesRes.data?.totalExpensesAmount === 'number') {
    kpis.totalExpensesAmount = expensesRes.data.totalExpensesAmount;
  }

  const errorMessage =
    missingEndpoints.length > 0
      ? `${missingEndpoints.length} backend dashboard API endpoint${
          missingEndpoints.length === 1 ? ' is' : 's are'
        } currently unavailable on ${base}.`
      : null;

  return {
    kpis,
    attendance: attendanceRes.data,
    monthlyFees: Array.isArray(monthlyFeesRes.data) ? monthlyFeesRes.data : null,
    recentTransactions: Array.isArray(transactionsRes.data)
      ? transactionsRes.data
      : null,
    notifications: Array.isArray(notificationsRes.data)
      ? notificationsRes.data
      : null,
    schoolComparisons: Array.isArray(summaryRes.data?.school_comparisons)
      ? summaryRes.data!.school_comparisons!
      : null,
    missingEndpoints,
    errorMessage,
    fetchedAt: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
}
