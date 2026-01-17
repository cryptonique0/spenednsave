import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

// Compute leaderboard metrics for all guardians
function computeLeaderboard(activities: any[]) {
  // Map: address -> stats
  const stats: Record<string, {
    approvals: number;
    totalResponse: number;
    responseCount: number;
    firstAction: number;
    lastAction: number;
  }> = {};

  for (const a of activities) {
    if (a.type !== 'guardian_approval' || !a.account) continue;
    if (!stats[a.account]) {
      stats[a.account] = {
        approvals: 0,
        totalResponse: 0,
        responseCount: 0,
        firstAction: a.timestamp,
        lastAction: a.timestamp,
      };
    }
    stats[a.account].approvals++;
    stats[a.account].lastAction = Math.max(stats[a.account].lastAction, a.timestamp);
    stats[a.account].firstAction = Math.min(stats[a.account].firstAction, a.timestamp);
    if (a.details && a.details.requestCreatedAt && a.timestamp) {
      stats[a.account].totalResponse += Math.max(0, a.timestamp - a.details.requestCreatedAt);
      stats[a.account].responseCount++;
    }
  }

  // Convert to array and compute averages
  const leaderboard = Object.entries(stats).map(([account, s]) => ({
    account,
    approvals: s.approvals,
    avgResponseSeconds: s.responseCount ? Math.round(s.totalResponse / s.responseCount) : null,
    longevityDays: Math.round((Date.now() - s.firstAction) / (1000 * 60 * 60 * 24)),
    firstAction: s.firstAction,
    lastAction: s.lastAction,
  }));

  // Sort: by approvals desc, then avgResponseSeconds asc, then longevity desc
  leaderboard.sort((a, b) => {
    if (b.approvals !== a.approvals) return b.approvals - a.approvals;
    if ((a.avgResponseSeconds ?? Infinity) !== (b.avgResponseSeconds ?? Infinity)) return (a.avgResponseSeconds ?? Infinity) - (b.avgResponseSeconds ?? Infinity);
    return b.longevityDays - a.longevityDays;
  });

  return leaderboard;
}

export async function GET() {
  try {
    const activities = await GuardianSignatureDB.getAllActivities();
    const leaderboard = computeLeaderboard(activities);
    return NextResponse.json(leaderboard);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
