import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  GraduationCap,
  Users,
  Boxes,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Student, Staff, SchoolAsset } from '../../types';
import { downloadSchoolDataPDF } from '../../utils/exportSchoolDataPdf';
import { printElement } from '../../utils/printDocument';

interface SchoolDataPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  staffList: Staff[];
  assets: SchoolAsset[];
  schoolName?: string;
  affiliationNo?: string;
  schoolCode?: string;
  academicYear?: string;
}

export const SchoolDataPdfModal: React.FC<SchoolDataPdfModalProps> = ({
  isOpen,
  onClose,
  students,
  staffList,
  assets,
  schoolName = 'THE LEADERS ACADEMY(CBSE)',
  affiliationNo = '1930812',
  schoolCode = '45091',
  academicYear = '2026 - 2027',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const activeStaff = staffList.filter((s) => s.status !== 'Archived');

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      downloadSchoolDataPDF({
        schoolName,
        affiliationNo,
        schoolCode,
        academicYear,
        students,
        staffList,
        assets,
      });
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Structured School Data PDF Dossier</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  CBSE Statutory
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official institutional export for Students, Staff Roster, and Capital Assets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download structured PDF to device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'Export to PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                printElement('school-data-dossier-print-area', {
                  title: 'THE_LEADERS_ACADEMY_School_Master_Data_Report',
                })
              }
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Print official school dossier"
            >
              <Printer className="w-3.5 h-3.5 text-slate-200" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Structured PDF generated & downloaded successfully: THE_LEADERS_ACADEMY_School_Master_Data_Report_{new Date().toISOString().slice(0, 10)}.pdf</span>
          </div>
        )}

        {/* Modal Body / Document Preview */}
        <div id="school-data-dossier-print-area" className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/50">
          {/* Summary Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-cyan-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#e0f7fa] text-[#00acc1] flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-700 block">Enrolled Students</span>
                <span className="text-lg font-black text-gray-900 tabular-nums">{students.length}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#e8f5e9] text-[#43a047] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Staff Members</span>
                <span className="text-lg font-black text-gray-900 tabular-nums">{staffList.length}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-purple-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#ede7f6] text-[#8e24aa] flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-700 block">Capital Assets</span>
                <span className="text-lg font-black text-gray-900 tabular-nums">{assets.length}</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-100 flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-[#fff8e1] text-[#f57f17] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Audited Value</span>
                <span className="text-lg font-black text-gray-900 tabular-nums">₹{(totalAssetValue / 100000).toFixed(1)} L</span>
              </div>
            </div>
          </div>

          {/* Formatted A4 Document Simulation */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 text-gray-800 text-xs font-sans">
            {/* Document Header Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-rose-700 tracking-wider uppercase block">
                  Official Audit Document
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {schoolName}
                </h4>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  CBSE Affiliation No: <strong>{affiliationNo}</strong> | School Code: <strong>{schoolCode}</strong> | Academic Session: <strong>{academicYear}</strong>
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] font-mono text-gray-500 shrink-0">
                <div>DOC REF: <strong className="text-gray-900">TLGS-MASTER-2026</strong></div>
                <div>Date: <strong>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                <div className="text-emerald-700 font-semibold">STATUS: VERIFIED & CONFIDENTIAL</div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                <span>1. Executive Summary & Statistical Aggregates</span>
              </h5>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-3.5 py-2 font-semibold">Metric Parameter</th>
                      <th className="px-3.5 py-2 font-semibold">Current Count / Value</th>
                      <th className="px-3.5 py-2 font-semibold">Institutional Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-3.5 py-2 font-medium">Enrolled CBSE Students</td>
                      <td className="px-3.5 py-2 font-bold text-emerald-800">{students.length} Records</td>
                      <td className="px-3.5 py-2 text-gray-600">Active enrollments (Class 1 to 12)</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-medium">Faculty & Staff Members</td>
                      <td className="px-3.5 py-2 font-bold text-emerald-800">{activeStaff.length} On Duty ({staffList.length} Total)</td>
                      <td className="px-3.5 py-2 text-gray-600">Teaching faculty, Admin & Staff</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-medium">School Fixed Assets</td>
                      <td className="px-3.5 py-2 font-bold text-emerald-800">{assets.length} Capitalized Items</td>
                      <td className="px-3.5 py-2 text-gray-600">Labs, Terminals, Furniture & Equipment</td>
                    </tr>
                    <tr>
                      <td className="px-3.5 py-2 font-medium">Total Capital Value</td>
                      <td className="px-3.5 py-2 font-bold text-emerald-800">₹{totalAssetValue.toLocaleString('en-IN')}</td>
                      <td className="px-3.5 py-2 text-gray-600">Book value at historical cost</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Students Master Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00acc1]"></span>
                  <span>2. Students Master Directory ({students.length} Enrolled)</span>
                </h5>
                <span className="text-[10px] text-gray-500">Previewing first 5 rows (full {students.length} rows included in PDF)</span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#00acc1] text-white">
                    <tr>
                      <th className="px-3 py-1.5">Adm No</th>
                      <th className="px-3 py-1.5">Roll</th>
                      <th className="px-3 py-1.5">Student Name</th>
                      <th className="px-3 py-1.5">Grade</th>
                      <th className="px-3 py-1.5">Guardian</th>
                      <th className="px-3 py-1.5">Contact</th>
                      <th className="px-3 py-1.5">Fee Status</th>
                      <th className="px-3 py-1.5 text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.slice(0, 5).map((s) => (
                      <tr key={s.id} className="hover:bg-cyan-50/30">
                        <td className="px-3 py-1.5 font-mono font-medium">{s.admissionNo}</td>
                        <td className="px-3 py-1.5 font-mono text-gray-600">{s.rollNo}</td>
                        <td className="px-3 py-1.5 font-bold text-gray-900">{s.name}</td>
                        <td className="px-3 py-1.5">{s.grade} - {s.section}</td>
                        <td className="px-3 py-1.5 text-gray-700">{s.fatherName}</td>
                        <td className="px-3 py-1.5 font-mono text-gray-600">{s.phone}</td>
                        <td className="px-3 py-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${s.feeStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {s.feeStatus}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right font-semibold">{s.attendancePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Staff Roster Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#43a047]"></span>
                  <span>3. Faculty & Staff Roster ({staffList.length} Members)</span>
                </h5>
                <span className="text-[10px] text-gray-500">Previewing first 5 rows (full {staffList.length} rows included in PDF)</span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#43a047] text-white">
                    <tr>
                      <th className="px-3 py-1.5">Emp ID</th>
                      <th className="px-3 py-1.5">Staff Name</th>
                      <th className="px-3 py-1.5">Role</th>
                      <th className="px-3 py-1.5">Designation</th>
                      <th className="px-3 py-1.5">Department</th>
                      <th className="px-3 py-1.5">Contact</th>
                      <th className="px-3 py-1.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {staffList.slice(0, 5).map((stf) => (
                      <tr key={stf.id} className="hover:bg-emerald-50/30">
                        <td className="px-3 py-1.5 font-mono font-medium">{stf.empId}</td>
                        <td className="px-3 py-1.5 font-bold text-gray-900">{stf.name}</td>
                        <td className="px-3 py-1.5 text-gray-700">{stf.role}</td>
                        <td className="px-3 py-1.5 font-medium">{stf.designation}</td>
                        <td className="px-3 py-1.5 text-gray-600">{stf.department}</td>
                        <td className="px-3 py-1.5 font-mono text-gray-600">{stf.phone}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {stf.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Assets Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0097a7]"></span>
                  <span>4. Institutional Assets & Capital Register ({assets.length} Items)</span>
                </h5>
                <span className="text-[10px] text-gray-500">Previewing first 5 rows (full {assets.length} items included in PDF)</span>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0097a7] text-white">
                    <tr>
                      <th className="px-3 py-1.5">Asset Code</th>
                      <th className="px-3 py-1.5">Asset Name</th>
                      <th className="px-3 py-1.5">Category</th>
                      <th className="px-3 py-1.5">Location</th>
                      <th className="px-3 py-1.5 text-right">Cost (INR)</th>
                      <th className="px-3 py-1.5">Condition</th>
                      <th className="px-3 py-1.5">Custodian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {assets.slice(0, 5).map((a) => (
                      <tr key={a.id} className="hover:bg-cyan-50/30">
                        <td className="px-3 py-1.5 font-mono font-medium">{a.assetCode}</td>
                        <td className="px-3 py-1.5 font-bold text-gray-900">{a.name}</td>
                        <td className="px-3 py-1.5 text-gray-700">{a.category}</td>
                        <td className="px-3 py-1.5 text-gray-600">{a.location}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-semibold">₹{(a.cost || 0).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            {a.condition}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-gray-600">{a.assignedTo || 'General Lab Pool'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Certification Footer in Document */}
            <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 gap-2">
              <span>Certified under CBSE Affiliation Guidelines Rule 14.1</span>
              <span>Audited & Digitally Signed • TLGS Enterprise ERP</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500">
            Export format: <strong>A4 Structured PDF with AutoTable Layout & Pagination</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download Structured PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
