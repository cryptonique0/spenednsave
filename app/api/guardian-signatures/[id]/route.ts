import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

function serializeResponse(obj: any): any {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeResponse);
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = serializeResponse(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function GET(request: Request, context: any) {
  try {
    const params = await context?.params ?? {};
    const { id } = params;
    const row = await GuardianSignatureDB.getPendingRequest(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serializeResponse(row));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context?.params ?? {};
    const { id } = params;
    const body = await request.json();
    const existing = await GuardianSignatureDB.getPendingRequest(id);

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      request: body.request ?? existing.request,
      signatures: body.signatures ?? existing.signatures,
    };

    await GuardianSignatureDB.savePendingRequest(updated);
    const saved = await GuardianSignatureDB.getPendingRequest(id);
    return NextResponse.json(serializeResponse(saved));
  } catch (err) {
    console.error('PUT Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context?.params ?? {};
    const { id } = params;
    await GuardianSignatureDB.deletePendingRequest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
