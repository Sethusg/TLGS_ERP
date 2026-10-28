import React, { useEffect } from 'react';
import { Product } from '../types/pos';
import { AlertTriangle, X, SlidersHorizontal, PackageX, Boxes } from 'lucide-react';

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  type: 'out_of_stock' | 'low_stock';
  timestamp: string;
}

interface StockAlertToastsProps {
  alerts: StockAlert[];
  products: Product[];
  onDismissAlert: (id: string) => void;
  onOpenAdjustStock: (product: Product) => void;
}

export const StockAlertToasts: React.FC<StockAlertToastsProps> = ({
  alerts,
  products,
  onDismissAlert,
  onOpenAdjustStock,
}) => {
  // Auto-dismiss top alert after 7 seconds
  useEffect(() => {
    if (alerts.length === 0) return;
    const latest = alerts[alerts.length - 1];
    const timer = setTimeout(() => {
      onDismissAlert(latest.id);
    }, 7000);
    return () => clearTimeout(timer);
  }, [alerts, onDismissAlert]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {alerts.slice(-3).map((alert) => {
        const isOutOfStock = alert.currentStock <= 0;
        const matchedProduct = products.find((p) => p.id === alert.productId);

        return (
          <div
            key={alert.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md transition-all animate-slide-in-right flex flex-col gap-2.5 ${
              isOutOfStock
                ? 'bg-neutral-950/95 border-red-500/60 text-red-100 shadow-red-950/50'
                : 'bg-neutral-950/95 border-amber-500/60 text-amber-100 shadow-amber-950/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    isOutOfStock
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}
                >
                  {isOutOfStock ? (
                    <PackageX className="w-5 h-5 animate-pulse" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold font-mono tracking-wider px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800">
                      {isOutOfStock ? 'CRITICAL OUT OF STOCK' : 'LOW STOCK ALERT'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                    {alert.productName}
                  </h4>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Current Stock:{' '}
                    <b className={isOutOfStock ? 'text-red-400' : 'text-amber-400'}>
                      {alert.currentStock} units
                    </b>{' '}
                    (Reorder Level: {alert.reorderLevel})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDismissAlert(alert.id)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 shrink-0"
                title="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Restock Action Button */}
            {matchedProduct && (
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => {
                    onOpenAdjustStock(matchedProduct);
                    onDismissAlert(alert.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 ${
                    isOutOfStock
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Restock / Adjust Now</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
