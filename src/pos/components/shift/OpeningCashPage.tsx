import React, { useState, useMemo } from 'react';
import { PosUser, StoreSettings, CashDenominations, ShiftSession } from '../../types/pos';
import { formatCurrency } from '../../utils/formatters';
import { InternationalTheme } from '../../utils/theme';
import {
  Banknote,
  Clock,
  User,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Sparkles,
  Palette,
} from 'lucide-react';

interface OpeningCashPageProps {
  currentUser: PosUser;
  settings: StoreSettings;
  theme?: InternationalTheme;
  onConfirmOpeningCash: (shift: ShiftSession) => void;
  onLogout: () => void;
  onOpenThemeSelector?: () => void;
}

export const OpeningCashPage: React.FC<OpeningCashPageProps> = ({
  currentUser,
  settings,
  theme,
  onConfirmOpeningCash,
  onLogout,
  onOpenThemeSelector,
}) => {
  const [useDenominations, setUseDenominations] = useState(false);
  const [directFloatInput, setDirectFloatInput] = useState<string>('2000.00');
  const [notes, setNotes] = useState('Opening cash float verified in cash drawer');

  // Denominations counter
  const [denominations, setDenominations] = useState<CashDenominations>({
    c2000: 0,
    c500: 2,
    c200: 3,
    c100: 3,
    c50: 1,
    c20: 2,
    c10: 1,
    coins: 0,
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

  const finalOpeningAmount = useDenominations
    ? calculatedDenomTotal
    : parseFloat(directFloatInput) || 0;

  const handleDenomChange = (key: keyof CashDenominations, val: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (finalOpeningAmount < 0) return;

    const newShift: ShiftSession = {
      id: `shift-${Date.now()}`,
      cashierId: currentUser.id,
      cashierUsername: currentUser.username,
      cashierFullName: currentUser.fullName,
      status: 'open',
      openedAt: new Date().toISOString(),
      openingCash: Math.round(finalOpeningAmount * 100) / 100,
      openingNotes: notes,
      openingDenominations: useDenominations ? denominations : undefined,
      expectedCash: Math.round(finalOpeningAmount * 100) / 100,
      expectedUpi: 0,
      expectedCard: 0,
      expectedOther: 0,
      expectedTotal: Math.round(finalOpeningAmount * 100) / 100,
      salesCount: 0,
      totalSalesAmount: 0,
    };

    onConfirmOpeningCash(newShift);
  };

  return (
    <div
      className={`min-h-screen ${theme?.bgRoot || 'bg-[#0b1329]'} ${
        theme?.textColor || 'text-slate-100'
      } flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-300 relative`}
    >
      {/* Top International Theme Selector Shortcut */}
      {onOpenThemeSelector && (
        <button
          type="button"
          onClick={onOpenThemeSelector}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hover:border-sky-500/60 transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Change international color palette"
        >
          <Palette className="w-3.5 h-3.5 text-sky-400" />
          <span>{theme?.flag} {theme?.name}</span>
        </button>
      )}

      {/* Brand & Shift Kicker */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-2">
          <Clock className="w-3.5 h-3.5" />
          <span>START NEW SHIFT SESSION</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white uppercase">
          {settings.store_name}
        </h1>
        <p className="text-xs text-neutral-400 font-mono mt-0.5">
          OPENING CASH FLOAT & DRAWER INITIALIZATION
        </p>
      </div>

      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Cashier & Terminal Context Bar */}
        <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-neutral-400">Authenticated Cashier</span>
              <p className="text-sm font-bold text-white">{currentUser.fullName}</p>
              <p className="text-xs text-neutral-500 font-mono">
                {currentUser.employeeId} · Role: <span className="uppercase text-amber-400">{currentUser.role}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800"
          >
            Logout
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Mode Switcher: Quick Float vs Denomination breakdown */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white">Starting Cash in Drawer</h2>
              <p className="text-xs text-neutral-400">Physical currency count before opening register</p>
            </div>

            <button
              type="button"
              onClick={() => setUseDenominations(!useDenominations)}
              className="px-2.5 py-1 text-xs text-amber-400 hover:text-amber-300 bg-neutral-950 border border-neutral-800 rounded-lg flex items-center gap-1 font-medium"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{useDenominations ? 'Direct Amount' : 'Count Notes'}</span>
            </button>
          </div>

          {!useDenominations ? (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
              <label className="block text-neutral-300 font-medium">
                Total Opening Float Amount:
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-lg">
                    {settings.currency_symbol}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={directFloatInput}
                    onChange={(e) => setDirectFloatInput(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 text-2xl font-mono font-black text-amber-400 pl-9 pr-4 py-3 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </label>

              {/* Quick Float Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-500">Presets:</span>
                {[1000, 1500, 2000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDirectFloatInput(amt.toFixed(2))}
                    className="px-2.5 py-1 text-xs bg-neutral-850 hover:bg-neutral-800 text-neutral-300 rounded font-mono"
                  >
                    {settings.currency_symbol}{amt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'c2000' as const, label: `${settings.currency_symbol}2000 Notes` },
                  { key: 'c500' as const, label: `${settings.currency_symbol}500 Notes` },
                  { key: 'c200' as const, label: `${settings.currency_symbol}200 Notes` },
                  { key: 'c100' as const, label: `${settings.currency_symbol}100 Notes` },
                  { key: 'c50' as const, label: `${settings.currency_symbol}50 Notes` },
                  { key: 'c20' as const, label: `${settings.currency_symbol}20 Notes` },
                  { key: 'c10' as const, label: `${settings.currency_symbol}10 Notes` },
                  { key: 'coins' as const, label: `Coins Value` },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-1.5 bg-neutral-900 rounded-lg">
                    <span className="text-neutral-400 text-[11px] font-mono">{label}:</span>
                    <input
                      type="number"
                      min={0}
                      value={denominations[key]}
                      onChange={(e) => handleDenomChange(key, parseInt(e.target.value, 10) || 0)}
                      className="w-16 bg-neutral-950 border border-neutral-700 text-center font-mono font-bold text-white rounded py-0.5 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-800 flex justify-between items-baseline">
                <span className="text-neutral-400 font-semibold">Total Counted Float:</span>
                <span className="text-xl font-black font-mono text-amber-400">
                  {formatCurrency(calculatedDenomTotal, settings.currency_symbol)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Shift Opening Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Morning shift float verified with store manager"
              className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 p-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 font-extrabold text-sm text-neutral-950 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Verify & Unlock POS Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
