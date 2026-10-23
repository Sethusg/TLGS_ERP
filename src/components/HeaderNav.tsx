import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { NavSection } from '../types';

interface HeaderNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  activeSubItem?: string;
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
      { label: 'Staff Report', actionId: 'staff-report' },
      { label: 'Bulk Update', actionId: 'staff-bulk-update' },
      { label: 'Staff Leave Apply', actionId: 'staff-leave-apply' },
      { label: 'Staff Leave Report', actionId: 'staff-leave-report' },
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
];

export const PROFILE_MENU_ITEMS = [
  { label: 'User Activity', actionId: 'profile-user-activity' },
  { label: 'Parents Report', actionId: 'profile-parents-report' },
  { label: 'Parents Activity', actionId: 'profile-parents-activity' },
  { label: 'Quick SMS', actionId: 'profile-quick-sms' },
  { label: 'SMS Log', actionId: 'profile-sms-log' },
  { label: 'Extra Activities', actionId: 'profile-extra-activities' },
  { label: 'Change Password', actionId: 'profile-change-password' },
  { label: 'Theme Change', actionId: 'profile-theme-change' },
  { label: 'Settings', actionId: 'profile-settings' },
  { label: 'Log Out', actionId: 'profile-logout' },
];

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSection,
  onSelectSection,
  activeSubItem,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollNav = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="flex items-center justify-between h-14 px-2 sm:px-4">
        {/* School Crest / Logo */}
        <div
          onClick={() => onSelectSection('HOME')}
          className="flex items-center gap-2 cursor-pointer shrink-0 mr-2 py-1 px-1.5 rounded-sm hover:bg-gray-50 transition-colors"
          title="The Learner's Academy CBSE - EduNiv"
        >
          <div className="w-9 h-9 border border-gray-200 rounded-sm overflow-hidden flex items-center justify-center bg-white shadow-2xs">
            <img
              src="/assets/aistudio/image_2fc1e42e.png"
              alt="Learner's Academy Crest"
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                // fallback styled emblem if image path isn't direct
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = `
                    <div class="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white font-serif text-[10px] leading-none font-bold">
                      <span>TLA</span>
                      <span class="text-[7px] text-pink-400">CBSE</span>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </div>

        {/* Scroll Left Button */}
        <button
          onClick={() => scrollNav('left')}
          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          title="Scroll Left"
          aria-label="Scroll navigation left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Navigation Items */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1 mx-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {MENU_ITEMS.map((item) => {
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
                  className={`flex flex-col items-center justify-center px-2.5 sm:px-3 py-1 text-[11px] sm:text-[12px] font-medium transition-all whitespace-nowrap rounded-t-sm h-12 min-w-[58px] ${
                    isActive
                      ? 'bg-[#e91e63] text-white shadow-xs font-semibold'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 mb-0.5 ${isActive ? 'text-white' : 'text-gray-600'}`}
                  />
                  <div className="flex items-center gap-0.5">
                    <span className="leading-tight tracking-tight uppercase text-[10px] sm:text-[11px]">
                      {item.label}
                    </span>
                    {hasSub && (
                      <ChevronDown
                        className={`w-2.5 h-2.5 opacity-60 ${isActive ? 'text-white' : 'text-gray-500'}`}
                      />
                    )}
                  </div>
                </button>

                {/* Submenu Dropdown */}
                {hasSub && isMenuOpen && (
                  <div className="absolute left-0 top-full bg-white shadow-xl rounded-md border border-gray-200 py-1.5 min-w-[190px] z-50 animate-in fade-in duration-150">
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
                          className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                            isSubActive
                              ? 'bg-pink-50 text-[#e91e63] font-semibold'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span>{sub.label}</span>
                          <span className="text-gray-400 text-[10px] font-mono">➔</span>
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
          className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors shrink-0"
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
            className="flex items-center gap-1.5 p-1 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            title="Account: admin_sethu (Dr. Sethu Ramanathan)"
            aria-label="User Account Menu"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden lg:inline text-xs font-medium text-gray-700">admin_sethu</span>
            <ChevronDown className="w-3 h-3 text-gray-400 hidden lg:inline" />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute right-0 top-full bg-white shadow-xl rounded-md border border-gray-200 py-1.5 min-w-[200px] z-50">
              <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-800">Dr. Sethu Ramanathan</p>
                <p className="text-[11px] text-gray-500">Super Admin (TLAC CBSE)</p>
              </div>
              {PROFILE_MENU_ITEMS.map((sub) => (
                <button
                  key={sub.actionId}
                  onClick={() => {
                    setProfileOpen(false);
                    if (sub.actionId === 'profile-quick-sms') {
                      onSelectSection('CONTACT', 'contact-messaging');
                    } else if (sub.actionId === 'profile-settings') {
                      onSelectSection('SETTINGS');
                    } else {
                      onSelectSection('ADMIN');
                    }
                  }}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-between"
                >
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
