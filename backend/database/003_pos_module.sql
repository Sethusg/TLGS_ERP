-- ============================================================================
-- TLGS-ERP Non-Destructive Migration 003: Complete Point of Sale (POS) Module
-- Target RDBMS: MySQL 8.0+ (InnoDB, utf8mb4_unicode_ci)
-- Safety: Strictly additive (CREATE TABLE IF NOT EXISTS). Preserves all
--         existing ERP tables, roles, users, and records.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pos_categories (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  default_gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_cat_tenant (organization_id, school_id, campus_id),
  UNIQUE KEY uq_pos_cat_school_code (school_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_brands (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_brand_tenant (organization_id, school_id),
  UNIQUE KEY uq_pos_brand_school_code (school_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_products (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  brand_id VARCHAR(64) NULL,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  barcode VARCHAR(120) NOT NULL,
  description TEXT NULL,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  unit VARCHAR(32) NOT NULL DEFAULT 'pcs',
  opening_stock INT NOT NULL DEFAULT 0,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  image_url VARCHAR(500) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_prod_cat FOREIGN KEY (category_id) REFERENCES pos_categories(id),
  CONSTRAINT fk_pos_prod_brand FOREIGN KEY (brand_id) REFERENCES pos_brands(id) ON DELETE SET NULL,
  UNIQUE KEY uq_pos_prod_school_barcode (school_id, barcode),
  UNIQUE KEY uq_pos_prod_school_sku (school_id, sku),
  INDEX idx_pos_prod_tenant (organization_id, school_id, campus_id),
  INDEX idx_pos_prod_low_stock (school_id, current_stock, min_stock_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_barcodes (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  barcode VARCHAR(120) NOT NULL,
  format ENUM('CODE128', 'EAN13', 'QR') NOT NULL DEFAULT 'CODE128',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_bc_product FOREIGN KEY (product_id) REFERENCES pos_products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pos_bc_school_code (school_id, barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_customers (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(180) NULL,
  address TEXT NULL,
  gstin VARCHAR(32) NULL,
  credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_cust_tenant (organization_id, school_id, phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_suppliers (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  name VARCHAR(180) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(180) NULL,
  address TEXT NULL,
  gstin VARCHAR(32) NULL,
  payment_terms VARCHAR(120) NOT NULL DEFAULT 'Net 15 Days',
  outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_sup_tenant (organization_id, school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_counters (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(40) NOT NULL,
  location VARCHAR(160) NULL,
  assigned_cashier_ids JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_counter_code (school_id, campus_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_cash_registers (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  counter_id VARCHAR(64) NOT NULL,
  register_no VARCHAR(64) NOT NULL,
  cashier_id VARCHAR(64) NOT NULL,
  cashier_name VARCHAR(160) NOT NULL,
  opening_time DATETIME NOT NULL,
  closing_time DATETIME NULL,
  opening_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cash_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cash_expenses DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  cash_refunds DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  expected_cash DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  actual_cash DECIMAL(12,2) NULL,
  cash_difference DECIMAL(12,2) NULL,
  status ENUM('Open', 'Closed', 'Approved') NOT NULL DEFAULT 'Open',
  closed_by VARCHAR(64) NULL,
  approved_by VARCHAR(64) NULL,
  approved_at DATETIME NULL,
  notes TEXT NULL,
  CONSTRAINT fk_pos_reg_counter FOREIGN KEY (counter_id) REFERENCES pos_counters(id),
  INDEX idx_pos_reg_tenant (school_id, campus_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_cash_register_transactions (
  id VARCHAR(64) PRIMARY KEY,
  register_id VARCHAR(64) NOT NULL,
  type ENUM('OPENING','CASH_SALE','CASH_EXPENSE','CASH_REFUND','CASH_IN','CASH_OUT','CLOSING') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  reference_no VARCHAR(80) NULL,
  notes TEXT NULL,
  recorded_by VARCHAR(120) NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_reg_tx_reg FOREIGN KEY (register_id) REFERENCES pos_cash_registers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_discounts (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('PERCENTAGE', 'FIXED') NOT NULL DEFAULT 'PERCENTAGE',
  value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  min_bill_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  max_discount_amount DECIMAL(12,2) NULL,
  valid_from DATE NULL,
  valid_to DATE NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_disc_school_code (school_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_sales (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  counter_id VARCHAR(64) NULL,
  register_id VARCHAR(64) NULL,
  invoice_no VARCHAR(80) NOT NULL,
  sale_date DATETIME NOT NULL,
  status ENUM('Completed','Held','Draft','Cancelled','Partially Returned','Returned') NOT NULL DEFAULT 'Completed',
  customer_id VARCHAR(64) NULL,
  customer_name VARCHAR(180) NOT NULL DEFAULT 'Walk-in Customer',
  cashier_id VARCHAR(64) NOT NULL,
  cashier_name VARCHAR(160) NOT NULL,
  tax_mode ENUM('INTRA_STATE','INTER_STATE') NOT NULL DEFAULT 'INTRA_STATE',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  item_discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  bill_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_code VARCHAR(60) NULL,
  cgst_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sgst_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  igst_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  additional_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_received DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  change_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('Cash','UPI','Card','Bank Transfer','Credit','Split') NOT NULL DEFAULT 'Cash',
  accounting_posted TINYINT(1) NOT NULL DEFAULT 0,
  cancelled_by VARCHAR(64) NULL,
  cancelled_at DATETIME NULL,
  cancel_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_sale_invoice (school_id, invoice_no),
  INDEX idx_pos_sale_tenant_date (organization_id, school_id, campus_id, sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_sale_items (
  id VARCHAR(64) PRIMARY KEY,
  sale_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  barcode VARCHAR(120) NOT NULL,
  quantity INT NOT NULL,
  returned_qty INT NOT NULL DEFAULT 0,
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_pos_si_sale FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_pos_si_product FOREIGN KEY (product_id) REFERENCES pos_products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_payments (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  reference_type ENUM('SALE','PURCHASE','RETURN','CUSTOMER_DUES','SUPPLIER_PAYMENT') NOT NULL,
  reference_id VARCHAR(64) NOT NULL,
  reference_no VARCHAR(80) NOT NULL,
  party_name VARCHAR(180) NOT NULL,
  method ENUM('Cash','UPI','Card','Bank Transfer','Credit') NOT NULL,
  direction ENUM('IN','OUT') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_ref VARCHAR(120) NULL,
  recorded_by VARCHAR(120) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_pay_tenant (school_id, campus_id, payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_sale_returns (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  return_no VARCHAR(80) NOT NULL,
  sale_id VARCHAR(64) NOT NULL,
  original_invoice_no VARCHAR(80) NOT NULL,
  customer_id VARCHAR(64) NULL,
  customer_name VARCHAR(180) NOT NULL,
  return_date DATETIME NOT NULL,
  total_refund_amount DECIMAL(12,2) NOT NULL,
  refund_method ENUM('Cash','UPI','Card','Bank Transfer','Credit Note') NOT NULL DEFAULT 'Cash',
  reason TEXT NOT NULL,
  status ENUM('Pending Approval','Approved','Rejected') NOT NULL DEFAULT 'Pending Approval',
  requested_by VARCHAR(120) NOT NULL,
  approved_by VARCHAR(120) NULL,
  approved_at DATETIME NULL,
  accounting_posted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_ret_sale FOREIGN KEY (sale_id) REFERENCES pos_sales(id),
  UNIQUE KEY uq_pos_return_no (school_id, return_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_purchases (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  purchase_no VARCHAR(80) NOT NULL,
  supplier_id VARCHAR(64) NOT NULL,
  supplier_name VARCHAR(180) NOT NULL,
  supplier_invoice_no VARCHAR(80) NOT NULL,
  purchase_date DATE NOT NULL,
  purchase_type ENUM('Cash','Credit') NOT NULL DEFAULT 'Cash',
  payment_status ENUM('Paid','Partial','Unpaid','Returned') NOT NULL DEFAULT 'Paid',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  recorded_by VARCHAR(120) NOT NULL,
  accounting_posted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_pur_supplier FOREIGN KEY (supplier_id) REFERENCES pos_suppliers(id),
  UNIQUE KEY uq_pos_purchase_no (school_id, purchase_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_purchase_items (
  id VARCHAR(64) PRIMARY KEY,
  purchase_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  quantity INT NOT NULL,
  returned_qty INT NOT NULL DEFAULT 0,
  purchase_rate DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_pos_pi_purchase FOREIGN KEY (purchase_id) REFERENCES pos_purchases(id) ON DELETE CASCADE,
  CONSTRAINT fk_pos_pi_product FOREIGN KEY (product_id) REFERENCES pos_products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_stock_movements (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  movement_type ENUM('OPENING','SALE_OUT','SALE_CANCEL_IN','RETURN_IN','PURCHASE_IN','PURCHASE_RETURN_OUT','STOCK_IN','STOCK_OUT','ADJUSTMENT','TRANSFER_OUT','TRANSFER_IN','DAMAGED','EXPIRED') NOT NULL,
  quantity_change INT NOT NULL,
  previous_stock INT NOT NULL,
  new_stock INT NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valuation_delta DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  reference_type VARCHAR(50) NULL,
  reference_no VARCHAR(80) NULL,
  reason TEXT NULL,
  recorded_by VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_sm_product FOREIGN KEY (product_id) REFERENCES pos_products(id),
  INDEX idx_pos_sm_tenant_prod (school_id, campus_id, product_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_inventory_transfers (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  transfer_no VARCHAR(80) NOT NULL,
  from_school_id VARCHAR(64) NOT NULL,
  from_campus_id VARCHAR(64) NOT NULL,
  to_school_id VARCHAR(64) NOT NULL,
  to_campus_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  quantity INT NOT NULL,
  status ENUM('Completed','Cancelled') NOT NULL DEFAULT 'Completed',
  notes TEXT NULL,
  transferred_by VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pos_trf_product FOREIGN KEY (product_id) REFERENCES pos_products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_expenses (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NOT NULL,
  expense_no VARCHAR(80) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method ENUM('Cash','UPI','Card','Bank Transfer') NOT NULL DEFAULT 'Cash',
  register_id VARCHAR(64) NULL,
  recorded_by VARCHAR(120) NOT NULL,
  accounting_posted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pos_exp_tenant (school_id, campus_id, expense_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_settings (
  id VARCHAR(64) PRIMARY KEY,
  organization_id VARCHAR(64) NOT NULL,
  school_id VARCHAR(64) NOT NULL,
  campus_id VARCHAR(64) NULL,
  business_name VARCHAR(200) NOT NULL DEFAULT '',
  business_address TEXT NULL,
  business_phone VARCHAR(40) NULL,
  business_email VARCHAR(180) NULL,
  gstin VARCHAR(32) NULL,
  invoice_prefix VARCHAR(24) NOT NULL DEFAULT 'POS',
  default_tax_mode ENUM('INTRA_STATE','INTER_STATE') NOT NULL DEFAULT 'INTRA_STATE',
  tax_rates JSON NOT NULL,
  default_invoice_format ENUM('58mm','80mm','A4') NOT NULL DEFAULT '80mm',
  allow_negative_stock_override TINYINT(1) NOT NULL DEFAULT 0,
  allow_credit_sales TINYINT(1) NOT NULL DEFAULT 1,
  require_return_approval TINYINT(1) NOT NULL DEFAULT 1,
  auto_post_to_accounting TINYINT(1) NOT NULL DEFAULT 1,
  invoice_footer_note VARCHAR(300) NULL,
  currency_symbol VARCHAR(8) NOT NULL DEFAULT '₹',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_settings_school (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pos_role_permissions (
  id VARCHAR(64) PRIMARY KEY,
  role_name VARCHAR(120) NOT NULL,
  permissions_json JSON NOT NULL,
  updated_by VARCHAR(120) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pos_role_perm_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
