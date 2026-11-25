import express, { NextFunction, Request, Response, Router } from 'express';

export interface PosRouterContext {
  getDb: () => any;
  persist: () => void;
  requireAuth: (req: any, res: Response, next: NextFunction) => void;
  isSchoolAuthorized: (schoolId: string | undefined, session: any) => boolean;
  filterTenant: <T extends Record<string, any>>(items: T[], session: any) => T[];
}

export type PosPermKey =
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

const POS_ALL_TRUE: Record<PosPermKey, boolean> = {
  viewDashboard: true,
  createSales: true,
  editSales: true,
  cancelSales: true,
  processReturns: true,
  manageProducts: true,
  manageCategories: true,
  manageBarcodes: true,
  managePurchases: true,
  manageSuppliers: true,
  manageCustomers: true,
  manageInventory: true,
  manageDiscounts: true,
  managePayments: true,
  manageCashRegister: true,
  approveCashRegister: true,
  viewReports: true,
  exportReports: true,
  manageSettings: true,
};

const POS_ALL_FALSE: Record<PosPermKey, boolean> = {
  viewDashboard: false,
  createSales: false,
  editSales: false,
  cancelSales: false,
  processReturns: false,
  manageProducts: false,
  manageCategories: false,
  manageBarcodes: false,
  managePurchases: false,
  manageSuppliers: false,
  manageCustomers: false,
  manageInventory: false,
  manageDiscounts: false,
  managePayments: false,
  manageCashRegister: false,
  approveCashRegister: false,
  viewReports: false,
  exportReports: false,
  manageSettings: false,
};

export const DEFAULT_SERVER_POS_PERMISSIONS: Record<string, Record<PosPermKey, boolean>> = {
  'Super Administrator': { ...POS_ALL_TRUE },
  'Organization Administrator': { ...POS_ALL_TRUE },
  'School Administrator': { ...POS_ALL_TRUE },
  'Campus Administrator': { ...POS_ALL_TRUE, manageSettings: false },
  'POS Administrator': { ...POS_ALL_TRUE },
  'POS Manager': { ...POS_ALL_TRUE, manageSettings: false },
  'POS Cashier': {
    ...POS_ALL_FALSE,
    viewDashboard: true,
    createSales: true,
    editSales: true,
    manageCustomers: true,
    managePayments: true,
    manageCashRegister: true,
  },
  'POS Inventory Manager': {
    ...POS_ALL_FALSE,
    viewDashboard: true,
    manageProducts: true,
    manageCategories: true,
    manageBarcodes: true,
    managePurchases: true,
    manageSuppliers: true,
    manageInventory: true,
    viewReports: true,
    exportReports: true,
  },
  'POS Accountant': {
    ...POS_ALL_FALSE,
    viewDashboard: true,
    managePayments: true,
    manageCashRegister: true,
    approveCashRegister: true,
    viewReports: true,
    exportReports: true,
  },
  Accountant: {
    ...POS_ALL_FALSE,
    viewDashboard: true,
    managePayments: true,
    approveCashRegister: true,
    viewReports: true,
    exportReports: true,
  },
  'Inventory Manager': {
    ...POS_ALL_FALSE,
    viewDashboard: true,
    manageProducts: true,
    manageCategories: true,
    manageBarcodes: true,
    managePurchases: true,
    manageSuppliers: true,
    manageInventory: true,
    viewReports: true,
  },
};

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function defaultPosSettings(orgId: string, schoolId: string, campusId: string) {
  return {
    id: `pos-set-${schoolId || 'default'}`,
    organizationId: orgId || 'all',
    schoolId: schoolId || 'all',
    campusId: campusId || 'all',
    businessName: 'Campus Retail & POS Store',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    gstin: '',
    invoicePrefix: 'POS',
    defaultTaxMode: 'INTRA_STATE' as const,
    taxRates: [0, 5, 12, 18, 28],
    defaultInvoiceFormat: '80mm' as const,
    allowNegativeStockOverride: false,
    allowCreditSales: true,
    requireReturnApproval: true,
    autoPostToAccounting: true,
    invoiceFooterNote: 'Thank you for your purchase. Goods once sold are subject to school store return policy.',
    currencySymbol: '₹',
    updatedAt: new Date().toISOString(),
  };
}

export function ensurePosStoreCollections(db: any) {
  if (!Array.isArray(db.posCategories)) db.posCategories = [];
  if (!Array.isArray(db.posBrands)) db.posBrands = [];
  if (!Array.isArray(db.posProducts)) db.posProducts = [];
  if (!Array.isArray(db.posBarcodes)) db.posBarcodes = [];
  if (!Array.isArray(db.posCustomers)) db.posCustomers = [];
  if (!Array.isArray(db.posSuppliers)) db.posSuppliers = [];
  if (!Array.isArray(db.posSales)) db.posSales = [];
  if (!Array.isArray(db.posPayments)) db.posPayments = [];
  if (!Array.isArray(db.posReturns)) db.posReturns = [];
  if (!Array.isArray(db.posPurchases)) db.posPurchases = [];
  if (!Array.isArray(db.posInventory)) db.posInventory = [];
  if (!Array.isArray(db.posTransfers)) db.posTransfers = [];
  if (!Array.isArray(db.posCounters)) db.posCounters = [];
  if (!Array.isArray(db.posRegisters)) db.posRegisters = [];
  if (!Array.isArray(db.posExpenses)) db.posExpenses = [];
  if (!Array.isArray(db.posDiscounts)) db.posDiscounts = [];
  if (!Array.isArray(db.posSettings)) db.posSettings = [];
  if (!Array.isArray(db.posAccountingPostings)) db.posAccountingPostings = [];
  if (!db.posPermissions || typeof db.posPermissions !== 'object') {
    db.posPermissions = JSON.parse(JSON.stringify(DEFAULT_SERVER_POS_PERMISSIONS));
  }
}

export function createPosRouter(ctx: PosRouterContext): Router {
  const router = express.Router();

  const resolveRolePermissions = (role: string): Record<PosPermKey, boolean> => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    if (role === 'Super Administrator') return { ...POS_ALL_TRUE };
    return (
      db.posPermissions?.[role] ||
      DEFAULT_SERVER_POS_PERMISSIONS[role] || { ...POS_ALL_FALSE }
    );
  };

  const requirePosPerm = (perm: PosPermKey) => {
    return (req: any, res: Response, next: NextFunction) => {
      const session = req.erpSession;
      if (!session) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
      }
      const perms = resolveRolePermissions(session.role);
      if (!perms[perm]) {
        res.status(403).json({
          error: `Permission denied: your role (${session.role}) does not have "${perm}" POS authorization.`,
        });
        return;
      }
      next();
    };
  };

  const resolveTenant = (req: any, body: any) => {
    const session = req.erpSession!;
    const reqSchool =
      body?.schoolId || (typeof req.query.schoolId === 'string' ? req.query.schoolId : '');
    const reqCampus =
      body?.campusId || (typeof req.query.campusId === 'string' ? req.query.campusId : '');
    const reqOrg =
      body?.organizationId ||
      (typeof req.query.organizationId === 'string' ? req.query.organizationId : '');

    const schoolId =
      reqSchool && reqSchool !== 'all'
        ? String(reqSchool)
        : session.schoolId && session.schoolId !== 'all'
        ? session.schoolId
        : 'all';

    if (schoolId !== 'all' && !ctx.isSchoolAuthorized(schoolId, session)) {
      return { error: 'You are not authorized to access or modify POS records for this school.' };
    }

    const campusId =
      reqCampus && reqCampus !== 'all'
        ? String(reqCampus)
        : session.campusId && session.campusId !== 'all'
        ? session.campusId
        : 'all';

    if (
      session.role !== 'Super Administrator' &&
      session.campusIds &&
      session.campusIds.length > 0 &&
      campusId !== 'all' &&
      !session.campusIds.includes(campusId)
    ) {
      return { error: 'You are not authorized to access POS records for this campus.' };
    }

    const organizationId =
      reqOrg && reqOrg !== 'all'
        ? String(reqOrg)
        : session.organizationId || 'all';

    return { organizationId, schoolId, campusId };
  };

  const filterByQueryTenant = <T extends Record<string, any>>(
    items: T[],
    session: any,
    req: Request
  ): T[] => {
    let scoped = ctx.filterTenant(items, session);
    const qSchool = typeof req.query.schoolId === 'string' ? req.query.schoolId : '';
    const qCampus = typeof req.query.campusId === 'string' ? req.query.campusId : '';
    if (qSchool && qSchool !== 'all') {
      scoped = scoped.filter((i) => !i.schoolId || i.schoolId === 'all' || i.schoolId === qSchool);
    }
    if (qCampus && qCampus !== 'all') {
      scoped = scoped.filter((i) => !i.campusId || i.campusId === 'all' || i.campusId === qCampus);
    }
    return scoped;
  };

  const getActiveSettings = (db: any, schoolId: string, orgId: string, campusId: string) => {
    const found =
      db.posSettings.find((s: any) => s.schoolId === schoolId) ||
      db.posSettings.find((s: any) => s.schoolId === 'all');
    return found || defaultPosSettings(orgId, schoolId, campusId);
  };

  const appendAudit = (
    db: any,
    session: any,
    schoolId: string,
    campusId: string,
    actionType: string,
    referenceID: string,
    remarks: string
  ) => {
    db.auditLogs.unshift({
      id: `aud-pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId,
      campusId,
      userID: session.username,
      userName: session.username,
      role: session.role,
      timestamp: new Date().toISOString(),
      actionType,
      referenceID,
      remarks,
    });
  };

  const postAccountingIdempotent = (
    db: any,
    entry: {
      sourceId: string;
      sourceType: 'POS_SALE' | 'POS_RETURN' | 'POS_PURCHASE' | 'POS_EXPENSE';
      schoolId: string;
      campusId: string;
      date: string;
      category: string;
      description: string;
      referenceNo: string;
      amount: number;
      direction: 'CREDIT' | 'DEBIT';
    }
  ): boolean => {
    if (db.posAccountingPostings.some((p: any) => p.sourceId === entry.sourceId)) {
      return false; // Prevent duplicate financial postings
    }
    db.posAccountingPostings.unshift({
      id: `pos-acc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...entry,
      postedAt: new Date().toISOString(),
    });
    if (entry.direction === 'DEBIT') {
      db.expenses.unshift({
        id: `exp-pos-${entry.sourceId}`,
        date: entry.date.slice(0, 10),
        category: entry.category,
        description: entry.description,
        referenceNo: entry.referenceNo,
        amount: round2(entry.amount),
        status: 'Approved',
        schoolId: entry.schoolId,
        campusId: entry.campusId,
      });
    }
    return true;
  };

  const recordStockMovement = (
    db: any,
    product: any,
    quantityChange: number,
    movementType: string,
    recordedBy: string,
    allowNegative: boolean,
    referenceType: string,
    referenceNo: string,
    reason: string
  ) => {
    const prevStock = Number(product.currentStock || 0);
    const nextStock = prevStock + quantityChange;
    if (nextStock < 0 && !allowNegative) {
      throw new Error(
        `Insufficient stock for "${product.name}" (Available: ${prevStock}, Requested: ${Math.abs(quantityChange)}).`
      );
    }
    product.currentStock = nextStock;
    product.updatedAt = new Date().toISOString();
    const unitCost = Number(product.purchasePrice || 0);
    const movement = {
      id: `pmov-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      organizationId: product.organizationId || 'all',
      schoolId: product.schoolId || 'all',
      campusId: product.campusId || 'all',
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      movementType,
      quantityChange,
      previousStock: prevStock,
      newStock: nextStock,
      unitCost,
      valuationDelta: round2(unitCost * quantityChange),
      referenceType,
      referenceNo,
      reason,
      recordedBy,
      createdAt: new Date().toISOString(),
    };
    db.posInventory.unshift(movement);
    return movement;
  };

  // ---------------------------------------------------------------------------
  // POS Permissions Matrix Endpoints (Integrated with Role Management)
  // ---------------------------------------------------------------------------
  router.get('/permissions', ctx.requireAuth, (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    res.json({
      matrix: db.posPermissions,
      currentRolePermissions: resolveRolePermissions(req.erpSession!.role),
    });
  });

  router.put('/permissions', ctx.requireAuth, (req: any, res) => {
    const session = req.erpSession!;
    if (
      session.role !== 'Super Administrator' &&
      session.role !== 'Organization Administrator' &&
      session.role !== 'POS Administrator'
    ) {
      res.status(403).json({
        error: 'Only Super Admin, Organization Admin, or POS Administrator can modify POS permissions.',
      });
      return;
    }
    const { role, permissions } = req.body || {};
    if (typeof role !== 'string' || !role.trim() || !permissions || typeof permissions !== 'object') {
      res.status(400).json({ error: 'Valid role name and permissions object are required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const base = resolveRolePermissions(role);
    const updated: Record<string, boolean> = { ...base };
    Object.keys(POS_ALL_TRUE).forEach((k) => {
      if (typeof permissions[k] === 'boolean') {
        updated[k] = permissions[k];
      }
    });
    db.posPermissions[role] = updated;
    appendAudit(
      db,
      session,
      session.schoolId || 'all',
      session.campusId || 'all',
      'ROLE_PERMISSION',
      role,
      `Updated granular POS permissions for role "${role}".`
    );
    ctx.persist();
    res.json({ role, permissions: updated, matrix: db.posPermissions });
  });

  // ---------------------------------------------------------------------------
  // Bootstrap Full Tenant-Scoped POS State
  // ---------------------------------------------------------------------------
  router.get('/bootstrap', ctx.requireAuth, (req: any, res) => {
    const session = req.erpSession!;
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const perms = resolveRolePermissions(session.role);
    const hasAnyPosAccess = Object.values(perms).some(Boolean);
    if (!hasAnyPosAccess) {
      res.status(403).json({ error: 'Your role does not have POS module access.' });
      return;
    }

    const qSchool = typeof req.query.schoolId === 'string' ? req.query.schoolId : session.schoolId || 'all';
    const qCampus = typeof req.query.campusId === 'string' ? req.query.campusId : session.campusId || 'all';
    if (qSchool !== 'all' && !ctx.isSchoolAuthorized(qSchool, session)) {
      res.status(403).json({ error: 'Unauthorized school filter requested.' });
      return;
    }

    let counters = filterByQueryTenant(db.posCounters, session, req);
    if (session.role === 'POS Cashier') {
      const assigned = counters.filter(
        (c: any) =>
          !Array.isArray(c.assignedCashierIds) ||
          c.assignedCashierIds.length === 0 ||
          c.assignedCashierIds.includes(session.sub) ||
          c.assignedCashierIds.includes(session.username)
      );
      counters = assigned;
    }

    const settings = getActiveSettings(db, qSchool, session.organizationId || 'all', qCampus);

    res.json({
      categories: filterByQueryTenant(db.posCategories, session, req),
      brands: filterByQueryTenant(db.posBrands, session, req),
      products: filterByQueryTenant(db.posProducts, session, req),
      barcodes: filterByQueryTenant(db.posBarcodes, session, req),
      customers: filterByQueryTenant(db.posCustomers, session, req),
      suppliers: filterByQueryTenant(db.posSuppliers, session, req),
      sales: filterByQueryTenant(db.posSales, session, req),
      payments: filterByQueryTenant(db.posPayments, session, req),
      returns: filterByQueryTenant(db.posReturns, session, req),
      purchases: filterByQueryTenant(db.posPurchases, session, req),
      stockMovements: filterByQueryTenant(db.posInventory, session, req),
      transfers: filterByQueryTenant(db.posTransfers, session, req),
      counters,
      registers: filterByQueryTenant(db.posRegisters, session, req),
      expenses: filterByQueryTenant(db.posExpenses, session, req),
      discounts: filterByQueryTenant(db.posDiscounts, session, req),
      settings,
      permissions: perms,
    });
  });

  // ---------------------------------------------------------------------------
  // Categories CRUD
  // ---------------------------------------------------------------------------
  router.post('/categories', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const { name, code, description, defaultGstRate, isActive } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const finalCode =
      (typeof code === 'string' && code.trim().toUpperCase()) ||
      `CAT-${Math.floor(1000 + Math.random() * 9000)}`;
    if (
      db.posCategories.some(
        (c: any) => c.schoolId === tenant.schoolId && c.code.toLowerCase() === finalCode.toLowerCase()
      )
    ) {
      res.status(409).json({ error: `Category code "${finalCode}" already exists.` });
      return;
    }
    const record = {
      id: `pcat-${Date.now()}`,
      ...tenant,
      name: name.trim(),
      code: finalCode,
      description: typeof description === 'string' ? description.trim() : '',
      defaultGstRate: Number(defaultGstRate) || 0,
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };
    db.posCategories.unshift(record);
    ctx.persist();
    res.status(201).json(record);
  });

  router.put('/categories/:id', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posCategories.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    if (!ctx.isSchoolAuthorized(db.posCategories[idx].schoolId, req.erpSession)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }
    db.posCategories[idx] = {
      ...db.posCategories[idx],
      name: req.body.name?.trim() || db.posCategories[idx].name,
      code: req.body.code?.trim().toUpperCase() || db.posCategories[idx].code,
      description: req.body.description ?? db.posCategories[idx].description,
      defaultGstRate:
        req.body.defaultGstRate !== undefined
          ? Number(req.body.defaultGstRate)
          : db.posCategories[idx].defaultGstRate,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : db.posCategories[idx].isActive,
    };
    ctx.persist();
    res.json(db.posCategories[idx]);
  });

  router.delete('/categories/:id', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const existing = db.posCategories.find((c: any) => c.id === req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    if (!ctx.isSchoolAuthorized(existing.schoolId, req.erpSession)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }
    db.posCategories = db.posCategories.filter((c: any) => c.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Brands CRUD
  // ---------------------------------------------------------------------------
  router.post('/brands', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const { name, code, description, isActive } = req.body || {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Brand name is required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const finalCode =
      (typeof code === 'string' && code.trim().toUpperCase()) ||
      `BRD-${Math.floor(1000 + Math.random() * 9000)}`;
    const record = {
      id: `pbrd-${Date.now()}`,
      ...tenant,
      name: name.trim(),
      code: finalCode,
      description: typeof description === 'string' ? description.trim() : '',
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
    };
    db.posBrands.unshift(record);
    ctx.persist();
    res.status(201).json(record);
  });

  router.put('/brands/:id', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posBrands.findIndex((b: any) => b.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Brand not found.' });
      return;
    }
    db.posBrands[idx] = {
      ...db.posBrands[idx],
      name: req.body.name?.trim() || db.posBrands[idx].name,
      code: req.body.code?.trim().toUpperCase() || db.posBrands[idx].code,
      description: req.body.description ?? db.posBrands[idx].description,
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : db.posBrands[idx].isActive,
    };
    ctx.persist();
    res.json(db.posBrands[idx]);
  });

  router.delete('/brands/:id', ctx.requireAuth, requirePosPerm('manageCategories'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    db.posBrands = db.posBrands.filter((b: any) => b.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Products CRUD, Bulk Import & Barcode Lookup
  // ---------------------------------------------------------------------------
  router.get('/barcodes/lookup', ctx.requireAuth, (req: any, res) => {
    const code = typeof req.query.code === 'string' ? req.query.code.trim().toLowerCase() : '';
    if (!code) {
      res.status(400).json({ error: 'Barcode or SKU query is required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const scoped = filterByQueryTenant(db.posProducts, req.erpSession, req);
    const found = scoped.find(
      (p: any) =>
        p.isActive &&
        (String(p.barcode || '').toLowerCase() === code ||
          String(p.sku || '').toLowerCase() === code)
    );
    if (!found) {
      res.status(404).json({ error: `No active product found for barcode/SKU "${req.query.code}".` });
      return;
    }
    res.json({ product: found });
  });

  router.post('/products', ctx.requireAuth, requirePosPerm('manageProducts'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    if (typeof b.name !== 'string' || !b.name.trim()) {
      res.status(400).json({ error: 'Product name is required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);

    const sku =
      (typeof b.sku === 'string' && b.sku.trim().toUpperCase()) ||
      `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    const barcode =
      (typeof b.barcode === 'string' && b.barcode.trim()) ||
      `890${Math.floor(1000000000 + Math.random() * 8999999999)}`;

    // Duplicate barcode & SKU validation
    if (
      db.posProducts.some(
        (p: any) =>
          p.schoolId === tenant.schoolId &&
          String(p.barcode).toLowerCase() === barcode.toLowerCase()
      )
    ) {
      res.status(409).json({
        error: `Duplicate barcode "${barcode}". Each product must have a unique barcode within the school.`,
      });
      return;
    }
    if (
      db.posProducts.some(
        (p: any) =>
          p.schoolId === tenant.schoolId &&
          String(p.sku).toLowerCase() === sku.toLowerCase()
      )
    ) {
      res.status(409).json({ error: `Duplicate SKU "${sku}".` });
      return;
    }

    const cat = db.posCategories.find((c: any) => c.id === b.categoryId);
    const brand = db.posBrands.find((br: any) => br.id === b.brandId);
    const openingStock = Math.max(0, Math.floor(Number(b.openingStock) || 0));
    const nowIso = new Date().toISOString();

    const product = {
      id: `pprod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...tenant,
      name: b.name.trim(),
      sku,
      barcode,
      categoryId: b.categoryId || '',
      categoryName: cat?.name || b.categoryName || 'General',
      brandId: b.brandId || '',
      brandName: brand?.name || b.brandName || '',
      description: typeof b.description === 'string' ? b.description.trim() : '',
      purchasePrice: Math.max(0, round2(Number(b.purchasePrice) || 0)),
      sellingPrice: Math.max(0, round2(Number(b.sellingPrice) || 0)),
      gstRate: Math.max(0, Number(b.gstRate) || 0),
      unit: typeof b.unit === 'string' && b.unit.trim() ? b.unit.trim() : 'pcs',
      openingStock,
      currentStock: 0,
      minStockLevel: Math.max(0, Math.floor(Number(b.minStockLevel) || 5)),
      imageUrl: typeof b.imageUrl === 'string' ? b.imageUrl.trim() : '',
      isActive: b.isActive !== false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.posProducts.unshift(product);
    db.posBarcodes.unshift({
      id: `pbc-${Date.now()}`,
      ...tenant,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: product.barcode,
      format: 'CODE128',
      sellingPrice: product.sellingPrice,
      createdAt: nowIso,
    });

    if (openingStock > 0) {
      recordStockMovement(
        db,
        product,
        openingStock,
        'OPENING',
        req.erpSession!.username,
        true,
        'PRODUCT_CREATE',
        product.sku,
        'Opening stock recorded during product creation'
      );
    }

    ctx.persist();
    res.status(201).json(product);
  });

  router.post('/products/bulk', ctx.requireAuth, requirePosPerm('manageProducts'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (rows.length === 0) {
      res.status(400).json({ error: 'No product rows provided for bulk import.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    let created = 0;
    const skipped: string[] = [];

    for (const row of rows) {
      const name = String(row.name || '').trim();
      if (!name) continue;
      const sku =
        String(row.sku || '').trim().toUpperCase() ||
        `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
      const barcode =
        String(row.barcode || '').trim() ||
        `890${Math.floor(1000000000 + Math.random() * 8999999999)}`;

      const dup = db.posProducts.some(
        (p: any) =>
          p.schoolId === tenant.schoolId &&
          (String(p.barcode).toLowerCase() === barcode.toLowerCase() ||
            String(p.sku).toLowerCase() === sku.toLowerCase())
      );
      if (dup) {
        skipped.push(`${name} (${sku}/${barcode})`);
        continue;
      }

      const nowIso = new Date().toISOString();
      const openingStock = Math.max(0, Math.floor(Number(row.openingStock) || 0));
      const prod = {
        id: `pprod-${Date.now()}-${created}-${Math.floor(Math.random() * 1000)}`,
        ...tenant,
        name,
        sku,
        barcode,
        categoryId: row.categoryId || '',
        categoryName: String(row.categoryName || 'General'),
        brandId: row.brandId || '',
        brandName: String(row.brandName || ''),
        description: String(row.description || ''),
        purchasePrice: Math.max(0, round2(Number(row.purchasePrice) || 0)),
        sellingPrice: Math.max(0, round2(Number(row.sellingPrice) || 0)),
        gstRate: Math.max(0, Number(row.gstRate) || 0),
        unit: String(row.unit || 'pcs'),
        openingStock,
        currentStock: 0,
        minStockLevel: Math.max(0, Math.floor(Number(row.minStockLevel) || 5)),
        imageUrl: '',
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.posProducts.unshift(prod);
      db.posBarcodes.unshift({
        id: `pbc-${Date.now()}-${created}`,
        ...tenant,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        barcode: prod.barcode,
        format: 'CODE128',
        sellingPrice: prod.sellingPrice,
        createdAt: nowIso,
      });
      if (openingStock > 0) {
        recordStockMovement(
          db,
          prod,
          openingStock,
          'OPENING',
          req.erpSession!.username,
          true,
          'BULK_IMPORT',
          prod.sku,
          'Opening stock from bulk import'
        );
      }
      created += 1;
    }

    ctx.persist();
    res.status(201).json({ created, skipped });
  });

  router.put('/products/:id', ctx.requireAuth, requirePosPerm('manageProducts'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posProducts.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const current = db.posProducts[idx];
    if (!ctx.isSchoolAuthorized(current.schoolId, req.erpSession)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }
    const b = req.body || {};
    const nextBarcode = typeof b.barcode === 'string' && b.barcode.trim() ? b.barcode.trim() : current.barcode;
    const nextSku = typeof b.sku === 'string' && b.sku.trim() ? b.sku.trim().toUpperCase() : current.sku;

    if (
      nextBarcode.toLowerCase() !== current.barcode.toLowerCase() &&
      db.posProducts.some(
        (p: any) =>
          p.id !== current.id &&
          p.schoolId === current.schoolId &&
          String(p.barcode).toLowerCase() === nextBarcode.toLowerCase()
      )
    ) {
      res.status(409).json({ error: `Duplicate barcode "${nextBarcode}" already assigned.` });
      return;
    }

    const cat = db.posCategories.find((c: any) => c.id === (b.categoryId ?? current.categoryId));
    const brand = db.posBrands.find((br: any) => br.id === (b.brandId ?? current.brandId));

    db.posProducts[idx] = {
      ...current,
      name: b.name?.trim() || current.name,
      sku: nextSku,
      barcode: nextBarcode,
      categoryId: b.categoryId ?? current.categoryId,
      categoryName: cat?.name || b.categoryName || current.categoryName,
      brandId: b.brandId ?? current.brandId,
      brandName: brand?.name || b.brandName || current.brandName,
      description: b.description !== undefined ? String(b.description) : current.description,
      purchasePrice: b.purchasePrice !== undefined ? Math.max(0, round2(Number(b.purchasePrice))) : current.purchasePrice,
      sellingPrice: b.sellingPrice !== undefined ? Math.max(0, round2(Number(b.sellingPrice))) : current.sellingPrice,
      gstRate: b.gstRate !== undefined ? Math.max(0, Number(b.gstRate)) : current.gstRate,
      unit: b.unit?.trim() || current.unit,
      minStockLevel: b.minStockLevel !== undefined ? Math.max(0, Math.floor(Number(b.minStockLevel))) : current.minStockLevel,
      imageUrl: b.imageUrl !== undefined ? String(b.imageUrl) : current.imageUrl,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : current.isActive,
      updatedAt: new Date().toISOString(),
    };

    // Keep barcode registry synced
    const bcIdx = db.posBarcodes.findIndex((bc: any) => bc.productId === current.id);
    if (bcIdx >= 0) {
      db.posBarcodes[bcIdx] = {
        ...db.posBarcodes[bcIdx],
        productName: db.posProducts[idx].name,
        sku: nextSku,
        barcode: nextBarcode,
        sellingPrice: db.posProducts[idx].sellingPrice,
      };
    }

    ctx.persist();
    res.json(db.posProducts[idx]);
  });

  router.delete('/products/:id', ctx.requireAuth, requirePosPerm('manageProducts'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posProducts.findIndex((p: any) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    // Archive safely instead of breaking historical sales references
    db.posProducts[idx].isActive = false;
    db.posProducts[idx].updatedAt = new Date().toISOString();
    ctx.persist();
    res.json({ success: true, archived: true });
  });

  // ---------------------------------------------------------------------------
  // Customers & Suppliers CRUD
  // ---------------------------------------------------------------------------
  router.post('/customers', ctx.requireAuth, requirePosPerm('manageCustomers'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    if (typeof b.name !== 'string' || !b.name.trim() || typeof b.phone !== 'string' || !b.phone.trim()) {
      res.status(400).json({ error: 'Customer name and mobile number are required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const customer = {
      id: `pcust-${Date.now()}`,
      ...tenant,
      name: b.name.trim(),
      phone: b.phone.trim(),
      email: typeof b.email === 'string' ? b.email.trim() : '',
      address: typeof b.address === 'string' ? b.address.trim() : '',
      gstin: typeof b.gstin === 'string' ? b.gstin.trim().toUpperCase() : '',
      creditLimit: Math.max(0, round2(Number(b.creditLimit) || 0)),
      outstandingBalance: Math.max(0, round2(Number(b.outstandingBalance) || 0)),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.posCustomers.unshift(customer);
    ctx.persist();
    res.status(201).json(customer);
  });

  router.put('/customers/:id', ctx.requireAuth, requirePosPerm('manageCustomers'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posCustomers.findIndex((c: any) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Customer not found.' });
      return;
    }
    const b = req.body || {};
    db.posCustomers[idx] = {
      ...db.posCustomers[idx],
      name: b.name?.trim() || db.posCustomers[idx].name,
      phone: b.phone?.trim() || db.posCustomers[idx].phone,
      email: b.email !== undefined ? String(b.email).trim() : db.posCustomers[idx].email,
      address: b.address !== undefined ? String(b.address).trim() : db.posCustomers[idx].address,
      gstin: b.gstin !== undefined ? String(b.gstin).trim().toUpperCase() : db.posCustomers[idx].gstin,
      creditLimit: b.creditLimit !== undefined ? Math.max(0, round2(Number(b.creditLimit))) : db.posCustomers[idx].creditLimit,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : db.posCustomers[idx].isActive,
    };
    ctx.persist();
    res.json(db.posCustomers[idx]);
  });

  router.delete('/customers/:id', ctx.requireAuth, requirePosPerm('manageCustomers'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    db.posCustomers = db.posCustomers.filter((c: any) => c.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  router.post('/suppliers', ctx.requireAuth, requirePosPerm('manageSuppliers'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    if (typeof b.name !== 'string' || !b.name.trim() || typeof b.phone !== 'string' || !b.phone.trim()) {
      res.status(400).json({ error: 'Supplier name and contact number are required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const supplier = {
      id: `psup-${Date.now()}`,
      ...tenant,
      name: b.name.trim(),
      phone: b.phone.trim(),
      email: typeof b.email === 'string' ? b.email.trim() : '',
      address: typeof b.address === 'string' ? b.address.trim() : '',
      gstin: typeof b.gstin === 'string' ? b.gstin.trim().toUpperCase() : '',
      paymentTerms: typeof b.paymentTerms === 'string' && b.paymentTerms.trim() ? b.paymentTerms.trim() : 'Net 15 Days',
      outstandingBalance: Math.max(0, round2(Number(b.outstandingBalance) || 0)),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    db.posSuppliers.unshift(supplier);
    ctx.persist();
    res.status(201).json(supplier);
  });

  router.put('/suppliers/:id', ctx.requireAuth, requirePosPerm('manageSuppliers'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posSuppliers.findIndex((s: any) => s.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Supplier not found.' });
      return;
    }
    const b = req.body || {};
    db.posSuppliers[idx] = {
      ...db.posSuppliers[idx],
      name: b.name?.trim() || db.posSuppliers[idx].name,
      phone: b.phone?.trim() || db.posSuppliers[idx].phone,
      email: b.email !== undefined ? String(b.email).trim() : db.posSuppliers[idx].email,
      address: b.address !== undefined ? String(b.address).trim() : db.posSuppliers[idx].address,
      gstin: b.gstin !== undefined ? String(b.gstin).trim().toUpperCase() : db.posSuppliers[idx].gstin,
      paymentTerms: b.paymentTerms?.trim() || db.posSuppliers[idx].paymentTerms,
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : db.posSuppliers[idx].isActive,
    };
    ctx.persist();
    res.json(db.posSuppliers[idx]);
  });

  router.delete('/suppliers/:id', ctx.requireAuth, requirePosPerm('manageSuppliers'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    db.posSuppliers = db.posSuppliers.filter((s: any) => s.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Discounts CRUD
  // ---------------------------------------------------------------------------
  router.post('/discounts', ctx.requireAuth, requirePosPerm('manageDiscounts'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    if (!b.code?.trim() || !b.name?.trim()) {
      res.status(400).json({ error: 'Discount code and name are required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const record = {
      id: `pdisc-${Date.now()}`,
      ...tenant,
      code: String(b.code).trim().toUpperCase(),
      name: String(b.name).trim(),
      type: b.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
      value: Math.max(0, round2(Number(b.value) || 0)),
      minBillAmount: Math.max(0, round2(Number(b.minBillAmount) || 0)),
      maxDiscountAmount: b.maxDiscountAmount ? Math.max(0, round2(Number(b.maxDiscountAmount))) : undefined,
      validFrom: b.validFrom || undefined,
      validTo: b.validTo || undefined,
      isActive: b.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    db.posDiscounts.unshift(record);
    ctx.persist();
    res.status(201).json(record);
  });

  router.put('/discounts/:id', ctx.requireAuth, requirePosPerm('manageDiscounts'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const idx = db.posDiscounts.findIndex((d: any) => d.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Discount not found.' });
      return;
    }
    db.posDiscounts[idx] = { ...db.posDiscounts[idx], ...req.body, id: req.params.id };
    ctx.persist();
    res.json(db.posDiscounts[idx]);
  });

  router.delete('/discounts/:id', ctx.requireAuth, requirePosPerm('manageDiscounts'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    db.posDiscounts = db.posDiscounts.filter((d: any) => d.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Counters & Settings
  // ---------------------------------------------------------------------------
  router.post('/counters', ctx.requireAuth, requirePosPerm('manageSettings'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    if (!b.name?.trim()) {
      res.status(400).json({ error: 'Counter name is required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const counter = {
      id: `pcnt-${Date.now()}`,
      ...tenant,
      name: String(b.name).trim(),
      code: (b.code?.trim() || `CTR-${db.posCounters.length + 1}`).toUpperCase(),
      location: String(b.location || '').trim(),
      assignedCashierIds: Array.isArray(b.assignedCashierIds) ? b.assignedCashierIds : [],
      isActive: b.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    db.posCounters.unshift(counter);
    ctx.persist();
    res.status(201).json(counter);
  });

  router.delete('/counters/:id', ctx.requireAuth, requirePosPerm('manageSettings'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    db.posCounters = db.posCounters.filter((c: any) => c.id !== req.params.id);
    ctx.persist();
    res.json({ success: true });
  });

  router.put('/settings', ctx.requireAuth, requirePosPerm('manageSettings'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const existingIdx = db.posSettings.findIndex((s: any) => s.schoolId === tenant.schoolId);
    const base =
      existingIdx >= 0
        ? db.posSettings[existingIdx]
        : defaultPosSettings(tenant.organizationId, tenant.schoolId, tenant.campusId);

    const b = req.body || {};
    const updated = {
      ...base,
      ...tenant,
      businessName: typeof b.businessName === 'string' ? b.businessName.trim() : base.businessName,
      businessAddress: typeof b.businessAddress === 'string' ? b.businessAddress.trim() : base.businessAddress,
      businessPhone: typeof b.businessPhone === 'string' ? b.businessPhone.trim() : base.businessPhone,
      businessEmail: typeof b.businessEmail === 'string' ? b.businessEmail.trim() : base.businessEmail,
      gstin: typeof b.gstin === 'string' ? b.gstin.trim().toUpperCase() : base.gstin,
      invoicePrefix: typeof b.invoicePrefix === 'string' && b.invoicePrefix.trim() ? b.invoicePrefix.trim().toUpperCase() : base.invoicePrefix,
      defaultTaxMode: b.defaultTaxMode === 'INTER_STATE' ? 'INTER_STATE' : 'INTRA_STATE',
      taxRates: Array.isArray(b.taxRates)
        ? b.taxRates.map((r: any) => Number(r)).filter((r: number) => !Number.isNaN(r) && r >= 0 && r <= 100)
        : base.taxRates,
      defaultInvoiceFormat:
        b.defaultInvoiceFormat === '58mm' || b.defaultInvoiceFormat === 'A4'
          ? b.defaultInvoiceFormat
          : '80mm',
      allowNegativeStockOverride:
        b.allowNegativeStockOverride !== undefined
          ? Boolean(b.allowNegativeStockOverride)
          : base.allowNegativeStockOverride,
      allowCreditSales:
        b.allowCreditSales !== undefined ? Boolean(b.allowCreditSales) : base.allowCreditSales,
      requireReturnApproval:
        b.requireReturnApproval !== undefined
          ? Boolean(b.requireReturnApproval)
          : base.requireReturnApproval,
      autoPostToAccounting:
        b.autoPostToAccounting !== undefined
          ? Boolean(b.autoPostToAccounting)
          : base.autoPostToAccounting,
      invoiceFooterNote:
        typeof b.invoiceFooterNote === 'string' ? b.invoiceFooterNote : base.invoiceFooterNote,
      currencySymbol:
        typeof b.currencySymbol === 'string' && b.currencySymbol.trim()
          ? b.currencySymbol.trim()
          : base.currencySymbol,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.posSettings[existingIdx] = updated;
    } else {
      db.posSettings.unshift(updated);
    }
    ctx.persist();
    res.json(updated);
  });

  // ---------------------------------------------------------------------------
  // Transactional Sales & Billing (Completed / Held / Draft / Cancel)
  // ---------------------------------------------------------------------------
  router.post('/sales', ctx.requireAuth, requirePosPerm('createSales'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const session = req.erpSession!;
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const b = req.body || {};

    const rawItems = Array.isArray(b.items) ? b.items : [];
    if (rawItems.length === 0) {
      res.status(400).json({ error: 'At least one product item is required to create a bill.' });
      return;
    }

    const status: 'Completed' | 'Held' | 'Draft' =
      b.status === 'Held' || b.status === 'Draft' ? b.status : 'Completed';
    const settings = getActiveSettings(db, tenant.schoolId, tenant.organizationId, tenant.campusId);
    const taxMode: 'INTRA_STATE' | 'INTER_STATE' =
      b.taxMode === 'INTER_STATE' ? 'INTER_STATE' : settings.defaultTaxMode || 'INTRA_STATE';

    const perms = resolveRolePermissions(session.role);
    const allowNeg = Boolean(settings.allowNegativeStockOverride && (perms.manageSettings || session.role === 'Super Administrator' || session.role === 'POS Manager'));

    // Pre-validate all products & stock before mutating anything (transactional atomicity)
    const computedItems: any[] = [];
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const line of rawItems) {
      const qty = Math.floor(Number(line.quantity) || 0);
      if (qty <= 0) {
        res.status(400).json({ error: 'Item quantity must be greater than zero.' });
        return;
      }
      const product = db.posProducts.find((p: any) => p.id === line.productId);
      if (!product || !product.isActive) {
        res.status(400).json({ error: `Product "${line.productName || line.productId}" is unavailable.` });
        return;
      }
      if (status === 'Completed' && Number(product.currentStock) < qty && !allowNeg) {
        res.status(400).json({
          error: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${qty}.`,
        });
        return;
      }

      const unitPrice = round2(Number(line.unitPrice ?? product.sellingPrice));
      const grossLine = round2(unitPrice * qty);
      const discPct = Math.min(100, Math.max(0, Number(line.discountPercent) || 0));
      const discAmt = round2((grossLine * discPct) / 100);
      const taxableAmount = Math.max(0, round2(grossLine - discAmt));
      const gstRate = Math.max(0, Number(product.gstRate) || 0);
      const taxAmount = round2((taxableAmount * gstRate) / 100);
      const cgst = taxMode === 'INTRA_STATE' ? round2(taxAmount / 2) : 0;
      const sgst = taxMode === 'INTRA_STATE' ? round2(taxAmount - cgst) : 0;
      const igst = taxMode === 'INTER_STATE' ? taxAmount : 0;
      const lineTotal = round2(taxableAmount + taxAmount);

      subtotal = round2(subtotal + grossLine);
      itemDiscountTotal = round2(itemDiscountTotal + discAmt);
      cgstTotal = round2(cgstTotal + cgst);
      sgstTotal = round2(sgstTotal + sgst);
      igstTotal = round2(igstTotal + igst);

      computedItems.push({
        id: `psi-${Date.now()}-${computedItems.length}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantity: qty,
        returnedQty: 0,
        unitPrice,
        costPrice: Number(product.purchasePrice || 0),
        discountPercent: discPct,
        discountAmount: discAmt,
        gstRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        taxAmount,
        lineTotal,
      });
    }

    const billDiscountAmount = Math.max(0, round2(Number(b.billDiscountAmount) || 0));
    const additionalCharges = Math.max(0, round2(Number(b.additionalCharges) || 0));
    const taxTotal = round2(cgstTotal + sgstTotal + igstTotal);
    const grandTotal = Math.max(
      0,
      round2(subtotal - itemDiscountTotal - billDiscountAmount + taxTotal + additionalCharges)
    );

    const paymentMethod = b.paymentMethod || 'Cash';
    if (status === 'Completed' && paymentMethod === 'Credit') {
      if (!settings.allowCreditSales || !perms.managePayments) {
        res.status(403).json({ error: 'Credit/Due sales are disabled or require payment authorization.' });
        return;
      }
      if (!b.customerId) {
        res.status(400).json({ error: 'Select a registered customer for Credit / Due sales.' });
        return;
      }
    }

    const paymentSplits = Array.isArray(b.paymentSplits) && b.paymentSplits.length > 0
      ? b.paymentSplits
          .filter((sp: any) => Number(sp.amount) > 0)
          .map((sp: any) => ({
            method: sp.method,
            amount: round2(Number(sp.amount)),
            referenceNo: sp.referenceNo ? String(sp.referenceNo) : undefined,
          }))
      : paymentMethod === 'Credit'
      ? []
      : [
          {
            method: paymentMethod === 'Split' ? 'Cash' : paymentMethod,
            amount: round2(Number(b.amountReceived ?? grandTotal)),
          },
        ];

    const totalPaid =
      paymentMethod === 'Credit'
        ? Math.max(0, round2(Number(b.amountReceived) || 0))
        : round2(paymentSplits.reduce((acc: number, s: any) => acc + s.amount, 0));

    if (status === 'Completed' && paymentMethod !== 'Credit' && totalPaid + 0.01 < grandTotal) {
      res.status(400).json({
        error: `Amount received (${totalPaid}) is less than grand total (${grandTotal}). Use Credit or Split payment if partial.`,
      });
      return;
    }

    const balanceDue = Math.max(0, round2(grandTotal - totalPaid));
    const changeDue = Math.max(0, round2(totalPaid - grandTotal));

    // Validate customer credit limit if credit balance exists
    const customer = b.customerId ? db.posCustomers.find((c: any) => c.id === b.customerId) : null;
    if (status === 'Completed' && balanceDue > 0 && customer) {
      if (
        customer.creditLimit > 0 &&
        round2(customer.outstandingBalance + balanceDue) > customer.creditLimit
      ) {
        res.status(400).json({
          error: `Customer credit limit (${customer.creditLimit}) exceeded. Current due: ${customer.outstandingBalance}.`,
        });
        return;
      }
    }

    // If completing an existing Held/Draft bill, remove old draft id cleanly
    if (b.resumeSaleId) {
      db.posSales = db.posSales.filter((s: any) => s.id !== b.resumeSaleId);
    }

    const nowIso = new Date().toISOString();
    const seq = db.posSales.length + 1;
    const invoiceNo = `${settings.invoicePrefix || 'POS'}-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
    const counterObj = b.counterId ? db.posCounters.find((c: any) => c.id === b.counterId) : null;

    // Locate open cash register for this counter or cashier
    const openRegister = db.posRegisters.find(
      (r: any) =>
        r.status === 'Open' &&
        r.schoolId === tenant.schoolId &&
        (!b.counterId || r.counterId === b.counterId)
    );

    const saleRecord = {
      id: `psale-${Date.now()}`,
      ...tenant,
      counterId: b.counterId || openRegister?.counterId || '',
      counterName: counterObj?.name || openRegister?.counterName || 'Main Counter',
      registerId: openRegister?.id || '',
      invoiceNo,
      saleDate: nowIso,
      status,
      customerId: customer?.id || undefined,
      customerName: customer?.name || (typeof b.customerName === 'string' && b.customerName.trim()) || 'Walk-in Customer',
      customerPhone: customer?.phone || b.customerPhone || '',
      customerGstin: customer?.gstin || '',
      cashierId: session.sub,
      cashierName: session.username,
      taxMode,
      items: computedItems,
      subtotal,
      itemDiscountTotal,
      billDiscountAmount,
      discountCode: b.discountCode || undefined,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      additionalCharges,
      grandTotal,
      amountReceived: totalPaid,
      balanceDue,
      changeDue,
      paymentMethod,
      paymentSplits,
      notes: typeof b.notes === 'string' ? b.notes.trim() : '',
      accountingPosted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Execute transactional mutations only when Completed
    if (status === 'Completed') {
      for (const item of computedItems) {
        const product = db.posProducts.find((p: any) => p.id === item.productId);
        recordStockMovement(
          db,
          product,
          -item.quantity,
          'SALE_OUT',
          session.username,
          allowNeg,
          'SALE',
          invoiceNo,
          `POS Sale Invoice ${invoiceNo}`
        );
      }

      // Record payment entries & update open register for Cash
      let cashInForRegister = 0;
      for (const sp of paymentSplits) {
        const appliedAmount =
          sp.method === 'Cash' ? Math.max(0, round2(sp.amount - changeDue)) : sp.amount;
        if (appliedAmount <= 0) continue;
        db.posPayments.unshift({
          id: `ppay-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          ...tenant,
          referenceType: 'SALE',
          referenceId: saleRecord.id,
          referenceNo: invoiceNo,
          partyName: saleRecord.customerName,
          method: sp.method,
          direction: 'IN',
          amount: appliedAmount,
          transactionRef: sp.referenceNo || '',
          recordedBy: session.username,
          paymentDate: nowIso,
        });
        if (sp.method === 'Cash') {
          cashInForRegister = round2(cashInForRegister + appliedAmount);
        }
      }

      if (openRegister && cashInForRegister > 0) {
        openRegister.cashSales = round2(Number(openRegister.cashSales || 0) + cashInForRegister);
        openRegister.expectedCash = round2(
          Number(openRegister.openingCash || 0) +
            openRegister.cashSales -
            Number(openRegister.cashExpenses || 0) -
            Number(openRegister.cashRefunds || 0)
        );
        openRegister.transactions.unshift({
          id: `prtx-${Date.now()}`,
          registerId: openRegister.id,
          type: 'CASH_SALE',
          amount: cashInForRegister,
          referenceNo: invoiceNo,
          notes: `Sale ${invoiceNo}`,
          recordedBy: session.username,
          timestamp: nowIso,
        });
      }

      if (customer && balanceDue > 0) {
        customer.outstandingBalance = round2(Number(customer.outstandingBalance || 0) + balanceDue);
      }

      if (settings.autoPostToAccounting) {
        saleRecord.accountingPosted = postAccountingIdempotent(db, {
          sourceId: saleRecord.id,
          sourceType: 'POS_SALE',
          schoolId: tenant.schoolId,
          campusId: tenant.campusId,
          date: nowIso,
          category: 'POS Retail Sales',
          description: `POS Sale ${invoiceNo} (${saleRecord.customerName})`,
          referenceNo: invoiceNo,
          amount: grandTotal,
          direction: 'CREDIT',
        });
      }

      appendAudit(
        db,
        session,
        tenant.schoolId,
        tenant.campusId,
        'FEE_PAYMENT',
        invoiceNo,
        `Completed POS Sale ${invoiceNo} for ${grandTotal} via ${paymentMethod}`
      );
    }

    db.posSales.unshift(saleRecord);
    ctx.persist();
    res.status(201).json(saleRecord);
  });

  router.post('/sales/:id/cancel', ctx.requireAuth, requirePosPerm('cancelSales'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const sale = db.posSales.find((s: any) => s.id === req.params.id);
    if (!sale) {
      res.status(404).json({ error: 'Sale invoice not found.' });
      return;
    }
    if (!ctx.isSchoolAuthorized(sale.schoolId, req.erpSession)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }
    if (sale.status === 'Cancelled') {
      res.status(400).json({ error: 'This sale is already cancelled.' });
      return;
    }

    const wasCompleted = sale.status === 'Completed' || sale.status === 'Partially Returned';
    const session = req.erpSession!;
    const reason = String(req.body?.reason || 'Cancelled by authorized user').trim();

    if (wasCompleted) {
      for (const item of sale.items) {
        const remainingQty = Math.max(0, Number(item.quantity) - Number(item.returnedQty || 0));
        if (remainingQty <= 0) continue;
        const product = db.posProducts.find((p: any) => p.id === item.productId);
        if (product) {
          recordStockMovement(
            db,
            product,
            remainingQty,
            'SALE_CANCEL_IN',
            session.username,
            true,
            'SALE_CANCEL',
            sale.invoiceNo,
            reason
          );
        }
      }
      if (sale.customerId && sale.balanceDue > 0) {
        const customer = db.posCustomers.find((c: any) => c.id === sale.customerId);
        if (customer) {
          customer.outstandingBalance = Math.max(
            0,
            round2(Number(customer.outstandingBalance || 0) - Number(sale.balanceDue))
          );
        }
      }
    }

    sale.status = 'Cancelled';
    sale.cancelledBy = session.username;
    sale.cancelledAt = new Date().toISOString();
    sale.cancelReason = reason;
    sale.updatedAt = sale.cancelledAt;

    appendAudit(
      db,
      session,
      sale.schoolId,
      sale.campusId,
      'VOID',
      sale.invoiceNo,
      `Cancelled POS invoice ${sale.invoiceNo}: ${reason}`
    );
    ctx.persist();
    res.json(sale);
  });

  // ---------------------------------------------------------------------------
  // Sales Returns & Refunds (with eligible qty check & approval workflow)
  // ---------------------------------------------------------------------------
  const finalizeApprovedReturn = (db: any, ret: any, sale: any, approverUsername: string) => {
    const nowIso = new Date().toISOString();
    for (const rItem of ret.items) {
      const sItem = sale.items.find((i: any) => i.id === rItem.saleItemId || i.productId === rItem.productId);
      if (sItem) {
        sItem.returnedQty = Number(sItem.returnedQty || 0) + Number(rItem.quantity);
      }
      const product = db.posProducts.find((p: any) => p.id === rItem.productId);
      if (product) {
        recordStockMovement(
          db,
          product,
          Number(rItem.quantity),
          'RETURN_IN',
          approverUsername,
          true,
          'SALE_RETURN',
          ret.returnNo,
          ret.reason
        );
      }
    }

    const allReturned = sale.items.every((i: any) => Number(i.returnedQty || 0) >= Number(i.quantity));
    sale.status = allReturned ? 'Returned' : 'Partially Returned';
    sale.updatedAt = nowIso;

    db.posPayments.unshift({
      id: `ppay-ret-${Date.now()}`,
      organizationId: ret.organizationId,
      schoolId: ret.schoolId,
      campusId: ret.campusId,
      referenceType: 'RETURN',
      referenceId: ret.id,
      referenceNo: ret.returnNo,
      partyName: ret.customerName,
      method: ret.refundMethod === 'Credit Note' ? 'Credit' : ret.refundMethod,
      direction: 'OUT',
      amount: ret.totalRefundAmount,
      recordedBy: approverUsername,
      paymentDate: nowIso,
      notes: ret.reason,
    });

    if (ret.refundMethod === 'Cash') {
      const openReg = db.posRegisters.find(
        (r: any) => r.status === 'Open' && r.schoolId === ret.schoolId
      );
      if (openReg) {
        openReg.cashRefunds = round2(Number(openReg.cashRefunds || 0) + Number(ret.totalRefundAmount));
        openReg.expectedCash = round2(
          Number(openReg.openingCash || 0) +
            Number(openReg.cashSales || 0) -
            Number(openReg.cashExpenses || 0) -
            openReg.cashRefunds
        );
        openReg.transactions.unshift({
          id: `prtx-ret-${Date.now()}`,
          registerId: openReg.id,
          type: 'CASH_REFUND',
          amount: ret.totalRefundAmount,
          referenceNo: ret.returnNo,
          notes: `Refund for ${ret.originalInvoiceNo}`,
          recordedBy: approverUsername,
          timestamp: nowIso,
        });
      }
    }

    const settings = getActiveSettings(db, ret.schoolId, ret.organizationId, ret.campusId);
    if (settings.autoPostToAccounting) {
      ret.accountingPosted = postAccountingIdempotent(db, {
        sourceId: ret.id,
        sourceType: 'POS_RETURN',
        schoolId: ret.schoolId,
        campusId: ret.campusId,
        date: nowIso,
        category: 'POS Sales Refund',
        description: `Sales Return ${ret.returnNo} against ${ret.originalInvoiceNo}`,
        referenceNo: ret.returnNo,
        amount: ret.totalRefundAmount,
        direction: 'DEBIT',
      });
    }

    ret.status = 'Approved';
    ret.approvedBy = approverUsername;
    ret.approvedAt = nowIso;
  };

  router.post('/returns', ctx.requireAuth, requirePosPerm('processReturns'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const session = req.erpSession!;
    const { saleId, items, refundMethod, reason, autoApprove } = req.body || {};

    const sale = db.posSales.find((s: any) => s.id === saleId);
    if (!sale) {
      res.status(404).json({ error: 'Original sale invoice not found.' });
      return;
    }
    if (!ctx.isSchoolAuthorized(sale.schoolId, session)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }
    if (sale.status === 'Cancelled' || sale.status === 'Draft' || sale.status === 'Held') {
      res.status(400).json({ error: 'Returns are only allowed for completed invoices.' });
      return;
    }

    const reqItems = Array.isArray(items) ? items : [];
    if (reqItems.length === 0) {
      res.status(400).json({ error: 'Select at least one product to return.' });
      return;
    }

    const returnItems: any[] = [];
    let totalRefund = 0;

    for (const ri of reqItems) {
      const qty = Math.floor(Number(ri.quantity) || 0);
      if (qty <= 0) continue;
      const orig = sale.items.find((si: any) => si.id === ri.saleItemId || si.productId === ri.productId);
      if (!orig) {
        res.status(400).json({ error: 'Returned item does not exist on the original invoice.' });
        return;
      }
      const eligible = Number(orig.quantity) - Number(orig.returnedQty || 0);
      if (qty > eligible) {
        res.status(400).json({
          error: `Return quantity (${qty}) exceeds eligible remaining quantity (${eligible}) for "${orig.productName}".`,
        });
        return;
      }
      const ratio = qty / Number(orig.quantity);
      const lineRefund = round2(Number(orig.lineTotal) * ratio);
      const lineTax = round2(Number(orig.taxAmount) * ratio);
      totalRefund = round2(totalRefund + lineRefund);

      returnItems.push({
        saleItemId: orig.id,
        productId: orig.productId,
        productName: orig.productName,
        sku: orig.sku,
        quantity: qty,
        unitPrice: orig.unitPrice,
        taxAmount: lineTax,
        refundLineTotal: lineRefund,
      });
    }

    if (returnItems.length === 0) {
      res.status(400).json({ error: 'Specify return quantity greater than zero.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const returnNo = `RET-${new Date().getFullYear()}-${String(db.posReturns.length + 1).padStart(5, '0')}`;
    const settings = getActiveSettings(db, sale.schoolId, sale.organizationId, sale.campusId);

    const record = {
      id: `pret-${Date.now()}`,
      organizationId: sale.organizationId,
      schoolId: sale.schoolId,
      campusId: sale.campusId,
      returnNo,
      saleId: sale.id,
      originalInvoiceNo: sale.invoiceNo,
      customerId: sale.customerId,
      customerName: sale.customerName,
      returnDate: nowIso,
      items: returnItems,
      totalRefundAmount: totalRefund,
      refundMethod: refundMethod || 'Cash',
      reason: String(reason || 'Customer return').trim(),
      status: 'Pending Approval' as 'Pending Approval' | 'Approved' | 'Rejected',
      requestedBy: session.username,
      accountingPosted: false,
      createdAt: nowIso,
    };

    const perms = resolveRolePermissions(session.role);
    if (!settings.requireReturnApproval || (autoApprove && perms.approveCashRegister)) {
      finalizeApprovedReturn(db, record, sale, session.username);
    }

    db.posReturns.unshift(record);
    appendAudit(
      db,
      session,
      sale.schoolId,
      sale.campusId,
      'REFUND',
      returnNo,
      `Sales return ${returnNo} (${record.status}) for ${totalRefund} against ${sale.invoiceNo}`
    );
    ctx.persist();
    res.status(201).json(record);
  });

  router.post('/returns/:id/approve', ctx.requireAuth, requirePosPerm('processReturns'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const ret = db.posReturns.find((r: any) => r.id === req.params.id);
    if (!ret) {
      res.status(404).json({ error: 'Return record not found.' });
      return;
    }
    if (ret.status !== 'Pending Approval') {
      res.status(400).json({ error: `Return is already ${ret.status}.` });
      return;
    }
    const sale = db.posSales.find((s: any) => s.id === ret.saleId);
    if (!sale) {
      res.status(404).json({ error: 'Original sale invoice not found.' });
      return;
    }

    // Re-check eligible quantities at approval time
    for (const rItem of ret.items) {
      const orig = sale.items.find((si: any) => si.id === rItem.saleItemId || si.productId === rItem.productId);
      const eligible = orig ? Number(orig.quantity) - Number(orig.returnedQty || 0) : 0;
      if (Number(rItem.quantity) > eligible) {
        res.status(400).json({
          error: `Return quantity exceeds remaining eligible quantity for "${rItem.productName}".`,
        });
        return;
      }
    }

    finalizeApprovedReturn(db, ret, sale, req.erpSession!.username);
    ctx.persist();
    res.json(ret);
  });

  // ---------------------------------------------------------------------------
  // Purchases & Purchase Returns (validated stock-in transactions)
  // ---------------------------------------------------------------------------
  router.post('/purchases', ctx.requireAuth, requirePosPerm('managePurchases'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const session = req.erpSession!;
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const b = req.body || {};

    const supplier = db.posSuppliers.find((s: any) => s.id === b.supplierId);
    if (!supplier) {
      res.status(400).json({ error: 'Select a valid supplier.' });
      return;
    }
    const rawItems = Array.isArray(b.items) ? b.items : [];
    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Add at least one product line to the purchase entry.' });
      return;
    }

    const computedItems: any[] = [];
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;

    for (const line of rawItems) {
      const qty = Math.floor(Number(line.quantity) || 0);
      if (qty <= 0) {
        res.status(400).json({ error: 'Purchase quantity must be greater than zero.' });
        return;
      }
      const product = db.posProducts.find((p: any) => p.id === line.productId);
      if (!product) {
        res.status(400).json({ error: 'Selected product not found.' });
        return;
      }
      const rate = Math.max(0, round2(Number(line.purchaseRate ?? product.purchasePrice)));
      const gross = round2(rate * qty);
      const disc = Math.max(0, round2(Number(line.discountAmount) || 0));
      const taxable = Math.max(0, round2(gross - disc));
      const gstRate = Math.max(0, Number(line.gstRate ?? product.gstRate) || 0);
      const taxAmt = round2((taxable * gstRate) / 100);
      const lineTotal = round2(taxable + taxAmt);

      subtotal = round2(subtotal + gross);
      discountTotal = round2(discountTotal + disc);
      taxTotal = round2(taxTotal + taxAmt);

      computedItems.push({
        id: `ppi-${Date.now()}-${computedItems.length}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: qty,
        returnedQty: 0,
        purchaseRate: rate,
        discountAmount: disc,
        gstRate,
        taxAmount: taxAmt,
        lineTotal,
      });
    }

    const grandTotal = round2(subtotal - discountTotal + taxTotal);
    const purchaseType = b.purchaseType === 'Credit' ? 'Credit' : 'Cash';
    const amountPaid =
      purchaseType === 'Cash'
        ? round2(Number(b.amountPaid ?? grandTotal))
        : Math.max(0, round2(Number(b.amountPaid) || 0));
    const balanceDue = Math.max(0, round2(grandTotal - amountPaid));
    const paymentStatus =
      balanceDue <= 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const nowIso = new Date().toISOString();
    const purchaseNo = `PUR-${new Date().getFullYear()}-${String(db.posPurchases.length + 1).padStart(5, '0')}`;

    const record = {
      id: `ppur-${Date.now()}`,
      ...tenant,
      purchaseNo,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierInvoiceNo: String(b.supplierInvoiceNo || purchaseNo).trim(),
      purchaseDate: b.purchaseDate || nowIso.slice(0, 10),
      purchaseType,
      paymentStatus,
      items: computedItems,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      amountPaid,
      balanceDue,
      notes: String(b.notes || '').trim(),
      recordedBy: session.username,
      accountingPosted: false,
      createdAt: nowIso,
    };

    // Validated inventory stock-in transaction for every line item
    for (const item of computedItems) {
      const product = db.posProducts.find((p: any) => p.id === item.productId);
      product.purchasePrice = item.purchaseRate;
      recordStockMovement(
        db,
        product,
        item.quantity,
        'PURCHASE_IN',
        session.username,
        true,
        'PURCHASE',
        purchaseNo,
        `Purchase from ${supplier.name} (Inv: ${record.supplierInvoiceNo})`
      );
    }

    if (amountPaid > 0) {
      db.posPayments.unshift({
        id: `ppay-pur-${Date.now()}`,
        ...tenant,
        referenceType: 'PURCHASE',
        referenceId: record.id,
        referenceNo: purchaseNo,
        partyName: supplier.name,
        method: b.paymentMethod || 'Bank Transfer',
        direction: 'OUT',
        amount: amountPaid,
        recordedBy: session.username,
        paymentDate: nowIso,
      });
    }

    if (balanceDue > 0) {
      supplier.outstandingBalance = round2(Number(supplier.outstandingBalance || 0) + balanceDue);
    }

    const settings = getActiveSettings(db, tenant.schoolId, tenant.organizationId, tenant.campusId);
    if (settings.autoPostToAccounting) {
      record.accountingPosted = postAccountingIdempotent(db, {
        sourceId: record.id,
        sourceType: 'POS_PURCHASE',
        schoolId: tenant.schoolId,
        campusId: tenant.campusId,
        date: record.purchaseDate,
        category: 'POS Stock Purchase',
        description: `POS Purchase ${purchaseNo} - ${supplier.name}`,
        referenceNo: purchaseNo,
        amount: grandTotal,
        direction: 'DEBIT',
      });
    }

    db.posPurchases.unshift(record);
    appendAudit(
      db,
      session,
      tenant.schoolId,
      tenant.campusId,
      'STOCK_ADJUSTMENT',
      purchaseNo,
      `Posted purchase ${purchaseNo} from ${supplier.name} totaling ${grandTotal}`
    );
    ctx.persist();
    res.status(201).json(record);
  });

  router.post('/purchases/:id/return', ctx.requireAuth, requirePosPerm('managePurchases'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const pur = db.posPurchases.find((p: any) => p.id === req.params.id);
    if (!pur) {
      res.status(404).json({ error: 'Purchase record not found.' });
      return;
    }
    if (pur.paymentStatus === 'Returned') {
      res.status(400).json({ error: 'This purchase has already been returned.' });
      return;
    }
    const session = req.erpSession!;
    try {
      for (const item of pur.items) {
        const product = db.posProducts.find((p: any) => p.id === item.productId);
        if (product) {
          recordStockMovement(
            db,
            product,
            -item.quantity,
            'PURCHASE_RETURN_OUT',
            session.username,
            false,
            'PURCHASE_RETURN',
            pur.purchaseNo,
            String(req.body?.reason || 'Returned to supplier')
          );
        }
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (pur.balanceDue > 0) {
      const sup = db.posSuppliers.find((s: any) => s.id === pur.supplierId);
      if (sup) {
        sup.outstandingBalance = Math.max(0, round2(Number(sup.outstandingBalance || 0) - Number(pur.balanceDue)));
      }
    }
    pur.paymentStatus = 'Returned';
    pur.balanceDue = 0;
    ctx.persist();
    res.json(pur);
  });

  // ---------------------------------------------------------------------------
  // Stock Movements (Stock In / Out / Adjustment / Damaged / Expired) & Transfers
  // ---------------------------------------------------------------------------
  router.post('/stock-movements', ctx.requireAuth, requirePosPerm('manageInventory'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const { productId, movementType, quantity, reason } = req.body || {};
    const product = db.posProducts.find((p: any) => p.id === productId);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    if (!ctx.isSchoolAuthorized(product.schoolId, req.erpSession)) {
      res.status(403).json({ error: 'Unauthorized school access.' });
      return;
    }

    const qty = Math.floor(Number(quantity) || 0);
    if (qty === 0) {
      res.status(400).json({ error: 'Movement quantity cannot be zero.' });
      return;
    }

    const outboundTypes = new Set(['STOCK_OUT', 'DAMAGED', 'EXPIRED']);
    const signedDelta =
      movementType === 'ADJUSTMENT'
        ? qty
        : outboundTypes.has(movementType)
        ? -Math.abs(qty)
        : Math.abs(qty);

    try {
      const movement = recordStockMovement(
        db,
        product,
        signedDelta,
        movementType || 'ADJUSTMENT',
        req.erpSession!.username,
        false,
        'MANUAL_STOCK',
        product.sku,
        String(reason || 'Manual stock update').trim()
      );
      appendAudit(
        db,
        req.erpSession!,
        product.schoolId,
        product.campusId,
        'STOCK_ADJUSTMENT',
        product.sku,
        `${movementType} (${signedDelta}) for ${product.name}: ${reason || 'Manual update'}`
      );
      ctx.persist();
      res.status(201).json({ movement, product });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/transfers', ctx.requireAuth, requirePosPerm('manageInventory'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const session = req.erpSession!;
    const { productId, toSchoolId, toCampusId, toCampusName, fromCampusName, quantity, notes } = req.body || {};
    const qty = Math.floor(Number(quantity) || 0);
    if (!productId || !toCampusId || qty <= 0) {
      res.status(400).json({ error: 'Product, destination campus, and positive quantity are required.' });
      return;
    }
    const sourceProduct = db.posProducts.find((p: any) => p.id === productId);
    if (!sourceProduct) {
      res.status(404).json({ error: 'Source product not found.' });
      return;
    }
    const targetSchool = toSchoolId || sourceProduct.schoolId;
    if (!ctx.isSchoolAuthorized(sourceProduct.schoolId, session) || !ctx.isSchoolAuthorized(targetSchool, session)) {
      res.status(403).json({ error: 'You are not authorized to transfer stock across these schools.' });
      return;
    }

    const transferNo = `TRF-${new Date().getFullYear()}-${String(db.posTransfers.length + 1).padStart(5, '0')}`;
    try {
      recordStockMovement(
        db,
        sourceProduct,
        -qty,
        'TRANSFER_OUT',
        session.username,
        false,
        'TRANSFER',
        transferNo,
        `Transferred to ${toCampusName || toCampusId}`
      );
    } catch (err: any) {
      res.status(400).json({ error: err.message });
      return;
    }

    // Credit matching product at destination campus (or create mirror product record)
    let destProduct = db.posProducts.find(
      (p: any) =>
        p.schoolId === targetSchool &&
        p.campusId === toCampusId &&
        p.sku === sourceProduct.sku
    );
    if (!destProduct) {
      const nowIso = new Date().toISOString();
      destProduct = {
        ...sourceProduct,
        id: `pprod-trf-${Date.now()}`,
        schoolId: targetSchool,
        campusId: toCampusId,
        openingStock: 0,
        currentStock: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      db.posProducts.unshift(destProduct);
    }
    recordStockMovement(
      db,
      destProduct,
      qty,
      'TRANSFER_IN',
      session.username,
      true,
      'TRANSFER',
      transferNo,
      `Received from ${fromCampusName || sourceProduct.campusId}`
    );

    const transfer = {
      id: `ptrf-${Date.now()}`,
      organizationId: sourceProduct.organizationId,
      schoolId: sourceProduct.schoolId,
      campusId: sourceProduct.campusId,
      transferNo,
      fromSchoolId: sourceProduct.schoolId,
      fromCampusId: sourceProduct.campusId,
      fromCampusName: fromCampusName || sourceProduct.campusId,
      toSchoolId: targetSchool,
      toCampusId,
      toCampusName: toCampusName || toCampusId,
      productId: sourceProduct.id,
      productName: sourceProduct.name,
      sku: sourceProduct.sku,
      quantity: qty,
      status: 'Completed',
      notes: String(notes || '').trim(),
      transferredBy: session.username,
      createdAt: new Date().toISOString(),
    };
    db.posTransfers.unshift(transfer);
    ctx.persist();
    res.status(201).json(transfer);
  });

  // ---------------------------------------------------------------------------
  // Cash Register Open / Close / Approve
  // ---------------------------------------------------------------------------
  router.post('/registers/open', ctx.requireAuth, requirePosPerm('manageCashRegister'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const session = req.erpSession!;
    const { counterId, counterName, openingCash, notes } = req.body || {};
    const resolvedCounterId = counterId || 'ctr-default';

    if (
      db.posRegisters.some(
        (r: any) =>
          r.status === 'Open' &&
          r.schoolId === tenant.schoolId &&
          r.counterId === resolvedCounterId
      )
    ) {
      res.status(409).json({ error: 'A cash register session is already open for this counter.' });
      return;
    }

    const nowIso = new Date().toISOString();
    const openAmt = Math.max(0, round2(Number(openingCash) || 0));
    const registerNo = `REG-${new Date().getFullYear()}-${String(db.posRegisters.length + 1).padStart(4, '0')}`;
    const reg = {
      id: `preg-${Date.now()}`,
      ...tenant,
      registerNo,
      counterId: resolvedCounterId,
      counterName: String(counterName || 'Main Counter'),
      cashierId: session.sub,
      cashierName: session.username,
      openingTime: nowIso,
      openingCash: openAmt,
      cashSales: 0,
      cashExpenses: 0,
      cashRefunds: 0,
      expectedCash: openAmt,
      status: 'Open',
      notes: String(notes || '').trim(),
      transactions: [
        {
          id: `prtx-open-${Date.now()}`,
          registerId: '',
          type: 'OPENING',
          amount: openAmt,
          referenceNo: registerNo,
          notes: 'Register opened',
          recordedBy: session.username,
          timestamp: nowIso,
        },
      ],
    };
    reg.transactions[0].registerId = reg.id;
    db.posRegisters.unshift(reg);
    ctx.persist();
    res.status(201).json(reg);
  });

  router.post('/registers/:id/close', ctx.requireAuth, requirePosPerm('manageCashRegister'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const reg = db.posRegisters.find((r: any) => r.id === req.params.id);
    if (!reg) {
      res.status(404).json({ error: 'Cash register not found.' });
      return;
    }
    if (reg.status !== 'Open') {
      res.status(400).json({ error: 'Cash register is already closed.' });
      return;
    }
    const actualCash = Math.max(0, round2(Number(req.body?.actualCash) || 0));
    const expectedCash = round2(
      Number(reg.openingCash || 0) +
        Number(reg.cashSales || 0) -
        Number(reg.cashExpenses || 0) -
        Number(reg.cashRefunds || 0)
    );
    const nowIso = new Date().toISOString();
    reg.expectedCash = expectedCash;
    reg.actualCash = actualCash;
    reg.cashDifference = round2(actualCash - expectedCash);
    reg.closingTime = nowIso;
    reg.closedBy = req.erpSession!.username;
    reg.status = 'Closed';
    if (req.body?.notes) reg.notes = String(req.body.notes).trim();
    reg.transactions.unshift({
      id: `prtx-close-${Date.now()}`,
      registerId: reg.id,
      type: 'CLOSING',
      amount: actualCash,
      referenceNo: reg.registerNo,
      notes: `Closed register (Diff: ${reg.cashDifference})`,
      recordedBy: req.erpSession!.username,
      timestamp: nowIso,
    });
    ctx.persist();
    res.json(reg);
  });

  router.post('/registers/:id/approve', ctx.requireAuth, requirePosPerm('approveCashRegister'), (req: any, res) => {
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const reg = db.posRegisters.find((r: any) => r.id === req.params.id);
    if (!reg) {
      res.status(404).json({ error: 'Cash register not found.' });
      return;
    }
    if (reg.status !== 'Closed') {
      res.status(400).json({ error: 'Register must be closed before approval.' });
      return;
    }
    reg.status = 'Approved';
    reg.approvedBy = req.erpSession!.username;
    reg.approvedAt = new Date().toISOString();
    ctx.persist();
    res.json(reg);
  });

  // ---------------------------------------------------------------------------
  // POS Expenses & Direct Payment Settlements
  // ---------------------------------------------------------------------------
  router.post('/expenses', ctx.requireAuth, requirePosPerm('managePayments'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const b = req.body || {};
    const amount = round2(Number(b.amount) || 0);
    if (!b.category?.trim() || !b.description?.trim() || amount <= 0) {
      res.status(400).json({ error: 'Category, description, and positive amount are required.' });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const session = req.erpSession!;
    const nowIso = new Date().toISOString();
    const expenseNo = `PEXP-${new Date().getFullYear()}-${String(db.posExpenses.length + 1).padStart(5, '0')}`;
    const paymentMethod = b.paymentMethod || 'Cash';

    const openReg =
      paymentMethod === 'Cash'
        ? db.posRegisters.find((r: any) => r.status === 'Open' && r.schoolId === tenant.schoolId)
        : null;

    const record = {
      id: `pexp-${Date.now()}`,
      ...tenant,
      expenseNo,
      date: b.date || nowIso.slice(0, 10),
      category: String(b.category).trim(),
      description: String(b.description).trim(),
      amount,
      paymentMethod,
      registerId: openReg?.id || undefined,
      recordedBy: session.username,
      accountingPosted: false,
      createdAt: nowIso,
    };

    if (openReg) {
      openReg.cashExpenses = round2(Number(openReg.cashExpenses || 0) + amount);
      openReg.expectedCash = round2(
        Number(openReg.openingCash || 0) +
          Number(openReg.cashSales || 0) -
          openReg.cashExpenses -
          Number(openReg.cashRefunds || 0)
      );
      openReg.transactions.unshift({
        id: `prtx-exp-${Date.now()}`,
        registerId: openReg.id,
        type: 'CASH_EXPENSE',
        amount,
        referenceNo: expenseNo,
        notes: record.description,
        recordedBy: session.username,
        timestamp: nowIso,
      });
    }

    const settings = getActiveSettings(db, tenant.schoolId, tenant.organizationId, tenant.campusId);
    if (settings.autoPostToAccounting) {
      record.accountingPosted = postAccountingIdempotent(db, {
        sourceId: record.id,
        sourceType: 'POS_EXPENSE',
        schoolId: tenant.schoolId,
        campusId: tenant.campusId,
        date: record.date,
        category: `POS Expense - ${record.category}`,
        description: record.description,
        referenceNo: expenseNo,
        amount,
        direction: 'DEBIT',
      });
    }

    db.posExpenses.unshift(record);
    ctx.persist();
    res.status(201).json(record);
  });

  router.post('/payments', ctx.requireAuth, requirePosPerm('managePayments'), (req: any, res) => {
    const tenant = resolveTenant(req, req.body);
    if ('error' in tenant) {
      res.status(403).json({ error: tenant.error });
      return;
    }
    const db = ctx.getDb();
    ensurePosStoreCollections(db);
    const b = req.body || {};
    const amount = round2(Number(b.amount) || 0);
    if (amount <= 0 || !b.referenceType || !b.partyId) {
      res.status(400).json({ error: 'Valid party, payment type, and positive amount are required.' });
      return;
    }

    const nowIso = new Date().toISOString();
    let partyName = '';
    let direction: 'IN' | 'OUT' = 'IN';

    if (b.referenceType === 'CUSTOMER_DUES') {
      const cust = db.posCustomers.find((c: any) => c.id === b.partyId);
      if (!cust) {
        res.status(404).json({ error: 'Customer not found.' });
        return;
      }
      partyName = cust.name;
      direction = 'IN';
      cust.outstandingBalance = Math.max(0, round2(Number(cust.outstandingBalance || 0) - amount));
    } else if (b.referenceType === 'SUPPLIER_PAYMENT') {
      const sup = db.posSuppliers.find((s: any) => s.id === b.partyId);
      if (!sup) {
        res.status(404).json({ error: 'Supplier not found.' });
        return;
      }
      partyName = sup.name;
      direction = 'OUT';
      sup.outstandingBalance = Math.max(0, round2(Number(sup.outstandingBalance || 0) - amount));
    } else {
      res.status(400).json({ error: 'Unsupported payment settlement type.' });
      return;
    }

    const payment = {
      id: `ppay-${Date.now()}`,
      ...tenant,
      referenceType: b.referenceType,
      referenceId: b.partyId,
      referenceNo: `PAY-${new Date().getFullYear()}-${String(db.posPayments.length + 1).padStart(5, '0')}`,
      partyName,
      method: b.method || 'Cash',
      direction,
      amount,
      transactionRef: String(b.transactionRef || '').trim(),
      recordedBy: req.erpSession!.username,
      paymentDate: nowIso,
      notes: String(b.notes || '').trim(),
    };
    db.posPayments.unshift(payment);
    ctx.persist();
    res.status(201).json(payment);
  });

  return router;
}
