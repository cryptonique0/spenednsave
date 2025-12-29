"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, ChevronDown, Filter } from "lucide-react";

interface Transaction {
    id: string;
    type: 'Withdrawal' | 'Deposit' | 'Policy Change';
    amount?: string;
    date: string;
    time: string;
    status: 'Approved' | 'Rejected' | 'Pending';
    requester: string;
    votes: {
        total: number;
        required: number;
        approved: number;
        rejected: number;
        details: { guardian: string; action: 'Approved' | 'Rejected' | 'Pending'; avatarColor: string }[];
    };
}

export function ActivityLogView() {
    const [transactions] = useState<Transaction[]>([
        {
            id: "tx-1",
            type: "Withdrawal",
            amount: "-$500.00",
            date: "Oct 24",
            time: "10:42 AM",
            status: "Rejected",
            requester: "You",
            votes: {
                total: 3,
                required: 2,
                approved: 1,
                rejected: 2,
                details: [
                    { guardian: "alice.base.eth", action: "Approved", avatarColor: "bg-indigo-500" },
                    { guardian: "bob.lens", action: "Rejected", avatarColor: "bg-blue-500" },
                    { guardian: "charlie_savings", action: "Rejected", avatarColor: "bg-emerald-500" }
                ]
            }
        },
        {
            id: "tx-2",
            type: "Deposit",
            amount: "+$2,000.00",
            date: "Oct 22",
            time: "09:15 AM",
            status: "Approved",
            requester: "You",
            votes: { total: 0, required: 0, approved: 0, rejected: 0, details: [] } // Deposits auto-approved usually
        },
        {
            id: "tx-3",
            type: "Policy Change",
            date: "Oct 20",
            time: "02:30 PM",
            status: "Pending",
            requester: "You",
            votes: {
                total: 3,
                required: 2,
                approved: 1,
                rejected: 0,
                details: [
                    { guardian: "alice.base.eth", action: "Approved", avatarColor: "bg-indigo-500" },
                    { guardian: "bob.lens", action: "Pending", avatarColor: "bg-blue-500" },
                    { guardian: "charlie_savings", action: "Pending", avatarColor: "bg-emerald-500" }
                ]
            }
        }
    ]);

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Activity Log</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track withdrawals, deposits, and governance actions.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-border transition-colors">
                    <span className="material-symbols-outlined text-lg">download</span>
                    Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Total Volume</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">$12,450.00</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Withdrawn</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">$500.00</h3>
                        <span className="mb-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 font-bold">-4%</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Pending Requests</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">1</h3>
                        <span className="mb-1 text-xs text-slate-500 dark:text-slate-400">Action Required</span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25">All Activity</button>
                <button className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-border transition-colors">Pending</button>
                <button className="px-4 py-2 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-border transition-colors">Completed</button>
                <button className="ml-auto p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Filter size={20} /></button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
                {transactions.map((tx) => (
                    <details key={tx.id} className="group rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border overflow-hidden shadow-sm open:shadow-md transition-all">
                        <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'Withdrawal' ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-500' :
                                    tx.type === 'Deposit' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500'
                                    }`}>
                                    {tx.type === 'Withdrawal' ? <ArrowUpRight size={24} /> :
                                        tx.type === 'Deposit' ? <ArrowDownLeft size={24} /> :
                                            <Clock size={24} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white text-lg">{tx.type === 'Policy Change' ? 'Policy Update' : tx.amount}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{tx.type === 'Policy Change' ? 'Quorum Threshold' : `from ${tx.requester}`}</span>
                                    {tx.type === 'Withdrawal' && (
                                        <a href={`/activity/${tx.id}`} className="text-xs font-bold text-primary mt-1 hover:underline">View Details</a>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="hidden md:flex flex-col items-end">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.date}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{tx.time}</span>
                                </div>
                                <div className={`hidden sm:flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${tx.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                    tx.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                                        'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                                    }`}>
                                    {tx.status}
                                </div>
                                <div className="text-slate-400 group-open:rotate-180 transition-transform duration-300">
                                    <ChevronDown size={20} />
                                </div>
                            </div>
                        </summary>

                        {/* Expanded Details */}
                        {tx.type !== 'Deposit' && (
                            <div className="border-t border-gray-200 dark:border-surface-border bg-gray-50/50 dark:bg-background-dark/30 p-6">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Vote Progress */}
                                    <div className="flex-1">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Governance Status</h4>
                                        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                    Approval Progress
                                                </span>
                                                <span className={`text-sm font-bold ${tx.votes.approved >= tx.votes.required ? 'text-emerald-500' : 'text-slate-500'
                                                    }`}>
                                                    {tx.votes.approved} of {tx.votes.required} Required
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-100 dark:bg-background-dark rounded-full overflow-hidden flex">
                                                <div style={{ width: `${(tx.votes.approved / tx.votes.total) * 100}%` }} className="h-full bg-emerald-500"></div>
                                                <div style={{ width: `${(tx.votes.rejected / tx.votes.total) * 100}%` }} className="h-full bg-red-500"></div>
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-emerald-500"></div> Approved</span>
                                                <span className="flex items-center gap-1"><div className="size-2 rounded-full bg-red-500"></div> Rejected</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Guardian Votes */}
                                    <div className="flex-[2]">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">Guardian Votes</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {tx.votes.details.map((vote, i) => (
                                                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${vote.action === 'Approved' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10' :
                                                    vote.action === 'Rejected' ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10' :
                                                        'bg-white dark:bg-surface-dark border-gray-200 dark:border-surface-border'
                                                    }`}>
                                                    <div className={`size-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${vote.avatarColor}`}>
                                                        {vote.guardian[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{vote.guardian}</span>
                                                        <span className={`text-xs font-medium ${vote.action === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' :
                                                            vote.action === 'Rejected' ? 'text-red-600 dark:text-red-400' :
                                                                'text-slate-500'
                                                            }`}>{vote.action}</span>
                                                    </div>
                                                    {vote.action === 'Approved' && <CheckCircle size={16} className="ml-auto text-emerald-500" />}
                                                    {vote.action === 'Rejected' && <XCircle size={16} className="ml-auto text-red-500" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </details>
                ))}
            </div>
        </div>
    );
}
