export type NavSection =
  | 'HOME'
  | 'ORGANIZATION'
  | 'ACADEMICS'
  | 'STUDENT'
  | 'STAFFS'
  | 'ATTENDANCE'
  | 'FEE MANAGEMENT'
  | 'MARKCHART'
  | 'HR'
  | 'FINANCE'
  | 'LIBRARY'
  | 'TRANSPORT'
  | 'HOSTEL'
  | 'INVENTORY'
  | 'COMMUNICATIONS'
  | 'REPORTS'
  | 'ADMIN'
  | 'LMS'
  | 'CONTACT'
  | 'SCHOOL'
  | 'TC'
  | 'SETTINGS'
  | 'ASSET'
  | 'SUPPLIES'
  | 'ID_CARDS'
  | 'CANTEEN'
  | 'POS'
  | 'CUSTOM_MENU';

export type ErpRole =
  | 'Super Administrator'
  | 'Organization Administrator'
  | 'School Administrator'
  | 'Campus Administrator'
  | 'Principal'
  | 'Vice Principal'
  | 'Academic Coordinator'
  | 'Admission Officer'
  | 'Accountant'
  | 'HR Manager'
  | 'Teacher'
  | 'Class Teacher'
  | 'Librarian'
  | 'Transport Manager'
  | 'Hostel Warden'
  | 'Inventory Manager'
  | 'Front Office Staff'
  | 'Parent'
  | 'Student'
  | 'POS Administrator'
  | 'POS Manager'
  | 'POS Cashier'
  | 'POS Inventory Manager'
  | 'POS Accountant';

export type AccessScope = 'Platform' | 'Organization' | 'School' | 'Campus' | 'Personal';

export interface CrudPermissionSet {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export type RolePermissionMatrix = Record<ErpRole, Partial<Record<NavSection, CrudPermissionSet>>>;

export type MenuVisibilityMap = Partial<Record<NavSection, boolean>>;

export interface MenuOperationPermissions {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
  activate: boolean;
  deactivate: boolean;
}

export type RoleMenuPermissionMap = Record<ErpRole, MenuOperationPermissions>;

export type MenuIconName =
  | 'LayoutDashboard'
  | 'Building2'
  | 'BookOpen'
  | 'GraduationCap'
  | 'Users'
  | 'CalendarCheck'
  | 'CreditCard'
  | 'ClipboardCheck'
  | 'Briefcase'
  | 'Landmark'
  | 'Library'
  | 'Bus'
  | 'BedDouble'
  | 'Boxes'
  | 'MessageSquare'
  | 'BarChart3'
  | 'ShieldCheck'
  | 'FolderKanban'
  | 'Award'
  | 'Globe'
  | 'Bell'
  | 'FileText'
  | 'Settings'
  | 'Layers'
  | 'HeartHandshake'
  | 'Sparkles'
  | 'Compass'
  | 'Cpu'
  | 'ShoppingCart';

export interface ManagedSubMenu {
  id: string;
  parentId: string;
  label: string;
  description: string;
  iconName: MenuIconName;
  actionId: string;
  targetSection?: NavSection;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  isSystem?: boolean;
  allowedRoles?: ErpRole[];
  allowedSchoolIds?: string[];
  allowedCampusIds?: string[];
}

export interface ManagedMainMenu {
  id: string;
  section: NavSection;
  label: string;
  shortLabel: string;
  description: string;
  iconName: MenuIconName;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  isSystem?: boolean;
  allowedOrganizations?: string[];
  allowedRoles?: ErpRole[];
  allowedSchoolIds?: string[];
  allowedCampusIds?: string[];
  subItems: ManagedSubMenu[];
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  role: ErpRole;
  schoolId: string;
  schoolName: string;
  campusId: string;
  campusName: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  status: 'Success' | 'Failed' | 'Deactivated';
}

export interface EducationBoard {
  id: string;
  code: string;
  name: string;
  affiliationBody: string;
  gradingScale: string;
  medium: string;
  status: 'Active' | 'Inactive';
}

export type SubMenuAction = {
  label: string;
  actionId: string;
  icon?: string;
};

export interface Student {
  id: string;
  schoolId?: string;
  campusId?: string;
  academicYearId?: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  grade: string;
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  fatherName: string;
  motherName: string;
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  photoUrl?: string;
  busRoute?: string;
  feeStatus: 'Paid' | 'Partial' | 'Pending';
  dueAmount: number;
  attendancePercent: number;
}

export type StaffRole =
  | 'Teacher'
  | 'Administrator'
  | 'Support Staff'
  | 'Lab Assistant'
  | 'Transport Staff'
  | 'Counselor'
  | 'Sports Coach';

export interface ArchivedStaffDetails {
  departureDate: string;
  reason: 'Resignation' | 'Retirement' | 'Relocation' | 'Contract Completion' | 'Transfer' | 'Other';
  relievingLetterNo: string;
  handoverCompleted: boolean;
  libraryClearance: boolean;
  accountsClearance: boolean;
  labClearance: boolean;
  remarks?: string;
}

export interface Staff {
  id: string;
  schoolId?: string;
  campusId?: string;
  empId: string;
  name: string;
  role: StaffRole;
  designation: string;
  department: string;
  subject?: string;
  assignedClasses?: string[];
  responsibilities: string[];
  qualification: string;
  specialization?: string;
  experienceYears?: number;
  employmentType: 'Full-Time Permanent' | 'Probationary' | 'Contractual' | 'Visiting Faculty';
  joiningDate: string;
  phone: string;
  email: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  status: 'Active' | 'On Leave' | 'Archived' | 'Resigned';
  leaveBalance: number;
  bloodGroup?: string;
  photoUrl?: string;
  archivedDetails?: ArchivedStaffDetails;
}

export interface LeaveRequest {
  id: string;
  schoolId?: string;
  campusId?: string;
  staffId: string;
  staffName: string;
  empId: string;
  department: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity/Paternity' | 'Special Leave';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  remarks?: string;
}

export interface ExamRecord {
  id: string;
  schoolId?: string;
  campusId?: string;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  examName: string;
  subjects: {
    name: string;
    marksObtained: number;
    maxMarks: number;
    grade: string;
  }[];
  totalMarks: number;
  maxTotal: number;
  percentage: number;
  overallGrade: string;
  rank: number;
  term: 'Term 1' | 'Term 2' | 'Mid-Term' | 'Annual';
  isFinalized?: boolean;
}

export interface FeeReceipt {
  receiptNo: string;
  schoolId?: string;
  campusId?: string;
  date: string;
  studentId: string;
  studentName: string;
  grade: string;
  section: string;
  admissionNo: string;
  tuitionFee: number;
  transportFee: number;
  labFee: number;
  examFee: number;
  concession: number;
  totalPaid: number;
  paymentMode: 'Cash' | 'Online/UPI' | 'Cheque' | 'POS Card';
  transactionId?: string;
  collectedBy: string;
}

export interface BusRoute {
  id: string;
  schoolId?: string;
  campusId?: string;
  busNo: string;
  driverName: string;
  driverPhone: string;
  routeTitle: string;
  capacity: number;
  studentsOnBoard: number;
  status: 'In Transit' | 'Arrived at School' | 'Stopped' | 'Depot';
  currentLocationName: string;
  stops: {
    stopName: string;
    morningTime: string;
    eveningTime: string;
    studentCount: number;
  }[];
  speedKmh: number;
}

export interface TransferCertificate {
  tcNo: string;
  schoolId?: string;
  campusId?: string;
  admissionNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  nationality: string;
  category: string;
  dob: string;
  dobInWords: string;
  dateOfAdmission: string;
  classLeft: string;
  schoolExamStatus: string;
  qualifiedForPromotion: 'Yes' | 'No' | 'Not Applicable';
  feesPaidUpTo: string;
  dateOfIssue: string;
  reasonForLeaving: string;
  totalWorkingDays: number;
  attendanceDays: number;
  generalConduct: 'Good' | 'Excellent' | 'Satisfactory';
}

export interface CRMLead {
  id: string;
  schoolId?: string;
  campusId?: string;
  parentName: string;
  studentName: string;
  contactNumber: string;
  gradeApplying: string;
  inquiryDate: string;
  followUpDate: string;
  status: 'New Inquiry' | 'Campus Visit Scheduled' | 'Application Submitted' | 'Follow Up Due' | 'Admitted' | 'Closed';
  notes: string;
  source: 'Website' | 'Walk-in' | 'Phone Call' | 'Referral';
}

export interface BirthdayItem {
  id: string;
  schoolId?: string;
  campusId?: string;
  name: string;
  role: 'Student' | 'Staff';
  grade?: string;
  section?: string;
  department?: string;
  dob: string;
  dateString: string;
  avatar?: string;
  wished: boolean;
}

export interface Circular {
  id: string;
  schoolId?: string;
  campusId?: string;
  referenceNo: string;
  title: string;
  date: string;
  targetAudience: 'All Parents' | 'Class 10 & 12' | 'Staff' | 'All Students';
  category: 'Academic' | 'Exam' | 'Holiday' | 'Event' | 'Administrative';
  summary: string;
  attachmentName?: string;
}

export interface LibraryBook {
  id: string;
  schoolId?: string;
  campusId?: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  locationRack: string;
}

export interface SchoolAsset {
  id: string;
  schoolId?: string;
  campusId?: string;
  assetCode: string;
  name: string;
  category: 'IT Hardware' | 'Laboratory' | 'Sports' | 'Classroom Furniture' | 'Audio/Visual';
  location: string;
  purchaseDate: string;
  cost: number;
  condition: 'Excellent' | 'Good' | 'Maintenance Required' | 'Disposed';
  assignedTo?: string;
}

export type UserAccessScope = 'all_schools' | 'single_school' | 'selected_schools';

export interface DynamicRoleRecord {
  id: string;
  code: string;
  name: ErpRole;
  scope: 'Platform' | 'Organization' | 'School' | 'Campus' | 'Personal';
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roleId?: string;
  role: ErpRole;
  organizationId?: string;
  accessScope?: UserAccessScope;
  schoolId: string; // 'all' for Platform/Org scope or primary school id
  campusId: string; // 'all' for Platform/Org/School scope or primary campus id
  schoolIds?: string[]; // Multiple authorized schools when accessScope === 'selected_schools'
  campusIds?: string[]; // Multiple authorized campuses across selected schools
  academicYearId?: string;
  classId?: string;
  section?: string;
  linkedStudentIds?: string[]; // For Parent role linking to student records
  department?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  status: 'Active' | 'Inactive';
  createdBy?: string;
  roleAssignedBy?: string;
  createdDate?: string;
  lastLogin?: string;
  password?: string;
  passwordResetRequired?: boolean;
}

export interface SchoolClass {
  id: string;
  schoolId?: string;
  campusId?: string;
  gradeName: string;
  curriculum: 'CBSE' | 'ICSE' | 'IB' | 'Cambridge IGCSE' | 'State Board' | 'Matriculation';
  sections: string[];
  roomNo: string;
  classTeacher?: string;
}

export interface SchoolSubject {
  id: string;
  schoolId?: string;
  code: string;
  name: string;
  type: 'Core' | 'Elective' | 'Co-Scholastic';
  maxMarks: number;
  gradeLevel: string;
}

export interface TimetableEntry {
  id: string;
  schoolId?: string;
  campusId?: string;
  grade: string;
  section: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periodNo: number;
  timeSlot: string;
  subjectName: string;
  teacherName: string;
}

export type AllocationSubjectType = 'Core' | 'Elective' | 'Optional' | 'Language';
export type AllocationDeliveryType = 'Theory' | 'Practical' | 'Theory & Practical';

export interface SubjectAllocation {
  id: string;
  academicYearId: string;
  academicYearLabel: string;
  organizationId: string;
  organizationName: string;
  schoolId: string;
  campusId: string;
  classId: string;
  className: string;
  sectionId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  subjectType: AllocationSubjectType;
  assignedTeacherId: string;
  assignedTeacherName: string;
  weeklyPeriods: number;
  totalMarks: number;
  classification: AllocationDeliveryType;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
}

export interface NewsItem {
  id: string;
  schoolId?: string;
  date: string;
  title: string;
  category: string;
  summary: string;
}

export interface CalendarEvent {
  id: string;
  schoolId?: string;
  date: string;
  title: string;
  desc: string;
  badge: string;
  color: string;
}

export interface AuditLog {
  id: string;
  schoolId?: string;
  campusId?: string;
  userID: string;
  userName: string;
  role?: ErpRole | string;
  timestamp: string;
  actionType:
    | 'REFUND'
    | 'VOID'
    | 'STOCK_ADJUSTMENT'
    | 'LOGIN'
    | 'SETTINGS_CHANGE'
    | 'FEE_PAYMENT'
    | 'TC_PRINT'
    | 'ROLE_PERMISSION'
    | 'USER_STATUS'
    | 'PASSWORD_RESET'
    | 'TENANT_CHANGE'
    | 'OTHER';
  referenceID: string;
  remarks: string;
  ipAddress?: string;
}

export interface CommunicationTemplate {
  id: string;
  title: string;
  category: 'Fee Reminder' | 'Exam Notice' | 'General Circular' | 'PTM Invite' | 'Emergency Alert';
  subject: string;
  body: string;
}

export interface CommunicationMessage {
  id: string;
  schoolId?: string;
  timestamp: string;
  senderName: string;
  channel: 'Email' | 'SMS' | 'Internal Notification' | 'WhatsApp';
  targetGroup: string;
  subject: string;
  body: string;
  recipientCount: number;
  status: 'Delivered' | 'Queued' | 'Failed';
}

export * from './pos';
