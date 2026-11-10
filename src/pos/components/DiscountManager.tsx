import React, { useState } from 'react';
import { DiscountRule, DiscountConditionType, StoreSettings } from '../types/pos';
import { formatCurrency } from '../utils/formatters';
import { Tag, Plus, Trash2, Edit3, CheckCircle2, XCircle, Clock, Users, Boxes, Sparkles, X, Save } from 'lucide-react';

interface DiscountManagerProps {
  rules: DiscountRule[];
  onSaveRule: (rule: DiscountRule) => void;
  onDeleteRule: (id: string) => void;
  settings: StoreSettings;
}

export const DiscountManager: React.FC<DiscountManagerProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  settings,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(10);
  const [conditionType, setConditionType] = useState<DiscountConditionType>('general');
  const [conditionValue, setConditionValue] = useState('');
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [minPurchaseAmount, setMinPurchaseAmount] = useState<number>(0);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [isActive, setIsActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setTitle('');
    setCode(`DISC_${Math.floor(Math.random() * 9000 + 1000)}`);
    setType('percentage');
    setValue(10);
    setConditionType('general');
    setConditionValue('');
    setMinQuantity(1);
    setMinPurchaseAmount(0);
    setStartTime('14:00');
    setEndTime('17:00');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DiscountRule) => {
    setEditingRule(rule);
    setTitle(rule.title);
    setCode(rule.code);
    setType(rule.type);
    setValue(rule.value);
    setConditionType(rule.condition_type);
    setConditionValue(rule.condition_value || '');
    setMinQuantity(rule.min_quantity || 1);
    setMinPurchaseAmount(rule.min_purchase_amount || 0);
    setStartTime(rule.start_time || '14:00');
    setEndTime(rule.end_time || '17:00');
    setIsActive(rule.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) return;

    const newRule: DiscountRule = {
      id: editingRule ? editingRule.id : `disc-${Date.now()}`,
      title,
      code: code.toUpperCase().trim(),
      type,
      value: Number(value) || 0,
      condition_type: conditionType,
      condition_value: conditionValue.trim() || undefined,
      min_quantity: conditionType === 'bulk_volume' ? Number(minQuantity) || 1 : undefined,
      min_purchase_amount: minPurchaseAmount > 0 ? Number(minPurchaseAmount) : undefined,
      start_time: conditionType === 'time_of_day' ? startTime : undefined,
      end_time: conditionType === 'time_of_day' ? endTime : undefined,
      is_active: isActive,
      created_at: editingRule ? editingRule.created_at : new Date().toISOString(),
    };

    onSaveRule(newRule);
    setIsModalOpen(false);
  };

  const filteredRules = rules.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.condition_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-6 animate-fade-in text-xs">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Canteen Discount Manager</h2>
            <p className="text-xs text-neutral-400">
              Configure dynamic percentage and fixed discounts for Happy Hours, Student Categories, and Bulk Volume
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search discount rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500 w-full sm:w-64"
          />
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRules.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-neutral-900/60 border border-neutral-800 rounded-2xl text-neutral-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-400" />
            <p className="text-sm font-semibold text-neutral-200">No discount rules found</p>
            <p className="text-xs text-neutral-500 mt-1">Create your first custom discount rule to get started</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-neutral-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                rule.is_active ? 'border-neutral-800 hover:border-amber-500/40' : 'border-neutral-800/40 opacity-60'
              }`}
            >
              {/* Top Row: Title & Status */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-bold tracking-wider">
                      {rule.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{rule.title}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      rule.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    {rule.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{rule.is_active ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>

                {/* Value Banner */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                  <span className="text-neutral-400 font-medium">Discount Value</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {rule.type === 'percentage' ? `${rule.value}% OFF` : formatCurrency(rule.value, settings.currency_symbol) + ' OFF'}
                  </span>
                </div>

                {/* Conditions Breakdown */}
                <div className="space-y-1.5 pt-1 text-[11px] text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-semibold w-24">Condition:</span>
                    <span className="capitalize text-amber-300 font-medium">
                      {rule.condition_type.replace('_', ' ')}
                    </span>
                  </div>

                  {rule.condition_value && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold w-24">Target Value:</span>
                      <span className="font-mono text-neutral-200">{rule.condition_value}</span>
                    </div>
                  )}

                  {rule.condition_type === 'time_of_day' && rule.start_time && rule.end_time && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold w-24">Happy Hour:</span>
                      <span className="font-mono text-cyan-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rule.start_time} - {rule.end_time}
                      </span>
                    </div>
                  )}

                  {rule.condition_type === 'bulk_volume' && rule.min_quantity && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500 font-semibold w-24">Min Quantity:</span>
                      <span className="font-mono text-purple-400 flex items-center gap-1">
                        <Boxes className="w-3 h-3" />
                        {rule.min_quantity} items
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rule)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete discount rule "${rule.title}"?`)) {
                      onDeleteRule(rule.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {editingRule ? 'Edit Discount Rule' : 'Create Custom Discount Rule'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Rule Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Afternoon Snack Happy Hour"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Discount Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. HAPPY_HOUR_15"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ({settings.currency_symbol})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">
                    {type === 'percentage' ? 'Percentage Value (%)' : `Fixed Amount (${settings.currency_symbol})`}
                  </label>
                  <input
                    type="number"
                    step={type === 'percentage' ? '1' : '5'}
                    required
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Condition Trigger Type</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as DiscountConditionType)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="general">General / Always Available Voucher</option>
                  <option value="student_category">Student / Staff Category (e.g. staff, student)</option>
                  <option value="time_of_day">Time of Day / Happy Hour (e.g. 14:00 - 17:00)</option>
                  <option value="bulk_volume">Bulk Purchase Volume (Min Item Count)</option>
                  <option value="category">Product Category (e.g. Beverages, Hot Lunch)</option>
                </select>
              </div>

              {conditionType === 'student_category' && (
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Target Account Type / Category</label>
                  <select
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff / Faculty</option>
                    <option value="visitor">Visitor / Guest</option>
                  </select>
                </div>
              )}

              {conditionType === 'category' && (
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Product Category Name</label>
                  <input
                    type="text"
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    placeholder="e.g. Beverages, Bakery & Snacks"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {conditionType === 'time_of_day' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1 font-semibold">Start Time (24h)</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-cyan-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 text-[11px] mb-1 font-semibold">End Time (24h)</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-cyan-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {conditionType === 'bulk_volume' && (
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Minimum Cart Item Quantity</label>
                  <input
                    type="number"
                    min="2"
                    value={minQuantity}
                    onChange={(e) => setMinQuantity(parseInt(e.target.value) || 2)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-purple-400 font-mono font-bold focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-neutral-950 border-neutral-700"
                  />
                  <span className="font-semibold text-white">Enable this discount rule immediately</span>
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingRule ? 'Save Changes' : 'Create Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
