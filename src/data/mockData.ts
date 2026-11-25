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
} from '../types';

/**
 * Clean production baseline — all demo/dummy business records and demo users
 * have been removed. All records are created and managed by authorized
 * Central Super Admin & scoped administrators through persisted backend APIs.
 */
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_STAFF: Staff[] = [];
export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [];
export const INITIAL_BIRTHDAYS: BirthdayItem[] = [];
export const INITIAL_CRM_LEADS: CRMLead[] = [];
export const INITIAL_BUS_ROUTES: BusRoute[] = [];
export const INITIAL_CIRCULARS: Circular[] = [];
export const INITIAL_FEE_RECEIPTS: FeeReceipt[] = [];
export const INITIAL_TC_RECORDS: TransferCertificate[] = [];
export const INITIAL_EXAMS: ExamRecord[] = [];
export const INITIAL_LIBRARY_BOOKS: LibraryBook[] = [];
export const INITIAL_ASSETS: SchoolAsset[] = [];
export const INITIAL_USERS: SystemUser[] = [];
export const INITIAL_CLASSES: SchoolClass[] = [];
export const INITIAL_SUBJECTS: SchoolSubject[] = [];
export const INITIAL_TIMETABLES: TimetableEntry[] = [];
export const INITIAL_NEWS: NewsItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
