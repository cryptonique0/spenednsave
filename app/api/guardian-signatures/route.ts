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

    // Email notification integration
    try {
      // Import here to avoid circular/server issues
      const { notifyUsersOnWithdrawalEvent } = await import('@/lib/services/email-notification-trigger');
      // Notify all guardians and the owner if they have opted in
      const involvedAddresses = [saved.createdBy, ...(saved.guardians || [])];
      await notifyUsersOnWithdrawalEvent({
        event: 'withdrawal-requested',
        vaultAddress: saved.vaultAddress,
        amount: saved.request?.amount?.toString?.() || '',
        reason: saved.request?.reason,
        involvedAddresses,
        extraData: { vaultName: saved.vaultName }
      });
    } catch (e) {
      // Log but don't block
      console.error('Email notification error:', e);
    }

    return NextResponse.json(saved);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
