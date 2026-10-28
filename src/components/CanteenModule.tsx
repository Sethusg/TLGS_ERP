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
} from '../pos/types/pos';
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
} from '../pos/utils/storage';
import { CanteenDashboard } from '../pos/components/CanteenDashboard';
import { CheckoutTerminal } from '../pos/components/CheckoutTerminal';
import { InventoryManager } from '../pos/components/InventoryManager';
import { DailySalesReports } from '../pos/components/DailySalesReports';
import { CustomerDashboard } from '../pos/components/CustomerDashboard';
import { LoyaltyProgramHub } from '../pos/components/LoyaltyProgramHub';
import { ShiftsHistoryPage } from '../pos/components/shift/ShiftsHistoryPage';
import { ReceiptModal } from '../pos/components/ReceiptModal';
import { StoreSettingsModal } from '../pos/components/StoreSettingsModal';
import { AdjustStockModal } from '../pos/components/AdjustStockModal';
import { ProductModal } from '../pos/components/ProductModal';
import { CustomerModal } from '../pos/components/CustomerModal';
import { NotificationPanel } from '../pos/components/NotificationPanel';
import { StockAlert, StockAlertToasts } from '../pos/components/StockAlertToasts';

interface CanteenModuleProps {
  subItem?: string;
}

export const CanteenModule: React.FC<CanteenModuleProps> = ({ subItem = 'canteen-dashboard' }) => {
  const [users, setUsers] = useState<PosUser[]>(getStoredUsers);
  const [currentUser, setCurrentUser] = useState<PosUser | null>(() => getStoredCurrentUser() || users[0]);
  const [activeShift, setActiveShift] = useState<ShiftSession | null>(getStoredActiveShift);
  const [shiftsHistory, setShiftsHistory] = useState<ShiftSession[]>(getStoredShifts);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (subItem === 'canteen-pos') return 'pos';
    if (subItem === 'canteen-inventory') return 'inventory';
    if (subItem === 'canteen-reports') return 'reports';
    if (subItem === 'canteen-customers') return 'customers';
    if (subItem === 'canteen-loyalty') return 'loyalty';
    if (subItem === 'canteen-shifts') return 'shifts';
    return 'dashboard';
  });

  // Core Data
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings);
  const [categories, setCategories] = useState<ProductCategory[]>(getStoredCategories);
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [sales, setSales] = useState<Sale[]>(getStoredSales);
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);
  const [movements, setMovements] = useState<InventoryMovement[]>(getStoredMovements);
  const [rewards, setRewards] = useState<LoyaltyReward[]>(getStoredLoyaltyRewards);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(getStoredLoyaltyTransactions);

  // Cart State
  const [activeCart, setActiveCart] = useState<CartItem[]>(() => getStoredActiveCart().items || []);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(() => getStoredActiveCart().customerId);

  // Modals
  const [activeReceiptModal, setActiveReceiptModal] = useState<Sale | null>(null);
  const [receiptAutoCloseDuration, setReceiptAutoCloseDuration] = useState<number | undefined>(undefined);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [productModalState, setProductModalState] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [customerModalState, setCustomerModalState] = useState<{ open: boolean; customer: Customer | null }>({ open: false, customer: null });
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.is_active && p.stock_quantity <= p.reorder_level).length;
  }, [products]);

  const handleOpenPastReceipt = (sale: Sale) => {
    setReceiptAutoCloseDuration(undefined);
    setActiveReceiptModal(sale);
  };

  const handleUpdateCart = (newCart: CartItem[], customerId?: string) => {
    setActiveCart(newCart);
    setSelectedCustomerId(customerId);
    saveStoredActiveCart({ items: newCart, customerId });
  };

  const handleCompleteSale = (newSale: Sale, redeemedReward?: LoyaltyReward) => {
    const updatedProducts = products.map((prod) => {
      const soldItem = newSale.items.find((item) => item.product_id === prod.id);
      if (soldItem) {
        const remaining = Math.max(0, prod.stock_quantity - soldItem.quantity);
        return { ...prod, stock_quantity: remaining, updated_at: new Date().toISOString() };
      }
      return prod;
    });

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

    const updatedSales = [newSale, ...sales];
    const updatedMovementsList = [...newMovements, ...movements];

    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);
    setSales(updatedSales);
    saveStoredSales(updatedSales);
    setMovements(updatedMovementsList);
    saveStoredMovements(updatedMovementsList);

    handleUpdateCart([], undefined);
    setReceiptAutoCloseDuration(2000);
    setActiveReceiptModal(newSale);
  };

  const handleSaveStockAdjustment = (productId: string, quantityChange: number, reason: string, reference: string) => {
    let updatedProd: Product | undefined;
    const updatedProducts = products.map((prod) => {
      if (prod.id === productId) {
        const remaining = Math.max(0, prod.stock_quantity + quantityChange);
        updatedProd = { ...prod, stock_quantity: remaining, updated_at: new Date().toISOString() };
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
        cashier_username: currentUser?.username || 'Canteen Manager',
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
        p.id === productModalState.product?.id ? ({ ...p, ...productData, updated_at: new Date().toISOString() } as Product) : p
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
        image_preset: productData.image_preset || 'breakfast',
        tags: productData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [newProd, ...products];
      setProducts(updated);
      saveStoredProducts(updated);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);
    saveStoredProducts(updated);
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
        name: customerData.name || 'New Student',
        phone: customerData.phone || '',
        email: customerData.email || '',
        student_id: customerData.student_id,
        grade_section: customerData.grade_section,
        wallet_balance: customerData.wallet_balance ?? 300,
        allergens: customerData.allergens || 'None',
        account_type: customerData.account_type || 'student',
        joining_date: customerData.joining_date || new Date().toISOString().slice(0, 10),
        relieving_date: customerData.relieving_date,
        is_disabled: customerData.is_disabled ?? false,
        loyalty_points: 25,
        total_spent: 0,
        visit_count: 0,
        tier: 'Bronze',
        member_since: new Date().toISOString().slice(0, 10),
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      saveStoredCustomers(updated);
    }
  };

  const handleToggleDisableCustomer = (customerId: string, newDisabled: boolean) => {
    const updated = customers.map((c) => (c.id === customerId ? { ...c, is_disabled: newDisabled } : c));
    setCustomers(updated);
    saveStoredCustomers(updated);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter((c) => c.id !== customerId);
    setCustomers(updated);
    saveStoredCustomers(updated);
  };

  const handleImportStudents = (newStudents: Customer[]) => {
    const updated = [...customers, ...newStudents];
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
  };

  const dummyActiveShift: ShiftSession = activeShift || {
    id: 'shift-default-01',
    cashierId: currentUser?.id || 'user-1',
    cashierUsername: currentUser?.username || 'cashier',
    cashierFullName: currentUser?.fullName || 'Cashier Operator',
    status: 'open',
    openedAt: new Date().toISOString(),
    openingCash: 2000,
    expectedCash: 2000,
    expectedUpi: 0,
    expectedCard: 0,
    expectedOther: 0,
    expectedTotal: 2000,
    salesCount: 0,
    totalSalesAmount: 0,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-navigation bar inside Canteen Module */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">TLGS Canteen & POS Management System</h2>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'pos' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            POS Checkout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all relative ${
              activeTab === 'inventory' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Inventory Manager
            {lowStockCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded bg-red-500 text-white">
                {lowStockCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'customers' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Student Accounts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'loyalty' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Loyalty Hub
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'reports' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Sales Reports
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'shifts' ? 'bg-amber-500 text-neutral-950 font-bold shadow' : 'text-neutral-300 hover:text-white bg-neutral-800'
            }`}
          >
            Shifts & EOD
          </button>
        </div>
      </div>

      {/* Render Active Canteen View */}
      {activeTab === 'dashboard' && (
        <CanteenDashboard
          sales={sales}
          products={products}
          customers={customers}
          settings={settings}
          activeShift={dummyActiveShift}
          currentUser={currentUser}
          lowStockCount={lowStockCount}
          onNavigateToTab={setActiveTab}
          onOpenCustomerModal={() => setCustomerModalState({ open: true, customer: null })}
          onSelectReceipt={handleOpenPastReceipt}
          onToggleDisableCustomer={handleToggleDisableCustomer}
          onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        />
      )}

      {activeTab === 'pos' && currentUser && (
        <CheckoutTerminal
          currentUser={currentUser}
          activeShift={dummyActiveShift}
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
          onNavigateToEod={() => setActiveTab('shifts')}
          onOpenNotifications={() => setIsNotificationPanelOpen(true)}
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
          onOpenAdjustStock={(p) => setAdjustingProduct(p)}
          onAddCategory={(cat) => {
            const updated = [...categories, cat];
            setCategories(updated);
            saveStoredCategories(updated);
          }}
          onUpdateCategory={(cat) => {
            const updated = categories.map((c) => (c.id === cat.id ? cat : c));
            setCategories(updated);
            saveStoredCategories(updated);
          }}
          onDeleteCategory={(catId) => {
            const updated = categories.filter((c) => c.id !== catId);
            setCategories(updated);
            saveStoredCategories(updated);
          }}
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
          onRedeemReward={(cust, rew) => {
            const updatedCusts = customers.map((c) =>
              c.id === cust.id ? { ...c, loyalty_points: Math.max(0, c.loyalty_points - rew.pointsCost) } : c
            );
            setCustomers(updatedCusts);
            saveStoredCustomers(updatedCusts);
          }}
          onAddNewReward={(rewData) => {
            const newR: LoyaltyReward = {
              id: `rew-${Date.now()}`,
              title: rewData.title || 'New Reward',
              pointsCost: rewData.pointsCost || 50,
              discountAmount: rewData.discountAmount || 25,
              description: rewData.description || 'Voucher',
              category: rewData.category || 'Discount',
            };
            const updated = [newR, ...rewards];
            setRewards(updated);
            saveStoredLoyaltyRewards(updated);
          }}
          onOpenCustomerModal={() => setCustomerModalState({ open: true, customer: null })}
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

      {activeTab === 'shifts' && (
        <ShiftsHistoryPage
          shifts={shiftsHistory}
          sales={sales}
          settings={settings}
        />
      )}

      {/* Modals */}
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

      {isNotificationPanelOpen && (
        <NotificationPanel
          products={products}
          isOpen={isNotificationPanelOpen}
          onClose={() => setIsNotificationPanelOpen(false)}
          onOpenAdjustStock={(p) => setAdjustingProduct(p)}
          onNavigateToTab={setActiveTab}
        />
      )}
    </div>
  );
};
