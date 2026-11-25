import * as XLSX from 'xlsx';
import { Product, ProductCategory, InventoryMovement } from '../types/pos';

export type StockUpdateMode = 'set_stock' | 'add_stock';

export type ProductDietaryType = NonNullable<Product['dietary']>;

export interface ParsedInventoryRow {
  rowNumber: number;
  action: 'create' | 'update' | 'error';
  matchedProduct?: Product;
  rawSku: string;
  rawBarcode: string;
  /** Validated full product object for new rows, or merged preview product for updates */
  previewProduct?: Product;
  /** Normalized partial fields parsed directly from the uploaded spreadsheet row */
  parsedFields: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
  /** Explicit stock value provided in the sheet (undefined if omitted) */
  providedStock?: number;
  previousStock?: number;
  nextStock?: number;
  stockDelta?: number;
  errors: string[];
  warnings: string[];
}

export interface BulkImportParseSummary {
  fileName: string;
  sheetName: string;
  detectedColumns: string[];
  rows: ParsedInventoryRow[];
  totalRows: number;
  createCount: number;
  updateCount: number;
  errorCount: number;
  newCategories: string[];
}

export interface BulkImportPayload {
  fileName: string;
  stockMode: StockUpdateMode;
  updateExistingDetails: boolean;
  validRows: ParsedInventoryRow[];
}

export interface BulkImportExecutionResult {
  products: Product[];
  categories: ProductCategory[];
  movements: InventoryMovement[];
  createdCount: number;
  updatedCount: number;
  newCategoriesCount: number;
  lowStockProducts: Product[];
}

const VALID_DIETARY_VALUES: ProductDietaryType[] = ['veg', 'non-veg', 'healthy', 'beverage'];

export const PRODUCT_SCHEMA_COLUMNS: Array<{
  key: keyof Omit<Product, 'id' | 'created_at' | 'updated_at'>;
  label: string;
  requiredForCreate: boolean;
  description: string;
}> = [
  { key: 'sku', label: 'sku', requiredForCreate: true, description: 'Unique SKU identifier (matches existing items)' },
  { key: 'name', label: 'name', requiredForCreate: true, description: 'Product display name' },
  { key: 'price', label: 'price', requiredForCreate: true, description: 'Selling unit price (>= 0)' },
  { key: 'stock_quantity', label: 'stock_quantity', requiredForCreate: false, description: 'Stock integer (default 0 on create; set/add on update)' },
  { key: 'category', label: 'category', requiredForCreate: false, description: 'Category name (auto-created if new)' },
  { key: 'barcode', label: 'barcode', requiredForCreate: false, description: 'Barcode / EAN code (fallback match key)' },
  { key: 'cost_price', label: 'cost_price', requiredForCreate: false, description: 'Unit purchase cost (>= 0)' },
  { key: 'tax_rate', label: 'tax_rate', requiredForCreate: false, description: 'Tax percentage 0-100 (default 5)' },
  { key: 'reorder_level', label: 'reorder_level', requiredForCreate: false, description: 'Low-stock warning threshold (default 10)' },
  { key: 'is_active', label: 'is_active', requiredForCreate: false, description: 'true/false or Active/Inactive (default true)' },
  { key: 'dietary', label: 'dietary', requiredForCreate: false, description: 'veg | non-veg | healthy | beverage' },
  { key: 'calories', label: 'calories', requiredForCreate: false, description: 'Calories per serving (integer >= 0)' },
  { key: 'portion', label: 'portion', requiredForCreate: false, description: 'Serving portion e.g. 250ml, 1 Plate' },
  { key: 'tags', label: 'tags', requiredForCreate: false, description: 'Comma-separated tags e.g. hot,fresh' },
  { key: 'image_preset', label: 'image_preset', requiredForCreate: false, description: 'Preset icon key e.g. coffee, breakfast' },
  { key: 'image_url', label: 'image_url', requiredForCreate: false, description: 'Optional https:// product image URL' },
];

type CanonicalField = keyof Omit<Product, 'id' | 'created_at' | 'updated_at'>;

const HEADER_ALIAS_MAP: Record<string, CanonicalField> = {
  sku: 'sku',
  itemcode: 'sku',
  productcode: 'sku',
  code: 'sku',

  barcode: 'barcode',
  ean: 'barcode',
  upc: 'barcode',

  name: 'name',
  productname: 'name',
  itemname: 'name',
  title: 'name',

  category: 'category',
  categoryname: 'category',
  department: 'category',

  price: 'price',
  unitprice: 'price',
  sellingprice: 'price',
  saleprice: 'price',
  mrp: 'price',

  costprice: 'cost_price',
  cost: 'cost_price',
  purchaseprice: 'cost_price',
  unitcost: 'cost_price',

  taxrate: 'tax_rate',
  tax: 'tax_rate',
  gst: 'tax_rate',
  vat: 'tax_rate',

  stockquantity: 'stock_quantity',
  currentstock: 'stock_quantity',
  stock: 'stock_quantity',
  quantity: 'stock_quantity',
  qty: 'stock_quantity',
  onhand: 'stock_quantity',

  reorderlevel: 'reorder_level',
  reorderpoint: 'reorder_level',
  minstock: 'reorder_level',
  lowstockthreshold: 'reorder_level',

  isactive: 'is_active',
  active: 'is_active',
  status: 'is_active',
  enabled: 'is_active',

  imageurl: 'image_url',
  image: 'image_url',

  imagepreset: 'image_preset',
  preset: 'image_preset',

  tags: 'tags',
  labels: 'tags',

  dietary: 'dietary',
  diet: 'dietary',
  foodtype: 'dietary',

  calories: 'calories',
  kcal: 'calories',

  portion: 'portion',
  servingsize: 'portion',
  unit: 'portion',
};

function normalizeHeaderKey(rawHeader: string): CanonicalField | null {
  const cleaned = rawHeader
    .trim()
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '');
  return HEADER_ALIAS_MAP[cleaned] ?? null;
}

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return String(value).trim() === '';
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const cleaned = String(value)
    .trim()
    .replace(/[₹$€£,\s%]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBooleanValue(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const str = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y', 'active', 'enabled', 'healthy', 'low stock', 'out of stock'].includes(str)) {
    return true;
  }
  if (['false', '0', 'no', 'n', 'inactive', 'disabled'].includes(str)) {
    return false;
  }
  return null;
}

function parseDietaryValue(value: unknown): ProductDietaryType | null {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
  if (normalized === 'nonveg' || normalized === 'non_veg') return 'non-veg';
  if (normalized === 'vegetarian') return 'veg';
  if (VALID_DIETARY_VALUES.includes(normalized as ProductDietaryType)) {
    return normalized as ProductDietaryType;
  }
  return null;
}

function parseTagsValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  return String(value)
    .split(/[,;|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const CATEGORY_COLORS = [
  '#f59e0b',
  '#10b981',
  '#38bdf8',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#6366f1',
];

export async function readSpreadsheetFile(file: File): Promise<{
  fileName: string;
  sheetName: string;
  rawRows: Record<string, unknown>[];
  detectedColumns: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error('The uploaded file does not contain any readable sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  const detectedColumns =
    rawRows.length > 0 ? Object.keys(rawRows[0]).map((k) => k.trim()) : [];

  return {
    fileName: file.name,
    sheetName,
    rawRows,
    detectedColumns,
  };
}

export function validateInventoryRows(params: {
  fileName: string;
  sheetName: string;
  detectedColumns: string[];
  rawRows: Record<string, unknown>[];
  existingProducts: Product[];
  existingCategories: ProductCategory[];
  stockMode: StockUpdateMode;
  updateExistingDetails: boolean;
}): BulkImportParseSummary {
  const {
    fileName,
    sheetName,
    detectedColumns,
    rawRows,
    existingProducts,
    existingCategories,
    stockMode,
    updateExistingDetails,
  } = params;

  const skuLookup = new Map<string, Product>();
  const barcodeLookup = new Map<string, Product>();

  for (const prod of existingProducts) {
    if (prod.sku.trim()) {
      skuLookup.set(prod.sku.trim().toLowerCase(), prod);
    }
    if (prod.barcode && prod.barcode.trim()) {
      barcodeLookup.set(prod.barcode.trim().toLowerCase(), prod);
    }
  }

  const existingCategoryNames = new Set(
    existingCategories.map((c) => c.name.trim().toLowerCase())
  );
  const discoveredNewCategories = new Map<string, string>();
  const seenSkusInFile = new Map<string, number>();
  const defaultCategory = existingCategories[0]?.name || 'General';
  const nowIso = new Date().toISOString();

  const parsedRows: ParsedInventoryRow[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // Row 1 is header row
    const mapped: Partial<Record<CanonicalField, unknown>> = {};

    for (const [header, cellValue] of Object.entries(rawRow)) {
      const canonical = normalizeHeaderKey(header);
      if (canonical && mapped[canonical] === undefined) {
        mapped[canonical] = cellValue;
      }
    }

    // Skip completely empty trailing spreadsheet lines
    const hasAnyData = Object.values(rawRow).some((v) => !isBlank(v));
    if (!hasAnyData) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    const rawSku = isBlank(mapped.sku) ? '' : String(mapped.sku).trim();
    const rawBarcode = isBlank(mapped.barcode) ? '' : String(mapped.barcode).trim();

    if (!rawSku && !rawBarcode) {
      errors.push('Missing required "sku" (or existing "barcode" to match).');
    }

    const normalizedSkuKey = rawSku.toLowerCase();
    const normalizedBarcodeKey = rawBarcode.toLowerCase();

    if (normalizedSkuKey) {
      const prevRow = seenSkusInFile.get(normalizedSkuKey);
      if (prevRow !== undefined) {
        errors.push(`Duplicate SKU "${rawSku}" in file (already used on row ${prevRow}).`);
      } else {
        seenSkusInFile.set(normalizedSkuKey, rowNumber);
      }
    }

    const matchedProduct =
      (normalizedSkuKey ? skuLookup.get(normalizedSkuKey) : undefined) ||
      (normalizedBarcodeKey ? barcodeLookup.get(normalizedBarcodeKey) : undefined);

    const parsedFields: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>> = {};

    if (rawSku) parsedFields.sku = rawSku;
    if (!isBlank(mapped.barcode)) parsedFields.barcode = rawBarcode;

    // Name
    if (!isBlank(mapped.name)) {
      parsedFields.name = String(mapped.name).trim();
    } else if (!matchedProduct) {
      errors.push('Missing required "name" for new product.');
    }

    // Category
    if (!isBlank(mapped.category)) {
      parsedFields.category = String(mapped.category).trim();
    }

    // Price
    if (!isBlank(mapped.price)) {
      const price = parseFiniteNumber(mapped.price);
      if (price === null || price < 0) {
        errors.push('Invalid "price": must be a number >= 0.');
      } else {
        parsedFields.price = Number(price.toFixed(2));
      }
    } else if (!matchedProduct) {
      errors.push('Missing required "price" for new product.');
    }

    // Cost Price (optional)
    if (!isBlank(mapped.cost_price)) {
      const costPrice = parseFiniteNumber(mapped.cost_price);
      if (costPrice === null || costPrice < 0) {
        errors.push('Invalid "cost_price": must be a number >= 0.');
      } else {
        parsedFields.cost_price = Number(costPrice.toFixed(2));
      }
    }

    // Tax Rate
    if (!isBlank(mapped.tax_rate)) {
      const taxRate = parseFiniteNumber(mapped.tax_rate);
      if (taxRate === null || taxRate < 0 || taxRate > 100) {
        errors.push('Invalid "tax_rate": must be between 0 and 100.');
      } else {
        parsedFields.tax_rate = Number(taxRate.toFixed(2));
      }
    }

    // Stock Quantity
    let providedStock: number | undefined;
    if (!isBlank(mapped.stock_quantity)) {
      const stockNum = parseFiniteNumber(mapped.stock_quantity);
      if (stockNum === null || !Number.isInteger(stockNum)) {
        errors.push('Invalid "stock_quantity": must be a whole integer.');
      } else if (!matchedProduct && stockNum < 0) {
        errors.push('Invalid "stock_quantity": new products cannot start with negative stock.');
      } else if (matchedProduct && stockMode === 'set_stock' && stockNum < 0) {
        errors.push('Invalid "stock_quantity": replacement stock cannot be negative.');
      } else {
        providedStock = stockNum;
        parsedFields.stock_quantity = stockNum;
      }
    }

    // Reorder Level
    if (!isBlank(mapped.reorder_level)) {
      const reorder = parseFiniteNumber(mapped.reorder_level);
      if (reorder === null || !Number.isInteger(reorder) || reorder < 0) {
        errors.push('Invalid "reorder_level": must be a whole integer >= 0.');
      } else {
        parsedFields.reorder_level = reorder;
      }
    }

    // is_active
    if (!isBlank(mapped.is_active)) {
      const active = parseBooleanValue(mapped.is_active);
      if (active === null) {
        errors.push('Invalid "is_active": expected true/false, yes/no, 1/0, or Active/Inactive.');
      } else {
        parsedFields.is_active = active;
      }
    }

    // Dietary
    if (!isBlank(mapped.dietary)) {
      const dietary = parseDietaryValue(mapped.dietary);
      if (!dietary) {
        errors.push(
          `Invalid "dietary" value "${String(mapped.dietary)}": allowed values are veg, non-veg, healthy, beverage.`
        );
      } else {
        parsedFields.dietary = dietary;
      }
    }

    // Calories
    if (!isBlank(mapped.calories)) {
      const calories = parseFiniteNumber(mapped.calories);
      if (calories === null || !Number.isInteger(calories) || calories < 0) {
        errors.push('Invalid "calories": must be a whole integer >= 0.');
      } else {
        parsedFields.calories = calories;
      }
    }

    // Portion
    if (!isBlank(mapped.portion)) {
      parsedFields.portion = String(mapped.portion).trim();
    }

    // Tags
    if (!isBlank(mapped.tags)) {
      parsedFields.tags = parseTagsValue(mapped.tags);
    }

    // Image Preset
    if (!isBlank(mapped.image_preset)) {
      parsedFields.image_preset = String(mapped.image_preset).trim();
    }

    // Image URL
    if (!isBlank(mapped.image_url)) {
      const imgUrl = String(mapped.image_url).trim();
      if (/^(https?:\/\/|data:image\/)/i.test(imgUrl)) {
        parsedFields.image_url = imgUrl;
      } else {
        errors.push('Invalid "image_url": must start with http://, https://, or data:image/.');
      }
    }

    // Ensure SKU exists for new product creation
    if (!matchedProduct && !rawSku) {
      errors.push('Missing required "sku" for new product creation.');
    }

    // Calculate stock transition & check for no-op update
    if (matchedProduct) {
      const previousStock = matchedProduct.stock_quantity;
      let nextStock = previousStock;

      if (providedStock !== undefined) {
        if (stockMode === 'set_stock') {
          nextStock = providedStock;
        } else {
          nextStock = Math.max(0, previousStock + providedStock);
          if (previousStock + providedStock < 0) {
            warnings.push('Resulting stock clamped at 0.');
          }
        }
      } else if (!updateExistingDetails) {
        errors.push('Missing "stock_quantity" for existing product stock update.');
      }

      const stockDelta = nextStock - previousStock;

      const mergedPreview: Product = updateExistingDetails
        ? {
            ...matchedProduct,
            ...parsedFields,
            sku: matchedProduct.sku,
            stock_quantity: nextStock,
            updated_at: nowIso,
          }
        : {
            ...matchedProduct,
            stock_quantity: nextStock,
            updated_at: nowIso,
          };

      if (errors.length === 0) {
        if (
          updateExistingDetails &&
          parsedFields.category &&
          !existingCategoryNames.has(parsedFields.category.toLowerCase())
        ) {
          discoveredNewCategories.set(
            parsedFields.category.toLowerCase(),
            parsedFields.category
          );
        }

        parsedRows.push({
          rowNumber,
          action: 'update',
          matchedProduct,
          rawSku: rawSku || matchedProduct.sku,
          rawBarcode: rawBarcode || matchedProduct.barcode,
          previewProduct: mergedPreview,
          parsedFields,
          providedStock,
          previousStock,
          nextStock,
          stockDelta,
          errors,
          warnings,
        });
      } else {
        parsedRows.push({
          rowNumber,
          action: 'error',
          matchedProduct,
          rawSku: rawSku || matchedProduct.sku,
          rawBarcode: rawBarcode || matchedProduct.barcode,
          parsedFields,
          providedStock,
          previousStock,
          nextStock,
          stockDelta,
          errors,
          warnings,
        });
      }
    } else {
      const initialStock = providedStock ?? 0;
      const resolvedCategory = parsedFields.category || defaultCategory;

      if (errors.length === 0) {
        if (!existingCategoryNames.has(resolvedCategory.toLowerCase())) {
          discoveredNewCategories.set(resolvedCategory.toLowerCase(), resolvedCategory);
        }

        const newProductPreview: Product = {
          id: `preview-${rowNumber}`,
          sku: rawSku,
          barcode: rawBarcode,
          name: parsedFields.name || 'Untitled Product',
          category: resolvedCategory,
          price: parsedFields.price ?? 0,
          cost_price: parsedFields.cost_price,
          tax_rate: parsedFields.tax_rate ?? 5,
          stock_quantity: initialStock,
          reorder_level: parsedFields.reorder_level ?? 10,
          is_active: parsedFields.is_active ?? true,
          image_url: parsedFields.image_url,
          image_preset: parsedFields.image_preset || 'breakfast',
          tags: parsedFields.tags || [],
          dietary: parsedFields.dietary,
          calories: parsedFields.calories,
          portion: parsedFields.portion,
          created_at: nowIso,
          updated_at: nowIso,
        };

        parsedRows.push({
          rowNumber,
          action: 'create',
          rawSku,
          rawBarcode,
          previewProduct: newProductPreview,
          parsedFields,
          providedStock: initialStock,
          previousStock: 0,
          nextStock: initialStock,
          stockDelta: initialStock,
          errors,
          warnings,
        });
      } else {
        parsedRows.push({
          rowNumber,
          action: 'error',
          rawSku,
          rawBarcode,
          parsedFields,
          providedStock,
          errors,
          warnings,
        });
      }
    }
  });

  const createCount = parsedRows.filter((r) => r.action === 'create').length;
  const updateCount = parsedRows.filter((r) => r.action === 'update').length;
  const errorCount = parsedRows.filter((r) => r.action === 'error').length;

  return {
    fileName,
    sheetName,
    detectedColumns,
    rows: parsedRows,
    totalRows: parsedRows.length,
    createCount,
    updateCount,
    errorCount,
    newCategories: Array.from(discoveredNewCategories.values()),
  };
}

export function applyBulkInventoryImport(params: {
  payload: BulkImportPayload;
  existingProducts: Product[];
  existingCategories: ProductCategory[];
  existingMovements: InventoryMovement[];
  cashierUsername: string;
}): BulkImportExecutionResult {
  const {
    payload,
    existingProducts,
    existingCategories,
    existingMovements,
    cashierUsername,
  } = params;

  const nowTs = Date.now();
  const nowIso = new Date(nowTs).toISOString();
  const defaultCategory = existingCategories[0]?.name || 'General';

  // Track categories & auto-create any new category referenced by valid rows
  const nextCategories = [...existingCategories];
  const categoryNameSet = new Set(
    nextCategories.map((c) => c.name.trim().toLowerCase())
  );
  let newCategoriesCount = 0;

  const ensureCategory = (categoryName: string) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (!categoryNameSet.has(key)) {
      categoryNameSet.add(key);
      newCategoriesCount += 1;
      nextCategories.push({
        id: `cat-bulk-${nowTs}-${newCategoriesCount}`,
        name: trimmed,
        color: CATEGORY_COLORS[(nextCategories.length + newCategoriesCount) % CATEGORY_COLORS.length],
        icon: 'folder',
        description: `Auto-created during bulk import (${payload.fileName})`,
        is_active: true,
        is_visible: true,
      });
    }
  };

  const productById = new Map<string, Product>();
  existingProducts.forEach((p) => productById.set(p.id, p));

  const createdProducts: Product[] = [];
  const newMovements: InventoryMovement[] = [];
  const lowStockProducts: Product[] = [];

  let createdCount = 0;
  let updatedCount = 0;

  payload.validRows.forEach((row, idx) => {
    if (row.action === 'create' && row.previewProduct) {
      const resolvedCategory = row.previewProduct.category || defaultCategory;
      ensureCategory(resolvedCategory);

      const created: Product = {
        id: `prod-${nowTs}-${idx}`,
        sku: row.previewProduct.sku,
        barcode: row.previewProduct.barcode || '',
        name: row.previewProduct.name,
        category: resolvedCategory,
        price: row.previewProduct.price,
        ...(row.previewProduct.cost_price !== undefined
          ? { cost_price: row.previewProduct.cost_price }
          : {}),
        tax_rate: row.previewProduct.tax_rate,
        stock_quantity: row.previewProduct.stock_quantity,
        reorder_level: row.previewProduct.reorder_level,
        is_active: row.previewProduct.is_active,
        ...(row.previewProduct.image_url ? { image_url: row.previewProduct.image_url } : {}),
        ...(row.previewProduct.image_preset
          ? { image_preset: row.previewProduct.image_preset }
          : {}),
        ...(row.previewProduct.tags ? { tags: row.previewProduct.tags } : {}),
        ...(row.previewProduct.dietary ? { dietary: row.previewProduct.dietary } : {}),
        ...(row.previewProduct.calories !== undefined
          ? { calories: row.previewProduct.calories }
          : {}),
        ...(row.previewProduct.portion ? { portion: row.previewProduct.portion } : {}),
        created_at: nowIso,
        updated_at: nowIso,
      };

      createdProducts.push(created);
      createdCount += 1;

      if (created.stock_quantity > 0) {
        newMovements.push({
          id: `mov-bulk-${nowTs}-${idx}`,
          product_id: created.id,
          product_name: created.name,
          sku: created.sku,
          change_quantity: created.stock_quantity,
          remaining_stock: created.stock_quantity,
          reason: 'Bulk CSV/Excel Import (New Product)',
          reference: payload.fileName,
          cashier_username: cashierUsername,
          created_at: nowIso,
        });
      }

      if (created.is_active && created.stock_quantity <= created.reorder_level) {
        lowStockProducts.push(created);
      }
    } else if (row.action === 'update' && row.matchedProduct) {
      const current = productById.get(row.matchedProduct.id) || row.matchedProduct;
      let nextStock = current.stock_quantity;

      if (row.providedStock !== undefined) {
        nextStock =
          payload.stockMode === 'set_stock'
            ? row.providedStock
            : Math.max(0, current.stock_quantity + row.providedStock);
      }

      const stockDelta = nextStock - current.stock_quantity;

      let updated: Product;
      if (payload.updateExistingDetails) {
        if (row.parsedFields.category) {
          ensureCategory(row.parsedFields.category);
        }
        updated = {
          ...current,
          ...row.parsedFields,
          id: current.id,
          sku: current.sku,
          stock_quantity: nextStock,
          created_at: current.created_at,
          updated_at: nowIso,
        };
      } else {
        updated = {
          ...current,
          stock_quantity: nextStock,
          updated_at: nowIso,
        };
      }

      productById.set(updated.id, updated);
      updatedCount += 1;

      if (stockDelta !== 0) {
        newMovements.push({
          id: `mov-bulk-${nowTs}-${idx}`,
          product_id: updated.id,
          product_name: updated.name,
          sku: updated.sku,
          change_quantity: stockDelta,
          remaining_stock: updated.stock_quantity,
          reason:
            payload.stockMode === 'set_stock'
              ? 'Bulk CSV/Excel Stock Count Set'
              : 'Bulk CSV/Excel Stock Restock',
          reference: payload.fileName,
          cashier_username: cashierUsername,
          created_at: nowIso,
        });
      }

      if (updated.is_active && updated.stock_quantity <= updated.reorder_level) {
        lowStockProducts.push(updated);
      }
    }
  });

  const mergedExisting = existingProducts.map((p) => productById.get(p.id) || p);
  const nextProducts = [...createdProducts, ...mergedExisting];
  const nextMovements = [...newMovements, ...existingMovements];

  return {
    products: nextProducts,
    categories: nextCategories,
    movements: nextMovements,
    createdCount,
    updatedCount,
    newCategoriesCount,
    lowStockProducts,
  };
}

function getTemplateSampleRows(existingProducts: Product[]): Record<string, string | number | boolean>[] {
  const sampleExisting = existingProducts[0];
  const rows: Record<string, string | number | boolean>[] = [];

  if (sampleExisting) {
    rows.push({
      sku: sampleExisting.sku,
      barcode: sampleExisting.barcode || '',
      name: sampleExisting.name,
      category: sampleExisting.category,
      price: sampleExisting.price,
      cost_price: sampleExisting.cost_price ?? Math.round(sampleExisting.price * 0.6),
      tax_rate: sampleExisting.tax_rate,
      stock_quantity: sampleExisting.stock_quantity + 25,
      reorder_level: sampleExisting.reorder_level,
      is_active: sampleExisting.is_active,
      dietary: sampleExisting.dietary || 'veg',
      calories: sampleExisting.calories ?? 220,
      portion: sampleExisting.portion || '1 Serving',
      tags: (sampleExisting.tags || []).join(', '),
      image_preset: sampleExisting.image_preset || 'breakfast',
      image_url: sampleExisting.image_url || '',
    });
  }

  rows.push(
    {
      sku: 'CAN-NEW-101',
      barcode: '8901234500101',
      name: 'Grilled Paneer Wrap',
      category: 'Healthy Meals',
      price: 85,
      cost_price: 48,
      tax_rate: 5,
      stock_quantity: 40,
      reorder_level: 10,
      is_active: true,
      dietary: 'veg',
      calories: 340,
      portion: '1 Wrap (220g)',
      tags: 'hot, protein, lunch',
      image_preset: 'sandwich',
      image_url: '',
    },
    {
      sku: 'CAN-NEW-102',
      barcode: '8901234500102',
      name: 'Fresh Watermelon Cooler',
      category: 'Beverages',
      price: 45,
      cost_price: 22,
      tax_rate: 5,
      stock_quantity: 60,
      reorder_level: 15,
      is_active: true,
      dietary: 'beverage',
      calories: 110,
      portion: '300 ml',
      tags: 'cold, fresh, summer',
      image_preset: 'juice',
      image_url: '',
    }
  );

  return rows;
}

export function downloadInventoryTemplateXLSX(existingProducts: Product[]): void {
  const sampleRows = getTemplateSampleRows(existingProducts);
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'InventoryImport');
  XLSX.writeFile(workbook, 'POS_Inventory_Bulk_Template.xlsx');
}

export function downloadInventoryTemplateCSV(existingProducts: Product[]): void {
  const sampleRows = getTemplateSampleRows(existingProducts);
  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'POS_Inventory_Bulk_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
