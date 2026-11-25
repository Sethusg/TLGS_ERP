import {
  Student,
  Staff,
  LeaveRequest,
  ExamRecord,
  FeeReceipt,
  BusRoute,
  TransferCertificate,
  CRMLead,
  BirthdayItem,
  Circular,
  LibraryBook,
  SchoolAsset,
  SystemUser,
  SchoolClass,
  SchoolSubject,
  TimetableEntry,
  NewsItem,
  AuditLog,
  LoginHistoryEntry,
} from '../types';

/**
 * Multi-School Tenant Isolation Filter
 * Filters any entity tagged with schoolId/campusId strictly against the active tenant context.
 */
export function filterByTenant<T extends { schoolId?: string; campusId?: string }>(
  items: T[],
  selectedSchoolId: string,
  selectedCampusId: string
): T[] {
  if (selectedSchoolId === 'all') return items;
  return items.filter((item) => {
    const itemSchool = item.schoolId;
    if (itemSchool && itemSchool !== 'all' && itemSchool !== selectedSchoolId) {
      return false;
    }
    if (selectedCampusId !== 'all' && item.campusId && item.campusId !== 'all') {
      return item.campusId === selectedCampusId;
    }
    return true;
  });
}

/**
 * Clean production baseline — zero demo business records and zero dummy users.
 * Actual tenant-scoped records are loaded from persisted backend APIs.
 */
export const MULTI_SCHOOL_STUDENTS: Student[] = [];
export const MULTI_SCHOOL_STAFF: Staff[] = [];
export const MULTI_SCHOOL_CLASSES: SchoolClass[] = [];
export const MULTI_SCHOOL_FEE_RECEIPTS: FeeReceipt[] = [];
export const MULTI_SCHOOL_LIBRARY_BOOKS: LibraryBook[] = [];
export const MULTI_SCHOOL_ASSETS: SchoolAsset[] = [];
export const MULTI_SCHOOL_EXAMS: ExamRecord[] = [];
export const MULTI_SCHOOL_BUS_ROUTES: BusRoute[] = [];
export const MULTI_SCHOOL_LEAVES: LeaveRequest[] = [];
export const MULTI_SCHOOL_LEADS: CRMLead[] = [];
export const MULTI_SCHOOL_CIRCULARS: Circular[] = [];
export const MULTI_SCHOOL_TC_RECORDS: TransferCertificate[] = [];
export const MULTI_SCHOOL_BIRTHDAYS: BirthdayItem[] = [];
export const MULTI_SCHOOL_SUBJECTS: SchoolSubject[] = [];
export const MULTI_SCHOOL_TIMETABLES: TimetableEntry[] = [];
export const MULTI_SCHOOL_NEWS: NewsItem[] = [];
export const MULTI_SCHOOL_AUDIT_LOGS: AuditLog[] = [];
export const MULTI_SCHOOL_USERS: SystemUser[] = [];
export const INITIAL_LOGIN_HISTORY: LoginHistoryEntry[] = [];
