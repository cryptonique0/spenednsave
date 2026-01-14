"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useWithdrawalPoliciesCount, useSetWithdrawalPolicies, useIsVaultOwner } from '@/lib/hooks/useContracts';
import { type Address } from 'viem';

interface PolicyRow {
    minAmount: string;
    maxAmount: string;
    requiredApprovals: string;
    cooldown: string;
}

export function PolicyConfig({ vaultAddress }: { vaultAddress?: Address }) {
    const { address } = useAccount();
    const ownerCheck = useIsVaultOwner(vaultAddress, address as any);
    const countRes = useWithdrawalPoliciesCount(vaultAddress);
    const setPoliciesHook = useSetWithdrawalPolicies(vaultAddress);

    const [rows, setRows] = useState<PolicyRow[]>([]);
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        // We intentionally avoid calling hooks in loops; show count and let owner set policies manually.
        setLoadingExisting(false);
    }, [countRes.data]);

    if (!ownerCheck.data) return null;

    const addRow = () => setRows(r => [...r, { minAmount: '0', maxAmount: '0', requiredApprovals: '1', cooldown: '0' }]);

    const updateRow = (idx: number, key: keyof PolicyRow, value: string) => {
        setRows(r => r.map((row, i) => i === idx ? { ...row, [key]: value } : row));
    };

    const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

    const submit = async () => {
        try {
            const payload = rows.map(r => ({
                minAmount: BigInt(r.minAmount || '0'),
                maxAmount: BigInt(r.maxAmount || '0'),
                requiredApprovals: BigInt(r.requiredApprovals || '1'),
                cooldown: BigInt(r.cooldown || '0'),
            }));
            await setPoliciesHook.setPolicies(payload as any);
            alert('Policies submitted — wait for tx confirmation');
        } catch (e) {
            console.error(e);
            alert('Failed to set policies');
        }
    };

    return (
        <div className="bg-surface-dark border border-surface-border rounded-2xl p-4">
            <h4 className="text-white font-bold mb-2">Withdrawal Policies (Owner)</h4>
            {loadingExisting ? <p className="text-slate-400 text-sm">Loading...</p> : (
                <div className="space-y-2">
                    {rows.map((r, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <input value={r.minAmount} onChange={(e) => updateRow(i, 'minAmount', e.target.value)} className="w-20" />
                            <span className="text-slate-400">to</span>
                            <input value={r.maxAmount} onChange={(e) => updateRow(i, 'maxAmount', e.target.value)} className="w-20" />
                            <input value={r.requiredApprovals} onChange={(e) => updateRow(i, 'requiredApprovals', e.target.value)} className="w-20" />
                            <input value={r.cooldown} onChange={(e) => updateRow(i, 'cooldown', e.target.value)} className="w-28" />
                            <button onClick={() => removeRow(i)} className="text-sm text-red-400">Remove</button>
                        </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                        <button onClick={addRow} className="text-sm text-primary">Add policy</button>
                        <button onClick={submit} className="text-sm text-white bg-primary px-3 py-1 rounded">Save policies</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PolicyConfig;
