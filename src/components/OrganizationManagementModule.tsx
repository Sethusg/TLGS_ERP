import React, { useState, useEffect } from 'react';
import {
  Building2,
  School,
  MapPin,
  Calendar,
  Layers,
  Plus,
  CheckCircle2,
  ArrowUpRight,
  Award,
  FileText,
  Sliders,
  Lock,
} from 'lucide-react';
import { SchoolOption } from '../data/schoolContext';
import { EducationBoard } from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  EnterpriseFormModal,
  TableColumn,
} from './Common/EnterpriseUI';

interface OrganizationManagementModuleProps {
  subItem?: string;
  selectedSchoolId: string;
  selectedCampusId: string;
  academicYearLabel: string;
  onSelectSchoolContext: (schoolId: string, campusId?: string) => void;
}

interface DepartmentItem {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  wing: string;
  headOfDept: string;
  facultyCount: number;
  status: 'Active' | 'Restructuring';
}

interface SchoolDocumentItem {
  id: string;
  schoolId: string;
  schoolName: string;
  docType: string;
  title: string;
  refNo: string;
  validUntil: string;
  status: 'Verified' | 'Renewal Due';
}

const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dep-1', schoolId: 'sch-leaders-cbse', code: 'SCI-01', name: 'Sciences & Laboratories', wing: 'Senior Secondary', headOfDept: 'Dr. Rajesh Sharma', facultyCount: 24, status: 'Active' },
  { id: 'dep-2', schoolId: 'sch-leaders-cbse', code: 'MAT-02', name: 'Mathematics & Olympiad Wing', wing: 'Middle & Senior', headOfDept: 'Prof. Malini Swaminathan', facultyCount: 18, status: 'Active' },
  { id: 'dep-3', schoolId: 'sch-leaders-cbse', code: 'HUM-03', name: 'Humanities & Languages', wing: 'All Wings', headOfDept: 'Ms. Kavitha Menon', facultyCount: 22, status: 'Active' },
  { id: 'dep-4', schoolId: 'sch-leaders-icse', code: 'ICSE-STEM', name: 'ICSE STEM & Robotics', wing: 'Secondary Wing', headOfDept: 'Mr. Aravind Krishnan', facultyCount: 16, status: 'Active' },
  { id: 'dep-5', schoolId: 'sch-leaders-ib', code: 'IB-DP', name: 'IB Diploma & Theory of Knowledge', wing: 'International Wing', headOfDept: 'Prof. Jonathan Mathews', facultyCount: 14, status: 'Active' },
  { id: 'dep-6', schoolId: 'sch-leaders-igcse', code: 'CAIE-01', name: 'Cambridge Assessment Faculty', wing: 'IGCSE Lower & Upper', headOfDept: 'Dr. Shalini Rao', facultyCount: 19, status: 'Active' },
];

const INITIAL_DOCUMENTS: SchoolDocumentItem[] = [
  { id: 'doc-1', schoolId: 'sch-leaders-cbse', schoolName: 'The Leaders Academy (CBSE)', docType: 'Affiliation Certificate', title: 'CBSE Senior Secondary Affiliation Renewal', refNo: 'CBSE/AFF/1930812/2026', validUntil: '2030-03-31', status: 'Verified' },
  { id: 'doc-2', schoolId: 'sch-leaders-cbse', schoolName: 'The Leaders Academy (CBSE)', docType: 'Safety Compliance', title: 'Fire & Building Stability NOC (Chennai HQ)', refNo: 'TN-FIRE-2026-882', validUntil: '2027-03-31', status: 'Verified' },
  { id: 'doc-3', schoolId: 'sch-leaders-icse', schoolName: 'The Leaders International (ICSE)', docType: 'Board Accreditation', title: 'CISCE Permanent Affiliation Charter', refNo: 'CISCE/TN-0482/PER', validUntil: '2031-03-31', status: 'Verified' },
  { id: 'doc-4', schoolId: 'sch-leaders-ib', schoolName: 'The Leaders Global Academy (IB)', docType: 'IB World School Charter', title: 'IBO PYP/MYP/DP Authorization', refNo: 'IBO-061942-2025', validUntil: '2028-06-30', status: 'Verified' },
  { id: 'doc-5', schoolId: 'sch-leaders-igcse', schoolName: 'The Leaders Cambridge School (IGCSE)', docType: 'Cambridge Centre License', title: 'CAIE Registered Examination Centre', refNo: 'CAIE-IN842-2026', validUntil: '2027-05-15', status: 'Renewal Due' },
];

export const OrganizationManagementModule: React.FC<OrganizationManagementModuleProps> = ({
  subItem,
  selectedSchoolId,
  academicYearLabel,
  onSelectSchoolContext,
}) => {
  const {
    schools,
    academicYears,
    educationBoards,
    lockedSchoolId,
    addSchool,
    addCampusToSchool,
    addAcademicYear,
    addEducationBoard,
  } = useSchoolContext();

  const normalizeTab = (raw?: string) => {
    if (!raw || raw === 'org-trusts') return 'org-profile';
    return raw;
  };

  const [activeTab, setActiveTab] = useState<string>(normalizeTab(subItem));
  const [departments, setDepartments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [documents, setDocuments] = useState<SchoolDocumentItem[]>(INITIAL_DOCUMENTS);
  const [modalMode, setModalMode] = useState<
    null | 'school' | 'campus' | 'board' | 'year' | 'department' | 'document'
  >(null);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Generic modal fields
  const [fName, setFName] = useState('');
  const [fCode, setFCode] = useState('');
  const [fExtra1, setFExtra1] = useState('');
  const [fExtra2, setFExtra2] = useState('');
  const [fTargetSchoolId, setFTargetSchoolId] = useState(
    selectedSchoolId === 'all' ? schools[0]?.id || 'sch-leaders-cbse' : selectedSchoolId
  );

  // School configuration preview state
  const [cfgCurrency, setCfgCurrency] = useState('INR (₹)');
  const [cfgTimezone, setCfgTimezone] = useState('Asia/Kolkata (IST)');
  const [cfgAdmissionPrefix, setCfgAdmissionPrefix] = useState('TLA-2026-');
  const [cfgPreventDuplicateAdm, setCfgPreventDuplicateAdm] = useState(true);
  const [cfgStrictCampusIsolation, setCfgStrictCampusIsolation] = useState(true);

  useEffect(() => {
    if (subItem) setActiveTab(normalizeTab(subItem));
  }, [subItem]);

  // Tenant-filtered lists when a specific school is selected
  const visibleSchools =
    selectedSchoolId === 'all'
      ? schools
      : schools.filter((s) => s.id === selectedSchoolId);

  const totalCampuses = visibleSchools.reduce((acc, s) => acc + s.campuses.length, 0);
  const totalStudents = visibleSchools.reduce(
    (acc, s) => acc + s.campuses.reduce((cAcc, c) => cAcc + c.studentCount, 0),
    0
  );

  const flatCampuses = visibleSchools.flatMap((s) =>
    s.campuses.map((c) => ({
      ...c,
      schoolId: s.id,
      schoolName: s.name,
      board: s.board,
    }))
  );

  const visibleDepartments =
    selectedSchoolId === 'all'
      ? departments
      : departments.filter((d) => d.schoolId === selectedSchoolId);

  const visibleDocuments =
    selectedSchoolId === 'all'
      ? documents
      : documents.filter((d) => d.schoolId === selectedSchoolId);

  const openModalForTab = () => {
    setFName('');
    setFCode('');
    setFExtra1('');
    setFExtra2('');
    setFTargetSchoolId(
      selectedSchoolId === 'all' ? schools[0]?.id || 'sch-leaders-cbse' : selectedSchoolId
    );
    if (activeTab === 'org-schools') setModalMode('school');
    else if (activeTab === 'org-boards') setModalMode('board');
    else if (activeTab === 'org-academic-years') setModalMode('year');
    else if (activeTab === 'org-departments') setModalMode('department');
    else if (activeTab === 'org-documents') setModalMode('document');
    else setModalMode('campus');
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;

    if (modalMode === 'school') {
      const boardVal = (fExtra1 || 'CBSE') as SchoolOption['board'];
      addSchool({
        id: `sch-${Date.now()}`,
        organizationName: 'The Leaders Group of Schools Trust',
        name: fName.trim(),
        shortName: fCode.trim() || fName.trim().slice(0, 22),
        board: boardVal,
        affiliationNo: fExtra2.trim() || `AFF-${Date.now().toString().slice(-5)}`,
        campuses: [
          {
            id: `cmp-${Date.now()}`,
            name: `${fName.trim().split(' ')[0]} Main Campus`,
            code: `CMP-${Date.now().toString().slice(-3)}`,
            city: 'Chennai',
            studentCount: 320,
            staffCount: 36,
            attendanceRate: 95.1,
            staffAttendanceRate: 97.4,
            feeCollectedLakhs: 54.0,
            feeTargetLakhs: 60.0,
            pendingAdmissions: 6,
            appUsers: 350,
          },
        ],
      });
    } else if (modalMode === 'campus') {
      addCampusToSchool(fTargetSchoolId, {
        id: `cmp-${Date.now()}`,
        name: fName.trim(),
        code: fCode.trim().toUpperCase() || `CMP-${Date.now().toString().slice(-3)}`,
        city: fExtra1.trim() || 'Chennai',
        studentCount: 240,
        staffCount: 28,
        attendanceRate: 95.0,
        staffAttendanceRate: 97.0,
        feeCollectedLakhs: 42.0,
        feeTargetLakhs: 48.0,
        pendingAdmissions: 5,
        appUsers: 265,
      });
    } else if (modalMode === 'board') {
      addEducationBoard({
        id: `brd-${Date.now()}`,
        code: fCode.trim().toUpperCase() || fName.trim().slice(0, 6).toUpperCase(),
        name: fName.trim(),
        affiliationBody: fExtra1.trim() || 'National Accreditation Authority',
        gradingScale: fExtra2.trim() || 'Percentage & Grade Points',
        medium: 'English',
        status: 'Active',
      });
    } else if (modalMode === 'year') {
      const code = fName.trim();
      const [startYr = '2027', endYr = '2028'] = code.split('-');
      addAcademicYear({
        id: code,
        label: `AY ${startYr}–${endYr}`,
        startDate: `${startYr}-04-01`,
        endDate: `${endYr}-03-31`,
        status: 'Upcoming',
        multiplier: 1.05,
      });
    } else if (modalMode === 'department') {
      setDepartments((prev) => [
        {
          id: `dep-${Date.now()}`,
          schoolId: fTargetSchoolId,
          code: fCode.trim().toUpperCase() || `DEP-${prev.length + 1}`,
          name: fName.trim(),
          wing: fExtra1.trim() || 'All Wings',
          headOfDept: fExtra2.trim() || 'Pending Appointment',
          facultyCount: 8,
          status: 'Active',
        },
        ...prev,
      ]);
    } else if (modalMode === 'document') {
      const targetSchool = schools.find((s) => s.id === fTargetSchoolId) || schools[0];
      setDocuments((prev) => [
        {
          id: `doc-${Date.now()}`,
          schoolId: targetSchool.id,
          schoolName: targetSchool.name,
          docType: fExtra1.trim() || 'Compliance Certificate',
          title: fName.trim(),
          refNo: fCode.trim().toUpperCase() || `DOC-${Date.now().toString().slice(-5)}`,
          validUntil: fExtra2.trim() || '2029-03-31',
          status: 'Verified',
        },
        ...prev,
      ]);
    }

    setModalMode(null);
  };

  const schoolColumns: TableColumn<SchoolOption>[] = [
    {
      key: 'name',
      header: 'School Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.name}</p>
          <p className="text-[11px] text-slate-500">
            {r.organizationName} · Aff. #{r.affiliationNo}
          </p>
        </div>
      ),
    },
    {
      key: 'board',
      header: 'Education Board',
      sortable: true,
      sortValue: (r) => r.board,
      render: (r) => (
        <span className="px-2 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] font-semibold text-[11px]">
          {r.board}
        </span>
      ),
    },
    {
      key: 'campuses',
      header: 'Campuses',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.campuses.length,
      render: (r) => <span className="font-mono font-semibold">{r.campuses.length}</span>,
    },
    {
      key: 'students',
      header: 'Students',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.campuses.reduce((a, c) => a + c.studentCount, 0),
      render: (r) => (
        <span className="font-mono font-semibold text-[#0B1F3A]">
          {r.campuses.reduce((a, c) => a + c.studentCount, 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Tenant Isolation',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          disabled={Boolean(lockedSchoolId && lockedSchoolId !== r.id)}
          onClick={() => onSelectSchoolContext(r.id, 'all')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
            selectedSchoolId === r.id
              ? 'bg-[#0B1F3A] text-[#D4AF37]'
              : 'border border-slate-200 text-slate-700 hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
          }`}
        >
          {selectedSchoolId === r.id ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Isolated Active</span>
            </>
          ) : (
            <>
              <span>Isolate School</span>
              <ArrowUpRight className="w-3 h-3" />
            </>
          )}
        </button>
      ),
    },
  ];

  const campusColumns: TableColumn<(typeof flatCampuses)[number]>[] = [
    {
      key: 'name',
      header: 'Campus Branch',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.name}</p>
          <p className="text-[11px] text-slate-500">
            {r.code} · {r.city}
          </p>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'Parent School & Board',
      render: (r) => (
        <div>
          <p className="text-slate-800 font-medium">{r.schoolName}</p>
          <p className="text-[10.5px] text-slate-500">{r.board}</p>
        </div>
      ),
    },
    {
      key: 'students',
      header: 'Students',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.studentCount,
      render: (r) => <span className="font-mono font-semibold">{r.studentCount.toLocaleString()}</span>,
    },
    {
      key: 'staff',
      header: 'Staff',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.staffCount,
      render: (r) => <span className="font-mono">{r.staffCount}</span>,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      align: 'right',
      render: (r) => <span className="font-mono text-emerald-700 font-semibold">{r.attendanceRate}%</span>,
    },
    {
      key: 'select',
      header: 'Scope',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => onSelectSchoolContext(r.schoolId, r.id)}
          className="px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-[#D4AF37] transition-colors cursor-pointer"
        >
          Open Campus
        </button>
      ),
    },
  ];

  const boardColumns: TableColumn<EducationBoard>[] = [
    {
      key: 'code',
      header: 'Board Code',
      sortable: true,
      sortValue: (r) => r.code,
      render: (r) => (
        <span className="font-mono font-bold text-[#0B1F3A]">{r.code}</span>
      ),
    },
    {
      key: 'name',
      header: 'Education Board Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.name}</p>
          <p className="text-[11px] text-slate-500">{r.affiliationBody}</p>
        </div>
      ),
    },
    {
      key: 'scale',
      header: 'Grading System',
      render: (r) => <span className="text-slate-700">{r.gradingScale}</span>,
    },
    {
      key: 'schools',
      header: 'Linked Schools',
      align: 'right',
      render: (r) => {
        const count = schools.filter((s) =>
          s.board.toLowerCase().includes(r.code.toLowerCase())
        ).length;
        return <span className="font-mono font-semibold">{count}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (r) => <span className="text-emerald-700 font-semibold">{r.status}</span>,
    },
  ];

  const deptColumns: TableColumn<DepartmentItem>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (r) => <span className="font-mono font-semibold text-[#0B1F3A]">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Department / Wing',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.name}</p>
          <p className="text-[11px] text-slate-500">{r.wing}</p>
        </div>
      ),
    },
    {
      key: 'hod',
      header: 'Head of Department',
      render: (r) => <span className="text-slate-700">{r.headOfDept}</span>,
    },
    {
      key: 'faculty',
      header: 'Faculty',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.facultyCount,
      render: (r) => <span className="font-mono font-semibold">{r.facultyCount}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (r) => <span className="text-emerald-700 font-semibold">{r.status}</span>,
    },
  ];

  const docColumns: TableColumn<SchoolDocumentItem>[] = [
    {
      key: 'refNo',
      header: 'Reference No',
      render: (r) => <span className="font-mono font-semibold text-[#0B1F3A]">{r.refNo}</span>,
    },
    {
      key: 'title',
      header: 'Document & Type',
      sortable: true,
      sortValue: (r) => r.title,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.title}</p>
          <p className="text-[11px] text-slate-500">{r.docType}</p>
        </div>
      ),
    },
    {
      key: 'school',
      header: 'School',
      render: (r) => <span className="text-slate-700">{r.schoolName}</span>,
    },
    {
      key: 'valid',
      header: 'Valid Until',
      align: 'right',
      render: (r) => <span className="font-mono">{r.validUntil}</span>,
    },
    {
      key: 'status',
      header: 'Compliance',
      align: 'right',
      render: (r) => (
        <span
          className={`font-semibold ${
            r.status === 'Verified' ? 'text-emerald-700' : 'text-amber-700'
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  const primaryActionLabel =
    activeTab === 'org-schools'
      ? 'Add School'
      : activeTab === 'org-boards'
      ? 'Add Education Board'
      : activeTab === 'org-academic-years'
      ? 'Add Academic Year'
      : activeTab === 'org-departments'
      ? 'Add Department'
      : activeTab === 'org-documents'
      ? 'Upload Document'
      : 'Add Campus Branch';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`Organization Management · ${academicYearLabel} · Multi-Tenant Hierarchy`}
        title="Organization Management"
        subtitle="Centralized multi-school governance covering organizations, schools, campuses, education boards, documents, departments, and academic years."
        tabs={[
          { id: 'org-profile', label: 'Organization Profile' },
          { id: 'org-schools', label: 'School Management' },
          { id: 'org-campuses', label: 'Campus Management' },
          { id: 'org-config', label: 'School Configuration' },
          { id: 'org-boards', label: 'Academic Boards' },
          { id: 'org-documents', label: 'School Documents' },
          { id: 'org-academic-years', label: 'Academic Years' },
          { id: 'org-departments', label: 'Departments' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            {!lockedSchoolId && selectedSchoolId !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectSchoolContext('all', 'all')}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
              >
                View All Schools
              </button>
            )}
            <button
              type="button"
              onClick={openModalForTab}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{primaryActionLabel}</span>
            </button>
          </div>
        }
      />

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Organizations / Trusts"
          value={2}
          detail="Centralized Multi-School Governance"
          icon={Building2}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Affiliated Schools"
          value={visibleSchools.length}
          detail={`${educationBoards.length} Education Boards Configured`}
          icon={School}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Active Campuses"
          value={totalCampuses}
          detail={`${totalStudents.toLocaleString()} isolated enrolled students`}
          icon={MapPin}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Departments & Wings"
          value={visibleDepartments.length}
          detail={`${academicYears.length} Academic Years · ${visibleDocuments.length} Docs`}
          icon={Layers}
          tone="navy"
        />
      </div>

      {/* Organization Profile */}
      {activeTab === 'org-profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7418]">
                  Primary Educational Trust · Reg #TN-TRUST-2004-882
                </p>
                <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5">
                  The Leaders Group of Schools Trust
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Active</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Governs K-12 CBSE and ICSE institutions across Chennai metropolitan campuses with isolated school ledgers, centralized Super Admin controls, and standardized curriculum frameworks.
            </p>
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500 text-[11px]">Schools</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">2 Schools</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Campuses</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">5 Campuses</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Headquarters</p>
                <p className="font-bold text-[#0B1F3A] mt-0.5">Chennai, TN</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7418]">
                  International Foundation · Reg #IB-FND-2016-410
                </p>
                <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5">
                  Leaders Global Baccalaureate Foundation
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700">Active</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Operates IB World School and Cambridge IGCSE campuses across Chennai and Bengaluru with dedicated residential hostels, global assessment analytics, and multi-board compliance.
            </p>
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500 text-[11px]">Schools</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">2 Schools</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Campuses</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">4 Campuses</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Regions</p>
                <p className="font-bold text-[#0B1F3A] mt-0.5">Chennai · BLR</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'org-profile' || activeTab === 'org-schools') && (
        <EnterpriseDataTable
          title="Affiliated Schools Directory"
          subtitle="Each school maintains strict data isolation across students, staff, fees, exams, and operations."
          columns={schoolColumns}
          data={visibleSchools}
          rowKey={(r) => r.id}
          exportFileName="affiliated_schools"
          searchPlaceholder="Search schools, board, or affiliation..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.board.toLowerCase().includes(q) ||
            r.affiliationNo.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'org-campuses' && (
        <EnterpriseDataTable
          title="Multi-Campus Branch Registry"
          subtitle="Campus-level student strength, staff headcount, attendance rates, and instant campus switching."
          columns={campusColumns}
          data={flatCampuses}
          rowKey={(r) => r.id}
          exportFileName="campuses_registry"
          searchPlaceholder="Search campus, code, or city..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.schoolName.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'org-config' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[#9A7418]" />
              <div>
                <h3 className="text-sm font-bold text-[#0B1F3A]">
                  School-Level Tenant Configuration
                </h3>
                <p className="text-[11px] text-slate-500">
                  Isolation policies, numbering rules, and locale parameters scoped to the active school.
                </p>
              </div>
            </div>
            {configSavedNotice && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to preview state
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Base Currency</label>
              <select
                value={cfgCurrency}
                onChange={(e) => setCfgCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg"
              >
                <option>INR (₹)</option>
                <option>USD ($)</option>
                <option>GBP (£)</option>
                <option>AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Timezone</label>
              <select
                value={cfgTimezone}
                onChange={(e) => setCfgTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg"
              >
                <option>Asia/Kolkata (IST)</option>
                <option>Asia/Dubai (GST)</option>
                <option>Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                Admission Number Prefix
              </label>
              <input
                type="text"
                value={cfgAdmissionPrefix}
                onChange={(e) => setCfgAdmissionPrefix(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-[#0B1F3A]">
                  Enforce Unique Admission Numbers per School &amp; Academic Year
                </p>
                <p className="text-[11px] text-slate-500">
                  Mirrors MySQL constraint <code>uq_student_school_year_admission</code>.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cfgPreventDuplicateAdm}
                onChange={(e) => setCfgPreventDuplicateAdm(e.target.checked)}
                className="w-4 h-4 accent-[#0B1F3A]"
              />
            </label>

            <label className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#9A7418]" /> Strict Campus-Level Data Isolation
                </p>
                <p className="text-[11px] text-slate-500">
                  Campus roles can only read/write rows matching their assigned <code>campus_id</code>.
                </p>
              </div>
              <input
                type="checkbox"
                checked={cfgStrictCampusIsolation}
                onChange={(e) => setCfgStrictCampusIsolation(e.target.checked)}
                className="w-4 h-4 accent-[#0B1F3A]"
              />
            </label>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setConfigSavedNotice(true);
                setTimeout(() => setConfigSavedNotice(false), 3000);
              }}
              className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
            >
              Save School Configuration
            </button>
          </div>
        </div>
      )}

      {activeTab === 'org-boards' && (
        <EnterpriseDataTable
          title="Academic Education Boards Configuration"
          subtitle="Multi-board curriculum support across CBSE, ICSE, IB, Cambridge IGCSE, and State Boards."
          columns={boardColumns}
          data={educationBoards}
          rowKey={(r) => r.id}
          exportFileName="education_boards"
          searchPlaceholder="Search board name or code..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.affiliationBody.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'org-documents' && (
        <EnterpriseDataTable
          title="School Affiliations & Legal Documents"
          subtitle="Board charters, safety NOCs, and statutory compliance filings per school."
          columns={docColumns}
          data={visibleDocuments}
          rowKey={(r) => r.id}
          exportFileName="school_documents"
          searchPlaceholder="Search document title, ref no, or school..."
          searchFilter={(r, q) =>
            r.title.toLowerCase().includes(q) ||
            r.refNo.toLowerCase().includes(q) ||
            r.schoolName.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'org-academic-years' && (
        <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-100">
          {academicYears.map((yr) => (
            <div
              key={yr.id}
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0B1F3A]/6 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A] tabular-nums">{yr.label}</p>
                  <p className="text-[11px] text-slate-500">
                    Session Window: {yr.startDate} to {yr.endDate}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  yr.status === 'Active'
                    ? 'text-emerald-700'
                    : yr.status === 'Upcoming'
                    ? 'text-[#9A7418]'
                    : 'text-slate-500'
                }`}
              >
                {yr.status === 'Active'
                  ? 'Current Active Session'
                  : yr.status === 'Upcoming'
                  ? 'Scheduled Upcoming Session'
                  : 'Archived Ledger'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'org-departments' && (
        <EnterpriseDataTable
          title="Academic & Operational Departments"
          subtitle="School-isolated departments and wing heads."
          columns={deptColumns}
          data={visibleDepartments}
          rowKey={(r) => r.id}
          exportFileName="departments"
          searchPlaceholder="Search department or HOD..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.headOfDept.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q)
          }
        />
      )}

      <EnterpriseFormModal
        isOpen={modalMode !== null}
        onClose={() => setModalMode(null)}
        title={
          modalMode === 'school'
            ? 'Register New Affiliated School'
            : modalMode === 'board'
            ? 'Add Education Board'
            : modalMode === 'year'
            ? 'Create Academic Year'
            : modalMode === 'department'
            ? 'Add Institutional Department'
            : modalMode === 'document'
            ? 'Register Compliance Document'
            : 'Register New Campus Branch'
        }
        subtitle="Immediately updates the multi-school selector & local ERP preview state"
      >
        <form onSubmit={handleModalSubmit} className="space-y-4 text-xs">
          {(modalMode === 'campus' || modalMode === 'department' || modalMode === 'document') && (
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">Target School *</label>
              <select
                value={fTargetSchoolId}
                onChange={(e) => setFTargetSchoolId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#0B1F3A] mb-1">
              {modalMode === 'year'
                ? 'Academic Year Code (YYYY-YYYY) *'
                : modalMode === 'school'
                ? 'School Full Name *'
                : modalMode === 'board'
                ? 'Education Board Name *'
                : modalMode === 'document'
                ? 'Document Title *'
                : modalMode === 'department'
                ? 'Department Name *'
                : 'Campus Branch Name *'}
            </label>
            <input
              type="text"
              required
              value={fName}
              onChange={(e) => setFName(e.target.value)}
              placeholder={
                modalMode === 'year'
                  ? '2027-2028'
                  : modalMode === 'school'
                  ? 'e.g. The Leaders Matriculation School'
                  : modalMode === 'board'
                  ? 'e.g. Tamil Nadu State Board'
                  : modalMode === 'document'
                  ? 'e.g. Sanitary & Fire Safety Certificate'
                  : modalMode === 'department'
                  ? 'e.g. Performing Arts & Music'
                  : 'e.g. East Coast Annex Campus'
              }
              className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>

          {modalMode !== 'year' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  {modalMode === 'school'
                    ? 'Short Display Name'
                    : modalMode === 'document'
                    ? 'Reference No.'
                    : 'Code'}
                </label>
                <input
                  type="text"
                  value={fCode}
                  onChange={(e) => setFCode(e.target.value)}
                  placeholder={modalMode === 'school' ? 'Leaders State' : 'CODE-01'}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0B1F3A] mb-1">
                  {modalMode === 'school'
                    ? 'Education Board'
                    : modalMode === 'board'
                    ? 'Affiliation Body'
                    : modalMode === 'document'
                    ? 'Document Category'
                    : modalMode === 'department'
                    ? 'Academic Wing'
                    : 'City / Zone'}
                </label>
                {modalMode === 'school' ? (
                  <select
                    value={fExtra1 || 'CBSE'}
                    onChange={(e) => setFExtra1(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IB">IB</option>
                    <option value="Cambridge IGCSE">Cambridge IGCSE</option>
                    <option value="State Board">State Board</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fExtra1}
                    onChange={(e) => setFExtra1(e.target.value)}
                    placeholder={
                      modalMode === 'board'
                        ? 'Ministry / Council'
                        : modalMode === 'document'
                        ? 'Safety / Affiliation'
                        : 'Chennai'
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
                  />
                )}
              </div>
            </div>
          )}

          {(modalMode === 'school' ||
            modalMode === 'board' ||
            modalMode === 'department' ||
            modalMode === 'document') && (
            <div>
              <label className="block font-semibold text-[#0B1F3A] mb-1">
                {modalMode === 'school'
                  ? 'Affiliation Number'
                  : modalMode === 'board'
                  ? 'Grading Scale'
                  : modalMode === 'document'
                  ? 'Valid Until (YYYY-MM-DD)'
                  : 'Head of Department'}
              </label>
              <input
                type="text"
                value={fExtra2}
                onChange={(e) => setFExtra2(e.target.value)}
                placeholder={
                  modalMode === 'school'
                    ? 'e.g. 1930999'
                    : modalMode === 'board'
                    ? 'e.g. 9-Point Scale'
                    : modalMode === 'document'
                    ? '2029-03-31'
                    : 'e.g. Prof. S. Krishnan'
                }
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalMode(null)}
              className="px-3.5 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
