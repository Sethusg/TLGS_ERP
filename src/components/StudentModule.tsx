import React, { useState } from 'react';
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
} from 'lucide-react';
import { Student } from '../types';

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
  const [activeTab, setActiveTab] = useState<'details' | 'report' | 'bulk' | 'add'>(
    subItem === 'student-report'
      ? 'report'
      : subItem === 'student-bulk-update'
      ? 'bulk'
      : 'details'
  );

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [feeFilter, setFeeFilter] = useState('ALL');

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
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '')}@student.learner.edu.in`,
      address: newAddress || 'Bengaluru, Karnataka',
      bloodGroup: newBlood,
      busRoute: newBusRoute,
      feeStatus: 'Paid',
      dueAmount: 0,
      attendancePercent: 100,
    });

    // Reset & switch to details
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
            <span>Student Management System</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            1,069 Enrolled Students · Academic Year 2026 - 2027 · CBSE Affiliated
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-gray-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'details' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'report' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Students Report
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'bulk' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulk Update
            </button>
          </div>

          <button
            onClick={() => setActiveTab('add')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg transition-colors shadow-2xs shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* VIEW: USER DETAILS */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          {/* Filters Bar */}
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
                <option value="Class 7">Class 7</option>
                <option value="Class 6">Class 6</option>
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
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-800 tabular-nums">
                            {std.attendancePercent}%
                          </span>
                        </div>
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
                          {std.dueAmount > 0 && ` (₹${std.dueAmount.toLocaleString()})`}
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
      )}

      {/* VIEW: STUDENTS REPORT */}
      {activeTab === 'report' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">CBSE Student Enrollment & Demographic Analytics</h3>
              <p className="text-xs text-gray-500">Comprehensive statistical breakdown of student body</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Total Enrollment</span>
              <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">1,069</div>
              <span className="text-[11px] text-emerald-600 font-semibold">+4.2% vs last academic year</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Boys / Girls Ratio</span>
              <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">54% / 46%</div>
              <span className="text-[11px] text-gray-500">577 Boys · 492 Girls</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Transport Users</span>
              <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">782</div>
              <span className="text-[11px] text-blue-600 font-semibold">73.1% take school bus</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Average Attendance</span>
              <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">94.6%</div>
              <span className="text-[11px] text-emerald-600 font-semibold">Exceeds 75% CBSE norm</span>
            </div>
          </div>

          <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 text-xs font-bold text-gray-700">
              Grade-wise Strength Breakdown
            </div>
            <div className="divide-y divide-gray-100 text-xs">
              {[
                { grade: 'Primary (Classes 1 - 5)', sections: 10, count: 340, avgAtt: '95.2%' },
                { grade: 'Middle School (Classes 6 - 8)', sections: 9, count: 312, avgAtt: '94.8%' },
                { grade: 'Secondary (Classes 9 - 10)', sections: 6, count: 228, avgAtt: '94.1%' },
                { grade: 'Senior Secondary (Classes 11 - 12)', sections: 6, count: 189, avgAtt: '93.7%' },
              ].map((row, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/60">
                  <span className="font-semibold text-gray-900">{row.grade}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500">{row.sections} Sections</span>
                    <span className="font-bold text-gray-800 tabular-nums">{row.count} Students</span>
                    <span className="text-emerald-700 font-medium">{row.avgAtt} Attendance</span>
                  </div>
                </div>
              ))}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Blood Group
                </label>
                <select
                  value={newBlood}
                  onChange={(e) => setNewBlood(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option>O+</option>
                  <option>A+</option>
                  <option>B+</option>
                  <option>AB+</option>
                  <option>O-</option>
                  <option>A-</option>
                  <option>B-</option>
                  <option>AB-</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Bus Route
                </label>
                <select
                  value={newBusRoute}
                  onChange={(e) => setNewBusRoute(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option>Route 1 (Marathahalli)</option>
                  <option>Route 2 (Koramangala)</option>
                  <option>Route 3 (Sarjapur Road)</option>
                  <option>Route 4 (Indiranagar)</option>
                  <option>Self Conveyance / Walker</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Residential Address"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
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
                Register Student
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
