import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

// Compute reputation metrics for a guardian
function computeGuardianReputation(activities: any[]) {
  if (!activities.length) return {
    reliability: 0,
    approvals: 0,
    avgResponseSeconds: null,
    history: [],
  };

  // Only consider approval actions
  const approvals = activities.filter(a => a.type === 'guardian_approval');
  const approvalsCount = approvals.length;

  // Reliability: ratio of approvals to total requests seen (if available)
  // For now, just use count
  // TODO: If we can correlate with total requests, use that for a ratio

  // Response speed: average time from request creation to approval
  let totalResponse = 0;
  let responseCount = 0;
  const history = [];
  for (const a of approvals) {
    if (a.details && a.details.requestCreatedAt && a.timestamp) {
      const resp = Math.max(0, a.timestamp - a.details.requestCreatedAt);
      totalResponse += resp;
      responseCount++;
    }
    history.push({
      timestamp: a.timestamp,
      vault: a.details?.vaultAddress,
      recipient: a.details?.recipient,
      amount: a.details?.amount,
      reason: a.details?.reason,
      txHash: a.details?.txHash,
    });
  }
  const avgResponseSeconds = responseCount ? Math.round(totalResponse / responseCount) : null;

  return {
    reliability: approvalsCount, // Placeholder
    approvals: approvalsCount,
    avgResponseSeconds,
    history,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const account = url.searchParams.get('account');
    if (!account) return NextResponse.json({ error: 'Missing account' }, { status: 400 });
    const activities = await GuardianSignatureDB.getActivitiesByAccount(account);
    const rep = computeGuardianReputation(activities);
    return NextResponse.json(rep);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
