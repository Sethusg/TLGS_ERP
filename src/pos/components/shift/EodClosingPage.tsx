import React, { useState, useMemo } from 'react';
import {
  PosUser,
  StoreSettings,
  ShiftSession,
  Sale,
  CashDenominations,
} from '../../types/pos';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  ShieldAlert,
  Banknote,
  QrCode,
  CreditCard,
  Gift,
  Calculator,
  ArrowRight,
  Clock,
  User,
  Receipt,
  Sparkles,
} from 'lucide-react';

interface EodClosingPageProps {
  currentUser: PosUser;
  activeShift: ShiftSession;
  shiftSales: Sale[];
  settings: StoreSettings;
  onSubmitClosingCounts: (actuals: {
    actualCash: number;
    actualUpi: number;
    actualCard: number;
    actualOther: number;
    closingNotes: string;
    denominations?: Partial<CashDenominations>;
  }) => void;
  onCancel: () => void;
}

export const EodClosingPage: React.FC<EodClosingPageProps> = ({
  currentUser,
  activeShift,
  shiftSales,
  settings,
  onSubmitClosingCounts,
  onCancel,
}) => {
  // System calculations for current shift
  const cashSales = useMemo(
    () => shiftSales.filter((s) => s.payment_method === 'cash').reduce((sum, s) => sum + s.total_amount, 0),
    [shiftSales]
  );
  const upiSales = useMemo(
    () => shiftSales.filter((s) => s.payment_method === 'upi').reduce((sum, s) => sum + s.total_amount, 0),
    [shiftSales]
  );
  const cardSales = useMemo(
    () => shiftSales.filter((s) => s.payment_method === 'card').reduce((sum, s) => sum + s.total_amount, 0),
    [shiftSales]
  );
  const otherSales = useMemo(
    () => shiftSales.filter((s) => s.payment_method === 'other').reduce((sum, s) => sum + s.total_amount, 0),
    [shiftSales]
  );

  const expectedCashInDrawer = activeShift.openingCash + cashSales;

  // Actual input states (Default to expected for fast demo, but fully editable)
  const [actualCashInput, setActualCashInput] = useState<string>(expectedCashInDrawer.toFixed(2));
  const [actualUpiInput, setActualUpiInput] = useState<string>(upiSales.toFixed(2));
  const [actualCardInput, setActualCardInput] = useState<string>(cardSales.toFixed(2));
  const [actualOtherInput, setActualOtherInput] = useState<string>(otherSales.toFixed(2));
  const [closingNotes, setClosingNotes] = useState('End of day cash counted and locked in physical safe.');

  const [useCashDenominations, setUseCashDenominations] = useState(false);
  const [denominations, setDenominations] = useState<CashDenominations>({
    c2000: 0,
    c500: Math.floor(expectedCashInDrawer / 500),
    c200: 0,
    c100: Math.floor((expectedCashInDrawer % 500) / 100),
    c50: 0,
    c20: 0,
    c10: 0,
    coins: Math.round(expectedCashInDrawer % 100),
  });

  const calculatedDenomTotal = useMemo(() => {
    return (
      denominations.c2000 * 2000 +
      denominations.c500 * 500 +
      denominations.c200 * 200 +
      denominations.c100 * 100 +
      denominations.c50 * 50 +
      denominations.c20 * 20 +
      denominations.c10 * 10 +
      denominations.coins
    );
  }, [denominations]);

  const finalCashCounted = useCashDenominations
    ? calculatedDenomTotal
    : parseFloat(actualCashInput) || 0;
  const finalUpiCounted = parseFloat(actualUpiInput) || 0;
  const finalCardCounted = parseFloat(actualCardInput) || 0;
  const finalOtherCounted = parseFloat(actualOtherInput) || 0;

  const totalCounted = finalCashCounted + finalUpiCounted + finalCardCounted + finalOtherCounted;

  const handleDenomChange = (key: keyof CashDenominations, val: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitClosingCounts({
      actualCash: Math.round(finalCashCounted * 100) / 100,
      actualUpi: Math.round(finalUpiCounted * 100) / 100,
      actualCard: Math.round(finalCardCounted * 100) / 100,
      actualOther: Math.round(finalOtherCounted * 100) / 100,
      closingNotes,
      denominations: useCashDenominations ? denominations : undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>END OF DAY SHIFT SETTLEMENT (EOD)</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Daily Sales Counter Reconciliation
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Who closes the sales counter must count and declare hand cash, online UPI payments, and card receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 rounded-xl"
        >
          Return to POS
        </button>
      </div>

      {/* Shift Overview Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-neutral-400">Cashier Closing</span>
          <p className="text-sm font-bold text-white mt-0.5">{currentUser.fullName}</p>
          <span className="text-[10px] text-neutral-500 font-mono">ID: {currentUser.employeeId}</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-neutral-400">Shift Started At</span>
          <p className="text-sm font-bold font-mono text-neutral-200 mt-0.5">
            {formatDateTime(activeShift.openedAt)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono">Terminal #01</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-neutral-400">Starting Float</span>
          <p className="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {formatCurrency(activeShift.openingCash, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono">Opening Cash Base</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
          <span className="text-[10px] uppercase font-mono text-neutral-400">Transactions Recorded</span>
          <p className="text-sm font-bold font-mono text-sky-400 mt-0.5">
            {shiftSales.length} Orders
          </p>
          <span className="text-[10px] text-neutral-500 font-mono">
            Total {formatCurrency(cashSales + upiSales + cardSales + otherSales, settings.currency_symbol)}
          </span>
        </div>
      </div>

      {/* Form: Actual Hand Cash, Online UPI, and Card Payments */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white">Enter Counted Closing Amounts</h3>
          <p className="text-xs text-neutral-400">
            Audit physical drawer cash and reconcile digital merchant settlement totals.
          </p>
        </div>

        {/* 1. Hand Cash In Drawer */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-200">1. Physical Hand Cash in Drawer</span>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Includes Opening Float ({formatCurrency(activeShift.openingCash, settings.currency_symbol)}) + Cash Sales ({formatCurrency(cashSales, settings.currency_symbol)})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setUseCashDenominations(!useCashDenominations)}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Calculator className="w-3 h-3" />
              <span>{useCashDenominations ? 'Simple Input' : 'Denominations Calculator'}</span>
            </button>
          </div>

          {!useCashDenominations ? (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-base">
                {settings.currency_symbol}
              </span>
              <input
                type="number"
                step="0.01"
                required
                value={actualCashInput}
                onChange={(e) => setActualCashInput(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700 text-xl font-mono font-bold text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { key: 'c2000' as const, label: `${settings.currency_symbol}2000` },
                  { key: 'c500' as const, label: `${settings.currency_symbol}500` },
                  { key: 'c200' as const, label: `${settings.currency_symbol}200` },
                  { key: 'c100' as const, label: `${settings.currency_symbol}100` },
                  { key: 'c50' as const, label: `${settings.currency_symbol}50` },
                  { key: 'c20' as const, label: `${settings.currency_symbol}20` },
                  { key: 'c10' as const, label: `${settings.currency_symbol}10` },
                  { key: 'coins' as const, label: `Coins Value` },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-neutral-900 rounded-lg">
                    <span className="text-neutral-400 font-mono text-[11px]">{label}:</span>
                    <input
                      type="number"
                      min={0}
                      value={denominations[key]}
                      onChange={(e) => handleDenomChange(key, parseInt(e.target.value, 10) || 0)}
                      className="w-14 bg-neutral-950 border border-neutral-700 text-center font-mono font-bold text-white rounded py-0.5 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-neutral-800 text-xs">
                <span className="text-neutral-400">Total Counted Hand Cash:</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {formatCurrency(calculatedDenomTotal, settings.currency_symbol)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Online UPI Payments */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-200">2. Online Payments (UPI / QR Total)</span>
              <p className="text-[10px] text-neutral-400 font-mono">
                Total settlements received in PhonePe / GooglePay / Paytm Merchant app
              </p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-base">
              {settings.currency_symbol}
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={actualUpiInput}
              onChange={(e) => setActualUpiInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-xl font-mono font-bold text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* 3. Card Terminal Payments */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-200">3. Card Payments (EDC Machine Settlement)</span>
              <p className="text-[10px] text-neutral-400 font-mono">
                Total batch closing report printed from bank card swipe terminal
              </p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-base">
              {settings.currency_symbol}
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={actualCardInput}
              onChange={(e) => setActualCardInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-xl font-mono font-bold text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* 4. Other Payments */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-neutral-200">4. Other Payments & Vouchers</span>
              <p className="text-[10px] text-neutral-400 font-mono">
                Food coupons, partner gift cards, credit vouchers
              </p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-base">
              {settings.currency_symbol}
            </span>
            <input
              type="number"
              step="0.01"
              required
              value={actualOtherInput}
              onChange={(e) => setActualOtherInput(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-xl font-mono font-bold text-white pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Closing remarks */}
        <div>
          <label className="block text-neutral-300 font-medium mb-1 text-xs">
            Shift Closing Notes & Remarks
          </label>
          <textarea
            rows={2}
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. Minor cash discrepancy explained, safe envelope #42..."
            className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 p-2.5 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit to review Closing Report */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-4">
          <div className="text-xs font-mono">
            <span className="text-neutral-500">Total Counted:</span>{' '}
            <span className="text-base font-bold text-white">
              {formatCurrency(totalCounted, settings.currency_symbol)}
            </span>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-neutral-950 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <span>Proceed to Closing Report & Differences</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
