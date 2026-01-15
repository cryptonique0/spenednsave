import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

/**
 * Returns badge eligibility scores for guardians based on activity stored in DB.
 * This endpoint is read-only and intended for owners to review eligible guardians.
 */
export async function GET() {
    try {
        const activities = await GuardianSignatureDB.getAllActivities();

        // Aggregate by account
        const stats: Record<string, { approvals: number; responseTimes: number[]; firstSeen?: number; lastSeen?: number }> = {};

        for (const a of activities) {
            const acct = (a.account || '').toLowerCase();
            if (!acct) continue;
            if (!stats[acct]) stats[acct] = { approvals: 0, responseTimes: [], firstSeen: a.timestamp, lastSeen: a.timestamp };

            const s = stats[acct];
            if (a.timestamp && (!s.firstSeen || a.timestamp < s.firstSeen)) s.firstSeen = a.timestamp;
            if (a.timestamp && (!s.lastSeen || a.timestamp > s.lastSeen)) s.lastSeen = a.timestamp;

            // Count approvals/signatures
            const t = (a.type || '').toLowerCase();
            if (t.includes('sign') || t.includes('approve') || t.includes('guardian_signature')) {
                s.approvals += 1;
            }

            // If details include response times, capture
            try {
                const d = a.details || {};
                // Expect details.requestCreatedAt and details.signedAt
                if (d && d.requestCreatedAt && d.signedAt) {
                    const req = Number(d.requestCreatedAt);
                    const sig = Number(d.signedAt || a.timestamp);
                    if (sig && req && sig >= req) s.responseTimes.push(sig - req);
                }
            } catch (e) {
                // ignore
            }
        }

        // Compute eligibility
        const results = Object.keys(stats).map((acct) => {
            const s = stats[acct];
            const avgResponse = s.responseTimes.length ? Math.round(s.responseTimes.reduce((a, b) => a + b, 0) / s.responseTimes.length) : null;
            const daysActive = s.firstSeen ? Math.floor((Date.now() - s.firstSeen) / (1000 * 60 * 60 * 24)) : 0;

            // Simple badge suggestions (server-only):
            // Tier badge by approvals: >=50 -> Gold (3), >=20 -> Silver (2), >=5 -> Bronze (1)
            let tier = 0;
            if (s.approvals >= 50) tier = 3;
            else if (s.approvals >= 20) tier = 2;
            else if (s.approvals >= 5) tier = 1;

            // Fast responder badge if avgResponse < 1 hour (3600s)
            const fastResponder = avgResponse !== null && avgResponse <= 3600 ? true : false;

            // Veteran badge if daysActive >= 180
            const veteran = daysActive >= 180;

            return {
                account: acct,
                approvals: s.approvals,
                avgResponseSeconds: avgResponse,
                daysActive,
                suggestedBadges: {
                    tier, // 0..3
                    fastResponder: fastResponder ? 10 : 0,
                    veteran: veteran ? 20 : 0,
                },
            };
        });

        return NextResponse.json(results);
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
