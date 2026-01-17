'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  totalRevenue: number;
  averageRewardPerReferral: number;
  topReferralSource: string;
}

interface ReferralChannelData {
  channel: string;
  referrals: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

const CHART_DATA = [
  { date: 'Jan 1', referrals: 5, conversions: 1, revenue: 25 },
  { date: 'Jan 8', referrals: 12, conversions: 3, revenue: 75 },
  { date: 'Jan 15', referrals: 8, conversions: 2, revenue: 50 },
  { date: 'Jan 22', referrals: 15, conversions: 5, revenue: 125 },
  { date: 'Jan 29', referrals: 18, conversions: 6, revenue: 150 },
];

const CHANNEL_DATA: ReferralChannelData[] = [
  {
    channel: 'Twitter',
    referrals: 28,
    conversions: 9,
    revenue: 225,
    conversionRate: 32.1
  },
  {
    channel: 'Discord',
    referrals: 18,
    conversions: 5,
    revenue: 125,
    conversionRate: 27.8
  },
  {
    channel: 'Email',
    referrals: 12,
    conversions: 4,
    revenue: 100,
    conversionRate: 33.3
  },
  {
    channel: 'Telegram',
    referrals: 10,
    conversions: 2,
    revenue: 50,
    conversionRate: 20.0
  },
  {
    channel: 'Direct',
    referrals: 8,
    conversions: 3,
    revenue: 75,
    conversionRate: 37.5
  },
];

const CHANNEL_DISTRIBUTION = [
  { name: 'Twitter', value: 28, color: '#3B82F6' },
  { name: 'Discord', value: 18, color: '#7C3AED' },
  { name: 'Email', value: 12, color: '#10B981' },
  { name: 'Telegram', value: 10, color: '#0EA5E9' },
  { name: 'Direct', value: 8, color: '#F59E0B' },
];

export function ReferralStatistics() {
  // timeRange prop reserved for future time period filtering

  // Calculate statistics
  const stats: ReferralStats = {
    totalReferrals: CHANNEL_DATA.reduce((sum, c) => sum + c.referrals, 0),
    activeReferrals: Math.floor(CHANNEL_DATA.reduce((sum, c) => sum + c.referrals, 0) * 0.85),
    conversionRate: 31.2,
    totalRevenue: CHANNEL_DATA.reduce((sum, c) => sum + c.revenue, 0),
    averageRewardPerReferral: 25,
    topReferralSource: 'Twitter'
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Referral Statistics
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Deep insights into your referral program performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total Referrals
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.totalReferrals}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stats.activeReferrals} active
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Conversion Rate
              </p>
              <p className="text-3xl font-bold text-primary mb-1">
                {stats.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="text-success">↑ 2.3%</span> vs last period
              </p>
            </div>
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-success dark:text-success/80 mb-1">
                ${stats.totalRevenue}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ${stats.averageRewardPerReferral} per referral
              </p>
            </div>
            <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-success dark:text-success/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Referral Trend (January)
        </h3>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CHART_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#F3F4F6'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="referrals"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="conversions"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={{ fill: '#F59E0B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Performance by Channel
          </h3>
          <div className="space-y-3">
            {CHANNEL_DATA.map((channel, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {channel.channel}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {channel.referrals} referrals
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(channel.referrals / stats.totalReferrals) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {((channel.referrals / stats.totalReferrals) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{channel.conversions} conversions</span>
                  <span>${channel.revenue} revenue</span>
                  <span className="text-success">{channel.conversionRate.toFixed(1)}% rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Referral Source Distribution
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CHANNEL_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent = 0 }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {CHANNEL_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Best Performing Channel */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30 border border-primary/20 rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 dark:bg-primary/30 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Top Performing Channel
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <strong>{stats.topReferralSource}</strong> is your best performing channel with a 32.1% conversion rate and $225 in revenue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
