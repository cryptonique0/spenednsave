
'use client';

import { useState, useEffect } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { type Address, type Hex, getEventSelector, decodeEventLog } from 'viem';
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
    const [guardians, setGuardians] = useState<Guardian[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchGuardians() {
            if (!guardianTokenAddress || !publicClient) {
                setGuardians([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `guardians-cache-${guardianTokenAddress.toLowerCase()}`;
                
                console.log('[useGuardians] Fetching all guardians from', guardianTokenAddress);
                
                // Get current block number
                const currentBlock = await publicClient.getBlockNumber();
                
                // Find the GuardianAdded event topic
                const guardianAddedTopic = getEventSelector({ name: 'GuardianAdded', type: 'event', inputs: [
                    { indexed: true, name: 'guardian', type: 'address' },
                    { indexed: false, name: 'tokenId', type: 'uint256' },
                ] });
                
                // Fetch logs in chunks of 100,000 blocks (RPC limit)
                const CHUNK_SIZE = 100000n;
                const addedLogs: any[] = [];
                const removedLogs: any[] = [];
                
                let fromBlock = 0n;
                while (fromBlock <= currentBlock) {
                    const toBlock = currentBlock < fromBlock + CHUNK_SIZE - 1n ? currentBlock : fromBlock + CHUNK_SIZE - 1n;
                    
                    try {
                        // Fetch all logs from guardian token contract
                        const chunkLogs = await publicClient.getLogs({
                            address: guardianTokenAddress,
                            fromBlock,
                            toBlock,
                        });
                        
                        // Filter for GuardianAdded and GuardianRemoved events
                        for (const log of chunkLogs) {
                            try {
                                const decoded = decodeEventLog({
                                    abi: GuardianSBTABI,
                                    data: log.data,
                                    topics: log.topics,
                                } as any);
                                
                                if ((decoded as any).eventName === 'GuardianAdded') {
                                    addedLogs.push(log);
                                } else if ((decoded as any).eventName === 'GuardianRemoved') {
                                    removedLogs.push(log);
                                }
                            } catch (decodeErr) {
                                // Not a guardianship event, skip
                                continue;
                            }
                        }
                    } catch (chunkErr) {
                        console.error('[useGuardians] Error fetching chunk:', chunkErr);
                    }
                    
                    fromBlock = toBlock + 1n;
                }
                
                console.log('[useGuardians] Found', addedLogs.length, 'GuardianAdded events');
                console.log('[useGuardians] Found', removedLogs.length, 'GuardianRemoved events');

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
    }, [guardianTokenAddress, publicClient]);

    return { guardians, isLoading, error };
}

/**
 * Hook to fetch withdrawal history with caching
 */
export function useWithdrawalHistory(vaultAddress?: Address, limit = 50) {
    const publicClient = usePublicClient();

    const [withdrawals, setWithdrawals] = useState<WithdrawalEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetch = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        async function fetchWithdrawals() {
            if (!vaultAddress || !publicClient) {
                setWithdrawals([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `withdrawals-cache-${vaultAddress.toLowerCase()}`;
                console.log('[useWithdrawalHistory] Fetching withdrawals for vault:', vaultAddress);
                
                // Get current block number
                const currentBlock = await publicClient.getBlockNumber();
                
                // Get the Withdrawn event topic  
                const withdrawnTopic = getEventSelector({ 
                    name: 'Withdrawn', 
                    type: 'event', 
                    inputs: [
                        { indexed: true, name: 'token', type: 'address' },
                        { indexed: true, name: 'recipient', type: 'address' },
                        { indexed: false, name: 'amount', type: 'uint256' },
                        { indexed: false, name: 'reason', type: 'string' },
                    ] 
                });
                console.log('[useWithdrawalHistory] Withdrawn event topic:', withdrawnTopic);
                
                // Fetch logs in chunks of 100,000 blocks (RPC limit)
                const CHUNK_SIZE = 100000n;
                const allLogs: any[] = [];
                
                let fromBlock = 0n;
                while (fromBlock <= currentBlock) {
                    const toBlock = currentBlock < fromBlock + CHUNK_SIZE - 1n ? currentBlock : fromBlock + CHUNK_SIZE - 1n;
                    
                    try {
                        const chunkLogs = await publicClient.getLogs({
                            address: vaultAddress,
                            topics: [withdrawnTopic],
                            fromBlock,
                            toBlock,
                        });
                        allLogs.push(...chunkLogs);
                    } catch (chunkErr) {
                        console.error('[useWithdrawalHistory] Error fetching chunk:', chunkErr);
                    }
                    
                    fromBlock = toBlock + 1n;
                }
                
                console.log('[useWithdrawalHistory] Total logs from vault:', allLogs.length);
                
                const withdrawalEvents: WithdrawalEvent[] = [];
                
                for (const log of allLogs) {
                    try {
                        // Try to decode as Withdrawn event
                        const decoded = decodeEventLog({
                            abi: SpendVaultABI,
                            data: log.data,
                            topics: log.topics,
                        } as any);
                        
                        if ((decoded as any).eventName === 'Withdrawn') {
                            const args = (decoded as any).args;
                            const blockNumber = log.blockNumber;
                            const transactionHash = log.transactionHash;
                            
                            if (blockNumber && transactionHash) {
                                // Get block to get timestamp
                                const block = await publicClient.getBlock({ blockNumber });
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
                        }
                    } catch (decodeErr) {
                        // Not a Withdrawn event, continue
                        continue;
                    }
                }
                
                console.log('[useWithdrawalHistory] Found', withdrawalEvents.length, 'Withdrawn events');

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
    }, [vaultAddress, publicClient, limit, refreshTrigger]);

    return { withdrawals, isLoading, error, refetch };
}

/**
 * Hook to fetch deposit history with caching
 */
export function useDepositHistory(vaultAddress?: Address, limit = 50) {
    const publicClient = usePublicClient();
    const [deposits, setDeposits] = useState<DepositEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetch = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        async function fetchDeposits() {
            if (!vaultAddress || !publicClient) {
                setDeposits([]);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `deposits-cache-${vaultAddress.toLowerCase()}`;
                console.log('[useDepositHistory] Fetching deposits for vault:', vaultAddress);
                console.log('[useDepositHistory] PublicClient available:', !!publicClient);
                
                // Get current block number
                const currentBlockNum = await publicClient.getBlockNumber();
                console.log('[useDepositHistory] Current block:', currentBlockNum);
                
                // Get the Deposited event topic
                const depositedTopic = getEventSelector({ 
                    name: 'Deposited', 
                    type: 'event', 
                    inputs: [
                        { indexed: true, name: 'token', type: 'address' },
                        { indexed: true, name: 'from', type: 'address' },
                        { indexed: false, name: 'amount', type: 'uint256' },
                    ] 
                });
                console.log('[useDepositHistory] Deposited event topic:', depositedTopic);
                
                // Fetch logs in chunks of 100,000 blocks (RPC limit)
                const CHUNK_SIZE = 100000n;
                const allLogs: any[] = [];
                
                let fromBlock = 0n;
                console.log('[useDepositHistory] Starting chunked fetch with fromBlock:', fromBlock, 'currentBlock:', currentBlockNum);
                
                while (fromBlock <= currentBlockNum) {
                    const toBlock = currentBlockNum < fromBlock + CHUNK_SIZE - 1n ? currentBlockNum : fromBlock + CHUNK_SIZE - 1n;
                    console.log('[useDepositHistory] Fetching chunk from', String(fromBlock), 'to', String(toBlock));
                    
                    try {
                        const chunkLogs = await publicClient.getLogs({
                            address: vaultAddress,
                            topics: [depositedTopic],
                            fromBlock,
                            toBlock,
                        });
                        console.log('[useDepositHistory] Found', chunkLogs.length, 'logs in chunk');
                        allLogs.push(...chunkLogs);
                    } catch (chunkErr) {
                        console.error('[useDepositHistory] Error fetching chunk:', chunkErr);
                    }
                    
                    fromBlock = toBlock + 1n;
                    console.log('[useDepositHistory] Next fromBlock:', String(fromBlock));
                }
                
                console.log('[useDepositHistory] Total logs from vault:', allLogs.length);
                
                // Store debug info in localStorage for inspection
                try {
                    localStorage.setItem(`deposits-debug-${vaultAddress.toLowerCase()}`, JSON.stringify({
                        timestamp: new Date().toISOString(),
                        vaultAddress,
                        currentBlock: String(currentBlockNum),
                        logsFound: allLogs.length,
                        depositedTopic,
                    }));
                } catch (e) {
                    console.warn('[useDepositHistory] Failed to store debug info:', e);
                }
                
                // The Deposited event signature: keccak256("Deposited(address,address,uint256)")
                // This is 0xb71b7d3b... but we'll decode all logs and filter by event name
                const depositEvents: DepositEvent[] = [];
                
                console.log('[useDepositHistory] Processing', allLogs.length, 'logs...');
                
                for (const log of allLogs) {
                    try {
                        // Try to decode as Deposited event
                        const decoded = decodeEventLog({
                            abi: SpendVaultABI,
                            data: log.data,
                            topics: log.topics,
                        } as any);
                        
                        console.log('[useDepositHistory] Decoded log:', decoded);
                        
                        if ((decoded as any).eventName === 'Deposited') {
                            const args = (decoded as any).args;
                            const blockNumber = log.blockNumber;
                            const transactionHash = log.transactionHash;
                            
                            if (blockNumber && transactionHash) {
                                // Get block to get timestamp
                                const block = await publicClient.getBlock({ blockNumber });
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
                        }
                    } catch (decodeErr) {
                        // Not a Deposited event, continue
                        continue;
                    }
                }
                
                console.log('[useDepositHistory] Found', depositEvents.length, 'Deposited events after decoding');
                if (depositEvents.length > 0) {
                    console.log('[useDepositHistory] First deposit event:', depositEvents[0]);
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
    }, [vaultAddress, publicClient, limit, refreshTrigger]);

    return { deposits, isLoading, error, refetch };
}

/**
 * Hook to get all activity (deposits, withdrawals, guardian changes)
 */
export function useVaultActivity(vaultAddress?: Address, guardianTokenAddress?: Address, limit = 50) {
    const { deposits, isLoading: depositsLoading, refetch: refetchDeposits } = useDepositHistory(vaultAddress, limit);
    const { withdrawals, isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useWithdrawalHistory(vaultAddress, limit);
    const { guardians, isLoading: guardiansLoading } = useGuardians(guardianTokenAddress);

    const [activities, setActivities] = useState<any[]>([]);
    const [loadingTimeout, setLoadingTimeout] = useState(false);
    
    // Force loading state to false after 10 seconds
    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log('[useVaultActivity] Loading timeout - forcing completion');
            setLoadingTimeout(true);
        }, 10000);
        
        return () => clearTimeout(timeout);
    }, []);
    
    const isLoading = (depositsLoading || withdrawalsLoading || guardiansLoading) && !loadingTimeout;

    const refetch = () => {
        refetchDeposits();
        refetchWithdrawals();
    };

    useEffect(() => {
        console.log('[useVaultActivity] Combining activities...');
        console.log('[useVaultActivity] deposits:', deposits.length, deposits);
        console.log('[useVaultActivity] withdrawals:', withdrawals.length, withdrawals);
        console.log('[useVaultActivity] guardians:', guardians.length, guardians);
        
        const allActivities = [
            ...deposits.map(d => {
                console.log('[useVaultActivity] Mapping deposit:', d);
                return {
                    type: 'deposit' as const,
                    timestamp: d.timestamp,
                    blockNumber: d.blockNumber,
                    data: d,
                };
            }),
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
        console.log('[useVaultActivity] Final activities count:', limited.length);
        console.log('[useVaultActivity] Final activities:', limited);
        setActivities(limited);
    }, [deposits, withdrawals, guardians, limit]);

    return { activities, isLoading, refetch };
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

