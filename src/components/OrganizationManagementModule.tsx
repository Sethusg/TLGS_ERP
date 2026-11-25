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
} from 'lucide-react';
import {
  SCHOOL_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  SchoolOption,
} from '../data/schoolContext';
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
  code: string;
  name: string;
  wing: string;
  headOfDept: string;
  facultyCount: number;
  status: 'Active' | 'Restructuring';
}

const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dep-1', code: 'SCI-01', name: 'Sciences & Laboratories', wing: 'Senior Secondary', headOfDept: 'Dr. Rajesh Sharma', facultyCount: 24, status: 'Active' },
  { id: 'dep-2', code: 'MAT-02', name: 'Mathematics & Olympiad Wing', wing: 'Middle & Senior', headOfDept: 'Prof. Malini Sundaram', facultyCount: 18, status: 'Active' },
  { id: 'dep-3', code: 'HUM-03', name: 'Humanities & Languages', wing: 'All Wings', headOfDept: 'Ms. Kavitha Menon', facultyCount: 22, status: 'Active' },
  { id: 'dep-4', code: 'CS-04', name: 'Computer Science & Robotics', wing: 'Senior Secondary', headOfDept: 'Mr. Aravind Krishnan', facultyCount: 12, status: 'Active' },
  { id: 'dep-5', code: 'PRI-05', name: 'Early Years & Primary Wing', wing: 'Primary', headOfDept: 'Mrs. Priya Natarajan', facultyCount: 30, status: 'Active' },
  { id: 'dep-6', code: 'SPT-06', name: 'Physical Education & Athletics', wing: 'Campus-Wide', headOfDept: 'Coach Suresh Kumar', facultyCount: 10, status: 'Active' },
];

export const OrganizationManagementModule: React.FC<OrganizationManagementModuleProps> = ({
  subItem,
  selectedSchoolId,
  academicYearLabel,
  onSelectSchoolContext,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'org-trusts');
  const [schools, setSchools] = useState<SchoolOption[]>(SCHOOL_OPTIONS);
  const [departments, setDepartments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Department / Campus form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDetail, setNewDetail] = useState('');

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const totalCampuses = schools.reduce((acc, s) => acc + s.campuses.length, 0);
  const totalStudents = schools.reduce(
    (acc, s) => acc + s.campuses.reduce((cAcc, c) => cAcc + c.studentCount, 0),
    0
  );
  const totalStaff = schools.reduce(
    (acc, s) => acc + s.campuses.reduce((cAcc, c) => cAcc + c.staffCount, 0),
    0
  );

  const flatCampuses = schools.flatMap((s) =>
    s.campuses.map((c) => ({
      ...c,
      schoolId: s.id,
      schoolName: s.name,
      board: s.board,
    }))
  );

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (activeTab === 'org-departments') {
      setDepartments((prev) => [
        {
          id: `dep-${Date.now()}`,
          code: newCode.trim().toUpperCase() || `DEP-${prev.length + 1}`,
          name: newName.trim(),
          wing: newDetail.trim() || 'All Wings',
          headOfDept: 'Assigned Pending Review',
          facultyCount: 6,
          status: 'Active',
        },
        ...prev,
      ]);
    } else {
      // Add new campus to currently selected school
      setSchools((prev) =>
        prev.map((sch) =>
          sch.id === selectedSchoolId
            ? {
                ...sch,
                campuses: [
                  ...sch.campuses,
                  {
                    id: `cmp-${Date.now()}`,
                    name: newName.trim(),
                    code: newCode.trim().toUpperCase() || 'NEW-01',
                    city: newDetail.trim() || 'Chennai',
                    studentCount: 240,
                    staffCount: 28,
                    attendanceRate: 95.0,
                    staffAttendanceRate: 97.0,
                    feeCollectedLakhs: 42.0,
                    feeTargetLakhs: 48.0,
                    pendingAdmissions: 5,
                    appUsers: 265,
                  },
                ],
              }
            : sch
        )
      );
    }

    setNewName('');
    setNewCode('');
    setNewDetail('');
    setIsAddModalOpen(false);
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
          <p className="text-[11px] text-slate-500">Aff. #{r.affiliationNo}</p>
        </div>
      ),
    },
    {
      key: 'board',
      header: 'Curriculum',
      render: (r) => (
        <span className="font-semibold text-[#0B1F3A]">{r.board}</span>
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
      header: 'Context',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => onSelectSchoolContext(r.id, 'all')}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
            selectedSchoolId === r.id
              ? 'bg-[#0B1F3A] text-[#D4AF37]'
              : 'border border-slate-200 text-slate-700 hover:border-[#0B1F3A] hover:text-[#0B1F3A]'
          }`}
        >
          {selectedSchoolId === r.id ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Active</span>
            </>
          ) : (
            <>
              <span>Switch</span>
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
      header: 'Campus',
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
      header: 'Parent School',
      render: (r) => <span className="text-slate-700">{r.schoolName}</span>,
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
      header: 'Switch',
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
      render: (r) => (
        <span className="text-emerald-700 font-semibold">{r.status}</span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`Organization Registry · ${academicYearLabel} · Sample Preview Data`}
        title="Organization Management"
        subtitle="Manage educational trusts, affiliated schools, multi-campus branches, academic sessions, and academic wings."
        tabs={[
          { id: 'org-trusts', label: 'Organizations & Trusts' },
          { id: 'org-schools', label: 'Schools & Affiliations' },
          { id: 'org-campuses', label: 'Campuses & Branches' },
          { id: 'org-academic-years', label: 'Academic Years' },
          { id: 'org-departments', label: 'Departments & Wings' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>
              {activeTab === 'org-departments' ? 'Add Department' : 'Add Campus Branch'}
            </span>
          </button>
        }
      />

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Organizations / Trusts"
          value={2}
          detail="The Leaders Educational Trust · Global Wing"
          icon={Building2}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Affiliated Schools"
          value={schools.length}
          detail="CBSE · ICSE · IB Curricula"
          icon={School}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Active Campuses"
          value={totalCampuses}
          detail={`${totalStudents.toLocaleString()} total enrolled students`}
          icon={MapPin}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Academic Departments"
          value={departments.length}
          detail={`${totalStaff} group faculty & staff`}
          icon={Layers}
          tone="navy"
        />
      </div>

      {/* Tab Content */}
      {activeTab === 'org-trusts' && (
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
              Governs K-12 CBSE and ICSE institutions across Chennai metropolitan campuses with unified academic governance, centralized fee finance, and shared transport fleets.
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
              Operates IB PYP, MYP, and Diploma Programme campuses along ECR and Anna Nagar with dedicated international curriculum accreditation and residential facilities.
            </p>
            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-slate-500 text-[11px]">Schools</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">1 School</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Campuses</p>
                <p className="font-bold text-[#0B1F3A] tabular-nums mt-0.5">2 Campuses</p>
              </div>
              <div>
                <p className="text-slate-500 text-[11px]">Headquarters</p>
                <p className="font-bold text-[#0B1F3A] mt-0.5">ECR, Chennai</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'org-trusts' || activeTab === 'org-schools') && (
        <EnterpriseDataTable
          title="Affiliated Schools Directory"
          subtitle="Click Switch to update the active institutional context across the ERP."
          columns={schoolColumns}
          data={schools}
          rowKey={(r) => r.id}
          searchPlaceholder="Search schools or affiliation..."
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
          subtitle="Live student strength, staff headcount, and daily attendance across all campuses."
          columns={campusColumns}
          data={flatCampuses}
          rowKey={(r) => r.id}
          searchPlaceholder="Search campus, code, or city..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.schoolName.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'org-academic-years' && (
        <div className="bg-white border border-slate-200/80 rounded-xl divide-y divide-slate-100">
          {ACADEMIC_YEAR_OPTIONS.map((yr) => (
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
                    Session Window: April {yr.id.split('-')[0]} – March {yr.id.split('-')[1]}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  yr.status === 'Active' ? 'text-emerald-700' : 'text-slate-500'
                }`}
              >
                {yr.status === 'Active' ? 'Current Active Session' : 'Archived Ledger'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'org-departments' && (
        <EnterpriseDataTable
          title="Academic & Operational Departments"
          subtitle="Institutional departments and wing heads across the selected school."
          columns={deptColumns}
          data={departments}
          rowKey={(r) => r.id}
          searchPlaceholder="Search department or HOD..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.headOfDept.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q)
          }
        />
      )}

      <EnterpriseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={activeTab === 'org-departments' ? 'Add Academic Department' : 'Register New Campus Branch'}
        subtitle="Preview entry added to local UI state (Django REST integration planned)"
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
              {activeTab === 'org-departments' ? 'Department Name *' : 'Campus Name *'}
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={
                activeTab === 'org-departments'
                  ? 'e.g. Performing Arts & Music'
                  : 'e.g. East Coast Annex Campus'
              }
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                Code
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder={activeTab === 'org-departments' ? 'ART-07' : 'CHN-04'}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
                {activeTab === 'org-departments' ? 'Academic Wing' : 'City / Zone'}
              </label>
              <input
                type="text"
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                placeholder={activeTab === 'org-departments' ? 'Middle School' : 'Chennai'}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Save Record
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
