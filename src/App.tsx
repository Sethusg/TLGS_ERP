/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  ErpRole,
  RolePermissionMatrix,
  MenuVisibilityMap,
  ManagedMainMenu,
  MenuOperationPermissions,
  RoleMenuPermissionMap,
  LoginHistoryEntry,
  CrudPermissionSet,
} from './types';
import {
  MULTI_SCHOOL_STUDENTS,
  MULTI_SCHOOL_STAFF,
  MULTI_SCHOOL_CLASSES,
  MULTI_SCHOOL_FEE_RECEIPTS,
  MULTI_SCHOOL_LIBRARY_BOOKS,
  MULTI_SCHOOL_ASSETS,
  MULTI_SCHOOL_EXAMS,
  MULTI_SCHOOL_BUS_ROUTES,
  MULTI_SCHOOL_LEAVES,
  MULTI_SCHOOL_LEADS,
  MULTI_SCHOOL_CIRCULARS,
  MULTI_SCHOOL_TC_RECORDS,
  MULTI_SCHOOL_BIRTHDAYS,
  MULTI_SCHOOL_SUBJECTS,
  MULTI_SCHOOL_TIMETABLES,
  MULTI_SCHOOL_NEWS,
  MULTI_SCHOOL_AUDIT_LOGS,
  MULTI_SCHOOL_USERS,
  INITIAL_LOGIN_HISTORY,
  filterByTenant,
} from './data/multiSchoolData';
import {
  DEFAULT_MENU_OPERATION_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  canAccessModule,
  getRoleDefinition,
} from './config/rbac';
import { createInitialManagedMenus } from './config/navigation';
import { getCampusNameById, getSchoolNameById } from './data/schoolContext';
import {
  ADMIN_IMPORT_SCHEMAS,
  AdminBulkEntityType,
  AdminBulkParseResult,
} from './utils/adminBulkImport';
import { SchoolProvider, useSchoolContext } from './contexts/SchoolContext';
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

function formatNowTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ErpWorkspace() {
  const {
    schools,
    selectedSchoolId,
    selectedCampusId,
    applyTenantScopeLock,
  } = useSchoolContext();

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [logoutReason, setLogoutReason] = useState<string | undefined>(undefined);
  const [currentUserRole, setCurrentUserRole] = useState<ErpRole>(
    'Super Administrator'
  );
  const [currentSection, setCurrentSection] = useState<NavSection>('HOME');
  const [activeSubItem, setActiveSubItem] = useState<string | undefined>(
    'dash-overall'
  );

  // RBAC Permission Matrix, Dynamic Menu Hierarchy & Menu Operation Permissions
  const [permissionMatrix, setPermissionMatrix] = useState<RolePermissionMatrix>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [menuVisibility, setMenuVisibility] = useState<MenuVisibilityMap>({});
  const [managedMenus, setManagedMenus] = useState<ManagedMainMenu[]>(() =>
    createInitialManagedMenus()
  );
  const [menuOperationPermissions, setMenuOperationPermissions] =
    useState<RoleMenuPermissionMap>(DEFAULT_MENU_OPERATION_PERMISSIONS);

  const layout = useErpLayout();

  const handleSessionExpire = useCallback(() => {
    setIsLoggedIn(false);
    setLogoutReason('Preview session timed out due to 15 minutes of inactivity.');
  }, []);

  const session = useSessionPreviewTimer(isLoggedIn, handleSessionExpire);

  // Multi-School Isolated Application State (Sample Preview Data)
  const [students, setStudents] = useState<Student[]>(MULTI_SCHOOL_STUDENTS);
  const [staffList, setStaffList] = useState<Staff[]>(MULTI_SCHOOL_STAFF);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(
    MULTI_SCHOOL_LEAVES
  );
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>(MULTI_SCHOOL_LEADS);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>(
    MULTI_SCHOOL_BIRTHDAYS
  );
  const [circulars, setCirculars] = useState<Circular[]>(MULTI_SCHOOL_CIRCULARS);
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>(
    MULTI_SCHOOL_FEE_RECEIPTS
  );
  const [tcRecords, setTcRecords] = useState<TransferCertificate[]>(
    MULTI_SCHOOL_TC_RECORDS
  );
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(
    MULTI_SCHOOL_LIBRARY_BOOKS
  );
  const [assets, setAssets] = useState<SchoolAsset[]>(MULTI_SCHOOL_ASSETS);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(MULTI_SCHOOL_NEWS);
  const [users, setUsers] = useState<SystemUser[]>(MULTI_SCHOOL_USERS);
  const [classesList, setClassesList] = useState<SchoolClass[]>(
    MULTI_SCHOOL_CLASSES
  );
  const [subjectsList, setSubjectsList] = useState<SchoolSubject[]>(
    MULTI_SCHOOL_SUBJECTS
  );
  const [timetablesList, setTimetablesList] = useState<TimetableEntry[]>(
    MULTI_SCHOOL_TIMETABLES
  );
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MULTI_SCHOOL_AUDIT_LOGS);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>(
    INITIAL_LOGIN_HISTORY
  );

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

  // Resolve default tenant tags when adding new records
  const defaultNewSchoolId =
    selectedSchoolId === 'all'
      ? schools[0]?.id || 'sch-leaders-cbse'
      : selectedSchoolId;
  const defaultNewCampusId =
    selectedCampusId === 'all'
      ? schools.find((s) => s.id === defaultNewSchoolId)?.campuses[0]?.id ||
        'cmp-chennai-hq'
      : selectedCampusId;

  // Apply strict school-level & campus-level data isolation
  const scopedStudents = useMemo(
    () => filterByTenant(students, selectedSchoolId, selectedCampusId),
    [students, selectedSchoolId, selectedCampusId]
  );
  const scopedStaff = useMemo(
    () => filterByTenant(staffList, selectedSchoolId, selectedCampusId),
    [staffList, selectedSchoolId, selectedCampusId]
  );
  const scopedLeaves = useMemo(
    () => filterByTenant(leaveRequests, selectedSchoolId, selectedCampusId),
    [leaveRequests, selectedSchoolId, selectedCampusId]
  );
  const scopedLeads = useMemo(
    () => filterByTenant(crmLeads, selectedSchoolId, selectedCampusId),
    [crmLeads, selectedSchoolId, selectedCampusId]
  );
  const scopedBirthdays = useMemo(
    () => filterByTenant(birthdays, selectedSchoolId, selectedCampusId),
    [birthdays, selectedSchoolId, selectedCampusId]
  );
  const scopedCirculars = useMemo(
    () => filterByTenant(circulars, selectedSchoolId, selectedCampusId),
    [circulars, selectedSchoolId, selectedCampusId]
  );
  const scopedBusRoutes = useMemo(
    () => filterByTenant(MULTI_SCHOOL_BUS_ROUTES, selectedSchoolId, selectedCampusId),
    [selectedSchoolId, selectedCampusId]
  );
  const scopedExams = useMemo(
    () => filterByTenant(MULTI_SCHOOL_EXAMS, selectedSchoolId, selectedCampusId),
    [selectedSchoolId, selectedCampusId]
  );
  const scopedFeeReceipts = useMemo(
    () => filterByTenant(feeReceipts, selectedSchoolId, selectedCampusId),
    [feeReceipts, selectedSchoolId, selectedCampusId]
  );
  const scopedTcRecords = useMemo(
    () => filterByTenant(tcRecords, selectedSchoolId, selectedCampusId),
    [tcRecords, selectedSchoolId, selectedCampusId]
  );
  const scopedLibraryBooks = useMemo(
    () => filterByTenant(libraryBooks, selectedSchoolId, selectedCampusId),
    [libraryBooks, selectedSchoolId, selectedCampusId]
  );
  const scopedAssets = useMemo(
    () => filterByTenant(assets, selectedSchoolId, selectedCampusId),
    [assets, selectedSchoolId, selectedCampusId]
  );
  const scopedNews = useMemo(
    () => filterByTenant(newsItems, selectedSchoolId, selectedCampusId),
    [newsItems, selectedSchoolId, selectedCampusId]
  );
  const scopedClasses = useMemo(
    () => filterByTenant(classesList, selectedSchoolId, selectedCampusId),
    [classesList, selectedSchoolId, selectedCampusId]
  );
  const scopedSubjects = useMemo(
    () => filterByTenant(subjectsList, selectedSchoolId, selectedCampusId),
    [subjectsList, selectedSchoolId, selectedCampusId]
  );
  const scopedTimetables = useMemo(
    () => filterByTenant(timetablesList, selectedSchoolId, selectedCampusId),
    [timetablesList, selectedSchoolId, selectedCampusId]
  );
  const scopedUsers = useMemo(
    () => filterByTenant(users, selectedSchoolId, selectedCampusId),
    [users, selectedSchoolId, selectedCampusId]
  );
  const scopedAuditLogs = useMemo(
    () => filterByTenant(auditLogs, selectedSchoolId, selectedCampusId),
    [auditLogs, selectedSchoolId, selectedCampusId]
  );
  const scopedLoginHistory = useMemo(
    () => filterByTenant(loginHistory, selectedSchoolId, selectedCampusId),
    [loginHistory, selectedSchoolId, selectedCampusId]
  );

  const applyRoleContext = useCallback(
    (role: ErpRole, usernameOverride?: string, isInitialLogin = false) => {
      const def = getRoleDefinition(role);
      setCurrentUserRole(role);

      // Enforce school/campus tenant lock based on RBAC scope
      if (def.scope === 'Platform' || def.scope === 'Organization') {
        applyTenantScopeLock(null, null);
      } else if (def.scope === 'School') {
        applyTenantScopeLock(def.sampleAccount.schoolId, null);
      } else {
        applyTenantScopeLock(
          def.sampleAccount.schoolId,
          def.sampleAccount.campusId
        );
      }

      const timestamp = formatNowTimestamp();
      const targetSchoolId = def.sampleAccount.schoolId;
      const targetCampusId = def.sampleAccount.campusId;

      setLoginHistory((prev) => [
        {
          id: `lh-${Date.now()}`,
          userId: def.shortCode,
          username: usernameOverride || def.sampleAccount.username,
          fullName: def.sampleAccount.fullName,
          role,
          schoolId: targetSchoolId,
          schoolName: getSchoolNameById(targetSchoolId, schools),
          campusId: targetCampusId,
          campusName: getCampusNameById(targetSchoolId, targetCampusId, schools),
          timestamp,
          ipAddress: '103.21.144.19',
          device: 'Enterprise Web Preview · Browser',
          status: 'Success',
        },
        ...prev,
      ]);

      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: targetSchoolId,
          campusId: targetCampusId,
          userID: def.shortCode,
          userName: def.sampleAccount.fullName,
          role,
          timestamp,
          actionType: isInitialLogin ? 'LOGIN' : 'ROLE_PERMISSION',
          referenceID: role,
          remarks: isInitialLogin
            ? `Signed in as ${role} (${def.scope} Scope)`
            : `Switched active RBAC preview role to ${role} (${def.scope} Scope)`,
        },
        ...prev,
      ]);

      // Redirect to role's default module if current module is inaccessible
      if (
        isInitialLogin ||
        !canAccessModule(role, currentSection, permissionMatrix)
      ) {
        setCurrentSection(def.defaultSection);
        setActiveSubItem(def.defaultSubItem);
      }
    },
    [applyTenantScopeLock, currentSection, permissionMatrix, schools]
  );

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLogoutReason('Signed out of UI preview workspace.');
    session.resetSession();
  };

  const handleLoginSuccess = (username: string, role: ErpRole) => {
    setIsLoggedIn(true);
    setLogoutReason(undefined);
    session.resetSession();
    applyRoleContext(role, username, true);
  };

  const handleSwitchPreviewRole = (role: ErpRole) => {
    applyRoleContext(role, undefined, false);
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

  const currentRoleDef = getRoleDefinition(currentUserRole);

  const handlers = {
    onSendBirthdayWish: (id: string) => {
      setBirthdays((prev) =>
        prev.map((b) => (b.id === id ? { ...b, wished: true } : b))
      );
    },
    onAddLead: (lead: Omit<CRMLead, 'id'>) => {
      setCrmLeads((prev) => [
        {
          ...lead,
          id: `crm-${Date.now()}`,
          schoolId: lead.schoolId || defaultNewSchoolId,
          campusId: lead.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
    },
    onAddStudent: (stdData: Omit<Student, 'id'>) => {
      setStudents((prev) => [
        {
          ...stdData,
          id: `std-${Date.now()}`,
          schoolId: stdData.schoolId || defaultNewSchoolId,
          campusId: stdData.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
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
          schoolId: leaveData.schoolId || defaultNewSchoolId,
          campusId: leaveData.campusId || defaultNewCampusId,
          status: 'Pending',
          appliedDate: '2026-10-23',
        },
        ...prev,
      ]);
    },
    onAddStaff: (newStaffData: Omit<Staff, 'id'>) => {
      setStaffList((prev) => [
        {
          ...newStaffData,
          id: `stf-${Date.now()}`,
          schoolId: newStaffData.schoolId || defaultNewSchoolId,
          campusId: newStaffData.campusId || defaultNewCampusId,
        },
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
      setFeeReceipts((prev) => [
        {
          ...receipt,
          schoolId: receipt.schoolId || defaultNewSchoolId,
          campusId: receipt.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
      setStudents((prev) =>
        prev.map((s) =>
          s.id === receipt.studentId
            ? { ...s, feeStatus: 'Paid', dueAmount: 0 }
            : s
        )
      );
    },
    onCreateTC: (tc: TransferCertificate) => {
      setTcRecords((prev) => [
        {
          ...tc,
          schoolId: tc.schoolId || defaultNewSchoolId,
          campusId: tc.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
    },
    onAddCircular: (circ: Omit<Circular, 'id'>) => {
      setCirculars((prev) => [
        {
          ...circ,
          id: `cir-${Date.now()}`,
          schoolId: circ.schoolId || defaultNewSchoolId,
          campusId: circ.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
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
      setLibraryBooks((prev) => [
        {
          ...book,
          id: `lib-${Date.now()}`,
          schoolId: book.schoolId || defaultNewSchoolId,
          campusId: book.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
    },
    onAddAsset: (asset: Omit<SchoolAsset, 'id'>) => {
      setAssets((prev) => [
        {
          ...asset,
          id: `ast-${Date.now()}`,
          schoolId: asset.schoolId || defaultNewSchoolId,
          campusId: asset.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
    },
    onAddNews: (item: Omit<NewsItem, 'id'>) => {
      setNewsItems((prev) => [
        {
          ...item,
          id: `news-${Date.now()}`,
          schoolId: item.schoolId || defaultNewSchoolId,
        },
        ...prev,
      ]);
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
      const newId = `usr-${Date.now()}`;
      setUsers((prev) => [
        {
          ...user,
          id: newId,
          schoolId: user.schoolId || defaultNewSchoolId,
          campusId: user.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: user.schoolId || defaultNewSchoolId,
          campusId: user.campusId || defaultNewCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'USER_STATUS',
          referenceID: user.username,
          remarks: `Created user account ${user.fullName} with role ${user.role}`,
        },
        ...prev,
      ]);
    },
    onUpdateUser: (updated: SystemUser) => {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    },
    onDeleteUser: (id: string) => {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    },
    onToggleUserStatus: (id: string) => {
      const target = users.find((u) => u.id === id);
      const nextStatus = target?.status === 'Active' ? 'Inactive' : 'Active';
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u))
      );
      if (target) {
        setAuditLogs((prev) => [
          {
            id: `audit-${Date.now()}`,
            schoolId: target.schoolId,
            campusId: target.campusId,
            userID: currentRoleDef.shortCode,
            userName: currentRoleDef.sampleAccount.fullName,
            role: currentUserRole,
            timestamp: formatNowTimestamp(),
            actionType: 'USER_STATUS',
            referenceID: target.username,
            remarks: `Changed account status for ${target.fullName} (${target.role}) to ${nextStatus}`,
          },
          ...prev,
        ]);
      }
    },
    onResetPassword: (id: string) => {
      const target = users.find((u) => u.id === id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, passwordResetRequired: true } : u
        )
      );
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: target?.schoolId || defaultNewSchoolId,
          campusId: target?.campusId || defaultNewCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'PASSWORD_RESET',
          referenceID: target?.username || id,
          remarks: `Forced password reset queued for ${target?.fullName || id} (Django Auth integration ready)`,
        },
        ...prev,
      ]);
    },
    onAddClass: (cls: Omit<SchoolClass, 'id'>) => {
      setClassesList((prev) => [
        {
          ...cls,
          id: `cls-${Date.now()}`,
          schoolId: cls.schoolId || defaultNewSchoolId,
          campusId: cls.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
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
      setSubjectsList((prev) => [
        {
          ...sub,
          id: `sub-${Date.now()}`,
          schoolId: sub.schoolId || defaultNewSchoolId,
        },
        ...prev,
      ]);
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
      setTimetablesList((prev) => [
        {
          ...tt,
          id: `tt-${Date.now()}`,
          schoolId: tt.schoolId || defaultNewSchoolId,
          campusId: tt.campusId || defaultNewCampusId,
        },
        ...prev,
      ]);
    },
    onUpdateTimetable: (updated: TimetableEntry) => {
      setTimetablesList((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    },
    onDeleteTimetable: (id: string) => {
      setTimetablesList((prev) => prev.filter((t) => t.id !== id));
    },
    onUpdatePermission: (
      role: ErpRole,
      moduleId: NavSection,
      field: keyof CrudPermissionSet,
      value: boolean
    ) => {
      setPermissionMatrix((prev) => {
        const currentRolePerms = prev[role] || {};
        const currentMod = currentRolePerms[moduleId] || {
          create: false,
          read: false,
          update: false,
          delete: false,
        };
        const updatedMod: CrudPermissionSet = {
          ...currentMod,
          [field]: value,
        };
        if ((field === 'create' || field === 'update' || field === 'delete') && value) {
          updatedMod.read = true;
        }
        if (field === 'read' && !value) {
          updatedMod.create = false;
          updatedMod.update = false;
          updatedMod.delete = false;
        }
        return {
          ...prev,
          [role]: {
            ...currentRolePerms,
            [moduleId]: updatedMod,
          },
        };
      });
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: selectedSchoolId,
          campusId: selectedCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'ROLE_PERMISSION',
          referenceID: `${role}:${moduleId}`,
          remarks: `Updated ${field.toUpperCase()} permission to ${value ? 'ALLOW' : 'DENY'} for ${role} on ${moduleId}`,
        },
        ...prev,
      ]);
    },
    onToggleMenuVisibility: (moduleId: NavSection) => {
      setMenuVisibility((prev) => ({
        ...prev,
        [moduleId]: prev[moduleId] === false ? true : false,
      }));
    },
    onChangeManagedMenus: (
      updater: (prev: ManagedMainMenu[]) => ManagedMainMenu[],
      auditRemark: string,
      referenceId?: string
    ) => {
      setManagedMenus((prev) => updater(prev));
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: selectedSchoolId,
          campusId: selectedCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'SETTINGS_CHANGE',
          referenceID: referenceId || 'MENU_STRUCTURE',
          remarks: auditRemark,
        },
        ...prev,
      ]);
    },
    onUpdateMenuOperationPermission: (
      role: ErpRole,
      operation: keyof MenuOperationPermissions,
      value: boolean
    ) => {
      setMenuOperationPermissions((prev) => {
        const current = prev[role] || DEFAULT_MENU_OPERATION_PERMISSIONS[role];
        const next: MenuOperationPermissions = {
          ...current,
          [operation]: value,
        };
        if (operation !== 'view' && value) {
          next.view = true;
        }
        if (operation === 'view' && !value) {
          next.add = false;
          next.edit = false;
          next.delete = false;
          next.activate = false;
          next.deactivate = false;
        }
        return { ...prev, [role]: next };
      });
      setAuditLogs((prev) => [
        {
          id: `audit-${Date.now()}`,
          schoolId: selectedSchoolId,
          campusId: selectedCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'ROLE_PERMISSION',
          referenceID: `MENU:${role}:${operation}`,
          remarks: `Set Menu Management "${operation.toUpperCase()}" permission to ${value ? 'ALLOW' : 'DENY'} for ${role}`,
        },
        ...prev,
      ]);
    },
    onSwitchPreviewRole: handleSwitchPreviewRole,
    onBulkImportAdmin: (
      entity: AdminBulkEntityType,
      result: AdminBulkParseResult,
      updateExisting: boolean
    ) => {
      const nowStamp = Date.now();
      let created = 0;
      let updated = 0;

      const creates = result.rows.filter(
        (r) => r.action === 'create' && Boolean(r.payload)
      );
      const updates = updateExisting
        ? result.rows.filter(
            (r) => r.action === 'update' && Boolean(r.payload) && Boolean(r.existingId)
          )
        : [];

      created = creates.length;
      updated = updates.length;

      if (entity === 'users') {
        setUsers((prev) => {
          const updateMap = new Map(
            updates.map((u) => [
              u.existingId!,
              { ...(u.payload as Omit<SystemUser, 'id'>), id: u.existingId! },
            ])
          );
          const merged = prev.map((item) => updateMap.get(item.id) || item);
          const createdItems: SystemUser[] = creates.map((c, idx) => ({
            ...(c.payload as Omit<SystemUser, 'id'>),
            id: `usr-bulk-${nowStamp}-${idx}`,
          }));
          return [...createdItems, ...merged];
        });
      } else if (entity === 'classes') {
        setClassesList((prev) => {
          const updateMap = new Map(
            updates.map((u) => [
              u.existingId!,
              { ...(u.payload as Omit<SchoolClass, 'id'>), id: u.existingId! },
            ])
          );
          const merged = prev.map((item) => updateMap.get(item.id) || item);
          const createdItems: SchoolClass[] = creates.map((c, idx) => ({
            ...(c.payload as Omit<SchoolClass, 'id'>),
            id: `cls-bulk-${nowStamp}-${idx}`,
          }));
          return [...createdItems, ...merged];
        });
      } else if (entity === 'subjects') {
        setSubjectsList((prev) => {
          const updateMap = new Map(
            updates.map((u) => [
              u.existingId!,
              { ...(u.payload as Omit<SchoolSubject, 'id'>), id: u.existingId! },
            ])
          );
          const merged = prev.map((item) => updateMap.get(item.id) || item);
          const createdItems: SchoolSubject[] = creates.map((c, idx) => ({
            ...(c.payload as Omit<SchoolSubject, 'id'>),
            id: `sub-bulk-${nowStamp}-${idx}`,
          }));
          return [...createdItems, ...merged];
        });
      } else if (entity === 'timetables') {
        setTimetablesList((prev) => {
          const updateMap = new Map(
            updates.map((u) => [
              u.existingId!,
              { ...(u.payload as Omit<TimetableEntry, 'id'>), id: u.existingId! },
            ])
          );
          const merged = prev.map((item) => updateMap.get(item.id) || item);
          const createdItems: TimetableEntry[] = creates.map((c, idx) => ({
            ...(c.payload as Omit<TimetableEntry, 'id'>),
            id: `tt-bulk-${nowStamp}-${idx}`,
          }));
          return [...createdItems, ...merged];
        });
      }

      setAuditLogs((prev) => [
        {
          id: `audit-${nowStamp}`,
          schoolId: selectedSchoolId,
          campusId: selectedCampusId,
          userID: currentRoleDef.shortCode,
          userName: currentRoleDef.sampleAccount.fullName,
          role: currentUserRole,
          timestamp: formatNowTimestamp(),
          actionType: 'SETTINGS_CHANGE',
          referenceID: result.fileName,
          remarks: `Bulk imported ${ADMIN_IMPORT_SCHEMAS[entity].label} from "${result.fileName}" (${created} created, ${updated} updated, ${result.errorRows} skipped errors)`,
        },
        ...prev,
      ]);

      return { created, updated };
    },
    onAddAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      setAuditLogs((prev) => [
        {
          ...log,
          id: `audit-${Date.now()}`,
          schoolId: log.schoolId || selectedSchoolId,
          campusId: log.campusId || selectedCampusId,
          timestamp: formatNowTimestamp(),
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
      setStudents(MULTI_SCHOOL_STUDENTS);
      setStaffList(MULTI_SCHOOL_STAFF);
      setLeaveRequests(MULTI_SCHOOL_LEAVES);
      setCrmLeads(MULTI_SCHOOL_LEADS);
      setBirthdays(MULTI_SCHOOL_BIRTHDAYS);
      setCirculars(MULTI_SCHOOL_CIRCULARS);
      setFeeReceipts(MULTI_SCHOOL_FEE_RECEIPTS);
      setTcRecords(MULTI_SCHOOL_TC_RECORDS);
      setLibraryBooks(MULTI_SCHOOL_LIBRARY_BOOKS);
      setAssets(MULTI_SCHOOL_ASSETS);
      setUsers(MULTI_SCHOOL_USERS);
      setClassesList(MULTI_SCHOOL_CLASSES);
      setSubjectsList(MULTI_SCHOOL_SUBJECTS);
      setTimetablesList(MULTI_SCHOOL_TIMETABLES);
      setPermissionMatrix(DEFAULT_ROLE_PERMISSIONS);
      setMenuVisibility({});
      setManagedMenus(createInitialManagedMenus());
      setMenuOperationPermissions(DEFAULT_MENU_OPERATION_PERMISSIONS);
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
        onSwitchRole={handleSwitchPreviewRole}
        managedMenus={managedMenus}
        permissionMatrix={permissionMatrix}
        menuVisibility={menuVisibility}
        isSidebarCollapsed={layout.isSidebarCollapsed}
        onToggleSidebarCollapse={layout.toggleSidebarCollapse}
        isMobileSidebarOpen={layout.isMobileSidebarOpen}
        onOpenMobileSidebar={layout.openMobileSidebar}
        onCloseMobileSidebar={layout.closeMobileSidebar}
        navSettings={layout.navSettings}
        onOpenAppearanceModal={layout.openAppearanceModal}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        students={scopedStudents}
        staffList={scopedStaff}
        onSelectStudent={(std) => setSelectedStudentForModal(std)}
        unreadNotifCount={
          scopedLeaves.filter((r) => r.status === 'Pending').length + 1
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
          currentRole={currentUserRole}
          permissionMatrix={permissionMatrix}
          menuVisibility={menuVisibility}
          managedMenus={managedMenus}
          menuOperationPermissions={menuOperationPermissions}
          loginHistory={scopedLoginHistory}
          onNavigate={handleNavigate}
          onOpenQuickAction={() => setIsQuickActionOpen(true)}
          onSelectStudent={(std) => setSelectedStudentForModal(std)}
          onOpenQRScanner={handleOpenQRScanner}
          students={scopedStudents}
          staffList={scopedStaff}
          leaveRequests={scopedLeaves}
          crmLeads={scopedLeads}
          birthdays={scopedBirthdays}
          circulars={scopedCirculars}
          busRoutes={scopedBusRoutes}
          exams={scopedExams}
          feeReceipts={scopedFeeReceipts}
          tcRecords={scopedTcRecords}
          libraryBooks={scopedLibraryBooks}
          assets={scopedAssets}
          newsItems={scopedNews}
          users={scopedUsers}
          classesList={scopedClasses}
          subjectsList={scopedSubjects}
          timetablesList={scopedTimetables}
          auditLogs={scopedAuditLogs}
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
        leaveRequests={scopedLeaves}
        staffList={scopedStaff}
        birthdays={scopedBirthdays}
        onNavigate={handleNavigate}
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <CameraQRScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        mode={cameraScannerMode}
        students={scopedStudents}
        assets={scopedAssets}
        busRoutes={scopedBusRoutes}
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
