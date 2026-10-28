export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'other';
export type UserRole = 'cashier' | 'manager' | 'admin';

export interface PosUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  pin: string; // 4-6 digit numeric pin or password
  employeeId: string;
  isActive: boolean;
  createdAt: string;
}

export interface CashDenominations {
  c2000: number;
  c500: number;
  c200: number;
  c100: number;
  c50: number;
  c20: number;
  c10: number;
  coins: number;
}

export interface ShiftSession {
  id: string;
  cashierId: string;
  cashierUsername: string;
  cashierFullName: string;
  status: 'open' | 'closed';
  openedAt: string;
  openingCash: number;
  openingNotes?: string;
  openingDenominations?: Partial<CashDenominations>;
  closedAt?: string;
  closedBy?: string;
  // Actual counts entered during EOD closing
  actualCash?: number;
  actualUpi?: number;
  actualCard?: number;
  actualOther?: number;
  closingDenominations?: Partial<CashDenominations>;
  // Calculated system expected values
  expectedCash: number;
  expectedUpi: number;
  expectedCard: number;
  expectedOther: number;
  expectedTotal: number;
  actualTotal?: number;
  cashDifference?: number; // actualCash - expectedCash (Over / Short)
  totalDifference?: number;
  salesCount: number;
  totalSalesAmount: number;
  closingNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  is_active?: boolean; // Enabled vs Disabled
  is_visible?: boolean; // Visible vs Hidden on POS terminal
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost_price?: number;
  tax_rate: number;
  stock_quantity: number;
  reorder_level: number;
  is_active: boolean;
  image_url?: string;
  image_preset?: string;
  tags?: string[];
  dietary?: 'veg' | 'non-veg' | 'healthy' | 'beverage';
  calories?: number;
  portion?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
}

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string;
  category?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  line_total: number;
  dietary?: string;
}

export interface Sale {
  id: string;
  receipt_number: string;
  token_number?: number;
  shift_id?: string;
  cashier_username: string;
  cashier_name?: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  student_id?: string;
  grade_section?: string;
  wallet_previous_balance?: number;
  wallet_remaining_balance?: number;
  meal_session?: 'Breakfast' | 'Recess' | 'Lunch' | 'Evening Snack';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_tendered: number;
  change_due: number;
  created_at: string;
  items: SaleItem[];
  applied_reward_title?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  student_id?: string;
  grade_section?: string;
  parent_name?: string;
  wallet_balance?: number;
  allergens?: string;
  account_type?: 'student' | 'staff' | 'visitor';
  joining_date?: string;
  relieving_date?: string;
  is_disabled?: boolean;
  disabled_reason?: string;
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  member_since: string;
  last_visit?: string;
  notes?: string;
}

export interface LoyaltyReward {
  id: string;
  title: string;
  pointsCost: number;
  discountAmount: number;
  description: string;
  category: string;
  badge?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'earned' | 'redeemed';
  points: number;
  orderNumber?: string;
  description: string;
  date: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  change_quantity: number;
  remaining_stock: number;
  reason: string;
  reference: string;
  cashier_username: string;
  created_at: string;
}

export interface StoreSettings {
  store_name: string;
  school_name?: string;
  canteen_license?: string;
  counter_name?: string;
  meal_session?: string;
  thermal_printer_width?: '80mm' | '58mm';
  auto_print_receipt?: boolean;
  print_kitchen_token?: boolean;
  tax_inclusive?: boolean;
  address: string;
  phone: string;
  email: string;
  tax_number: string;
  receipt_footer: string;
  currency_code: string;
  currency_symbol: string;
  default_tax_rate: number;
  reorder_warning_threshold: number;
  loyalty_points_per_currency: number;
  loyalty_redemption_rate: number;
  updated_at?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'customers'
  | 'loyalty'
  | 'inventory'
  | 'reports'
  | 'shifts'
  | 'customer-display'
  | 'admin';

export type AuthView = 'login' | 'register' | 'authenticated';

export type PresetThemeId = 'dark' | 'deep_blue' | 'light' | 'forest_green' | 'custom';

export interface PosThemeSettings {
  pos_background_color: string;
  header_background_color: string;
  catalogue_background_color: string;
  product_card_background_color: string;
  order_panel_background_color: string;
  sidebar_background_color: string;
  primary_button_color: string;
  text_color: string;
  accent_color: string;
  selected_theme: PresetThemeId;
  updated_by?: string;
  updated_at?: string;
}
