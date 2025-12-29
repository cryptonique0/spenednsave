"use client";

import { useState } from "react";
import { ArrowLeft, Check, Copy, Share2, Info } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

import { useSendTransaction, useAccount } from "wagmi";
import { parseEther } from "viem";

export function WithdrawalForm() {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { sendTransaction } = useSendTransaction();
    const { isConnected } = useAccount();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected) {
            alert("Please connect your wallet first");
            return;
        }

        setIsSubmitting(true);
        // Simulate contract write for withdrawal request
        // In a real app, this would be a specific contract function call like 'createRequest'
        try {
            sendTransaction({
                to: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                value: parseEther('0'), // 0 value transaction to trigger simulated write
            });
            // Simulate API logic
            await new Promise(resolve => setTimeout(resolve, 1500));
            setStep('success');
        } catch (error) {
            console.error("Transaction failed", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === 'success') {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-8 text-center shadow-card animate-in fade-in zoom-in duration-300">
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mx-auto mb-6 shadow-glow">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Generated</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Your withdrawal request for <strong className="text-slate-900 dark:text-white">${amount}</strong> has been created. Share the link with your guardians to get approval.
                    </p>

                    <div className="bg-gray-50 dark:bg-surface-border/30 rounded-lg p-3 flex items-center gap-2 mb-6 border border-gray-200 dark:border-surface-border">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate flex-1">spendguard.app/vote/req-8a92...</span>
                        <button className="p-1.5 hover:bg-white dark:hover:bg-surface-border rounded text-slate-500 hover:text-primary transition-colors">
                            <Copy size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 px-4 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-md shadow-green-500/20">
                            WhatsApp
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1e8cc0] text-white py-3 px-4 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-md shadow-blue-400/20">
                            Telegram
                        </button>
                    </div>

                    <button onClick={() => setStep('form')} className="mt-6 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium">
                        Start Over
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-border text-slate-500 dark:text-slate-400 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Request</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Initiate a withdrawal from your vault</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Asset Selection */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</label>
                        <span className="text-xs text-slate-500">Balance: <span className="text-slate-900 dark:text-white font-medium">$5,420.50</span></span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-border/30 rounded-lg border border-gray-200 dark:border-surface-border cursor-pointer hover:border-primary/50 transition-colors">
                        <div className="size-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            $
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">USDC</p>
                            <p className="text-xs text-slate-500">USD Coin</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">expand_more</span>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount</label>
                    <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-bold text-slate-400">$</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-8 bg-transparent text-4xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 outline-none"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setAmount("100")} className="px-3 py-1 bg-gray-100 dark:bg-surface-border rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-surface-border/80 transition-colors">$100</button>
                        <button type="button" onClick={() => setAmount("500")} className="px-3 py-1 bg-gray-100 dark:bg-surface-border rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-surface-border/80 transition-colors">$500</button>
                        <button type="button" onClick={() => setAmount("5420.50")} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors ml-auto">MAX</button>
                    </div>
                </div>

                {/* Reason */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason (Optional)</label>
                    <textarea
                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none resize-none min-h-[80px]"
                        placeholder="Why are you withdrawing? This helps guardians decide."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                </div>

                <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <Info size={16} className="text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                        This withdrawal exceeds your personal allowance. It will require <strong>2 of 3 guardians</strong> to approve.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={!amount || isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {isSubmitting ? <Spinner className="w-5 h-5" /> : "Create Request"}
                </button>
            </form>
        </div>
    );
}
