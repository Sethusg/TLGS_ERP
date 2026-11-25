import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { EducationBoard } from '../types';
import {
  SCHOOL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  INITIAL_EDUCATION_BOARDS,
  SchoolOption,
  CampusOption,
  AcademicYearOption,
  InstitutionalMetrics,
  getInstitutionalMetrics,
} from '../data/schoolContext';

interface SchoolContextValue {
  schools: SchoolOption[];
  academicYears: AcademicYearOption[];
  educationBoards: EducationBoard[];
  selectedSchoolId: string;
  selectedCampusId: string;
  selectedAcademicYearId: string;
  /** Optional tenant locks enforced by RBAC for school- or campus-scoped roles */
  lockedSchoolId: string | null;
  lockedCampusId: string | null;
  activeSchool: SchoolOption | null;
  metrics: InstitutionalMetrics;
  contextLabel: string;
  setSchool: (schoolId: string) => void;
  setCampus: (campusId: string) => void;
  setAcademicYear: (yearId: string) => void;
  setSchoolAndCampus: (schoolId: string, campusId?: string) => void;
  applyTenantScopeLock: (schoolId: string | null, campusId: string | null) => void;
  addSchool: (school: SchoolOption) => void;
  addCampusToSchool: (schoolId: string, campus: CampusOption) => void;
  addAcademicYear: (year: AcademicYearOption) => void;
  addEducationBoard: (board: EducationBoard) => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [schools, setSchools] = useState<SchoolOption[]>(SCHOOL_OPTIONS);
  const [academicYears, setAcademicYears] = useState<AcademicYearOption[]>(
    ACADEMIC_YEAR_OPTIONS
  );
  const [educationBoards, setEducationBoards] = useState<EducationBoard[]>(
    INITIAL_EDUCATION_BOARDS
  );

  // Default to Platform View ('all') for Super Administrator
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('all');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    ACADEMIC_YEAR_OPTIONS[0].id
  );

  const [lockedSchoolId, setLockedSchoolId] = useState<string | null>(null);
  const [lockedCampusId, setLockedCampusId] = useState<string | null>(null);

  const setSchool = useCallback(
    (schoolId: string) => {
      if (lockedSchoolId && schoolId !== lockedSchoolId) return;
      setSelectedSchoolId(schoolId);
      if (schoolId === 'all') {
        setSelectedCampusId('all');
        return;
      }
      if (lockedCampusId) {
        setSelectedCampusId(lockedCampusId);
        return;
      }
      setSelectedCampusId('all');
    },
    [lockedSchoolId, lockedCampusId]
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
      if (lockedCampusId) {
        setSelectedCampusId(lockedCampusId);
      } else if (campusId) {
        setSelectedCampusId(campusId);
      } else {
        setSelectedCampusId('all');
      }
    },
    [lockedSchoolId, lockedCampusId]
  );

  const applyTenantScopeLock = useCallback(
    (schoolLock: string | null, campusLock: string | null) => {
      setLockedSchoolId(schoolLock);
      setLockedCampusId(campusLock);
      if (schoolLock) {
        setSelectedSchoolId(schoolLock);
        setSelectedCampusId(campusLock || 'all');
      } else {
        setSelectedSchoolId('all');
        setSelectedCampusId('all');
      }
    },
    []
  );

  const addSchool = useCallback((school: SchoolOption) => {
    setSchools((prev) => [...prev, school]);
  }, []);

  const addCampusToSchool = useCallback(
    (schoolId: string, campus: CampusOption) => {
      setSchools((prev) =>
        prev.map((sch) =>
          sch.id === schoolId
            ? { ...sch, campuses: [...sch.campuses, campus] }
            : sch
        )
      );
    },
    []
  );

  const addAcademicYear = useCallback((year: AcademicYearOption) => {
    setAcademicYears((prev) => [year, ...prev]);
  }, []);

  const addEducationBoard = useCallback((board: EducationBoard) => {
    setEducationBoards((prev) => [...prev, board]);
  }, []);

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
        academicYears
      ),
    [selectedSchoolId, selectedCampusId, selectedAcademicYearId, schools, academicYears]
  );

  const contextLabel = `${metrics.schoolName} · ${metrics.campusLabel} · ${metrics.academicYearLabel}`;

  const value: SchoolContextValue = {
    schools,
    academicYears,
    educationBoards,
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    lockedSchoolId,
    lockedCampusId,
    activeSchool,
    metrics,
    contextLabel,
    setSchool,
    setCampus,
    setAcademicYear: setSelectedAcademicYearId,
    setSchoolAndCampus,
    applyTenantScopeLock,
    addSchool,
    addCampusToSchool,
    addAcademicYear,
    addEducationBoard,
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
