import React, { useState } from 'react';
import {
  FileCheck2,
  Search,
  Printer,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { TransferCertificate, Student } from '../types';

interface TCModuleProps {
  tcRecords: TransferCertificate[];
  students: Student[];
  subItem?: string;
  onCreateTC: (tc: TransferCertificate) => void;
}

export const TCModule: React.FC<TCModuleProps> = ({
  tcRecords,
  students,
  subItem = 'tc-manage',
  onCreateTC,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'print'>(() => {
    if (subItem === 'tc-create') return 'create';
    if (subItem === 'tc-print') return 'print';
    return 'manage';
  });

  const [selectedTC, setSelectedTC] = useState<TransferCertificate>(tcRecords[0]);
  const [search, setSearch] = useState('');

  // Create form state
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [reason, setReason] = useState('Parent Relocation / Job Transfer');
  const [conduct, setConduct] = useState<'Good' | 'Excellent' | 'Satisfactory'>('Good');
  const [classLeft, setClassLeft] = useState('Class 10');
  const [promotionStatus, setPromotionStatus] = useState<'Yes' | 'No' | 'Not Applicable'>('Yes');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleGenerateTC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newTC: TransferCertificate = {
      tcNo: `TLA/TC/2026/0${Math.floor(50 + Math.random() * 50)}`,
      admissionNo: selectedStudent.admissionNo,
      studentName: selectedStudent.name,
      fatherName: selectedStudent.fatherName,
      motherName: selectedStudent.motherName || 'Mrs. ' + selectedStudent.fatherName.split(' ')[0],
      nationality: 'Indian',
      category: 'General',
      dob: selectedStudent.dob,
      dobInWords: 'Fourteenth May Two Thousand Eleven',
      dateOfAdmission: '2022-06-10',
      classLeft,
      schoolExamStatus: 'Cleared CBSE Assessment with distinction',
      qualifiedForPromotion: promotionStatus,
      feesPaidUpTo: 'October 2026',
      dateOfIssue: '2026-10-23',
      reasonForLeaving: reason,
      totalWorkingDays: 148,
      attendanceDays: Math.round((selectedStudent.attendancePercent / 100) * 148),
      generalConduct: conduct,
    };

    onCreateTC(newTC);
    setSelectedTC(newTC);
    setActiveTab('print');
  };

  const filteredTCs = tcRecords.filter(
    (tc) =>
      tc.studentName.toLowerCase().includes(search.toLowerCase()) ||
      tc.tcNo.toLowerCase().includes(search.toLowerCase()) ||
      tc.admissionNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#e91e63]" />
            <span>Transfer Certificate (TC) Administration</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            CBSE Statutory Transfer Certificate · Serial Number Ledger · Board Compliant Format
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'manage' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Manage TC ({tcRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'create' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Issue New TC
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'print' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Print Preview
          </button>
        </div>
      </div>

      {/* VIEW: MANAGE TC */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search TC by student name or TC no..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#e91e63]"
              />
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Transfer Certificate</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">TC Number</th>
                  <th className="px-4 py-3">Admission No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Father Name</th>
                  <th className="px-4 py-3">Class Left</th>
                  <th className="px-4 py-3">Date of Issue</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTCs.map((tc) => (
                  <tr key={tc.tcNo} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{tc.tcNo}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{tc.admissionNo}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{tc.studentName}</td>
                    <td className="px-4 py-3 text-gray-700">{tc.fatherName}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{tc.classLeft}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{tc.dateOfIssue}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedTC(tc);
                          setActiveTab('print');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#e91e63] hover:bg-pink-50 rounded"
                      >
                        Print TC ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CREATE TC FORM */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Generate Official CBSE Transfer Certificate</h3>
            <p className="text-xs text-gray-500">
              Verify no dues with Accounts, Library, and Laboratory before generating
            </p>
          </div>

          <form onSubmit={handleGenerateTC} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Select Student for TC Issuance *
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.admissionNo}) - {s.grade} Sec {s.section} · Dues: ₹{s.dueAmount}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Class Left *</label>
                <input
                  type="text"
                  value={classLeft}
                  onChange={(e) => setClassLeft(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Qualified for Promotion
                </label>
                <select
                  value={promotionStatus}
                  onChange={(e) => setPromotionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
                >
                  <option value="Yes">Yes (Promoted to next class)</option>
                  <option value="No">No</option>
                  <option value="Not Applicable">Not Applicable (Course Completed)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Reason for Leaving the Institution *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
              >
                <option>Parent Relocation / Job Transfer to another city</option>
                <option>Completed Course (Senior Secondary Board Exam)</option>
                <option>Parent Request for School Change</option>
                <option>Higher Studies in Professional College</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">General Conduct *</label>
              <select
                value={conduct}
                onChange={(e) => setConduct(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
              >
                <option value="Good">Good</option>
                <option value="Excellent">Excellent</option>
                <option value="Satisfactory">Satisfactory</option>
              </select>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Library books returned, laboratory clearance obtained, fee dues verified.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg shadow-2xs"
              >
                Generate & Issue TC
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: OFFICIAL CBSE TRANSFER CERTIFICATE PRINT TEMPLATE */}
      {activeTab === 'print' && selectedTC && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Official CBSE Transfer Certificate Preview
              </h3>
              <p className="text-xs text-gray-500">Certificate Number: {selectedTC.tcNo}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#e91e63] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d81b60] shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official TC</span>
            </button>
          </div>

          {/* Official Document Sheet */}
          <div className="border-4 border-double border-gray-800 p-8 max-w-3xl mx-auto bg-white shadow-xl text-gray-900">
            {/* Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-2xl font-serif font-black tracking-widest uppercase">
                THE LEARNER&apos;S ACADEMY
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                AFFILIATED TO THE CENTRAL BOARD OF SECONDARY EDUCATION, NEW DELHI
              </p>
              <p className="text-[11px] text-gray-600">
                Affiliation No.: <strong>1930812</strong> · School Code: <strong>45091</strong>
              </p>
              <p className="text-[10px] text-gray-500">
                42, Academy Knowledge Park, Varthur Main Road, Bengaluru - 560087
              </p>
              <div className="mt-3 inline-block px-4 py-1 border-2 border-gray-800 font-bold uppercase text-xs tracking-wider">
                TRANSFER CERTIFICATE
              </div>
            </div>

            <div className="flex justify-between text-xs py-3 font-mono font-bold border-b border-gray-300">
              <span>TC No.: {selectedTC.tcNo}</span>
              <span>Admission No.: {selectedTC.admissionNo}</span>
            </div>

            {/* Enumerated CBSE Fields */}
            <div className="py-4 space-y-2 text-xs leading-relaxed">
              <div className="flex">
                <span className="w-8 font-bold">1.</span>
                <span className="w-64 text-gray-600">Name of the Pupil:</span>
                <span className="font-bold uppercase text-gray-900">{selectedTC.studentName}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">2.</span>
                <span className="w-64 text-gray-600">Father&apos;s / Guardian&apos;s Name:</span>
                <span className="font-bold text-gray-900">{selectedTC.fatherName}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">3.</span>
                <span className="w-64 text-gray-600">Mother&apos;s Name:</span>
                <span className="font-bold text-gray-900">{selectedTC.motherName}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">4.</span>
                <span className="w-64 text-gray-600">Nationality & Category:</span>
                <span className="font-medium text-gray-900">
                  {selectedTC.nationality} · Category: {selectedTC.category}
                </span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">5.</span>
                <span className="w-64 text-gray-600">Date of Birth (in figures & words):</span>
                <span className="font-medium text-gray-900">
                  {selectedTC.dob} ({selectedTC.dobInWords})
                </span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">6.</span>
                <span className="w-64 text-gray-600">Date of First Admission to the School:</span>
                <span className="font-medium text-gray-900">{selectedTC.dateOfAdmission}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">7.</span>
                <span className="w-64 text-gray-600">Class in which the pupil last studied:</span>
                <span className="font-bold text-gray-900">{selectedTC.classLeft}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">8.</span>
                <span className="w-64 text-gray-600">School / Board Annual Exam Result:</span>
                <span className="font-medium text-gray-900">{selectedTC.schoolExamStatus}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">9.</span>
                <span className="w-64 text-gray-600">Whether qualified for promotion:</span>
                <span className="font-bold text-emerald-800">{selectedTC.qualifiedForPromotion}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">10.</span>
                <span className="w-64 text-gray-600">Month up to which school dues paid:</span>
                <span className="font-medium text-gray-900">{selectedTC.feesPaidUpTo}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">11.</span>
                <span className="w-64 text-gray-600">Total Working Days / Days Present:</span>
                <span className="font-mono text-gray-900">
                  {selectedTC.attendanceDays} days attended out of {selectedTC.totalWorkingDays} days
                </span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">12.</span>
                <span className="w-64 text-gray-600">General Conduct:</span>
                <span className="font-bold text-gray-900">{selectedTC.generalConduct}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">13.</span>
                <span className="w-64 text-gray-600">Date of Application for Certificate:</span>
                <span className="font-mono text-gray-900">{selectedTC.dateOfIssue}</span>
              </div>

              <div className="flex">
                <span className="w-8 font-bold">14.</span>
                <span className="w-64 text-gray-600">Reason for leaving the school:</span>
                <span className="font-medium text-gray-900">{selectedTC.reasonForLeaving}</span>
              </div>
            </div>

            {/* Seal & Signatures */}
            <div className="mt-12 pt-6 border-t-2 border-gray-800 grid grid-cols-3 text-center text-xs">
              <div>
                <div className="font-signature font-serif italic text-base">Sridhar K.</div>
                <div className="border-t border-gray-400 mt-1 pt-1 font-semibold text-gray-700">
                  Prepared By (Clerk)
                </div>
              </div>
              <div>
                <div className="w-20 h-20 border-2 border-dashed border-gray-400 rounded-full mx-auto flex items-center justify-center text-[10px] text-gray-400 font-mono">
                  [SCHOOL SEAL]
                </div>
              </div>
              <div>
                <div className="font-signature font-serif italic text-base">Dr. Sethu Ramanathan</div>
                <div className="border-t border-gray-400 mt-1 pt-1 font-semibold text-gray-700">
                  Principal Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
