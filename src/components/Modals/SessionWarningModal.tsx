import React from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface SessionWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  onExtendSession,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden text-slate-900">
        <div className="bg-amber-500 p-6 text-white text-center relative">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs border border-white/40">
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-lg font-extrabold tracking-tight">Session Inactivity Warning</h3>
          <p className="text-xs text-amber-100 mt-1">
            Your session is about to expire due to inactivity for security compliance.
          </p>
        </div>

        <div className="p-6 text-center space-y-5">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Time Remaining Before Auto-Logout
            </span>
            <div className="text-3xl font-mono font-extrabold text-rose-600 tracking-wider">
              {formattedTime}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            To protect student and financial records, inactive sessions are automatically terminated. Click <strong className="text-slate-800">Continue Session</strong> to stay active.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onLogoutNow}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Log Out Now
            </button>
            <button
              onClick={onExtendSession}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
