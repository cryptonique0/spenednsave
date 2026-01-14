import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function GET(request: Request, context: any) {
  try {
    const { id } = context?.params ?? {};
    const row = GuardianSignatureDB.getPendingRequest(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const { id } = context?.params ?? {};
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

    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const { id } = context?.params ?? {};
    GuardianSignatureDB.deletePendingRequest(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
