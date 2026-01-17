/**
 * Generic hooks for token operations (approval, deposit)
 * Works with any ERC-20 token
 */

import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { ERC20ABI } from '@/lib/abis/ERC20';
import { getToken } from '@/lib/tokens';

/**
 * Hook for ERC-20 token approval
 */
export function useApproveToken(
    chainId: number,
    tokenSymbol: string,
    spenderAddress?: string
) {
    const { address: userAddress } = useAccount();
    const token = getToken(chainId, tokenSymbol);

    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const approve = async (amount: string) => {
        if (!token || !spenderAddress || token.type === 'native') {
            return;
        }

        const parsedAmount = parseUnits(amount, token.decimals);

        writeContract({
            address: token.address as Address,
            abi: ERC20ABI,
            functionName: 'approve',
            args: [spenderAddress as Address, parsedAmount],
        });
    };

    // Check current allowance
    const { data: allowance } = useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [userAddress as Address, spenderAddress as Address],
        query: {
            enabled: !!userAddress && !!spenderAddress && token?.type === 'erc20',
        },
    });

    return {
        approve,
        isApproving: isPending,
        isSuccess,
        error,
        isApproved: (allowance || 0n) > 0n,
        allowance,
    };
}

/**
 * Hook for depositing tokens to vault
 */
export function useDepositToken(
    chainId: number,
    tokenSymbol: string,
    vaultAddress?: string
) {
    const { address: userAddress } = useAccount();
    const token = getToken(chainId, tokenSymbol);

    const { writeContract, isPending, isSuccess, error } = useWriteContract();

    const deposit = async (amount: string) => {
        if (!token || !vaultAddress) {
            return;
        }

        const parsedAmount = parseUnits(amount, token.decimals);

        if (token.type === 'native') {
            // ETH deposit - send as value
            writeContract({
                address: vaultAddress as Address,
                abi: [
                    {
                        inputs: [],
                        stateMutability: 'payable',
                        type: 'fallback',
                    },
                ] as any,
                functionName: 'fallback',
                value: parsedAmount,
            });
        } else {
            // ERC-20 deposit
            writeContract({
                address: vaultAddress as Address,
                abi: [
                    {
                        inputs: [
                            { internalType: 'address', name: 'token', type: 'address' },
                            { internalType: 'uint256', name: 'amount', type: 'uint256' },
                        ],
                        name: 'deposit',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function',
                    },
                ] as any,
                functionName: 'deposit',
                args: [token.address as Address, parsedAmount],
            });
        }
    };

    // Get token balance
    const { data: balance } = useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: [userAddress as Address],
        query: {
            enabled: !!userAddress && token?.type === 'erc20',
        },
    });

    return {
        deposit,
        isDepositing: isPending,
        isSuccess,
        error,
        balance,
    };
}

/**
 * Hook to get balance of any token
 */
export function useTokenBalance(
    chainId: number,
    tokenSymbol: string,
    userAddress?: Address
) {
    const token = getToken(chainId, tokenSymbol);

    return useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'balanceOf',
        args: userAddress ? [userAddress] : undefined,
        query: {
            enabled: !!userAddress && token?.type === 'erc20',
        },
    });
}

/**
 * Hook to get multiple token balances at once
 */
export function useTokenBalances(
    chainId: number,
    symbols: string[],
    userAddress?: Address
) {
    const balances: Record<string, bigint | null> = {};
    const isLoading: boolean[] = [];

    const hooks = symbols.map((symbol) => ({
        symbol,
        balance: useTokenBalance(chainId, symbol, userAddress),
    }));

    hooks.forEach(({ symbol, balance }) => {
        balances[symbol] = balance.data || null;
        isLoading.push(balance.isLoading);
    });

    return {
        balances,
        isLoading: isLoading.some((v) => v),
    };
}

/**
 * Hook to get ERC-20 token details
 */
export function useTokenDetails(chainId: number, tokenSymbol: string) {
    const token = getToken(chainId, tokenSymbol);

    const { data: name } = useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'name',
        query: {
            enabled: !!token && token.type === 'erc20',
        },
    });

    const { data: symbol } = useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'symbol',
        query: {
            enabled: !!token && token.type === 'erc20',
        },
    });

    const { data: decimals } = useReadContract({
        address: token?.address as Address,
        abi: ERC20ABI,
        functionName: 'decimals',
        query: {
            enabled: !!token && token.type === 'erc20',
        },
    });

    return {
        name: name || token?.name,
        symbol: symbol || token?.symbol,
        decimals: decimals || token?.decimals,
    };
}
