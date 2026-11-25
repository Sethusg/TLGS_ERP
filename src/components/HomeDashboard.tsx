import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  School,
  MapPin,
  GraduationCap,
  Users,
  UserCheck,
  Briefcase,
  CalendarCheck,
  IndianRupee,
  Wallet,
  UserPlus,
  ClipboardList,
  PhoneCall,
  Cake,
  Send,
  CheckCircle2,
  Bus,
  Calendar,
  Clock,
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Info,
  Search,
  X,
  RotateCw,
  Award,
  BarChart3,
  CreditCard,
  CalendarClock,
  BookOpen,
  Bell,
  Layers,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Student,
  Staff,
  LeaveRequest,
  CRMLead,
  BirthdayItem,
  Circular,
  BusRoute,
  AuditLog,
  NavSection,
  ErpRole,
  RolePermissionMatrix,
} from '../types';
import { InstitutionalMetrics } from '../data/schoolContext';
import { useSchoolContext } from '../contexts/SchoolContext';
import { canAccessModule, DEFAULT_ROLE_PERMISSIONS } from '../config/rbac';
import { EnterpriseFormModal } from './Common/EnterpriseUI';

interface HomeDashboardProps {
  students: Student[];
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  birthdays: BirthdayItem[];
  circulars: Circular[];
  busRoutes: BusRoute[];
  auditLogs?: AuditLog[];
  metrics: InstitutionalMetrics;
  currentRole?: ErpRole;
  permissionMatrix?: RolePermissionMatrix;
  activeSubItem?: string;
  onNavigate: (section: NavSection, subItem?: string) => void;
  onOpenQuickAction: () => void;
  onOpenNotifications?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSendBirthdayWish: (id: string) => void;
  onAddLead: (lead: Omit<CRMLead, 'id'>) => void;
}

type DashboardDomainTab =
  | 'all'
  | 'academic'
  | 'finance'
  | 'attendance'
  | 'admissions'
  | 'hr';

type ActivityCategory =
  | 'ALL'
  | 'Students'
  | 'Fees'
  | 'Staff'
  | 'Attendance'
  | 'Exams'
  | 'Admin';

type EventCategory =
  | 'All'
  | 'School Events'
  | 'Exams'
  | 'Holidays'
  | 'Parents'
  | 'Staff'
  | 'Deadlines';

interface DashboardEvent {
  id: string;
  date: string;
  month: string;
  time: string;
  title: string;
  venue: string;
  category: Exclude<EventCategory, 'All'>;
  accent: string;
}

const INITIAL_UPCOMING_EVENTS: DashboardEvent[] = [];

const DARK_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: '#10213D',
  border: '1px solid rgba(214, 173, 82, 0.45)',
  borderRadius: '10px',
  color: '#FFFFFF',
  fontSize: '11.5px',
  boxShadow: '0 10px 25px rgba(16, 33, 61, 0.28)',
};

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  leaveRequests,
  crmLeads,
  birthdays,
  circulars,
  busRoutes,
  auditLogs = [],
  metrics,
  currentRole = 'Super Administrator',
  permissionMatrix = DEFAULT_ROLE_PERMISSIONS,
  activeSubItem,
  onNavigate,
  onOpenQuickAction,
  onOpenNotifications,
  onRefresh,
  isRefreshing = false,
  onSendBirthdayWish,
  onAddLead,
}) => {
  const {
    organizations,
    filteredSchools,
    schools,
    educationBoards,
    selectedOrganizationId,
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    academicYears,
    lockedSchoolId,
    lockedCampusId,
    setOrganization,
    setSchool,
    setCampus,
    setAcademicYear,
  } = useSchoolContext();

  // Dashboard interactive filters
  const [domainTab, setDomainTab] = useState<DashboardDomainTab>('all');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [studentChartMode, setStudentChartMode] = useState<
    'class' | 'section' | 'school'
  >('class');
  const [academicPerfMode, setAcademicPerfMode] = useState<'subjects' | 'grades'>(
    'subjects'
  );
  const [financeChartMode, setFinanceChartMode] = useState<
    'monthly' | 'campus' | 'class'
  >('monthly');
  const [attendanceChartMode, setAttendanceChartMode] = useState<
    'weekly' | 'monthly' | 'classwise'
  >('weekly');
  const [activityFilter, setActivityFilter] = useState<ActivityCategory>('ALL');
  const [eventFilter, setEventFilter] = useState<EventCategory>('All');
  const [birthdayTab, setBirthdayTab] = useState<
    'TODAY' | 'TOMORROW' | 'THIS WEEK' | 'THIS MONTH' | 'NEXT MONTH'
  >('TODAY');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );

  // Events & CRM modals
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>(
    INITIAL_UPCOMING_EVENTS
  );
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showCRMList, setShowCRMList] = useState(false);

  // Form states
  const [newLeadParent, setNewLeadParent] = useState('');
  const [newLeadStudent, setNewLeadStudent] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadGrade, setNewLeadGrade] = useState('Grade 1');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('22');
  const [newEventMonth, setNewEventMonth] = useState('NOV');
  const [newEventTime, setNewEventTime] = useState('10:00 AM');
  const [newEventVenue, setNewEventVenue] = useState('Main Campus Auditorium');
  const [newEventCategory, setNewEventCategory] =
    useState<Exclude<EventCategory, 'All'>>('School Events');

  // Section refs for submenu smooth scrolling
  const academicRef = useRef<HTMLElement>(null);
  const financeRef = useRef<HTMLElement>(null);
  const attendanceRef = useRef<HTMLElement>(null);
  const admissionsHrRef = useRef<HTMLElement>(null);
  const activitiesRef = useRef<HTMLElement>(null);
  const operationsRef = useRef<HTMLElement>(null);

  // Respond to Dashboard sidebar submenu navigation
  useEffect(() => {
    if (!activeSubItem || activeSubItem === 'dash-overall') {
      setDomainTab('all');
      return;
    }
    if (activeSubItem === 'dash-school') {
      setDomainTab('all');
      setStudentChartMode('school');
      academicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-campus') {
      setDomainTab('all');
      setFinanceChartMode('campus');
      financeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-students') {
      setDomainTab('academic');
      setStudentChartMode('class');
      academicRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-staff') {
      setDomainTab('hr');
      admissionsHrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-fees' || activeSubItem === 'dash-finance') {
      setDomainTab('finance');
      financeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-attendance') {
      setDomainTab('attendance');
      attendanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (
      activeSubItem === 'dash-admissions' ||
      activeSubItem === 'dashboard-crm'
    ) {
      setDomainTab('admissions');
      setShowCRMList(true);
      admissionsHrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-activities') {
      setDomainTab('all');
      activitiesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dash-notifications') {
      onOpenNotifications?.();
    } else if (activeSubItem === 'dashboard-operations') {
      setDomainTab('all');
      operationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSubItem, onOpenNotifications]);

  const handleDashboardRefresh = () => {
    setLastRefreshedAt(
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    );
    onRefresh?.();
  };

  // Derived real + preview operational figures
  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const totalCampusesInScope = filteredSchools.reduce(
    (a, s) => a + s.campuses.length,
    0
  );
  const feePct = Math.min(
    100,
    Math.round((metrics.feeCollectedLakhs / Math.max(1, metrics.feeTargetLakhs)) * 100)
  );
  const totalPendingAdmissions = metrics.pendingAdmissions + crmLeads.length;

  const schoolEnrollmentChartData = useMemo(
    () =>
      filteredSchools.map((s) => {
        const total = s.campuses.reduce((a, c) => a + c.studentCount, 0);
        const boys = Math.round(total * 0.508);
        return {
          className: s.board,
          boys,
          girls: Math.max(0, total - boys),
          total,
        };
      }),
    [filteredSchools]
  );

  const genderDonutData = useMemo(
    () => [
      { name: 'Boys', value: metrics.boysCount, color: '#3978F6' },
      { name: 'Girls', value: metrics.girlsCount, color: '#EC4899' },
    ],
    [metrics.boysCount, metrics.girlsCount]
  );

  const boysPct = Math.round(
    (metrics.boysCount / Math.max(1, metrics.students)) * 100
  );
  const girlsPct = Math.max(0, 100 - boysPct);

  // Role-permitted Quick Actions (Section 11)
  const permittedQuickActions = useMemo(() => {
    const actions: {
      id: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      bg: string;
      section: NavSection;
      subItem: string;
      requiredModule: NavSection;
    }[] = [
      {
        id: 'qa-admission',
        label: 'New Student Admission',
        icon: UserPlus,
        color: '#3978F6',
        bg: 'bg-[#3978F6]/10 text-[#3978F6]',
        section: 'STUDENT',
        subItem: 'student-new-admission',
        requiredModule: 'STUDENT',
      },
      {
        id: 'qa-add-student',
        label: 'Add Student',
        icon: GraduationCap,
        color: '#16B8A6',
        bg: 'bg-[#16B8A6]/10 text-[#0F9488]',
        section: 'STUDENT',
        subItem: 'student-user-details',
        requiredModule: 'STUDENT',
      },
      {
        id: 'qa-add-staff',
        label: 'Add Staff',
        icon: Users,
        color: '#8055D9',
        bg: 'bg-[#8055D9]/10 text-[#8055D9]',
        section: 'STAFFS',
        subItem: 'staff-info',
        requiredModule: 'STAFFS',
      },
      {
        id: 'qa-attendance',
        label: 'Record Attendance',
        icon: CalendarCheck,
        color: '#22A06B',
        bg: 'bg-[#22A06B]/10 text-[#1B8558]',
        section: 'ATTENDANCE',
        subItem: 'att-student-daily',
        requiredModule: 'ATTENDANCE',
      },
      {
        id: 'qa-fees',
        label: 'Collect Fees',
        icon: CreditCard,
        color: '#F59E0B',
        bg: 'bg-[#F59E0B]/12 text-[#C27803]',
        section: 'FEE MANAGEMENT',
        subItem: 'fee-collection',
        requiredModule: 'FEE MANAGEMENT',
      },
      {
        id: 'qa-timetable',
        label: 'Create Timetable',
        icon: CalendarClock,
        color: '#3978F6',
        bg: 'bg-[#3978F6]/10 text-[#3978F6]',
        section: 'ACADEMICS',
        subItem: 'academics-timetable',
        requiredModule: 'ACADEMICS',
      },
      {
        id: 'qa-results',
        label: 'Publish Exam Results',
        icon: Award,
        color: '#EC4899',
        bg: 'bg-[#EC4899]/10 text-[#DB2777]',
        section: 'MARKCHART',
        subItem: 'markchart-entry',
        requiredModule: 'MARKCHART',
      },
      {
        id: 'qa-reports',
        label: 'Generate Reports',
        icon: BarChart3,
        color: '#10213D',
        bg: 'bg-[#10213D]/10 text-[#10213D]',
        section: 'REPORTS',
        subItem: 'rep-executive',
        requiredModule: 'REPORTS',
      },
    ];
    return actions.filter((a) =>
      canAccessModule(currentRole, a.requiredModule, permissionMatrix)
    );
  }, [currentRole, permissionMatrix]);

  // 12 Colourful Interactive KPI Cards (Section 3)
  const kpiCards = useMemo(() => {
    const cmp = metrics.comparison;
    return [
      {
        id: 'kpi-orgs',
        label: 'Total Organizations',
        value: String(metrics.organizationCount),
        subtext:
          metrics.organizationCount === 1
            ? metrics.organizationName
            : `${organizations.length} Active Education Trusts`,
        trend: 'Multi-Trust HQ',
        trendUp: true,
        accent: '#10213D',
        iconBg: 'from-[#10213D] to-[#1E3A66]',
        icon: Building2,
        actionLabel: 'Organization registry',
        onClick: () => onNavigate('ORGANIZATION', 'org-profile'),
      },
      {
        id: 'kpi-schools',
        label: 'Total Schools',
        value: String(metrics.schoolCount),
        subtext: `${educationBoards.length} Boards · Group total ${schools.length}`,
        trend: `${metrics.board.split(' ')[0]} Scope`,
        trendUp: true,
        accent: '#3978F6',
        iconBg: 'from-[#3978F6] to-[#2563EB]',
        icon: School,
        actionLabel: 'Manage schools',
        onClick: () => onNavigate('ORGANIZATION', 'org-schools'),
      },
      {
        id: 'kpi-campuses',
        label: 'Total Campuses',
        value: String(metrics.campusCount),
        subtext: `${totalCampusesInScope} campuses in active org`,
        trend: `${metrics.scopeLevel} View`,
        trendUp: true,
        accent: '#8055D9',
        iconBg: 'from-[#8055D9] to-[#6D28D9]',
        icon: MapPin,
        actionLabel: 'Campus directory',
        onClick: () => onNavigate('ORGANIZATION', 'org-campuses'),
      },
      {
        id: 'kpi-students',
        label: 'Total Students',
        value: metrics.students.toLocaleString(),
        subtext: `${metrics.boysCount.toLocaleString()} Boys · ${metrics.girlsCount.toLocaleString()} Girls`,
        trend: cmp ? `+${cmp.studentsDeltaPct}% vs ${cmp.previousYearLabel}` : 'Preview Baseline',
        trendUp: true,
        accent: '#16B8A6',
        iconBg: 'from-[#16B8A6] to-[#0D9488]',
        icon: GraduationCap,
        actionLabel: 'Student directory',
        onClick: () => onNavigate('STUDENT', 'student-user-details'),
      },
      {
        id: 'kpi-teaching',
        label: 'Total Teaching Staff',
        value: metrics.teachingStaff.toLocaleString(),
        subtext: `${Math.round((metrics.teachingStaff / Math.max(1, metrics.staff)) * 100)}% of ${metrics.staff} total faculty`,
        trend: 'Academic Faculty',
        trendUp: true,
        accent: '#3978F6',
        iconBg: 'from-[#3978F6] to-[#4F46E5]',
        icon: BookOpen,
        actionLabel: 'Faculty roster',
        onClick: () => onNavigate('STAFFS', 'staff-info'),
      },
      {
        id: 'kpi-nonteaching',
        label: 'Total Non-Teaching Staff',
        value: metrics.nonTeachingStaff.toLocaleString(),
        subtext: 'Admin, Accounts, Labs & Fleet',
        trend: `${pendingLeaveCount} leave pending`,
        trendUp: pendingLeaveCount === 0,
        accent: '#8055D9',
        iconBg: 'from-[#8055D9] to-[#9333EA]',
        icon: Briefcase,
        actionLabel: 'Staff & HR desk',
        onClick: () => onNavigate('HR', 'hr-employees'),
      },
      {
        id: 'kpi-stu-att',
        label: "Today's Student Attendance",
        value: `${metrics.attendanceRate}%`,
        subtext: `${metrics.presentStudents.toLocaleString()} present · ${metrics.absentStudents.toLocaleString()} absent`,
        trend: cmp ? `+${cmp.attendanceDeltaPts}% pts` : `${metrics.lateStudents} late`,
        trendUp: true,
        accent: '#22A06B',
        iconBg: 'from-[#22A06B] to-[#15803D]',
        progress: metrics.attendanceRate,
        icon: CalendarCheck,
        actionLabel: 'Student register',
        onClick: () => onNavigate('ATTENDANCE', 'att-student-daily'),
      },
      {
        id: 'kpi-stf-att',
        label: "Today's Staff Attendance",
        value: `${metrics.staffAttendanceRate}%`,
        subtext: `${metrics.presentStaff} present · ${metrics.onLeaveStaff} on leave`,
        trend: `${metrics.absentStaff} absent`,
        trendUp: metrics.staffAttendanceRate >= 95,
        accent: '#16B8A6',
        iconBg: 'from-[#16B8A6] to-[#0891B2]',
        progress: metrics.staffAttendanceRate,
        icon: UserCheck,
        actionLabel: 'Staff attendance',
        onClick: () => onNavigate('ATTENDANCE', 'att-staff-daily'),
      },
      {
        id: 'kpi-fee-collected',
        label: 'Fee Collection',
        value: `₹${metrics.feeCollectedLakhs} L`,
        subtext: `${feePct}% of ₹${metrics.feeTargetLakhs} L term target`,
        trend: cmp ? `+${cmp.feeDeltaPct}% YoY` : `₹${metrics.todayFeeCollectionLakhs} L today`,
        trendUp: true,
        accent: '#22A06B',
        iconBg: 'from-[#22A06B] to-[#059669]',
        progress: feePct,
        icon: IndianRupee,
        actionLabel: 'Collect fees',
        onClick: () => onNavigate('FEE MANAGEMENT', 'fee-collection'),
      },
      {
        id: 'kpi-fee-pending',
        label: 'Pending Fee Amount',
        value: `₹${metrics.feePendingLakhs} L`,
        subtext: `${100 - feePct}% remaining across term dues`,
        trend: 'Due Tracker',
        trendUp: false,
        accent: '#F59E0B',
        iconBg: 'from-[#F59E0B] to-[#D97706]',
        icon: Wallet,
        actionLabel: 'Fee defaulters',
        onClick: () => onNavigate('FEE MANAGEMENT', 'fee-defaulters'),
      },
      {
        id: 'kpi-new-adm',
        label: 'New Admissions',
        value: metrics.newAdmissions.toLocaleString(),
        subtext: `${metrics.admissionsSummary.conversionRate}% enquiry conversion`,
        trend: cmp ? `+${cmp.admissionsDeltaPct}% vs prev` : 'Active Intake',
        trendUp: true,
        accent: '#EC4899',
        iconBg: 'from-[#EC4899] to-[#DB2777]',
        icon: UserPlus,
        actionLabel: 'New admission',
        onClick: () => onNavigate('STUDENT', 'student-new-admission'),
      },
      {
        id: 'kpi-pending-adm',
        label: 'Pending Admissions',
        value: String(totalPendingAdmissions),
        subtext: `${crmLeads.length} active portal enquiries`,
        trend: 'Review Queue',
        trendUp: false,
        accent: '#F59E0B',
        iconBg: 'from-[#EC4899] to-[#F59E0B]',
        icon: ClipboardList,
        actionLabel: 'Process applications',
        onClick: () => onNavigate('STUDENT', 'student-applications'),
      },
    ];
  }, [
    metrics,
    organizations.length,
    educationBoards.length,
    schools.length,
    totalCampusesInScope,
    pendingLeaveCount,
    feePct,
    totalPendingAdmissions,
    crmLeads.length,
    onNavigate,
  ]);

  // Filter KPIs via Dashboard Search
  const normalizedSearch = dashboardSearch.trim().toLowerCase();
  const visibleKpiCards = useMemo(() => {
    if (!normalizedSearch) return kpiCards;
    return kpiCards.filter(
      (c) =>
        c.label.toLowerCase().includes(normalizedSearch) ||
        c.subtext.toLowerCase().includes(normalizedSearch) ||
        c.actionLabel.toLowerCase().includes(normalizedSearch)
    );
  }, [kpiCards, normalizedSearch]);

  // Recent Activities (combining live audit logs + structured ERP events)
  const allRecentActivities = useMemo(() => {
    const baseActivities: {
      id: string;
      time: string;
      user: string;
      category: Exclude<ActivityCategory, 'ALL'>;
      title: string;
      meta: string;
      accent: string;
      action: () => void;
    }[] = [
      {
        id: 'act-stu',
        time: '10 mins ago · Today',
        user: 'Admissions Desk',
        category: 'Students',
        title: `${metrics.newAdmissions} admissions confirmed for ${metrics.academicYearLabel} intake`,
        meta: 'Student Management · Registration',
        accent: '#3978F6',
        action: () => onNavigate('STUDENT', 'student-new-admission'),
      },
      {
        id: 'act-fee',
        time: '28 mins ago · Today',
        user: 'Accounts Bursar',
        category: 'Fees',
        title: `Fee collection batch posted — ₹${metrics.todayFeeCollectionLakhs} L today (₹${metrics.feeCollectedLakhs} L total)`,
        meta: 'Fee Management · Settlement Ledger',
        accent: '#22A06B',
        action: () => onNavigate('FEE MANAGEMENT', 'fee-collection'),
      },
      {
        id: 'act-stf',
        time: '45 mins ago · Today',
        user: 'HR Coordinator',
        category: 'Staff',
        title: `${pendingLeaveCount} staff leave requests & ${metrics.pendingHrApprovals} HR approvals queued`,
        meta: 'Staff & HR · Leave Management',
        accent: '#8055D9',
        action: () => onNavigate('STAFFS', 'staff-leave-request'),
      },
      {
        id: 'act-att',
        time: 'Today · 08:40 AM',
        user: 'Campus Attendance Officer',
        category: 'Attendance',
        title: `Morning roll call synced — ${metrics.attendanceRate}% students & ${metrics.staffAttendanceRate}% staff present`,
        meta: 'Attendance Management · Daily Register',
        accent: '#16B8A6',
        action: () => onNavigate('ATTENDANCE', 'att-student-daily'),
      },
      {
        id: 'act-exm',
        time: 'Today · 08:15 AM',
        user: 'Controller of Exams',
        category: 'Exams',
        title: `Mid-Term grade analytics updated — ${metrics.examPassRate}% pass rate (${metrics.examDistinctionRate}% distinction)`,
        meta: 'Examination Management · Markcharts',
        accent: '#EC4899',
        action: () => onNavigate('MARKCHART', 'markchart-entry'),
      },
      {
        id: 'act-adm',
        time: 'Yesterday · 04:50 PM',
        user: 'System Administrator',
        category: 'Admin',
        title:
          circulars[0]?.title ||
          'Institutional academic calendar & circular broadcast published',
        meta: 'Communication & Admin Governance',
        accent: '#F59E0B',
        action: () => onNavigate('ADMIN', 'admin-audit'),
      },
    ];

    const liveAuditItems = auditLogs.slice(0, 3).map((log) => ({
      id: `live-${log.id}`,
      time: log.timestamp,
      user: `${log.userName}${log.role ? ` · ${log.role}` : ''}`,
      category: 'Admin' as const,
      title: log.remarks,
      meta: `Audit Trail · ${log.actionType}`,
      accent: '#10213D',
      action: () => onNavigate('ADMIN', 'admin-audit'),
    }));

    return [...liveAuditItems, ...baseActivities];
  }, [
    auditLogs,
    metrics,
    pendingLeaveCount,
    circulars,
    onNavigate,
  ]);

  const filteredActivities = useMemo(() => {
    return allRecentActivities.filter((item) => {
      const catMatch =
        activityFilter === 'ALL' || item.category === activityFilter;
      const searchMatch =
        !normalizedSearch ||
        item.title.toLowerCase().includes(normalizedSearch) ||
        item.user.toLowerCase().includes(normalizedSearch) ||
        item.meta.toLowerCase().includes(normalizedSearch);
      return catMatch && searchMatch;
    });
  }, [allRecentActivities, activityFilter, normalizedSearch]);

  const filteredEvents = useMemo(() => {
    return upcomingEvents.filter((ev) => {
      const catMatch = eventFilter === 'All' || ev.category === eventFilter;
      const searchMatch =
        !normalizedSearch ||
        ev.title.toLowerCase().includes(normalizedSearch) ||
        ev.venue.toLowerCase().includes(normalizedSearch) ||
        ev.category.toLowerCase().includes(normalizedSearch);
      return catMatch && searchMatch;
    });
  }, [upcomingEvents, eventFilter, normalizedSearch]);

  const filteredBirthdays = birthdays.filter((b) => {
    if (birthdayTab === 'TODAY') return b.dob.endsWith('10-23');
    if (birthdayTab === 'TOMORROW') return b.dob.endsWith('10-24');
    if (birthdayTab === 'THIS WEEK')
      return (
        b.dob.endsWith('10-23') ||
        b.dob.endsWith('10-24') ||
        b.dob.endsWith('10-25') ||
        b.dob.endsWith('10-26')
      );
    if (birthdayTab === 'THIS MONTH') return b.dob.includes('-10-');
    return b.dob.includes('-11-');
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadParent.trim() || !newLeadPhone.trim()) return;
    onAddLead({
      parentName: newLeadParent.trim(),
      studentName: newLeadStudent.trim() || 'Prospective Student',
      contactNumber: newLeadPhone.trim(),
      gradeApplying: newLeadGrade,
      inquiryDate: '2026-10-23',
      followUpDate: '2026-10-25',
      status: 'New Inquiry',
      notes: 'Initial admission inquiry via ERP dashboard',
      source: 'Website',
    });
    setNewLeadParent('');
    setNewLeadStudent('');
    setNewLeadPhone('');
    setShowAddLeadModal(false);
    setShowCRMList(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const accentByCategory: Record<Exclude<EventCategory, 'All'>, string> = {
      'School Events': '#3978F6',
      Exams: '#EC4899',
      Holidays: '#16B8A6',
      Parents: '#8055D9',
      Staff: '#F59E0B',
      Deadlines: '#22A06B',
    };
    setUpcomingEvents((prev) => [
      {
        id: `ev-${Date.now()}`,
        date: newEventDate.trim() || '25',
        month: (newEventMonth.trim() || 'NOV').toUpperCase().slice(0, 3),
        time: newEventTime.trim() || '10:00 AM',
        title: newEventTitle.trim(),
        venue: newEventVenue.trim() || metrics.campusLabel,
        category: newEventCategory,
        accent: accentByCategory[newEventCategory],
      },
      ...prev,
    ]);
    setNewEventTitle('');
    setShowAddEventModal(false);
  };

  const showSection = (target: Exclude<DashboardDomainTab, 'all'>) =>
    domainTab === 'all' || domainTab === target;

  const activeSchoolObj =
    selectedSchoolId === 'all'
      ? null
      : schools.find((s) => s.id === selectedSchoolId) || null;

  return (
    <div className="p-4 sm:p-6 max-w-[1440px] mx-auto space-y-6">
      {/* Executive Multi-School Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10213D] via-[#152D54] to-[#1D3E73] text-white p-5 sm:p-6 shadow-[0_8px_24px_rgba(16,33,61,0.14)] border border-[#D6AD52]/30">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 w-72 h-72 rounded-full bg-[#3978F6]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-40 -bottom-24 w-64 h-64 rounded-full bg-[#D6AD52]/15 blur-3xl"
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#D6AD52] font-semibold">
              <span>{metrics.scopeLevel} Dashboard</span>
              <span aria-hidden="true" className="text-white/40">
                ·
              </span>
              <span>{metrics.board}</span>
              <span aria-hidden="true" className="text-white/40">
                ·
              </span>
              <span className="tabular-nums">{metrics.academicYearLabel}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white text-balance">
              {metrics.schoolName}
            </h1>

            <p className="text-xs sm:text-[13px] text-slate-200/90 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                Organization:{' '}
                <strong className="text-white">{metrics.organizationName}</strong>
              </span>
              <span aria-hidden="true" className="text-white/35">
                ·
              </span>
              <span>
                Campus: <strong className="text-white">{metrics.campusLabel}</strong>
              </span>
              <span aria-hidden="true" className="text-white/35">
                ·
              </span>
              <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                Updated {lastRefreshedAt}
              </span>
            </p>
          </div>

          {/* Interactive Dashboard Search & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                placeholder="Filter cards, events, activity..."
                aria-label="Filter dashboard widgets"
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 text-white placeholder:text-slate-300 focus:outline-none focus:border-[#D6AD52] transition-colors"
              />
              {dashboardSearch && (
                <button
                  type="button"
                  onClick={() => setDashboardSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white cursor-pointer"
                  aria-label="Clear dashboard filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleDashboardRefresh}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCw
                className={`w-3.5 h-3.5 text-[#D6AD52] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickAction}
              className="px-4 py-2 rounded-xl bg-[#D6AD52] hover:bg-[#C69B3E] text-[#10213D] text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Actions</span>
            </button>
          </div>
        </div>

        {/* Inline Multi-School Scope Bar */}
        <div className="relative mt-4 pt-3.5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11.5px]">
          <div className="flex items-start sm:items-center gap-2 text-slate-200/90">
            <Info className="w-4 h-4 text-[#D6AD52] shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-[#D6AD52]">LIVE INSTITUTIONAL DATA:</strong> All
              KPIs, tables, and charts reflect persisted records for {metrics.schoolName}.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {!lockedSchoolId && (
              <select
                aria-label="Quick Organization Filter"
                value={selectedOrganizationId}
                onChange={(e) => setOrganization(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-[11px] font-medium focus:outline-none focus:border-[#D6AD52] cursor-pointer"
              >
                <option value="all" className="text-[#10213D]">
                  All Organizations ({organizations.length})
                </option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="text-[#10213D]">
                    {org.shortName}
                  </option>
                ))}
              </select>
            )}
            {!lockedSchoolId && (
              <select
                aria-label="Quick School Filter"
                value={selectedSchoolId}
                onChange={(e) => setSchool(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-[11px] font-medium focus:outline-none focus:border-[#D6AD52] cursor-pointer"
              >
                <option value="all" className="text-[#10213D]">
                  All Schools ({filteredSchools.length})
                </option>
                {filteredSchools.map((s) => (
                  <option key={s.id} value={s.id} className="text-[#10213D]">
                    {s.shortName}
                  </option>
                ))}
              </select>
            )}
            {activeSchoolObj && !lockedCampusId && (
              <select
                aria-label="Quick Campus Filter"
                value={selectedCampusId}
                onChange={(e) => setCampus(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-[11px] font-medium focus:outline-none focus:border-[#D6AD52] cursor-pointer"
              >
                <option value="all" className="text-[#10213D]">
                  All Campuses ({activeSchoolObj.campuses.length})
                </option>
                {activeSchoolObj.campuses.map((c) => (
                  <option key={c.id} value={c.id} className="text-[#10213D]">
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Quick Academic Year Filter"
              value={selectedAcademicYearId}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-[11px] font-semibold tabular-nums focus:outline-none focus:border-[#D6AD52] cursor-pointer"
            >
              {academicYears.length === 0 ? (
                <option value="" className="text-[#10213D]">
                  No Academic Year
                </option>
              ) : (
                academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id} className="text-[#10213D]">
                    {yr.label}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </section>

      {/* Clean Initial Installation Onboarding Banner */}
      {organizations.length === 0 && schools.length === 0 && metrics.students === 0 && (
        <section className="bg-white border border-[#D6AD52]/50 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9A7418]">
              Clean Database · Initial Configuration
            </p>
            <h2 className="text-base sm:text-lg font-bold text-[#10213D]">
              Welcome to TLGS-ERP. Your system is ready. Start by creating your organization and school.
            </h2>
            <p className="text-xs text-slate-600">
              All demo records and placeholder users have been removed. Use the authorized setup actions to configure your multi-school hierarchy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('ORGANIZATION', 'org-profile')}
              className="px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#D6AD52]" />
              <span>Create Organization</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ORGANIZATION', 'org-schools')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <School className="w-3.5 h-3.5 text-[#1D7AFC]" />
              <span>Create School</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ORGANIZATION', 'org-campuses')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#00B8A9]" />
              <span>Create Campus</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ORGANIZATION', 'org-academic-years')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
              <span>Create Academic Year</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ADMIN', 'admin-users')}
              className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#7B42F6]" />
              <span>Create User</span>
            </button>
          </div>
        </section>
      )}

      {/* Interactive Analytics View Switcher + Role-Permitted Quick Actions */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div
          className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200/90 rounded-xl shadow-[0_1px_2px_rgba(16,33,61,0.04)] overflow-x-auto max-w-full"
          role="tablist"
          aria-label="Dashboard domain sections"
        >
          {(
            [
              { id: 'all', label: 'All Dashboards' },
              { id: 'academic', label: 'Academic Analytics' },
              { id: 'finance', label: 'Finance' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'hr', label: 'Staff & HR' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={domainTab === tab.id}
              onClick={() => setDomainTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                domainTab === tab.id
                  ? 'bg-[#10213D] text-[#D6AD52] shadow-xs'
                  : 'text-slate-600 hover:text-[#10213D] hover:bg-[#F4F6FA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-[#3978F6]" />
          <span>
            Active Role: <strong className="text-[#10213D]">{currentRole}</strong> ·{' '}
            {permittedQuickActions.length} Quick Actions Permitted
          </span>
        </div>
      </section>

      {/* Role-Permitted Quick Actions Strip (Section 11) */}
      {permittedQuickActions.length > 0 && (
        <section
          aria-label="Quick Actions"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-4"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#10213D]">Quick Actions</h2>
              <p className="text-[11px] text-slate-500">
                Role-authorized shortcuts for rapid daily operations
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenQuickAction}
              className="text-xs font-semibold text-[#3978F6] hover:text-[#10213D] transition-colors whitespace-nowrap cursor-pointer"
            >
              All Workflows ➔
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {permittedQuickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.id}
                  type="button"
                  onClick={() => onNavigate(qa.section, qa.subItem)}
                  className="group p-3 rounded-xl border border-slate-200/80 bg-[#F4F6FA]/55 hover:bg-white hover:border-[#3978F6]/45 hover:shadow-sm transition-all flex flex-col items-center text-center gap-2 cursor-pointer"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${qa.bg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-[#10213D] group-hover:text-[#3978F6] leading-tight line-clamp-2">
                    {qa.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 12 Vibrant Colourful Interactive KPI Cards (Section 3) */}
      <section aria-label="Executive Multi-School KPIs">
        {visibleKpiCards.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
            No KPI cards match &ldquo;{dashboardSearch}&rdquo;.{' '}
            <button
              type="button"
              onClick={() => setDashboardSearch('')}
              className="font-semibold text-[#3978F6] hover:underline cursor-pointer"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleKpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={card.onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      card.onClick();
                    }
                  }}
                  className="group relative bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] hover:shadow-[0_10px_24px_rgba(16,33,61,0.09)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3978F6]"
                >
                  {/* Subtle top colour bar */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: card.accent }}
                  />

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-500 truncate">
                            {card.label}
                          </p>
                          <p className="text-2xl sm:text-[26px] font-extrabold text-[#10213D] tracking-tight tabular-nums mt-1.5 leading-none">
                            {card.value}
                          </p>
                        </div>
                        <div
                          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.iconBg} text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-500 truncate">{card.subtext}</span>
                        <span
                          className={`font-semibold shrink-0 inline-flex items-center gap-0.5 whitespace-nowrap ${
                            card.trendUp ? 'text-[#22A06B]' : 'text-[#D97706]'
                          }`}
                        >
                          {card.trendUp ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{card.trend}</span>
                        </span>
                      </div>

                      {typeof card.progress === 'number' && (
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, card.progress)}%`,
                              backgroundColor: card.accent,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#10213D] group-hover:text-[#3978F6] transition-colors">
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 4: ACADEMIC ANALYTICS */}
      {showSection('academic') && (
        <section ref={academicRef} aria-label="Academic Analytics" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#10213D]">
                Academic Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Preview enrollment by class &amp; section, gender ratio, subject scores, and examination grades
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ACADEMICS', 'academics-subject-allocation')}
              className="text-xs font-semibold text-[#3978F6] hover:text-[#10213D] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>Subject Allocation &amp; Academics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Student Strength by Class / Section / Board */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#10213D]">
                    Student Strength Distribution
                  </h3>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {metrics.students.toLocaleString()} total enrolled · Live Records
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-[#F4F6FA] p-0.5 border border-slate-200/80 text-[11px] font-semibold">
                  {(
                    [
                      { id: 'class', label: 'Class' },
                      { id: 'section', label: 'Section' },
                      { id: 'school', label: 'Board' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setStudentChartMode(m.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        studentChartMode === m.id
                          ? 'bg-[#3978F6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#10213D]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  {studentChartMode === 'section' ? (
                    <BarChart data={metrics.sectionStrength} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="section"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="students"
                        name="Enrolled"
                        fill="#8055D9"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="capacity"
                        name="Capacity"
                        fill="#CBD5E1"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <BarChart
                      data={
                        studentChartMode === 'class'
                          ? metrics.classStrength
                          : schoolEnrollmentChartData
                      }
                      barGap={4}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="className"
                        tick={{ fontSize: 10.5, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="boys" name="Boys" fill="#3978F6" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="girls" name="Girls" fill="#EC4899" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gender Distribution Donut */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#10213D]">
                  Gender Distribution
                </h3>
                <p className="text-[11px] text-slate-500">
                  Student demographic split
                </p>
              </div>

              <div className="h-52 w-full relative my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderDonutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={78}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {genderDonutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-[#10213D] tabular-nums leading-none">
                    {metrics.students.toLocaleString()}
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-500 mt-1">
                    Students
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">Boys</p>
                  <p className="font-extrabold text-[#3978F6] tabular-nums">
                    {metrics.boysCount.toLocaleString()}{' '}
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({boysPct}%)
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500 font-medium">Girls</p>
                  <p className="font-extrabold text-[#EC4899] tabular-nums">
                    {metrics.girlsCount.toLocaleString()}{' '}
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({girlsPct}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Subject-wise Performance & Examination Results */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#10213D]">
                    {academicPerfMode === 'subjects'
                      ? 'Subject-wise Performance'
                      : 'Examination Grade Results'}
                  </h3>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    Pass Rate {metrics.examPassRate}% · Distinction{' '}
                    {metrics.examDistinctionRate}%
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-[#F4F6FA] p-0.5 border border-slate-200/80 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setAcademicPerfMode('subjects')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      academicPerfMode === 'subjects'
                        ? 'bg-[#8055D9] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#10213D]'
                    }`}
                  >
                    Subjects
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcademicPerfMode('grades')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      academicPerfMode === 'grades'
                        ? 'bg-[#8055D9] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#10213D]'
                    }`}
                  >
                    Results
                  </button>
                </div>
              </div>

              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  {academicPerfMode === 'subjects' ? (
                    <BarChart
                      data={metrics.subjectPerformance}
                      layout="vertical"
                      margin={{ left: 6, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[60, 100]}
                        tick={{ fontSize: 10.5, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="subject"
                        type="category"
                        tick={{ fontSize: 11, fill: '#10213D', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={84}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Bar dataKey="avgScore" name="Avg Score %" radius={[0, 6, 6, 0]} barSize={16}>
                        {metrics.subjectPerformance.map((entry) => (
                          <Cell key={entry.subject} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={metrics.examResultsDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="grade"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]} barSize={28}>
                        {metrics.examResultsDistribution.map((entry) => (
                          <Cell key={entry.grade} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: FINANCE DASHBOARD */}
      {showSection('finance') && (
        <section ref={financeRef} aria-label="Finance Dashboard" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#10213D]">
                Finance &amp; Fee Collection Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Realized revenue, pending dues, campus &amp; class breakdowns (Preview Data)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('FEE MANAGEMENT', 'fee-report')}
              className="text-xs font-semibold text-[#22A06B] hover:text-[#10213D] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>Open Fee Ledger &amp; Defaulters</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Finance Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              {
                label: 'Total Fee Collected',
                value: `₹${metrics.feeCollectedLakhs} L`,
                meta: `${feePct}% of ₹${metrics.feeTargetLakhs} L target`,
                color: '#22A06B',
              },
              {
                label: 'Pending Fees',
                value: `₹${metrics.feePendingLakhs} L`,
                meta: 'Current term & overdue balance',
                color: '#F59E0B',
              },
              {
                label: "Today's Collection",
                value: `₹${metrics.todayFeeCollectionLakhs} L`,
                meta: 'Counter + online payment gateway',
                color: '#3978F6',
              },
              {
                label: 'Monthly Average',
                value: `₹${metrics.monthlyFeeCollectionLakhs} L`,
                meta: '6-month rolling billing pace',
                color: '#8055D9',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl border border-slate-200/85 p-4 shadow-[0_1px_2px_rgba(16,33,61,0.04)]"
              >
                <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
                <p
                  className="text-xl font-extrabold tabular-nums mt-1"
                  style={{ color: item.color }}
                >
                  {item.value}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{item.meta}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Monthly / Campus / Class Fee Collection Chart */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#10213D]">
                    {financeChartMode === 'monthly'
                      ? 'Monthly Fee Collection vs Target (₹ Lakhs)'
                      : financeChartMode === 'campus'
                      ? 'Fee Collection by Campus (₹ Lakhs)'
                      : 'Fee Collection by Class Tier (₹ Lakhs)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Interactive comparison across collected revenue and outstanding balance
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-[#F4F6FA] p-0.5 border border-slate-200/80 text-[11px] font-semibold">
                  {(
                    [
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'campus', label: 'By Campus' },
                      { id: 'class', label: 'By Class' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFinanceChartMode(tab.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        financeChartMode === tab.id
                          ? 'bg-[#22A06B] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#10213D]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  {financeChartMode === 'monthly' ? (
                    <BarChart data={metrics.monthlyFeeTrend} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="collected"
                        name="Collected (₹L)"
                        fill="#3978F6"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="target"
                        name="Target (₹L)"
                        fill="#D6AD52"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  ) : financeChartMode === 'campus' ? (
                    <BarChart data={metrics.feeByCampus} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="campus"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="collected"
                        name="Collected (₹L)"
                        fill="#16B8A6"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="pending"
                        name="Pending (₹L)"
                        fill="#F59E0B"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <BarChart data={metrics.feeByClass} barGap={6}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="tier"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="collected"
                        name="Collected (₹L)"
                        fill="#8055D9"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="pending"
                        name="Outstanding (₹L)"
                        fill="#EC4899"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Outstanding Fee Summary Donut */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#10213D]">
                  Outstanding Fee Summary
                </h3>
                <p className="text-[11px] text-slate-500">
                  Realized vs pending dues &amp; waivers (₹ Lakhs)
                </p>
              </div>

              <div className="h-48 w-full relative my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.feeSummaryDonut}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={74}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {metrics.feeSummaryDonut.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-[#10213D] tabular-nums leading-none">
                    {feePct}%
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-500 mt-0.5">
                    Realized
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-slate-100 text-xs">
                {metrics.feeSummaryDonut.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[11px] text-slate-600 truncate">
                      {item.name}
                    </span>
                    <span
                      className="font-mono font-bold tabular-nums shrink-0"
                      style={{ color: item.color }}
                    >
                      ₹{item.value}L
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: ATTENDANCE DASHBOARD */}
      {showSection('attendance') && (
        <section ref={attendanceRef} aria-label="Attendance Dashboard" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-[#10213D]">
                Attendance Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Daily presence, late arrivals, classwise compliance &amp; weekly/monthly trends (Preview Data)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ATTENDANCE', 'att-student-daily')}
              className="text-xs font-semibold text-[#16B8A6] hover:text-[#10213D] inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>Open Attendance Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Colour-Coded Daily Attendance Summary */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#10213D]">
                  Today&apos;s Roll Call Overview
                </h3>
                <p className="text-[11px] text-slate-500">
                  Biometric &amp; classroom register summary
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: 'Student Attendance Rate',
                    val: `${metrics.attendanceRate}%`,
                    pct: metrics.attendanceRate,
                    color: '#22A06B',
                    meta: `${metrics.presentStudents.toLocaleString()} of ${metrics.students.toLocaleString()}`,
                  },
                  {
                    label: 'Staff Attendance Rate',
                    val: `${metrics.staffAttendanceRate}%`,
                    pct: metrics.staffAttendanceRate,
                    color: '#16B8A6',
                    meta: `${metrics.presentStaff} of ${metrics.staff} active`,
                  },
                ].map((bar) => (
                  <div key={bar.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#10213D]">{bar.label}</span>
                      <span
                        className="font-mono font-bold tabular-nums"
                        style={{ color: bar.color }}
                      >
                        {bar.val}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${bar.pct}%`, backgroundColor: bar.color }}
                      />
                    </div>
                    <p className="text-[10.5px] text-slate-500">{bar.meta}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                <div className="p-2.5 rounded-xl bg-[#22A06B]/8 text-center">
                  <p className="text-[10.5px] font-semibold text-slate-600">Present</p>
                  <p className="text-base font-extrabold text-[#22A06B] tabular-nums mt-0.5">
                    {metrics.presentStudents.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#EC4899]/8 text-center">
                  <p className="text-[10.5px] font-semibold text-slate-600">Absent</p>
                  <p className="text-base font-extrabold text-[#EC4899] tabular-nums mt-0.5">
                    {metrics.absentStudents.toLocaleString()}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 text-center">
                  <p className="text-[10.5px] font-semibold text-slate-600">Late</p>
                  <p className="text-base font-extrabold text-[#D97706] tabular-nums mt-0.5">
                    {metrics.lateStudents}
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly / Monthly / Classwise Attendance Chart */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#10213D]">
                    {attendanceChartMode === 'weekly'
                      ? 'Weekly Attendance Trend (Students vs Staff %)'
                      : attendanceChartMode === 'monthly'
                      ? 'Monthly Attendance Trend (May – Oct %)'
                      : 'Classwise Student Attendance (%)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hover data points to inspect exact attendance rates
                  </p>
                </div>
                <div className="inline-flex rounded-lg bg-[#F4F6FA] p-0.5 border border-slate-200/80 text-[11px] font-semibold">
                  {(
                    [
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'classwise', label: 'Classwise' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAttendanceChartMode(mode.id)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        attendanceChartMode === mode.id
                          ? 'bg-[#16B8A6] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#10213D]'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  {attendanceChartMode === 'classwise' ? (
                    <BarChart data={metrics.classwiseAttendance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="className"
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[80, 100]}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Bar dataKey="rate" name="Attendance %" radius={[6, 6, 0, 0]} barSize={34}>
                        {metrics.classwiseAttendance.map((entry) => (
                          <Cell
                            key={entry.className}
                            fill={
                              entry.rate >= 95
                                ? '#22A06B'
                                : entry.rate >= 93
                                ? '#16B8A6'
                                : '#F59E0B'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={
                        (attendanceChartMode === 'weekly'
                          ? metrics.weeklyAttendanceTrend
                          : metrics.monthlyAttendanceTrend) as Record<
                          string,
                          string | number
                        >[]
                      }
                    >
                      <defs>
                        <linearGradient id="attStudentGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16B8A6" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#16B8A6" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="attStaffGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8055D9" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#8055D9" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey={attendanceChartMode === 'weekly' ? 'day' : 'month'}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[84, 100]}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area
                        type="monotone"
                        dataKey="students"
                        name="Students %"
                        stroke="#16B8A6"
                        fill="url(#attStudentGrad)"
                        strokeWidth={2.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="staff"
                        name="Staff %"
                        stroke="#8055D9"
                        fill="url(#attStaffGrad)"
                        strokeWidth={2.5}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTIONS 7 & 8: ADMISSIONS PIPELINE & STAFF / HR DASHBOARD */}
      {(showSection('admissions') || showSection('hr')) && (
        <section
          ref={admissionsHrRef}
          aria-label="Admissions and Staff HR Dashboards"
          className="grid grid-cols-1 lg:grid-cols-2 gap-5"
        >
          {/* SECTION 7: ADMISSIONS DASHBOARD */}
          {showSection('admissions') && (
            <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-[#10213D]">
                      Admissions Pipeline &amp; Conversion
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {metrics.academicYearLabel} intake funnel · Conversion Rate{' '}
                      <strong className="text-[#22A06B] tabular-nums">
                        {metrics.admissionsSummary.conversionRate}%
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#3978F6] hover:bg-[#2563EB] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    + Add Enquiry
                  </button>
                </div>

                {/* 5 Pipeline Stat Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                  {[
                    {
                      label: 'Enquiries',
                      val: metrics.admissionsSummary.enquiries,
                      color: '#3978F6',
                    },
                    {
                      label: 'Applications',
                      val: metrics.admissionsSummary.applications,
                      color: '#8055D9',
                    },
                    {
                      label: 'Pending',
                      val: metrics.admissionsSummary.pending,
                      color: '#F59E0B',
                    },
                    {
                      label: 'Approved',
                      val: metrics.admissionsSummary.approved,
                      color: '#22A06B',
                    },
                    {
                      label: 'Rejected',
                      val: metrics.admissionsSummary.rejected,
                      color: '#EC4899',
                    },
                  ].map((st) => (
                    <div
                      key={st.label}
                      className="p-2.5 rounded-xl bg-[#F4F6FA] text-center"
                    >
                      <p className="text-[10px] font-semibold text-slate-500 truncate">
                        {st.label}
                      </p>
                      <p
                        className="text-base font-extrabold tabular-nums mt-0.5"
                        style={{ color: st.color }}
                      >
                        {st.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Graphical Admissions Funnel */}
                <div className="h-52 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metrics.admissionsSummary.stages}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10.5, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        dataKey="stage"
                        type="category"
                        tick={{ fontSize: 11, fill: '#10213D', fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={96}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Applicants" radius={[0, 7, 7, 0]} barSize={18}>
                        {metrics.admissionsSummary.stages.map((entry) => (
                          <Cell key={entry.stage} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Expandable Live CRM Leads Table */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {crmLeads.length} portal enquiries logged
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCRMList((prev) => !prev)}
                    className="font-semibold text-[#3978F6] hover:text-[#10213D] cursor-pointer"
                  >
                    {showCRMList ? 'Hide Enquiries' : `Inspect Leads (${crmLeads.length})`}
                  </button>
                </div>

                {showCRMList && (
                  <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F4F6FA] text-slate-500 border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Parent / Student</th>
                          <th className="px-3 py-2 font-semibold">Grade</th>
                          <th className="px-3 py-2 font-semibold">Contact</th>
                          <th className="px-3 py-2 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {crmLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-[#F4F6FA]/70">
                            <td className="px-3 py-2">
                              <p className="font-semibold text-[#10213D]">
                                {lead.parentName}
                              </p>
                              <p className="text-[10.5px] text-slate-500">
                                {lead.studentName}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-slate-700">
                              {lead.gradeApplying}
                            </td>
                            <td className="px-3 py-2 font-mono text-slate-600 tabular-nums">
                              {lead.contactNumber}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-[#3978F6]">
                              {lead.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 8: STAFF & HR DASHBOARD */}
          {showSection('hr') && (
            <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3.5 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-bold text-[#10213D]">
                      Staff &amp; Human Resources Overview
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Department headcount, attendance &amp; pending HR approvals
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('STAFFS', 'staff-leave-request')}
                    className="px-3 py-1.5 rounded-lg bg-[#8055D9] hover:bg-[#6D28D9] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Leave Desk ({pendingLeaveCount})
                  </button>
                </div>

                {/* Staff & HR Stat Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
                  {[
                    { label: 'Total Staff', val: metrics.staff, color: '#10213D' },
                    { label: 'Teaching', val: metrics.teachingStaff, color: '#3978F6' },
                    { label: 'Non-Teach', val: metrics.nonTeachingStaff, color: '#8055D9' },
                    {
                      label: 'Present %',
                      val: `${metrics.staffAttendanceRate}%`,
                      color: '#22A06B',
                    },
                    { label: 'Leaves', val: pendingLeaveCount, color: '#F59E0B' },
                    {
                      label: 'HR Queue',
                      val: metrics.pendingHrApprovals,
                      color: '#EC4899',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-2.5 rounded-xl bg-[#F4F6FA] text-center"
                    >
                      <p className="text-[10px] font-semibold text-slate-500 truncate">
                        {item.label}
                      </p>
                      <p
                        className="text-base font-extrabold tabular-nums mt-0.5"
                        style={{ color: item.color }}
                      >
                        {item.val}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Department-wise Staff Distribution Chart */}
                <div className="h-56 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.departmentStaffDistribution} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="department"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={34}
                      />
                      <Tooltip contentStyle={DARK_TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="teaching"
                        name="Teaching"
                        stackId="dept"
                        fill="#3978F6"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="nonTeaching"
                        name="Non-Teaching"
                        stackId="dept"
                        fill="#16B8A6"
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Payroll &amp; appraisal workflows ready in HR module
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('HR', 'hr-payroll')}
                    className="font-semibold text-[#8055D9] hover:text-[#10213D] cursor-pointer"
                  >
                    Open HR &amp; Payroll ➔
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECTIONS 9 & 10: RECENT ACTIVITIES & UPCOMING EVENTS */}
      <section
        ref={activitiesRef}
        aria-label="Recent Activities and Upcoming Events"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        {/* SECTION 9: RECENT ACTIVITIES */}
        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#10213D] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#3978F6]" />
                <span>Recent Activities</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Registrations, fee payments, staff, attendance, exams &amp; audit events
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {(
                ['ALL', 'Students', 'Fees', 'Staff', 'Attendance', 'Exams', 'Admin'] as const
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityFilter(cat)}
                  className={`px-2 py-1 text-[10.5px] font-semibold rounded-md transition-colors cursor-pointer ${
                    activityFilter === cat
                      ? 'bg-[#10213D] text-[#D6AD52]'
                      : 'text-slate-600 hover:bg-[#F4F6FA] hover:text-[#10213D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1 max-h-[380px] overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No matching activity items in this category.
              </div>
            ) : (
              filteredActivities.slice(0, 7).map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={act.action}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#F4F6FA]/80 transition-colors flex items-start gap-3 cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold"
                    style={{ backgroundColor: act.accent }}
                  >
                    {act.category.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#10213D] leading-snug">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {act.user} · {act.meta}
                    </p>
                  </div>
                  <span className="text-[10.5px] font-mono text-slate-400 shrink-0 tabular-nums whitespace-nowrap">
                    {act.time}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="px-5 py-3 bg-[#F4F6FA]/75 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Includes live session audit log entries</span>
            <button
              type="button"
              onClick={() => onNavigate('ADMIN', 'admin-audit')}
              className="font-semibold text-[#3978F6] hover:text-[#10213D] cursor-pointer"
            >
              Full Audit Log ➔
            </button>
          </div>
        </div>

        {/* SECTION 10: UPCOMING EVENTS */}
        <div className="bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#10213D] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8055D9]" />
                <span>Upcoming Events &amp; Deadlines</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                School events, exam schedules, holidays, parent &amp; staff meetings
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddEventModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#10213D] hover:bg-[#19335D] text-[#D6AD52] text-[11px] font-semibold cursor-pointer transition-colors"
            >
              + Add Event
            </button>
          </div>

          <div className="px-5 py-2.5 bg-[#F4F6FA]/60 border-b border-slate-100 flex items-center gap-1 overflow-x-auto">
            {(
              [
                'All',
                'School Events',
                'Exams',
                'Holidays',
                'Parents',
                'Staff',
                'Deadlines',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setEventFilter(cat)}
                className={`px-2.5 py-1 text-[10.5px] font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  eventFilter === cat
                    ? 'bg-[#8055D9] text-white'
                    : 'text-slate-600 hover:bg-white hover:text-[#10213D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="divide-y divide-slate-100 flex-1 max-h-[340px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No upcoming events match this filter.
              </div>
            ) : (
              filteredEvents.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className="px-5 py-3 flex items-center gap-3.5 hover:bg-[#F4F6FA]/70 transition-colors"
                >
                  <div
                    className="w-12 py-1.5 rounded-xl text-center shrink-0 text-white shadow-xs"
                    style={{ backgroundColor: ev.accent }}
                  >
                    <p className="text-sm font-extrabold leading-none tabular-nums">
                      {ev.date}
                    </p>
                    <p className="text-[9.5px] font-bold tracking-wider opacity-90 mt-0.5">
                      {ev.month}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#10213D] truncate">
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {ev.venue} · {ev.time} · {ev.category}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-3 bg-[#F4F6FA]/75 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 tabular-nums">
              {upcomingEvents.length} scheduled institutional events
            </span>
            <button
              type="button"
              onClick={() => onNavigate('SCHOOL', 'school-calendar')}
              className="font-semibold text-[#8055D9] hover:text-[#10213D] cursor-pointer"
            >
              Academic Calendar ➔
            </button>
          </div>
        </div>
      </section>

      {/* CAMPUS OPERATIONS STRIP: Live Bus Fleet & Birthdays */}
      <section
        ref={operationsRef}
        aria-label="Campus Fleet and Birthdays"
        className="grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Live School Bus Fleet */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <h2 className="text-sm font-bold text-[#10213D] flex items-center gap-2">
              <Bus className="w-4 h-4 text-[#F59E0B]" />
              <span>Transport Fleet Status</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('TRANSPORT', 'transport-bus-locations')}
              className="text-xs font-semibold text-[#3978F6] hover:text-[#10213D] inline-flex items-center gap-1 cursor-pointer"
            >
              <span>All Routes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {busRoutes.slice(0, 3).map((bus) => (
              <div
                key={bus.id}
                className="py-2.5 flex items-center justify-between text-xs gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#10213D] flex items-center gap-2">
                    <span>{bus.busNo}</span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        bus.status === 'In Transit'
                          ? 'text-[#D97706]'
                          : 'text-[#22A06B]'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {bus.currentLocationName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-[#10213D] tabular-nums">
                    {bus.speedKmh} km/h
                  </p>
                  <p className="text-[10.5px] text-slate-500 tabular-nums">
                    {bus.studentsOnBoard}/{bus.capacity} onboard
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Birthdays */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/85 shadow-[0_1px_3px_rgba(16,33,61,0.05)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EC4899]/10 text-[#EC4899] flex items-center justify-center shrink-0">
                <Cake className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#10213D]">
                  Campus Birthdays · 23 Oct 2026
                </h2>
                <p className="text-[11px] text-slate-500">
                  Send greetings to students &amp; staff
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {(
                ['TODAY', 'TOMORROW', 'THIS WEEK', 'THIS MONTH', 'NEXT MONTH'] as const
              ).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBirthdayTab(tab)}
                  className={`px-2 py-1 text-[10.5px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    birthdayTab === tab
                      ? 'bg-[#EC4899] text-white'
                      : 'bg-[#F4F6FA] text-slate-600 hover:text-[#10213D]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredBirthdays.length === 0 ? (
              <div className="col-span-full py-5 text-center text-xs text-slate-500">
                No birthdays scheduled for {birthdayTab.toLowerCase()}.
              </div>
            ) : (
              filteredBirthdays.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:border-[#EC4899]/45 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#10213D] text-[#D6AD52] font-bold flex items-center justify-center text-xs shrink-0">
                      {item.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#10213D] truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.role === 'Student'
                          ? `${item.grade} · Sec ${item.section}`
                          : `Staff · ${item.department}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSendBirthdayWish(item.id)}
                    disabled={item.wished}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shrink-0 ${
                      item.wished
                        ? 'bg-[#22A06B]/10 text-[#22A06B] cursor-default'
                        : 'bg-[#10213D] hover:bg-[#1E3A66] text-white cursor-pointer'
                    }`}
                  >
                    {item.wished ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Wished</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3 text-[#D6AD52]" />
                        <span>Wish</span>
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Add Admission Enquiry Modal */}
      <EnterpriseFormModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        title="Add New Admission Enquiry"
        subtitle="Record prospective parent enquiry into the CRM admissions pipeline"
      >
        <form onSubmit={handleCreateLead} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#10213D] block mb-1">
              Parent / Guardian Name *
            </label>
            <input
              type="text"
              required
              value={newLeadParent}
              onChange={(e) => setNewLeadParent(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#10213D] block mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={newLeadStudent}
              onChange={(e) => setNewLeadStudent(e.target.value)}
              placeholder="e.g. Aditi Chandra"
              className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Contact Number *
              </label>
              <input
                type="tel"
                required
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
                placeholder="+91 98400 12345"
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Grade Applying For
              </label>
              <select
                value={newLeadGrade}
                onChange={(e) => setNewLeadGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              >
                {[
                  'Pre-KG',
                  'LKG',
                  'UKG',
                  'Grade 1',
                  'Grade 3',
                  'Grade 6',
                  'Grade 9',
                  'Grade 11',
                ].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[#3978F6] hover:bg-[#2563EB] text-white rounded-lg cursor-pointer"
            >
              Save Enquiry
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* Add Upcoming Event Modal */}
      <EnterpriseFormModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Schedule Upcoming Event"
        subtitle="Add an institutional event, exam schedule, holiday, or meeting"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#10213D] block mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Annual Science Exhibition"
              className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Day
              </label>
              <input
                type="text"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                placeholder="22"
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Month
              </label>
              <input
                type="text"
                value={newEventMonth}
                onChange={(e) => setNewEventMonth(e.target.value)}
                placeholder="NOV"
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Time
              </label>
              <input
                type="text"
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Venue / Scope
              </label>
              <input
                type="text"
                value={newEventVenue}
                onChange={(e) => setNewEventVenue(e.target.value)}
                placeholder="Main Auditorium"
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#10213D] block mb-1">
                Category
              </label>
              <select
                value={newEventCategory}
                onChange={(e) =>
                  setNewEventCategory(e.target.value as Exclude<EventCategory, 'All'>)
                }
                className="w-full px-3 py-2 text-xs bg-[#F4F6FA] border border-slate-300 rounded-lg focus:outline-none focus:border-[#3978F6] focus:bg-white"
              >
                {(
                  [
                    'School Events',
                    'Exams',
                    'Holidays',
                    'Parents',
                    'Staff',
                    'Deadlines',
                  ] as const
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddEventModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[#10213D] hover:bg-[#19335D] text-[#D6AD52] rounded-lg cursor-pointer"
            >
              Add to Calendar
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
