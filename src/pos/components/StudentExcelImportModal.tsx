import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Customer } from '../types/pos';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

interface StudentExcelImportModalProps {
  existingCustomers: Customer[];
  isOpen: boolean;
  onClose: () => void;
  onImportStudents: (students: Customer[]) => void;
}

interface ParsedRow {
  name: string;
  studentId: string;
  gradeSection: string;
  accountType: 'student' | 'staff' | 'visitor';
  joiningDate: string;
  relievingDate: string;
  walletBalance: number;
  phone: string;
  email: string;
  allergens: string;
  parentName: string;
  isDisabled: boolean;
  disabledReason?: string;
  isValid: boolean;
  errors: string[];
}

export const StudentExcelImportModal: React.FC<StudentExcelImportModalProps> = ({
  existingCustomers,
  isOpen,
  onClose,
  onImportStudents,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to format Excel dates (which can be serial numbers or strings)
  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      // Excel epoch conversion
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
    }
    const str = String(val).trim();
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
    return str;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const binaryStr = event.target?.result;
        const workbook = XLSX.read(binaryStr, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          setParseError('The uploaded Excel file contains no data rows.');
          setIsProcessing(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mapped: ParsedRow[] = rawJson.map((row, idx) => {
          const errors: string[] = [];

          // Column resolution (handles variations in headers)
          const name = String(row['Full Name'] || row['Student Name'] || row['Name'] || '').trim();
          const studentId = String(
            row['Admission ID'] ||
              row['Admission / Student ID'] ||
              row['Student ID'] ||
              row['Admission No'] ||
              row['ID'] ||
              ''
          ).trim();
          const gradeSection = String(
            row['Class / Grade'] || row['Class'] || row['Grade'] || row['Class & Section'] || ''
          ).trim();
          const accountTypeRaw = String(row['Account Type'] || 'student').toLowerCase();
          const accountType: 'student' | 'staff' | 'visitor' =
            accountTypeRaw.includes('staff') || accountTypeRaw.includes('faculty')
              ? 'staff'
              : accountTypeRaw.includes('visitor')
              ? 'visitor'
              : 'student';

          const joiningDateRaw =
            row['Joining Date'] ||
            row['Admission Date'] ||
            row['Joining / Admission Date'] ||
            row['JoiningDate'] ||
            '';
          const joiningDate = parseExcelDate(joiningDateRaw) || new Date().toISOString().slice(0, 10);

          const relievingDateRaw =
            row['Relieving Date'] ||
            row['Leaving Date'] ||
            row['Relieving / Leaving Date'] ||
            row['Graduation Date'] ||
            '';
          const relievingDate = parseExcelDate(relievingDateRaw);

          const rawBalance = row['Prepaid Wallet Balance'] || row['Wallet Balance'] || row['Balance'] || 0;
          const walletBalance = isNaN(Number(rawBalance)) ? 0 : Math.max(0, Number(rawBalance));

          const phone = String(row['Phone'] || row['Contact Phone'] || row['Mobile'] || '').trim();
          const email = String(row['Email'] || row['School Email'] || '').trim();
          const allergens = String(row['Allergens'] || row['Known Allergens'] || 'None').trim();
          const parentName = String(row['Parent Name'] || row['Parent / Guardian Name'] || '').trim();

          let isDisabled = false;
          let disabledReason = '';

          const statusStr = String(row['Status'] || row['Account Status'] || '').toLowerCase();
          if (statusStr.includes('disable') || statusStr.includes('inactive')) {
            isDisabled = true;
            disabledReason = 'Marked disabled in import file';
          }

          // Check if relieving date has passed
          if (relievingDate) {
            const relDate = new Date(relievingDate);
            relDate.setHours(0, 0, 0, 0);
            if (relDate <= today) {
              isDisabled = true;
              disabledReason = `Relieving date reached (${relievingDate})`;
            }
          }

          if (!name) {
            errors.push('Student name is required');
          }

          return {
            name: name || `Imported Student #${idx + 1}`,
            studentId,
            gradeSection,
            accountType,
            joiningDate,
            relievingDate,
            walletBalance,
            phone: phone || '+91 90000 00000',
            email,
            allergens: allergens || 'None',
            parentName,
            isDisabled,
            disabledReason,
            isValid: errors.length === 0,
            errors,
          };
        });

        setParsedRows(mapped);
        setIsProcessing(false);
      } catch (err: any) {
        setParseError(`Failed to process Excel file: ${err.message || 'Invalid format'}`);
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const downloadSampleTemplate = () => {
    const templateData = [
      {
        'Admission / Student ID': 'TLGS-2026-1001',
        'Full Name': 'Kabir Deshmukh',
        'Account Type': 'student',
        'Class / Grade': 'Grade 9-B',
        'Joining Date': '2025-06-15',
        'Relieving Date': '2028-05-31',
        'Prepaid Wallet Balance': 500,
        'Known Allergens': 'None',
        'Parent / Guardian Name': 'Ajay Deshmukh (Father)',
        'Phone': '+91 98765 11223',
        'Email': 'kabir.deshmukh@tlgs.edu.in',
        'Status': 'ACTIVE',
      },
      {
        'Admission / Student ID': 'TLGS-2026-1002',
        'Full Name': 'Meera Sundaram',
        'Account Type': 'student',
        'Class / Grade': 'Grade 11-A',
        'Joining Date': '2024-06-10',
        'Relieving Date': '2026-04-30',
        'Prepaid Wallet Balance': 350,
        'Known Allergens': 'Dairy / Lactose Intolerant',
        'Parent / Guardian Name': 'K. Sundaram (Father)',
        'Phone': '+91 98765 22334',
        'Email': 'meera.sundaram@tlgs.edu.in',
        'Status': 'ACTIVE',
      },
      {
        'Admission / Student ID': 'TLGS-2026-1003',
        'Full Name': 'Devansh Singhania',
        'Account Type': 'student',
        'Class / Grade': 'Grade 7-C',
        'Joining Date': '2026-01-15',
        'Relieving Date': '2031-05-31',
        'Prepaid Wallet Balance': 800,
        'Known Allergens': 'Peanut Allergy',
        'Parent / Guardian Name': 'Pooja Singhania (Mother)',
        'Phone': '+91 98765 33445',
        'Email': 'devansh.s@tlgs.edu.in',
        'Status': 'ACTIVE',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
    XLSX.writeFile(wb, 'TLGS_Students_Import_Template.xlsx');
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newCustomers: Customer[] = validRows.map((r, idx) => ({
      id: `cust-imp-${Date.now()}-${idx}`,
      name: r.name,
      student_id: r.studentId,
      grade_section: r.gradeSection,
      account_type: r.accountType,
      joining_date: r.joiningDate,
      relieving_date: r.relievingDate || undefined,
      wallet_balance: r.walletBalance,
      phone: r.phone,
      email: r.email,
      allergens: r.allergens,
      parent_name: r.parentName,
      is_disabled: r.isDisabled,
      disabled_reason: r.disabledReason,
      loyalty_points: Math.round(r.walletBalance / 10),
      total_spent: 0,
      visit_count: 0,
      tier: 'Bronze',
      member_since: r.joiningDate,
      notes: `Imported via Excel on ${new Date().toLocaleDateString()}`,
    }));

    onImportStudents(newCustomers);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const expiredRelievingCount = parsedRows.filter(
    (r) => r.relievingDate && new Date(r.relievingDate) <= new Date()
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Import Student Data from Excel
              </h3>
              <p className="text-xs text-neutral-400">
                Bulk register students with admission numbers, joining dates & relieving schedules
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Download Template or Select File */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Download Excel Template</span>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Use our standardized template with student ID, admission date, relieving date & wallet fields.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="mt-3 px-3 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl border border-neutral-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Sample .XLSX</span>
              </button>
            </div>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-amber-500 bg-neutral-950/60 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <Upload className="w-6 h-6 text-neutral-400 group-hover:text-amber-400 mb-1.5 transition-colors" />
              <span className="text-xs font-bold text-neutral-200">
                {file ? file.name : 'Choose or Drag Excel File'}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Supports .xlsx, .xls, .csv</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Processing / Error Feedback */}
          {parseError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {isProcessing && (
            <div className="p-6 text-center text-xs text-neutral-400">
              Parsing Excel sheets and validating student dates...
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && !isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 font-mono">
                  Preview ({validCount} Valid / {parsedRows.length} Total Rows)
                </span>
                {expiredRelievingCount > 0 && (
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{expiredRelievingCount} account(s) have past relieving dates (will auto-disable)</span>
                  </span>
                )}
              </div>

              <div className="border border-neutral-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-950 text-neutral-400 uppercase font-mono text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">ID / Class</th>
                      <th className="py-2.5 px-3">Joining Date</th>
                      <th className="py-2.5 px-3">Relieving Date</th>
                      <th className="py-2.5 px-3 text-right">Wallet</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-neutral-850">
                        <td className="py-2.5 px-3 font-semibold text-neutral-100">
                          {row.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-300">
                          {row.studentId || '—'} · {row.gradeSection || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-neutral-400">
                          {row.joiningDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {row.relievingDate ? (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] ${
                                new Date(row.relievingDate) <= new Date()
                                  ? 'bg-red-500/20 text-red-300 font-bold'
                                  : 'text-neutral-300'
                              }`}
                            >
                              {row.relievingDate}
                            </span>
                          ) : (
                            <span className="text-neutral-500">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          ₹{row.walletBalance}
                        </td>
                        <td className="py-2.5 px-3">
                          {row.isDisabled ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300">
                              DISABLED
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                              ACTIVE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={validCount === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Import {validCount} Students</span>
          </button>
        </div>
      </div>
    </div>
  );
};
