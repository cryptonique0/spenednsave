import { NextRequest, NextResponse } from 'next/server';
import { publicClient } from '@/lib/publicClient';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { type Address, isAddress } from 'viem';

/**
 * GET /api/withdrawals/[id]?vault=0x...
 * Fetch details for a specific queued withdrawal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vaultAddress = searchParams.get('vault') as Address;
    const withdrawalId = params.id;

    if (!vaultAddress || !isAddress(vaultAddress)) {
      return NextResponse.json(
        { error: 'Invalid vault address' },
        { status: 400 }
      );
    }

    const id = parseInt(withdrawalId);
    if (isNaN(id) || id < 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal ID' },
        { status: 400 }
      );
    }

    try {
      const queued = await publicClient.readContract({
        address: vaultAddress,
        abi: SpendVaultABI,
        functionName: 'getQueuedWithdrawal',
        args: [BigInt(id)]
      });

      const now = Math.floor(Date.now() / 1000);
      const readyAt = Number((queued as any).readyAt || 0);
      const timeRemaining = Math.max(0, readyAt - now);

      // Determine status
      let status = 'pending';
      if ((queued as any).isExecuted) status = 'executed';
      else if ((queued as any).isCancelled) status = 'cancelled';
      else if ((queued as any).isFrozen) status = 'frozen';
      else if (timeRemaining === 0) status = 'ready';

      const withdrawal = {
        withdrawalId: id,
        vault: vaultAddress,
        token: (queued as any).token,
        amount: (queued as any).amount.toString(),
        recipient: (queued as any).recipient,
        queuedAt: Number((queued as any).queuedAt || 0),
        readyAt,
        readyAtDate: new Date(readyAt * 1000).toISOString(),
        timeRemaining,
        timeRemainingFormatted: formatTimeRemaining(timeRemaining),
        status,
        isFrozen: (queued as any).isFrozen,
        isExecuted: (queued as any).isExecuted,
        isCancelled: (queued as any).isCancelled,
        freezeCount: Number((queued as any).freezeCount || 0),
        reason: (queued as any).reason || '',
        category: (queued as any).category || '',
        signers: (queued as any).signers || [],
        timestamp: now
      };

      return NextResponse.json({
        success: true,
        withdrawal
      });
    } catch (err) {
      console.error('Error reading withdrawal from contract:', err);
      return NextResponse.json(
        { error: 'Withdrawal not found or error reading contract', details: String(err) },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Helper to format time remaining
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds === 0) return 'Ready';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}
