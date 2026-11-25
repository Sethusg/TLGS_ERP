import { EducationBoard } from '../types';

export interface CampusOption {
  id: string;
  name: string;
  code: string;
  city: string;
  studentCount: number;
  staffCount: number;
  attendanceRate: number;
  staffAttendanceRate: number;
  feeCollectedLakhs: number;
  feeTargetLakhs: number;
  pendingAdmissions: number;
  appUsers: number;
}

export interface SchoolOption {
  id: string;
  organizationName: string;
  name: string;
  shortName: string;
  board: 'CBSE' | 'ICSE' | 'IB' | 'Cambridge IGCSE' | 'State Board';
  affiliationNo: string;
  campuses: CampusOption[];
}

export interface AcademicYearOption {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Archived' | 'Upcoming';
  multiplier: number;
}

export const INITIAL_EDUCATION_BOARDS: EducationBoard[] = [
  {
    id: 'brd-cbse',
    code: 'CBSE',
    name: 'Central Board of Secondary Education',
    affiliationBody: 'Ministry of Education, Govt. of India',
    gradingScale: '9-Point CBSE Scale (A1–E)',
    medium: 'English',
    status: 'Active',
  },
  {
    id: 'brd-icse',
    code: 'ICSE',
    name: 'Council for the Indian School Certificate Examinations',
    affiliationBody: 'CISCE, New Delhi',
    gradingScale: 'Percentage & 1–9 Grade Points',
    medium: 'English',
    status: 'Active',
  },
  {
    id: 'brd-ib',
    code: 'IB',
    name: 'International Baccalaureate (PYP / MYP / DP)',
    affiliationBody: 'IBO, Geneva',
    gradingScale: '1–7 Criterion Scale (45 Max DP)',
    medium: 'English / Bilingual',
    status: 'Active',
  },
  {
    id: 'brd-igcse',
    code: 'IGCSE',
    name: 'Cambridge Assessment International Education',
    affiliationBody: 'University of Cambridge, UK',
    gradingScale: 'A* to G Cambridge Scale',
    medium: 'English',
    status: 'Active',
  },
  {
    id: 'brd-state',
    code: 'STATE',
    name: 'State Board of School Examinations',
    affiliationBody: 'Department of School Education',
    gradingScale: 'Percentage & Distinction Divisions',
    medium: 'English / Regional',
    status: 'Active',
  },
];

export const SCHOOL_OPTIONS: SchoolOption[] = [
  {
    id: 'sch-leaders-cbse',
    organizationName: 'The Leaders Group of Schools Trust',
    name: 'The Leaders Academy (CBSE)',
    shortName: 'Leaders Academy CBSE',
    board: 'CBSE',
    affiliationNo: '1930812',
    campuses: [
      {
        id: 'cmp-chennai-hq',
        name: 'Main Campus (Chennai HQ)',
        code: 'CHN-01',
        city: 'Chennai',
        studentCount: 1069,
        staffCount: 120,
        attendanceRate: 94.8,
        staffAttendanceRate: 97.5,
        feeCollectedLakhs: 148.6,
        feeTargetLakhs: 165.0,
        pendingAdmissions: 18,
        appUsers: 1189,
      },
      {
        id: 'cmp-adambakkam',
        name: 'North Wing (Adambakkam)',
        code: 'CHN-02',
        city: 'Chennai',
        studentCount: 742,
        staffCount: 84,
        attendanceRate: 93.4,
        staffAttendanceRate: 96.4,
        feeCollectedLakhs: 98.2,
        feeTargetLakhs: 112.0,
        pendingAdmissions: 11,
        appUsers: 816,
      },
      {
        id: 'cmp-tambaram',
        name: 'South Campus (Tambaram)',
        code: 'CHN-03',
        city: 'Chennai',
        studentCount: 625,
        staffCount: 71,
        attendanceRate: 95.2,
        staffAttendanceRate: 98.6,
        feeCollectedLakhs: 84.5,
        feeTargetLakhs: 94.0,
        pendingAdmissions: 9,
        appUsers: 690,
      },
    ],
  },
  {
    id: 'sch-leaders-icse',
    organizationName: 'The Leaders Group of Schools Trust',
    name: 'The Leaders International (ICSE)',
    shortName: 'Leaders Int. ICSE',
    board: 'ICSE',
    affiliationNo: 'TN-0482',
    campuses: [
      {
        id: 'cmp-velachery',
        name: 'Velachery Global Campus',
        code: 'VLC-01',
        city: 'Chennai',
        studentCount: 890,
        staffCount: 96,
        attendanceRate: 95.6,
        staffAttendanceRate: 97.9,
        feeCollectedLakhs: 162.4,
        feeTargetLakhs: 178.0,
        pendingAdmissions: 14,
        appUsers: 980,
      },
      {
        id: 'cmp-omr',
        name: 'OMR Tech Park Campus',
        code: 'OMR-02',
        city: 'Chennai',
        studentCount: 685,
        staffCount: 78,
        attendanceRate: 94.1,
        staffAttendanceRate: 96.2,
        feeCollectedLakhs: 124.8,
        feeTargetLakhs: 140.0,
        pendingAdmissions: 12,
        appUsers: 760,
      },
    ],
  },
  {
    id: 'sch-leaders-ib',
    organizationName: 'Leaders Global Baccalaureate Foundation',
    name: 'The Leaders Global Academy (IB)',
    shortName: 'Leaders Global IB',
    board: 'IB',
    affiliationNo: 'IB-061942',
    campuses: [
      {
        id: 'cmp-ecr',
        name: 'ECR Heritage Campus',
        code: 'ECR-01',
        city: 'Chennai',
        studentCount: 480,
        staffCount: 68,
        attendanceRate: 96.2,
        staffAttendanceRate: 98.5,
        feeCollectedLakhs: 196.0,
        feeTargetLakhs: 210.0,
        pendingAdmissions: 7,
        appUsers: 545,
      },
      {
        id: 'cmp-annanagar',
        name: 'Anna Nagar City Campus',
        code: 'ANN-02',
        city: 'Chennai',
        studentCount: 410,
        staffCount: 54,
        attendanceRate: 94.9,
        staffAttendanceRate: 96.3,
        feeCollectedLakhs: 152.5,
        feeTargetLakhs: 168.0,
        pendingAdmissions: 6,
        appUsers: 462,
      },
    ],
  },
  {
    id: 'sch-leaders-igcse',
    organizationName: 'Leaders Global Baccalaureate Foundation',
    name: 'The Leaders Cambridge School (IGCSE)',
    shortName: 'Leaders Cambridge IGCSE',
    board: 'Cambridge IGCSE',
    affiliationNo: 'IN-842-CAIE',
    campuses: [
      {
        id: 'cmp-bengaluru-east',
        name: 'Whitefield Cambridge Campus',
        code: 'BLR-01',
        city: 'Bengaluru',
        studentCount: 520,
        staffCount: 64,
        attendanceRate: 95.4,
        staffAttendanceRate: 97.8,
        feeCollectedLakhs: 174.0,
        feeTargetLakhs: 192.0,
        pendingAdmissions: 10,
        appUsers: 584,
      },
      {
        id: 'cmp-sarjapur',
        name: 'Sarjapur Innovation Campus',
        code: 'BLR-02',
        city: 'Bengaluru',
        studentCount: 395,
        staffCount: 49,
        attendanceRate: 94.3,
        staffAttendanceRate: 96.9,
        feeCollectedLakhs: 128.5,
        feeTargetLakhs: 145.0,
        pendingAdmissions: 8,
        appUsers: 440,
      },
    ],
  },
];

export const ACADEMIC_YEAR_OPTIONS: AcademicYearOption[] = [
  {
    id: '2026-2027',
    label: 'AY 2026–2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'Active',
    multiplier: 1.0,
  },
  {
    id: '2025-2026',
    label: 'AY 2025–2026',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    status: 'Archived',
    multiplier: 0.94,
  },
  {
    id: '2024-2025',
    label: 'AY 2024–2025',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'Archived',
    multiplier: 0.88,
  },
];

export interface InstitutionalMetrics {
  schoolName: string;
  board: string;
  affiliationNo: string;
  campusLabel: string;
  schoolCount: number;
  campusCount: number;
  academicYearLabel: string;
  students: number;
  staff: number;
  appUsers: number;
  attendanceRate: number;
  staffAttendanceRate: number;
  feeCollectedLakhs: number;
  feeTargetLakhs: number;
  pendingAdmissions: number;
  studentWingStats: { wing: string; boys: number; girls: number; total: number }[];
  monthlyFeeTrend: { month: string; collected: number; target: number }[];
  weeklyAttendanceTrend: { day: string; students: number; staff: number }[];
}

export function getInstitutionalMetrics(
  schoolId: string,
  campusId: string,
  academicYearId: string,
  schoolsList: SchoolOption[] = SCHOOL_OPTIONS,
  yearsList: AcademicYearOption[] = ACADEMIC_YEAR_OPTIONS
): InstitutionalMetrics {
  const year = yearsList.find((y) => y.id === academicYearId) || yearsList[0];
  const m = year.multiplier;
  const isAllSchools = schoolId === 'all';

  let activeList: CampusOption[] = [];
  let schoolName = 'All Affiliated Schools (Centralized)';
  let board = 'Multi-Board (CBSE · ICSE · IB · IGCSE)';
  let affiliationNo = `${schoolsList.length} Accredited Schools`;
  let campusLabel = '';
  let schoolCount = schoolsList.length;

  if (isAllSchools) {
    activeList = schoolsList.flatMap((s) => s.campuses);
    campusLabel = `All Campuses (${activeList.length})`;
  } else {
    const school = schoolsList.find((s) => s.id === schoolId) || schoolsList[0];
    schoolName = school.name;
    board = school.board;
    affiliationNo = school.affiliationNo;
    schoolCount = 1;

    const isAllCampuses = campusId === 'all';
    const selectedCampuses = isAllCampuses
      ? school.campuses
      : school.campuses.filter((c) => c.id === campusId);

    activeList = selectedCampuses.length > 0 ? selectedCampuses : [school.campuses[0]];
    campusLabel = isAllCampuses
      ? `All Campuses (${school.campuses.length})`
      : activeList[0].name;
  }

  const totalStudents = Math.round(
    activeList.reduce((acc, c) => acc + c.studentCount, 0) * m
  );
  const totalStaff = Math.round(
    activeList.reduce((acc, c) => acc + c.staffCount, 0) * (0.97 + (m - 0.97) * 0.5)
  );
  const totalAppUsers = Math.round(
    activeList.reduce((acc, c) => acc + c.appUsers, 0) * m
  );
  const avgAttendance = Number(
    (
      activeList.reduce((acc, c) => acc + c.attendanceRate, 0) /
      Math.max(1, activeList.length)
    ).toFixed(1)
  );
  const avgStaffAttendance = Number(
    (
      activeList.reduce((acc, c) => acc + c.staffAttendanceRate, 0) /
      Math.max(1, activeList.length)
    ).toFixed(1)
  );
  const feeCollectedLakhs = Number(
    (activeList.reduce((acc, c) => acc + c.feeCollectedLakhs, 0) * m).toFixed(1)
  );
  const feeTargetLakhs = Number(
    (activeList.reduce((acc, c) => acc + c.feeTargetLakhs, 0) * m).toFixed(1)
  );
  const pendingAdmissions = Math.max(
    1,
    Math.round(activeList.reduce((acc, c) => acc + c.pendingAdmissions, 0) * m)
  );

  const primaryTotal = Math.round(totalStudents * 0.31);
  const middleTotal = Math.round(totalStudents * 0.27);
  const secondaryTotal = Math.round(totalStudents * 0.24);
  const seniorTotal = Math.max(0, totalStudents - primaryTotal - middleTotal - secondaryTotal);

  const splitWing = (wing: string, total: number, boyRatio: number) => {
    const boys = Math.round(total * boyRatio);
    const girls = Math.max(0, total - boys);
    return { wing, boys, girls, total };
  };

  const studentWingStats = [
    splitWing('Primary', primaryTotal, 0.51),
    splitWing('Middle', middleTotal, 0.505),
    splitWing('Secondary', secondaryTotal, 0.515),
    splitWing('Sr. Sec', seniorTotal, 0.495),
  ];

  const baseMonthlyTarget = Number((feeTargetLakhs / 6).toFixed(1));
  const monthlyFeeTrend = [
    { month: 'May', collected: Number((baseMonthlyTarget * 0.96).toFixed(1)), target: baseMonthlyTarget },
    { month: 'Jun', collected: Number((baseMonthlyTarget * 1.04).toFixed(1)), target: baseMonthlyTarget },
    { month: 'Jul', collected: Number((baseMonthlyTarget * 0.91).toFixed(1)), target: baseMonthlyTarget },
    { month: 'Aug', collected: Number((baseMonthlyTarget * 0.88).toFixed(1)), target: baseMonthlyTarget },
    { month: 'Sep', collected: Number((baseMonthlyTarget * 0.94).toFixed(1)), target: baseMonthlyTarget },
    { month: 'Oct', collected: Number((baseMonthlyTarget * 0.86).toFixed(1)), target: baseMonthlyTarget },
  ];

  const weeklyAttendanceTrend = [
    { day: 'Mon', students: Number(Math.min(99, avgAttendance + 0.6).toFixed(1)), staff: Number(Math.min(99.5, avgStaffAttendance + 0.4).toFixed(1)) },
    { day: 'Tue', students: Number(Math.min(99, avgAttendance + 0.3).toFixed(1)), staff: Number(Math.min(99.5, avgStaffAttendance + 0.2).toFixed(1)) },
    { day: 'Wed', students: Number(Math.max(88, avgAttendance - 0.5).toFixed(1)), staff: Number(Math.max(92, avgStaffAttendance - 0.3).toFixed(1)) },
    { day: 'Thu', students: Number(Math.min(99, avgAttendance + 0.2).toFixed(1)), staff: Number(Math.min(99.5, avgStaffAttendance + 0.5).toFixed(1)) },
    { day: 'Fri', students: avgAttendance, staff: avgStaffAttendance },
    { day: 'Sat', students: Number(Math.max(85, avgAttendance - 2.1).toFixed(1)), staff: Number(Math.max(91, avgStaffAttendance - 1.2).toFixed(1)) },
  ];

  return {
    schoolName,
    board,
    affiliationNo,
    campusLabel,
    schoolCount,
    campusCount: activeList.length,
    academicYearLabel: year.label,
    students: totalStudents,
    staff: totalStaff,
    appUsers: totalAppUsers,
    attendanceRate: avgAttendance,
    staffAttendanceRate: avgStaffAttendance,
    feeCollectedLakhs,
    feeTargetLakhs,
    pendingAdmissions,
    studentWingStats,
    monthlyFeeTrend,
    weeklyAttendanceTrend,
  };
}

export function getSchoolNameById(
  schoolId: string,
  schoolsList: SchoolOption[] = SCHOOL_OPTIONS
): string {
  if (schoolId === 'all') return 'All Schools (Platform)';
  return schoolsList.find((s) => s.id === schoolId)?.shortName || schoolId;
}

export function getCampusNameById(
  schoolId: string,
  campusId: string,
  schoolsList: SchoolOption[] = SCHOOL_OPTIONS
): string {
  if (campusId === 'all') return 'All Campuses';
  const school = schoolsList.find((s) => s.id === schoolId);
  if (school) {
    const found = school.campuses.find((c) => c.id === campusId);
    if (found) return found.name;
  }
  for (const s of schoolsList) {
    const found = s.campuses.find((c) => c.id === campusId);
    if (found) return found.name;
  }
  return campusId;
}
