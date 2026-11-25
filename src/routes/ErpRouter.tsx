import React from 'react';
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
  BusRoute,
  ExamRecord,
} from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  DashboardPage,
  OrganizationPage,
  AcademicsPage,
  StudentsPage,
  StaffPage,
  AttendancePage,
  FeesPage,
  ExaminationsPage,
  HumanResourcesPage,
  FinancePage,
  LibraryPage,
  TransportPage,
  HostelPage,
  InventoryPage,
  CommunicationsPage,
  ReportsPage,
  SystemAdminPage,
  ContactPage,
  SchoolOperationsPage,
  TransferCertificatePage,
  IDCardStudioPage,
  CanteenPosPage,
  SystemSettingsPage,
} from '../pages';

export interface ErpRouterProps {
  currentSection: NavSection;
  activeSubItem?: string;
  onNavigate: (section: NavSection, subItem?: string) => void;
  onOpenQuickAction: () => void;
  onSelectStudent: (student: Student) => void;
  onOpenQRScanner: (mode: 'all' | 'transport' | 'asset' | 'staff') => void;
  students: Student[];
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  crmLeads: CRMLead[];
  birthdays: BirthdayItem[];
  circulars: Circular[];
  busRoutes: BusRoute[];
  exams: ExamRecord[];
  feeReceipts: FeeReceipt[];
  tcRecords: TransferCertificate[];
  libraryBooks: LibraryBook[];
  assets: SchoolAsset[];
  newsItems: NewsItem[];
  users: SystemUser[];
  classesList: SchoolClass[];
  subjectsList: SchoolSubject[];
  timetablesList: TimetableEntry[];
  auditLogs: AuditLog[];
  handlers: {
    onSendBirthdayWish: (id: string) => void;
    onAddLead: (lead: Omit<CRMLead, 'id'>) => void;
    onAddStudent: (std: Omit<Student, 'id'>) => void;
    onApproveLeave: (id: string, remarks?: string) => void;
    onRejectLeave: (id: string, remarks?: string) => void;
    onApplyLeave: (
      leave: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>
    ) => void;
    onAddStaff: (stf: Omit<Staff, 'id'>) => void;
    onUpdateStaff: (stf: Staff) => void;
    onArchiveStaff: (staffId: string, details: any) => void;
    onRestoreStaff: (staffId: string) => void;
    onRecordPayment: (receipt: FeeReceipt) => void;
    onCreateTC: (tc: TransferCertificate) => void;
    onAddCircular: (circ: Omit<Circular, 'id'>) => void;
    onIssueBook: (bookId: string) => void;
    onAddLibraryBook: (book: Omit<LibraryBook, 'id'>) => void;
    onAddAsset: (asset: Omit<SchoolAsset, 'id'>) => void;
    onAddNews: (item: Omit<NewsItem, 'id'>) => void;
    onUpdateNews: (updated: NewsItem) => void;
    onDeleteNews: (id: string) => void;
    onAddUser: (user: Omit<SystemUser, 'id'>) => void;
    onUpdateUser: (updated: SystemUser) => void;
    onDeleteUser: (id: string) => void;
    onToggleUserStatus: (id: string) => void;
    onResetPassword: (id: string) => void;
    onAddClass: (cls: Omit<SchoolClass, 'id'>) => void;
    onUpdateClass: (updated: SchoolClass) => void;
    onDeleteClass: (id: string) => void;
    onAddSubject: (sub: Omit<SchoolSubject, 'id'>) => void;
    onUpdateSubject: (updated: SchoolSubject) => void;
    onDeleteSubject: (id: string) => void;
    onAddTimetable: (tt: Omit<TimetableEntry, 'id'>) => void;
    onUpdateTimetable: (updated: TimetableEntry) => void;
    onDeleteTimetable: (id: string) => void;
    onAddAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
    onRestoreState: (importedData: any) => boolean;
    onResetToDemoData: () => void;
  };
}

export const ErpRouter: React.FC<ErpRouterProps> = ({
  currentSection,
  activeSubItem,
  onNavigate,
  onOpenQuickAction,
  onSelectStudent,
  onOpenQRScanner,
  students,
  staffList,
  leaveRequests,
  crmLeads,
  birthdays,
  circulars,
  busRoutes,
  exams,
  feeReceipts,
  tcRecords,
  libraryBooks,
  assets,
  newsItems,
  users,
  classesList,
  subjectsList,
  timetablesList,
  auditLogs,
  handlers,
}) => {
  const {
    selectedSchoolId,
    selectedCampusId,
    metrics,
    contextLabel,
    setSchoolAndCampus,
  } = useSchoolContext();

  switch (currentSection) {
    case 'HOME':
      return (
        <DashboardPage
          students={students}
          staffList={staffList}
          leaveRequests={leaveRequests}
          crmLeads={crmLeads}
          birthdays={birthdays}
          circulars={circulars}
          busRoutes={busRoutes}
          metrics={metrics}
          activeSubItem={activeSubItem}
          onNavigate={onNavigate}
          onOpenQuickAction={onOpenQuickAction}
          onSendBirthdayWish={handlers.onSendBirthdayWish}
          onAddLead={handlers.onAddLead}
        />
      );

    case 'ORGANIZATION':
      return (
        <OrganizationPage
          subItem={activeSubItem}
          selectedSchoolId={selectedSchoolId}
          selectedCampusId={selectedCampusId}
          academicYearLabel={metrics.academicYearLabel}
          onSelectSchoolContext={setSchoolAndCampus}
        />
      );

    case 'LMS':
    case 'ACADEMICS':
      return (
        <AcademicsPage
          initialTab={
            activeSubItem === 'academics-homework'
              ? 'homework'
              : activeSubItem === 'academics-timetable'
              ? 'timetable'
              : activeSubItem === 'academics-exam-schedule'
              ? 'exams'
              : activeSubItem === 'academics-live-class'
              ? 'live'
              : currentSection === 'LMS' || activeSubItem === 'academics-lms'
              ? 'lms'
              : 'homework'
          }
        />
      );

    case 'STUDENT':
      return (
        <StudentsPage
          students={students}
          subItem={activeSubItem}
          onSelectStudent={onSelectStudent}
          onAddStudent={handlers.onAddStudent}
        />
      );

    case 'STAFFS':
      return (
        <StaffPage
          staffList={staffList}
          leaveRequests={leaveRequests}
          subItem={activeSubItem}
          onApproveLeave={handlers.onApproveLeave}
          onRejectLeave={handlers.onRejectLeave}
          onApplyLeave={handlers.onApplyLeave}
          onAddStaff={handlers.onAddStaff}
          onUpdateStaff={handlers.onUpdateStaff}
          onArchiveStaff={handlers.onArchiveStaff}
          onRestoreStaff={handlers.onRestoreStaff}
        />
      );

    case 'ATTENDANCE':
      return (
        <AttendancePage
          subItem={activeSubItem}
          students={students}
          staffList={staffList}
          contextLabel={contextLabel}
          onOpenQRScanner={() => onOpenQRScanner('all')}
        />
      );

    case 'FEE MANAGEMENT':
      return (
        <FeesPage
          receipts={feeReceipts}
          students={students}
          subItem={activeSubItem}
          onRecordPayment={handlers.onRecordPayment}
        />
      );

    case 'MARKCHART':
      return (
        <ExaminationsPage
          exams={exams}
          students={students}
          subItem={activeSubItem}
        />
      );

    case 'HR':
      return (
        <HumanResourcesPage
          subItem={activeSubItem}
          staffList={staffList}
          contextLabel={contextLabel}
          onNavigate={onNavigate}
        />
      );

    case 'FINANCE':
      return (
        <FinancePage
          subItem={activeSubItem}
          contextLabel={contextLabel}
          onNavigate={onNavigate}
        />
      );

    case 'LIBRARY':
      return (
        <LibraryPage
          subItem={activeSubItem}
          libraryBooks={libraryBooks}
          contextLabel={contextLabel}
          onIssueBook={handlers.onIssueBook}
          onAddBook={handlers.onAddLibraryBook}
        />
      );

    case 'TRANSPORT':
      return (
        <TransportPage
          busRoutes={busRoutes}
          subItem={activeSubItem}
          onOpenQRScanner={() => onOpenQRScanner('transport')}
        />
      );

    case 'HOSTEL':
      return <HostelPage subItem={activeSubItem} contextLabel={contextLabel} />;

    case 'INVENTORY':
    case 'ASSET':
    case 'SUPPLIES':
      return (
        <InventoryPage
          assets={assets}
          subItem={
            activeSubItem ||
            (currentSection === 'SUPPLIES' ? 'supplies-masters' : 'asset-view')
          }
          onAddAsset={handlers.onAddAsset}
          onOpenQRScanner={() => onOpenQRScanner('asset')}
        />
      );

    case 'COMMUNICATIONS':
      return (
        <CommunicationsPage
          initialSubItem={activeSubItem}
          classes={classesList}
          students={students}
          staffList={staffList}
        />
      );

    case 'REPORTS':
      return <ReportsPage subItem={activeSubItem} metrics={metrics} />;

    case 'ADMIN':
      return (
        <SystemAdminPage
          users={users}
          onAddUser={handlers.onAddUser}
          onUpdateUser={handlers.onUpdateUser}
          onDeleteUser={handlers.onDeleteUser}
          onToggleUserStatus={handlers.onToggleUserStatus}
          onResetPassword={handlers.onResetPassword}
          classes={classesList}
          onAddClass={handlers.onAddClass}
          onUpdateClass={handlers.onUpdateClass}
          onDeleteClass={handlers.onDeleteClass}
          subjects={subjectsList}
          onAddSubject={handlers.onAddSubject}
          onUpdateSubject={handlers.onUpdateSubject}
          onDeleteSubject={handlers.onDeleteSubject}
          timetables={timetablesList}
          onAddTimetable={handlers.onAddTimetable}
          onUpdateTimetable={handlers.onUpdateTimetable}
          onDeleteTimetable={handlers.onDeleteTimetable}
        />
      );

    case 'CONTACT':
      return <ContactPage subItem={activeSubItem} />;

    case 'SCHOOL':
      return (
        <SchoolOperationsPage
          circulars={circulars}
          libraryBooks={libraryBooks}
          newsItems={newsItems}
          subItem={activeSubItem}
          onAddCircular={handlers.onAddCircular}
          onIssueBook={handlers.onIssueBook}
          onAddNews={handlers.onAddNews}
          onUpdateNews={handlers.onUpdateNews}
          onDeleteNews={handlers.onDeleteNews}
        />
      );

    case 'TC':
      return (
        <TransferCertificatePage
          tcRecords={tcRecords}
          students={students}
          subItem={activeSubItem}
          onCreateTC={handlers.onCreateTC}
        />
      );

    case 'ID_CARDS':
      return (
        <IDCardStudioPage
          students={students}
          staffList={staffList}
          subItem={activeSubItem}
        />
      );

    case 'CANTEEN':
      return <CanteenPosPage subItem={activeSubItem} />;

    case 'SETTINGS':
      return (
        <SystemSettingsPage
          initialTab={
            activeSubItem === 'settings-backup' ||
            activeSubItem === 'admin-backup'
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
          onAddAuditLog={handlers.onAddAuditLog}
          onRestoreState={handlers.onRestoreState}
          onResetToDemoData={handlers.onResetToDemoData}
        />
      );

    default:
      return null;
  }
};
