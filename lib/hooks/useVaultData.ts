'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { type Address, type Hex } from 'viem';
import { GuardianSBTABI } from '@/lib/abis/GuardianSBT';
import { SpendVaultABI } from '@/lib/abis/SpendVault';

export interface Guardian {
    address: Address;
    tokenId: bigint;
    addedAt: number;
    blockNumber: bigint;
    txHash: Hex;
}

export interface WithdrawalEvent {
    token: Address;
    recipient: Address;
    amount: bigint;
    reason: string;
    timestamp: number;
    blockNumber: bigint;
    txHash: Hex;
}

export interface DepositEvent {
    token: Address;
    from: Address;
    amount: bigint;
    timestamp: number;
    blockNumber: bigint;
    txHash: Hex;
}

/**
 * Hook to fetch all current guardians for a vault with caching optimization
 */
export function useGuardians(guardianTokenAddress?: Address) {
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchGuardians() {
            if (!guardianTokenAddress || !publicClient || !currentBlock) {
                setGuardians([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `guardians-cache-${guardianTokenAddress.toLowerCase()}`;
                
                console.log('[useGuardians] Fetching all guardians from', guardianTokenAddress);
                
                // Fetch logs with proper ABI definitions
                const addedLogs = await publicClient.getLogs({
                    address: guardianTokenAddress,
                    event: GuardianSBTABI.find((a: any) => a.name === 'GuardianAdded') as any,
                    fromBlock: 0n,
                    toBlock: 'latest',
                });

                const removedLogs = await publicClient.getLogs({
                    address: guardianTokenAddress,
                    event: GuardianSBTABI.find((a: any) => a.name === 'GuardianRemoved') as any,
                    fromBlock: 0n,
                    toBlock: 'latest',
                });

                console.log('[useGuardians] Found', addedLogs.length, 'GuardianAdded events');
                console.log('[useGuardians] Found', removedLogs.length, 'GuardianRemoved events');

                // Build map of current guardians (added but not removed)
                const guardianMap = new Map<string, Guardian>();
                const removedSet = new Set<string>();

                // Track removed guardians
                for (const log of removedLogs) {
                    const args = (log as any).args;
                    if (args?.guardian) {
                        removedSet.add(args.guardian.toLowerCase());
                    }
                }

                // Fetch block timestamps in parallel for guardians (optimization)
                const activeGuardians = addedLogs.filter(log => {
                    const args = (log as any).args;
                    return args?.guardian && !removedSet.has(args.guardian.toLowerCase());
                });

                console.log('[useGuardians] Active guardians after filtering:', activeGuardians.length);

                const blockNumbers = [...new Set(activeGuardians.map(log => log.blockNumber).filter(n => n !== null && n !== undefined) as bigint[])];
                
                if (blockNumbers.length > 0) {
                    const blockPromises = blockNumbers.map(blockNum => 
                        publicClient.getBlock({ blockNumber: blockNum })
                    );
                    const blocks = await Promise.all(blockPromises);
                    const blockMap = new Map(blockNumbers.map((num, i) => [num, blocks[i]]));

                    // Add active guardians
                    for (const log of activeGuardians) {
                        const args = (log as any).args;
                        const blockNumber = log.blockNumber;
                        const transactionHash = log.transactionHash;
                        
                        if (!args?.guardian || blockNumber === null || transactionHash === null) continue;
                        
                        const block = blockMap.get(blockNumber);
                        if (block) {
                            guardianMap.set(args.guardian.toLowerCase(), {
                                address: args.guardian as Address,
                                tokenId: args.tokenId as bigint,
                                addedAt: Number(block.timestamp) * 1000,
                                blockNumber,
                                txHash: transactionHash as Hex,
                            });
                        }
                    }
                }

                const guardianList = Array.from(guardianMap.values())
                    .sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

                console.log('[useGuardians] Final guardian list:', guardianList);
                setGuardians(guardianList);

                // Cache the results for faster reloads
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(guardianList.map(g => ({
                        ...g,
                        tokenId: g.tokenId.toString(),
                        blockNumber: g.blockNumber.toString(),
                    }))));
                } catch (e) {
                    console.warn('[useGuardians] Failed to cache results:', e);
                }
            } catch (err) {
                console.error('[useGuardians] Error fetching guardians:', err);
                
                // Try to load from cache as fallback
                try {
                    const cacheKey = `guardians-cache-${guardianTokenAddress.toLowerCase()}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        const cachedGuardians = JSON.parse(cached).map((g: any) => ({
                            ...g,
                            tokenId: BigInt(g.tokenId),
                            blockNumber: BigInt(g.blockNumber),
                        }));
                        console.log('[useGuardians] Loaded guardians from cache as fallback');
                        setGuardians(cachedGuardians);
                    } else {
                        setError(err instanceof Error ? err : new Error('Failed to fetch guardians'));
                    }
                } catch (cacheErr) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch guardians'));
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchGuardians();
    }, [guardianTokenAddress, publicClient, currentBlock]);

    return { guardians, isLoading, error };
}

/**
 * Hook to fetch withdrawal history with caching
 */
export function useWithdrawalHistory(vaultAddress?: Address, limit = 50) {
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const [withdrawals, setWithdrawals] = useState<WithdrawalEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchWithdrawals() {
            if (!vaultAddress || !publicClient || !currentBlock) {
                setWithdrawals([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `withdrawals-cache-${vaultAddress.toLowerCase()}`;
                console.log('[useWithdrawalHistory] Fetching withdrawals for vault:', vaultAddress);
                
                const withdrawalLogs = await publicClient.getLogs({
                    address: vaultAddress,
                    event: SpendVaultABI.find((a: any) => a.name === 'Withdrawn') as any,
                    fromBlock: 0n,
                    toBlock: 'latest',
                });

                console.log('[useWithdrawalHistory] Found', withdrawalLogs.length, 'withdrawal events');

                // Batch fetch blocks for withdrawals
                const blockNumbers = [...new Set(withdrawalLogs.map(log => log.blockNumber).filter(n => n !== null && n !== undefined) as bigint[])];
                const blockPromises = blockNumbers.map(blockNum => 
                    publicClient.getBlock({ blockNumber: blockNum })
                );
                const blocks = await Promise.all(blockPromises);
                const blockMap = new Map(blockNumbers.map((num, i) => [num, blocks[i]]));

                const withdrawalEvents: WithdrawalEvent[] = [];
                for (const log of withdrawalLogs) {
                    const args = (log as any).args;
                    const blockNumber = log.blockNumber;
                    const transactionHash = log.transactionHash;
                    
                    if (!args || blockNumber === null || transactionHash === null) continue;
                    
                    const block = blockMap.get(blockNumber);
                    if (block) {
                        withdrawalEvents.push({
                            token: args.token as Address,
                            recipient: args.recipient as Address,
                            amount: args.amount as bigint,
                            reason: args.reason as string,
                            timestamp: Number(block.timestamp) * 1000,
                            blockNumber,
                            txHash: transactionHash as Hex,
                        });
                    }
                }

                const finalWithdrawals = withdrawalEvents.slice(-limit);
                setWithdrawals(finalWithdrawals.sort((a, b) => Number(b.blockNumber - a.blockNumber)));

                // Cache the results
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(withdrawalEvents.map(w => ({
                        ...w,
                        amount: w.amount.toString(),
                        blockNumber: w.blockNumber.toString(),
                    }))));
                } catch (e) {
                    console.warn('[useWithdrawalHistory] Failed to cache results:', e);
                }
            } catch (err) {
                console.error('Error fetching withdrawals:', err);
                
                // Try to load from cache as fallback
                try {
                    const cacheKey = `withdrawals-cache-${vaultAddress.toLowerCase()}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        const cachedWithdrawals = JSON.parse(cached).map((w: any) => ({
                            ...w,
                            amount: BigInt(w.amount),
                            blockNumber: BigInt(w.blockNumber),
                        }));
                        console.log('[useWithdrawalHistory] Loaded withdrawals from cache as fallback');
                        setWithdrawals(cachedWithdrawals.slice(-limit));
                    } else {
                        setError(err instanceof Error ? err : new Error('Failed to fetch withdrawals'));
                    }
                } catch (cacheErr) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch withdrawals'));
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchWithdrawals();
    }, [vaultAddress, publicClient, currentBlock, limit]);

    return { withdrawals, isLoading, error };
}

/**
 * Hook to fetch deposit history with caching
 */
export function useDepositHistory(vaultAddress?: Address, limit = 50) {
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    const [deposits, setDeposits] = useState<DepositEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchDeposits() {
            if (!vaultAddress || !publicClient || !currentBlock) {
                setDeposits([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `deposits-cache-${vaultAddress.toLowerCase()}`;
                console.log('[useDepositHistory] Fetching deposits for vault:', vaultAddress);
                
                const depositLogs = await publicClient.getLogs({
                    address: vaultAddress,
                    event: SpendVaultABI.find((a: any) => a.name === 'Deposited') as any,
                    fromBlock: 0n,
                    toBlock: 'latest',
                });

                console.log('[useDepositHistory] Found', depositLogs.length, 'deposit events');

                // Batch fetch blocks for deposits
                const blockNumbers = [...new Set(depositLogs.map(log => log.blockNumber).filter(n => n !== null && n !== undefined) as bigint[])];
                const blockPromises = blockNumbers.map(blockNum => 
                    publicClient.getBlock({ blockNumber: blockNum })
                );
                const blocks = await Promise.all(blockPromises);
                const blockMap = new Map(blockNumbers.map((num, i) => [num, blocks[i]]));

                const depositEvents: DepositEvent[] = [];
                for (const log of depositLogs) {
                    const args = (log as any).args;
                    const blockNumber = log.blockNumber;
                    const transactionHash = log.transactionHash;
                    
                    if (!args || blockNumber === null || transactionHash === null) continue;
                    
                    const block = blockMap.get(blockNumber);
                    if (block) {
                        depositEvents.push({
                            token: args.token as Address,
                            from: args.from as Address,
                            amount: args.amount as bigint,
                            timestamp: Number(block.timestamp) * 1000,
                            blockNumber,
                            txHash: transactionHash as Hex,
                        });
                    }
                }

                const finalDeposits = depositEvents.slice(-limit);
                setDeposits(finalDeposits.sort((a, b) => Number(b.blockNumber - a.blockNumber)));

                // Cache the results
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(depositEvents.map(d => ({
                        ...d,
                        amount: d.amount.toString(),
                        blockNumber: d.blockNumber.toString(),
                    }))));
                } catch (e) {
                    console.warn('[useDepositHistory] Failed to cache results:', e);
                }
            } catch (err) {
                console.error('Error fetching deposits:', err);
                
                // Try to load from cache as fallback
                try {
                    const cacheKey = `deposits-cache-${vaultAddress.toLowerCase()}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        const cachedDeposits = JSON.parse(cached).map((d: any) => ({
                            ...d,
                            amount: BigInt(d.amount),
                            blockNumber: BigInt(d.blockNumber),
                        }));
                        console.log('[useDepositHistory] Loaded deposits from cache as fallback');
                        setDeposits(cachedDeposits.slice(-limit));
                    } else {
                        setError(err instanceof Error ? err : new Error('Failed to fetch deposits'));
                    }
                } catch (cacheErr) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch deposits'));
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchDeposits();
    }, [vaultAddress, publicClient, currentBlock, limit]);

    return { deposits, isLoading, error };
}

/**
 * Hook to get all activity (deposits, withdrawals, guardian changes)
 */
export function useVaultActivity(vaultAddress?: Address, guardianTokenAddress?: Address, limit = 50) {
    const { deposits, isLoading: depositsLoading } = useDepositHistory(vaultAddress, limit);
    const { withdrawals, isLoading: withdrawalsLoading } = useWithdrawalHistory(vaultAddress, limit);
    const { guardians, isLoading: guardiansLoading } = useGuardians(guardianTokenAddress);

    const [activities, setActivities] = useState<any[]>([]);
    const isLoading = depositsLoading || withdrawalsLoading || guardiansLoading;

    useEffect(() => {
        console.log('[useVaultActivity] Combining activities...');
        console.log('[useVaultActivity] deposits:', deposits.length);
        console.log('[useVaultActivity] withdrawals:', withdrawals.length);
        console.log('[useVaultActivity] guardians:', guardians.length);
        
        const allActivities = [
            ...deposits.map(d => ({
                type: 'deposit' as const,
                timestamp: d.timestamp,
                blockNumber: d.blockNumber,
                data: d,
            })),
            ...withdrawals.map(w => ({
                type: 'withdrawal' as const,
                timestamp: w.timestamp,
                blockNumber: w.blockNumber,
                data: w,
            })),
            ...guardians.map(g => ({
                type: 'guardian_added' as const,
                timestamp: g.addedAt,
                blockNumber: g.blockNumber,
                data: g,
            })),
        ];

        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        const limited = allActivities.slice(0, limit);
        console.log('[useVaultActivity] Final activities:', limited.length);
        setActivities(limited);
    }, [deposits, withdrawals, guardians, limit]);

    return { activities, isLoading };
}

/**
 * Hook to get emergency unlock state
 */
export function useEmergencyUnlockState(unlockRequestTime?: bigint, timeRemaining?: bigint) {
    const [state, setState] = useState<{
        isActive: boolean;
        canExecute: boolean;
        timeLeft: { d: number; h: number; m: number; s: number } | null;
    }>({
        isActive: false,
        canExecute: false,
        timeLeft: null,
    });

    useEffect(() => {
        if (!unlockRequestTime || unlockRequestTime === 0n) {
            setState({
                isActive: false,
                canExecute: false,
                timeLeft: null,
            });
            return;
        }

        const isActive = unlockRequestTime > 0n;
        const remaining = timeRemaining ? Number(timeRemaining) : 0;
        const canExecute = remaining === 0;

        if (remaining > 0) {
            const d = Math.floor(remaining / (60 * 60 * 24));
            const h = Math.floor((remaining % (60 * 60 * 24)) / (60 * 60));
            const m = Math.floor((remaining % (60 * 60)) / 60);
            const s = Math.floor(remaining % 60);

            setState({
                isActive,
                canExecute,
                timeLeft: { d, h, m, s },
            });
        } else {
            setState({
                isActive,
                canExecute,
                timeLeft: { d: 0, h: 0, m: 0, s: 0 },
            });
        }
    }, [unlockRequestTime, timeRemaining]);

    return state;
}

