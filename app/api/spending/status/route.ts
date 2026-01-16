import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/spending/status
 * 
 * This endpoint returns spending status metadata and calculation helpers.
 * The actual smart contract queries are performed client-side via wagmi hooks
 * to maintain real-time accuracy and avoid RPC request limits.
 * 
 * Query Parameters:
 * - vault: Vault contract address (required)
 * - token: Token contract address (required)
 * 
 * Returns: Configuration and warning level calculations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vault = searchParams.get('vault');
    const token = searchParams.get('token');

    if (!vault || !token) {
      return NextResponse.json(
        {
          error: 'Missing required parameters: vault and token',
          message: 'Query format: /api/spending/status?vault=0x...&token=0x...'
        },
        { status: 400 }
      );
    }

    const normalizedVault = vault.toLowerCase();
    const normalizedToken = token.toLowerCase();

    // Validate address format
    if (!normalizedVault.startsWith('0x') || normalizedVault.length !== 42) {
      return NextResponse.json({ error: 'Invalid vault address' }, { status: 400 });
    }
    if (!normalizedToken.startsWith('0x') || normalizedToken.length !== 42) {
      return NextResponse.json({ error: 'Invalid token address' }, { status: 400 });
    }

    const now = Math.floor(Date.now() / 1000);

    return NextResponse.json({
      vault: normalizedVault,
      token: normalizedToken,
      timestamp: now,
      nextDailyReset: now + 86400, // 24 hours
      nextWeeklyReset: now + (7 * 86400), // 7 days
      nextMonthlyReset: getNextMonthlyReset(now),
      // Warning thresholds
      warningThresholds: {
        warning: 75, // 75% of limit
        critical: 95  // 95% of limit
      }
    });
  } catch (error) {
    console.error('Error in spending status endpoint:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate the next monthly reset timestamp (first day of next month)
 */
function getNextMonthlyReset(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return Math.floor(nextMonth.getTime() / 1000);
}
