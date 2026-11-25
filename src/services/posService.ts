import {
  PosBootstrapResponse,
  PosBrand,
  PosCashRegister,
  PosCategory,
  PosCustomer,
  PosDiscount,
  PosExpense,
  PosInventoryTransfer,
  PosProduct,
  PosPurchase,
  PosSale,
  PosSaleReturn,
  PosSettings,
  PosSupplier,
} from '../types';
import { getErpSessionToken } from './erpBackendService';
import { resolveApiUrl } from '../utils/platformRuntime';

async function posRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getErpSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(resolveApiUrl(`/api/v1/pos${path}`), {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `POS request failed (HTTP ${res.status})`);
  }
  return data as T;
}

export function fetchPosBootstrap(params: {
  organizationId?: string;
  schoolId?: string;
  campusId?: string;
}): Promise<PosBootstrapResponse> {
  const qs = new URLSearchParams();
  if (params.organizationId && params.organizationId !== 'all') {
    qs.set('organizationId', params.organizationId);
  }
  if (params.schoolId && params.schoolId !== 'all') {
    qs.set('schoolId', params.schoolId);
  }
  if (params.campusId && params.campusId !== 'all') {
    qs.set('campusId', params.campusId);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return posRequest<PosBootstrapResponse>(`/bootstrap${suffix}`);
}

export function createPosCategory(payload: Partial<PosCategory>): Promise<{ category: PosCategory }> {
  return posRequest('/categories', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosBrand(payload: Partial<PosBrand>): Promise<{ brand: PosBrand }> {
  return posRequest('/brands', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosProduct(payload: Partial<PosProduct>): Promise<{ product: PosProduct }> {
  return posRequest('/products', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosCustomer(payload: Partial<PosCustomer>): Promise<{ customer: PosCustomer }> {
  return posRequest('/customers', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosSupplier(payload: Partial<PosSupplier>): Promise<{ supplier: PosSupplier }> {
  return posRequest('/suppliers', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosSale(payload: Record<string, unknown>): Promise<{ sale: PosSale }> {
  return posRequest('/sales', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosReturn(payload: Record<string, unknown>): Promise<{ saleReturn: PosSaleReturn }> {
  return posRequest('/returns', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosPurchase(payload: Record<string, unknown>): Promise<{ purchase: PosPurchase }> {
  return posRequest('/purchases', { method: 'POST', body: JSON.stringify(payload) });
}

export function adjustPosStock(payload: Record<string, unknown>): Promise<{ product: PosProduct }> {
  return posRequest('/stock/adjust', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosTransfer(payload: Record<string, unknown>): Promise<{ transfer: PosInventoryTransfer }> {
  return posRequest('/transfers', { method: 'POST', body: JSON.stringify(payload) });
}

export function openPosRegister(payload: Record<string, unknown>): Promise<{ register: PosCashRegister }> {
  return posRequest('/registers/open', { method: 'POST', body: JSON.stringify(payload) });
}

export function closePosRegister(
  registerId: string,
  payload: Record<string, unknown>
): Promise<{ register: PosCashRegister }> {
  return posRequest(`/registers/${encodeURIComponent(registerId)}/close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createPosExpense(payload: Partial<PosExpense>): Promise<{ expense: PosExpense }> {
  return posRequest('/expenses', { method: 'POST', body: JSON.stringify(payload) });
}

export function createPosDiscount(payload: Partial<PosDiscount>): Promise<{ discount: PosDiscount }> {
  return posRequest('/discounts', { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePosSettings(payload: Partial<PosSettings>): Promise<{ settings: PosSettings }> {
  return posRequest('/settings', { method: 'PUT', body: JSON.stringify(payload) });
}
