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
  Lock,
  ShieldCheck,
  Database,
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

interface HeaderNavProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  onLogout: () => void;
  userRole?: string;
  onSwitchRole?: (role: ErpRole) => void;
  managedMenus?: ManagedMainMenu[];
  permissionMatrix?: RolePermissionMatrix;
  menuVisibility?: MenuVisibilityMap;
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
  userRole = 'Super Administrator',
  onSwitchRole,
  managedMenus,
  permissionMatrix = DEFAULT_ROLE_PERMISSIONS,
  menuVisibility = {},
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
  const { schools, academicYears, lockedSchoolId, lockedCampusId } =
    useSchoolContext();

  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedRole = normalizeLegacyRole(userRole);
  const roleDef = getRoleDefinition(normalizedRole);
  const allowSchoolSwitch = canSwitchSchool(normalizedRole) && !lockedSchoolId;
  const allowCampusSwitch =
    canSwitchCampus(normalizedRole) && !lockedCampusId && selectedSchoolId !== 'all';

  const activeSchool = useMemo(
    () =>
      selectedSchoolId === 'all'
        ? null
        : schools.find((s) => s.id === selectedSchoolId) || schools[0],
    [selectedSchoolId, schools]
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

  return (
    <header
      id="header-nav"
      className="sticky top-0 z-30 bg-white border-b border-slate-200/90 no-print"
    >
      <div className="h-16 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu + Multi-School Context Selectors */}
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
            <div className="relative flex items-center" title={allowSchoolSwitch ? 'Switch School Tenant' : `School-level isolation locked for ${normalizedRole}`}>
              {allowSchoolSwitch ? (
                <Building2 className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              )}
              <select
                aria-label="Select School"
                disabled={!allowSchoolSwitch}
                value={selectedSchoolId}
                onChange={(e) => onSchoolChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-[#F8FAFC] hover:bg-slate-100/80 disabled:opacity-80 disabled:cursor-not-allowed border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors appearance-none cursor-pointer max-w-[205px] truncate"
              >
                {allowSchoolSwitch && (
                  <option value="all">All Schools ({schools.length})</option>
                )}
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {/* Campus Selector */}
            <div className="relative flex items-center" title={allowCampusSwitch ? 'Switch Campus' : lockedCampusId ? `Campus-level restriction locked for ${normalizedRole}` : 'Select a specific school to filter by campus'}>
              {lockedCampusId ? (
                <Lock className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 pointer-events-none" />
              )}
              <select
                aria-label="Select Campus"
                disabled={!allowCampusSwitch}
                value={selectedCampusId}
                onChange={(e) => onCampusChange(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs font-medium text-slate-700 bg-[#F8FAFC] hover:bg-slate-100/80 disabled:opacity-75 disabled:cursor-not-allowed border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors appearance-none cursor-pointer max-w-[190px] truncate"
              >
                {activeSchool ? (
                  <>
                    {!lockedCampusId && (
                      <option value="all">
                        All Campuses ({activeSchool.campuses.length})
                      </option>
                    )}
                    {activeSchool.campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>
                        {campus.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="all">
                    All Campuses ({schools.reduce((a, s) => a + s.campuses.length, 0)})
                  </option>
                )}
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
                {academicYears.map((yr) => (
                  <option key={yr.id} value={yr.id}>
                    {yr.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>
          </div>

          <div className="xl:hidden min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[#0B1F3A] truncate">
              {activeSectionTitle}
            </p>
            <p className="text-[10.5px] text-slate-500 truncate">
              {activeSchool ? activeSchool.shortName : `All Schools (${schools.length})`}
            </p>
          </div>
        </div>

        {/* Right: Search, Utilities & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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
                          ERP Modules &amp; Pages
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
                          Students (Tenant Isolated)
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

          <button
            type="button"
            onClick={onOpenQuickAction}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Quick Action</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

          {/* User Profile & Instant 19-Role Switcher */}
          <div ref={profileContainerRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open user profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B1F3A] border border-[#D4AF37]/60 text-[#D4AF37] font-bold text-xs flex items-center justify-center shrink-0">
                {roleDef.sampleAccount.initials}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <p className="text-xs font-bold text-[#0B1F3A] max-w-[135px] truncate">
                  {roleDef.sampleAccount.fullName}
                </p>
                <p className="text-[10px] text-[#9A7418] font-semibold max-w-[135px] truncate">
                  {roleDef.role}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-[#0B1F3A] text-white border-b border-[#D4AF37]/30">
                  <p className="text-xs font-bold truncate">{roleDef.sampleAccount.fullName}</p>
                  <p className="text-[11px] text-[#D4AF37] font-semibold truncate">
                    {roleDef.role} · {roleDef.scope} Scope
                  </p>
                  <p className="text-[10px] text-slate-300 mt-1 truncate">
                    {activeSchool ? activeSchool.name : `All Schools (${schools.length})`}
                  </p>
                </div>

                {/* Live Role Switcher for Testing all 19 RBAC Roles */}
                {onSwitchRole && (
                  <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-slate-200/80">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Switch Active Role (19 RBAC Roles)
                    </label>
                    <select
                      value={normalizedRole}
                      onChange={(e) => {
                        onSwitchRole(e.target.value as ErpRole);
                        setProfileOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-white border border-slate-300 rounded-lg cursor-pointer"
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
                            : 'text-slate-700 hover:bg-[#F8FAFC] hover:text-[#0B1F3A]'
                        }`}
                      >
                        {item.actionId === 'profile-customize-nav' && (
                          <Palette className="w-3.5 h-3.5 text-[#9A7418]" />
                        )}
                        {item.actionId === 'profile-rbac' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#9A7418]" />
                        )}
                        {item.actionId === 'profile-db-schema' && (
                          <Database className="w-3.5 h-3.5 text-[#9A7418]" />
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

      {/* Responsive Mobile/Tablet Context Strip */}
      <div className="xl:hidden px-3 sm:px-5 py-2 bg-[#F8FAFC] border-t border-slate-200/80 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Building2 className="w-3.5 h-3.5 text-[#9A7418] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            aria-label="Select School Mobile"
            disabled={!allowSchoolSwitch}
            value={selectedSchoolId}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11.5px] font-semibold text-[#0B1F3A] bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer truncate disabled:opacity-75"
          >
            {allowSchoolSwitch && (
              <option value="all">All Schools ({schools.length})</option>
            )}
            {schools.map((school) => (
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
            disabled={!allowCampusSwitch}
            value={selectedCampusId}
            onChange={(e) => onCampusChange(e.target.value)}
            className="w-full pl-8 pr-6 py-1.5 text-[11.5px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer truncate disabled:opacity-75"
          >
            {activeSchool ? (
              <>
                {!lockedCampusId && (
                  <option value="all">All Campuses ({activeSchool.campuses.length})</option>
                )}
                {activeSchool.campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </>
            ) : (
              <option value="all">All Campuses</option>
            )}
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
            {academicYears.map((yr) => (
              <option key={yr.id} value={yr.id}>
                {yr.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </header>
  );
};

export const MENU_ITEMS = MAIN_ERP_MENUS;
