import React, { useState } from 'react';
import {
  Boxes,
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileDown,
  ShoppingBag,
} from 'lucide-react';
import { SchoolAsset } from '../types';

interface AssetSuppliesProps {
  assets: SchoolAsset[];
  subItem?: string;
  onAddAsset: (asset: Omit<SchoolAsset, 'id'>) => void;
}

export const AssetSuppliesModule: React.FC<AssetSuppliesProps> = ({
  assets,
  subItem = 'asset-view',
  onAddAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'assets' | 'supplies' | 'billing' | 'add'>(() => {
    if (subItem?.startsWith('supplies-billing')) return 'billing';
    if (subItem?.startsWith('supplies')) return 'supplies';
    if (subItem === 'asset-add') return 'add';
    return 'assets';
  });

  const [assetSearch, setAssetSearch] = useState('');

  // Add Asset Form
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<SchoolAsset['category']>('IT Hardware');
  const [assetLocation, setAssetLocation] = useState('Senior Computer Lab 1');
  const [assetCost, setAssetCost] = useState(45000);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName) return;

    onAddAsset({
      assetCode: `AST-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: assetName,
      category: assetCategory,
      location: assetLocation,
      purchaseDate: '2026-10-23',
      cost: assetCost,
      condition: 'Excellent',
      assignedTo: 'Department Incharge',
    });

    setAssetName('');
    setActiveTab('assets');
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(assetSearch.toLowerCase()) ||
      a.category.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#1976d2]" />
            <span>Institutional Asset & Supplies Inventory Store</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Lab Equipment · IT Smartboards & Terminals · Textbook & Uniform Bookstore Billing
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'assets' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fixed Assets ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('supplies')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'supplies' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Store Supplies & Stock
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'billing' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Store POS Billing
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-md transition-colors shadow-2xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* VIEW: FIXED ASSETS */}
      {activeTab === 'assets' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search assets by code, name, location..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1976d2]"
              />
            </div>
            <span className="text-xs text-gray-500">
              Total Asset Valuation: <strong>₹48,20,000</strong>
            </span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Asset Code</th>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 font-mono text-right">Cost (₹)</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Assigned Incharge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAssets.map((ast) => (
                  <tr key={ast.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{ast.assetCode}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{ast.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium text-[10px]">
                        {ast.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{ast.location}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900 text-right">
                      ₹{ast.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                        {ast.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ast.assignedTo || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: STORE SUPPLIES & STOCK */}
      {activeTab === 'supplies' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Bookstore & School Supplies Inventory</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { category: 'CBSE Textbooks & Workbooks', inStock: '2,450 Units', reorderAlert: false },
              { category: 'School Uniform Sets (Summer & Winter)', inStock: '840 Sets', reorderAlert: false },
              { category: 'Student Diaries & Notebook Sets', inStock: '180 Sets (Low Stock)', reorderAlert: true },
              { category: 'Art & Craft Materials Kits', inStock: '520 Kits', reorderAlert: false },
              { category: 'Sports Jerseys & Badminton Rackets', inStock: '310 Units', reorderAlert: false },
              { category: 'Identity Card Lanyards & Badges', inStock: '1,200 Units', reorderAlert: false },
            ].map((sup, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Category #{i + 1}</span>
                <h4 className="font-bold text-xs text-gray-900">{sup.category}</h4>
                <p className={`text-xs font-semibold ${sup.reorderAlert ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {sup.inStock}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: STORE POS BILLING */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-2xl mx-auto space-y-4">
          <h3 className="text-base font-bold text-gray-900">Student Supplies & Kit Billing Counter</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Supplies billing order recorded and POS invoice generated.');
            }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Student Admission No *</label>
              <input
                type="text"
                placeholder="e.g. TLA-2022-0482 (Aarav Sharma)"
                required
                className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Item Bundle</label>
                <select className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none">
                  <option>Grade 10 Full Textbook & Notebook Kit (₹4,200)</option>
                  <option>School Uniform Pair Set (₹2,100)</option>
                  <option>Physical Education Sports Tracksuit (₹1,450)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Payment Method</label>
                <select className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none">
                  <option>UPI / QR Scan</option>
                  <option>Card POS</option>
                  <option>Cash</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-[#1976d2] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs mt-2"
            >
              Generate Store Invoice & Deliver
            </button>
          </form>
        </div>
      )}

      {/* VIEW: ADD ASSET */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-xl mx-auto space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Register New Institutional Asset</h3>
            <p className="text-xs text-gray-500">Record asset code and location mapping</p>
          </div>

          <form onSubmit={handleCreateAsset} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Asset Name *</label>
              <input
                type="text"
                required
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="e.g. Sony Laser Projector 5000 Lumens"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                <select
                  value={assetCategory}
                  onChange={(e) => setAssetCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                >
                  <option value="IT Hardware">IT Hardware</option>
                  <option value="Audio/Visual">Audio/Visual</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Sports">Sports</option>
                  <option value="Classroom Furniture">Classroom Furniture</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Purchase Cost (₹)</label>
                <input
                  type="number"
                  value={assetCost}
                  onChange={(e) => setAssetCost(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Location Room / Lab</label>
              <input
                type="text"
                value={assetLocation}
                onChange={(e) => setAssetLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('assets')}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#1976d2] hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Save Asset Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
