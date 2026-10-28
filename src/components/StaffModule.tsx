import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  FileText,
  UserCheck,
  Send,
  Plus,
  Printer,
  ChevronRight,
  UserPlus,
  Archive,
  Briefcase,
  GraduationCap,
  Eye,
  Edit,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  Phone,
  Mail,
  Shield,
  Layers,
  BarChart3,
  Download,
  QrCode,
  CreditCard,
  X,
} from 'lucide-react';
import { Staff, LeaveRequest, StaffRole, ArchivedStaffDetails } from '../types';
import { printElement } from '../utils/printDocument';
import { OnboardStaffModal } from './Staff/OnboardStaffModal';
import { ArchiveStaffModal } from './Staff/ArchiveStaffModal';
import { StaffDossierModal } from './Staff/StaffDossierModal';
import { EditStaffModal } from './Staff/EditStaffModal';
import { StaffAnalyticsDashboard } from './Staff/StaffAnalyticsDashboard';
import { StaffQRCodeModal } from './Staff/StaffQRCodeModal';
import { StaffPayrollModule } from './Staff/StaffPayrollModule';
import { StaffLeaveCalendar } from './Staff/StaffLeaveCalendar';

interface StaffModuleProps {
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  subItem?: string;
  onApproveLeave: (id: string, remarks?: string) => void;
  onRejectLeave: (id: string, remarks?: string) => void;
  onApplyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => void;
  onAddStaff: (newStaff: Omit<Staff, 'id'>) => void;
  onUpdateStaff: (updated: Staff) => void;
  onArchiveStaff: (staffId: string, details: ArchivedStaffDetails) => void;
  onRestoreStaff: (staffId: string) => void;
}

export const StaffModule: React.FC<StaffModuleProps> = ({
  staffList,
  leaveRequests,
  subItem = 'staff-info',
  onApproveLeave,
  onRejectLeave,
  onApplyLeave,
  onAddStaff,
  onUpdateStaff,
  onArchiveStaff,
  onRestoreStaff,
}) => {
  const [activeTab, setActiveTab] = useState<
    'info' | 'archived' | 'leave-calendar' | 'leave-request' | 'leave-apply' | 'payroll' | 'report'
  >(() => {
    if (subItem === 'staff-leave-calendar') return 'leave-calendar';
    if (subItem === 'staff-payroll') return 'payroll';
    if (subItem === 'staff-leave-request') return 'leave-request';
    if (subItem === 'staff-leave-apply') return 'leave-apply';
    if (subItem === 'staff-report') return 'report';
    return 'info';
  });

  // Modal States
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [selectedStaffForDossier, setSelectedStaffForDossier] = useState<Staff | null>(null);
  const [selectedStaffForQR, setSelectedStaffForQR] = useState<Staff | null>(null);
  const [selectedStaffForArchive, setSelectedStaffForArchive] = useState<Staff | null>(null);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<Staff | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | StaffRole>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'ALL' | 'Pending' | 'Approved' | 'Rejected'>('Pending');

  // Leave apply form
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id || '');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('Casual Leave');
  const [startDate, setStartDate] = useState('2026-10-24');
  const [endDate, setEndDate] = useState('2026-10-25');
  const [days, setDays] = useState(2);
  const [reason, setReason] = useState('');

  // Active / On Leave staff
  const activeStaff = staffList.filter((s) => s.status !== 'Archived');
  // Archived departing staff
  const archivedStaff = staffList.filter((s) => s.status === 'Archived');

  const filteredStaff = (activeTab === 'archived' ? archivedStaff : activeStaff).filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.empId.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.designation.toLowerCase().includes(q) ||
      (s.subject && s.subject.toLowerCase().includes(q)) ||
      (s.responsibilities && s.responsibilities.some((r) => r.toLowerCase().includes(q)));

    const matchesRole = roleFilter === 'ALL' || s.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || s.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  const handleExportCSV = () => {
    const headers = [
      'Employee ID',
      'Full Name',
      'Role',
      'Designation',
      'Department',
      'Gender',
      'Phone',
      'Email',
      'Qualification',
      'Experience',
      'Joining Date',
      'Employment Type',
      'Assigned Subject',
      'Responsibilities',
      'Leave Balance (Days)',
      'Status',
    ];

    const sourceData = filteredStaff;

    const rows = sourceData.map((s) => [
      s.empId,
      `"${s.name.replace(/"/g, '""')}"`,
      s.role,
      `"${s.designation.replace(/"/g, '""')}"`,
      `"${s.department.replace(/"/g, '""')}"`,
      s.gender || 'Not Specified',
      s.phone,
      s.email,
      `"${s.qualification.replace(/"/g, '""')}"`,
      `"${s.experienceYears ? `${s.experienceYears} Years` : '5+ Years'}"`,
      s.joiningDate,
      s.employmentType,
      `"${(s.subject || 'N/A').replace(/"/g, '""')}"`,
      `"${(s.responsibilities?.join('; ') || 'N/A').replace(/"/g, '""')}"`,
      s.leaveBalance,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `THE_LEADERS_ACADEMY_Staff_Roster_${activeTab === 'archived' ? 'Archived_' : ''}${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintStaffRoster = () => {
    printElement('staff-roster-print-area', {
      title: `THE_LEADERS_ACADEMY_Staff_Roster_${activeTab === 'archived' ? 'Archived_' : ''}${new Date().toISOString().slice(0, 10)}`,
      landscape: true,
    });
  };

  const filteredLeave = leaveRequests.filter((r) => {
    const matchesStatus = leaveStatusFilter === 'ALL' || r.status === leaveStatusFilter;
    const matchesDept = deptFilter === 'ALL' || r.department === deptFilter;
    const matchesSearch =
      r.staffName.toLowerCase().includes(search.toLowerCase()) ||
      r.empId.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesDept && matchesSearch;
  });

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stf = staffList.find((s) => s.id === selectedStaffId);
    if (!stf || !reason) return;

    onApplyLeave({
      staffId: stf.id,
      staffName: stf.name,
      empId: stf.empId,
      department: stf.department,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
    });

    setReason('');
    setActiveTab('leave-request');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Title & Tab Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#43a047]" />
            <span>Faculty & Staff Management System</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Profiles · Onboarding Wizard · Academic Responsibilities · Departing Staff Archiving
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-100/90 rounded-lg text-xs font-medium border border-gray-200/60">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'info'
                  ? 'bg-[#43a047] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Staff ({activeStaff.length})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                activeTab === 'archived'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Archived</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'archived' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'}`}>
                {archivedStaff.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('leave-calendar')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'leave-calendar'
                  ? 'bg-[#f57f17] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'leave-calendar' ? 'text-white' : 'text-[#f57f17]'}`} />
              <span>Leave Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'payroll' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Payroll</span>
            </button>
            <button
              onClick={() => setActiveTab('leave-request')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'leave-request'
                  ? 'bg-amber-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>Leave Requests</span>
              <span className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${activeTab === 'leave-request' ? 'bg-white text-amber-700' : 'bg-[#f57f17] text-white'}`}>
                {leaveRequests.filter((r) => r.status === 'Pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('leave-apply')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'leave-apply'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Leave Apply
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'report'
                  ? 'bg-[#00acc1] text-white shadow-xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'report' ? 'text-white' : 'text-[#00acc1]'}`} />
              <span>Analytics</span>
            </button>
          </div>

          {/* Onboard New Staff Button */}
          <button
            onClick={() => setIsOnboardOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#43a047] hover:bg-[#388e3c] rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Onboard Staff</span>
          </button>
        </div>
      </div>

      {/* Multicolor Faculty KPI Cards for Active Staff */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Staff</span>
              <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">120</div>
              <span className="text-[10px] text-emerald-600 font-semibold">96 Teaching · 24 Admin</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#e8f5e9] flex items-center justify-center text-[#43a047] shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-cyan-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">On Active Duty</span>
              <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">114</div>
              <span className="text-[10px] text-cyan-600 font-semibold">Biometric verified today</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#e0f7fa] flex items-center justify-center text-[#00acc1] shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">On Approved Leave</span>
              <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">6</div>
              <span className="text-[10px] text-amber-600 font-semibold">Substitutes deployed</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#fff8e1] flex items-center justify-center text-[#f57f17] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Monthly Payroll</span>
              <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">₹54.2 L</div>
              <span className="text-[10px] text-purple-600 font-semibold">7th CPC Ledger Ready</span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[#ede7f6] flex items-center justify-center text-[#8e24aa] shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ACTIVE STAFF DIRECTORY OR ARCHIVED RECORDS */}
      {(activeTab === 'info' || activeTab === 'archived') && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          {/* Header Banner for Archived Tab */}
          {activeTab === 'archived' && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-900">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-rose-700 shrink-0" />
                <span>
                  <strong>Departed & Archived Staff Records:</strong> These records preserve complete service tenure, institutional clearance audits, and relieving letters.
                </span>
              </div>
              <span className="font-mono font-bold text-rose-800">{archivedStaff.length} Archived Dossiers</span>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter staff by name, department, or role..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#43a047] focus:bg-white transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200"
                  title="Clear search filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Export to CSV Button */}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs"
                title="Download current staff roster as a formatted CSV file"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Export to CSV</span>
              </button>

              {/* Print Roster Button */}
              <button
                type="button"
                onClick={handlePrintStaffRoster}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs cursor-pointer"
                title="Print current staff roster"
              >
                <Printer className="w-3.5 h-3.5 text-gray-700" />
                <span>Print</span>
              </button>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Roles</option>
                <option value="Teacher">Teachers</option>
                <option value="Administrator">Administrators</option>
                <option value="Support Staff">Support Staff</option>
                <option value="Lab Assistant">Lab Assistants</option>
                <option value="Transport Staff">Transport Fleet</option>
                <option value="Sports Coach">Sports Coaches</option>
                <option value="Counselor">Counselor</option>
              </select>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Languages">Languages</option>
                <option value="Social Science">Social Science</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Administration">Administration</option>
                <option value="Library">Library</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Transport">Transport</option>
              </select>

              {/* View Switcher */}
              <div className="flex p-0.5 bg-gray-100 rounded-lg text-gray-600">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1 rounded ${viewMode === 'table' ? 'bg-white text-gray-900 shadow-2xs' : 'hover:text-gray-900'}`}
                  title="Table View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1 rounded ${viewMode === 'cards' ? 'bg-white text-gray-900 shadow-2xs' : 'hover:text-gray-900'}`}
                  title="Card Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Counter Pill */}
          {(search || roleFilter !== 'ALL' || deptFilter !== 'ALL') && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
              <span className="font-semibold">Showing {filteredStaff.length} matching staff records</span>
              <button
                onClick={() => {
                  setSearch('');
                  setRoleFilter('ALL');
                  setDeptFilter('ALL');
                }}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* TABLE VIEW */}
          {viewMode === 'table' && (
            <div id="staff-roster-print-area" className="overflow-x-auto border border-gray-100 rounded-xl bg-white p-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Emp ID</th>
                    <th className="px-4 py-3">Staff Member & Role</th>
                    <th className="px-4 py-3">Designation & Department</th>
                    <th className="px-4 py-3">Assigned Subjects / Portfolios</th>
                    <th className="px-4 py-3">Contact Coordinates</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-gray-500">
                        No staff records found matching the query.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((stf) => (
                      <tr
                        key={stf.id}
                        className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedStaffForDossier(stf)}
                      >
                        <td className="px-4 py-3 font-mono font-medium text-gray-700">
                          {stf.empId}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{stf.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-gray-100 text-gray-700 font-medium rounded text-[10px]">
                              {stf.role}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Joined {stf.joiningDate}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{stf.designation}</div>
                          <span className="text-[11px] text-gray-500">Dept of {stf.department}</span>
                        </td>
                        <td className="px-4 py-3">
                          {stf.subject && (
                            <div className="font-semibold text-indigo-700">
                              {stf.subject}
                            </div>
                          )}
                          <div className="text-[10px] text-gray-600 truncate max-w-xs">
                            {stf.responsibilities && stf.responsibilities.length > 0
                              ? stf.responsibilities.slice(0, 2).join(' · ')
                              : 'General duties'}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-600">
                          <div>{stf.phone}</div>
                          <div className="text-[10px] text-gray-400">{stf.email}</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stf.status === 'Archived'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : stf.status === 'On Leave'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {stf.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setSelectedStaffForQR(stf)}
                              className="p-1 text-pink-600 hover:bg-pink-50 rounded transition-colors"
                              title="Digital ID QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedStaffForDossier(stf)}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-semibold inline-flex items-center gap-1"
                              title="View Full Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>

                            {stf.status !== 'Archived' ? (
                              <>
                                <button
                                  onClick={() => setSelectedStaffForEdit(stf)}
                                  className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
                                  title="Edit Profile"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setSelectedStaffForArchive(stf)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Archive / Depart"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onRestoreStaff(stf.id)}
                                className="px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 rounded font-semibold flex items-center gap-1"
                                title="Restore staff"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* CARD GRID VIEW */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((stf) => (
                <div
                  key={stf.id}
                  onClick={() => setSelectedStaffForDossier(stf)}
                  className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all bg-white cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center font-serif text-sm">
                          {stf.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{stf.name}</h4>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {stf.empId} · {stf.role}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          stf.status === 'Archived'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {stf.status}
                      </span>
                    </div>

                    <div className="text-xs">
                      <div className="font-semibold text-gray-800">{stf.designation}</div>
                      <div className="text-gray-500 text-[11px]">Dept: {stf.department}</div>
                    </div>

                    {stf.subject && (
                      <div className="text-xs text-indigo-700 font-medium">
                        Subject: <strong>{stf.subject}</strong>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase text-gray-400">
                        Responsibilities:
                      </span>
                      <div className="space-y-0.5">
                        {stf.responsibilities && stf.responsibilities.slice(0, 2).map((r, i) => (
                          <div key={i} className="text-[11px] text-gray-600 truncate flex items-center gap-1">
                            <span className="text-emerald-600">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono text-[11px]">{stf.phone}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffForQR(stf);
                        }}
                        className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-0.5"
                        title="Digital ID QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffForDossier(stf);
                        }}
                        className="text-xs font-semibold text-[#43a047] hover:underline flex items-center gap-0.5"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: STAFF LEAVE REQUESTS */}
      {activeTab === 'leave-request' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Staff Leave Approval Management ({leaveRequests.length} Total Requests)
              </h3>
              <p className="text-xs text-gray-500">
                Review and approve teacher and staff leave applications with sub-arrangement notes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex p-0.5 bg-gray-100 rounded-md text-xs font-medium">
                {(['ALL', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeaveStatusFilter(st)}
                    className={`px-3 py-1 rounded transition-colors ${
                      leaveStatusFilter === st
                        ? 'bg-white text-gray-900 font-bold shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredLeave.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No leave requests found for the selected filter.
              </div>
            ) : (
              filteredLeave.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-gray-900">{req.staffName}</span>
                      <span className="text-xs text-gray-500 font-mono">({req.empId})</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {req.department}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800'
                            : req.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3">
                      <span className="font-semibold text-gray-800">
                        Type: {req.leaveType}
                      </span>
                      <span>·</span>
                      <span className="font-mono">
                        {req.startDate} to {req.endDate} ({req.days} days)
                      </span>
                      <span>·</span>
                      <span className="text-gray-400">Applied: {req.appliedDate}</span>
                    </div>

                    <p className="text-xs text-gray-700 bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 italic">
                      &quot;{req.reason}&quot;
                    </p>

                    {req.remarks && (
                      <p className="text-[11px] text-gray-500">
                        <strong>Principal Remarks:</strong> {req.remarks}
                      </p>
                    )}
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => onRejectLeave(req.id, 'Substitute arrangement unavailable for critical CBSE periods')}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => onApproveLeave(req.id, 'Approved as requested by Principal')}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Leave</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW: STAFF LEAVE APPLY */}
      {activeTab === 'leave-apply' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-2xl mx-auto">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h3 className="text-base font-bold text-gray-900">Staff Leave Application Form</h3>
            <p className="text-xs text-gray-500">Submit leave request for approval by Principal Office</p>
          </div>

          <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Select Staff Member *
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none"
              >
                {activeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.empId}) - {s.designation} · Bal: {s.leaveBalance} days
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Leave Type *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none"
                >
                  <option value="Casual Leave">Casual Leave (CL)</option>
                  <option value="Sick Leave">Sick Leave (SL)</option>
                  <option value="Earned Leave">Earned Leave (EL)</option>
                  <option value="Special Leave">Special Leave / Duty</option>
                  <option value="Maternity/Paternity">Maternity/Paternity</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Number of Days *</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Reason & Substitute Arrangement *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mention detailed reason and substitute teacher assigned for your periods..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#43a047] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-[#43a047] hover:bg-[#388e3c] rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Leave Application</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: LEAVE CALENDAR */}
      {activeTab === 'leave-calendar' && (
        <StaffLeaveCalendar staffList={staffList} leaveRequests={leaveRequests} />
      )}

      {/* VIEW: PAYROLL & DIGITAL PAYSLIPS */}
      {activeTab === 'payroll' && (
        <StaffPayrollModule staffList={staffList} leaveRequests={leaveRequests} />
      )}

      {/* VIEW: DEPARTMENT ANALYTICS & VISUALIZATION DASHBOARD */}
      {activeTab === 'report' && (
        <StaffAnalyticsDashboard staffList={staffList} leaveRequests={leaveRequests} />
      )}

      {/* Digital Staff ID Card & QR Authentication Modal */}
      <StaffQRCodeModal
        staff={selectedStaffForQR}
        isOpen={!!selectedStaffForQR}
        onClose={() => setSelectedStaffForQR(null)}
      />

      {/* Onboard New Staff Modal */}
      <OnboardStaffModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        onAddStaff={onAddStaff}
      />

      {/* Staff 360 Dossier Modal */}
      <StaffDossierModal
        staff={selectedStaffForDossier}
        isOpen={!!selectedStaffForDossier}
        onClose={() => setSelectedStaffForDossier(null)}
        onEdit={(stf) => setSelectedStaffForEdit(stf)}
        onArchive={(stf) => setSelectedStaffForArchive(stf)}
        onRestore={onRestoreStaff}
        onOpenQR={(stf) => setSelectedStaffForQR(stf)}
      />

      {/* Edit Staff Profile Modal */}
      <EditStaffModal
        staff={selectedStaffForEdit}
        isOpen={!!selectedStaffForEdit}
        onClose={() => setSelectedStaffForEdit(null)}
        onUpdateStaff={onUpdateStaff}
      />

      {/* Archive Departing Staff Modal */}
      <ArchiveStaffModal
        staff={selectedStaffForArchive}
        isOpen={!!selectedStaffForArchive}
        onClose={() => setSelectedStaffForArchive(null)}
        onArchiveConfirm={onArchiveStaff}
      />
    </div>
  );
};
