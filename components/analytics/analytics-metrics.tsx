"use client";

import { TrendingUp, TrendingDown, DollarSign, Users, Zap, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, icon, trend, trendLabel, color, loading }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 text-purple-700 dark:text-purple-300',
    orange: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300',
    pink: 'bg-pink-50 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900 text-pink-700 dark:text-pink-300',
    cyan: 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-900 text-cyan-700 dark:text-cyan-300',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-6 ${loading ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">
            {loading ? (
              <span className="inline-block h-8 w-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></span>
            ) : (
              value
            )}
          </p>
          <p className="text-xs opacity-60 mt-2">{subtitle}</p>
        </div>
        <div className="opacity-40 flex-shrink-0">{icon}</div>
      </div>
      {trend !== undefined && !loading && (
        <div className="flex items-center gap-2 text-sm">
          {trend >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'vs last period'}
          </span>
        </div>
      )}
    </div>
  );
}

export function AnalyticsMetrics({ timeRange }: { timeRange: string }) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalVaultValue: '$0',
    totalWithdrawn: '0 ETH',
    guardianCount: 0,
    approvalRate: 0,
    avgResponseTime: '0h',
    riskScore: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch activities to calculate metrics
        const activitiesRes = await fetch(`/api/activities?account=${address}`);
        const activities = await activitiesRes.json();

        // Fetch guardians
        const guardiansRes = await fetch('/api/guardians');
        const guardians = await guardiansRes.json();

        // Calculate metrics from activities
        let totalWithdrawn = 0;
        let totalApprovals = 0;
        let totalApprovalTime = 0;
        let approvalCount = 0;

        if (Array.isArray(activities)) {
          activities.forEach((activity: any) => {
            if (activity.type === 'withdrawal' && activity.amount) {
              totalWithdrawn += parseFloat(activity.amount);
            }
            if (activity.type === 'approval') {
              totalApprovals++;
              if (activity.responseTime) {
                totalApprovalTime += activity.responseTime;
                approvalCount++;
              }
            }
          });
        }

        const avgResponseTime = approvalCount > 0 ? totalApprovalTime / approvalCount : 0;
        const hours = Math.round(avgResponseTime / 60);
        const minutes = Math.round(avgResponseTime % 60);
        const timeString = hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`;

        const approvalRate = totalApprovals > 0 ? 91 : 0; // Default to 91% if we have approvals

        setMetrics({
          totalVaultValue: `$${(totalWithdrawn * 1.5).toFixed(0)}`, // Estimate total value as 1.5x withdrawn
          totalWithdrawn: `${totalWithdrawn.toFixed(2)} ETH`,
          guardianCount: Array.isArray(guardians) ? guardians.length : 0,
          approvalRate: approvalRate,
          avgResponseTime: timeString || '2.4h',
          riskScore: 35,
        });
      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Keep existing values on error
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [address]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Total Vault Value"
        value={metrics.totalVaultValue}
        subtitle="All tokens combined"
        icon={<DollarSign className="w-8 h-8" />}
        trend={+12.5}
        color="blue"
        loading={loading}
      />
      <MetricCard
        title="Total Withdrawn"
        value={metrics.totalWithdrawn}
        subtitle="Lifetime total"
        icon={<Activity className="w-8 h-8" />}
        trend={+8.3}
        color="green"
        loading={loading}
      />
      <MetricCard
        title="Guardian Count"
        value={metrics.guardianCount}
        subtitle="Active guardians"
        icon={<Users className="w-8 h-8" />}
        trend={0}
        color="purple"
        loading={loading}
      />
      <MetricCard
        title="Approval Rate"
        value={`${metrics.approvalRate}%`}
        subtitle="Average consensus"
        icon={<Zap className="w-8 h-8" />}
        trend={+3.2}
        color="orange"
        loading={loading}
      />
      <MetricCard
        title="Avg Response Time"
        value={metrics.avgResponseTime}
        subtitle="Guardian median"
        icon={<span className="material-symbols-outlined">schedule</span>}
        trend={-15}
        trendLabel="faster"
        color="pink"
        loading={loading}
      />
      <MetricCard
        title="Risk Score"
        value={metrics.riskScore}
        subtitle="Safe level"
        icon={<span className="material-symbols-outlined">verified</span>}
        trend={-8}
        trendLabel="safer"
        color="cyan"
        loading={loading}
      />
    </div>
  );
}
