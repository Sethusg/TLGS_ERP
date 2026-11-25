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
  name: string;
  shortName: string;
  board: 'CBSE' | 'ICSE' | 'IB';
  affiliationNo: string;
  campuses: CampusOption[];
}

export interface AcademicYearOption {
  id: string;
  label: string;
  status: 'Active' | 'Archived';
  multiplier: number;
}

export const SCHOOL_OPTIONS: SchoolOption[] = [
  {
    id: 'sch-leaders-cbse',
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
];

export const ACADEMIC_YEAR_OPTIONS: AcademicYearOption[] = [
  { id: '2026-2027', label: 'AY 2026–2027', status: 'Active', multiplier: 1.0 },
  { id: '2025-2026', label: 'AY 2025–2026', status: 'Archived', multiplier: 0.94 },
  { id: '2024-2025', label: 'AY 2024–2025', status: 'Archived', multiplier: 0.88 },
];

export interface InstitutionalMetrics {
  schoolName: string;
  board: string;
  affiliationNo: string;
  campusLabel: string;
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
  academicYearId: string
): InstitutionalMetrics {
  const school = SCHOOL_OPTIONS.find((s) => s.id === schoolId) || SCHOOL_OPTIONS[0];
  const year = ACADEMIC_YEAR_OPTIONS.find((y) => y.id === academicYearId) || ACADEMIC_YEAR_OPTIONS[0];
  const m = year.multiplier;

  const isAllCampuses = campusId === 'all';
  const selectedCampuses = isAllCampuses
    ? school.campuses
    : school.campuses.filter((c) => c.id === campusId);

  const activeList = selectedCampuses.length > 0 ? selectedCampuses : [school.campuses[0]];

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
      activeList.reduce((acc, c) => acc + c.attendanceRate, 0) / activeList.length
    ).toFixed(1)
  );
  const avgStaffAttendance = Number(
    (
      activeList.reduce((acc, c) => acc + c.staffAttendanceRate, 0) / activeList.length
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

  // Compute realistic enrollment breakdown by academic wing matching totalStudents
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
    schoolName: school.name,
    board: school.board,
    affiliationNo: school.affiliationNo,
    campusLabel: isAllCampuses
      ? `All Campuses (${school.campuses.length})`
      : activeList[0].name,
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
