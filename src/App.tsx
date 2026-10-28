/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { AdminManagementHub } from './components/AdminManagementHub';

import { HeaderNav } from './components/HeaderNav';
import { SubBar } from './components/SubBar';
import { HomeDashboard } from './components/HomeDashboard';
import { StudentModule } from './components/StudentModule';
import { StaffModule } from './components/StaffModule';
import { MarkchartModule } from './components/MarkchartModule';
import { FeeModule } from './components/FeeModule';
import { TransportModule } from './components/TransportModule';
import { TCModule } from './components/TCModule';
import { SchoolModule } from './components/SchoolModule';
import { ContactModule } from './components/ContactModule';
import { LMSAndAcademicsModule } from './components/LMSAndAcademicsModule';
import { AssetSuppliesModule } from './components/AssetSuppliesModule';
import { AdminSettingsModule } from './components/AdminSettingsModule';
import { CommunicationsModule } from './components/CommunicationsModule';
import { IDCardPrinterModule } from './components/IDCardPrinterModule';
import { CanteenModule } from './components/CanteenModule';
import { StudentProfileModal } from './components/Modals/StudentProfileModal';
import { QuickActionModal } from './components/Modals/QuickActionModal';
import { NotificationCenter } from './components/Common/NotificationCenter';
import { CameraQRScannerModal } from './components/Common/CameraQRScannerModal';
import { LoginScreen } from './components/LoginScreen';
import { SessionWarningModal } from './components/Modals/SessionWarningModal';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [logoutReason, setLogoutReason] = useState<string | undefined>(undefined);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(900); // 15 minutes session timer
  const [isWarningOpen, setIsWarningOpen] = useState(false);

  // Inactivity & Session Timer Effect
  useEffect(() => {
    if (!isLoggedIn) return;

    const timer = setInterval(() => {
      setSessionSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLoggedIn(false);
          setLogoutReason('Session expired due to 15 minutes of inactivity.');
          setIsWarningOpen(false);
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
  }, [isLoggedIn, isWarningOpen]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLogoutReason('Logged out successfully by user.');
    setIsWarningOpen(false);
  };

  const handleExtendSession = () => {
    setSessionSecondsRemaining(900);
    setIsWarningOpen(false);
  };

  const [currentUserRole, setCurrentUserRole] = useState<string>('admin');

  const handleLoginSuccess = (username: string, role: string) => {
    setIsLoggedIn(true);
    setCurrentUserRole(role);
    setSessionSecondsRemaining(900);
    setLogoutReason(undefined);
    setIsWarningOpen(false);
    if (role === 'cashier') {
      setCurrentSection('CANTEEN');
      setActiveSubItem('canteen-pos');
    } else {
      setCurrentSection('HOME');
    }
  };

  const [currentSection, setCurrentSection] = useState<NavSection>('HOME');
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>(undefined);

  // Application Data States
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(INITIAL_CRM_LEADS);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(INITIAL_BIRTHDAYS);
  const [circulars, setCirculars] = useState<Circular[]>(INITIAL_CIRCULARS);
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>(INITIAL_FEE_RECEIPTS);
  const [tcRecords, setTcRecords] = useState<TransferCertificate[]>(INITIAL_TC_RECORDS);
  const [libraryBooks, setLibraryBooks] = useState(INITIAL_LIBRARY_BOOKS);
  const [assets, setAssets] = useState<SchoolAsset[]>(INITIAL_ASSETS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(INITIAL_NEWS);
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [classesList, setClassesList] = useState<SchoolClass[]>(INITIAL_CLASSES);
  const [subjectsList, setSubjectsList] = useState<SchoolSubject[]>(INITIAL_SUBJECTS);
  const [timetablesList, setTimetablesList] = useState<TimetableEntry[]>(INITIAL_TIMETABLES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const handleAddAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // User Management Handlers
  const handleAddUser = (user: Omit<SystemUser, 'id'>) => {
    setUsers((prev) => [{ ...user, id: `usr-${Date.now()}` }, ...prev]);
  };
  const handleUpdateUser = (updated: SystemUser) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };
  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };
  const handleToggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u))
    );
  };
  const handleResetPassword = (id: string) => {
    console.log(`Password reset triggered for user ${id}`);
  };

  // Class Management Handlers
  const handleAddClass = (cls: Omit<SchoolClass, 'id'>) => {
    setClassesList((prev) => [{ ...cls, id: `cls-${Date.now()}` }, ...prev]);
  };
  const handleUpdateClass = (updated: SchoolClass) => {
    setClassesList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const handleDeleteClass = (id: string) => {
    setClassesList((prev) => prev.filter((c) => c.id !== id));
  };

  // Subject Management Handlers
  const handleAddSubject = (sub: Omit<SchoolSubject, 'id'>) => {
    setSubjectsList((prev) => [{ ...sub, id: `sub-${Date.now()}` }, ...prev]);
  };
  const handleUpdateSubject = (updated: SchoolSubject) => {
    setSubjectsList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };
  const handleDeleteSubject = (id: string) => {
    setSubjectsList((prev) => prev.filter((s) => s.id !== id));
  };

  // Timetable Management Handlers
  const handleAddTimetable = (tt: Omit<TimetableEntry, 'id'>) => {
    setTimetablesList((prev) => [{ ...tt, id: `tt-${Date.now()}` }, ...prev]);
  };
  const handleUpdateTimetable = (updated: TimetableEntry) => {
    setTimetablesList((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };
  const handleDeleteTimetable = (id: string) => {
    setTimetablesList((prev) => prev.filter((t) => t.id !== id));
  };


  // UI States
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cameraScannerMode, setCameraScannerMode] = useState<'all' | 'transport' | 'asset' | 'staff'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Navigation Handler
  const handleNavigate = (section: NavSection, subItem?: string) => {
    setCurrentSection(section);
    setActiveSubItem(subItem);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Refresh Trigger
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Birthday Wish Handler
  const handleSendBirthdayWish = (id: string) => {
    setBirthdays((prev) =>
      prev.map((b) => (b.id === id ? { ...b, wished: true } : b))
    );
  };

  // Lead Handler
  const handleAddLead = (lead: Omit<CRMLead, 'id'>) => {
    const newLead: CRMLead = {
      ...lead,
      id: `crm-${Date.now()}`,
    };
    setCrmLeads((prev) => [newLead, ...prev]);
  };

  // Student Handler
  const handleAddStudent = (stdData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...stdData,
      id: `std-${Date.now()}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  // Leave Handlers
  const handleApproveLeave = (id: string, remarks?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'Approved', remarks: remarks || 'Approved' } : r
      )
    );
  };

  const handleRejectLeave = (id: string, remarks?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: 'Rejected', remarks: remarks || 'Declined' } : r
      )
    );
  };

  const handleApplyLeave = (leaveData: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => {
    const newReq: LeaveRequest = {
      ...leaveData,
      id: `lev-${Date.now()}`,
      status: 'Pending',
      appliedDate: '2026-10-23',
    };
    setLeaveRequests((prev) => [newReq, ...prev]);
  };

  // Staff Management Handlers
  const handleAddStaff = (newStaffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...newStaffData,
      id: `stf-${Date.now()}`,
    };
    setStaffList((prev) => [newStaff, ...prev]);
  };

  const handleUpdateStaff = (updatedStaff: Staff) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s))
    );
  };

  const handleArchiveStaff = (staffId: string, details: any) => {
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
  };

  const handleRestoreStaff = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              status: 'Active',
              leaveBalance: 15,
            }
          : s
      )
    );
  };

  // Fee Receipt Handler
  const handleRecordPayment = (receipt: FeeReceipt) => {
    setFeeReceipts((prev) => [receipt, ...prev]);
    // update student fee status
    setStudents((prev) =>
      prev.map((s) =>
        s.id === receipt.studentId
          ? { ...s, feeStatus: 'Paid', dueAmount: 0 }
          : s
      )
    );
  };

  // TC Handler
  const handleCreateTC = (tc: TransferCertificate) => {
    setTcRecords((prev) => [tc, ...prev]);
  };

  // Circular Handler
  const handleAddCircular = (circ: Omit<Circular, 'id'>) => {
    const newCirc: Circular = {
      ...circ,
      id: `cir-${Date.now()}`,
    };
    setCirculars((prev) => [newCirc, ...prev]);
  };

  // Library Book Issue
  const handleIssueBook = (bookId: string) => {
    setLibraryBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
          : b
      )
    );
  };

  // Asset Handler
  const handleAddAsset = (asset: Omit<SchoolAsset, 'id'>) => {
    const newAsset: SchoolAsset = {
      ...asset,
      id: `ast-${Date.now()}`,
    };
    setAssets((prev) => [newAsset, ...prev]);
  };

  // News & Events Handlers
  const handleAddNews = (item: Omit<NewsItem, 'id'>) => {
    const newItem: NewsItem = {
      ...item,
      id: `news-${Date.now()}`,
    };
    setNewsItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateNews = (updated: NewsItem) => {
    setNewsItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleDeleteNews = (id: string) => {
    setNewsItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Full System State Restore Handler
  const handleRestoreState = (importedData: any) => {
    try {
      if (importedData.students) setStudents(importedData.students);
      if (importedData.staffList) setStaffList(importedData.staffList);
      if (importedData.leaveRequests) setLeaveRequests(importedData.leaveRequests);
      if (importedData.crmLeads) setCrmLeads(importedData.crmLeads);
      if (importedData.birthdays) setBirthdays(importedData.birthdays);
      if (importedData.circulars) setCirculars(importedData.circulars);
      if (importedData.feeReceipts) setFeeReceipts(importedData.feeReceipts);
      if (importedData.tcRecords) setTcRecords(importedData.tcRecords);
      if (importedData.libraryBooks) setLibraryBooks(importedData.libraryBooks);
      if (importedData.assets) setAssets(importedData.assets);
      return true;
    } catch (e) {
      console.error('Failed to restore data', e);
      return false;
    }
  };

  // Reset to initial demo database
  const handleResetToDemoData = () => {
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
  };

  // QR Rapid Check-In Handlers
  const handleStudentBusCheckIn = (studentId: string, routeId: string) => {
    console.log(`Student ${studentId} boarded bus route ${routeId}`);
  };

  const handleAssetCheckInOut = (assetCode: string, action: 'checkin' | 'checkout') => {
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

  // Subtitle resolver for SubBar
  const getSubTitle = () => {
    if (currentSection === 'HOME') return undefined;
    return currentSection;
  };

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        logoutReason={logoutReason}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation Bar with exact screenshots styling */}
      <HeaderNav
        currentSection={currentSection}
        onSelectSection={handleNavigate}
        activeSubItem={activeSubItem}
        onLogout={handleLogout}
        sessionSecondsRemaining={sessionSecondsRemaining}
        userRole={currentUserRole}
      />

      {/* Sub-bar with TLGS, search, notifications, QR scanner, and refresh */}
      <SubBar
        currentSection={currentSection}
        activeSubTitle={getSubTitle()}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim().length > 0 && currentSection === 'HOME') {
            setCurrentSection('STUDENT');
          }
        }}
        unreadNotifCount={leaveRequests.filter((r) => r.status === 'Pending').length + 1}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenQRScanner={() => {
          setCameraScannerMode('all');
          setIsCameraScannerOpen(true);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentSection === 'HOME' && (
          <HomeDashboard
            students={students}
            staffList={staffList}
            leaveRequests={leaveRequests}
            crmLeads={crmLeads}
            birthdays={birthdays}
            circulars={circulars}
            busRoutes={INITIAL_BUS_ROUTES}
            onNavigate={handleNavigate}
            onOpenQuickAction={() => setIsQuickActionOpen(true)}
            onSendBirthdayWish={handleSendBirthdayWish}
            onAddLead={handleAddLead}
          />
        )}

        {currentSection === 'STUDENT' && (
          <StudentModule
            students={students}
            subItem={activeSubItem}
            onSelectStudent={(std) => setSelectedStudentForModal(std)}
            onAddStudent={handleAddStudent}
          />
        )}

        {currentSection === 'STAFFS' && (
          <StaffModule
            staffList={staffList}
            leaveRequests={leaveRequests}
            subItem={activeSubItem}
            onApproveLeave={handleApproveLeave}
            onRejectLeave={handleRejectLeave}
            onApplyLeave={handleApplyLeave}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onArchiveStaff={handleArchiveStaff}
            onRestoreStaff={handleRestoreStaff}
          />
        )}

        {currentSection === 'MARKCHART' && (
          <MarkchartModule
            exams={INITIAL_EXAMS}
            students={students}
            subItem={activeSubItem}
          />
        )}

        {(currentSection === 'LMS' || currentSection === 'ACADEMICS') && (
          <LMSAndAcademicsModule
            initialTab={
              activeSubItem === 'academics-homework'
                ? 'homework'
                : activeSubItem === 'academics-timetable'
                ? 'timetable'
                : activeSubItem === 'academics-exam-schedule'
                ? 'exams'
                : activeSubItem === 'academics-live-class'
                ? 'live'
                : currentSection === 'LMS'
                ? 'lms'
                : 'homework'
            }
          />
        )}

        {currentSection === 'CONTACT' && (
          <ContactModule subItem={activeSubItem} />
        )}

        {currentSection === 'TRANSPORT' && (
          <TransportModule
            busRoutes={INITIAL_BUS_ROUTES}
            subItem={activeSubItem}
            onOpenQRScanner={() => {
              setCameraScannerMode('transport');
              setIsCameraScannerOpen(true);
            }}
          />
        )}

        {currentSection === 'SCHOOL' && (
          <SchoolModule
            circulars={circulars}
            libraryBooks={libraryBooks}
            newsItems={newsItems}
            subItem={activeSubItem}
            onAddCircular={handleAddCircular}
            onIssueBook={handleIssueBook}
            onAddNews={handleAddNews}
            onUpdateNews={handleUpdateNews}
            onDeleteNews={handleDeleteNews}
          />
        )}

        {currentSection === 'FEE MANAGEMENT' && (
          <FeeModule
            receipts={feeReceipts}
            students={students}
            subItem={activeSubItem}
            onRecordPayment={handleRecordPayment}
          />
        )}

        {currentSection === 'TC' && (
          <TCModule
            tcRecords={tcRecords}
            students={students}
            subItem={activeSubItem}
            onCreateTC={handleCreateTC}
          />
        )}

        {currentSection === 'ID_CARDS' && (
          <IDCardPrinterModule
            students={students}
            staffList={staffList}
            subItem={activeSubItem}
          />
        )}

        {currentSection === 'CANTEEN' && (
          <CanteenModule subItem={activeSubItem} />
        )}

        {(currentSection === 'ASSET' || currentSection === 'SUPPLIES') && (
          <AssetSuppliesModule
            assets={assets}
            subItem={activeSubItem || (currentSection === 'SUPPLIES' ? 'supplies' : 'asset-view')}
            onAddAsset={handleAddAsset}
            onOpenQRScanner={() => {
              setCameraScannerMode('asset');
              setIsCameraScannerOpen(true);
            }}
          />
        )}

        {currentSection === 'ADMIN' && (
          <AdminManagementHub
            users={users}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onToggleUserStatus={handleToggleUserStatus}
            onResetPassword={handleResetPassword}
            classes={classesList}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            subjects={subjectsList}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            timetables={timetablesList}
            onAddTimetable={handleAddTimetable}
            onUpdateTimetable={handleUpdateTimetable}
            onDeleteTimetable={handleDeleteTimetable}
          />
        )}

        {currentSection === 'COMMUNICATIONS' && (
          <CommunicationsModule
            initialSubItem={activeSubItem}
            classes={classesList}
            students={students}
            staffList={staffList}
          />
        )}

        {currentSection === 'SETTINGS' && (
          <AdminSettingsModule
            initialTab={
              activeSubItem === 'settings-backup' || activeSubItem === 'admin-backup'
                ? 'backup'
                : activeSubItem === 'admin-audit'
                ? 'audit'
                : 'settings'
            }
            systemState={{
              students,
              staffList,
              leaveRequests,
              crmLeads,
              birthdays,
              circulars,
              feeReceipts,
              tcRecords,
              libraryBooks,
              assets,
            }}
            auditLogs={auditLogs}
            onAddAuditLog={handleAddAuditLog}
            onRestoreState={handleRestoreState}
            onResetToDemoData={handleResetToDemoData}
          />
        )}

      </main>

      {/* Floating Action Button */}
      <aside className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsQuickActionOpen(true)}
          className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer"
          title="Quick Action Dispatcher"
          aria-label="Open quick actions"
        >
          <span className="text-xl">✎</span>
        </button>
      </aside>

      {/* Student 360-Degree Dossier Profile Modal */}
      <StudentProfileModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        onCollectFee={(std) => {
          setCurrentSection('FEE MANAGEMENT');
          setActiveSubItem('fee-collection');
        }}
        onIssueTC={(std) => {
          setCurrentSection('TC');
          setActiveSubItem('tc-create');
        }}
      />

      {/* Rapid Action Dispatcher Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSelectAction={handleNavigate}
      />

      {/* Automated Notification Center */}
      <NotificationCenter
        leaveRequests={leaveRequests}
        staffList={staffList}
        birthdays={birthdays}
        onNavigate={handleNavigate}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Camera QR Optical Scanner Modal */}
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

      {/* Session Inactivity Warning Modal */}
      <SessionWarningModal
        isOpen={isWarningOpen}
        secondsRemaining={sessionSecondsRemaining}
        onExtendSession={handleExtendSession}
        onLogoutNow={handleLogout}
      />
    </div>
  );
}
