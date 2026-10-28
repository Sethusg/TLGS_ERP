import React, { useState, useMemo } from 'react';
import { Product, InventoryMovement, StoreSettings, ProductCategory } from '../types/pos';
import { formatCurrency, formatDateTime, exportInventoryToCSV } from '../utils/formatters';
import { ProductVisual } from './ProductVisual';
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  History,
  Download,
  Edit2,
  SlidersHorizontal,
  PackageCheck,
  PackageX,
  Layers,
  FolderPlus,
  Filter,
  Trash2,
  X,
  ImageOff,
  Eye,
  EyeOff,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  categories: ProductCategory[];
  movements: InventoryMovement[];
  settings: StoreSettings;
  onOpenAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onDeleteProductImage?: (productId: string) => void;
  onOpenAdjustStock: (product: Product) => void;
  onAddCategory: (category: ProductCategory) => void;
  onUpdateCategory: (category: ProductCategory, oldName?: string) => void;
  onDeleteCategory: (categoryId: string, reassignToCatName?: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  categories,
  movements,
  settings,
  onOpenAddProduct,
  onEditProduct,
  onDeleteProduct,
  onDeleteProductImage,
  onOpenAdjustStock,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'categories' | 'movements'>('catalogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [healthFilter, setHealthFilter] = useState<'All' | 'Low' | 'OutOfStock' | 'Healthy'>('All');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Category Edit state
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#f59e0b');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatIsActive, setEditCatIsActive] = useState(true);
  const [editCatIsVisible, setEditCatIsVisible] = useState(true);

  // Category Delete state
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [reassignCategoryName, setReassignCategoryName] = useState<string>('');

  const handleStartEditCategory = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatColor(cat.color || '#f59e0b');
    setEditCatDesc(cat.description || '');
    setEditCatIsActive(cat.is_active ?? true);
    setEditCatIsVisible(cat.is_visible ?? true);
  };

  const handleSaveEditedCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCatName.trim()) return;

    onUpdateCategory(
      {
        ...editingCategory,
        name: editCatName.trim(),
        color: editCatColor,
        description: editCatDesc.trim(),
        is_active: editCatIsActive,
        is_visible: editCatIsVisible,
      },
      editingCategory.name
    );
    setEditingCategory(null);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    onDeleteCategory(categoryToDelete.id, reassignCategoryName);
    setCategoryToDelete(null);
  };

  // New Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#f59e0b');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Aggregate Metrics
  const totalSKUs = products.length;
  const totalUnits = products.reduce((acc, p) => acc + p.stock_quantity, 0);
  const lowStockItems = products.filter(
    (p) => p.is_active && p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level
  );
  const outOfStockItems = products.filter((p) => p.is_active && p.stock_quantity <= 0);
  const totalInventoryValuation = products.reduce(
    (acc, p) => acc + p.price * p.stock_quantity,
    0
  );

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));

      let matchHealth = true;
      if (healthFilter === 'Low') {
        matchHealth = p.stock_quantity > 0 && p.stock_quantity <= p.reorder_level;
      } else if (healthFilter === 'OutOfStock') {
        matchHealth = p.stock_quantity <= 0;
      } else if (healthFilter === 'Healthy') {
        matchHealth = p.stock_quantity > p.reorder_level;
      }

      return matchCat && matchQuery && matchHealth;
    });
  }, [products, searchQuery, categoryFilter, healthFilter]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      color: newCatColor,
      icon: 'folder',
      description: newCatDesc,
    });
    setNewCatName('');
    setNewCatDesc('');
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Real-Time Inventory Control</h2>
          <p className="text-xs text-neutral-400">
            Categorize products, monitor real-time stock levels, record manual adjustments, and export valuations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => exportInventoryToCSV(products)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Catalogue SKUs</span>
            <Boxes className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {totalSKUs}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Across {categories.length} organized categories
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Physical Stock Units</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {totalUnits.toLocaleString()}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Total units on shelves</span>
        </div>

        <div
          onClick={() => setHealthFilter(healthFilter === 'Low' ? 'All' : 'Low')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm ${
            lowStockItems.length > 0
              ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1.5 tabular-nums">
            {lowStockItems.length}
          </p>
          <span className="text-[11px] text-amber-400/80 mt-1 block">
            {lowStockItems.length > 0 ? 'Click to filter low stock' : 'All items well stocked'}
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Stock Retail Valuation</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(totalInventoryValuation, settings.currency_symbol)}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Total inventory cost value</span>
        </div>
      </div>

      {/* Tabs Switcher: Catalogue vs Categories vs Movements */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('catalogue')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'catalogue'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Product Catalogue ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Manage Categories ({categories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'movements'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Movement Audit Log ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCT CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          {/* Advanced Categorization & Health Filtering Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, name, tags, or barcode..."
                className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 py-1.5 px-3 rounded-xl focus:outline-none focus:border-amber-500 font-semibold"
              >
                <option value="All">All Categories ({products.length})</option>
                {categories.map((c) => {
                  const count = products.filter((p) => p.category === c.name).length;
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Health selector */}
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as any)}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 py-1.5 px-3 rounded-xl focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Stock Levels</option>
                <option value="Healthy">Healthy Stock</option>
                <option value="Low">Low Stock Warnings</option>
                <option value="OutOfStock">Out of Stock Only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Item & Visual</th>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-center">Tax %</th>
                    <th className="py-3 px-4 text-center">Stock Level</th>
                    <th className="py-3 px-4 text-center">Reorder Limit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-500">
                        No products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => {
                      const isOutOfStock = prod.stock_quantity <= 0;
                      const isLowStock = prod.stock_quantity <= prod.reorder_level && !isOutOfStock;

                      return (
                        <tr key={prod.id} className="hover:bg-neutral-850 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative group w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                                <ProductVisual
                                  name={prod.name}
                                  category={prod.category}
                                  preset={prod.image_preset}
                                  imageUrl={prod.image_url}
                                  aspectRatio="thumb"
                                  className="w-10 h-10"
                                />
                                {prod.image_url && onDeleteProductImage && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteProductImage(prod.id);
                                    }}
                                    className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 hover:text-red-300 transition-opacity cursor-pointer"
                                    title="Quick delete uploaded image"
                                  >
                                    <ImageOff className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-neutral-100">{prod.name}</span>
                                {prod.tags && prod.tags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {prod.tags.slice(0, 2).map((t) => (
                                      <span
                                        key={t}
                                        className="text-[9px] font-mono text-neutral-400 px-1 py-0.1 bg-neutral-950 rounded border border-neutral-800"
                                      >
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <span className="font-semibold text-neutral-200">{prod.sku}</span>
                            {prod.barcode && (
                              <span className="block text-[10px] text-neutral-500">{prod.barcode}</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-neutral-400">
                            <span className="px-2.5 py-0.5 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-semibold text-neutral-300">
                              {prod.category}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 tabular-nums">
                            {formatCurrency(prod.price, settings.currency_symbol)}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-neutral-400 tabular-nums">
                            {prod.tax_rate}%
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`text-xs font-bold font-mono px-2 py-0.5 rounded tabular-nums ${
                                isOutOfStock
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : isLowStock
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {prod.stock_quantity} units
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-neutral-400 tabular-nums">
                            {prod.reorder_level}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenAdjustStock(prod)}
                                className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Adjust inventory count with reason"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Adjust</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onEditProduct(prod)}
                                className="px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Edit product details & manage images"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setProductToDelete(prod)}
                                className="px-2.5 py-1 text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Delete sales item from inventory"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-white">Product Categories</h3>
              <p className="text-xs text-neutral-400">
                Organize menu items, products, and merchandising departments
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-neutral-950 bg-amber-500 rounded-xl"
            >
              + Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => {
              const items = products.filter((p) => p.category === c.name);
              const totalVal = items.reduce((acc, p) => acc + p.price * p.stock_quantity, 0);
              const isActive = c.is_active !== false;
              const isVisible = c.is_visible !== false;

              return (
                <div
                  key={c.id}
                  className={`bg-neutral-900 border p-5 rounded-2xl space-y-3.5 shadow-sm transition-all ${
                    !isActive
                      ? 'border-red-900/40 bg-neutral-900/60 opacity-80'
                      : 'border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: c.color }}
                      />
                      <div>
                        <h4 className="font-bold text-sm text-neutral-100 flex items-center gap-2">
                          <span>{c.name}</span>
                          {!isActive && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                              DISABLED
                            </span>
                          )}
                          {!isVisible && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                              HIDDEN ON POS
                            </span>
                          )}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {items.length} products assigned
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                      {formatCurrency(totalVal, settings.currency_symbol)}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 min-h-[32px] line-clamp-2">
                    {c.description || 'Department category for merchandising and sales.'}
                  </p>

                  {/* Status Badges Row */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      <span>{isActive ? 'Active for Sales' : 'Disabled from Sales'}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                        isVisible
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isVisible ? 'Visible on POS' : 'Hidden on POS'}</span>
                    </span>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-1.5">
                    {/* Visibility toggle button */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCategory({
                          ...c,
                          is_visible: !isVisible,
                        })
                      }
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                        isVisible
                          ? 'bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700'
                      }`}
                      title={isVisible ? 'Click to hide category from POS filter' : 'Click to show category on POS filter'}
                    >
                      {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{isVisible ? 'Hide' : 'Show'}</span>
                    </button>

                    {/* Active/Disable toggle button */}
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateCategory({
                          ...c,
                          is_active: !isActive,
                        })
                      }
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                      }`}
                      title={isActive ? 'Click to disable category (blocks items from sale)' : 'Click to enable category'}
                    >
                      {isActive ? <Ban className="w-3 h-3 text-red-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      <span>{isActive ? 'Disable' : 'Enable'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleStartEditCategory(c)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg flex items-center gap-1 border border-neutral-700/80 transition-colors cursor-pointer"
                        title="Edit category name and settings"
                      >
                        <Edit2 className="w-3 h-3 text-amber-400" />
                        <span>Edit</span>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryToDelete(c);
                          const remaining = categories.filter((other) => other.id !== c.id);
                          setReassignCategoryName(remaining[0]?.name || 'General');
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENT AUDIT LOG */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-neutral-800 bg-neutral-950/60">
              <h3 className="text-sm font-bold text-white">Stock Movement Audit Ledger</h3>
              <p className="text-xs text-neutral-400">
                Immutable record of sales deductions, supplier deliveries, write-offs, and physical counts.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4 text-center">Change Qty</th>
                    <th className="py-3 px-4 text-center">Remaining</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Staff / Cashier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {movements.map((mov) => {
                    const isPositive = mov.change_quantity > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-neutral-850 transition-colors">
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {formatDateTime(mov.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-neutral-100">{mov.product_name}</span>
                          <span className="block font-mono text-[10px] text-neutral-500">{mov.sku}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              isPositive
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {isPositive ? `+${mov.change_quantity}` : mov.change_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-neutral-300 tabular-nums">
                          {mov.remaining_stock}
                        </td>
                        <td className="py-3 px-4 text-neutral-200">{mov.reason}</td>
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {mov.reference || '—'}
                        </td>
                        <td className="py-3 px-4 text-neutral-400">{mov.cashier_username}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCategoryModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New Product Category</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Specials or Merch"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-10 h-8 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Seasonal limited release items"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 font-bold text-neutral-950 rounded-lg shadow"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Sales Item Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold tracking-wider">
                    Inventory Deletion
                  </span>
                  <button
                    type="button"
                    onClick={() => setProductToDelete(null)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">
                  Delete Sales Item?
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Are you sure you want to permanently delete this item from THE GSR SALES TERMINAL inventory?
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Item Name:</span>
                <span className="font-semibold text-neutral-100">{productToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">SKU Code:</span>
                <span className="font-mono text-neutral-200">{productToDelete.sku}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Category:</span>
                <span className="text-neutral-200">{productToDelete.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Current Stock:</span>
                <span className="font-mono font-bold text-amber-400">{productToDelete.stock_quantity} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Unit Price:</span>
                <span className="font-mono text-neutral-200">
                  {formatCurrency(productToDelete.price, settings.currency_symbol)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-red-400/90 mt-3 font-medium">
              Warning: This item will be removed from POS checkout, inventory valuation, and active carts immediately.
            </p>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete Item</span>
              </button>
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {editingCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCategory(null);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Product Category</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Color Palette Swatch</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editCatColor}
                    onChange={(e) => setEditCatColor(e.target.value)}
                    className="w-10 h-8 rounded bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editCatColor}
                    onChange={(e) => setEditCatColor(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-2 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editCatDesc}
                  onChange={(e) => setEditCatDesc(e.target.value)}
                  placeholder="Department details, merchandising notes..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Toggles: Active & Visible */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-semibold text-neutral-200 block">Category Enabled (Active)</span>
                    <span className="text-[10px] text-neutral-400">
                      When enabled, products in this category can be sold at POS checkout.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={editCatIsActive}
                    onChange={(e) => setEditCatIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                  />
                </label>

                <div className="border-t border-neutral-850 pt-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="font-semibold text-neutral-200 block">Visible on POS Filter Strip</span>
                      <span className="text-[10px] text-neutral-400">
                        When enabled, displays as a selectable tab filter on the cashier checkout screen.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editCatIsVisible}
                      onChange={(e) => setEditCatIsVisible(e.target.checked)}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 font-bold text-neutral-950 rounded-xl shadow cursor-pointer"
                >
                  Save Category Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCategoryToDelete(null);
          }}
        >
          <div className="bg-neutral-900 border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold tracking-wider">
                  Category Deletion
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  Delete Category: {categoryToDelete.name}?
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Are you sure you want to remove this category from the store catalogue?
                </p>
              </div>
            </div>

            {/* Products reassignment box */}
            {(() => {
              const assignedCount = products.filter((p) => p.category === categoryToDelete.name).length;
              const remainingCats = categories.filter((c) => c.id !== categoryToDelete.id);

              return (
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span>Products currently in this category:</span>
                    <span className="font-bold font-mono text-amber-400">{assignedCount} items</span>
                  </div>

                  {assignedCount > 0 && (
                    <div className="pt-2 border-t border-neutral-850 space-y-1.5">
                      <label className="block text-neutral-400 text-[11px] font-medium">
                        Reassign these {assignedCount} products to category:
                      </label>
                      <select
                        value={reassignCategoryName}
                        onChange={(e) => setReassignCategoryName(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-750 text-white rounded-lg p-2 text-xs font-semibold focus:outline-none"
                      >
                        {remainingCats.map((other) => (
                          <option key={other.id} value={other.name}>
                            {other.name}
                          </option>
                        ))}
                        <option value="General">General (Uncategorized)</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete Category</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
