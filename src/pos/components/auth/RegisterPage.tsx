import React, { useState } from 'react';
import { PosUser, UserRole, StoreSettings } from '../../types/pos';
import { InternationalTheme } from '../../utils/theme';
import {
  UserPlus,
  User,
  Shield,
  KeyRound,
  BadgeCheck,
  ArrowLeft,
  CheckCircle2,
  Palette,
} from 'lucide-react';

interface RegisterPageProps {
  settings: StoreSettings;
  existingUsers: PosUser[];
  theme?: InternationalTheme;
  onRegisterUser: (newUser: PosUser) => void;
  onNavigateToLogin: () => void;
  onOpenThemeSelector?: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  settings,
  existingUsers,
  theme,
  onRegisterUser,
  onNavigateToLogin,
  onOpenThemeSelector,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [employeeId, setEmployeeId] = useState(
    `EMP-${Math.floor(100 + Math.random() * 900)}`
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN codes do not match.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (existingUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      setError(`Username "${cleanUsername}" is already taken by another staff member.`);
      return;
    }

    const newUser: PosUser = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      fullName: fullName.trim(),
      role,
      pin: pin.trim(),
      employeeId: employeeId.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onRegisterUser(newUser);
    setSuccess(`Account for ${newUser.fullName} (${newUser.role}) created successfully!`);
    setTimeout(() => {
      onNavigateToLogin();
    }, 1500);
  };

  return (
    <div
      className={`min-h-screen ${theme?.bgRoot || 'bg-[#0b1329]'} ${
        theme?.textColor || 'text-slate-100'
      } flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-300 relative`}
    >
      {/* Top International Theme Selector Shortcut */}
      {onOpenThemeSelector && (
        <button
          type="button"
          onClick={onOpenThemeSelector}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-sky-500/60 transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Change international color palette"
        >
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          <span>{theme?.flag} {theme?.name}</span>
        </button>
      )}

      {/* Brand & Terminal Header */}
      <div className="text-center mb-6 max-w-md">
        <h1 className="text-xl font-black tracking-tight text-white uppercase">
          {settings.store_name}
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          STAFF ONBOARDING & ROLE PROVISIONING
        </p>
      </div>

      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white">Create Staff Account</h2>
            <p className="text-xs text-neutral-400">Register cashiers and assign operational roles</p>
          </div>
          <UserPlus className="w-5 h-5 text-amber-400" />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Anita Sharma"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Employee ID</label>
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-sm font-mono text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Terminal Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. anita"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Assign Operational Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="cashier">Cashier (Sales & Float)</option>
                <option value="manager">Manager (Reconciliation & Inventory)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            </div>
          </div>

          {/* Role details explanation */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <span className="font-semibold text-neutral-200">Role Permissions:</span>
            {role === 'cashier' && (
              <p>· Enter starting float, record sales, scan barcodes, print receipts, and conduct EOD closing counts.</p>
            )}
            {role === 'manager' && (
              <p>· Shift reconciliation, inspect variance reports, manage catalogue & categories, and adjust inventory.</p>
            )}
            {role === 'admin' && (
              <p>· Complete terminal administrative privileges, company tax & currency configuration, diagnostic reset.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Access PIN (4–6 digits)</label>
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 5678"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm font-mono tracking-widest text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Confirm PIN</label>
              <input
                type="password"
                required
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter PIN"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm font-mono tracking-widest text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-neutral-950 rounded-xl shadow-lg transition-all"
          >
            Create Staff Account
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
