/**
 * GovDao - Governance DAO System
 * 
 * This module implements a governance DAO where users gain voting power
 * based on multiple criteria:
 * - Vault Balance (30%)
 * - Number of Guardians (20%)
 * - Activity Count (20%)
 * - Vault Age (15%)
 * - Token Diversity (15%)
 */

import { Address, parseEther } from 'viem';

/**
 * Voting Power Calculation Weights
 */
export const VOTING_POWER_WEIGHTS = {
  vaultBalance: 0.30,      // 30% - Users with larger vaults have more power
  guardianCount: 0.20,     // 20% - Users with more guardians have more power
  activityCount: 0.20,     // 20% - Active users have more power
  vaultAge: 0.15,          // 15% - Longer-standing users have more power
  tokenDiversity: 0.15,    // 15% - Users with diverse tokens have more power
};

/**
 * Voting power tiers based on total voting power
 */
export const VOTING_TIERS = {
  FOUNDER: { minVotingPower: 1000, label: 'Founder', color: 'gold' },
  LEAD: { minVotingPower: 500, label: 'Lead Governor', color: 'purple' },
  SENIOR: { minVotingPower: 250, label: 'Senior Member', color: 'blue' },
  ACTIVE: { minVotingPower: 100, label: 'Active Member', color: 'green' },
  MEMBER: { minVotingPower: 10, label: 'Member', color: 'slate' },
  PARTICIPANT: { minVotingPower: 0, label: 'Participant', color: 'gray' },
} as const;

/**
 * Proposal types that can be voted on
 */
export enum ProposalType {
  FEATURE_REQUEST = 'feature-request',
  BUG_REPORT = 'bug-report',
  RISK_PARAMETER = 'risk-parameter',
  VAULT_POLICY = 'vault-policy',
  GUARDIAN_POLICY = 'guardian-policy',
  PROTOCOL_UPGRADE = 'protocol-upgrade',
  BUDGET_ALLOCATION = 'budget-allocation',
  COMMUNITY_INITIATIVE = 'community-initiative',
}

/**
 * Proposal status states
 */
export enum ProposalStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  PASSED = 'passed',
  REJECTED = 'rejected',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  FAILED = 'failed',
}

/**
 * Vote types
 */
export enum VoteType {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain',
}

/**
 * User governance metrics
 */
export interface GovernanceMetrics {
  vaultBalance: bigint;        // In wei
  vaultBalanceUSD?: number;    // For display
  guardianCount: number;       // Number of guardians
  activityCount: number;       // Number of transactions/actions
  vaultAgeInDays: number;      // Days since vault creation
  tokenDiversity: number;      // Number of different tokens held (0-6)
  totalVotingPower: number;    // Calculated total voting power
  tier: keyof typeof VOTING_TIERS;
  lastUpdated: Date;
}

/**
 * Proposal interface
 */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  proposerAddress: Address;
  proposerVotingPower: number;
  status: ProposalStatus;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumRequired: number;
  quorumMet: boolean;
  successThreshold: number; // Percentage needed to pass (e.g., 50)
  voters: {
    address: Address;
    voteType: VoteType;
    votingPower: number;
    timestamp: Date;
  }[];
  content: string;
  attachments?: string[];
  executeData?: string;
  result?: {
    passed: boolean;
    finalVotesFor: number;
    finalVotesAgainst: number;
    totalVoters: number;
    quorumPercentage: number;
  };
}

/**
 * Calculate voting power score from vault balance
 * 1 wei = ~0.00001 voting power, min 1
 * 
 * Examples:
 * - 1 ETH = 0.1 voting power
 * - 10 ETH = 1 voting power
 * - 100 ETH = 10 voting power
 * - 1000 ETH = 100 voting power
 */
export function calculateVaultBalanceScore(balanceInWei: bigint): number {
  const balance = Number(balanceInWei) / 1e18; // Convert from wei
  return Math.max(1, balance / 10); // Min 1, increases with balance
}

/**
 * Calculate voting power from guardian count
 * 1 guardian = 1 power, 2 = 3, 3 = 6, 4 = 10 (quadratic growth)
 */
export function calculateGuardianCountScore(guardianCount: number): number {
  return Math.max(1, guardianCount * (guardianCount + 1) / 2);
}

/**
 * Calculate voting power from activity count
 * 1 activity = 0.5 power, scales linearly
 */
export function calculateActivityCountScore(activityCount: number): number {
  return Math.max(1, activityCount * 0.5);
}

/**
 * Calculate voting power from vault age
 * 1 day = 0.01 power, 100 days = 1 power, 1000 days = 10 power
 */
export function calculateVaultAgeScore(vaultAgeInDays: number): number {
  return Math.max(1, vaultAgeInDays / 100);
}

/**
 * Calculate voting power from token diversity
 * 1-2 tokens = 2 power, 3-4 tokens = 5 power, 5-6 tokens = 10 power
 */
export function calculateTokenDiversityScore(tokenCount: number): number {
  if (tokenCount === 0) return 1;
  if (tokenCount <= 2) return 2;
  if (tokenCount <= 4) return 5;
  return 10;
}

/**
 * Calculate total voting power from all metrics
 */
export function calculateTotalVotingPower(metrics: {
  vaultBalance: bigint;
  guardianCount: number;
  activityCount: number;
  vaultAgeInDays: number;
  tokenDiversity: number;
}): number {
  const balanceScore = calculateVaultBalanceScore(metrics.vaultBalance);
  const guardianScore = calculateGuardianCountScore(metrics.guardianCount);
  const activityScore = calculateActivityCountScore(metrics.activityCount);
  const ageScore = calculateVaultAgeScore(metrics.vaultAgeInDays);
  const diversityScore = calculateTokenDiversityScore(metrics.tokenDiversity);

  const totalPower =
    balanceScore * VOTING_POWER_WEIGHTS.vaultBalance +
    guardianScore * VOTING_POWER_WEIGHTS.guardianCount +
    activityScore * VOTING_POWER_WEIGHTS.activityCount +
    ageScore * VOTING_POWER_WEIGHTS.vaultAge +
    diversityScore * VOTING_POWER_WEIGHTS.tokenDiversity;

  return Math.round(totalPower * 100) / 100; // Round to 2 decimals
}

/**
 * Determine voting tier based on voting power
 */
export function determineVotingTier(
  votingPower: number
): keyof typeof VOTING_TIERS {
  if (votingPower >= VOTING_TIERS.FOUNDER.minVotingPower)
    return 'FOUNDER';
  if (votingPower >= VOTING_TIERS.LEAD.minVotingPower)
    return 'LEAD';
  if (votingPower >= VOTING_TIERS.SENIOR.minVotingPower)
    return 'SENIOR';
  if (votingPower >= VOTING_TIERS.ACTIVE.minVotingPower)
    return 'ACTIVE';
  if (votingPower >= VOTING_TIERS.MEMBER.minVotingPower)
    return 'MEMBER';
  return 'PARTICIPANT';
}

/**
 * Build governance metrics object
 */
export function buildGovernanceMetrics(
  vaultBalance: bigint,
  guardianCount: number,
  activityCount: number,
  vaultCreatedAtDate: Date,
  tokenCount: number = 1,
  vaultBalanceUSD?: number
): GovernanceMetrics {
  const vaultAgeInDays = Math.floor(
    (Date.now() - vaultCreatedAtDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalVotingPower = calculateTotalVotingPower({
    vaultBalance,
    guardianCount,
    activityCount,
    vaultAgeInDays,
    tokenDiversity: tokenCount,
  });

  const tier = determineVotingTier(totalVotingPower);

  return {
    vaultBalance,
    vaultBalanceUSD,
    guardianCount,
    activityCount,
    vaultAgeInDays,
    tokenDiversity: tokenCount,
    totalVotingPower,
    tier,
    lastUpdated: new Date(),
  };
}

/**
 * Calculate proposal quorum based on active members
 */
export function calculateQuorumRequired(
  totalActiveMembers: number,
  quorumPercentage: number = 25
): number {
  return Math.ceil((totalActiveMembers * quorumPercentage) / 100);
}

/**
 * Check if proposal has met quorum
 */
export function hasQuorumMet(
  totalVoters: number,
  quorumRequired: number
): boolean {
  return totalVoters >= quorumRequired;
}

/**
 * Calculate proposal result
 */
export function calculateProposalResult(
  votesFor: number,
  votesAgainst: number,
  votesAbstain: number,
  successThreshold: number = 50
): {
  passed: boolean;
  totalVotes: number;
  votesForPercentage: number;
  votesAgainstPercentage: number;
} {
  const totalVotes = votesFor + votesAgainst;
  const votesForPercentage = totalVotes === 0 ? 0 : (votesFor / totalVotes) * 100;
  const votesAgainstPercentage = totalVotes === 0 ? 0 : (votesAgainst / totalVotes) * 100;

  return {
    passed: votesForPercentage >= successThreshold,
    totalVotes,
    votesForPercentage,
    votesAgainstPercentage,
  };
}

/**
 * Validate if user can create a proposal
 */
export function canCreateProposal(votingPower: number): boolean {
  // Minimum voting power of 10 to create proposals
  return votingPower >= 10;
}

/**
 * Validate if user can vote on a proposal
 */
export function canVoteOnProposal(
  votingPower: number,
  proposal: Proposal,
  userAddress: Address
): boolean {
  // Must have at least 1 voting power
  if (votingPower < 1) return false;

  // Cannot vote if already voted
  const alreadyVoted = proposal.voters.some(
    (voter) => voter.address.toLowerCase() === userAddress.toLowerCase()
  );
  if (alreadyVoted) return false;

  // Proposal must be active
  if (proposal.status !== ProposalStatus.ACTIVE) return false;

  // Must be within voting window
  const now = new Date();
  if (now < proposal.startDate || now > proposal.endDate) return false;

  return true;
}

/**
 * Format voting power for display
 */
export function formatVotingPower(votingPower: number): string {
  if (votingPower >= 1000) {
    return `${(votingPower / 1000).toFixed(1)}k`;
  }
  if (votingPower >= 1) {
    return votingPower.toFixed(2);
  }
  return '< 1';
}

/**
 * Get voting power color for UI
 */
export function getVotingPowerColor(tier: keyof typeof VOTING_TIERS): string {
  return VOTING_TIERS[tier].color;
}

/**
 * Get voting tier label
 */
export function getVotingTierLabel(tier: keyof typeof VOTING_TIERS): string {
  return VOTING_TIERS[tier].label;
}

/**
 * Calculate voting reward for participation
 */
export function calculateVotingReward(
  votingPower: number,
  proposalType: ProposalType
): number {
  // Base reward: 0.1% of voting power
  let reward = votingPower * 0.001;

  // Bonus multipliers based on proposal type
  const multipliers: Record<ProposalType, number> = {
    [ProposalType.FEATURE_REQUEST]: 1.2,
    [ProposalType.BUG_REPORT]: 1.5,
    [ProposalType.RISK_PARAMETER]: 1.8,
    [ProposalType.VAULT_POLICY]: 1.6,
    [ProposalType.GUARDIAN_POLICY]: 1.4,
    [ProposalType.PROTOCOL_UPGRADE]: 2.0,
    [ProposalType.BUDGET_ALLOCATION]: 1.7,
    [ProposalType.COMMUNITY_INITIATIVE]: 1.3,
  };

  reward *= multipliers[proposalType] || 1.0;

  return Math.round(reward * 100) / 100;
}
