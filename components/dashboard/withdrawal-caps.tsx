"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useIsVaultOwner, useGetWithdrawalCaps, useVaultWithdrawnInPeriod, useSetWithdrawalCaps } from '@/lib/hooks/useContracts';
import { formatEther } from 'viem';
import Link from 'next/link';

export default function WithdrawalCaps({ vaultAddress }: { vaultAddress: string }) {
    const { address } = useAccount();
    const { data: isOwner, isLoading: checking } = useIsVaultOwner(vaultAddress as any, address as any);

    const [token, setToken] = useState('0x0000000000000000000000000000000000000000');
    const capsRes = useGetWithdrawalCaps(vaultAddress as any, token as any);
    const dailyUsed = useVaultWithdrawnInPeriod(vaultAddress as any, token as any, 'daily');
    const weeklyUsed = useVaultWithdrawnInPeriod(vaultAddress as any, token as any, 'weekly');
    const monthlyUsed = useVaultWithdrawnInPeriod(vaultAddress as any, token as any, 'monthly');
    const { setCaps, isPending } = useSetWithdrawalCaps(vaultAddress as any);

    const [daily, setDaily] = useState('0');
    const [weekly, setWeekly] = useState('0');
    const [monthly, setMonthly] = useState('0');

    useEffect(() => {
        if (capsRes && capsRes.data) {
            const c = capsRes.data as any;
            setDaily(String(c.daily ?? 0n));
            setWeekly(String(c.weekly ?? 0n));
            setMonthly(String(c.monthly ?? 0n));
        }
    }, [capsRes]);

    if (checking) return <div>Checking ownership...</div>;
    if (!isOwner) return <div className="bg-white dark:bg-surface-dark border rounded-xl p-6 text-sm">Only vault owner can configure withdrawal caps. <Link href="/dashboard">Back</Link></div>;

    const handleSave = () => {
        try {
            const d = BigInt(daily);
            const w = BigInt(weekly);
            const m = BigInt(monthly);
            setCaps(token as any, d, w, m);
        } catch (e) {
            alert('Invalid cap values');
        }
    };

    const fmt = (v: any) => {
        try {
            return formatEther(BigInt(v));
        } catch (e) {
            return '0';
        }
    };

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3">Withdrawal Caps</h3>
            <div className="text-sm text-slate-500 mb-4">Configure daily/weekly/monthly caps per token (use zero address for native ETH).</div>

            <label className="text-xs font-semibold">Token address</label>
            <input className="w-full p-2 mb-3 border rounded" value={token} onChange={e => setToken(e.target.value)} />

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                    <label className="text-xs">Daily (wei)</label>
                    <input className="w-full p-2 border rounded" value={daily} onChange={e => setDaily(e.target.value)} />
                    <div className="text-xs text-slate-500">Used: {dailyUsed?.data ? fmt(dailyUsed.data) : '0'} ETH</div>
                </div>
                <div>
                    <label className="text-xs">Weekly (wei)</label>
                    <input className="w-full p-2 border rounded" value={weekly} onChange={e => setWeekly(e.target.value)} />
                    <div className="text-xs text-slate-500">Used: {weeklyUsed?.data ? fmt(weeklyUsed.data) : '0'} ETH</div>
                </div>
                <div>
                    <label className="text-xs">Monthly (wei)</label>
                    <input className="w-full p-2 border rounded" value={monthly} onChange={e => setMonthly(e.target.value)} />
                    <div className="text-xs text-slate-500">Used: {monthlyUsed?.data ? fmt(monthlyUsed.data) : '0'} ETH</div>
                </div>
            </div>

            <div className="flex gap-2">
                <button onClick={handleSave} disabled={isPending} className="bg-primary text-white px-4 py-2 rounded">Save Caps</button>
            </div>
        </div>
    );
}
