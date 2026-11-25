import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Layers,
  Key,
  UserPlus,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Search,
  X,
  Clock,
  Sliders,
  Database,
  Activity,
  History,
  FileText,
  Bell,
  Server,
  Eye,
  UserCheck,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AuditLog,
  CrudPermissionSet,
  ErpRole,
  LoginHistoryEntry,
  ManagedMainMenu,
  MenuOperationPermissions,
  MenuVisibilityMap,
  NavSection,
  RoleMenuPermissionMap,
  RolePermissionMatrix,
  SchoolClass,
  SchoolSubject,
  Staff,
  SystemUser,
  TimetableEntry,
} from '../types';
import { ALL_ERP_ROLES, CORE_MODULE_IDS, getModuleCrud } from '../config/rbac';
import { MAIN_ERP_MENUS } from '../config/navigation';
import { useSchoolContext } from '../contexts/SchoolContext';
import { getCampusNameById, getSchoolNameById } from '../data/schoolContext';
import { DatabaseArchitecturePanel } from './DatabaseArchitecturePanel';
import { MenuManagementModule } from './MenuManagementModule';
import {
  EnterpriseConfirmDialog,
  EnterpriseDataTable,
  EnterpriseFormModal,
  ModulePageHeader,
  TableColumn,
} from './Common/EnterpriseUI';
import { AdminBulkImportModal } from './Modals/AdminBulkImportModal';
import {
  ADMIN_IMPORT_SCHEMAS,
  AdminBulkEntityType,
  AdminBulkParseResult,
  downloadAdminSampleTemplate,
} from '../utils/adminBulkImport';

type AdminTab =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'menus'
  | 'classes'
  | 'subjects'
  | 'timetables'
  | 'school-settings'
  | 'academic-settings'
  | 'notification-settings'
  | 'api-config'
  | 'database-schema'
  | 'audit'
  | 'login-history'
  | 'monitoring';

interface AdminManagementHubProps {
  subItem?: string;
  currentRole: ErpRole;
  staffList: Staff[];
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id'>) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
  onResetPassword: (id: string) => void;

  classes: SchoolClass[];
  onAddClass: (cls: Omit<SchoolClass, 'id'>) => void;
  onUpdateClass: (cls: SchoolClass) => void;
  onDeleteClass: (id: string) => void;

  subjects: SchoolSubject[];
  onAddSubject: (sub: Omit<SchoolSubject, 'id'>) => void;
  onUpdateSubject: (sub: SchoolSubject) => void;
  onDeleteSubject: (id: string) => void;

  timetables: TimetableEntry[];
  onAddTimetable: (tt: Omit<TimetableEntry, 'id'>) => void;
  onUpdateTimetable: (tt: TimetableEntry) => void;
  onDeleteTimetable: (id: string) => void;

  permissionMatrix: RolePermissionMatrix;
  onUpdatePermission: (
    role: ErpRole,
    moduleId: NavSection,
    field: keyof CrudPermissionSet,
    value: boolean
  ) => void;
  menuVisibility: MenuVisibilityMap;
  onToggleMenuVisibility: (moduleId: NavSection) => void;
  managedMenus: ManagedMainMenu[];
  onChangeManagedMenus: (
    updater: (prev: ManagedMainMenu[]) => ManagedMainMenu[],
    auditRemark: string,
    referenceId?: string
  ) => void;
  menuOperationPermissions: RoleMenuPermissionMap;
  onUpdateMenuOperationPermission: (
    role: ErpRole,
    operation: keyof MenuOperationPermissions,
    value: boolean
  ) => void;
  onSwitchPreviewRole: (role: ErpRole) => void;
  auditLogs: AuditLog[];
  loginHistory: LoginHistoryEntry[];
  onBulkImport?: (
    entity: AdminBulkEntityType,
    result: AdminBulkParseResult,
    updateExisting: boolean
  ) => { created: number; updated: number };
  onNavigate?: (section: NavSection, subItem?: string) => void;
}

function resolveTabFromSubItem(subItem?: string): AdminTab {
  switch (subItem) {
    case 'admin-users':
      return 'users';
    case 'admin-roles':
      return 'roles';
    case 'admin-permissions':
      return 'permissions';
    case 'admin-menus':
      return 'menus';
    case 'acad-classes':
    case 'acad-sections':
    case 'acad-class-teacher':
      return 'classes';
    case 'acad-subjects':
      return 'subjects';
    case 'acad-timetables':
      return 'timetables';
    case 'admin-school-settings':
      return 'school-settings';
    case 'admin-academic-settings':
      return 'academic-settings';
    case 'admin-notification-settings':
      return 'notification-settings';
    case 'admin-api-config':
      return 'api-config';
    case 'admin-database-schema':
      return 'database-schema';
    case 'admin-audit':
      return 'audit';
    case 'admin-login-history':
      return 'login-history';
    case 'admin-monitoring':
      return 'monitoring';
    default:
      return 'users';
  }
}

export const AdminManagementHub: React.FC<AdminManagementHubProps> = ({
  subItem,
  currentRole,
  staffList,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onResetPassword,
  classes,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  timetables,
  onAddTimetable,
  onUpdateTimetable,
  onDeleteTimetable,
  permissionMatrix,
  onUpdatePermission,
  menuVisibility,
  onToggleMenuVisibility,
  managedMenus,
  onChangeManagedMenus,
  menuOperationPermissions,
  onUpdateMenuOperationPermission,
  onSwitchPreviewRole,
  auditLogs,
  loginHistory,
  onBulkImport,
  onNavigate,
}) => {
  const { schools, selectedSchoolId, selectedCampusId, contextLabel } =
    useSchoolContext();

  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    resolveTabFromSubItem(subItem)
  );
  const [selectedPermRole, setSelectedPermRole] = useState<ErpRole>('Principal');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirm Dialog state (replaces window.confirm)
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'danger' | 'warning' | 'navy';
    action: () => void;
  } | null>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SchoolSubject | null>(null);

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<TimetableEntry | null>(null);
  const [ttTeacherSearch, setTtTeacherSearch] = useState('');
  const [isTtTeacherDropdownOpen, setIsTtTeacherDropdownOpen] = useState(false);

  const [bulkImportEntity, setBulkImportEntity] =
    useState<AdminBulkEntityType | null>(null);

  // Settings form state
  const [schoolSettingNote, setSchoolSettingNote] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.leaderserp.edu.in/api/v1');
  const [smsProvider, setSmsProvider] = useState('MSG91 DLT Enterprise');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailSmtpHost, setEmailSmtpHost] = useState('smtp.leadersgroup.edu.in');

  useEffect(() => {
    if (subItem) {
      setActiveTab(resolveTabFromSubItem(subItem));
    }
  }, [subItem]);

  const adminCrud = useMemo(
    () => getModuleCrud(currentRole, 'ADMIN', permissionMatrix),
    [currentRole, permissionMatrix]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // User form state
  const [userForm, setUserForm] = useState<{
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: ErpRole;
    schoolId: string;
    campusId: string;
    department: string;
    status: 'Active' | 'Inactive';
  }>({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'Teacher',
    schoolId: selectedSchoolId === 'all' ? 'sch-leaders-cbse' : selectedSchoolId,
    campusId: selectedCampusId === 'all' ? 'all' : selectedCampusId,
    department: 'Academics',
    status: 'Active',
  });

  // Class form state
  const [classForm, setClassForm] = useState({
    gradeName: '',
    curriculum: 'CBSE' as SchoolClass['curriculum'],
    sectionsStr: 'A, B, C',
    roomNo: '',
    classTeacher: '',
  });

  // Subject form state
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    type: 'Core' as SchoolSubject['type'],
    maxMarks: 100,
    gradeLevel: 'Class 10',
  });

  // Timetable form state
  const [timetableForm, setTimetableForm] = useState({
    grade: 'Class 10',
    section: 'A',
    day: 'Monday' as TimetableEntry['day'],
    periodNo: 1,
    timeSlot: '09:00 AM - 09:45 AM',
    subjectName: '',
    teacherName: '',
  });

  // Live filtered active staff for Class Teacher & Timetable picker
  const activeStaffPool = useMemo(
    () => staffList.filter((s) => s.status !== 'Archived' && s.status !== 'Resigned'),
    [staffList]
  );

  const matchingClassTeacherStaff = useMemo(() => {
    const q = staffSearchQuery.trim().toLowerCase();
    if (!q) return activeStaffPool;
    return activeStaffPool.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.empId.toLowerCase().includes(q) ||
        st.department.toLowerCase().includes(q) ||
        st.designation.toLowerCase().includes(q) ||
        (st.subject && st.subject.toLowerCase().includes(q))
    );
  }, [activeStaffPool, staffSearchQuery]);

  const matchingTimetableStaff = useMemo(() => {
    const q = ttTeacherSearch.trim().toLowerCase();
    if (!q) return activeStaffPool;
    return activeStaffPool.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.empId.toLowerCase().includes(q) ||
        st.department.toLowerCase().includes(q) ||
        (st.subject && st.subject.toLowerCase().includes(q))
    );
  }, [activeStaffPool, ttTeacherSearch]);

  // Handlers for User
  const handleOpenUserModal = (u?: SystemUser) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        schoolId: u.schoolId,
        campusId: u.campusId,
        department: u.department || 'General',
        status: u.status,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'Teacher',
        schoolId: selectedSchoolId === 'all' ? schools[0]?.id || 'sch-leaders-cbse' : selectedSchoolId,
        campusId: selectedCampusId === 'all' ? 'all' : selectedCampusId,
        department: 'Academics',
        status: 'Active',
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...userForm });
      showToast(`User "${userForm.username}" (${userForm.role}) updated.`);
    } else {
      onAddUser({
        ...userForm,
        lastLogin: 'Never logged in',
        passwordResetRequired: true,
      });
      showToast(`Created user "${userForm.username}" with role ${userForm.role}.`);
    }
    setIsUserModalOpen(false);
  };

  // Handlers for Class & Section
  const handleOpenClassModal = (c?: SchoolClass) => {
    if (c) {
      setEditingClass(c);
      setClassForm({
        gradeName: c.gradeName,
        curriculum: c.curriculum,
        sectionsStr: c.sections.join(', '),
        roomNo: c.roomNo,
        classTeacher: c.classTeacher || '',
      });
      setStaffSearchQuery(c.classTeacher || '');
    } else {
      setEditingClass(null);
      setClassForm({
        gradeName: '',
        curriculum: 'CBSE',
        sectionsStr: 'A, B, C',
        roomNo: '',
        classTeacher: '',
      });
      setStaffSearchQuery('');
    }
    setIsStaffDropdownOpen(false);
    setIsClassModalOpen(true);
  };

  const handleSelectClassTeacher = (staff: Staff) => {
    setClassForm((prev) => ({ ...prev, classTeacher: staff.name }));
    setStaffSearchQuery(staff.name);
    setIsStaffDropdownOpen(false);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const sectionsArr = classForm.sectionsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const resolvedTeacher = classForm.classTeacher.trim() || staffSearchQuery.trim();
    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        gradeName: classForm.gradeName.trim(),
        curriculum: classForm.curriculum,
        sections: sectionsArr,
        roomNo: classForm.roomNo.trim(),
        classTeacher: resolvedTeacher,
      });
      showToast(`Updated "${classForm.gradeName}" (Class Teacher: ${resolvedTeacher || 'Unassigned'}).`);
    } else {
      onAddClass({
        schoolId: selectedSchoolId === 'all' ? 'sch-leaders-cbse' : selectedSchoolId,
        campusId: selectedCampusId === 'all' ? 'cmp-chennai-hq' : selectedCampusId,
        gradeName: classForm.gradeName.trim(),
        curriculum: classForm.curriculum,
        sections: sectionsArr,
        roomNo: classForm.roomNo.trim(),
        classTeacher: resolvedTeacher,
      });
      showToast(`Created class "${classForm.gradeName}" with teacher "${resolvedTeacher || 'Unassigned'}".`);
    }
    setIsClassModalOpen(false);
  };

  // Handlers for Subject
  const handleOpenSubjectModal = (s?: SchoolSubject) => {
    if (s) {
      setEditingSubject(s);
      setSubjectForm({
        code: s.code,
        name: s.name,
        type: s.type,
        maxMarks: s.maxMarks,
        gradeLevel: s.gradeLevel,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        code: '',
        name: '',
        type: 'Core',
        maxMarks: 100,
        gradeLevel: 'Class 10',
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      onUpdateSubject({ ...editingSubject, ...subjectForm });
      showToast(`Updated subject "${subjectForm.name}".`);
    } else {
      onAddSubject({
        ...subjectForm,
        schoolId: selectedSchoolId === 'all' ? 'sch-leaders-cbse' : selectedSchoolId,
      });
      showToast(`Created subject "${subjectForm.name}".`);
    }
    setIsSubjectModalOpen(false);
  };

  // Handlers for Timetable
  const handleOpenTimetableModal = (t?: TimetableEntry) => {
    if (t) {
      setEditingTimetable(t);
      setTimetableForm({
        grade: t.grade,
        section: t.section,
        day: t.day,
        periodNo: t.periodNo,
        timeSlot: t.timeSlot,
        subjectName: t.subjectName,
        teacherName: t.teacherName,
      });
      setTtTeacherSearch(t.teacherName);
    } else {
      setEditingTimetable(null);
      setTimetableForm({
        grade: classes[0]?.gradeName || 'Class 10',
        section: 'A',
        day: 'Monday',
        periodNo: 1,
        timeSlot: '09:00 AM - 09:45 AM',
        subjectName: subjects[0]?.name || '',
        teacherName: '',
      });
      setTtTeacherSearch('');
    }
    setIsTtTeacherDropdownOpen(false);
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedTeacher = timetableForm.teacherName.trim() || ttTeacherSearch.trim();
    if (editingTimetable) {
      onUpdateTimetable({
        ...editingTimetable,
        ...timetableForm,
        teacherName: resolvedTeacher,
      });
      showToast('Timetable period updated.');
    } else {
      onAddTimetable({
        ...timetableForm,
        teacherName: resolvedTeacher,
        schoolId: selectedSchoolId === 'all' ? 'sch-leaders-cbse' : selectedSchoolId,
        campusId: selectedCampusId === 'all' ? 'cmp-chennai-hq' : selectedCampusId,
      });
      showToast('Added timetable period.');
    }
    setIsTimetableModalOpen(false);
  };

  const selectedFormSchool = schools.find((s) => s.id === userForm.schoolId);

  // Table column definitions
  const userColumns: TableColumn<SystemUser>[] = [
    {
      key: 'user',
      header: 'User Account',
      sortable: true,
      sortValue: (u) => u.fullName,
      exportValue: (u) => `${u.fullName} (${u.username})`,
      render: (u) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{u.fullName}</p>
          <p className="text-[11px] font-mono text-slate-500">
            @{u.username} · {u.email}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'RBAC Role',
      sortable: true,
      sortValue: (u) => u.role,
      render: (u) => (
        <span className="px-2 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] font-semibold text-[11px]">
          {u.role}
        </span>
      ),
    },
    {
      key: 'scope',
      header: 'School & Campus Scope',
      sortable: true,
      sortValue: (u) => getSchoolNameById(u.schoolId, schools),
      render: (u) => (
        <div>
          <p className="font-medium text-slate-800">
            {getSchoolNameById(u.schoolId, schools)}
          </p>
          <p className="text-[10.5px] text-slate-500">
            {getCampusNameById(u.schoolId, u.campusId, schools)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (u) => u.status,
      render: (u) => (
        <div className="space-y-0.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold ${
              u.status === 'Active'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {u.status}
          </span>
          {u.passwordResetRequired && (
            <p className="text-[10px] text-amber-700 font-medium">Reset Pending</p>
          )}
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (u) => (
        <span className="text-[11px] text-slate-500 font-mono">{u.lastLogin || '—'}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            title="Edit user & campus scope"
            disabled={!adminCrud.update}
            onClick={() => handleOpenUserModal(u)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-[#0B1F3A] hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Reset password"
            disabled={!adminCrud.update}
            onClick={() =>
              setConfirmState({
                open: true,
                title: 'Reset User Password',
                message: `Issue a forced password reset for ${u.fullName} (@${u.username})? This action will be recorded in Audit Logs.`,
                confirmLabel: 'Reset Password',
                tone: 'warning',
                action: () => {
                  onResetPassword(u.id);
                  showToast(`Password reset token issued for @${u.username}.`);
                },
              })
            }
            className="p-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-600 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={u.status === 'Active' ? 'Deactivate user' : 'Activate user'}
            disabled={!adminCrud.update}
            onClick={() =>
              setConfirmState({
                open: true,
                title: u.status === 'Active' ? 'Deactivate User Account' : 'Activate User Account',
                message:
                  u.status === 'Active'
                    ? `Deactivating @${u.username} will immediately block ERP access until reactivated.`
                    : `Reactivate @${u.username} and restore ${u.role} access?`,
                confirmLabel: u.status === 'Active' ? 'Deactivate' : 'Activate',
                tone: u.status === 'Active' ? 'danger' : 'navy',
                action: () => {
                  onToggleUserStatus(u.id);
                  showToast(
                    `Account @${u.username} is now ${
                      u.status === 'Active' ? 'Inactive' : 'Active'
                    }.`
                  );
                },
              })
            }
            className={`p-1.5 rounded-lg border disabled:opacity-40 cursor-pointer ${
              u.status === 'Active'
                ? 'border-rose-200 text-rose-700 hover:bg-rose-600 hover:text-white'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white'
            }`}
          >
            {u.status === 'Active' ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>
          {adminCrud.delete && (
            <button
              type="button"
              title="Delete user"
              onClick={() =>
                setConfirmState({
                  open: true,
                  title: 'Delete User Account',
                  message: `Permanently remove @${u.username} from preview accounts?`,
                  confirmLabel: 'Delete Account',
                  tone: 'danger',
                  action: () => {
                    onDeleteUser(u.id);
                    showToast(`Removed user @${u.username}.`);
                  },
                })
              }
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const classColumns: TableColumn<SchoolClass>[] = [
    {
      key: 'grade',
      header: 'Grade / Class Name',
      sortable: true,
      sortValue: (c) => c.gradeName,
      render: (c) => <span className="font-bold text-[#0B1F3A]">{c.gradeName}</span>,
    },
    {
      key: 'board',
      header: 'Education Board',
      sortable: true,
      sortValue: (c) => c.curriculum,
      render: (c) => (
        <span className="px-2 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] font-semibold text-[11px]">
          {c.curriculum}
        </span>
      ),
    },
    {
      key: 'sections',
      header: 'Sections',
      render: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.sections.map((sec) => (
            <span
              key={sec}
              className="px-2 py-0.5 rounded bg-amber-50 border border-[#D4AF37]/40 text-[#8A6712] text-[10.5px] font-bold"
            >
              Sec {sec}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'room',
      header: 'Room Number',
      render: (c) => <span className="font-mono text-slate-600">{c.roomNo}</span>,
    },
    {
      key: 'teacher',
      header: 'Class Teacher Incharge',
      sortable: true,
      sortValue: (c) => c.classTeacher || '',
      render: (c) => {
        const matchedStaff = staffList.find((s) => s.name === c.classTeacher);
        return (
          <div>
            <p className="font-semibold text-[#0B1F3A]">
              {c.classTeacher || 'Unassigned'}
            </p>
            {matchedStaff && (
              <p className="text-[10.5px] text-slate-500">
                {matchedStaff.empId} · {matchedStaff.department}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenClassModal(c)}
            className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() =>
              setConfirmState({
                open: true,
                title: 'Delete Class Master',
                message: `Delete "${c.gradeName}" and its sections (${c.sections.join(', ')})?`,
                confirmLabel: 'Delete Class',
                tone: 'danger',
                action: () => {
                  onDeleteClass(c.id);
                  showToast(`Deleted class "${c.gradeName}".`);
                },
              })
            }
            className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const auditColumns: TableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      sortValue: (a) => a.timestamp,
      render: (a) => <span className="font-mono text-slate-600 whitespace-nowrap">{a.timestamp}</span>,
    },
    {
      key: 'user',
      header: 'Actor',
      sortable: true,
      sortValue: (a) => a.userName,
      render: (a) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{a.userName}</p>
          <p className="text-[10.5px] font-mono text-slate-500">{a.userID}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Event Type',
      sortable: true,
      sortValue: (a) => a.actionType,
      render: (a) => (
        <span className="px-2 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] font-mono font-semibold text-[10.5px]">
          {a.actionType}
        </span>
      ),
    },
    {
      key: 'ref',
      header: 'Reference',
      render: (a) => <span className="font-mono text-slate-600">{a.referenceID}</span>,
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (a) => <span className="text-slate-700">{a.remarks}</span>,
    },
  ];

  const loginColumns: TableColumn<LoginHistoryEntry>[] = [
    {
      key: 'time',
      header: 'Login Time',
      sortable: true,
      sortValue: (l) => l.timestamp,
      render: (l) => <span className="font-mono text-slate-600 whitespace-nowrap">{l.timestamp}</span>,
    },
    {
      key: 'user',
      header: 'User & Role',
      sortable: true,
      sortValue: (l) => l.fullName,
      render: (l) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{l.fullName}</p>
          <p className="text-[10.5px] text-slate-500">
            @{l.username} · <span className="font-semibold text-[#9A7418]">{l.role}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'School / Campus Scope',
      render: (l) => (
        <div>
          <p className="font-medium text-slate-800">{l.schoolName}</p>
          <p className="text-[10.5px] text-slate-500">{l.campusName}</p>
        </div>
      ),
    },
    {
      key: 'device',
      header: 'IP & Device',
      render: (l) => (
        <div>
          <p className="font-mono text-[11px] text-slate-700">{l.ipAddress}</p>
          <p className="text-[10.5px] text-slate-500">{l.device}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Outcome',
      align: 'right',
      render: (l) => (
        <span
          className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
            l.status === 'Success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {l.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`System Administration & RBAC · ${contextLabel}`}
        title="System Administration, RBAC & Academic Masters"
        subtitle="Manage 19 enterprise roles, module CRUD permissions, school/campus access isolation, users, classes, audit logs, login history, and MySQL 8+ schema."
        tabs={[
          { id: 'users', label: `Users (${users.length})` },
          { id: 'roles', label: 'Roles (19)' },
          { id: 'permissions', label: 'CRUD Permissions' },
          { id: 'menus', label: 'Menu Control' },
          { id: 'classes', label: `Classes & Teachers (${classes.length})` },
          { id: 'subjects', label: `Subjects (${subjects.length})` },
          { id: 'timetables', label: `Timetables (${timetables.length})` },
          { id: 'database-schema', label: 'MySQL 8+ Schema (22)' },
          { id: 'audit', label: `Audit Logs (${auditLogs.length})` },
          { id: 'login-history', label: `Login History (${loginHistory.length})` },
          { id: 'school-settings', label: 'Settings & API' },
          { id: 'monitoring', label: 'Monitoring' },
        ]}
        activeTab={
          activeTab === 'academic-settings' ||
          activeTab === 'notification-settings' ||
          activeTab === 'api-config'
            ? 'school-settings'
            : activeTab
        }
        onTabChange={(id) => setActiveTab(id as AdminTab)}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('SETTINGS', 'settings-backup')}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
              >
                Backup &amp; Restore
              </button>
            )}
            {activeTab === 'users' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    downloadAdminSampleTemplate('users', 'xlsx', schools, staffList);
                    showToast('Exported sample Excel template for Application Users (.xlsx).');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Sample Excel Template</span>
                </button>
                <button
                  type="button"
                  disabled={!adminCrud.create}
                  onClick={() => setBulkImportEntity('users')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1F3A]/20 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Bulk Import</span>
                </button>
                <button
                  type="button"
                  disabled={!adminCrud.create}
                  onClick={() => handleOpenUserModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Add User Account</span>
                </button>
              </>
            )}
            {activeTab === 'classes' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    downloadAdminSampleTemplate('classes', 'xlsx', schools, staffList);
                    showToast('Exported sample Excel template for Classes & Teachers (.xlsx).');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Sample Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkImportEntity('classes')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1F3A]/20 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Bulk Import</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenClassModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Create Class</span>
                </button>
              </>
            )}
            {activeTab === 'subjects' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    downloadAdminSampleTemplate('subjects', 'xlsx', schools, staffList);
                    showToast('Exported sample Excel template for Subjects (.xlsx).');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Sample Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkImportEntity('subjects')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1F3A]/20 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Bulk Import</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSubjectModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Add Subject</span>
                </button>
              </>
            )}
            {activeTab === 'timetables' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    downloadAdminSampleTemplate('timetables', 'xlsx', schools, staffList);
                    showToast('Exported sample Excel template for Timetables (.xlsx).');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4AF37]/60 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Sample Excel Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkImportEntity('timetables')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#0B1F3A]/20 bg-white hover:bg-slate-50 text-[#0B1F3A] text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#9A7418]" />
                  <span>Bulk Import</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenTimetableModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Add Period</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {toastMessage && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. USER MANAGEMENT */}
      {activeTab === 'users' && (
        <EnterpriseDataTable
          title="Multi-School User Accounts & Access Scope"
          subtitle="Create accounts, assign any of the 19 RBAC roles, restrict campus access, activate/deactivate accounts, or trigger password resets."
          columns={userColumns}
          data={users}
          rowKey={(u) => u.id}
          exportFileName="erp_users"
          searchPlaceholder="Search name, username, role, or email..."
          searchFilter={(u, q) =>
            u.fullName.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
          }
        />
      )}

      {/* 2. ROLE MANAGEMENT (ALL 19 ROLES) */}
      {activeTab === 'roles' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">
                Enterprise RBAC Role Catalog (All 19 System Roles)
              </h2>
              <p className="text-[11px] text-slate-500">
                Click &ldquo;Preview Role&rdquo; to test module access and school/campus isolation live, or edit CRUD permissions.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#9A7418]">
              Active Role: {currentRole}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 p-4 bg-[#F8FAFC]">
            {ALL_ERP_ROLES.map((def) => {
              const userCount = users.filter((u) => u.role === def.role).length;
              const modCount = CORE_MODULE_IDS.filter((m) => {
                const c = getModuleCrud(def.role, m, permissionMatrix);
                return c.read || c.create || c.update || c.delete;
              }).length;
              const isCurrent = currentRole === def.role;

              return (
                <div
                  key={def.role}
                  className={`bg-white rounded-xl p-4 border flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-[#C9A227] ring-1 ring-[#C9A227]/40'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          #{String(def.index).padStart(2, '0')} · {def.shortCode}
                        </span>
                        <h3 className="text-sm font-bold text-[#0B1F3A] mt-0.5">
                          {def.role}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          def.scope === 'Platform' || def.scope === 'Organization'
                            ? 'bg-[#0B1F3A] text-[#D4AF37]'
                            : def.scope === 'School'
                            ? 'bg-sky-50 text-sky-800 border border-sky-200'
                            : def.scope === 'Campus'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {def.scope}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      {def.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="tabular-nums">
                        <strong className="text-[#0B1F3A]">{modCount}/17</strong> modules
                      </span>
                      <span className="tabular-nums">
                        <strong className="text-[#0B1F3A]">{userCount}</strong> account(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPermRole(def.role);
                          setActiveTab('permissions');
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:border-[#0B1F3A] text-[11px] font-semibold text-[#0B1F3A] transition-colors cursor-pointer"
                      >
                        CRUD Matrix
                      </button>
                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => {
                          onSwitchPreviewRole(def.role);
                          showToast(`Switched preview workspace to ${def.role} (${def.scope} scope).`);
                        }}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-[#0B1F3A] hover:bg-[#132E54] text-white'
                        }`}
                      >
                        {isCurrent ? 'Active Role' : 'Preview Role'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PERMISSION MANAGEMENT (INTERACTIVE CRUD MATRIX) */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F8FAFC]">
            <div>
              <h2 className="text-sm font-bold text-[#0B1F3A]">
                Module-Based Create / Read / Update / Delete (CRUD) Matrix
              </h2>
              <p className="text-[11px] text-slate-500">
                Changes apply immediately to sidebar navigation visibility and module action controls.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Configure Role:</label>
              <select
                value={selectedPermRole}
                onChange={(e) => setSelectedPermRole(e.target.value as ErpRole)}
                className="px-3 py-1.5 text-xs font-bold text-[#0B1F3A] bg-white border border-slate-300 rounded-lg"
              >
                {ALL_ERP_ROLES.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.index}. {r.role} ({r.scope})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-semibold">Module</th>
                  <th className="px-4 py-3 font-semibold text-center">Create (C)</th>
                  <th className="px-4 py-3 font-semibold text-center">Read (R)</th>
                  <th className="px-4 py-3 font-semibold text-center">Update (U)</th>
                  <th className="px-4 py-3 font-semibold text-center">Delete (D)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MAIN_ERP_MENUS.map((menu) => {
                  const crud = getModuleCrud(selectedPermRole, menu.id, permissionMatrix);
                  const fields: Array<keyof CrudPermissionSet> = [
                    'create',
                    'read',
                    'update',
                    'delete',
                  ];
                  return (
                    <tr key={menu.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#0B1F3A]">
                          {menu.index}. {menu.label}
                        </p>
                        <p className="text-[10.5px] text-slate-500">{menu.description}</p>
                      </td>
                      {fields.map((field) => (
                        <td key={field} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={crud[field]}
                            disabled={
                              selectedPermRole === 'Super Administrator' && menu.id === 'ADMIN'
                            }
                            onChange={(e) => {
                              onUpdatePermission(
                                selectedPermRole,
                                menu.id,
                                field,
                                e.target.checked
                              );
                              showToast(
                                `Updated ${selectedPermRole} → ${menu.shortLabel} (${field.toUpperCase()}: ${
                                  e.target.checked ? 'Allowed' : 'Denied'
                                })`
                              );
                            }}
                            className="w-4 h-4 accent-[#0B1F3A] cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MENU MANAGEMENT (FULL HIERARCHY, DRAG-AND-DROP, DEPENDENCY CHECKS & RBAC) */}
      {activeTab === 'menus' && (
        <MenuManagementModule
          currentRole={currentRole}
          managedMenus={managedMenus}
          onChangeManagedMenus={onChangeManagedMenus}
          permissionMatrix={permissionMatrix}
          menuOperationPermissions={menuOperationPermissions}
          onUpdateMenuOperationPermission={onUpdateMenuOperationPermission}
          onNotify={showToast}
        />
      )}

      {/* 5. CLASS & SECTION MASTERS WITH LIVE STAFF PICKER */}
      {activeTab === 'classes' && (
        <EnterpriseDataTable
          title="Class, Section & Class Teacher Master"
          subtitle="Create classes across boards and assign Class Teacher Incharge directly from the live Staff directory."
          columns={classColumns}
          data={classes}
          rowKey={(c) => c.id}
          exportFileName="class_section_masters"
          searchPlaceholder="Search class, board, room, or class teacher..."
          searchFilter={(c, q) =>
            c.gradeName.toLowerCase().includes(q) ||
            c.curriculum.toLowerCase().includes(q) ||
            (c.classTeacher || '').toLowerCase().includes(q) ||
            c.roomNo.toLowerCase().includes(q)
          }
        />
      )}

      {/* 6. SUBJECTS MASTER */}
      {activeTab === 'subjects' && (
        <EnterpriseDataTable
          title="Academic Subjects Catalog"
          subtitle="Core, elective, and co-scholastic subjects scoped to the active school."
          columns={[
            {
              key: 'code',
              header: 'Code',
              sortable: true,
              sortValue: (s) => s.code,
              render: (s) => <span className="font-mono font-bold text-[#0B1F3A]">{s.code}</span>,
            },
            {
              key: 'name',
              header: 'Subject Name',
              sortable: true,
              sortValue: (s) => s.name,
              render: (s) => <span className="font-semibold text-[#0B1F3A]">{s.name}</span>,
            },
            {
              key: 'type',
              header: 'Category',
              render: (s) => <span className="text-slate-700">{s.type}</span>,
            },
            {
              key: 'grade',
              header: 'Grade Level',
              render: (s) => <span className="text-slate-600">{s.gradeLevel}</span>,
            },
            {
              key: 'max',
              header: 'Max Marks',
              align: 'right',
              render: (s) => <span className="font-mono font-semibold">{s.maxMarks}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (s) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSubjectModal(s)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmState({
                        open: true,
                        title: 'Delete Subject',
                        message: `Remove subject "${s.name}" (${s.code})?`,
                        confirmLabel: 'Delete',
                        tone: 'danger',
                        action: () => {
                          onDeleteSubject(s.id);
                          showToast(`Deleted subject "${s.name}".`);
                        },
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={subjects}
          rowKey={(s) => s.id}
          exportFileName="subjects_master"
          searchPlaceholder="Search subject code, name, or grade..."
          searchFilter={(s, q) =>
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.gradeLevel.toLowerCase().includes(q)
          }
        />
      )}

      {/* 7. TIMETABLES BUILDER */}
      {activeTab === 'timetables' && (
        <EnterpriseDataTable
          title="Weekly Class Timetable Builder"
          subtitle="Period schedules with searchable faculty assignments from Staff Management."
          columns={[
            {
              key: 'class',
              header: 'Class & Section',
              sortable: true,
              sortValue: (t) => `${t.grade}-${t.section}`,
              render: (t) => (
                <span className="font-bold text-[#0B1F3A]">
                  {t.grade} · Sec {t.section}
                </span>
              ),
            },
            {
              key: 'day',
              header: 'Day & Period',
              render: (t) => (
                <div>
                  <p className="font-semibold text-slate-800">
                    {t.day} · Period {t.periodNo}
                  </p>
                  <p className="text-[10.5px] font-mono text-slate-500">{t.timeSlot}</p>
                </div>
              ),
            },
            {
              key: 'subject',
              header: 'Subject',
              render: (t) => <span className="font-medium text-[#0B1F3A]">{t.subjectName}</span>,
            },
            {
              key: 'teacher',
              header: 'Assigned Faculty',
              render: (t) => <span className="text-slate-700">{t.teacherName}</span>,
            },
            {
              key: 'actions',
              header: 'Actions',
              align: 'right',
              render: (t) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenTimetableModal(t)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-semibold text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTimetable(t.id)}
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          data={timetables}
          rowKey={(t) => t.id}
          exportFileName="timetable_schedule"
          searchPlaceholder="Search class, day, subject, or teacher..."
          searchFilter={(t, q) =>
            t.grade.toLowerCase().includes(q) ||
            t.subjectName.toLowerCase().includes(q) ||
            t.teacherName.toLowerCase().includes(q) ||
            t.day.toLowerCase().includes(q)
          }
        />
      )}

      {/* 8. MYSQL 8+ NORMALIZED DATABASE ARCHITECTURE */}
      {activeTab === 'database-schema' && <DatabaseArchitecturePanel />}

      {/* 9. AUDIT LOGS */}
      {activeTab === 'audit' && (
        <EnterpriseDataTable
          title="Security & Operations Audit Logs"
          subtitle="Tracks logins, role permission updates, password resets, user activations, fee receipts, and stock adjustments."
          columns={auditColumns}
          data={auditLogs}
          rowKey={(a) => a.id}
          exportFileName="erp_audit_logs"
          searchPlaceholder="Search actor, event type, reference, or remarks..."
          searchFilter={(a, q) =>
            a.userName.toLowerCase().includes(q) ||
            a.actionType.toLowerCase().includes(q) ||
            a.referenceID.toLowerCase().includes(q) ||
            a.remarks.toLowerCase().includes(q)
          }
        />
      )}

      {/* 10. LOGIN HISTORY */}
      {activeTab === 'login-history' && (
        <EnterpriseDataTable
          title="Authentication & Login History"
          subtitle="Chronological sign-in and role-switch audit across all schools and campuses."
          columns={loginColumns}
          data={loginHistory}
          rowKey={(l) => l.id}
          exportFileName="erp_login_history"
          searchPlaceholder="Search user, role, school, IP, or status..."
          searchFilter={(l, q) =>
            l.fullName.toLowerCase().includes(q) ||
            l.username.toLowerCase().includes(q) ||
            l.role.toLowerCase().includes(q) ||
            l.schoolName.toLowerCase().includes(q) ||
            l.ipAddress.toLowerCase().includes(q)
          }
        />
      )}

      {/* 11. SCHOOL, ACADEMIC, NOTIFICATION & API SETTINGS */}
      {(activeTab === 'school-settings' ||
        activeTab === 'academic-settings' ||
        activeTab === 'notification-settings' ||
        activeTab === 'api-config') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#0B1F3A]">
              <Sliders className="w-4 h-4 text-[#9A7418]" />
              <h3 className="text-sm font-bold">School &amp; Academic Settings</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minimum Attendance Threshold (%)
                </label>
                <input
                  type="number"
                  defaultValue={75}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Auto-Promotion Grading Rule
                </label>
                <select className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg">
                  <option>Pass all core subjects (&gt;= 35%)</option>
                  <option>CBSE 9-Point Scale (Grade D or above)</option>
                  <option>IB Criterion Minimum Level 3</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#0B1F3A]">
              <Server className="w-4 h-4 text-[#9A7418]" />
              <h3 className="text-sm font-bold">
                Notification &amp; Django REST API Configuration
              </h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Planned Django REST API Base URL
                </label>
                <input
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SMS Gateway</label>
                  <input
                    type="text"
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email SMTP</label>
                  <input
                    type="text"
                    value={emailSmtpHost}
                    onChange={(e) => setEmailSmtpHost(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-lg border border-slate-200 cursor-pointer">
                <span className="font-semibold text-[#0B1F3A]">
                  WhatsApp Official Business API Dispatch
                </span>
                <input
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#0B1F3A]"
                />
              </label>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {schoolSettingNote ? (
                <span className="text-xs font-semibold text-emerald-700">
                  Configuration saved to UI preview
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Frontend preview · Ready for Django REST endpoints
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setSchoolSettingNote(true);
                  setTimeout(() => setSchoolSettingNote(false), 3000);
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. SYSTEM MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0B1F3A] font-bold text-sm">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Multi-Tenant Isolation</span>
            </div>
            <p className="text-xs text-slate-600">
              Active tenant filtering enforced across{' '}
              <strong>{schools.length} schools</strong> and{' '}
              <strong>{schools.reduce((a, s) => a + s.campuses.length, 0)} campuses</strong>.
            </p>
            <p className="text-[11px] font-mono text-emerald-700 font-semibold">
              Mode: Frontend Preview State
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0B1F3A] font-bold text-sm">
              <Shield className="w-4 h-4 text-[#9A7418]" />
              <span>RBAC Engine</span>
            </div>
            <p className="text-xs text-slate-600">
              <strong>19 Roles</strong> · <strong>17 Modules</strong> · Granular C/R/U/D rules active for{' '}
              <strong>{currentRole}</strong>.
            </p>
            <p className="text-[11px] font-mono text-[#0B1F3A] font-semibold">
              {users.filter((u) => u.status === 'Active').length} Active / {users.length} Total Accounts
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-[#0B1F3A] font-bold text-sm">
              <Database className="w-4 h-4 text-sky-700" />
              <span>Target Backend Stack</span>
            </div>
            <p className="text-xs text-slate-600">
              Designed for <strong>Python Django REST Framework</strong> +{' '}
              <strong>MySQL 8.0+</strong> (22 normalized table groups).
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('database-schema')}
              className="text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] cursor-pointer"
            >
              Inspect MySQL 8+ Schema →
            </button>
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      <EnterpriseFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit User Account & Scope' : 'Create Multi-School User Account'}
        subtitle="Assign role, school isolation tenant, and campus-level restriction"
      >
        <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                placeholder="e.g. Dr. Arun Kumar"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Username *</label>
              <input
                type="text"
                required
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="e.g. arun_principal"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Email *</label>
              <input
                type="email"
                required
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Phone</label>
              <input
                type="text"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                placeholder="+91 98450 00000"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">Assigned Role (19 Roles) *</label>
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value as ErpRole })
              }
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-semibold"
            >
              {ALL_ERP_ROLES.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.index}. {r.role} — ({r.scope} Scope)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                School Isolation Scope
              </label>
              <select
                value={userForm.schoolId}
                onChange={(e) =>
                  setUserForm({
                    ...userForm,
                    schoolId: e.target.value,
                    campusId: 'all',
                  })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                <option value="all">All Schools (Platform / Org)</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Campus Access Restriction
              </label>
              <select
                value={userForm.campusId}
                disabled={userForm.schoolId === 'all'}
                onChange={(e) => setUserForm({ ...userForm, campusId: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg disabled:opacity-50"
              >
                <option value="all">All Campuses in School</option>
                {selectedFormSchool?.campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              {editingUser ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* CREATE / EDIT CLASS MODAL — WITH LIVE SEARCHABLE STAFF PICKER FOR CLASS TEACHER */}
      <EnterpriseFormModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        title={editingClass ? 'Edit Class & Class Teacher' : 'Create New Class'}
        subtitle="Search and select Class Teacher Incharge directly from active Staff records"
      >
        <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">Grade Name *</label>
            <input
              type="text"
              required
              value={classForm.gradeName}
              onChange={(e) => setClassForm({ ...classForm, gradeName: e.target.value })}
              placeholder="e.g. PRE-KG, Class 1, Class 10"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Curriculum Board</label>
              <select
                value={classForm.curriculum}
                onChange={(e) =>
                  setClassForm({
                    ...classForm,
                    curriculum: e.target.value as SchoolClass['curriculum'],
                  })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="IB">IB</option>
                <option value="Cambridge IGCSE">Cambridge IGCSE</option>
                <option value="State Board">State Board</option>
                <option value="Matriculation">Matriculation</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Room Number</label>
              <input
                type="text"
                value={classForm.roomNo}
                onChange={(e) => setClassForm({ ...classForm, roomNo: e.target.value })}
                placeholder="Block A - Room 104"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">
              Sections (comma separated) *
            </label>
            <input
              type="text"
              required
              value={classForm.sectionsStr}
              onChange={(e) => setClassForm({ ...classForm, sectionsStr: e.target.value })}
              placeholder="A, B, C"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>

          {/* LIVE SEARCHABLE STAFF SELECTOR FOR CLASS TEACHER INCHARGE */}
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-[#0B1F3A]">
                Class Teacher Incharge (Search Staff Directory)
              </label>
              <span className="text-[10.5px] text-slate-500">
                {activeStaffPool.length} active staff available
              </span>
            </div>

            {classForm.classTeacher && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-[#0B1F3A]/5 border border-[#0B1F3A]/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#0B1F3A] truncate">
                      {classForm.classTeacher}
                    </p>
                    {(() => {
                      const st = staffList.find((s) => s.name === classForm.classTeacher);
                      return st ? (
                        <p className="text-[10.5px] text-slate-500 truncate">
                          {st.empId} · {st.designation} · {st.department}
                        </p>
                      ) : null;
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClassForm((prev) => ({ ...prev, classTeacher: '' }));
                    setStaffSearchQuery('');
                    setIsStaffDropdownOpen(true);
                  }}
                  className="text-[11px] font-semibold text-rose-600 hover:underline shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={staffSearchQuery}
                onFocus={() => setIsStaffDropdownOpen(true)}
                onChange={(e) => {
                  setStaffSearchQuery(e.target.value);
                  setIsStaffDropdownOpen(true);
                }}
                placeholder="Type staff name, Emp ID, department, or subject to search..."
                className="w-full pl-9 pr-8 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
              />
              {staffSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setStaffSearchQuery('');
                    setClassForm((prev) => ({ ...prev, classTeacher: '' }));
                    setIsStaffDropdownOpen(true);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isStaffDropdownOpen && (
              <div className="mt-1.5 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y divide-slate-100">
                {matchingClassTeacherStaff.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-slate-500">
                    No active staff matching &ldquo;{staffSearchQuery}&rdquo;.
                  </div>
                ) : (
                  matchingClassTeacherStaff.map((staff) => {
                    const isSelected = classForm.classTeacher === staff.name;
                    return (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => handleSelectClassTeacher(staff)}
                        className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B1F3A]/8'
                            : 'hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#0B1F3A] truncate">
                            {staff.name}
                          </p>
                          <p className="text-[10.5px] text-slate-500 truncate">
                            {staff.empId} · {staff.designation} · {staff.department}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold shrink-0">
                          {isSelected ? 'Selected' : 'Assign'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsClassModalOpen(false)}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              {editingClass ? 'Save Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* SUBJECT MODAL */}
      <EnterpriseFormModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add Academic Subject'}
      >
        <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Subject Code *</label>
              <input
                type="text"
                required
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                placeholder="MAT101"
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Max Marks</label>
              <input
                type="number"
                value={subjectForm.maxMarks}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, maxMarks: Number(e.target.value) || 100 })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">Subject Name *</label>
            <input
              type="text"
              required
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              placeholder="Mathematics (Standard)"
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Type</label>
              <select
                value={subjectForm.type}
                onChange={(e) =>
                  setSubjectForm({
                    ...subjectForm,
                    type: e.target.value as SchoolSubject['type'],
                  })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
                <option value="Co-Scholastic">Co-Scholastic</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Grade Level</label>
              <input
                type="text"
                value={subjectForm.gradeLevel}
                onChange={(e) =>
                  setSubjectForm({ ...subjectForm, gradeLevel: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubjectModalOpen(false)}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Save Subject
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* TIMETABLE MODAL WITH SEARCHABLE STAFF PICKER */}
      <EnterpriseFormModal
        isOpen={isTimetableModalOpen}
        onClose={() => setIsTimetableModalOpen(false)}
        title={editingTimetable ? 'Edit Timetable Slot' : 'Add Timetable Period'}
      >
        <form onSubmit={handleSaveTimetable} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Grade *</label>
              <input
                type="text"
                required
                value={timetableForm.grade}
                onChange={(e) => setTimetableForm({ ...timetableForm, grade: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Section *</label>
              <input
                type="text"
                required
                value={timetableForm.section}
                onChange={(e) =>
                  setTimetableForm({ ...timetableForm, section: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Day</label>
              <select
                value={timetableForm.day}
                onChange={(e) =>
                  setTimetableForm({
                    ...timetableForm,
                    day: e.target.value as TimetableEntry['day'],
                  })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Time Slot</label>
              <input
                type="text"
                value={timetableForm.timeSlot}
                onChange={(e) =>
                  setTimetableForm({ ...timetableForm, timeSlot: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">Subject *</label>
            <input
              type="text"
              required
              value={timetableForm.subjectName}
              onChange={(e) =>
                setTimetableForm({ ...timetableForm, subjectName: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>

          <div className="relative">
            <label className="block font-semibold text-[#0B1F3A] mb-1">
              Assign Faculty (Search Staff)
            </label>
            <input
              type="text"
              value={ttTeacherSearch}
              onFocus={() => setIsTtTeacherDropdownOpen(true)}
              onChange={(e) => {
                setTtTeacherSearch(e.target.value);
                setTimetableForm((prev) => ({ ...prev, teacherName: e.target.value }));
                setIsTtTeacherDropdownOpen(true);
              }}
              placeholder="Search faculty name or department..."
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
            {isTtTeacherDropdownOpen && matchingTimetableStaff.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100">
                {matchingTimetableStaff.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setTimetableForm((prev) => ({ ...prev, teacherName: st.name }));
                      setTtTeacherSearch(st.name);
                      setIsTtTeacherDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-semibold text-[#0B1F3A]">{st.name}</span>
                    <span className="text-[10.5px] text-slate-500">{st.department}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTimetableModalOpen(false)}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Save Slot
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* BULK EXCEL/CSV IMPORT MODAL */}
      <AdminBulkImportModal
        isOpen={Boolean(bulkImportEntity)}
        entity={bulkImportEntity || 'users'}
        onClose={() => setBulkImportEntity(null)}
        schools={schools}
        staffList={staffList}
        defaultSchoolId={selectedSchoolId}
        defaultCampusId={selectedCampusId}
        existingUsers={users}
        existingClasses={classes}
        existingSubjects={subjects}
        existingTimetables={timetables}
        onCommitImport={(entity, result, updateExisting) => {
          let created = 0;
          let updated = 0;
          if (onBulkImport) {
            const summary = onBulkImport(entity, result, updateExisting);
            created = summary.created;
            updated = summary.updated;
          } else {
            result.rows.forEach((row) => {
              if (!row.payload || row.action === 'error') return;
              if (row.action === 'create') {
                if (entity === 'users') onAddUser(row.payload as Omit<SystemUser, 'id'>);
                if (entity === 'classes') onAddClass(row.payload as Omit<SchoolClass, 'id'>);
                if (entity === 'subjects') onAddSubject(row.payload as Omit<SchoolSubject, 'id'>);
                if (entity === 'timetables') onAddTimetable(row.payload as Omit<TimetableEntry, 'id'>);
                created += 1;
              } else if (row.action === 'update' && updateExisting && row.existingId) {
                if (entity === 'users')
                  onUpdateUser({ ...(row.payload as Omit<SystemUser, 'id'>), id: row.existingId });
                if (entity === 'classes')
                  onUpdateClass({ ...(row.payload as Omit<SchoolClass, 'id'>), id: row.existingId });
                if (entity === 'subjects')
                  onUpdateSubject({ ...(row.payload as Omit<SchoolSubject, 'id'>), id: row.existingId });
                if (entity === 'timetables')
                  onUpdateTimetable({ ...(row.payload as Omit<TimetableEntry, 'id'>), id: row.existingId });
                updated += 1;
              }
            });
          }
          showToast(
            `Bulk import completed for ${ADMIN_IMPORT_SCHEMAS[entity].label}: ${created} created, ${updated} updated.`
          );
        }}
      />

      {/* CONFIRMATION DIALOG */}
      <EnterpriseConfirmDialog
        isOpen={Boolean(confirmState?.open)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel || 'Confirm'}
        tone={confirmState?.tone || 'danger'}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          confirmState?.action();
          setConfirmState(null);
        }}
      />
    </div>
  );
};
