import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  Bus,
  Droplets,
  Hash,
  Users,
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Globe,
  Layers,
  UserCheck,
} from 'lucide-react';
import {
  DynamicRoleRecord,
  ErpRole,
  SchoolClass,
  Student,
  SystemUser,
  UserAccessScope,
} from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  DependentHierarchyOptionsResponse,
  fetchActiveRoles,
  fetchDependentHierarchyOptions,
} from '../services/erpBackendService';

export type RegistrationFormMode = 'student' | 'portal';

export interface PortalRegistrationPayload {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  roleId?: string;
  role: ErpRole;
  organizationId?: string;
  accessScope: UserAccessScope;
  schoolId: string;
  campusId: string;
  schoolIds: string[];
  campusIds: string[];
  academicYearId?: string;
  classId?: string;
  section?: string;
  linkedStudentIds?: string[];
  department?: string;
  address: string;
  city: string;
  postalCode: string;
  username: string;
  password?: string;
  status: 'Active' | 'Inactive';
}

interface ResponsiveRegistrationFormProps {
  mode: RegistrationFormMode;
  currentActorRole?: ErpRole;
  editingUser?: SystemUser | null;
  availableClasses?: SchoolClass[];
  availableStudents?: Student[];
  rolesRefreshKey?: number;
  autoCloseOnSubmit?: boolean;
  onRegisterStudent?: (student: Omit<Student, 'id'>) => void;
  onRegisterPortalUser?: (payload: PortalRegistrationPayload) => void | Promise<void>;
  onCancel?: () => void;
  onViewDirectory?: () => void;
}

const GRADE_OPTIONS = [
  'Pre-KG',
  'LKG',
  'UKG',
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
];

const SECTION_OPTIONS = ['A', 'B', 'C', 'D'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BUS_ROUTES = ['Own Transport (Day Scholar)'];

function generateAdmissionNumber(): string {
  return `TLGS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function evaluatePasswordStrength(pwd: string): {
  score: number;
  label: string;
  barClass: string;
  textClass: string;
} {
  if (!pwd) {
    return {
      score: 0,
      label: 'Enter a password',
      barClass: 'bg-slate-200',
      textClass: 'text-slate-500',
    };
  }
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: 'Weak',
      barClass: 'bg-rose-500',
      textClass: 'text-rose-600',
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: 'Fair',
      barClass: 'bg-amber-500',
      textClass: 'text-amber-700',
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: 'Good',
      barClass: 'bg-sky-500',
      textClass: 'text-sky-700',
    };
  }
  return {
    score: 4,
    label: 'Strong',
    barClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
  };
}

function parseAddressString(raw?: string): {
  street: string;
  city: string;
  state: string;
  postal: string;
} {
  if (!raw || !raw.trim()) {
    return { street: '', city: '', state: '', postal: '' };
  }
  const parts = raw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 1) return { street: parts[0], city: '', state: '', postal: '' };
  if (parts.length === 2) return { street: parts[0], city: parts[1], state: '', postal: '' };
  if (parts.length === 3)
    return { street: parts[0], city: parts[1], state: parts[2], postal: '' };
  return {
    street: parts.slice(0, parts.length - 3).join(', '),
    city: parts[parts.length - 3] || '',
    state: parts[parts.length - 2] || '',
    postal: parts[parts.length - 1] || '',
  };
}

function inferDefaultScopeForRole(
  roleRecord: DynamicRoleRecord | undefined,
  isSuperAdminActor: boolean
): UserAccessScope {
  if (!roleRecord) return 'single_school';
  if (roleRecord.scope === 'Platform') {
    return isSuperAdminActor ? 'all_schools' : 'single_school';
  }
  if (roleRecord.scope === 'Organization') {
    return 'selected_schools';
  }
  return 'single_school';
}

export const ResponsiveRegistrationForm: React.FC<
  ResponsiveRegistrationFormProps
> = ({
  mode,
  currentActorRole = 'Super Administrator',
  editingUser = null,
  availableClasses = [],
  availableStudents = [],
  rolesRefreshKey = 0,
  autoCloseOnSubmit = false,
  onRegisterStudent,
  onRegisterPortalUser,
  onCancel,
  onViewDirectory,
}) => {
  const isStudentMode = mode === 'student';
  const isEditMode = Boolean(!isStudentMode && editingUser);
  const isSuperAdminActor = currentActorRole === 'Super Administrator';

  const {
    organizations: ctxOrganizations,
    schools: ctxSchools,
    academicYears: ctxAcademicYears,
    selectedSchoolId: ctxSelectedSchoolId,
    selectedCampusId: ctxSelectedCampusId,
    selectedAcademicYearId: ctxSelectedAcademicYearId,
  } = useSchoolContext();

  // Dynamic Roles state (fetched from Role Management API)
  const [roles, setRoles] = useState<DynamicRoleRecord[]>([]);
  const [rolesLoading, setRolesLoading] = useState(!isStudentMode);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Dependent Hierarchy state (Organization -> School -> Campus -> Academic Year -> Class -> Students)
  const [hierarchyOptions, setHierarchyOptions] =
    useState<DependentHierarchyOptionsResponse | null>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  // Personal fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');

  // Student admission mode fields
  const [admissionNo, setAdmissionNo] = useState(generateAdmissionNumber);
  const [rollNo, setRollNo] = useState('');
  const [grade, setGrade] = useState('Class 10');
  const [section, setSection] = useState('A');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [busRoute, setBusRoute] = useState(BUS_ROUTES[0]);

  // Portal user role & access scope fields
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ErpRole | ''>('');
  const [accessScope, setAccessScope] = useState<UserAccessScope>('single_school');
  const [organizationId, setOrganizationId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [campusId, setCampusId] = useState('all');
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  // Role-specific conditional fields (Student & Parent roles in portal mode)
  const [academicYearId, setAcademicYearId] = useState('');
  const [classId, setClassId] = useState('');
  const [portalSection, setPortalSection] = useState('');
  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Account security fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address & declaration
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Validation & submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<{
    referenceId: string;
    fullName: string;
    summaryLine: string;
    email: string;
    phone: string;
    portalPayload?: PortalRegistrationPayload;
  } | null>(null);

  // Fetch active roles dynamically from Role Management API
  const loadRoles = useCallback(async () => {
    if (isStudentMode) return;
    setRolesLoading(true);
    setRolesError(null);
    try {
      const res = await fetchActiveRoles({ assignableOnly: true });
      const activeRoles = (res.roles || []).filter((r) => r.isActive);
      setRoles(activeRoles);

      setSelectedRole((prevRole) => {
        if (prevRole) {
          const matched = activeRoles.find((r) => r.name === prevRole);
          if (matched) {
            setSelectedRoleId(matched.id);
            return prevRole;
          }
        }
        return prevRole;
      });
    } catch (err: any) {
      setRolesError(
        err?.message || 'Unable to load active roles from Role Management.'
      );
    } finally {
      setRolesLoading(false);
    }
  }, [isStudentMode]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles, rolesRefreshKey]);

  // Fetch dependent hierarchy options from backend API (falling back smoothly to live SchoolContext)
  const loadHierarchy = useCallback(
    async (orgFilter?: string, schFilter?: string) => {
      if (isStudentMode) return;
      setHierarchyLoading(true);
      setHierarchyError(null);
      try {
        const res = await fetchDependentHierarchyOptions({
          organizationId: orgFilter || undefined,
          schoolId: schFilter || undefined,
        });
        setHierarchyOptions(res);
      } catch (err: any) {
        setHierarchyError(
          err?.message || 'Unable to refresh organization and school options.'
        );
      } finally {
        setHierarchyLoading(false);
      }
    },
    [isStudentMode]
  );

  useEffect(() => {
    if (!isStudentMode) {
      void loadHierarchy(organizationId || undefined, schoolId || undefined);
    }
  }, [isStudentMode, organizationId, schoolId, loadHierarchy]);

  // Close role searchable dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hydrate form when editingUser changes (or initialize defaults for new user)
  useEffect(() => {
    if (isStudentMode) return;
    setSubmitError(null);
    setErrors({});
    setSubmittedRecord(null);

    if (editingUser) {
      const parsedAddr = parseAddressString(editingUser.address);
      const resolvedScope: UserAccessScope =
        editingUser.accessScope ||
        (editingUser.schoolId === 'all'
          ? 'all_schools'
          : editingUser.schoolIds && editingUser.schoolIds.length > 1
          ? 'selected_schools'
          : 'single_school');

      setFullName(editingUser.fullName || '');
      setUsername(editingUser.username || '');
      setEmail(editingUser.email || '');
      setPhone(editingUser.phone || '');
      setDob(editingUser.dob || '');
      setGender(editingUser.gender || 'Female');
      setSelectedRole(editingUser.role);
      setSelectedRoleId(editingUser.roleId || '');
      setAccessScope(
        !isSuperAdminActor && resolvedScope === 'all_schools'
          ? 'single_school'
          : resolvedScope
      );
      setOrganizationId(editingUser.organizationId || '');
      setSchoolId(
        editingUser.schoolId && editingUser.schoolId !== 'all'
          ? editingUser.schoolId
          : editingUser.schoolIds?.[0] || ''
      );
      setCampusId(editingUser.campusId || 'all');
      setSelectedSchoolIds(
        editingUser.schoolIds && editingUser.schoolIds.length > 0
          ? editingUser.schoolIds
          : editingUser.schoolId && editingUser.schoolId !== 'all'
          ? [editingUser.schoolId]
          : []
      );
      setSelectedCampusIds(
        editingUser.campusIds && editingUser.campusIds.length > 0
          ? editingUser.campusIds
          : editingUser.campusId && editingUser.campusId !== 'all'
          ? [editingUser.campusId]
          : []
      );
      setAcademicYearId(editingUser.academicYearId || '');
      setClassId(editingUser.classId || '');
      setPortalSection(editingUser.section || '');
      setLinkedStudentIds(editingUser.linkedStudentIds || []);
      setDepartment(editingUser.department || '');
      setStatus(editingUser.status || 'Active');
      setStreetAddress(parsedAddr.street);
      setCity(parsedAddr.city);
      setStateName(parsedAddr.state);
      setPostalCode(parsedAddr.postal);
      setPassword('');
      setConfirmPassword('');
      setAcceptedTerms(true);
    } else {
      const initialSchoolId =
        ctxSelectedSchoolId && ctxSelectedSchoolId !== 'all'
          ? ctxSelectedSchoolId
          : ctxSchools[0]?.id || '';
      const initialSchool = ctxSchools.find((s) => s.id === initialSchoolId);
      const initialCampusId =
        ctxSelectedCampusId && ctxSelectedCampusId !== 'all'
          ? ctxSelectedCampusId
          : 'all';

      setFullName('');
      setUsername('');
      setEmail('');
      setPhone('');
      setDob('');
      setGender('Female');
      setSelectedRole('');
      setSelectedRoleId('');
      setAccessScope('single_school');
      setOrganizationId(initialSchool?.organizationId || ctxOrganizations[0]?.id || '');
      setSchoolId(initialSchoolId);
      setCampusId(initialCampusId);
      setSelectedSchoolIds(initialSchoolId ? [initialSchoolId] : []);
      setSelectedCampusIds(initialCampusId !== 'all' ? [initialCampusId] : []);
      setAcademicYearId(ctxSelectedAcademicYearId || ctxAcademicYears[0]?.id || '');
      setClassId('');
      setPortalSection('');
      setLinkedStudentIds([]);
      setDepartment('');
      setStatus('Active');
      setStreetAddress('');
      setCity('');
      setStateName('');
      setPostalCode('');
      setPassword('');
      setConfirmPassword('');
      setAcceptedTerms(false);
    }
  }, [
    editingUser,
    isStudentMode,
    isSuperAdminActor,
    ctxOrganizations,
    ctxSchools,
    ctxAcademicYears,
    ctxSelectedSchoolId,
    ctxSelectedCampusId,
    ctxSelectedAcademicYearId,
  ]);

  // Synchronize selectedRoleId once roles arrive in edit mode
  useEffect(() => {
    if (selectedRole && !selectedRoleId && roles.length > 0) {
      const match = roles.find((r) => r.name === selectedRole);
      if (match) setSelectedRoleId(match.id);
    }
  }, [selectedRole, selectedRoleId, roles]);

  // Resolved live options combining backend response + SchoolContext
  const allOrganizations = useMemo(() => {
    if (hierarchyOptions?.organizations && hierarchyOptions.organizations.length > 0) {
      return hierarchyOptions.organizations;
    }
    return ctxOrganizations;
  }, [hierarchyOptions, ctxOrganizations]);

  const allSchoolsPool = useMemo(() => {
    if (hierarchyOptions?.schools && hierarchyOptions.schools.length > 0) {
      return hierarchyOptions.schools;
    }
    if (organizationId) {
      return ctxSchools.filter(
        (s) => !s.organizationId || s.organizationId === organizationId
      );
    }
    return ctxSchools;
  }, [hierarchyOptions, ctxSchools, organizationId]);

  const allAcademicYears = useMemo(() => {
    if (hierarchyOptions?.academicYears && hierarchyOptions.academicYears.length > 0) {
      return hierarchyOptions.academicYears;
    }
    return ctxAcademicYears;
  }, [hierarchyOptions, ctxAcademicYears]);

  const allClassesPool = useMemo(() => {
    const source =
      hierarchyOptions?.classes && hierarchyOptions.classes.length > 0
        ? hierarchyOptions.classes
        : availableClasses;
    if (schoolId && accessScope === 'single_school') {
      return source.filter((c) => !c.schoolId || c.schoolId === schoolId);
    }
    if (accessScope === 'selected_schools' && selectedSchoolIds.length > 0) {
      return source.filter(
        (c) => !c.schoolId || selectedSchoolIds.includes(c.schoolId)
      );
    }
    return source;
  }, [hierarchyOptions, availableClasses, schoolId, accessScope, selectedSchoolIds]);

  const allStudentsPool = useMemo(() => {
    const source =
      hierarchyOptions?.students && hierarchyOptions.students.length > 0
        ? hierarchyOptions.students
        : availableStudents.map((s) => ({
            id: s.id,
            name: s.name,
            admissionNo: s.admissionNo,
            grade: s.grade,
            section: s.section,
            schoolId: s.schoolId,
            campusId: s.campusId,
          }));
    if (schoolId && accessScope === 'single_school') {
      return source.filter((s) => !s.schoolId || s.schoolId === schoolId);
    }
    if (accessScope === 'selected_schools' && selectedSchoolIds.length > 0) {
      return source.filter(
        (s) => !s.schoolId || selectedSchoolIds.includes(s.schoolId)
      );
    }
    return source;
  }, [hierarchyOptions, availableStudents, schoolId, accessScope, selectedSchoolIds]);

  const selectedRoleRecord = useMemo(
    () =>
      roles.find((r) => r.id === selectedRoleId || r.name === selectedRole),
    [roles, selectedRoleId, selectedRole]
  );

  const filteredRoles = useMemo(() => {
    const q = roleSearchQuery.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.scope.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [roles, roleSearchQuery]);

  const filteredMultiSchools = useMemo(() => {
    const q = schoolSearchQuery.trim().toLowerCase();
    if (!q) return allSchoolsPool;
    return allSchoolsPool.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.board.toLowerCase().includes(q)
    );
  }, [allSchoolsPool, schoolSearchQuery]);

  const filteredStudentsForParent = useMemo(() => {
    const q = studentSearchQuery.trim().toLowerCase();
    if (!q) return allStudentsPool;
    return allStudentsPool.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.admissionNo.toLowerCase().includes(q) ||
        st.grade.toLowerCase().includes(q)
    );
  }, [allStudentsPool, studentSearchQuery]);

  const selectedSchoolObj = useMemo(
    () =>
      allSchoolsPool.find((s) => s.id === schoolId) ||
      ctxSchools.find((s) => s.id === schoolId),
    [allSchoolsPool, ctxSchools, schoolId]
  );

  const availableCampusesForSingleSchool = useMemo(() => {
    if (selectedSchoolObj?.campuses) return selectedSchoolObj.campuses;
    if (hierarchyOptions?.campuses) return hierarchyOptions.campuses;
    return [];
  }, [selectedSchoolObj, hierarchyOptions]);

  const selectedClassObj = useMemo(
    () => allClassesPool.find((c) => c.id === classId),
    [allClassesPool, classId]
  );

  const availableSectionsForClass = useMemo(() => {
    if (selectedClassObj?.sections && selectedClassObj.sections.length > 0) {
      return selectedClassObj.sections;
    }
    return SECTION_OPTIONS;
  }, [selectedClassObj]);

  const isOrgAdminTarget = selectedRole === 'Organization Administrator';
  const isCampusAdminTarget = selectedRole === 'Campus Administrator';
  const isStudentTarget = selectedRole === 'Student';
  const isParentTarget = selectedRole === 'Parent';
  const isStaffTarget = Boolean(
    selectedRole &&
      !isStudentTarget &&
      !isParentTarget &&
      selectedRole !== 'Super Administrator'
  );

  const passwordStrength = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Dependent handlers: clear invalid child selections when parent changes
  const handleSelectRoleRecord = (roleRec: DynamicRoleRecord) => {
    setSelectedRoleId(roleRec.id);
    setSelectedRole(roleRec.name);
    setRoleDropdownOpen(false);
    setRoleSearchQuery('');
    clearFieldError('role');

    const defaultScope = inferDefaultScopeForRole(roleRec, isSuperAdminActor);
    setAccessScope(defaultScope);
    clearFieldError('schoolId');
    clearFieldError('schoolIds');
    clearFieldError('organizationId');

    if (defaultScope === 'all_schools') {
      setSchoolId('');
      setCampusId('all');
      setSelectedSchoolIds([]);
      setSelectedCampusIds([]);
    } else if (defaultScope === 'selected_schools') {
      if (selectedSchoolIds.length === 0 && schoolId) {
        setSelectedSchoolIds([schoolId]);
      }
    } else {
      if (!schoolId && allSchoolsPool[0]) {
        setSchoolId(allSchoolsPool[0].id);
        setCampusId('all');
      }
    }

    if (roleRec.name !== 'Student') {
      setClassId('');
      setPortalSection('');
    }
    if (roleRec.name !== 'Parent') {
      setLinkedStudentIds([]);
    }
  };

  const handleAccessScopeChange = (nextScope: UserAccessScope) => {
    if (!isSuperAdminActor && nextScope === 'all_schools') return;
    setAccessScope(nextScope);
    clearFieldError('schoolId');
    clearFieldError('schoolIds');
    clearFieldError('campusId');

    if (nextScope === 'all_schools') {
      setSchoolId('');
      setCampusId('all');
      setSelectedSchoolIds([]);
      setSelectedCampusIds([]);
    } else if (nextScope === 'single_school') {
      const nextPrimary =
        schoolId || selectedSchoolIds[0] || allSchoolsPool[0]?.id || '';
      setSchoolId(nextPrimary);
      setSelectedSchoolIds(nextPrimary ? [nextPrimary] : []);
      setCampusId('all');
      setSelectedCampusIds([]);
    } else if (nextScope === 'selected_schools') {
      if (selectedSchoolIds.length === 0 && schoolId) {
        setSelectedSchoolIds([schoolId]);
      }
    }
  };

  const handleOrganizationChange = (nextOrgId: string) => {
    setOrganizationId(nextOrgId);
    clearFieldError('organizationId');

    // Clear child selections that do not belong to the newly chosen organization
    const validSchools = nextOrgId
      ? ctxSchools.filter(
          (s) => !s.organizationId || s.organizationId === nextOrgId
        )
      : ctxSchools;
    const validSchoolIdSet = new Set(validSchools.map((s) => s.id));

    if (schoolId && !validSchoolIdSet.has(schoolId)) {
      setSchoolId(validSchools[0]?.id || '');
      setCampusId('all');
      setClassId('');
      setPortalSection('');
      setLinkedStudentIds([]);
    }
    setSelectedSchoolIds((prev) => prev.filter((id) => validSchoolIdSet.has(id)));
    const validCampusIdSet = new Set(
      validSchools.flatMap((s) => s.campuses.map((c) => c.id))
    );
    setSelectedCampusIds((prev) => prev.filter((id) => validCampusIdSet.has(id)));
  };

  const handleSingleSchoolChange = (nextSchoolId: string) => {
    setSchoolId(nextSchoolId);
    setCampusId('all');
    setSelectedSchoolIds(nextSchoolId ? [nextSchoolId] : []);
    setSelectedCampusIds([]);
    setClassId('');
    setPortalSection('');
    setLinkedStudentIds([]);
    clearFieldError('schoolId');
    clearFieldError('campusId');
  };

  const toggleMultiSchool = (targetSchoolId: string) => {
    clearFieldError('schoolIds');
    setSelectedSchoolIds((prev) => {
      const exists = prev.includes(targetSchoolId);
      const next = exists
        ? prev.filter((id) => id !== targetSchoolId)
        : [...prev, targetSchoolId];

      if (exists) {
        const removedSchool = allSchoolsPool.find((s) => s.id === targetSchoolId);
        if (removedSchool) {
          const removedCampusSet = new Set(removedSchool.campuses.map((c) => c.id));
          setSelectedCampusIds((curr) =>
            curr.filter((cid) => !removedCampusSet.has(cid))
          );
        }
      }
      return next;
    });
  };

  const toggleCampusCheckbox = (targetCampusId: string) => {
    clearFieldError('campusId');
    setSelectedCampusIds((prev) =>
      prev.includes(targetCampusId)
        ? prev.filter((id) => id !== targetCampusId)
        : [...prev, targetCampusId]
    );
  };

  const toggleLinkedStudent = (studentId: string) => {
    setLinkedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};

    if (fullName.trim().length < 2) {
      next.fullName = 'Please enter the full name (at least 2 characters).';
    }

    const emailTrim = email.trim();
    if (!emailTrim) {
      if (!isStudentMode) {
        next.email = 'Email address is required.';
      }
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      next.email = 'Please enter a valid email address.';
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      next.phone = 'Enter a valid 10-digit contact phone number.';
    }

    if (isStudentMode) {
      if (!dob) {
        next.dob = 'Date of birth is required.';
      }
      if (!admissionNo.trim()) {
        next.admissionNo = 'Admission number is required.';
      }
      if (fatherName.trim().length < 2) {
        next.fatherName = 'Father or legal guardian name is required.';
      }
      if (streetAddress.trim().length < 4) {
        next.streetAddress = 'Please enter a residential street address.';
      }
      if (city.trim().length < 2) {
        next.city = 'City is required.';
      }
    } else {
      if (!selectedRole) {
        next.role = 'Please select an active role from Role Management.';
      }

      if (accessScope === 'all_schools' && !isSuperAdminActor) {
        next.accessScope =
          'Only Central Super Admin can assign All Schools access.';
      }

      if (isOrgAdminTarget && allOrganizations.length > 0 && !organizationId) {
        next.organizationId =
          'Please select the Organization assigned to this administrator.';
      }

      if (accessScope === 'single_school') {
        if (allSchoolsPool.length > 0 && !schoolId) {
          next.schoolId = 'Please select a school for this user.';
        }
        if (
          isCampusAdminTarget &&
          availableCampusesForSingleSchool.length > 0 &&
          selectedCampusIds.length === 0 &&
          campusId === 'all'
        ) {
          next.campusId =
            'Select at least one campus for Campus Administrator access.';
        }
      }

      if (accessScope === 'selected_schools') {
        if (allSchoolsPool.length > 0 && selectedSchoolIds.length === 0) {
          next.schoolIds = 'Select at least one authorized school.';
        }
      }

      if (!isEditMode) {
        if (password.length < 8) {
          next.password = 'Password must be at least 8 characters long.';
        }
        if (confirmPassword !== password) {
          next.confirmPassword = 'Passwords do not match.';
        }
      } else if (password) {
        if (password.length < 8) {
          next.password = 'New password must be at least 8 characters long.';
        }
        if (confirmPassword !== password) {
          next.confirmPassword = 'Passwords do not match.';
        }
      }
    }

    if (
      postalCode.trim() &&
      !/^[A-Za-z0-9\s-]{4,10}$/.test(postalCode.trim())
    ) {
      next.postalCode = 'Enter a valid postal / ZIP code.';
    }

    if (!acceptedTerms) {
      next.acceptedTerms =
        'Please confirm the accuracy of this registration before submitting.';
    }

    return next;
  };

  const handleReset = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setDob('');
    setGender('Female');
    setBloodGroup('O+');
    setAdmissionNo(generateAdmissionNumber());
    setRollNo('');
    setGrade('Class 10');
    setSection('A');
    setFatherName('');
    setMotherName('');
    setBusRoute(BUS_ROUTES[0]);
    setSelectedRole('');
    setSelectedRoleId('');
    setAccessScope('single_school');
    setOrganizationId(allOrganizations[0]?.id || '');
    setSchoolId(allSchoolsPool[0]?.id || '');
    setCampusId('all');
    setSelectedSchoolIds(allSchoolsPool[0]?.id ? [allSchoolsPool[0].id] : []);
    setSelectedCampusIds([]);
    setAcademicYearId(allAcademicYears[0]?.id || '');
    setClassId('');
    setPortalSection('');
    setLinkedStudentIds([]);
    setDepartment('');
    setStatus('Active');
    setPassword('');
    setConfirmPassword('');
    setStreetAddress('');
    setCity('');
    setStateName('');
    setPostalCode('');
    setAcceptedTerms(false);
    setErrors({});
    setSubmitError(null);
    setSubmittedRecord(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const formattedAddress = [
      streetAddress.trim(),
      city.trim(),
      stateName.trim(),
      postalCode.trim(),
    ]
      .filter(Boolean)
      .join(', ');

    if (isStudentMode) {
      const generatedEmail =
        email.trim() ||
        `${fullName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '.')}@student.erp.local`;

      const studentPayload: Omit<Student, 'id'> = {
        admissionNo: admissionNo.trim(),
        rollNo:
          rollNo.trim() || `${grade.replace(/\D/g, '') || '01'}${section}-01`,
        name: fullName.trim(),
        grade,
        section,
        gender,
        dob,
        fatherName: fatherName.trim(),
        motherName: motherName.trim() || 'Not Provided',
        phone: phone.trim(),
        email: generatedEmail,
        address: formattedAddress,
        bloodGroup,
        busRoute,
        feeStatus: 'Pending',
        dueAmount: 0,
        attendancePercent: 100,
      };

      onRegisterStudent?.(studentPayload);

      setSubmittedRecord({
        referenceId: studentPayload.admissionNo,
        fullName: studentPayload.name,
        summaryLine: `${studentPayload.grade} · Section ${studentPayload.section} · ${studentPayload.gender}`,
        email: studentPayload.email,
        phone: studentPayload.phone,
      });
      return;
    }

    const derivedUsername =
      username.trim() ||
      email.trim().split('@')[0]?.replace(/[^a-zA-Z0-9_.-]/g, '_') ||
      fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const resolvedSchoolIds =
      accessScope === 'all_schools'
        ? []
        : accessScope === 'selected_schools'
        ? selectedSchoolIds
        : schoolId
        ? [schoolId]
        : [];

    const resolvedPrimarySchoolId =
      accessScope === 'all_schools'
        ? 'all'
        : resolvedSchoolIds[0] || 'all';

    const resolvedCampusIds =
      accessScope === 'all_schools'
        ? []
        : accessScope === 'selected_schools' || isCampusAdminTarget
        ? selectedCampusIds
        : campusId && campusId !== 'all'
        ? [campusId]
        : [];

    const resolvedPrimaryCampusId =
      accessScope === 'all_schools'
        ? 'all'
        : resolvedCampusIds.length === 1
        ? resolvedCampusIds[0]
        : campusId || 'all';

    const portalPayload: PortalRegistrationPayload = {
      id: editingUser?.id,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      dob,
      gender,
      roleId: selectedRoleId || selectedRoleRecord?.id,
      role: selectedRole as ErpRole,
      organizationId: organizationId || undefined,
      accessScope,
      schoolId: resolvedPrimarySchoolId,
      campusId: resolvedPrimaryCampusId,
      schoolIds: resolvedSchoolIds,
      campusIds: resolvedCampusIds,
      academicYearId: isStudentTarget ? academicYearId || undefined : undefined,
      classId: isStudentTarget ? classId || undefined : undefined,
      section: isStudentTarget ? portalSection || undefined : undefined,
      linkedStudentIds: isParentTarget ? linkedStudentIds : [],
      department: department.trim() || undefined,
      address: formattedAddress,
      city: city.trim(),
      postalCode: postalCode.trim(),
      username: derivedUsername,
      password: password || undefined,
      status,
    };

    if (autoCloseOnSubmit && onRegisterPortalUser) {
      setIsSubmitting(true);
      try {
        await onRegisterPortalUser(portalPayload);
      } catch (err: any) {
        setSubmitError(
          err?.message || 'Unable to save user account. Please verify your entries.'
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (onRegisterPortalUser) {
      setIsSubmitting(true);
      try {
        await onRegisterPortalUser(portalPayload);
      } catch (err: any) {
        setSubmitError(
          err?.message || 'Unable to save user account. Please verify your entries.'
        );
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    const scopeSummary =
      accessScope === 'all_schools'
        ? 'All Schools'
        : accessScope === 'selected_schools'
        ? `${resolvedSchoolIds.length} Selected School(s)`
        : selectedSchoolObj?.shortName || 'Single School';

    setSubmittedRecord({
      referenceId:
        editingUser?.id ||
        `USR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      fullName: portalPayload.fullName,
      summaryLine: `${portalPayload.role} · ${scopeSummary}`,
      email: portalPayload.email,
      phone: portalPayload.phone,
      portalPayload,
    });
  };

  if (submittedRecord) {
    return (
      <div className="reg-form-card reg-confirm-card">
        <div className="p-6 sm:p-8 text-center max-w-xl mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-[#0B1F3A] tracking-tight">
              {isStudentMode
                ? 'Student Registration Completed'
                : isEditMode
                ? 'User Account Updated'
                : 'User Account Created'}
            </h3>
            <p className="text-sm text-slate-600">
              {isStudentMode
                ? 'The new student record has been added to the active school and campus roster.'
                : 'The user account, role assignment, and school access scope have been saved.'}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Reference ID</span>
              <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                {submittedRecord.referenceId}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Full Name</span>
              <span className="font-semibold text-slate-900">
                {submittedRecord.fullName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Role &amp; Access</span>
              <span className="font-medium text-slate-800 text-right">
                {submittedRecord.summaryLine}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-medium">Contact</span>
              <span className="font-mono text-slate-700 tabular-nums text-right">
                {submittedRecord.phone} · {submittedRecord.email}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isStudentMode && onViewDirectory && (
              <button
                type="button"
                onClick={onViewDirectory}
                className="reg-submit-btn w-full sm:w-auto"
              >
                <span>View Student Roster</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {!isStudentMode && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="reg-submit-btn w-full sm:w-auto"
              >
                <span>Back to User Directory</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-[10px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {isStudentMode
                  ? 'Register Another Student'
                  : 'Create Another User'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={
        isStudentMode
          ? 'Student Admission Registration Form'
          : isEditMode
          ? 'Edit ERP User Account Form'
          : 'ERP User Registration Form'
      }
      className="reg-form-card"
    >
      {/* Header Banner */}
      <div className="reg-form-header px-5 py-5 sm:px-7 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#F4D078]">
            {isStudentMode ? (
              <GraduationCap className="w-4 h-4 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 shrink-0" />
            )}
            <span>
              {isStudentMode
                ? 'Student Admission · Institutional Enrollment'
                : isEditMode
                ? 'Role Management & Multi-School Access Update'
                : 'Multi-School ERP · Role-Based User Provisioning'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {isStudentMode
              ? 'Responsive Student Registration Form'
              : isEditMode
              ? `Edit User Account — ${editingUser?.fullName}`
              : 'Create ERP User Account'}
          </h2>
          <p className="text-xs text-slate-200/85">
            Complete all required fields marked with an asterisk (*). Roles and
            school access options are loaded dynamically from your ERP
            configuration.
          </p>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="self-start sm:self-center px-3.5 py-2 rounded-lg text-xs font-semibold text-white/90 hover:text-white bg-white/12 hover:bg-white/20 border border-white/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Back to Directory
          </button>
        )}
      </div>

      {/* Form Content */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-5 sm:p-7 space-y-7"
      >
        {submitError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Step 1: Personal & Applicant Details */}
        <fieldset className="reg-fieldset">
          <legend className="reg-legend">
            <span className="reg-legend-step">1</span>
            <span>Personal &amp; Applicant Details</span>
          </legend>

          <div className="reg-grid-3">
            {/* Full Name */}
            <div className="reg-field">
              <label htmlFor="reg-fullname" className="reg-label">
                Full Name <span className="reg-required">*</span>
              </label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon" aria-hidden="true">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="reg-fullname"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearFieldError('fullName');
                  }}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={
                    errors.fullName ? 'reg-fullname-err' : undefined
                  }
                  className="reg-input reg-input-has-icon"
                />
              </div>
              {errors.fullName && (
                <span id="reg-fullname-err" className="reg-error-text">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="reg-field">
              <label htmlFor="reg-email" className="reg-label">
                Email Address{' '}
                {!isStudentMode && <span className="reg-required">*</span>}
              </label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon" aria-hidden="true">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required={!isStudentMode}
                  placeholder="user@institution.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'reg-email-err' : undefined}
                  className="reg-input reg-input-has-icon"
                />
              </div>
              {errors.email && (
                <span id="reg-email-err" className="reg-error-text">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number */}
            <div className="reg-field">
              <label htmlFor="reg-phone" className="reg-label">
                Mobile Phone <span className="reg-required">*</span>
              </label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon" aria-hidden="true">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  placeholder="+91 00000 00000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clearFieldError('phone');
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'reg-phone-err' : undefined}
                  className="reg-input reg-input-has-icon tabular-nums"
                />
              </div>
              {errors.phone && (
                <span id="reg-phone-err" className="reg-error-text">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Date of Birth */}
            <div className="reg-field">
              <label htmlFor="reg-dob" className="reg-label">
                Date of Birth{' '}
                {isStudentMode && <span className="reg-required">*</span>}
              </label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon" aria-hidden="true">
                  <Calendar className="w-4 h-4" />
                </span>
                <input
                  id="reg-dob"
                  name="dob"
                  type="date"
                  required={isStudentMode}
                  value={dob}
                  onChange={(e) => {
                    setDob(e.target.value);
                    clearFieldError('dob');
                  }}
                  aria-invalid={Boolean(errors.dob)}
                  aria-describedby={errors.dob ? 'reg-dob-err' : undefined}
                  className="reg-input reg-input-has-icon tabular-nums"
                />
              </div>
              {errors.dob && (
                <span id="reg-dob-err" className="reg-error-text">
                  {errors.dob}
                </span>
              )}
            </div>

            {/* Gender Custom Radio Cards */}
            <div className="reg-field">
              <span className="reg-label">
                Gender <span className="reg-required">*</span>
              </span>
              <div
                className="reg-radio-group"
                role="radiogroup"
                aria-label="Gender"
              >
                {(['Male', 'Female', 'Other'] as const).map((option) => (
                  <label key={option} className="reg-radio-card">
                    <input
                      type="radio"
                      name="gender"
                      value={option}
                      checked={gender === option}
                      onChange={() => setGender(option)}
                      className="sr-only"
                    />
                    <span className="reg-radio-dot" aria-hidden="true" />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Blood Group (Student Mode) OR Dynamic Searchable Account Role (Portal Mode) */}
            {isStudentMode ? (
              <div className="reg-field">
                <label htmlFor="reg-blood" className="reg-label">
                  Blood Group
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon" aria-hidden="true">
                    <Droplets className="w-4 h-4" />
                  </span>
                  <select
                    id="reg-blood"
                    name="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="reg-input reg-input-has-icon cursor-pointer"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="reg-field relative" ref={roleDropdownRef}>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="reg-role-trigger" className="reg-label">
                    Account Role <span className="reg-required">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void loadRoles()}
                    disabled={rolesLoading}
                    title="Refresh active roles from Role Management"
                    className="text-[11px] font-medium text-slate-500 hover:text-[#1d4ed8] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${rolesLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Sync</span>
                  </button>
                </div>

                <div className="reg-input-wrap">
                  <span className="reg-input-icon" aria-hidden="true">
                    {rolesLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#1d4ed8]" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </span>
                  <button
                    id="reg-role-trigger"
                    type="button"
                    disabled={rolesLoading}
                    onClick={() => setRoleDropdownOpen((prev) => !prev)}
                    aria-haspopup="listbox"
                    aria-expanded={roleDropdownOpen}
                    aria-invalid={Boolean(errors.role)}
                    className="reg-input reg-input-has-icon reg-input-has-action text-left flex items-center justify-between cursor-pointer disabled:opacity-60"
                  >
                    <span
                      className={`truncate ${
                        selectedRole ? 'text-slate-900 font-medium' : 'text-slate-400'
                      }`}
                    >
                      {rolesLoading
                        ? 'Loading active roles...'
                        : selectedRole
                        ? selectedRole
                        : 'Select active role...'}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        roleDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {rolesError && (
                  <div className="mt-1.5 px-2.5 py-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center justify-between gap-2">
                    <span>{rolesError}</span>
                    <button
                      type="button"
                      onClick={() => void loadRoles()}
                      className="font-semibold underline shrink-0 cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {roleDropdownOpen && !rolesLoading && (
                  <div
                    role="listbox"
                    aria-label="Active Roles"
                    className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={roleSearchQuery}
                          onChange={(e) => setRoleSearchQuery(e.target.value)}
                          placeholder="Search active roles..."
                          autoFocus
                          className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1d4ed8]"
                        />
                        {roleSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setRoleSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {filteredRoles.length === 0 ? (
                        <div className="p-3.5 text-center text-xs text-slate-500">
                          {roles.length === 0
                            ? 'No active roles configured in Role Management.'
                            : `No active roles matching "${roleSearchQuery}".`}
                        </div>
                      ) : (
                        filteredRoles.map((roleRec) => {
                          const isSelected =
                            selectedRoleId === roleRec.id ||
                            selectedRole === roleRec.name;
                          return (
                            <button
                              key={roleRec.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleSelectRoleRecord(roleRec)}
                              className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#1d4ed8]/8 text-[#0B1F3A]'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">
                                  {roleRec.name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 truncate">
                                  {roleRec.code} · {roleRec.scope} Scope
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#1d4ed8] shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {errors.role && (
                  <span className="reg-error-text">{errors.role}</span>
                )}
              </div>
            )}
          </div>

          {/* Optional Username & Account Status row in Portal Mode */}
          {!isStudentMode && (
            <div className="reg-grid-3 mt-4 pt-4 border-t border-slate-100">
              <div className="reg-field">
                <label htmlFor="reg-username" className="reg-label">
                  Login Username
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon" aria-hidden="true">
                    <Hash className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    disabled={isEditMode}
                    placeholder="Auto-generated from email if blank"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="reg-input reg-input-has-icon font-mono disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              </div>

              {isStaffTarget && (
                <div className="reg-field">
                  <label htmlFor="reg-department" className="reg-label">
                    Department / Unit
                  </label>
                  <input
                    id="reg-department"
                    name="department"
                    type="text"
                    placeholder="e.g. Academics, Finance, HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="reg-input"
                  />
                </div>
              )}

              <div className="reg-field">
                <label htmlFor="reg-status" className="reg-label">
                  Account Status
                </label>
                <select
                  id="reg-status"
                  name="status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'Active' | 'Inactive')
                  }
                  className="reg-input cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </fieldset>

        {/* Step 2: School Access Assignment (Portal Mode) OR Academic Placement (Student Mode) */}
        <fieldset className="reg-fieldset">
          <legend className="reg-legend">
            <span className="reg-legend-step">2</span>
            <span>
              {isStudentMode
                ? 'Academic Placement & Guardian Details'
                : 'School Access Assignment'}
            </span>
          </legend>

          {isStudentMode ? (
            <div className="space-y-4">
              <div className="reg-grid-3">
                <div className="reg-field">
                  <label htmlFor="reg-admno" className="reg-label">
                    Admission Number <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Hash className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-admno"
                      name="admissionNo"
                      type="text"
                      required
                      value={admissionNo}
                      onChange={(e) => {
                        setAdmissionNo(e.target.value);
                        clearFieldError('admissionNo');
                      }}
                      aria-invalid={Boolean(errors.admissionNo)}
                      className="reg-input reg-input-has-icon font-mono tabular-nums"
                    />
                  </div>
                  {errors.admissionNo && (
                    <span className="reg-error-text">{errors.admissionNo}</span>
                  )}
                </div>

                <div className="reg-field">
                  <label htmlFor="reg-grade" className="reg-label">
                    Class / Grade <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <select
                      id="reg-grade"
                      name="grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="reg-input reg-input-has-icon cursor-pointer"
                    >
                      {GRADE_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="reg-grid-2">
                  <div className="reg-field">
                    <label htmlFor="reg-section" className="reg-label">
                      Section
                    </label>
                    <select
                      id="reg-section"
                      name="section"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="reg-input cursor-pointer"
                    >
                      {SECTION_OPTIONS.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="reg-field">
                    <label htmlFor="reg-roll" className="reg-label">
                      Roll No
                    </label>
                    <input
                      id="reg-roll"
                      name="rollNo"
                      type="text"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                      placeholder="Roll No"
                      className="reg-input font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="reg-grid-3">
                <div className="reg-field">
                  <label htmlFor="reg-father" className="reg-label">
                    Father / Guardian Name{' '}
                    <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Users className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-father"
                      name="fatherName"
                      type="text"
                      required
                      placeholder="Enter father or guardian name"
                      value={fatherName}
                      onChange={(e) => {
                        setFatherName(e.target.value);
                        clearFieldError('fatherName');
                      }}
                      aria-invalid={Boolean(errors.fatherName)}
                      className="reg-input reg-input-has-icon"
                    />
                  </div>
                  {errors.fatherName && (
                    <span className="reg-error-text">{errors.fatherName}</span>
                  )}
                </div>

                <div className="reg-field">
                  <label htmlFor="reg-mother" className="reg-label">
                    Mother Name
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Users className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-mother"
                      name="motherName"
                      type="text"
                      placeholder="Enter mother name"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      className="reg-input reg-input-has-icon"
                    />
                  </div>
                </div>

                <div className="reg-field">
                  <label htmlFor="reg-bus" className="reg-label">
                    Transport / Bus Route
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Bus className="w-4 h-4" />
                    </span>
                    <select
                      id="reg-bus"
                      name="busRoute"
                      value={busRoute}
                      onChange={(e) => setBusRoute(e.target.value)}
                      className="reg-input reg-input-has-icon cursor-pointer"
                    >
                      {BUS_ROUTES.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchyError && (
                <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2">
                  <span>{hierarchyError}</span>
                  <button
                    type="button"
                    onClick={() =>
                      void loadHierarchy(
                        organizationId || undefined,
                        schoolId || undefined
                      )
                    }
                    className="font-semibold underline cursor-pointer shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Access Scope Selector (Super Admin sees All Schools / Single School / Selected Schools) */}
              <div className="reg-grid-2">
                <div className="reg-field">
                  <label htmlFor="reg-access-scope" className="reg-label">
                    School Access Scope <span className="reg-required">*</span>
                  </label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Globe className="w-4 h-4" />
                    </span>
                    <select
                      id="reg-access-scope"
                      name="accessScope"
                      value={accessScope}
                      onChange={(e) =>
                        handleAccessScopeChange(
                          e.target.value as UserAccessScope
                        )
                      }
                      className="reg-input reg-input-has-icon cursor-pointer"
                    >
                      {isSuperAdminActor && (
                        <option value="all_schools">
                          All Schools (Organization / Platform Wide)
                        </option>
                      )}
                      <option value="single_school">Single School</option>
                      <option value="selected_schools">Selected Schools</option>
                    </select>
                  </div>
                  {errors.accessScope && (
                    <span className="reg-error-text">{errors.accessScope}</span>
                  )}
                </div>

                {/* Dependent Organization Selector */}
                <div className="reg-field">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reg-organization" className="reg-label">
                      Organization{' '}
                      {isOrgAdminTarget && (
                        <span className="reg-required">*</span>
                      )}
                    </label>
                    {hierarchyLoading && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating...
                      </span>
                    )}
                  </div>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Layers className="w-4 h-4" />
                    </span>
                    <select
                      id="reg-organization"
                      name="organizationId"
                      value={organizationId}
                      onChange={(e) => handleOrganizationChange(e.target.value)}
                      className="reg-input reg-input-has-icon cursor-pointer"
                    >
                      <option value="">
                        {allOrganizations.length === 0
                          ? 'No organizations created yet'
                          : isOrgAdminTarget
                          ? 'Select Organization...'
                          : 'All Organizations'}
                      </option>
                      {allOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.organizationId && (
                    <span className="reg-error-text">
                      {errors.organizationId}
                    </span>
                  )}
                </div>
              </div>

              {/* A. ALL SCHOOLS SCOPE BANNER */}
              {accessScope === 'all_schools' && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs text-slate-700 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#1d4ed8] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#0B1F3A]">
                      All Schools Access Enabled
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      This account will automatically receive access across all
                      existing and newly added schools
                      {organizationId
                        ? ` within ${
                            allOrganizations.find(
                              (o) => o.id === organizationId
                            )?.name || 'the selected organization'
                          }`
                        : ' across the ERP platform'}
                      . No individual school selection is required.
                    </p>
                  </div>
                </div>
              )}

              {/* B. SINGLE SCHOOL DEPENDENT DROPDOWNS */}
              {accessScope === 'single_school' && (
                <div className="space-y-4">
                  <div className="reg-grid-2">
                    <div className="reg-field">
                      <label htmlFor="reg-school" className="reg-label">
                        School <span className="reg-required">*</span>
                      </label>
                      <div className="reg-input-wrap">
                        <span className="reg-input-icon" aria-hidden="true">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <select
                          id="reg-school"
                          name="schoolId"
                          value={schoolId}
                          onChange={(e) =>
                            handleSingleSchoolChange(e.target.value)
                          }
                          aria-invalid={Boolean(errors.schoolId)}
                          className="reg-input reg-input-has-icon cursor-pointer"
                        >
                          <option value="">
                            {allSchoolsPool.length === 0
                              ? 'No schools available yet'
                              : 'Select a school...'}
                          </option>
                          {allSchoolsPool.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name} ({school.board})
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.schoolId && (
                        <span className="reg-error-text">{errors.schoolId}</span>
                      )}
                    </div>

                    {/* Campus Dropdown (or Multi-Campus picker for Campus Administrator) */}
                    {!isCampusAdminTarget ? (
                      <div className="reg-field">
                        <label htmlFor="reg-campus" className="reg-label">
                          Campus
                        </label>
                        <div className="reg-input-wrap">
                          <span className="reg-input-icon" aria-hidden="true">
                            <MapPin className="w-4 h-4" />
                          </span>
                          <select
                            id="reg-campus"
                            name="campusId"
                            value={campusId}
                            disabled={!schoolId}
                            onChange={(e) => {
                              setCampusId(e.target.value);
                              setSelectedCampusIds(
                                e.target.value !== 'all'
                                  ? [e.target.value]
                                  : []
                              );
                              clearFieldError('campusId');
                            }}
                            className="reg-input reg-input-has-icon cursor-pointer disabled:opacity-50"
                          >
                            <option value="all">All Campuses in School</option>
                            {availableCampusesForSingleSchool.map((campus) => (
                              <option key={campus.id} value={campus.id}>
                                {campus.name}
                                {campus.city ? ` · ${campus.city}` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        {errors.campusId && (
                          <span className="reg-error-text">
                            {errors.campusId}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="reg-field">
                        <span className="reg-label">
                          Authorized Campuses{' '}
                          <span className="reg-required">*</span>
                        </span>
                        <div className="rounded-[10px] border border-slate-200 bg-slate-50/70 p-2.5 max-h-32 overflow-y-auto space-y-1.5">
                          {availableCampusesForSingleSchool.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              {schoolId
                                ? 'No campuses configured for this school yet.'
                                : 'Select a school first to assign campuses.'}
                            </p>
                          ) : (
                            availableCampusesForSingleSchool.map((campus) => {
                              const checked = selectedCampusIds.includes(
                                campus.id
                              );
                              return (
                                <label
                                  key={campus.id}
                                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() =>
                                      toggleCampusCheckbox(campus.id)
                                    }
                                    className="w-4 h-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                                  />
                                  <span className="font-medium">
                                    {campus.name}
                                  </span>
                                  {campus.city && (
                                    <span className="text-slate-400">
                                      · {campus.city}
                                    </span>
                                  )}
                                </label>
                              );
                            })
                          )}
                        </div>
                        {errors.campusId && (
                          <span className="reg-error-text">
                            {errors.campusId}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* C. SELECTED SCHOOLS SEARCHABLE MULTI-SELECT + PER-SCHOOL CAMPUS RESTRICTIONS */}
              {accessScope === 'selected_schools' && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#0B1F3A]">
                        Authorized Schools ({selectedSchoolIds.length} selected){' '}
                        <span className="reg-required">*</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Search and select multiple schools, then optionally
                        restrict campuses per school.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          clearFieldError('schoolIds');
                          setSelectedSchoolIds(
                            filteredMultiSchools.map((s) => s.id)
                          );
                        }}
                        className="text-[11px] font-semibold text-[#1d4ed8] hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSchoolIds([]);
                          setSelectedCampusIds([]);
                        }}
                        className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Selected School Chips */}
                  {selectedSchoolIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSchoolIds.map((sid) => {
                        const sch =
                          allSchoolsPool.find((s) => s.id === sid) ||
                          ctxSchools.find((s) => s.id === sid);
                        return (
                          <span
                            key={sid}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-medium"
                          >
                            <span>{sch?.shortName || sch?.name || sid}</span>
                            <button
                              type="button"
                              onClick={() => toggleMultiSchool(sid)}
                              aria-label={`Remove ${sch?.name || sid}`}
                              className="text-white/75 hover:text-white cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Search Input */}
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={schoolSearchQuery}
                      onChange={(e) => setSchoolSearchQuery(e.target.value)}
                      placeholder="Search schools by name, code, or board..."
                      className="reg-input reg-input-has-icon bg-white"
                    />
                  </div>

                  {/* Schools Checkbox List */}
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {filteredMultiSchools.length === 0 ? (
                      <div className="p-3.5 text-center text-xs text-slate-500">
                        {allSchoolsPool.length === 0
                          ? 'No schools exist in this organization yet. Create a school first.'
                          : `No schools matching "${schoolSearchQuery}".`}
                      </div>
                    ) : (
                      filteredMultiSchools.map((sch) => {
                        const isChecked = selectedSchoolIds.includes(sch.id);
                        return (
                          <div key={sch.id} className="p-2.5 space-y-2">
                            <label className="flex items-center justify-between gap-2 cursor-pointer">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleMultiSchool(sch.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8] shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                                    {sch.name}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 truncate">
                                    {sch.code} · {sch.board} ·{' '}
                                    {sch.campuses.length} campus(es)
                                  </p>
                                </div>
                              </div>
                            </label>

                            {/* Per-school Campus Restriction Checkboxes */}
                            {isChecked && sch.campuses.length > 0 && (
                              <div className="ml-6 pl-3 border-l-2 border-blue-200 space-y-1.5">
                                <p className="text-[10.5px] font-semibold text-slate-600">
                                  Campus Restriction (leave unchecked for All
                                  Campuses):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {sch.campuses.map((cmp) => {
                                    const cmpChecked =
                                      selectedCampusIds.includes(cmp.id);
                                    return (
                                      <label
                                        key={cmp.id}
                                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] cursor-pointer transition-colors ${
                                          cmpChecked
                                            ? 'border-[#1d4ed8] bg-blue-50 text-[#1d4ed8] font-semibold'
                                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={cmpChecked}
                                          onChange={() =>
                                            toggleCampusCheckbox(cmp.id)
                                          }
                                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#1d4ed8]"
                                        />
                                        <span>{cmp.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {errors.schoolIds && (
                    <span className="reg-error-text">{errors.schoolIds}</span>
                  )}
                </div>
              )}

              {/* ROLE-SPECIFIC CONDITIONAL: STUDENT ROLE -> Academic Year / Class / Section */}
              {isStudentTarget && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-xs font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#1d4ed8]" />
                    <span>Student Academic Placement</span>
                  </p>
                  <div className="reg-grid-3">
                    <div className="reg-field">
                      <label htmlFor="reg-portal-ay" className="reg-label">
                        Academic Year
                      </label>
                      <select
                        id="reg-portal-ay"
                        value={academicYearId}
                        onChange={(e) => setAcademicYearId(e.target.value)}
                        className="reg-input cursor-pointer"
                      >
                        <option value="">
                          {allAcademicYears.length === 0
                            ? 'No academic years configured'
                            : 'Select Academic Year...'}
                        </option>
                        {allAcademicYears.map((ay) => (
                          <option key={ay.id} value={ay.id}>
                            {ay.label}
                            {ay.isCurrent ? ' (Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="reg-field">
                      <label htmlFor="reg-portal-class" className="reg-label">
                        Class / Grade
                      </label>
                      <select
                        id="reg-portal-class"
                        value={classId}
                        onChange={(e) => {
                          setClassId(e.target.value);
                          setPortalSection('');
                        }}
                        className="reg-input cursor-pointer"
                      >
                        <option value="">
                          {allClassesPool.length === 0
                            ? 'No classes configured'
                            : 'Select Class...'}
                        </option>
                        {allClassesPool.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.gradeName} ({cls.curriculum})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="reg-field">
                      <label htmlFor="reg-portal-section" className="reg-label">
                        Section
                      </label>
                      <select
                        id="reg-portal-section"
                        value={portalSection}
                        disabled={!classId}
                        onChange={(e) => setPortalSection(e.target.value)}
                        className="reg-input cursor-pointer disabled:opacity-50"
                      >
                        <option value="">Select Section...</option>
                        {availableSectionsForClass.map((sec) => (
                          <option key={sec} value={sec}>
                            Section {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ROLE-SPECIFIC CONDITIONAL: PARENT ROLE -> Link Existing Student(s) */}
              {isParentTarget && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#1d4ed8]" />
                      <span>
                        Link Existing Student(s) ({linkedStudentIds.length}{' '}
                        linked)
                      </span>
                    </p>
                  </div>

                  {linkedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedStudentIds.map((stId) => {
                        const st = allStudentsPool.find((s) => s.id === stId);
                        return (
                          <span
                            key={stId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#0B1F3A] text-[11px] font-medium"
                          >
                            <span>
                              {st
                                ? `${st.name} (${st.admissionNo})`
                                : stId}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleLinkedStudent(stId)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="reg-input-wrap">
                    <span className="reg-input-icon" aria-hidden="true">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search existing students by name, admission number, or grade..."
                      className="reg-input reg-input-has-icon"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                    {filteredStudentsForParent.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        {allStudentsPool.length === 0
                          ? 'No students registered for the selected school yet.'
                          : `No students matching "${studentSearchQuery}".`}
                      </div>
                    ) : (
                      filteredStudentsForParent.map((st) => {
                        const checked = linkedStudentIds.includes(st.id);
                        return (
                          <label
                            key={st.id}
                            className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleLinkedStudent(st.id)}
                                className="w-4 h-4 rounded border-slate-300 text-[#1d4ed8]"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#0B1F3A] truncate">
                                  {st.name}
                                </p>
                                <p className="text-[10.5px] text-slate-500 font-mono">
                                  {st.admissionNo} · {st.grade} - Sec{' '}
                                  {st.section}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </fieldset>

        {/* Step 3: Residential Address */}
        <fieldset className="reg-fieldset">
          <legend className="reg-legend">
            <span className="reg-legend-step">3</span>
            <span>Residential Address</span>
          </legend>

          <div className="space-y-4">
            <div className="reg-field">
              <label htmlFor="reg-street" className="reg-label">
                Street Address{' '}
                {isStudentMode && <span className="reg-required">*</span>}
              </label>
              <div className="reg-input-wrap">
                <span className="reg-input-icon" aria-hidden="true">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  id="reg-street"
                  name="streetAddress"
                  type="text"
                  autoComplete="street-address"
                  required={isStudentMode}
                  placeholder="House / Flat No., Street Name, Locality"
                  value={streetAddress}
                  onChange={(e) => {
                    setStreetAddress(e.target.value);
                    clearFieldError('streetAddress');
                  }}
                  aria-invalid={Boolean(errors.streetAddress)}
                  className="reg-input reg-input-has-icon"
                />
              </div>
              {errors.streetAddress && (
                <span className="reg-error-text">{errors.streetAddress}</span>
              )}
            </div>

            <div className="reg-grid-3">
              <div className="reg-field">
                <label htmlFor="reg-city" className="reg-label">
                  City{' '}
                  {isStudentMode && <span className="reg-required">*</span>}
                </label>
                <input
                  id="reg-city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required={isStudentMode}
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    clearFieldError('city');
                  }}
                  aria-invalid={Boolean(errors.city)}
                  className="reg-input"
                />
                {errors.city && (
                  <span className="reg-error-text">{errors.city}</span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor="reg-state" className="reg-label">
                  State / Province
                </label>
                <input
                  id="reg-state"
                  name="stateName"
                  type="text"
                  autoComplete="address-level1"
                  placeholder="Enter state or province"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="reg-input"
                />
              </div>

              <div className="reg-field">
                <label htmlFor="reg-postal" className="reg-label">
                  Postal / PIN Code
                </label>
                <input
                  id="reg-postal"
                  name="postalCode"
                  type="text"
                  autoComplete="postal-code"
                  placeholder="Enter postal code"
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    clearFieldError('postalCode');
                  }}
                  aria-invalid={Boolean(errors.postalCode)}
                  className="reg-input font-mono tabular-nums"
                />
                {errors.postalCode && (
                  <span className="reg-error-text">{errors.postalCode}</span>
                )}
              </div>
            </div>
          </div>
        </fieldset>

        {/* Step 4: Account Security (Portal Mode Only) */}
        {!isStudentMode && (
          <fieldset className="reg-fieldset">
            <legend className="reg-legend">
              <span className="reg-legend-step">4</span>
              <span>Account Security</span>
            </legend>

            <div className="reg-grid-2">
              <div className="reg-field">
                <label htmlFor="reg-password" className="reg-label">
                  {isEditMode ? 'New Password (Optional)' : 'Create Password'}{' '}
                  {!isEditMode && <span className="reg-required">*</span>}
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon" aria-hidden="true">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required={!isEditMode}
                    placeholder={
                      isEditMode
                        ? 'Leave blank to keep existing password'
                        : 'Minimum 8 characters'
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    aria-invalid={Boolean(errors.password)}
                    className="reg-input reg-input-has-icon reg-input-has-action"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Pure CSS 4-segment Password Strength Meter */}
                {(!isEditMode || password.length > 0) && (
                  <div className="pt-1 space-y-1">
                    <div
                      className="grid grid-cols-4 gap-1.5"
                      aria-hidden="true"
                    >
                      {[1, 2, 3, 4].map((level) => (
                        <span
                          key={level}
                          className={`h-1.5 rounded-full transition-colors duration-200 ${
                            passwordStrength.score >= level
                              ? passwordStrength.barClass
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`text-[11px] font-medium ${passwordStrength.textClass}`}
                    >
                      Strength: {passwordStrength.label}
                    </p>
                  </div>
                )}

                {errors.password && (
                  <span className="reg-error-text">{errors.password}</span>
                )}
              </div>

              <div className="reg-field">
                <label htmlFor="reg-confirm-password" className="reg-label">
                  Confirm Password{' '}
                  {(!isEditMode || password.length > 0) && (
                    <span className="reg-required">*</span>
                  )}
                </label>
                <div className="reg-input-wrap">
                  <span className="reg-input-icon" aria-hidden="true">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required={!isEditMode || password.length > 0}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    className="reg-input reg-input-has-icon reg-input-has-action"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-2.5 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={
                      showConfirmPassword
                        ? 'Hide confirm password'
                        : 'Show confirm password'
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="reg-error-text">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>
          </fieldset>
        )}

        {/* Declaration & Form Actions */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div>
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  clearFieldError('acceptedTerms');
                }}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8] cursor-pointer shrink-0"
              />
              <span className="leading-relaxed">
                I confirm that the account details, assigned role, and school
                access scope provided above are accurate for ERP records.
              </span>
            </label>
            {errors.acceptedTerms && (
              <p className="reg-error-text mt-1.5 pl-6">
                {errors.acceptedTerms}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {!isEditMode ? (
              <button
                type="button"
                onClick={handleReset}
                className="min-h-[44px] px-4 py-2.5 rounded-[10px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Form</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="min-h-[44px] px-4 py-2.5 rounded-[10px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="reg-submit-btn disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isStudentMode
                        ? 'Complete Student Registration'
                        : isEditMode
                        ? 'Save User Changes'
                        : 'Create User Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};
