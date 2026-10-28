import React from 'react';
import { ShiftSession, StoreSettings, Sale } from '../../types/pos';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  FileCheck2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface ClosingReportViewProps {
  shift: ShiftSession;
  shiftSales: Sale[];
  settings: StoreSettings;
  onFinalizeCloseShift: () => void;
  onBackToEdit: () => void;
}

export const ClosingReportView: React.FC<ClosingReportViewProps> = ({
  shift,
  shiftSales,
  settings,
  onFinalizeCloseShift,
  onBackToEdit,
}) => {
  const actualCash = shift.actualCash || 0;
  const actualUpi = shift.actualUpi || 0;
  const actualCard = shift.actualCard || 0;
  const actualOther = shift.actualOther || 0;
  const actualGrandTotal = actualCash + actualUpi + actualCard + actualOther;

  const cashDiff = actualCash - shift.expectedCash;
  const upiDiff = actualUpi - shift.expectedUpi;
  const cardDiff = actualCard - shift.expectedCard;
  const otherDiff = actualOther - shift.expectedOther;
  const totalDiff = actualGrandTotal - shift.expectedTotal;

  const getVarianceBadge = (diff: number) => {
    if (Math.abs(diff) < 0.01) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          <span>MATCHED (₹0.00)</span>
        </span>
      );
    }
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3" />
          <span>OVER (+{formatCurrency(diff, settings.currency_symbol)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30">
        <XCircle className="w-3 h-3" />
        <span>SHORT ({formatCurrency(diff, settings.currency_symbol)})</span>
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* Printable Area for Shift Z-Report */}
      <div className="hidden print-report-area font-mono text-xs text-black">
        <div className="text-center pb-4 border-b border-black">
          <h1 className="text-xl font-bold uppercase">{settings.store_name}</h1>
          <p className="text-xs font-bold">END-OF-DAY SHIFT CLOSING SETTLEMENT</p>
          <p className="text-xs">{settings.address} · Tel: {settings.phone}</p>
          <p className="text-xs">GST / Tax ID: {settings.tax_number}</p>
          <p className="text-xs mt-1">Shift ID: {shift.id} · Terminal #01</p>
          <p className="text-xs">
            Opened: {formatDateTime(shift.openedAt)} by {shift.cashierFullName}
          </p>
          <p className="text-xs">
            Closed: {formatDateTime(shift.closedAt || new Date().toISOString())} by {shift.closedBy || shift.cashierFullName}
          </p>
        </div>

        <div className="py-4 border-b border-black space-y-1.5">
          <p className="font-bold underline">EXPECTED VS. ACTUAL RECONCILIATION</p>
          <div className="flex justify-between">
            <span>STARTING CASH FLOAT:</span>
            <span>{formatCurrency(shift.openingCash, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>EXPECTED HAND CASH:</span>
            <span>{formatCurrency(shift.expectedCash, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>ACTUAL HAND CASH COUNTED:</span>
            <span>{formatCurrency(actualCash, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>CASH DIFFERENCE (VARIANCE):</span>
            <span>{cashDiff >= 0 ? `+${formatCurrency(cashDiff, settings.currency_symbol)}` : formatCurrency(cashDiff, settings.currency_symbol)}</span>
          </div>

          <div className="pt-2 border-t border-dashed border-black" />
          <div className="flex justify-between">
            <span>ONLINE UPI (EXPECTED / ACTUAL):</span>
            <span>{formatCurrency(shift.expectedUpi, settings.currency_symbol)} / {formatCurrency(actualUpi, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>CARD SLIPS (EXPECTED / ACTUAL):</span>
            <span>{formatCurrency(shift.expectedCard, settings.currency_symbol)} / {formatCurrency(actualCard, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>OTHER PAYMENTS (EXPECTED / ACTUAL):</span>
            <span>{formatCurrency(shift.expectedOther, settings.currency_symbol)} / {formatCurrency(actualOther, settings.currency_symbol)}</span>
          </div>

          <div className="pt-2 border-t border-black font-black flex justify-between text-sm">
            <span>TOTAL EXPECTED:</span>
            <span>{formatCurrency(shift.expectedTotal, settings.currency_symbol)}</span>
          </div>
          <div className="font-black flex justify-between text-sm">
            <span>TOTAL ACTUAL COUNTED:</span>
            <span>{formatCurrency(actualGrandTotal, settings.currency_symbol)}</span>
          </div>
          <div className="font-black flex justify-between text-sm">
            <span>NET DISCREPANCY:</span>
            <span>{totalDiff >= 0 ? `+${formatCurrency(totalDiff, settings.currency_symbol)}` : formatCurrency(totalDiff, settings.currency_symbol)}</span>
          </div>
        </div>

        {shift.closingNotes && (
          <div className="py-3 border-b border-black text-xs">
            <span className="font-bold">CLOSING NOTES:</span>
            <p className="italic">{shift.closingNotes}</p>
          </div>
        )}

        <div className="pt-10 flex justify-between text-xs">
          <div className="border-t border-black pt-1 w-44 text-center">
            <span>Cashier Signature</span>
          </div>
          <div className="border-t border-black pt-1 w-44 text-center">
            <span>Store Manager Verified</span>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>CLOSING RECONCILIATION REPORT</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Shift Audit & Variance Analysis
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            System calculated sales vs. physical register counts and payment discrepancies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToEdit}
            className="px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Edit Counts</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print EOD Report</span>
          </button>
        </div>
      </div>

      {/* Shift Overview Banner */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              GSR
            </div>
            <div>
              <h3 className="font-bold text-sm text-white uppercase">{settings.store_name}</h3>
              <p className="text-xs text-neutral-400 font-mono">
                Shift #{shift.id.slice(-6).toUpperCase()} · Cashier: <b>{shift.cashierFullName}</b>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs font-mono text-neutral-400">
            <div>Opened: {formatDateTime(shift.openedAt)}</div>
            <div>Closing: {formatDateTime(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Expected vs Actual Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Payment Method / Channel</th>
                <th className="py-3 px-4 text-right">System Expected</th>
                <th className="py-3 px-4 text-right">Actual Counted</th>
                <th className="py-3 px-4 text-right">Variance / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {/* Hand Cash */}
              <tr className="hover:bg-neutral-850">
                <td className="py-3.5 px-4 font-sans font-semibold text-neutral-100">
                  <span>Hand Cash in Drawer</span>
                  <span className="block text-[10px] text-neutral-500 font-mono">
                    (Starting Float: {formatCurrency(shift.openingCash, settings.currency_symbol)})
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right text-neutral-200">
                  {formatCurrency(shift.expectedCash, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                  {formatCurrency(actualCash, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {getVarianceBadge(cashDiff)}
                </td>
              </tr>

              {/* Online UPI */}
              <tr className="hover:bg-neutral-850">
                <td className="py-3.5 px-4 font-sans font-semibold text-neutral-100">
                  <span>Online Payments (UPI / QR)</span>
                </td>
                <td className="py-3.5 px-4 text-right text-neutral-200">
                  {formatCurrency(shift.expectedUpi, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                  {formatCurrency(actualUpi, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {getVarianceBadge(upiDiff)}
                </td>
              </tr>

              {/* Card Payments */}
              <tr className="hover:bg-neutral-850">
                <td className="py-3.5 px-4 font-sans font-semibold text-neutral-100">
                  <span>Card Terminal Receipts</span>
                </td>
                <td className="py-3.5 px-4 text-right text-neutral-200">
                  {formatCurrency(shift.expectedCard, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-sky-400">
                  {formatCurrency(actualCard, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {getVarianceBadge(cardDiff)}
                </td>
              </tr>

              {/* Other */}
              <tr className="hover:bg-neutral-850">
                <td className="py-3.5 px-4 font-sans font-semibold text-neutral-100">
                  <span>Other / Vouchers</span>
                </td>
                <td className="py-3.5 px-4 text-right text-neutral-200">
                  {formatCurrency(shift.expectedOther, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-purple-400">
                  {formatCurrency(actualOther, settings.currency_symbol)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {getVarianceBadge(otherDiff)}
                </td>
              </tr>

              {/* TOTALS */}
              <tr className="bg-neutral-950/80 font-bold text-sm">
                <td className="py-4 px-4 font-sans font-black text-white">
                  GRAND SETTLEMENT TOTAL
                </td>
                <td className="py-4 px-4 text-right text-neutral-200">
                  {formatCurrency(shift.expectedTotal, settings.currency_symbol)}
                </td>
                <td className="py-4 px-4 text-right text-amber-400">
                  {formatCurrency(actualGrandTotal, settings.currency_symbol)}
                </td>
                <td className="py-4 px-4 text-right">
                  {getVarianceBadge(totalDiff)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {shift.closingNotes && (
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 text-xs">
            <span className="font-semibold text-neutral-400">Cashier Closing Notes:</span>
            <p className="text-neutral-200 mt-1 italic">&ldquo;{shift.closingNotes}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Orders summary during this shift */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-white uppercase tracking-wider">
            Shift Orders Ledger ({shiftSales.length} Transactions)
          </span>
          <span className="font-mono text-neutral-400">
            Total Sales: {formatCurrency(shift.totalSalesAmount, settings.currency_symbol)}
          </span>
        </div>

        {shiftSales.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">No orders placed during this shift session.</p>
        ) : (
          <div className="max-h-48 overflow-y-auto divide-y divide-neutral-800/60 font-mono text-xs">
            {shiftSales.map((s) => (
              <div key={s.id} className="py-2 flex justify-between items-center">
                <div>
                  <span className="font-bold text-amber-400">{s.receipt_number}</span>
                  <span className="text-neutral-500 ml-2">({s.payment_method.toUpperCase()})</span>
                  <span className="text-neutral-400 ml-2">· {s.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                </div>
                <span className="font-bold text-neutral-200">
                  {formatCurrency(s.total_amount, settings.currency_symbol)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Final Action Bar */}
      <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white block">Ready to Close Sales Counter?</span>
          <p className="text-xs text-neutral-400">
            This will finalize the shift record, lock the register, and end the cashier's active session.
          </p>
        </div>

        <button
          type="button"
          onClick={onFinalizeCloseShift}
          className="px-6 py-3 bg-red-600 hover:bg-red-500 font-extrabold text-sm text-white rounded-xl shadow-lg transition-all flex items-center gap-2"
        >
          <span>Finalize EOD & Close Shift</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
