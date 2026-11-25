import { ErpRole } from './index';

export type PosSubMenuId =
  | 'pos-dashboard'
  | 'pos-billing'
  | 'pos-sales'
  | 'pos-returns'
  | 'pos-products'
  | 'pos-categories'
  | 'pos-brands'
  | 'pos-barcodes'
  | 'pos-stock'
  | 'pos-purchases'
  | 'pos-suppliers'
  | 'pos-customers'
  | 'pos-payments'
  | 'pos-expenses'
  | 'pos-register'
  | 'pos-discounts'
  | 'pos-gst'
  | 'pos-transfers'
  | 'pos-reports'
  | 'pos-settings';

export type PosPermissionKey =
  | 'viewDashboard'
  | 'createSales'
  | 'editSales'
  | 'cancelSales'
  | 'processReturns'
  | 'manageProducts'
  | 'manageCategories'
  | 'manageBarcodes'
  | 'managePurchases'
  | 'manageSuppliers'
  | 'manageCustomers'
  | 'manageInventory'
  | 'manageDiscounts'
  | 'managePayments'
  | 'manageCashRegister'
  | 'approveCashRegister'
  | 'viewReports'
  | 'exportReports'
  | 'manageSettings';

export type PosRolePermissionSet = Record<PosPermissionKey, boolean>;
export type PosPermissionMatrix = Partial<Record<ErpRole | string, PosRolePermissionSet>>;

export const POS_PERMISSION_LABELS: {
  key: PosPermissionKey;
  label: string;
  category: 'Sales & Billing' | 'Catalog & Stock' | 'Finance & Register' | 'Reports & Admin';
}[] = [
  { key: 'viewDashboard', label: 'View POS Dashboard', category: 'Sales & Billing' },
  { key: 'createSales', label: 'Create Sales / Billing', category: 'Sales & Billing' },
  { key: 'editSales', label: 'Edit Draft / Hold Sales', category: 'Sales & Billing' },
  { key: 'cancelSales', label: 'Cancel / Void Sales', category: 'Sales & Billing' },
  { key: 'processReturns', label: 'Process & Approve Returns', category: 'Sales & Billing' },
  { key: 'manageProducts', label: 'Manage Products', category: 'Catalog & Stock' },
  { key: 'manageCategories', label: 'Manage Categories & Brands', category: 'Catalog & Stock' },
  { key: 'manageBarcodes', label: 'Manage Barcodes', category: 'Catalog & Stock' },
  { key: 'managePurchases', label: 'Manage Purchases', category: 'Catalog & Stock' },
  { key: 'manageSuppliers', label: 'Manage Suppliers', category: 'Catalog & Stock' },
  { key: 'manageCustomers', label: 'Manage Customers', category: 'Catalog & Stock' },
  { key: 'manageInventory', label: 'Manage Inventory & Transfers', category: 'Catalog & Stock' },
  { key: 'manageDiscounts', label: 'Manage Discounts', category: 'Finance & Register' },
  { key: 'managePayments', label: 'Manage Payments & Credit', category: 'Finance & Register' },
  { key: 'manageCashRegister', label: 'Open / Close Cash Register', category: 'Finance & Register' },
  { key: 'approveCashRegister', label: 'Approve Cash Register & Expenses', category: 'Finance & Register' },
  { key: 'viewReports', label: 'View POS Reports', category: 'Reports & Admin' },
  { key: 'exportReports', label: 'Export Reports (Excel / Print)', category: 'Reports & Admin' },
  { key: 'manageSettings', label: 'Manage POS & GST Settings', category: 'Reports & Admin' },
];

export interface PosTenantMeta {
  organizationId: string;
  schoolId: string;
  campusId: string;
  counterId?: string;
}

export interface PosCategory extends PosTenantMeta {
  id: string;
  name: string;
  code: string;
  description?: string;
  defaultGstRate?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PosBrand extends PosTenantMeta {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PosProduct extends PosTenantMeta {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  description?: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // Configurable: 0, 5, 12, 18, 28, etc.
  unit: string; // pcs, box, set, kg, litre, pack, dozen
  openingStock: number;
  currentStock: number;
  minStockLevel: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PosBarcode extends PosTenantMeta {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  format: 'CODE128' | 'EAN13' | 'QR';
  sellingPrice: number;
  createdAt: string;
}

export interface PosCustomer extends PosTenantMeta {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  creditLimit: number;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface PosSupplier extends PosTenantMeta {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  paymentTerms: string;
  outstandingBalance: number;
  isActive: boolean;
  createdAt: string;
}

export type PosPaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Card'
  | 'Bank Transfer'
  | 'Credit'
  | 'Split';

export interface PosPaymentSplit {
  method: Exclude<PosPaymentMethod, 'Split'>;
  amount: number;
  referenceNo?: string;
}

export interface PosSaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  quantity: number;
  returnedQty: number;
  unitPrice: number;
  costPrice: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface PosSale extends PosTenantMeta {
  id: string;
  invoiceNo: string;
  saleDate: string;
  status: 'Completed' | 'Held' | 'Draft' | 'Cancelled' | 'Partially Returned' | 'Returned';
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  cashierId: string;
  cashierName: string;
  counterName?: string;
  registerId?: string;
  taxMode: 'INTRA_STATE' | 'INTER_STATE';
  items: PosSaleItem[];
  subtotal: number;
  itemDiscountTotal: number;
  billDiscountAmount: number;
  discountCode?: string;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  additionalCharges: number;
  grandTotal: number;
  amountReceived: number;
  balanceDue: number;
  changeDue: number;
  paymentMethod: PosPaymentMethod;
  paymentSplits: PosPaymentSplit[];
  notes?: string;
  accountingPosted?: boolean;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PosPayment extends PosTenantMeta {
  id: string;
  referenceType: 'SALE' | 'PURCHASE' | 'RETURN' | 'CUSTOMER_DUES' | 'SUPPLIER_PAYMENT';
  referenceId: string;
  referenceNo: string;
  partyName: string;
  method: Exclude<PosPaymentMethod, 'Split'>;
  direction: 'IN' | 'OUT';
  amount: number;
  transactionRef?: string;
  recordedBy: string;
  paymentDate: string;
  notes?: string;
}

export interface PosSaleReturnItem {
  saleItemId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  refundLineTotal: number;
}

export interface PosSaleReturn extends PosTenantMeta {
  id: string;
  returnNo: string;
  saleId: string;
  originalInvoiceNo: string;
  customerId?: string;
  customerName: string;
  returnDate: string;
  items: PosSaleReturnItem[];
  totalRefundAmount: number;
  refundMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit Note';
  reason: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  accountingPosted?: boolean;
  createdAt: string;
}

export interface PosPurchaseItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  returnedQty: number;
  purchaseRate: number;
  discountAmount: number;
  gstRate: number;
  taxAmount: number;
  lineTotal: number;
}

export interface PosPurchase extends PosTenantMeta {
  id: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  supplierInvoiceNo: string;
  purchaseDate: string;
  purchaseType: 'Cash' | 'Credit';
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid' | 'Returned';
  items: PosPurchaseItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  recordedBy: string;
  accountingPosted?: boolean;
  createdAt: string;
}

export type PosStockMovementType =
  | 'OPENING'
  | 'SALE_OUT'
  | 'SALE_CANCEL_IN'
  | 'RETURN_IN'
  | 'PURCHASE_IN'
  | 'PURCHASE_RETURN_OUT'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'DAMAGED'
  | 'EXPIRED';

export interface PosStockMovement extends PosTenantMeta {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: PosStockMovementType;
  quantityChange: number; // positive for in, negative for out
  previousStock: number;
  newStock: number;
  unitCost: number;
  valuationDelta: number;
  referenceType?: string;
  referenceNo?: string;
  reason?: string;
  recordedBy: string;
  createdAt: string;
}

export interface PosInventoryTransfer extends PosTenantMeta {
  id: string;
  transferNo: string;
  fromSchoolId: string;
  fromCampusId: string;
  fromCampusName: string;
  toSchoolId: string;
  toCampusId: string;
  toCampusName: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  status: 'Completed' | 'Cancelled';
  notes?: string;
  transferredBy: string;
  createdAt: string;
}

export interface PosCounter extends PosTenantMeta {
  id: string;
  name: string;
  code: string;
  location?: string;
  assignedCashierIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface PosCashRegisterTransaction {
  id: string;
  registerId: string;
  type: 'OPENING' | 'CASH_SALE' | 'CASH_EXPENSE' | 'CASH_REFUND' | 'CASH_IN' | 'CASH_OUT' | 'CLOSING';
  amount: number;
  referenceNo?: string;
  notes?: string;
  recordedBy: string;
  timestamp: string;
}

export interface PosCashRegister extends PosTenantMeta {
  id: string;
  registerNo: string;
  counterId: string;
  counterName: string;
  cashierId: string;
  cashierName: string;
  openingTime: string;
  closingTime?: string;
  openingCash: number;
  cashSales: number;
  cashExpenses: number;
  cashRefunds: number;
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  status: 'Open' | 'Closed' | 'Approved';
  closedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  transactions: PosCashRegisterTransaction[];
}

export interface PosExpense extends PosTenantMeta {
  id: string;
  expenseNo: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
  registerId?: string;
  recordedBy: string;
  accountingPosted?: boolean;
  createdAt: string;
}

export interface PosDiscount extends PosTenantMeta {
  id: string;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minBillAmount: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PosSettings {
  id: string;
  organizationId: string;
  schoolId: string;
  campusId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  gstin: string;
  invoicePrefix: string;
  defaultTaxMode: 'INTRA_STATE' | 'INTER_STATE';
  taxRates: number[];
  defaultInvoiceFormat: '58mm' | '80mm' | 'A4';
  allowNegativeStockOverride: boolean;
  allowCreditSales: boolean;
  requireReturnApproval: boolean;
  autoPostToAccounting: boolean;
  invoiceFooterNote: string;
  currencySymbol: string;
  updatedAt: string;
}

export interface PosDashboardMetrics {
  todaySales: number;
  totalTransactions: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  creditSales: number;
  totalPurchases: number;
  availableStockUnits: number;
  stockValuation: number;
  lowStockCount: number;
  totalReturns: number;
  dailyExpenses: number;
}

export interface PosBootstrapResponse {
  categories: PosCategory[];
  brands: PosBrand[];
  products: PosProduct[];
  barcodes: PosBarcode[];
  customers: PosCustomer[];
  suppliers: PosSupplier[];
  sales: PosSale[];
  payments: PosPayment[];
  returns: PosSaleReturn[];
  purchases: PosPurchase[];
  stockMovements: PosStockMovement[];
  transfers: PosInventoryTransfer[];
  counters: PosCounter[];
  registers: PosCashRegister[];
  expenses: PosExpense[];
  discounts: PosDiscount[];
  settings: PosSettings;
  permissions: PosRolePermissionSet;
}
