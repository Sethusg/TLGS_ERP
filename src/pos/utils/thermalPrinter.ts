import { Sale, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from './formatters';

export type ThermalRollWidth = '80mm' | '58mm';

export interface ThermalPrintOptions {
  width?: ThermalRollWidth;
  printCustomerReceipt?: boolean;
  printKitchenToken?: boolean;
  copies?: number;
}

/**
 * Center-align a text string within a specified column width
 */
function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPad = Math.floor((width - text.length) / 2);
  const rightPad = width - text.length - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Format a two-column row with left text and right text pushed to edges
 */
function justifyRow(left: string, right: string, width: number): string {
  const maxLeft = width - right.length - 1;
  const truncatedLeft = left.length > maxLeft ? left.slice(0, maxLeft) : left;
  const spaces = Math.max(1, width - truncatedLeft.length - right.length);
  return truncatedLeft + ' '.repeat(spaces) + right;
}

/**
 * Generate formatted plain text suitable for ESC/POS thermal printers
 */
export function generateThermalReceiptText(
  sale: Sale,
  settings: StoreSettings,
  options: ThermalPrintOptions = {}
): string {
  const rollWidth = options.width || settings.thermal_printer_width || '80mm';
  const cols = rollWidth === '58mm' ? 32 : 44;
  const sepDouble = '='.repeat(cols);
  const sepSingle = '-'.repeat(cols);
  const sepDotted = '. '.repeat(Math.floor(cols / 2));

  const lines: string[] = [];

  // ==========================================
  // SECTION 1: CUSTOMER THERMAL SALES RECEIPT
  // ==========================================
  if (options.printCustomerReceipt !== false) {
    // School & Canteen Header
    if (settings.school_name) {
      lines.push(centerText(settings.school_name.toUpperCase(), cols));
    }
    lines.push(centerText(settings.store_name.toUpperCase(), cols));
    if (settings.counter_name) {
      lines.push(centerText(settings.counter_name, cols));
    }
    if (settings.address) {
      lines.push(centerText(settings.address, cols));
    }
    if (settings.phone) {
      lines.push(centerText(`Tel: ${settings.phone}`, cols));
    }
    if (settings.canteen_license) {
      lines.push(centerText(settings.canteen_license, cols));
    }
    if (settings.tax_number) {
      lines.push(centerText(`GSTIN: ${settings.tax_number}`, cols));
    }

    lines.push(sepDouble);

    // Food Token Box on Receipt
    const token = sale.token_number || parseInt(sale.receipt_number.replace(/\D/g, '').slice(-2), 10) || 1;
    lines.push(centerText(`FOOD COLLECTION TOKEN #${token}`, cols));
    lines.push(centerText(`*** KEEP THIS SLIP FOR FOOD PICKUP ***`, cols));
    lines.push(sepDouble);

    // Order Metadata
    lines.push(justifyRow('RECEIPT NO:', sale.receipt_number, cols));
    lines.push(justifyRow('DATE & TIME:', formatDateTime(sale.created_at), cols));
    lines.push(justifyRow('CASHIER:', sale.cashier_username, cols));

    if (sale.meal_session) {
      lines.push(justifyRow('MEAL SESSION:', sale.meal_session.toUpperCase(), cols));
    }

    // Student / Staff Information
    if (sale.customer_name) {
      lines.push(sepSingle);
      lines.push(justifyRow('STUDENT / STAFF:', sale.customer_name, cols));
      if (sale.grade_section) {
        lines.push(justifyRow('CLASS / GRADE:', sale.grade_section, cols));
      }
      if (sale.student_id) {
        lines.push(justifyRow('ADMISSION NO:', sale.student_id, cols));
      }
    }

    lines.push(sepSingle);

    // Items Column Header
    if (cols === 32) {
      // 58mm compact layout
      lines.push(justifyRow('ITEM (QTY)', 'AMT', cols));
    } else {
      // 80mm standard layout
      lines.push(justifyRow('QTY  ITEM DESCRIPTION', 'AMOUNT', cols));
    }
    lines.push(sepSingle);

    // Items Listing
    sale.items.forEach((item) => {
      const dietary = item.dietary ? `[${item.dietary.toUpperCase()}] ` : '';
      const name = `${dietary}${item.product_name}`;
      const amountStr = formatCurrency(item.line_total, settings.currency_symbol);

      if (cols === 32) {
        // 58mm compact line
        const itemLine = `${item.quantity}x ${name}`;
        lines.push(justifyRow(itemLine, amountStr, cols));
      } else {
        // 80mm standard line
        const leftSide = `${String(item.quantity).padStart(2, ' ')}  ${name}`;
        lines.push(justifyRow(leftSide, amountStr, cols));
      }
    });

    lines.push(sepSingle);

    // Subtotal & Discounts
    lines.push(justifyRow('Subtotal:', formatCurrency(sale.subtotal, settings.currency_symbol), cols));

    if (sale.discount_amount > 0) {
      lines.push(
        justifyRow(
          'Student Discount:',
          `-${formatCurrency(sale.discount_amount, settings.currency_symbol)}`,
          cols
        )
      );
    }

    if (sale.tax_amount > 0) {
      lines.push(justifyRow('GST / Tax:', formatCurrency(sale.tax_amount, settings.currency_symbol), cols));
    }

    lines.push(sepDouble);

    // TOTAL AMOUNT
    lines.push(
      justifyRow(
        'TOTAL PAYABLE:',
        formatCurrency(sale.total_amount, settings.currency_symbol),
        cols
      )
    );
    lines.push(sepDouble);

    // Payment Tender Breakdown
    lines.push(justifyRow('PAYMENT METHOD:', sale.payment_method.toUpperCase(), cols));

    if (sale.payment_method === 'cash') {
      lines.push(
        justifyRow('Amount Tendered:', formatCurrency(sale.amount_tendered, settings.currency_symbol), cols)
      );
      lines.push(
        justifyRow('Change Returned:', formatCurrency(sale.change_due, settings.currency_symbol), cols)
      );
    } else if (sale.payment_method === 'wallet') {
      if (sale.wallet_previous_balance !== undefined) {
        lines.push(
          justifyRow(
            'Prev Wallet Balance:',
            formatCurrency(sale.wallet_previous_balance, settings.currency_symbol),
            cols
          )
        );
      }
      lines.push(
        justifyRow(
          'Deducted for Meal:',
          formatCurrency(sale.total_amount, settings.currency_symbol),
          cols
        )
      );
      if (sale.wallet_remaining_balance !== undefined) {
        lines.push(
          justifyRow(
            'Remaining Balance:',
            formatCurrency(sale.wallet_remaining_balance, settings.currency_symbol),
            cols
          )
        );
      }
    }

    // Receipt Footer & Hygienic Message
    lines.push(sepSingle);
    lines.push(centerText(settings.receipt_footer || 'Nutritious & Fresh School Meals', cols));
    lines.push(centerText('*** 100% HYGIENIC CANTEEN CERTIFIED ***', cols));
    lines.push(centerText('HAVE A WONDERFUL & HEALTHY DAY!', cols));
  }

  // ==========================================
  // SECTION 2: CANTEEN KITCHEN PICKUP TOKEN (KOT)
  // ==========================================
  if (options.printKitchenToken) {
    const token = sale.token_number || parseInt(sale.receipt_number.replace(/\D/g, '').slice(-2), 10) || 1;

    // Tear line between customer receipt and kitchen token
    if (options.printCustomerReceipt !== false) {
      lines.push('');
      lines.push(centerText('- - - - - - [ TEAR HERE ] - - - - - -', cols));
      lines.push('');
    }

    lines.push(sepDouble);
    lines.push(centerText('SCHOOL CANTEEN FOOD TOKEN', cols));
    lines.push(centerText('====================================', cols));
    lines.push('');
    lines.push(centerText(`TOKEN # ${token}`, cols));
    lines.push('');
    lines.push(centerText('====================================', cols));
    lines.push(justifyRow('ORDER REF:', sale.receipt_number, cols));
    lines.push(justifyRow('TIME:', formatDateTime(sale.created_at), cols));
    if (sale.customer_name) {
      lines.push(justifyRow('STUDENT:', `${sale.customer_name} (${sale.grade_section || 'Student'})`, cols));
    }
    lines.push(sepSingle);
    lines.push(centerText('ITEMS FOR FOOD DISPENSARY:', cols));
    lines.push(sepSingle);

    sale.items.forEach((item) => {
      lines.push(`[ ]  ${item.quantity}x  ${item.product_name}`);
    });

    lines.push(sepSingle);
    lines.push(centerText('PLEASE PRESENT AT FOOD SERVING COUNTER', cols));
    lines.push(sepDouble);
  }

  // Feed paper so it clears the thermal cutter blade
  lines.push('\n\n\n');

  return lines.join('\n');
}

/**
 * Trigger immediate thermal print directly in the browser with native thermal roll dimensions
 */
export function executeThermalPrint(
  sale: Sale,
  settings: StoreSettings,
  options: ThermalPrintOptions = {}
): void {
  const rollWidth = options.width || settings.thermal_printer_width || '80mm';
  const widthMm = rollWidth === '58mm' ? '58mm' : '80mm';

  const receiptContent = generateThermalReceiptText(sale, settings, options);

  // Create a dedicated hidden print iframe to isolate thermal CSS rules from the main UI
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = widthMm;
  iframe.style.height = '0px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Thermal Receipt - ${sale.receipt_number}</title>
        <style>
          @page {
            size: ${widthMm} auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: ${rollWidth === '58mm' ? '10px' : '11px'};
            line-height: 1.25;
            width: ${widthMm};
            max-width: ${widthMm};
          }
          pre {
            margin: 0;
            padding: 6px;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: inherit;
            font-size: inherit;
            color: #000000;
          }
          .token-callout {
            border: 2px dashed #000;
            padding: 6px;
            margin: 4px 0;
            text-align: center;
            font-weight: 900;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <pre>${escapeHtml(receiptContent)}</pre>
      </body>
    </html>
  `);
  doc.close();

  // Allow browser to render font before calling print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  }, 350);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
