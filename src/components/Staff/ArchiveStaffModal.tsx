import React, { useState } from 'react';
import {
  X,
  Archive,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Staff, ArchivedStaffDetails } from '../../types';

interface ArchiveStaffModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onArchiveConfirm: (staffId: string, details: ArchivedStaffDetails) => void;
}

export const ArchiveStaffModal: React.FC<ArchiveStaffModalProps> = ({
  staff,
  isOpen,
  onClose,
  onArchiveConfirm,
}) => {
  if (!isOpen || !staff) return null;

  const [departureDate, setDepartureDate] = useState('2026-10-31');
  const [reason, setReason] = useState<ArchivedStaffDetails['reason']>('Resignation');
  const [relievingLetterNo, setRelievingLetterNo] = useState(
    `TLA/REL/2026/0${Math.floor(20 + Math.random() * 80)}`
  );
  const [handoverCompleted, setHandoverCompleted] = useState(true);
  const [libraryClearance, setLibraryClearance] = useState(true);
  const [accountsClearance, setAccountsClearance] = useState(true);
  const [labClearance, setLabClearance] = useState(true);
  const [remarks, setRemarks] = useState(
    'Relieved from duties upon completion of notice period. Conduct and performance were exemplary.'
  );

  const handleArchive = (e: React.FormEvent) => {
    e.preventDefault();
    onArchiveConfirm(staff.id, {
      departureDate,
      reason,
      relievingLetterNo,
      handoverCompleted,
      libraryClearance,
      accountsClearance,
      labClearance,
      remarks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-800 to-rose-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Archive className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Archive Departing Staff Record</h3>
              <p className="text-xs text-rose-200">
                Process offboarding clearance, relieving protocol, and record archival
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleArchive} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          {/* Staff Banner */}
          <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-gray-900">{staff.name}</span>
              <p className="text-gray-600 mt-0.5">
                {staff.designation} · {staff.department} ({staff.empId})
              </p>
              <span className="text-[10px] text-gray-400 font-mono">
                Tenure: Joined {staff.joiningDate}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
              Pending Offboarding
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Reason for Departure *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-rose-600 focus:outline-none"
              >
                <option value="Resignation">Resignation (Personal / Career Move)</option>
                <option value="Retirement">Retirement / Superannuation</option>
                <option value="Relocation">Relocation / Overseas Move</option>
                <option value="Contract Completion">Contract Completion</option>
                <option value="Transfer">Institutional Transfer</option>
                <option value="Other">Other Reasons</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Last Working Day *</label>
              <input
                type="date"
                required
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-rose-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Generated Relieving Certificate No.
            </label>
            <input
              type="text"
              required
              value={relievingLetterNo}
              onChange={(e) => setRelievingLetterNo(e.target.value)}
              className="w-full px-3 py-2 font-mono border border-gray-300 rounded-lg focus:border-rose-600 focus:outline-none"
            />
          </div>

          {/* Institutional Clearance Checklist */}
          <div className="space-y-2 border border-gray-200 rounded-xl p-3.5 bg-gray-50/60">
            <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Institutional No-Dues Clearance Checklist</span>
            </h4>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={libraryClearance}
                onChange={(e) => setLibraryClearance(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-gray-700">Central Library: All issued books and periodicals returned</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={labClearance}
                onChange={(e) => setLabClearance(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-gray-700">Lab / IT Equipment: Hardware, keys, and materials handed over</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={accountsClearance}
                onChange={(e) => setAccountsClearance(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-gray-700">Accounts & Finance: Salary settlement, PF dues, and travel claims cleared</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={handoverCompleted}
                onChange={(e) => setHandoverCompleted(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="text-gray-700">Academic Registers & Gradebooks handed over to HOD</span>
            </label>
          </div>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">
              Principal Relieving Remarks & Testimonial
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="State appraisal notes, service conduct, and well wishes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-rose-600 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Staff Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
