import React from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Bus,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Student } from '../../types';
import { printElement } from '../../utils/printDocument';

interface StudentProfileModalProps {
  student: Student | null;
  onClose: () => void;
  onCollectFee: (student: Student) => void;
  onIssueTC: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onCollectFee,
  onIssueTC,
}) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold font-serif shrink-0 shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">{student.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active Enrolled
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 font-mono">
                Adm No: {student.admissionNo} · Roll: {student.rollNo}
              </p>
              <p className="text-xs text-[#00acc1] font-semibold mt-0.5">
                {student.grade} - Section {student.section} (CBSE)
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div id="student-profile-dossier-area" className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-white">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
              <span className="text-[11px] font-medium text-blue-700">Attendance</span>
              <div className="text-xl font-black text-blue-900 mt-0.5 tabular-nums">
                {student.attendancePercent}%
              </div>
              <span className="text-[10px] text-blue-600">Eligible for Board</span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-700">Fee Status</span>
              <div className="text-xl font-black text-emerald-900 mt-0.5">
                {student.feeStatus}
              </div>
              <span className="text-[10px] text-emerald-600">
                {student.dueAmount > 0 ? `₹${student.dueAmount} Dues` : 'No Pending Dues'}
              </span>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
              <span className="text-[11px] font-medium text-amber-700">Blood Group</span>
              <div className="text-xl font-black text-amber-900 mt-0.5">
                {student.bloodGroup}
              </div>
              <span className="text-[10px] text-amber-600">Medical Record OK</span>
            </div>
          </div>

          {/* Student Dossier Information */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3 text-xs">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
              Parent & Guardian Contact Info
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Father: <strong>{student.fatherName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Mother: <strong>{student.motherName}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-mono">Contact: <strong>{student.phone}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email: <strong>{student.email}</strong></span>
              </div>
              <div className="flex items-center gap-2 col-span-full">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Address: {student.address}</span>
              </div>
            </div>
          </div>

          {/* Transport & Route Details */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2 text-xs">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-amber-600" />
              <span>Transport & Commute Allocation</span>
            </h4>
            <div className="flex justify-between items-center text-gray-700">
              <span>Assigned Route:</span>
              <span className="font-bold text-gray-900">{student.busRoute || 'Self Walker'}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onCollectFee(student);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#1976d2] hover:bg-blue-700 rounded-lg flex items-center gap-1 shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect Fee</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onIssueTC(student);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-[#e91e63]" />
              <span>Issue TC</span>
            </button>

            <button
              type="button"
              onClick={() =>
                printElement('student-profile-dossier-area', {
                  title: `Student_Profile_${student.admissionNo}_THE_LEADERS_ACADEMY`,
                })
              }
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
              title="Print student profile dossier"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print Profile</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
