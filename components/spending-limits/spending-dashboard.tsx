'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { type Address } from 'viem';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { Progress } from '@/components/ui/progress';

interface SpendingDashboardProps {
  vaultAddress: Address;
  tokenAddress: Address;
  tokenSymbol?: string;
  refreshInterval?: number; // milliseconds, default 30s
}

interface SpendingMetrics {
  dailyUsed: bigint;
  dailyLimit: bigint;
  weeklyUsed: bigint;
  weeklyLimit: bigint;
  monthlyUsed: bigint;
  monthlyLimit: bigint;
  exceedsDaily: boolean;
  exceedsWeekly: boolean;
  exceedsMonthly: boolean;
}

type WarningLevel = 'safe' | 'warning' | 'critical';

/**
 * Component for visualizing spending against daily, weekly, and monthly limits
 * Shows progress bars with color-coded warnings and reset time countdowns
 */
export function SpendingDashboard({
  vaultAddress,
  tokenAddress,
  tokenSymbol = 'TOKEN',
  refreshInterval = 30000
}: SpendingDashboardProps) {
  const publicClient = usePublicClient();
  
  const [metrics, setMetrics] = useState<SpendingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextResetTimes, setNextResetTimes] = useState<{
    daily: number;
    weekly: number;
    monthly: number;
  } | null>(null);

  /**
   * Fetch spending metrics from smart contract
   */
  const fetchMetrics = useCallback(async () => {
    if (!publicClient) return;

    try {
      setError(null);

      // Get spending limit status
      const limitStatus = await publicClient.readContract({
        address: vaultAddress,
        abi: SpendVaultABI,
        functionName: 'checkSpendingLimitStatus',
        args: [tokenAddress, BigInt(0)]
      });

      // Get withdrawal caps
      const caps = await publicClient.readContract({
        address: vaultAddress,
        abi: SpendVaultABI,
        functionName: 'withdrawalCaps',
        args: [tokenAddress]
      });

      const limitData = limitStatus as any;
      const capData = caps as any;

      setMetrics({
        dailyUsed: limitData.dailyUsed || BigInt(0),
        dailyLimit: capData.daily || BigInt(0),
        weeklyUsed: limitData.weeklyUsed || BigInt(0),
        weeklyLimit: capData.weekly || BigInt(0),
        monthlyUsed: limitData.monthlyUsed || BigInt(0),
        monthlyLimit: capData.monthly || BigInt(0),
        exceedsDaily: limitData.exceedsDaily || false,
        exceedsWeekly: limitData.exceedsWeekly || false,
        exceedsMonthly: limitData.exceedsMonthly || false
      });

      // Calculate reset times
      const now = Math.floor(Date.now() / 1000);
      setNextResetTimes({
        daily: now + 86400,
        weekly: now + 7 * 86400,
        monthly: getNextMonthlyReset(now)
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching spending metrics:', err);
      setError('Failed to load spending metrics');
      setLoading(false);
    }
  }, [publicClient, vaultAddress, tokenAddress]);

  /**
   * Get the warning level based on usage percentage
   */
  const getWarningLevel = (used: bigint, limit: bigint): WarningLevel => {
    if (limit === BigInt(0)) return 'safe';
    const percent = Number((used * BigInt(100)) / limit);
    if (percent > 95) return 'critical';
    if (percent > 75) return 'warning';
    return 'safe';
  };

  /**
   * Get the progress bar color class based on warning level
   */
  const getColorClass = (level: WarningLevel): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-500 dark:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-green-500 dark:bg-green-600';
    }
  };

  /**
   * Get the progress bar background class
   */
  const getBgClass = (level: WarningLevel): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      default:
        return 'bg-green-100 dark:bg-green-900/20';
    }
  };

  /**
   * Format time remaining until reset
   */
  const formatTimeUntilReset = (resetTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = resetTime - now;
    if (secondsLeft < 0) return 'Resetting...';

    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  /**
   * Format large numbers for display
   */
  const formatNumber = (value: bigint, decimals: number = 18): string => {
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const frac = ((value % divisor) * BigInt(10000)) / divisor;
    if (frac === BigInt(0)) return whole.toString();
    return `${whole}.${frac.toString().padStart(4, '0')}`;
  };

  // Setup auto-refresh
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  /**
   * Calculate the next monthly reset timestamp
   */
  function getNextMonthlyReset(timestamp: number): number {
    const date = new Date(timestamp * 1000);
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return Math.floor(nextMonth.getTime() / 1000);
  }

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-2 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics || !nextResetTimes) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-400">
          {error || 'Failed to load spending dashboard'}
        </p>
      </div>
    );
  }

  const dailyPercent = metrics.dailyLimit > 0n 
    ? Number((metrics.dailyUsed * BigInt(100)) / metrics.dailyLimit)
    : 0;
  const weeklyPercent = metrics.weeklyLimit > 0n
    ? Number((metrics.weeklyUsed * BigInt(100)) / metrics.weeklyLimit)
    : 0;
  const monthlyPercent = metrics.monthlyLimit > 0n
    ? Number((metrics.monthlyUsed * BigInt(100)) / metrics.monthlyLimit)
    : 0;

  const dailyWarning = getWarningLevel(metrics.dailyUsed, metrics.dailyLimit);
  const weeklyWarning = getWarningLevel(metrics.weeklyUsed, metrics.weeklyLimit);
  const monthlyWarning = getWarningLevel(metrics.monthlyUsed, metrics.monthlyLimit);

  const SpendingMetricCard = ({
    title,
    used,
    limit,
    percent,
    warningLevel,
    resetTime,
    exceeds
  }: {
    title: string;
    used: bigint;
    limit: bigint;
    percent: number;
    warningLevel: WarningLevel;
    resetTime: number;
    exceeds: boolean;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</label>
        <div className="flex items-center gap-2 text-xs">
          {exceeds && <span className="text-red-600 dark:text-red-400">⚠️ Exceeded</span>}
          <span className="text-gray-600 dark:text-gray-400">
            {formatNumber(used)} / {limit === BigInt(0) ? 'Unlimited' : formatNumber(limit)} {tokenSymbol}
          </span>
        </div>
      </div>
      {limit > 0n ? (
        <div className="space-y-1">
          <div className={`h-2 w-full overflow-hidden rounded-full ${getBgClass(warningLevel)}`}>
            <div
              className={`h-full transition-all duration-300 ${getColorClass(warningLevel)}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{percent.toFixed(1)}%</span>
            <span>Resets in {formatTimeUntilReset(resetTime)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">No limit set</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Spending Overview</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Current usage against daily, weekly, and monthly limits for {tokenSymbol}
        </p>
      </div>

      {/* Enhanced Approvals Alert */}
      {(metrics.exceedsDaily || metrics.exceedsWeekly || metrics.exceedsMonthly) && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="space-y-1">
              <p className="font-medium text-orange-900 dark:text-orange-300">Enhanced Approvals Required</p>
              <p className="text-sm text-orange-800 dark:text-orange-400">
                {metrics.exceedsDaily && 'Daily '}
                {metrics.exceedsWeekly && 'weekly '}
                {metrics.exceedsMonthly && 'monthly '}
                limit exceeded. Next withdrawal will require 75% of guardians to approve.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spending Metrics */}
      <div className="space-y-4">
        <SpendingMetricCard
          title="Daily Limit"
          used={metrics.dailyUsed}
          limit={metrics.dailyLimit}
          percent={dailyPercent}
          warningLevel={dailyWarning}
          resetTime={nextResetTimes.daily}
          exceeds={metrics.exceedsDaily}
        />
        <SpendingMetricCard
          title="Weekly Limit"
          used={metrics.weeklyUsed}
          limit={metrics.weeklyLimit}
          percent={weeklyPercent}
          warningLevel={weeklyWarning}
          resetTime={nextResetTimes.weekly}
          exceeds={metrics.exceedsWeekly}
        />
        <SpendingMetricCard
          title="Monthly Limit"
          used={metrics.monthlyUsed}
          limit={metrics.monthlyLimit}
          percent={monthlyPercent}
          warningLevel={monthlyWarning}
          resetTime={nextResetTimes.monthly}
          exceeds={metrics.exceedsMonthly}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Safe (&lt; 75%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Warning (75-95%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Critical (&gt; 95%)</span>
        </div>
      </div>
    </div>
  );
}
