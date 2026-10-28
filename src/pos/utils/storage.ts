import {
  Product,
  Sale,
  Customer,
  InventoryMovement,
  StoreSettings,
  CartItem,
  ProductCategory,
  LoyaltyReward,
  LoyaltyTransaction,
  PosUser,
  ShiftSession,
} from '../types/pos';
import {
  INITIAL_STORE_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  generateSampleSales,
  INITIAL_MOVEMENTS,
  INITIAL_CATEGORIES,
  INITIAL_LOYALTY_REWARDS,
  INITIAL_LOYALTY_TRANSACTIONS,
  INITIAL_USERS,
  INITIAL_SHIFTS,
} from '../data/initialData';

const SETTINGS_KEY = 'gsr_pos_settings';
const PRODUCTS_KEY = 'gsr_pos_products';
const SALES_KEY = 'gsr_pos_sales';
const CUSTOMERS_KEY = 'gsr_pos_customers';
const MOVEMENTS_KEY = 'gsr_pos_movements';
const ACTIVE_CART_KEY = 'gsr_pos_active_cart';
const CATEGORIES_KEY = 'gsr_pos_categories';
const REWARDS_KEY = 'gsr_pos_rewards';
const LOYALTY_TXNS_KEY = 'gsr_pos_loyalty_txns';
const USERS_KEY = 'gsr_pos_users';
const CURRENT_USER_KEY = 'gsr_pos_current_user';
const ACTIVE_SHIFT_KEY = 'gsr_pos_active_shift';
const SHIFTS_HISTORY_KEY = 'gsr_pos_shifts_history';

export function getStoredUsers(): PosUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: PosUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getStoredCurrentUser(): PosUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredCurrentUser(user: PosUser | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getStoredActiveShift(): ShiftSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SHIFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredActiveShift(shift: ShiftSession | null): void {
  if (shift) {
    localStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(shift));
  } else {
    localStorage.removeItem(ACTIVE_SHIFT_KEY);
  }
}

export function getStoredShifts(): ShiftSession[] {
  try {
    const raw = localStorage.getItem(SHIFTS_HISTORY_KEY);
    if (!raw) {
      localStorage.setItem(SHIFTS_HISTORY_KEY, JSON.stringify(INITIAL_SHIFTS));
      return INITIAL_SHIFTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SHIFTS;
  }
}

export function saveStoredShifts(shifts: ShiftSession[]): void {
  localStorage.setItem(SHIFTS_HISTORY_KEY, JSON.stringify(shifts));
}

export function getStoredSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(INITIAL_STORE_SETTINGS));
      return INITIAL_STORE_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const merged: StoreSettings = {
      ...INITIAL_STORE_SETTINGS,
      ...parsed,
      store_name: parsed.store_name === 'THE GSR SALES TERMINAL' ? 'TLGS SCHOOL CANTEEN TERMINAL' : (parsed.store_name || INITIAL_STORE_SETTINGS.store_name),
      school_name: parsed.school_name || INITIAL_STORE_SETTINGS.school_name,
      canteen_license: parsed.canteen_license || INITIAL_STORE_SETTINGS.canteen_license,
      counter_name: parsed.counter_name || INITIAL_STORE_SETTINGS.counter_name,
      thermal_printer_width: parsed.thermal_printer_width || INITIAL_STORE_SETTINGS.thermal_printer_width || '80mm',
      auto_print_receipt: parsed.auto_print_receipt ?? true,
      print_kitchen_token: parsed.print_kitchen_token ?? true,
    };
    return merged;
  } catch {
    return INITIAL_STORE_SETTINGS;
  }
}

export function saveStoredSettings(settings: StoreSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getStoredCategories(): ProductCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (!raw) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed: ProductCategory[] = JSON.parse(raw);
    // If stored categories are old generic cafe ones, update with canteen categories
    const isOldData = parsed.some((c) => c.name === 'Beverages' && !parsed.some((p) => p.name === 'Breakfast & Recess'));
    if (isOldData) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return parsed;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function saveStoredCategories(categories: ProductCategory[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function getStoredLoyaltyRewards(): LoyaltyReward[] {
  try {
    const raw = localStorage.getItem(REWARDS_KEY);
    if (!raw) {
      localStorage.setItem(REWARDS_KEY, JSON.stringify(INITIAL_LOYALTY_REWARDS));
      return INITIAL_LOYALTY_REWARDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOYALTY_REWARDS;
  }
}

export function saveStoredLoyaltyRewards(rewards: LoyaltyReward[]): void {
  localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
}

export function getStoredLoyaltyTransactions(): LoyaltyTransaction[] {
  try {
    const raw = localStorage.getItem(LOYALTY_TXNS_KEY);
    if (!raw) {
      localStorage.setItem(LOYALTY_TXNS_KEY, JSON.stringify(INITIAL_LOYALTY_TRANSACTIONS));
      return INITIAL_LOYALTY_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LOYALTY_TRANSACTIONS;
  }
}

export function saveStoredLoyaltyTransactions(txns: LoyaltyTransaction[]): void {
  localStorage.setItem(LOYALTY_TXNS_KEY, JSON.stringify(txns));
}

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    const parsed: Product[] = JSON.parse(raw);
    const hasCanteenItems = parsed.some((p) => p.sku?.startsWith('CAN-'));
    if (!hasCanteenItems) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return parsed;
  } catch {
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function getStoredSales(): Sale[] {
  try {
    const raw = localStorage.getItem(SALES_KEY);
    if (!raw) {
      const initialSales = generateSampleSales();
      localStorage.setItem(SALES_KEY, JSON.stringify(initialSales));
      return initialSales;
    }
    return JSON.parse(raw);
  } catch {
    return generateSampleSales();
  }
}

export function saveStoredSales(sales: Sale[]): void {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export function getStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    const parsed: Customer[] = JSON.parse(raw);
    const hasStudentAccounts = parsed.some((c) => Boolean(c.student_id));
    if (!hasStudentAccounts) {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    // Ensure all customers have joining_date, relieving_date, and is_disabled fields
    const enriched = parsed.map((c) => {
      const matchInitial = INITIAL_CUSTOMERS.find((init) => init.id === c.id);
      return {
        ...c,
        joining_date: c.joining_date || matchInitial?.joining_date || c.member_since || '2024-06-01',
        relieving_date: c.relieving_date || matchInitial?.relieving_date,
        is_disabled: c.is_disabled ?? matchInitial?.is_disabled ?? false,
        disabled_reason: c.disabled_reason || matchInitial?.disabled_reason,
      };
    });
    return enriched;
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function getStoredMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(MOVEMENTS_KEY);
    if (!raw) {
      localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOVEMENTS;
  }
}

export function saveStoredMovements(movements: InventoryMovement[]): void {
  localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(movements));
}

export function getStoredActiveCart(): { items: CartItem[]; customerId?: string } {
  try {
    const raw = localStorage.getItem(ACTIVE_CART_KEY);
    if (!raw) return { items: [] };
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

export function saveStoredActiveCart(cart: { items: CartItem[]; customerId?: string }): void {
  localStorage.setItem(ACTIVE_CART_KEY, JSON.stringify(cart));
}

export function resetToDefaults(): void {
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(SALES_KEY);
  localStorage.removeItem(CUSTOMERS_KEY);
  localStorage.removeItem(MOVEMENTS_KEY);
  localStorage.removeItem(ACTIVE_CART_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(REWARDS_KEY);
  localStorage.removeItem(LOYALTY_TXNS_KEY);
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(ACTIVE_SHIFT_KEY);
  localStorage.removeItem(SHIFTS_HISTORY_KEY);
}
