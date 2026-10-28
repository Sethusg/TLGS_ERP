import * as XLSX from 'xlsx';
import { Sale, Customer, PosUser, StoreSettings } from '../types/pos';
import { formatCurrency, formatDateTime } from './formatters';

/**
 * Universal document export utility for Excel (.xlsx), Word (.doc), and PDF.
 */

// ==========================================
// 1. EXCEL EXPORT (.XLSX)
// ==========================================

export function exportSalesToExcel(
  sales: Sale[],
  metrics: {
    grossSales: number;
    netSales: number;
    totalDiscount: number;
    totalTax: number;
    ordersCount: number;
    timeframeLabel: string;
  },
  settings: StoreSettings,
  fileName: string = 'Sales_Report'
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['STORE / CANTEEN SALES REPORT', ''],
    ['School / Establishment', settings.store_name],
    ['Report Timeframe', metrics.timeframeLabel],
    ['Generated On', new Date().toLocaleString()],
    ['', ''],
    ['METRIC', 'VALUE'],
    ['Total Orders Billed', metrics.ordersCount],
    ['Gross Sales', metrics.grossSales],
    ['Discounts Given', metrics.totalDiscount],
    ['Taxes Collected', metrics.totalTax],
    ['Net Revenue', metrics.netSales],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Executive Summary');

  // Sheet 2: Transaction Ledger
  const transactionsData = sales.map((s) => ({
    'Receipt #': s.receipt_number,
    'Token #': s.token_number || 'N/A',
    'Date & Time': formatDateTime(s.created_at),
    'Meal Session': s.meal_session || 'N/A',
    'Customer / Student': s.customer_name || 'Walk-in Student',
    'Student ID': s.student_id || 'N/A',
    'Class / Grade': s.grade_section || 'N/A',
    'Items Count': s.items.reduce((sum, i) => sum + i.quantity, 0),
    'Subtotal': s.subtotal,
    'Discount': s.discount_amount,
    'Tax': s.tax_amount,
    'Net Total': s.total_amount,
    'Payment Method': s.payment_method.toUpperCase(),
    'Cashier': s.cashier_username,
  }));
  const txSheet = XLSX.utils.json_to_sheet(transactionsData);
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // Write and trigger download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportCustomersToExcel(
  customers: Customer[],
  settings: StoreSettings,
  fileName: string = 'Students_Staff_List'
) {
  const wb = XLSX.utils.book_new();

  const data = customers.map((c) => ({
    'Admission / Student ID': c.student_id || '',
    'Full Name': c.name,
    'Account Type': (c.account_type || 'student').toUpperCase(),
    'Class / Grade & Section': c.grade_section || '',
    'Joining / Admission Date': c.joining_date || c.member_since,
    'Relieving / Leaving Date': c.relieving_date || 'Not Scheduled',
    'Account Status': c.is_disabled ? 'DISABLED' : 'ACTIVE',
    'Disable Reason': c.disabled_reason || '',
    'Wallet Balance': c.wallet_balance || 0,
    'Known Allergens': c.allergens || 'None',
    'Parent / Guardian Name': c.parent_name || '',
    'Phone': c.phone,
    'Email': c.email || '',
    'Total Lifetime Spent': c.total_spent,
    'Total Orders': c.visit_count,
    'Loyalty Tier': c.tier,
    'Loyalty Points': c.loyalty_points,
    'Canteen Notes': c.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Students & Staff');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

export function exportUsersToExcel(
  users: PosUser[],
  settings: StoreSettings,
  fileName: string = 'Staff_Users_List'
) {
  const wb = XLSX.utils.book_new();

  const data = users.map((u) => ({
    'Employee ID': u.employeeId,
    'Full Name': u.fullName,
    'Username': u.username,
    'Role': u.role.toUpperCase(),
    'Account Status': u.isActive ? 'ACTIVE' : 'DISABLED',
    'Created At': u.createdAt ? formatDateTime(u.createdAt) : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Staff Accounts');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

// ==========================================
// 2. WORD EXPORT (.DOC)
// ==========================================

export function exportToWord(
  title: string,
  subtitle: string,
  contentHtml: string,
  fileName: string = 'Document'
) {
  const htmlDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body {
          font-family: Calibri, Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #1a1a1a;
          margin: 20px;
        }
        h1 { font-size: 20pt; color: #0b1228; margin-bottom: 4px; font-weight: bold; }
        h2 { font-size: 14pt; color: #2563eb; margin-top: 18px; margin-bottom: 8px; border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 4px; }
        .subtitle { font-size: 11pt; color: #64748b; margin-bottom: 16px; font-style: italic; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 15px;
          font-size: 10pt;
        }
        th {
          background-color: #0b1228;
          color: #ffffff;
          font-weight: bold;
          text-align: left;
          padding: 8px;
          border: 1pt solid #cbd5e1;
        }
        td {
          padding: 6px 8px;
          border: 1pt solid #cbd5e1;
        }
        tr:nth-child(even) { background-color: #f8fafc; }
        .metric-card {
          border: 1pt solid #e2e8f0;
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 30px;
          font-size: 9pt;
          color: #94a3b8;
          border-top: 1pt solid #e2e8f0;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="subtitle">${subtitle}</div>
      ${contentHtml}
      <div class="footer">
        Generated by TLGS School Canteen POS Terminal · ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDocument], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 3. PDF EXPORT (HIGH-FIDELITY PRINTABLE PDF)
// ==========================================

export function exportToPDF(
  documentTitle: string,
  htmlContent: string
) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '1000px';
  iframe.style.height = '1200px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${documentTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111827;
            font-size: 11px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .header-banner {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 11px;
            color: #64748b;
          }
          .meta-box {
            text-align: right;
            font-size: 10px;
            color: #475569;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 20px 0;
            font-size: 10px;
          }
          th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #334155;
            font-size: 9px;
            text-transform: uppercase;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            padding: 8px 10px;
            border-radius: 6px;
          }
          .kpi-title {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
          }
          .kpi-value {
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
            font-family: monospace;
          }
          .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
          }
          .badge-active { background: #dcfce7; color: #166534; }
          .badge-disabled { background: #fee2e2; color: #991b1b; }
          .footer-note {
            margin-top: 24px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
        <div class="footer-note">
          Official School Canteen Record · Powered by TLGS POS Terminal · Page 1 of 1
        </div>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 400);
}

// ==========================================
// 4. PRESET WORD & PDF COMPOSERS
// ==========================================

export function exportSalesToWord(
  sales: Sale[],
  metrics: {
    grossSales: number;
    netSales: number;
    totalDiscount: number;
    totalTax: number;
    ordersCount: number;
    timeframeLabel: string;
  },
  settings: StoreSettings
) {
  const content = `
    <h2>Executive Performance Summary</h2>
    <div class="metric-card">
      <p><b>Timeframe:</b> ${metrics.timeframeLabel} | <b>Total Orders:</b> ${metrics.ordersCount} | <b>Net Revenue:</b> ${formatCurrency(metrics.netSales, settings.currency_symbol)}</p>
      <p><b>Gross Sales:</b> ${formatCurrency(metrics.grossSales, settings.currency_symbol)} | <b>Discounts:</b> ${formatCurrency(metrics.totalDiscount, settings.currency_symbol)} | <b>Tax / GST:</b> ${formatCurrency(metrics.totalTax, settings.currency_symbol)}</p>
    </div>

    <h2>Sales Transactions Ledger</h2>
    <table>
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Token #</th>
          <th>Date & Time</th>
          <th>Student / Customer</th>
          <th>Class / Grade</th>
          <th>Session</th>
          <th>Items</th>
          <th>Payment</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${sales
          .map(
            (s) => `
          <tr>
            <td><b>${s.receipt_number}</b></td>
            <td>${s.token_number || '-'}</td>
            <td>${formatDateTime(s.created_at)}</td>
            <td>${s.customer_name || 'Walk-in Student'}</td>
            <td>${s.grade_section || '-'}</td>
            <td>${s.meal_session || '-'}</td>
            <td>${s.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
            <td>${s.payment_method.toUpperCase()}</td>
            <td><b>${formatCurrency(s.total_amount, settings.currency_symbol)}</b></td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToWord(
    `${settings.store_name} - Sales Report`,
    `Reporting Window: ${metrics.timeframeLabel}`,
    content,
    `Sales_Report_${metrics.timeframeLabel.replace(/\s+/g, '_')}`
  );
}

export function exportSalesToPDF(
  sales: Sale[],
  metrics: {
    grossSales: number;
    netSales: number;
    totalDiscount: number;
    totalTax: number;
    ordersCount: number;
    timeframeLabel: string;
  },
  settings: StoreSettings
) {
  const html = `
    <div class="header-banner">
      <div>
        <h1 class="title">${settings.store_name}</h1>
        <div class="subtitle">Official Canteen Sales & Settlement Audit · ${metrics.timeframeLabel}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">License: ${settings.canteen_license || 'FSSAI-10023011000412'} · Counter: ${settings.counter_name || 'COUNTER #01'}</div>
      </div>
      <div class="meta-box">
        <div><b>Generated:</b> ${new Date().toLocaleDateString()}</div>
        <div><b>Time:</b> ${new Date().toLocaleTimeString()}</div>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-title">Gross Revenue</div>
        <div class="kpi-value">${formatCurrency(metrics.grossSales, settings.currency_symbol)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Net Sales Collected</div>
        <div class="kpi-value" style="color: #166534;">${formatCurrency(metrics.netSales, settings.currency_symbol)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Orders / Tokens</div>
        <div class="kpi-value">${metrics.ordersCount}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Taxes / GST</div>
        <div class="kpi-value">${formatCurrency(metrics.totalTax, settings.currency_symbol)}</div>
      </div>
    </div>

    <h3 style="font-size: 12px; text-transform: uppercase; margin: 16px 0 6px 0;">Transactions Ledger</h3>
    <table>
      <thead>
        <tr>
          <th>Receipt #</th>
          <th>Token #</th>
          <th>Date & Time</th>
          <th>Student / Customer</th>
          <th>Class</th>
          <th>Session</th>
          <th>Items</th>
          <th>Payment</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${sales
          .map(
            (s) => `
          <tr>
            <td><b>${s.receipt_number}</b></td>
            <td>${s.token_number ? `#${s.token_number}` : '-'}</td>
            <td>${formatDateTime(s.created_at).slice(-8)}</td>
            <td>${s.customer_name || 'Walk-in'}</td>
            <td>${s.grade_section || '-'}</td>
            <td>${s.meal_session || '-'}</td>
            <td>${s.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
            <td><span class="badge" style="background: #f1f5f9; color: #334155;">${s.payment_method.toUpperCase()}</span></td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(s.total_amount, settings.currency_symbol)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToPDF(`${settings.store_name} - Sales Report`, html);
}

export function exportCustomersToWord(customers: Customer[], settings: StoreSettings) {
  const content = `
    <h2>Students & Staff Canteen Registry</h2>
    <table>
      <thead>
        <tr>
          <th>Admission ID</th>
          <th>Student / Staff Name</th>
          <th>Class / Grade</th>
          <th>Account Type</th>
          <th>Joining Date</th>
          <th>Relieving Date</th>
          <th>Status</th>
          <th>Wallet Balance</th>
          <th>Allergens</th>
          <th>Parent Contact</th>
        </tr>
      </thead>
      <tbody>
        ${customers
          .map(
            (c) => `
          <tr>
            <td><b>${c.student_id || '-'}</b></td>
            <td>${c.name}</td>
            <td>${c.grade_section || '-'}</td>
            <td>${(c.account_type || 'student').toUpperCase()}</td>
            <td>${c.joining_date || c.member_since}</td>
            <td>${c.relieving_date || 'Not Scheduled'}</td>
            <td><b>${c.is_disabled ? 'DISABLED' : 'ACTIVE'}</b></td>
            <td>${formatCurrency(c.wallet_balance || 0, settings.currency_symbol)}</td>
            <td>${c.allergens || 'None'}</td>
            <td>${c.phone} ${c.parent_name ? `(${c.parent_name})` : ''}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToWord(
    `${settings.store_name} - Student & Staff Registry`,
    `Total Accounts: ${customers.length} | Generated: ${new Date().toLocaleDateString()}`,
    content,
    'Students_Registry'
  );
}

export function exportCustomersToPDF(customers: Customer[], settings: StoreSettings) {
  const html = `
    <div class="header-banner">
      <div>
        <h1 class="title">${settings.store_name}</h1>
        <div class="subtitle">Official Student & Staff Canteen Accounts Registry</div>
      </div>
      <div class="meta-box">
        <div><b>Total Accounts:</b> ${customers.length}</div>
        <div><b>Active:</b> ${customers.filter((c) => !c.is_disabled).length} | <b>Disabled:</b> ${customers.filter((c) => c.is_disabled).length}</div>
        <div><b>Generated:</b> ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Admission ID</th>
          <th>Student / Staff Name</th>
          <th>Class / Grade</th>
          <th>Type</th>
          <th>Joining</th>
          <th>Relieving</th>
          <th>Status</th>
          <th style="text-align: right;">Wallet</th>
          <th>Allergens</th>
          <th>Contact</th>
        </tr>
      </thead>
      <tbody>
        ${customers
          .map(
            (c) => `
          <tr>
            <td><b>${c.student_id || '-'}</b></td>
            <td>${c.name}</td>
            <td>${c.grade_section || '-'}</td>
            <td>${(c.account_type || 'student').slice(0, 4).toUpperCase()}</td>
            <td>${c.joining_date || c.member_since}</td>
            <td>${c.relieving_date || '-'}</td>
            <td><span class="badge ${c.is_disabled ? 'badge-disabled' : 'badge-active'}">${c.is_disabled ? 'DISABLED' : 'ACTIVE'}</span></td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(c.wallet_balance || 0, settings.currency_symbol)}</td>
            <td>${c.allergens && c.allergens !== 'None' ? `⚠️ ${c.allergens}` : 'None'}</td>
            <td>${c.phone}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToPDF(`${settings.store_name} - Student Accounts`, html);
}

export function exportUsersToWord(users: PosUser[], settings: StoreSettings) {
  const content = `
    <h2>Canteen POS Staff & Operator Credentials List</h2>
    <table>
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Full Name</th>
          <th>Username</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created Date</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr>
            <td><b>${u.employeeId}</b></td>
            <td>${u.fullName}</td>
            <td>${u.username}</td>
            <td>${u.role.toUpperCase()}</td>
            <td><b>${u.isActive ? 'ACTIVE' : 'DISABLED'}</b></td>
            <td>${u.createdAt ? formatDateTime(u.createdAt) : '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToWord(
    `${settings.store_name} - Staff Users List`,
    `Total Staff: ${users.length} | Generated: ${new Date().toLocaleDateString()}`,
    content,
    'Staff_Users_List'
  );
}

export function exportUsersToPDF(users: PosUser[], settings: StoreSettings) {
  const html = `
    <div class="header-banner">
      <div>
        <h1 class="title">${settings.store_name}</h1>
        <div class="subtitle">Authorized Staff & Cashier Terminal Users Registry</div>
      </div>
      <div class="meta-box">
        <div><b>Total Operators:</b> ${users.length}</div>
        <div><b>Generated:</b> ${new Date().toLocaleDateString()}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Employee ID</th>
          <th>Full Name</th>
          <th>Username</th>
          <th>Role</th>
          <th>Status</th>
          <th>Created On</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr>
            <td><b>${u.employeeId}</b></td>
            <td>${u.fullName}</td>
            <td>${u.username}</td>
            <td><span class="badge" style="background: #e0f2fe; color: #0369a1;">${u.role.toUpperCase()}</span></td>
            <td><span class="badge ${u.isActive ? 'badge-active' : 'badge-disabled'}">${u.isActive ? 'ACTIVE' : 'DISABLED'}</span></td>
            <td>${u.createdAt ? formatDateTime(u.createdAt).slice(0, 10) : '-'}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;

  exportToPDF(`${settings.store_name} - Staff Users`, html);
}
