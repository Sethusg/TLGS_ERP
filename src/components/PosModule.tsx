import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  Receipt,
  Package,
  Tags,
  Barcode,
  ArrowLeftRight,
  Truck,
  Users,
  Wallet,
  Calculator,
  Percent,
  BarChart3,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Search,
  RotateCcw,
} from 'lucide-react';
import {
  PosBootstrapResponse,
  PosPaymentMethod,
  PosProduct,
  PosSubMenuId,
} from '../types';
import { useSchoolContext } from '../contexts/SchoolContext';
import {
  adjustPosStock,
  closePosRegister,
  createPosBrand,
  createPosCategory,
  createPosCustomer,
  createPosDiscount,
  createPosExpense,
  createPosProduct,
  createPosPurchase,
  createPosSale,
  createPosSupplier,
  fetchPosBootstrap,
  openPosRegister,
  updatePosSettings,
} from '../services/posService';

interface PosModuleProps {
  subItem?: string;
}

const POS_TABS: { id: PosSubMenuId; label: string }[] = [
  { id: 'pos-dashboard', label: 'POS Dashboard' },
  { id: 'pos-billing', label: 'New Sale / Billing' },
  { id: 'pos-sales', label: 'Sales History' },
  { id: 'pos-returns', label: 'Sales Returns' },
  { id: 'pos-products', label: 'Products' },
  { id: 'pos-categories', label: 'Categories' },
  { id: 'pos-brands', label: 'Brands' },
  { id: 'pos-barcodes', label: 'Barcodes' },
  { id: 'pos-stock', label: 'Stock' },
  { id: 'pos-purchases', label: 'Purchases' },
  { id: 'pos-suppliers', label: 'Suppliers' },
  { id: 'pos-customers', label: 'Customers' },
  { id: 'pos-payments', label: 'Payments' },
  { id: 'pos-expenses', label: 'Expenses' },
  { id: 'pos-register', label: 'Cash Register' },
  { id: 'pos-discounts', label: 'Discounts' },
  { id: 'pos-gst', label: 'GST / Tax' },
  { id: 'pos-transfers', label: 'Transfers' },
  { id: 'pos-reports', label: 'Reports' },
  { id: 'pos-settings', label: 'Settings' },
];

export const PosModule: React.FC<PosModuleProps> = ({ subItem = 'pos-dashboard' }) => {
  const {
    selectedOrganizationId,
    selectedSchoolId,
    selectedCampusId,
    contextLabel,
  } = useSchoolContext();

  const resolvedInitialTab = (
    POS_TABS.some((t) => t.id === subItem) ? subItem : 'pos-dashboard'
  ) as PosSubMenuId;

  const [activeTab, setActiveTab] = useState<PosSubMenuId>(resolvedInitialTab);
  const [data, setData] = useState<PosBootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Billing Cart State
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [cart, setCart] = useState<{ product: PosProduct; quantity: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('Cash');
  const [billDiscountAmount, setBillDiscountAmount] = useState(0);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Quick Entity Forms
  const [catName, setCatName] = useState('');
  const [catGst, setCatGst] = useState(5);
  const [brandName, setBrandName] = useState('');
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    purchasePrice: 50,
    sellingPrice: 100,
    gstRate: 5,
    unit: 'pcs',
    openingStock: 10,
    minStockLevel: 5,
  });
  const [custForm, setCustForm] = useState({ name: '', phone: '', email: '', gstin: '' });
  const [suppForm, setSuppForm] = useState({ name: '', phone: '', gstin: '', paymentTerms: 'Net 15' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Store Operations', description: '', amount: 0 });
  const [discountForm, setDiscountForm] = useState({ code: '', name: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: 5, minBillAmount: 0 });
  const [openingCash, setOpeningCash] = useState(1000);
  const [closingCash, setClosingCash] = useState(0);
  const [stockAdj, setStockAdj] = useState({ productId: '', movementType: 'STOCK_IN', quantity: 10, reason: '' });
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: '', supplierInvoiceNo: '', productId: '', quantity: 10, purchaseRate: 50 });

  useEffect(() => {
    if (POS_TABS.some((t) => t.id === subItem)) {
      setActiveTab(subItem as PosSubMenuId);
    }
  }, [subItem]);

  const tenantPayload = useMemo(
    () => ({
      organizationId: selectedOrganizationId !== 'all' ? selectedOrganizationId : 'org-default',
      schoolId: selectedSchoolId !== 'all' ? selectedSchoolId : 'school-default',
      campusId: selectedCampusId !== 'all' ? selectedCampusId : 'campus-default',
    }),
    [selectedOrganizationId, selectedSchoolId, selectedCampusId]
  );

  const loadPosData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPosBootstrap({
        organizationId: selectedOrganizationId,
        schoolId: selectedSchoolId,
        campusId: selectedCampusId,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load POS data.');
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId, selectedSchoolId, selectedCampusId]);

  useEffect(() => {
    loadPosData();
  }, [loadPosData]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const addProductToCart = (product: PosProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = barcodeQuery.trim().toLowerCase();
    if (!q || !data) return;
    const match = data.products.find(
      (p) =>
        p.barcode.toLowerCase() === q ||
        p.sku.toLowerCase() === q ||
        p.name.toLowerCase().includes(q)
    );
    if (match) {
      addProductToCart(match);
      setBarcodeQuery('');
    } else {
      setError(`No POS product found matching "${barcodeQuery}".`);
    }
  };

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;
    for (const item of cart) {
      const lineBase = item.product.sellingPrice * item.quantity;
      const lineTax = (lineBase * (item.product.gstRate || 0)) / 100;
      subtotal += lineBase;
      taxTotal += lineTax;
    }
    const grandTotal = Math.max(0, subtotal - billDiscountAmount + taxTotal);
    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  }, [cart, billDiscountAmount]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSubmittingSale(true);
    setError(null);
    try {
      const customer = data?.customers.find((c) => c.id === selectedCustomerId);
      const res = await createPosSale({
        ...tenantPayload,
        customerId: customer?.id,
        customerName: customer?.name || 'Walk-in Customer',
        customerPhone: customer?.phone || '',
        taxMode: data?.settings.defaultTaxMode || 'INTRA_STATE',
        paymentMethod,
        billDiscountAmount,
        amountReceived: cartSummary.grandTotal,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          unitPrice: c.product.sellingPrice,
          discountPercent: 0,
          gstRate: c.product.gstRate,
        })),
      });
      setCart([]);
      setBillDiscountAmount(0);
      notify(`Sale completed: Invoice ${res.sale.invoiceNo} (₹${res.sale.grandTotal.toFixed(2)})`);
      await loadPosData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
    } finally {
      setSubmittingSale(false);
    }
  };

  const metrics = useMemo(() => {
    const sales = (data?.sales || []).filter((s) => s.status !== 'Cancelled');
    const totalSales = sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const products = data?.products || [];
    const totalStock = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);
    const lowStock = products.filter((p) => p.currentStock <= p.minStockLevel).length;
    const totalExpenses = (data?.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalPurchases = (data?.purchases || []).reduce((sum, p) => sum + (p.grandTotal || 0), 0);
    return { totalSales, txCount: sales.length, totalStock, lowStock, totalExpenses, totalPurchases };
  }, [data]);

  const activeRegister = useMemo(
    () => (data?.registers || []).find((r) => r.status === 'Open') || null,
    [data]
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header Banner */}
      <div className="bg-[#0B1F3A] text-white rounded-xl p-5 border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              Integrated Multi-School POS · {contextLabel}
            </p>
            <h1 className="text-lg font-bold mt-0.5">
              {POS_TABS.find((t) => t.id === activeTab)?.label || 'Point of Sale'}
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('pos-billing')}
            className="px-3.5 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#C9A227] text-[#0B1F3A] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale / Billing</span>
          </button>
          <button
            type="button"
            onClick={loadPosData}
            className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Submenu Navigation Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-1.5">
        {POS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#0B1F3A] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B1F3A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. POS DASHBOARD */}
      {activeTab === 'pos-dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales Revenue', value: `₹${metrics.totalSales.toFixed(2)}`, sub: `${metrics.txCount} completed invoices` },
              { label: 'Active Products & Stock', value: `${data?.products.length || 0} SKUs`, sub: `${metrics.totalStock} units (${metrics.lowStock} low stock)` },
              { label: 'Total Purchases', value: `₹${metrics.totalPurchases.toFixed(2)}`, sub: `${data?.suppliers.length || 0} suppliers` },
              { label: 'POS Expenses', value: `₹${metrics.totalExpenses.toFixed(2)}`, sub: activeRegister ? `Register ${activeRegister.registerNo} Open` : 'No Open Register' },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[11px] font-semibold text-slate-500">{card.label}</p>
                <p className="text-xl font-bold text-[#0B1F3A] mt-1">{card.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">Recent POS Sales Invoices</h2>
            {!data || data.sales.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No POS sales recorded yet. Add products under <strong>Products</strong> and create your first invoice in <strong>New Sale / Billing</strong>.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10.5px]">
                    <tr>
                      <th className="px-3 py-2">Invoice #</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Payment</th>
                      <th className="px-3 py-2 text-right">Tax</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.sales.slice(0, 8).map((s) => (
                      <tr key={s.id}>
                        <td className="px-3 py-2 font-mono font-semibold text-[#0B1F3A]">{s.invoiceNo}</td>
                        <td className="px-3 py-2 text-slate-600">{new Date(s.saleDate).toLocaleString()}</td>
                        <td className="px-3 py-2">{s.customerName}</td>
                        <td className="px-3 py-2">{s.paymentMethod}</td>
                        <td className="px-3 py-2 text-right">₹{s.taxTotal.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#0B1F3A]">₹{s.grandTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. NEW SALE / BILLING */}
      {activeTab === 'pos-billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="Scan barcode, enter SKU, or search product name..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold cursor-pointer"
              >
                Add Item
              </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
              {(data?.products || [])
                .filter(
                  (p) =>
                    !barcodeQuery.trim() ||
                    p.name.toLowerCase().includes(barcodeQuery.toLowerCase()) ||
                    p.sku.toLowerCase().includes(barcodeQuery.toLowerCase()) ||
                    p.barcode.toLowerCase().includes(barcodeQuery.toLowerCase())
                )
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProductToCart(p)}
                    className="p-3 rounded-lg border border-slate-200 hover:border-[#0B1F3A] text-left bg-slate-50/70 hover:bg-white transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[#0B1F3A] truncate">{p.name}</p>
                    <p className="text-[10.5px] font-mono text-slate-500 mt-0.5">{p.sku} · Stock: {p.currentStock}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-extrabold text-emerald-700">₹{p.sellingPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-500">GST {p.gstRate}%</span>
                    </div>
                  </button>
                ))}
              {(!data || data.products.length === 0) && (
                <div className="col-span-full py-10 text-center text-xs text-slate-500">
                  No products configured yet. Create items in the <strong>Products</strong> tab first.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0B1F3A]">Current Bill ({cart.length})</h2>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="">Walk-in Customer</option>
                {(data?.customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#0B1F3A] truncate">{item.product.name}</p>
                      <p className="text-[10.5px] text-slate-500">
                        ₹{item.product.sellingPrice} × {item.quantity} (GST {item.product.gstRate}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const qty = Math.max(1, Number(e.target.value) || 1);
                          setCart((prev) =>
                            prev.map((c) => (c.product.id === item.product.id ? { ...c, quantity: qty } : c))
                          );
                        }}
                        className="w-14 px-2 py-1 text-xs border border-slate-300 rounded text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setCart((prev) => prev.filter((c) => c.product.id !== item.product.id))}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-400">Cart is empty</p>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-slate-600">
                  Payment Mode
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PosPaymentMethod)}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit">Credit</option>
                  </select>
                </label>
                <label className="text-[11px] text-slate-600">
                  Bill Discount (₹)
                  <input
                    type="number"
                    min={0}
                    value={billDiscountAmount}
                    onChange={(e) => setBillDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1 w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </label>
              </div>

              <div className="space-y-1 text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">GST / Tax</span>
                  <span>₹{cartSummary.taxTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#0B1F3A] border-t border-slate-200 pt-1.5 mt-1">
                  <span>Grand Total</span>
                  <span>₹{cartSummary.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={cart.length === 0 || submittingSale}
                onClick={handleCompleteSale}
                className="w-full py-2.5 rounded-lg bg-[#0B1F3A] hover:bg-[#15315B] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {submittingSale ? 'Processing Invoice...' : `Complete Sale · ₹${cartSummary.grandTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PRODUCTS */}
      {activeTab === 'pos-products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                await createPosProduct({ ...tenantPayload, ...prodForm });
                setProdForm({
                  name: '',
                  sku: '',
                  barcode: '',
                  categoryId: '',
                  brandId: '',
                  purchasePrice: 50,
                  sellingPrice: 100,
                  gstRate: 5,
                  unit: 'pcs',
                  openingStock: 10,
                  minStockLevel: 5,
                });
                notify('POS product created successfully.');
                await loadPosData();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to create product.');
              }
            }}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#D4AF37]" />
              <span>Add POS Product</span>
            </h2>
            <input
              required
              placeholder="Product Name *"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="SKU (auto if blank)"
                value={prodForm.sku}
                onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                placeholder="Barcode (auto if blank)"
                value={prodForm.barcode}
                onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={prodForm.categoryId}
                onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="">Select Category</option>
                {(data?.categories || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                value={prodForm.brandId}
                onChange={(e) => setProdForm({ ...prodForm, brandId: e.target.value })}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value="">Select Brand</option>
                {(data?.brands || []).map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-[10.5px] text-slate-600">
                Purchase ₹
                <input
                  type="number"
                  value={prodForm.purchasePrice}
                  onChange={(e) => setProdForm({ ...prodForm, purchasePrice: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </label>
              <label className="text-[10.5px] text-slate-600">
                Selling ₹
                <input
                  type="number"
                  value={prodForm.sellingPrice}
                  onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </label>
              <label className="text-[10.5px] text-slate-600">
                GST %
                <input
                  type="number"
                  value={prodForm.gstRate}
                  onChange={(e) => setProdForm({ ...prodForm, gstRate: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[10.5px] text-slate-600">
                Opening Stock
                <input
                  type="number"
                  value={prodForm.openingStock}
                  onChange={(e) => setProdForm({ ...prodForm, openingStock: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </label>
              <label className="text-[10.5px] text-slate-600">
                Min Alert Level
                <input
                  type="number"
                  value={prodForm.minStockLevel}
                  onChange={(e) => setProdForm({ ...prodForm, minStockLevel: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Save Product</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 overflow-x-auto">
            <h2 className="text-sm font-bold text-[#0B1F3A] mb-3">Product Catalog ({data?.products.length || 0})</h2>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10.5px]">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">SKU / Barcode</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">GST</th>
                  <th className="px-3 py-2 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.products || []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 font-semibold text-[#0B1F3A]">{p.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{p.sku} · {p.barcode}</td>
                    <td className="px-3 py-2 text-right font-semibold">₹{p.sellingPrice.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{p.gstRate}%</td>
                    <td className={`px-3 py-2 text-right font-bold ${p.currentStock <= p.minStockLevel ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {p.currentStock} {p.unit}
                    </td>
                  </tr>
                ))}
                {(!data || data.products.length === 0) && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">No products added yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CATEGORIES & BRANDS */}
      {(activeTab === 'pos-categories' || activeTab === 'pos-brands') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <Tags className="w-4 h-4 text-[#D4AF37]" />
              <span>Product Categories ({data?.categories.length || 0})</span>
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!catName.trim()) return;
                await createPosCategory({ ...tenantPayload, name: catName.trim(), defaultGstRate: catGst });
                setCatName('');
                notify('Category saved.');
                await loadPosData();
              }}
              className="flex gap-2"
            >
              <input
                required
                placeholder="Category name (e.g. Uniforms, Books)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                value={catGst}
                onChange={(e) => setCatGst(Number(e.target.value))}
                className="w-20 px-2 py-2 text-xs border border-slate-300 rounded-lg"
                title="Default GST %"
              />
              <button type="submit" className="px-3.5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold cursor-pointer">
                Add
              </button>
            </form>
            <div className="divide-y divide-slate-100 text-xs">
              {(data?.categories || []).map((c) => (
                <div key={c.id} className="py-2 flex justify-between">
                  <span className="font-semibold text-[#0B1F3A]">{c.name}</span>
                  <span className="text-slate-500">Default GST: {c.defaultGstRate ?? 0}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#0B1F3A]">Brands ({data?.brands.length || 0})</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!brandName.trim()) return;
                await createPosBrand({ ...tenantPayload, name: brandName.trim() });
                setBrandName('');
                notify('Brand saved.');
                await loadPosData();
              }}
              className="flex gap-2"
            >
              <input
                required
                placeholder="Brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <button type="submit" className="px-3.5 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-semibold cursor-pointer">
                Add
              </button>
            </form>
            <div className="divide-y divide-slate-100 text-xs">
              {(data?.brands || []).map((b) => (
                <div key={b.id} className="py-2 flex justify-between">
                  <span className="font-semibold text-[#0B1F3A]">{b.name}</span>
                  <span className="font-mono text-slate-500">{b.code}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SALES HISTORY / RETURNS / PAYMENTS / BARCODES / TRANSFERS / REPORTS */}
      {(activeTab === 'pos-sales' || activeTab === 'pos-returns' || activeTab === 'pos-payments' || activeTab === 'pos-barcodes' || activeTab === 'pos-transfers' || activeTab === 'pos-reports' || activeTab === 'pos-gst') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              {activeTab === 'pos-barcodes' ? <Barcode className="w-4 h-4 text-[#D4AF37]" /> : activeTab === 'pos-transfers' ? <ArrowLeftRight className="w-4 h-4 text-[#D4AF37]" /> : activeTab === 'pos-reports' ? <BarChart3 className="w-4 h-4 text-[#D4AF37]" /> : activeTab === 'pos-returns' ? <RotateCcw className="w-4 h-4 text-[#D4AF37]" /> : <Receipt className="w-4 h-4 text-[#D4AF37]" />}
              <span>{POS_TABS.find((t) => t.id === activeTab)?.label}</span>
            </h2>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B1F3A] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'pos-barcodes' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(data?.products || []).map((p) => (
                  <div key={p.id} className="p-3 border border-dashed border-slate-300 rounded-lg text-center">
                    <p className="text-xs font-bold text-[#0B1F3A] truncate">{p.name}</p>
                    <p className="font-mono text-sm tracking-widest mt-1.5 bg-slate-100 py-1 rounded">{p.barcode}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">₹{p.sellingPrice.toFixed(2)}</p>
                  </div>
                ))}
                {(!data || data.products.length === 0) && (
                  <p className="col-span-full text-center text-xs text-slate-400 py-6">No barcodes generated yet.</p>
                )}
              </div>
            ) : activeTab === 'pos-payments' ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3 py-2">Reference</th>
                    <th className="px-3 py-2">Party</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Direction</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.payments || []).map((pm) => (
                    <tr key={pm.id}>
                      <td className="px-3 py-2 font-mono">{pm.referenceNo}</td>
                      <td className="px-3 py-2">{pm.partyName}</td>
                      <td className="px-3 py-2">{pm.method}</td>
                      <td className="px-3 py-2">{pm.direction}</td>
                      <td className="px-3 py-2 text-right font-bold">₹{pm.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!data || data.payments.length === 0) && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No payments logged yet.</td></tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10.5px]">
                  <tr>
                    <th className="px-3 py-2">Invoice #</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">CGST+SGST/IGST</th>
                    <th className="px-3 py-2 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.sales || []).map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2 font-mono font-semibold">{s.invoiceNo}</td>
                      <td className="px-3 py-2">{new Date(s.saleDate).toLocaleString()}</td>
                      <td className="px-3 py-2">{s.customerName}</td>
                      <td className="px-3 py-2">{s.status}</td>
                      <td className="px-3 py-2 text-right">₹{s.taxTotal.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-bold">₹{s.grandTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {(!data || data.sales.length === 0) && (
                    <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 6. STOCK MANAGEMENT */}
      {activeTab === 'pos-stock' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A]">Stock Adjustment & Ledger</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!stockAdj.productId) return;
              await adjustPosStock({ ...tenantPayload, ...stockAdj });
              notify('Stock level updated.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-5 gap-2"
          >
            <select
              required
              value={stockAdj.productId}
              onChange={(e) => setStockAdj({ ...stockAdj, productId: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg sm:col-span-2"
            >
              <option value="">Select Product</option>
              {(data?.products || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
              ))}
            </select>
            <select
              value={stockAdj.movementType}
              onChange={(e) => setStockAdj({ ...stockAdj, movementType: e.target.value })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            >
              <option value="STOCK_IN">Stock In (+)</option>
              <option value="STOCK_OUT">Stock Out (-)</option>
              <option value="DAMAGED">Damaged (-)</option>
            </select>
            <input
              type="number"
              min={1}
              value={stockAdj.quantity}
              onChange={(e) => setStockAdj({ ...stockAdj, quantity: Number(e.target.value) })}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">
              Apply
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10.5px]">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Delta</th>
                  <th className="px-3 py-2 text-right">New Stock</th>
                  <th className="px-3 py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data?.stockMovements || []).slice(0, 15).map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-semibold">{m.productName}</td>
                    <td className="px-3 py-2">{m.movementType}</td>
                    <td className="px-3 py-2 text-right font-mono">{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}</td>
                    <td className="px-3 py-2 text-right font-bold">{m.newStock}</td>
                    <td className="px-3 py-2 text-slate-500">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. CUSTOMERS / SUPPLIERS / PURCHASES / EXPENSES / DISCOUNTS / CASH REGISTER / SETTINGS */}
      {activeTab === 'pos-customers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Users className="w-4 h-4 text-[#D4AF37]" /><span>POS Customers</span></h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createPosCustomer({ ...tenantPayload, ...custForm });
              setCustForm({ name: '', phone: '', email: '', gstin: '' });
              notify('Customer added.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <input required placeholder="Customer Name" value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required placeholder="Phone" value={custForm.phone} onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input placeholder="GSTIN (optional)" value={custForm.gstin} onChange={(e) => setCustForm({ ...custForm, gstin: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">Add Customer</button>
          </form>
          <div className="divide-y divide-slate-100 text-xs">
            {(data?.customers || []).map((c) => (
              <div key={c.id} className="py-2 flex justify-between">
                <span className="font-semibold text-[#0B1F3A]">{c.name} · {c.phone}</span>
                <span className="text-slate-500">Outstanding: ₹{c.outstandingBalance.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pos-suppliers' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Truck className="w-4 h-4 text-[#D4AF37]" /><span>POS Suppliers</span></h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createPosSupplier({ ...tenantPayload, ...suppForm });
              setSuppForm({ name: '', phone: '', gstin: '', paymentTerms: 'Net 15' });
              notify('Supplier added.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <input required placeholder="Supplier Name" value={suppForm.name} onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required placeholder="Phone" value={suppForm.phone} onChange={(e) => setSuppForm({ ...suppForm, phone: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input placeholder="GSTIN" value={suppForm.gstin} onChange={(e) => setSuppForm({ ...suppForm, gstin: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">Add Supplier</button>
          </form>
          <div className="divide-y divide-slate-100 text-xs">
            {(data?.suppliers || []).map((s) => (
              <div key={s.id} className="py-2 flex justify-between">
                <span className="font-semibold text-[#0B1F3A]">{s.name} · {s.phone}</span>
                <span className="text-slate-500">{s.paymentTerms}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pos-purchases' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A]">Record Stock Purchase</h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!purchaseForm.supplierId || !purchaseForm.productId) return;
              await createPosPurchase({
                ...tenantPayload,
                supplierId: purchaseForm.supplierId,
                supplierInvoiceNo: purchaseForm.supplierInvoiceNo || `PINV-${Date.now()}`,
                purchaseType: 'Cash',
                items: [
                  {
                    productId: purchaseForm.productId,
                    quantity: purchaseForm.quantity,
                    purchaseRate: purchaseForm.purchaseRate,
                  },
                ],
              });
              notify('Purchase recorded and inventory incremented.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-5 gap-2"
          >
            <select required value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg">
              <option value="">Select Supplier</option>
              {(data?.suppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select required value={purchaseForm.productId} onChange={(e) => setPurchaseForm({ ...purchaseForm, productId: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg">
              <option value="">Select Product</option>
              {(data?.products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min={1} value={purchaseForm.quantity} onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: Number(e.target.value) })} placeholder="Qty" className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input type="number" min={1} value={purchaseForm.purchaseRate} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseRate: Number(e.target.value) })} placeholder="Rate ₹" className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">Save Purchase</button>
          </form>
        </div>
      )}

      {activeTab === 'pos-expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Wallet className="w-4 h-4 text-[#D4AF37]" /><span>POS Expenses</span></h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createPosExpense({ ...tenantPayload, ...expenseForm, paymentMethod: 'Cash' });
              setExpenseForm({ category: 'Store Operations', description: '', amount: 0 });
              notify('POS expense recorded.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <input required placeholder="Category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required placeholder="Description" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required type="number" min={1} placeholder="Amount ₹" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">Log Expense</button>
          </form>
        </div>
      )}

      {activeTab === 'pos-register' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Calculator className="w-4 h-4 text-[#D4AF37]" /><span>Cash Register Shift</span></h2>
          {activeRegister ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
              <p className="font-bold text-emerald-900">Active Register: {activeRegister.registerNo} ({activeRegister.counterName})</p>
              <p>Opening Cash: ₹{activeRegister.openingCash.toFixed(2)} · Cash Sales: ₹{activeRegister.cashSales.toFixed(2)} · Expected Cash: ₹{activeRegister.expectedCash.toFixed(2)}</p>
              <div className="flex gap-2 items-center">
                <input type="number" value={closingCash} onChange={(e) => setClosingCash(Number(e.target.value))} placeholder="Actual counted cash" className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white" />
                <button
                  type="button"
                  onClick={async () => {
                    await closePosRegister(activeRegister.id, { actualCash: closingCash });
                    notify('Cash register closed.');
                    await loadPosData();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-semibold cursor-pointer"
                >
                  Close Shift
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 items-center text-xs">
              <input type="number" value={openingCash} onChange={(e) => setOpeningCash(Number(e.target.value))} className="px-3 py-2 border border-slate-300 rounded-lg" placeholder="Opening Cash ₹" />
              <button
                type="button"
                onClick={async () => {
                  await openPosRegister({ ...tenantPayload, openingCash, counterName: 'Main Counter' });
                  notify('Cash register opened.');
                  await loadPosData();
                }}
                className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white font-semibold cursor-pointer"
              >
                Open Cash Register
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pos-discounts' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Percent className="w-4 h-4 text-[#D4AF37]" /><span>POS Discounts</span></h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createPosDiscount({ ...tenantPayload, ...discountForm });
              setDiscountForm({ code: '', name: '', type: 'PERCENTAGE', value: 5, minBillAmount: 0 });
              notify('Discount rule saved.');
              await loadPosData();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2"
          >
            <input required placeholder="Code (e.g. SCHOOL10)" value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required placeholder="Discount Name" value={discountForm.name} onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <input required type="number" min={1} value={discountForm.value} onChange={(e) => setDiscountForm({ ...discountForm, value: Number(e.target.value) })} className="px-3 py-2 text-xs border border-slate-300 rounded-lg" />
            <button type="submit" className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">Save Discount</button>
          </form>
        </div>
      )}

      {activeTab === 'pos-settings' && data?.settings && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await updatePosSettings(data.settings);
            notify('POS settings saved.');
            await loadPosData();
          }}
          className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
        >
          <h2 className="text-sm font-bold text-[#0B1F3A] flex items-center gap-2"><Settings className="w-4 h-4 text-[#D4AF37]" /><span>POS Store &amp; GST Settings</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={data.settings.businessName}
              onChange={(e) => setData({ ...data, settings: { ...data.settings, businessName: e.target.value } })}
              placeholder="Store / School Store Name"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <input
              value={data.settings.gstin}
              onChange={(e) => setData({ ...data, settings: { ...data.settings, gstin: e.target.value } })}
              placeholder="GSTIN"
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#0B1F3A] text-white text-xs font-bold cursor-pointer">
            Save POS Settings
          </button>
        </form>
      )}
    </div>
  );
};
