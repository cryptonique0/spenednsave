/**
 * Voting Power Breakdown Component
 * 
 * Shows detailed breakdown of voting power calculation
 */

'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useVotingPower } from '@/lib/hooks/useGovernance';
import {
  calculateVaultBalanceScore,
  calculateGuardianCountScore,
  calculateActivityCountScore,
  calculateVaultAgeScore,
  calculateTokenDiversityScore,
  VOTING_POWER_WEIGHTS,
  formatVotingPower,
} from '@/lib/govdao';

interface VotingPowerBreakdownProps {
  className?: string;
}

export function VotingPowerBreakdown({ className = '' }: VotingPowerBreakdownProps) {
  const { metrics, isLoading } = useVotingPower();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !metrics) {
    return (
      <div className={`bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-surface-border rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-surface-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  const balanceScore = calculateVaultBalanceScore(metrics.vaultBalance);
  const guardianScore = calculateGuardianCountScore(metrics.guardianCount);
  const activityScore = calculateActivityCountScore(metrics.activityCount);
  const ageScore = calculateVaultAgeScore(metrics.vaultAgeInDays);
  const diversityScore = calculateTokenDiversityScore(metrics.tokenDiversity);

  const breakdowns = [
    {
      label: 'Vault Balance',
      score: balanceScore,
      weight: VOTING_POWER_WEIGHTS.vaultBalance,
      contribution: balanceScore * VOTING_POWER_WEIGHTS.vaultBalance,
      details: `${(Number(metrics.vaultBalance) / 1e18).toFixed(2)} ETH`,
      icon: '💰',
    },
    {
      label: 'Guardians',
      score: guardianScore,
      weight: VOTING_POWER_WEIGHTS.guardianCount,
      contribution: guardianScore * VOTING_POWER_WEIGHTS.guardianCount,
      details: `${metrics.guardianCount} guardians`,
      icon: '👥',
    },
    {
      label: 'Activity',
      score: activityScore,
      weight: VOTING_POWER_WEIGHTS.activityCount,
      contribution: activityScore * VOTING_POWER_WEIGHTS.activityCount,
      details: `${metrics.activityCount} transactions`,
      icon: '⚡',
    },
    {
      label: 'Vault Age',
      score: ageScore,
      weight: VOTING_POWER_WEIGHTS.vaultAge,
      contribution: ageScore * VOTING_POWER_WEIGHTS.vaultAge,
      details: `${metrics.vaultAgeInDays} days old`,
      icon: '📅',
    },
    {
      label: 'Token Diversity',
      score: diversityScore,
      weight: VOTING_POWER_WEIGHTS.tokenDiversity,
      contribution: diversityScore * VOTING_POWER_WEIGHTS.tokenDiversity,
      details: `${metrics.tokenDiversity} tokens`,
      icon: '🪙',
    },
  ];

  const maxContribution = Math.max(...breakdowns.map((b) => b.contribution));

  return (
    <div className={`bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-surface-border/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">📊</div>
          <div className="text-left">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Voting Power Breakdown
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Total: <span className="font-semibold text-primary">{formatVotingPower(metrics.totalVotingPower)}</span>
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Breakdown Details */}
      {expanded && (
        <div className="border-t border-gray-200 dark:border-surface-border divide-y divide-gray-200 dark:divide-surface-border">
          {breakdowns.map((item) => (
            <div key={item.label} className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.icon}</span>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.details}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 dark:text-white">
                    +{item.contribution.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    ({(item.weight * 100).toFixed(0)}% weight)
                  </p>
                </div>
              </div>

              {/* Visual Bar */}
              <div className="w-full bg-gray-200 dark:bg-surface-border rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all"
                  style={{
                    width: `${(item.contribution / maxContribution) * 100}%`,
                  }}
                />
              </div>

              {/* Score Breakdown */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Score: {item.score.toFixed(2)}</span>
                <span>Weight: {(item.weight * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}

          {/* Summary */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-blue-500/5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Total Voting Power
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatVotingPower(metrics.totalVotingPower)}
                </span>
              </div>

              {/* Tips */}
              <div className="pt-3 border-t border-gray-200 dark:border-surface-border">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  💡 Tips to increase your voting power:
                </p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Increase vault balance by depositing more funds</li>
                  <li>• Add more guardians to your vault</li>
                  <li>• Stay active with regular transactions</li>
                  <li>• Diversify your token holdings</li>
                  <li>• Keep your vault active over time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
