"use client";

import { useVaultAnalytics } from '@/lib/hooks/useVaultAnalytics';
import { Line } from 'react-chartjs-2';
import React from 'react';
import { type Address } from 'viem';

export function VaultAnalytics({ 
  vaultAddress, 
  guardianTokenAddress 
}: { 
  vaultAddress?: Address
  guardianTokenAddress?: Address 
}) {
  const analytics = useVaultAnalytics(vaultAddress, guardianTokenAddress);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(false);
    setError(null);
  }, [analytics]);

  // Format numbers
  const formatEth = (value: bigint | number) => {
    const num = typeof value === 'bigint' ? Number(value) / 1e18 : value;
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  // Prepare chart data for savings growth
  const chartData = {
    labels: analytics.balanceSeries.map(point => point.date),
    datasets: [
      {
        label: 'Vault Balance (ETH)',
        data: analytics.balanceSeries.map(point => point.balance),
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading analytics...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">Error loading analytics: {error}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow">
              <div className="font-bold mb-2">Total Deposited</div>
              <span className="text-2xl font-bold">{formatEth(analytics.totalDeposited)} ETH</span>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow">
              <div className="font-bold mb-2">Total Withdrawn</div>
              <span className="text-2xl font-bold">{formatEth(analytics.totalWithdrawn)} ETH</span>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow">
              <div className="font-bold mb-2">Withdrawals</div>
              <span className="text-2xl font-bold">{analytics.withdrawalFrequency}</span>
              <div className="text-xs text-slate-500">Avg: {analytics.avgWithdrawal.toFixed(4)} ETH</div>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 shadow">
              <div className="font-bold mb-2">Guardians</div>
              <span className="text-2xl font-bold">{analytics.totalGuardians}</span>
              {analytics.mostRecentGuardian && (
                <div className="text-xs text-slate-500">Last: {analytics.mostRecentGuardian.address}</div>
              )}
            </div>
          </div>

          {/* Savings Growth Chart */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 shadow-md">
            <h2 className="text-xl font-bold mb-4">Vault Balance Over Time</h2>
            {chartData.labels.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No balance history available.</div>
            ) : (
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
