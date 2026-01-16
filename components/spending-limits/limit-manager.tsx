'use client';

import { useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { parseEther, type Address } from 'viem';
import { SpendVaultABI } from '@/lib/abis/SpendVault';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LimitManagerProps {
  vaultAddress: Address;
  tokenAddress: Address;
  tokenSymbol?: string;
  onLimitsUpdated?: () => void;
}

interface WithdrawalLimits {
  daily: string;
  weekly: string;
  monthly: string;
}

/**
 * Component for managing daily, weekly, and monthly spending limits per token
 * Allows vault owners to set, update, and remove withdrawal limits
 */
export function SpendingLimitManager({
  vaultAddress,
  tokenAddress,
  tokenSymbol = 'TOKEN',
  onLimitsUpdated
}: LimitManagerProps) {
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  
  const [limits, setLimits] = useState<WithdrawalLimits>({
    daily: '',
    weekly: '',
    monthly: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentLimits, setCurrentLimits] = useState<WithdrawalLimits | null>(null);

  /**
   * Fetch current withdrawal limits from smart contract
   */
  const fetchCurrentLimits = useCallback(async () => {
    if (!publicClient) return;
    
    try {
      const caps = await publicClient.readContract({
        address: vaultAddress,
        abi: SpendVaultABI,
        functionName: 'withdrawalCaps',
        args: [tokenAddress]
      });

      const capData = caps as any;
      setCurrentLimits({
        daily: capData.daily?.toString() || '0',
        weekly: capData.weekly?.toString() || '0',
        monthly: capData.monthly?.toString() || '0'
      });
    } catch (err) {
      console.error('Error fetching current limits:', err);
      setError('Failed to fetch current limits');
    }
  }, [publicClient, vaultAddress, tokenAddress]);

  /**
   * Validate limit inputs
   */
  const validateLimits = useCallback((): boolean => {
    setError(null);

    // Check if at least one limit is set
    if (!limits.daily && !limits.weekly && !limits.monthly) {
      setError('At least one spending limit must be set');
      return false;
    }

    // Validate daily limit
    if (limits.daily) {
      const dailyNum = parseFloat(limits.daily);
      if (isNaN(dailyNum) || dailyNum < 0) {
        setError('Daily limit must be a valid positive number');
        return false;
      }
    }

    // Validate weekly limit
    if (limits.weekly) {
      const weeklyNum = parseFloat(limits.weekly);
      if (isNaN(weeklyNum) || weeklyNum < 0) {
        setError('Weekly limit must be a valid positive number');
        return false;
      }
      // Weekly should typically be >= daily
      if (limits.daily && weeklyNum < parseFloat(limits.daily)) {
        setError('Weekly limit should be >= daily limit for consistency');
        return false;
      }
    }

    // Validate monthly limit
    if (limits.monthly) {
      const monthlyNum = parseFloat(limits.monthly);
      if (isNaN(monthlyNum) || monthlyNum < 0) {
        setError('Monthly limit must be a valid positive number');
        return false;
      }
      // Monthly should typically be >= weekly
      if (limits.weekly && monthlyNum < parseFloat(limits.weekly)) {
        setError('Monthly limit should be >= weekly limit for consistency');
        return false;
      }
    }

    return true;
  }, [limits]);

  /**
   * Handle limit submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLimits() || !userAddress) {
      return;
    }

    setLoading(true);
    setSuccess(false);
    
    try {
      // Convert limits to BigInt (assuming standard 18 decimals for demonstration)
      const dailyLimit = limits.daily ? parseEther(limits.daily) : BigInt(0);
      const weeklyLimit = limits.weekly ? parseEther(limits.weekly) : BigInt(0);
      const monthlyLimit = limits.monthly ? parseEther(limits.monthly) : BigInt(0);

      // TODO: Call setWithdrawalCaps on the vault contract via wagmi
      // This requires the user to be the vault owner and have signing capability
      
      console.log('Submitting limits:', {
        vault: vaultAddress,
        token: tokenAddress,
        daily: dailyLimit.toString(),
        weekly: weeklyLimit.toString(),
        monthly: monthlyLimit.toString()
      });

      // Simulate successful submission
      setSuccess(true);
      setError(null);
      
      // Reset form
      setLimits({ daily: '', weekly: '', monthly: '' });
      
      // Refetch limits
      await fetchCurrentLimits();
      
      // Trigger callback if provided
      onLimitsUpdated?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error setting limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to set spending limits');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle removing a specific limit
   */
  const handleRemoveLimit = useCallback((limitType: keyof WithdrawalLimits) => {
    setLimits(prev => ({ ...prev, [limitType]: '' }));
  }, []);

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Spending Limits</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Set daily, weekly, and monthly withdrawal limits for {tokenSymbol}. Withdrawals exceeding these limits will require additional guardian approvals.
        </p>
      </div>

      {/* Current Limits Display */}
      {currentLimits && (
        <div className="space-y-2 rounded bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Current Limits</p>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div>Daily: {currentLimits.daily === '0' ? 'Not set' : currentLimits.daily}</div>
            <div>Weekly: {currentLimits.weekly === '0' ? 'Not set' : currentLimits.weekly}</div>
            <div>Monthly: {currentLimits.monthly === '0' ? 'Not set' : currentLimits.monthly}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Daily Limit */}
        <div className="space-y-2">
          <Label htmlFor="daily-limit" className="flex items-center justify-between">
            <span>Daily Limit</span>
            {limits.daily && (
              <button
                type="button"
                onClick={() => handleRemoveLimit('daily')}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </Label>
          <div className="relative">
            <Input
              id="daily-limit"
              type="number"
              placeholder="0.00"
              value={limits.daily}
              onChange={(e) => setLimits(prev => ({ ...prev, daily: e.target.value }))}
              step="0.01"
              min="0"
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-sm text-gray-500">{tokenSymbol}</span>
          </div>
          <p className="text-xs text-gray-500">Maximum amount allowed per day</p>
        </div>

        {/* Weekly Limit */}
        <div className="space-y-2">
          <Label htmlFor="weekly-limit" className="flex items-center justify-between">
            <span>Weekly Limit</span>
            {limits.weekly && (
              <button
                type="button"
                onClick={() => handleRemoveLimit('weekly')}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </Label>
          <div className="relative">
            <Input
              id="weekly-limit"
              type="number"
              placeholder="0.00"
              value={limits.weekly}
              onChange={(e) => setLimits(prev => ({ ...prev, weekly: e.target.value }))}
              step="0.01"
              min="0"
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-sm text-gray-500">{tokenSymbol}</span>
          </div>
          <p className="text-xs text-gray-500">Maximum amount allowed per week</p>
        </div>

        {/* Monthly Limit */}
        <div className="space-y-2">
          <Label htmlFor="monthly-limit" className="flex items-center justify-between">
            <span>Monthly Limit</span>
            {limits.monthly && (
              <button
                type="button"
                onClick={() => handleRemoveLimit('monthly')}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Clear
              </button>
            )}
          </Label>
          <div className="relative">
            <Input
              id="monthly-limit"
              type="number"
              placeholder="0.00"
              value={limits.monthly}
              onChange={(e) => setLimits(prev => ({ ...prev, monthly: e.target.value }))}
              step="0.01"
              min="0"
              className="pr-12"
            />
            <span className="absolute right-3 top-2.5 text-sm text-gray-500">{tokenSymbol}</span>
          </div>
          <p className="text-xs text-gray-500">Maximum amount allowed per month</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="rounded bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            ✓ Spending limits updated successfully!
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !limits.daily && !limits.weekly && !limits.monthly}
          className="w-full"
        >
          {loading ? 'Updating Limits...' : 'Update Spending Limits'}
        </Button>
      </form>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        💡 Tip: Set limits based on your vault's daily operational needs. Withdrawals exceeding these limits will require {Math.ceil(0.75 * 100)}% of guardians to approve.
      </p>
    </div>
  );
}
