import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  School,
  MapPin,
  GraduationCap,
  Users,
  CalendarCheck,
  IndianRupee,
  UserPlus,
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
  Info,
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
  NavSection,
} from '../types';
import {
  InstitutionalMetrics,
  SCHOOL_OPTIONS,
} from '../data/schoolContext';
import { EnterpriseFormModal } from './Common/EnterpriseUI';

interface HomeDashboardProps {
  students: Student[];
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  birthdays: BirthdayItem[];
  circulars: Circular[];
  busRoutes: BusRoute[];
  metrics: InstitutionalMetrics;
  activeSubItem?: string;
  onNavigate: (section: NavSection, subItem?: string) => void;
  onOpenQuickAction: () => void;
  onSendBirthdayWish: (id: string) => void;
  onAddLead: (lead: Omit<CRMLead, 'id'>) => void;
}

interface DashboardEvent {
  id: string;
  date: string;
  title: string;
  venue: string;
  category: 'Academic' | 'Sports' | 'Governance' | 'Parents';
}

const INITIAL_UPCOMING_EVENTS: DashboardEvent[] = [
  { id: 'ev-1', date: '26 Oct', title: 'Inter-Campus Robotics & STEM Expo', venue: 'Main Auditorium · Chennai HQ', category: 'Academic' },
  { id: 'ev-2', date: '29 Oct', title: 'Term 2 Parent-Teacher Academic Review', venue: 'All Classrooms · 09:00 AM', category: 'Parents' },
  { id: 'ev-3', date: '04 Nov', title: 'CBSE Cluster Athletics Championship', venue: 'Sports Complex · North Wing', category: 'Sports' },
  { id: 'ev-4', date: '12 Nov', title: 'Annual Board Finance & Trust Audit', venue: 'Executive Boardroom · 10:30 AM', category: 'Governance' },
  { id: 'ev-5', date: '18 Nov', title: 'Senior Secondary Science Practical Briefing', venue: 'Physics & Chemistry Block', category: 'Academic' },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  leaveRequests,
  crmLeads,
  birthdays,
  circulars,
  busRoutes,
  metrics,
  activeSubItem,
  onNavigate,
  onOpenQuickAction,
  onSendBirthdayWish,
  onAddLead,
}) => {
  const [birthdayTab, setBirthdayTab] = useState<
    'TODAY' | 'TOMORROW' | 'THIS WEEK' | 'THIS MONTH' | 'NEXT MONTH'
  >('TODAY');
  const [activityFilter, setActivityFilter] = useState<
    'ALL' | 'Academic' | 'Finance' | 'Staff'
  >('ALL');
  const [studentChartView, setStudentChartView] = useState<'wings' | 'schools'>('wings');
  const [upcomingEvents, setUpcomingEvents] = useState<DashboardEvent[]>(
    INITIAL_UPCOMING_EVENTS
  );

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showCRMList, setShowCRMList] = useState(false);

  const [newLeadParent, setNewLeadParent] = useState('');
  const [newLeadStudent, setNewLeadStudent] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadGrade, setNewLeadGrade] = useState('Grade 1');

  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('22 Nov');
  const [newEventVenue, setNewEventVenue] = useState('Main Campus Auditorium');
  const [newEventCategory, setNewEventCategory] =
    useState<DashboardEvent['category']>('Academic');

  const operationsRef = useRef<HTMLElement>(null);
  const crmRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeSubItem === 'dashboard-operations') {
      operationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeSubItem === 'dashboard-crm') {
      crmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSubItem]);

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

  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const totalCampusesInGroup = SCHOOL_OPTIONS.reduce((a, s) => a + s.campuses.length, 0);
  const feePct = Math.min(
    100,
    Math.round((metrics.feeCollectedLakhs / metrics.feeTargetLakhs) * 100)
  );
  const studentsPresentCount = Math.round(
    (metrics.students * metrics.attendanceRate) / 100
  );
  const totalPendingAdmissions = metrics.pendingAdmissions + crmLeads.length;

  const schoolEnrollmentChartData = SCHOOL_OPTIONS.map((s) => {
    const total = s.campuses.reduce((a, c) => a + c.studentCount, 0);
    return {
      wing: s.board,
      boys: Math.round(total * 0.51),
      girls: total - Math.round(total * 0.51),
      total,
    };
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
    setUpcomingEvents((prev) => [
      {
        id: `ev-${Date.now()}`,
        date: newEventDate.trim() || '25 Nov',
        title: newEventTitle.trim(),
        venue: newEventVenue.trim() || metrics.campusLabel,
        category: newEventCategory,
      },
      ...prev,
    ]);
    setNewEventTitle('');
    setShowAddEventModal(false);
  };

  const allRecentActivities = [
    {
      id: 'act-1',
      time: '12 mins ago',
      category: 'Staff' as const,
      title: `${pendingLeaveCount} staff leave applications awaiting approval`,
      meta: 'Staff Management · Leave Desk',
      action: () => onNavigate('STAFFS', 'staff-leave-request'),
    },
    {
      id: 'act-2',
      time: '38 mins ago',
      category: 'Finance' as const,
      title: `Term 2 fee settlement batch posted — ₹${metrics.feeCollectedLakhs} L realized (${feePct}%)`,
      meta: 'Fee Management · Accounts Ledger',
      action: () => onNavigate('FEE MANAGEMENT', 'fee-collection'),
    },
    {
      id: 'act-3',
      time: '1 hour ago',
      category: 'Staff' as const,
      title: `October 2026 payroll sheet verified for ${metrics.staff} staff members`,
      meta: 'Human Resources · Payroll Processing',
      action: () => onNavigate('HR', 'hr-payroll'),
    },
    {
      id: 'act-4',
      time: '2 hours ago',
      category: 'Academic' as const,
      title: circulars[0]?.title || 'Term 2 Examination Schedule Circular published',
      meta: 'Communication Management · Circulars',
      action: () => onNavigate('SCHOOL', 'school-circulars'),
    },
    {
      id: 'act-5',
      time: 'Today, 08:30 AM',
      category: 'Academic' as const,
      title: `Daily roll call recorded at ${metrics.attendanceRate}% student attendance`,
      meta: 'Attendance Management · Daily Register',
      action: () => onNavigate('ATTENDANCE', 'att-student-daily'),
    },
  ];

  const filteredActivities =
    activityFilter === 'ALL'
      ? allRecentActivities
      : allRecentActivities.filter((a) => a.category === activityFilter);

  const dashboardCards = [
    {
      id: 'orgs',
      label: 'Total Organizations',
      value: '2',
      meta: 'Leaders Trust · Global Baccalaureate',
      trend: '100% Active',
      trendPositive: true,
      icon: Building2,
      iconTone: 'bg-[#0B1F3A]/6 text-[#0B1F3A] border-[#0B1F3A]/10',
      actionLabel: 'Organization registry',
      onClick: () => onNavigate('ORGANIZATION', 'org-trusts'),
    },
    {
      id: 'schools',
      label: 'Total Schools',
      value: String(SCHOOL_OPTIONS.length),
      meta: 'CBSE · ICSE · IB Curricula',
      trend: '3 Boards',
      trendPositive: true,
      icon: School,
      iconTone: 'bg-[#D4AF37]/15 text-[#8A6712] border-[#D4AF37]/30',
      actionLabel: 'Affiliated schools',
      onClick: () => onNavigate('ORGANIZATION', 'org-schools'),
    },
    {
      id: 'campuses',
      label: 'Total Campuses',
      value: String(totalCampusesInGroup),
      meta: `Active scope: ${metrics.campusCount} campus${metrics.campusCount > 1 ? 'es' : ''}`,
      trend: 'Chennai Metro',
      trendPositive: true,
      icon: MapPin,
      iconTone: 'bg-[#0B1F3A]/6 text-[#0B1F3A] border-[#0B1F3A]/10',
      actionLabel: 'Inspect branches',
      onClick: () => onNavigate('ORGANIZATION', 'org-campuses'),
    },
    {
      id: 'students',
      label: 'Total Students',
      value: metrics.students.toLocaleString(),
      meta: `${metrics.appUsers.toLocaleString()} portal & app users`,
      trend: '+4.6% YoY',
      trendPositive: true,
      icon: GraduationCap,
      iconTone: 'bg-[#0B1F3A]/6 text-[#0B1F3A] border-[#0B1F3A]/10',
      actionLabel: 'Student directory',
      onClick: () => onNavigate('STUDENT', 'student-user-details'),
    },
    {
      id: 'staff',
      label: 'Total Staff',
      value: String(metrics.staff),
      meta: `${metrics.staffAttendanceRate}% staff present today`,
      trend: 'Faculty & Admin',
      trendPositive: true,
      icon: Users,
      iconTone: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      actionLabel: 'Staff directory',
      onClick: () => onNavigate('STAFFS', 'staff-info'),
    },
    {
      id: 'attendance',
      label: "Today's Attendance",
      value: `${metrics.attendanceRate}%`,
      meta: `${studentsPresentCount.toLocaleString()} / ${metrics.students.toLocaleString()} present`,
      progress: metrics.attendanceRate,
      progressColor: 'bg-emerald-600',
      icon: CalendarCheck,
      iconTone: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      actionLabel: 'Daily roll register',
      onClick: () => onNavigate('ATTENDANCE', 'att-student-daily'),
    },
    {
      id: 'fees',
      label: 'Fee Collection',
      value: `₹${metrics.feeCollectedLakhs} L`,
      meta: `${feePct}% of ₹${metrics.feeTargetLakhs} L term target`,
      progress: feePct,
      progressColor: 'bg-[#C9A227]',
      icon: IndianRupee,
      iconTone: 'bg-[#D4AF37]/15 text-[#8A6712] border-[#D4AF37]/30',
      actionLabel: 'Fee collection counter',
      onClick: () => onNavigate('FEE MANAGEMENT', 'fee-collection'),
    },
    {
      id: 'admissions',
      label: 'Pending Admissions',
      value: String(totalPendingAdmissions),
      meta: `${crmLeads.length} recent portal leads`,
      trend: 'Action Required',
      trendPositive: false,
      icon: UserPlus,
      iconTone: 'bg-amber-50 text-amber-700 border-amber-200/80',
      actionLabel: 'Record new inquiry',
      onClick: () => setShowAddLeadModal(true),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Sample Preview Notice Strip */}
      <div className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Info className="w-4 h-4 text-[#9A7418] shrink-0" />
          <span>
            <strong className="text-[#0B1F3A]">Sample Preview Data:</strong> Metrics, charts, and activity feeds below represent illustrative UI preview data for {metrics.schoolName} ({metrics.campusLabel} · {metrics.academicYearLabel}).
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('REPORTS', 'rep-executive')}
          className="text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] whitespace-nowrap shrink-0 cursor-pointer"
        >
          Full Analytics Report ➔
        </button>
      </div>

      {/* Executive Institutional Hero Banner */}
      <section className="bg-[#0B1F3A] rounded-xl p-5 sm:p-6 text-white border border-[#D4AF37]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
            {metrics.board} · Aff. #{metrics.affiliationNo} · {metrics.academicYearLabel}
          </p>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
            {metrics.schoolName}
          </h1>
          <p className="text-xs text-slate-300">
            Active Campus: <strong className="text-white">{metrics.campusLabel}</strong> · {pendingLeaveCount} pending leave approvals · {totalPendingAdmissions} pending admission reviews
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('STAFFS', 'staff-leave-request')}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
          >
            Review Leaves ({pendingLeaveCount})
          </button>
          <button
            type="button"
            onClick={() => onNavigate('FEE MANAGEMENT', 'fee-collection')}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
          >
            Collect Fees
          </button>
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Quick Action</span>
          </button>
        </div>
      </section>

      {/* 8 Professional Enterprise Dashboard KPI Cards */}
      <section aria-label="Executive KPI Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-[#C9A227]/70 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                        {card.label}
                      </p>
                      <p className="text-2xl sm:text-[26px] font-extrabold text-[#0B1F3A] tracking-tight tabular-nums mt-1.5 leading-none">
                        {card.value}
                      </p>
                    </div>
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${card.iconTone}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-500 truncate">{card.meta}</span>
                    {card.trend && (
                      <span
                        className={`font-semibold shrink-0 inline-flex items-center gap-0.5 ${
                          card.trendPositive ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {card.trendPositive && <TrendingUp className="w-3 h-3" />}
                        <span>{card.trend}</span>
                      </span>
                    )}
                  </div>

                  {typeof card.progress === 'number' && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${card.progressColor}`}
                        style={{ width: `${Math.min(100, card.progress)}%` }}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={card.onClick}
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] transition-colors cursor-pointer group"
                >
                  <span>{card.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3 Core Analytics Charts: Student Statistics, Attendance, Fee Collection */}
      <section aria-label="Institutional Analytics Charts" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Student Statistics Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">Student Statistics</h2>
              <p className="text-[11px] text-slate-500">
                Sample enrollment · {metrics.students.toLocaleString()} total students
              </p>
            </div>
            <div className="inline-flex rounded-md border border-slate-200 bg-[#F8FAFC] p-0.5 text-[10.5px] font-semibold">
              <button
                type="button"
                onClick={() => setStudentChartView('wings')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  studentChartView === 'wings'
                    ? 'bg-[#0B1F3A] text-[#D4AF37]'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                Wings
              </button>
              <button
                type="button"
                onClick={() => setStudentChartView('schools')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  studentChartView === 'schools'
                    ? 'bg-[#0B1F3A] text-[#D4AF37]'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                Boards
              </button>
            </div>
          </div>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  studentChartView === 'wings'
                    ? metrics.studentWingStats
                    : schoolEnrollmentChartData
                }
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="wing"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1F3A',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="boys" name="Boys" fill="#0B1F3A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="girls" name="Girls" fill="#C9A227" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Attendance Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">Attendance Trend (%)</h2>
              <p className="text-[11px] text-slate-500">
                Students ({metrics.attendanceRate}%) vs Staff ({metrics.staffAttendanceRate}%)
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ATTENDANCE', 'att-student-daily')}
              className="text-[11px] font-semibold text-[#9A7418] hover:text-[#0B1F3A] cursor-pointer"
            >
              Register ➔
            </button>
          </div>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.weeklyAttendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[82, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1F3A',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area
                  type="monotone"
                  dataKey="students"
                  name="Students %"
                  stroke="#0B1F3A"
                  fill="#0B1F3A"
                  fillOpacity={0.12}
                  strokeWidth={2.2}
                />
                <Area
                  type="monotone"
                  dataKey="staff"
                  name="Staff %"
                  stroke="#16A34A"
                  fill="#16A34A"
                  fillOpacity={0.08}
                  strokeWidth={2.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Fee Collection Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">Fee Collection (₹ Lakhs)</h2>
              <p className="text-[11px] text-slate-500">
                Realized ₹{metrics.feeCollectedLakhs} L vs Target ₹{metrics.feeTargetLakhs} L
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('FEE MANAGEMENT', 'fee-report')}
              className="text-[11px] font-semibold text-[#9A7418] hover:text-[#0B1F3A] cursor-pointer"
            >
              Ledger ➔
            </button>
          </div>

          <div className="h-60 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyFeeTrend} barGap={4}>
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
                  width={34}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1F3A',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="collected" name="Collected (₹L)" fill="#0B1F3A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="target" name="Target (₹L)" fill="#D4AF37" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Activities & Upcoming Events */}
      <section aria-label="Activities and Events" className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activities */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#9A7418]" />
              <span>Recent Activities</span>
            </h2>
            <div className="flex items-center gap-1">
              {(['ALL', 'Academic', 'Finance', 'Staff'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityFilter(cat)}
                  className={`px-2 py-1 text-[10.5px] font-semibold rounded transition-colors cursor-pointer ${
                    activityFilter === cat
                      ? 'bg-[#0B1F3A] text-[#D4AF37]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {filteredActivities.map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={act.action}
                className="w-full text-left px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors flex items-start justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0B1F3A] leading-snug">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {act.meta} · {act.category}
                  </p>
                </div>
                <span className="text-[10.5px] font-mono text-slate-400 shrink-0 tabular-nums">
                  {act.time}
                </span>
              </button>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sample preview activity stream</span>
            <button
              type="button"
              onClick={() => onNavigate('SETTINGS', 'admin-audit')}
              className="font-semibold text-[#0B1F3A] hover:text-[#9A7418] cursor-pointer"
            >
              View Audit Log ➔
            </button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#9A7418]" />
              <span>Upcoming Events</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddEventModal(true)}
                className="px-2.5 py-1 rounded-md bg-[#0B1F3A] hover:bg-[#132E54] text-white text-[11px] font-semibold cursor-pointer"
              >
                + Add Event
              </button>
              <button
                type="button"
                onClick={() => onNavigate('SCHOOL', 'school-calendar')}
                className="text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] cursor-pointer"
              >
                Calendar
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {upcomingEvents.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="w-14 py-1.5 rounded-lg bg-[#0B1F3A] text-center shrink-0">
                  <span className="text-[11px] font-mono font-bold text-[#D4AF37] tabular-nums">
                    {ev.date}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#0B1F3A] truncate">{ev.title}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {ev.venue} · {ev.category}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-[#F8FAFC] border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 tabular-nums">
              {upcomingEvents.length} scheduled institutional events
            </span>
            <button
              type="button"
              onClick={() => onNavigate('SCHOOL', 'school-events')}
              className="font-semibold text-[#0B1F3A] hover:text-[#9A7418] cursor-pointer"
            >
              Manage Events ➔
            </button>
          </div>
        </div>
      </section>

      {/* Operations Row: CRM Admissions & Live Bus Fleet */}
      <section ref={crmRef} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#0B1F3A]/6 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A]">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0B1F3A]">
                    CRM & Prospective Admissions
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {crmLeads.length} sample portal inquiries logged
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
              >
                + Add Lead
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Review latest parent inquiries and follow-up schedule
              </span>
              <button
                type="button"
                onClick={() => setShowCRMList((prev) => !prev)}
                className="font-semibold text-[#9A7418] hover:text-[#0B1F3A] cursor-pointer"
              >
                {showCRMList ? 'Hide Table' : `View Leads (${crmLeads.length})`}
              </button>
            </div>

            {showCRMList && (
              <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-slate-500 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Parent / Student</th>
                      <th className="px-3 py-2 font-semibold">Grade</th>
                      <th className="px-3 py-2 font-semibold">Contact</th>
                      <th className="px-3 py-2 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crmLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-[#F8FAFC]">
                        <td className="px-3 py-2">
                          <p className="font-semibold text-[#0B1F3A]">{lead.parentName}</p>
                          <p className="text-[10.5px] text-slate-500">{lead.studentName}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{lead.gradeApplying}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {lead.contactNumber}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-[#9A7418]">
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

        {/* Live School Bus Fleet */}
        <section ref={operationsRef} className="bg-white border border-slate-200/80 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <Bus className="w-4 h-4 text-[#9A7418]" />
              <span>Live School Bus Tracking</span>
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('TRANSPORT', 'transport-bus-locations')}
              className="text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] inline-flex items-center gap-1 cursor-pointer"
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
                  <div className="font-bold text-[#0B1F3A] flex items-center gap-2">
                    <span>{bus.busNo}</span>
                    <span className="text-slate-300">·</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        bus.status === 'In Transit' ? 'text-amber-700' : 'text-emerald-700'
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
                  <p className="font-mono font-semibold text-[#0B1F3A] tabular-nums">
                    {bus.speedKmh} km/h
                  </p>
                  <p className="text-[10.5px] text-slate-500 tabular-nums">
                    {bus.studentsOnBoard}/{bus.capacity} onboard
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* Institutional Birthdays */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#8A6712]">
              <Cake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">
                Campus Birthdays · 23 Oct 2026
              </h2>
              <p className="text-[11px] text-slate-500">
                Send institutional greetings across students and staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {(['TODAY', 'TOMORROW', 'THIS WEEK', 'THIS MONTH', 'NEXT MONTH'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setBirthdayTab(tab)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    birthdayTab === tab
                      ? 'bg-[#0B1F3A] text-[#D4AF37]'
                      : 'bg-[#F8FAFC] text-slate-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBirthdays.length === 0 ? (
            <div className="col-span-full py-6 text-center text-xs text-slate-500">
              No birthdays scheduled for {birthdayTab.toLowerCase()}.
            </div>
          ) : (
            filteredBirthdays.map((item) => (
              <div
                key={item.id}
                className="p-3.5 border border-slate-200/80 rounded-lg flex items-center justify-between gap-3 hover:border-[#C9A227]/60 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0B1F3A] text-[#D4AF37] font-bold flex items-center justify-center text-xs shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0B1F3A] truncate">{item.name}</p>
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
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shrink-0 ${
                    item.wished
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-[#0B1F3A] hover:bg-[#132E54] text-white cursor-pointer'
                  }`}
                >
                  {item.wished ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Wished</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3 text-[#D4AF37]" />
                      <span>Wish</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add Admission Lead Modal */}
      <EnterpriseFormModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        title="Add New Admission Lead"
        subtitle="Record prospective parent inquiry into the sample CRM tracker"
      >
        <form onSubmit={handleCreateLead} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
              Parent / Guardian Name *
            </label>
            <input
              type="text"
              required
              value={newLeadParent}
              onChange={(e) => setNewLeadParent(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
              Student Name
            </label>
            <input
              type="text"
              value={newLeadStudent}
              onChange={(e) => setNewLeadStudent(e.target.value)}
              placeholder="e.g. Aditi Chandra"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
                Contact Phone *
              </label>
              <input
                type="text"
                required
                value={newLeadPhone}
                onChange={(e) => setNewLeadPhone(e.target.value)}
                placeholder="+91 98450 ..."
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
                Grade Applying
              </label>
              <select
                value={newLeadGrade}
                onChange={(e) => setNewLeadGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg cursor-pointer"
              >
                <option>Pre-KG</option>
                <option>LKG / UKG</option>
                <option>Grade 1</option>
                <option>Grade 6</option>
                <option>Grade 9</option>
                <option>Grade 11 (Science)</option>
                <option>Grade 11 (Commerce)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddLeadModal(false)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132E54] rounded-lg cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* Add Upcoming Event Modal */}
      <EnterpriseFormModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        title="Schedule Upcoming Event"
        subtitle="Add a campus event to the preview dashboard schedule"
      >
        <form onSubmit={handleCreateEvent} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="e.g. Annual Science & Innovation Day"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
                Date Label *
              </label>
              <input
                type="text"
                required
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                placeholder="e.g. 24 Nov"
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
                Category
              </label>
              <select
                value={newEventCategory}
                onChange={(e) =>
                  setNewEventCategory(e.target.value as DashboardEvent['category'])
                }
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg cursor-pointer"
              >
                <option value="Academic">Academic</option>
                <option value="Parents">Parents</option>
                <option value="Sports">Sports</option>
                <option value="Governance">Governance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#0B1F3A] block mb-1">
              Venue / Campus Location
            </label>
            <input
              type="text"
              value={newEventVenue}
              onChange={(e) => setNewEventVenue(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddEventModal(false)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#132E54] rounded-lg cursor-pointer"
            >
              Add Event
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
