import React, { useState, useMemo } from 'react';
import { Customer, Sale, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { checkRelievingDate } from '../utils/customerRelieving';
import {
  exportCustomersToExcel,
  exportCustomersToWord,
  exportCustomersToPDF,
} from '../utils/documentExport';
import { StudentExcelImportModal } from './StudentExcelImportModal';
import {
  Users,
  Search,
  UserPlus,
  Award,
  TrendingUp,
  CreditCard,
  Edit,
  Trash2,
  UserX,
  UserCheck,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldAlert,
  History,
  X,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  FileText,
  Download,
} from 'lucide-react';

interface CustomerDashboardProps {
  customers: Customer[];
  sales: Sale[];
  settings: StoreSettings;
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onToggleDisableCustomer?: (customerId: string, newDisabled: boolean) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onImportStudents?: (newStudents: Customer[]) => void;
  onSelectReceipt: (sale: Sale) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  customers,
  sales,
  settings,
  onOpenAddCustomer,
  onEditCustomer,
  onToggleDisableCustomer,
  onDeleteCustomer,
  onImportStudents,
  onSelectReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Active' | 'Disabled' | 'Relieved'>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [inspectedCustomerId, setInspectedCustomerId] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Deletion Confirmation Dialog State
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Relieving Date Bulk Action Modal State
  const [isBulkDisableModalOpen, setIsBulkDisableModalOpen] = useState(false);

  // Calculate Relieving Date Analysis for each customer
  const enrichedCustomers = useMemo(() => {
    return customers.map((c) => {
      const relieving = checkRelievingDate(c);
      return {
        ...c,
        relievingInfo: relieving,
      };
    });
  }, [customers]);

  // Customers whose relieving date has passed but are not yet disabled
  const pendingRelievedCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => c.relievingInfo.isPastRelieving && !c.is_disabled);
  }, [enrichedCustomers]);

  // Customers approaching relieving date (next 30 days)
  const approachingRelievedCustomers = useMemo(() => {
    return enrichedCustomers.filter((c) => c.relievingInfo.isApproachingRelieving && !c.is_disabled);
  }, [enrichedCustomers]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedCustomers.filter((c) => {
      const matchTier = selectedTier === 'All' || c.tier === selectedTier;
      const matchType = selectedType === 'All' || (c.account_type || 'student') === selectedType;
      
      let matchStatus = true;
      if (selectedStatus === 'Active') {
        matchStatus = !c.is_disabled && !c.relievingInfo.isPastRelieving;
      } else if (selectedStatus === 'Disabled') {
        matchStatus = Boolean(c.is_disabled);
      } else if (selectedStatus === 'Relieved') {
        matchStatus = c.relievingInfo.isPastRelieving;
      }

      const matchQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.student_id && c.student_id.toLowerCase().includes(q)) ||
        (c.grade_section && c.grade_section.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q));

      return matchTier && matchType && matchStatus && matchQuery;
    });
  }, [enrichedCustomers, searchQuery, selectedTier, selectedStatus, selectedType]);

  // Aggregate Metrics
  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => !c.is_disabled).length;
  const disabledCount = customers.filter((c) => c.is_disabled).length;
  const totalWalletLiability = customers.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);
  const totalCustomerSpend = customers.reduce((sum, c) => sum + c.total_spent, 0);

  // Inspected Customer Details & History
  const inspectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === inspectedCustomerId);
  }, [customers, inspectedCustomerId]);

  const customerSales = useMemo(() => {
    if (!inspectedCustomer) return [];
    return sales.filter(
      (s) =>
        s.customer_id === inspectedCustomer.id ||
        (s.customer_phone && s.customer_phone === inspectedCustomer.phone)
    );
  }, [sales, inspectedCustomer]);

  const handleBulkDisableRelieved = () => {
    if (!onToggleDisableCustomer) return;
    pendingRelievedCustomers.forEach((c) => {
      onToggleDisableCustomer(c.id, true);
    });
    setIsBulkDisableModalOpen(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Header & Metrics Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Student & Customer Management</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {totalCustomers} Profiles
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage student admission records, joining & relieving schedules, prepaid canteen wallets, dietary safety, and account access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl transition-colors shadow-sm"
            title="Import student roster, joining dates & relieving schedules from Excel (.xlsx/.csv)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Excel</span>
          </button>

          {/* Export Toolbar */}
          <button
            type="button"
            onClick={() => exportCustomersToExcel(filteredCustomers, settings)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors shadow-sm"
            title="Download student & staff directory as Excel workbook"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => exportCustomersToWord(filteredCustomers, settings)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors shadow-sm"
            title="Download student & staff directory as Word document"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Word</span>
          </button>

          <button
            type="button"
            onClick={() => exportCustomersToPDF(filteredCustomers, settings)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors shadow-sm"
            title="Generate high-resolution printable PDF directory"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* RELIEVING DATE NOTIFICATION BANNER / ACTION CENTER */}
      {pendingRelievedCustomers.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300">
                  Relieving Date Reached Notification: {pendingRelievedCustomers.length} Account(s) Expired
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                The scheduled relieving date for {pendingRelievedCustomers.length} student/staff account(s) has arrived or passed (e.g.{' '}
                <b>{pendingRelievedCustomers.map((c) => c.name).slice(0, 3).join(', ')}</b>
                {pendingRelievedCustomers.length > 3 ? ` and ${pendingRelievedCustomers.length - 3} others` : ''}). School canteen protocol mandates disabling relieved accounts to prevent unauthorized cafeteria charges and wallet overdrafts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setSelectedStatus('Relieved')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 transition-colors"
            >
              Filter List
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDisableModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow"
            >
              Disable All Relieved ({pendingRelievedCustomers.length})
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Active Students & Staff</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-bold font-mono text-white tabular-nums">{activeCount}</p>
            <span className="text-xs text-neutral-500 font-mono">/ {totalCustomers} total</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {disabledCount} disabled / relieved accounts
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Prepaid Wallet Float</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(totalWalletLiability, settings.currency_symbol)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Held across student canteen cards</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Relieving Date Alerts</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              {pendingRelievedCustomers.length}
            </p>
            <span className="text-xs text-neutral-400">past due</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {approachingRelievedCustomers.length} due within 30 days
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Total Lifetime Spend</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {formatCurrency(totalCustomerSpend, settings.currency_symbol)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Cumulative cafeteria sales</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, ID, class/grade, phone..."
            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(['All', 'Active', 'Disabled', 'Relieved'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedStatus === status
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {status === 'Relieved' ? 'Relieving Due' : status}
              </button>
            ))}
          </div>

          {/* Account Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Account Types</option>
            <option value="student">Students</option>
            <option value="staff">Faculty / Staff</option>
            <option value="visitor">Visitors</option>
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 py-1.5 px-2.5 rounded-xl focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Loyalty Tiers</option>
            <option value="Platinum">Platinum</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Bronze">Bronze</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Student / Staff Profile</th>
                <th className="py-3 px-4">Admission & Class</th>
                <th className="py-3 px-4">Joining & Relieving Schedule</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Canteen Wallet</th>
                <th className="py-3 px-4">Allergen Safety</th>
                <th className="py-3 px-4 text-right">Orders / Spent</th>
                <th className="py-3 px-4 text-right min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No student or staff profiles found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const rel = cust.relievingInfo;
                  const isRelievedNotDisabled = rel.isPastRelieving && !cust.is_disabled;

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-neutral-850 transition-colors group cursor-pointer ${
                        cust.is_disabled
                          ? 'bg-red-950/10 opacity-75'
                          : isRelievedNotDisabled
                          ? 'bg-amber-950/20'
                          : ''
                      }`}
                      onClick={() => setInspectedCustomerId(cust.id)}
                    >
                      {/* Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-100 text-sm">{cust.name}</span>
                            {cust.account_type && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-bold bg-neutral-800 text-neutral-400">
                                {cust.account_type}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                            <span>{cust.phone}</span>
                            {cust.parent_name && (
                              <>
                                <span>·</span>
                                <span className="text-neutral-500 truncate max-w-[130px]">{cust.parent_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Admission & Class */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-amber-300">{cust.student_id || '—'}</div>
                        <div className="text-[11px] text-neutral-400">{cust.grade_section || '—'}</div>
                      </td>

                      {/* Joining & Relieving Schedule */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-neutral-300 flex items-center gap-1">
                          <span className="text-neutral-500 font-sans text-[10px]">Joined:</span>
                          <span>{cust.joining_date || cust.member_since}</span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className="text-neutral-500 font-sans text-[10px]">Relieving:</span>
                          {cust.relieving_date ? (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] border font-bold ${rel.statusBadgeColor}`}
                            >
                              {cust.relieving_date} ({rel.statusLabel})
                            </span>
                          ) : (
                            <span className="text-neutral-500">Not Scheduled</span>
                          )}
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        {cust.is_disabled ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                              <ShieldAlert className="w-3 h-3" />
                              <span>DISABLED</span>
                            </span>
                            {cust.disabled_reason && (
                              <span className="block text-[10px] text-neutral-400 mt-0.5 truncate max-w-[150px]">
                                {cust.disabled_reason}
                              </span>
                            )}
                          </div>
                        ) : isRelievedNotDisabled ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="w-3 h-3" />
                              <span>RELIEVED (ACTION REQ)</span>
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      {/* Canteen Wallet */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {formatCurrency(cust.wallet_balance || 0, settings.currency_symbol)}
                      </td>

                      {/* Allergen Warning */}
                      <td className="py-3.5 px-4">
                        {cust.allergens && cust.allergens !== 'None' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                            ⚠️ {cust.allergens}
                          </span>
                        ) : (
                          <span className="text-[11px] text-neutral-500 font-mono">None</span>
                        )}
                      </td>

                      {/* Orders / Spent */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <div className="font-semibold text-neutral-100">
                          {formatCurrency(cust.total_spent, settings.currency_symbol)}
                        </div>
                        <div className="text-[11px] text-neutral-400">{cust.visit_count} orders</div>
                      </td>

                      {/* Actions: Edit, Disable/Enable, Delete, History */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => onEditCustomer(cust)}
                            className="p-1.5 text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Edit student profile & dates"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Disable / Enable Toggle Button */}
                          {onToggleDisableCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextState = !cust.is_disabled;
                                onToggleDisableCustomer(cust.id, nextState);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${
                                cust.is_disabled
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                              }`}
                              title={
                                cust.is_disabled
                                  ? 'Re-activate student canteen access'
                                  : 'Disable student canteen card'
                              }
                            >
                              {cust.is_disabled ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <UserX className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete Button */}
                          {onDeleteCustomer && (
                            <button
                              type="button"
                              onClick={() => setDeletingCustomer(cust)}
                              className="p-1.5 text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors"
                              title="Delete student profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* History Ledger Button */}
                          <button
                            type="button"
                            onClick={() => setInspectedCustomerId(cust.id)}
                            className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center gap-1"
                            title="View purchase history"
                          >
                            <History className="w-3 h-3" />
                            <span>Ledger</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCustomer(null);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Customer Profile</h3>
                <span className="text-xs text-neutral-400">This action cannot be undone</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Are you sure you want to permanently delete the profile for{' '}
              <b className="text-white">{deletingCustomer.name}</b> (Admission ID:{' '}
              <span className="font-mono text-amber-300">{deletingCustomer.student_id || 'N/A'}</span>)?
              {deletingCustomer.wallet_balance && deletingCustomer.wallet_balance > 0 ? (
                <span className="block mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 font-semibold">
                  ⚠️ Warning: This account has a remaining prepaid wallet balance of{' '}
                  {formatCurrency(deletingCustomer.wallet_balance, settings.currency_symbol)}.
                </span>
              ) : null}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteCustomer && deletingCustomer) {
                    onDeleteCustomer(deletingCustomer.id);
                  }
                  setDeletingCustomer(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BULK DISABLE RELIEVED ACCOUNTS */}
      {isBulkDisableModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkDisableModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Disable All Relieved Student Accounts</h3>
                <span className="text-xs text-neutral-400">Enforce school canteen compliance</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              You are about to disable <b className="text-white">{pendingRelievedCustomers.length} student account(s)</b> whose relieving date has already passed. Once disabled, they will not be permitted to make cafeteria purchases or deduct canteen wallet balance.
            </p>

            <div className="max-h-48 overflow-y-auto bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
              {pendingRelievedCustomers.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs py-1 border-b border-neutral-850 last:border-0">
                  <div>
                    <span className="font-semibold text-neutral-200">{c.name}</span>
                    <span className="text-[10px] text-neutral-400 block font-mono">{c.student_id} · {c.grade_section}</span>
                  </div>
                  <div className="text-right font-mono text-[11px] text-red-400">
                    Relieved on {c.relieving_date}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setIsBulkDisableModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDisableRelieved}
                className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
              >
                Disable {pendingRelievedCustomers.length} Accounts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal Drawer */}
      {inspectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setInspectedCustomerId(null);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-neutral-950/80">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                  Student Account & Purchase Ledger
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-lg font-bold text-white">{inspectedCustomer.name}</h3>
                  {inspectedCustomer.is_disabled ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      Disabled
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-1">
                  <span>{inspectedCustomer.student_id || inspectedCustomer.phone}</span>
                  {inspectedCustomer.grade_section && (
                    <>
                      <span>·</span>
                      <span>{inspectedCustomer.grade_section}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="text-amber-300 font-bold">{inspectedCustomer.tier} Member</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cust = inspectedCustomer;
                    setInspectedCustomerId(null);
                    onEditCustomer(cust);
                  }}
                  className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => setInspectedCustomerId(null)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick stats for this customer */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-950/40 border-b border-neutral-800 text-xs">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <span className="text-neutral-500">Canteen Wallet</span>
                <p className="font-mono font-bold text-base text-emerald-400 mt-1">
                  {formatCurrency(inspectedCustomer.wallet_balance || 0, settings.currency_symbol)}
                </p>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <span className="text-neutral-500">Lifetime Spend</span>
                <p className="font-mono font-bold text-base text-white mt-1">
                  {formatCurrency(inspectedCustomer.total_spent, settings.currency_symbol)}
                </p>
              </div>

              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                <span className="text-neutral-500">Relieving Date</span>
                <p className="font-mono font-bold text-xs text-amber-300 mt-1">
                  {inspectedCustomer.relieving_date || 'Not Set'}
                </p>
              </div>
            </div>

            {/* Past Invoices / Sales List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block">
                Canteen Invoices & Orders ({customerSales.length})
              </span>

              {customerSales.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 text-xs">
                  No orders recorded for this account yet.
                </div>
              ) : (
                customerSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">
                          {sale.receipt_number}
                        </span>
                        {sale.token_number && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300">
                            TOKEN #{sale.token_number}
                          </span>
                        )}
                        <span className="text-neutral-500 text-[11px]">
                          {formatDateTime(sale.created_at)}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1">
                        {sale.items.length} item(s) · {sale.payment_method.toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-neutral-100">
                        {formatCurrency(sale.total_amount, settings.currency_symbol)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectReceipt(sale)}
                        className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* STUDENT EXCEL IMPORT MODAL */}
      <StudentExcelImportModal
        existingCustomers={customers}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportStudents={(imported) => {
          if (onImportStudents) {
            onImportStudents(imported);
          }
        }}
      />
    </div>
  );
};
