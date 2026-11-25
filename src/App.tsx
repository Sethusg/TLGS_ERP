/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
} from './types';
import { filterByTenant } from './data/multiSchoolData';
import {
  DEFAULT_MENU_OPERATION_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  canAccessModule,
  getRoleDefinition,
} from './config/rbac';
import { createInitialManagedMenus } from './config/navigation';
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
import {
  AuthenticatedErpUser,
  createAuthenticatedUserAccount,
  loadPersistedErpState,
  logoutSession,
  saveErpCollection,
  updateAuthenticatedUserAccount,
} from './services/erpBackendService';

function formatNowTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function persistCollectionAsync<T>(collection: string, items: T[]): void {
  void saveErpCollection(collection, items).catch(() => undefined);
}

function ErpWorkspace() {
  const {
    schools,
    selectedSchoolId,
    selectedCampusId,
    applyTenantScopeLock,
    hydrateHierarchy,
    setLiveMetricsInput,
  } = useSchoolContext();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthenticatedErpUser | null>(null);
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

  // Multi-School Isolated Application State (Loaded Strictly from Backend Persistence)
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [crmLeads, setCrmLeads] = useState<CRMLead[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>([]);
  const [tcRecords, setTcRecords] = useState<TransferCertificate[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [assets, setAssets] = useState<SchoolAsset[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [subjectsList, setSubjectsList] = useState<SchoolSubject[]>([]);
  const [timetablesList, setTimetablesList] = useState<TimetableEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);

  const clearWorkspaceState = useCallback(() => {
    setStudents([]);
    setStaffList([]);
    setLeaveRequests([]);
    setCrmLeads([]);
    setBirthdays([]);
    setCirculars([]);
    setBusRoutes([]);
    setExams([]);
    setFeeReceipts([]);
    setTcRecords([]);
    setLibraryBooks([]);
    setAssets([]);
    setNewsItems([]);
    setUsers([]);
    setClassesList([]);
    setSubjectsList([]);
    setTimetablesList([]);
    setAuditLogs([]);
    setLoginHistory([]);
    hydrateHierarchy({
      organizations: [],
      schools: [],
      academicYears: [],
    });
  }, [hydrateHierarchy]);

  const hydrateFromBackend = useCallback(async () => {
    try {
      const state = await loadPersistedErpState();
      hydrateHierarchy({
        organizations: state.organizations || [],
        schools: state.schools || [],
        academicYears: state.academicYears || [],
      });
      setStudents(state.students || []);
      setStaffList(state.staff || []);
      setLeaveRequests(state.leaveRequests || []);
      setCrmLeads(state.crmLeads || []);
      setBirthdays(state.birthdays || []);
      setCirculars(state.circulars || []);
      setBusRoutes(state.busRoutes || []);
      setExams(state.exams || []);
      setFeeReceipts(state.feeReceipts || []);
      setTcRecords(state.tcRecords || []);
      setLibraryBooks(state.libraryBooks || []);
      setAssets(state.assets || []);
      setNewsItems(state.newsItems || []);
      setUsers(state.users || []);
      setClassesList(state.classes || []);
      setSubjectsList(state.subjects || []);
      setTimetablesList(state.timetables || []);
      setAuditLogs(state.auditLogs || []);
      setLoginHistory(state.loginHistory || []);
    } catch {
      // If session token expired or backend unavailable, keep empty clean state
    }
  }, [hydrateHierarchy]);

  const handleSessionExpire = useCallback(() => {
    void logoutSession().catch(() => undefined);
    clearWorkspaceState();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setLogoutReason('Session timed out due to 15 minutes of inactivity.');
  }, [clearWorkspaceState]);

  const session = useSessionPreviewTimer(isLoggedIn, handleSessionExpire);

  // Real-time cross-platform synchronization (Web <-> Windows 11 Desktop EXE via shared server SSE)
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = getErpSessionToken();
    if (!token) return;
    let debounceTimer: number | null = null;
    const unsubscribe = subscribeToErpSyncEvents(token, () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        void hydrateFromBackend();
      }, 450);
    });
    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [isLoggedIn, hydrateFromBackend]);

  // Sync live persisted operational records into SchoolContext for KPI calculation
  useEffect(() => {
    setLiveMetricsInput({
      students,
      staff: staffList,
      feeReceipts,
      leaveRequests,
      usersCount: users.length,
      pendingAdmissionsCount: crmLeads.filter(
        (l) => l.status !== 'Admitted' && l.status !== 'Closed'
      ).length,
    });
  }, [
    students,
    staffList,
    feeReceipts,
    leaveRequests,
    users.length,
    crmLeads,
    setLiveMetricsInput,
  ]);

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

  // Resolve default tenant tags when adding new records (strictly from real schools)
  const defaultNewSchoolId =
    selectedSchoolId === 'all' ? schools[0]?.id || '' : selectedSchoolId;
  const defaultNewCampusId =
    selectedCampusId === 'all'
      ? schools.find((s) => s.id === defaultNewSchoolId)?.campuses[0]?.id || ''
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
    () => filterByTenant(busRoutes, selectedSchoolId, selectedCampusId),
    [busRoutes, selectedSchoolId, selectedCampusId]
  );
  const scopedExams = useMemo(
    () => filterByTenant(exams, selectedSchoolId, selectedCampusId),
    [exams, selectedSchoolId, selectedCampusId]
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

  const currentRoleDef = getRoleDefinition(currentUserRole);
  const activeActorId = currentUser?.username || currentRoleDef.shortCode;
  const activeActorName = currentUser?.fullName || currentRoleDef.role;

  const appendAuditLog = useCallback(
    (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
      setAuditLogs((prev) => {
        const next: AuditLog[] = [
          {
            ...entry,
            id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            schoolId: entry.schoolId || selectedSchoolId,
            campusId: entry.campusId || selectedCampusId,
            timestamp: formatNowTimestamp(),
          },
          ...prev,
        ];
        persistCollectionAsync('auditLogs', next);
        return next;
      });
    },
    [selectedSchoolId, selectedCampusId]
  );

  const handleLogout = async () => {
    await logoutSession().catch(() => undefined);
    clearWorkspaceState();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setLogoutReason('You have securely signed out of TLGS-ERP.');
    session.resetSession();
  };

  const handleLoginSuccess = async (user: AuthenticatedErpUser) => {
    setCurrentUser(user);
    setCurrentUserRole(user.role);
    setIsLoggedIn(true);
    setLogoutReason(undefined);
    session.resetSession();

    const def = getRoleDefinition(user.role);
    if (def.scope === 'Platform' || def.scope === 'Organization') {
      applyTenantScopeLock(null, null);
    } else if (def.scope === 'School') {
      applyTenantScopeLock(user.schoolId || null, null);
    } else {
      applyTenantScopeLock(user.schoolId || null, user.campusId || null);
    }

    setCurrentSection(def.defaultSection);
    setActiveSubItem(def.defaultSubItem);

    await hydrateFromBackend();
  };

  const handleSwitchPreviewRole = useCallback(
    (role: ErpRole) => {
      // Strictly restricted to Central Super Administrator inspecting role layouts
      if (currentUser?.role !== 'Super Administrator') return;
      const def = getRoleDefinition(role);
      setCurrentUserRole(role);
      if (!canAccessModule(role, currentSection, permissionMatrix)) {
        setCurrentSection(def.defaultSection);
        setActiveSubItem(def.defaultSubItem);
      }
    },
    [currentUser?.role, currentSection, permissionMatrix]
  );

  const handleNavigate = (section: NavSection, subItem?: string) => {
    setCurrentSection(section);
    setActiveSubItem(subItem);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await hydrateFromBackend();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleOpenQRScanner = (
    mode: 'all' | 'transport' | 'asset' | 'staff'
  ) => {
    setCameraScannerMode(mode);
    setIsCameraScannerOpen(true);
  };

  const handlers = {
    onSendBirthdayWish: (id: string) => {
      setBirthdays((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, wished: true } : b));
        persistCollectionAsync('birthdays', next);
        return next;
      });
    },
    onAddLead: (lead: Omit<CRMLead, 'id'>) => {
      setCrmLeads((prev) => {
        const next = [
          {
            ...lead,
            id: `crm-${Date.now()}`,
            schoolId: lead.schoolId || defaultNewSchoolId,
            campusId: lead.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('crmLeads', next);
        return next;
      });
    },
    onAddStudent: (stdData: Omit<Student, 'id'>) => {
      setStudents((prev) => {
        const next = [
          {
            ...stdData,
            id: `std-${Date.now()}`,
            schoolId: stdData.schoolId || defaultNewSchoolId,
            campusId: stdData.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('students', next);
        return next;
      });
    },
    onApproveLeave: (id: string, remarks?: string) => {
      setLeaveRequests((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? { ...r, status: 'Approved' as const, remarks: remarks || 'Approved' }
            : r
        );
        persistCollectionAsync('leaveRequests', next);
        return next;
      });
    },
    onRejectLeave: (id: string, remarks?: string) => {
      setLeaveRequests((prev) => {
        const next = prev.map((r) =>
          r.id === id
            ? { ...r, status: 'Rejected' as const, remarks: remarks || 'Declined' }
            : r
        );
        persistCollectionAsync('leaveRequests', next);
        return next;
      });
    },
    onApplyLeave: (
      leaveData: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>
    ) => {
      const todayIso = new Date().toISOString().slice(0, 10);
      setLeaveRequests((prev) => {
        const next = [
          {
            ...leaveData,
            id: `lev-${Date.now()}`,
            schoolId: leaveData.schoolId || defaultNewSchoolId,
            campusId: leaveData.campusId || defaultNewCampusId,
            status: 'Pending' as const,
            appliedDate: todayIso,
          },
          ...prev,
        ];
        persistCollectionAsync('leaveRequests', next);
        return next;
      });
    },
    onAddStaff: (newStaffData: Omit<Staff, 'id'>) => {
      setStaffList((prev) => {
        const next = [
          {
            ...newStaffData,
            id: `stf-${Date.now()}`,
            schoolId: newStaffData.schoolId || defaultNewSchoolId,
            campusId: newStaffData.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('staff', next);
        return next;
      });
    },
    onUpdateStaff: (updatedStaff: Staff) => {
      setStaffList((prev) => {
        const next = prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s));
        persistCollectionAsync('staff', next);
        return next;
      });
    },
    onArchiveStaff: (staffId: string, details: any) => {
      setStaffList((prev) => {
        const next = prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                status: 'Archived' as const,
                leaveBalance: 0,
                archivedDetails: details,
              }
            : s
        );
        persistCollectionAsync('staff', next);
        return next;
      });
    },
    onRestoreStaff: (staffId: string) => {
      setStaffList((prev) => {
        const next = prev.map((s) =>
          s.id === staffId ? { ...s, status: 'Active' as const, leaveBalance: 15 } : s
        );
        persistCollectionAsync('staff', next);
        return next;
      });
    },
    onRecordPayment: (receipt: FeeReceipt) => {
      setFeeReceipts((prev) => {
        const next = [
          {
            ...receipt,
            schoolId: receipt.schoolId || defaultNewSchoolId,
            campusId: receipt.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('feeReceipts', next);
        return next;
      });
      setStudents((prev) => {
        const next = prev.map((s) =>
          s.id === receipt.studentId
            ? { ...s, feeStatus: 'Paid' as const, dueAmount: 0 }
            : s
        );
        persistCollectionAsync('students', next);
        return next;
      });
    },
    onCreateTC: (tc: TransferCertificate) => {
      setTcRecords((prev) => {
        const next = [
          {
            ...tc,
            schoolId: tc.schoolId || defaultNewSchoolId,
            campusId: tc.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('tcRecords', next);
        return next;
      });
    },
    onAddCircular: (circ: Omit<Circular, 'id'>) => {
      setCirculars((prev) => {
        const next = [
          {
            ...circ,
            id: `cir-${Date.now()}`,
            schoolId: circ.schoolId || defaultNewSchoolId,
            campusId: circ.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('circulars', next);
        return next;
      });
    },
    onIssueBook: (bookId: string) => {
      setLibraryBooks((prev) => {
        const next = prev.map((b) =>
          b.id === bookId
            ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) }
            : b
        );
        persistCollectionAsync('libraryBooks', next);
        return next;
      });
    },
    onAddLibraryBook: (book: Omit<LibraryBook, 'id'>) => {
      setLibraryBooks((prev) => {
        const next = [
          {
            ...book,
            id: `lib-${Date.now()}`,
            schoolId: book.schoolId || defaultNewSchoolId,
            campusId: book.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('libraryBooks', next);
        return next;
      });
    },
    onAddAsset: (asset: Omit<SchoolAsset, 'id'>) => {
      setAssets((prev) => {
        const next = [
          {
            ...asset,
            id: `ast-${Date.now()}`,
            schoolId: asset.schoolId || defaultNewSchoolId,
            campusId: asset.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('assets', next);
        return next;
      });
    },
    onAddNews: (item: Omit<NewsItem, 'id'>) => {
      setNewsItems((prev) => {
        const next = [
          {
            ...item,
            id: `news-${Date.now()}`,
            schoolId: item.schoolId || defaultNewSchoolId,
          },
          ...prev,
        ];
        persistCollectionAsync('newsItems', next);
        return next;
      });
    },
    onUpdateNews: (updated: NewsItem) => {
      setNewsItems((prev) => {
        const next = prev.map((item) => (item.id === updated.id ? updated : item));
        persistCollectionAsync('newsItems', next);
        return next;
      });
    },
    onDeleteNews: (id: string) => {
      setNewsItems((prev) => {
        const next = prev.filter((item) => item.id !== id);
        persistCollectionAsync('newsItems', next);
        return next;
      });
    },
    onAddUser: async (user: Omit<SystemUser, 'id'> & { password?: string }) => {
      const { password, ...userProfile } = user;
      const accessScope =
        userProfile.accessScope ||
        (userProfile.schoolId === 'all' || !userProfile.schoolId
          ? 'all_schools'
          : 'single_school');
      const targetSchoolId =
        accessScope === 'all_schools'
          ? 'all'
          : userProfile.schoolId || userProfile.schoolIds?.[0] || defaultNewSchoolId || 'all';
      const targetCampusId =
        accessScope === 'all_schools'
          ? 'all'
          : userProfile.campusId || userProfile.campusIds?.[0] || defaultNewCampusId || 'all';

      if (password && password.length >= 8) {
        const { user: createdUser } = await createAuthenticatedUserAccount({
          username: userProfile.username,
          fullName: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phone,
          roleId: userProfile.roleId,
          role: userProfile.role,
          password,
          organizationId: userProfile.organizationId || null,
          accessScope,
          schoolId: targetSchoolId === 'all' ? null : targetSchoolId,
          campusId: targetCampusId === 'all' ? null : targetCampusId,
          schoolIds:
            userProfile.schoolIds ||
            (targetSchoolId !== 'all' ? [targetSchoolId] : []),
          campusIds:
            userProfile.campusIds ||
            (targetCampusId !== 'all' ? [targetCampusId] : []),
          academicYearId: userProfile.academicYearId || null,
          classId: userProfile.classId || null,
          section: userProfile.section || null,
          linkedStudentIds: userProfile.linkedStudentIds || [],
          department: userProfile.department,
          dob: userProfile.dob,
          gender: userProfile.gender,
          address: userProfile.address,
          status: userProfile.status,
        });
        setUsers((prev) => [
          createdUser,
          ...prev.filter((u) => u.id !== createdUser.id),
        ]);
      } else {
        setUsers((prev) => {
          const next: SystemUser[] = [
            {
              ...userProfile,
              id: `usr-${Date.now()}`,
              accessScope,
              schoolId: targetSchoolId,
              campusId: targetCampusId,
              createdBy: activeActorId,
              roleAssignedBy: activeActorId,
              createdDate: new Date().toISOString(),
            },
            ...prev,
          ];
          persistCollectionAsync('users', next);
          return next;
        });
      }

      appendAuditLog({
        schoolId: targetSchoolId,
        campusId: targetCampusId,
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'USER_STATUS',
        referenceID: userProfile.username,
        remarks: `Created user account ${userProfile.fullName} with role ${userProfile.role} (${accessScope})`,
      });
    },
    onUpdateUser: async (updated: SystemUser) => {
      const { user: savedUser } = await updateAuthenticatedUserAccount(
        updated.id,
        {
          fullName: updated.fullName,
          email: updated.email,
          phone: updated.phone,
          roleId: updated.roleId,
          role: updated.role,
          password: updated.password,
          organizationId: updated.organizationId || null,
          accessScope: updated.accessScope,
          schoolId: updated.schoolId === 'all' ? null : updated.schoolId,
          campusId: updated.campusId === 'all' ? null : updated.campusId,
          schoolIds: updated.schoolIds,
          campusIds: updated.campusIds,
          academicYearId: updated.academicYearId || null,
          classId: updated.classId || null,
          section: updated.section || null,
          linkedStudentIds: updated.linkedStudentIds,
          department: updated.department,
          dob: updated.dob,
          gender: updated.gender,
          address: updated.address,
          status: updated.status,
        }
      );
      setUsers((prev) =>
        prev.map((u) => (u.id === savedUser.id ? savedUser : u))
      );

      appendAuditLog({
        schoolId: savedUser.schoolId,
        campusId: savedUser.campusId,
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'USER_STATUS',
        referenceID: savedUser.username,
        remarks: `Updated user ${savedUser.fullName} (${savedUser.role} · ${savedUser.accessScope || 'single_school'})`,
      });
    },
    onDeleteUser: (id: string) => {
      setUsers((prev) => {
        const next = prev.filter((u) => u.id !== id);
        persistCollectionAsync('users', next);
        return next;
      });
    },
    onToggleUserStatus: (id: string) => {
      const target = users.find((u) => u.id === id);
      const nextStatus: 'Active' | 'Inactive' =
        target?.status === 'Active' ? 'Inactive' : 'Active';
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === id ? { ...u, status: nextStatus } : u
        );
        persistCollectionAsync('users', next);
        return next;
      });
      if (target) {
        appendAuditLog({
          schoolId: target.schoolId,
          campusId: target.campusId,
          userID: activeActorId,
          userName: activeActorName,
          role: currentUserRole,
          actionType: 'USER_STATUS',
          referenceID: target.username,
          remarks: `Changed account status for ${target.fullName} (${target.role}) to ${nextStatus}`,
        });
      }
    },
    onResetPassword: (id: string) => {
      const target = users.find((u) => u.id === id);
      setUsers((prev) => {
        const next = prev.map((u) =>
          u.id === id ? { ...u, passwordResetRequired: true } : u
        );
        persistCollectionAsync('users', next);
        return next;
      });
      appendAuditLog({
        schoolId: target?.schoolId || defaultNewSchoolId,
        campusId: target?.campusId || defaultNewCampusId,
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'PASSWORD_RESET',
        referenceID: target?.username || id,
        remarks: `Password reset flagged for ${target?.fullName || id}`,
      });
    },
    onAddClass: (cls: Omit<SchoolClass, 'id'>) => {
      setClassesList((prev) => {
        const next = [
          {
            ...cls,
            id: `cls-${Date.now()}`,
            schoolId: cls.schoolId || defaultNewSchoolId,
            campusId: cls.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('classes', next);
        return next;
      });
    },
    onUpdateClass: (updated: SchoolClass) => {
      setClassesList((prev) => {
        const next = prev.map((c) => (c.id === updated.id ? updated : c));
        persistCollectionAsync('classes', next);
        return next;
      });
    },
    onDeleteClass: (id: string) => {
      setClassesList((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persistCollectionAsync('classes', next);
        return next;
      });
    },
    onAddSubject: (sub: Omit<SchoolSubject, 'id'>) => {
      setSubjectsList((prev) => {
        const next = [
          {
            ...sub,
            id: `sub-${Date.now()}`,
            schoolId: sub.schoolId || defaultNewSchoolId,
          },
          ...prev,
        ];
        persistCollectionAsync('subjects', next);
        return next;
      });
    },
    onUpdateSubject: (updated: SchoolSubject) => {
      setSubjectsList((prev) => {
        const next = prev.map((s) => (s.id === updated.id ? updated : s));
        persistCollectionAsync('subjects', next);
        return next;
      });
    },
    onDeleteSubject: (id: string) => {
      setSubjectsList((prev) => {
        const next = prev.filter((s) => s.id !== id);
        persistCollectionAsync('subjects', next);
        return next;
      });
    },
    onAddTimetable: (tt: Omit<TimetableEntry, 'id'>) => {
      setTimetablesList((prev) => {
        const next = [
          {
            ...tt,
            id: `tt-${Date.now()}`,
            schoolId: tt.schoolId || defaultNewSchoolId,
            campusId: tt.campusId || defaultNewCampusId,
          },
          ...prev,
        ];
        persistCollectionAsync('timetables', next);
        return next;
      });
    },
    onUpdateTimetable: (updated: TimetableEntry) => {
      setTimetablesList((prev) => {
        const next = prev.map((t) => (t.id === updated.id ? updated : t));
        persistCollectionAsync('timetables', next);
        return next;
      });
    },
    onDeleteTimetable: (id: string) => {
      setTimetablesList((prev) => {
        const next = prev.filter((t) => t.id !== id);
        persistCollectionAsync('timetables', next);
        return next;
      });
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
      appendAuditLog({
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'ROLE_PERMISSION',
        referenceID: `${role}:${moduleId}`,
        remarks: `Updated ${field.toUpperCase()} permission to ${value ? 'ALLOW' : 'DENY'} for ${role} on ${moduleId}`,
      });
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
      appendAuditLog({
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'SETTINGS_CHANGE',
        referenceID: referenceId || 'MENU_STRUCTURE',
        remarks: auditRemark,
      });
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
      appendAuditLog({
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'ROLE_PERMISSION',
        referenceID: `MENU:${role}:${operation}`,
        remarks: `Set Menu Management "${operation.toUpperCase()}" permission to ${value ? 'ALLOW' : 'DENY'} for ${role}`,
      });
    },
    onSwitchPreviewRole: handleSwitchPreviewRole,
    onBulkImportAdmin: (
      entity: AdminBulkEntityType,
      result: AdminBulkParseResult,
      updateExisting: boolean
    ) => {
      const nowStamp = Date.now();
      const creates = result.rows.filter(
        (r) => r.action === 'create' && Boolean(r.payload)
      );
      const updates = updateExisting
        ? result.rows.filter(
            (r) => r.action === 'update' && Boolean(r.payload) && Boolean(r.existingId)
          )
        : [];

      const created = creates.length;
      const updated = updates.length;

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
          const next = [...createdItems, ...merged];
          persistCollectionAsync('users', next);
          return next;
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
          const next = [...createdItems, ...merged];
          persistCollectionAsync('classes', next);
          return next;
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
          const next = [...createdItems, ...merged];
          persistCollectionAsync('subjects', next);
          return next;
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
          const next = [...createdItems, ...merged];
          persistCollectionAsync('timetables', next);
          return next;
        });
      }

      appendAuditLog({
        userID: activeActorId,
        userName: activeActorName,
        role: currentUserRole,
        actionType: 'SETTINGS_CHANGE',
        referenceID: result.fileName,
        remarks: `Bulk imported ${ADMIN_IMPORT_SCHEMAS[entity].label} from "${result.fileName}" (${created} created, ${updated} updated, ${result.errorRows} skipped errors)`,
      });

      return { created, updated };
    },
    onAddAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      appendAuditLog(log);
    },
    onRestoreState: (importedData: any) => {
      try {
        if (importedData.students) {
          setStudents(importedData.students);
          persistCollectionAsync('students', importedData.students);
        }
        if (importedData.staffList) {
          setStaffList(importedData.staffList);
          persistCollectionAsync('staff', importedData.staffList);
        }
        if (importedData.leaveRequests) {
          setLeaveRequests(importedData.leaveRequests);
          persistCollectionAsync('leaveRequests', importedData.leaveRequests);
        }
        if (importedData.crmLeads) {
          setCrmLeads(importedData.crmLeads);
          persistCollectionAsync('crmLeads', importedData.crmLeads);
        }
        if (importedData.birthdays) {
          setBirthdays(importedData.birthdays);
          persistCollectionAsync('birthdays', importedData.birthdays);
        }
        if (importedData.circulars) {
          setCirculars(importedData.circulars);
          persistCollectionAsync('circulars', importedData.circulars);
        }
        if (importedData.feeReceipts) {
          setFeeReceipts(importedData.feeReceipts);
          persistCollectionAsync('feeReceipts', importedData.feeReceipts);
        }
        if (importedData.tcRecords) {
          setTcRecords(importedData.tcRecords);
          persistCollectionAsync('tcRecords', importedData.tcRecords);
        }
        if (importedData.libraryBooks) {
          setLibraryBooks(importedData.libraryBooks);
          persistCollectionAsync('libraryBooks', importedData.libraryBooks);
        }
        if (importedData.assets) {
          setAssets(importedData.assets);
          persistCollectionAsync('assets', importedData.assets);
        }
        return true;
      } catch {
        return false;
      }
    },
    onResetToDemoData: () => {
      // Demo data seeding is permanently disabled; reload live persisted records instead
      void hydrateFromBackend();
      setPermissionMatrix(DEFAULT_ROLE_PERMISSIONS);
      setMenuVisibility({});
      setManagedMenus(createInitialManagedMenus());
      setMenuOperationPermissions(DEFAULT_MENU_OPERATION_PERMISSIONS);
    },
  };

  const handleStudentBusCheckIn = (studentId: string, routeId: string) => {
    handlers.onAddAuditLog({
      userID: activeActorId,
      userName: activeActorName,
      actionType: 'OTHER',
      referenceID: `${studentId}-${routeId}`,
      remarks: `Student ${studentId} boarded bus route ${routeId}`,
    });
  };

  const handleAssetCheckInOut = (
    assetCode: string,
    action: 'checkin' | 'checkout'
  ) => {
    setAssets((prev) => {
      const next = prev.map((a) =>
        a.assetCode === assetCode
          ? {
              ...a,
              condition: 'Excellent' as const,
              assignedTo:
                action === 'checkout'
                  ? activeActorName
                  : 'Central Inventory Store',
            }
          : a
      );
      persistCollectionAsync('assets', next);
      return next;
    });
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
        currentUser={currentUser}
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
          scopedLeaves.filter((r) => r.status === 'Pending').length
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
