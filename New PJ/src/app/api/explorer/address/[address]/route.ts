import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/basescan';

export async function GET(
  _req: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }

  const txs = await getTransactions(address, { page: 1, offset: 10, sort: 'desc' });
  return NextResponse.json({ transactions: txs ?? [] });
}
