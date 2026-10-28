import React, { useState, useMemo } from 'react';
import {
  Product,
  CartItem,
  Sale,
  Customer,
  InventoryMovement,
  StoreSettings,
  ActiveTab,
  ProductCategory,
  LoyaltyReward,
  LoyaltyTransaction,
  PosUser,
  ShiftSession,
  AuthView,
} from './types/pos';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredProducts,
  saveStoredProducts,
  getStoredSales,
  saveStoredSales,
  getStoredCustomers,
  saveStoredCustomers,
  getStoredMovements,
  saveStoredMovements,
  getStoredCategories,
  saveStoredCategories,
  getStoredLoyaltyRewards,
  saveStoredLoyaltyRewards,
  getStoredLoyaltyTransactions,
  saveStoredLoyaltyTransactions,
  getStoredActiveCart,
  saveStoredActiveCart,
  getStoredUsers,
  saveStoredUsers,
  getStoredCurrentUser,
  saveStoredCurrentUser,
  getStoredActiveShift,
  saveStoredActiveShift,
  getStoredShifts,
  saveStoredShifts,
  resetToDefaults,
} from './utils/storage';
import { Header } from './components/Header';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { OpeningCashPage } from './components/shift/OpeningCashPage';
import { EodClosingPage } from './components/shift/EodClosingPage';
import { ClosingReportView } from './components/shift/ClosingReportView';
import { ShiftsHistoryPage } from './components/shift/ShiftsHistoryPage';
import { CheckoutTerminal } from './components/CheckoutTerminal';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LoyaltyProgramHub } from './components/LoyaltyProgramHub';
import { CustomerFacingDisplay } from './components/CustomerFacingDisplay';
import { InventoryManager } from './components/InventoryManager';
import { DailySalesReports } from './components/DailySalesReports';
import { CanteenDashboard } from './components/CanteenDashboard';
import { ReceiptModal } from './components/ReceiptModal';
import { StoreSettingsModal } from './components/StoreSettingsModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { ProductModal } from './components/ProductModal';
import { CustomerModal } from './components/CustomerModal';
import { DjangoAdminPortal } from './components/admin/DjangoAdminPortal';
import { NotificationPanel } from './components/NotificationPanel';
import { StockAlertToasts, StockAlert } from './components/StockAlertToasts';
import { Lock, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { formatCurrency, formatDateTime } from './utils/formatters';
import {
  InternationalThemeId,
  INTERNATIONAL_THEMES,
  getStoredTheme,
  saveStoredTheme,
} from './utils/theme';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';
import { PosThemeSettings } from './types/pos';
import {
  getStoredThemeSettings,
  fetchThemeSettings,
  subscribeToThemeUpdates,
} from './services/themeApi';

export default function App() {
  // Navigation & Authentication
  const [users, setUsers] = useState<PosUser[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<PosUser | null>(getStoredCurrentUser);
  const [authView, setAuthView] = useState<AuthView>(() => (getStoredCurrentUser() ? 'authenticated' : 'login'));

  // International Theme Palette State
  const [currentThemeId, setCurrentThemeId] = useState<InternationalThemeId>(getStoredTheme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const currentTheme = INTERNATIONAL_THEMES[currentThemeId] || INTERNATIONAL_THEMES.slate;

  // Dynamic Database POS Theme Customization State
  const [posThemeSettings, setPosThemeSettings] = useState<PosThemeSettings>(getStoredThemeSettings);

  React.useEffect(() => {
    // Initial fetch from backend database API
    fetchThemeSettings().then((theme) => {
      setPosThemeSettings(theme);
    });

    // Real-time synchronization subscription across connected screens/tabs
    const unsubscribe = subscribeToThemeUpdates((updatedTheme) => {
      setPosThemeSettings(updatedTheme);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectTheme = (newTheme: InternationalThemeId) => {
    setCurrentThemeId(newTheme);
    saveStoredTheme(newTheme);
  };

  // Shift & Cash Drawer Session
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(getStoredActiveShift);
  const [shiftsHistory, setShiftsHistory] = useState<ShiftSession[]>(getStoredShifts);
  const [shiftViewMode, setShiftViewMode] = useState<'normal' | 'eod-closing' | 'closing-report'>('normal');
  const [closingReportShift, setClosingReportShift] = useState<ShiftSession | null>(null);

  // Tab View
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  // Core Store Data
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings);
  const [categories, setCategories] = useState<ProductCategory[]>(getStoredCategories);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);
  const [movements, setMovements] = useState<InventoryMovement[]>(getStoredMovements);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(getStoredLoyaltyRewards);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(
    getStoredLoyaltyTransactions
  );

  // Active Cart State
  const [activeCart, setActiveCart] = useState<CartItem[]>(() => getStoredActiveCart().items || []);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(
    () => getStoredActiveCart().customerId
  );

  // Modals
  const [activeReceiptModal, setActiveReceiptModal] = useState<Sale | null>(null);
  const [receiptAutoCloseDuration, setReceiptAutoCloseDuration] = useState<number | undefined>(undefined);

  const handleOpenPastReceipt = (sale: Sale) => {
    setReceiptAutoCloseDuration(undefined);
    setActiveReceiptModal(sale);
  };
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [productModalState, setProductModalState] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [customerModalState, setCustomerModalState] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });

  // Calculate low stock items count for badge
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.is_active && p.stock_quantity <= p.reorder_level).length;
  }, [products]);

  // Inventory Stock Alert Notification Panel & Toast System
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  const triggerStockAlert = (product: Product, currentStock: number) => {
    const isOutOfStock = currentStock <= 0;
    const newAlert: StockAlert = {
      id: `alert-${Date.now()}-${product.id}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      currentStock,
      reorderLevel: product.reorder_level,
      type: isOutOfStock ? 'out_of_stock' : 'low_stock',
      timestamp: new Date().toISOString(),
    };
    setStockAlerts((prev) => [...prev.slice(-4), newAlert]);
  };

  // Sales recorded during current active shift
  const currentShiftSales = useMemo(() => {
    if (!activeShift) return [];
    return sales.filter((s) => s.shift_id === activeShift.id);
  }, [sales, activeShift]);

  // Strict logout blocking modal
  const [isLogoutBlockedModalOpen, setIsLogoutBlockedModalOpen] = useState(false);

  // AUTHENTICATION HANDLERS
  const handleLogin = (user: PosUser) => {
    setCurrentUser(user);
    saveStoredCurrentUser(user);
    setAuthView('authenticated');
    setShiftViewMode('normal');
  };

  const handleRegisterUser = (newUser: PosUser) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
  };

  const handleLogout = () => {
    // STRICT REQUIREMENT: Logout blocked until the open register is closed.
    if (activeShift) {
      setIsLogoutBlockedModalOpen(true);
      return;
    }
    setCurrentUser(null);
    saveStoredCurrentUser(null);
    setAuthView('login');
    setShiftViewMode('normal');
  };

  // SHIFT MANAGEMENT HANDLERS
  const handleConfirmOpeningCash = (newShift: ShiftSession) => {
    setActiveShift(newShift);
    saveStoredActiveShift(newShift);
    setShiftViewMode('normal');
    setActiveTab('pos');
  };

  const handleSubmitClosingCounts = (actuals: {
    actualCash: number;
    actualUpi: number;
    actualCard: number;
    actualOther: number;
    closingNotes: string;
  }) => {
    if (!activeShift) return;

    // Calculate actual shift totals
    const cashSales = currentShiftSales
      .filter((s) => s.payment_method === 'cash')
      .reduce((sum, s) => sum + s.total_amount, 0);
    const upiSales = currentShiftSales
      .filter((s) => s.payment_method === 'upi')
      .reduce((sum, s) => sum + s.total_amount, 0);
    const cardSales = currentShiftSales
      .filter((s) => s.payment_method === 'card')
      .reduce((sum, s) => sum + s.total_amount, 0);
    const otherSales = currentShiftSales
      .filter((s) => s.payment_method === 'other')
      .reduce((sum, s) => sum + s.total_amount, 0);

    const totalSales = cashSales + upiSales + cardSales + otherSales;
    const expectedCash = Math.round((activeShift.openingCash + cashSales) * 100) / 100;
    const expectedTotal = Math.round((expectedCash + upiSales + cardSales + otherSales) * 100) / 100;
    const actualTotal =
      Math.round(
        (actuals.actualCash + actuals.actualUpi + actuals.actualCard + actuals.actualOther) * 100
      ) / 100;

    const cashDiff = Math.round((actuals.actualCash - expectedCash) * 100) / 100;
    const totalDiff = Math.round((actualTotal - expectedTotal) * 100) / 100;

    const reportSession: ShiftSession = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      closedBy: currentUser?.fullName || activeShift.cashierFullName,
      actualCash: actuals.actualCash,
      actualUpi: actuals.actualUpi,
      actualCard: actuals.actualCard,
      actualOther: actuals.actualOther,
      expectedCash,
      expectedUpi: Math.round(upiSales * 100) / 100,
      expectedCard: Math.round(cardSales * 100) / 100,
      expectedOther: Math.round(otherSales * 100) / 100,
      expectedTotal,
      actualTotal,
      cashDifference: cashDiff,
      totalDifference: totalDiff,
      salesCount: currentShiftSales.length,
      totalSalesAmount: Math.round(totalSales * 100) / 100,
      closingNotes: actuals.closingNotes,
    };

    setClosingReportShift(reportSession);
    setShiftViewMode('closing-report');
  };

  const handleFinalizeCloseShift = () => {
    if (!closingReportShift) return;

    const finalShift: ShiftSession = {
      ...closingReportShift,
      status: 'closed',
    };

    const updatedHistory = [finalShift, ...shiftsHistory];
    setShiftsHistory(updatedHistory);
    saveStoredShifts(updatedHistory);

    setActiveShift(null);
    saveStoredActiveShift(null);

    setClosingReportShift(null);
    setShiftViewMode('normal');
    setActiveTab('shifts');
  };

  // CART & SALE COMPLETION
  const handleUpdateCart = (newCart: CartItem[], customerId?: string) => {
    setActiveCart(newCart);
    setSelectedCustomerId(customerId);
    saveStoredActiveCart({ items: newCart, customerId });
  };

  const handleCompleteSale = (newSale: Sale, redeemedReward?: LoyaltyReward) => {
    // 1. Decrement product stocks in real time
    const updatedProducts = products.map((prod) => {
      const soldItem = newSale.items.find((item) => item.product_id === prod.id);
      if (soldItem) {
        const remaining = Math.max(0, prod.stock_quantity - soldItem.quantity);
        return {
          ...prod,
          stock_quantity: remaining,
          updated_at: new Date().toISOString(),
        };
      }
      return prod;
    });

    // 2. Log stock movements for audit trail
    const newMovements: InventoryMovement[] = newSale.items.map((item, idx) => {
      const prod = updatedProducts.find((p) => p.id === item.product_id);
      return {
        id: `mov-${Date.now()}-${idx}`,
        product_id: item.product_id,
        product_name: item.product_name,
        sku: item.sku,
        change_quantity: -item.quantity,
        remaining_stock: prod?.stock_quantity ?? 0,
        reason: 'Customer Sale',
        reference: newSale.receipt_number,
        cashier_username: currentUser?.username || newSale.cashier_username,
        created_at: newSale.created_at,
      };
    });

    // 3. Update customer loyalty if attached
    let updatedCustomers = customers;
    let newTxns = [...loyaltyTransactions];

    if (newSale.customer_id) {
      const cust = customers.find((c) => c.id === newSale.customer_id);
      if (cust) {
        let multiplier = 1.0;
        if (cust.tier === 'Platinum') multiplier = 2.0;
        else if (cust.tier === 'Gold') multiplier = 1.5;
        else if (cust.tier === 'Silver') multiplier = 1.25;

        const earnedPoints = Math.floor(
          (newSale.total_amount / (settings.loyalty_points_per_currency || 10)) * multiplier
        );

        let netPoints = cust.loyalty_points + earnedPoints;

        newTxns.unshift({
          id: `lt-${Date.now()}-earn`,
          customerId: cust.id,
          customerName: cust.name,
          type: 'earned',
          points: earnedPoints,
          orderNumber: newSale.receipt_number,
          description: `Earned on order payment (${multiplier}x ${cust.tier} rate)`,
          date: newSale.created_at,
        });

        if (redeemedReward) {
          netPoints = Math.max(0, netPoints - redeemedReward.pointsCost);
          newTxns.unshift({
            id: `lt-${Date.now()}-red`,
            customerId: cust.id,
            customerName: cust.name,
            type: 'redeemed',
            points: redeemedReward.pointsCost,
            orderNumber: newSale.receipt_number,
            description: `Redeemed for ${redeemedReward.title}`,
            date: newSale.created_at,
          });
        }

        const newTotalSpent = cust.total_spent + newSale.total_amount;
        const newVisitCount = cust.visit_count + 1;

        let newTier = cust.tier;
        if (newTotalSpent > 10000) newTier = 'Platinum';
        else if (newTotalSpent > 4000) newTier = 'Gold';
        else if (newTotalSpent > 1500) newTier = 'Silver';

        const newWalletBalance =
          newSale.payment_method === 'wallet' && cust.wallet_balance !== undefined
            ? Math.max(0, Math.round((cust.wallet_balance - newSale.total_amount) * 100) / 100)
            : cust.wallet_balance;

        updatedCustomers = customers.map((c) =>
          c.id === cust.id
            ? {
                ...c,
                total_spent: Math.round(newTotalSpent * 100) / 100,
                visit_count: newVisitCount,
                loyalty_points: netPoints,
                wallet_balance: newWalletBalance,
                tier: newTier,
                last_visit: newSale.created_at,
              }
            : c
        );

        setCustomers(updatedCustomers);
        saveStoredCustomers(updatedCustomers);
        setLoyaltyTransactions(newTxns);
        saveStoredLoyaltyTransactions(newTxns);
      }
    }

    const updatedSales = [newSale, ...sales];
    const updatedMovementsList = [...newMovements, ...movements];

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    setSales(updatedSales);
    saveStoredSales(updatedSales);

    setMovements(updatedMovementsList);
    saveStoredMovements(updatedMovementsList);

    // 4. Trigger alert toasts for items that hit or fell below reorder_level
    newSale.items.forEach((item) => {
      const updatedItem = updatedProducts.find((p) => p.id === item.product_id);
      if (updatedItem && updatedItem.stock_quantity <= updatedItem.reorder_level) {
        triggerStockAlert(updatedItem, updatedItem.stock_quantity);
      }
    });

    handleUpdateCart([], undefined);
    setReceiptAutoCloseDuration(2000);
    setActiveReceiptModal(newSale);
  };

  const handleRedeemReward = (customer: Customer, reward: LoyaltyReward) => {
    const updatedCustomers = customers.map((c) =>
      c.id === customer.id
        ? { ...c, loyalty_points: Math.max(0, c.loyalty_points - reward.pointsCost) }
        : c
    );
    const newTxn: LoyaltyTransaction = {
      id: `lt-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      type: 'redeemed',
      points: reward.pointsCost,
      description: `Redeemed ${reward.title}`,
      date: new Date().toISOString(),
    };

    setCustomers(updatedCustomers);
    saveStoredCustomers(updatedCustomers);

    const updatedTxns = [newTxn, ...loyaltyTransactions];
    setLoyaltyTransactions(updatedTxns);
    saveStoredLoyaltyTransactions(updatedTxns);
  };

  const handleAddNewReward = (rewardData: Partial<LoyaltyReward>) => {
    const newReward: LoyaltyReward = {
      id: `rew-${Date.now()}`,
      title: rewardData.title || 'New Reward',
      pointsCost: rewardData.pointsCost || 100,
      discountAmount: rewardData.discountAmount || 50,
      category: rewardData.category || 'Discount',
      description: rewardData.description || 'Loyalty member reward',
    };
    const updated = [newReward, ...rewards];
    setRewards(updated);
    saveStoredLoyaltyRewards(updated);
  };

  const handleAddCategory = (cat: ProductCategory) => {
    const newCatWithDefaults: ProductCategory = {
      ...cat,
      is_active: cat.is_active ?? true,
      is_visible: cat.is_visible ?? true,
    };
    const updated = [...categories, newCatWithDefaults];
    setCategories(updated);
    saveStoredCategories(updated);
  };

  const handleUpdateCategory = (updatedCat: ProductCategory, oldName?: string) => {
    const updated = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(updated);
    saveStoredCategories(updated);

    // If category was renamed, update existing products that used the old name
    if (oldName && oldName !== updatedCat.name) {
      const updatedProducts = products.map((p) =>
        p.category === oldName ? { ...p, category: updatedCat.name, updated_at: new Date().toISOString() } : p
      );
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
    }
  };

  const handleDeleteCategory = (categoryId: string, reassignToCatName?: string) => {
    const catToDelete = categories.find((c) => c.id === categoryId);
    if (!catToDelete) return;

    const remainingCats = categories.filter((c) => c.id !== categoryId);
    setCategories(remainingCats);
    saveStoredCategories(remainingCats);

    // Reassign items in deleted category to target category
    const targetCategoryName = reassignToCatName || remainingCats[0]?.name || 'General';
    const updatedProducts = products.map((p) =>
      p.category === catToDelete.name ? { ...p, category: targetCategoryName, updated_at: new Date().toISOString() } : p
    );
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
  };

  const handleSaveStockAdjustment = (
    productId: string,
    quantityChange: number,
    reason: string,
    reference: string
  ) => {
    let updatedProd: Product | undefined;
    const updatedProducts = products.map((prod) => {
      if (prod.id === productId) {
        const remaining = Math.max(0, prod.stock_quantity + quantityChange);
        updatedProd = {
          ...prod,
          stock_quantity: remaining,
          updated_at: new Date().toISOString(),
        };
        return updatedProd;
      }
      return prod;
    });

    if (updatedProd) {
      const newMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        product_id: updatedProd.id,
        product_name: updatedProd.name,
        sku: updatedProd.sku,
        change_quantity: quantityChange,
        remaining_stock: updatedProd.stock_quantity,
        reason,
        reference: reference || 'Manual Adjustment',
        cashier_username: currentUser?.username || 'Manager (GSR Admin)',
        created_at: new Date().toISOString(),
      };

      const updatedMovements = [newMovement, ...movements];
      setProducts(updatedProducts);
      saveStoredProducts(updatedProducts);
      setMovements(updatedMovements);
      saveStoredMovements(updatedMovements);
    }
  };

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (productModalState.product) {
      const updated = products.map((p) =>
        p.id === productModalState.product?.id
          ? ({ ...p, ...productData, updated_at: new Date().toISOString() } as Product)
          : p
      );
      setProducts(updated);
      saveStoredProducts(updated);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        barcode: productData.barcode || '',
        name: productData.name || 'New Product',
        category: productData.category || categories[0]?.name || 'General',
        price: productData.price || 0,
        cost_price: productData.cost_price || 0,
        tax_rate: productData.tax_rate || 5,
        stock_quantity: productData.stock_quantity || 0,
        reorder_level: productData.reorder_level || 5,
        is_active: productData.is_active ?? true,
        image_preset: productData.image_preset || 'coffee',
        image_url: productData.image_url,
        tags: productData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updated = [newProd, ...products];
      setProducts(updated);
      saveStoredProducts(updated);

      if (newProd.stock_quantity > 0) {
        const initialMovement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          product_id: newProd.id,
          product_name: newProd.name,
          sku: newProd.sku,
          change_quantity: newProd.stock_quantity,
          remaining_stock: newProd.stock_quantity,
          reason: 'Initial Opening Stock Registration',
          reference: 'PROD-REG',
          cashier_username: currentUser?.username || 'Manager (GSR Admin)',
          created_at: new Date().toISOString(),
        };
        const updatedMovements = [initialMovement, ...movements];
        setMovements(updatedMovements);
        saveStoredMovements(updatedMovements);
      }
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const prodToDelete = products.find((p) => p.id === productId);
    const updatedProducts = products.filter((p) => p.id !== productId);
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    // Remove from active cart if present
    const updatedCart = activeCart.filter((item) => item.product.id !== productId);
    setActiveCart(updatedCart);
    saveStoredActiveCart({ items: updatedCart, customerId: selectedCustomerId });

    // Record inventory movement audit
    if (prodToDelete) {
      const newMovement: InventoryMovement = {
        id: `mov-${Date.now()}`,
        product_id: prodToDelete.id,
        product_name: prodToDelete.name,
        sku: prodToDelete.sku,
        change_quantity: -prodToDelete.stock_quantity,
        remaining_stock: 0,
        reason: 'Item Deleted from Inventory Catalogue',
        reference: 'PROD-DELETE',
        cashier_username: currentUser?.username || 'Manager (GSR Admin)',
        created_at: new Date().toISOString(),
      };
      const updatedMovements = [newMovement, ...movements];
      setMovements(updatedMovements);
      saveStoredMovements(updatedMovements);
    }
  };

  const handleDeleteProductImage = (productId: string) => {
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, image_url: undefined, updated_at: new Date().toISOString() } : p
    );
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    if (customerModalState.customer) {
      const updated = customers.map((c) =>
        c.id === customerModalState.customer?.id ? ({ ...c, ...customerData } as Customer) : c
      );
      setCustomers(updated);
      saveStoredCustomers(updated);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: customerData.name || 'New Customer',
        phone: customerData.phone || '',
        email: customerData.email || '',
        student_id: customerData.student_id,
        grade_section: customerData.grade_section,
        parent_name: customerData.parent_name,
        wallet_balance: customerData.wallet_balance ?? 300,
        allergens: customerData.allergens || 'None',
        account_type: customerData.account_type || 'student',
        joining_date: customerData.joining_date || new Date().toISOString().slice(0, 10),
        relieving_date: customerData.relieving_date,
        is_disabled: customerData.is_disabled ?? false,
        disabled_reason: customerData.disabled_reason,
        loyalty_points: customerData.loyalty_points || 25,
        total_spent: 0,
        visit_count: 0,
        tier: customerData.tier || 'Bronze',
        member_since: customerData.joining_date || new Date().toISOString().slice(0, 10),
        notes: customerData.notes || '',
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      saveStoredCustomers(updated);
    }
  };

  const handleToggleDisableCustomer = (customerId: string, newDisabled: boolean) => {
    const updated = customers.map((c) =>
      c.id === customerId
        ? {
            ...c,
            is_disabled: newDisabled,
            disabled_reason: newDisabled
              ? c.disabled_reason || 'Administrative disable'
              : undefined,
          }
        : c
    );
    setCustomers(updated);
    saveStoredCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    saveStoredCustomers(updated);
    if (selectedCustomerId === customerId) {
      setSelectedCustomerId(undefined);
      saveStoredActiveCart({ items: activeCart, customerId: undefined });
    }
  };

  const handleImportStudents = (newStudents: Customer[]) => {
    const updated = [...customers];
    newStudents.forEach((student) => {
      const existingIdx = student.student_id
        ? updated.findIndex((c) => c.student_id === student.student_id)
        : -1;
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...student,
          id: updated[existingIdx].id,
        };
      } else {
        updated.push(student);
      }
    });
    setCustomers(updated);
    saveStoredCustomers(updated);
  };

  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleResetData = () => {
    resetToDefaults();
    setSettings(getStoredSettings());
    setCategories(getStoredCategories());
    setProducts(getStoredProducts());
    setSales(getStoredSales());
    setCustomers(getStoredCustomers());
    setMovements(getStoredMovements());
    setRewards(getStoredLoyaltyRewards());
    setLoyaltyTransactions(getStoredLoyaltyTransactions());
    setUsers(getStoredUsers());
    setCurrentUser(null);
    saveStoredCurrentUser(null);
    setActiveShift(null);
    saveStoredActiveShift(null);
    setShiftsHistory(getStoredShifts());
    setActiveCart([]);
    setSelectedCustomerId(undefined);
    setAuthView('login');
    setShiftViewMode('normal');
  };

  // 1. UN-AUTHENTICATED: USER REGISTRATION PAGE
  if (authView === 'register') {
    return (
      <>
        <RegisterPage
          settings={settings}
          existingUsers={users}
          theme={currentTheme}
          onRegisterUser={handleRegisterUser}
          onNavigateToLogin={() => setAuthView('login')}
          onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        />
        {isThemeModalOpen && (
          <ThemeSelectorModal
            currentTheme={currentThemeId}
            onSelectTheme={handleSelectTheme}
            onClose={() => setIsThemeModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 2. UN-AUTHENTICATED: USER LOGIN PAGE
  if (authView === 'login' || !currentUser) {
    return (
      <>
        <LoginPage
          users={users}
          settings={settings}
          theme={currentTheme}
          onLogin={handleLogin}
          onNavigateToRegister={() => setAuthView('register')}
          onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        />
        {isThemeModalOpen && (
          <ThemeSelectorModal
            currentTheme={currentThemeId}
            onSelectTheme={handleSelectTheme}
            onClose={() => setIsThemeModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 3. AUTHENTICATED: MANDATORY OPENING CASH FLOAT ENTRY IF NO ACTIVE SHIFT
  if (!activeShift) {
    return (
      <>
        <OpeningCashPage
          currentUser={currentUser}
          settings={settings}
          theme={currentTheme}
          onConfirmOpeningCash={handleConfirmOpeningCash}
          onLogout={handleLogout}
          onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        />
        {isThemeModalOpen && (
          <ThemeSelectorModal
            currentTheme={currentThemeId}
            onSelectTheme={handleSelectTheme}
            onClose={() => setIsThemeModalOpen(false)}
          />
        )}
      </>
    );
  }

  // 4. AUTHENTICATED: EOD CLOSING WORKFLOW
  if (shiftViewMode === 'eod-closing') {
    return (
      <div
        className={`min-h-screen ${currentTheme.bgRoot} ${currentTheme.textColor} flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-300`}
        style={{ backgroundColor: 'var(--pos-bg)', color: 'var(--text-color)' }}
      >
        <Header
          settings={settings}
          currentUser={currentUser}
          activeShift={activeShift}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenThemeSelector={() => setIsThemeModalOpen(true)}
          onOpenNotifications={() => setIsNotificationPanelOpen(true)}
          onNavigateToEod={() => setShiftViewMode('eod-closing')}
          onLogout={handleLogout}
          lowStockCount={lowStockCount}
        />
        <main className="flex-1 pb-12">
          <EodClosingPage
            currentUser={currentUser}
            activeShift={activeShift}
            shiftSales={currentShiftSales}
            settings={settings}
            onSubmitClosingCounts={handleSubmitClosingCounts}
            onCancel={() => setShiftViewMode('normal')}
          />
        </main>
      </div>
    );
  }

  // 5. AUTHENTICATED: CLOSING REPORT & VARIANCE REVIEW
  if (shiftViewMode === 'closing-report' && closingReportShift) {
    return (
      <div
        className={`min-h-screen ${currentTheme.bgRoot} ${currentTheme.textColor} flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-300`}
        style={{ backgroundColor: 'var(--pos-bg)', color: 'var(--text-color)' }}
      >
        <Header
          settings={settings}
          currentUser={currentUser}
          activeShift={activeShift}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenThemeSelector={() => setIsThemeModalOpen(true)}
          onOpenNotifications={() => setIsNotificationPanelOpen(true)}
          onNavigateToEod={() => setShiftViewMode('eod-closing')}
          onLogout={handleLogout}
          lowStockCount={lowStockCount}
        />
        <main className="flex-1 pb-12">
          <ClosingReportView
            shift={closingReportShift}
            shiftSales={currentShiftSales}
            settings={settings}
            onFinalizeCloseShift={handleFinalizeCloseShift}
            onBackToEdit={() => setShiftViewMode('eod-closing')}
          />
        </main>
      </div>
    );
  }

  // 6. MAIN AUTHENTICATED TERMINAL WORKSPACE
  return (
    <div
      className={`min-h-screen ${currentTheme.bgRoot} ${currentTheme.textColor} flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950 transition-colors duration-300`}
      style={{ backgroundColor: 'var(--pos-bg)', color: 'var(--text-color)' }}
    >
      <Header
        settings={settings}
        currentUser={currentUser}
        activeShift={activeShift}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenThemeSelector={() => setIsThemeModalOpen(true)}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onNavigateToEod={() => setShiftViewMode('eod-closing')}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 pb-12">
        {activeTab === 'dashboard' && (
          <CanteenDashboard
            sales={sales}
            products={products}
            customers={customers}
            settings={settings}
            activeShift={activeShift}
            currentUser={currentUser}
            lowStockCount={lowStockCount}
            onNavigateToTab={setActiveTab}
            onOpenCustomerModal={() => setCustomerModalState({ open: true, customer: null })}
            onSelectReceipt={handleOpenPastReceipt}
            onToggleDisableCustomer={handleToggleDisableCustomer}
            onOpenNotifications={() => setIsNotificationPanelOpen(true)}
          />
        )}

        {activeTab === 'pos' && (
          <CheckoutTerminal
            currentUser={currentUser}
            activeShift={activeShift}
            products={products}
            categories={categories}
            customers={customers}
            rewards={rewards}
            settings={settings}
            activeCart={activeCart}
            selectedCustomerId={selectedCustomerId}
            onUpdateCart={handleUpdateCart}
            onCompleteSale={handleCompleteSale}
            onOpenCustomerModal={() => setCustomerModalState({ open: true, customer: null })}
            onNavigateToEod={() => setShiftViewMode('eod-closing')}
            onOpenNotifications={() => setIsNotificationPanelOpen(true)}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerDashboard
            customers={customers}
            sales={sales}
            settings={settings}
            onOpenAddCustomer={() => setCustomerModalState({ open: true, customer: null })}
            onEditCustomer={(cust) => setCustomerModalState({ open: true, customer: cust })}
            onToggleDisableCustomer={handleToggleDisableCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onImportStudents={handleImportStudents}
            onSelectReceipt={handleOpenPastReceipt}
          />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyProgramHub
            customers={customers}
            rewards={rewards}
            transactions={loyaltyTransactions}
            settings={settings}
            onRedeemReward={handleRedeemReward}
            onAddNewReward={handleAddNewReward}
            onOpenCustomerModal={() => setCustomerModalState({ open: true, customer: null })}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            categories={categories}
            movements={movements}
            settings={settings}
            onOpenAddProduct={() => setProductModalState({ open: true, product: null })}
            onEditProduct={(p) => setProductModalState({ open: true, product: p })}
            onDeleteProduct={handleDeleteProduct}
            onDeleteProductImage={handleDeleteProductImage}
            onOpenAdjustStock={(p) => setAdjustingProduct(p)}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {activeTab === 'shifts' && (
          <ShiftsHistoryPage
            shifts={shiftsHistory}
            sales={sales}
            settings={settings}
          />
        )}

        {activeTab === 'reports' && (
          <DailySalesReports
            sales={sales}
            categories={categories}
            settings={settings}
            onSelectReceipt={handleOpenPastReceipt}
          />
        )}

        {activeTab === 'customer-display' && (
          <CustomerFacingDisplay
            settings={settings}
            activeCart={activeCart}
            customers={customers}
            selectedCustomerId={selectedCustomerId}
            sales={sales}
            onSelectReceipt={handleOpenPastReceipt}
          />
        )}

        {activeTab === 'admin' && currentUser && (
          <DjangoAdminPortal
            currentUser={currentUser}
            settings={settings}
            shifts={shiftsHistory}
            sales={sales}
            products={products}
            movements={movements}
            users={users}
            currentTheme={posThemeSettings}
            onThemeSaved={(saved) => setPosThemeSettings(saved)}
            onUpdateShift={(updated) => {
              const updatedHistory = shiftsHistory.map((s) => (s.id === updated.id ? updated : s));
              setShiftsHistory(updatedHistory);
              saveStoredShifts(updatedHistory);
            }}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* MODALS */}
      {activeReceiptModal && (
        <ReceiptModal
          sale={activeReceiptModal}
          settings={settings}
          autoCloseAfterMs={receiptAutoCloseDuration}
          onClose={() => {
            setActiveReceiptModal(null);
            setReceiptAutoCloseDuration(undefined);
          }}
        />
      )}

      {isSettingsModalOpen && (
        <StoreSettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onResetData={handleResetData}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {adjustingProduct && (
        <AdjustStockModal
          product={adjustingProduct}
          onSaveAdjustment={handleSaveStockAdjustment}
          onClose={() => setAdjustingProduct(null)}
        />
      )}

      {productModalState.open && (
        <ProductModal
          product={productModalState.product}
          categories={categories}
          currencySymbol={settings.currency_symbol}
          onSave={handleSaveProduct}
          onDeleteProduct={handleDeleteProduct}
          onClose={() => setProductModalState({ open: false, product: null })}
        />
      )}

      {customerModalState.open && (
        <CustomerModal
          customer={customerModalState.customer}
          onSave={handleSaveCustomer}
          onClose={() => setCustomerModalState({ open: false, customer: null })}
        />
      )}

      {isThemeModalOpen && (
        <ThemeSelectorModal
          currentTheme={currentThemeId}
          onSelectTheme={handleSelectTheme}
          onClose={() => setIsThemeModalOpen(false)}
        />
      )}

      {/* STRICT LOGOUT BLOCKED MODAL */}
      {isLogoutBlockedModalOpen && activeShift && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold tracking-wider">
                    Security Policy Enforcement
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsLogoutBlockedModalOpen(false)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-white mt-2">
                  Logout Blocked: Open Sales Register Detected
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  Terminal security policy strictly requires sales counters to complete an{' '}
                  <strong className="text-amber-400">End-of-Day (EOD) Reconciliation</strong> before
                  logging out. The cashier drawer session cannot be abandoned while active sales and
                  float cash are assigned to your shift.
                </p>
              </div>
            </div>

            {/* Active Shift Summary Box */}
            <div className="mt-5 p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between items-center text-neutral-400">
                <span>Active Cashier:</span>
                <span className="font-semibold text-neutral-200">
                  {activeShift.cashierFullName} (@{activeShift.cashierUsername})
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Register Session ID:</span>
                <span className="font-mono text-amber-400">{activeShift.id}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Shift Opened At:</span>
                <span className="font-mono text-neutral-300">
                  {formatDateTime(activeShift.openedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Opening Cash Float:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(activeShift.openingCash, settings.currency_symbol)}
                </span>
              </div>
              <div className="flex justify-between items-center text-neutral-400">
                <span>Sales In This Shift:</span>
                <span className="font-mono text-neutral-200">
                  {currentShiftSales.length} transactions
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsLogoutBlockedModalOpen(false);
                  setShiftViewMode('eod-closing');
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
              >
                <span>Proceed to EOD Closing</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsLogoutBlockedModalOpen(false)}
                className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Return to POS (Stay Logged In)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVENTORY NOTIFICATION PANEL DRAWER */}
      <NotificationPanel
        products={products}
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        onOpenAdjustStock={(p) => setAdjustingProduct(p)}
        onNavigateToTab={setActiveTab}
      />

      {/* REAL-TIME FLOATING STOCK ALERT TOASTS */}
      <StockAlertToasts
        alerts={stockAlerts}
        products={products}
        onDismissAlert={(id) => setStockAlerts((prev) => prev.filter((a) => a.id !== id))}
        onOpenAdjustStock={(p) => setAdjustingProduct(p)}
      />
    </div>
  );
}
