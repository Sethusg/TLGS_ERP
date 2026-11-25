import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { EducationBoard } from '../types';
import {
  ORGANIZATION_OPTIONS,
  SCHOOL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  INITIAL_EDUCATION_BOARDS,
  OrganizationOption,
  SchoolOption,
  CampusOption,
  AcademicYearOption,
  InstitutionalMetrics,
  LiveMetricsRecords,
  getInstitutionalMetrics,
  resolveSchoolOrgId,
} from '../data/schoolContext';
import { saveErpCollection } from '../services/erpBackendService';

interface SchoolContextValue {
  organizations: OrganizationOption[];
  schools: SchoolOption[];
  filteredSchools: SchoolOption[];
  academicYears: AcademicYearOption[];
  educationBoards: EducationBoard[];
  selectedOrganizationId: string;
  selectedSchoolId: string;
  selectedCampusId: string;
  selectedAcademicYearId: string;
  /** Optional tenant locks enforced by RBAC for school- or campus-scoped roles */
  lockedSchoolId: string | null;
  lockedCampusId: string | null;
  activeOrganization: OrganizationOption | null;
  activeSchool: SchoolOption | null;
  metrics: InstitutionalMetrics;
  contextLabel: string;
  setOrganization: (organizationId: string) => void;
  setSchool: (schoolId: string) => void;
  setCampus: (campusId: string) => void;
  setAcademicYear: (yearId: string) => void;
  setSchoolAndCampus: (schoolId: string, campusId?: string) => void;
  applyTenantScopeLock: (schoolId: string | null, campusId: string | null) => void;
  addOrganization: (org: OrganizationOption) => void;
  updateOrganization: (org: OrganizationOption) => void;
  deleteOrganization: (orgId: string) => void;
  addSchool: (school: SchoolOption) => void;
  addCampusToSchool: (schoolId: string, campus: CampusOption) => void;
  addAcademicYear: (year: AcademicYearOption) => void;
  addEducationBoard: (board: EducationBoard) => void;
  hydrateHierarchy: (data: {
    organizations?: OrganizationOption[];
    schools?: SchoolOption[];
    academicYears?: AcademicYearOption[];
  }) => void;
  setLiveMetricsInput: (records: LiveMetricsRecords) => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>(
    ORGANIZATION_OPTIONS
  );
  const [schools, setSchools] = useState<SchoolOption[]>(SCHOOL_OPTIONS);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>(
    ACADEMIC_YEAR_OPTIONS
  );
  const [educationBoards, setEducationBoards] = useState<EducationBoard[]>(
    INITIAL_EDUCATION_BOARDS
  );
  const [liveMetricsRecords, setLiveMetricsRecords] = useState<LiveMetricsRecords>({});

  // Default to Platform View ('all') for Super Administrator
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    ACADEMIC_YEAR_OPTIONS[0]?.id || ''
  );

  const [lockedSchoolId, setLockedSchoolId] = useState<string | null>(null);
  const [lockedCampusId, setLockedCampusId] = useState<string | null>(null);

  const filteredSchools = useMemo(() => {
    if (selectedOrganizationId === 'all') return schools;
    return schools.filter((s) => resolveSchoolOrgId(s) === selectedOrganizationId);
  }, [schools, selectedOrganizationId]);

  const setOrganization = useCallback(
    (orgId: string) => {
      if (lockedSchoolId) return;
      setSelectedOrganizationId(orgId);
      setSelectedSchoolId('all');
      setSelectedCampusId('all');
    },
    [lockedSchoolId]
  );

  const setSchool = useCallback(
    (schoolId: string) => {
      if (lockedSchoolId && schoolId !== lockedSchoolId) return;
      setSelectedSchoolId(schoolId);
      if (schoolId === 'all') {
        setSelectedCampusId('all');
        return;
      }
      const targetSchool = schools.find((s) => s.id === schoolId);
      if (targetSchool) {
        const targetOrgId = resolveSchoolOrgId(targetSchool);
        if (
          targetOrgId &&
          selectedOrganizationId !== 'all' &&
          selectedOrganizationId !== targetOrgId
        ) {
          setSelectedOrganizationId(targetOrgId);
        }
      }
      if (lockedCampusId) {
        setSelectedCampusId(lockedCampusId);
        return;
      }
      setSelectedCampusId('all');
    },
    [lockedSchoolId, lockedCampusId, schools, selectedOrganizationId]
  );

  const setCampus = useCallback(
    (campusId: string) => {
      if (lockedCampusId && campusId !== lockedCampusId) return;
      setSelectedCampusId(campusId);
    },
    [lockedCampusId]
  );

  const setSchoolAndCampus = useCallback(
    (schoolId: string, campusId?: string) => {
      if (lockedSchoolId && schoolId !== lockedSchoolId) return;
      setSelectedSchoolId(schoolId);
      if (schoolId !== 'all') {
        const targetSchool = schools.find((s) => s.id === schoolId);
        if (targetSchool) {
          const targetOrgId = resolveSchoolOrgId(targetSchool);
          if (
            targetOrgId &&
            selectedOrganizationId !== 'all' &&
            selectedOrganizationId !== targetOrgId
          ) {
            setSelectedOrganizationId(targetOrgId);
          }
        }
      }
      if (lockedCampusId) {
        setSelectedCampusId(lockedCampusId);
      } else if (campusId) {
        setSelectedCampusId(campusId);
      } else {
        setSelectedCampusId('all');
      }
    },
    [lockedSchoolId, lockedCampusId, schools, selectedOrganizationId]
  );

  const applyTenantScopeLock = useCallback(
    (schoolLock: string | null, campusLock: string | null) => {
      setLockedSchoolId(schoolLock);
      setLockedCampusId(campusLock);
      if (schoolLock) {
        const foundSchool = schools.find((s) => s.id === schoolLock);
        if (foundSchool) {
          const orgId = resolveSchoolOrgId(foundSchool);
          if (orgId) setSelectedOrganizationId(orgId);
        }
        setSelectedSchoolId(schoolLock);
        setSelectedCampusId(campusLock || 'all');
      } else {
        setSelectedOrganizationId('all');
        setSelectedSchoolId('all');
        setSelectedCampusId('all');
      }
    },
    [schools]
  );

  const hydrateHierarchy = useCallback(
    (data: {
      organizations?: OrganizationOption[];
      schools?: SchoolOption[];
      academicYears?: AcademicYearOption[];
    }) => {
      if (Array.isArray(data.organizations)) {
        setOrganizations(data.organizations);
      }
      if (Array.isArray(data.schools)) {
        setSchools(data.schools);
      }
      if (Array.isArray(data.academicYears)) {
        setAcademicYears(data.academicYears);
        setSelectedAcademicYearId((prev) => {
          if (prev && data.academicYears!.some((y) => y.id === prev)) return prev;
          const active = data.academicYears!.find((y) => y.isActive);
          return active?.id || data.academicYears![0]?.id || '';
        });
      }
    },
    []
  );

  const addOrganization = useCallback((org: OrganizationOption) => {
    setOrganizations((prev) => {
      const next = [...prev, org];
      void saveErpCollection('organizations', next).catch(() => undefined);
      return next;
    });
  }, []);

  const updateOrganization = useCallback((org: OrganizationOption) => {
    setOrganizations((prev) => {
      const next = prev.map((item) => (item.id === org.id ? org : item));
      void saveErpCollection('organizations', next).catch(() => undefined);
      return next;
    });
  }, []);

  const deleteOrganization = useCallback((orgId: string) => {
    setOrganizations((prev) => {
      const next = prev.filter((item) => item.id !== orgId);
      void saveErpCollection('organizations', next).catch(() => undefined);
      return next;
    });
  }, []);

  const addSchool = useCallback((school: SchoolOption) => {
    setSchools((prev) => {
      const next = [...prev, school];
      void saveErpCollection('schools', next).catch(() => undefined);
      return next;
    });
  }, []);

  const addCampusToSchool = useCallback(
    (schoolId: string, campus: CampusOption) => {
      setSchools((prev) => {
        const next = prev.map((sch) =>
          sch.id === schoolId
            ? { ...sch, campuses: [...sch.campuses, campus] }
            : sch
        );
        void saveErpCollection('schools', next).catch(() => undefined);
        return next;
      });
    },
    []
  );

  const addAcademicYear = useCallback((year: AcademicYearOption) => {
    setAcademicYears((prev) => {
      const next = [year, ...prev];
      void saveErpCollection('academicYears', next).catch(() => undefined);
      return next;
    });
    setSelectedAcademicYearId((prev) => prev || year.id);
  }, []);

  const addEducationBoard = useCallback((board: EducationBoard) => {
    setEducationBoards((prev) => [...prev, board]);
  }, []);

  const activeOrganization = useMemo(
    () =>
      selectedOrganizationId === 'all'
        ? null
        : organizations.find((o) => o.id === selectedOrganizationId) || null,
    [selectedOrganizationId, organizations]
  );

  const activeSchool = useMemo(
    () =>
      selectedSchoolId === 'all'
        ? null
        : schools.find((s) => s.id === selectedSchoolId) || schools[0] || null,
    [selectedSchoolId, schools]
  );

  const metrics = useMemo(
    () =>
      getInstitutionalMetrics(
        selectedSchoolId,
        selectedCampusId,
        selectedAcademicYearId,
        schools,
        academicYears,
        selectedOrganizationId,
        {
          ...liveMetricsRecords,
          organizations,
        }
      ),
    [
      selectedOrganizationId,
      selectedSchoolId,
      selectedCampusId,
      selectedAcademicYearId,
      schools,
      academicYears,
      organizations,
      liveMetricsRecords,
    ]
  );

  const contextLabel = `${metrics.schoolName} · ${metrics.campusLabel} · ${metrics.academicYearLabel}`;

  const value: SchoolContextValue = {
    organizations,
    schools,
    filteredSchools,
    academicYears,
    educationBoards,
    selectedOrganizationId,
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    lockedSchoolId,
    lockedCampusId,
    activeOrganization,
    activeSchool,
    metrics,
    contextLabel,
    setOrganization,
    setSchool,
    setCampus,
    setAcademicYear: setSelectedAcademicYearId,
    setSchoolAndCampus,
    applyTenantScopeLock,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    addSchool,
    addCampusToSchool,
    addAcademicYear,
    addEducationBoard,
    hydrateHierarchy,
    setLiveMetricsInput: setLiveMetricsRecords,
  };

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  );
};

export function useSchoolContext(): SchoolContextValue {
  const ctx = useContext(SchoolContext);
  if (!ctx) {
    throw new Error('useSchoolContext must be used within a SchoolProvider');
  }
  return ctx;
}
