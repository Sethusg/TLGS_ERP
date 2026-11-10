import { Product, Sale, InventoryMovement, DiscountRule } from '../types/pos';
import { getStoredProducts, getStoredSales, getStoredMovements, getStoredDiscountRules } from '../utils/storage';

export async function fetchProductsApi(): Promise<Product[]> {
  try {
    const res = await fetch('/api/pos/products');
    if (!res.ok) throw new Error('Failed to fetch products from server');
    const data = await res.json();
    if (!data || data.length === 0) {
      return getStoredProducts();
    }
    return data;
  } catch (error) {
    console.warn('API sync fallback to local storage for products:', error);
    return getStoredProducts();
  }
}

export async function sendSaleApi(sale: Sale): Promise<Sale> {
  try {
    const res = await fetch('/api/pos/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    if (!res.ok) throw new Error('Failed to send sale to server');
    return await res.json();
  } catch (error) {
    console.warn('API sync fallback to local storage for sale:', error);
    return sale;
  }
}

export async function updateInventoryApi(movement: InventoryMovement): Promise<InventoryMovement> {
  try {
    const res = await fetch('/api/pos/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movement),
    });
    if (!res.ok) throw new Error('Failed to update inventory on server');
    return await res.json();
  } catch (error) {
    console.warn('API sync fallback to local storage for inventory:', error);
    return movement;
  }
}

export async function fetchSalesApi(): Promise<Sale[]> {
  try {
    const res = await fetch('/api/pos/sales');
    if (!res.ok) throw new Error('Failed to fetch sales from server');
    const data = await res.json();
    if (!data || data.length === 0) {
      return getStoredSales();
    }
    return data;
  } catch (error) {
    console.warn('API sync fallback to local storage for sales:', error);
    return getStoredSales();
  }
}

export async function fetchDiscountsApi(): Promise<DiscountRule[]> {
  try {
    const res = await fetch('/api/pos/discounts');
    if (!res.ok) throw new Error('Failed to fetch discounts from server');
    const data = await res.json();
    if (!data || data.length === 0) {
      return getStoredDiscountRules();
    }
    return data;
  } catch (error) {
    console.warn('API sync fallback to local storage for discounts:', error);
    return getStoredDiscountRules();
  }
}
