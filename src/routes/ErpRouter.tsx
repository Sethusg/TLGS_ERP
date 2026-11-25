import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
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
  ErpRole,
  RolePermissionMatrix,
  MenuVisibilityMap,
  ManagedMainMenu,
  MenuOperationPermissions,
  RoleMenuPermissionMap,
  LoginHistoryEntry,
  CrudPermissionSet,
} from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import { canAccessModule, getRoleDefinition } from '../config/rbac';
import { getMenuIconComponent, resolveParentMenuId } from '../config/navigation';
import {
  AdminBulkEntityType,
  AdminBulkParseResult,
} from '../utils/adminBulkImport';
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
  currentRole: ErpRole;
  permissionMatrix: RolePermissionMatrix;
  menuVisibility: MenuVisibilityMap;
  managedMenus: ManagedMainMenu[];
  menuOperationPermissions: RoleMenuPermissionMap;
  loginHistory: LoginHistoryEntry[];
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
    onUpdatePermission: (
      role: ErpRole,
      moduleId: NavSection,
      field: keyof CrudPermissionSet,
      value: boolean
    ) => void;
    onToggleMenuVisibility: (moduleId: NavSection) => void;
    onChangeManagedMenus: (
      updater: (prev: ManagedMainMenu[]) => ManagedMainMenu[],
      auditRemark: string,
      referenceId?: string
    ) => void;
    onUpdateMenuOperationPermission: (
      role: ErpRole,
      operation: keyof MenuOperationPermissions,
      value: boolean
    ) => void;
    onSwitchPreviewRole: (role: ErpRole) => void;
    onBulkImportAdmin: (
      entity: AdminBulkEntityType,
      result: AdminBulkParseResult,
      updateExisting: boolean
    ) => { created: number; updated: number };
    onAddAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
    onRestoreState: (importedData: any) => boolean;
    onResetToDemoData: () => void;
  };
}

export const ErpRouter: React.FC<ErpRouterProps> = ({
  currentSection,
  activeSubItem,
  currentRole,
  permissionMatrix,
  menuVisibility,
  managedMenus,
  menuOperationPermissions,
  loginHistory,
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

  const parentModule = resolveParentMenuId(currentSection);
  const isAcademicAdminSub =
    currentSection === 'ADMIN' &&
    Boolean(
      activeSubItem &&
        (activeSubItem.startsWith('acad-') || activeSubItem === 'academics-timetable')
    );

  const hasAccess = isAcademicAdminSub
    ? canAccessModule(currentRole, 'ACADEMICS', permissionMatrix) ||
      canAccessModule(currentRole, 'ADMIN', permissionMatrix)
    : canAccessModule(currentRole, parentModule, permissionMatrix);

  if (!hasAccess) {
    const roleDef = getRoleDefinition(currentRole);
    return (
      <div className="p-6 max-w-2xl mx-auto mt-10">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0B1F3A]">
              Module Access Restricted by RBAC Policy
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Your active role (<strong className="text-[#0B1F3A]">{currentRole}</strong> ·{' '}
              {roleDef.scope} Scope) does not currently hold Read permission for this module.
              Update role permissions in System Administration or switch to an authorized role.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate(roleDef.defaultSection, roleDef.defaultSubItem)}
              className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Return to Authorized Workspace</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          subItem={activeSubItem}
          currentRole={currentRole}
          staffList={staffList}
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
          permissionMatrix={permissionMatrix}
          onUpdatePermission={handlers.onUpdatePermission}
          menuVisibility={menuVisibility}
          onToggleMenuVisibility={handlers.onToggleMenuVisibility}
          managedMenus={managedMenus}
          onChangeManagedMenus={handlers.onChangeManagedMenus}
          menuOperationPermissions={menuOperationPermissions}
          onUpdateMenuOperationPermission={handlers.onUpdateMenuOperationPermission}
          onSwitchPreviewRole={handlers.onSwitchPreviewRole}
          auditLogs={auditLogs}
          loginHistory={loginHistory}
          onBulkImport={handlers.onBulkImportAdmin}
          onNavigate={onNavigate}
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

    case 'CUSTOM_MENU': {
      const matchedMenu =
        managedMenus.find(
          (m) =>
            m.id === activeSubItem ||
            m.subItems.some((s) => s.actionId === activeSubItem)
        ) || managedMenus.find((m) => m.section === 'CUSTOM_MENU');
      const matchedSub = matchedMenu?.subItems.find(
        (s) => s.actionId === activeSubItem
      );
      const IconComp = getMenuIconComponent(
        matchedSub?.iconName || matchedMenu?.iconName
      );

      return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
          <div className="bg-[#0B1F3A] text-white rounded-xl p-6 border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                <IconComp className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
                  Custom ERP Module · {contextLabel}
                </p>
                <h1 className="text-xl font-bold mt-0.5">
                  {matchedSub ? matchedSub.label : matchedMenu?.label || 'Custom Workspace'}
                </h1>
                <p className="text-xs text-slate-300 mt-1">
                  {matchedSub?.description ||
                    matchedMenu?.description ||
                    'Dynamically configured module created in Menu Management.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ADMIN', 'admin-menus')}
              className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] text-xs font-bold shrink-0 cursor-pointer"
            >
              Configure in Menu Management
            </button>
          </div>

          {matchedMenu && matchedMenu.subItems.filter((s) => s.isActive).length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-xl p-5">
              <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">
                Active Submenus under {matchedMenu.label}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {matchedMenu.subItems
                  .filter((s) => s.isActive)
                  .map((sub) => {
                    const SubIcon = getMenuIconComponent(sub.iconName);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          onNavigate(sub.targetSection || 'CUSTOM_MENU', sub.actionId)
                        }
                        className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                          activeSubItem === sub.actionId
                            ? 'border-[#D4AF37] bg-[#D4AF37]/8'
                            : 'border-slate-200 hover:border-[#0B1F3A]/40 bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SubIcon className="w-4 h-4 text-[#9A7418]" />
                          <span className="text-xs font-bold text-[#0B1F3A]">
                            {sub.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {sub.description}
                        </p>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
};
