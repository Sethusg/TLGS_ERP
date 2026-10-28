import React, { useState } from 'react';
import { ShiftSession, StoreSettings, Sale } from '../../types/pos';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ClosingReportView } from './ClosingReportView';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Clock,
  User,
  Eye,
} from 'lucide-react';

interface ShiftsHistoryPageProps {
  shifts: ShiftSession[];
  sales: Sale[];
  settings: StoreSettings;
  onInspectShift?: (shift: ShiftSession) => void;
}

export const ShiftsHistoryPage: React.FC<ShiftsHistoryPageProps> = ({
  shifts,
  sales,
  settings,
}) => {
  const [selectedShift, setSelectedShift] = useState<ShiftSession | null>(null);

  if (selectedShift) {
    const shiftSales = sales.filter((s) => s.shift_id === selectedShift.id);
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedShift(null)}
          className="ml-4 lg:ml-6 mt-4 px-3 py-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg inline-flex items-center gap-1.5"
        >
          <span>← Back to Shifts List</span>
        </button>

        <ClosingReportView
          shift={selectedShift}
          shiftSales={shiftSales}
          settings={settings}
          onFinalizeCloseShift={() => setSelectedShift(null)}
          onBackToEdit={() => setSelectedShift(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Shift Settlement & EOD History</h2>
          <p className="text-xs text-neutral-400">
            Historical audit logs of cashier shift openings, float counts, EOD closings, and variances.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Shift ID</th>
                <th className="py-3 px-4 font-sans">Cashier</th>
                <th className="py-3 px-4">Opened At</th>
                <th className="py-3 px-4">Closed At</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Total Counted</th>
                <th className="py-3 px-4 text-right">Variance</th>
                <th className="py-3 px-4 text-center font-sans">Status</th>
                <th className="py-3 px-4 text-right font-sans">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500 font-sans">
                    No past shift records logged yet.
                  </td>
                </tr>
              ) : (
                shifts.map((s) => {
                  const diff = s.totalDifference || 0;
                  return (
                    <tr key={s.id} className="hover:bg-neutral-850 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        #{s.id.slice(-6).toUpperCase()}
                      </td>

                      <td className="py-3.5 px-4 font-sans font-semibold text-neutral-200">
                        {s.cashierFullName}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400">
                        {formatDateTime(s.openedAt)}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400">
                        {s.closedAt ? formatDateTime(s.closedAt) : '— Active Shift —'}
                      </td>

                      <td className="py-3.5 px-4 text-right text-neutral-300">
                        {formatCurrency(s.openingCash, settings.currency_symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-white">
                        {s.actualTotal !== undefined
                          ? formatCurrency(s.actualTotal, settings.currency_symbol)
                          : formatCurrency(s.expectedTotal, settings.currency_symbol)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {Math.abs(diff) < 0.01 ? (
                          <span className="text-emerald-400 font-bold">₹0.00</span>
                        ) : diff > 0 ? (
                          <span className="text-amber-400 font-bold">+{formatCurrency(diff, settings.currency_symbol)}</span>
                        ) : (
                          <span className="text-red-400 font-bold">{formatCurrency(diff, settings.currency_symbol)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'open'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedShift(s)}
                          className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
