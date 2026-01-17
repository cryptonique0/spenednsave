/**
 * GovDao Dashboard Component
 * 
 * Main governance dashboard showing voting power, proposals, and voting interface
 */

'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
  Gavel,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  Plus,
} from 'lucide-react';
import {
  useVotingPower,
  useProposals,
  useGovernanceStats,
} from '@/lib/hooks/useGovernance';
import {
  formatVotingPower,
  VOTING_TIERS,
  ProposalStatus,
  ProposalType,
} from '@/lib/govdao';
import { Spinner } from '@/components/ui/spinner';

interface GovDaoDashboardProps {
  onCreateProposal?: () => void;
  onProposalClick?: (proposalId: string) => void;
}

export function GovDaoDashboard({
  onCreateProposal,
  onProposalClick,
}: GovDaoDashboardProps) {
  const { address, isConnected } = useAccount();
  const [proposalFilter, setProposalFilter] = useState<ProposalStatus | 'all'>(
    'all'
  );
  const { metrics, isLoading: metricsLoading, votingPower, tier, canCreateProposal } = useVotingPower();
  const { proposals, isLoading: proposalsLoading } = useProposals(
    proposalFilter !== 'all'
      ? { status: proposalFilter as ProposalStatus }
      : undefined
  );
  const { stats } = useGovernanceStats();

  if (!isConnected) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-12 text-center">
          <Gavel className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Connect your wallet to participate in governance and voting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Voting Power Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Voting Power Card */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Voting Power
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {metricsLoading ? (
                    <Spinner />
                  ) : (
                    formatVotingPower(votingPower)
                  )}
                </h3>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp size={24} />
            </div>
          </div>
          {tier && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tier: <span className="font-semibold text-slate-900 dark:text-white">{VOTING_TIERS[tier].label}</span>
            </p>
          )}
        </div>

        {/* Vault Balance Card */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Vault Balance
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {metricsLoading ? (
                  <Spinner />
                ) : metrics ? (
                  `${(Number(metrics.vaultBalance) / 1e18).toFixed(2)} ETH`
                ) : (
                  '0 ETH'
                )}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileText size={24} />
            </div>
          </div>
        </div>

        {/* Guardians Card */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Guardians
              </p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                {metricsLoading ? <Spinner /> : metrics?.guardianCount ?? 0}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Vault Age Card */}
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Vault Age
              </p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                {metricsLoading ? <Spinner /> : `${metrics?.vaultAgeInDays ?? 0} days`}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Create Proposal Button */}
      {canCreateProposal && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Create a Proposal
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Your voting power qualifies you to create proposals
            </p>
          </div>
          <button
            onClick={onCreateProposal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus size={18} />
            Create Proposal
          </button>
        </div>
      )}

      {/* Governance Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Total Proposals
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalProposals}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {stats.activeProposals} currently active
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Total Voters
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {stats.totalVoters}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              Avg Power: {formatVotingPower(stats.averageVotingPower)}
            </p>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
              Total Voting Power
            </p>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatVotingPower(stats.totalVotingPower)}
            </h3>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Proposals
          </h3>
          <div className="flex gap-2">
            {['all', 'active', 'passed', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setProposalFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  proposalFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-surface-border text-slate-700 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-surface-border/80'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {proposalsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
            <Gavel className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No proposals found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onClick={() => onProposalClick?.(proposal.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ProposalCardProps {
  proposal: any;
  onClick?: () => void;
}

function ProposalCard({ proposal, onClick }: ProposalCardProps) {
  const votesTotal = proposal.votesFor + proposal.votesAgainst;
  const votesForPercentage = votesTotal === 0 ? 0 : (proposal.votesFor / votesTotal) * 100;
  const votesAgainstPercentage = votesTotal === 0 ? 0 : (proposal.votesAgainst / votesTotal) * 100;

  const statusConfig: Record<string, any> = {
    [ProposalStatus.ACTIVE]: {
      label: 'Active',
      icon: Clock,
      bgColor: 'bg-blue-100 dark:bg-blue-500/10',
      textColor: 'text-blue-700 dark:text-blue-400',
    },
    [ProposalStatus.PASSED]: {
      label: 'Passed',
      icon: CheckCircle,
      bgColor: 'bg-emerald-100 dark:bg-emerald-500/10',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },
    [ProposalStatus.REJECTED]: {
      label: 'Rejected',
      icon: XCircle,
      bgColor: 'bg-red-100 dark:bg-red-500/10',
      textColor: 'text-red-700 dark:text-red-400',
    },
    [ProposalStatus.CLOSED]: {
      label: 'Closed',
      icon: XCircle,
      bgColor: 'bg-slate-100 dark:bg-slate-500/10',
      textColor: 'text-slate-700 dark:text-slate-400',
    },
  };

  const config = statusConfig[proposal.status] || statusConfig[ProposalStatus.CLOSED];
  const StatusIcon = config.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
              {config.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400">
              {proposal.type}
            </span>
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {proposal.title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {proposal.description}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>

      {/* Voting Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Voting Progress
          </span>
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            {votesTotal} votes
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-surface-border rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${votesForPercentage}%` }}
          />
          <div
            className="bg-red-500 h-full transition-all"
            style={{ width: `${votesAgainstPercentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400">
            For: {votesForPercentage.toFixed(1)}%
          </span>
          <span className="text-xs text-red-600 dark:text-red-400">
            Against: {votesAgainstPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>Ends {new Date(proposal.endDate).toLocaleDateString()}</span>
        <span>Quorum: {proposal.quorumMet ? '✓ Met' : '○ Pending'}</span>
      </div>
    </div>
  );
}
