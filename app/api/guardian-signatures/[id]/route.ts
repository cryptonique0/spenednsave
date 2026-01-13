import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const row = GuardianSignatureDB.getPendingRequest(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const existing = GuardianSignatureDB.getPendingRequest(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Merge existing with provided body
    const updated = {
      ...existing,
      ...body,
      // ensure request and signatures remain JSON-compatible
      request: body.request ?? existing.request,
      signatures: body.signatures ?? existing.signatures,
    };

    GuardianSignatureDB.savePendingRequest(updated);
    const saved = GuardianSignatureDB.getPendingRequest(id);
    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    GuardianSignatureDB.deletePendingRequest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
