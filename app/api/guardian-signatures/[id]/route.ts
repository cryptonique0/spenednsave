import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

// Helper to convert BigInt values to strings for JSON serialization
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
    const { id } = context?.params ?? {};
    const row = await GuardianSignatureDB.getPendingRequest(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(serializeResponse(row));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const { id } = context?.params ?? {};
    const body = await request.json();
    const existing = await GuardianSignatureDB.getPendingRequest(id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Merge existing with provided body
    const updated = {
      ...existing,
      ...body,
      // ensure request and signatures remain JSON-compatible
      request: body.request ?? existing.request,
      signatures: body.signatures ?? existing.signatures,
    };

    await GuardianSignatureDB.savePendingRequest(updated);
    const saved = await GuardianSignatureDB.getPendingRequest(id);

    // Email notification integration
    try {
      const { notifyUsersOnWithdrawalEvent } = await import('@/lib/services/email-notification-trigger');
      // Determine event type
      let event: import('@/lib/services/email-notifications').EmailEventType | undefined;
      if (updated.status === 'approved') event = 'withdrawal-approved';
      else if (updated.status === 'rejected') event = 'withdrawal-rejected';
      else if (updated.status === 'executed') event = 'withdrawal-executed';
      else if (updated.status === 'emergency') event = 'emergency-unlock-requested';
      if (event) {
        const involvedAddresses = [updated.createdBy, ...(updated.guardians || [])];
        await notifyUsersOnWithdrawalEvent({
          event,
          vaultAddress: updated.vaultAddress,
          amount: updated.request?.amount?.toString?.() || '',
          reason: updated.request?.reason,
          involvedAddresses,
          extraData: { vaultName: updated.vaultName }
        });
      }
    } catch (e) {
      console.error('Email notification error:', e);
    }

    return NextResponse.json(serializeResponse(saved));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const { id } = context?.params ?? {};
    await GuardianSignatureDB.deletePendingRequest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
