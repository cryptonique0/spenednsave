import { NextRequest, NextResponse } from 'next/server';

// POST /api/emergency-contacts/[address]/remove
export async function POST(req: NextRequest, { params }: { params: { address: string } }) {
  const { address } = params;
  // TODO: Call contract removeEmergencyContact(address)
  // For now, just return success
  return NextResponse.json({ success: true, message: 'Contact removed (mock)' });
}
