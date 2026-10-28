import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  Printer,
  X,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Staff, LeaveRequest } from '../../types';
import { printElement } from '../../utils/printDocument';

interface StaffLeaveCalendarProps {
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
}

interface CalendarDayData {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  leaves: (LeaveRequest & { staffDetails?: Staff })[];
  hasCoverageWarning: boolean;
  warningDept?: string;
}

export const StaffLeaveCalendar: React.FC<StaffLeaveCalendarProps> = ({
  staffList,
  leaveRequests,
}) => {
  // Fixed anchor at October 2026 as per application timeline
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [substituteAssignments, setSubstituteAssignments] = useState<Record<string, string>>({
    'LR-101': 'Dr. Rajesh Sharma (Physics)',
    'LR-102': 'Ms. Ananya Roy (Chemistry)',
  });

  // Approved leave requests joined with staff details
  const approvedLeaves = useMemo(() => {
    return leaveRequests
      .filter((r) => r.status === 'Approved')
      .map((r) => {
        const staffDetails = staffList.find((s) => s.id === r.staffId || s.empId === r.empId);
        return {
          ...r,
          staffDetails,
        };
      });
  }, [leaveRequests, staffList]);

  // Calendar month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 23)); // October 23, 2026
  };

  // Helper to check if a target date falls between start and end (inclusive)
  const isDateInLeaveRange = (targetDateStr: string, startDateStr: string, endDateStr: string) => {
    return targetDateStr >= startDateStr && targetDateStr <= endDateStr;
  };

  // Generate 35 or 42 grid cells for the month
  const calendarDays: CalendarDayData[] = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: CalendarDayData[] = [];

    // Preceding month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: prevDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        leaves: [],
        hasCoverageWarning: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = year === 2026 && month === 9 && d === 23;

      // Find all approved leaves covering this date
      const matchingLeaves = approvedLeaves.filter((r) => {
        const matchesDate = isDateInLeaveRange(dateStr, r.startDate, r.endDate);
        const matchesDept = selectedDept === 'ALL' || r.department === selectedDept;
        return matchesDate && matchesDept;
      });

      // Check coverage warning (e.g. 2 or more teachers from the same department on the same day)
      const deptCounts: Record<string, number> = {};
      matchingLeaves.forEach((l) => {
        deptCounts[l.department] = (deptCounts[l.department] || 0) + 1;
      });

      let hasCoverageWarning = false;
      let warningDept: string | undefined = undefined;

      Object.entries(deptCounts).forEach(([dept, count]) => {
        if (count >= 2) {
          hasCoverageWarning = true;
          warningDept = dept;
        }
      });

      days.push({
        date: thisDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        leaves: matchingLeaves,
        hasCoverageWarning,
        warningDept,
      });
    }

    // Trailing month filler days to complete 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: nextDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
        leaves: [],
        hasCoverageWarning: false,
      });
    }

    return days;
  }, [year, month, approvedLeaves, selectedDept]);

  // Aggregate monthly statistics
  const monthStats = useMemo(() => {
    const currentMonthLeaves = approvedLeaves.filter((l) => {
      const lMonth = new Date(l.startDate).getMonth();
      const lYear = new Date(l.startDate).getFullYear();
      return lMonth === month && lYear === year;
    });

    const totalDaysAbsent = currentMonthLeaves.reduce((acc, l) => acc + l.days, 0);
    const uniqueStaffAbsent = new Set(currentMonthLeaves.map((l) => l.staffId)).size;

    return {
      totalRequests: currentMonthLeaves.length,
      totalDaysAbsent,
      uniqueStaffAbsent,
    };
  }, [approvedLeaves, month, year]);

  const getLeaveTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'Sick Leave':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Casual Leave':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Earned Leave':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Duty / Official Leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const handleAssignSubstitute = (leaveId: string, substituteName: string) => {
    setSubstituteAssignments((prev) => ({
      ...prev,
      [leaveId]: substituteName,
    }));
  };

  return (
    <div id="staff-leave-calendar-print-area" className="space-y-6">
      {/* Top Banner & Calendar Controls */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f57f17] text-white flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Workforce Leave & Academic Coverage Calendar
              </h3>
              <p className="text-xs text-gray-500">
                Visual monthly schedule of approved leaves · Daily staffing & substitute allocation
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="Science">Science (Physics / Chem)</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Languages">Languages (English / Hindi)</option>
              <option value="Social Science">Social Science</option>
              <option value="Administration">Administration</option>
              <option value="Library">Library</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded transition-colors text-gray-600 hover:text-gray-900"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-gray-800 min-w-[120px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded transition-colors text-gray-600 hover:text-gray-900"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Today (Oct 23)
          </button>

          <button
            type="button"
            onClick={() =>
              printElement('staff-leave-calendar-print-area', {
                title: 'Faculty_Leave_Calendar_THE_LEADERS_ACADEMY',
                landscape: true,
              })
            }
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-200 shadow-2xs"
            title="Print calendar schedule"
          >
            <Printer className="w-3.5 h-3.5 text-gray-700" />
            <span>Print Calendar</span>
          </button>
        </div>
      </div>

      {/* Month Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Approved Leaves</span>
            <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">
              {monthStats.totalRequests}
            </div>
            <span className="text-[11px] text-gray-500">Scheduled for {monthNames[month]}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Faculty On Leave</span>
            <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">
              {monthStats.uniqueStaffAbsent}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">Distinct staff members</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Cumulative Days Out</span>
            <div className="text-2xl font-black text-purple-700 mt-1 tabular-nums">
              {monthStats.totalDaysAbsent}d
            </div>
            <span className="text-[11px] text-purple-600">Total faculty man-days</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Substitute Coverage</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
              100%
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">Zero classroom disruptions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 bg-gray-50/90 border-b border-gray-200 text-center font-bold text-xs text-gray-600 py-3">
          <div className="text-rose-600">SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div className="text-blue-600">SAT</div>
        </div>

        {/* 7-column month grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 text-xs">
          {calendarDays.map((cell, idx) => {
            const hasLeaves = cell.leaves.length > 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(cell)}
                className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                  !cell.isCurrentMonth
                    ? 'bg-gray-50/40 text-gray-300'
                    : cell.isToday
                    ? 'bg-blue-50/40 hover:bg-blue-50/80'
                    : 'bg-white hover:bg-gray-50/80'
                }`}
              >
                {/* Date header inside cell */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      cell.isToday
                        ? 'bg-blue-600 text-white font-black shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-gray-800'
                        : 'text-gray-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Coverage Warning Tag */}
                  {cell.hasCoverageWarning && (
                    <span
                      title={`Coverage warning: 2+ teachers on leave in ${cell.warningDept}`}
                      className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5"
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                      <span>{cell.warningDept}</span>
                    </span>
                  )}
                </div>

                {/* Leaves Chips on this day */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {cell.leaves.slice(0, 2).map((l) => (
                    <div
                      key={l.id}
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-medium truncate flex items-center justify-between ${getLeaveTypeBadgeColor(
                        l.leaveType
                      )}`}
                      title={`${l.staffName} (${l.department}) - ${l.leaveType}`}
                    >
                      <span className="truncate">{l.staffName}</span>
                      <span className="text-[9px] font-mono opacity-80 shrink-0 ml-1">
                        {l.leaveType.split(' ')[0]}
                      </span>
                    </div>
                  ))}

                  {cell.leaves.length > 2 && (
                    <div className="text-[10px] font-bold text-gray-500 pl-1">
                      +{cell.leaves.length - 2} more on leave
                    </div>
                  )}

                  {!hasLeaves && cell.isCurrentMonth && (
                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400">
                      Full Attendance
                    </div>
                  )}
                </div>

                {/* Bottom indicators */}
                {hasLeaves && (
                  <div className="pt-1 mt-1 border-t border-gray-100 text-[10px] text-gray-500 flex items-center justify-between">
                    <span>{cell.leaves.length} absent</span>
                    <span className="text-emerald-600 font-semibold">Covered</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Drilldown / Substitute Planning Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f57f17] flex items-center justify-center text-white">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    Workforce Planning & Substitute Roster: {selectedDay.dateStr}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Day #{selectedDay.dayNumber} · {selectedDay.leaves.length} Staff On Approved Leave
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {selectedDay.hasCoverageWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Department Staffing Alert:</strong> 2 or more faculty from the{' '}
                    <span className="font-bold underline">{selectedDay.warningDept}</span> department
                    are absent today. Ensure laboratory and board exam preparation periods have proxy
                    educators assigned.
                  </div>
                </div>
              )}

              {selectedDay.leaves.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-gray-800">100% Full Academic Attendance</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    No approved faculty or administrative leaves scheduled for this date. All instructional periods proceed normally.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Staff Absent & Proxy Coverage Ledger
                  </h4>

                  {selectedDay.leaves.map((leave) => {
                    const substitute = substituteAssignments[leave.id] || 'Dr. Rajesh Sharma (PGT)';

                    return (
                      <div
                        key={leave.id}
                        className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{leave.staffName}</div>
                            <div className="text-[11px] text-gray-500">
                              {leave.empId} · {leave.department} · {leave.staffDetails?.designation || 'Faculty'}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLeaveTypeBadgeColor(
                              leave.leaveType
                            )}`}
                          >
                            {leave.leaveType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-gray-100">
                          <div>
                            <span className="text-gray-400 block">Leave Duration:</span>
                            <span className="font-semibold text-gray-800">
                              {leave.startDate} to {leave.endDate} ({leave.days} days)
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">Contact Phone:</span>
                            <span className="font-semibold text-gray-800">
                              {leave.staffDetails?.phone || '+91 98410 23411'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 block">Official Reason:</span>
                            <span className="text-gray-700 italic">&ldquo;{leave.reason}&rdquo;</span>
                          </div>
                        </div>

                        {/* Substitute Coverage Assignment */}
                        <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <span>Substitute Faculty:</span>
                            <span className="font-bold underline">{substitute}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <select
                              value={substitute}
                              onChange={(e) => handleAssignSubstitute(leave.id, e.target.value)}
                              className="px-2 py-1 text-[11px] bg-white border border-gray-300 rounded focus:outline-none"
                            >
                              <option value="Dr. Rajesh Sharma (Physics)">Dr. Rajesh Sharma (Physics)</option>
                              <option value="Ms. Ananya Roy (Chemistry)">Ms. Ananya Roy (Chemistry)</option>
                              <option value="Mr. Vikram Malhotra (Math)">Mr. Vikram Malhotra (Math)</option>
                              <option value="Ms. Deepa Sen (English)">Ms. Deepa Sen (English)</option>
                            </select>
                            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                              Assigned
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Staff Roster Sync Active
              </span>
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Close Planner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
