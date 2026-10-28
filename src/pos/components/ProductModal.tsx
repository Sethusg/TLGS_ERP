import React, { useState } from 'react';
import { Product, ProductCategory } from '../types/pos';
import { ImageUploader } from './ImageUploader';
import { Boxes, X, Save, Sparkles, Tag, DollarSign, Trash2, AlertTriangle } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  categories: ProductCategory[];
  currencySymbol: string;
  onSave: (productData: Partial<Product>) => void;
  onDeleteProduct?: (productId: string) => void;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categories,
  currencySymbol,
  onSave,
  onDeleteProduct,
  onClose,
}) => {
  const [sku, setSku] = useState(product?.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || categories[0]?.name || 'Breakfast & Recess');
  const [dietary, setDietary] = useState<Product['dietary']>(product?.dietary || 'veg');
  const [calories, setCalories] = useState<number | ''>(product?.calories ?? '');
  const [portion, setPortion] = useState<string>(product?.portion || '');
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [costPrice, setCostPrice] = useState<number>(product?.cost_price || 0);
  const [taxRate, setTaxRate] = useState<number>(product?.tax_rate || 5);
  const [stockQuantity, setStockQuantity] = useState<number>(product?.stock_quantity || 15);
  const [reorderLevel, setReorderLevel] = useState<number>(product?.reorder_level || 5);
  const [isActive, setIsActive] = useState<boolean>(product?.is_active ?? true);

  // Image & Visual Customizer state
  const [imagePreset, setImagePreset] = useState<string>(product?.image_preset || 'breakfast');
  const [imageUrl, setImageUrl] = useState<string>(product?.image_url || '');
  const [promptText, setPromptText] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>(product?.tags?.join(', ') || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Estimated gross margin
  const profitMargin = price > 0 ? (((price - costPrice) / price) * 100).toFixed(0) : '0';

  // Apply visual preset based on prompt
  const handleApplyPrompt = () => {
    if (!promptText.trim()) return;
    const p = promptText.toLowerCase();
    if (p.includes('burger') || p.includes('sandwich') || p.includes('food') || p.includes('wrap')) {
      setImagePreset('sandwich');
      setCategory('Sandwiches & Wraps');
    } else if (p.includes('fruit') || p.includes('salad') || p.includes('sprout')) {
      setImagePreset('fruit');
      setCategory('Nutri-Bowls & Fruits');
    } else if (p.includes('thali') || p.includes('biryani') || p.includes('rice') || p.includes('paneer')) {
      setImagePreset('thali');
      setCategory('Hot Lunch Meals');
    } else if (p.includes('idli') || p.includes('dosa') || p.includes('poha') || p.includes('breakfast')) {
      setImagePreset('breakfast');
      setCategory('Breakfast & Recess');
    } else if (p.includes('croissant') || p.includes('bread') || p.includes('muffin') || p.includes('samosa')) {
      setImagePreset('snack');
      setCategory('Bakery & Snacks');
    } else if (p.includes('milk') || p.includes('shake') || p.includes('juice') || p.includes('tea')) {
      setImagePreset('milk');
      setCategory('Shakes & Milk');
    } else {
      setImagePreset('retail');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      sku,
      barcode,
      name,
      category,
      dietary,
      calories: calories !== '' ? Math.max(0, Number(calories)) : undefined,
      portion: portion.trim() || undefined,
      price: Math.max(0, price),
      cost_price: Math.max(0, costPrice),
      tax_rate: Math.max(0, taxRate),
      stock_quantity: Math.max(0, stockQuantity),
      reorder_level: Math.max(0, reorderLevel),
      is_active: isActive,
      image_preset: imagePreset,
      image_url: imageUrl.trim() || undefined,
      tags: parsedTags,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {product ? 'Edit Catalogue Item & Visuals' : 'Add New Item & Create Visual'}
              </h3>
              <p className="text-xs text-neutral-400">
                {product
                  ? 'Update categorization, pricing, stock levels and product imagery'
                  : 'Register a product into THE GSR SALES TERMINAL inventory'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs">
          {/* Visual Image Uploader with Auto-Compression & Deletion */}
          <ImageUploader
            productName={name}
            category={category}
            imageUrl={imageUrl}
            imagePreset={imagePreset}
            onImageChange={(newUrl) => setImageUrl(newUrl)}
            onImageDelete={() => setImageUrl('')}
            onPresetChange={(newPreset) => setImagePreset(newPreset)}
          />

          {/* Identification Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Barcode / EAN</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">Product Title</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. South Indian Filter Coffee (Special Roast)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Categorization & Financials */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Product Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Selling Price ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Cost Price ({currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                Margin: {profitMargin}%
              </span>
            </div>
          </div>

          {/* Canteen Dietary & Nutrition */}
          <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              School Canteen Dietary & Serving Info
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Dietary Marker</label>
                <select
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="veg">Vegetarian (Green Dot)</option>
                  <option value="non-veg">Non-Veg / Egg (Red Dot)</option>
                  <option value="healthy">Healthy / Nutri-Pick</option>
                  <option value="beverage">Drink / Beverage</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Energy (Calories)</label>
                <input
                  type="number"
                  step="1"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="e.g. 180 kcal"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Portion Description</label>
                <input
                  type="text"
                  value={portion}
                  onChange={(e) => setPortion(e.target.value)}
                  placeholder="e.g. 2 pcs with sambar"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Inventory & Tax */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Stock Quantity</label>
              <input
                type="number"
                step="1"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Reorder Alert Level</label>
              <input
                type="number"
                step="1"
                required
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Search Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Bestseller, Chef Special, Sugar-Free, Hot"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Active status */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded bg-neutral-950 border-neutral-800 text-amber-500 focus:ring-0"
              />
              <span>Item is active and available for sale at cashier checkout</span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              {product && onDeleteProduct && !isConfirmingDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3.5 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete sales item from inventory"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Sales Item</span>
                </button>
              )}

              {isConfirmingDelete && product && onDeleteProduct && (
                <div className="flex items-center gap-2 p-1.5 bg-red-950/40 border border-red-500/40 rounded-xl">
                  <span className="text-[11px] text-red-300 font-semibold pl-1">
                    Delete item permanently?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteProduct(product.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white bg-neutral-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{product ? 'Update Item' : 'Add to Inventory'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
