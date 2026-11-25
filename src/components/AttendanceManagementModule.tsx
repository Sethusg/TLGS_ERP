import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  UserCheck,
  UserX,
  Clock,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { Student, Staff } from '../types';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  TableColumn,
} from './Common/EnterpriseUI';

interface AttendanceManagementModuleProps {
  subItem?: string;
  students: Student[];
  staffList: Staff[];
  contextLabel: string;
  onOpenQRScanner: () => void;
}

type AttendanceMark = 'Present' | 'Absent' | 'Late';

const BIOMETRIC_LOGS = [
  { id: 'bio-1', time: '08:04 AM', person: 'Dr. Rajesh Sharma', role: 'Staff', gate: 'Main Academic Gate', mode: 'Biometric RFID', status: 'Checked In' },
  { id: 'bio-2', time: '08:11 AM', person: 'Aarav Subramanian', role: 'Student · 10-A', gate: 'North Bus Bay', mode: 'QR Smart Card', status: 'Checked In' },
  { id: 'bio-3', time: '08:16 AM', person: 'Diya Krishnan', role: 'Student · 10-A', gate: 'Main Academic Gate', mode: 'QR Smart Card', status: 'Checked In' },
  { id: 'bio-4', time: '08:22 AM', person: 'Prof. Malini Sundaram', role: 'Staff', gate: 'Faculty Lobby', mode: 'Biometric RFID', status: 'Checked In' },
  { id: 'bio-5', time: '08:41 AM', person: 'Rohan Iyer', role: 'Student · 9-B', gate: 'Main Academic Gate', mode: 'QR Smart Card', status: 'Late Entry' },
];

export const AttendanceManagementModule: React.FC<AttendanceManagementModuleProps> = ({
  subItem,
  students,
  staffList,
  contextLabel,
  onOpenQRScanner,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'att-student-daily');
  const [selectedDate, setSelectedDate] = useState('2026-10-23');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [savedNotice, setSavedNotice] = useState(false);

  const [studentMarks, setStudentMarks] = useState<Record<string, AttendanceMark>>(() => {
    const initial: Record<string, AttendanceMark> = {};
    students.forEach((s, idx) => {
      initial[s.id] = idx % 11 === 0 ? 'Absent' : idx % 9 === 0 ? 'Late' : 'Present';
    });
    return initial;
  });

  const [staffMarks, setStaffMarks] = useState<Record<string, AttendanceMark>>(() => {
    const initial: Record<string, AttendanceMark> = {};
    staffList.forEach((st) => {
      initial[st.id] = st.status === 'On Leave' ? 'Absent' : 'Present';
    });
    return initial;
  });

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      selectedGrade === 'ALL'
        ? students
        : students.filter((s) => s.grade === selectedGrade),
    [students, selectedGrade]
  );

  const presentCount = filteredStudents.filter(
    (s) => (studentMarks[s.id] || 'Present') === 'Present'
  ).length;
  const lateCount = filteredStudents.filter(
    (s) => studentMarks[s.id] === 'Late'
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => studentMarks[s.id] === 'Absent'
  ).length;
  const attendancePct =
    filteredStudents.length > 0
      ? (((presentCount + lateCount) / filteredStudents.length) * 100).toFixed(1)
      : '0.0';

  const handleMarkAllPresent = () => {
    const next = { ...studentMarks };
    filteredStudents.forEach((s) => {
      next[s.id] = 'Present';
    });
    setStudentMarks(next);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleSaveRegister = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const studentColumns: TableColumn<Student>[] = [
    {
      key: 'roll',
      header: 'Roll / Adm',
      render: (s) => (
        <span className="font-mono text-slate-600">
          {s.rollNo} · {s.admissionNo}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Student Name',
      sortable: true,
      sortValue: (s) => s.name,
      render: (s) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{s.name}</p>
          <p className="text-[11px] text-slate-500">
            {s.grade} · Section {s.section}
          </p>
        </div>
      ),
    },
    {
      key: 'termRate',
      header: 'Term Avg',
      align: 'right',
      sortable: true,
      sortValue: (s) => s.attendancePercent,
      render: (s) => (
        <span
          className={`font-mono font-semibold ${
            s.attendancePercent < 85 ? 'text-rose-600' : 'text-slate-700'
          }`}
        >
          {s.attendancePercent}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Daily Mark',
      align: 'right',
      render: (s) => {
        const mark = studentMarks[s.id] || 'Present';
        return (
          <div className="inline-flex items-center gap-1">
            {(['Present', 'Late', 'Absent'] as AttendanceMark[]).map((opt) => {
              const active = mark === opt;
              const style =
                opt === 'Present'
                  ? active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400'
                  : opt === 'Late'
                  ? active
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                  : active
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400';

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    setStudentMarks((prev) => ({ ...prev, [s.id]: opt }))
                  }
                  className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${style}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      },
    },
  ];

  const staffColumns: TableColumn<Staff>[] = [
    {
      key: 'empId',
      header: 'Emp ID',
      render: (st) => <span className="font-mono text-slate-600">{st.empId}</span>,
    },
    {
      key: 'name',
      header: 'Faculty / Staff',
      sortable: true,
      sortValue: (st) => st.name,
      render: (st) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{st.name}</p>
          <p className="text-[11px] text-slate-500">
            {st.designation} · {st.department}
          </p>
        </div>
      ),
    },
    {
      key: 'mark',
      header: 'Daily Register',
      align: 'right',
      render: (st) => {
        const mark = staffMarks[st.id] || 'Present';
        return (
          <div className="inline-flex items-center gap-1">
            {(['Present', 'Late', 'Absent'] as AttendanceMark[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setStaffMarks((prev) => ({ ...prev, [st.id]: opt }))
                }
                className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                  mark === opt
                    ? opt === 'Present'
                      ? 'bg-[#0B1F3A] text-[#D4AF37] border-[#0B1F3A]'
                      : opt === 'Late'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#0B1F3A]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${contextLabel} · Sample Preview Register`}
        title="Attendance Management"
        subtitle="Record daily student and staff roll calls, inspect biometric/QR gate punches, and monitor attendance thresholds."
        tabs={[
          { id: 'att-student-daily', label: 'Student Attendance' },
          { id: 'att-staff-daily', label: 'Staff Attendance' },
          { id: 'att-biometric', label: 'Biometric & QR Logs' },
          { id: 'att-summary', label: 'Attendance Summary' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <button
              type="button"
              onClick={onOpenQRScanner}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>QR Roll Scan</span>
            </button>
            <button
              type="button"
              onClick={handleSaveRegister}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{savedNotice ? 'Register Saved' : 'Save Register'}</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Attendance Rate"
          value={`${attendancePct}%`}
          detail={`Session Date: ${selectedDate}`}
          icon={CalendarCheck}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Present Today"
          value={presentCount}
          detail={`Of ${filteredStudents.length} filtered students`}
          icon={UserCheck}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Late Arrivals"
          value={lateCount}
          detail="Flagged after 08:30 AM bell"
          icon={Clock}
          tone="amber"
        />
        <EnterpriseMetricCard
          label="Absent Today"
          value={absentCount}
          detail="Parent SMS alerts queued"
          icon={UserX}
          tone="rose"
        />
      </div>

      {activeTab === 'att-student-daily' && (
        <EnterpriseDataTable
          title="Daily Student Attendance Register"
          subtitle="Click Present, Late, or Absent on any row to update live totals."
          columns={studentColumns}
          data={filteredStudents}
          rowKey={(s) => s.id}
          searchPlaceholder="Search student name or roll no..."
          searchFilter={(s, q) =>
            s.name.toLowerCase().includes(q) ||
            s.admissionNo.toLowerCase().includes(q) ||
            s.rollNo.toLowerCase().includes(q)
          }
          toolbarRight={
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg font-mono"
              />
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg font-semibold text-[#0B1F3A] cursor-pointer"
              >
                <option value="ALL">All Classes</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 text-xs font-semibold bg-[#D4AF37]/20 text-[#0B1F3A] hover:bg-[#D4AF37]/30 border border-[#D4AF37]/50 rounded-lg cursor-pointer"
              >
                Mark All Present
              </button>
            </div>
          }
        />
      )}

      {activeTab === 'att-staff-daily' && (
        <EnterpriseDataTable
          title="Daily Staff Attendance Register"
          subtitle="Track teaching and non-teaching staff attendance for payroll sync."
          columns={staffColumns}
          data={staffList}
          rowKey={(st) => st.id}
          searchPlaceholder="Search staff or department..."
          searchFilter={(st, q) =>
            st.name.toLowerCase().includes(q) ||
            st.department.toLowerCase().includes(q) ||
            st.empId.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'att-biometric' && (
        <EnterpriseDataTable
          title="Biometric & Smart QR Gate Punches"
          subtitle="Sample live punch telemetry from campus entry terminals."
          columns={[
            { key: 'time', header: 'Timestamp', render: (r) => <span className="font-mono font-semibold text-[#0B1F3A]">{r.time}</span> },
            { key: 'person', header: 'Name', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.person}</span> },
            { key: 'role', header: 'Category', render: (r) => <span className="text-slate-600">{r.role}</span> },
            { key: 'gate', header: 'Terminal / Gate', render: (r) => <span className="text-slate-600">{r.gate}</span> },
            { key: 'mode', header: 'Mode', render: (r) => <span className="font-mono text-xs text-slate-600">{r.mode}</span> },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              render: (r) => (
                <span className={r.status === 'Late Entry' ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {r.status}
                </span>
              ),
            },
          ]}
          data={BIOMETRIC_LOGS}
          rowKey={(r) => r.id}
        />
      )}

      {activeTab === 'att-summary' && (
        <EnterpriseDataTable
          title="Low Attendance Watchlist (< 90%)"
          subtitle="Students requiring academic counselor follow-up and parent communication."
          columns={[
            { key: 'adm', header: 'Admission No', render: (s) => <span className="font-mono">{s.admissionNo}</span> },
            { key: 'name', header: 'Student', render: (s) => <span className="font-semibold text-[#0B1F3A]">{s.name}</span> },
            { key: 'grade', header: 'Class', render: (s) => <span>{s.grade} · {s.section}</span> },
            { key: 'phone', header: 'Parent Contact', render: (s) => <span className="font-mono text-slate-600">{s.phone}</span> },
            {
              key: 'pct',
              header: 'Attendance %',
              align: 'right',
              render: (s) => <span className="font-mono font-bold text-rose-600">{s.attendancePercent}%</span>,
            },
          ]}
          data={students.filter((s) => s.attendancePercent < 92)}
          rowKey={(s) => s.id}
          emptyMessage="All enrolled students are above the 92% attendance threshold."
        />
      )}
    </div>
  );
};
