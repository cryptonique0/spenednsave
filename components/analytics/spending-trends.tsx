'use client';

import React, { useMemo } from 'react';
import { useSpendingTrends } from '@/lib/hooks/useSpendingAnalytics';
import { formatUSD } from '@/lib/spending-analytics';
import { TrendingUp } from 'lucide-react';

export default function SpendingTrends({ days = 30 }) {
  const { trends, loading } = useSpendingTrends(days);

  const { maxAmount, avgAmount, minAmount, latestTrend } = useMemo(() => {
    if (!trends || trends.length === 0) {
      return { maxAmount: 0, avgAmount: 0, minAmount: 0, latestTrend: null };
    }

    const amounts = trends.map(t => t.amount).filter(a => a > 0);
    const maxAmount = Math.max(...amounts, 0);
    const minAmount = Math.min(...amounts, Infinity);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / Math.max(amounts.length, 1);
    const latestTrend = trends[trends.length - 1];

    return { maxAmount, avgAmount, minAmount, latestTrend };
  }, [trends]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📈 Spending Trends
        </h2>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📈 Spending Trends
        </h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            No spending data for the selected period
          </p>
        </div>
      </div>
    );
  }

  // Simple bar chart using HTML/CSS
  const chartData = trends.map(t => ({
    date: t.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: t.amount,
    percentage: maxAmount > 0 ? (t.amount / maxAmount) * 100 : 0,
  }));

  // Show only every other day to avoid crowding for 30-day view
  const displayData = days > 7 ? chartData.filter((_, i) => i % 2 === 0) : chartData;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          📈 Spending Trends
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last {days} days
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Max Day</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatUSD(maxAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatUSD(avgAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Min Day</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {formatUSD(minAmount)}
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="space-y-1">
        <div className="flex items-end justify-between h-48 gap-0.5 px-1">
          {displayData.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              {/* Bar */}
              <div className="w-full flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 rounded-t hover:shadow-lg transition-shadow"
                  style={{
                    height: `${Math.max(item.percentage, 3)}%`,
                    minHeight: '2px',
                  }}
                  title={`${item.date}: ${formatUSD(item.amount)}`}
                />
              </div>
              {/* Label - show every other for readability */}
              {i % 2 === 0 && (
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap text-center leading-tight">
                  {item.date}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trend Info */}
      {latestTrend && (
        <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <p className="font-medium text-indigo-900 dark:text-indigo-300">Current Trend</p>
          </div>
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            {latestTrend.movingAverage7 > avgAmount
              ? 'Your spending is trending up compared to the average. Consider reviewing your recent transactions.'
              : 'Your spending is trending down. Keep up the good work!'}
          </p>
        </div>
      )}
    </div>
  );
}
