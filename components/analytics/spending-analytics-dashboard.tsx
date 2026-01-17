'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, AlertCircle } from 'lucide-react';
import {
  useSpendingStats,
  useSpendingSummary,
  useBudgetComparison,
  useVelocityWarnings,
} from '@/lib/hooks/useSpendingAnalytics';
import { TimePeriod, formatUSD, formatPercentage } from '@/lib/spending-analytics';
import SpendingByCategory from './spending-by-category';
import SpendingTrends from './spending-trends';
import VelocityAlerts from './velocity-warnings';
import BudgetComparison from './budget-comparison';

export default function SpendingAnalyticsDashboard() {
  const [period, setPeriod] = useState<TimePeriod>(TimePeriod.MONTHLY);
  const { stats, loading: statsLoading } = useSpendingStats();
  const { summary, loading: summaryLoading } = useSpendingSummary(period);
  const { warnings, loading: warningsLoading } = useVelocityWarnings(period);

  const loading = statsLoading || summaryLoading || warningsLoading;

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Spending Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track your spending patterns, trends, and budget usage
          </p>
        </div>
        <div className="flex gap-2">
          {[TimePeriod.DAILY, TimePeriod.WEEKLY, TimePeriod.MONTHLY].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : formatUSD(stats.totalSpent)}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {summary.transactionCount} transactions
                </p>
              )}
            </div>
            <div className="bg-indigo-100 dark:bg-indigo-500/10 p-3 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : formatUSD(stats.dailyAverage)}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Based on {summary.transactionCount} transactions
                </p>
              )}
            </div>
            <div className="bg-blue-100 dark:bg-blue-500/10 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Largest Transaction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Largest Transaction
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : formatUSD(stats.largestTransaction)}
              </p>
              {summary && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Average: {formatUSD(stats.averageTransaction)}
                </p>
              )}
            </div>
            <div className="bg-orange-100 dark:bg-orange-500/10 p-3 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Categories Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Categories Used
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {loading ? '...' : stats.uniqueCategories}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">out of 12 total</p>
            </div>
            <div className="bg-green-100 dark:bg-green-500/10 p-3 rounded-lg">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {!warningsLoading && warnings.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-300">
                {warnings.length} Spending Alert{warnings.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                You have budget warnings in {warnings.length} categor{warnings.length !== 1 ? 'ies' : 'y'}. Review
                your spending patterns below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingByCategory />
        <SpendingTrends days={30} />
      </div>

      {/* Full Width Sections */}
      <div className="space-y-6">
        <VelocityAlerts period={period} />
        <BudgetComparison period={period} />
      </div>
    </div>
  );
}
