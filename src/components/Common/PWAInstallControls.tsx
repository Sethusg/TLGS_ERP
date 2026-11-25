import React, { useState } from 'react';
import { Download, Monitor, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button';
  onOpenDesktopCenter?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onOpenDesktopCenter,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Suppress automatically when already running as installed PWA or Windows Desktop EXE
  if (isInstalled) {
    return null;
  }

  // Native Chromium (Chrome / Edge) Web App install prompt
  if (isInstallable) {
    if (variant === 'header') {
      return (
        <button
          type="button"
          onClick={install}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#FDB022] hover:bg-[#F59E0B] text-[#10213D] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          title="Install TLGS-ERP App in Chrome / Edge"
          aria-label="Install TLGS-ERP App"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Install App</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-[#0B1F3A] hover:bg-[#15315B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
      >
        <Download className="w-4 h-4 text-[#D4AF37]" />
        <span>Install Web App (Chrome / Edge)</span>
      </button>
    );
  }

  // iOS Safari guided flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'header'
              ? 'hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer'
              : 'inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer'
          }
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#0B1F3A]">
                  Install TLGS-ERP on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> icon in your Safari toolbar.
                <br />
                2. Scroll down and select <strong>Add to Home Screen</strong>.
                <br />
                3. Tap <strong>Add</strong> to launch TLGS-ERP in standalone mode.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#0B1F3A] py-2 text-xs font-semibold text-white hover:bg-[#132E54] cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Optional Windows 11 Desktop & Web App Center shortcut in header when browser prompt isn't active yet
  if (variant === 'header' && onOpenDesktopCenter) {
    return (
      <button
        type="button"
        onClick={onOpenDesktopCenter}
        className="hidden xl:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg bg-white/14 hover:bg-white/24 border border-white/25 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="Web App & Windows 11 Desktop EXE Deployment"
        aria-label="Desktop and Web App Options"
      >
        <Monitor className="w-3.5 h-3.5 text-[#FDB022] shrink-0" />
        <span>Desktop App</span>
      </button>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-400/40 no-print"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Offline Mode — Reconnect to sync with TLGS-ERP server.</span>
    </div>
  );
};
