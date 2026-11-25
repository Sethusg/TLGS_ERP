import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import {
  SchoolClass,
  SchoolSubject,
  Staff,
  SystemUser,
  TimetableEntry,
} from '../../types';
import { SchoolOption } from '../../data/schoolContext';
import {
  ADMIN_IMPORT_SCHEMAS,
  AdminBulkEntityType,
  AdminBulkParseResult,
  downloadAdminSampleTemplate,
  parseAdminImportFile,
} from '../../utils/adminBulkImport';
import { EnterpriseFormModal } from '../Common/EnterpriseUI';

interface AdminBulkImportModalProps {
  isOpen: boolean;
  entity: AdminBulkEntityType;
  onClose: () => void;
  schools: SchoolOption[];
  staffList: Staff[];
  defaultSchoolId: string;
  defaultCampusId: string;
  existingUsers: SystemUser[];
  existingClasses: SchoolClass[];
  existingSubjects: SchoolSubject[];
  existingTimetables: TimetableEntry[];
  onCommitImport: (
    entity: AdminBulkEntityType,
    result: AdminBulkParseResult,
    updateExisting: boolean
  ) => void;
}

export const AdminBulkImportModal: React.FC<AdminBulkImportModalProps> = ({
  isOpen,
  entity,
  onClose,
  schools,
  staffList,
  defaultSchoolId,
  defaultCampusId,
  existingUsers,
  existingClasses,
  existingSubjects,
  existingTimetables,
  onCommitImport,
}) => {
  const schema = ADMIN_IMPORT_SCHEMAS[entity];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<AdminBulkParseResult | null>(null);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [showSchemaGuide, setShowSchemaGuide] = useState(false);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'errors'>('all');

  useEffect(() => {
    if (isOpen) {
      setParseResult(null);
      setParseError(null);
      setPreviewFilter('all');
      setUpdateExisting(true);
      setShowSchemaGuide(false);
    }
  }, [isOpen, entity]);

  const handleFileSelected = async (file?: File | null) => {
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    if (
      !lowerName.endsWith('.xlsx') &&
      !lowerName.endsWith('.xls') &&
      !lowerName.endsWith('.csv')
    ) {
      setParseError('Unsupported file format. Please upload a .xlsx, .xls, or .csv file.');
      setParseResult(null);
      return;
    }

    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parseAdminImportFile(file, entity, {
        schools,
        staffList,
        defaultSchoolId,
        defaultCampusId,
        existingUsers,
        existingClasses,
        existingSubjects,
        existingTimetables,
      });
      if (result.totalRows === 0) {
        setParseError(
          'The uploaded spreadsheet contains no data rows. Download the sample template to verify formatting.'
        );
        setParseResult(null);
      } else {
        setParseResult(result);
      }
    } catch {
      setParseError(
        'Unable to read the uploaded file. Ensure it is a valid Excel (.xlsx/.xls) or UTF-8 CSV spreadsheet.'
      );
      setParseResult(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const actionableCount = parseResult
    ? parseResult.createCount + (updateExisting ? parseResult.updateCount : 0)
    : 0;

  const filteredPreviewRows = parseResult
    ? parseResult.rows.filter((r) => {
        if (previewFilter === 'valid') return r.action !== 'error';
        if (previewFilter === 'errors') return r.action === 'error';
        return true;
      })
    : [];

  return (
    <EnterpriseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Import — ${schema.label}`}
      subtitle={`Upload Excel (.xlsx / .xls) or CSV to batch create or update ${schema.label.toLowerCase()}. ${schema.matchKeyDescription}.`}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        {/* Step 1: Sample Excel Template Download Bar */}
        <div className="p-3.5 rounded-xl bg-[#0B1F3A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#D4AF37]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">
                Step 1: Export Sample Import Template
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Includes pre-formatted columns, realistic sample rows, and a Field Guide worksheet.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                downloadAdminSampleTemplate(entity, 'xlsx', schools, staffList)
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] font-bold text-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadAdminSampleTemplate(entity, 'csv', schools, staffList)
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Collapsible Column Schema Guide */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowSchemaGuide((prev) => !prev)}
            className="w-full px-4 py-2.5 bg-[#F8FAFC] hover:bg-slate-100/80 flex items-center justify-between text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 font-semibold text-[#0B1F3A]">
              <Info className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>
                Expected Spreadsheet Columns ({schema.fields.length} columns ·{' '}
                {schema.fields.filter((f) => f.required === 'Required').length} required)
              </span>
            </span>
            {showSchemaGuide ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showSchemaGuide && (
            <div className="overflow-x-auto border-t border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Column Header</th>
                    <th className="px-3 py-2 font-semibold">Rule</th>
                    <th className="px-3 py-2 font-semibold">Format / Values</th>
                    <th className="px-3 py-2 font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schema.fields.map((f) => (
                    <tr key={f.column}>
                      <td className="px-3 py-2 font-mono font-bold text-[#0B1F3A]">
                        {f.column}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            f.required === 'Required'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {f.required}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700">{f.format}</td>
                      <td className="px-3 py-2 font-mono text-slate-500">{f.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Step 2: File Upload Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFileSelected(e.dataTransfer.files?.[0]);
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            isDragging
              ? 'border-[#D4AF37] bg-[#D4AF37]/5'
              : 'border-slate-300 bg-[#F8FAFC] hover:border-[#0B1F3A]/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto mb-3 text-[#0B1F3A]">
            {isParsing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#9A7418]" />
            ) : (
              <Upload className="w-5 h-5 text-[#9A7418]" />
            )}
          </div>
          <p className="text-sm font-bold text-[#0B1F3A]">
            {parseResult
              ? `Loaded: ${parseResult.fileName}`
              : `Step 2: Drop your ${schema.label} Excel or CSV file here`}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) files. Automatic validation runs before import.
          </p>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold text-xs cursor-pointer"
            >
              {parseResult ? 'Choose Different File' : 'Browse Spreadsheet File'}
            </button>
          </div>
        </div>

        {/* Options */}
        <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-[#F8FAFC] border border-slate-200 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-[#0B1F3A]"
          />
          <div>
            <span className="font-semibold text-[#0B1F3A]">
              Update existing matching records
            </span>
            <span className="text-[11px] text-slate-500 block">
              {schema.matchKeyDescription}. Uncheck to create new entries only and skip existing matches.
            </span>
          </div>
        </label>

        {/* Parse Error Banner */}
        {parseError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{parseError}</span>
          </div>
        )}

        {/* Validation Preview Summary & Table */}
        {parseResult && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Rows
                </p>
                <p className="text-lg font-extrabold text-[#0B1F3A] tabular-nums mt-0.5">
                  {parseResult.totalRows}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  New to Create
                </p>
                <p className="text-lg font-extrabold text-emerald-800 tabular-nums mt-0.5">
                  {parseResult.createCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                  {updateExisting ? 'Existing to Update' : 'Existing (Skipped)'}
                </p>
                <p className="text-lg font-extrabold text-amber-900 tabular-nums mt-0.5">
                  {parseResult.updateCount}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">
                  Validation Errors
                </p>
                <p className="text-lg font-extrabold text-rose-800 tabular-nums mt-0.5">
                  {parseResult.errorRows}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[#0B1F3A]">
                  Import Validation Preview
                </span>
                <div className="flex items-center gap-1">
                  {(['all', 'valid', 'errors'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setPreviewFilter(f)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize cursor-pointer ${
                        previewFilter === f
                          ? 'bg-[#0B1F3A] text-[#D4AF37]'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredPreviewRows.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No rows match the selected preview filter.
                  </div>
                ) : (
                  filteredPreviewRows.map((row) => {
                    const isSkippedUpdate = row.action === 'update' && !updateExisting;
                    return (
                      <div
                        key={row.rowNumber}
                        className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/80"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              Row #{row.rowNumber}
                            </span>
                            {row.action === 'create' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                Create
                              </span>
                            )}
                            {row.action === 'update' && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  isSkippedUpdate
                                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                <RefreshCw className="w-3 h-3" />
                                {isSkippedUpdate ? 'Skip Existing' : 'Update'}
                              </span>
                            )}
                            {row.action === 'error' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" />
                                Error
                              </span>
                            )}
                            <span className="font-bold text-[#0B1F3A] truncate">
                              {row.summaryTitle}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {row.summarySubtitle}
                          </p>
                          {row.errors.length > 0 && (
                            <p className="text-[11px] text-rose-700 font-medium mt-1">
                              {row.errors.join(' ')}
                            </p>
                          )}
                          {row.warnings.length > 0 && (
                            <p className="text-[11px] text-amber-700 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{row.warnings.join(' ')}</span>
                            </p>
                          )}
                        </div>
                        {row.badgeText && row.action !== 'error' && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10.5px] shrink-0">
                            {row.badgeText}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-slate-500">
            {parseResult
              ? `${actionableCount} valid ${schema.singularLabel.toLowerCase()}(s) ready to import${
                  parseResult.errorRows > 0
                    ? ` · ${parseResult.errorRows} invalid row(s) will be skipped`
                    : ''
                }.`
              : 'Export the sample Excel template, fill your rows, and upload to preview.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!parseResult || actionableCount === 0}
              onClick={() => {
                if (parseResult && actionableCount > 0) {
                  onCommitImport(entity, parseResult, updateExisting);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white font-semibold text-xs disabled:opacity-40 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {actionableCount > 0
                  ? `Confirm & Import (${actionableCount})`
                  : 'Import Records'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </EnterpriseFormModal>
  );
};
