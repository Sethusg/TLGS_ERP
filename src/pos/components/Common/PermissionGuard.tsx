import React from 'react';
import { PermissionCode, hasPermission, getStoredRoles } from '../../utils/rbac';
import { PosUser } from '../../types/pos';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface PermissionGuardProps {
  user: PosUser | null;
  permission: PermissionCode;
  children: React.ReactNode;
  fallbackMessage?: string;
  onNavigateHome?: () => void;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  user,
  permission,
  children,
  fallbackMessage,
  onNavigateHome,
}) => {
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Authentication Required</h3>
        <p className="text-xs text-neutral-400">Please sign in with a staff account to access this protected module.</p>
      </div>
    );
  }

  const roles = getStoredRoles();
  const allowed = hasPermission(user.role, permission, roles);

  if (!allowed) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-neutral-900 border border-red-500/30 rounded-3xl text-center space-y-4 shadow-2xl animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold tracking-wider">
            Access Denied · RBAC Security Policy
          </span>
          <h3 className="text-xl font-black text-white mt-2">
            Insufficient Permissions ({permission})
          </h3>
          <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
            {fallbackMessage ||
              `Your current role ("${user.role.toUpperCase()}") does not grant authorization for this operation. Contact your system administrator to request permission (${permission}).`}
          </p>
        </div>
        {onNavigateHome && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Permitted Dashboard</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
