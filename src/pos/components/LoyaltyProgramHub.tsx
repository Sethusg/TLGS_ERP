import React, { useState } from 'react';
import {
  Customer,
  LoyaltyReward,
  LoyaltyTransaction,
  StoreSettings,
} from '../types/pos';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  Award,
  Gift,
  Sparkles,
  TrendingUp,
  QrCode,
  Users,
  CheckCircle2,
  ArrowRight,
  Plus,
  Percent,
  Clock,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface LoyaltyProgramHubProps {
  customers: Customer[];
  rewards: LoyaltyReward[];
  transactions: LoyaltyTransaction[];
  settings: StoreSettings;
  onRedeemReward: (customer: Customer, reward: LoyaltyReward) => void;
  onAddNewReward: (reward: Partial<LoyaltyReward>) => void;
  onOpenCustomerModal: () => void;
}

export const LoyaltyProgramHub: React.FC<LoyaltyProgramHubProps> = ({
  customers,
  rewards,
  transactions,
  settings,
  onRedeemReward,
  onAddNewReward,
  onOpenCustomerModal,
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'tiers' | 'card-pass' | 'ledger'>('rewards');
  const [selectedCustomerForPass, setSelectedCustomerForPass] = useState<Customer>(customers[0]);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [redeemSuccessMessage, setRedeemSuccessMessage] = useState<string | null>(null);

  // New reward form state
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(100);
  const [newDiscount, setNewDiscount] = useState(50);
  const [newCategory, setNewCategory] = useState('Discount');
  const [newDesc, setNewDesc] = useState('');

  // Tiers calculation
  const bronzeMembers = customers.filter((c) => c.tier === 'Bronze').length;
  const silverMembers = customers.filter((c) => c.tier === 'Silver').length;
  const goldMembers = customers.filter((c) => c.tier === 'Gold').length;
  const platinumMembers = customers.filter((c) => c.tier === 'Platinum').length;
  const totalPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0);

  // Progress to next tier calculation
  const getNextTierInfo = (customer: Customer) => {
    if (customer.tier === 'Platinum') {
      return { nextTier: 'Max Tier', needed: 0, percent: 100 };
    }
    if (customer.tier === 'Gold') {
      const needed = Math.max(0, 10000 - customer.total_spent);
      const percent = Math.min(100, Math.round(((customer.total_spent - 4000) / 6000) * 100));
      return { nextTier: 'Platinum', needed, percent };
    }
    if (customer.tier === 'Silver') {
      const needed = Math.max(0, 4000 - customer.total_spent);
      const percent = Math.min(100, Math.round(((customer.total_spent - 1500) / 2500) * 100));
      return { nextTier: 'Gold', needed, percent };
    }
    // Bronze
    const needed = Math.max(0, 1500 - customer.total_spent);
    const percent = Math.min(100, Math.round((customer.total_spent / 1500) * 100));
    return { nextTier: 'Silver', needed, percent };
  };

  const passProgress = getNextTierInfo(selectedCustomerForPass);

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddNewReward({
      id: `rew-${Date.now()}`,
      title: newTitle,
      pointsCost: newPoints,
      discountAmount: newDiscount,
      category: newCategory,
      description: newDesc || `${newTitle} for loyalty members`,
    });
    setNewTitle('');
    setNewDesc('');
    setIsRewardModalOpen(false);
  };

  const handleQuickRedeem = (reward: LoyaltyReward) => {
    if (!selectedCustomerForPass) return;
    if (selectedCustomerForPass.loyalty_points < reward.pointsCost) {
      alert(`${selectedCustomerForPass.name} has only ${selectedCustomerForPass.loyalty_points} points (needs ${reward.pointsCost}).`);
      return;
    }
    onRedeemReward(selectedCustomerForPass, reward);
    setRedeemSuccessMessage(
      `Successfully redeemed "${reward.title}" for ${selectedCustomerForPass.name}! Deducted ${reward.pointsCost} points.`
    );
    setTimeout(() => setRedeemSuccessMessage(null), 4000);
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Retention & Growth</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">GSR Loyalty Rewards Program</h2>
          <p className="text-xs text-neutral-400">
            Points-based rewards system: customers earn points on every order, redeemable for discounts and perks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsRewardModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Reward Perk</span>
          </button>

          <button
            type="button"
            onClick={onOpenCustomerModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-colors shadow"
          >
            <Users className="w-4 h-4" />
            <span>Enroll Customer</span>
          </button>
        </div>
      </div>

      {redeemSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{redeemSuccessMessage}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Points in Circulation</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1.5 tabular-nums">
            {totalPoints.toLocaleString()} pts
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Worth {formatCurrency(totalPoints * settings.loyalty_redemption_rate, settings.currency_symbol)} in discounts
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">VIP Members (Gold/Plat)</span>
            <Star className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1.5 tabular-nums">
            {goldMembers + platinumMembers} members
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">High-frequency repeat patrons</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Redeemable Rewards</span>
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1.5 tabular-nums">
            {rewards.length} perks
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Discount vouchers & menu items</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Points Earning Formula</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold font-mono text-white mt-1.5 tabular-nums">
            1 pt / {settings.currency_symbol}{settings.loyalty_points_per_currency}
          </p>
          <span className="text-[11px] text-neutral-500 mt-1 block">Tier multipliers up to 2.0x</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'rewards'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Reward Perks Catalog ({rewards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('card-pass')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'card-pass'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Digital Member Card & Pass</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tiers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'tiers'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Loyalty Tier Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'ledger'
              ? 'bg-amber-500 text-neutral-950 font-bold shadow'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Points Audit Ledger</span>
        </button>
      </div>

      {/* TAB 1: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Customer for Instant Redemption:</span>
              <select
                value={selectedCustomerForPass.id}
                onChange={(e) => {
                  const c = customers.find((cust) => cust.id === e.target.value);
                  if (c) setSelectedCustomerForPass(c);
                }}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-amber-500 font-semibold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.loyalty_points} pts ({c.tier})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-amber-400 font-mono">
              Available: <b>{selectedCustomerForPass.loyalty_points} pts</b>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = selectedCustomerForPass.loyalty_points >= reward.pointsCost;
              return (
                <div
                  key={reward.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-950 border border-neutral-800 text-amber-400 font-semibold">
                        {reward.category}
                      </span>
                      {reward.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                          {reward.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-neutral-100 mt-2.5">{reward.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{reward.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-800/80">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-amber-400 text-base">
                        {reward.pointsCost} points
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        Saves {formatCurrency(reward.discountAmount, settings.currency_symbol)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleQuickRedeem(reward)}
                      className="w-full py-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 disabled:opacity-40 disabled:hover:bg-neutral-800 disabled:hover:text-neutral-400 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>{canAfford ? 'Redeem for Customer' : 'Insufficient Points'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL MEMBER CARD & PASS */}
      {activeTab === 'card-pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Customer Selector & Tier Progress */}
          <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white">Select Member for Digital Pass</h3>
              <p className="text-xs text-neutral-400">Generate digital smartphone loyalty card with scannable QR</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-300 font-medium">Select Customer:</label>
              <select
                value={selectedCustomerForPass.id}
                onChange={(e) => {
                  const c = customers.find((cust) => cust.id === e.target.value);
                  if (c) setSelectedCustomerForPass(c);
                }}
                className="w-full bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 py-2 px-3 rounded-xl focus:outline-none focus:border-amber-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.phone} ({c.tier} Member)
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Progress Bar */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-300">
                  Current Tier: <b className="text-amber-400">{selectedCustomerForPass.tier}</b>
                </span>
                <span className="text-neutral-400 font-mono text-[11px]">
                  {passProgress.nextTier === 'Max Tier'
                    ? 'Maximum Tier Achieved'
                    : `Next: ${passProgress.nextTier}`}
                </span>
              </div>

              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${passProgress.percent}%` }}
                />
              </div>

              {passProgress.needed > 0 && (
                <p className="text-[11px] text-neutral-400">
                  Spend <b>{formatCurrency(passProgress.needed, settings.currency_symbol)}</b> more to unlock{' '}
                  <span className="text-amber-300 font-semibold">{passProgress.nextTier} Tier</span> perks!
                </p>
              )}
            </div>

            <div className="p-4 bg-neutral-950/60 rounded-xl border border-neutral-800 text-xs space-y-1.5">
              <div className="flex justify-between text-neutral-400">
                <span>Member Since:</span>
                <span className="text-neutral-200">{selectedCustomerForPass.member_since}</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Total Orders Placed:</span>
                <span className="text-neutral-200 font-mono">{selectedCustomerForPass.visit_count} visits</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Lifetime Expenditure:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {formatCurrency(selectedCustomerForPass.total_spent, settings.currency_symbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Realistic High-Fidelity Loyalty Pass Card */}
          <div className="lg:col-span-6 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-amber-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[360px]">
              {/* Card top sheen */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold">
                      GSR REWARDS CLUB
                    </span>
                    <h4 className="text-sm font-black text-white tracking-tight uppercase mt-0.5">
                      {settings.store_name}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      selectedCustomerForPass.tier === 'Platinum'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : selectedCustomerForPass.tier === 'Gold'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : selectedCustomerForPass.tier === 'Silver'
                        ? 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    }`}
                  >
                    {selectedCustomerForPass.tier}
                  </span>
                </div>

                <div className="mt-8">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Member Name</span>
                  <p className="text-lg font-bold text-white tracking-wide">{selectedCustomerForPass.name}</p>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">{selectedCustomerForPass.phone}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                    Reward Balance
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-400 tabular-nums">
                    {selectedCustomerForPass.loyalty_points} <span className="text-xs font-sans text-neutral-300">pts</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    ≈ {formatCurrency(selectedCustomerForPass.loyalty_points, settings.currency_symbol)} discount
                  </span>
                </div>

                {/* Scannable Terminal QR Code */}
                <div className="p-2 bg-white rounded-xl shadow-md text-neutral-950 flex flex-col items-center">
                  <QrCode className="w-12 h-12" />
                  <span className="text-[8px] font-mono font-bold mt-0.5">
                    GSR-{selectedCustomerForPass.id.slice(-4).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOYALTY TIER MATRIX */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-neutral-900 border border-orange-500/30 rounded-2xl p-5 space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-orange-500/20 text-orange-300">
              Bronze Tier
            </span>
            <p className="text-lg font-bold text-white mt-1">Free Enrollment</p>
            <p className="text-xs text-neutral-400">All newly registered patrons</p>
            <ul className="text-xs text-neutral-300 space-y-1.5 pt-2 border-t border-neutral-800">
              <li>· 1 point per {settings.currency_symbol}10 spent</li>
              <li>· Standard bill discount redemption</li>
              <li>· Digital SMS receipt delivery</li>
            </ul>
            <p className="text-xs text-neutral-500 pt-2 font-mono">Members: {bronzeMembers}</p>
          </div>

          <div className="bg-neutral-900 border border-slate-500/30 rounded-2xl p-5 space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-500/20 text-slate-300">
              Silver Tier
            </span>
            <p className="text-lg font-bold text-white mt-1">{settings.currency_symbol}1,500+ Spend</p>
            <p className="text-xs text-neutral-400">Frequent visitors & regulars</p>
            <ul className="text-xs text-neutral-300 space-y-1.5 pt-2 border-t border-neutral-800">
              <li>· 1.25x Points Multiplier</li>
              <li>· 5% Birthday Month Discount</li>
              <li>· Special weekly coffee perks</li>
            </ul>
            <p className="text-xs text-neutral-500 pt-2 font-mono">Members: {silverMembers}</p>
          </div>

          <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300">
              Gold Tier
            </span>
            <p className="text-lg font-bold text-white mt-1">{settings.currency_symbol}4,000+ Spend</p>
            <p className="text-xs text-neutral-400">VIP patrons & regular diners</p>
            <ul className="text-xs text-neutral-300 space-y-1.5 pt-2 border-t border-neutral-800">
              <li>· 1.5x Points Multiplier</li>
              <li>· Complimentary drink vouchers</li>
              <li>· Priority express checkout</li>
            </ul>
            <p className="text-xs text-neutral-500 pt-2 font-mono">Members: {goldMembers}</p>
          </div>

          <div className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-5 space-y-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300">
              Platinum Tier
            </span>
            <p className="text-lg font-bold text-white mt-1">{settings.currency_symbol}10,000+ Spend</p>
            <p className="text-xs text-neutral-400">Executive & corporate accounts</p>
            <ul className="text-xs text-neutral-300 space-y-1.5 pt-2 border-t border-neutral-800">
              <li>· 2.0x Double Points on every order</li>
              <li>· 10% instant discount across menu</li>
              <li>· Free merchandise perks</li>
            </ul>
            <p className="text-xs text-neutral-500 pt-2 font-mono">Members: {platinumMembers}</p>
          </div>
        </div>
      )}

      {/* TAB 4: POINTS AUDIT LEDGER */}
      {activeTab === 'ledger' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/60">
            <h3 className="text-sm font-bold text-white">Loyalty Points Transaction Ledger</h3>
            <p className="text-xs text-neutral-400">Audit trail of points earned on orders and redeemed for discounts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Points</th>
                  <th className="py-3 px-4">Order / Reference</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-850 transition-colors">
                    <td className="py-3 px-4 font-mono text-neutral-400">{formatDateTime(tx.date)}</td>
                    <td className="py-3 px-4 font-semibold text-neutral-200">{tx.customerName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          tx.type === 'earned'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                      <span className={tx.type === 'earned' ? 'text-emerald-400' : 'text-amber-400'}>
                        {tx.type === 'earned' ? `+${tx.points}` : `−${tx.points}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-400">{tx.orderNumber || '—'}</td>
                    <td className="py-3 px-4 text-neutral-300">{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE REWARD MODAL */}
      {isRewardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRewardModalOpen(false);
          }}
        >
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Loyalty Reward Perk</h3>
            <form onSubmit={handleCreateReward} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Perk Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Free Sparkling Beverage"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Points Cost</label>
                  <input
                    type="number"
                    required
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Discount Value ({settings.currency_symbol})</label>
                  <input
                    type="number"
                    required
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                >
                  <option value="Discount">Bill Discount</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Food">Food / Main</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Merch">Merchandise</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description for customer"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 font-bold text-neutral-950 rounded-lg shadow"
                >
                  Save Perk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
