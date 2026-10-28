import React, { useState } from 'react';
import { CartItem, Customer, Sale, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Monitor,
  QrCode,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Search,
  Receipt,
  CheckCircle,
  ArrowRight,
  User,
} from 'lucide-react';

interface CustomerFacingDisplayProps {
  settings: StoreSettings;
  activeCart: CartItem[];
  customers: Customer[];
  selectedCustomerId?: string;
  sales: Sale[];
  onSelectReceipt: (sale: Sale) => void;
}

export const CustomerFacingDisplay: React.FC<CustomerFacingDisplayProps> = ({
  settings,
  activeCart,
  customers,
  selectedCustomerId,
  sales,
  onSelectReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'mirror' | 'lookup'>('mirror');
  const [lookupQuery, setLookupQuery] = useState('');

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Cart calculations
  const subtotal = activeCart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const totalTax = activeCart.reduce(
    (tax, item) => tax + (item.unit_price * item.quantity * item.tax_rate) / 100,
    0
  );
  const grandTotal = subtotal + totalTax;
  const potentialPoints = Math.floor(grandTotal / 10);

  // Customer receipt lookup results
  const lookupSales = React.useMemo(() => {
    if (!lookupQuery.trim()) return [];
    const q = lookupQuery.trim().toLowerCase();
    return sales.filter(
      (s) =>
        s.receipt_number.toLowerCase().includes(q) ||
        (s.customer_phone && s.customer_phone.includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q))
    );
  }, [sales, lookupQuery]);

  return (
    <div className="max-w-[1440px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Customer Display</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Customer Interactive Terminal</h2>
          <p className="text-xs text-neutral-400">
            Real-time mirror for the customer counter screen and self-service receipt lookup.
          </p>
        </div>

        {/* Segmented Mode Control */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-xl border border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('mirror')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'mirror'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Live Cart Mirror</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('lookup')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'lookup'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Digital Receipt Lookup</span>
          </button>
        </div>
      </div>

      {/* MODE 1: LIVE CART MIRROR DISPLAY */}
      {activeTab === 'mirror' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side: Order breakdown */}
          <div className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[500px]">
            <div>
              {/* Store & Greeting Header */}
              <div className="flex items-start justify-between pb-6 border-b border-neutral-800">
                <div>
                  <span className="text-xs font-mono text-amber-400 tracking-wider">
                    WELCOME TO
                  </span>
                  <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                    {settings.store_name}
                  </h1>
                  <p className="text-xs text-neutral-400 mt-1">{settings.address}</p>
                </div>

                {currentCustomer ? (
                  <div className="text-right bg-neutral-950/80 border border-neutral-800 px-4 py-2.5 rounded-xl">
                    <span className="text-[10px] uppercase font-mono text-neutral-400">Valued Member</span>
                    <p className="text-sm font-bold text-amber-300">{currentCustomer.name}</p>
                    <p className="text-xs text-neutral-400 font-mono">
                      Tier: <b className="text-white">{currentCustomer.tier}</b> · {currentCustomer.loyalty_points} pts
                    </p>
                  </div>
                ) : (
                  <div className="text-right text-xs text-neutral-500 font-mono">
                    <span>Ask cashier to link Student Canteen Card</span>
                  </div>
                )}
              </div>

              {/* Items in Cart Table */}
              <div className="mt-6">
                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/80">
                  <span className="w-1/2">Item Description</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/6 text-right">Unit Price</span>
                  <span className="w-1/6 text-right">Total</span>
                </div>

                <div className="divide-y divide-neutral-800/60 max-h-[300px] overflow-y-auto">
                  {activeCart.length === 0 ? (
                    <div className="py-16 text-center text-neutral-500 space-y-2">
                      <ShoppingBag className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                      <p className="text-base font-medium text-neutral-300">Ready for your order</p>
                      <p className="text-xs text-neutral-500">Items selected at the canteen counter will appear here</p>
                    </div>
                  ) : (
                    activeCart.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between text-sm">
                        <div className="w-1/2 pr-2">
                          <p className="font-semibold text-neutral-100 flex items-center gap-1.5">
                            {item.product.dietary && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                  item.product.dietary === 'veg'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : item.product.dietary === 'non-veg'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-sky-500/20 text-sky-400'
                                }`}
                              >
                                {item.product.dietary}
                              </span>
                            )}
                            {item.product.name}
                          </p>
                          <p className="text-xs font-mono text-neutral-400">{item.product.sku}</p>
                        </div>
                        <div className="w-1/6 text-center font-mono font-bold text-neutral-200">
                          {item.quantity}
                        </div>
                        <div className="w-1/6 text-right font-mono text-neutral-400 text-xs">
                          {formatCurrency(item.unit_price, settings.currency_symbol)}
                        </div>
                        <div className="w-1/6 text-right font-mono font-bold text-neutral-100">
                          {formatCurrency(item.unit_price * item.quantity, settings.currency_symbol)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Loyalty Feedback Footer */}
            {activeCart.length > 0 && potentialPoints > 0 && (
              <div className="mt-6 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>You will earn <b>+{potentialPoints} Loyalty Points</b> on this purchase!</span>
                </span>
                <span className="font-mono text-[11px] text-amber-400/80">10 pts = {settings.currency_symbol}10 off next time</span>
              </div>
            )}
          </div>

          {/* Right Side: Total & Pay QR */}
          <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Payment Terminal Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Payment Due</span>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                  <span>Contactless / UPI</span>
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 text-center space-y-1">
                <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Grand Total</span>
                <div className="text-4xl font-black font-mono text-amber-400 tabular-nums">
                  {formatCurrency(grandTotal, settings.currency_symbol)}
                </div>
                <div className="text-xs text-neutral-400 pt-2 flex justify-between border-t border-neutral-800/80 mt-3 font-mono">
                  <span>Subtotal: {formatCurrency(subtotal, settings.currency_symbol)}</span>
                  <span>Taxes: {formatCurrency(totalTax, settings.currency_symbol)}</span>
                </div>
              </div>

              {/* QR Code for Instant UPI Payment */}
              {activeCart.length > 0 && (
                <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 text-center space-y-3">
                  <div className="w-44 h-44 mx-auto bg-white p-3 rounded-xl shadow-md flex flex-col items-center justify-center">
                    <QrCode className="w-24 h-24 text-neutral-950" />
                    <span className="text-[10px] font-mono font-bold text-neutral-800 mt-1">
                      SCAN TO PAY VIA UPI
                    </span>
                    <span className="text-[9px] font-mono text-neutral-500">
                      GSR-MERCHANT-TERMINAL
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">Scan with GPay, PhonePe, Paytm, or UPI App</p>
                </div>
              )}
            </div>

            <div className="pt-4 text-center text-xs text-neutral-500 font-mono border-t border-neutral-800/80">
              <span>{settings.receipt_footer}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: CUSTOMER SELF-SERVICE RECEIPT / ORDER LOOKUP */}
      {activeTab === 'lookup' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Customer Receipt & Warranty Lookup</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Enter your mobile phone number, customer name, or receipt number to inspect past digital receipts.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="e.g. 98111 22334, Aarav, or GSR-2026..."
              className="w-full bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Lookup Results */}
          <div>
            {lookupQuery.trim() === '' ? (
              <div className="py-12 text-center text-neutral-500">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                <p className="text-sm">Type your phone number or receipt ID above</p>
              </div>
            ) : lookupSales.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 bg-neutral-950 rounded-2xl border border-neutral-800">
                <p className="text-sm">No receipts found matching &ldquo;{lookupQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lookupSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col justify-between hover:border-amber-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {sale.receipt_number}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-neutral-800 px-2 py-0.5 rounded text-neutral-300">
                          {sale.payment_method}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">{formatDateTime(sale.created_at)}</p>

                      <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-1 text-xs">
                        <div className="flex justify-between text-neutral-400">
                          <span>Items:</span>
                          <span>{sale.items.reduce((acc, i) => acc + i.quantity, 0)} items</span>
                        </div>
                        <div className="flex justify-between text-neutral-200 font-semibold">
                          <span>Total Paid:</span>
                          <span className="font-mono">{formatCurrency(sale.total_amount, settings.currency_symbol)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectReceipt(sale)}
                      className="mt-4 w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View & Reprint Receipt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
