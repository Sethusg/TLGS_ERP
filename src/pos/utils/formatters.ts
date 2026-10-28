import { Sale, Product } from '../types/pos';

export function formatCurrency(amount: number | string, symbol: string = '₹'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount || 0;
  return `${symbol}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} · ${d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })}`;
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `GSR-${datePart}-${randomSuffix}`;
}

// Generate CSV string from sales data
export function exportSalesToCSV(sales: Sale[], reportDateLabel: string): void {
  const headers = [
    'Receipt Number',
    'Date & Time',
    'Cashier',
    'Customer Name',
    'Customer Phone',
    'Payment Method',
    'Subtotal',
    'Discount Amount',
    'Tax Amount',
    'Total Amount',
    'Items Sold Count',
    'Items Detailed',
  ];

  const rows = sales.map((s) => {
    const itemsSummary = s.items
      .map((i) => `${i.product_name} (x${i.quantity} @ ${i.unit_price})`)
      .join(' | ');

    return [
      `"${s.receipt_number}"`,
      `"${formatDateTime(s.created_at)}"`,
      `"${s.cashier_username || ''}"`,
      `"${s.customer_name || 'Walk-in'}"`,
      `"${s.customer_phone || ''}"`,
      `"${s.payment_method.toUpperCase()}"`,
      s.subtotal.toFixed(2),
      s.discount_amount.toFixed(2),
      s.tax_amount.toFixed(2),
      s.total_amount.toFixed(2),
      s.items.reduce((acc, curr) => acc + curr.quantity, 0),
      `"${itemsSummary.replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GSR_Sales_Report_${reportDateLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate CSV export for inventory
export function exportInventoryToCSV(products: Product[]): void {
  const headers = [
    'SKU',
    'Barcode',
    'Product Name',
    'Category',
    'Unit Price',
    'Tax Rate (%)',
    'Current Stock',
    'Reorder Level',
    'Status',
    'Stock Value',
  ];

  const rows = products.map((p) => {
    const status = !p.is_active
      ? 'Inactive'
      : p.stock_quantity <= 0
      ? 'Out of Stock'
      : p.stock_quantity <= p.reorder_level
      ? 'Low Stock'
      : 'Healthy';

    const stockValue = (p.price * p.stock_quantity).toFixed(2);

    return [
      `"${p.sku}"`,
      `"${p.barcode || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price.toFixed(2),
      p.tax_rate.toFixed(2),
      p.stock_quantity,
      p.reorder_level,
      `"${status}"`,
      stockValue,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `GSR_Inventory_Valuation_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
