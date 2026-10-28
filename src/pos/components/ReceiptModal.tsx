import React, { useState, useEffect } from 'react';
import { Sale, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { executeThermalPrint, generateThermalReceiptText, ThermalRollWidth } from '../utils/thermalPrinter';
import {
  Printer,
  X,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  Utensils,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale;
  settings: StoreSettings;
  onClose: () => void;
  autoCloseAfterMs?: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  onClose,
  autoCloseAfterMs,
}) => {
  const [rollWidth, setRollWidth] = useState<ThermalRollWidth>(
    settings.thermal_printer_width || '80mm'
  );
  const [printOption, setPrintOption] = useState<'both' | 'receipt' | 'token'>('both');
  const [copied, setCopied] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(autoCloseAfterMs || 0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Auto-close countdown effect
  useEffect(() => {
    if (!autoCloseAfterMs || isPaused) return;

    const interval = 50;
    const timer = setInterval(() => {
      setTimeLeftMs((prev) => {
        const next = prev - interval;
        if (next <= 0) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [autoCloseAfterMs, isPaused, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleThermalPrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, rollWidth, printOption, sale, settings]);

  const earnedPoints = Math.floor(sale.total_amount / (settings.loyalty_points_per_currency || 10));
  const tokenNumber =
    sale.token_number || parseInt(sale.receipt_number.replace(/\D/g, '').slice(-2), 10) || 1;

  const handleThermalPrint = () => {
    executeThermalPrint(sale, settings, {
      width: rollWidth,
      printCustomerReceipt: printOption === 'both' || printOption === 'receipt',
      printKitchenToken: printOption === 'both' || printOption === 'token',
    });
  };

  const handleCopyRawText = () => {
    const text = generateThermalReceiptText(sale, settings, {
      width: rollWidth,
      printCustomerReceipt: printOption === 'both' || printOption === 'receipt',
      printKitchenToken: printOption === 'both' || printOption === 'token',
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Auto-close Top Animated Progress Bar */}
        {autoCloseAfterMs && autoCloseAfterMs > 0 && (
          <div className="w-full bg-neutral-950 h-1.5 overflow-hidden border-b border-neutral-800/80">
            <div
              className={`h-full transition-all duration-75 ease-linear ${
                isPaused
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-400'
              }`}
              style={{ width: `${Math.max(0, (timeLeftMs / autoCloseAfterMs) * 100)}%` }}
            />
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2.5 text-emerald-400">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Order Completed
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  TOKEN #{tokenNumber}
                </span>

                {autoCloseAfterMs && autoCloseAfterMs > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                    title={isPaused ? "Auto-close paused. Click to resume." : "Click to keep receipt open"}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                    <span>{isPaused ? 'Auto-close Paused' : `Auto-close in ${(timeLeftMs / 1000).toFixed(1)}s`}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-neutral-400 font-mono">{sale.receipt_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Printer Settings Bar */}
        <div className="px-6 py-2.5 bg-neutral-950/90 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-neutral-400">Roll Width:</span>
            <div className="flex items-center p-0.5 bg-neutral-900 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setRollWidth('80mm')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md font-bold transition-all ${
                  rollWidth === '80mm'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                80mm (Standard POS)
              </button>
              <button
                type="button"
                onClick={() => setRollWidth('58mm')}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md font-bold transition-all ${
                  rollWidth === '58mm'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                58mm (Compact Roll)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-400">Print Mode:</span>
            <div className="flex items-center p-0.5 bg-neutral-900 rounded-lg border border-neutral-800 text-[11px]">
              <button
                type="button"
                onClick={() => setPrintOption('both')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  printOption === 'both'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Print both Customer Receipt and Kitchen Token"
              >
                Both Slips
              </button>
              <button
                type="button"
                onClick={() => setPrintOption('receipt')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  printOption === 'receipt'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Customer Sales Receipt only"
              >
                Receipt
              </button>
              <button
                type="button"
                onClick={() => setPrintOption('token')}
                className={`px-2 py-1 rounded-md font-medium transition-all ${
                  printOption === 'token'
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Kitchen Order Token only"
              >
                KOT Token
              </button>
            </div>
          </div>
        </div>

        {/* Live Thermal Receipt Paper Preview */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-neutral-950/80 flex justify-center">
          <div
            className={`printable-area bg-[#fafaf9] text-neutral-900 p-4 sm:p-5 rounded-lg shadow-xl font-mono text-xs leading-relaxed border border-neutral-300 transition-all ${
              rollWidth === '58mm' ? 'w-[280px] text-[10px]' : 'w-[360px] text-[11px]'
            }`}
          >
            {/* Visual jagged receipt edge at top */}
            <div className="border-b-2 border-dashed border-neutral-300 pb-3 mb-3 text-center">
              {settings.school_name && (
                <p className="font-extrabold text-[12px] tracking-tight uppercase text-neutral-800">
                  {settings.school_name}
                </p>
              )}
              <h1 className="font-black text-sm tracking-tight text-neutral-950 uppercase mt-0.5">
                {settings.store_name}
              </h1>
              {settings.counter_name && (
                <p className="text-[11px] font-semibold text-neutral-700">{settings.counter_name}</p>
              )}
              {settings.address && (
                <p className="text-[10px] text-neutral-500 mt-0.5">{settings.address}</p>
              )}
              {settings.canteen_license && (
                <p className="text-[10px] font-mono text-neutral-600 mt-0.5 font-bold">
                  {settings.canteen_license}
                </p>
              )}
              {settings.tax_number && (
                <p className="text-[9px] text-neutral-500 font-mono">GSTIN: {settings.tax_number}</p>
              )}
            </div>

            {/* Food Pickup Token Callout Box */}
            <div className="my-2.5 p-2.5 border-2 border-dashed border-neutral-900 rounded-lg text-center bg-neutral-100">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-neutral-600 block">
                Food Collection Token
              </span>
              <span className="text-2xl font-black font-mono tracking-tight text-neutral-950 block my-0.5">
                #{tokenNumber}
              </span>
              <span className="text-[9px] text-neutral-500 font-sans font-medium block">
                Present this slip at food dispensary counter
              </span>
            </div>

            {/* Receipt Meta */}
            <div className="py-2 border-y border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Receipt No:</span>
                <span className="font-bold">{sale.receipt_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Date & Time:</span>
                <span>{formatDateTime(sale.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cashier:</span>
                <span>{sale.cashier_username}</span>
              </div>
              {sale.meal_session && (
                <div className="flex justify-between text-neutral-700">
                  <span className="text-neutral-500">Meal Session:</span>
                  <span className="font-bold text-amber-800">{sale.meal_session}</span>
                </div>
              )}

              {/* Student Details */}
              {(sale.customer_name || sale.student_id) && (
                <div className="mt-1 pt-1 border-t border-dotted border-neutral-300">
                  <div className="flex justify-between text-neutral-800 font-semibold">
                    <span>Student / Staff:</span>
                    <span>{sale.customer_name}</span>
                  </div>
                  {sale.grade_section && (
                    <div className="flex justify-between text-[10px] text-neutral-600">
                      <span>Class / Grade:</span>
                      <span className="font-mono">{sale.grade_section}</span>
                    </div>
                  )}
                  {sale.student_id && (
                    <div className="flex justify-between text-[10px] text-neutral-600">
                      <span>Admission No:</span>
                      <span className="font-mono">{sale.student_id}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Items Header */}
            <div className="py-1.5 border-b border-neutral-300 flex justify-between font-bold text-[10px] text-neutral-700 uppercase">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/3 text-right">Amount</span>
            </div>

            {/* Items List */}
            <div className="py-2 space-y-1.5 border-b border-neutral-300">
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="w-1/2 pr-1">
                    <p className="font-semibold text-neutral-900 leading-snug">
                      {item.dietary && (
                        <span
                          className={`mr-1 px-1 py-0.2 text-[9px] font-bold rounded ${
                            item.dietary === 'veg'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.dietary === 'non-veg'
                              ? 'bg-red-100 text-red-800'
                              : item.dietary === 'healthy'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.dietary.toUpperCase()}
                        </span>
                      )}
                      {item.product_name}
                    </p>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      @{formatCurrency(item.unit_price, settings.currency_symbol)}
                    </p>
                  </div>
                  <div className="w-1/6 text-center font-mono font-bold">{item.quantity}</div>
                  <div className="w-1/3 text-right font-mono font-semibold">
                    {formatCurrency(item.line_total, settings.currency_symbol)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-2 border-b border-dashed border-neutral-300 space-y-1">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(sale.subtotal, settings.currency_symbol)}</span>
              </div>

              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Student Discount:</span>
                  <span className="font-mono">
                    −{formatCurrency(sale.discount_amount, settings.currency_symbol)}
                  </span>
                </div>
              )}

              {sale.tax_amount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>GST / Tax:</span>
                  <span className="font-mono">{formatCurrency(sale.tax_amount, settings.currency_symbol)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-neutral-300 text-sm font-black text-neutral-950">
                <span>TOTAL PAYABLE:</span>
                <span className="font-mono">{formatCurrency(sale.total_amount, settings.currency_symbol)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Tender:</span>
                <span className="font-bold uppercase tracking-wider text-neutral-900">
                  {sale.payment_method === 'wallet' ? 'Student Canteen Wallet' : sale.payment_method}
                </span>
              </div>

              {sale.payment_method === 'cash' && (
                <>
                  <div className="flex justify-between text-neutral-600">
                    <span>Cash Received:</span>
                    <span className="font-mono">
                      {formatCurrency(sale.amount_tendered, settings.currency_symbol)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-neutral-900">
                    <span>Change Returned:</span>
                    <span className="font-mono">
                      {formatCurrency(sale.change_due, settings.currency_symbol)}
                    </span>
                  </div>
                </>
              )}

              {sale.payment_method === 'wallet' && (
                <div className="mt-1 p-2 bg-neutral-100 rounded border border-neutral-200 text-[10px] space-y-0.5">
                  {sale.wallet_previous_balance !== undefined && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Previous Wallet Balance:</span>
                      <span className="font-mono">
                        {formatCurrency(sale.wallet_previous_balance, settings.currency_symbol)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-neutral-800">
                    <span>Meal Deduction:</span>
                    <span className="font-mono text-red-600">
                      −{formatCurrency(sale.total_amount, settings.currency_symbol)}
                    </span>
                  </div>
                  {sale.wallet_remaining_balance !== undefined && (
                    <div className="flex justify-between font-extrabold text-neutral-900 pt-0.5 border-t border-neutral-300">
                      <span>Remaining Wallet Balance:</span>
                      <span className="font-mono text-emerald-700">
                        {formatCurrency(sale.wallet_remaining_balance, settings.currency_symbol)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {earnedPoints > 0 && (
                <div className="mt-1 pt-1 border-t border-dotted border-neutral-300 flex justify-between text-amber-800 text-[10px] font-bold">
                  <span>Loyalty Points Earned:</span>
                  <span>+{earnedPoints} pts</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-neutral-500 space-y-1">
              <p className="font-semibold text-neutral-700">{settings.receipt_footer}</p>
              <p className="text-[9px] text-neutral-400">*** 100% HYGIENIC CANTEEN CERTIFIED ***</p>
              <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-1">
                TLGS CANTEEN THERMAL ESC/POS SYSTEM
              </p>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRawText}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
              title="Copy ESC/POS raw plaintext for serial or Bluetooth thermal printing"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied ESC/POS' : 'Copy ESC/POS'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition-colors"
              title="Standard browser print dialog"
            >
              Browser Print
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white bg-neutral-900 rounded-xl transition-colors"
            >
              Done
            </button>

            <button
              type="button"
              onClick={handleThermalPrint}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Thermal Receipt ({rollWidth})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
