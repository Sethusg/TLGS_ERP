import React, { useState } from 'react';
import {
  GraduationCap,
  Smartphone,
  Users,
  MessageSquare,
  FileText,
  PhoneCall,
  Cake,
  ArrowRight,
  PenSquare,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Bus,
  IndianRupee,
  Bell,
  Search,
} from 'lucide-react';
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

interface HomeDashboardProps {
  students: Student[];
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  birthdays: BirthdayItem[];
  circulars: Circular[];
  busRoutes: BusRoute[];
  onNavigate: (section: NavSection, subItem?: string) => void;
  onOpenQuickAction: () => void;
  onSendBirthdayWish: (id: string) => void;
  onAddLead: (lead: Omit<CRMLead, 'id'>) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  students,
  staffList,
  leaveRequests,
  crmLeads,
  birthdays,
  circulars,
  busRoutes,
  onNavigate,
  onOpenQuickAction,
  onSendBirthdayWish,
  onAddLead,
}) => {
  const [birthdayTab, setBirthdayTab] = useState<
    'TODAY' | 'TOMORROW' | 'THIS WEEK' | 'THIS MONTH' | 'NEXT MONTH'
  >('TODAY');

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showCRMList, setShowCRMList] = useState(false);
  const [newLeadParent, setNewLeadParent] = useState('');
  const [newLeadStudent, setNewLeadStudent] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadGrade, setNewLeadGrade] = useState('Grade 1');

  // Filtered birthdays based on selected tab
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
    return b.dob.includes('-11-'); // NEXT MONTH
  });

  const pendingLeaveCount = leaveRequests.filter((r) => r.status === 'Pending').length;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadParent || !newLeadPhone) return;
    onAddLead({
      parentName: newLeadParent,
      studentName: newLeadStudent || 'Prospective Student',
      contactNumber: newLeadPhone,
      gradeApplying: newLeadGrade,
      inquiryDate: '2026-10-23',
      followUpDate: '2026-10-25',
      status: 'New Inquiry',
      notes: 'Initial admission inquiry via portal',
      source: 'Website',
    });
    setNewLeadParent('');
    setNewLeadStudent('');
    setNewLeadPhone('');
    setShowAddLeadModal(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Automated Live Notification Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 rounded-2xl p-4 sm:p-5 text-white shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-blue-400">
                THE LEADERS ACADEMY(CBSE) Automated Notification Engine
              </span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-mono font-bold border border-blue-500/40">
                3 New Alerts
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              • <strong>Leaves:</strong> {pendingLeaveCount} pending approvals awaiting review · • <strong>Payroll:</strong> Oct 2026 ledger generated · • <strong>Birthdays:</strong> {filteredBirthdays.length} birthdays scheduled
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('STAFFS', 'staff-leave-request')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>Review Leaves ({pendingLeaveCount})</span>
          </button>
          <button
            onClick={() => onNavigate('STAFFS', 'staff-payroll')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <span>View Payroll</span>
          </button>
        </div>
      </div>

      {/* 5 Top Stat Cards - International Enterprise UI Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* STUDENTS CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                1069
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                STUDENTS
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('STUDENT', 'student-user-details')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors group cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* APP USERS CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                1189
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                APP USERS
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('SCHOOL', 'school-app-content')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors group cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* STAFFS CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                120
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                STAFFS
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('STAFFS', 'staff-info')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-emerald-600 transition-colors group cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* NEW MESSAGES CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                0
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                NEW MESSAGES
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('CONTACT', 'contact-messaging')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer"
          >
            <span>View details</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* LEAVE REQUEST CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                305
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                LEAVE REQUEST
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('STAFFS', 'staff-leave-request')}
            className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600 hover:text-amber-700 transition-colors group cursor-pointer"
          >
            <span>More info</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Floating Action Pen Button */}
      <div className="relative flex justify-center -my-3 z-10">
        <button
          onClick={onOpenQuickAction}
          className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Quick Action / Create Notice / Add Record"
          aria-label="Create new entry"
        >
          <PenSquare className="w-5 h-5" />
        </button>
      </div>

      {/* CRM Section */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">CRM & Prospective Admissions</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
              0
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>No urgent CRM follow-ups scheduled for today</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCRMList(!showCRMList)}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              {showCRMList ? 'Hide prospective leads' : 'View prospective leads (3)'}
            </button>
            <span className="text-slate-300">·</span>
            <button
              onClick={() => setShowAddLeadModal(true)}
              className="text-blue-700 hover:text-blue-900 font-semibold cursor-pointer"
            >
              + Add Lead
            </button>
          </div>
        </div>

        {/* Collapsible CRM Leads Table */}
        {showCRMList && (
          <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2 font-semibold">Parent Name</th>
                  <th className="px-3.5 py-2 font-semibold">Student Name</th>
                  <th className="px-3.5 py-2 font-semibold">Class Applying</th>
                  <th className="px-3.5 py-2 font-semibold">Contact</th>
                  <th className="px-3.5 py-2 font-semibold">Next Follow-Up</th>
                  <th className="px-3.5 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {crmLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5 font-medium text-slate-900">{lead.parentName}</td>
                    <td className="px-3.5 py-2.5 text-slate-700">{lead.studentName}</td>
                    <td className="px-3.5 py-2.5 text-slate-700">{lead.gradeApplying}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600">{lead.contactNumber}</td>
                    <td className="px-3.5 py-2.5 text-slate-600">{lead.followUpDate}</td>
                    <td className="px-3.5 py-2.5">
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-sm">
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BIRTHDAY SECTION */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight uppercase">
              BIRTHDAY ON 23 OCT 2026
            </h2>
            <p className="text-xs text-slate-500">Institutional Celebrations across Campus</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          {(['TODAY', 'TOMORROW', 'THIS WEEK', 'THIS MONTH', 'NEXT MONTH'] as const).map((tab) => {
            const isActive = birthdayTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setBirthdayTab(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Birthday Celebrants Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBirthdays.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No birthdays scheduled for {birthdayTab.toLowerCase()}.
            </div>
          ) : (
            filteredBirthdays.map((item) => (
              <div
                key={item.id}
                className="p-3.5 border border-slate-200/80 bg-white hover:border-blue-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 flex items-center justify-center text-sm shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{item.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      {item.role === 'Student'
                        ? `${item.grade} - Sec ${item.section}`
                        : `Staff · ${item.department}`}
                    </p>
                    <span className="text-[10px] text-blue-700 font-mono font-medium">
                      🎂 {item.dateString}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSendBirthdayWish(item.id)}
                  disabled={item.wished}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                    item.wished
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs cursor-pointer'
                  }`}
                >
                  {item.wished ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Wished</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Send Wish</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Campus Operations Row: Attendance Snapshot & Live Bus Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Today&apos;s Attendance (23 Oct 2026)</span>
            </h3>
            <button
              onClick={() => onNavigate('STUDENT', 'student-report')}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
            >
              Detailed Report ➔
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <div className="text-xs text-blue-700 font-medium">Students Attendance</div>
              <div className="text-2xl font-black text-blue-900 mt-1 tabular-nums">94.8%</div>
              <p className="text-[11px] text-blue-600 mt-0.5">1,013 / 1,069 Present</p>
              <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '94.8%' }} />
              </div>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">Staff Attendance</div>
              <div className="text-2xl font-black text-emerald-900 mt-1 tabular-nums">97.5%</div>
              <p className="text-[11px] text-emerald-600 mt-0.5">117 / 120 Present (3 on leave)</p>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '97.5%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Live Transport Fleet Status */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-blue-600" />
              <span>Live School Bus Tracking</span>
            </h3>
            <button
              onClick={() => onNavigate('TRANSPORT', 'transport-bus-locations')}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
            >
              All Routes ➔
            </button>
          </div>

          <div className="space-y-3">
            {busRoutes.slice(0, 3).map((bus) => (
              <div
                key={bus.id}
                className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span>{bus.busNo}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        bus.status === 'In Transit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {bus.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{bus.currentLocationName}</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-slate-700 font-semibold">{bus.speedKmh} km/h</div>
                  <p className="text-[10px] text-slate-400">
                    {bus.studentsOnBoard} / {bus.capacity} onboard
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Add New Admission Lead</h3>
            <p className="text-xs text-slate-500 mt-1">Record student admission inquiry for CRM</p>

            <form onSubmit={handleCreateLead} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadParent}
                  onChange={(e) => setNewLeadParent(e.target.value)}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={newLeadStudent}
                  onChange={(e) => setNewLeadStudent(e.target.value)}
                  placeholder="e.g. Aditi Chandra"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="+91 98450 ..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Grade Applying
                  </label>
                  <select
                    value={newLeadGrade}
                    onChange={(e) => setNewLeadGrade(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
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
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 active:bg-blue-800 shadow-xs shadow-blue-600/20 cursor-pointer transition-colors"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
