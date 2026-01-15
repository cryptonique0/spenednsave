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

export async function GET(request: Request) {
  try {
    // Extract vaultAddress from query parameters
    const { searchParams } = new URL(request.url);
    const vaultAddress = searchParams.get('vaultAddress');
    
    console.log('[API] GET /api/guardian-signatures - fetching pending requests', vaultAddress ? `for vault: ${vaultAddress}` : '');
    
    const all = await GuardianSignatureDB.getPendingRequests();
    console.log(`[API] Found ${all.length} total pending requests`);
    
    // Filter by vaultAddress if provided
    let filtered = all;
    if (vaultAddress) {
      filtered = all.filter((req: any) => req.vaultAddress?.toLowerCase() === vaultAddress.toLowerCase());
      console.log(`[API] Filtered to ${filtered.length} requests for vault ${vaultAddress}`);
    }
    
    return NextResponse.json(serializeResponse(filtered));
  } catch (err) {
    console.error('[API] GET /api/guardian-signatures error:', err);
    return NextResponse.json({ error: String(err), message: 'Failed to fetch pending requests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[API] POST /api/guardian-signatures');
    console.log('[API] Request ID:', body.id);
    console.log('[API] Vault Address:', body.vaultAddress);
    console.log('[API] Guardians array:', body.guardians);
    console.log('[API] Full request body:', JSON.stringify(body, null, 2));
    
    if (!body || !body.id) {
      return NextResponse.json({ error: 'Invalid body - missing id' }, { status: 400 });
    }

    if (!body.vaultAddress) {
      return NextResponse.json({ error: 'Invalid body - missing vaultAddress' }, { status: 400 });
    }

    if (!body.request) {
      return NextResponse.json({ error: 'Invalid body - missing request' }, { status: 400 });
    }

    if (body.requiredQuorum === undefined) {
      return NextResponse.json({ error: 'Invalid body - missing requiredQuorum' }, { status: 400 });
    }

    if (!body.createdBy) {
      return NextResponse.json({ error: 'Invalid body - missing createdBy' }, { status: 400 });
    }

    console.log('[API] All validations passed. Saving to database...');
    await GuardianSignatureDB.savePendingRequest(body);
    console.log('[API] Saved successfully. Retrieving from database...');
    
    const saved = await GuardianSignatureDB.getPendingRequest(body.id);
    console.log('[API] Retrieved request from DB:', saved?.id);
    console.log('[API] Guardians in saved request:', saved?.guardians);

    // Email notification integration
    try {
      // Import here to avoid circular/server issues
      const { notifyUsersOnWithdrawalEvent } = await import('@/lib/services/email-notification-trigger');
      // Notify all guardians and the owner if they have opted in
      const involvedAddresses = [saved!.createdBy, ...(saved!.guardians || [])];
      console.log('[API] Notifying involved addresses:', involvedAddresses);
      
      await notifyUsersOnWithdrawalEvent({
        event: 'withdrawal-requested',
        vaultAddress: saved!.vaultAddress,
        amount: saved!.request?.amount?.toString?.() || '',
        reason: saved!.request?.reason,
        involvedAddresses,
        extraData: { vaultName: (saved as any)?.vaultName }
      });
    } catch (e) {
      // Log but don't block
      console.error('Email notification error:', e);
    }

    const response = serializeResponse(saved);
    console.log('[API] Sending response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (err) {
    console.error('POST /api/guardian-signatures error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
