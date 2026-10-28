import React, { useState, useMemo, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Product,
  CartItem,
  Sale,
  Customer,
  StoreSettings,
  PaymentMethod,
  LoyaltyReward,
  PosUser,
  ShiftSession,
  ProductCategory,
} from '../types/pos';
import { formatCurrency, generateReceiptNumber } from '../utils/formatters';
import { executeThermalPrint } from '../utils/thermalPrinter';
import { checkRelievingDate } from '../utils/customerRelieving';
import { ProductVisual } from './ProductVisual';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  UserCheck,
  UserPlus,
  Tag,
  AlertCircle,
  X,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  Gift,
  LayoutGrid,
  List,
  ScanBarcode,
  CheckCircle2,
  Clock,
  Printer,
  ShieldAlert,
} from 'lucide-react';

interface CheckoutTerminalProps {
  currentUser: PosUser;
  activeShift: ShiftSession;
  products: Product[];
  categories?: ProductCategory[];
  customers: Customer[];
  rewards: LoyaltyReward[];
  settings: StoreSettings;
  activeCart: CartItem[];
  selectedCustomerId?: string;
  onUpdateCart: (cart: CartItem[], customerId?: string) => void;
  onCompleteSale: (sale: Sale, redeemedReward?: LoyaltyReward) => void;
  onOpenCustomerModal: () => void;
  onNavigateToEod: () => void;
  onOpenNotifications?: () => void;
}

export const CheckoutTerminal: React.FC<CheckoutTerminalProps> = ({
  currentUser,
  activeShift,
  products,
  categories: storeCategories = [],
  customers,
  rewards,
  settings,
  activeCart,
  selectedCustomerId,
  onUpdateCart,
  onCompleteSale,
  onOpenCustomerModal,
  onNavigateToEod,
  onOpenNotifications,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc' | 'stock'>('name');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock'>('all');
  const [viewMode, setViewMode] = useState<'visual' | 'compact'>('visual');

  const terminalLowStockCount = useMemo(() => {
    return products.filter((p) => p.is_active && p.stock_quantity <= p.reorder_level).length;
  }, [products]);

  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [selectedRewardToApply, setSelectedRewardToApply] = useState<LoyaltyReward | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);

  // School Canteen Meal Session
  const [mealSession, setMealSession] = useState<'Breakfast' | 'Recess' | 'Lunch' | 'Evening Snack'>(() => {
    const hr = new Date().getHours();
    if (hr < 11) return 'Breakfast';
    if (hr < 12) return 'Recess';
    if (hr < 15) return 'Lunch';
    return 'Evening Snack';
  });

  // Food Collection Token sequential numbering (1 to 999)
  const [currentTokenNumber, setCurrentTokenNumber] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('tlgs_pos_token_seq') || '0', 10);
    return (saved % 999) + 1;
  });

  // BARCODE SCANNER HARDWARE LISTENER
  // Hardware scanners type character keys rapidly (< 50ms) and finish with 'Enter'.
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Selected customer object
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Disabled categories set (categories marked is_active: false)
  const disabledCategoryNames = useMemo(() => {
    return new Set(
      storeCategories.filter((c) => c.is_active === false).map((c) => c.name)
    );
  }, [storeCategories]);

  // Categories list with count for filter strip (excluding hidden categories and disabled ones)
  const categories = useMemo(() => {
    const visibleStoreCats = storeCategories.filter(
      (c) => c.is_visible !== false && c.is_active !== false
    );

    const counts = new Map<string, number>();
    products.forEach((p) => {
      if (!disabledCategoryNames.has(p.category)) {
        counts.set(p.category, (counts.get(p.category) || 0) + 1);
      }
    });

    const activeProductsTotal = products.filter(
      (p) => p.is_active && !disabledCategoryNames.has(p.category)
    ).length;

    if (visibleStoreCats.length > 0) {
      return [
        { name: 'All', count: activeProductsTotal },
        ...visibleStoreCats.map((c) => ({
          name: c.name,
          count: counts.get(c.name) || 0,
        })),
      ];
    }

    return [
      { name: 'All', count: activeProductsTotal },
      ...Array.from(counts.entries()).map(([name, count]) => ({ name, count })),
    ];
  }, [storeCategories, products, disabledCategoryNames]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!p.is_active) return false;
      // Exclude products if their category is disabled
      if (disabledCategoryNames.has(p.category)) return false;
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchStock = stockFilter === 'all' || p.stock_quantity > 0;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));
      return matchCat && matchStock && matchQuery;
    });

    return list.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'stock') return b.stock_quantity - a.stock_quantity;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchQuery, selectedCategory, stockFilter, sortBy, disabledCategoryNames]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;

    const existingIdx = activeCart.findIndex((item) => item.product.id === product.id);
    let newCart: CartItem[];

    if (existingIdx >= 0) {
      const currentQty = activeCart[existingIdx].quantity;
      if (currentQty >= product.stock_quantity) return;
      newCart = activeCart.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [
        ...activeCart,
        {
          product,
          quantity: 1,
          unit_price: product.price,
          discount_percent: 0,
          tax_rate: product.tax_rate,
        },
      ];
    }
    onUpdateCart(newCart, selectedCustomerId);
  };

  // Setup Global Hardware Barcode Scanner Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 3) {
          const scannedCode = barcodeBufferRef.current.trim().toLowerCase();
          barcodeBufferRef.current = '';

          // Match by barcode first, then SKU
          const matchedProduct = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === scannedCode) ||
              p.sku.toLowerCase() === scannedCode
          );

          if (matchedProduct) {
            addToCart(matchedProduct);
            setLastScannedFeedback(`Scanned: ${matchedProduct.name}`);
            setTimeout(() => setLastScannedFeedback(null), 3000);
          } else {
            setLastScannedFeedback(`Barcode not found: ${scannedCode}`);
            setTimeout(() => setLastScannedFeedback(null), 3000);
          }
        }
        return;
      }

      // If typed too slowly (> 120ms between keys), reset buffer (likely human manual typing)
      if (timeDiff > 120) {
        barcodeBufferRef.current = '';
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, activeCart, selectedCustomerId]);

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const newCart = activeCart
      .map((item) => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty > product.stock_quantity) return item;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    onUpdateCart(newCart, selectedCustomerId);
  };

  const removeFromCart = (productId: string) => {
    const newCart = activeCart.filter((item) => item.product.id !== productId);
    onUpdateCart(newCart, selectedCustomerId);
  };

  const clearCart = () => {
    onUpdateCart([], undefined);
    setDiscountPercent(0);
    setSelectedRewardToApply(null);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [activeCart]);

  const percentageDiscountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const rewardDiscountAmount = selectedRewardToApply
    ? Math.min(selectedRewardToApply.discountAmount, subtotal - percentageDiscountAmount)
    : 0;

  const totalDiscount = percentageDiscountAmount + rewardDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);

  const totalTax = useMemo(() => {
    if (subtotal === 0) return 0;
    const ratio = taxableAmount / subtotal;
    return activeCart.reduce((tax, item) => {
      const itemBase = item.unit_price * item.quantity * ratio;
      return tax + (itemBase * item.tax_rate) / 100;
    }, 0);
  }, [activeCart, subtotal, taxableAmount]);

  const grandTotal = Math.max(0, taxableAmount + totalTax);

  const tierMultiplier = useMemo(() => {
    if (!currentCustomer) return 1.0;
    if (currentCustomer.tier === 'Platinum') return 2.0;
    if (currentCustomer.tier === 'Gold') return 1.5;
    if (currentCustomer.tier === 'Silver') return 1.25;
    return 1.0;
  }, [currentCustomer]);

  const pointsEarnedOnOrder = Math.floor(
    (grandTotal / (settings.loyalty_points_per_currency || 10)) * tierMultiplier
  );

  const tenderedAmount = parseFloat(tenderedInput) || grandTotal;
  const changeDue = Math.max(0, tenderedAmount - grandTotal);

  const handleOpenPayment = () => {
    if (activeCart.length === 0) return;
    setTenderedInput(grandTotal.toFixed(2));
    // Default to wallet if customer has sufficient balance, else cash
    if (currentCustomer && (currentCustomer.wallet_balance || 0) >= grandTotal) {
      setSelectedPaymentMethod('wallet');
    } else {
      setSelectedPaymentMethod('cash');
    }
    setIsPaymentModalOpen(true);
  };

  const handleFinalizeSale = () => {
    const receiptNum = generateReceiptNumber();
    const token = currentTokenNumber;
    const nextToken = (token % 999) + 1;
    setCurrentTokenNumber(nextToken);
    try {
      localStorage.setItem('tlgs_pos_token_seq', String(nextToken));
    } catch {
      // ignore
    }

    const saleItems = activeCart.map((item, idx) => {
      const itemRatio = subtotal > 0 ? (item.unit_price * item.quantity) / subtotal : 0;
      const itemDiscount = totalDiscount * itemRatio;
      const itemTaxable = item.unit_price * item.quantity - itemDiscount;
      const itemTax = (itemTaxable * item.tax_rate) / 100;
      const lineTotal = itemTaxable + itemTax;

      return {
        id: `si-${Date.now()}-${idx}`,
        product_id: item.product.id,
        product_name: item.product.name,
        category: item.product.category,
        sku: item.product.sku,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: Math.round(itemDiscount * 100) / 100,
        tax_amount: Math.round(itemTax * 100) / 100,
        line_total: Math.round(lineTotal * 100) / 100,
        dietary: item.product.dietary,
      };
    });

    const isWallet = selectedPaymentMethod === 'wallet';
    const prevBalance = currentCustomer?.wallet_balance;
    const remainingBalance =
      prevBalance !== undefined ? Math.max(0, prevBalance - grandTotal) : undefined;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      receipt_number: receiptNum,
      token_number: token,
      shift_id: activeShift.id,
      cashier_username: currentUser.username,
      cashier_name: currentUser.fullName,
      customer_id: currentCustomer?.id,
      customer_name: currentCustomer?.name,
      customer_phone: currentCustomer?.phone,
      student_id: currentCustomer?.student_id,
      grade_section: currentCustomer?.grade_section,
      wallet_previous_balance: isWallet ? prevBalance : undefined,
      wallet_remaining_balance: isWallet ? remainingBalance : undefined,
      meal_session: mealSession,
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(totalDiscount * 100) / 100,
      tax_amount: Math.round(totalTax * 100) / 100,
      total_amount: Math.round(grandTotal * 100) / 100,
      payment_method: selectedPaymentMethod,
      amount_tendered: selectedPaymentMethod === 'cash' ? tenderedAmount : grandTotal,
      change_due: selectedPaymentMethod === 'cash' ? changeDue : 0,
      created_at: new Date().toISOString(),
      items: saleItems,
      applied_reward_title: selectedRewardToApply?.title,
      notes: currentCustomer ? `${currentCustomer.grade_section || currentCustomer.tier} · ${mealSession}` : undefined,
    };

    // Trigger direct thermal print for receipt and kitchen ticket
    try {
      executeThermalPrint(newSale, settings, {
        width: settings.thermal_printer_width || '80mm',
        printCustomerReceipt: true,
        printKitchenToken: true,
      });
    } catch {
      // Fallback gracefully
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // test fallback
    }

    setIsPaymentModalOpen(false);
    onCompleteSale(newSale, selectedRewardToApply || undefined);
    clearCart();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto p-4 lg:p-6 items-start">
      {/* LEFT SECTION (7 cols): Scanner indicator, Search, Categories, Product Grid */}
      <section className="lg:col-span-7 flex flex-col gap-4">
        {/* Scanner Status & Quick Feedback Notification */}
        {lastScannedFeedback && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in shadow-sm font-mono">
            <ScanBarcode className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{lastScannedFeedback}</span>
          </div>
        )}

        {/* Search & Hardware Scanner Toolbar */}
        <div
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border p-2.5 rounded-2xl shadow-sm transition-colors"
          style={{
            backgroundColor: 'var(--catalogue-bg)',
            borderColor: 'var(--theme-border)',
            color: 'var(--text-color)',
          }}
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product or scan barcode (Scanner ready)..."
              className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {onOpenNotifications && terminalLowStockCount > 0 && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title={`${terminalLowStockCount} item(s) need replenishment. Click to open Inventory Stock Alerts.`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-mono">{terminalLowStockCount} Low Stock</span>
              </button>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 py-2 px-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
              <option value="stock">Sort: Stock Level</option>
            </select>

            <div className="flex items-center p-0.5 bg-neutral-950 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setViewMode('visual')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'visual'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Visual Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'compact'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Compact Grid View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedCategory === cat.name
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.name
                    ? 'bg-neutral-950/20 text-neutral-950 font-bold'
                    : 'bg-neutral-950 text-neutral-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div
          className={`grid gap-3 ${
            viewMode === 'visual'
              ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock_quantity <= 0;
            const isLowStock = prod.stock_quantity <= prod.reorder_level && !isOutOfStock;
            const inCartItem = activeCart.find((i) => i.product.id === prod.id);
            const inCartQty = inCartItem?.quantity || 0;

            return (
              <button
                key={prod.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(prod)}
                style={{
                  backgroundColor: 'var(--product-card-bg)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--text-color)',
                }}
                className={`relative flex flex-col justify-between text-left rounded-2xl border transition-all overflow-hidden ${
                  isOutOfStock
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-amber-500/50 hover:brightness-105 hover:shadow-lg cursor-pointer'
                }`}
              >
                {viewMode === 'visual' && (
                  <div className="w-full p-2.5 pb-0">
                    <ProductVisual
                      name={prod.name}
                      category={prod.category}
                      preset={prod.image_preset}
                      imageUrl={prod.image_url}
                      aspectRatio="wide"
                    />
                  </div>
                )}

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 text-[11px] opacity-75 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {prod.dietary && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              prod.dietary === 'veg'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : prod.dietary === 'non-veg'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : prod.dietary === 'healthy'
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {prod.dietary}
                          </span>
                        )}
                        <span className="truncate opacity-80">{prod.category}</span>
                      </div>
                      {prod.calories && (
                        <span className="font-mono text-[10px] text-amber-400 shrink-0 font-medium">
                          {prod.calories} kcal
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                      {prod.name}
                    </h3>

                    {prod.portion && (
                      <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5 italic">
                        {prod.portion}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-sm tabular-nums" style={{ color: 'var(--accent-color)' }}>
                        {formatCurrency(prod.price, settings.currency_symbol)}
                      </span>
                      <span className="text-[10px] text-neutral-500">
                        Tax: {prod.tax_rate}%
                      </span>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-red-400">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-medium text-amber-400">
                          {prod.stock_quantity} left
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-400">
                          {prod.stock_quantity} in stock
                        </span>
                      )}

                      {inCartQty > 0 && (
                        <span className="mt-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-neutral-950 rounded">
                          x{inCartQty} in cart
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* RIGHT SECTION (5 cols): Shift Info, Active Cart & Checkout */}
      <section
        className="lg:col-span-5 border rounded-2xl flex flex-col shadow-xl sticky top-20 overflow-hidden transition-colors"
        style={{
          backgroundColor: 'var(--order-panel-bg)',
          borderColor: 'var(--theme-border)',
          color: 'var(--text-color)',
        }}
      >
        {/* Active Shift Float & Cashier Banner */}
        <div className="p-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300">
              Cashier: <b>{currentUser.fullName}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">
              Float: <b className="text-amber-400">{formatCurrency(activeShift.openingCash, settings.currency_symbol)}</b>
            </span>
            <button
              type="button"
              onClick={onNavigateToEod}
              className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[10px] font-bold uppercase transition-colors"
              title="Close Sales Counter & Record EOD counts"
            >
              EOD Close
            </button>
          </div>
        </div>

        {/* School Canteen Meal Session & Token Strip */}
        <div className="px-3.5 py-2.5 bg-neutral-950/90 border-b border-neutral-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] text-neutral-400 font-medium">Session:</span>
            <select
              value={mealSession}
              onChange={(e) => setMealSession(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-700 text-amber-400 font-bold text-[11px] py-1 px-2 rounded-md focus:outline-none focus:border-amber-500"
            >
              <option value="Breakfast">Morning Breakfast</option>
              <option value="Recess">Recess Break</option>
              <option value="Lunch">Hot Lunch</option>
              <option value="Evening Snack">Evening Snack</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-[10px] text-neutral-500">NEXT:</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
              TOKEN #{currentTokenNumber}
            </span>
          </div>
        </div>

        {/* Customer / Student Account Attachment Bar */}
        <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={selectedCustomerId || ''}
              onChange={(e) => onUpdateCart(activeCart, e.target.value || undefined)}
              className="w-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-amber-500"
            >
              <option value="">Walk-in Student / Cash Only</option>
              {customers.map((c) => {
                const rel = checkRelievingDate(c);
                const isBlocked = c.is_disabled || rel.isPastRelieving;
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.grade_section ? `(${c.grade_section})` : ''}
                    {isBlocked ? ' [ACCOUNT DISABLED / RELIEVED]' : ''}
                    {' · Wallet: '}{formatCurrency(c.wallet_balance || 0, settings.currency_symbol)}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 rounded-lg whitespace-nowrap border border-neutral-700/60"
            title="Register new student / staff account"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Student</span>
          </button>
        </div>

        {/* Student Canteen Profile Details, Wallet & Allergen Warning */}
        {currentCustomer && (() => {
          const relInfo = checkRelievingDate(currentCustomer);
          const isBlocked = currentCustomer.is_disabled || relInfo.isPastRelieving;

          return (
            <div className={`px-4 py-3 border-b space-y-2 text-xs ${
              isBlocked ? 'bg-red-950/40 border-red-500/30' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{currentCustomer.name}</span>
                    {isBlocked ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                        Account Disabled
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    {currentCustomer.student_id && (
                      <span className="font-mono text-neutral-300">{currentCustomer.student_id}</span>
                    )}
                    {currentCustomer.grade_section && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-neutral-300">{currentCustomer.grade_section}</span>
                      </>
                    )}
                    {currentCustomer.relieving_date && (
                      <>
                        <span>·</span>
                        <span className="text-neutral-400">Relieving: {currentCustomer.relieving_date}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block">Canteen Wallet</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {formatCurrency(currentCustomer.wallet_balance || 0, settings.currency_symbol)}
                  </span>
                </div>
              </div>

              {/* Account Disabled or Past Relieving Warning */}
              {isBlocked && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-lg flex items-start gap-2 text-red-200 text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Account Disabled / Relieving Date Reached</span>
                    <span className="text-[11px] text-red-300">
                      {currentCustomer.disabled_reason ||
                        `This student reached their scheduled relieving date on ${currentCustomer.relieving_date}. Canteen card charges and wallet deductions are locked.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Critical Allergen Alert for Canteen Staff */}
              {currentCustomer.allergens && currentCustomer.allergens !== 'None' && (
                <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center gap-2 text-red-300 text-[11px] font-bold">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>ALLERGEN ALERT: {currentCustomer.allergens}</span>
                </div>
              )}

            {/* Quick Reward Perks Picker */}
            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
              <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={selectedRewardToApply?.id || ''}
                onChange={(e) => {
                  const rew = rewards.find((r) => r.id === e.target.value);
                  setSelectedRewardToApply(rew || null);
                }}
                className="bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-200 py-1 px-2 rounded-lg flex-1 focus:outline-none"
              >
                <option value="">Apply Loyalty Reward Voucher...</option>
                {rewards
                  .filter((r) => currentCustomer.loyalty_points >= r.pointsCost)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.pointsCost} pts · Saves {formatCurrency(r.discountAmount, settings.currency_symbol)})
                    </option>
                  ))}
              </select>
              {selectedRewardToApply && (
                <button
                  type="button"
                  onClick={() => setSelectedRewardToApply(null)}
                  className="text-neutral-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          );
        })()}

        {/* Cart Item Header */}
        <div className="px-4 py-2 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-neutral-200">Current Order</span>
            <span>({activeCart.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
          </span>
          {activeCart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto scrollbar-thin">
          {activeCart.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Order is empty</p>
              <p className="text-xs text-neutral-600 mt-1">Select products or scan barcodes to begin</p>
            </div>
          ) : (
            activeCart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between gap-3 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800/80"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-neutral-100 truncate">{item.product.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                    <span>{formatCurrency(item.unit_price, settings.currency_symbol)}</span>
                    <span>·</span>
                    <span>Tax: {item.tax_rate}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="p-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold text-neutral-100">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    disabled={item.quantity >= item.product.stock_quantity}
                    className="p-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right w-16">
                  <span className="text-xs font-mono font-bold text-neutral-200">
                    {formatCurrency(item.unit_price * item.quantity, settings.currency_symbol)}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Discounts Quick Selector */}
        {activeCart.length > 0 && (
          <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-amber-400" />
              <span>Discount:</span>
            </span>
            <div className="flex items-center gap-1">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountPercent(pct)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    discountPercent === pct
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-400">
            <span>Subtotal</span>
            <span className="font-mono">{formatCurrency(subtotal, settings.currency_symbol)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>
                Discounts ({discountPercent > 0 ? `${discountPercent}% ` : ''}
                {selectedRewardToApply ? `+ ${selectedRewardToApply.title}` : ''})
              </span>
              <span className="font-mono">−{formatCurrency(totalDiscount, settings.currency_symbol)}</span>
            </div>
          )}

          <div className="flex justify-between text-neutral-400">
            <span>Taxes & GST</span>
            <span className="font-mono">{formatCurrency(totalTax, settings.currency_symbol)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <span className="text-sm font-bold" style={{ color: 'var(--text-color)' }}>TOTAL PAYABLE</span>
            <span className="text-xl font-bold font-mono tabular-nums" style={{ color: 'var(--accent-color)' }}>
              {formatCurrency(grandTotal, settings.currency_symbol)}
            </span>
          </div>

          {currentCustomer && pointsEarnedOnOrder > 0 && (
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Points to earn ({tierMultiplier}x rate):</span>
              </span>
              <span className="font-mono font-bold">+{pointsEarnedOnOrder} pts</span>
            </div>
          )}

          <button
            type="button"
            disabled={activeCart.length === 0}
            onClick={handleOpenPayment}
            style={{
              backgroundColor: activeCart.length > 0 ? 'var(--primary-btn-bg)' : undefined,
              color: '#000000',
            }}
            className="w-full mt-3 py-3 bg-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono">({formatCurrency(grandTotal, settings.currency_symbol)})</span>
          </button>
        </div>
      </section>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPaymentModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-white">Collect Payment</h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Amount Due: {formatCurrency(grandTotal, settings.currency_symbol)}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'wallet'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs">Meal Wallet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    selectedPaymentMethod === 'card'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-400 font-bold shadow-md'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card / POS</span>
                </button>
              </div>

              {selectedPaymentMethod === 'wallet' && (
                <div className="space-y-3 bg-neutral-950/90 p-4 rounded-xl border border-neutral-800">
                  {currentCustomer ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                        <div>
                          <span className="font-bold text-white block text-sm">{currentCustomer.name}</span>
                          <span className="text-neutral-400 font-mono text-[11px]">
                            {currentCustomer.student_id || 'Student Card'} {currentCustomer.grade_section ? `· ${currentCustomer.grade_section}` : ''}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          Account Active
                        </span>
                      </div>

                      <div className="space-y-2 text-xs pt-1">
                        <div className="flex justify-between text-neutral-400">
                          <span>Current Available Balance:</span>
                          <span className="font-mono font-bold text-white">
                            {formatCurrency(currentCustomer.wallet_balance || 0, settings.currency_symbol)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-amber-400">
                          <span>Meal Charge:</span>
                          <span className="font-mono font-bold">
                            −{formatCurrency(grandTotal, settings.currency_symbol)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-neutral-800 text-sm font-bold">
                          <span className="text-neutral-300">Remaining Balance:</span>
                          <span
                            className={`font-mono tabular-nums ${
                              (currentCustomer.wallet_balance || 0) >= grandTotal
                                ? 'text-emerald-400'
                                : 'text-red-400'
                            }`}
                          >
                            {formatCurrency(
                              (currentCustomer.wallet_balance || 0) - grandTotal,
                              settings.currency_symbol
                            )}
                          </span>
                        </div>
                      </div>

                      {(currentCustomer.is_disabled || checkRelievingDate(currentCustomer).isPastRelieving) ? (
                        <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>
                            Account is Disabled / Relieved. Canteen wallet deductions are blocked. Please switch to Cash or UPI.
                          </span>
                        </div>
                      ) : (currentCustomer.wallet_balance || 0) < grandTotal ? (
                        <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                          <span>
                            Insufficient balance (Short by {formatCurrency(grandTotal - (currentCustomer.wallet_balance || 0), settings.currency_symbol)}). Please switch to Cash or UPI.
                          </span>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <Wallet className="w-8 h-8 text-amber-400 mx-auto" />
                      <p className="text-xs text-neutral-200 font-semibold">No Student Attached</p>
                      <p className="text-[11px] text-neutral-400">
                        Please select a student from the active cart dropdown to charge their prepaid Canteen Wallet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedPaymentMethod === 'cash' && (
                <div className="space-y-4 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
                  <label className="block text-xs font-medium text-neutral-300">
                    Amount Received from Customer:
                    <div className="mt-1.5 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400">
                        {settings.currency_symbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={tenderedInput}
                        onChange={(e) => setTenderedInput(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 text-lg font-mono font-bold text-white pl-8 pr-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500">Quick:</span>
                    <button
                      type="button"
                      onClick={() => setTenderedInput(grandTotal.toFixed(2))}
                      className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono"
                    >
                      Exact
                    </button>
                    {[50, 100, 200, 500].map((amt) => {
                      if (amt < grandTotal && amt !== 50) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setTenderedInput(amt.toString())}
                          className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-mono"
                        >
                          +{settings.currency_symbol}{amt}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Change Due to Customer:</span>
                    <span
                      className={`text-base font-mono font-bold ${
                        changeDue > 0 ? 'text-emerald-400' : 'text-neutral-300'
                      }`}
                    >
                      {formatCurrency(changeDue, settings.currency_symbol)}
                    </span>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'upi' && (
                <div className="text-center p-5 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-3">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg flex items-center justify-center shadow-md">
                    <div className="w-full h-full border-2 border-neutral-900 flex flex-col items-center justify-center text-neutral-900 p-2">
                      <QrCode className="w-16 h-16 text-neutral-950" />
                      <span className="text-[8px] font-mono font-extrabold mt-1 tracking-tighter">
                        CANTEEN-PAY-{grandTotal.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">Scan UPI QR to Pay</p>
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      VPA: canteen@tlgs.upi · {formatCurrency(grandTotal, settings.currency_symbol)}
                    </p>
                  </div>
                </div>
              )}

              {selectedPaymentMethod === 'card' && (
                <div className="p-5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-center space-y-2">
                  <CreditCard className="w-10 h-10 text-amber-400 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-200">Insert, Swipe, or Tap Card</p>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Terminal ready for student smart card NFC or debit/credit chip
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded-lg"
              >
                Back to Cart
              </button>
              <button
                type="button"
                disabled={
                  (selectedPaymentMethod === 'wallet' &&
                    (!currentCustomer ||
                      currentCustomer.is_disabled ||
                      checkRelievingDate(currentCustomer).isPastRelieving ||
                      (currentCustomer.wallet_balance || 0) < grandTotal)) ||
                  (selectedPaymentMethod === 'cash' && tenderedAmount < grandTotal)
                }
                onClick={handleFinalizeSale}
                className="px-6 py-2.5 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Order & Print Ticket</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
