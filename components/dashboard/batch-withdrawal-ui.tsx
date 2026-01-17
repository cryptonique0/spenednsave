'use client';

import { useState, useCallback } from 'react';
import { type Address } from 'viem';
import { formatEther } from 'viem';
import {
  useCreateBatch,
  useApproveBatch,
  useExecuteBatch,
  useBatchDetails,
  useBatchItems,
  useBatchApprovers,
  formatBatchStatus,
  getBatchStatusColor,
  calculateBatchStats,
  type WithdrawalItem,
  type WithdrawalBatch
} from '@/lib/hooks/useBatchWithdrawals';

interface BatchWithdrawalUIProps {
  vaultAddress: Address;
  batchManagerAddress: Address;
  userAddress: Address;
}

/**
 * Batch Withdrawal Creator
 * Allows bundling multiple withdrawals into a single batch
 */
export function BatchWithdrawalCreator({ vaultAddress, batchManagerAddress, userAddress }: BatchWithdrawalUIProps) {
  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [requiredApprovals, setRequiredApprovals] = useState(2n);
  const [isAdding, setIsAdding] = useState(false);
  const { createBatch, isLoading, error } = useCreateBatch(batchManagerAddress);

  const [newItem, setNewItem] = useState<Partial<WithdrawalItem>>({
    token: vaultAddress,
    amount: 0n,
    recipient: undefined as any,
    reason: '',
    category: 'general',
    isQueued: false
  });

  const addItem = useCallback(() => {
    if (
      !newItem.token ||
      !newItem.recipient ||
      newItem.amount === 0n ||
      !newItem.reason
    ) {
      alert('Please fill in all fields');
      return;
    }

    setItems([
      ...items,
      {
        token: newItem.token,
        amount: newItem.amount || 0n,
        recipient: newItem.recipient as Address,
        reason: newItem.reason,
        category: newItem.category || 'general',
        isQueued: newItem.isQueued || false,
        executed: false
      }
    ]);

    // Reset form
    setNewItem({
      token: vaultAddress,
      amount: 0n,
      recipient: undefined as any,
      reason: '',
      category: 'general',
      isQueued: false
    });
  }, [newItem, items, vaultAddress]);

  const removeItem = useCallback((index: number) => {
    setItems(items.filter((_, i) => i !== index));
  }, [items]);

  const handleCreateBatch = useCallback(async () => {
    try {
      await createBatch(vaultAddress, items, requiredApprovals);
      setItems([]); // Clear on success
    } catch (err) {
      console.error('Failed to create batch:', err);
    }
  }, [createBatch, vaultAddress, items, requiredApprovals]);

  const stats = calculateBatchStats(items);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 p-6 dark:border-gray-800">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Withdrawal Batch</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Batch Items Summary */}
      {items.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.itemCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {formatEther(stats.totalAmount)} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Direct Withdrawals</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.directCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Queued Withdrawals</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.queuedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Form */}
      <div className="space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Add Withdrawal Item</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipient</label>
            <input
              type="text"
              placeholder="0x..."
              value={newItem.recipient || ''}
              onChange={(e) => setNewItem({ ...newItem, recipient: e.target.value as Address })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              placeholder="1.5"
              value={newItem.amount ? formatEther(newItem.amount) : ''}
              onChange={(e) => {
                const etherValue = parseFloat(e.target.value);
                setNewItem({
                  ...newItem,
                  amount: BigInt(Math.round(etherValue * 1e18))
                });
              }}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
            <select
              value={newItem.category || 'general'}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="general">General</option>
              <option value="emergency">Emergency</option>
              <option value="operational">Operational</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              value={newItem.isQueued ? 'queued' : 'direct'}
              onChange={(e) => setNewItem({ ...newItem, isQueued: e.target.value === 'queued' })}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="direct">Direct Withdrawal</option>
              <option value="queued">Queued Withdrawal</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
            <textarea
              placeholder="Reason for withdrawal..."
              value={newItem.reason || ''}
              onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={addItem}
          disabled={!newItem.recipient || newItem.amount === 0n}
          className="w-full rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Add Item to Batch
        </button>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Batch Items ({items.length}/50)</h3>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {item.recipient.slice(0, 6)}...{item.recipient.slice(-4)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {formatEther(item.amount)} ETH • {item.category}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{item.reason}</p>
              </div>
              <button
                onClick={() => removeItem(idx)}
                className="ml-4 rounded bg-red-100 px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Approvals Setting */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Required Guardian Approvals
        </label>
        <div className="flex items-center gap-4">
          <input
            type="number"
            min="1"
            max="10"
            value={requiredApprovals.toString()}
            onChange={(e) => setRequiredApprovals(BigInt(e.target.value))}
            className="w-20 rounded border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Guardians must approve before batch execution
          </p>
        </div>
      </div>

      {/* Create Button */}
      <button
        onClick={handleCreateBatch}
        disabled={items.length === 0 || isLoading}
        className="w-full rounded bg-green-500 px-4 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700"
      >
        {isLoading ? 'Creating Batch...' : 'Create Batch'}
      </button>
    </div>
  );
}

/**
 * Batch Details View
 * Shows batch status, items, and approvals
 */
export function BatchDetailsView({ batchId, batchManagerAddress }: { batchId: bigint; batchManagerAddress: Address }) {
  const { batch, isLoading: batchLoading } = useBatchDetails(batchManagerAddress, batchId);
  const { items, isLoading: itemsLoading } = useBatchItems(batchManagerAddress, batchId);
  const { approvers, isLoading: approversLoading } = useBatchApprovers(batchManagerAddress, batchId);
  const { approveBatch, isLoading: approveLoading } = useApproveBatch(batchManagerAddress);
  const { executeBatch, isLoading: executeLoading } = useExecuteBatch(batchManagerAddress);

  if (batchLoading || !batch) {
    return <div className="animate-pulse rounded-lg bg-gray-200 p-4 dark:bg-gray-800" />;
  }

  const statusColor = getBatchStatusColor(batch.status);
  const timeRemaining = Math.max(0, Number(batch.expiresAt) - Math.floor(Date.now() / 1000));
  const isExpired = timeRemaining <= 0;
  const canApprove = batch.status === 'pending' || batch.status === 'approved';
  const canExecute = batch.status === 'approved';

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 p-6 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Batch #{batch.batchId.toString()}</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Created {new Date(Number(batch.createdAt) * 1000).toLocaleDateString()}
          </p>
        </div>
        <div className={`rounded-lg px-4 py-2 ${statusColor}`}>
          <p className="font-semibold">{formatBatchStatus(batch.status)}</p>
        </div>
      </div>

      {/* Time Remaining */}
      {!isExpired && batch.status !== 'completed' && batch.status !== 'cancelled' && (
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
            ⏰ Approval window closes in{' '}
            {Math.floor(timeRemaining / 3600)}
            h {Math.floor((timeRemaining % 3600) / 60)}m
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{batch.itemCount.toString()}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatEther(batch.totalAmount)} ETH
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Approvals</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {batch.approvalCount.toString()} / {batch.requiredApprovals.toString()}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(Number(batch.approvalCount) / Number(batch.requiredApprovals) * 100)}%
          </p>
        </div>
      </div>

      {/* Withdrawal Items */}
      {!itemsLoading && items.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Withdrawal Items</h3>
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <div className="flex-1">
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                  {item.recipient.slice(0, 6)}...{item.recipient.slice(-4)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.reason}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatEther(item.amount)} ETH
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {item.isQueued ? 'Queued' : 'Direct'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approvers */}
      {!approversLoading && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Approvers ({approvers.length})</h3>
          {approvers.length > 0 ? (
            <div className="space-y-2">
              {approvers.map((approver) => (
                <div
                  key={approver}
                  className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {approver.slice(0, 6)}...{approver.slice(-4)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No approvals yet</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {canApprove && (
          <button
            onClick={() => approveBatch(batch.batchId)}
            disabled={approveLoading}
            className="flex-1 rounded bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            {approveLoading ? 'Approving...' : 'Approve Batch'}
          </button>
        )}
        {canExecute && (
          <button
            onClick={() => executeBatch(batch.batchId)}
            disabled={executeLoading}
            className="flex-1 rounded bg-green-500 px-4 py-2 font-semibold text-white hover:bg-green-600 disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {executeLoading ? 'Executing...' : 'Execute Batch'}
          </button>
        )}
      </div>
    </div>
  );
}
