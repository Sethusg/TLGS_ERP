import React, { useState } from 'react';
import { StoreSettings } from '../types/pos';
import { Settings, X, Save, RotateCcw, AlertTriangle } from 'lucide-react';

interface StoreSettingsModalProps {
  settings: StoreSettings;
  onSave: (updated: StoreSettings) => void;
  onResetData: () => void;
  onClose: () => void;
}

export const StoreSettingsModal: React.FC<StoreSettingsModalProps> = ({
  settings,
  onSave,
  onResetData,
  onClose,
}) => {
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      updated_at: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store & Terminal Settings</h3>
              <p className="text-xs text-neutral-400">Configure business details, tax rates, and currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Canteen / Terminal Name</label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">School / Academy Name</label>
              <input
                type="text"
                value={formData.school_name || ''}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                placeholder="e.g. TLGS International Academy"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Counter Name / Location</label>
              <input
                type="text"
                value={formData.counter_name || ''}
                onChange={(e) => setFormData({ ...formData, counter_name: e.target.value })}
                placeholder="Counter 01 - Hot Meals & Recess"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Canteen License / FSSAI ID</label>
              <input
                type="text"
                value={formData.canteen_license || ''}
                onChange={(e) => setFormData({ ...formData, canteen_license: e.target.value })}
                placeholder="FSSAI Lic: 10022043000512"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* THERMAL PRINTER HARDWARE CONFIGURATION */}
          <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Thermal POS Printer Setup
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-300">
                ESC/POS Emulation
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Receipt Roll Width</label>
                <select
                  value={formData.thermal_printer_width || '80mm'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      thermal_printer_width: e.target.value as '80mm' | '58mm',
                    })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 font-mono font-bold focus:outline-none focus:border-amber-500"
                >
                  <option value="80mm">80mm (Standard POS Roll - 44 cols)</option>
                  <option value="58mm">58mm (Compact Mobile Roll - 32 cols)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Default Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.default_tax_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, default_tax_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={formData.auto_print_receipt ?? true}
                  onChange={(e) => setFormData({ ...formData, auto_print_receipt: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-900 border-neutral-700"
                />
                <span className="text-[11px]">Auto-print thermal ticket upon payment</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                <input
                  type="checkbox"
                  checked={formData.print_kitchen_token ?? true}
                  onChange={(e) => setFormData({ ...formData, print_kitchen_token: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-900 border-neutral-700"
                />
                <span className="text-[11px]">Print Food Pickup Token (KOT) slip</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Currency Symbol</label>
              <input
                type="text"
                required
                value={formData.currency_symbol}
                onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                placeholder="₹ or $ or €"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Currency Code</label>
              <input
                type="text"
                required
                value={formData.currency_code}
                onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                placeholder="INR or USD"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Physical Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Telephone / Mobile</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={formData.receipt_footer}
              onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Reset Demo Data Section */}
          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Diagnostic & Reset
            </span>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Demo Data</span>
              </button>
            ) : (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-semibold text-xs">Restore initial demo products, sales & customers?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs"
                  >
                    Yes, Reset Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg flex items-center gap-1.5 shadow"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
