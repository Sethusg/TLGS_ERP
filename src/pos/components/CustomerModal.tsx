import React, { useState, useMemo } from 'react';
import { Customer } from '../types/pos';
import { Users, X, Save, AlertTriangle, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface CustomerModalProps {
  customer: Customer | null;
  onSave: (customerData: Partial<Customer>) => void;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customer,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(customer?.name || '');
  const [accountType, setAccountType] = useState<Customer['account_type']>(
    customer?.account_type || 'student'
  );
  const [studentId, setStudentId] = useState(customer?.student_id || '');
  const [gradeSection, setGradeSection] = useState(customer?.grade_section || '');
  const [parentName, setParentName] = useState(customer?.parent_name || '');
  const [walletBalance, setWalletBalance] = useState<number>(customer?.wallet_balance ?? 300);
  const [allergens, setAllergens] = useState(customer?.allergens || 'None');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [tier, setTier] = useState<Customer['tier']>(customer?.tier || 'Bronze');
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(customer?.loyalty_points || 25);
  const [notes, setNotes] = useState(customer?.notes || '');

  // Joining and Relieving Dates & Account Status
  const [joiningDate, setJoiningDate] = useState(
    customer?.joining_date || customer?.member_since || new Date().toISOString().slice(0, 10)
  );
  const [relievingDate, setRelievingDate] = useState(customer?.relieving_date || '');
  const [isDisabled, setIsDisabled] = useState<boolean>(customer?.is_disabled || false);
  const [disabledReason, setDisabledReason] = useState(customer?.disabled_reason || '');

  // Calculate relieving date status
  const relievingAnalysis = useMemo(() => {
    if (!relievingDate) return null;
    const target = new Date(relievingDate);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      isPast: diffDays < 0,
      isToday: diffDays === 0,
      diffDays,
    };
  }, [relievingDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      account_type: accountType,
      student_id: studentId,
      grade_section: gradeSection,
      parent_name: parentName,
      wallet_balance: Math.max(0, walletBalance),
      allergens,
      phone,
      email,
      tier,
      loyalty_points: Math.max(0, loyaltyPoints),
      notes,
      joining_date: joiningDate,
      relieving_date: relievingDate || undefined,
      is_disabled: isDisabled,
      disabled_reason: isDisabled
        ? disabledReason || (relievingAnalysis?.isPast ? `Relieved on ${relievingDate}` : 'Account disabled by admin')
        : undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {customer ? 'Edit Student / Staff Account' : 'Register Student Canteen Card'}
              </h3>
              <p className="text-xs text-neutral-400">Manage admission, joining/relieving dates & canteen wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          {/* Relieving Date Prompt / Notification Banner if date has arrived/passed */}
          {relievingAnalysis && (relievingAnalysis.isPast || relievingAnalysis.isToday) && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {relievingAnalysis.isToday
                    ? 'Relieving Date Reached (Today)'
                    : `Relieving Date Passed (${Math.abs(relievingAnalysis.diffDays)} days ago on ${relievingDate})`}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                The relieving date for this student/member has been reached. Accounts that reach their relieving date must be disabled to prevent unauthorized canteen purchases or wallet deductions.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDisabled(true);
                    setDisabledReason(`Relieving date reached (${relievingDate})`);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isDisabled
                      ? 'bg-red-500 text-white shadow'
                      : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  {isDisabled ? '✓ Account Disabled' : 'Disable Account Now'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDisabled(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    !isDisabled
                      ? 'bg-neutral-700 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Keep Active (Extension)
                </button>
              </div>
            </div>
          )}

          {/* Account Status Switch */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isDisabled ? (
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <div>
                <span className="font-bold text-white block">
                  Account Status: {isDisabled ? 'Disabled / Inactive' : 'Active Account'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isDisabled
                    ? 'Disabled accounts are blocked from checkout and wallet deductions'
                    : 'Active accounts can purchase meals and redeem prepaid wallet credit'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !isDisabled;
                setIsDisabled(next);
                if (next && !disabledReason) {
                  setDisabledReason(
                    relievingAnalysis?.isPast ? `Relieved on ${relievingDate}` : 'Manual administrative disable'
                  );
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                isDisabled
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {isDisabled ? 'Account Disabled' : 'Account Active'}
            </button>
          </div>

          {isDisabled && (
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Reason for Disabling Account</label>
              <input
                type="text"
                value={disabledReason}
                onChange={(e) => setDisabledReason(e.target.value)}
                placeholder="e.g. Relieved on graduation / Batch 2026 passed out"
                className="w-full bg-neutral-950 border border-red-500/40 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-red-500 text-xs"
              />
            </div>
          )}

          {/* Joining and Relieving Dates Card */}
          <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Academic Enrollment & Relieving Schedule</span>
              </span>
              {relievingDate && !relievingAnalysis?.isPast && !relievingAnalysis?.isToday && (
                <span className="text-[10px] text-neutral-400 font-mono">
                  Relieving in {relievingAnalysis?.diffDays} days
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Joining / Admission Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  Relieving / Leaving Date
                </label>
                <input
                  type="date"
                  value={relievingDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setRelievingDate(newDate);
                    if (newDate) {
                      const t = new Date(newDate);
                      t.setHours(0, 0, 0, 0);
                      const now = new Date();
                      now.setHours(0, 0, 0, 0);
                      if (t.getTime() <= now.getTime()) {
                        // Relieving date has arrived or passed - suggest disabling
                        setIsDisabled(true);
                        setDisabledReason(`Relieving date reached (${newDate})`);
                      }
                    }
                  }}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-neutral-500">
              When the relieving date arrives, the system notifies administrators and prompts disabling the account to prevent unauthorized canteen POS transactions.
            </p>
          </div>

          {/* Student Profile Information */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Student / Staff Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Account Type</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="student">Student Account</option>
                <option value="staff">Faculty / School Staff</option>
                <option value="visitor">Visitor / Guest</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Admission No / Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. TLGS-2025-0412"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Class / Grade & Section</label>
              <input
                type="text"
                value={gradeSection}
                onChange={(e) => setGradeSection(e.target.value)}
                placeholder="e.g. Grade 10-A"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Canteen Wallet & Dietary Safety */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Prepaid Canteen Wallet & Dietary Safety
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Prepaid Wallet Credit (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={walletBalance}
                  onChange={(e) => setWalletBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Known Allergens / Dietary</label>
                <input
                  type="text"
                  value={allergens}
                  onChange={(e) => setAllergens(e.target.value)}
                  placeholder="e.g. Peanut Allergy, Lactose Sensitive"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Parent / Contact Phone <span className="text-red-400">*</span></label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Sunil Sharma (Father)"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">School Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@tlgs.edu.in"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Reward Points Balance</label>
              <input
                type="number"
                step="1"
                required
                value={loyaltyPoints}
                onChange={(e) => setLoyaltyPoints(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Canteen Notes / Meal Plan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Regular lunch thali subscriber, sports squad diet, etc."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>{customer ? 'Update Profile' : 'Save Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
