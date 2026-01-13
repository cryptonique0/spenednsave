import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Accept either an array or an object with `data` array
    const items = Array.isArray(body) ? body : (body.data || []);
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload, expected array' }, { status: 400 });
    }

    for (const item of items) {
      // Normalize fields: request.amount and nonce come as strings from localStorage export
      try {
        const normalized = {
          ...item,
          request: {
            ...item.request,
            amount: BigInt(item.request.amount),
            nonce: BigInt(item.request.nonce),
          },
          signatures: (item.signatures || []).map((s: any) => ({
            ...s,
            request: {
              ...s.request,
              amount: BigInt(s.request.amount),
              nonce: BigInt(s.request.nonce),
            },
          })),
        };

        GuardianSignatureDB.savePendingRequest(normalized);
      } catch (e) {
        // Skip invalid items but continue
        console.error('Failed to import item', item?.id, e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
