import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  AlertTriangle,
} from 'lucide-react';

export interface SubTabOption {
  id: string;
  label: string;
}

interface ModulePageHeaderProps {
  title: string;
  subtitle: string;
  contextLabel?: string;
  tabs?: SubTabOption[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: React.ReactNode;
}

export const ModulePageHeader: React.FC<ModulePageHeaderProps> = ({
  title,
  subtitle,
  contextLabel,
  tabs,
  activeTab,
  onTabChange,
  actions,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          {contextLabel && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A7418] mb-1 truncate">
              {contextLabel}
            </p>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-[#0B1F3A] tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {tabs && tabs.length > 0 && onTabChange && (
        <div className="px-4 bg-[#F8FAFC] border-t border-slate-200/80 flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[#C9A227] text-[#0B1F3A] bg-white'
                    : 'border-transparent text-slate-500 hover:text-[#0B1F3A] hover:bg-slate-100/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface EnterpriseMetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'navy' | 'gold' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
  actionLabel?: string;
}

export const EnterpriseMetricCard: React.FC<EnterpriseMetricCardProps> = ({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'navy',
  onClick,
  actionLabel,
}) => {
  const iconToneMap: Record<NonNullable<EnterpriseMetricCardProps['tone']>, string> = {
    navy: 'bg-[#0B1F3A]/6 text-[#0B1F3A] border-[#0B1F3A]/10',
    gold: 'bg-[#D4AF37]/15 text-[#8A6712] border-[#D4AF37]/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between hover:border-[#C9A227]/60 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-[#0B1F3A] tracking-tight tabular-nums mt-1">
            {value}
          </p>
          {detail && (
            <p className="text-[11px] text-slate-500 mt-1 truncate">{detail}</p>
          )}
        </div>
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${iconToneMap[tone]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {onClick && actionLabel && (
        <button
          type="button"
          onClick={onClick}
          className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0B1F3A] hover:text-[#9A7418] transition-colors cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export interface TableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  exportValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

interface EnterpriseDataTableProps<T> {
  title?: string;
  subtitle?: string;
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  emptyMessage?: string;
  toolbarRight?: React.ReactNode;
  pageSize?: number;
  exportFileName?: string;
}

export function EnterpriseDataTable<T>({
  title,
  subtitle,
  columns,
  data,
  rowKey,
  searchPlaceholder = 'Filter records...',
  searchFilter,
  emptyMessage = 'No matching records found.',
  toolbarRight,
  pageSize = 8,
  exportFileName,
}: EnterpriseDataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = data;
    if (q && searchFilter) {
      list = data.filter((row) => searchFilter(row, q));
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col?.sortValue) {
        const getter = col.sortValue;
        list = [...list].sort((a, b) => {
          const av = getter(a);
          const bv = getter(b);
          if (typeof av === 'number' && typeof bv === 'number') {
            return sortDir === 'asc' ? av - bv : bv - av;
          }
          return sortDir === 'asc'
            ? String(av).localeCompare(String(bv))
            : String(bv).localeCompare(String(av));
        });
      }
    }
    return list;
  }, [data, query, searchFilter, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const exportableCols = columns.filter((c) => c.exportValue || c.sortValue);
    const rows = filtered.map((row) => {
      const obj: Record<string, string | number> = {};
      if (exportableCols.length > 0) {
        exportableCols.forEach((col) => {
          obj[col.header] = col.exportValue
            ? col.exportValue(row)
            : col.sortValue
            ? col.sortValue(row)
            : '';
        });
      } else {
        Object.entries(row as Record<string, unknown>).forEach(([k, v]) => {
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            obj[k] = String(v);
          }
        });
      }
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const baseName = (exportFileName || title || 'erp_export')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .toLowerCase();

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Records');
      XLSX.writeFile(wb, `${baseName}.xlsx`);
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${baseName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
      {(title || searchFilter || toolbarRight || exportFileName) && (
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className="text-sm font-bold text-[#0B1F3A] tracking-tight">{title}</h2>
            )}
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchFilter && (
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A] focus:bg-white transition-colors"
                />
              </div>
            )}
            {exportFileName && filtered.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-[#9A7418]" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('xlsx')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0B1F3A] bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-[#8A6712]" />
                  <span>Excel</span>
                </button>
              </>
            )}
            {toolbarRight}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 whitespace-nowrap ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.sortable && col.sortValue ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A] cursor-pointer"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-xs text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="hover:bg-[#F8FAFC] transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${
                        col.align === 'right'
                          ? 'text-right tabular-nums'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 bg-[#F8FAFC] flex items-center justify-between text-[11px] text-slate-500">
          <span className="tabular-nums">
            Showing {(safePage - 1) * pageSize + 1}–
            {Math.min(safePage * pageSize, filtered.length)} of {filtered.length} records
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A] disabled:opacity-40 cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-semibold text-[#0B1F3A] tabular-nums">
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:text-[#0B1F3A] disabled:opacity-40 cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface EnterpriseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const EnterpriseFormModal: React.FC<EnterpriseFormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1F3A]/50 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white rounded-xl ${maxWidthClass} w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden`}
      >
        <div className="px-5 py-4 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0">
          <div>
            <h3 className="text-sm font-bold tracking-tight">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-300 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

interface EnterpriseConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'warning' | 'navy';
  onConfirm: () => void;
  onCancel: () => void;
}

export const EnterpriseConfirmDialog: React.FC<EnterpriseConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmStyle =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : tone === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-[#0B1F3A] hover:bg-[#132E54] text-white';

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0B1F3A]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              tone === 'danger'
                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                : tone === 'warning'
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-[#0B1F3A]/10 text-[#0B1F3A] border border-[#0B1F3A]/20'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0B1F3A]">{title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="px-5 py-3 bg-[#F8FAFC] border-t border-slate-200/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${confirmStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
