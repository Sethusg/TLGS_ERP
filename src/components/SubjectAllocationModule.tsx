import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BookOpen,
  Plus,
  Layers,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpDown,
  FileSpreadsheet,
  Printer,
  Code2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  ShieldCheck,
  Users,
  Clock,
  Archive,
  RotateCcw,
} from 'lucide-react';
import {
  AllocationDeliveryType,
  AllocationSubjectType,
  ErpRole,
  ExamRecord,
  RolePermissionMatrix,
  SchoolClass,
  SchoolSubject,
  Staff,
  SubjectAllocation,
  TimetableEntry,
} from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import { getCampusNameById, getSchoolNameById } from '../data/schoolContext';
import { getModuleCrud, getRoleDefinition } from '../config/rbac';
import {
  AllocationDependencyReport,
  DJANGO_SUBJECT_ALLOCATION_BLUEPRINT,
  buildAllocationUniqueKey,
  checkAllocationDependencies,
  getEligibleTeachersForScope,
  getSchoolOrganizationMeta,
  isTeacherEligibleForScope,
} from '../services/subjectAllocationService';
import {
  EnterpriseConfirmDialog,
  EnterpriseFormModal,
  ModulePageHeader,
} from './Common/EnterpriseUI';

interface SubjectAllocationModuleProps {
  currentRole: ErpRole;
  permissionMatrix: RolePermissionMatrix;
  allocations: SubjectAllocation[];
  allClasses: SchoolClass[];
  allSubjects: SchoolSubject[];
  allStaff: Staff[];
  timetables: TimetableEntry[];
  exams: ExamRecord[];
  onAddAllocations: (
    newItems: Omit<SubjectAllocation, 'id'>[],
    auditRemark: string
  ) => void;
  onUpdateAllocation: (
    updated: SubjectAllocation,
    auditRemark: string
  ) => void;
  onBulkUpsertAllocations: (
    creates: Omit<SubjectAllocation, 'id'>[],
    updates: SubjectAllocation[],
    auditRemark: string
  ) => void;
  onToggleAllocationActive: (
    id: string,
    nextActive: boolean,
    actorName: string
  ) => void;
  onSoftDeleteAllocation: (id: string, actorName: string) => void;
  onRestoreSoftDeleted?: (id: string, actorName: string) => void;
}

const SUBJECT_TYPES: AllocationSubjectType[] = [
  'Core',
  'Elective',
  'Optional',
  'Language',
];

const DELIVERY_TYPES: AllocationDeliveryType[] = [
  'Theory',
  'Practical',
  'Theory & Practical',
];

function nowTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapSubjectTypeDefault(type: SchoolSubject['type']): AllocationSubjectType {
  if (type === 'Elective') return 'Elective';
  if (type === 'Co-Scholastic') return 'Optional';
  return 'Core';
}

type SortField =
  | 'academicYearLabel'
  | 'schoolId'
  | 'className'
  | 'sectionId'
  | 'subjectName'
  | 'subjectCode'
  | 'assignedTeacherName'
  | 'weeklyPeriods'
  | 'subjectType';

interface AddRowConfig {
  subjectId: string;
  assignedTeacherId: string;
  subjectType: AllocationSubjectType;
  weeklyPeriods: number;
  totalMarks: number;
  classification: AllocationDeliveryType;
}

export const SubjectAllocationModule: React.FC<SubjectAllocationModuleProps> = ({
  currentRole,
  permissionMatrix,
  allocations,
  allClasses,
  allSubjects,
  allStaff,
  timetables,
  exams,
  onAddAllocations,
  onUpdateAllocation,
  onBulkUpsertAllocations,
  onToggleAllocationActive,
  onSoftDeleteAllocation,
  onRestoreSoftDeleted,
}) => {
  const {
    schools,
    academicYears,
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    lockedSchoolId,
    lockedCampusId,
  } = useSchoolContext();

  const roleDef = getRoleDefinition(currentRole);
  const actorName = roleDef.sampleAccount.fullName;
  const crud = getModuleCrud(currentRole, 'ACADEMICS', permissionMatrix);

  // ---- Filter State (synced with global tenant context, independently filterable) ----
  const [filterYearId, setFilterYearId] = useState<string>(selectedAcademicYearId);
  const [filterSchoolId, setFilterSchoolId] = useState<string>(selectedSchoolId);
  const [filterCampusId, setFilterCampusId] = useState<string>(selectedCampusId);
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterSectionId, setFilterSectionId] = useState<string>('all');
  const [filterSubjectType, setFilterSubjectType] = useState<string>('all');
  const [statusView, setStatusView] = useState<
    'active' | 'inactive' | 'all' | 'deleted'
  >('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync top-bar changes down when global school/campus/year changes
  useEffect(() => {
    setFilterYearId(selectedAcademicYearId);
  }, [selectedAcademicYearId]);

  useEffect(() => {
    setFilterSchoolId(selectedSchoolId);
    setFilterCampusId(selectedCampusId);
    setFilterClassId('all');
    setFilterSectionId('all');
  }, [selectedSchoolId, selectedCampusId]);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<SortField>('className');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Feedback Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const showToast = (
    text: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5500);
  };

  // ---- Master Dropdowns Derived From Existing ERP Masters ----
  const campusesForFilterSchool = useMemo(() => {
    if (filterSchoolId === 'all') return [];
    const sch = schools.find((s) => s.id === filterSchoolId);
    return sch ? sch.campuses : [];
  }, [schools, filterSchoolId]);

  const classesForFilterScope = useMemo(() => {
    return allClasses.filter((c) => {
      const cSchool = c.schoolId || 'sch-leaders-cbse';
      if (filterSchoolId !== 'all' && cSchool !== filterSchoolId) return false;
      if (
        filterCampusId !== 'all' &&
        c.campusId &&
        c.campusId !== 'all' &&
        c.campusId !== filterCampusId
      ) {
        return false;
      }
      return true;
    });
  }, [allClasses, filterSchoolId, filterCampusId]);

  const sectionsForFilterClass = useMemo(() => {
    if (filterClassId === 'all') return [];
    const cls = classesForFilterScope.find((c) => c.id === filterClassId);
    return cls ? cls.sections : [];
  }, [classesForFilterScope, filterClassId]);

  // ---- Filtered & Sorted Allocations ----
  const scopedAllocations = useMemo(() => {
    return allocations.filter((a) => {
      if (lockedSchoolId && a.schoolId !== lockedSchoolId) return false;
      if (lockedCampusId && a.campusId !== lockedCampusId) return false;
      if (filterYearId !== 'all' && a.academicYearId !== filterYearId) return false;
      if (filterSchoolId !== 'all' && a.schoolId !== filterSchoolId) return false;
      if (filterCampusId !== 'all' && a.campusId !== filterCampusId) return false;
      if (filterClassId !== 'all' && a.classId !== filterClassId) return false;
      if (
        filterSectionId !== 'all' &&
        a.sectionId.toUpperCase() !== filterSectionId.toUpperCase()
      ) {
        return false;
      }
      if (filterSubjectType !== 'all' && a.subjectType !== filterSubjectType) {
        return false;
      }
      return true;
    });
  }, [
    allocations,
    lockedSchoolId,
    lockedCampusId,
    filterYearId,
    filterSchoolId,
    filterCampusId,
    filterClassId,
    filterSectionId,
    filterSubjectType,
  ]);

  const statusFilteredAllocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scopedAllocations.filter((a) => {
      if (statusView === 'deleted') {
        if (!a.isDeleted) return false;
      } else {
        if (a.isDeleted) return false;
        if (statusView === 'active' && !a.isActive) return false;
        if (statusView === 'inactive' && a.isActive) return false;
      }
      if (!q) return true;
      return (
        a.subjectName.toLowerCase().includes(q) ||
        a.subjectCode.toLowerCase().includes(q) ||
        a.assignedTeacherName.toLowerCase().includes(q) ||
        a.className.toLowerCase().includes(q) ||
        a.sectionId.toLowerCase().includes(q) ||
        getSchoolNameById(a.schoolId, schools).toLowerCase().includes(q) ||
        getCampusNameById(a.schoolId, a.campusId, schools).toLowerCase().includes(q)
      );
    });
  }, [scopedAllocations, statusView, searchQuery, schools]);

  const sortedAllocations = useMemo(() => {
    const list = [...statusFilteredAllocations];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'weeklyPeriods') {
        cmp = a.weeklyPeriods - b.weeklyPeriods;
      } else if (sortField === 'schoolId') {
        cmp = getSchoolNameById(a.schoolId, schools).localeCompare(
          getSchoolNameById(b.schoolId, schools)
        );
      } else {
        cmp = String(a[sortField]).localeCompare(String(b[sortField]));
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [statusFilteredAllocations, sortField, sortDir, schools]);

  const totalPages = Math.max(1, Math.ceil(sortedAllocations.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = useMemo(
    () => sortedAllocations.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedAllocations, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [
    filterYearId,
    filterSchoolId,
    filterCampusId,
    filterClassId,
    filterSectionId,
    filterSubjectType,
    statusView,
    searchQuery,
    pageSize,
  ]);

  const kpis = useMemo(() => {
    const nonDeleted = scopedAllocations.filter((a) => !a.isDeleted);
    const active = nonDeleted.filter((a) => a.isActive);
    const inactive = nonDeleted.filter((a) => !a.isActive);
    const deleted = scopedAllocations.filter((a) => a.isDeleted);
    const sectionKeys = new Set(
      active.map((a) => `${a.schoolId}:${a.classId}:${a.sectionId}`)
    );
    const totalWeeklyPeriods = active.reduce((sum, a) => sum + a.weeklyPeriods, 0);
    return {
      activeCount: active.length,
      inactiveCount: inactive.length,
      deletedCount: deleted.length,
      sectionsCovered: sectionKeys.size,
      totalWeeklyPeriods,
    };
  }, [scopedAllocations]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Existing non-deleted unique lookup map (for instant duplicate checks)
  const existingAllocationByKey = useMemo(() => {
    const map = new Map<string, SubjectAllocation>();
    allocations.forEach((a) => {
      if (a.isDeleted) return;
      const key = buildAllocationUniqueKey({
        academicYearId: a.academicYearId,
        schoolId: a.schoolId,
        campusId: a.campusId,
        classId: a.classId,
        sectionId: a.sectionId,
        subjectId: a.subjectId,
      });
      map.set(key, a);
    });
    return map;
  }, [allocations]);

  // =========================================================================
  // MODAL 1: ADD ALLOCATION (SINGLE OR MULTIPLE SUBJECTS TO CLASS + SECTION)
  // =========================================================================
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addYearId, setAddYearId] = useState(selectedAcademicYearId);
  const [addSchoolId, setAddSchoolId] = useState(
    selectedSchoolId === 'all' ? schools[0]?.id || 'sch-leaders-cbse' : selectedSchoolId
  );
  const [addCampusId, setAddCampusId] = useState('');
  const [addClassId, setAddClassId] = useState('');
  const [addSectionId, setAddSectionId] = useState('');
  const [addSubjectConfigs, setAddSubjectConfigs] = useState<
    Record<string, AddRowConfig>
  >({});
  const [addError, setAddError] = useState<string | null>(null);

  const openAddModal = () => {
    const initSchool =
      lockedSchoolId ||
      (filterSchoolId !== 'all' ? filterSchoolId : schools[0]?.id || 'sch-leaders-cbse');
    const schoolObj = schools.find((s) => s.id === initSchool) || schools[0];
    const initCampus =
      lockedCampusId ||
      (filterCampusId !== 'all'
        ? filterCampusId
        : schoolObj?.campuses[0]?.id || 'cmp-chennai-hq');
    const matchingClasses = allClasses.filter(
      (c) => (c.schoolId || 'sch-leaders-cbse') === initSchool
    );
    const initClass =
      (filterClassId !== 'all'
        ? matchingClasses.find((c) => c.id === filterClassId)
        : matchingClasses[0]) || matchingClasses[0];
    const initSection =
      filterSectionId !== 'all' && initClass?.sections.includes(filterSectionId)
        ? filterSectionId
        : initClass?.sections[0] || 'A';

    setAddYearId(filterYearId === 'all' ? selectedAcademicYearId : filterYearId);
    setAddSchoolId(initSchool);
    setAddCampusId(initCampus);
    setAddClassId(initClass?.id || '');
    setAddSectionId(initSection);
    setAddSubjectConfigs({});
    setAddError(null);
    setIsAddOpen(true);
  };

  const addModalCampuses = useMemo(
    () => schools.find((s) => s.id === addSchoolId)?.campuses || [],
    [schools, addSchoolId]
  );

  const addModalClasses = useMemo(
    () =>
      allClasses.filter(
        (c) => (c.schoolId || 'sch-leaders-cbse') === addSchoolId
      ),
    [allClasses, addSchoolId]
  );

  const addModalSelectedClass = useMemo(
    () => addModalClasses.find((c) => c.id === addClassId) || null,
    [addModalClasses, addClassId]
  );

  const addModalEligibleTeachers = useMemo(
    () => getEligibleTeachersForScope(allStaff, addSchoolId, addCampusId),
    [allStaff, addSchoolId, addCampusId]
  );

  const handleToggleAddSubject = (sub: SchoolSubject) => {
    setAddSubjectConfigs((prev) => {
      if (prev[sub.id]) {
        const copy = { ...prev };
        delete copy[sub.id];
        return copy;
      }
      return {
        ...prev,
        [sub.id]: {
          subjectId: sub.id,
          assignedTeacherId: addModalEligibleTeachers[0]?.id || '',
          subjectType: mapSubjectTypeDefault(sub.type),
          weeklyPeriods: 5,
          totalMarks: sub.maxMarks || 100,
          classification: 'Theory',
        },
      };
    });
    setAddError(null);
  };

  const handleSaveAddAllocations = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const selectedRows = Object.values(addSubjectConfigs);
    if (!addYearId || !addSchoolId || !addCampusId || !addClassId || !addSectionId) {
      setAddError(
        'Please select Academic Year, School, Campus, Class, and Section.'
      );
      return;
    }
    if (selectedRows.length === 0) {
      setAddError('Select at least one subject to allocate.');
      return;
    }

    const yearObj = academicYears.find((y) => y.id === addYearId);
    const classObj = addModalClasses.find((c) => c.id === addClassId);
    if (!classObj) {
      setAddError('Selected class is invalid for this school.');
      return;
    }

    const orgMeta = getSchoolOrganizationMeta(addSchoolId, schools);
    const ts = nowTimestamp();
    const toCreate: Omit<SubjectAllocation, 'id'>[] = [];

    for (const cfg of selectedRows) {
      const subObj = allSubjects.find((s) => s.id === cfg.subjectId);
      if (!subObj) continue;

      const uniqueKey = buildAllocationUniqueKey({
        academicYearId: addYearId,
        schoolId: addSchoolId,
        campusId: addCampusId,
        classId: addClassId,
        sectionId: addSectionId,
        subjectId: cfg.subjectId,
      });
      const dup = existingAllocationByKey.get(uniqueKey);
      if (dup) {
        setAddError(
          `Duplicate prevented: "${subObj.name}" (${subObj.code}) is already allocated to ${classObj.gradeName} Sec ${addSectionId} in ${yearObj?.label || addYearId} (${dup.isActive ? 'Active' : 'Inactive'}).`
        );
        return;
      }

      const teacherObj = allStaff.find((st) => st.id === cfg.assignedTeacherId);
      const eligibility = isTeacherEligibleForScope(
        teacherObj,
        addSchoolId,
        addCampusId
      );
      if (!eligibility.eligible) {
        setAddError(
          `${subObj.name}: ${eligibility.reason || 'Select an eligible teacher for this school and campus.'}`
        );
        return;
      }

      if (!cfg.weeklyPeriods || cfg.weeklyPeriods < 1 || cfg.weeklyPeriods > 30) {
        setAddError(`${subObj.name}: Weekly periods must be between 1 and 30.`);
        return;
      }
      if (!cfg.totalMarks || cfg.totalMarks < 1 || cfg.totalMarks > 500) {
        setAddError(`${subObj.name}: Total marks must be between 1 and 500.`);
        return;
      }

      toCreate.push({
        academicYearId: addYearId,
        academicYearLabel: yearObj?.label || addYearId,
        organizationId: orgMeta.organizationId,
        organizationName: orgMeta.organizationName,
        schoolId: addSchoolId,
        campusId: addCampusId,
        classId: classObj.id,
        className: classObj.gradeName,
        sectionId: addSectionId,
        subjectId: subObj.id,
        subjectName: subObj.name,
        subjectCode: subObj.code,
        subjectType: cfg.subjectType,
        assignedTeacherId: teacherObj!.id,
        assignedTeacherName: teacherObj!.name,
        weeklyPeriods: Math.round(cfg.weeklyPeriods),
        totalMarks: Math.round(cfg.totalMarks),
        classification: cfg.classification,
        isActive: true,
        isDeleted: false,
        createdBy: actorName,
        updatedBy: actorName,
        createdDate: ts,
        updatedDate: ts,
      });
    }

    onAddAllocations(
      toCreate,
      `Allocated ${toCreate.length} subject(s) to ${classObj.gradeName} Sec ${addSectionId} (${yearObj?.label || addYearId})`
    );
    setIsAddOpen(false);
    showToast(
      `Saved ${toCreate.length} subject allocation(s) for ${classObj.gradeName} – Section ${addSectionId}.`
    );
  };

  // =========================================================================
  // MODAL 2: EDIT & UPDATE ALLOCATION (DISPLAYS EXISTING VALUES BEFORE EDIT)
  // =========================================================================
  const [editingAllocation, setEditingAllocation] =
    useState<SubjectAllocation | null>(null);
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editTeacherId, setEditTeacherId] = useState('');
  const [editSubjectType, setEditSubjectType] =
    useState<AllocationSubjectType>('Core');
  const [editWeeklyPeriods, setEditWeeklyPeriods] = useState(5);
  const [editTotalMarks, setEditTotalMarks] = useState(100);
  const [editClassification, setEditClassification] =
    useState<AllocationDeliveryType>('Theory');
  const [editError, setEditError] = useState<string | null>(null);

  const openEditModal = (alloc: SubjectAllocation) => {
    setEditingAllocation(alloc);
    setEditSubjectId(alloc.subjectId);
    setEditTeacherId(alloc.assignedTeacherId);
    setEditSubjectType(alloc.subjectType);
    setEditWeeklyPeriods(alloc.weeklyPeriods);
    setEditTotalMarks(alloc.totalMarks);
    setEditClassification(alloc.classification);
    setEditError(null);
  };

  const editEligibleTeachers = useMemo(() => {
    if (!editingAllocation) return [];
    return getEligibleTeachersForScope(
      allStaff,
      editingAllocation.schoolId,
      editingAllocation.campusId
    );
  }, [allStaff, editingAllocation]);

  const handleSaveEditAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllocation) return;
    setEditError(null);

    const subObj = allSubjects.find((s) => s.id === editSubjectId);
    if (!subObj) {
      setEditError('Please select a valid subject from the Subject Master.');
      return;
    }

    // Duplicate check if subject changed
    const uniqueKey = buildAllocationUniqueKey({
      academicYearId: editingAllocation.academicYearId,
      schoolId: editingAllocation.schoolId,
      campusId: editingAllocation.campusId,
      classId: editingAllocation.classId,
      sectionId: editingAllocation.sectionId,
      subjectId: subObj.id,
    });
    const dup = existingAllocationByKey.get(uniqueKey);
    if (dup && dup.id !== editingAllocation.id) {
      setEditError(
        `Duplicate allocation prevented: "${subObj.name}" (${subObj.code}) is already allocated to ${editingAllocation.className} Sec ${editingAllocation.sectionId} for ${editingAllocation.academicYearLabel}.`
      );
      return;
    }

    const teacherObj = allStaff.find((st) => st.id === editTeacherId);
    const eligibility = isTeacherEligibleForScope(
      teacherObj,
      editingAllocation.schoolId,
      editingAllocation.campusId
    );
    if (!eligibility.eligible) {
      setEditError(
        eligibility.reason || 'Selected teacher is not eligible for this school/campus.'
      );
      return;
    }

    if (editWeeklyPeriods < 1 || editWeeklyPeriods > 30) {
      setEditError('Weekly periods must be between 1 and 30.');
      return;
    }
    if (editTotalMarks < 1 || editTotalMarks > 500) {
      setEditError('Total marks must be between 1 and 500.');
      return;
    }

    const updated: SubjectAllocation = {
      ...editingAllocation,
      subjectId: subObj.id,
      subjectName: subObj.name,
      subjectCode: subObj.code,
      subjectType: editSubjectType,
      assignedTeacherId: teacherObj!.id,
      assignedTeacherName: teacherObj!.name,
      weeklyPeriods: Math.round(editWeeklyPeriods),
      totalMarks: Math.round(editTotalMarks),
      classification: editClassification,
      updatedBy: actorName,
      updatedDate: nowTimestamp(),
    };

    onUpdateAllocation(
      updated,
      `Updated subject allocation ${subObj.code} for ${updated.className} Sec ${updated.sectionId} (Teacher: ${teacherObj!.name}, ${updated.weeklyPeriods} periods/wk)`
    );
    setEditingAllocation(null);
    showToast(
      `Updated allocation for ${updated.className} Sec ${updated.sectionId} – ${subObj.name}.`
    );
  };

  // =========================================================================
  // MODAL 3: BULK SUBJECT ALLOCATION (CLASS × MULTIPLE SECTIONS × SUBJECTS)
  // =========================================================================
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<1 | 2 | 3>(1);
  const [bulkYearId, setBulkYearId] = useState(selectedAcademicYearId);
  const [bulkSchoolId, setBulkSchoolId] = useState(
    schools[0]?.id || 'sch-leaders-cbse'
  );
  const [bulkCampusId, setBulkCampusId] = useState('');
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkSections, setBulkSections] = useState<string[]>([]);
  const [bulkSubjectIds, setBulkSubjectIds] = useState<string[]>([]);
  const [bulkSubjectMeta, setBulkSubjectMeta] = useState<
    Record<
      string,
      {
        subjectType: AllocationSubjectType;
        weeklyPeriods: number;
        totalMarks: number;
        classification: AllocationDeliveryType;
      }
    >
  >({});
  // Key: `${section}::${subjectId}` -> teacherId
  const [bulkTeacherMap, setBulkTeacherMap] = useState<Record<string, string>>({});
  const [bulkDuplicateMode, setBulkDuplicateMode] = useState<'skip' | 'overwrite'>(
    'skip'
  );
  const [bulkOverwriteConfirmed, setBulkOverwriteConfirmed] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const openBulkModal = () => {
    const initSchool =
      lockedSchoolId ||
      (filterSchoolId !== 'all' ? filterSchoolId : schools[0]?.id || 'sch-leaders-cbse');
    const schoolObj = schools.find((s) => s.id === initSchool) || schools[0];
    const initCampus =
      lockedCampusId ||
      (filterCampusId !== 'all'
        ? filterCampusId
        : schoolObj?.campuses[0]?.id || 'cmp-chennai-hq');
    const matchingClasses = allClasses.filter(
      (c) => (c.schoolId || 'sch-leaders-cbse') === initSchool
    );
    const initClass =
      (filterClassId !== 'all'
        ? matchingClasses.find((c) => c.id === filterClassId)
        : matchingClasses[0]) || matchingClasses[0];

    setBulkStep(1);
    setBulkYearId(filterYearId === 'all' ? selectedAcademicYearId : filterYearId);
    setBulkSchoolId(initSchool);
    setBulkCampusId(initCampus);
    setBulkClassId(initClass?.id || '');
    setBulkSections(initClass ? [...initClass.sections] : []);
    setBulkSubjectIds([]);
    setBulkSubjectMeta({});
    setBulkTeacherMap({});
    setBulkDuplicateMode('skip');
    setBulkOverwriteConfirmed(false);
    setBulkError(null);
    setIsBulkOpen(true);
  };

  const bulkCampuses = useMemo(
    () => schools.find((s) => s.id === bulkSchoolId)?.campuses || [],
    [schools, bulkSchoolId]
  );

  const bulkClasses = useMemo(
    () =>
      allClasses.filter(
        (c) => (c.schoolId || 'sch-leaders-cbse') === bulkSchoolId
      ),
    [allClasses, bulkSchoolId]
  );

  const bulkSelectedClass = useMemo(
    () => bulkClasses.find((c) => c.id === bulkClassId) || null,
    [bulkClasses, bulkClassId]
  );

  const bulkEligibleTeachers = useMemo(
    () => getEligibleTeachersForScope(allStaff, bulkSchoolId, bulkCampusId),
    [allStaff, bulkSchoolId, bulkCampusId]
  );

  const toggleBulkSubject = (sub: SchoolSubject) => {
    setBulkSubjectIds((prev) => {
      const exists = prev.includes(sub.id);
      if (exists) return prev.filter((id) => id !== sub.id);
      return [...prev, sub.id];
    });
    setBulkSubjectMeta((prev) => {
      if (prev[sub.id]) return prev;
      return {
        ...prev,
        [sub.id]: {
          subjectType: mapSubjectTypeDefault(sub.type),
          weeklyPeriods: 5,
          totalMarks: sub.maxMarks || 100,
          classification: 'Theory',
        },
      };
    });
    // Default teacher assignment for each selected section
    const defaultTeacherId = bulkEligibleTeachers[0]?.id || '';
    setBulkTeacherMap((prev) => {
      const next = { ...prev };
      bulkSections.forEach((sec) => {
        const key = `${sec}::${sub.id}`;
        if (!next[key]) next[key] = defaultTeacherId;
      });
      return next;
    });
  };

  // Computed Bulk Preview Plan for Step 3
  const bulkPreviewItems = useMemo(() => {
    if (!bulkSelectedClass) return [];
    const items: {
      key: string;
      section: string;
      subject: SchoolSubject;
      teacher: Staff | undefined;
      meta: {
        subjectType: AllocationSubjectType;
        weeklyPeriods: number;
        totalMarks: number;
        classification: AllocationDeliveryType;
      };
      existingDuplicate?: SubjectAllocation;
      teacherError?: string;
    }[] = [];

    bulkSections.forEach((sec) => {
      bulkSubjectIds.forEach((subId) => {
        const sub = allSubjects.find((s) => s.id === subId);
        if (!sub) return;
        const mapKey = `${sec}::${subId}`;
        const teacherId = bulkTeacherMap[mapKey] || bulkEligibleTeachers[0]?.id || '';
        const teacher = allStaff.find((st) => st.id === teacherId);
        const eligibility = isTeacherEligibleForScope(
          teacher,
          bulkSchoolId,
          bulkCampusId
        );
        const uniqueKey = buildAllocationUniqueKey({
          academicYearId: bulkYearId,
          schoolId: bulkSchoolId,
          campusId: bulkCampusId,
          classId: bulkSelectedClass.id,
          sectionId: sec,
          subjectId: sub.id,
        });
        items.push({
          key: mapKey,
          section: sec,
          subject: sub,
          teacher,
          meta: bulkSubjectMeta[subId] || {
            subjectType: mapSubjectTypeDefault(sub.type),
            weeklyPeriods: 5,
            totalMarks: sub.maxMarks || 100,
            classification: 'Theory',
          },
          existingDuplicate: existingAllocationByKey.get(uniqueKey),
          teacherError: eligibility.eligible ? undefined : eligibility.reason,
        });
      });
    });

    return items;
  }, [
    bulkSelectedClass,
    bulkSections,
    bulkSubjectIds,
    allSubjects,
    bulkTeacherMap,
    bulkEligibleTeachers,
    allStaff,
    bulkSchoolId,
    bulkCampusId,
    bulkYearId,
    bulkSubjectMeta,
    existingAllocationByKey,
  ]);

  const bulkDuplicateCount = bulkPreviewItems.filter((i) => i.existingDuplicate).length;
  const bulkNewCount = bulkPreviewItems.filter((i) => !i.existingDuplicate).length;
  const bulkTeacherErrorCount = bulkPreviewItems.filter((i) => i.teacherError).length;

  const handleCommitBulkAllocation = () => {
    if (!bulkSelectedClass || bulkTeacherErrorCount > 0) return;
    if (
      bulkDuplicateCount > 0 &&
      bulkDuplicateMode === 'overwrite' &&
      !bulkOverwriteConfirmed
    ) {
      return;
    }

    const yearObj = academicYears.find((y) => y.id === bulkYearId);
    const orgMeta = getSchoolOrganizationMeta(bulkSchoolId, schools);
    const ts = nowTimestamp();

    const creates: Omit<SubjectAllocation, 'id'>[] = [];
    const updates: SubjectAllocation[] = [];

    bulkPreviewItems.forEach((item) => {
      if (!item.teacher) return;
      if (item.existingDuplicate) {
        if (bulkDuplicateMode === 'overwrite') {
          updates.push({
            ...item.existingDuplicate,
            subjectType: item.meta.subjectType,
            assignedTeacherId: item.teacher.id,
            assignedTeacherName: item.teacher.name,
            weeklyPeriods: Math.round(item.meta.weeklyPeriods),
            totalMarks: Math.round(item.meta.totalMarks),
            classification: item.meta.classification,
            isActive: true,
            updatedBy: actorName,
            updatedDate: ts,
          });
        }
      } else {
        creates.push({
          academicYearId: bulkYearId,
          academicYearLabel: yearObj?.label || bulkYearId,
          organizationId: orgMeta.organizationId,
          organizationName: orgMeta.organizationName,
          schoolId: bulkSchoolId,
          campusId: bulkCampusId,
          classId: bulkSelectedClass.id,
          className: bulkSelectedClass.gradeName,
          sectionId: item.section,
          subjectId: item.subject.id,
          subjectName: item.subject.name,
          subjectCode: item.subject.code,
          subjectType: item.meta.subjectType,
          assignedTeacherId: item.teacher.id,
          assignedTeacherName: item.teacher.name,
          weeklyPeriods: Math.round(item.meta.weeklyPeriods),
          totalMarks: Math.round(item.meta.totalMarks),
          classification: item.meta.classification,
          isActive: true,
          isDeleted: false,
          createdBy: actorName,
          updatedBy: actorName,
          createdDate: ts,
          updatedDate: ts,
        });
      }
    });

    onBulkUpsertAllocations(
      creates,
      updates,
      `Bulk subject allocation for ${bulkSelectedClass.gradeName} (Sections: ${bulkSections.join(', ')}) — ${creates.length} created, ${updates.length} updated`
    );
    setIsBulkOpen(false);
    showToast(
      `Bulk allocation saved for ${bulkSelectedClass.gradeName}: ${creates.length} created${
        updates.length > 0 ? `, ${updates.length} updated` : ''
      }${
        bulkDuplicateCount > 0 && bulkDuplicateMode === 'skip'
          ? `, ${bulkDuplicateCount} duplicate(s) safely skipped`
          : ''
      }.`
    );
  };

  // =========================================================================
  // MODAL 4: DELETE WITH DEPENDENCY CHECK & SOFT-DELETE CONFIRMATION
  // =========================================================================
  const [deleteTarget, setDeleteTarget] = useState<{
    allocation: SubjectAllocation;
    report: AllocationDependencyReport;
  } | null>(null);

  const [toggleActiveTarget, setToggleActiveTarget] =
    useState<SubjectAllocation | null>(null);

  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);
  const [copiedBlock, setCopiedBlock] = useState<'sql' | 'drf' | null>(null);

  const initiateDelete = (alloc: SubjectAllocation) => {
    const report = checkAllocationDependencies(alloc, timetables, exams);
    setDeleteTarget({ allocation: alloc, report });
  };

  const handleConfirmToggleActive = () => {
    if (!toggleActiveTarget) return;
    const nextActive = !toggleActiveTarget.isActive;
    onToggleAllocationActive(toggleActiveTarget.id, nextActive, actorName);
    showToast(
      nextActive
        ? `Activated "${toggleActiveTarget.subjectName}" for ${toggleActiveTarget.className} Sec ${toggleActiveTarget.sectionId}.`
        : `Deactivated "${toggleActiveTarget.subjectName}" for ${toggleActiveTarget.className} Sec ${toggleActiveTarget.sectionId}. It is now hidden from operational views.`
    );
    setToggleActiveTarget(null);
  };

  // =========================================================================
  // EXPORT: EXCEL (.xlsx) & PRINTABLE PDF REPORT (NO window.open)
  // =========================================================================
  const handleExportExcel = () => {
    const rows = sortedAllocations.map((a) => ({
      'Academic Year': a.academicYearLabel,
      Organization: a.organizationName,
      School: getSchoolNameById(a.schoolId, schools),
      Campus: getCampusNameById(a.schoolId, a.campusId, schools),
      Class: a.className,
      Section: a.sectionId,
      Subject: a.subjectName,
      'Subject Code': a.subjectCode,
      'Subject Type': a.subjectType,
      'Assigned Teacher': a.assignedTeacherName,
      'Weekly Periods': a.weeklyPeriods,
      'Total Marks': a.totalMarks,
      Classification: a.classification,
      Status: a.isDeleted ? 'Soft-Deleted' : a.isActive ? 'Active' : 'Inactive',
      'Created By': a.createdBy,
      'Updated By': a.updatedBy,
      'Updated Date': a.updatedDate,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0] || { Empty: '' }).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Subject Allocations');
    XLSX.writeFile(wb, `subject_allocations_${filterYearId}.xlsx`);
    showToast(`Exported ${rows.length} allocation record(s) to Excel (.xlsx).`);
  };

  const handleExportPdfPrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const rowsHtml = sortedAllocations
      .map(
        (a) => `
      <tr>
        <td>${a.academicYearLabel}</td>
        <td>${getSchoolNameById(a.schoolId, schools)}</td>
        <td>${getCampusNameById(a.schoolId, a.campusId, schools)}</td>
        <td>${a.className} - ${a.sectionId}</td>
        <td><strong>${a.subjectName}</strong><br/><span style="color:#64748b;font-size:10px">${a.subjectCode}</span></td>
        <td>${a.assignedTeacherName}</td>
        <td style="text-align:center">${a.weeklyPeriods}</td>
        <td>${a.subjectType} (${a.classification})</td>
        <td>${a.isDeleted ? 'Deleted' : a.isActive ? 'Active' : 'Inactive'}</td>
      </tr>`
      )
      .join('');

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<!doctype html><html><head><title>Subject Allocation Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0B1F3A; padding: 24px; }
          h1 { margin: 0 0 4px; font-size: 18px; }
          p { margin: 0 0 16px; color: #475569; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th { background: #0B1F3A; color: #D4AF37; text-align: left; padding: 8px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 7px 8px; vertical-align: top; }
          tr:nth-child(even) { background: #f8fafc; }
        </style></head><body>
        <h1>LEADERS ERP — Classwise &amp; Sectionwise Subject Allocation Report</h1>
        <p>Academic Year: ${filterYearId} · Generated by ${actorName} on ${nowTimestamp()} · Records: ${sortedAllocations.length}</p>
        <table>
          <thead><tr>
            <th>Academic Year</th><th>School</th><th>Campus</th><th>Class &amp; Sec</th>
            <th>Subject / Code</th><th>Assigned Teacher</th><th>Periods/Wk</th><th>Type</th><th>Status</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body></html>`);
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => document.body.removeChild(iframe), 1000);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel="Academic Management · Curriculum Mapping"
        title="Classwise & Sectionwise Subject Allocation"
        subtitle="Allocate subjects, weekly periods, marks, and school/campus-eligible faculty independently across academic years, schools, campuses, classes, and sections."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBlueprintOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>DRF API &amp; MySQL Spec</span>
            </button>
            <button
              type="button"
              disabled={!crud.create}
              onClick={openBulkModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D4AF37]/70 bg-[#D4AF37]/12 hover:bg-[#D4AF37]/20 text-[#0B1F3A] text-xs font-bold disabled:opacity-40 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>Bulk Subject Allocation</span>
            </button>
            <button
              type="button"
              disabled={!crud.create}
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Add Allocation</span>
            </button>
          </div>
        }
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            {toast.text}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Active Allocations
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {kpis.activeCount}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            Operational curriculum records
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Class Sections Mapped
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {kpis.sectionsCovered}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Users className="w-3 h-3 text-[#9A7418]" />
            Independent per section &amp; year
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Weekly Periods Scheduled
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {kpis.totalWeeklyPeriods}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#9A7418]" />
            Across active section allocations
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Inactive / Soft-Deleted
          </p>
          <p className="text-2xl font-extrabold text-[#0B1F3A] tabular-nums mt-1">
            {kpis.inactiveCount}{' '}
            <span className="text-sm font-semibold text-slate-400">
              / {kpis.deletedCount}
            </span>
          </p>
          <button
            type="button"
            onClick={() =>
              setStatusView(statusView === 'inactive' ? 'active' : 'inactive')
            }
            className="text-[11px] font-semibold text-[#9A7418] hover:text-[#0B1F3A] mt-0.5 cursor-pointer"
          >
            {statusView === 'inactive'
              ? 'Return to Active View ➔'
              : 'View & Reactivate Inactive ➔'}
          </button>
        </div>
      </div>

      {/* Allocation Configuration Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Academic Year
            </label>
            <select
              value={filterYearId}
              onChange={(e) => setFilterYearId(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A]"
            >
              <option value="all">All Academic Years</option>
              {academicYears.map((yr) => (
                <option key={yr.id} value={yr.id}>
                  {yr.label} ({yr.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Organization / School
            </label>
            <select
              value={filterSchoolId}
              disabled={Boolean(lockedSchoolId)}
              onChange={(e) => {
                setFilterSchoolId(e.target.value);
                setFilterCampusId('all');
                setFilterClassId('all');
                setFilterSectionId('all');
              }}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A] disabled:opacity-60"
            >
              {!lockedSchoolId && <option value="all">All Schools</option>}
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Campus
            </label>
            <select
              value={filterCampusId}
              disabled={Boolean(lockedCampusId) || filterSchoolId === 'all'}
              onChange={(e) => {
                setFilterCampusId(e.target.value);
                setFilterClassId('all');
                setFilterSectionId('all');
              }}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A] disabled:opacity-60"
            >
              <option value="all">All Campuses</option>
              {campusesForFilterSchool.map((cmp) => (
                <option key={cmp.id} value={cmp.id}>
                  {cmp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Class
            </label>
            <select
              value={filterClassId}
              onChange={(e) => {
                setFilterClassId(e.target.value);
                setFilterSectionId('all');
              }}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A]"
            >
              <option value="all">All Classes</option>
              {classesForFilterScope.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.gradeName} ({cls.curriculum})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Section
            </label>
            <select
              value={filterSectionId}
              disabled={filterClassId === 'all'}
              onChange={(e) => setFilterSectionId(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A] disabled:opacity-60"
            >
              <option value="all">All Sections</option>
              {sectionsForFilterClass.map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Subject Type
            </label>
            <select
              value={filterSubjectType}
              onChange={(e) => setFilterSubjectType(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-medium text-[#0B1F3A]"
            >
              <option value="all">All Types</option>
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Mode Bar + Search + Export Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'active', label: `Active (${kpis.activeCount})` },
                { id: 'inactive', label: `Inactive (${kpis.inactiveCount})` },
                {
                  id: 'all',
                  label: `All Active & Inactive (${kpis.activeCount + kpis.inactiveCount})`,
                },
                { id: 'deleted', label: `Soft-Deleted (${kpis.deletedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusView(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                  statusView === tab.id
                    ? 'bg-[#0B1F3A] text-[#D4AF37]'
                    : 'bg-slate-100 text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, code, teacher, class..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#0B1F3A]"
              />
            </div>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={handleExportPdfPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Allocation Management Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-[10.5px] uppercase tracking-wider text-slate-500">
              <tr>
                {(
                  [
                    { field: 'academicYearLabel', label: 'Academic Year' },
                    { field: 'schoolId', label: 'School / Campus' },
                    { field: 'className', label: 'Class & Sec' },
                    { field: 'subjectName', label: 'Subject' },
                    { field: 'subjectCode', label: 'Code' },
                    { field: 'assignedTeacherName', label: 'Assigned Teacher' },
                    { field: 'weeklyPeriods', label: 'Periods/Wk' },
                    { field: 'subjectType', label: 'Type & Marks' },
                  ] as { field: SortField; label: string }[]
                ).map((col) => (
                  <th key={col.field} className="px-3.5 py-3 font-semibold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.field)}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A] cursor-pointer"
                    >
                      <span>{col.label}</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </button>
                  </th>
                ))}
                <th className="px-3.5 py-3 font-semibold whitespace-nowrap">Status</th>
                <th className="px-3.5 py-3 font-semibold text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    No subject allocations found for the selected filters. Click{' '}
                    <strong className="text-[#0B1F3A]">+ Add Allocation</strong> or{' '}
                    <strong className="text-[#0B1F3A]">Bulk Subject Allocation</strong> to configure subjects.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((a) => (
                  <tr
                    key={a.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${
                      !a.isActive ? 'bg-slate-50/70' : ''
                    }`}
                  >
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-semibold text-[#0B1F3A]">
                        {a.academicYearLabel}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 min-w-[165px]">
                      <p className="font-semibold text-[#0B1F3A] truncate max-w-[180px]">
                        {getSchoolNameById(a.schoolId, schools)}
                      </p>
                      <p className="text-[10.5px] text-slate-500 truncate max-w-[180px]">
                        {getCampusNameById(a.schoolId, a.campusId, schools)}
                      </p>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-bold text-[#0B1F3A]">{a.className}</span>
                      <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] font-bold text-[10.5px]">
                        Sec {a.sectionId}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 min-w-[160px]">
                      <p className="font-bold text-[#0B1F3A]">{a.subjectName}</p>
                      <p className="text-[10.5px] text-slate-500">
                        {a.classification} · Updated {a.updatedDate}
                      </p>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {a.subjectCode}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <p className="font-semibold text-[#0B1F3A]">
                        {a.assignedTeacherName}
                      </p>
                      <p className="text-[10.5px] text-slate-500">
                        By {a.updatedBy}
                      </p>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                        {a.weeklyPeriods}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#8A6712] border border-[#D4AF37]/30 text-[10.5px] font-bold">
                        {a.subjectType}
                      </span>
                      <p className="text-[10.5px] text-slate-500 mt-0.5 tabular-nums">
                        Max {a.totalMarks} marks
                      </p>
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      {a.isDeleted ? (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10.5px] font-bold inline-flex items-center gap-1">
                          <Archive className="w-3 h-3" />
                          Soft-Deleted
                        </span>
                      ) : a.isActive ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10.5px] font-bold">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right whitespace-nowrap">
                      {a.isDeleted ? (
                        onRestoreSoftDeleted && crud.update ? (
                          <button
                            type="button"
                            onClick={() => {
                              onRestoreSoftDeleted(a.id, actorName);
                              showToast(
                                `Restored "${a.subjectName}" (${a.className} Sec ${a.sectionId}) as Inactive.`
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-[#0B1F3A] cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3 text-[#9A7418]" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <span className="text-[10.5px] text-slate-400">
                            Archived
                          </span>
                        )
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!crud.update}
                            onClick={() => openEditModal(a)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-[#0B1F3A] disabled:opacity-40 cursor-pointer"
                            title="Edit Allocation"
                          >
                            <Edit className="w-3 h-3 text-[#9A7418]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            disabled={!crud.update}
                            onClick={() => setToggleActiveTarget(a)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-semibold disabled:opacity-40 cursor-pointer ${
                              a.isActive
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/70'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                            }`}
                            title={a.isActive ? 'Deactivate Allocation' : 'Activate Allocation'}
                          >
                            {a.isActive ? (
                              <>
                                <PowerOff className="w-3 h-3" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Power className="w-3 h-3" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={!crud.delete}
                            onClick={() => initiateDelete(a)}
                            className="p-1.5 rounded border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 disabled:opacity-40 cursor-pointer"
                            title="Delete Allocation (with dependency check)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-[#F8FAFC] border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <strong className="text-[#0B1F3A]">
                {sortedAllocations.length === 0
                  ? 0
                  : (safePage - 1) * pageSize + 1}
              </strong>
              –
              <strong className="text-[#0B1F3A]">
                {Math.min(safePage * pageSize, sortedAllocations.length)}
              </strong>{' '}
              of <strong className="text-[#0B1F3A]">{sortedAllocations.length}</strong>{' '}
              records
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px]"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="px-2 font-semibold text-[#0B1F3A] tabular-nums">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD ALLOCATION (SINGLE OR MULTI-SUBJECT FOR CLASS + SECTION) */}
      {/* ===================================================================== */}
      <EnterpriseFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Classwise Subject Allocation"
        subtitle="Select academic year, school, campus, class, section, and allocate one or multiple subjects with eligible teachers."
        maxWidthClass="max-w-4xl"
      >
        <form onSubmit={handleSaveAddAllocations} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Academic Year *
              </label>
              <select
                value={addYearId}
                onChange={(e) => setAddYearId(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                School *
              </label>
              <select
                value={addSchoolId}
                disabled={Boolean(lockedSchoolId)}
                onChange={(e) => {
                  const nextSchool = e.target.value;
                  setAddSchoolId(nextSchool);
                  const nextCampus =
                    schools.find((s) => s.id === nextSchool)?.campuses[0]?.id || '';
                  setAddCampusId(nextCampus);
                  const nextCls = allClasses.find(
                    (c) => (c.schoolId || 'sch-leaders-cbse') === nextSchool
                  );
                  setAddClassId(nextCls?.id || '');
                  setAddSectionId(nextCls?.sections[0] || '');
                  setAddSubjectConfigs({});
                }}
                className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg disabled:opacity-60"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shortName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Campus *
              </label>
              <select
                value={addCampusId}
                disabled={Boolean(lockedCampusId)}
                onChange={(e) => {
                  setAddCampusId(e.target.value);
                  setAddSubjectConfigs({});
                }}
                className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg disabled:opacity-60"
              >
                {addModalCampuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Class *
              </label>
              <select
                value={addClassId}
                onChange={(e) => {
                  const cls = addModalClasses.find((c) => c.id === e.target.value);
                  setAddClassId(e.target.value);
                  setAddSectionId(cls?.sections[0] || '');
                }}
                className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {addModalClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.gradeName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Section *
              </label>
              <select
                value={addSectionId}
                onChange={(e) => setAddSectionId(e.target.value)}
                className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {(addModalSelectedClass?.sections || []).map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0B1F3A]/[0.04] border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 text-[#0B1F3A] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9A7418]" />
              Eligible Active Teachers for Selected School &amp; Campus:{' '}
              <strong>{addModalEligibleTeachers.length}</strong>
            </span>
            <span className="text-slate-500">
              Subjects already allocated to this section are marked as Duplicate.
            </span>
          </div>

          {/* Multi-Subject Selection & Per-Subject Config */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3.5 py-2 bg-[#F8FAFC] border-b border-slate-200 font-bold text-[#0B1F3A]">
              Select Subjects &amp; Assign Teachers ({Object.keys(addSubjectConfigs).length} selected)
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {allSubjects.map((sub) => {
                const uniqueKey = buildAllocationUniqueKey({
                  academicYearId: addYearId,
                  schoolId: addSchoolId,
                  campusId: addCampusId,
                  classId: addClassId,
                  sectionId: addSectionId,
                  subjectId: sub.id,
                });
                const existingDup = existingAllocationByKey.get(uniqueKey);
                const cfg = addSubjectConfigs[sub.id];

                return (
                  <div
                    key={sub.id}
                    className={`p-3 space-y-2.5 ${
                      existingDup
                        ? 'bg-amber-50/40'
                        : cfg
                        ? 'bg-[#0B1F3A]/[0.03]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={Boolean(existingDup)}
                          checked={Boolean(cfg)}
                          onChange={() => handleToggleAddSubject(sub)}
                          className="w-4 h-4 accent-[#0B1F3A]"
                        />
                        <div>
                          <span className="font-bold text-[#0B1F3A]">
                            {sub.name}
                          </span>
                          <span className="ml-2 font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {sub.code}
                          </span>
                        </div>
                      </label>

                      {existingDup ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[10.5px] font-bold">
                          Already Allocated ({existingDup.assignedTeacherName} ·{' '}
                          {existingDup.isActive ? 'Active' : 'Inactive'})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Master Max Marks: {sub.maxMarks}
                        </span>
                      )}
                    </div>

                    {cfg && !existingDup && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 pl-6">
                        <div className="lg:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Assigned Teacher (School/Campus Eligible) *
                          </label>
                          <select
                            value={cfg.assignedTeacherId}
                            onChange={(e) =>
                              setAddSubjectConfigs((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  assignedTeacherId: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                          >
                            <option value="">-- Select Teacher --</option>
                            {addModalEligibleTeachers.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} ({st.empId} · {st.department})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Subject Type
                          </label>
                          <select
                            value={cfg.subjectType}
                            onChange={(e) =>
                              setAddSubjectConfigs((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  subjectType: e.target.value as AllocationSubjectType,
                                },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                          >
                            {SUBJECT_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Weekly Periods / Marks
                          </label>
                          <div className="grid grid-cols-2 gap-1">
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={cfg.weeklyPeriods}
                              onChange={(e) =>
                                setAddSubjectConfigs((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...prev[sub.id],
                                    weeklyPeriods: Number(e.target.value),
                                  },
                                }))
                              }
                              title="Weekly Periods"
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                            />
                            <input
                              type="number"
                              min={1}
                              max={500}
                              value={cfg.totalMarks}
                              onChange={(e) =>
                                setAddSubjectConfigs((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...prev[sub.id],
                                    totalMarks: Number(e.target.value),
                                  },
                                }))
                              }
                              title="Total Marks"
                              className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                            Classification
                          </label>
                          <select
                            value={cfg.classification}
                            onChange={(e) =>
                              setAddSubjectConfigs((prev) => ({
                                ...prev,
                                [sub.id]: {
                                  ...prev[sub.id],
                                  classification: e.target.value as AllocationDeliveryType,
                                },
                              }))
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs"
                          >
                            {DELIVERY_TYPES.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {addError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 font-medium">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{addError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Save Allocations ({Object.keys(addSubjectConfigs).length})</span>
            </button>
          </div>
        </form>
      </EnterpriseFormModal>

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT & UPDATE ALLOCATION (WITH EXISTING VALUES DISPLAY)      */}
      {/* ===================================================================== */}
      <EnterpriseFormModal
        isOpen={Boolean(editingAllocation)}
        onClose={() => setEditingAllocation(null)}
        title={`Edit Subject Allocation — ${editingAllocation?.className || ''} Sec ${
          editingAllocation?.sectionId || ''
        }`}
        subtitle="Review existing saved values below and update subject, teacher, weekly periods, marks, or classification."
        maxWidthClass="max-w-2xl"
      >
        {editingAllocation && (
          <form onSubmit={handleSaveEditAllocation} className="space-y-4 text-xs">
            {/* Existing Values Snapshot */}
            <div className="p-3.5 rounded-xl bg-[#0B1F3A]/[0.04] border border-slate-200 space-y-1.5">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#9A7418]">
                Existing Saved Allocation Values
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Scope</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.academicYearLabel} · {editingAllocation.className} Sec{' '}
                    {editingAllocation.sectionId}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Subject</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.subjectName} ({editingAllocation.subjectCode})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Teacher</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.assignedTeacherName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Periods / Marks</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.weeklyPeriods}/wk · {editingAllocation.totalMarks} marks
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Type / Classification</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.subjectType} · {editingAllocation.classification}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Last Modified</span>
                  <strong className="text-[#0B1F3A]">
                    {editingAllocation.updatedBy} ({editingAllocation.updatedDate})
                  </strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Subject *
                </label>
                <select
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                >
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Assigned Teacher (Eligible Staff) *
                </label>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                >
                  {editEligibleTeachers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.empId} · {st.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Subject Type
                </label>
                <select
                  value={editSubjectType}
                  onChange={(e) =>
                    setEditSubjectType(e.target.value as AllocationSubjectType)
                  }
                  className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                >
                  {SUBJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Weekly Periods
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={editWeeklyPeriods}
                  onChange={(e) => setEditWeeklyPeriods(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={editTotalMarks}
                  onChange={(e) => setEditTotalMarks(Number(e.target.value))}
                  className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  Classification
                </label>
                <select
                  value={editClassification}
                  onChange={(e) =>
                    setEditClassification(e.target.value as AllocationDeliveryType)
                  }
                  className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                >
                  {DELIVERY_TYPES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 font-medium">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingAllocation(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Update Allocation</span>
              </button>
            </div>
          </form>
        )}
      </EnterpriseFormModal>

      {/* ===================================================================== */}
      {/* MODAL 3: BULK SUBJECT ALLOCATION WIZARD (3 STEPS WITH DUPLICATE CHECK)*/}
      {/* ===================================================================== */}
      <EnterpriseFormModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Subject Allocation Wizard"
        subtitle="Allocate multiple subjects across multiple sections of a class, assign individual teachers, and review duplicates before saving."
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          {/* Stepper Indicator */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { step: 1, title: '1. Class & Sections' },
              { step: 2, title: '2. Subjects & Teachers' },
              { step: 3, title: '3. Review & Confirm' },
            ].map((s) => (
              <div
                key={s.step}
                className={`px-3 py-2 rounded-lg border font-bold text-center ${
                  bulkStep === s.step
                    ? 'bg-[#0B1F3A] text-[#D4AF37] border-[#0B1F3A]'
                    : bulkStep > s.step
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                {s.title}
              </div>
            ))}
          </div>

          {/* STEP 1: SELECT SCOPE & MULTIPLE SECTIONS */}
          {bulkStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={bulkYearId}
                    onChange={(e) => setBulkYearId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                  >
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">
                    School *
                  </label>
                  <select
                    value={bulkSchoolId}
                    disabled={Boolean(lockedSchoolId)}
                    onChange={(e) => {
                      const nextSchool = e.target.value;
                      setBulkSchoolId(nextSchool);
                      setBulkCampusId(
                        schools.find((s) => s.id === nextSchool)?.campuses[0]?.id || ''
                      );
                      const nextCls = allClasses.find(
                        (c) => (c.schoolId || 'sch-leaders-cbse') === nextSchool
                      );
                      setBulkClassId(nextCls?.id || '');
                      setBulkSections(nextCls ? [...nextCls.sections] : []);
                    }}
                    className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg disabled:opacity-60"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">
                    Campus *
                  </label>
                  <select
                    value={bulkCampusId}
                    disabled={Boolean(lockedCampusId)}
                    onChange={(e) => setBulkCampusId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg disabled:opacity-60"
                  >
                    {bulkCampuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0B1F3A] mb-1">
                    Class *
                  </label>
                  <select
                    value={bulkClassId}
                    onChange={(e) => {
                      const cls = bulkClasses.find((c) => c.id === e.target.value);
                      setBulkClassId(e.target.value);
                      setBulkSections(cls ? [...cls.sections] : []);
                    }}
                    className="w-full px-2.5 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                  >
                    {bulkClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.gradeName} ({c.curriculum})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-2">
                  Select Target Sections for {bulkSelectedClass?.gradeName || 'Class'} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {(bulkSelectedClass?.sections || []).map((sec) => {
                    const checked = bulkSections.includes(sec);
                    return (
                      <label
                        key={sec}
                        className={`px-3.5 py-2 rounded-lg border font-bold cursor-pointer inline-flex items-center gap-2 ${
                          checked
                            ? 'bg-[#0B1F3A] text-[#D4AF37] border-[#0B1F3A]'
                            : 'bg-[#F8FAFC] text-slate-700 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setBulkSections((prev) =>
                              prev.includes(sec)
                                ? prev.filter((s) => s !== sec)
                                : [...prev, sec]
                            )
                          }
                          className="accent-[#D4AF37]"
                        />
                        <span>Section {sec}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SELECT MULTIPLE SUBJECTS & ASSIGN TEACHERS INDIVIDUALLY */}
          {bulkStep === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-200">
                <span className="font-semibold text-[#0B1F3A]">
                  Target: {bulkSelectedClass?.gradeName} · Sections{' '}
                  <strong>{bulkSections.join(', ')}</strong>
                </span>
                <span className="text-slate-500">
                  {bulkEligibleTeachers.length} eligible teacher(s) in campus
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {allSubjects.map((sub) => {
                  const selected = bulkSubjectIds.includes(sub.id);
                  const meta = bulkSubjectMeta[sub.id] || {
                    subjectType: mapSubjectTypeDefault(sub.type),
                    weeklyPeriods: 5,
                    totalMarks: sub.maxMarks || 100,
                    classification: 'Theory' as AllocationDeliveryType,
                  };
                  return (
                    <div
                      key={sub.id}
                      className={`p-3 space-y-2.5 ${
                        selected ? 'bg-[#0B1F3A]/[0.03]' : 'bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBulkSubject(sub)}
                            className="w-4 h-4 accent-[#0B1F3A]"
                          />
                          <span className="font-bold text-[#0B1F3A]">
                            {sub.name}
                          </span>
                          <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {sub.code}
                          </span>
                        </label>

                        {selected && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <select
                              value={meta.subjectType}
                              onChange={(e) =>
                                setBulkSubjectMeta((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...meta,
                                    subjectType: e.target.value as AllocationSubjectType,
                                  },
                                }))
                              }
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                            >
                              {SUBJECT_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={30}
                              value={meta.weeklyPeriods}
                              onChange={(e) =>
                                setBulkSubjectMeta((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...meta,
                                    weeklyPeriods: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                              title="Weekly Periods"
                            />
                            <select
                              value={meta.classification}
                              onChange={(e) =>
                                setBulkSubjectMeta((prev) => ({
                                  ...prev,
                                  [sub.id]: {
                                    ...meta,
                                    classification: e.target.value as AllocationDeliveryType,
                                  },
                                }))
                              }
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-[11px]"
                            >
                              {DELIVERY_TYPES.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {selected && (
                        <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {bulkSections.map((sec) => {
                            const mapKey = `${sec}::${sub.id}`;
                            return (
                              <div
                                key={mapKey}
                                className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                              >
                                <span className="px-1.5 py-0.5 rounded bg-[#0B1F3A] text-[#D4AF37] font-bold text-[10px] shrink-0">
                                  Sec {sec}
                                </span>
                                <select
                                  value={bulkTeacherMap[mapKey] || ''}
                                  onChange={(e) =>
                                    setBulkTeacherMap((prev) => ({
                                      ...prev,
                                      [mapKey]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 text-xs bg-transparent focus:outline-none"
                                >
                                  <option value="">-- Assign Teacher --</option>
                                  {bulkEligibleTeachers.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.name} ({st.department})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & DUPLICATE RESOLUTION BEFORE SAVING */}
          {bulkStep === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">
                    New Allocations
                  </p>
                  <p className="text-xl font-extrabold text-emerald-800 tabular-nums">
                    {bulkNewCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase text-amber-800">
                    Duplicates Detected
                  </p>
                  <p className="text-xl font-extrabold text-amber-900 tabular-nums">
                    {bulkDuplicateCount}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-[10px] font-bold uppercase text-rose-700">
                    Teacher Issues
                  </p>
                  <p className="text-xl font-extrabold text-rose-800 tabular-nums">
                    {bulkTeacherErrorCount}
                  </p>
                </div>
              </div>

              {bulkDuplicateCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    {bulkDuplicateCount} existing allocation(s) found — choose how to handle duplicates:
                  </p>
                  <label className="flex items-center gap-2 text-amber-950 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkDupMode"
                      checked={bulkDuplicateMode === 'skip'}
                      onChange={() => setBulkDuplicateMode('skip')}
                      className="accent-[#0B1F3A]"
                    />
                    <span>
                      <strong>Skip duplicates (Recommended)</strong> — preserve existing records and save only the {bulkNewCount} new allocation(s).
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-amber-950 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkDupMode"
                      checked={bulkDuplicateMode === 'overwrite'}
                      onChange={() => setBulkDuplicateMode('overwrite')}
                      className="accent-[#0B1F3A]"
                    />
                    <span>
                      <strong>Update existing duplicates</strong> — overwrite teacher, weekly periods, and classification on matching allocations.
                    </span>
                  </label>
                  {bulkDuplicateMode === 'overwrite' && (
                    <label className="flex items-center gap-2 pl-6 pt-1 text-rose-800 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkOverwriteConfirmed}
                        onChange={(e) =>
                          setBulkOverwriteConfirmed(e.target.checked)
                        }
                        className="accent-rose-600"
                      />
                      <span>
                        I explicitly confirm updating {bulkDuplicateCount} existing allocation record(s).
                      </span>
                    </label>
                  )}
                </div>
              )}

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {bulkPreviewItems.map((item) => (
                  <div
                    key={item.key}
                    className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-white"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#0B1F3A] text-[#D4AF37] font-bold text-[10px]">
                          {bulkSelectedClass?.gradeName} Sec {item.section}
                        </span>
                        <span className="font-bold text-[#0B1F3A]">
                          {item.subject.name} ({item.subject.code})
                        </span>
                        {item.existingDuplicate ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                            Duplicate ({bulkDuplicateMode === 'skip' ? 'Will Skip' : 'Will Update'})
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Teacher: <strong>{item.teacher?.name || 'Unassigned'}</strong> ·{' '}
                        {item.meta.weeklyPeriods} periods/wk · {item.meta.subjectType} ·{' '}
                        {item.meta.classification}
                      </p>
                      {item.teacherError && (
                        <p className="text-[11px] text-rose-700 font-semibold">
                          {item.teacherError}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {bulkError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-medium">
              {bulkError}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <div>
              {bulkStep > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkError(null);
                    setBulkStep((s) => (s === 3 ? 2 : 1));
                  }}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              {bulkStep === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!bulkClassId || bulkSections.length === 0) {
                      setBulkError('Select a class and at least one section.');
                      return;
                    }
                    setBulkError(null);
                    setBulkStep(2);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
                >
                  Next: Select Subjects ➔
                </button>
              )}
              {bulkStep === 2 && (
                <button
                  type="button"
                  onClick={() => {
                    if (bulkSubjectIds.length === 0) {
                      setBulkError('Select at least one subject to allocate.');
                      return;
                    }
                    setBulkError(null);
                    setBulkStep(3);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold cursor-pointer"
                >
                  Next: Review Plan ➔
                </button>
              )}
              {bulkStep === 3 && (
                <button
                  type="button"
                  disabled={
                    bulkTeacherErrorCount > 0 ||
                    (bulkNewCount === 0 && bulkDuplicateMode === 'skip') ||
                    (bulkDuplicateCount > 0 &&
                      bulkDuplicateMode === 'overwrite' &&
                      !bulkOverwriteConfirmed)
                  }
                  onClick={handleCommitBulkAllocation}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold disabled:opacity-40 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Confirm Bulk Allocation</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </EnterpriseFormModal>

      {/* ===================================================================== */}
      {/* MODAL 4: DELETE ALLOCATION (DEPENDENCY CHECK + SOFT DELETE)           */}
      {/* ===================================================================== */}
      <EnterpriseFormModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Subject Allocation — Dependency Check"
        subtitle={
          deleteTarget
            ? `${deleteTarget.allocation.className} Sec ${deleteTarget.allocation.sectionId} · ${deleteTarget.allocation.subjectName} (${deleteTarget.allocation.subjectCode})`
            : ''
        }
        maxWidthClass="max-w-lg"
      >
        {deleteTarget && (
          <div className="space-y-4 text-xs">
            {deleteTarget.report.hasDependencies ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-rose-900">
                <p className="font-bold flex items-center gap-2 text-rose-800">
                  <XCircle className="w-4 h-4 shrink-0" />
                  Unsafe Deletion Blocked — Active Academic Dependencies Detected
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  {deleteTarget.report.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
                <p className="text-[11px] pt-1">
                  To protect timetable schedules and historical examination markcharts, delete is disabled. You may safely <strong>Deactivate</strong> this allocation instead.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-amber-950">
                <p className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  No Active Timetable or Exam Dependencies Found
                </p>
                <p className="text-[11px]">
                  Confirming will perform a <strong>soft deletion</strong> (`is_deleted = 1`), removing this allocation from active operations while preserving the historical audit record.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              {deleteTarget.report.hasDependencies ? (
                deleteTarget.allocation.isActive && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleAllocationActive(
                        deleteTarget.allocation.id,
                        false,
                        actorName
                      );
                      showToast(
                        `Deactivated "${deleteTarget.allocation.subjectName}" safely instead of deleting.`,
                        'warning'
                      );
                      setDeleteTarget(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Deactivate Instead</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSoftDeleteAllocation(deleteTarget.allocation.id, actorName);
                    showToast(
                      `Soft-deleted allocation "${deleteTarget.allocation.subjectName}" for ${deleteTarget.allocation.className} Sec ${deleteTarget.allocation.sectionId}.`
                    );
                    setDeleteTarget(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Soft Delete</span>
                </button>
              )}
            </div>
          </div>
        )}
      </EnterpriseFormModal>

      {/* ACTIVATE / DEACTIVATE CONFIRMATION DIALOG */}
      <EnterpriseConfirmDialog
        isOpen={Boolean(toggleActiveTarget)}
        title={
          toggleActiveTarget?.isActive
            ? 'Deactivate Subject Allocation?'
            : 'Reactivate Subject Allocation?'
        }
        message={
          toggleActiveTarget
            ? toggleActiveTarget.isActive
              ? `Deactivating "${toggleActiveTarget.subjectName}" for ${toggleActiveTarget.className} Sec ${toggleActiveTarget.sectionId} hides it from normal operational views without deleting historical records.`
              : `Reactivating "${toggleActiveTarget.subjectName}" for ${toggleActiveTarget.className} Sec ${toggleActiveTarget.sectionId} restores it to active academic operations.`
            : ''
        }
        confirmLabel={toggleActiveTarget?.isActive ? 'Deactivate' : 'Activate'}
        tone={toggleActiveTarget?.isActive ? 'warning' : 'navy'}
        onCancel={() => setToggleActiveTarget(null)}
        onConfirm={handleConfirmToggleActive}
      />

      {/* DRF API & MYSQL 8+ ARCHITECTURE BLUEPRINT MODAL */}
      <EnterpriseFormModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
        title="Django REST Framework API & MySQL 8+ Blueprint"
        subtitle="Prepared backend API contract, atomic ViewSet, and normalized MySQL DDL for subject_allocations."
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#0B1F3A] text-white space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">
              REST API Endpoints (Django REST Framework)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px] text-slate-200">
              <span>GET /api/subject-allocations/</span>
              <span>POST /api/subject-allocations/</span>
              <span>GET /api/subject-allocations/{'{id}'}/</span>
              <span>PUT / PATCH /api/subject-allocations/{'{id}'}/</span>
              <span>DELETE /api/subject-allocations/{'{id}'}/</span>
              <span>POST /api/subject-allocations/{'{id}'}/activate/</span>
              <span>POST /api/subject-allocations/{'{id}'}/deactivate/</span>
              <span>POST /api/subject-allocations/bulk-allocate/</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B1F3A]">
                MySQL 8+ Table Schema (subject_allocations)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    DJANGO_SUBJECT_ALLOCATION_BLUEPRINT.mysqlDDL
                  );
                  setCopiedBlock('sql');
                  window.setTimeout(() => setCopiedBlock(null), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
              >
                {copiedBlock === 'sql' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedBlock === 'sql' ? 'Copied' : 'Copy SQL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-52">
              {DJANGO_SUBJECT_ALLOCATION_BLUEPRINT.mysqlDDL}
            </pre>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B1F3A]">
                Django Model &amp; Atomic ViewSet (academics/models.py &amp; views.py)
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    DJANGO_SUBJECT_ALLOCATION_BLUEPRINT.djangoModelAndViewSet
                  );
                  setCopiedBlock('drf');
                  window.setTimeout(() => setCopiedBlock(null), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold cursor-pointer"
              >
                {copiedBlock === 'drf' ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedBlock === 'drf' ? 'Copied' : 'Copy Python'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-56">
              {DJANGO_SUBJECT_ALLOCATION_BLUEPRINT.djangoModelAndViewSet}
            </pre>
          </div>
        </div>
      </EnterpriseFormModal>
    </div>
  );
};
