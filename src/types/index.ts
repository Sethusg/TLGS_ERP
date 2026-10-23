export type NavSection =
  | 'HOME'
  | 'STUDENT'
  | 'STAFFS'
  | 'MARKCHART'
  | 'LMS'
  | 'CONTACT'
  | 'ACADEMICS'
  | 'TRANSPORT'
  | 'SCHOOL'
  | 'ADMIN'
  | 'FEE MANAGEMENT'
  | 'TC'
  | 'SETTINGS'
  | 'ASSET'
  | 'SUPPLIES';

export type SubMenuAction = {
  label: string;
  actionId: string;
  icon?: string;
};

export interface Student {
  id: string;
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
  photoUrl?: string;
  archivedDetails?: ArchivedStaffDetails;
}


export interface LeaveRequest {
  id: string;
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
}

export interface FeeReceipt {
  receiptNo: string;
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
  name: string;
  role: 'Student' | 'Staff';
  grade?: string;
  section?: string;
  department?: string;
  dob: string;
  dateString: string; // e.g. "23 Oct 2026"
  avatar?: string;
  wished: boolean;
}

export interface Circular {
  id: string;
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
  assetCode: string;
  name: string;
  category: 'IT Hardware' | 'Laboratory' | 'Sports' | 'Classroom Furniture' | 'Audio/Visual';
  location: string;
  purchaseDate: string;
  cost: number;
  condition: 'Excellent' | 'Good' | 'Maintenance Required' | 'Disposed';
  assignedTo?: string;
}
