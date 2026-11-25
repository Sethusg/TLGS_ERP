import React, { useState, useMemo, useRef } from 'react';
import { Product, ProductCategory, StoreSettings } from '../types/pos';
import { formatCurrency } from '../utils/formatters';
import {
  BulkImportPayload,
  BulkImportParseSummary,
  PRODUCT_SCHEMA_COLUMNS,
  StockUpdateMode,
  downloadInventoryTemplateCSV,
  downloadInventoryTemplateXLSX,
  readSpreadsheetFile,
  validateInventoryRows,
} from '../utils/inventoryImport';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Info,
  FolderPlus,
} from 'lucide-react';

interface BulkInventoryImportModalProps {
  isOpen: boolean;
  products: Product[];
  categories: ProductCategory[];
  settings: StoreSettings;
  onClose: () => void;
  onConfirmImport: (payload: BulkImportPayload) => void;
}

interface LoadedSheetState {
  fileName: string;
  sheetName: string;
  detectedColumns: string[];
  rawRows: Record<string, unknown>[];
}

export const BulkInventoryImportModal: React.FC<BulkInventoryImportModalProps> = ({
  isOpen,
  products,
  categories,
  settings,
  onClose,
  onConfirmImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loadedSheet, setLoadedSheet] = useState<LoadedSheetState | null>(null);
  const [stockMode, setStockMode] = useState<StockUpdateMode>('set_stock');
  const [updateExistingDetails, setUpdateExistingDetails] = useState<boolean>(false);
  const [rowFilter, setRowFilter] = useState<'all' | 'create' | 'update' | 'error'>('all');
  const [showSchemaGuide, setShowSchemaGuide] = useState(false);

  const summary: BulkImportParseSummary | null = useMemo(() => {
    if (!loadedSheet) return null;
    return validateInventoryRows({
      fileName: loadedSheet.fileName,
      sheetName: loadedSheet.sheetName,
      detectedColumns: loadedSheet.detectedColumns,
      rawRows: loadedSheet.rawRows,
      existingProducts: products,
      existingCategories: categories,
      stockMode,
      updateExistingDetails,
    });
  }, [loadedSheet, products, categories, stockMode, updateExistingDetails]);

  const filteredRows = useMemo(() => {
    if (!summary) return [];
    if (rowFilter === 'all') return summary.rows;
    return summary.rows.filter((r) => r.action === rowFilter);
  }, [summary, rowFilter]);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setParseError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setParseError('Unsupported file format. Please upload a .csv, .xlsx, or .xls file.');
      return;
    }

    try {
      const sheet = await readSpreadsheetFile(file);
      if (sheet.rawRows.length === 0) {
        setParseError('The uploaded file has no data rows beneath the header.');
        return;
      }
      setLoadedSheet(sheet);
      setRowFilter('all');
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Unable to parse spreadsheet file. Please verify the file.'
      );
    }
  };

  const handleResetFile = () => {
    setLoadedSheet(null);
    setParseError(null);
    setRowFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (!summary) return;
    const validRows = summary.rows.filter((r) => r.action === 'create' || r.action === 'update');
    if (validRows.length === 0) return;

    onConfirmImport({
      fileName: summary.fileName,
      stockMode,
      updateExistingDetails,
      validRows,
    });
    handleResetFile();
    onClose();
  };

  const validCount = (summary?.createCount ?? 0) + (summary?.updateCount ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Bulk Inventory Import (CSV / Excel)
              </h3>
              <p className="text-xs text-neutral-400">
                Create new catalogue products or update stock quantities for existing SKUs in one upload.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close bulk import modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Download & Schema Guide Strip */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-neutral-200">
                Download a ready-to-use template matching the Product schema
              </p>
              <p className="text-[11px] text-neutral-400">
                Exported inventory CSVs from this screen are also directly re-importable after editing stock quantities.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => downloadInventoryTemplateXLSX(products)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => downloadInventoryTemplateCSV(products)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Template (.csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSchemaGuide((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>{showSchemaGuide ? 'Hide Schema' : 'Product Columns'}</span>
              </button>
            </div>
          </div>

          {/* Expandable Product Schema Reference */}
          {showSchemaGuide && (
            <div className="p-4 bg-neutral-950/90 border border-neutral-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Supported Product Schema Columns</span>
                <span className="text-[11px] text-neutral-400">
                  Existing SKUs only require <code className="text-amber-400">sku</code> +{' '}
                  <code className="text-amber-400">stock_quantity</code>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {PRODUCT_SCHEMA_COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <code className="font-mono font-bold text-amber-400">{col.label}</code>
                      {col.requiredForCreate ? (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">
                          Required
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium uppercase text-neutral-500">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 mt-1 leading-snug">{col.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Dropzone */}
          {!loadedSheet ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                void handleFileSelected(droppedFile);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-neutral-700 bg-neutral-950/60 hover:border-amber-500/60 hover:bg-neutral-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => void handleFileSelected(e.target.files?.[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-amber-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">
                Drop your CSV or Excel file here, or click to browse
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                Accepts <span className="font-mono text-neutral-300">.csv</span>,{' '}
                <span className="font-mono text-neutral-300">.xlsx</span>, and{' '}
                <span className="font-mono text-neutral-300">.xls</span> files
              </p>
            </div>
          ) : (
            <>
              {/* Loaded File Bar & Import Behavior Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Active File Card */}
                <div className="lg:col-span-5 p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                      Loaded File
                    </span>
                    <p className="text-sm font-bold text-white truncate mt-0.5">
                      {loadedSheet.fileName}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Sheet: {loadedSheet.sheetName} · {summary?.totalRows ?? 0} data rows
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFile}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Change File
                  </button>
                </div>

                {/* Stock Update Mode & Existing Product Options */}
                <div className="lg:col-span-7 p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-neutral-200">
                      Existing SKU Stock Behavior
                    </span>
                    <div className="inline-flex p-0.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
                      <button
                        type="button"
                        onClick={() => setStockMode('set_stock')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          stockMode === 'set_stock'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Set / Replace Quantity
                      </button>
                      <button
                        type="button"
                        onClick={() => setStockMode('add_stock')}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                          stockMode === 'add_stock'
                            ? 'bg-amber-500 text-neutral-950'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Add to Current Stock
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs text-neutral-300 cursor-pointer select-none pt-1 border-t border-neutral-800/80">
                    <input
                      type="checkbox"
                      checked={updateExistingDetails}
                      onChange={(e) => setUpdateExistingDetails(e.target.checked)}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span>
                      Also update product details (name, price, category, tax, reorder level, dietary) on matched SKUs
                    </span>
                  </label>
                </div>
              </div>

              {/* Validation Summary Metrics */}
              {summary && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setRowFilter('all')}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        rowFilter === 'all'
                          ? 'bg-neutral-800/90 border-amber-500/60'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-[11px] text-neutral-400 font-medium">Total Rows</span>
                      <p className="text-xl font-bold font-mono text-white tabular-nums mt-0.5">
                        {summary.totalRows}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRowFilter('create')}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        rowFilter === 'create'
                          ? 'bg-emerald-500/15 border-emerald-500/60'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> New Products
                      </span>
                      <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
                        {summary.createCount}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRowFilter('update')}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        rowFilter === 'update'
                          ? 'bg-sky-500/15 border-sky-500/60'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Stock Updates
                      </span>
                      <p className="text-xl font-bold font-mono text-sky-400 tabular-nums mt-0.5">
                        {summary.updateCount}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRowFilter('error')}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        rowFilter === 'error'
                          ? 'bg-red-500/15 border-red-500/60'
                          : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Validation Errors
                      </span>
                      <p className="text-xl font-bold font-mono text-red-400 tabular-nums mt-0.5">
                        {summary.errorCount}
                      </p>
                    </button>
                  </div>

                  {/* Auto-detected New Categories Notice */}
                  {summary.newCategories.length > 0 && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        New categories will be created automatically:{' '}
                        <strong className="text-white">{summary.newCategories.join(', ')}</strong>
                      </span>
                    </div>
                  )}

                  {/* Preview Table */}
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                    <div className="max-h-72 overflow-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-neutral-900 border-b border-neutral-800 text-[11px] uppercase tracking-wider text-neutral-400">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Row</th>
                            <th className="py-2.5 px-3 font-semibold">Action</th>
                            <th className="py-2.5 px-3 font-semibold">SKU / Barcode</th>
                            <th className="py-2.5 px-3 font-semibold">Product & Category</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Stock Change</th>
                            <th className="py-2.5 px-3 font-semibold">Schema Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/70">
                          {filteredRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-neutral-500">
                                No rows match this filter.
                              </td>
                            </tr>
                          ) : (
                            filteredRows.map((row) => (
                              <tr
                                key={`${row.rowNumber}-${row.rawSku}`}
                                className={
                                  row.action === 'error'
                                    ? 'bg-red-500/5'
                                    : 'hover:bg-neutral-900/60'
                                }
                              >
                                <td className="py-2.5 px-3 font-mono text-neutral-400 tabular-nums">
                                  #{row.rowNumber}
                                </td>
                                <td className="py-2.5 px-3">
                                  {row.action === 'create' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] uppercase">
                                      New Item
                                    </span>
                                  )}
                                  {row.action === 'update' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 font-bold text-[10px] uppercase">
                                      Update
                                    </span>
                                  )}
                                  {row.action === 'error' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-bold text-[10px] uppercase">
                                      Error
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-semibold text-white">
                                    {row.rawSku || '—'}
                                  </div>
                                  {row.rawBarcode && (
                                    <div className="font-mono text-[10px] text-neutral-500">
                                      {row.rawBarcode}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-neutral-200">
                                    {row.previewProduct?.name ||
                                      row.parsedFields.name ||
                                      row.matchedProduct?.name ||
                                      '—'}
                                  </div>
                                  <div className="text-[10px] text-neutral-400">
                                    {row.previewProduct?.category ||
                                      row.parsedFields.category ||
                                      row.matchedProduct?.category ||
                                      '—'}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-200">
                                  {row.previewProduct
                                    ? formatCurrency(
                                        row.previewProduct.price,
                                        settings.currency_symbol
                                      )
                                    : row.parsedFields.price !== undefined
                                    ? formatCurrency(
                                        row.parsedFields.price,
                                        settings.currency_symbol
                                      )
                                    : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                                  {row.action === 'create' ? (
                                    <span className="text-emerald-400 font-bold">
                                      +{row.nextStock ?? 0}
                                    </span>
                                  ) : row.action === 'update' ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className="text-neutral-400">
                                        {row.previousStock}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-neutral-500" />
                                      <span className="text-white font-bold">{row.nextStock}</span>
                                      {row.stockDelta !== undefined && row.stockDelta !== 0 && (
                                        <span
                                          className={`text-[10px] font-bold ${
                                            row.stockDelta > 0
                                              ? 'text-emerald-400'
                                              : 'text-red-400'
                                          }`}
                                        >
                                          ({row.stockDelta > 0 ? `+${row.stockDelta}` : row.stockDelta})
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-neutral-500">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 max-w-xs">
                                  {row.errors.length > 0 ? (
                                    <div className="text-red-400 text-[11px] space-y-0.5">
                                      {row.errors.map((err, i) => (
                                        <div key={i}>{err}</div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-emerald-400 text-[11px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                      <span>
                                        {row.warnings.length > 0
                                          ? row.warnings.join(' ')
                                          : 'Valid Product schema'}
                                      </span>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {parseError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-neutral-400">
            {summary ? (
              summary.errorCount > 0 ? (
                <span>
                  <strong className="text-amber-400">{summary.errorCount}</strong> invalid{' '}
                  {summary.errorCount === 1 ? 'row' : 'rows'} will be skipped.{' '}
                  <strong className="text-white">{validCount}</strong> valid{' '}
                  {validCount === 1 ? 'row' : 'rows'} ready to apply.
                </span>
              ) : (
                <span>
                  All <strong className="text-emerald-400">{validCount}</strong> rows passed{' '}
                  <code className="text-neutral-200">Product</code> schema validation.
                </span>
              )
            ) : (
              <span>Upload a CSV or Excel workbook to preview and validate changes.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!summary || validCount === 0}
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>
                {summary && validCount > 0
                  ? `Apply Import (${summary.createCount} New, ${summary.updateCount} Updates)`
                  : 'Apply Import'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
