import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : (body.data || []);
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload, expected array' }, { status: 400 });
    }

    for (const item of items) {
      try {
        // Ensure required fields
        if (!item.id || !item.account || !item.type || !item.timestamp) continue;
        // Normalize details to JSON
        const activity = {
          id: item.id,
          account: item.account,
          type: item.type,
          details: item.details ?? item.data ?? {},
          relatedRequestId: item.relatedRequestId ?? null,
          timestamp: Number(item.timestamp),
        };
        GuardianSignatureDB.saveActivity(activity as any);
      } catch (e) {
        console.error('Failed to import activity', item?.id, e);
        continue;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
