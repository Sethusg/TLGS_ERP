import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  Edit,
  Archive,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Shield,
  Layers,
  QrCode,
} from 'lucide-react';
import { Staff } from '../../types';
import { printElement } from '../../utils/printDocument';

interface StaffDossierModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
  onArchive: (staff: Staff) => void;
  onRestore?: (staffId: string) => void;
  onOpenQR?: (staff: Staff) => void;
}

export const StaffDossierModal: React.FC<StaffDossierModalProps> = ({
  staff,
  isOpen,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onOpenQR,
}) => {
  if (!isOpen || !staff) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'responsibilities' | 'relieving'>('profile');

  const isArchived = staff.status === 'Archived';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div
          className={`p-6 text-white relative shrink-0 ${
            isArchived
              ? 'bg-gradient-to-r from-slate-800 to-slate-900'
              : 'bg-gradient-to-r from-emerald-800 to-slate-900'
          }`}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold font-serif shrink-0 shadow-inner">
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">{staff.name}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isArchived
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : staff.status === 'On Leave'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {staff.status}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                  {staff.role}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5 font-mono">
                Employee ID: {staff.empId} · {staff.employmentType}
              </p>
              <p className="text-xs text-emerald-300 font-semibold mt-0.5">
                {staff.designation} — Department of {staff.department}
              </p>
            </div>
          </div>

          {/* Tab Strip */}
          <div className="flex items-center gap-1 mt-5 pt-3 border-t border-white/10 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'profile' ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'
              }`}
            >
              Staff Dossier
            </button>
            <button
              onClick={() => setActiveTab('responsibilities')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'responsibilities'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Assigned Subjects & Portfolios ({staff.responsibilities?.length || 0})
            </button>
            {isArchived && (
              <button
                onClick={() => setActiveTab('relieving')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === 'relieving'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Relieving & Clearance Certificate
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div id="staff-dossier-print-area" className="p-6 space-y-5 overflow-y-auto flex-1 text-xs bg-white">
          {activeTab === 'profile' && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                  <span className="text-[11px] font-medium text-blue-700">Experience</span>
                  <div className="text-xl font-black text-blue-900 mt-0.5 tabular-nums">
                    {staff.experienceYears || 0} Years
                  </div>
                  <span className="text-[10px] text-blue-600">Joined {staff.joiningDate}</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] font-medium text-emerald-700">Leave Balance</span>
                  <div className="text-xl font-black text-emerald-900 mt-0.5 tabular-nums">
                    {staff.leaveBalance} Days
                  </div>
                  <span className="text-[10px] text-emerald-600">Paid Leave Quota</span>
                </div>

                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <span className="text-[11px] font-medium text-indigo-700">Department</span>
                  <div className="text-lg font-black text-indigo-900 mt-0.5 truncate">
                    {staff.department}
                  </div>
                  <span className="text-[10px] text-indigo-600">{staff.role}</span>
                </div>
              </div>

              {/* Professional Credentials */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Academic Credentials & Specialization
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Highest Qualification</span>
                    <strong className="text-gray-900">{staff.qualification}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Specialization</span>
                    <strong className="text-gray-900">{staff.specialization || 'General Pedagogy'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Cadre</span>
                    <span className="text-gray-800">{staff.employmentType}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Gender & DOB</span>
                    <span className="text-gray-800">
                      {staff.gender || 'Not Specified'} · {staff.dob || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                  Contact & Emergency Coordinates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-mono"><strong>{staff.phone}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span><strong>{staff.email}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 col-span-full">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Address: {staff.address || 'Campus Staff Quarters, Bengaluru'}</span>
                  </div>
                </div>

                {staff.emergencyContact && (
                  <div className="mt-2 pt-2 border-t border-gray-200 text-[11px] text-gray-600 flex justify-between items-center">
                    <span>
                      Emergency Contact: <strong>{staff.emergencyContact.name}</strong> ({staff.emergencyContact.relation})
                    </span>
                    <span className="font-mono font-semibold text-gray-800">
                      {staff.emergencyContact.phone}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'responsibilities' && (
            <div className="space-y-4">
              {staff.subject && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Primary Subject Taught</span>
                  <div className="text-sm font-bold text-indigo-900">{staff.subject}</div>
                </div>
              )}

              {staff.assignedClasses && staff.assignedClasses.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Assigned Classes & Batches</span>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.assignedClasses.map((cls, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-800 font-semibold text-xs shadow-2xs"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 uppercase text-[11px] tracking-wider">
                  Assigned Responsibilities & Portfolio Duties
                </h4>
                <div className="space-y-2">
                  {staff.responsibilities && staff.responsibilities.length > 0 ? (
                    staff.responsibilities.map((resp, i) => (
                      <div
                        key={i}
                        className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-gray-800 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{resp}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No special portfolio assignments recorded.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'relieving' && staff.archivedDetails && (
            <div className="space-y-4">
              <div id="staff-relieving-letter-document" className="p-6 border-2 border-gray-800 rounded-xl bg-white space-y-4">
                <div className="text-center border-b border-gray-300 pb-3">
                  <h4 className="font-serif font-black text-sm uppercase">THE LEADERS ACADEMY(CBSE)</h4>
                  <p className="text-[10px] text-gray-500">Service Relieving & No-Dues Clearance Dossier · Affiliation #1930812</p>
                  <span className="font-mono text-[10px] font-bold text-gray-700 block mt-1">
                    Ref: {staff.archivedDetails.relievingLetterNo}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Relieving Date:</span>
                    <strong className="font-mono text-gray-800">{staff.archivedDetails.departureDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Reason:</span>
                    <strong className="text-rose-800">{staff.archivedDetails.reason}</strong>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Institutional Clearance Status</span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-emerald-800 font-medium">
                    <div>✓ Central Library Cleared</div>
                    <div>✓ Laboratory & IT Hardware Handed Over</div>
                    <div>✓ Finance & Accounts Settlement Signed</div>
                    <div>✓ Academic Registers Transitioned</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-500">Service Testimonial</span>
                  <p className="text-gray-700 italic mt-0.5">&quot;{staff.archivedDetails.remarks}&quot;</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    printElement('staff-relieving-letter-document', {
                      title: `Relieving_Letter_${staff.empId}_THE_LEADERS_ACADEMY`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                  title="Print official relieving certificate"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Official Relieving Letter</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {!isArchived ? (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(staff);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onArchive(staff);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archive Departing Staff</span>
                </button>
              </>
            ) : (
              onRestore && (
                <button
                  onClick={() => {
                    onRestore(staff.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore to Active Staff</span>
                </button>
              )
            )}

            {onOpenQR && (
              <button
                onClick={() => onOpenQR(staff)}
                className="px-3 py-1.5 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Digital ID QR</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                printElement('staff-dossier-print-area', {
                  title: `Staff_Dossier_${staff.empId}_THE_LEADERS_ACADEMY`,
                })
              }
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Print staff profile dossier"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print Profile</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
