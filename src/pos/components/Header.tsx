import React from 'react';
import { ActiveTab, StoreSettings, PosUser, ShiftSession } from '../types/pos';
import { formatCurrency } from '../utils/formatters';
import {
  ShoppingBag,
  Users,
  Boxes,
  BarChart3,
  Monitor,
  Settings,
  Clock,
  Award,
  LogOut,
  History,
  ShieldCheck,
  UserCheck,
  Palette,
  LayoutDashboard,
  Bell,
  Tag,
} from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings;
  currentUser: PosUser | null;
  activeShift: ShiftSession | null;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onOpenThemeSelector?: () => void;
  onOpenNotifications?: () => void;
  onNavigateToEod: () => void;
  onLogout: () => void;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  activeShift,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenThemeSelector,
  onOpenNotifications,
  onNavigateToEod,
  onLogout,
  lowStockCount,
}) => {
  const [timeStr, setTimeStr] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md border-b px-4 lg:px-6 py-2.5 transition-colors"
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--theme-border)',
        color: 'var(--text-color)',
      }}
    >
      <div className="flex items-center justify-between gap-3 max-w-[1600px] mx-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs tracking-wider shadow-inner">
            TLGS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-white whitespace-nowrap">
              {settings.store_name}
            </span>
            <div className="text-[10px] text-neutral-400 tracking-wide font-mono flex items-center gap-1.5">
              <span>{settings.counter_name || 'COUNTER #01'}</span>
              <span className="text-neutral-600">·</span>
              {activeShift ? (
                <span className="text-emerald-400 font-semibold">REGISTER OPEN</span>
              ) : (
                <span className="text-amber-400 font-semibold">NO ACTIVE SHIFT</span>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="flex items-center gap-1 bg-neutral-950/60 p-1 rounded-xl border border-neutral-800/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'pos'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Checkout</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all relative ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Inventory</span>
            {lowStockCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-500 text-white leading-tight">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTabChange('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('loyalty')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'loyalty'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Loyalty</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('discounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'discounts'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Discounts</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('shifts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'shifts'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Shifts & EOD</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('customer-display')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'customer-display'
                ? 'bg-sky-500 text-neutral-950 font-bold shadow-sm'
                : 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
            }`}
            title="Open customer-facing terminal screen"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Customer Screen</span>
          </button>

          {(currentUser?.role === 'manager' || currentUser?.role === 'admin') && (
            <button
              type="button"
              onClick={() => onTabChange('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#417690] text-white font-bold shadow-md ring-1 ring-white/20'
                  : 'text-[#85b6cd] hover:text-white hover:bg-[#417690]/25'
              }`}
              title="Access Django Admin portal for register closings audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#85b6cd]" />
              <span>Django Admin</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Staff Profile, EOD button, Settings & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 bg-neutral-950/60 px-2.5 py-1.5 rounded-xl border border-neutral-800/80">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-neutral-200 block leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[9px] font-mono uppercase text-amber-400 block">
                  {currentUser.role}
                </span>
              </div>
            </div>
          )}

          {activeShift && (
            <button
              type="button"
              onClick={onNavigateToEod}
              className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap"
              title="Close Sales Counter and Enter EOD Counts"
            >
              Close Shift
            </button>
          )}

          {onOpenThemeSelector && (
            <button
              type="button"
              onClick={onOpenThemeSelector}
              className="p-1.5 text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/60 rounded-lg transition-colors cursor-pointer"
              title="International Dashboard Color Palette"
            >
              <Palette className="w-4 h-4" />
            </button>
          )}

          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`p-1.5 rounded-lg border transition-all relative ${
                lowStockCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 border-neutral-700/60'
              }`}
              title="Low Stock & Inventory Notifications"
            >
              <Bell className="w-4 h-4" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-red-500 text-white leading-tight animate-pulse font-mono shadow">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 rounded-lg transition-colors"
            title="Configure store settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-red-400 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 rounded-lg transition-colors"
              title="End session safely (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
