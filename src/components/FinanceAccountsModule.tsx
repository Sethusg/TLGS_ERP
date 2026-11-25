import React, { useState, useEffect } from 'react';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import { NavSection } from '../types';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  EnterpriseFormModal,
  TableColumn,
} from './Common/EnterpriseUI';

interface FinanceAccountsModuleProps {
  subItem?: string;
  contextLabel: string;
  onNavigate: (section: NavSection, subItem?: string) => void;
}

interface LedgerVoucher {
  id: string;
  voucherNo: string;
  date: string;
  accountHead: string;
  description: string;
  type: 'Credit' | 'Debit';
  amount: number;
  status: 'Posted' | 'Pending Audit';
}

const INITIAL_VOUCHERS: LedgerVoucher[] = [
  { id: 'vch-1', voucherNo: 'JV-2026-1041', date: '2026-10-23', accountHead: 'Tuition Fee Receipts', description: 'Term 2 Online UPI Settlement Batch #44', type: 'Credit', amount: 642500, status: 'Posted' },
  { id: 'vch-2', voucherNo: 'PV-2026-1042', date: '2026-10-22', accountHead: 'Transport Fleet Fuel', description: 'IndianOil Fleet Diesel Card Top-up', type: 'Debit', amount: 118400, status: 'Posted' },
  { id: 'vch-3', voucherNo: 'JV-2026-1043', date: '2026-10-22', accountHead: 'Canteen POS Settlement', description: 'Daily Campus Canteen Smart Wallet Sales', type: 'Credit', amount: 48920, status: 'Posted' },
  { id: 'vch-4', voucherNo: 'PV-2026-1044', date: '2026-10-21', accountHead: 'Science Lab Consumables', description: 'Borosil Glassware & Reagents Invoice #912', type: 'Debit', amount: 76300, status: 'Pending Audit' },
  { id: 'vch-5', voucherNo: 'PV-2026-1045', date: '2026-10-20', accountHead: 'Campus Utilities', description: 'TANGEDCO HT Power Bill — Main Campus', type: 'Debit', amount: 184200, status: 'Posted' },
];

const BUDGET_HEADS = [
  { id: 'bdg-1', head: 'Faculty & Staff Payroll', allocated: 520, utilized: 382, unit: 'Lakhs' },
  { id: 'bdg-2', head: 'Academic Labs & IT Infrastructure', allocated: 85, utilized: 61.5, unit: 'Lakhs' },
  { id: 'bdg-3', head: 'Transport Fleet Operations', allocated: 64, utilized: 47.2, unit: 'Lakhs' },
  { id: 'bdg-4', head: 'Campus Maintenance & Utilities', allocated: 48, utilized: 35.8, unit: 'Lakhs' },
];

export const FinanceAccountsModule: React.FC<FinanceAccountsModuleProps> = ({
  subItem,
  contextLabel,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'fin-ledger');
  const [vouchers, setVouchers] = useState<LedgerVoucher[]>(INITIAL_VOUCHERS);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  const [newHead, setNewHead] = useState('Tuition Fee Receipts');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'Credit' | 'Debit'>('Debit');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const totalCredit = vouchers
    .filter((v) => v.type === 'Credit')
    .reduce((a, b) => a + b.amount, 0);
  const totalDebit = vouchers
    .filter((v) => v.type === 'Debit')
    .reduce((a, b) => a + b.amount, 0);

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmt = Number(newAmount);
    if (!newDesc.trim() || !numericAmt || numericAmt <= 0) return;

    setVouchers((prev) => [
      {
        id: `vch-${Date.now()}`,
        voucherNo: `${newType === 'Credit' ? 'JV' : 'PV'}-2026-${1046 + prev.length}`,
        date: '2026-10-23',
        accountHead: newHead,
        description: newDesc.trim(),
        type: newType,
        amount: numericAmt,
        status: 'Pending Audit',
      },
      ...prev,
    ]);
    setNewDesc('');
    setNewAmount('');
    setIsVoucherModalOpen(false);
  };

  const voucherColumns: TableColumn<LedgerVoucher>[] = [
    {
      key: 'voucherNo',
      header: 'Voucher #',
      render: (r) => <span className="font-mono font-semibold text-[#0B1F3A]">{r.voucherNo}</span>,
    },
    { key: 'date', header: 'Date', render: (r) => <span className="font-mono text-slate-600">{r.date}</span> },
    {
      key: 'head',
      header: 'Account Head & Narration',
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.accountHead}</p>
          <p className="text-[11px] text-slate-500">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.amount,
      render: (r) => (
        <span
          className={`font-mono font-bold ${
            r.type === 'Credit' ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {r.type === 'Credit' ? '+' : '-'}₹{r.amount.toLocaleString('en-IN')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Audit Status',
      align: 'right',
      render: (r) => (
        <span className={r.status === 'Posted' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${contextLabel} · Sample Preview Ledger`}
        title="Finance and Accounts"
        subtitle="Institutional general ledger, income & expenditure tracking, campus budget allocation, vendor payables, and Canteen POS revenue."
        tabs={[
          { id: 'fin-ledger', label: 'General Ledger' },
          { id: 'fin-income-expense', label: 'Income & Expenses' },
          { id: 'fin-budgets', label: 'Campus Budgets' },
          { id: 'fin-vendors', label: 'Vendor Invoices' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <>
            <button
              type="button"
              onClick={() => onNavigate('CANTEEN', 'canteen-pos')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0B1F3A] cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#9A7418]" />
              <span>Canteen & POS</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Record Voucher</span>
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Ledger Inflow (Sample)"
          value={`₹${(totalCredit / 100000).toFixed(2)} L`}
          detail="Fee & POS receipts posted"
          icon={TrendingUp}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Ledger Outflow (Sample)"
          value={`₹${(totalDebit / 100000).toFixed(2)} L`}
          detail="Vendor & operational vouchers"
          icon={TrendingDown}
          tone="rose"
        />
        <EnterpriseMetricCard
          label="Net Operating Balance"
          value={`₹${((totalCredit - totalDebit) / 100000).toFixed(2)} L`}
          detail="Current voucher cycle"
          icon={Wallet}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Annual Budget Utilized"
          value="73.4%"
          detail="₹526.5 L of ₹717.0 L cap"
          icon={Landmark}
          tone="gold"
        />
      </div>

      {(activeTab === 'fin-ledger' || activeTab === 'fin-income-expense') && (
        <EnterpriseDataTable
          title={
            activeTab === 'fin-income-expense'
              ? 'Income & Expenditure Vouchers'
              : 'General Ledger Journal Entries'
          }
          subtitle="Click Record Voucher above to post a new preview accounting entry."
          columns={voucherColumns}
          data={vouchers}
          rowKey={(r) => r.id}
          searchPlaceholder="Search voucher, account head..."
          searchFilter={(r, q) =>
            r.voucherNo.toLowerCase().includes(q) ||
            r.accountHead.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'fin-budgets' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#0B1F3A]">Annual Campus Budget Utilization</h2>
            <p className="text-[11px] text-slate-500">FY 2026–2027 approved cost centers (INR in Lakhs)</p>
          </div>
          <div className="space-y-4">
            {BUDGET_HEADS.map((b) => {
              const pct = Math.round((b.utilized / b.allocated) * 100);
              return (
                <div key={b.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0B1F3A]">{b.head}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      ₹{b.utilized} L / ₹{b.allocated} L ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B1F3A] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'fin-vendors' && (
        <EnterpriseDataTable
          title="Vendor Payables & Invoices"
          subtitle="Pending and cleared institutional supplier invoices."
          columns={voucherColumns}
          data={vouchers.filter((v) => v.type === 'Debit')}
          rowKey={(r) => r.id}
        />
      )}

      <EnterpriseFormModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Record Accounting Voucher"
        subtitle="Adds a preview entry to the General Ledger table"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Voucher Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as 'Credit' | 'Debit')}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg cursor-pointer"
              >
                <option value="Credit">Credit (Receipt)</option>
                <option value="Debit">Debit (Payment)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Amount (INR) *</label>
              <input
                type="number"
                required
                min={1}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Account Head</label>
            <input
              type="text"
              value={newHead}
              onChange={(e) => setNewHead(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Narration / Reference *</label>
            <input
              type="text"
              required
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Invoice or batch details"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Post Voucher
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
