import React, { useMemo } from 'react';
import {
  Sale,
  Product,
  Customer,
  StoreSettings,
  ShiftSession,
  PosUser,
  ActiveTab,
  PaymentMethod,
} from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { checkRelievingDate } from '../utils/customerRelieving';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Users,
  AlertTriangle,
  Boxes,
  Clock,
  Utensils,
  Leaf,
  Flame,
  ArrowRight,
  UserPlus,
  Receipt,
  Printer,
  ShieldAlert,
  ChevronRight,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface CanteenDashboardProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  settings: StoreSettings;
  activeShift: ShiftSession | null;
  currentUser: PosUser | null;
  lowStockCount: number;
  onNavigateToTab: (tab: ActiveTab) => void;
  onOpenCustomerModal: () => void;
  onSelectReceipt: (sale: Sale) => void;
  onToggleDisableCustomer?: (customerId: string, newDisabled: boolean) => void;
  onOpenNotifications?: () => void;
}

export const CanteenDashboard: React.FC<CanteenDashboardProps> = ({
  sales,
  products,
  customers,
  settings,
  activeShift,
  currentUser,
  lowStockCount,
  onNavigateToTab,
  onOpenCustomerModal,
  onSelectReceipt,
  onToggleDisableCustomer,
  onOpenNotifications,
}) => {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Today's sales
  const todaySales = useMemo(() => {
    return sales.filter((s) => s.created_at.startsWith(todayStr));
  }, [sales, todayStr]);

  // If today's sales are empty (e.g. initial demo load on different date), use all current sales or current shift sales
  const displaySales = todaySales.length > 0 ? todaySales : sales.slice(0, 50);

  // Today's total revenue & payment breakdown
  const todayTotalRevenue = useMemo(() => {
    return displaySales.reduce((sum, s) => sum + s.total_amount, 0);
  }, [displaySales]);

  const paymentBreakdown = useMemo(() => {
    const counts: Record<PaymentMethod, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      upi: { count: 0, total: 0 },
      wallet: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    };

    displaySales.forEach((s) => {
      const pm = s.payment_method;
      if (counts[pm]) {
        counts[pm].count += 1;
        counts[pm].total += s.total_amount;
      }
    });

    return counts;
  }, [displaySales]);

  // Total tokens issued today
  const totalTokensIssued = displaySales.length;
  const lastTokenNumber = useMemo(() => {
    const withToken = displaySales.filter((s) => s.token_number !== undefined);
    if (withToken.length > 0) {
      return withToken[0].token_number;
    }
    return totalTokensIssued > 0 ? totalTokensIssued : 1;
  }, [displaySales, totalTokensIssued]);

  // Canteen Wallet Float (Total balance across all students)
  const totalWalletFloat = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.wallet_balance || 0), 0);
  }, [customers]);

  // Relieving Date Analysis across customers
  const relievingStats = useMemo(() => {
    let pastCount = 0;
    let approachingCount = 0;
    const pendingDisableList: Customer[] = [];

    customers.forEach((c) => {
      const rel = checkRelievingDate(c);
      if (rel.isPastRelieving) {
        pastCount += 1;
        if (!c.is_disabled) {
          pendingDisableList.push(c);
        }
      } else if (rel.isApproachingRelieving && !c.is_disabled) {
        approachingCount += 1;
      }
    });

    return {
      pastCount,
      approachingCount,
      pendingDisableList,
    };
  }, [customers]);

  // Meal Session Distribution
  const mealSessionBreakdown = useMemo(() => {
    const sessions: Record<string, { count: number; revenue: number }> = {
      Breakfast: { count: 0, revenue: 0 },
      Recess: { count: 0, revenue: 0 },
      Lunch: { count: 0, revenue: 0 },
      'Evening Snack': { count: 0, revenue: 0 },
    };

    displaySales.forEach((s) => {
      const sess = s.meal_session || 'Lunch';
      if (sessions[sess]) {
        sessions[sess].count += 1;
        sessions[sess].revenue += s.total_amount;
      } else {
        sessions.Lunch.count += 1;
        sessions.Lunch.revenue += s.total_amount;
      }
    });

    return sessions;
  }, [displaySales]);

  // Dietary and Nutrition Distribution
  const dietaryStats = useMemo(() => {
    let vegCount = 0;
    let nonVegCount = 0;
    let healthyCount = 0;
    let beverageCount = 0;
    let totalCalories = 0;

    displaySales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.product_id);
        const dietary = prod?.dietary || 'veg';
        const qty = item.quantity;
        const cal = (prod?.calories || 200) * qty;

        totalCalories += cal;

        if (dietary === 'veg') vegCount += qty;
        else if (dietary === 'non-veg') nonVegCount += qty;
        else if (dietary === 'healthy') healthyCount += qty;
        else if (dietary === 'beverage') beverageCount += qty;
      });
    });

    const totalItems = vegCount + nonVegCount + healthyCount + beverageCount;

    return {
      vegCount,
      nonVegCount,
      healthyCount,
      beverageCount,
      totalCalories,
      totalItems,
    };
  }, [displaySales, products]);

  // Past 7 Days Sales Trend for Recharts Line Chart
  const past7DaysSalesTrend = useMemo(() => {
    const days: { dateStr: string; label: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      
      const daySales = sales.filter((s) => s.created_at.startsWith(dateStr));
      const revenue = daySales.reduce((sum, s) => sum + s.total_amount, 0);
      days.push({
        dateStr,
        label,
        revenue,
        orders: daySales.length,
      });
    }
    return days;
  }, [sales]);

  // Top Selling Canteen Items
  const topProducts = useMemo(() => {
    const productSalesMap = new Map<
      string,
      { product: Product; quantity: number; revenue: number }
    >();

    displaySales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSalesMap.get(item.product_id);
        const prod =
          products.find((p) => p.id === item.product_id) ||
          ({
            id: item.product_id,
            name: item.product_name,
            price: item.unit_price,
            stock_quantity: 20,
            reorder_level: 5,
            category: item.category || 'General',
          } as Product);

        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.line_total;
        } else {
          productSalesMap.set(item.product_id, {
            product: prod,
            quantity: item.quantity,
            revenue: item.line_total,
          });
        }
      });
    });

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [displaySales, products]);

  // Recent 8 Sales
  const recentSales = useMemo(() => {
    return [...displaySales].slice(0, 8);
  }, [displaySales]);

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
      {/* 1. Header & Live Canteen Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <LayoutDashboard className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Canteen Operations Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {settings.school_name || 'TLGS International Academy'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time sales tracking, kitchen token queue, student canteen wallet liability, and relieving date management.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700/60 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Register Student</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('customers')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700/60 transition-colors"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Student Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl border border-neutral-700/60 transition-colors"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Sales Reports</span>
          </button>
        </div>
      </div>

      {/* 2. Relieving Date Alerts Widget (If accounts need action) */}
      {relievingStats.pendingDisableList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-amber-300">
                  Relieving Date Alerts: {relievingStats.pendingDisableList.length} Student Account(s) Reached Relieving Date
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                Scheduled relieving dates have arrived for students (e.g.{' '}
                <b>{relievingStats.pendingDisableList.map((c) => c.name).slice(0, 3).join(', ')}</b>
                {relievingStats.pendingDisableList.length > 3
                  ? ` and ${relievingStats.pendingDisableList.length - 3} others`
                  : ''}
                ). Please review and disable these accounts to safeguard canteen credits and block post-leaving purchases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => onNavigateToTab('customers')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow flex items-center gap-1.5"
            >
              <span>Review in Customer Management</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Real-Time Alert Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-red-950/30 border-2 border-red-500/40 text-red-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-red-300">
                  Inventory Alert: {lowStockCount} Product{lowStockCount > 1 ? 's' : ''} At or Below Reorder Threshold
                </span>
                <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase animate-pulse">
                  Restock Required
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                Items in the canteen catalog have reached low inventory levels. Replenish or adjust stock immediately to avoid cafeteria stock-outs during busy meal sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  onNavigateToTab('inventory');
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-colors shadow flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Stock Alerts & Restock</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Primary KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Today's Revenue */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(todayTotalRevenue, settings.currency_symbol)}
            </p>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {displaySales.length} orders billed
            </span>
          </div>
        </div>

        {/* Card 2: Tokens Served */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Food Tokens</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold font-mono text-white tabular-nums">
                {totalTokensIssued}
              </p>
              <span className="text-xs font-mono text-amber-400">
                (Last #{lastTokenNumber})
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              Sequential kitchen tokens
            </span>
          </div>
        </div>

        {/* Card 3: Canteen Wallet Float */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Wallet Float</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-bold font-mono text-sky-400 tabular-nums">
              {formatCurrency(totalWalletFloat, settings.currency_symbol)}
            </p>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              Student prepaid liability
            </span>
          </div>
        </div>

        {/* Card 4: Enrolled Students & Accounts */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Students Enrolled</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-bold font-mono text-white tabular-nums">
                {customers.length}
              </p>
              <span className="text-xs font-mono text-neutral-500">
                ({customers.filter((c) => !c.is_disabled).length} active)
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {customers.filter((c) => c.is_disabled).length} disabled accounts
            </span>
          </div>
        </div>

        {/* Card 5: Relieving Date Alerts */}
        <div
          onClick={() => onNavigateToTab('customers')}
          className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Relieving Alerts</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <p
                className={`text-xl font-bold font-mono tabular-nums ${
                  relievingStats.pendingDisableList.length > 0 ? 'text-amber-400' : 'text-neutral-300'
                }`}
              >
                {relievingStats.pendingDisableList.length}
              </p>
              <span className="text-xs text-neutral-500">expired</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {relievingStats.approachingCount} due in 30 days
            </span>
          </div>
        </div>

        {/* Card 6: Low Stock Warnings */}
        <div
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            } else {
              onNavigateToTab('inventory');
            }
          }}
          className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer hover:border-red-500/50 transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Low Stock Items</span>
            <Boxes className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2">
            <p
              className={`text-xl font-bold font-mono tabular-nums ${
                lowStockCount > 0 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {lowStockCount}
            </p>
            <span className="text-[10px] text-neutral-500 mt-0.5 block">
              {lowStockCount > 0 ? 'Reorder needed' : 'Optimal stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Recharts Line Chart: Past 7 Days Sales Trend */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Daily Sales Trends (Past 7 Days)
            </h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">Revenue & Order Volume</span>
        </div>
        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={past7DaysSalesTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="label" stroke="#a3a3a3" fontSize={11} tickLine={false} />
              <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#171717', borderColor: '#404040', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [formatCurrency(Number(value), settings.currency_symbol), 'Revenue']}
                labelStyle={{ fontWeight: 'bold', color: '#f59e0b' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Two-Column Operations & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Meal Sessions, Dietary Split, and Payment Channels */}
        <div className="lg:col-span-7 space-y-5">
          {/* Meal Sessions Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Canteen Meal Session Distribution
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Today's Traffic</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {Object.entries(mealSessionBreakdown).map(([sessionName, data]) => {
                const percent =
                  totalTokensIssued > 0
                    ? Math.round((data.count / totalTokensIssued) * 100)
                    : 0;

                return (
                  <div
                    key={sessionName}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-neutral-300 block">
                        {sessionName}
                      </span>
                      <span className="text-lg font-bold font-mono text-white mt-1 block">
                        {data.count} <span className="text-xs font-normal text-neutral-500">tokens</span>
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-neutral-850">
                      <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                        <span>{formatCurrency(data.revenue, settings.currency_symbol)}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nutrition, Dietary & Calories Breakdown */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  School Nutrition & Dietary Splits
                </h3>
              </div>
              <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>~{dietaryStats.totalCalories.toLocaleString()} Calories Served</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-emerald-950/40">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Vegetarian (Pure)</span>
                </div>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {dietaryStats.vegCount} <span className="text-xs font-normal text-neutral-500">servings</span>
                </p>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  {dietaryStats.totalItems > 0
                    ? Math.round((dietaryStats.vegCount / dietaryStats.totalItems) * 100)
                    : 0}% of all plates
                </span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-red-950/40">
                <div className="flex items-center gap-1.5 text-red-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>Non-Veg (Poultry)</span>
                </div>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {dietaryStats.nonVegCount} <span className="text-xs font-normal text-neutral-500">servings</span>
                </p>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">
                  {dietaryStats.totalItems > 0
                    ? Math.round((dietaryStats.nonVegCount / dietaryStats.totalItems) * 100)
                    : 0}% of all plates
                </span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-sky-950/40">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>Nutri-Bowl / Fruit</span>
                </div>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {dietaryStats.healthyCount} <span className="text-xs font-normal text-neutral-500">servings</span>
                </p>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Healthy school diet</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-amber-950/40">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Milk / Beverages</span>
                </div>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {dietaryStats.beverageCount} <span className="text-xs font-normal text-neutral-500">servings</span>
                </p>
                <span className="text-[10px] text-neutral-400 mt-0.5 block">Hydration & dairy</span>
              </div>
            </div>
          </div>

          {/* Payment Tender Breakdown Strip */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Tender Method Reconciliation
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-emerald-400 font-bold block">Student Wallet</span>
                <p className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(paymentBreakdown.wallet.total, settings.currency_symbol)}
                </p>
                <span className="text-[10px] text-neutral-500">{paymentBreakdown.wallet.count} orders</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-amber-400 font-bold block">Cash Counter</span>
                <p className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(paymentBreakdown.cash.total, settings.currency_symbol)}
                </p>
                <span className="text-[10px] text-neutral-500">{paymentBreakdown.cash.count} orders</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-sky-400 font-bold block">UPI / QR Pay</span>
                <p className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(paymentBreakdown.upi.total, settings.currency_symbol)}
                </p>
                <span className="text-[10px] text-neutral-500">{paymentBreakdown.upi.count} orders</span>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                <span className="text-purple-400 font-bold block">Smart Card / POS</span>
                <p className="text-base font-mono font-bold text-white mt-1">
                  {formatCurrency(paymentBreakdown.card.total, settings.currency_symbol)}
                </p>
                <span className="text-[10px] text-neutral-500">{paymentBreakdown.card.count} orders</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Top Selling Delicacies & Live Food Token Feed */}
        <div className="lg:col-span-5 space-y-5">
          {/* Top Selling Canteen Items */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Top Selling Delicacies
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('inventory')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>Stock</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {topProducts.length === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-500">No items sold today yet.</p>
              ) : (
                topProducts.map((item, idx) => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-white block truncate max-w-[160px] sm:max-w-[200px]">
                          {item.product.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {formatCurrency(item.product.price, settings.currency_symbol)} · In Stock: {item.product.stock_quantity}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="font-bold text-white block">{item.quantity} sold</span>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        {formatCurrency(item.revenue, settings.currency_symbol)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live Recent Food Collection Tokens & Receipts */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Food Tokens & Receipts
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('reports')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <span>All Orders</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between text-xs hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {sale.token_number ? (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs shrink-0 border border-amber-500/30">
                        #{sale.token_number}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 font-mono text-xs shrink-0">
                        POS
                      </span>
                    )}

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">
                          {sale.customer_name || 'Walk-in Student'}
                        </span>
                        {sale.meal_session && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                            {sale.meal_session}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        {sale.items.length} item(s) · {sale.payment_method.toUpperCase()} · {formatDateTime(sale.created_at).slice(-8)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral-100">
                      {formatCurrency(sale.total_amount, settings.currency_symbol)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectReceipt(sale)}
                      className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                      title="Reprint thermal receipt / token"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
