import React, { useState } from 'react';
import { PosUser, StoreSettings } from '../../types/pos';
import { InternationalTheme } from '../../utils/theme';
import {
  Lock,
  User,
  KeyRound,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  Sparkles,
  Palette,
  Globe,
} from 'lucide-react';

interface LoginPageProps {
  users: PosUser[];
  settings: StoreSettings;
  theme?: InternationalTheme;
  onLogin: (user: PosUser) => void;
  onNavigateToRegister: () => void;
  onOpenThemeSelector?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  users,
  settings,
  theme,
  onLogin,
  onNavigateToRegister,
  onOpenThemeSelector,
}) => {
  const [username, setUsername] = useState(users[0]?.username || '');
  const [pin, setPin] = useState(users[0]?.pin || '');
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const foundUser = users.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.pin === pin.trim()
    );

    if (!foundUser) {
      setError('Invalid username or PIN code. Please try again.');
      return;
    }

    if (!foundUser.isActive) {
      setError('This staff account is deactivated. Contact store administrator.');
      return;
    }

    onLogin(foundUser);
  };

  const handleQuickSelect = (user: PosUser) => {
    setUsername(user.username);
    setPin(user.pin);
    setError(null);
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
      <div className="text-center mb-8 max-w-md">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl tracking-wider shadow-inner mb-3">
          GSR
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          {settings.store_name}
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-1">
          SECURE POINT OF SALE AUTHENTICATION · TERMINAL #01
        </p>
      </div>

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-bold text-white">Staff Terminal Login</h2>
            <p className="text-xs text-neutral-400">Authenticate cashier or manager account</p>
          </div>
          <Lock className="w-5 h-5 text-amber-400" />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Cashier Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter cashier username (e.g. raj)"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Access PIN / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                maxLength={12}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-neutral-950 border border-neutral-800 text-sm font-mono tracking-widest text-neutral-100 pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-neutral-950 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>Authenticate & Start Terminal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Staff Accounts */}
        <div className="mt-6 pt-5 border-t border-neutral-800 space-y-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
            Quick Switch Staff Account:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickSelect(u)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  username.toLowerCase() === u.username.toLowerCase()
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs truncate">{u.fullName}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-1 rounded ${
                      u.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300'
                        : u.role === 'manager'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                  PIN: {u.pin}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* New Cashier Registration Link */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
          <button
            type="button"
            onClick={onNavigateToRegister}
            className="text-xs text-neutral-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors font-medium"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Register New Cashier / Staff Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
