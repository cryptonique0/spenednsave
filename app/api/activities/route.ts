import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const account = url.searchParams.get('account');

    if (account) {
      const activities = await GuardianSignatureDB.getActivitiesByAccount(account);
      return NextResponse.json(activities);
    }

    const all = await GuardianSignatureDB.getAllActivities();
    return NextResponse.json(all);
  } catch (err) {
    console.error('[/api/activities] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id || !body.account || !body.type) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    await GuardianSignatureDB.saveActivity(body);
    const saved = await GuardianSignatureDB.getActivity(body.id);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
