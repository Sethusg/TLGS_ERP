import React, { useState, useRef } from 'react';
import {
  Shield,
  Settings as SettingsIcon,
  Key,
  Users,
  Database,
  CheckCircle2,
  Lock,
  Building,
  Globe,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  FileJson,
  FileCheck2,
  HardDrive,
  Copy,
  Clock,
  Sparkles,
  FileText,
  Printer,
  Eye,
} from 'lucide-react';
import {
  Student,
  Staff,
  LeaveRequest,
  CRMLead,
  BirthdayItem,
  Circular,
  FeeReceipt,
  TransferCertificate,
  SchoolAsset,
} from '../types';
import { SchoolDataPdfModal } from './Modals/SchoolDataPdfModal';
import { downloadSchoolDataPDF } from '../utils/exportSchoolDataPdf';

export interface FullSystemBackupData {
  schemaVersion: string;
  institution: string;
  affiliationNo: string;
  backupDate: string;
  timestamp: number;
  metadata: {
    studentsCount: number;
    staffCount: number;
    leaveRequestsCount: number;
    assetsCount: number;
    feeReceiptsCount: number;
  };
  data: {
    students: Student[];
    staffList: Staff[];
    leaveRequests: LeaveRequest[];
    crmLeads: CRMLead[];
    birthdays: BirthdayItem[];
    circulars: Circular[];
    feeReceipts: FeeReceipt[];
    tcRecords: TransferCertificate[];
    libraryBooks: any[];
    assets: SchoolAsset[];
  };
}

interface AdminSettingsProps {
  initialTab?: 'roles' | 'settings' | 'audit' | 'backup';
  systemState?: {
    students: Student[];
    staffList: Staff[];
    leaveRequests: LeaveRequest[];
    crmLeads: CRMLead[];
    birthdays: BirthdayItem[];
    circulars: Circular[];
    feeReceipts: FeeReceipt[];
    tcRecords: TransferCertificate[];
    libraryBooks: any[];
    assets: SchoolAsset[];
  };
  onRestoreState?: (importedData: FullSystemBackupData['data']) => boolean;
  onResetToDemoData?: () => void;
}

export const AdminSettingsModule: React.FC<AdminSettingsProps> = ({
  initialTab = 'roles',
  systemState,
  onRestoreState,
  onResetToDemoData,
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'settings' | 'audit' | 'backup'>(initialTab);

  // Institution settings state
  const [schoolName, setSchoolName] = useState('THE LEADERS ACADEMY(CBSE)');
  const [affiliationNo, setAffiliationNo] = useState('1930812');
  const [schoolCode, setSchoolCode] = useState('45091');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [principalEmail, setPrincipalEmail] = useState('principal@leadersacademy.edu.in');
  const [saveToast, setSaveToast] = useState(false);

  // PDF Export & Preview State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfExportSuccess, setPdfExportSuccess] = useState(false);

  // Backup & Restore state
  const [importedPreview, setImportedPreview] = useState<FullSystemBackupData | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // Export current school data (students, staff, assets) into a structured PDF document
  const handleExportPDF = () => {
    if (!systemState) return;
    downloadSchoolDataPDF({
      schoolName,
      affiliationNo,
      schoolCode,
      academicYear,
      students: systemState.students,
      staffList: systemState.staffList,
      assets: systemState.assets,
    });
    setPdfExportSuccess(true);
    setTimeout(() => setPdfExportSuccess(false), 3500);
  };

  // Export entire application state as a JSON file
  const handleExportBackup = () => {
    if (!systemState) return;

    const backupPayload: FullSystemBackupData = {
      schemaVersion: 'TLA-BACKUP-V2.0',
      institution: schoolName,
      affiliationNo,
      backupDate: new Date().toISOString(),
      timestamp: Date.now(),
      metadata: {
        studentsCount: systemState.students.length,
        staffCount: systemState.staffList.length,
        leaveRequestsCount: systemState.leaveRequests.length,
        assetsCount: systemState.assets.length,
        feeReceiptsCount: systemState.feeReceipts.length,
      },
      data: {
        students: systemState.students,
        staffList: systemState.staffList,
        leaveRequests: systemState.leaveRequests,
        crmLeads: systemState.crmLeads,
        birthdays: systemState.birthdays,
        circulars: systemState.circulars,
        feeReceipts: systemState.feeReceipts,
        tcRecords: systemState.tcRecords,
        libraryBooks: systemState.libraryBooks,
        assets: systemState.assets,
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `THE_LEADERS_ACADEMY_System_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle uploaded JSON backup file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data || !Array.isArray(parsed.data.students) || !Array.isArray(parsed.data.staffList)) {
          throw new Error('Invalid JSON structure. Missing students or staffList collections.');
        }
        setImportedPreview(parsed);
      } catch (err: any) {
        setRestoreError(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Execute recovery/restore into live state
  const handleConfirmRestore = () => {
    if (!importedPreview || !onRestoreState) return;
    const ok = onRestoreState(importedPreview.data);
    if (ok) {
      setRestoreSuccess(true);
      setImportedPreview(null);
      setTimeout(() => setRestoreSuccess(false), 4000);
    } else {
      setRestoreError('Restoration rejected: schema verification failed.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#37474f]" />
            <span>Admin Administration & Disaster Recovery</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Role-Based Access Control · CBSE Affiliation Parameters · Full System State Backup & Recovery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'roles' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              User Roles & RBAC
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'settings' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              CBSE Parameters
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'audit' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Audit Log
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'backup'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>Data Backup & Restore</span>
            </button>
          </div>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
            title="Export current school data (students, staff, assets) into a structured PDF document"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export to PDF</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-gray-200 shadow-2xs shrink-0 cursor-pointer"
            title="Print structured school data dossier"
          >
            <Printer className="w-3.5 h-3.5 text-gray-700" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* VIEW: USER ROLES & RBAC */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Multicolor Role-Based Access Control (RBAC)</h3>
              <p className="text-xs text-gray-500">
                Configure module permissions across Academic, Accounts, and Transportation administrative roles
              </p>
            </div>
            <button
              onClick={() => alert('New administrative sub-role wizard opened.')}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>+ Create Role</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Security Role</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Students & Fees</th>
                  <th className="px-4 py-3">Staff & Leaves</th>
                  <th className="px-4 py-3">Transport & Assets</th>
                  <th className="px-4 py-3">Admin & System</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { role: 'Super Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200', count: '2 Users', sf: 'Full Control', sl: 'Full Control', ta: 'Full Control', as: 'Full Control' },
                  { role: 'Principal & Vice Principal', color: 'bg-pink-100 text-pink-800 border-pink-200', count: '4 Users', sf: 'Approve & View', sl: 'Approve All', ta: 'View Only', as: 'Approval Queue' },
                  { role: 'Senior Faculty / PGT', color: 'bg-blue-100 text-blue-800 border-blue-200', count: '84 Users', sf: 'Attendance Only', sl: 'Apply / Proxy', ta: 'None', as: 'None' },
                  { role: 'Accounts & Bursar', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', count: '6 Users', sf: 'Full Fee Entry', sl: 'Payroll Ledger', ta: 'Billing Audit', as: 'None' },
                  { role: 'Transport Supervisor', color: 'bg-amber-100 text-amber-800 border-amber-200', count: '8 Users', sf: 'Bus Roster', sl: 'Driver Leaves', ta: 'Fleet GPS Full', as: 'None' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold border text-[11px] ${r.color}`}>
                        {r.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.count}</td>
                    <td className="px-4 py-3 text-gray-700">{r.sf}</td>
                    <td className="px-4 py-3 text-gray-700">{r.sl}</td>
                    <td className="px-4 py-3 text-gray-700">{r.ta}</td>
                    <td className="px-4 py-3 text-gray-700">{r.as}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CBSE PARAMETERS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900">Institutional Parameters & CBSE Board Config</h3>
            <p className="text-xs text-gray-500">Parameters utilized on report cards, TC emissions, and government portals</p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">School Affiliated Name</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">CBSE Affiliation Number</label>
                <input
                  type="text"
                  required
                  value={affiliationNo}
                  onChange={(e) => setAffiliationNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Academic Session</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Administrator Email</label>
                <input
                  type="email"
                  required
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              {saveToast && <span className="text-xs text-emerald-700 font-semibold">Settings saved successfully!</span>}
              <button
                type="submit"
                className="ml-auto px-5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Security & Operational Audit Trail</h3>
          <div className="space-y-2 text-xs">
            {[
              { event: 'User Login: admin_sethu (Dr. Sethu Ramanathan)', time: '24 Oct 2026, 08:15 AM', ip: '103.21.144.12', status: 'Authorized Session' },
              { event: 'Fee Receipt REC-2026-4891 issued for Aarav Sharma (₹46,000)', time: '23 Oct 2026, 04:12 PM', ip: '103.21.144.18', status: 'Payment Logged' },
              { event: 'CBSE Transfer Certificate TLGS/TC/2026/043 printed', time: '23 Oct 2026, 11:30 AM', ip: '103.21.144.12', status: 'Certificate Emitted' },
              { event: 'Staff Leave Request lev-004 approved by Principal', time: '22 Oct 2026, 02:45 PM', ip: '103.21.144.12', status: 'Leave Workflow' },
            ].map((a, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{a.event}</span>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">{a.time} · Host: {a.ip}</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: DATA BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>Full System State Backup & Disaster Recovery</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Export the complete application database (students, staff, leaves, fees, transport, and assets) as a JSON file, or re-import a previously exported backup file to restore system state.
            </p>
          </div>

          {/* Success Banner */}
          {restoreSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>System State Restored Successfully!</strong> All modules, student files, staff rosters, and financial records have been refreshed to the imported snapshot.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {restoreError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong>Backup Restore Error:</strong> {restoreError}
              </div>
            </div>
          )}

          {/* PDF Export Success Notification */}
          {pdfExportSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in duration-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>PDF Document Downloaded Successfully!</strong> The structured A4 report containing students, staff, and assets has been saved to your downloads.
              </div>
            </div>
          )}

          {/* Action Cards Grid - 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Structured PDF Export */}
            <div className="p-5 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 border border-rose-200 rounded-2xl space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-gray-900 text-sm">Export School Data (PDF)</h4>
                  <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                    CBSE Format
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Generates an official, structured A4 PDF document containing students master directory, staff roster, and capital assets with letterhead and verification seal.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700 bg-white/90 p-3 rounded-xl border border-rose-100 font-medium">
                  <div>• Students: <span className="font-bold text-cyan-800">{systemState?.students.length || 1069}</span></div>
                  <div>• Staff: <span className="font-bold text-emerald-800">{systemState?.staffList.length || 120}</span></div>
                  <div>• Assets: <span className="font-bold text-purple-800">{systemState?.assets.length || 24}</span></div>
                  <div>• Value: <span className="font-bold text-amber-800">₹48.5 Lakhs</span></div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleExportPDF}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  title="Directly download structured PDF report"
                >
                  <Download className="w-4 h-4" />
                  <span>Export to PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(true)}
                  className="w-full py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Preview document before printing or exporting"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Preview & Print Dossier</span>
                </button>
              </div>
            </div>

            {/* Card 2: Export JSON System State */}
            <div className="p-5 bg-gradient-to-br from-blue-50/60 to-white border border-blue-200 rounded-2xl space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-gray-900 text-sm">Full State Backup (JSON)</h4>
                  <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                    Database
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Downloads an exhaustive snapshot of the entire ERP database, including students, staff, leaves, fees, transport, and circulars.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700 bg-white/90 p-3 rounded-xl border border-blue-100 font-medium">
                  <div>• Leave Records: Active</div>
                  <div>• Fee Receipts: Active</div>
                  <div>• Bus Routes: 12 GPS</div>
                  <div>• Library & TC: Included</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleExportBackup}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export System State (.JSON)</span>
                </button>
              </div>
            </div>

            {/* Card 3: Import & Restore File */}
            <div className="p-5 bg-gradient-to-br from-purple-50/60 to-white border border-purple-200 rounded-2xl space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-gray-900 text-sm">Restore From Backup</h4>
                  <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">
                    Recovery
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Upload a previously saved backup file. The system validates schema integrity before applying updates.
                </p>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white/80 rounded-xl p-3 text-center cursor-pointer transition-colors space-y-1"
                >
                  <FileJson className="w-5 h-5 text-purple-500 mx-auto" />
                  <div className="text-xs font-bold text-gray-800">Choose Backup JSON</div>
                  <div className="text-[10px] text-gray-400">Accepts .json exported from ERP</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </button>
                {onResetToDemoData && (
                  <button
                    onClick={onResetToDemoData}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Reset to Initial Demo State"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pre-Restoration Inspection Panel */}
          {importedPreview && (
            <div className="p-5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Backup File Verified: Ready to Restore</span>
                </div>
                <span className="text-[11px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Schema: {importedPreview.schemaVersion}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3 rounded-xl border border-amber-200">
                <div>
                  <span className="text-gray-500 block">Institution:</span>
                  <strong className="text-gray-900">{importedPreview.institution}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Backup Date:</span>
                  <span className="font-mono text-gray-800">
                    {new Date(importedPreview.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Students Count:</span>
                  <strong className="text-emerald-700 font-mono">
                    {importedPreview.data.students.length} students
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Staff Count:</span>
                  <strong className="text-emerald-700 font-mono">
                    {importedPreview.data.staffList.length} staff
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-amber-900">
                  ⚠️ Restoring will overwrite the current in-memory database with the records from this file.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportedPreview(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRestore}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Execute System Restore</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structured School Data PDF Modal */}
      {systemState && (
        <SchoolDataPdfModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          students={systemState.students}
          staffList={systemState.staffList}
          assets={systemState.assets}
          schoolName={schoolName}
          affiliationNo={affiliationNo}
          schoolCode={schoolCode}
          academicYear={academicYear}
        />
      )}
    </div>
  );
};
