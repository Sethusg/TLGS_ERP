/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavSection, Student, Staff, LeaveRequest, CRMLead, BirthdayItem, Circular, FeeReceipt, TransferCertificate, SchoolAsset } from './types';
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
} from './data/mockData';
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
import { StudentProfileModal } from './components/Modals/StudentProfileModal';
import { QuickActionModal } from './components/Modals/QuickActionModal';

export default function App() {
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

  // UI States
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
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

  // Subtitle resolver for SubBar
  const getSubTitle = () => {
    if (currentSection === 'HOME') return undefined;
    return currentSection;
  };

  return (
    <div className="min-h-screen bg-[#f1f3f7] text-gray-900 flex flex-col antialiased selection:bg-pink-100 selection:text-pink-900">
      {/* Top Navigation Bar with exact screenshots styling */}
      <HeaderNav
        currentSection={currentSection}
        onSelectSection={handleNavigate}
        activeSubItem={activeSubItem}
      />

      {/* Sub-bar with EduNiv, search, and refresh */}
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
          />
        )}

        {currentSection === 'SCHOOL' && (
          <SchoolModule
            circulars={circulars}
            libraryBooks={libraryBooks}
            subItem={activeSubItem}
            onAddCircular={handleAddCircular}
            onIssueBook={handleIssueBook}
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

        {(currentSection === 'ASSET' || currentSection === 'SUPPLIES') && (
          <AssetSuppliesModule
            assets={assets}
            subItem={activeSubItem || (currentSection === 'SUPPLIES' ? 'supplies' : 'asset-view')}
            onAddAsset={handleAddAsset}
          />
        )}

        {(currentSection === 'ADMIN' || currentSection === 'SETTINGS') && (
          <AdminSettingsModule
            initialTab={currentSection === 'SETTINGS' ? 'settings' : 'roles'}
          />
        )}
      </main>

      {/* Floating Action Button (Pink Pencil Button from Screenshot) */}
      <aside className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsQuickActionOpen(true)}
          className="w-13 h-13 rounded-full bg-[#e91e63] hover:bg-[#d81b60] text-white flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-pink-300"
          title="EduNiv Quick Action Dispatcher"
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
    </div>
  );
}
