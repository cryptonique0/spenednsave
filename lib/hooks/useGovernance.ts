/**
 * GovDao React Hooks
 * 
 * Custom hooks for governance DAO functionality including:
 * - Calculating voting power
 * - Fetching and managing proposals
 * - Handling votes
 * - Tracking governance metrics
 */

import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Address } from 'viem';
import {
  GovernanceMetrics,
  Proposal,
  ProposalType,
  ProposalStatus,
  VoteType,
  buildGovernanceMetrics,
  calculateTotalVotingPower,
  determineVotingTier,
  canCreateProposal,
  canVoteOnProposal,
  calculateVotingReward,
  hasQuorumMet,
} from '@/lib/govdao';
import { useUserContracts } from './useContracts';

/**
 * Hook to calculate and fetch user's governance metrics and voting power
 */
export function useVotingPower() {
  const { address } = useAccount();
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: userContracts } = useUserContracts(address as any);

  useEffect(() => {
    if (!address) {
      setMetrics(null);
      setIsLoading(false);
      return;
    }

    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch governance metrics from API
        const response = await fetch(`/api/governance/voting-power?address=${address}`);

        if (!response.ok) {
          throw new Error('Failed to fetch voting power metrics');
        }

        const data = await response.json();
        setMetrics(data.metrics);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching voting power:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [address]);

  return {
    metrics,
    isLoading,
    error,
    votingPower: metrics?.totalVotingPower ?? 0,
    tier: metrics?.tier,
    canCreateProposal: metrics ? canCreateProposal(metrics.totalVotingPower) : false,
  };
}

/**
 * Hook to fetch all governance proposals with optional filtering
 */
export function useProposals(filter?: {
  status?: ProposalStatus;
  type?: ProposalType;
  proposerAddress?: Address;
  sortBy?: 'newest' | 'oldest' | 'mostVotes';
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (filter?.status) params.append('status', filter.status);
      if (filter?.type) params.append('type', filter.type);
      if (filter?.proposerAddress) params.append('proposer', filter.proposerAddress);
      if (filter?.sortBy) params.append('sortBy', filter.sortBy);

      const response = await fetch(`/api/governance/proposals?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch proposals');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching proposals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter?.status, filter?.type, filter?.proposerAddress, filter?.sortBy]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    refetch: fetchProposals,
  };
}

/**
 * Hook to fetch a specific proposal by ID
 */
export function useProposal(proposalId: string | null) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(!!proposalId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) {
      setProposal(null);
      setIsLoading(false);
      return;
    }

    const fetchProposal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/governance/proposals/${proposalId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch proposal');
        }

        const data = await response.json();
        setProposal(data.proposal);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching proposal:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProposal();
  }, [proposalId]);

  return {
    proposal,
    isLoading,
    error,
  };
}

/**
 * Hook to check if user can vote on a specific proposal
 */
export function useCanVote(proposalId: string | null) {
  const { address } = useAccount();
  const { metrics } = useVotingPower();
  const { proposal } = useProposal(proposalId);
  const [canVote, setCanVote] = useState(false);

  useEffect(() => {
    if (!address || !metrics || !proposal) {
      setCanVote(false);
      return;
    }

    const result = canVoteOnProposal(
      metrics.totalVotingPower,
      proposal,
      address
    );
    setCanVote(result);
  }, [address, metrics, proposal]);

  return canVote;
}

/**
 * Hook to submit a vote on a proposal
 */
export function useSubmitVote() {
  const { address } = useAccount();
  const { metrics } = useVotingPower();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitVote = useCallback(
    async (proposalId: string, voteType: VoteType) => {
      if (!address || !metrics) {
        setError('Not connected or metrics not loaded');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/governance/proposals/${proposalId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voterAddress: address,
            voteType,
            votingPower: metrics.totalVotingPower,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to submit vote');
        }

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error submitting vote:', err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [address, metrics]
  );

  return {
    submitVote,
    isLoading,
    error,
  };
}

/**
 * Hook to create a new proposal
 */
export function useCreateProposal() {
  const { address } = useAccount();
  const { metrics } = useVotingPower();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProposal = useCallback(
    async (proposalData: {
      title: string;
      description: string;
      type: ProposalType;
      content: string;
      attachments?: string[];
    }) => {
      if (!address || !metrics) {
        setError('Not connected or metrics not loaded');
        return null;
      }

      if (!canCreateProposal(metrics.totalVotingPower)) {
        setError(`Minimum ${10} voting power required to create proposals`);
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/governance/proposals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...proposalData,
            proposerAddress: address,
            proposerVotingPower: metrics.totalVotingPower,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create proposal');
        }

        const data = await response.json();
        return data.proposal;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error creating proposal:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [address, metrics]
  );

  return {
    createProposal,
    isLoading,
    error,
  };
}

/**
 * Hook to get governance statistics
 */
export function useGovernanceStats() {
  const [stats, setStats] = useState<{
    totalProposals: number;
    activeProposals: number;
    totalVoters: number;
    averageVotingPower: number;
    totalVotingPower: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/governance/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch governance stats');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching governance stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Hook to get user's voting history
 */
export function useVotingHistory(userAddress?: Address) {
  const { address } = useAccount();
  const targetAddress = userAddress || address;
  const [votes, setVotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!!targetAddress);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetAddress) {
      setVotes([]);
      setIsLoading(false);
      return;
    }

    const fetchVotes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/governance/voting-history?address=${targetAddress}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch voting history');
        }

        const data = await response.json();
        setVotes(data.votes || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching voting history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
  }, [targetAddress]);

  return {
    votes,
    isLoading,
    error,
  };
}

/**
 * Hook to calculate voting reward for a proposal
 */
export function useVotingReward(proposalType: ProposalType) {
  const { metrics } = useVotingPower();

  if (!metrics) {
    return 0;
  }

  return calculateVotingReward(metrics.totalVotingPower, proposalType);
}

/**
 * Hook to check proposal quorum status
 */
export function useQuorumStatus(proposal: Proposal | null) {
  const [quorumMet, setQuorumMet] = useState(false);
  const [quorumPercentage, setQuorumPercentage] = useState(0);

  useEffect(() => {
    if (!proposal) {
      setQuorumMet(false);
      setQuorumPercentage(0);
      return;
    }

    const totalVoters = proposal.voters.length;
    const met = hasQuorumMet(totalVoters, proposal.quorumRequired);
    const percentage = proposal.quorumRequired > 0 
      ? (totalVoters / proposal.quorumRequired) * 100 
      : 0;

    setQuorumMet(met);
    setQuorumPercentage(percentage);
  }, [proposal]);

  return {
    quorumMet,
    quorumPercentage,
  };
}
