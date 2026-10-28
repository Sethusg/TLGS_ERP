import React, { useState, useMemo } from 'react';
import {
  ShiftSession,
  Sale,
  PosUser,
  StoreSettings,
  Product,
  InventoryMovement,
} from '../../types/pos';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  Calendar,
  UserCheck,
  CheckSquare,
  Square,
  Lock,
  ExternalLink,
  Palette,
  Users,
  FileText,
  Download,
  Shield,
} from 'lucide-react';
import { PosThemeSettings } from '../../types/pos';
import { AppearanceSettingsView } from './AppearanceSettingsView';
import { RoleManagementModule } from './RoleManagementModule';
import {
  exportUsersToExcel,
  exportUsersToWord,
  exportUsersToPDF,
} from '../../utils/documentExport';

interface DjangoAdminPortalProps {
  currentUser: PosUser;
  settings: StoreSettings;
  shifts: ShiftSession[];
  sales: Sale[];
  products: Product[];
  movements: InventoryMovement[];
  users: PosUser[];
  currentTheme: PosThemeSettings;
  onThemeSaved: (updatedTheme: PosThemeSettings) => void;
  onUpdateShift: (updatedShift: ShiftSession) => void;
  onNavigateToTab: (tab: any) => void;
}

type AdminModel =
  | 'register_closings'
  | 'appearance'
  | 'sales'
  | 'products'
  | 'movements'
  | 'users'
  | 'roles';

export const DjangoAdminPortal: React.FC<DjangoAdminPortalProps> = ({
  currentUser,
  settings,
  shifts,
  sales,
  products,
  movements,
  users,
  currentTheme,
  onThemeSaved,
  onUpdateShift,
  onNavigateToTab,
}) => {
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'admin';

  // Navigation state within Django admin
  const [selectedModel, setSelectedModel] = useState<AdminModel>('register_closings');
  const [activeClosingDetail, setActiveClosingDetail] = useState<ShiftSession | null>(null);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cashierFilter, setCashierFilter] = useState<string>('all');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>('all'); // all, matched, shortage, overage
  const [dateFilter, setDateFilter] = useState<string>('all'); // all, today, past7, month
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Users model states
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userStatusFilter === 'active' && !u.isActive) return false;
      if (userStatusFilter === 'disabled' && u.isActive) return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchUser = u.username.toLowerCase().includes(q);
        const matchEmpId = (u.employeeId || '').toLowerCase().includes(q);
        return matchName || matchUser || matchEmpId;
      }
      return true;
    });
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = s.id.toLowerCase().includes(q);
        const matchCashier = s.cashierFullName.toLowerCase().includes(q) || s.cashierUsername.toLowerCase().includes(q);
        const matchNotes = (s.closingNotes || '').toLowerCase().includes(q);
        if (!matchId && !matchCashier && !matchNotes) return false;
      }

      // Cashier
      if (cashierFilter !== 'all' && s.cashierUsername !== cashierFilter) {
        return false;
      }

      // Discrepancy
      if (discrepancyFilter === 'matched') {
        if ((s.cashDifference ?? 0) !== 0) return false;
      } else if (discrepancyFilter === 'shortage') {
        if ((s.cashDifference ?? 0) >= 0) return false;
      } else if (discrepancyFilter === 'overage') {
        if ((s.cashDifference ?? 0) <= 0) return false;
      }

      // Date
      if (dateFilter !== 'all') {
        const shiftDate = new Date(s.closedAt || s.openedAt);
        const now = new Date();
        if (dateFilter === 'today') {
          if (shiftDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'past7') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (shiftDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'month') {
          if (shiftDate.getMonth() !== now.getMonth() || shiftDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [shifts, searchQuery, cashierFilter, discrepancyFilter, dateFilter]);

  // Handle multi-select checkboxes
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredShifts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredShifts.map((s) => s.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Manager Verification action
  const handleVerifyShift = (shift: ShiftSession) => {
    const updated: ShiftSession = {
      ...shift,
      verifiedBy: currentUser.fullName,
      verifiedAt: new Date().toISOString(),
    };
    onUpdateShift(updated);
    setActiveClosingDetail(updated);
    setActionSuccessMsg(`Register Closing ${shift.id} successfully verified by Manager ${currentUser.fullName}.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // CSV export
  const handleExportCsv = () => {
    const listToExport = selectedIds.length > 0
      ? filteredShifts.filter((s) => selectedIds.includes(s.id))
      : filteredShifts;

    const headers = [
      'Shift ID',
      'Cashier',
      'Opened At',
      'Closed At',
      'Opening Cash',
      'Actual Cash',
      'Expected Cash',
      'Cash Difference',
      'Actual Total',
      'Total Difference',
      'Sales Count',
      'Total Sales',
      'Status',
      'Verified By',
    ];

    const rows = listToExport.map((s) => [
      s.id,
      s.cashierFullName,
      s.openedAt,
      s.closedAt || '',
      s.openingCash,
      s.actualCash ?? 0,
      s.expectedCash ?? 0,
      s.cashDifference ?? 0,
      s.actualTotal ?? 0,
      s.totalDifference ?? 0,
      s.salesCount,
      s.totalSalesAmount,
      s.verifiedBy ? 'Verified' : s.status,
      s.verifiedBy || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `django_admin_register_closings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionSuccessMsg(`Successfully exported ${listToExport.length} register closing records to CSV.`);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Permission Barrier for Cashiers
  if (!isManagerOrAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-neutral-900 border border-red-500/30 rounded-2xl text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Django Administration — Access Restricted
        </h2>
        <p className="text-sm text-neutral-300 leading-relaxed mb-6">
          Access to Register Closing records in Django Admin is restricted to{' '}
          <strong className="text-amber-400">Managers</strong> and{' '}
          <strong className="text-amber-400">Administrators</strong>. Your current role is{' '}
          <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
            {currentUser.role}
          </span>
          .
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab('pos')}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-semibold rounded-xl border border-neutral-700 transition-colors"
          >
            Return to POS Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#333333] font-sans antialiased text-sm">
      {/* 1. DJANGO ADMIN BRANDED TOP HEADER (#417690 classic Django admin color) */}
      <div className="bg-[#417690] text-white shadow-md">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Django administration</span>
                <span className="text-xs bg-[#2b566b] text-[#c4dce8] px-2 py-0.5 rounded font-mono font-normal">
                  v5.1 (Production)
                </span>
              </span>
              <span className="text-xs text-[#c4dce8] tracking-wide font-medium">
                {settings.store_name} — Secure Register Closing Control Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="text-[#e2eff7]">
              WELCOME, <strong className="text-white uppercase">{currentUser.fullName}</strong> ({currentUser.role.toUpperCase()})
            </span>
            <span className="text-[#7ea6ba]">/</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('pos')}
              className="text-[#e2eff7] hover:text-white underline flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>VIEW POS TERMINAL</span>
            </button>
            <span className="text-[#7ea6ba]">/</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('shifts')}
              className="text-[#e2eff7] hover:text-white underline cursor-pointer"
            >
              TERMINAL SHIFTS
            </button>
          </div>
        </div>
      </div>

      {/* 2. DJANGO MODELS SUBNAV & BREADCRUMBS BAR */}
      <div className="bg-[#f0f3f5] border-b border-[#d8dde1] px-6 py-2.5">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#555]">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveClosingDetail(null);
                setSelectedModel('register_closings');
              }}
              className="text-[#417690] hover:underline font-semibold"
            >
              Home
            </button>
            <span>›</span>
            <span className="text-[#333] font-semibold">Point of Sale</span>
            <span>›</span>
            {selectedModel === 'appearance' ? (
              <span className="font-semibold text-[#222]">Appearance & Theme Settings</span>
            ) : activeClosingDetail ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveClosingDetail(null)}
                  className="text-[#417690] hover:underline font-semibold"
                >
                  Register closings
                </button>
                <span>›</span>
                <span className="font-mono text-[#666]">{activeClosingDetail.id}</span>
              </>
            ) : (
              <span className="font-semibold text-[#222]">
                {selectedModel === 'register_closings' && 'Register closings'}
                {selectedModel === 'sales' && 'Sales transactions'}
                {selectedModel === 'products' && 'Products'}
                {selectedModel === 'movements' && 'Stock movements'}
                {selectedModel === 'users' && 'Users'}
              </span>
            )}
          </div>

          {/* Model navigation tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActiveClosingDetail(null);
                setSelectedModel('register_closings');
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                selectedModel === 'register_closings'
                  ? 'bg-[#417690] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e4e7e9] text-[#333] border border-[#ccc]'
              }`}
            >
              Register Closings
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveClosingDetail(null);
                setSelectedModel('appearance');
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedModel === 'appearance'
                  ? 'bg-[#205067] text-white shadow-xs ring-1 ring-white/40'
                  : 'bg-[#fff8e1] hover:bg-[#ffecb3] text-[#b78103] border border-[#ffe082]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Appearance & Theme Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveClosingDetail(null);
                setSelectedModel('users');
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedModel === 'users'
                  ? 'bg-[#417690] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e4e7e9] text-[#333] border border-[#ccc]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff & Operators</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveClosingDetail(null);
                setSelectedModel('roles');
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedModel === 'roles'
                  ? 'bg-[#417690] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e4e7e9] text-[#333] border border-[#ccc]'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Roles & Permissions</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('pos')}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-white hover:bg-[#e4e7e9] text-[#333] border border-[#ccc] transition-colors cursor-pointer"
            >
              Open POS
            </button>
          </div>
        </div>
      </div>

      {/* SUCCESS BANNER NOTIFICATION */}
      {actionSuccessMsg && (
        <div className="max-w-[1600px] mx-auto mx-6 mt-3 px-4 py-2.5 bg-[#dfd] border border-[#a3d7a3] text-[#2d662d] rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#2d662d]" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMsg(null)}
            className="text-[#2d662d] hover:underline text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-[1600px] mx-auto p-6">
        {/* If viewing Appearance & Theme Settings */}
        {selectedModel === 'appearance' ? (
          <AppearanceSettingsView
            currentUser={currentUser}
            currentTheme={currentTheme}
            onThemeSaved={(saved) => {
              onThemeSaved(saved);
              setActionSuccessMsg('POS Theme settings successfully saved to database.');
              setTimeout(() => setActionSuccessMsg(null), 4000);
            }}
          />
        ) : selectedModel === 'roles' ? (
          <RoleManagementModule currentUser={currentUser} users={users} />
        ) : selectedModel === 'users' ? (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded border border-[#ccc] shadow-xs">
              <div>
                <h1 className="text-lg font-bold text-[#333] tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#417690]" />
                  <span>Authorized Staff & POS Operator Registry</span>
                </h1>
                <p className="text-xs text-[#666]">
                  Displaying {filteredUsers.length} of {users.length} total staff accounts (Cashiers, Managers & System Administrators)
                </p>
              </div>

              {/* Universal Export Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportUsersToExcel(filteredUsers, settings)}
                  className="px-3 py-1.5 bg-[#205067] hover:bg-[#183d4f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Export staff users list to Excel spreadsheet (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportUsersToWord(filteredUsers, settings)}
                  className="px-3 py-1.5 bg-[#417690] hover:bg-[#325c70] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Export staff users list to Word document (.doc)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word (.doc)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportUsersToPDF(filteredUsers, settings)}
                  className="px-3 py-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="Export high-resolution printable PDF of staff registry"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Document</span>
                </button>
              </div>
            </div>

            {/* Layout: Main Table + Right Filter Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              <div className="lg:col-span-3 space-y-4">
                {/* Search Bar */}
                <div className="bg-[#f8f9fa] border border-[#ccc] p-3 rounded flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 text-[#888] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search employee ID, name, username..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#ccc] rounded text-xs text-[#333] focus:outline-hidden focus:border-[#417690]"
                      />
                    </div>
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery('')}
                        className="text-xs text-[#ba2121] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-[#777]">
                    Showing {filteredUsers.length} staff records
                  </span>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#ccc] rounded shadow-xs overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#417690] text-white uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3">EMPLOYEE ID</th>
                        <th className="p-3">FULL NAME</th>
                        <th className="p-3">USERNAME</th>
                        <th className="p-3">ROLE & PERMISSIONS</th>
                        <th className="p-3 text-center">ACCOUNT STATUS</th>
                        <th className="p-3">CREATED AT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee]">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-[#777] italic">
                            No staff users match the search query or role filter.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => (
                          <tr
                            key={u.id}
                            className={`transition-colors ${
                              idx % 2 === 0 ? 'bg-white hover:bg-[#f6f8f9]' : 'bg-[#fafafa] hover:bg-[#f6f8f9]'
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-[#417690]">
                              {u.employeeId || `EMP-${u.id.slice(-4)}`}
                            </td>
                            <td className="p-3 text-[#222] font-semibold">
                              {u.fullName}
                              {u.id === currentUser.id && (
                                <span className="ml-1.5 text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[#555]">
                              @{u.username}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.role === 'admin'
                                    ? 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                                    : u.role === 'manager'
                                    ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]'
                                    : 'bg-[#e3f2fd] text-[#1565c0] border border-[#bbdefb]'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  u.isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {u.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="p-3 text-[#777] font-mono text-[11px]">
                              {u.createdAt ? formatDateTime(u.createdAt) : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Django Right Filter Sidebar */}
              <div className="bg-[#f8f9fa] border border-[#ccc] rounded p-4 space-y-4">
                <h3 className="font-bold text-xs text-[#333] border-b border-[#ddd] pb-2 uppercase tracking-wide">
                  Filter Users
                </h3>

                {/* Filter: By Role */}
                <div>
                  <h4 className="font-bold text-[11px] text-[#333] mb-1.5 uppercase">
                    By Role
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('all')}
                        className={`hover:underline ${userRoleFilter === 'all' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        All ({users.length})
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('admin')}
                        className={`hover:underline ${userRoleFilter === 'admin' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        Administrators ({users.filter((u) => u.role === 'admin').length})
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('manager')}
                        className={`hover:underline ${userRoleFilter === 'manager' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        Managers ({users.filter((u) => u.role === 'manager').length})
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserRoleFilter('cashier')}
                        className={`hover:underline ${userRoleFilter === 'cashier' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        Cashiers ({users.filter((u) => u.role === 'cashier').length})
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Filter: By Status */}
                <div className="border-t border-[#eee] pt-3">
                  <h4 className="font-bold text-[11px] text-[#333] mb-1.5 uppercase">
                    By Account Status
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserStatusFilter('all')}
                        className={`hover:underline ${userStatusFilter === 'all' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        All Statuses
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserStatusFilter('active')}
                        className={`hover:underline ${userStatusFilter === 'active' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        Active ({users.filter((u) => u.isActive).length})
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setUserStatusFilter('disabled')}
                        className={`hover:underline ${userStatusFilter === 'disabled' ? 'font-bold text-[#417690]' : 'text-[#666]'}`}
                      >
                        Disabled ({users.filter((u) => !u.isActive).length})
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : activeClosingDetail ? (
          <div className="bg-white border border-[#ccc] rounded shadow-sm">
            {/* Form Top Bar */}
            <div className="px-6 py-4 border-b border-[#e5e5e5] flex flex-wrap items-center justify-between gap-3 bg-[#fdfdfd]">
              <div>
                <button
                  type="button"
                  onClick={() => setActiveClosingDetail(null)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#417690] hover:underline font-semibold mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Register Closings List</span>
                </button>
                <h1 className="text-lg font-bold text-[#333] flex items-center gap-3">
                  <span>Change register closing: {activeClosingDetail.id}</span>
                  {activeClosingDetail.verifiedBy ? (
                    <span className="text-xs bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7] px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      Verified by {activeClosingDetail.verifiedBy}
                    </span>
                  ) : (
                    <span className="text-xs bg-[#fff3e0] text-[#e65100] border border-[#ffcc80] px-2 py-0.5 rounded font-medium">
                      Pending Manager Verification
                    </span>
                  )}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#f0f3f5] hover:bg-[#e4e7e9] text-[#333] border border-[#ccc] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Shift Z-Report</span>
                </button>

                {!activeClosingDetail.verifiedBy && (
                  <button
                    type="button"
                    onClick={() => handleVerifyShift(activeClosingDetail)}
                    className="px-3.5 py-1.5 bg-[#417690] hover:bg-[#325c70] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Manager Sign-Off & Verify</span>
                  </button>
                )}
              </div>
            </div>

            {/* Fieldsets */}
            <div className="p-6 space-y-6">
              {/* Fieldset 1: Shift & Cashier Metadata */}
              <fieldset className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]">
                <legend className="px-2 font-bold text-xs text-[#417690] uppercase tracking-wider">
                  1. Shift Session & Cashier Details
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mt-2">
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Shift Identifier:</label>
                    <input
                      type="text"
                      readOnly
                      value={activeClosingDetail.id}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded font-mono text-[#222]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Cashier Account:</label>
                    <input
                      type="text"
                      readOnly
                      value={`${activeClosingDetail.cashierFullName} (@${activeClosingDetail.cashierUsername})`}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded font-semibold text-[#222]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Terminal Session Status:</label>
                    <input
                      type="text"
                      readOnly
                      value={activeClosingDetail.status.toUpperCase()}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded font-mono text-emerald-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Shift Opened At:</label>
                    <input
                      type="text"
                      readOnly
                      value={formatDateTime(activeClosingDetail.openedAt)}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded text-[#222]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Shift Closed At:</label>
                    <input
                      type="text"
                      readOnly
                      value={activeClosingDetail.closedAt ? formatDateTime(activeClosingDetail.closedAt) : 'In Progress'}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded text-[#222]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#666] font-semibold mb-1">Closed By User:</label>
                    <input
                      type="text"
                      readOnly
                      value={activeClosingDetail.closedBy || activeClosingDetail.cashierFullName}
                      className="w-full bg-[#eee] border border-[#ccc] px-2.5 py-1.5 rounded text-[#222]"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Fieldset 2: Cash Denominations and Opening Float */}
              <fieldset className="border border-[#e0e0e0] rounded p-4 bg-white">
                <legend className="px-2 font-bold text-xs text-[#417690] uppercase tracking-wider">
                  2. Opening Float & Starting Cash
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div className="p-3 bg-[#f5f8fa] border border-[#d2e2ec] rounded">
                    <span className="text-[11px] text-[#555] font-semibold block uppercase">Opening Cash Float</span>
                    <span className="text-xl font-bold font-mono text-[#205067]">
                      {formatCurrency(activeClosingDetail.openingCash, settings.currency_symbol)}
                    </span>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[#666] font-semibold text-xs mb-1">
                      Opening Denominations Counted:
                    </label>
                    {activeClosingDetail.openingDenominations ? (
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
                        {Object.entries(activeClosingDetail.openingDenominations).map(([denom, count]) => (
                          <div key={denom} className="border border-[#ddd] bg-[#f9f9f9] p-1.5 rounded">
                            <span className="block text-[10px] text-[#777] uppercase font-mono">{denom.replace('c', '₹')}</span>
                            <span className="font-bold text-[#333] font-mono">×{count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#777] italic py-2">Standard lump-sum opening float entered.</p>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Fieldset 3: Actual EOD Counts vs System Expected Totals */}
              <fieldset className="border border-[#e0e0e0] rounded p-4 bg-white">
                <legend className="px-2 font-bold text-xs text-[#417690] uppercase tracking-wider">
                  3. Reconciliation Matrix: Expected vs. Actual EOD Counts
                </legend>

                <div className="overflow-x-auto mt-2 border border-[#ccc] rounded">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#f2f4f6] text-[#444] border-b border-[#ccc] font-bold">
                      <tr>
                        <th className="p-2.5">PAYMENT METHOD</th>
                        <th className="p-2.5 text-right font-mono">SYSTEM EXPECTED</th>
                        <th className="p-2.5 text-right font-mono">ACTUAL DRAWER COUNT</th>
                        <th className="p-2.5 text-right font-mono">VARIANCE (DIFFERENCE)</th>
                        <th className="p-2.5 text-center">AUDIT STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee]">
                      {/* Physical Cash */}
                      <tr className="hover:bg-[#fafafa]">
                        <td className="p-2.5 font-semibold text-[#222]">
                          Cash in Drawer (Opening Float + Cash Sales)
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#333]">
                          {formatCurrency(activeClosingDetail.expectedCash, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#111]">
                          {formatCurrency(activeClosingDetail.actualCash ?? 0, settings.currency_symbol)}
                        </td>
                        <td
                          className={`p-2.5 text-right font-mono font-bold ${
                            (activeClosingDetail.cashDifference ?? 0) === 0
                              ? 'text-emerald-700'
                              : (activeClosingDetail.cashDifference ?? 0) < 0
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {(activeClosingDetail.cashDifference ?? 0) > 0 ? '+' : ''}
                          {formatCurrency(activeClosingDetail.cashDifference ?? 0, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-center">
                          {(activeClosingDetail.cashDifference ?? 0) === 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              BALANCED
                            </span>
                          ) : (activeClosingDetail.cashDifference ?? 0) < 0 ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                              SHORTAGE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              OVERAGE
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Online UPI */}
                      <tr className="hover:bg-[#fafafa]">
                        <td className="p-2.5 font-semibold text-[#222]">
                          Online UPI / QR Payment Settlement
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#333]">
                          {formatCurrency(activeClosingDetail.expectedUpi, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#111]">
                          {formatCurrency(activeClosingDetail.actualUpi ?? 0, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#555]">
                          {formatCurrency((activeClosingDetail.actualUpi ?? 0) - activeClosingDetail.expectedUpi, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-center">
                          {(activeClosingDetail.actualUpi ?? 0) === activeClosingDetail.expectedUpi ? (
                            <span className="text-emerald-700 font-bold text-[10px]">VERIFIED</span>
                          ) : (
                            <span className="text-amber-700 font-bold text-[10px]">FLAGGED</span>
                          )}
                        </td>
                      </tr>

                      {/* Card Terminal */}
                      <tr className="hover:bg-[#fafafa]">
                        <td className="p-2.5 font-semibold text-[#222]">
                          Card POS Terminal Batch Summary
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#333]">
                          {formatCurrency(activeClosingDetail.expectedCard, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#111]">
                          {formatCurrency(activeClosingDetail.actualCard ?? 0, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#555]">
                          {formatCurrency((activeClosingDetail.actualCard ?? 0) - activeClosingDetail.expectedCard, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-center">
                          {(activeClosingDetail.actualCard ?? 0) === activeClosingDetail.expectedCard ? (
                            <span className="text-emerald-700 font-bold text-[10px]">VERIFIED</span>
                          ) : (
                            <span className="text-amber-700 font-bold text-[10px]">FLAGGED</span>
                          )}
                        </td>
                      </tr>

                      {/* Other */}
                      <tr className="hover:bg-[#fafafa]">
                        <td className="p-2.5 font-semibold text-[#222]">
                          Other / Voucher / Credit
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#333]">
                          {formatCurrency(activeClosingDetail.expectedOther, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#111]">
                          {formatCurrency(activeClosingDetail.actualOther ?? 0, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[#555]">
                          {formatCurrency((activeClosingDetail.actualOther ?? 0) - activeClosingDetail.expectedOther, settings.currency_symbol)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="text-emerald-700 font-bold text-[10px]">VERIFIED</span>
                        </td>
                      </tr>

                      {/* Net Total */}
                      <tr className="bg-[#eef2f5] font-bold text-[#111]">
                        <td className="p-3">NET SHIFT RECONCILIATION TOTAL</td>
                        <td className="p-3 text-right font-mono">
                          {formatCurrency(activeClosingDetail.expectedTotal, settings.currency_symbol)}
                        </td>
                        <td className="p-3 text-right font-mono text-[#417690]">
                          {formatCurrency(activeClosingDetail.actualTotal ?? 0, settings.currency_symbol)}
                        </td>
                        <td
                          className={`p-3 text-right font-mono ${
                            (activeClosingDetail.totalDifference ?? 0) === 0
                              ? 'text-emerald-800'
                              : (activeClosingDetail.totalDifference ?? 0) < 0
                              ? 'text-red-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {(activeClosingDetail.totalDifference ?? 0) > 0 ? '+' : ''}
                          {formatCurrency(activeClosingDetail.totalDifference ?? 0, settings.currency_symbol)}
                        </td>
                        <td className="p-3 text-center">
                          {(activeClosingDetail.totalDifference ?? 0) === 0 ? (
                            <span className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px]">
                              100% RECONCILED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-[11px]">
                              DISCREPANCY RECORDED
                            </span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </fieldset>

              {/* Fieldset 4: Cashier Notes & Manager Audit Signoff */}
              <fieldset className="border border-[#e0e0e0] rounded p-4 bg-[#fafafa]">
                <legend className="px-2 font-bold text-xs text-[#417690] uppercase tracking-wider">
                  4. Closing Notes & Audit Trail
                </legend>
                <div className="space-y-3 mt-2">
                  <div>
                    <label className="block text-[#666] font-semibold text-xs mb-1">
                      Cashier EOD Closing Notes:
                    </label>
                    <textarea
                      readOnly
                      rows={3}
                      value={activeClosingDetail.closingNotes || 'No notes entered by cashier during register closing.'}
                      className="w-full bg-[#eee] border border-[#ccc] p-2 rounded text-xs text-[#333]"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-[#ddd] rounded">
                    <div>
                      <span className="font-bold text-xs text-[#333] block">Manager Review & Sign-Off</span>
                      <span className="text-[11px] text-[#666]">
                        {activeClosingDetail.verifiedBy
                          ? `Audited and verified by ${activeClosingDetail.verifiedBy} on ${formatDateTime(activeClosingDetail.verifiedAt || '')}`
                          : 'Awaiting manager audit and verification in Django Admin.'}
                      </span>
                    </div>

                    {!activeClosingDetail.verifiedBy ? (
                      <button
                        type="button"
                        onClick={() => handleVerifyShift(activeClosingDetail)}
                        className="px-4 py-2 bg-[#417690] hover:bg-[#325c70] text-white text-xs font-bold rounded shadow transition-colors"
                      >
                        Sign-off as Manager ({currentUser.fullName})
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Signed & Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>
            </div>

            {/* Bottom Form Action Buttons */}
            <div className="px-6 py-3.5 bg-[#f5f5f5] border-t border-[#ccc] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveClosingDetail(null)}
                className="px-4 py-2 bg-[#ba2121] hover:bg-[#a81c1c] text-white font-bold text-xs rounded transition-colors"
              >
                Close View
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionSuccessMsg(`Register Closing ${activeClosingDetail.id} changes saved.`);
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-2 bg-[#417690] hover:bg-[#325c70] text-white font-bold text-xs rounded shadow transition-colors"
                >
                  Save and continue editing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveClosingDetail(null);
                    setActionSuccessMsg(`Register Closing ${activeClosingDetail.id} successfully updated.`);
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }}
                  className="px-4 py-2 bg-[#205067] hover:bg-[#153a4c] text-white font-bold text-xs rounded shadow transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main ChangeList View (Select register closing to change) */
          <div>
            {/* Top Toolbar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#333] tracking-tight">
                  Select register closing to change
                </h1>
                <p className="text-xs text-[#666]">
                  Displaying {filteredShifts.length} of {shifts.length} total closing reconciliation records
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-[#205067] hover:bg-[#183d4f] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export to CSV ({selectedIds.length > 0 ? selectedIds.length : 'All'})</span>
                </button>
              </div>
            </div>

            {/* Layout with Main Table + Right Filter Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* 3 Columns: Table & Actions */}
              <div className="lg:col-span-3 space-y-4">
                {/* Search Bar & Action selector */}
                <div className="bg-[#f8f9fa] border border-[#ccc] p-3 rounded flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                  {/* Search */}
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 text-[#888] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search shift ID, cashier, closing notes..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#ccc] rounded text-xs text-[#333] focus:outline-hidden focus:border-[#417690]"
                      />
                    </div>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-[#ba2121] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Actions Selector */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#666] font-semibold">Action:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value === 'export') handleExportCsv();
                      }}
                      className="bg-white border border-[#ccc] px-2 py-1.5 rounded text-xs text-[#333]"
                    >
                      <option value="">---------</option>
                      <option value="export">Export selected records to CSV</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 bg-[#417690] text-white font-bold rounded text-xs hover:bg-[#325c70]"
                    >
                      Go
                    </button>
                    <span className="text-[11px] text-[#777]">
                      {selectedIds.length} of {filteredShifts.length} selected
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-[#ccc] rounded shadow-xs overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#417690] text-white uppercase text-[11px] font-bold tracking-wider">
                      <tr>
                        <th className="p-3 w-8 text-center">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="text-white hover:text-amber-200"
                            title="Select / Deselect All"
                          >
                            {selectedIds.length === filteredShifts.length && filteredShifts.length > 0 ? (
                              <CheckSquare className="w-4 h-4" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="p-3">SHIFT / REGISTER ID</th>
                        <th className="p-3">CASHIER</th>
                        <th className="p-3">CLOSED AT</th>
                        <th className="p-3 text-right">OPENING CASH</th>
                        <th className="p-3 text-right">ACTUAL CASH</th>
                        <th className="p-3 text-right">EXPECTED CASH</th>
                        <th className="p-3 text-right">CASH DIFF</th>
                        <th className="p-3 text-right">ACTUAL TOTAL</th>
                        <th className="p-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee]">
                      {filteredShifts.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-[#777] italic">
                            No register closing records match the selected query or filters.
                          </td>
                        </tr>
                      ) : (
                        filteredShifts.map((shift, idx) => {
                          const isSelected = selectedIds.includes(shift.id);
                          const cashDiff = shift.cashDifference ?? 0;
                          return (
                            <tr
                              key={shift.id}
                              className={`transition-colors ${
                                isSelected
                                  ? 'bg-[#fffae6]'
                                  : idx % 2 === 0
                                  ? 'bg-white hover:bg-[#f6f8f9]'
                                  : 'bg-[#fafafa] hover:bg-[#f6f8f9]'
                              }`}
                            >
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleSelectId(shift.id)}
                                  className="text-[#666] hover:text-[#333]"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-[#417690]" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 font-semibold">
                                <button
                                  type="button"
                                  onClick={() => setActiveClosingDetail(shift)}
                                  className="text-[#417690] hover:underline font-mono text-xs font-bold text-left cursor-pointer"
                                  title="Click to view full Django change form"
                                >
                                  {shift.id}
                                </button>
                              </td>
                              <td className="p-3 text-[#222]">
                                <span className="font-semibold">{shift.cashierFullName}</span>
                                <span className="block text-[10px] text-[#777] font-mono">@{shift.cashierUsername}</span>
                              </td>
                              <td className="p-3 text-[#555] font-mono text-[11px]">
                                {shift.closedAt ? formatDateTime(shift.closedAt) : 'Shift in progress'}
                              </td>
                              <td className="p-3 text-right font-mono text-[#333]">
                                {formatCurrency(shift.openingCash, settings.currency_symbol)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-[#111]">
                                {formatCurrency(shift.actualCash ?? 0, settings.currency_symbol)}
                              </td>
                              <td className="p-3 text-right font-mono text-[#444]">
                                {formatCurrency(shift.expectedCash, settings.currency_symbol)}
                              </td>
                              <td
                                className={`p-3 text-right font-mono font-bold ${
                                  cashDiff === 0
                                    ? 'text-emerald-700'
                                    : cashDiff < 0
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {cashDiff > 0 ? '+' : ''}
                                {formatCurrency(cashDiff, settings.currency_symbol)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-[#205067]">
                                {formatCurrency(shift.actualTotal ?? 0, settings.currency_symbol)}
                              </td>
                              <td className="p-3 text-center">
                                {shift.verifiedBy ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-[#fff3e0] text-[#e65100] text-[10px] font-bold">
                                    CLOSED
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Table bottom pagination / count */}
                  <div className="p-3 bg-[#f8f9fa] border-t border-[#ccc] text-xs text-[#666] flex items-center justify-between">
                    <span>
                      {filteredShifts.length} register closings
                    </span>
                    <span className="text-[11px] text-[#888] font-mono">
                      THE GSR SALES TERMINAL &bull; DJANGO ORM ADMIN COMPATIBLE
                    </span>
                  </div>
                </div>
              </div>

              {/* 1 Column: Django Classic Filter Sidebar */}
              <div className="bg-[#f8f9fa] border border-[#ccc] rounded p-4 shadow-2xs space-y-5">
                <div className="border-b border-[#ddd] pb-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#417690]">
                    Filter
                  </h3>
                </div>

                {/* Filter 1: By Discrepancy */}
                <div>
                  <h4 className="font-bold text-[11px] text-[#333] mb-1.5 uppercase">
                    By Discrepancy Status
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        type="button"
                        onClick={() => setDiscrepancyFilter('all')}
                        className={`hover:underline ${
                          discrepancyFilter === 'all' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        All
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDiscrepancyFilter('matched')}
                        className={`hover:underline ${
                          discrepancyFilter === 'matched' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Balanced (Zero difference)
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDiscrepancyFilter('shortage')}
                        className={`hover:underline ${
                          discrepancyFilter === 'shortage' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Cash Shortage (Deficit)
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDiscrepancyFilter('overage')}
                        className={`hover:underline ${
                          discrepancyFilter === 'overage' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Cash Overage (Excess)
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Filter 2: By Cashier */}
                <div className="border-t border-[#eee] pt-3">
                  <h4 className="font-bold text-[11px] text-[#333] mb-1.5 uppercase">
                    By Cashier
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        type="button"
                        onClick={() => setCashierFilter('all')}
                        className={`hover:underline ${
                          cashierFilter === 'all' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        All
                      </button>
                    </li>
                    {users.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => setCashierFilter(u.username)}
                          className={`hover:underline ${
                            cashierFilter === u.username ? 'font-bold text-[#417690]' : 'text-[#666]'
                          }`}
                        >
                          {u.fullName} (@{u.username})
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Filter 3: By Date */}
                <div className="border-t border-[#eee] pt-3">
                  <h4 className="font-bold text-[11px] text-[#333] mb-1.5 uppercase">
                    By Date
                  </h4>
                  <ul className="space-y-1 text-xs">
                    <li>
                      <button
                        type="button"
                        onClick={() => setDateFilter('all')}
                        className={`hover:underline ${
                          dateFilter === 'all' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Any date
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDateFilter('today')}
                        className={`hover:underline ${
                          dateFilter === 'today' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Today
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDateFilter('past7')}
                        className={`hover:underline ${
                          dateFilter === 'past7' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        Past 7 days
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setDateFilter('month')}
                        className={`hover:underline ${
                          dateFilter === 'month' ? 'font-bold text-[#417690]' : 'text-[#666]'
                        }`}
                      >
                        This month
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
