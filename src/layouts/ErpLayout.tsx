import React from 'react';
import { NavSection, Student, Staff } from '../types';
import { SidebarNav } from '../components/SidebarNav';
import { HeaderNav } from '../components/HeaderNav';
import { NavAppearanceSettings } from '../components/Modals/NavAppearanceModal';
import { useSchoolContext } from '../contexts/SchoolContext';

interface ErpLayoutProps {
  currentSection: NavSection;
  activeSubItem?: string;
  onSelectSection: (section: NavSection, subItem?: string) => void;
  onLogout: () => void;
  userRole: string;
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
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    activeSchool,
    metrics,
    setSchool,
    setCampus,
    setAcademicYear,
  } = useSchoolContext();

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex antialiased selection:bg-[#D4AF37]/25 selection:text-[#0B1F3A]">
      <SidebarNav
        currentSection={currentSection}
        activeSubItem={activeSubItem}
        onSelectSection={onSelectSection}
        userRole={userRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={onToggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={onCloseMobileSidebar}
        navSettings={navSettings}
        onOpenAppearanceModal={onOpenAppearanceModal}
        activeSchoolShortName={activeSchool.shortName}
        activeCampusLabel={metrics.campusLabel}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <HeaderNav
          currentSection={currentSection}
          onSelectSection={onSelectSection}
          onLogout={onLogout}
          userRole={userRole}
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
          onOpenMobileSidebar={onOpenMobileSidebar}
          onOpenAppearanceModal={onOpenAppearanceModal}
        />

        <main className="flex-1 pb-14">{children}</main>
      </div>
    </div>
  );
};
