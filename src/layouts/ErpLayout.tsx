import React from 'react';
import {
  ErpRole,
  ManagedMainMenu,
  MenuVisibilityMap,
  NavSection,
  RolePermissionMatrix,
  Student,
  Staff,
} from '../types';
import { SidebarNav } from '../components/SidebarNav';
import { HeaderNav } from '../components/HeaderNav';
import { NavAppearanceSettings } from '../components/Modals/NavAppearanceModal';
import { useSchoolContext } from '../contexts/SchoolContext';

interface ErpLayoutProps {
  currentSection: NavSection;
  activeSubItem?: string;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  onLogout: () => void;
  userRole: ErpRole;
  currentUser?: {
    fullName: string;
    username: string;
    email: string;
    role: string;
  } | null;
  onSwitchRole?: (role: ErpRole) => void;
  managedMenus: ManagedMainMenu[];
  permissionMatrix: RolePermissionMatrix;
  menuVisibility: MenuVisibilityMap;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  isMobileSidebarOpen: boolean;
  onOpenMobileSidebar: () => void;
  onCloseMobileSidebar: () => void;
  navSettings: NavAppearanceSettings;
  onOpenAppearanceModal: () => void;
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
  children: React.ReactNode;
}

export const ErpLayout: React.FC<ErpLayoutProps> = ({
  currentSection,
  activeSubItem,
  onSelectSection,
  onLogout,
  userRole,
  currentUser,
  onSwitchRole,
  managedMenus,
  permissionMatrix,
  menuVisibility,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
  isMobileSidebarOpen,
  onOpenMobileSidebar,
  onCloseMobileSidebar,
  navSettings,
  onOpenAppearanceModal,
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
  children,
}) => {
  const {
    filteredSchools,
    selectedOrganizationId,
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    activeSchool,
    metrics,
    setOrganization,
    setSchool,
    setCampus,
    setAcademicYear,
  } = useSchoolContext();

  const [isSlideOverMode, setIsSlideOverMode] = React.useState(false);
  const [isDesktopDrawerOpen, setIsDesktopDrawerOpen] = React.useState(false);

  const activeSchoolShortName = activeSchool
    ? activeSchool.shortName
    : `All Schools (${filteredSchools.length})`;

  const handleToggleSlideOverMode = () => {
    setIsSlideOverMode((prev) => {
      const next = !prev;
      setIsDesktopDrawerOpen(next);
      return next;
    });
  };

  const handleOpenNavigation = () => {
    if (isSlideOverMode) {
      setIsDesktopDrawerOpen(true);
    }
    onOpenMobileSidebar();
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-[#10213D] flex antialiased selection:bg-[#D6AD52]/25 selection:text-[#10213D]">
      <SidebarNav
        currentSection={currentSection}
        activeSubItem={activeSubItem}
        onSelectSection={onSelectSection}
        userRole={userRole}
        managedMenus={managedMenus}
        selectedSchoolId={selectedSchoolId}
        selectedCampusId={selectedCampusId}
        permissionMatrix={permissionMatrix}
        menuVisibility={menuVisibility}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={onCloseMobileSidebar}
        isSlideOverMode={isSlideOverMode}
        onToggleSlideOverMode={handleToggleSlideOverMode}
        isDesktopDrawerOpen={isDesktopDrawerOpen}
        onOpenDesktopDrawer={() => setIsDesktopDrawerOpen(true)}
        onCloseDesktopDrawer={() => setIsDesktopDrawerOpen(false)}
        navSettings={navSettings}
        onOpenAppearanceModal={onOpenAppearanceModal}
        activeSchoolShortName={activeSchoolShortName}
        activeCampusLabel={metrics.campusLabel}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <HeaderNav
          currentSection={currentSection}
          onSelectSection={onSelectSection}
          onLogout={onLogout}
          userRole={userRole}
          currentUser={currentUser}
          onSwitchRole={onSwitchRole}
          managedMenus={managedMenus}
          permissionMatrix={permissionMatrix}
          menuVisibility={menuVisibility}
          selectedOrganizationId={selectedOrganizationId}
          onOrganizationChange={setOrganization}
          selectedSchoolId={selectedSchoolId}
          onSchoolChange={setSchool}
          selectedCampusId={selectedCampusId}
          onCampusChange={setCampus}
          selectedAcademicYearId={selectedAcademicYearId}
          onAcademicYearChange={setAcademicYear}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          students={students}
          staffList={staffList}
          onSelectStudent={onSelectStudent}
          unreadNotifCount={unreadNotifCount}
          onOpenNotifications={onOpenNotifications}
          onOpenQRScanner={onOpenQRScanner}
          onOpenQuickAction={onOpenQuickAction}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onOpenMobileSidebar={handleOpenNavigation}
          isSlideOverMode={isSlideOverMode}
          onOpenAppearanceModal={onOpenAppearanceModal}
        />

        <main className="flex-1 pb-14">{children}</main>
      </div>
    </div>
  );
};
