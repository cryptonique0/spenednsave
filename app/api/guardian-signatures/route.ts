import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function GET() {
  try {
    const all = GuardianSignatureDB.getPendingRequests();
    return NextResponse.json(all);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    GuardianSignatureDB.savePendingRequest(body);
    const saved = GuardianSignatureDB.getPendingRequest(body.id);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
