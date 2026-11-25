import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  IndianRupee,
  UserPlus,
  Award,
  FileText,
  ArrowUpRight,
  Plus,
} from 'lucide-react';
import { Staff, NavSection } from '../types';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  EnterpriseFormModal,
  TableColumn,
} from './Common/EnterpriseUI';

interface HumanResourcesModuleProps {
  subItem?: string;
  staffList: Staff[];
  contextLabel: string;
  onNavigate: (section: NavSection, subItem?: string) => void;
}

interface JobOpening {
  id: string;
  roleTitle: string;
  department: string;
  campus: string;
  applicants: number;
  stage: 'Screening' | 'Demo Class' | 'Offer Extended';
}

const INITIAL_OPENINGS: JobOpening[] = [
  { id: 'job-1', roleTitle: 'PGT Physics Faculty', department: 'Sciences', campus: 'Main Campus (Chennai HQ)', applicants: 14, stage: 'Demo Class' },
  { id: 'job-2', roleTitle: 'IB Mathematics Coordinator', department: 'Mathematics', campus: 'ECR Heritage Campus', applicants: 9, stage: 'Screening' },
  { id: 'job-3', roleTitle: 'Student Wellness Counselor', department: 'Student Affairs', campus: 'North Wing (Adambakkam)', applicants: 11, stage: 'Offer Extended' },
  { id: 'job-4', roleTitle: 'Robotics Lab Instructor', department: 'Computer Science', campus: 'Velachery Global Campus', applicants: 18, stage: 'Screening' },
];

export const HumanResourcesModule: React.FC<HumanResourcesModuleProps> = ({
  subItem,
  staffList,
  contextLabel,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'hr-payroll');
  const [openings, setOpenings] = useState<JobOpening[]>(INITIAL_OPENINGS);
  const [isOpeningModalOpen, setIsOpeningModalOpen] = useState(false);
  const [newRoleTitle, setNewRoleTitle] = useState('');
  const [newDept, setNewDept] = useState('Sciences');
  const [newCampus, setNewCampus] = useState('Main Campus (Chennai HQ)');

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const handleAddOpening = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;
    setOpenings((prev) => [
      {
        id: `job-${Date.now()}`,
        roleTitle: newRoleTitle.trim(),
        department: newDept,
        campus: newCampus,
        applicants: 0,
        stage: 'Screening',
      },
      ...prev,
    ]);
    setNewRoleTitle('');
    setIsOpeningModalOpen(false);
  };

  const payrollRows = staffList.map((st, idx) => {
    const basic = 46000 + (idx % 5) * 8500;
    const allowances = Math.round(basic * 0.25);
    const deductions = Math.round(basic * 0.12);
    return {
      id: st.id,
      empId: st.empId,
      name: st.name,
      department: st.department,
      designation: st.designation,
      netPay: basic + allowances - deductions,
      status: st.status === 'Active' ? 'Ready for Credit' : 'On Hold',
    };
  });

  const payrollColumns: TableColumn<(typeof payrollRows)[number]>[] = [
    { key: 'empId', header: 'Emp ID', render: (r) => <span className="font-mono text-slate-600">{r.empId}</span> },
    {
      key: 'name',
      header: 'Employee',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.name}</p>
          <p className="text-[11px] text-slate-500">
            {r.designation} · {r.department}
          </p>
        </div>
      ),
    },
    {
      key: 'netPay',
      header: 'Net Monthly Pay',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.netPay,
      render: (r) => (
        <span className="font-mono font-bold text-[#0B1F3A]">
          ₹{r.netPay.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Disbursement Status',
      align: 'right',
      render: (r) => (
        <span className={r.status === 'Ready for Credit' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${contextLabel} · Sample Preview Data`}
        title="Human Resources"
        subtitle="Manage institutional payroll cycles, faculty recruitment pipelines, annual appraisals, and leave governance policies."
        tabs={[
          { id: 'hr-payroll', label: 'Payroll & Payslips' },
          { id: 'hr-recruitment', label: 'Recruitment & Onboarding' },
          { id: 'hr-appraisals', label: 'Contracts & Appraisals' },
          { id: 'hr-policies', label: 'Leave & HR Policies' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigate('STAFFS', 'staff-payroll')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <span>Full Payslip Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#9A7418]" />
            </button>
            <button
              type="button"
              onClick={() => setIsOpeningModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Post Requisition</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Monthly Payroll Pool"
          value="₹42.8 L"
          detail="October 2026 ledger prepared"
          icon={IndianRupee}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Active Personnel"
          value={staffList.filter((s) => s.status === 'Active').length}
          detail={`${staffList.length} total directory records`}
          icon={Briefcase}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Open Requisitions"
          value={openings.length}
          detail={`${openings.reduce((a, b) => a + b.applicants, 0)} active candidates`}
          icon={UserPlus}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Appraisals Due"
          value={14}
          detail="Annual Q4 review window"
          icon={Award}
          tone="amber"
        />
      </div>

      {activeTab === 'hr-payroll' && (
        <EnterpriseDataTable
          title="Payroll Disbursement Preview (October 2026)"
          subtitle="Computed with PF, TDS, and approved leave deductions."
          columns={payrollColumns}
          data={payrollRows}
          rowKey={(r) => r.id}
          searchPlaceholder="Search employee or department..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q) ||
            r.empId.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'hr-recruitment' && (
        <EnterpriseDataTable
          title="Faculty & Staff Recruitment Pipeline"
          subtitle="Active hiring requisitions across group campuses."
          columns={[
            { key: 'title', header: 'Role Title', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.roleTitle}</span> },
            { key: 'dept', header: 'Department', render: (r) => <span className="text-slate-600">{r.department}</span> },
            { key: 'campus', header: 'Target Campus', render: (r) => <span className="text-slate-600">{r.campus}</span> },
            { key: 'apps', header: 'Applicants', align: 'right', render: (r) => <span className="font-mono font-semibold">{r.applicants}</span> },
            {
              key: 'stage',
              header: 'Stage',
              align: 'right',
              render: (r) => (
                <span className={r.stage === 'Offer Extended' ? 'text-emerald-700 font-semibold' : 'text-[#9A7418] font-semibold'}>
                  {r.stage}
                </span>
              ),
            },
          ]}
          data={openings}
          rowKey={(r) => r.id}
          searchPlaceholder="Search open roles..."
          searchFilter={(r, q) =>
            r.roleTitle.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'hr-appraisals' && (
        <EnterpriseDataTable
          title="Faculty Contracts & Annual Appraisals"
          subtitle="Contract tenure and annual performance evaluation tracking."
          columns={[
            { key: 'emp', header: 'Employee', render: (s) => <span className="font-semibold text-[#0B1F3A]">{s.name}</span> },
            { key: 'type', header: 'Employment Type', render: (s) => <span className="text-slate-600">{s.employmentType}</span> },
            { key: 'joined', header: 'Joining Date', render: (s) => <span className="font-mono text-slate-600">{s.joiningDate}</span> },
            { key: 'exp', header: 'Experience', align: 'right', render: (s) => <span className="font-mono">{s.experienceYears || 5} yrs</span> },
            { key: 'review', header: 'Cycle Status', align: 'right', render: () => <span className="text-emerald-700 font-semibold">Scheduled · Q4</span> },
          ]}
          data={staffList}
          rowKey={(s) => s.id}
        />
      )}

      {activeTab === 'hr-policies' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Casual & Earned Leave Entitlement', code: 'HR-POL-01', detail: '12 Casual Leaves and 15 Earned Leaves per academic session with pro-rata accrual.' },
            { title: 'Biometric Grace & Late Policy', code: 'HR-POL-02', detail: '10-minute morning grace window; three late punches trigger half-day leave reconciliation.' },
            { title: 'Faculty Probation & Confirmation', code: 'HR-POL-03', detail: '6-month instructional evaluation period followed by Principal and HOD sign-off.' },
            { title: 'Statutory PF, ESI & Gratuity Compliance', code: 'HR-POL-04', detail: '12% employer/employee EPF contribution synced monthly with Finance ledger.' },
          ].map((pol) => (
            <div key={pol.code} className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-semibold text-[#9A7418]">{pol.code}</span>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-[#0B1F3A]">{pol.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{pol.detail}</p>
            </div>
          ))}
        </div>
      )}

      <EnterpriseFormModal
        isOpen={isOpeningModalOpen}
        onClose={() => setIsOpeningModalOpen(false)}
        title="Create Hiring Requisition"
        subtitle="Add an open faculty or staff position to the HR recruitment pipeline"
      >
        <form onSubmit={handleAddOpening} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">
              Position Title *
            </label>
            <input
              type="text"
              required
              value={newRoleTitle}
              onChange={(e) => setNewRoleTitle(e.target.value)}
              placeholder="e.g. TGT English Faculty"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Department</label>
              <input
                type="text"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Campus</label>
              <input
                type="text"
                value={newCampus}
                onChange={(e) => setNewCampus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpeningModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Publish Requisition
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
