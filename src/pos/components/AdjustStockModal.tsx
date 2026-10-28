import React, { useState } from 'react';
import { Product } from '../types/pos';
import { SlidersHorizontal, X, Save, AlertCircle } from 'lucide-react';

interface AdjustStockModalProps {
  product: Product;
  onSaveAdjustment: (productId: string, quantityChange: number, reason: string, reference: string) => void;
  onClose: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  product,
  onSaveAdjustment,
  onClose,
}) => {
  const [qtyChange, setQtyChange] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier Delivery / Restock');
  const [reference, setReference] = useState<string>('PO-' + Math.floor(1000 + Math.random() * 9000));

  const newProjectedStock = product.stock_quantity + qtyChange;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyChange === 0) return;
    onSaveAdjustment(product.id, qtyChange, reason, reference);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Adjust Real-Time Stock</h3>
              <p className="text-xs text-neutral-400">{product.name} ({product.sku})</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Stock comparison badge */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex justify-between items-center font-mono">
            <div>
              <span className="text-neutral-500 text-[10px] uppercase">Current Stock</span>
              <p className="text-base font-bold text-neutral-200">{product.stock_quantity} units</p>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 text-[10px] uppercase">Projected Stock</span>
              <p
                className={`text-base font-bold ${
                  newProjectedStock < 0 ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {newProjectedStock} units
              </p>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Quantity Adjustment (+ to add, − to deduct)
            </label>
            <input
              type="number"
              step="1"
              required
              value={qtyChange}
              onChange={(e) => setQtyChange(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-base font-mono font-bold text-white focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Use positive numbers for restock; negative numbers for damaged, spoiled, or written-off items.
            </p>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
            >
              <option value="Supplier Delivery / Restock">Supplier Delivery / Restock</option>
              <option value="Damage / Spoilage / Breakage">Damage / Spoilage / Breakage</option>
              <option value="Inventory Audit Count Correction">Inventory Audit Count Correction</option>
              <option value="Customer Return">Customer Return</option>
              <option value="Store Demo / Internal Consumption">Store Demo / Internal Consumption</option>
            </select>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Reference / PO / Note</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-8839 or Batch-12"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {newProjectedStock < 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Warning: Projected stock will be negative ({newProjectedStock}).</span>
            </div>
          )}

          {/* Actions */}
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
              <span>Record Stock Change</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
