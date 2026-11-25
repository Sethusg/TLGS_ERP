import React, { useState, useEffect } from 'react';
import {
  User,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Mail,
  Phone,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { LeadersSchoolLogo } from './LeadersSchoolLogo';
import {
  AuthenticatedErpUser,
  checkSetupStatus,
  loginWithCredentials,
  setupInitialSuperAdmin,
} from '../services/erpBackendService';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthenticatedErpUser) => void;
  logoutReason?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  logoutReason,
}) => {
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  // Sign-In state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Initial Central Super Admin setup state
  const [fullName, setFullName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const status = await checkSetupStatus();
        if (active) {
          setSetupRequired(Boolean(status.setupRequired));
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(
            err?.message || 'Unable to reach ERP authentication server.'
          );
        }
      } finally {
        if (active) setCheckingStatus(false);
      }
    };
    void loadStatus();
    return () => {
      active = false;
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter your username/email and password.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { user } = await loginWithCredentials(username.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !setupUsername.trim() || !email.trim()) {
      setErrorMsg('Full name, username, and email are required.');
      return;
    }
    if (setupPassword.length < 10) {
      setErrorMsg('Super Admin password must be at least 10 characters long.');
      return;
    }
    if (setupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { user } = await setupInitialSuperAdmin({
        fullName: fullName.trim(),
        username: setupUsername.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: setupPassword,
      });
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Failed to complete initial Super Admin setup.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#102a4c] to-[#06101d] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#0B1F3A] p-6 text-center text-white relative border-b border-[#D4AF37]/40">
            <div className="flex justify-center mb-3">
              <div className="bg-white/95 p-2.5 rounded-2xl shadow-lg border border-[#D4AF37]/50">
                <LeadersSchoolLogo variant="full" className="max-h-12" />
              </div>
            </div>

            <h1 className="text-lg font-extrabold text-white tracking-tight">
              THE LEADERS GROUP OF SCHOOLS · MULTI-SCHOOL ERP
            </h1>
            <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
              {setupRequired
                ? 'Initial System Setup · Central Super Administrator Provisioning'
                : 'Enterprise Multi-Campus Governance · Authorized Sign In'}
            </p>

            {logoutReason && !setupRequired && (
              <div className="mt-3 mx-auto max-w-md bg-amber-500/20 border border-amber-400 text-amber-200 text-[11px] px-3 py-1.5 rounded-xl font-medium">
                {logoutReason}
              </div>
            )}
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {checkingStatus ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-[#0B1F3A]" />
                <p className="text-xs font-medium">
                  Verifying TLGS-ERP system initialization status...
                </p>
              </div>
            ) : setupRequired ? (
              <>
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#0B1F3A]">
                    <ShieldCheck className="w-4 h-4 text-[#9A7418] shrink-0" />
                    <span>Clean Installation Detected</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    No users or sample business records exist in the database.
                    Create the primary <strong>Central Super Administrator</strong>{' '}
                    account below. Once created, public setup is permanently
                    locked and all organizations, schools, campuses, and users
                    will be managed securely from the dashboard.
                  </p>
                </div>

                <form onSubmit={handleSetupSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g., Chief Executive Director"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Super Admin Username <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          autoComplete="username"
                          value={setupUsername}
                          onChange={(e) => setSetupUsername(e.target.value)}
                          placeholder="e.g., superadmin"
                          className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Official Phone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98XXXXXXXX"
                          className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Official Email <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@organization.edu"
                        className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password (min 10 chars) <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          required
                          minLength={10}
                          autoComplete="new-password"
                          value={setupPassword}
                          onChange={(e) => setSetupPassword(e.target.value)}
                          placeholder="Strong password"
                          className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="password"
                          required
                          minLength={10}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102a4c] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0B1F3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Provisioning Central Super Admin...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                        <span>Initialize Super Admin &amp; Launch ERP</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your authorized username or email"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102a4c] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0B1F3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to TLGS-ERP</span>
                      <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-500 text-center pt-1">
                  User accounts are provisioned exclusively by authorized
                  administrators. Public self-registration is disabled.
                </p>
              </form>
            )}
          </div>

          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
            TLGS-ERP · Multi-School Governance Platform · Secure Role-Based Access Control
          </div>
        </div>
      </div>
    </div>
  );
};
