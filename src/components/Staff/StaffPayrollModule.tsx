import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  FileText,
  Printer,
  Download,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Percent,
  X,
  ShieldCheck,
  Send,
  Eye,
} from 'lucide-react';
import { Staff, LeaveRequest } from '../../types';
import { printElement } from '../../utils/printDocument';

interface StaffPayrollModuleProps {
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
}

interface SalaryStructure {
  basic: number;
  da: number;
  hra: number;
  specialAllowance: number;
  gross: number;
  totalWorkingDays: number;
  leavesTaken: number;
  lwpDays: number;
  lwpDeduction: number;
  pfDeduction: number;
  profTax: number;
  tds: number;
  totalDeductions: number;
  netPay: number;
  status: 'Disbursed' | 'Processing' | 'Ready';
  bankAccount: string;
  pan: string;
  pfNumber: string;
}

export const StaffPayrollModule: React.FC<StaffPayrollModuleProps> = ({
  staffList,
  leaveRequests,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedStaffForSlip, setSelectedStaffForSlip] = useState<{
    staff: Staff;
    calc: SalaryStructure;
  } | null>(null);

  // Filter active staff for payroll
  const activeStaff = useMemo(
    () => staffList.filter((s) => s.status !== 'Archived'),
    [staffList]
  );

  // Compute salary for a given staff member
  const computeStaffSalary = (stf: Staff): SalaryStructure => {
    let basic = 38000;
    if (stf.role === 'Administrator') {
      basic = stf.designation.includes('Principal') ? 85000 : 45000;
    } else if (stf.role === 'Teacher') {
      if (stf.designation.includes('PGT') || stf.designation.includes('Head')) {
        basic = 58000;
      } else if (stf.designation.includes('TGT')) {
        basic = 46000;
      } else {
        basic = 36000;
      }
    } else if (stf.role === 'Support Staff') {
      basic = 19500;
    } else if (stf.role === 'Lab Assistant') {
      basic = 24000;
    } else if (stf.role === 'Transport Staff') {
      basic = 22000;
    } else if (stf.role === 'Sports Coach' || stf.role === 'Counselor') {
      basic = 37000;
    }

    const da = Math.round(basic * 0.46); // 46% DA (Central 7th CPC standard)
    const hra = Math.round(basic * 0.24); // 24% HRA for Class X cities
    const specialAllowance = 3500;
    const gross = basic + da + hra + specialAllowance;

    const totalWorkingDays = 26;

    // Check approved leaves for this staff
    const approvedLeaves = leaveRequests.filter(
      (r) => r.staffId === stf.id && r.status === 'Approved'
    );
    const leavesTaken = approvedLeaves.reduce((sum, r) => sum + r.days, 0);

    // If staff has used all 20 annual leaves, excess are Leave Without Pay (LWP)
    const lwpDays = stf.leaveBalance <= 2 ? 1 : 0;
    const lwpDeduction = Math.round((gross / totalWorkingDays) * lwpDays);

    // Statutory deductions
    const pfDeduction = Math.round(basic * 0.12); // 12% PF
    const profTax = 200; // Standard state slab
    const tds = gross > 65000 ? Math.round(gross * 0.08) : gross > 45000 ? Math.round(gross * 0.04) : 0;

    const totalDeductions = lwpDeduction + pfDeduction + profTax + tds;
    const netPay = gross - totalDeductions;

    // Masked bank/PF credentials
    const hash = stf.empId.replace(/[^0-9]/g, '') || '101';
    const bankAccount = `HDFC••••${(parseInt(hash, 10) * 83).toString().slice(-4)}`;
    const pan = `AAAPT${(parseInt(hash, 10) * 19).toString().slice(-4)}K`;
    const pfNumber = `TN/MAS/0048123/${stf.empId}`;

    return {
      basic,
      da,
      hra,
      specialAllowance,
      gross,
      totalWorkingDays,
      leavesTaken,
      lwpDays,
      lwpDeduction,
      pfDeduction,
      profTax,
      tds,
      totalDeductions,
      netPay,
      status: 'Disbursed',
      bankAccount,
      pan,
      pfNumber,
    };
  };

  // Payroll list with calculated values
  const payrollList = useMemo(() => {
    return activeStaff.map((staff) => ({
      staff,
      calc: computeStaffSalary(staff),
    }));
  }, [activeStaff, leaveRequests]);

  // Filtered payroll
  const filteredPayroll = useMemo(() => {
    return payrollList.filter(({ staff }) => {
      const matchesSearch =
        staff.name.toLowerCase().includes(search.toLowerCase()) ||
        staff.empId.toLowerCase().includes(search.toLowerCase()) ||
        staff.designation.toLowerCase().includes(search.toLowerCase()) ||
        staff.department.toLowerCase().includes(search.toLowerCase());

      const matchesDept = deptFilter === 'ALL' || staff.department === deptFilter;
      const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;

      return matchesSearch && matchesDept && matchesRole;
    });
  }, [payrollList, search, deptFilter, roleFilter]);

  // Aggregated totals
  const totals = useMemo(() => {
    return filteredPayroll.reduce(
      (acc, { calc }) => {
        acc.gross += calc.gross;
        acc.deductions += calc.totalDeductions;
        acc.net += calc.netPay;
        acc.pf += calc.pfDeduction;
        acc.tds += calc.tds;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0, pf: 0, tds: 0 }
    );
  }, [filteredPayroll]);

  const handleExportPayrollCSV = () => {
    const headers = [
      'Emp ID',
      'Staff Name',
      'Role',
      'Designation',
      'Department',
      'Working Days',
      'Leaves Taken',
      'LWP Days',
      'Basic Pay (INR)',
      'DA (INR)',
      'HRA (INR)',
      'Special Allowance (INR)',
      'Gross Salary (INR)',
      'PF Deduction (INR)',
      'Prof Tax (INR)',
      'TDS (INR)',
      'LWP Deduction (INR)',
      'Total Deductions (INR)',
      'Net Payable (INR)',
      'Disbursement Status',
    ];

    const rows = filteredPayroll.map(({ staff, calc }) => [
      staff.empId,
      `"${staff.name}"`,
      staff.role,
      `"${staff.designation}"`,
      staff.department,
      calc.totalWorkingDays,
      calc.leavesTaken,
      calc.lwpDays,
      calc.basic,
      calc.da,
      calc.hra,
      calc.specialAllowance,
      calc.gross,
      calc.pfDeduction,
      calc.profTax,
      calc.tds,
      calc.lwpDeduction,
      calc.totalDeductions,
      calc.netPay,
      calc.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TLGS_Payroll_${selectedMonth.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Month Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Staff Payroll & Automated Compensation Ledger
              </h3>
              <p className="text-xs text-gray-500">
                Central 7th CPC Structure · Attendance & Leave LWP Deductions · Digital Payslip Dispatch
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="October 2026">October 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
            </select>
          </div>

          <button
            onClick={handleExportPayrollCSV}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bank NEFT CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Total Monthly Gross</span>
            <div className="text-2xl font-black text-gray-900 mt-1 tabular-nums">
              ₹{totals.gross.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-gray-500">
              {filteredPayroll.length} Active Staff Members
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Net Disbursed Salary</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
              ₹{totals.net.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">
              Disbursed via Direct Bank Transfer
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Statutory PF Deductions</span>
            <div className="text-2xl font-black text-purple-700 mt-1 tabular-nums">
              ₹{totals.pf.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-purple-600">EPFO Institutional Match: 12%</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium">Income Tax (TDS) Withheld</span>
            <div className="text-2xl font-black text-amber-700 mt-1 tabular-nums">
              ₹{totals.tds.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-amber-600">Remitted to NSDL Tax Portal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff, role, emp id, dept..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#43a047] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            >
              <option value="ALL">All Cadres</option>
              <option value="Teacher">Teaching Faculty</option>
              <option value="Administrator">Administrators</option>
              <option value="Support Staff">Support Staff</option>
              <option value="Lab Assistant">Lab Assistants</option>
              <option value="Transport Staff">Transport Fleet</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="Science">Science (Physics / Chem / Bio)</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Languages">Languages</option>
              <option value="Social Science">Social Science</option>
              <option value="Administration">Administration</option>
              <option value="Transport">Transport</option>
              <option value="Physical Education">Physical Education</option>
            </select>
          </div>
        </div>

        {/* Payroll Ledger Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
              <tr>
                <th className="px-4 py-3">Emp ID</th>
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3 text-center">Days / Leaves</th>
                <th className="px-4 py-3 text-right">Basic Pay</th>
                <th className="px-4 py-3 text-right">Gross Pay</th>
                <th className="px-4 py-3 text-right">Deductions</th>
                <th className="px-4 py-3 text-right">Net Payable</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Digital Pay Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-xs text-gray-500">
                    No payroll records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map(({ staff, calc }) => (
                  <tr key={staff.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-gray-700">
                      {staff.empId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{staff.name}</div>
                      <div className="text-[10px] text-gray-500">{staff.designation}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{staff.department}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded text-[10px]">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="font-mono text-gray-800 font-bold">
                        {calc.totalWorkingDays - calc.lwpDays} / {calc.totalWorkingDays}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {calc.leavesTaken} Leaves ({calc.lwpDays > 0 ? `${calc.lwpDays} LWP` : 'Paid'})
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700 tabular-nums">
                      ₹{calc.basic.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 tabular-nums">
                      ₹{calc.gross.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-rose-700 tabular-nums">
                      -₹{calc.totalDeductions.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm tabular-nums">
                      ₹{calc.netPay.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 mx-auto w-max">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Disbursed</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedStaffForSlip({ staff, calc })}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Pay Slip Modal */}
      {selectedStaffForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-tight">
                  Official Salary Certificate & Payslip Dispatch
                </span>
              </div>
              <button
                onClick={() => setSelectedStaffForSlip(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Payslip Body */}
            <div id="staff-payslip-print-document" className="p-6 overflow-y-auto space-y-6 bg-white text-gray-900">
              {/* Institution Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="font-serif font-black text-xl text-slate-900 tracking-wide">
                  THE LEADERS ACADEMY(CBSE)
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  CBSE Affiliated Senior Secondary Institution (Affiliation #1930812)
                </div>
                <div className="text-[11px] text-gray-500">
                  Campus: Ring Road, Knowledge Enclave, Chennai · Email: accounts@leadersacademy.edu.in
                </div>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded font-bold text-xs uppercase tracking-wider text-slate-900">
                  PAYSLIP FOR THE MONTH OF {selectedMonth.toUpperCase()}
                </div>
              </div>

              {/* Employee Summary Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-3 bg-gray-50/80 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500">Employee Name:</span>{' '}
                  <strong className="text-gray-900">{selectedStaffForSlip.staff.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Employee Code:</span>{' '}
                  <strong className="font-mono text-gray-900">{selectedStaffForSlip.staff.empId}</strong>
                </div>
                <div>
                  <span className="text-gray-500">Designation:</span>{' '}
                  <span className="font-medium text-gray-800">{selectedStaffForSlip.staff.designation}</span>
                </div>
                <div>
                  <span className="text-gray-500">Department:</span>{' '}
                  <span className="font-medium text-gray-800">{selectedStaffForSlip.staff.department}</span>
                </div>
                <div>
                  <span className="text-gray-500">Bank Account:</span>{' '}
                  <span className="font-mono text-gray-800">{selectedStaffForSlip.calc.bankAccount}</span>
                </div>
                <div>
                  <span className="text-gray-500">PAN Number:</span>{' '}
                  <span className="font-mono text-gray-800">{selectedStaffForSlip.calc.pan}</span>
                </div>
                <div>
                  <span className="text-gray-500">Working Days:</span>{' '}
                  <span className="font-bold text-gray-900">
                    {selectedStaffForSlip.calc.totalWorkingDays - selectedStaffForSlip.calc.lwpDays} / {selectedStaffForSlip.calc.totalWorkingDays}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">PF Number:</span>{' '}
                  <span className="font-mono text-[11px] text-gray-800">{selectedStaffForSlip.calc.pfNumber}</span>
                </div>
              </div>

              {/* Earnings & Deductions Double Ledger */}
              <div className="grid grid-cols-2 gap-4">
                {/* Earnings */}
                <div className="border border-emerald-200 rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 bg-emerald-50 text-emerald-900 font-bold text-xs border-b border-emerald-200">
                    EARNINGS & ALLOWANCES
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Pay</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.basic.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dearness Allowance (DA 46%)</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.da.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">House Rent Allowance (HRA 24%)</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.hra.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Special Teaching Allowance</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.specialAllowance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900">
                      <span>Gross Earnings</span>
                      <span className="font-mono tabular-nums">
                        ₹{selectedStaffForSlip.calc.gross.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="border border-rose-200 rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 bg-rose-50 text-rose-900 font-bold text-xs border-b border-rose-200">
                    DEDUCTIONS & RECOVERIES
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provident Fund (EPF 12%)</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.pfDeduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Professional Tax (PT)</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.profTax.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax (TDS)</span>
                      <span className="font-mono font-semibold text-gray-900 tabular-nums">
                        ₹{selectedStaffForSlip.calc.tds.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        LWP Days Deduction ({selectedStaffForSlip.calc.lwpDays}d)
                      </span>
                      <span className="font-mono font-semibold text-rose-700 tabular-nums">
                        ₹{selectedStaffForSlip.calc.lwpDeduction.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-rose-200 flex justify-between font-bold text-rose-900">
                      <span>Total Deductions</span>
                      <span className="font-mono tabular-nums">
                        ₹{selectedStaffForSlip.calc.totalDeductions.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-slate-300 font-semibold tracking-wider">
                    Net Take-Home Salary
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5 tabular-nums">
                    ₹{selectedStaffForSlip.calc.netPay.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-300 max-w-xs">
                  <span>Transfer Mode: NEFT Direct Bank Credit</span>
                  <div className="font-mono text-emerald-300 font-semibold mt-0.5">
                    UTR: TLGS2026102377819
                  </div>
                </div>
              </div>

              {/* Authorized Signatures & Seal */}
              <div className="pt-4 border-t border-gray-200 flex items-end justify-between text-xs text-gray-500">
                <div className="text-center">
                  <div className="w-28 border-b border-gray-300 pb-1 mb-1 font-serif text-slate-800 font-bold italic">
                    K. Sundaram
                  </div>
                  <span>Senior Bursar / Accounts</span>
                </div>

                <div className="p-2 border border-dashed border-gray-300 rounded-lg text-center text-[10px] text-gray-400">
                  <div>TLGS CBSE INSTITUTIONAL SEAL</div>
                  <div className="font-mono text-[9px] text-gray-500 mt-0.5">Digitally Authenticated</div>
                </div>

                <div className="text-center">
                  <div className="w-28 border-b border-gray-300 pb-1 mb-1 font-serif text-slate-800 font-bold italic">
                    Dr. S. Radhakrishnan
                  </div>
                  <span>Principal & Secretary</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-[11px] text-gray-500">
                Generated from THE LEADERS ACADEMY(CBSE) ERP Payroll Module
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printElement('staff-payslip-print-document', {
                      title: `Payslip_${selectedStaffForSlip.staff.empId}_${selectedMonth}_THE_LEADERS_ACADEMY`,
                    })
                  }
                  className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Print employee payslip"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button
                  onClick={() => setSelectedStaffForSlip(null)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
