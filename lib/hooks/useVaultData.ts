
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
    const [serverGuardians, setServerGuardians] = useState<Guardian[] | null>(null);
    const [serverLoading, setServerLoading] = useState(false);
    const [shouldLoadOnChain, setShouldLoadOnChain] = useState(true);

    // Fetch guardians from DB first
    async function fetchServerGuardians() {
        if (!guardianTokenAddress) return;
        setServerLoading(true);
        try {
            const res = await fetch(`/api/guardians?tokenAddress=${encodeURIComponent(String(guardianTokenAddress))}`);
            if (!res.ok) {
                console.log('[useGuardians] DB query returned error, will load from RPC');
                setServerGuardians([]);
                setShouldLoadOnChain(true);
                return;
            }
            const items = await res.json();
            if (Array.isArray(items) && items.length > 0) {
                console.log('[useGuardians] Found guardians in DB, using those instead of RPC');
                const mapped = items.map((g: any) => ({
                    address: g.address,
                    tokenId: typeof g.tokenId === 'string' ? BigInt(g.tokenId) : g.tokenId,
                    addedAt: g.addedAt,
                    blockNumber: typeof g.blockNumber === 'string' ? BigInt(g.blockNumber) : g.blockNumber,
                    txHash: g.txHash,
                }));
                setServerGuardians(mapped);
                setShouldLoadOnChain(false); // Don't load from RPC since we have DB data
            } else {
                console.log('[useGuardians] DB is empty, will load from RPC');
                setServerGuardians([]);
                setShouldLoadOnChain(true); // Load from RPC since DB is empty
            }
        } catch (e) {
            console.error('Failed to fetch server guardians:', e);
            setServerGuardians([]);
            setShouldLoadOnChain(true); // Load from RPC if fetch fails
        } finally {
            setServerLoading(false);
        }
    }

    useEffect(() => {
        async function fetchGuardians() {
            if (!guardianTokenAddress || !publicClient) {
                setGuardians([]);
                return;
            }

            // Fetch from DB first
            await fetchServerGuardians();
        }

        fetchGuardians();
    }, [guardianTokenAddress]);

    useEffect(() => {
        async function fetchFromRPC() {
            if (!guardianTokenAddress || !publicClient || !shouldLoadOnChain) {
                if (serverGuardians && serverGuardians.length > 0) {
                    console.log('[useGuardians] Using guardians from DB:', serverGuardians.length);
                    setGuardians(serverGuardians);
                } else {
                    setGuardians([]);
                }
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const cacheKey = `guardians-cache-${guardianTokenAddress.toLowerCase()}`;
                
                console.log('[useGuardians] Fetching all guardians from RPC');
                
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
                                } as any) as any;

                                if (decoded.eventName === 'GuardianAdded') {
                                    addedLogs.push({ log, decoded });
                                } else if (decoded.eventName === 'GuardianRemoved') {
                                    removedLogs.push({ log, decoded });
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

                // Build map of current guardians (added but not removed)
                const guardianMap = new Map<string, Guardian>();
                const removedSet = new Set<string>();

                // Track removed guardians
                for (const entry of removedLogs) {
                    const args = (entry.decoded as any).args;
                    if (args?.guardian) {
                        removedSet.add(args.guardian.toLowerCase());
                    }
                }

                // Fetch block timestamps in parallel for guardians (optimization)
                const activeGuardians = addedLogs.filter(entry => {
                    const args = (entry.decoded as any).args;
                    return args?.guardian && !removedSet.has(args.guardian.toLowerCase());
                });

                console.log('[useGuardians] Active guardians after filtering:', activeGuardians.length);

                const blockNumbers = [...new Set(activeGuardians.map(entry => entry.log.blockNumber).filter(n => n !== null && n !== undefined) as bigint[])];
                
                if (blockNumbers.length > 0) {
                    const blockPromises = blockNumbers.map(blockNum => 
                        publicClient.getBlock({ blockNumber: blockNum })
                    );
                    const blocks = await Promise.all(blockPromises);
                    const blockMap = new Map(blockNumbers.map((num, i) => [num, blocks[i]]));

                    // Add active guardians
                    for (const entry of activeGuardians) {
                        const args = (entry.decoded as any).args;
                        const blockNumber = entry.log.blockNumber;
                        const transactionHash = entry.log.transactionHash;

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

                // Auto-migrate to DB if DB is empty
                try {
                    if (serverGuardians !== null && serverGuardians.length === 0 && guardianList.length > 0) {
                        console.log('[useGuardians] Auto-migrating guardians to DB:', guardianList.length);
                        const payload = guardianList.map(g => ({
                            address: g.address,
                            tokenId: g.tokenId.toString(),
                            addedAt: g.addedAt,
                            blockNumber: g.blockNumber.toString(),
                            txHash: g.txHash,
                            tokenAddress: String(guardianTokenAddress),
                        }));
                        const resp = await fetch('/api/guardians/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        });
                        if (resp.ok) {
                            console.log('[useGuardians] Auto-migration to DB successful');
                            setServerGuardians(guardianList);
                        } else {
                            console.warn('[useGuardians] Failed to import guardians to server', resp.status);
                        }
                    }
                } catch (e) {
                    console.error('[useGuardians] Auto-migration failed:', e);
                }
            } catch (err) {
                console.error('[useGuardians] Error fetching guardians:', err);
                
                // Try to load from server DB or cache as fallback
                try {
                    // First try server guardians if we have them
                    if (serverGuardians && serverGuardians.length > 0) {
                        console.log('[useGuardians] Using server guardians as fallback:', serverGuardians.length);
                        setGuardians(serverGuardians);
                        setError(null);
                        return;
                    }
                    
                    // Then try cache
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
                        setError(null); // Clear error since we have cached data
                        return;
                    }
                    
                    // No cache available, set error
                    const errorMsg = err instanceof Error ? err.message : 'Failed to fetch guardians';
                    setError(new Error(`${errorMsg}. Please refresh the page or try again later.`));
                    setGuardians([]); // Set empty list rather than failing completely
                } catch (cacheErr) {
                    console.error('[useGuardians] Error in fallback:', cacheErr);
                    setError(err instanceof Error ? err : new Error('Failed to fetch guardians'));
                    setGuardians([]);
                }
            } finally {
                setIsLoading(false);
            }
        }

        fetchFromRPC();
    }, [guardianTokenAddress, publicClient, shouldLoadOnChain, serverGuardians]);

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
                
                // Try to load from cache first
                try {
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        const cachedWithdrawals = JSON.parse(cached).map((w: any) => ({
                            ...w,
                            amount: BigInt(w.amount),
                            blockNumber: BigInt(w.blockNumber),
                        }));
                        console.log('[useWithdrawalHistory] Loaded withdrawals from cache');
                        setWithdrawals(cachedWithdrawals.slice(-limit));
                        setIsLoading(false);
                        return;
                    }
                } catch (cacheErr) {
                    console.warn('[useWithdrawalHistory] Cache load failed:', cacheErr);
                }
                
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
                
                // Fetch logs in chunks of 100,000 blocks (RPC limit) - only scan last 5M blocks for efficiency
                const CHUNK_SIZE = 100000n;
                const MAX_BLOCKS_BACK = 5000000n;
                const startBlock = currentBlock > MAX_BLOCKS_BACK ? currentBlock - MAX_BLOCKS_BACK : 0n;
                const allLogs: any[] = [];
                
                let fromBlock = startBlock;
                console.log('[useWithdrawalHistory] Scanning from block', String(fromBlock), 'to', String(currentBlock));
                
                while (fromBlock <= currentBlock) {
                    const toBlock = currentBlock < fromBlock + CHUNK_SIZE - 1n ? currentBlock : fromBlock + CHUNK_SIZE - 1n;
                    
                    try {
                        // Some RPCs are more reliable with topic filters; use the event selector as topic0
                        const chunkLogs = await (publicClient.getLogs as any)({
                            address: vaultAddress,
                            fromBlock,
                            toBlock,
                            topics: [withdrawnTopic],
                        });
                        console.log('[useWithdrawalHistory] Chunk', String(fromBlock), '-', String(toBlock), ':', chunkLogs.length, 'logs');
                        allLogs.push(...chunkLogs);
                    } catch (chunkErr) {
                        console.error('[useWithdrawalHistory] Error fetching chunk:', chunkErr);
                    }
                    
                    fromBlock = toBlock + 1n;
                }
                
                console.log('[useWithdrawalHistory] Total logs from vault:', allLogs.length);
                
                const withdrawalEvents: WithdrawalEvent[] = [];
                const blockCache = new Map<bigint, { timestamp: bigint }>();
                
                // Batch fetch blocks to get timestamps (max 10 at a time)
                const uniqueBlockNumbers = [...new Set(allLogs.map(l => l.blockNumber))];
                console.log('[useWithdrawalHistory] Fetching timestamps for', uniqueBlockNumbers.length, 'unique blocks');
                
                for (let i = 0; i < uniqueBlockNumbers.length; i += 10) {
                    const batch = uniqueBlockNumbers.slice(i, i + 10);
                    try {
                        const blocks = await Promise.all(batch.map(bn => publicClient.getBlock({ blockNumber: bn as any })));
                        blocks.forEach((block, idx) => {
                            if (block) blockCache.set(batch[idx], block);
                        });
                    } catch (err) {
                        console.warn('[useWithdrawalHistory] Failed to fetch block batch:', err);
                    }
                }
                
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
                                const block = blockCache.get(blockNumber);
                                const timestamp = block ? Number(block.timestamp) * 1000 : 0;
                                
                                withdrawalEvents.push({
                                    token: args.token as Address,
                                    recipient: args.recipient as Address,
                                    amount: args.amount as bigint,
                                    reason: args.reason as string,
                                    timestamp,
                                    blockNumber,
                                    txHash: transactionHash as Hex,
                                });
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
                setError(err instanceof Error ? err : new Error('Failed to fetch withdrawals'));
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
                
                // Try to load from cache first
                try {
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) {
                        const cachedDeposits = JSON.parse(cached).map((d: any) => ({
                            ...d,
                            amount: BigInt(d.amount),
                            blockNumber: BigInt(d.blockNumber),
                        }));
                        console.log('[useDepositHistory] Loaded deposits from cache');
                        setDeposits(cachedDeposits.slice(-limit));
                        setIsLoading(false);
                        return;
                    }
                } catch (cacheErr) {
                    console.warn('[useDepositHistory] Cache load failed:', cacheErr);
                }
                
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
                
                // Fetch logs in chunks of 100,000 blocks (RPC limit) - only scan last 5M blocks for efficiency
                const CHUNK_SIZE = 100000n;
                const MAX_BLOCKS_BACK = 5000000n;
                const startBlock = currentBlockNum > MAX_BLOCKS_BACK ? currentBlockNum - MAX_BLOCKS_BACK : 0n;
                const allLogs: any[] = [];
                
                let fromBlock = startBlock;
                console.log('[useDepositHistory] Scanning from block', String(fromBlock), 'to', String(currentBlockNum));
                
                while (fromBlock <= currentBlockNum) {
                    const toBlock = currentBlockNum < fromBlock + CHUNK_SIZE - 1n ? currentBlockNum : fromBlock + CHUNK_SIZE - 1n;
                    console.log('[useDepositHistory] Fetching chunk from', String(fromBlock), 'to', String(toBlock));
                    
                    try {
                        // Use topic-based filtering for deposits to improve compatibility with RPC providers
                        const chunkLogs = await (publicClient.getLogs as any)({
                            address: vaultAddress,
                            fromBlock,
                            toBlock,
                            topics: [depositedTopic],
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
                
                const blockCache = new Map<bigint, { timestamp: bigint }>();
                
                // Batch fetch blocks to get timestamps (max 10 at a time)
                const uniqueBlockNumbers = [...new Set(allLogs.map(l => l.blockNumber))];
                console.log('[useDepositHistory] Fetching timestamps for', uniqueBlockNumbers.length, 'unique blocks');
                
                for (let i = 0; i < uniqueBlockNumbers.length; i += 10) {
                    const batch = uniqueBlockNumbers.slice(i, i + 10);
                    try {
                        const blocks = await Promise.all(batch.map(bn => publicClient.getBlock({ blockNumber: bn as any })));
                        blocks.forEach((block, idx) => {
                            if (block) blockCache.set(batch[idx], block);
                        });
                    } catch (err) {
                        console.warn('[useDepositHistory] Failed to fetch block batch:', err);
                    }
                }
                
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
                                const block = blockCache.get(blockNumber);
                                const timestamp = block ? Number(block.timestamp) * 1000 : 0;
                                
                                depositEvents.push({
                                    token: args.token as Address,
                                    from: args.from as Address,
                                    amount: args.amount as bigint,
                                    timestamp,
                                    blockNumber,
                                    txHash: transactionHash as Hex,
                                });
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
                setError(err instanceof Error ? err : new Error('Failed to fetch deposits'));
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
    const [serverActivities, setServerActivities] = useState<any[] | null>(null);
    const [serverLoading, setServerLoading] = useState(false);
    const [migrated, setMigrated] = useState(false);
    const [shouldLoadOnChain, setShouldLoadOnChain] = useState(true);
    
    // Force loading state to false after 10 seconds
    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log('[useVaultActivity] Loading timeout - forcing completion');
            setLoadingTimeout(true);
        }, 10000);
        
        return () => clearTimeout(timeout);
    }, []);
    
    const isLoading = ((shouldLoadOnChain && (depositsLoading || withdrawalsLoading || guardiansLoading) && !loadingTimeout) || serverLoading);

    const refetch = () => {
        refetchDeposits();
        refetchWithdrawals();
        if (vaultAddress) {
            setShouldLoadOnChain(true);
            fetchServerActivities();
        }
    };

    async function fetchServerActivities() {
        if (!vaultAddress) return;
        setServerLoading(true);
        try {
            const res = await fetch(`/api/activities?account=${encodeURIComponent(String(vaultAddress))}`);
            if (!res.ok) {
                console.log('[useVaultActivity] DB query returned error, will load from RPC');
                setServerActivities([]);
                setShouldLoadOnChain(true);
                return;
            }
            const items = await res.json();
            if (Array.isArray(items) && items.length > 0) {
                console.log('[useVaultActivity] Found activities in DB, using those instead of RPC');
                const mapped = items.map((it: any) => ({
                    type: it.type,
                    timestamp: it.timestamp,
                    blockNumber: it.blockNumber ?? 0,
                    data: it.details ?? {},
                }));
                setServerActivities(mapped.slice(0, limit));
                setShouldLoadOnChain(false); // Don't load from RPC since we have DB data
            } else {
                console.log('[useVaultActivity] DB is empty, will load from RPC');
                setServerActivities([]);
                setShouldLoadOnChain(true); // Load from RPC since DB is empty
            }
        } catch (e) {
            console.error('Failed to fetch server activities:', e);
            setServerActivities([]);
            setShouldLoadOnChain(true); // Load from RPC if fetch fails
        } finally {
            setServerLoading(false);
        }
    }

    useEffect(() => {
        console.log('[useVaultActivity] Combining activities...');
        console.log('[useVaultActivity] shouldLoadOnChain:', shouldLoadOnChain);
        console.log('[useVaultActivity] deposits:', deposits.length, deposits);
        console.log('[useVaultActivity] withdrawals:', withdrawals.length, withdrawals);
        console.log('[useVaultActivity] guardians:', guardians.length, guardians);
        
        // If we have server activities, always prefer them and don't load from RPC
        if (serverActivities !== null && serverActivities.length > 0) {
            console.log('[useVaultActivity] Using activities from DB:', serverActivities.length);
            setActivities(serverActivities.slice(0, limit));
            return;
        }

        // If DB is empty or not fetched yet, load from RPC
        if (!shouldLoadOnChain) {
            console.log('[useVaultActivity] DB is empty and should not load from RPC');
            setActivities([]);
            return;
        }

        console.log('[useVaultActivity] Loading activities from RPC');
        const allActivities = [
            ...deposits.map(d => ({ type: 'deposit' as const, timestamp: d.timestamp, blockNumber: d.blockNumber, data: d })),
            ...withdrawals.map(w => ({ type: 'withdrawal' as const, timestamp: w.timestamp, blockNumber: w.blockNumber, data: w })),
            ...guardians.map(g => ({ type: 'guardian_added' as const, timestamp: g.addedAt, blockNumber: g.blockNumber, data: g })),
        ];

        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        const limited = allActivities.slice(0, limit);
        setActivities(limited);

        // Auto-import to server DB if server has no activities yet and we haven't migrated
        (async () => {
            try {
                const migratedFlag = typeof window !== 'undefined' ? localStorage.getItem(`activities-migrated-${String(vaultAddress).toLowerCase()}`) : null;
                if (serverActivities !== null && Array.isArray(serverActivities) && serverActivities.length === 0 && !migrated && !migratedFlag) {

                    // Helper to recursively convert all bigint values to strings
                    function convertBigInts(obj: any): any {
                        if (typeof obj === 'bigint') return obj.toString();
                        if (Array.isArray(obj)) return obj.map(convertBigInts);
                        if (obj && typeof obj === 'object') {
                            const res: any = {};
                            for (const k in obj) res[k] = convertBigInts(obj[k]);
                            return res;
                        }
                        return obj;
                    }

                    const payload = limited.map((act) => ({
                        id: `${String(vaultAddress)}-${act.type}-${String(act.blockNumber ?? '0')}-${act.timestamp}`,
                        account: String(vaultAddress),
                        type: act.type,
                        details: act.data ?? {},
                        relatedRequestId: (act.data as any)?.id ?? (act.data as any)?.requestId ?? null,
                        blockNumber: act.blockNumber ?? 0,
                        timestamp: act.timestamp,
                    }));

                    if (payload.length > 0) {
                        console.log('[useVaultActivity] Auto-migrating activities to DB:', payload.length);
                        const resp = await fetch('/api/activities/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                        });
                        if (resp.ok) {
                            setMigrated(true);
                            try { if (typeof window !== 'undefined') localStorage.setItem(`activities-migrated-${String(vaultAddress).toLowerCase()}`, '1'); } catch (e) {}
                            setServerActivities(payload.map(p => ({ type: p.type, timestamp: p.timestamp, blockNumber: p.blockNumber ?? 0, data: p.details })));
                        } else {
                            console.warn('Failed to import activities to server', resp.status);
                        }
                    }
                }
            } catch (e) {
                console.error('Auto-migration failed:', e);
            }
        })();
    }, [deposits, withdrawals, guardians, limit, serverActivities, shouldLoadOnChain]);

    // Fetch server activities on vault change
    useEffect(() => {
        if (!vaultAddress) return;
        fetchServerActivities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vaultAddress]);

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

