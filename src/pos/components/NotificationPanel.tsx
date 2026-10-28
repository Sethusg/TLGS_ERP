import React from 'react';
import { Product, ActiveTab } from '../types/pos';
import {
  Bell,
  X,
  AlertTriangle,
  PackageX,
  SlidersHorizontal,
  Boxes,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface NotificationPanelProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onOpenAdjustStock: (product: Product) => void;
  onNavigateToTab: (tab: ActiveTab) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  products,
  isOpen,
  onClose,
  onOpenAdjustStock,
  onNavigateToTab,
}) => {
  if (!isOpen) return null;

  // Filter products at or below reorder level
  const lowStockProducts = products
    .filter((p) => p.is_active && p.stock_quantity <= p.reorder_level)
    .sort((a, b) => a.stock_quantity - b.stock_quantity);

  const outOfStockCount = lowStockProducts.filter((p) => p.stock_quantity <= 0).length;
  const lowStockOnlyCount = lowStockProducts.length - outOfStockCount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] mt-12 animate-slide-in-right">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Inventory Stock Alerts
                </h3>
                {lowStockProducts.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                    {lowStockProducts.length} Alert{lowStockProducts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Items hitting or falling below minimum reorder thresholds
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-950/40 border-b border-neutral-800 text-xs font-mono">
          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">Out of Stock</span>
              <p className="text-lg font-bold text-red-400 mt-0.5">{outOfStockCount}</p>
            </div>
            <PackageX className="w-5 h-5 text-red-400/80" />
          </div>

          <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-neutral-500 block uppercase">Low Stock (≤ Reorder)</span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">{lowStockOnlyCount}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400/80" />
          </div>
        </div>

        {/* List of Low Stock Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lowStockProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-200">Stock Levels Healthy</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  All active canteen items are safely above their reorder thresholds.
                </p>
              </div>
            </div>
          ) : (
            lowStockProducts.map((prod) => {
              const isOutOfStock = prod.stock_quantity <= 0;
              const ratio =
                prod.reorder_level > 0
                  ? Math.min(100, Math.round((prod.stock_quantity / prod.reorder_level) * 100))
                  : 0;

              return (
                <div
                  key={prod.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                    isOutOfStock
                      ? 'bg-neutral-950/80 border-red-500/40 text-red-100'
                      : 'bg-neutral-950/80 border-amber-500/40 text-amber-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          isOutOfStock
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isOutOfStock ? (
                          <PackageX className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{prod.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              isOutOfStock
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">
                          {prod.sku} · {prod.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span
                        className={`text-sm font-bold block ${
                          isOutOfStock ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        {prod.stock_quantity} units
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Reorder at: {prod.reorder_level}
                      </span>
                    </div>
                  </div>

                  {/* Stock Level Bar */}
                  <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOutOfStock ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(5, ratio)}%` }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab('inventory');
                      }}
                      className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Boxes className="w-3 h-3" />
                      <span>Catalogue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdjustStock(prod);
                      }}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors shadow flex items-center gap-1 ${
                        isOutOfStock
                          ? 'bg-red-500 hover:bg-red-400 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                      }`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Restock</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between text-xs">
          <span className="text-neutral-400">
            {lowStockProducts.length} item(s) require canteen restocking
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToTab('inventory');
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Open Inventory Manager</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
