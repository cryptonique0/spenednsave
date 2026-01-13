import type { PublicClient, Log } from 'viem';

/**
 * Maximum block range allowed by most RPC providers
 * Base Sepolia allows 100,000 blocks per query
 */
const MAX_BLOCK_RANGE = 100000;

interface GetLogsParams {
    address?: `0x${string}` | `0x${string}`[];
    event?: any;
    events?: any;
    args?: any;
    strict?: boolean;
}

/**
 * Fetch logs in chunks to avoid exceeding RPC provider's block range limit
 * 
 * @param publicClient - The public client to use for queries
 * @param params - GetLogs parameters (address, event, topics, etc.)
 * @param fromBlock - Starting block number (can be 'earliest' or a bigint)
 * @param toBlock - Ending block number (can be 'latest' or a bigint)
 * @param chunkSize - Maximum blocks per query (default: 100,000)
 * @returns Array of all logs found across all chunks
 */
export async function getLogsInChunks(
    publicClient: PublicClient,
    params: GetLogsParams,
    fromBlock: bigint | 'earliest' = 0n,
    toBlock: bigint | 'latest' = 'latest',
    chunkSize: number = MAX_BLOCK_RANGE
): Promise<Log[]> {
    // Get the current block number if toBlock is 'latest'
    let endBlock: bigint;
    if (toBlock === 'latest') {
        const currentBlock = await publicClient.getBlockNumber();
        endBlock = currentBlock;
    } else {
        endBlock = toBlock;
    }

    // Handle 'earliest' fromBlock
    const startBlock = fromBlock === 'earliest' ? 0n : fromBlock;

    // If the range is within the chunk size, just make one request
    const totalBlocks = endBlock - startBlock;
    if (totalBlocks <= BigInt(chunkSize)) {
        return await publicClient.getLogs({
            ...params,
            fromBlock: startBlock,
            toBlock: endBlock,
        } as any) as Log[];
    }

    // Otherwise, chunk the requests
    const allLogs: Log[] = [];
    let currentFrom = startBlock;

    while (currentFrom <= endBlock) {
        const currentTo = currentFrom + BigInt(chunkSize) - 1n > endBlock 
            ? endBlock 
            : currentFrom + BigInt(chunkSize) - 1n;

        console.log(`[getLogsInChunks] Fetching logs from block ${currentFrom} to ${currentTo}`);

        try {
            const logs = await publicClient.getLogs({
                ...params,
                fromBlock: currentFrom,
                toBlock: currentTo,
            } as any) as Log[];

            allLogs.push(...logs);
            console.log(`[getLogsInChunks] Found ${logs.length} logs in this chunk (total: ${allLogs.length})`);
        } catch (error) {
            console.error(`[getLogsInChunks] Error fetching logs from ${currentFrom} to ${currentTo}:`, error);
            throw error;
        }

        currentFrom = currentTo + 1n;
    }

    return allLogs;
}
