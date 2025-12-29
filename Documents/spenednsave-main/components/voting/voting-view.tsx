"use client";

import { useState } from "react";
import { Shield, ArrowRight, User, Check, X } from "lucide-react";

export function VotingView() {
    const [status, setStatus] = useState<'pending' | 'signed' | 'empty'>('pending');

    const handleSign = async () => {
        // Simulate signing
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('signed');
    };

    if (status === 'empty') {
        return (
            <div className="relative w-full max-w-md">
                <div className="bg-[#1a1d26] dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-10 md:p-14 flex flex-col items-center shadow-card overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-surface-border shadow-lg group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition-all duration-500">
                            <Shield size={44} className="text-emerald-500" />
                        </div>
                        <div className="absolute top-1 right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-surface-border">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3 mb-10">
                        <h3 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight">No active proposals</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-[280px]">
                            Your friend hasn't tried to spend any money yet. Good job!
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                        <a href="/activity" className="w-full h-11 px-6 rounded-xl bg-slate-100 dark:bg-surface-border/50 hover:bg-slate-200 dark:hover:bg-surface-border text-slate-900 dark:text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent hover:border-slate-300 dark:hover:border-white/5 group/btn">
                            <ArrowRight size={20} className="text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white transition-colors" />
                            View Transaction History
                        </a>
                    </div>
                    <div className="mt-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                        <Shield size={14} className="text-emerald-500" />
                        <span className="text-slate-400 text-xs font-medium tracking-wide">Secured by Base</span>
                    </div>
                </div>
                <button
                    onClick={() => setStatus('pending')}
                    className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-slate-400 hover:text-primary transition-colors"
                >
                    Show Active Demo
                </button>
            </div>
        );
    }

    if (status === 'signed') {
        return (
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-8 text-center shadow-card animate-in fade-in zoom-in duration-300">
                <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mx-auto mb-6 shadow-glow">
                    <Shield size={40} className="fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vote Cast Successfully</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    You have securely signed this transaction. The network will process it once the threshold is met.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-surface-border/30 rounded-xl mb-6">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Transaction Hash</p>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate">0x5a1...89b2</p>
                </div>
                <button
                    onClick={() => setStatus('pending')} // Reset for demo
                    className="text-primary font-bold text-sm hover:underline"
                >
                    Back to Demo
                </button>
            </div>
        )
    }

    return (
        <div className="relative w-full max-w-md">
            <div className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl overflow-hidden shadow-card">
                {/* Header */}
                <div className="bg-primary/5 p-6 border-b border-gray-100 dark:border-surface-border text-center">
                    <div className="inline-flex flex-col items-center mb-4">
                        <div className="size-16 rounded-full bg-white dark:bg-surface-dark border-4 border-white dark:border-surface-border/50 shadow-md mb-3 overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Alice's Vault</h3>
                        <p className="text-xs text-slate-500">Managed by SpendGuard</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-surface-border/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requesting</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">$500.00 <span className="text-sm font-medium text-slate-400">USDC</span></p>
                    </div>
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex gap-4 p-4 bg-gray-50 dark:bg-surface-border/20 rounded-xl border border-gray-100 dark:border-surface-border/50">
                        <span className="material-symbols-outlined text-slate-400 pt-0.5">format_quote</span>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"Emergency car repair fund. Will repay next month."</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Consensus Status</span>
                            <span className="text-slate-900 dark:text-white font-bold">1 of 3 Signed</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-surface-border/50 rounded-full overflow-hidden">
                            <div className="h-full w-1/3 bg-yellow-400 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button className="flex-1 py-3.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2">
                        <X size={18} />
                        Reject
                    </button>
                    <button
                        onClick={handleSign}
                        className="flex-[2] py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Sign & Approve
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-background-dark/50 text-center border-t border-gray-100 dark:border-surface-border">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Shield size={12} />
                        Secured by Smart Contract
                    </p>
                </div>
            </div>
            <button
                onClick={() => setStatus('empty')}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-slate-400 hover:text-primary transition-colors"
            >
                Show Empty State Demo
            </button>
        </div>
    );
}
