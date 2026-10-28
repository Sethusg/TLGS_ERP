import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  UserPlus,
  FileDown,
  Printer,
  ChevronRight,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  X,
  CheckSquare,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Student } from '../types';
import { printElement } from '../utils/printDocument';

interface StudentModuleProps {
  students: Student[];
  subItem?: string;
  onSelectStudent: (student: Student) => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
}

export const StudentModule: React.FC<StudentModuleProps> = ({
  students,
  subItem = 'student-user-details',
  onSelectStudent,
  onAddStudent,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'report' | 'bulk' | 'attendance' | 'add'>(
    subItem === 'student-report'
      ? 'report'
      : subItem === 'student-bulk-update'
      ? 'bulk'
      : subItem === 'student-attendance'
      ? 'attendance'
      : 'details'
  );

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [feeFilter, setFeeFilter] = useState('ALL');

  // Bulk Attendance States
  const [attGrade, setAttGrade] = useState('Class 10');
  const [attSection, setAttSection] = useState('A');
  const [attDate, setAttDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Students in selected attendance class/section
  const attendanceStudents = students.filter(
    (s) => s.grade === attGrade && s.section === attSection
  );

  // Initialize attendance map when grade/section changes or tab switches
  useEffect(() => {
    const initial: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'> = {};
    attendanceStudents.forEach((s) => {
      initial[s.id] = attendanceMap[s.id] || 'Present';
    });
    setAttendanceMap(initial);
  }, [attGrade, attSection, students]);

  const handleSetAllStatus = (status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    const updated: Record<string, 'Present' | 'Absent' | 'Late' | 'Leave'> = {};
    attendanceStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Leave') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleConfirmAttendance = () => {
    setShowConfirmModal(false);
    setSuccessMessage(
      `Successfully recorded attendance for ${attendanceStudents.length} students of ${attGrade} - Section ${attSection} on ${attDate}!`
    );
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Add Student State
  const [newName, setNewName] = useState('');
  const [newAdmissionNo, setNewAdmissionNo] = useState(`TLA-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newRollNo, setNewRollNo] = useState('10A-25');
  const [newGrade, setNewGrade] = useState('Class 10');
  const [newSection, setNewSection] = useState('A');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [newDob, setNewDob] = useState('2011-05-15');
  const [newFather, setNewFather] = useState('');
  const [newMother, setNewMother] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newBlood, setNewBlood] = useState('O+');
  const [newBusRoute, setNewBusRoute] = useState('Route 1 (Marathahalli)');

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(search.toLowerCase());

    const matchesGrade = gradeFilter === 'ALL' || s.grade.includes(gradeFilter);
    const matchesFee = feeFilter === 'ALL' || s.feeStatus === feeFilter;

    return matchesSearch && matchesGrade && matchesFee;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newAdmissionNo || !newFather || !newPhone) return;

    onAddStudent({
      admissionNo: newAdmissionNo,
      rollNo: newRollNo,
      name: newName,
      grade: newGrade,
      section: newSection,
      gender: newGender,
      dob: newDob,
      fatherName: newFather,
      motherName: newMother,
      phone: newPhone,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@student.leadersacademy.edu.in`,
      address: newAddress || 'Bengaluru, Karnataka',
      bloodGroup: newBlood,
      busRoute: newBusRoute,
      feeStatus: 'Paid',
      dueAmount: 0,
      attendancePercent: 100,
    });

    setNewName('');
    setNewFather('');
    setNewPhone('');
    setActiveTab('details');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Module Title & Tab Controls */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#00acc1]" />
            <span>Student Management & Attendance Portal</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            1,069 Enrolled Students · Bulk Attendance Marking · Academic Year 2026 - 2027
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex p-1 bg-gray-100/90 rounded-lg text-xs font-medium border border-gray-200/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'details' ? 'bg-[#00acc1] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${
                activeTab === 'attendance' ? 'bg-[#00acc1] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Bulk Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'report' ? 'bg-[#00acc1] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Students Report
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'bulk' ? 'bg-[#00acc1] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulk Update
            </button>
          </div>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-2xs shrink-0 ${
              activeTab === 'add' ? 'bg-[#d81b60] text-white' : 'bg-[#e91e63] hover:bg-[#d81b60] text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* VIEW: USER DETAILS */}
      {activeTab === 'details' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-cyan-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Total Enrolled</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">1,069</div>
                <span className="text-[10px] text-emerald-600 font-semibold">Active CBSE Students</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e0f7fa] flex items-center justify-center text-[#00acc1] shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Today's Attendance</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">96.4%</div>
                <span className="text-[10px] text-emerald-600 font-semibold">1,031 Checked-In</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e8f5e9] flex items-center justify-center text-[#43a047] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Transport Commuters</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">782</div>
                <span className="text-[10px] text-amber-600 font-semibold">12 GPS Bus Routes</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#fff8e1] flex items-center justify-center text-[#f57f17] shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-700">Fee Clearance</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">98.2%</div>
                <span className="text-[10px] text-rose-500 font-semibold">{students.filter(s => s.feeStatus !== 'Paid').length} Overdue Accounts</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#fce4ec] flex items-center justify-center text-[#e91e63] shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, adm no, roll..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#00acc1] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="ALL">All Grades</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                </select>

                <select
                  value={feeFilter}
                  onChange={(e) => setFeeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                >
                  <option value="ALL">All Fee Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial Due</option>
                  <option value="Pending">Pending Dues</option>
                </select>

                <button
                  type="button"
                  onClick={() =>
                    printElement('student-roster-print-area', {
                      title: 'THE_LEADERS_ACADEMY_Student_Directory',
                      landscape: true,
                    })
                  }
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-gray-700" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div id="student-roster-print-area" className="overflow-x-auto border border-gray-100 rounded-xl bg-white p-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/90 text-gray-600 border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Adm No / Roll</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Class & Sec</th>
                    <th className="px-4 py-3">Parent Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Attendance</th>
                    <th className="px-4 py-3">Fee Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-gray-500">
                        No student records matched your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((std) => (
                      <tr
                        key={std.id}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                        onClick={() => onSelectStudent(std)}
                      >
                        <td className="px-4 py-3 font-mono text-gray-700 font-medium">
                          <div>{std.admissionNo}</div>
                          <span className="text-[10px] text-gray-400">Roll: {std.rollNo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-900">{std.name}</div>
                          <div className="text-[10px] text-gray-500">
                            {std.gender} · Blood: {std.bloodGroup}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {std.grade} - {std.section}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{std.fatherName}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{std.phone}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-gray-800 tabular-nums">
                            {std.attendancePercent}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              std.feeStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700'
                                : std.feeStatus === 'Partial'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {std.feeStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectStudent(std);
                            }}
                            className="px-2.5 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded-md font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW: BULK ATTENDANCE COMPONENT */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#00acc1]" />
                <span>Class Bulk Attendance Marking Dashboard</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Mark attendance for an entire class at once. Supports <strong>Present</strong>, <strong>Absent</strong>, <strong>Late</strong>, and <strong>Leave</strong> statuses.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Class / Grade</label>
                <select
                  value={attGrade}
                  onChange={(e) => setAttGrade(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-semibold focus:outline-none"
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 8">Class 8</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Section</label>
                <select
                  value={attSection}
                  onChange={(e) => setAttSection(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-semibold focus:outline-none"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Attendance Date</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => setAttDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Status Setter Toolbar */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs font-bold text-gray-800">
              Quick Set All Students in {attGrade} - Section {attSection}:
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetAllStatus('Present')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-2xs cursor-pointer"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleSetAllStatus('Absent')}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md shadow-2xs cursor-pointer"
              >
                All Absent
              </button>
              <button
                type="button"
                onClick={() => handleSetAllStatus('Late')}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-md shadow-2xs cursor-pointer"
              >
                All Late
              </button>
              <button
                type="button"
                onClick={() => handleSetAllStatus('Leave')}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md shadow-2xs cursor-pointer"
              >
                All Leave
              </button>
            </div>
          </div>

          {/* Student Attendance List Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Attendance Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500 text-xs">
                      No students found for {attGrade} - Section {attSection}.
                    </td>
                  </tr>
                ) : (
                  attendanceStudents.map((std) => {
                    const currentStatus = attendanceMap[std.id] || 'Present';
                    return (
                      <tr key={std.id} className="hover:bg-gray-50/70">
                        <td className="px-4 py-3 font-mono font-bold text-gray-700">{std.rollNo}</td>
                        <td className="px-4 py-3 font-mono text-gray-500">{std.admissionNo}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">{std.name}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg p-1 bg-gray-100 gap-1">
                            {(['Present', 'Absent', 'Late', 'Leave'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStatusChange(std.id, st)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === st
                                    ? st === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : st === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-2xs'
                                      : st === 'Late'
                                      ? 'bg-amber-500 text-white shadow-2xs'
                                      : 'bg-indigo-600 text-white shadow-2xs'
                                    : 'text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {attendanceStudents.length > 0 && (
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-2.5 bg-[#00acc1] hover:bg-[#0097a7] text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Bulk Attendance ({attendanceStudents.length} Students)</span>
              </button>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#00acc1]" />
                    <span>Confirm Bulk Attendance Submission</span>
                  </h3>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-gray-700 space-y-2">
                  <p>
                    You are about to submit the attendance register for <strong>{attGrade} - Section {attSection}</strong> on <strong>{attDate}</strong>.
                  </p>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1 font-mono text-gray-800">
                    <div>Total Students: <strong>{attendanceStudents.length}</strong></div>
                    <div>
                      Present:{' '}
                      <strong className="text-emerald-700">
                        {Object.values(attendanceMap).filter((v) => v === 'Present').length}
                      </strong>
                    </div>
                    <div>
                      Absent:{' '}
                      <strong className="text-rose-700">
                        {Object.values(attendanceMap).filter((v) => v === 'Absent').length}
                      </strong>
                    </div>
                    <div>
                      Late:{' '}
                      <strong className="text-amber-700">
                        {Object.values(attendanceMap).filter((v) => v === 'Late').length}
                      </strong>
                    </div>
                    <div>
                      Leave:{' '}
                      <strong className="text-indigo-700">
                        {Object.values(attendanceMap).filter((v) => v === 'Leave').length}
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Once confirmed, attendance records will be logged in the permanent student attendance ledger and SMS notifications will be dispatched to parents of absent students.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAttendance}
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#00acc1] hover:bg-[#0097a7] rounded-lg shadow-2xs cursor-pointer"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: STUDENTS REPORT */}
      {activeTab === 'report' && (
        <div id="student-analytics-report-area" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">CBSE Student Enrollment & Demographic Analytics</h3>
              <p className="text-xs text-gray-500">Comprehensive statistical breakdown of student body · THE LEADERS ACADEMY(CBSE)</p>
            </div>
            <button
              type="button"
              onClick={() =>
                printElement('student-analytics-report-area', {
                  title: 'THE_LEADERS_ACADEMY_Student_Analytics_Report',
                })
              }
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#e0f7fa]/60 rounded-xl border border-[#b2ebf2]">
              <span className="text-xs text-cyan-800 font-bold uppercase tracking-wider">Total Enrollment</span>
              <div className="text-2xl font-black text-cyan-950 mt-1 tabular-nums">1,069</div>
              <span className="text-[11px] text-cyan-700 font-semibold">+4.2% vs last academic year</span>
            </div>
            <div className="p-4 bg-[#fce4ec]/60 rounded-xl border border-[#f8bbd0]">
              <span className="text-xs text-pink-800 font-bold uppercase tracking-wider">Boys / Girls Ratio</span>
              <div className="text-2xl font-black text-pink-950 mt-1 tabular-nums">54% / 46%</div>
              <span className="text-[11px] text-pink-700 font-semibold">577 Boys · 492 Girls</span>
            </div>
            <div className="p-4 bg-[#fff8e1]/60 rounded-xl border border-[#ffecb3]">
              <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">Transport Users</span>
              <div className="text-2xl font-black text-amber-950 mt-1 tabular-nums">782</div>
              <span className="text-[11px] text-amber-700 font-semibold">73.1% take school bus</span>
            </div>
            <div className="p-4 bg-[#e8f5e9]/60 rounded-xl border border-[#c8e6c9]">
              <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Average Attendance</span>
              <div className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">94.6%</div>
              <span className="text-[11px] text-emerald-700 font-semibold">Exceeds 75% CBSE norm</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: BULK UPDATE */}
      {activeTab === 'bulk' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Student Bulk Operations & Promotion</h3>
            <p className="text-xs text-gray-500">
              Perform batch updates on class promotion, roll number generation, and section reassignment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 transition-colors bg-gray-50/50">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Annual Class Promotion</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Promote all eligible students who cleared annual CBSE assessments to the next grade.
              </p>
              <button
                onClick={() => alert('Batch promotion simulated successfully for Class 10 to 11 and Class 9 to 10.')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-md transition-colors w-full"
              >
                Promote Batch ➔
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 transition-colors bg-gray-50/50">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Auto-Generate Roll Numbers</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Alphabetically assign roll numbers across all sections for the upcoming exam term.
              </p>
              <button
                onClick={() => alert('Roll numbers synchronized alphabetically across all 31 sections.')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition-colors w-full"
              >
                Synchronize Rolls ➔
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 transition-colors bg-gray-50/50">
              <h4 className="text-xs font-bold text-gray-900 uppercase">Export Master Student CSV</h4>
              <p className="text-[11px] text-gray-500 mt-1">
                Download complete CBSE registration data format for submission to Board portal.
              </p>
              <button
                onClick={() => alert('CBSE student data export CSV downloaded.')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors w-full flex items-center justify-center gap-1"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ADD STUDENT FORM */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
          <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">New Student Registration (CBSE)</h3>
              <p className="text-xs text-gray-500">Fill in official CBSE student and parent information</p>
            </div>
            <button
              onClick={() => setActiveTab('details')}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Tanvi Deshmukh"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Admission Number *
                </label>
                <input
                  type="text"
                  required
                  value={newAdmissionNo}
                  onChange={(e) => setNewAdmissionNo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={newRollNo}
                  onChange={(e) => setNewRollNo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Grade *</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option>Class 1</option>
                  <option>Class 2</option>
                  <option>Class 6</option>
                  <option>Class 9</option>
                  <option>Class 10</option>
                  <option>Class 11</option>
                  <option>Class 12</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Section</label>
                <select
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Gender</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Father / Guardian Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFather}
                  onChange={(e) => setNewFather(e.target.value)}
                  placeholder="e.g. Ramesh Deshmukh"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Mother Name
                </label>
                <input
                  type="text"
                  value={newMother}
                  onChange={(e) => setNewMother(e.target.value)}
                  placeholder="e.g. Sangeeta Deshmukh"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 98450 ..."
                  className="w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg shadow-2xs"
              >
                Register Student Attendance
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
