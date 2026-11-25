import React, { useState } from 'react';
import {
  User,
  ArrowRight,
  Building2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { ErpRole } from '../types';
import { ALL_ERP_ROLES, getRoleDefinition } from '../config/rbac';
import { LeadersSchoolLogo } from './LeadersSchoolLogo';
import { getCampusNameById, getSchoolNameById } from '../data/schoolContext';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: ErpRole) => void;
  defaultUsername?: string;
  logoutReason?: string;
}

const FEATURED_ROLES: ErpRole[] = [
  'Super Administrator',
  'Organization Administrator',
  'School Administrator',
  'Campus Administrator',
  'Principal',
  'Accountant',
  'HR Manager',
  'Class Teacher',
  'Parent',
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  defaultUsername = 'superadmin_sethu',
  logoutReason,
}) => {
  const [selectedRole, setSelectedRole] = useState<ErpRole>('Super Administrator');
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeDef = getRoleDefinition(selectedRole);

  const handleRoleSelect = (role: ErpRole) => {
    setSelectedRole(role);
    const def = getRoleDefinition(role);
    setUsername(def.sampleAccount.username);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please enter a valid username or staff ID.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(username.trim(), selectedRole);
    }, 350);
  };

  const handleQuickLogin = (role: ErpRole) => {
    const def = getRoleDefinition(role);
    setSelectedRole(role);
    setUsername(def.sampleAccount.username);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(def.sampleAccount.username, role);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#102a4c] to-[#06101d] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-[#D4AF37]/30 overflow-hidden relative z-10">
        {/* Header Banner */}
        <div className="bg-[#0B1F3A] p-6 text-center text-white relative border-b border-[#D4AF37]/40">
          <div className="absolute top-3 right-3">
            <span className="px-2.5 py-1 bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] rounded-full text-[10px] font-bold tracking-wider uppercase">
              19 RBAC Roles
            </span>
          </div>

          <div className="flex justify-center mb-3">
            <div className="bg-white/95 p-2.5 rounded-2xl shadow-lg border border-[#D4AF37]/50">
              <LeadersSchoolLogo variant="full" className="max-h-12" />
            </div>
          </div>

          <h1 className="text-lg font-extrabold text-white tracking-tight">
            THE LEADERS GROUP OF SCHOOLS · MULTI-SCHOOL ERP
          </h1>
          <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
            Multi-Campus Governance · CBSE · ICSE · IB · Cambridge IGCSE
          </p>

          {logoutReason && (
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

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select User Role (All 19 Enterprise Roles)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9A7418]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <select
                  value={selectedRole}
                  onChange={(e) => handleRoleSelect(e.target.value as ErpRole)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-semibold text-slate-900"
                >
                  {ALL_ERP_ROLES.map((def) => (
                    <option key={def.role} value={def.role}>
                      {def.index}. {def.role} ({def.scope} Scope)
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                  <span className="truncate">
                    {getSchoolNameById(activeDef.sampleAccount.schoolId)} ·{' '}
                    {getCampusNameById(
                      activeDef.sampleAccount.schoolId,
                      activeDef.sampleAccount.campusId
                    )}
                  </span>
                </span>
                <span className="font-mono font-bold text-[#0B1F3A] shrink-0">
                  {activeDef.scope}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Username / Staff ID
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
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B1F3A] focus:bg-white font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Preview Password
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
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#0B1F3A] hover:bg-[#102a4c] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#0B1F3A]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Opening Role Workspace...</span>
              ) : (
                <>
                  <span>Enter ERP Preview as {selectedRole}</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Role Preview Switch */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-center">
              Quick Role Preview Launch
            </p>
            <div className="grid grid-cols-3 gap-2">
              {FEATURED_ROLES.map((r) => {
                const def = getRoleDefinition(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickLogin(r)}
                    className="p-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-[#D4AF37] rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <div className="text-[11px] font-bold text-[#0B1F3A] truncate">
                      {def.role}
                    </div>
                    <div className="text-[9.5px] text-slate-500 truncate">
                      {def.scope} Scope
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          Frontend UI Preview · Django REST Framework &amp; MySQL 8+ Integration Planned · The Leaders Group of Schools © 2026
        </div>
      </div>
    </div>
  );
};
