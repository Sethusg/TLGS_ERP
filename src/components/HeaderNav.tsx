import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  MapPin,
  Calendar,
  QrCode,
  Printer,
  RotateCw,
  Palette,
  LogOut,
  GraduationCap,
  Users,
  Compass,
  X,
  Plus,
} from 'lucide-react';
import { NavSection, Student, Staff } from '../types';
import {
  SCHOOL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
} from '../data/schoolContext';
import {
  MAIN_ERP_MENUS,
  PROFILE_MENU_ITEMS,
  getMenusForRole,
  getSectionDisplayTitle,
} from '../config/navigation';

interface HeaderNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  onLogout: () => void;
  userRole?: string;
  selectedSchoolId: string;
  onSchoolChange: (schoolId: string) => void;
  selectedCampusId: string;
  onCampusChange: (campusId: string) => void;
  selectedAcademicYearId: string;
  onAcademicYearChange: (yearId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  students: Student[];
  staffList: Staff[];
  onSelectStudent: (student: Student) => void;
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  onOpenQRScanner: () => void;
  onOpenQuickAction: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenMobileSidebar: () => void;
  onOpenAppearanceModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSection,
  onSelectSection,
  onLogout,
  userRole = 'admin',
  selectedSchoolId,
  onSchoolChange,
  selectedCampusId,
  onCampusChange,
  selectedAcademicYearId,
  onAcademicYearChange,
  searchQuery,
  onSearchChange,
  students,
  staffList,
  onSelectStudent,
  unreadNotifCount,
  onOpenNotifications,
  onOpenQRScanner,
  onOpenQuickAction,
  onRefresh,
  isRefreshing,
  onOpenMobileSidebar,
  onOpenAppearanceModal,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeSchool = useMemo(
    () => SCHOOL_OPTIONS.find((s) => s.id === selectedSchoolId) || SCHOOL_OPTIONS[0],
    [selectedSchoolId]
  );

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl/Cmd + K for global search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Global Search Results across Modules, Students, and Staff
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { modules: [], students: [], staff: [] };

    const allowedMenus = getMenusForRole(userRole);
    const modules: { label: string; subLabel: string; section: NavSection; subItem?: string }[] = [];
    allowedMenus.forEach((menu) => {
      if (
        menu.label.toLowerCase().includes(q) ||
        menu.description.toLowerCase().includes(q)
      ) {
        modules.push({
          label: menu.label,
          subLabel: menu.description,
          section: menu.subItems[0]?.targetSection || menu.id,
          subItem: menu.subItems[0]?.actionId,
        });
      }
      menu.subItems.forEach((sub) => {
        if (sub.label.toLowerCase().includes(q)) {
          modules.push({
            label: sub.label,
            subLabel: menu.label,
            section: sub.targetSection || menu.id,
            subItem: sub.actionId,
          });
        }
      });
    });

    const matchedStudents = students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.admissionNo.toLowerCase().includes(q) ||
          s.grade.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedStaff = staffList
      .filter(
        (st) =>
          st.name.toLowerCase().includes(q) ||
          st.empId.toLowerCase().includes(q) ||
          st.department.toLowerCase().includes(q) ||
          st.designation.toLowerCase().includes(q)
      )
      .slice(0, 4);

    return {
      modules: modules.slice(0, 5),
      students: matchedStudents,
      staff: matchedStaff,
    };
  }, [searchQuery, students, staffList, userRole]);

  const hasSearchResults =
    searchResults.modules.length > 0 ||
    searchResults.students.length > 0 ||
    searchResults.staff.length > 0;

  const roleProfile = useMemo(() => {
    switch (userRole) {
      case 'cashier':
        return { name: 'Raj Kumar', title: 'POS Cashier', initials: 'RK' };
      case 'accountant':
        return { name: 'Anita Subramanian', title: 'Chief Accountant', initials: 'AS' };
      case 'teacher':
        return { name: 'Malini Sundaram', title: 'Senior Faculty', initials: 'MS' };
      case 'manager':
        return { name: 'Vikram Rao', title: 'Operations Manager', initials: 'VR' };
      default:
        return { name: 'Dr. Sethu Ramanathan', title: 'Group Super Admin', initials: 'SR' };
    }
  }, [userRole]);

  const activeSectionTitle = getSectionDisplayTitle(currentSection);

  return (
    <header
      id="header-nav"
      className="sticky top-0 z-30 bg-white border-b border-slate-200/90 no-print"
    >
      {/* Primary Top Bar Row */}
      <div className="h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu + Institutional Selectors */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-[#0B1F3A] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Institutional Context Selectors */}
          <div className="hidden xl:flex items-center gap-2">
            {/* School Selector */}
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select School"
                value={selectedSchoolId}
                onChange={(e) => onSchoolChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors appearance-none cursor-pointer max-w-[205px] truncate"
              >
                {SCHOOL_OPTIONS.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* Campus Selector */}
            <div className="relative flex items-center">
              <MapPin className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Campus"
                value={selectedCampusId}
                onChange={(e) => onCampusChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors appearance-none cursor-pointer max-w-[190px] truncate"
              >
                <option value="all">All Campuses ({activeSchool.campuses.length})</option>
                {activeSchool.campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* Academic Year Selector */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              <select
                aria-label="Select Academic Year"
                value={selectedAcademicYearId}
                onChange={(e) => onAcademicYearChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-[#F8FAFC] hover:bg-slate-100/80 border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors appearance-none cursor-pointer tabular-nums"
              >
                {ACADEMIC_YEAR_OPTIONS.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          {/* Compact Section Title on < xl screens */}
          <div className="xl:hidden min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[#0B1F3A] truncate">
              {activeSectionTitle}
            </p>
            <p className="text-[10.5px] text-slate-500 truncate">
              {activeSchool.shortName}
            </p>
          </div>
        </div>

        {/* Center/Right: Global Search + Action Icons + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global Search Input + Live Results Popover */}
          <div ref={searchContainerRef} className="relative hidden md:block w-52 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search modules, students, staff..."
              aria-label="Global ERP Search"
              className="w-full pl-8 pr-12 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 pointer-events-none">
                ⌘K
              </span>
            )}

            {/* Instant Search Results Dropdown */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50">
                {!hasSearchResults ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No matching modules, students, or staff for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                    {searchResults.modules.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          ERP Modules & Pages
                        </div>
                        {searchResults.modules.map((mod, idx) => (
                          <button
                            key={`${mod.section}-${mod.subItem}-${idx}`}
                            type="button"
                            onClick={() => {
                              onSelectSection(mod.section, mod.subItem);
                              setSearchFocused(false);
                              onSearchChange('');
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F8FAFC] flex items-center gap-2.5 cursor-pointer"
                          >
                            <Compass className="w-4 h-4 text-[#9A7418] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                                {mod.label}
                              </p>
                              <p className="text-[10.5px] text-slate-500 truncate">
                                {mod.subLabel}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.students.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Students
                        </div>
                        {searchResults.students.map((std) => (
                          <button
                            key={std.id}
                            type="button"
                            onClick={() => {
                              onSelectStudent(std);
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <GraduationCap className="w-4 h-4 text-[#0B1F3A] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                                  {std.name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 truncate">
                                  {std.grade} · Sec {std.section} · {std.admissionNo}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              Dossier
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.staff.length > 0 && (
                      <div className="p-2">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Staff Directory
                        </div>
                        {searchResults.staff.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => {
                              onSelectSection('STAFFS', 'staff-info');
                              setSearchFocused(false);
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                                  {st.name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 truncate">
                                  {st.designation} · {st.department}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {st.empId}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Utility Icon Buttons */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="QR Optical Check-In Scanner"
            aria-label="Open QR Scanner"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="Print Current View"
            aria-label="Print current view"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="hidden sm:flex p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="Refresh View"
            aria-label="Refresh ERP data"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#9A7418]' : ''}`} />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0B1F3A] text-[#D4AF37] border border-[#D4AF37]/60 text-[9.5px] font-bold tabular-nums flex items-center justify-center">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Quick Action Primary CTA */}
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Quick Action</span>
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* User Profile Menu */}
          <div ref={profileContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open user profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] border border-[#D4AF37]/60 text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                {roleProfile.initials}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-[#0B1F3A] max-w-[125px] truncate">
                  {roleProfile.name}
                </p>
                <p className="text-[10px] text-slate-500 max-w-[125px] truncate">
                  {roleProfile.title}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-[#0B1F3A] text-white border-b border-[#D4AF37]/30">
                  <p className="text-xs font-bold truncate">{roleProfile.name}</p>
                  <p className="text-[11px] text-[#D4AF37] truncate">{roleProfile.title}</p>
                  <p className="text-[10px] text-slate-300 mt-1 truncate">
                    {activeSchool.name}
                  </p>
                </div>

                <div className="py-1.5">
                  {PROFILE_MENU_ITEMS.map((item) => {
                    const isLogout = item.actionId === 'profile-logout';
                    return (
                      <button
                        key={item.actionId}
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          if (isLogout) {
                            onLogout();
                          } else if (item.actionId === 'profile-customize-nav') {
                            onOpenAppearanceModal();
                          } else if (item.actionId === 'profile-org') {
                            onSelectSection('ORGANIZATION', 'org-trusts');
                          } else if (item.actionId === 'profile-quick-sms') {
                            onSelectSection('COMMUNICATIONS', 'comm-broadcast');
                          } else if (item.actionId === 'profile-reports') {
                            onSelectSection('REPORTS', 'rep-executive');
                          } else if (item.actionId === 'profile-settings') {
                            onSelectSection('SETTINGS', 'settings-general');
                          } else {
                            onSelectSection('SETTINGS', 'admin-audit');
                          }
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                          isLogout
                            ? 'text-rose-600 font-semibold hover:bg-rose-50 border-t border-slate-100 mt-1 pt-2.5'
                            : 'text-slate-700 hover:bg-[#F8FAFC] hover:text-[#0B1F3A]'
                        }`}
                      >
                        {item.actionId === 'profile-customize-nav' && (
                          <Palette className="w-3.5 h-3.5 text-[#9A7418]" />
                        )}
                        {isLogout && <LogOut className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Institutional Context Strip (< xl screens) so School, Campus, Year & Search remain effortless on tablets and phones */}
      <div className="xl:hidden px-3 sm:px-5 py-2 bg-[#F8FAFC] border-t border-slate-200/80 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Building2 className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            aria-label="Select School Mobile"
            value={selectedSchoolId}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11.5px] font-semibold text-[#0B1F3A] bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer truncate"
          >
            {SCHOOL_OPTIONS.map((school) => (
              <option key={school.id} value={school.id}>
                {school.shortName}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[140px]">
          <MapPin className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            aria-label="Select Campus Mobile"
            value={selectedCampusId}
            onChange={(e) => onCampusChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11.5px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer truncate"
          >
            <option value="all">All Campuses ({activeSchool.campuses.length})</option>
            {activeSchool.campuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="relative min-w-[120px]">
          <Calendar className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            aria-label="Select Academic Year Mobile"
            value={selectedAcademicYearId}
            onChange={(e) => onAcademicYearChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11.5px] font-semibold text-[#0B1F3A] bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer tabular-nums"
          >
            {ACADEMIC_YEAR_OPTIONS.map((yr) => (
              <option key={yr.id} value={yr.id}>
                {yr.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Mobile Search Bar with Live Dropdown Results */}
        <div className="relative md:hidden w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setSearchFocused(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.modules[0]) {
                onSelectSection(
                  searchResults.modules[0].section,
                  searchResults.modules[0].subItem
                );
                onSearchChange('');
                setSearchFocused(false);
              }
            }}
            placeholder="Search ERP modules, students, staff..."
            aria-label="Mobile Global ERP Search"
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Clear mobile search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50">
              {!hasSearchResults ? (
                <div className="px-4 py-5 text-center text-xs text-slate-500">
                  No matching results for &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.modules.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Modules
                      </div>
                      {searchResults.modules.map((mod, idx) => (
                        <button
                          key={`m-${mod.section}-${mod.subItem}-${idx}`}
                          type="button"
                          onClick={() => {
                            onSelectSection(mod.section, mod.subItem);
                            setSearchFocused(false);
                            onSearchChange('');
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] flex items-center gap-2 cursor-pointer"
                        >
                          <Compass className="w-3.5 h-3.5 text-[#9A7418] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                              {mod.label}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate">
                              {mod.subLabel}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.students.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Students
                      </div>
                      {searchResults.students.map((std) => (
                        <button
                          key={`ms-${std.id}`}
                          type="button"
                          onClick={() => {
                            onSelectStudent(std);
                            setSearchFocused(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                              {std.name}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate">
                              {std.grade} · {std.admissionNo}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            View
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.staff.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Staff
                      </div>
                      {searchResults.staff.map((st) => (
                        <button
                          key={`mst-${st.id}`}
                          type="button"
                          onClick={() => {
                            onSelectSection('STAFFS', 'staff-info');
                            setSearchFocused(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#F8FAFC] flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                              {st.name}
                            </p>
                            <p className="text-[10.5px] text-slate-500 truncate">
                              {st.designation}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {st.empId}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Re-export MENU_ITEMS alias for backwards compatibility if referenced elsewhere
export const MENU_ITEMS = MAIN_ERP_MENUS;
