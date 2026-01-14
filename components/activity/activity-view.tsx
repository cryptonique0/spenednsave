"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ChevronDown, Filter } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserContracts } from "@/lib/hooks/useContracts";
import { useVaultActivity } from "@/lib/hooks/useVaultData";
import { formatEther, type Address } from "viem";

function formatEthFixed(value: bigint, decimals = 4) {
    try {
        const s = formatEther(value as any);
        if (!s.includes('.')) return s;
        const [intPart, decPart] = s.split('.');
        // Round the fractional part to requested decimals
        const frac = decPart.padEnd(decimals + 1, '0');
        const roundDigit = Number(frac[decimals]);
        let main = frac.slice(0, decimals);
        if (roundDigit >= 5) {
            // simple rounding by adding 1 to the last digit sequence
            let carry = 1;
            const arr = main.split('').map(d => Number(d));
            for (let i = arr.length - 1; i >= 0; i--) {
                const sum = arr[i] + carry;
                arr[i] = sum % 10;
                carry = Math.floor(sum / 10);
                if (carry === 0) break;
            }
            if (carry > 0) {
                // overflow into integer part
                const newInt = (BigInt(intPart) + BigInt(carry)).toString();
                return `${newInt}.${arr.join('')}`;
            }
            main = arr.join('');
        }
        return `${intPart}.${main}`;
    } catch (e) {
        return '0.0000';
    }
}

export function ActivityLogView() {
    const { address } = useAccount();
    const { data: userContracts } = useUserContracts(address as any);
    const guardianTokenAddress = userContracts ? (userContracts as any)[0] : undefined;
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    
    const { activities, isLoading } = useVaultActivity(vaultAddress, guardianTokenAddress, 100);
    const [filterStatus, setFilterStatus] = useState<'all' | 'deposits' | 'withdrawals' | 'guardians'>('all');

    // Debug logging
    console.log('[ActivityLogView] vaultAddress:', vaultAddress);
    console.log('[ActivityLogView] guardianTokenAddress:', guardianTokenAddress);
    console.log('[ActivityLogView] activities:', activities);
    console.log('[ActivityLogView] isLoading:', isLoading);

    // Calculate stats from activities
    const totalDeposits = activities
        .filter(a => a.type === 'deposit' && a.data?.amount)
        .reduce((sum, a) => sum + BigInt(a.data.amount ?? 0), 0n);
    
    const totalGuardians = activities.filter(a => a.type === 'guardian_added').length;

    // Filter activities
    const filteredActivities = activities.filter(activity => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'deposits') return activity.type === 'deposit';
        if (filterStatus === 'withdrawals') return activity.type === 'withdrawal';
        if (filterStatus === 'guardians') return activity.type === 'guardian_added';
        return true;
    });

    // Pagination
    const pageSize = 10;
    const [page, setPage] = useState(1);
    const totalPages = Math.max(1, Math.ceil(filteredActivities.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const pageActivities = filteredActivities.slice(pageStart, pageStart + pageSize);

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    if (!vaultAddress) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Vault Found</h2>
                    <p className="text-slate-500 dark:text-slate-400">Please create a vault first to see activity.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track deposits, guardians, and governance actions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-border transition-colors">
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Total Deposits</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                            {formatEthFixed(totalDeposits, 5)} ETH
                        </h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Total Activities</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{activities.length}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Guardians Added</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{totalGuardians}</h3>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button 
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        filterStatus === 'all' 
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-surface-border'
                    }`}
                >
                    All Activity
                </button>
                <button 
                    onClick={() => setFilterStatus('deposits')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filterStatus === 'deposits'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-surface-border'
                    }`}
                >
                    Deposits
                </button>
                <button 
                    onClick={() => setFilterStatus('guardians')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filterStatus === 'guardians'
                            ? 'bg-primary text-white shadow-lg shadow-primary/25'
                            : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-surface-border'
                    }`}
                >
                    Guardians
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredActivities.length === 0 ? (
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                    <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-4">
                        <Clock size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Activity Yet</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        Start using your vault by making deposits or adding guardians.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {pageActivities.map((activity, idx) => {
                        const isDeposit = activity.type === 'deposit';
                        const isWithdrawal = activity.type === 'withdrawal';
                        const isGuardian = activity.type === 'guardian_added';
                        
                        return (
                            <div key={`${activity.blockNumber}-${idx}`} className="rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between p-5">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                            isDeposit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500' :
                                            isWithdrawal ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-500' :
                                            'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500'
                                        }`}>
                                            {isDeposit && <ArrowDownLeft size={24} />}
                                            {isWithdrawal && <ArrowUpRight size={24} />}
                                            {isGuardian && <CheckCircle size={24} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white text-lg">
                                                {isDeposit || isWithdrawal 
                                                    ? `${isDeposit ? '+' : '-'}${parseFloat(formatEther(activity.data.amount)).toFixed(4)} ETH` 
                                                    : 'Guardian Added'}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                                {isDeposit && activity.data?.from 
                                                    ? activity.data.from.toLowerCase() === address?.toLowerCase()
                                                        ? 'You deposited'
                                                        : `from ${activity.data.from.slice(0, 6)}...${activity.data.from.slice(-4)}`
                                                    : isWithdrawal && activity.data?.reason
                                                        ? activity.data.reason
                                                        : isGuardian && activity.data?.address
                                                            ? `${activity.data.address.slice(0, 6)}...${activity.data.address.slice(-4)}`
                                                            : 'Transaction'
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {formatDate(activity.timestamp)}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {formatTime(activity.timestamp)}
                                            </span>
                                        </div>
                                        {activity.data?.txHash && (
                                            <a 
                                                href={`https://sepolia.basescan.org/tx/${activity.data.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:text-primary-hover text-sm font-medium"
                                            >
                                                View Tx →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Pagination controls */}
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Showing {pageStart + 1} - {Math.min(pageStart + pageSize, filteredActivities.length)} of {filteredActivities.length}</div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1 rounded-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-sm disabled:opacity-50"
                            >Previous</button>
                            <div className="text-sm text-slate-500 dark:text-slate-400">Page {page} / {totalPages}</div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="px-3 py-1 rounded-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-sm disabled:opacity-50"
                            >Next</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
