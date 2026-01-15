import { NextResponse } from 'next/server';
import { GuardianSignatureDB } from '@/lib/services/guardian-signature-db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body) ? body : (body.data || []);
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload, expected array' }, { status: 400 });
    }

    let importedCount = 0;
    for (const item of items) {
      try {
        // Ensure required fields
        if (!item.address || !item.tokenId || !item.tokenAddress) continue;
        
        const guardian = {
          address: String(item.address).toLowerCase(),
          tokenId: String(item.tokenId),
          addedAt: Number(item.addedAt) || Date.now(),
          blockNumber: String(item.blockNumber || '0'),
          txHash: String(item.txHash || ''),
          tokenAddress: String(item.tokenAddress).toLowerCase(),
        };
        
        GuardianSignatureDB.saveGuardian(guardian);
        importedCount++;
      } catch (e) {
        console.error('Failed to import guardian', item?.address, e);
        continue;
      }
    }

    console.log(`[/api/guardians/import] Imported ${importedCount} guardians`);
    return NextResponse.json({ ok: true, imported: importedCount });
  } catch (err) {
    console.error('[/api/guardians/import] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
