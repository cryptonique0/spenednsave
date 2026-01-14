import { NextRequest, NextResponse } from 'next/server';

// POST /api/vault-transfer
// Body: { newOwner: string }
export async function POST(req: NextRequest) {
  const { newOwner } = await req.json();
  // TODO: Call contract requestVaultTransfer(newOwner)
  // For now, just return success
  return NextResponse.json({ success: true, message: 'Transfer request submitted (mock)' });
}
