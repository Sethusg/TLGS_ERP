import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  SCHOOL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  SchoolOption,
  InstitutionalMetrics,
  getInstitutionalMetrics,
} from '../data/schoolContext';

interface SchoolContextValue {
  selectedSchoolId: string;
  selectedCampusId: string;
  selectedAcademicYearId: string;
  activeSchool: SchoolOption;
  metrics: InstitutionalMetrics;
  contextLabel: string;
  setSchool: (schoolId: string) => void;
  setCampus: (campusId: string) => void;
  setAcademicYear: (yearId: string) => void;
  setSchoolAndCampus: (schoolId: string, campusId?: string) => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(
    SCHOOL_OPTIONS[0].id
  );
  const [selectedCampusId, setSelectedCampusId] = useState<string>(
    SCHOOL_OPTIONS[0].campuses[0].id
  );
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    ACADEMIC_YEAR_OPTIONS[0].id
  );

  const setSchool = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    const matched = SCHOOL_OPTIONS.find((s) => s.id === schoolId);
    if (matched && matched.campuses.length > 0) {
      setSelectedCampusId(matched.campuses[0].id);
    } else {
      setSelectedCampusId('all');
    }
  };

  const setSchoolAndCampus = (schoolId: string, campusId?: string) => {
    setSelectedSchoolId(schoolId);
    if (campusId) {
      setSelectedCampusId(campusId);
    } else {
      const matched = SCHOOL_OPTIONS.find((s) => s.id === schoolId);
      setSelectedCampusId(matched?.campuses[0]?.id || 'all');
    }
  };

  const activeSchool = useMemo(
    () =>
      SCHOOL_OPTIONS.find((s) => s.id === selectedSchoolId) || SCHOOL_OPTIONS[0],
    [selectedSchoolId]
  );

  const metrics = useMemo(
    () =>
      getInstitutionalMetrics(
        selectedSchoolId,
        selectedCampusId,
        selectedAcademicYearId
      ),
    [selectedSchoolId, selectedCampusId, selectedAcademicYearId]
  );

  const contextLabel = `${metrics.schoolName} · ${metrics.campusLabel} · ${metrics.academicYearLabel}`;

  const value: SchoolContextValue = {
    selectedSchoolId,
    selectedCampusId,
    selectedAcademicYearId,
    activeSchool,
    metrics,
    contextLabel,
    setSchool,
    setCampus: setSelectedCampusId,
    setAcademicYear: setSelectedAcademicYearId,
    setSchoolAndCampus,
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
