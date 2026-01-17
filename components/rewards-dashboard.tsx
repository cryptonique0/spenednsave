'use client';

import { useState } from 'react';
import { Gift, TrendingUp, Clock, CheckCircle, AlertCircle, Wallet } from 'lucide-react';

interface Reward {
  id: string;
  type: 'pending' | 'credited' | 'redeemed';
  title: string;
  amount: number;
  description: string;
  earnedDate: string;
  expiryDate?: string;
  redemptionDate?: string;
  icon: string;
}

interface RewardsStats {
  totalEarned: number;
  pendingBalance: number;
  availableBalance: number;
  redeemedTotal: number;
}

const SAMPLE_REWARDS: Reward[] = [
  {
    id: '1',
    type: 'credited',
    title: 'Referral Commission - User #1',
    amount: 50,
    description: 'Earned from successful referral signup',
    earnedDate: '2025-01-15',
    redemptionDate: undefined,
    icon: '💰'
  },
  {
    id: '2',
    type: 'credited',
    title: 'Referral Commission - User #2',
    amount: 75,
    description: 'Earned from successful referral signup',
    earnedDate: '2025-01-10',
    redemptionDate: undefined,
    icon: '💵'
  },
  {
    id: '3',
    type: 'credited',
    title: 'Friend Tier Bonus',
    amount: 50,
    description: 'Bonus for reaching Friend tier (5 referrals)',
    earnedDate: '2025-01-05',
    redemptionDate: undefined,
    icon: '🎁'
  },
  {
    id: '4',
    type: 'redeemed',
    title: 'Withdrawal to Bank',
    amount: 100,
    description: 'Redeemed to linked bank account',
    earnedDate: '2024-12-20',
    redemptionDate: '2024-12-22',
    icon: '✅'
  },
  {
    id: '5',
    type: 'redeemed',
    title: 'Premium Subscription Upgrade',
    amount: 25,
    description: 'Used reward balance for premium features',
    earnedDate: '2024-12-15',
    redemptionDate: '2024-12-16',
    icon: '⭐'
  },
  {
    id: '6',
    type: 'pending',
    title: 'Ambassador Tier Bonus (Pending)',
    amount: 150,
    description: 'Earned 15 more referrals - awaiting verification',
    earnedDate: '2025-01-12',
    expiryDate: '2025-02-12',
    icon: '⏳'
  },
  {
    id: '7',
    type: 'credited',
    title: 'Monthly Referral Bonus',
    amount: 30,
    description: 'January performance bonus',
    earnedDate: '2025-01-01',
    redemptionDate: undefined,
    icon: '📈'
  }
];

export function RewardsDashboard() {
  const [rewards] = useState<Reward[]>(SAMPLE_REWARDS);
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'credited' | 'redeemed'>('all');

  // Calculate stats
  const stats: RewardsStats = {
    totalEarned: rewards.reduce((sum, r) => sum + r.amount, 0),
    pendingBalance: rewards
      .filter(r => r.type === 'pending')
      .reduce((sum, r) => sum + r.amount, 0),
    availableBalance: rewards
      .filter(r => r.type === 'credited')
      .reduce((sum, r) => sum + r.amount, 0),
    redeemedTotal: rewards
      .filter(r => r.type === 'redeemed')
      .reduce((sum, r) => sum + r.amount, 0)
  };

  const filteredRewards = filterType === 'all'
    ? rewards
    : rewards.filter(r => r.type === filterType);

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900/50';
      case 'credited':
        return 'bg-success/10 dark:bg-success/20 text-success dark:text-success/80 border-success/30 dark:border-success/40';
      case 'redeemed':
        return 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default:
        return '';
    }
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'credited':
        return <Gift className="w-5 h-5" />;
      case 'redeemed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Rewards Dashboard
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track your earned rewards and redemptions in one place
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Total Earned
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                ${stats.totalEarned}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                All time
              </p>
            </div>
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Pending
              </p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                ${stats.pendingBalance}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Under review
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-950/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Available Balance */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Available
              </p>
              <p className="text-3xl font-bold text-success dark:text-success/80">
                ${stats.availableBalance}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Ready to redeem
              </p>
            </div>
            <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg">
              <Wallet className="w-6 h-6 text-success dark:text-success/80" />
            </div>
          </div>
        </div>

        {/* Redeemed Total */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Redeemed
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                ${stats.redeemedTotal}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Total withdrawn
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <CheckCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
          <Wallet className="w-5 h-5" />
          Redeem Rewards
        </button>
        <button className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" />
          View Redemption History
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-surface-border dark:border-gray-700">
        {(['all', 'pending', 'credited', 'redeemed'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors capitalize ${
              filterType === type
                ? 'text-primary border-primary'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Rewards List */}
      <div className="space-y-3">
        {filteredRewards.length > 0 ? (
          filteredRewards.map((reward) => (
            <div
              key={reward.id}
              className={`border rounded-lg p-4 flex items-start gap-4 ${getStatusColor(reward.type)}`}
            >
              <div className="text-3xl flex-shrink-0">{reward.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {reward.title}
                    </h4>
                    <p className="text-sm mt-1 opacity-90">
                      {reward.description}
                    </p>
                  </div>
                  <span className="text-lg font-bold flex-shrink-0 whitespace-nowrap">
                    +${reward.amount}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs opacity-75">
                  <span>Earned: {reward.earnedDate}</span>
                  {reward.redemptionDate && (
                    <span>Redeemed: {reward.redemptionDate}</span>
                  )}
                  {reward.expiryDate && (
                    <span>Expires: {reward.expiryDate}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(reward.type)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No {filterType !== 'all' ? filterType : ''} rewards found</p>
          </div>
        )}
      </div>
    </div>
  );
}
