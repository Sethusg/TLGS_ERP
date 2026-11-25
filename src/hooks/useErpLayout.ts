import { useState, useEffect } from 'react';
import { NavAppearanceSettings } from '../components/Modals/NavAppearanceModal';

const STORAGE_LOGO_KEY = 'leaders_school_logo';
const STORAGE_HIGHLIGHT_KEY = 'leaders_menu_highlight';

export function useErpLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);

  const [navSettings, setNavSettings] = useState<NavAppearanceSettings>(() => {
    try {
      const storedLogo = localStorage.getItem(STORAGE_LOGO_KEY);
      const storedHighlight = localStorage.getItem(STORAGE_HIGHLIGHT_KEY);
      return {
        logoUrl: storedLogo || null,
        highlightColor: storedHighlight || '#D4AF37',
      };
    } catch {
      return { logoUrl: null, highlightColor: '#D4AF37' };
    }
  });

  const handleSaveAppearance = (newSettings: NavAppearanceSettings) => {
    setNavSettings(newSettings);
    try {
      if (newSettings.logoUrl) {
        localStorage.setItem(STORAGE_LOGO_KEY, newSettings.logoUrl);
      } else {
        localStorage.removeItem(STORAGE_LOGO_KEY);
      }
      localStorage.setItem(STORAGE_HIGHLIGHT_KEY, newSettings.highlightColor);
    } catch {
      // Ignore storage quota limitations
    }
  };

  return {
    isSidebarCollapsed,
    toggleSidebarCollapse: () => setIsSidebarCollapsed((prev) => !prev),
    isMobileSidebarOpen,
    openMobileSidebar: () => setIsMobileSidebarOpen(true),
    closeMobileSidebar: () => setIsMobileSidebarOpen(false),
    isAppearanceModalOpen,
    openAppearanceModal: () => setIsAppearanceModalOpen(true),
    closeAppearanceModal: () => setIsAppearanceModalOpen(false),
    navSettings,
    handleSaveAppearance,
  };
}

export function useSessionPreviewTimer(
  isLoggedIn: boolean,
  onExpire: () => void
) {
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(900);
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = setInterval(() => {
      setSessionSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsWarningOpen(false);
          onExpire();
          return 0;
        }
        if (prev === 61) {
          setIsWarningOpen(true);
        }
        return prev - 1;
      });
    }, 1000);

    const resetTimer = () => {
      if (isLoggedIn && !isWarningOpen) {
        setSessionSecondsRemaining(900);
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [isLoggedIn, isWarningOpen, onExpire]);

  const extendSession = () => {
    setSessionSecondsRemaining(900);
    setIsWarningOpen(false);
  };

  const resetSession = () => {
    setSessionSecondsRemaining(900);
    setIsWarningOpen(false);
  };

  return {
    sessionSecondsRemaining,
    isWarningOpen,
    extendSession,
    resetSession,
  };
}
