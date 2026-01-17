'use client';

import { useState, useCallback, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address } from 'viem';

// Types
export interface WithdrawalItem {
  token: Address;
  amount: bigint;
  recipient: Address;
  reason: string;
  category: string;
  withdrawalId?: bigint;
  isQueued: boolean;
  executed?: boolean;
}

export interface WithdrawalBatch {
  batchId: bigint;
  vaultAddress: Address;
  creator: Address;
  createdAt: bigint;
  expiresAt: bigint;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'cancelled' | 'partial_fail';
  itemCount: bigint;
  totalAmount: bigint;
  approvalCount: bigint;
  requiredApprovals: bigint;
}

export interface BatchExecutionResult {
  batchId: bigint;
  successCount: bigint;
  failureCount: bigint;
  failureReasons: string[];
  executedAt: bigint;
}

// Hook: Create batch
export function useCreateBatch(batchManagerAddress: Address) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<bigint | null>(null);

  const { writeContractAsync } = useWriteContract();

  const createBatch = useCallback(
    async (vaultAddress: Address, items: WithdrawalItem[], requiredApprovals: bigint = 2n) => {
      setIsLoading(true);
      setError(null);
      setBatchId(null);

      try {
        // Validate batch
        if (items.length === 0) {
          throw new Error('Batch must contain at least 1 item');
        }
        if (items.length > 50) {
          throw new Error('Batch cannot exceed 50 items');
        }

        // Validate all items use same token
        const primaryToken = items[0].token;
        const allSameToken = items.every((item) => item.token === primaryToken);
        if (!allSameToken) {
          throw new Error('All items must use the same token');
        }

        // Execute transaction
        const hash = await writeContractAsync({
          address: batchManagerAddress,
          abi: BATCH_MANAGER_ABI,
          functionName: 'createBatch',
          args: [vaultAddress, items, requiredApprovals]
        });

        // Parse batch ID from events or return value
        // This would be enhanced with actual event parsing
        setBatchId(0n); // Placeholder

        return hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create batch';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [batchManagerAddress, writeContractAsync]
  );

  return { createBatch, isLoading, error, batchId };
}

// Hook: Approve batch
export function useApproveBatch(batchManagerAddress: Address) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  const approveBatch = useCallback(
    async (batchId: bigint, signature?: `0x${string}`) => {
      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: batchManagerAddress,
          abi: BATCH_MANAGER_ABI,
          functionName: 'approveBatch',
          args: [batchId, signature || ('0x' as `0x${string}`)]
        });

        return hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to approve batch';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [batchManagerAddress, writeContractAsync]
  );

  return { approveBatch, isLoading, error };
}

// Hook: Revoke approval
export function useRevokeBatchApproval(batchManagerAddress: Address) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  const revokeBatchApproval = useCallback(
    async (batchId: bigint) => {
      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: batchManagerAddress,
          abi: BATCH_MANAGER_ABI,
          functionName: 'revokeBatchApproval',
          args: [batchId]
        });

        return hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to revoke approval';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [batchManagerAddress, writeContractAsync]
  );

  return { revokeBatchApproval, isLoading, error };
}

// Hook: Execute batch
export function useExecuteBatch(batchManagerAddress: Address) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync: executeWriteContract } = useWriteContract();

  const executeBatch = useCallback(
    async (batchId: bigint) => {
      setIsLoading(true);
      setError(null);

      try {
        const hash = await executeWriteContract({
          address: batchManagerAddress,
          abi: BATCH_MANAGER_ABI,
          functionName: 'executeBatch',
          args: [batchId]
        });

        return hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to execute batch';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [batchManagerAddress, executeWriteContract]
  );

  return { executeBatch, isLoading, error };
}

// Hook: Cancel batch
export function useCancelBatch(batchManagerAddress: Address) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  const cancelBatch = useCallback(
    async (batchId: bigint, reason: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const hash = await writeContractAsync({
          address: batchManagerAddress,
          abi: BATCH_MANAGER_ABI,
          functionName: 'cancelBatch',
          args: [batchId, reason]
        });

        return hash;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel batch';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [batchManagerAddress, writeContractAsync]
  );

  return { cancelBatch, isLoading, error };
}

// Hook: Fetch batch details
export function useBatchDetails(batchManagerAddress: Address, batchId: bigint | null) {
  const { data: batchData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getBatch',
    args: batchId !== null ? [batchId] : undefined,
    query: { enabled: batchId !== null }
  });

  const batch: WithdrawalBatch | null = batchData
    ? {
        batchId: batchId!,
        vaultAddress: batchData[0] as Address,
        creator: batchData[1] as Address,
        createdAt: batchData[2] as bigint,
        expiresAt: batchData[3] as bigint,
        status: getBatchStatusLabel(batchData[4] as number),
        itemCount: batchData[5] as bigint,
        totalAmount: batchData[6] as bigint,
        approvalCount: batchData[7] as bigint,
        requiredApprovals: batchData[8] as bigint
      }
    : null;

  return { batch, isLoading, error };
}

// Hook: Fetch batch items
export function useBatchItems(batchManagerAddress: Address, batchId: bigint | null) {
  const { data: itemsData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getBatchItems',
    args: batchId !== null ? [batchId] : undefined,
    query: { enabled: batchId !== null }
  });

  const items: WithdrawalItem[] = itemsData && Array.isArray(itemsData)
    ? (itemsData as any[]).map((item: any) => ({
        token: item.token as Address,
        amount: item.amount as bigint,
        recipient: item.recipient as Address,
        reason: item.reason as string,
        category: item.category as string,
        withdrawalId: item.withdrawalId as bigint,
        isQueued: item.isQueued as boolean,
        executed: item.executed as boolean
      }))
    : [];

  return { items, isLoading, error };
}

// Hook: Fetch batch approvers
export function useBatchApprovers(batchManagerAddress: Address, batchId: bigint | null) {
  const { data: approversData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getBatchApprovers',
    args: batchId !== null ? [batchId] : undefined,
    query: { enabled: batchId !== null }
  });

  const approvers: Address[] = approversData ? (approversData as Address[]) : [];

  return { approvers, isLoading, error };
}

// Hook: Check if address approved batch
export function useHasApproved(
  batchManagerAddress: Address,
  batchId: bigint | null,
  address: Address | null
) {
  const { data: hasApprovedData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'hasApproved',
    args: batchId !== null && address ? [batchId, address] : undefined,
    query: { enabled: batchId !== null && address !== null }
  });

  const hasApproved: boolean = hasApprovedData ? (hasApprovedData as boolean) : false;

  return { hasApproved, isLoading, error };
}

// Hook: Fetch batch result
export function useBatchResult(batchManagerAddress: Address, batchId: bigint | null) {
  const { data: resultData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getBatchResult',
    args: batchId !== null ? [batchId] : undefined,
    query: { enabled: batchId !== null }
  });

  const result: BatchExecutionResult | null = resultData
    ? {
        batchId: batchId!,
        successCount: resultData[1] as bigint,
        failureCount: resultData[2] as bigint,
        failureReasons: resultData[3] as string[],
        executedAt: resultData[4] as bigint
      }
    : null;

  return { result, isLoading, error };
}

// Hook: Fetch vault batches
export function useVaultBatches(batchManagerAddress: Address, vaultAddress: Address | null) {
  const { data: batchIdsData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getVaultBatches',
    args: vaultAddress ? [vaultAddress] : undefined,
    query: { enabled: vaultAddress !== null }
  });

  const batchIds: bigint[] = batchIdsData ? (batchIdsData as bigint[]) : [];

  return { batchIds, isLoading, error };
}

// Hook: Fetch user batches
export function useUserBatches(batchManagerAddress: Address, userAddress: Address | null) {
  const { data: batchIdsData, isLoading, error } = useReadContract({
    address: batchManagerAddress,
    abi: BATCH_MANAGER_ABI,
    functionName: 'getUserBatches',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: userAddress !== null }
  });

  const batchIds: bigint[] = batchIdsData ? (batchIdsData as bigint[]) : [];

  return { batchIds, isLoading, error };
}

// Helper: Get batch status label
function getBatchStatusLabel(status: number): WithdrawalBatch['status'] {
  const statuses: WithdrawalBatch['status'][] = [
    'pending',
    'approved',
    'executing',
    'completed',
    'cancelled',
    'partial_fail'
  ];
  return statuses[status] || 'pending';
}

// Placeholder ABI - would be replaced with actual contract ABI
const BATCH_MANAGER_ABI = [
  // Methods would go here
] as const;

// Utility: Calculate batch stats
export function calculateBatchStats(items: WithdrawalItem[]) {
  return {
    itemCount: items.length,
    totalAmount: items.reduce((sum, item) => sum + item.amount, 0n),
    queuedCount: items.filter((i) => i.isQueued).length,
    directCount: items.filter((i) => !i.isQueued).length,
    executedCount: items.filter((i) => i.executed).length,
    pendingCount: items.filter((i) => !i.executed).length
  };
}

// Utility: Estimate gas for batch execution
export function estimateBatchGas(itemCount: number): bigint {
  const baseGas = 100000n; // Base gas for batch execution
  const perItemGas = 50000n; // Gas per item
  return baseGas + BigInt(itemCount) * perItemGas;
}

// Utility: Format batch status for display
export function formatBatchStatus(status: WithdrawalBatch['status']): string {
  const labels: Record<WithdrawalBatch['status'], string> = {
    pending: 'Pending Approvals',
    approved: 'Approved - Ready',
    executing: 'Executing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    partial_fail: 'Partially Failed'
  };
  return labels[status];
}

// Utility: Get status color
export function getBatchStatusColor(status: WithdrawalBatch['status']): string {
  const colors: Record<WithdrawalBatch['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    executing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    partial_fail: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  };
  return colors[status];
}
