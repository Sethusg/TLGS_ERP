import React, { useState, useRef, useEffect } from 'react';
import {
  Home,
  GraduationCap,
  Users,
  LineChart,
  BookOpen,
  Mail,
  Award,
  Bus,
  Building2,
  Shield,
  CreditCard,
  FileCheck2,
  Settings,
  Boxes,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Palette,
  Camera,
  Printer,
} from 'lucide-react';
import { NavSection } from '../types';
import { LeadersSchoolLogo } from './LeadersSchoolLogo';
import {
  NavAppearanceModal,
  NavAppearanceSettings,
} from './Modals/NavAppearanceModal';

interface HeaderNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  activeSubItem?: string;
  onLogout: () => void;
  sessionSecondsRemaining?: number;
  userRole?: string;
}

interface MenuItemDef {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: { label: string; actionId: string }[];
}

export const MENU_ITEMS: MenuItemDef[] = [
  { id: 'HOME', label: 'HOME', icon: Home },
  {
    id: 'STUDENT',
    label: 'STUDENT',
    icon: GraduationCap,
    subItems: [
      { label: 'User Details', actionId: 'student-user-details' },
      { label: 'Students Report', actionId: 'student-report' },
      { label: 'Students Bulk Update', actionId: 'student-bulk-update' },
    ],
  },
  {
    id: 'STAFFS',
    label: 'STAFFS',
    icon: Users,
    subItems: [
      { label: 'Staff Info', actionId: 'staff-info' },
      { label: 'Leave Calendar', actionId: 'staff-leave-calendar' },
      { label: 'Payroll & Payslips', actionId: 'staff-payroll' },
      { label: 'Staff Analytics', actionId: 'staff-report' },
      { label: 'Staff Leave Apply', actionId: 'staff-leave-apply' },
      { label: 'Staff Leave Request', actionId: 'staff-leave-request' },
    ],
  },
  {
    id: 'MARKCHART',
    label: 'MARKCHART',
    icon: LineChart,
    subItems: [
      { label: 'Exams', actionId: 'markchart-exams' },
      { label: 'Student Enrollment', actionId: 'markchart-enrollment' },
      { label: 'Reports', actionId: 'markchart-reports' },
      { label: 'Analytics', actionId: 'markchart-analytics' },
      { label: 'Subjects', actionId: 'markchart-subjects' },
      { label: 'Staffs', actionId: 'markchart-staffs' },
      { label: 'Settings', actionId: 'markchart-settings' },
      { label: 'Activity', actionId: 'markchart-activity' },
    ],
  },
  {
    id: 'LMS',
    label: 'LMS',
    icon: BookOpen,
  },
  {
    id: 'CONTACT',
    label: 'CONTACT',
    icon: Mail,
    subItems: [
      { label: 'Messaging', actionId: 'contact-messaging' },
      { label: 'Parents Notes', actionId: 'contact-parents-notes' },
    ],
  },
  {
    id: 'ACADEMICS',
    label: 'ACADEMICS',
    icon: Award,
    subItems: [
      { label: 'Home Work', actionId: 'academics-homework' },
      { label: 'Time Table', actionId: 'academics-timetable' },
      { label: 'Exam Schedule', actionId: 'academics-exam-schedule' },
      { label: 'Live Class', actionId: 'academics-live-class' },
    ],
  },
  {
    id: 'TRANSPORT',
    label: 'TRANSPORT',
    icon: Bus,
    subItems: [
      { label: 'Bus Locations', actionId: 'transport-bus-locations' },
      { label: 'Routes', actionId: 'transport-routes' },
      { label: 'Reports', actionId: 'transport-reports' },
    ],
  },
  {
    id: 'SCHOOL',
    label: 'SCHOOL',
    icon: Building2,
    subItems: [
      { label: 'Calendar', actionId: 'school-calendar' },
      { label: 'Circulars', actionId: 'school-circulars' },
      { label: 'News', actionId: 'school-news' },
      { label: 'Events', actionId: 'school-events' },
      { label: 'Library', actionId: 'school-library' },
      { label: 'App Content', actionId: 'school-app-content' },
    ],
  },
  {
    id: 'ADMIN',
    label: 'ADMIN',
    icon: Shield,
  },
  {
    id: 'FEE MANAGEMENT',
    label: 'FEE MANAGEMENT',
    icon: CreditCard,
    subItems: [
      { label: 'Fee Admin', actionId: 'fee-admin' },
      { label: 'Fee Collection', actionId: 'fee-collection' },
      { label: 'Fee Assignment', actionId: 'fee-assignment' },
      { label: 'Manage Concession', actionId: 'fee-concession' },
      { label: 'Fee Report', actionId: 'fee-report' },
    ],
  },
  {
    id: 'CANTEEN',
    label: 'CANTEEN & POS',
    icon: Boxes,
    subItems: [
      { label: 'Canteen Dashboard', actionId: 'canteen-dashboard' },
      { label: 'POS Checkout', actionId: 'canteen-pos' },
      { label: 'Inventory Manager', actionId: 'canteen-inventory' },
      { label: 'Sales Reports', actionId: 'canteen-reports' },
      { label: 'Customer Wallets', actionId: 'canteen-customers' },
      { label: 'Loyalty Rewards', actionId: 'canteen-loyalty' },
      { label: 'Shifts & EOD', actionId: 'canteen-shifts' },
    ],
  },
  {
    id: 'TC',
    label: 'TC',
    icon: FileCheck2,
    subItems: [
      { label: 'Manage TC', actionId: 'tc-manage' },
      { label: 'Create TC', actionId: 'tc-create' },
      { label: 'Bulk TC', actionId: 'tc-bulk' },
      { label: 'Print Bulk TC', actionId: 'tc-print' },
      { label: 'Report', actionId: 'tc-report' },
    ],
  },
  {
    id: 'COMMUNICATIONS',
    label: 'COMMUNICATIONS',
    icon: Mail,
    subItems: [
      { label: 'Bulk Broadcast', actionId: 'comm-broadcast' },
      { label: 'Templates', actionId: 'comm-templates' },
      { label: 'History Log', actionId: 'comm-history' },
    ],
  },
  {
    id: 'SETTINGS',
    label: 'SETTINGS',
    icon: Settings,
  },
  {
    id: 'ASSET',
    label: 'ASSET',
    icon: Boxes,
    subItems: [
      { label: 'Add', actionId: 'asset-add' },
      { label: 'Asset Admin', actionId: 'asset-admin' },
      { label: 'View', actionId: 'asset-view' },
      { label: 'Check Out', actionId: 'asset-checkout' },
      { label: 'Check In', actionId: 'asset-checkin' },
      { label: 'Dispose', actionId: 'asset-dispose' },
      { label: 'Report', actionId: 'asset-report' },
      { label: 'Import', actionId: 'asset-import' },
      { label: 'Bulk Update', actionId: 'asset-bulk-update' },
    ],
  },
  {
    id: 'SUPPLIES',
    label: 'SUPPLIES',
    icon: Package,
    subItems: [
      { label: 'Masters', actionId: 'supplies-masters' },
      { label: 'Add Item', actionId: 'supplies-add-item' },
      { label: 'Stock Entry', actionId: 'supplies-stock-entry' },
      { label: 'Billing', actionId: 'supplies-billing' },
      { label: 'Return/Dispose', actionId: 'supplies-return-dispose' },
      { label: 'Distribution', actionId: 'supplies-distribution' },
      { label: 'Report', actionId: 'supplies-report' },
    ],
  },
  {
    id: 'ID_CARDS',
    label: 'ID CARDS',
    icon: Printer,
    subItems: [
      { label: 'Student ID Studio', actionId: 'id-student' },
      { label: 'Staff ID Studio', actionId: 'id-staff' },
      { label: 'Evolis Primacy Config', actionId: 'id-printer-config' },
    ],
  },
];

export const PROFILE_MENU_ITEMS = [
  { label: 'Customize Logo & Colours', actionId: 'profile-customize-nav' },
  { label: 'User Activity', actionId: 'profile-user-activity' },
  { label: 'Parents Report', actionId: 'profile-parents-report' },
  { label: 'Parents Activity', actionId: 'profile-parents-activity' },
  { label: 'Quick SMS', actionId: 'profile-quick-sms' },
  { label: 'SMS Log', actionId: 'profile-sms-log' },
  { label: 'Extra Activities', actionId: 'profile-extra-activities' },
  { label: 'Change Password', actionId: 'profile-change-password' },
  { label: 'School Settings', actionId: 'profile-settings' },
  { label: 'Log Out', actionId: 'profile-logout' },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSection,
  onSelectSection,
  activeSubItem,
  onLogout,
  sessionSecondsRemaining = 900,
  userRole,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);

  const effectiveMenuItems = React.useMemo(() => {
    if (userRole === 'cashier') {
      return MENU_ITEMS.filter((item) => ['HOME', 'CANTEEN'].includes(item.id));
    }
    if (userRole === 'accountant') {
      return MENU_ITEMS.filter((item) => ['HOME', 'FEE MANAGEMENT', 'CANTEEN', 'MARKCHART'].includes(item.id));
    }
    if (userRole === 'teacher') {
      return MENU_ITEMS.filter((item) => ['HOME', 'STUDENT', 'ACADEMICS', 'MARKCHART', 'CANTEEN'].includes(item.id));
    }
    return MENU_ITEMS;
  }, [userRole]);

  // Logo & highlight color customizable state with localStorage persistence
  const [navSettings, setNavSettings] = useState<NavAppearanceSettings>(() => {
    try {
      const storedLogo = localStorage.getItem('leaders_school_logo');
      const storedHighlight = localStorage.getItem('leaders_menu_highlight');
      return {
        logoUrl: storedLogo || null,
        highlightColor: storedHighlight || '#D4AF37', // Default: Royal Gold
      };
    } catch {
      return {
        logoUrl: null,
        highlightColor: '#D4AF37',
      };
    }
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleSaveAppearance = (newSettings: NavAppearanceSettings) => {
    setNavSettings(newSettings);
    try {
      if (newSettings.logoUrl) {
        localStorage.setItem('leaders_school_logo', newSettings.logoUrl);
      } else {
        localStorage.removeItem('leaders_school_logo');
      }
      localStorage.setItem('leaders_menu_highlight', newSettings.highlightColor);
    } catch {
      // quota or local storage limitation fallback
    }
  };

  // Determine contrasting text color for active tab based on highlight background
  const isLightHighlight =
    navSettings.highlightColor.toLowerCase() === '#d4af37' ||
    navSettings.highlightColor.toLowerCase() === '#f59e0b' ||
    navSettings.highlightColor.toLowerCase() === '#eab308' ||
    navSettings.highlightColor.toLowerCase() === '#ffffff';

  const activeTextColor = isLightHighlight ? '#0B1F3A' : '#FFFFFF';

  return (
    <>
      <header className="bg-[#0B1F3A] border-b border-[#D4AF37]/30 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between h-14 sm:h-15 px-2 sm:px-4">
          {/* Official The Leaders Group of Schools Logo / Brand (Far Left) */}
          <div className="flex items-center gap-1.5 shrink-0 mr-1 sm:mr-3">
            <div
              onClick={() => setIsAppearanceModalOpen(true)}
              className="flex items-center cursor-pointer py-1 px-1.5 rounded-lg hover:bg-white/5 transition-all group relative"
              title="The Leaders Group of Schools (Click to change logo or menu colours)"
            >
              <LeadersSchoolLogo
                customLogoUrl={navSettings.logoUrl}
                variant="full"
                className="max-h-10"
              />
              <span className="hidden group-hover:flex items-center justify-center absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D4AF37] text-[#0B1F3A] shadow-xs" title="Change Logo">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </div>

            {/* Quick Logo & Menu Appearance Trigger Button */}
            <button
              onClick={() => setIsAppearanceModalOpen(true)}
              className="p-1.5 text-white/60 hover:text-[#D4AF37] hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Change Logo & Menu Highlight Colour"
              aria-label="Change Logo and Menu Highlight Colour"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scroll Left Button */}
          <button
            onClick={() => scrollNav('left')}
            className="p-1 text-white/70 hover:text-[#D4AF37] hover:bg-white/10 rounded-full transition-colors shrink-0"
            title="Scroll Left"
            aria-label="Scroll navigation left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable Navigation Menu Items */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 mx-1 py-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {effectiveMenuItems.map((item) => {
              const isActive = currentSection === item.id;
              const hasSub = item.subItems && item.subItems.length > 0;
              const isMenuOpen = openDropdown === item.id;

              return (
                <div
                  key={item.id}
                  className="relative shrink-0"
                  onMouseEnter={() => hasSub && setOpenDropdown(item.id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => {
                      onSelectSection(item.id, item.subItems?.[0]?.actionId);
                      if (hasSub) {
                        setOpenDropdown(isMenuOpen ? null : item.id);
                      } else {
                        setOpenDropdown(null);
                      }
                    }}
                    style={
                      isActive
                        ? {
                            backgroundColor: navSettings.highlightColor,
                            color: activeTextColor,
                          }
                        : undefined
                    }
                    className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1 text-[11px] sm:text-[12px] transition-all whitespace-nowrap rounded-t-md h-12 min-w-[56px] sm:min-w-[62px] cursor-pointer group ${
                      isActive
                        ? 'shadow-md font-bold'
                        : 'text-white/85 hover:text-white hover:bg-white/10 font-medium'
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 mb-0.5 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-current' : 'text-white/90 group-hover:text-[#D4AF37]'
                      }`}
                    />
                    <div className="flex items-center gap-0.5">
                      <span className="leading-tight tracking-tight uppercase text-[10px] sm:text-[11px]">
                        {item.label}
                      </span>
                      {hasSub && (
                        <ChevronDown
                          className={`w-2.5 h-2.5 ${
                            isActive ? 'text-current opacity-80' : 'text-white/70 group-hover:text-[#D4AF37]'
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Submenu Dropdown */}
                  {hasSub && isMenuOpen && (
                    <div className="absolute left-0 top-full bg-white shadow-2xl rounded-xl border border-slate-200 py-1.5 min-w-[200px] z-50 animate-in fade-in duration-150">
                      <div className="px-3.5 py-1.5 border-b border-slate-100 bg-[#0B1F3A] text-white rounded-t-lg flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-[#D4AF37] uppercase">
                          {item.label} DIRECTORY
                        </span>
                      </div>
                      {item.subItems!.map((sub) => {
                        const isSubActive = activeSubItem === sub.actionId;
                        return (
                          <button
                            key={sub.actionId}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectSection(item.id, sub.actionId);
                              setOpenDropdown(null);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isSubActive
                                ? 'bg-amber-50 text-[#0B1F3A] font-bold border-l-4 border-[#D4AF37]'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]'
                            }`}
                          >
                            <span>{sub.label}</span>
                            <span className="text-slate-400 text-[10px] font-mono">➔</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={() => scrollNav('right')}
            className="p-1 text-white/70 hover:text-[#D4AF37] hover:bg-white/10 rounded-full transition-colors shrink-0"
            title="Scroll Right"
            aria-label="Scroll navigation right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* User Profile on Far Right */}
          <div
            className="relative shrink-0 ml-1 sm:ml-2"
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
          >
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Account: admin_sethu (Dr. Sethu Ramanathan)"
              aria-label="User Account Menu"
            >
              <div className="w-8 h-8 rounded-full bg-white/15 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-semibold text-xs shadow-2xs">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden lg:inline text-xs font-semibold text-white/90">
                admin_sethu
              </span>
              <ChevronDown className="w-3 h-3 text-[#D4AF37] hidden lg:inline" />
            </button>

            {/* Profile Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full bg-white shadow-2xl rounded-xl border border-slate-200 py-1.5 min-w-[220px] z-50 animate-in fade-in duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100 bg-[#0B1F3A] text-white rounded-t-lg">
                  <p className="text-xs font-bold text-white">Dr. Sethu Ramanathan</p>
                  <p className="text-[11px] text-[#D4AF37]">The Leaders Group of Schools</p>
                </div>
                {PROFILE_MENU_ITEMS.map((sub) => {
                  const isLogout = sub.actionId === 'profile-logout';
                  return (
                    <button
                      key={sub.actionId}
                      onClick={() => {
                        setProfileOpen(false);
                        if (isLogout) {
                          onLogout();
                        } else if (sub.actionId === 'profile-customize-nav') {
                          setIsAppearanceModalOpen(true);
                        } else if (sub.actionId === 'profile-quick-sms') {
                          onSelectSection('CONTACT', 'contact-messaging');
                        } else if (sub.actionId === 'profile-settings') {
                          onSelectSection('SETTINGS');
                        } else {
                          onSelectSection('ADMIN');
                        }
                      }}
                      className={`w-full text-left px-3.5 py-1.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        isLogout
                          ? 'text-rose-600 font-bold hover:bg-rose-50 border-t border-slate-100 mt-1'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-[#0B1F3A]'
                      }`}
                    >
                      <span className={sub.actionId === 'profile-customize-nav' ? 'text-blue-700 font-bold flex items-center gap-1.5' : ''}>
                        {sub.actionId === 'profile-customize-nav' && <Palette className="w-3 h-3 text-[#D4AF37]" />}
                        {sub.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Interactive Appearance Modal for Changing Logo and Highlight Colour */}
      <NavAppearanceModal
        isOpen={isAppearanceModalOpen}
        onClose={() => setIsAppearanceModalOpen(false)}
        currentSettings={navSettings}
        onSaveSettings={handleSaveAppearance}
      />
    </>
  );
};
