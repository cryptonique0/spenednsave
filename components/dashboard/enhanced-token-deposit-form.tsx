'use client';

import React, { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { getAllTokens, getToken } from '@/lib/tokens';
import { useTokenPrices, convertToUSD, formatUSDPrice } from '@/lib/hooks/useTokenPrice';
import { useApproveToken, useDepositToken } from '@/lib/hooks/useTokenOperations';

interface EnhancedTokenDepositFormProps {
    vaultAddress?: string;
    onDepositSuccess?: () => void;
}

/**
 * Enhanced deposit form supporting multiple tokens with price feeds
 */
export function EnhancedTokenDepositForm({
    vaultAddress,
    onDepositSuccess,
}: EnhancedTokenDepositFormProps) {
    const { chain } = useAccount();
    const [selectedToken, setSelectedToken] = useState<string>('ETH');
    const [amount, setAmount] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const chainId = chain?.id || 84532;
    const token = getToken(chainId, selectedToken);
    const tokens = useMemo(() => getAllTokens(chainId), [chainId]);

    // Get prices for selected token
    const { prices, isLoading: pricesLoading } = useTokenPrices(chainId, [selectedToken]);
    const currentPrice = prices[selectedToken];

    // Calculate USD value
    const usdValue = useMemo(() => {
        if (!token || !currentPrice || !amount) return 0;
        return convertToUSD(amount || '0', token.decimals, currentPrice);
    }, [amount, token, currentPrice]);

    // Token operations hooks
    const {
        approve,
        isApproving,
        isApproved,
    } = useApproveToken(chainId, selectedToken, vaultAddress);

    const {
        deposit,
        isDepositing,
        isSuccess,
    } = useDepositToken(chainId, selectedToken, vaultAddress);

    const handleDeposit = async () => {
        if (!token || !amount || !vaultAddress) return;

        if (token.type === 'erc20' && !isApproved) {
            await approve(amount);
            return;
        }

        await deposit(amount);
        if (onDepositSuccess) {
            onDepositSuccess();
        }
    };

    const isNative = token?.type === 'native';
    const isLoading = isApproving || isDepositing;
    const buttonText = (() => {
        if (isApproving) return 'Approving...';
        if (!isApproved && !isNative) return 'Approve & Deposit';
        if (isDepositing) return 'Depositing...';
        return 'Deposit';
    })();

    return (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Select Token
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {tokens.map((t) => (
                        <button
                            key={t.symbol}
                            onClick={() => {
                                setSelectedToken(t.symbol);
                                setAmount('');
                            }}
                            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                selectedToken === t.symbol
                                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900 dark:text-blue-300'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                        >
                            <span className="mr-1">{t.icon}</span>
                            {t.symbol}
                        </button>
                    ))}
                </div>
                {token?.verified === false && (
                    <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        ⚠️ This is a custom token - verify the address before use
                    </p>
                )}
            </div>

            {/* Price Display */}
            {currentPrice && !pricesLoading && (
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                            {formatUSDPrice(currentPrice)}
                        </span>
                    </div>
                </div>
            )}

            {/* Amount Input */}
            <div>
                <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Amount ({token?.symbol})
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`0.00 ${token?.symbol}`}
                        disabled={isLoading}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
                    />
                </div>
            </div>

            {/* USD Value Display */}
            {currentPrice && amount && (
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900">
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        ≈ {formatUSDPrice(usdValue)} USD
                    </div>
                </div>
            )}

            {/* Advanced Options */}
            <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
            >
                {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>

            {showAdvanced && (
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        <p>Token Address: <code className="font-mono">{token?.address}</code></p>
                        {token?.oracleAddress && (
                            <p className="mt-1">Oracle: <code className="font-mono">{token.oracleAddress}</code></p>
                        )}
                    </div>
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleDeposit}
                disabled={!amount || !token || isLoading || !vaultAddress}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
                {buttonText}
            </button>

            {/* Status Messages */}
            {isSuccess && (
                <div className="rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-900 dark:text-green-300">
                    ✓ Deposit successful!
                </div>
            )}

            {/* Token Info */}
            {token && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p><strong>{token.name}</strong> ({token.symbol})</p>
                    <p>{token.description}</p>
                </div>
            )}
        </div>
    );
}

export default EnhancedTokenDepositForm;
