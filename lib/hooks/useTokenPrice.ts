/**
 * Hook for Chainlink Price Feeds Integration
 * Fetches real-time USD prices for tokens
 */

import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';
import { CHAINLINK_ORACLES, getToken } from '@/lib/tokens';

/**
 * Chainlink AggregatorV3Interface ABI (read-only functions)
 */
const CHAINLINK_ABI = [
    {
        inputs: [],
        name: 'latestRoundData',
        outputs: [
            { name: 'roundId', type: 'uint80' },
            { name: 'answer', type: 'int256' },
            { name: 'startedAt', type: 'uint256' },
            { name: 'updatedAt', type: 'uint256' },
            { name: 'answeredInRound', type: 'uint80' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

/**
 * Hook to get token price in USD from Chainlink
 * @param chainId - Network chain ID
 * @param tokenSymbol - Token symbol (e.g., 'ETH', 'USDC')
 * @returns Price in USD with decimal places
 */
export function useTokenPrice(chainId: number, tokenSymbol: string) {
    const token = getToken(chainId, tokenSymbol);
    const oracleAddress = token?.oracleAddress;

    return useReadContract({
        address: oracleAddress as Address,
        abi: CHAINLINK_ABI,
        functionName: 'latestRoundData',
        query: {
            enabled: !!oracleAddress && !!chainId,
            refetchInterval: 30000, // Refetch every 30 seconds
        },
    });
}

/**
 * Hook to get decimal places for oracle price
 */
export function useTokenPriceDecimals(chainId: number, tokenSymbol: string) {
    const token = getToken(chainId, tokenSymbol);
    const oracleAddress = token?.oracleAddress;

    return useReadContract({
        address: oracleAddress as Address,
        abi: CHAINLINK_ABI,
        functionName: 'decimals',
        query: {
            enabled: !!oracleAddress,
        },
    });
}

/**
 * Hook to get multiple token prices at once
 */
export function useTokenPrices(chainId: number, symbols: string[]) {
    const prices: Record<string, number | null> = {};
    const isLoading: boolean[] = [];
    const isError: boolean[] = [];

    // Use individual hooks for each token
    const hooks = symbols.map((symbol) => ({
        symbol,
        price: useTokenPrice(chainId, symbol),
        decimals: useTokenPriceDecimals(chainId, symbol),
    }));

    hooks.forEach(({ symbol, price, decimals }) => {
        if (price.data && decimals.data) {
            const priceValue = Number(price.data[1]); // answer field
            const decimalPlaces = Number(decimals.data);
            prices[symbol] = priceValue / Math.pow(10, decimalPlaces);
        } else {
            prices[symbol] = null;
        }
        isLoading.push(price.isLoading || decimals.isLoading);
        isError.push(price.isError || decimals.isError);
    });

    return {
        prices,
        isLoading: isLoading.some((v) => v),
        isError: isError.some((v) => v),
    };
}

/**
 * Convert token amount to USD
 * @param tokenAmount - Amount of token (in token decimals)
 * @param tokenDecimals - Token decimal places
 * @param priceUSD - Price in USD from oracle
 */
export function convertToUSD(
    tokenAmount: bigint | number | string,
    tokenDecimals: number,
    priceUSD: number
): number {
    const amount = typeof tokenAmount === 'string' ? parseFloat(tokenAmount) : Number(tokenAmount);
    const normalizedAmount = amount / Math.pow(10, tokenDecimals);
    return normalizedAmount * priceUSD;
}

/**
 * Format USD price for display
 */
export function formatUSDPrice(amount: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

/**
 * Get all oracle addresses for a chain
 */
export function getChainOracles(chainId: number): Record<string, Address> {
    if (chainId === 8453) {
        return CHAINLINK_ORACLES.baseMainnet;
    }
    return CHAINLINK_ORACLES.baseSepolia;
}

/**
 * Hook to get total vault value in USD
 */
export function useTotalVaultValueUSD(
    chainId: number,
    balances: Record<string, bigint | number>
): {
    totalUSD: number;
    breakdown: Record<string, number>;
    isLoading: boolean;
} {
    const symbols = Object.keys(balances);
    const { prices, isLoading } = useTokenPrices(chainId, symbols);

    let totalUSD = 0;
    const breakdown: Record<string, number> = {};

    symbols.forEach((symbol) => {
        const token = getToken(chainId, symbol);
        if (token && prices[symbol]) {
            const valueUSD = convertToUSD(balances[symbol], token.decimals, prices[symbol]);
            breakdown[symbol] = valueUSD;
            totalUSD += valueUSD;
        }
    });

    return {
        totalUSD,
        breakdown,
        isLoading,
    };
}

/**
 * Hook to track historical price data (basic implementation)
 * In production, would use a backend service
 */
export function usePriceHistory(
    chainId: number,
    tokenSymbol: string,
    timeRange: '1d' | '7d' | '30d' = '7d'
) {
    const price = useTokenPrice(chainId, tokenSymbol);

    // In production, fetch historical data from an API
    // For now, just return current price
    const mockHistory = [
        { timestamp: Date.now() - 86400000, price: null },
        { timestamp: Date.now(), price: price.data ? Number(price.data[1]) : null },
    ];

    return {
        history: mockHistory,
        isLoading: price.isLoading,
    };
}
