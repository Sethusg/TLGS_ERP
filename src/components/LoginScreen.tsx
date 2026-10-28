import React, { useState } from 'react';
import { Shield, Lock, User, CheckCircle2, ArrowRight, Building2, KeyRound } from 'lucide-react';
import { LeadersSchoolLogo } from './LeadersSchoolLogo';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: string) => void;
  defaultUsername?: string;
  logoutReason?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  defaultUsername = 'admin_sethu',
  logoutReason,
}) => {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('••••••••');
  const [campus, setCampus] = useState('Main CBSE Campus (Chennai - HQ)');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsLoading(false);
      if (!username.trim()) {
        setErrorMsg('Please enter a valid username or staff ID.');
        return;
      }
      const uLower = username.toLowerCase();
      let roleCode = 'admin';
      if (uLower.includes('cashier') || uLower.includes('raj')) roleCode = 'cashier';
      else if (uLower.includes('accountant') || uLower.includes('anita')) roleCode = 'accountant';
      else if (uLower.includes('teacher') || uLower.includes('malini')) roleCode = 'teacher';
      else if (uLower.includes('manager') || uLower.includes('vikram')) roleCode = 'manager';
      onLoginSuccess(username, roleCode);
    }, 750);
  };

  const handleQuickLogin = (quickUser: string, quickRole: string) => {
    setUsername(quickUser);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(quickUser, quickRole);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#102a4c] to-[#06101d] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* Main Login Container */}
      <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Banner */}
        <div className="bg-[#0B1F3A] p-6 text-center text-white relative border-b border-[#D4AF37]/40">
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] rounded-full text-[10px] font-bold tracking-wider uppercase">
              CBSE Aff. 1930812
            </span>
          </div>

          <div className="flex justify-center mb-3">
            <div className="bg-white/95 p-2.5 rounded-2xl shadow-lg border border-[#D4AF37]/50">
              <LeadersSchoolLogo variant="full" className="max-h-12" />
            </div>
          </div>

          <h1 className="text-lg font-extrabold text-white tracking-tight">
            THE LEADERS ACADEMY (CBSE)
          </h1>
          <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
            School Enterprise Resource Planning & LMS Portal
          </p>

          {logoutReason && (
            <div className="mt-3 mx-auto max-w-xs bg-amber-500/20 border border-amber-400 text-amber-200 text-[11px] px-3 py-1.5 rounded-xl font-medium">
              {logoutReason}
            </div>
          )}
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Username / Staff ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin_sethu"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Campus Location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                >
                  <option>Main CBSE Campus (Chennai - HQ)</option>
                  <option>North Campus (Adambakkam)</option>
                  <option>West Campus (Tambaram)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102a4c] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0B1F3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Authenticating Session...
                </span>
              ) : (
                <>
                  <span>Sign In To Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
              Quick Role Switch Login
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin_sethu', 'admin')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0B1F3A]">Dr. Sethu</div>
                <div className="text-[9px] text-slate-500 font-bold text-purple-700">Super Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('raj_cashier', 'cashier')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0B1F3A]">Raj Kumar</div>
                <div className="text-[9px] text-slate-500 font-bold text-emerald-700">POS Cashier</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('anita_accountant', 'accountant')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0B1F3A]">Anita S.</div>
                <div className="text-[9px] text-slate-500 font-bold text-blue-700">Accountant</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('malini_teacher', 'teacher')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0B1F3A]">Malini S.</div>
                <div className="text-[9px] text-slate-500 font-bold text-sky-700">Teacher</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('vikram_manager', 'manager')}
                className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-slate-800 group-hover:text-[#0B1F3A]">Vikram R.</div>
                <div className="text-[9px] text-slate-500 font-bold text-amber-700">Canteen Manager</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          Secure AES-256 Encrypted Session · The Leaders Group of Schools © 2026
        </div>
      </div>
    </div>
  );
};
