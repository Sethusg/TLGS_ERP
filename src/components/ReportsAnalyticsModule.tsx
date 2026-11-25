import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  GraduationCap,
  IndianRupee,
  CalendarCheck,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { InstitutionalMetrics } from '../data/schoolContext';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
} from './Common/EnterpriseUI';

interface ReportsAnalyticsModuleProps {
  subItem?: string;
  metrics: InstitutionalMetrics;
}

export const ReportsAnalyticsModule: React.FC<ReportsAnalyticsModuleProps> = ({
  subItem,
  metrics,
}) => {
  const { schools } = useSchoolContext();
  const [activeTab, setActiveTab] = useState<string>(subItem || 'rep-executive');
  const [downloadedMsg, setDownloadedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const schoolComparisonData = schools.map((sch) => ({
    name: sch.shortName,
    students: sch.campuses.reduce((a, c) => a + c.studentCount, 0),
    staff: sch.campuses.reduce((a, c) => a + c.staffCount, 0),
    feeLakhs: Number(sch.campuses.reduce((a, c) => a + c.feeCollectedLakhs, 0).toFixed(1)),
  }));

  const exportCsv = (reportName: string) => {
    const headers = ['School', 'Students', 'Staff', 'Fee Collected (Lakhs INR)'];
    const rows = schoolComparisonData.map((r) => [r.name, r.students, r.staff, r.feeLakhs]);
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadedMsg(`Exported "${reportName}.csv"`);
    setTimeout(() => setDownloadedMsg(null), 2400);
  };

  const feePct =
    metrics.feeTargetLakhs > 0
      ? Math.round((metrics.feeCollectedLakhs / metrics.feeTargetLakhs) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${metrics.schoolName} · ${metrics.campusLabel} · ${metrics.academicYearLabel}`}
        title="Reports and Analytics"
        subtitle="Cross-campus executive insights, enrollment comparisons, attendance telemetry, fee realization, and CSV exports."
        tabs={[
          { id: 'rep-executive', label: 'Executive Summary' },
          { id: 'rep-enrollment', label: 'Enrollment Analytics' },
          { id: 'rep-attendance', label: 'Attendance Insights' },
          { id: 'rep-finance', label: 'Financial Analytics' },
          { id: 'rep-export', label: 'Export Center' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>Print Brief</span>
            </button>
            <button
              type="button"
              onClick={() => exportCsv('Multi_School_Executive_Report')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Export CSV</span>
            </button>
          </>
        }
      />

      {downloadedMsg && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
          {downloadedMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Active Enrollment"
          value={metrics.students.toLocaleString()}
          detail={`${metrics.campusLabel}`}
          icon={GraduationCap}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Attendance Index"
          value={`${metrics.attendanceRate}%`}
          detail={`Staff average: ${metrics.staffAttendanceRate}%`}
          icon={CalendarCheck}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Fee Realization"
          value={`${feePct}%`}
          detail={`₹${metrics.feeCollectedLakhs} L of ₹${metrics.feeTargetLakhs} L`}
          icon={IndianRupee}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Group Schools Tracked"
          value={metrics.totalSchools}
          detail="Unified executive reporting"
          icon={BarChart3}
          tone="navy"
        />
      </div>

      {activeTab !== 'rep-export' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Fee Collection vs Target */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-[#0B1F3A]">
                Monthly Fee Collection vs Target (₹ Lakhs)
              </h2>
              <p className="text-[11px] text-slate-500">
                Sample preview series · {metrics.schoolName}
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.monthlyFeeTrend} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1F3A',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="collected" name="Collected (₹L)" fill="#0B1F3A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" name="Target (₹L)" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Weekly Attendance Trend */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-[#0B1F3A]">
                Weekly Attendance Consistency (%)
              </h2>
              <p className="text-[11px] text-slate-500">
                Students vs Faculty presence across active working days
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.weeklyAttendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[82, 100]} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0B1F3A',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="students" name="Students %" stroke="#0B1F3A" strokeWidth={2.5} dot={{ r: 3.5 }} />
                  <Line type="monotone" dataKey="staff" name="Staff %" stroke="#C9A227" strokeWidth={2.5} dot={{ r: 3.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Group Comparison Table */}
          <div className="lg:col-span-2">
            <EnterpriseDataTable
              title="Multi-School Institutional Benchmark"
              subtitle="Consolidated enrollment, staffing, and fee realization across all schools in the group."
              columns={[
                { key: 'name', header: 'School Institution', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.name}</span> },
                { key: 'students', header: 'Total Students', align: 'right', render: (r) => <span className="font-mono font-semibold">{r.students.toLocaleString()}</span> },
                { key: 'staff', header: 'Total Staff', align: 'right', render: (r) => <span className="font-mono">{r.staff}</span> },
                { key: 'ratio', header: 'Student : Staff', align: 'right', render: (r) => <span className="font-mono text-slate-600">{(r.students / r.staff).toFixed(1)} : 1</span> },
                { key: 'fee', header: 'Fee Collected', align: 'right', render: (r) => <span className="font-mono font-bold text-emerald-700">₹{r.feeLakhs} L</span> },
              ]}
              data={schoolComparisonData}
              rowKey={(r) => r.name}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Multi-School Executive Summary', desc: 'Enrollment, staffing, and fee realization across all group institutions.' },
            { title: 'Daily Attendance Compliance Register', desc: 'Student and faculty attendance percentages with defaulter flags.' },
            { title: 'Fee Collection & Defaulter Ledger', desc: 'Term-wise fee collection summary and pending receivables.' },
            { title: 'Academic Examination & Markchart Digest', desc: 'Subject averages, top percentiles, and pass percentages.' },
          ].map((rep) => (
            <div
              key={rep.title}
              className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0B1F3A]/6 border border-[#0B1F3A]/10 flex items-center justify-center text-[#0B1F3A] shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F3A]">{rep.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{rep.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => exportCsv(rep.title)}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Download CSV
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
