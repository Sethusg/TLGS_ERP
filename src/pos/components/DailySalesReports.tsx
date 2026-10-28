import React, { useState, useMemo } from 'react';
import { Sale, StoreSettings, ProductCategory, PaymentMethod } from '../types/pos';
import { formatCurrency, formatDateTime, formatTime, exportSalesToCSV } from '../utils/formatters';
import {
  exportSalesToExcel,
  exportSalesToWord,
  exportSalesToPDF,
} from '../utils/documentExport';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  PieChart,
  ShoppingBag,
  Clock,
  ArrowUpRight,
  Sparkles,
  FileText,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';

interface DailySalesReportsProps {
  sales: Sale[];
  categories: ProductCategory[];
  settings: StoreSettings;
  onSelectReceipt: (sale: Sale) => void;
}

export const DailySalesReports: React.FC<DailySalesReportsProps> = ({
  sales,
  categories,
  settings,
  onSelectReceipt,
}) => {
  const [selectedDateFilter, setSelectedDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [dailyDate, setDailyDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [cashierFilter, setCashierFilter] = useState<string>('All');

  // Human-readable timeframe label
  const timeframeLabel = useMemo(() => {
    if (selectedDateFilter === 'daily') {
      const isToday = dailyDate === new Date().toISOString().slice(0, 10);
      return isToday ? 'Daily (Today)' : `Daily (${dailyDate})`;
    }
    if (selectedDateFilter === 'weekly') return 'Weekly (Last 7 Days)';
    if (selectedDateFilter === 'monthly') return 'Monthly (Last 30 Days)';
    return `Custom Range (${fromDate} to ${toDate})`;
  }, [selectedDateFilter, dailyDate, fromDate, toDate]);

  // Filter sales based on timeframe, category, and cashier
  const filteredSales = useMemo(() => {
    // 1. Daily bounds
    const startOfDaily = new Date(dailyDate);
    startOfDaily.setHours(0, 0, 0, 0);
    const endOfDaily = new Date(dailyDate);
    endOfDaily.setHours(23, 59, 59, 999);

    // 2. Weekly bounds (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 3. Monthly bounds (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 4. Custom range bounds
    const startCustom = new Date(fromDate);
    startCustom.setHours(0, 0, 0, 0);
    const endCustom = new Date(toDate);
    endCustom.setHours(23, 59, 59, 999);

    return sales.filter((s) => {
      const saleDate = new Date(s.created_at);

      let matchesDate = false;
      if (selectedDateFilter === 'daily') {
        matchesDate = saleDate >= startOfDaily && saleDate <= endOfDaily;
      } else if (selectedDateFilter === 'weekly') {
        matchesDate = saleDate >= sevenDaysAgo;
      } else if (selectedDateFilter === 'monthly') {
        matchesDate = saleDate >= thirtyDaysAgo;
      } else if (selectedDateFilter === 'custom') {
        matchesDate = saleDate >= startCustom && saleDate <= endCustom;
      }

      const matchesCashier = cashierFilter === 'All' || s.cashier_username.includes(cashierFilter);

      const matchesCategory =
        selectedCategoryFilter === 'All' ||
        s.items.some((item) => (item.category || '').toLowerCase() === selectedCategoryFilter.toLowerCase());

      return matchesDate && matchesCashier && matchesCategory;
    });
  }, [sales, selectedDateFilter, dailyDate, fromDate, toDate, cashierFilter, selectedCategoryFilter]);

  // Aggregate Performance Metrics
  const grossSales = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.subtotal, 0);
  }, [filteredSales]);

  const totalDiscount = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.discount_amount, 0);
  }, [filteredSales]);

  const totalTax = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.tax_amount, 0);
  }, [filteredSales]);

  const netSales = useMemo(() => {
    return filteredSales.reduce((acc, s) => acc + s.total_amount, 0);
  }, [filteredSales]);

  const ordersCount = filteredSales.length;
  const avgOrderValue = ordersCount > 0 ? netSales / ordersCount : 0;

  const totalUnitsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);
  }, [filteredSales]);

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const map: Record<PaymentMethod, { count: number; amount: number }> = {
      cash: { count: 0, amount: 0 },
      card: { count: 0, amount: 0 },
      upi: { count: 0, amount: 0 },
      wallet: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 },
    };

    filteredSales.forEach((s) => {
      const m = s.payment_method;
      if (map[m]) {
        map[m].count += 1;
        map[m].amount += s.total_amount;
      }
    });

    return map;
  }, [filteredSales]);

  // Category Sales Breakdown & Contribution Analysis
  const categoryPerformance = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; units: number }>();

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const cat = item.category || 'General';
        const prev = map.get(cat) || { name: cat, revenue: 0, units: 0 };
        prev.revenue += item.line_total;
        prev.units += item.quantity;
        map.set(cat, prev);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales]);

  // Top Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sku: string; units: number; revenue: number; category: string }>();

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prev = map.get(item.product_id) || {
          name: item.product_name,
          sku: item.sku,
          category: item.category || 'General',
          units: 0,
          revenue: 0,
        };
        prev.units += item.quantity;
        prev.revenue += item.line_total;
        map.set(item.product_id, prev);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 8);
  }, [filteredSales]);

  // Hourly Sales Distribution
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM
    return hours.map((hour) => {
      const salesInHour = filteredSales.filter((s) => {
        const d = new Date(s.created_at);
        return d.getHours() === hour;
      });
      const revenue = salesInHour.reduce((sum, s) => sum + s.total_amount, 0);
      return {
        hour,
        label: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
        count: salesInHour.length,
        revenue,
      };
    });
  }, [filteredSales]);

  const maxHourlyRevenue = Math.max(...hourlyData.map((h) => h.revenue), 100);

  const reportLabel = timeframeLabel;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Printable End-of-Day Z-Report Container (Only visible during print) */}
      <div className="hidden print-report-area">
        <div className="text-center pb-4 border-b border-black">
          <h1 className="text-xl font-bold uppercase">{settings.store_name}</h1>
          <p className="text-xs">DAILY SETTLEMENT REPORT (Z-REPORT)</p>
          <p className="text-xs">{settings.address} · Tel: {settings.phone}</p>
          <p className="text-xs font-mono">GST / Tax ID: {settings.tax_number}</p>
          <p className="text-xs font-mono font-bold mt-1">
            Date: {reportLabel} · Category: {selectedCategoryFilter} · Generated: {formatDateTime(new Date().toISOString())}
          </p>
        </div>

        <div className="py-4 border-b border-black space-y-1 font-mono text-xs">
          <div className="flex justify-between font-bold">
            <span>GROSS SALES:</span>
            <span>{formatCurrency(grossSales, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL DISCOUNTS:</span>
            <span>−{formatCurrency(totalDiscount, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL TAX / GST:</span>
            <span>{formatCurrency(totalTax, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between text-sm font-black pt-1 border-t border-dashed border-black">
            <span>NET TOTAL COLLECTED:</span>
            <span>{formatCurrency(netSales, settings.currency_symbol)}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span>TRANSACTIONS COUNT:</span>
            <span>{ordersCount}</span>
          </div>
          <div className="flex justify-between">
            <span>TOTAL ITEMS SOLD:</span>
            <span>{totalUnitsSold}</span>
          </div>
          <div className="flex justify-between">
            <span>AVERAGE TICKET (AOV):</span>
            <span>{formatCurrency(avgOrderValue, settings.currency_symbol)}</span>
          </div>
        </div>

        <div className="py-4 border-b border-black space-y-1 font-mono text-xs">
          <p className="font-bold underline">PAYMENT METHOD RECONCILIATION</p>
          <div className="flex justify-between">
            <span>STUDENT WALLET:</span>
            <span>{formatCurrency(paymentBreakdown.wallet.amount, settings.currency_symbol)} ({paymentBreakdown.wallet.count} txns)</span>
          </div>
          <div className="flex justify-between">
            <span>CASH IN DRAWER:</span>
            <span>{formatCurrency(paymentBreakdown.cash.amount, settings.currency_symbol)} ({paymentBreakdown.cash.count} txns)</span>
          </div>
          <div className="flex justify-between">
            <span>UPI / DIGITAL QR:</span>
            <span>{formatCurrency(paymentBreakdown.upi.amount, settings.currency_symbol)} ({paymentBreakdown.upi.count} txns)</span>
          </div>
          <div className="flex justify-between">
            <span>CARD / POS TERMINAL:</span>
            <span>{formatCurrency(paymentBreakdown.card.amount, settings.currency_symbol)} ({paymentBreakdown.card.count} txns)</span>
          </div>
        </div>

        <div className="py-4 border-b border-black space-y-1 font-mono text-xs">
          <p className="font-bold underline">CATEGORY REVENUE ANALYSIS</p>
          {categoryPerformance.map((c) => (
            <div key={c.name} className="flex justify-between">
              <span>{c.name} ({c.units} units):</span>
              <span>{formatCurrency(c.revenue, settings.currency_symbol)}</span>
            </div>
          ))}
        </div>

        <div className="pt-8 text-xs font-mono flex justify-between">
          <div className="border-t border-black pt-1 w-40 text-center">
            <span>Cashier Signature</span>
          </div>
          <div className="border-t border-black pt-1 w-40 text-center">
            <span>Store Manager Sign</span>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>POS Sales & Financial Audit Reports</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {timeframeLabel}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time daily, weekly, monthly and custom date range auditing with Word, Excel, and PDF exports.
          </p>
        </div>

        {/* Universal Export Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              exportSalesToExcel(
                filteredSales,
                { grossSales, netSales, totalDiscount, totalTax, ordersCount, timeframeLabel },
                settings,
                `TLGS_Sales_${timeframeLabel.replace(/\s+/g, '_')}`
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl transition-colors shadow-sm"
            title="Download formatted Excel workbook (.xlsx) with summary & transactions"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportSalesToWord(
                filteredSales,
                { grossSales, netSales, totalDiscount, totalTax, ordersCount, timeframeLabel },
                settings
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 rounded-xl transition-colors shadow-sm"
            title="Download Word document (.doc) with executive tables"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Word (.doc)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportSalesToPDF(
                filteredSales,
                { grossSales, netSales, totalDiscount, totalTax, ordersCount, timeframeLabel },
                settings
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 rounded-xl transition-colors shadow-sm"
            title="Generate high-resolution printable PDF report"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>PDF Document</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Z-Report</span>
          </button>
        </div>
      </div>

      {/* Date & Category Filter Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Presets */}
          <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setSelectedDateFilter('daily')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedDateFilter === 'daily'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Daily
            </button>

            <button
              type="button"
              onClick={() => setSelectedDateFilter('weekly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedDateFilter === 'weekly'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Weekly
            </button>

            <button
              type="button"
              onClick={() => setSelectedDateFilter('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedDateFilter === 'monthly'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setSelectedDateFilter('custom')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedDateFilter === 'custom'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Daily Date Picker */}
          {selectedDateFilter === 'daily' && (
            <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded-xl border border-neutral-800 text-xs">
              <span className="text-neutral-400">Date:</span>
              <input
                type="date"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-amber-300 font-mono text-xs px-2 py-0.5 rounded focus:outline-none"
              />
            </div>
          )}

          {/* Custom Date Range Pickers (From Date to To Date) */}
          {selectedDateFilter === 'custom' && (
            <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1 rounded-xl border border-neutral-800 text-xs font-mono">
              <span className="text-neutral-400">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-amber-300 text-xs px-2 py-0.5 rounded focus:outline-none"
              />
              <span className="text-neutral-400">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-amber-300 text-xs px-2 py-0.5 rounded focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter for Sales Analysis */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 py-1.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                Category: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Net Sales Revenue</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {formatCurrency(netSales, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">After discounts</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Gross Sales</span>
          <p className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatCurrency(grossSales, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">Pre-tax subtotal</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Taxes Collected</span>
          <p className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatCurrency(totalTax, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">GST / VAT total</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Discounts Given</span>
          <p className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {formatCurrency(totalDiscount, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">Loyalty & promo</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Transactions</span>
          <p className="text-xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
            {ordersCount}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">Receipts issued</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <span className="text-xs text-neutral-400">Avg Ticket (AOV)</span>
          <p className="text-xl font-bold font-mono text-white mt-1 tabular-nums">
            {formatCurrency(avgOrderValue, settings.currency_symbol)}
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 block">Per customer ticket</span>
        </div>
      </div>

      {/* Category Performance & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Revenue Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white">Category Sales Analysis</h3>
              <p className="text-xs text-neutral-400">Revenue and units contributed per category</p>
            </div>
            <PieChart className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-3">
            {categoryPerformance.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">No category data in period</p>
            ) : (
              categoryPerformance.map((c) => {
                const share = netSales > 0 ? (c.revenue / netSales) * 100 : 0;
                return (
                  <div key={c.name} className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-neutral-200">{c.name}</span>
                      <span className="font-mono font-bold text-amber-400">
                        {formatCurrency(c.revenue, settings.currency_symbol)}
                      </span>
                    </div>

                    <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, share))}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                      <span>{c.units} units sold</span>
                      <span>{share.toFixed(1)}% share</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-bold text-white">Payment Method Distribution</h3>
              <p className="text-xs text-neutral-400">Reconciliation by payment tender</p>
            </div>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Cash in Drawer</span>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {paymentBreakdown.cash.count} txns ({netSales > 0 ? ((paymentBreakdown.cash.amount / netSales) * 100).toFixed(0) : 0}%)
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-neutral-100 tabular-nums">
                {formatCurrency(paymentBreakdown.cash.amount, settings.currency_symbol)}
              </span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">UPI / QR Transfer</span>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {paymentBreakdown.upi.count} txns ({netSales > 0 ? ((paymentBreakdown.upi.amount / netSales) * 100).toFixed(0) : 0}%)
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-neutral-100 tabular-nums">
                {formatCurrency(paymentBreakdown.upi.amount, settings.currency_symbol)}
              </span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Credit / Debit Card</span>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {paymentBreakdown.card.count} txns ({netSales > 0 ? ((paymentBreakdown.card.amount / netSales) * 100).toFixed(0) : 0}%)
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-neutral-100 tabular-nums">
                {formatCurrency(paymentBreakdown.card.amount, settings.currency_symbol)}
              </span>
            </div>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-neutral-200">Student Canteen Wallet</span>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {paymentBreakdown.wallet.count} txns ({netSales > 0 ? ((paymentBreakdown.wallet.amount / netSales) * 100).toFixed(0) : 0}%)
                  </p>
                </div>
              </div>
              <span className="font-mono font-bold text-sm text-emerald-400 tabular-nums">
                {formatCurrency(paymentBreakdown.wallet.amount, settings.currency_symbol)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Sales Velocity Graph */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-sm font-bold text-white">Hourly Sales Velocity</h3>
            <p className="text-xs text-neutral-400">Trading cadence from 08:00 to 21:00</p>
          </div>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>

        <div className="h-44 flex items-end justify-between gap-1.5 pt-4">
          {hourlyData.map((slot) => {
            const heightPct = Math.min(100, Math.max(8, (slot.revenue / maxHourlyRevenue) * 100));
            return (
              <div key={slot.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-200 px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity z-10">
                  {slot.label}: {formatCurrency(slot.revenue, settings.currency_symbol)} ({slot.count} orders)
                </div>

                <div className="w-full bg-neutral-950 rounded-t h-32 flex items-end p-0.5">
                  <div
                    style={{ height: `${slot.revenue > 0 ? heightPct : 4}%` }}
                    className={`w-full rounded-t transition-all ${
                      slot.revenue > 0 ? 'bg-amber-500 group-hover:bg-amber-400' : 'bg-neutral-800'
                    }`}
                  />
                </div>

                <span className="text-[9px] font-mono text-neutral-400 truncate">
                  {slot.hour}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Products Leaderboard */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Top Performing Products</h3>
            <p className="text-xs text-neutral-400">Ranked by volume and revenue contribution</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Product Name / SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue Contributed</th>
                <th className="py-3 px-4 text-right">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-neutral-500">
                    No product sales found for this filter.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => {
                  const share = netSales > 0 ? (p.revenue / netSales) * 100 : 0;
                  return (
                    <tr key={p.sku} className="hover:bg-neutral-850 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">#{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-neutral-100">{p.name}</span>
                        <span className="block font-mono text-[10px] text-neutral-500">{p.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-neutral-400">{p.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-neutral-200 tabular-nums">
                        {p.units}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(p.revenue, settings.currency_symbol)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-400 tabular-nums">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Sales Register */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Sales Register ({filteredSales.length} Transactions)</h3>
            <p className="text-xs text-neutral-400">Detailed customer receipt records</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4 text-right">Net Total</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-850 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {sale.receipt_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-300">
                      {formatTime(sale.created_at)}
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{sale.cashier_username}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      {sale.customer_name ? (
                        <div>
                          <span className="font-semibold text-neutral-200">{sale.customer_name}</span>
                          <span className="block text-[10px] text-neutral-500 font-mono">{sale.customer_phone}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic">Walk-in</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-neutral-300 tabular-nums">
                      {sale.items.reduce((acc, i) => acc + i.quantity, 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-950 border border-neutral-800 text-neutral-300">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-100 tabular-nums">
                      {formatCurrency(sale.total_amount, settings.currency_symbol)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectReceipt(sale)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Receipt className="w-3 h-3 text-amber-400" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
