import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  Building2,
  School,
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
  Lock,
  ShieldCheck,
  Database,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ErpRole,
  ManagedMainMenu,
  MenuVisibilityMap,
  NavSection,
  RolePermissionMatrix,
  Staff,
  Student,
} from '../types';
import {
  MAIN_ERP_MENUS,
  PROFILE_MENU_ITEMS,
  getMenusForRole,
  getVisibleSidebarMenus,
  getSectionDisplayTitle,
} from '../config/navigation';
import {
  ALL_ERP_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  canSwitchCampus,
  canSwitchSchool,
  getRoleDefinition,
  normalizeLegacyRole,
} from '../config/rbac';
import { useSchoolContext } from '../contexts/SchoolContext';
import { PWAInstallButton } from './Common/PWAInstallControls';

interface HeaderNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  onLogout: () => void;
  userRole?: string;
  currentUser?: {
    fullName: string;
    username: string;
    email: string;
    role: string;
  } | null;
  onSwitchRole?: (role: ErpRole) => void;
  managedMenus?: ManagedMainMenu[];
  permissionMatrix?: RolePermissionMatrix;
  menuVisibility?: MenuVisibilityMap;
  selectedOrganizationId: string;
  onOrganizationChange: (orgId: string) => void;
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
  isSlideOverMode?: boolean;
  onOpenAppearanceModal: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentSection,
  onSelectSection,
  onLogout,
  userRole = 'Super Administrator',
  currentUser,
  onSwitchRole,
  managedMenus,
  permissionMatrix = DEFAULT_ROLE_PERMISSIONS,
  menuVisibility = {},
  selectedOrganizationId,
  onOrganizationChange,
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
  isSlideOverMode = false,
  onOpenAppearanceModal,
}) => {
  const {
    organizations,
    filteredSchools,
    schools,
    academicYears,
    lockedSchoolId,
    lockedCampusId,
  } = useSchoolContext();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const normalizedRole = normalizeLegacyRole(userRole);
  const roleDef = getRoleDefinition(normalizedRole);
  const displayFullName =
    currentUser?.fullName?.trim() || currentUser?.username || roleDef.role;
  const displayInitials = useMemo(() => {
    const parts = displayFullName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return roleDef.shortCode.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [displayFullName, roleDef.shortCode]);
  const allowOrgSwitch = canSwitchSchool(normalizedRole) && !lockedSchoolId;
  const allowSchoolSwitch = canSwitchSchool(normalizedRole) && !lockedSchoolId;
  const allowCampusSwitch =
    canSwitchCampus(normalizedRole) && !lockedCampusId && selectedSchoolId !== 'all';

  const activeOrganization = useMemo(
    () =>
      selectedOrganizationId === 'all'
        ? null
        : organizations.find((o) => o.id === selectedOrganizationId) || null,
    [selectedOrganizationId, organizations]
  );

  const activeSchool = useMemo(
    () =>
      selectedSchoolId === 'all'
        ? null
        : schools.find((s) => s.id === selectedSchoolId) || schools[0] || null,
    [selectedSchoolId, schools]
  );

  const activeCampus = useMemo(
    () =>
      !activeSchool || selectedCampusId === 'all'
        ? null
        : activeSchool.campuses.find((c) => c.id === selectedCampusId) || null,
    [activeSchool, selectedCampusId]
  );

  const activeAcademicYear = useMemo(
    () => academicYears.find((y) => y.id === selectedAcademicYearId) || academicYears[0] || null,
    [academicYears, selectedAcademicYearId]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedOrganizationId !== 'all') count += 1;
    if (selectedSchoolId !== 'all') count += 1;
    if (selectedCampusId !== 'all') count += 1;
    return count;
  }, [selectedOrganizationId, selectedSchoolId, selectedCampusId]);

  // Live Date & Time Display (ticks every 30s)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const formattedDate = useMemo(
    () =>
      now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [now]
  );
  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    [now]
  );

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktopSearch =
        searchContainerRef.current && searchContainerRef.current.contains(target);
      const insideMobileSearch =
        mobileSearchContainerRef.current &&
        mobileSearchContainerRef.current.contains(target);

      if (!insideDesktopSearch && !insideMobileSearch) {
        setSearchFocused(false);
      }
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(target)
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
        if (window.innerWidth < 768) {
          setMobileFiltersOpen(false);
          setMobileSearchOpen(true);
          window.setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
        } else {
          searchInputRef.current?.focus();
        }
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setProfileOpen(false);
        setMobileFiltersOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { modules: [], students: [], staff: [] };

    const allowedMenus =
      managedMenus && managedMenus.length > 0
        ? getVisibleSidebarMenus(
            managedMenus,
            normalizedRole,
            permissionMatrix,
            selectedSchoolId,
            selectedCampusId
          )
        : getMenusForRole(normalizedRole, permissionMatrix, menuVisibility);
    const modules: {
      label: string;
      subLabel: string;
      section: NavSection;
      subItem?: string;
    }[] = [];
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
      modules: modules.slice(0, 6),
      students: matchedStudents,
      staff: matchedStaff,
    };
  }, [
    searchQuery,
    students,
    staffList,
    normalizedRole,
    managedMenus,
    permissionMatrix,
    menuVisibility,
    selectedSchoolId,
    selectedCampusId,
  ]);

  const hasSearchResults =
    searchResults.modules.length > 0 ||
    searchResults.students.length > 0 ||
    searchResults.staff.length > 0;

  const activeSectionTitle = getSectionDisplayTitle(currentSection);

  const renderSearchResultsPopover = (isMobile = false) => {
    if (!searchFocused || searchQuery.trim().length === 0) return null;

    return (
      <div
        className={`absolute ${
          isMobile ? 'left-0 right-0 mt-2' : 'right-0 mt-2 w-80 sm:w-96'
        } bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50`}
      >
        {!hasSearchResults ? (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            No matching modules, students, or staff for &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {searchResults.modules.length > 0 && (
              <div className="p-2">
                <div className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-400">
                  ERP Modules &amp; Pages
                </div>
                {searchResults.modules.map((mod, idx) => (
                  <button
                    key={`${mod.section}-${mod.subItem}-${idx}`}
                    type="button"
                    onClick={() => {
                      onSelectSection(mod.section, mod.subItem);
                      setSearchFocused(false);
                      setMobileSearchOpen(false);
                      onSearchChange('');
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F4F6FA] flex items-center gap-2.5 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#3978F6] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#10213D] truncate">
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
                <div className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-400">
                  Students (Tenant Isolated)
                </div>
                {searchResults.students.map((std) => (
                  <button
                    key={std.id}
                    type="button"
                    onClick={() => {
                      onSelectStudent(std);
                      setSearchFocused(false);
                      setMobileSearchOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F4F6FA] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <GraduationCap className="w-4 h-4 text-[#00B8A9] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#10213D] truncate">
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
                <div className="px-2.5 py-1 text-[10.5px] font-semibold text-slate-400">
                  Staff Directory
                </div>
                {searchResults.staff.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      onSelectSection('STAFFS', 'staff-info');
                      setSearchFocused(false);
                      setMobileSearchOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#F4F6FA] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Users className="w-4 h-4 text-[#7B42F6] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#10213D] truncate">
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
    );
  };

  return (
    <header
      id="header-nav"
      className="sticky top-0 z-30 no-print shadow-[0_4px_18px_rgba(95,34,217,0.14)]"
    >
      {/* Tier 1: Signature Purple-to-Pink Gradient Main Header Bar */}
      <div className="erp-header-gradient min-h-[60px] sm:min-h-[64px] px-3 sm:px-5 xl:px-6 flex items-center justify-between gap-2 sm:gap-3 xl:gap-4 text-white">
        {/* Left Zone: Navigation Trigger + Visually Separated Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className={`${
              isSlideOverMode ? 'flex' : 'flex lg:hidden'
            } items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg text-white bg-white/14 hover:bg-white/24 border border-white/25 backdrop-blur-md transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
            aria-label="Open navigation menu"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1
              className="text-base sm:text-lg xl:text-[19px] font-bold tracking-tight text-white truncate leading-snug"
              title={activeSectionTitle}
            >
              {activeSectionTitle}
            </h1>
          </div>
        </div>

        {/* Right Zone: Search, Mobile Filter Toggle, Utilities, Notifications, Quick Action & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0">
          {/* Desktop / Tablet Global Search */}
          <div
            ref={searchContainerRef}
            className="relative hidden md:flex items-center w-40 lg:w-36 xl:w-56 2xl:w-64 shrink-0"
          >
            <Search
              className="w-3.5 h-3.5 text-white/85 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search ERP..."
              aria-label="Global ERP Search"
              className="w-full h-9 pl-9 pr-9 text-xs bg-white/15 border border-white/25 rounded-lg text-white placeholder:text-white/75 focus:outline-none focus:bg-white/25 focus:border-white/45 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-white/80 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/75 pointer-events-none"
                aria-hidden="true"
              >
                ⌘K
              </span>
            )}

            {renderSearchResultsPopover(false)}
          </div>

          {/* Mobile Search Toggle (< 768px) */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen((prev) => {
                const next = !prev;
                if (next) {
                  setMobileFiltersOpen(false);
                  window.setTimeout(() => mobileSearchInputRef.current?.focus(), 40);
                }
                return next;
              });
            }}
            className={`flex md:hidden items-center justify-center w-9 h-9 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              mobileSearchOpen
                ? 'bg-white text-[#6524D1] border-white'
                : 'bg-white/14 hover:bg-white/24 text-white border-white/25'
            }`}
            aria-label="Toggle ERP search"
            aria-expanded={mobileSearchOpen}
            title="Search ERP"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Responsive Collapsible Filters Toggle (< 1024px) */}
          <button
            type="button"
            onClick={() => {
              setMobileFiltersOpen((prev) => {
                const next = !prev;
                if (next) setMobileSearchOpen(false);
                return next;
              });
            }}
            className={`relative inline-flex lg:hidden items-center justify-center gap-1.5 w-9 sm:w-auto h-9 sm:px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
              mobileFiltersOpen
                ? 'bg-white text-[#6524D1] border-white shadow-xs'
                : 'bg-white/14 hover:bg-white/24 text-white border-white/25'
            }`}
            aria-label="Toggle institutional filters"
            aria-expanded={mobileFiltersOpen}
            aria-controls="erp-context-filter-bar"
            title="Organization, School, Campus & Academic Year Filters"
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 sm:static min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums inline-flex items-center justify-center pointer-events-none ${
                  mobileFiltersOpen
                    ? 'bg-[#6524D1] text-white'
                    : 'bg-[#FDB022] text-[#10213D]'
                }`}
              >
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 hidden sm:block shrink-0 transition-transform duration-200 ${
                mobileFiltersOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {/* Utility Actions (Desktop) */}
          <button
            type="button"
            onClick={onOpenQRScanner}
            className="hidden xl:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/90 hover:text-white hover:bg-white/18 border border-transparent hover:border-white/20 transition-colors cursor-pointer shrink-0"
            title="QR Optical Check-In Scanner"
            aria-label="Open QR Scanner"
          >
            <QrCode className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="hidden xl:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/90 hover:text-white hover:bg-white/18 border border-transparent hover:border-white/20 transition-colors cursor-pointer shrink-0"
            title="Print Current View"
            aria-label="Print current view"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-white/90 hover:text-white hover:bg-white/18 border border-transparent hover:border-white/20 transition-colors cursor-pointer shrink-0"
            title="Refresh Dashboard & Data"
            aria-label="Refresh ERP data"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Notification Icon & Unread Count */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-white hover:bg-white/18 border border-transparent hover:border-white/20 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            title={`Notifications (${unreadNotifCount} unread)`}
            aria-label={`Open notifications, ${unreadNotifCount} unread`}
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FDB022] text-[#10213D] text-[10px] font-extrabold tabular-nums flex items-center justify-center shadow-xs ring-2 ring-[#DE2988] pointer-events-none">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Chrome/Edge Install App or Windows 11 Desktop App Center */}
          <PWAInstallButton
            variant="header"
            onOpenDesktopCenter={() => onSelectSection('SETTINGS', 'settings-desktop')}
          />

          {/* Quick Action Button (Accessible at All Viewports) */}
          <button
            type="button"
            onClick={onOpenQuickAction}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-2.5 sm:px-3.5 rounded-lg bg-white text-[#6524D1] hover:bg-white/95 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Quick Action"
            title="Quick Action"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {/* User Profile & Role Dropdown */}
          <div ref={profileContainerRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 h-10 pl-1 pr-1.5 sm:pr-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Open user profile menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 rounded-full bg-[#FDB022] text-[#10213D] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {displayInitials}
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight min-w-0 max-w-[116px] xl:max-w-[148px]">
                <span className="text-xs font-bold text-white truncate">
                  {displayFullName}
                </span>
                <span className="text-[10.5px] text-white/85 font-medium truncate">
                  {roleDef.role}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/90 hidden sm:block shrink-0 transition-transform duration-200 ${
                  profileOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white text-slate-900 rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50"
              >
                <div className="erp-profile-card-gradient px-4 py-3 text-white">
                  <p className="text-xs font-bold truncate">
                    {displayFullName}
                  </p>
                  <p className="text-[11px] text-amber-200 font-semibold truncate">
                    {roleDef.role} · {roleDef.scope} Scope
                  </p>
                  <p className="text-[10px] text-white/80 mt-1 truncate">
                    {activeSchool
                      ? activeSchool.name
                      : `All Schools (${filteredSchools.length})`}
                  </p>
                </div>

                {/* Role Switcher for Testing RBAC Isolation */}
                {onSwitchRole && (
                  <div className="px-3.5 py-2.5 bg-[#F4F6FA] border-b border-slate-200/80">
                    <label
                      htmlFor="erp-role-switcher"
                      className="block text-[10.5px] font-semibold text-slate-500 mb-1"
                    >
                      Switch Active Role (RBAC Preview)
                    </label>
                    <select
                      id="erp-role-switcher"
                      value={normalizedRole}
                      onChange={(e) => {
                        onSwitchRole(e.target.value as ErpRole);
                        setProfileOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-[#10213D] bg-white border border-slate-300 rounded-lg cursor-pointer"
                    >
                      {ALL_ERP_ROLES.map((def) => (
                        <option key={def.role} value={def.role}>
                          {def.index}. {def.role} ({def.scope})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="py-1.5">
                  {PROFILE_MENU_ITEMS.map((item) => {
                    const isLogout = item.actionId === 'profile-logout';
                    return (
                      <button
                        key={item.actionId}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setProfileOpen(false);
                          if (isLogout) {
                            onLogout();
                          } else if (item.actionId === 'profile-customize-nav') {
                            onOpenAppearanceModal();
                          } else if (item.actionId === 'profile-org') {
                            onSelectSection('ORGANIZATION', 'org-profile');
                          } else if (item.actionId === 'profile-rbac') {
                            onSelectSection('ADMIN', 'admin-permissions');
                          } else if (item.actionId === 'profile-db-schema') {
                            onSelectSection('ADMIN', 'admin-database-schema');
                          } else if (item.actionId === 'profile-reports') {
                            onSelectSection('REPORTS', 'rep-executive');
                          } else {
                            onSelectSection('ADMIN', 'admin-login-history');
                          }
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                          isLogout
                            ? 'text-rose-600 font-semibold hover:bg-rose-50 border-t border-slate-100 mt-1 pt-2.5'
                            : 'text-slate-700 hover:bg-[#F4F6FA] hover:text-[#10213D]'
                        }`}
                      >
                        {item.actionId === 'profile-customize-nav' && (
                          <Palette className="w-3.5 h-3.5 text-[#7B42F6] shrink-0" />
                        )}
                        {item.actionId === 'profile-rbac' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#1D7AFC] shrink-0" />
                        )}
                        {item.actionId === 'profile-db-schema' && (
                          <Database className="w-3.5 h-3.5 text-[#00B8A9] shrink-0" />
                        )}
                        {isLogout && (
                          <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Mobile Search Drawer (< 768px) */}
      {mobileSearchOpen && (
        <div
          ref={mobileSearchContainerRef}
          className="md:hidden px-3 py-2.5 bg-white border-b border-slate-200/90"
        >
          <div className="relative flex items-center">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search modules, students, or staff..."
              aria-label="Search ERP on mobile"
              className="w-full h-10 pl-9 pr-9 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg text-[#10213D] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#6524D1] focus:ring-2 focus:ring-[#6524D1]/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Clear mobile search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {renderSearchResultsPopover(true)}
          </div>
        </div>
      )}

      {/* Tier 2: Dedicated Institutional Context Filter Bar (Single Non-Duplicated Render)
          - Always visible on Desktop (>= 1024px) in a clean Flexbox row separated from the title
          - Smoothly collapsible on Tablet/Mobile (< 1024px) via the Filters toggle button */}
      <div
        id="erp-context-filter-bar"
        className={`${
          mobileFiltersOpen ? 'block' : 'hidden'
        } lg:block bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-5 lg:px-6 py-2.5`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Independent Flex Containers for Organization, School, Campus & Academic Year */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 lg:gap-3 flex-1 min-w-0">
            {/* 1. Organization Selector */}
            <div
              className="flex items-center gap-2.5 min-w-0 basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-0 lg:flex-1 xl:max-w-[300px] h-10 px-3 rounded-lg bg-[#F8FAFC] border border-slate-200/90 hover:border-slate-300 focus-within:border-[#6524D1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6524D1]/15 transition-all"
              title={
                allowOrgSwitch
                  ? activeOrganization
                    ? `Organization: ${activeOrganization.name}`
                    : `Organization: All Organizations (${organizations.length})`
                  : `Organization locked for ${normalizedRole}`
              }
            >
              <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                {allowOrgSwitch ? (
                  <Building2 className="w-4 h-4 text-[#7B42F6]" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-600" />
                )}
              </span>
              <div className="relative flex-1 min-w-0 flex items-center h-full">
                <select
                  aria-label="Select Organization"
                  disabled={!allowOrgSwitch}
                  value={selectedOrganizationId}
                  onChange={(e) => onOrganizationChange(e.target.value)}
                  className="erp-header-select w-full h-full pr-6 bg-transparent text-xs font-semibold text-[#10213D] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none"
                >
                  {allowOrgSwitch && (
                    <option value="all" className="text-[#10213D]">
                      All Organizations ({organizations.length})
                    </option>
                  )}
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} className="text-[#10213D]">
                      {org.shortName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* 2. School Selector */}
            <div
              className="flex items-center gap-2.5 min-w-0 basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-0 lg:flex-1 xl:max-w-[300px] h-10 px-3 rounded-lg bg-[#F8FAFC] border border-slate-200/90 hover:border-slate-300 focus-within:border-[#6524D1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6524D1]/15 transition-all"
              title={
                allowSchoolSwitch
                  ? activeSchool
                    ? `School: ${activeSchool.name}`
                    : `School: All Schools (${filteredSchools.length})`
                  : `School locked for ${normalizedRole}`
              }
            >
              <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                {allowSchoolSwitch ? (
                  <School className="w-4 h-4 text-[#1D7AFC]" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-600" />
                )}
              </span>
              <div className="relative flex-1 min-w-0 flex items-center h-full">
                <select
                  aria-label="Select School"
                  disabled={!allowSchoolSwitch}
                  value={selectedSchoolId}
                  onChange={(e) => onSchoolChange(e.target.value)}
                  className="erp-header-select w-full h-full pr-6 bg-transparent text-xs font-semibold text-[#10213D] cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none"
                >
                  {allowSchoolSwitch && (
                    <option value="all" className="text-[#10213D]">
                      All Schools ({filteredSchools.length})
                    </option>
                  )}
                  {filteredSchools.map((school) => (
                    <option key={school.id} value={school.id} className="text-[#10213D]">
                      {school.shortName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* 3. Campus Selector */}
            <div
              className="flex items-center gap-2.5 min-w-0 basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-0 lg:flex-1 xl:max-w-[280px] h-10 px-3 rounded-lg bg-[#F8FAFC] border border-slate-200/90 hover:border-slate-300 focus-within:border-[#6524D1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6524D1]/15 transition-all"
              title={
                allowCampusSwitch
                  ? activeCampus
                    ? `Campus: ${activeCampus.name}`
                    : 'Switch Campus'
                  : lockedCampusId
                  ? `Campus locked for ${normalizedRole}`
                  : 'Select a specific school to filter by campus'
              }
            >
              <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                {lockedCampusId ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <MapPin className="w-4 h-4 text-[#00B8A9]" />
                )}
              </span>
              <div className="relative flex-1 min-w-0 flex items-center h-full">
                <select
                  aria-label="Select Campus"
                  disabled={!allowCampusSwitch}
                  value={selectedCampusId}
                  onChange={(e) => onCampusChange(e.target.value)}
                  className="erp-header-select w-full h-full pr-6 bg-transparent text-xs font-semibold text-[#10213D] cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed focus:outline-none"
                >
                  {activeSchool ? (
                    <>
                      {!lockedCampusId && (
                        <option value="all" className="text-[#10213D]">
                          All Campuses ({activeSchool.campuses.length})
                        </option>
                      )}
                      {activeSchool.campuses.map((campus) => (
                        <option key={campus.id} value={campus.id} className="text-[#10213D]">
                          {campus.name}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value="all" className="text-[#10213D]">
                      All Campuses ({filteredSchools.reduce((a, s) => a + s.campuses.length, 0)})
                    </option>
                  )}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* 4. Academic Year Selector */}
            <div
              className="flex items-center gap-2.5 min-w-0 basis-full sm:basis-[calc(50%-0.375rem)] lg:basis-[168px] xl:basis-[190px] lg:shrink-0 h-10 px-3 rounded-lg bg-[#F8FAFC] border border-slate-200/90 hover:border-slate-300 focus-within:border-[#6524D1] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#6524D1]/15 transition-all"
              title={
                activeAcademicYear
                  ? `Academic Year: ${activeAcademicYear.label}`
                  : 'Select Academic Year'
              }
            >
              <span className="shrink-0 flex items-center justify-center" aria-hidden="true">
                <Calendar className="w-4 h-4 text-[#F97316]" />
              </span>
              <div className="relative flex-1 min-w-0 flex items-center h-full">
                <select
                  aria-label="Select Academic Year"
                  value={selectedAcademicYearId}
                  onChange={(e) => onAcademicYearChange(e.target.value)}
                  className="erp-header-select w-full h-full pr-6 bg-transparent text-xs font-semibold text-[#10213D] cursor-pointer tabular-nums focus:outline-none"
                >
                  {academicYears.length === 0 ? (
                    <option value="" className="text-[#10213D]">
                      No Academic Year
                    </option>
                  ) : (
                    academicYears.map((yr) => (
                      <option key={yr.id} value={yr.id} className="text-[#10213D]">
                        {yr.label}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 shrink-0"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {/* Live Date & Time Readout (Right-Aligned on Wide Desktop >= 1536px) */}
          <div
            className="hidden 2xl:flex items-center gap-2 h-10 px-3 rounded-lg bg-[#F8FAFC] border border-slate-200/90 text-xs text-slate-600 shrink-0"
            title="Current institutional date and local time"
          >
            <Clock className="w-3.5 h-3.5 text-[#6524D1] shrink-0" aria-hidden="true" />
            <span className="font-medium whitespace-nowrap">{formattedDate}</span>
            <span className="text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="font-mono font-semibold text-[#10213D] tabular-nums whitespace-nowrap">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Mobile/Tablet Quick Utility Row inside Collapsible Filter Panel (< 640px) */}
        <div className="flex sm:hidden items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 truncate">
            {formattedDate} · <span className="font-mono tabular-nums">{formattedTime}</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-[#F4F6FA] hover:bg-slate-200/70 text-[#10213D] text-[11px] font-semibold cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg bg-[#6524D1] text-white text-[11px] font-semibold cursor-pointer"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const MENU_ITEMS = MAIN_ERP_MENUS;
