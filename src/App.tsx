/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  NavSection,
  Student,
  Staff,
  LeaveRequest,
  CRMLead,
  BirthdayItem,
  Circular,
  FeeReceipt,
  TransferCertificate,
  SchoolAsset,
  SystemUser,
  SchoolClass,
  SchoolSubject,
  TimetableEntry,
  NewsItem,
  AuditLog,
  LibraryBook,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_STAFF,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_BIRTHDAYS,
  INITIAL_CRM_LEADS,
  INITIAL_BUS_ROUTES,
  INITIAL_CIRCULARS,
  INITIAL_FEE_RECEIPTS,
  INITIAL_TC_RECORDS,
  INITIAL_EXAMS,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_ASSETS,
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_SUBJECTS,
  INITIAL_TIMETABLES,
  INITIAL_NEWS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { SchoolProvider } from './contexts/SchoolContext';
import { useErpLayout, useSessionPreviewTimer } from './hooks/useErpLayout';
import { ErpLayout } from './layouts/ErpLayout';
import { ErpRouter } from './routes/ErpRouter';
import { LoginPage } from './pages';
import { StudentProfileModal } from './components/Modals/StudentProfileModal';
import { QuickActionModal } from './components/Modals/QuickActionModal';
import { NavAppearanceModal } from './components/Modals/NavAppearanceModal';
import { NotificationCenter } from './components/Common/NotificationCenter';
import { CameraQRScannerModal } from './components/Common/CameraQRScannerModal';
import { SessionWarningModal } from './components/Modals/SessionWarningModal';

function ErpWorkspace() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [logoutReason, setLogoutReason] = useState<string | undefined>(undefined);
  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');
  const [currentSection, setCurrentSection] = useState<NavSection>('HOME');
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>(
    'dashboard-overview'
  );

  const layout = useErpLayout();

  const handleSessionExpire = useCallback(() => {
    setIsLoggedIn(false);
    setLogoutReason('Preview session timed out due to 15 minutes of inactivity.');
  }, []);

  const session = useSessionPreviewTimer(isLoggedIn, handleSessionExpire);

  // Sample Preview Application State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(
    INITIAL_LEAVE_REQUESTS
  );
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(INITIAL_CRM_LEADS);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(INITIAL_BIRTHDAYS);
  const [circulars, setCirculars] = useState<Circular[]>(INITIAL_CIRCULARS);
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>(INITIAL_FEE_RECEIPTS);
  const [tcRecords, setTcRecords] = useState<TransferCertificate[]>(
    INITIAL_TC_RECORDS
  );
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(
    INITIAL_LIBRARY_BOOKS
  );
  const [assets, setAssets] = useState<SchoolAsset[]>(INITIAL_ASSETS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(INITIAL_NEWS);
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [classesList, setClassesList] = useState<SchoolClass[]>(INITIAL_CLASSES);
  const [subjectsList, setSubjectsList] = useState<SchoolSubject[]>(INITIAL_SUBJECTS);
  const [timetablesList, setTimetablesList] = useState<TimetableEntry[]>(
    INITIAL_TIMETABLES
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Modal & Utility UI States
  const [selectedStudentForModal, setSelectedStudentForModal] =
    useState<Student | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraScannerMode, setCameraScannerMode] = useState<
    'all' | 'transport' | 'asset' | 'staff'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLogoutReason('Signed out of UI preview workspace.');
    session.resetSession();
  };

  const handleLoginSuccess = (_username: string, role: string) => {
    setIsLoggedIn(true);
    setCurrentUserRole(role);
    setLogoutReason(undefined);
    session.resetSession();
    if (role === 'cashier') {
      setCurrentSection('CANTEEN');
      setActiveSubItem('canteen-pos');
    } else {
      setCurrentSection('HOME');
      setActiveSubItem('dashboard-overview');
    }
  };

  const handleNavigate = (section: NavSection, subItem?: string) => {
    setCurrentSection(section);
    setActiveSubItem(subItem);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleOpenQRScanner = (
    mode: 'all' | 'transport' | 'asset' | 'staff'
  ) => {
    setCameraScannerMode(mode);
    setIsCameraScannerOpen(true);
  };

  const handlers = {
    onSendBirthdayWish: (id: string) => {
      setBirthdays((prev) =>
        prev.map((b) => (b.id === id ? { ...b, wished: true } : b))
      );
    },
    onAddLead: (lead: Omit<CRMLead, 'id'>) => {
      setCrmLeads((prev) => [{ ...lead, id: `crm-${Date.now()}` }, ...prev]);
    },
    onAddStudent: (stdData: Omit<Student, 'id'>) => {
      setStudents((prev) => [{ ...stdData, id: `std-${Date.now()}` }, ...prev]);
    },
    onApproveLeave: (id: string, remarks?: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'Approved', remarks: remarks || 'Approved' }
            : r
        )
      );
    },
    onRejectLeave: (id: string, remarks?: string) => {
      setLeaveRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: 'Rejected', remarks: remarks || 'Declined' }
            : r
        )
      );
    },
    onApplyLeave: (
      leaveData: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>
    ) => {
      setLeaveRequests((prev) => [
        {
          ...leaveData,
          id: `lev-${Date.now()}`,
          status: 'Pending',
          appliedDate: '2026-10-23',
        },
        ...prev,
      ]);
    },
    onAddStaff: (newStaffData: Omit<Staff, 'id'>) => {
      setStaffList((prev) => [
        { ...newStaffData, id: `stf-${Date.now()}` },
        ...prev,
      ]);
    },
    onUpdateStaff: (updatedStaff: Staff) => {
      setStaffList((prev) =>
        prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
      );
    },
    onArchiveStaff: (staffId: string, details: any) => {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                status: 'Archived',
                leaveBalance: 0,
                archivedDetails: details,
              }
            : s
        )
      );
    },
    onRestoreStaff: (staffId: string) => {
      setStaffList((prev) =>
        prev.map((s) =>
          s.id === staffId ? { ...s, status: 'Active', leaveBalance: 15 } : s
        )
      );
    },
    onRecordPayment: (receipt: FeeReceipt) => {
      setFeeReceipts((prev) => [receipt, ...prev]);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === receipt.studentId
            ? { ...s, feeStatus: 'Paid', dueAmount: 0 }
            : s
        )
      );
    },
    onCreateTC: (tc: TransferCertificate) => {
      setTcRecords((prev) => [tc, ...prev]);
    },
    onAddCircular: (circ: Omit<Circular, 'id'>) => {
      setCirculars((prev) => [{ ...circ, id: `cir-${Date.now()}` }, ...prev]);
    },
    onIssueBook: (bookId: string) => {
      setLibraryBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
            : b
        )
      );
    },
    onAddLibraryBook: (book: Omit<LibraryBook, 'id'>) => {
      setLibraryBooks((prev) => [{ ...book, id: `lib-${Date.now()}` }, ...prev]);
    },
    onAddAsset: (asset: Omit<SchoolAsset, 'id'>) => {
      setAssets((prev) => [{ ...asset, id: `ast-${Date.now()}` }, ...prev]);
    },
    onAddNews: (item: Omit<NewsItem, 'id'>) => {
      setNewsItems((prev) => [{ ...item, id: `news-${Date.now()}` }, ...prev]);
    },
    onUpdateNews: (updated: NewsItem) => {
      setNewsItems((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    },
    onDeleteNews: (id: string) => {
      setNewsItems((prev) => prev.filter((item) => item.id !== id));
    },
    onAddUser: (user: Omit<SystemUser, 'id'>) => {
      setUsers((prev) => [{ ...user, id: `usr-${Date.now()}` }, ...prev]);
    },
    onUpdateUser: (updated: SystemUser) => {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    },
    onDeleteUser: (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    },
    onToggleUserStatus: (id: string) => {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' }
            : u
        )
      );
    },
    onResetPassword: (id: string) => {
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          userID: 'ADMIN',
          userName: 'Dr. Sethu Ramanathan',
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          actionType: 'SETTINGS_CHANGE',
          referenceID: id,
          remarks: `Preview password reset queued for user ${id}`,
        },
        ...prev,
      ]);
    },
    onAddClass: (cls: Omit<SchoolClass, 'id'>) => {
      setClassesList((prev) => [{ ...cls, id: `cls-${Date.now()}` }, ...prev]);
    },
    onUpdateClass: (updated: SchoolClass) => {
      setClassesList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    },
    onDeleteClass: (id: string) => {
      setClassesList((prev) => prev.filter((c) => c.id !== id));
    },
    onAddSubject: (sub: Omit<SchoolSubject, 'id'>) => {
      setSubjectsList((prev) => [{ ...sub, id: `sub-${Date.now()}` }, ...prev]);
    },
    onUpdateSubject: (updated: SchoolSubject) => {
      setSubjectsList((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    },
    onDeleteSubject: (id: string) => {
      setSubjectsList((prev) => prev.filter((s) => s.id !== id));
    },
    onAddTimetable: (tt: Omit<TimetableEntry, 'id'>) => {
      setTimetablesList((prev) => [{ ...tt, id: `tt-${Date.now()}` }, ...prev]);
    },
    onUpdateTimetable: (updated: TimetableEntry) => {
      setTimetablesList((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    },
    onDeleteTimetable: (id: string) => {
      setTimetablesList((prev) => prev.filter((t) => t.id !== id));
    },
    onAddAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      setAuditLogs((prev) => [
        {
          ...log,
          id: `audit-${Date.now()}`,
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
        ...prev,
      ]);
    },
    onRestoreState: (importedData: any) => {
      try {
        if (importedData.students) setStudents(importedData.students);
        if (importedData.staffList) setStaffList(importedData.staffList);
        if (importedData.leaveRequests)
          setLeaveRequests(importedData.leaveRequests);
        if (importedData.crmLeads) setCrmLeads(importedData.crmLeads);
        if (importedData.birthdays) setBirthdays(importedData.birthdays);
        if (importedData.circulars) setCirculars(importedData.circulars);
        if (importedData.feeReceipts) setFeeReceipts(importedData.feeReceipts);
        if (importedData.tcRecords) setTcRecords(importedData.tcRecords);
        if (importedData.libraryBooks)
          setLibraryBooks(importedData.libraryBooks);
        if (importedData.assets) setAssets(importedData.assets);
        return true;
      } catch {
        return false;
      }
    },
    onResetToDemoData: () => {
      setStudents(INITIAL_STUDENTS);
      setStaffList(INITIAL_STAFF);
      setLeaveRequests(INITIAL_LEAVE_REQUESTS);
      setCrmLeads(INITIAL_CRM_LEADS);
      setBirthdays(INITIAL_BIRTHDAYS);
      setCirculars(INITIAL_CIRCULARS);
      setFeeReceipts(INITIAL_FEE_RECEIPTS);
      setTcRecords(INITIAL_TC_RECORDS);
      setLibraryBooks(INITIAL_LIBRARY_BOOKS);
      setAssets(INITIAL_ASSETS);
    },
  };

  const handleStudentBusCheckIn = (studentId: string, routeId: string) => {
    handlers.onAddAuditLog({
      userID: 'TRANSPORT',
      userName: 'Bus QR Scanner',
      actionType: 'OTHER',
      referenceID: `${studentId}-${routeId}`,
      remarks: `Student ${studentId} boarded bus route ${routeId}`,
    });
  };

  const handleAssetCheckInOut = (
    assetCode: string,
    action: 'checkin' | 'checkout'
  ) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.assetCode === assetCode
          ? {
              ...a,
              condition: 'Excellent',
              assignedTo:
                action === 'checkout'
                  ? 'Dr. Rajesh Sharma (Faculty)'
                  : 'Central Laboratory Locker',
            }
          : a
      )
    );
  };

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        logoutReason={logoutReason}
      />
    );
  }

  return (
    <>
      <ErpLayout
        currentSection={currentSection}
        activeSubItem={activeSubItem}
        onSelectSection={handleNavigate}
        onLogout={handleLogout}
        userRole={currentUserRole}
        isSidebarCollapsed={layout.isSidebarCollapsed}
        onToggleSidebarCollapse={layout.toggleSidebarCollapse}
        isMobileSidebarOpen={layout.isMobileSidebarOpen}
        onOpenMobileSidebar={layout.openMobileSidebar}
        onCloseMobileSidebar={layout.closeMobileSidebar}
        navSettings={layout.navSettings}
        onOpenAppearanceModal={layout.openAppearanceModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        students={students}
        staffList={staffList}
        onSelectStudent={(std) => setSelectedStudentForModal(std)}
        unreadNotifCount={
          leaveRequests.filter((r) => r.status === 'Pending').length + 1
        }
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenQRScanner={() => handleOpenQRScanner('all')}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      >
        <ErpRouter
          currentSection={currentSection}
          activeSubItem={activeSubItem}
          onNavigate={handleNavigate}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onSelectStudent={(std) => setSelectedStudentForModal(std)}
          onOpenQRScanner={handleOpenQRScanner}
          students={students}
          staffList={staffList}
          leaveRequests={leaveRequests}
          crmLeads={crmLeads}
          birthdays={birthdays}
          circulars={circulars}
          busRoutes={INITIAL_BUS_ROUTES}
          exams={INITIAL_EXAMS}
          feeReceipts={feeReceipts}
          tcRecords={tcRecords}
          libraryBooks={libraryBooks}
          assets={assets}
          newsItems={newsItems}
          users={users}
          classesList={classesList}
          subjectsList={subjectsList}
          timetablesList={timetablesList}
          auditLogs={auditLogs}
          handlers={handlers}
        />
      </ErpLayout>

      <StudentProfileModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        onCollectFee={() => {
          setCurrentSection('FEE MANAGEMENT');
          setActiveSubItem('fee-collection');
        }}
        onIssueTC={() => {
          setCurrentSection('TC');
          setActiveSubItem('tc-create');
        }}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleNavigate}
      />

      <NavAppearanceModal
        isOpen={layout.isAppearanceModalOpen}
        onClose={layout.closeAppearanceModal}
        currentSettings={layout.navSettings}
        onSaveSettings={layout.handleSaveAppearance}
      />

      <NotificationCenter
        leaveRequests={leaveRequests}
        staffList={staffList}
        birthdays={birthdays}
        onNavigate={handleNavigate}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <CameraQRScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        mode={cameraScannerMode}
        students={students}
        assets={assets}
        busRoutes={INITIAL_BUS_ROUTES}
        onStudentBusCheckIn={handleStudentBusCheckIn}
        onAssetCheckInOut={handleAssetCheckInOut}
      />

      <SessionWarningModal
        isOpen={session.isWarningOpen}
        secondsRemaining={session.sessionSecondsRemaining}
        onExtendSession={session.extendSession}
        onLogoutNow={handleLogout}
      />
    </>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <ErpWorkspace />
    </SchoolProvider>
  );
}
