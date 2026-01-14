import { Guardian } from '../hooks/useVaultData';
import { ethers } from 'ethers';
import GuardianBadgeABI from '../abis/GuardianBadge.json';

// Badge criteria
const APPROVALS_THRESHOLDS = [5, 20, 50];
const RESPONSE_TIME_THRESHOLDS = [3600, 1800, 600]; // in seconds (1h, 30m, 10m)
const LONGEVITY_THRESHOLDS = [30, 90, 365]; // in days

export enum BadgeType {
  Approvals = 0,
  ResponseTime = 1,
  Longevity = 2,
}

export interface BadgeEligibility {
  badgeType: BadgeType;
  level: number;
  eligible: boolean;
}

// Example: calculate badge eligibility for a guardian
export function calculateGuardianBadges(
  guardian: Guardian,
  approvals: number,
  avgResponseTime: number,
  addedAt: number
): BadgeEligibility[] {
  const now = Date.now();
  // Approvals badge
  const approvalLevel = APPROVALS_THRESHOLDS.filter(t => approvals >= t).length;
  // Response time badge (lower is better)
  const responseLevel = RESPONSE_TIME_THRESHOLDS.filter(t => avgResponseTime <= t).length;
  // Longevity badge
  const days = (now - addedAt) / (1000 * 60 * 60 * 24);
  const longevityLevel = LONGEVITY_THRESHOLDS.filter(t => days >= t).length;

  return [
    { badgeType: BadgeType.Approvals, level: approvalLevel, eligible: approvalLevel > 0 },
    { badgeType: BadgeType.ResponseTime, level: responseLevel, eligible: responseLevel > 0 },
    { badgeType: BadgeType.Longevity, level: longevityLevel, eligible: longevityLevel > 0 },
  ];
}

// Mint badge if eligible (to be called by backend job or admin)
export async function mintGuardianBadge(
  provider: ethers.Signer,
  contractAddress: string,
  guardian: string,
  badgeType: BadgeType,
  level: number
) {
  const contract = new ethers.Contract(contractAddress, GuardianBadgeABI.default ?? GuardianBadgeABI, provider);
  return contract.mintBadge(guardian, badgeType, level);
}
