'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import {
    getAllTokens,
    addCustomToken,
    removeCustomToken,
    getCustomTokens,
    isValidTokenAddress,
} from '@/lib/tokens';
import type { Token } from '@/lib/tokens';

/**
 * Component for managing custom tokens
 */
export function TokenRegistry() {
    const { chain } = useAccount();
    const chainId = chain?.id || 84532;

    const [customTokens, setCustomTokens] = useState(() => getCustomTokens(chainId));
    const [showForm, setShowForm] = useState(false);
    const [newToken, setNewToken] = useState({
        symbol: '',
        name: '',
        address: '' as `0x${string}`,
        decimals: 18,
        oracleAddress: '' as `0x${string}` | undefined,
    });

    const allTokens = getAllTokens(chainId);
    const verifiedTokens = allTokens.filter((t) => t.verified);

    const handleAddToken = () => {
        if (!newToken.symbol || !newToken.name || !isValidTokenAddress(newToken.address)) {
            alert('Please fill in all required fields with valid addresses');
            return;
        }

        const token = addCustomToken(chainId, {
            symbol: newToken.symbol.toUpperCase(),
            name: newToken.name,
            address: newToken.address,
            decimals: newToken.decimals,
            chainId,
            type: 'erc20',
            description: `Custom token added by user`,
            oracleAddress: newToken.oracleAddress || undefined,
        });

        setCustomTokens([...customTokens, token]);
        setNewToken({
            symbol: '',
            name: '',
            address: '' as `0x${string}`,
            decimals: 18,
            oracleAddress: undefined,
        });
        setShowForm(false);
    };

    const handleRemoveToken = (symbol: string) => {
        removeCustomToken(chainId, symbol);
        setCustomTokens(customTokens.filter((t) => t.symbol !== symbol));
    };

    return (
        <div className="space-y-6">
            {/* Verified Tokens */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                    ✓ Verified Tokens ({verifiedTokens.length})
                </h2>
                <div className="grid gap-3">
                    {verifiedTokens.map((token) => (
                        <TokenCard key={token.symbol} token={token} onRemove={() => {}} />
                    ))}
                </div>
            </div>

            {/* Custom Tokens */}
            {customTokens.length > 0 && (
                <div>
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        ⚠️ Custom Tokens ({customTokens.length})
                    </h2>
                    <div className="grid gap-3">
                        {customTokens.map((token) => (
                            <TokenCard
                                key={token.symbol}
                                token={token}
                                onRemove={() => handleRemoveToken(token.symbol)}
                                isCustom
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Add Custom Token */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                    <span>{showForm ? '−' : '+'}</span>
                    Add Custom Token
                </button>

                {showForm && (
                    <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                        <input
                            type="text"
                            placeholder="Token Symbol (e.g., ABC)"
                            value={newToken.symbol}
                            onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="text"
                            placeholder="Token Name (e.g., My Token)"
                            value={newToken.name}
                            onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="text"
                            placeholder="Token Address (0x...)"
                            value={newToken.address}
                            onChange={(e) => setNewToken({ ...newToken, address: e.target.value as `0x${string}` })}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="number"
                            placeholder="Decimals (e.g., 18)"
                            min="0"
                            max="18"
                            value={newToken.decimals}
                            onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) })}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                            type="text"
                            placeholder="Chainlink Oracle Address (0x...) - Optional"
                            value={newToken.oracleAddress || ''}
                            onChange={(e) => setNewToken({ ...newToken, oracleAddress: e.target.value as `0x${string}` })}
                            className="w-full rounded border border-gray-300 bg-white px-3 py-2 font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleAddToken}
                                className="flex-1 rounded bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                Add Token
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 rounded bg-gray-300 px-3 py-2 font-medium text-gray-900 hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Individual token card component
 */
function TokenCard({
    token,
    onRemove,
    isCustom = false,
}: {
    token: Token;
    onRemove: () => void;
    isCustom?: boolean;
}) {
    return (
        <div
            className={`rounded-lg border p-3 ${
                isCustom
                    ? 'border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900'
                    : 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{token.icon || '🪙'}</span>
                        <div>
                            <h3 className={`font-semibold ${isCustom ? 'text-yellow-900 dark:text-yellow-300' : 'text-green-900 dark:text-green-300'}`}>
                                {token.symbol}
                            </h3>
                            <p className={`text-xs ${isCustom ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'}`}>
                                {token.name}
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 space-y-1">
                        <p className={`text-xs font-mono ${isCustom ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'}`}>
                            Address: {token.address.slice(0, 6)}...{token.address.slice(-4)}
                        </p>
                        <p className={`text-xs ${isCustom ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'}`}>
                            Decimals: {token.decimals}
                        </p>
                        {token.oracleAddress && (
                            <p className={`text-xs font-mono ${isCustom ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'}`}>
                                Oracle: {token.oracleAddress.slice(0, 6)}...{token.oracleAddress.slice(-4)}
                            </p>
                        )}
                    </div>
                </div>
                {isCustom && (
                    <button
                        onClick={onRemove}
                        className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                        Remove
                    </button>
                )}
            </div>
        </div>
    );
}

export default TokenRegistry;
