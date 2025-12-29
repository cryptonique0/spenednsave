"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface Step1Props {
    data: {
        name: string;
        threshold: number;
        totalGuardians: number;
    };
    onUpdate: (data: Partial<Step1Props['data']>) => void;
    onNext: () => void;
}

export function Step1Details({ data, onUpdate, onNext }: Step1Props) {

    // Calculate percentage for slider visual
    const percentage = Math.round((data.threshold / data.totalGuardians) * 100);

    return (
        <div className="p-8 sm:p-10 flex flex-col gap-10">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Let's build your Fortress</h1>
                <p className="text-slate-400 text-lg font-light leading-relaxed">Name your vault and set the rules for withdrawals.</p>
            </div>

            <div className="flex flex-col gap-8">
                {/* Vault Name */}
                <div className="group">
                    <label className="block text-sm font-medium text-gray-300 mb-2 pl-1" htmlFor="vault-name">Vault Name</label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-4 text-slate-500 group-focus-within:text-primary transition-colors">account_balance_wallet</span>
                        <input
                            id="vault-name"
                            type="text"
                            className="w-full bg-background-dark/50 border border-border-dark rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm outline-none"
                            placeholder="e.g. Europe Trip 2024"
                            autoFocus
                            value={data.name}
                            onChange={(e) => onUpdate({ name: e.target.value })}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 pl-1">This is visible to your Guardians.</p>
                </div>

                {/* Quorum Slider */}
                <div className="bg-background-dark/30 rounded-2xl p-6 border border-surface-border flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                Approval Threshold
                                <span className="material-symbols-outlined text-gray-500 text-sm cursor-help" title="Number of approvals needed">help</span>
                            </label>
                            <p className="text-xs text-slate-500 mt-1">Guardians needed to unlock funds</p>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold text-white tracking-tight">{data.threshold}<span className="text-lg text-gray-500 font-medium">/{data.totalGuardians}</span></span>
                        </div>
                    </div>

                    <div className="relative py-2 select-none group cursor-pointer">
                        <div className="h-3 bg-surface-dark border border-surface-border rounded-full w-full relative overflow-hidden">
                            <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                        </div>
                        {/* Interactive Slider Implementation would go here, simplified logic for now */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
                            style={{ left: `${percentage}%` }}
                        >
                            <div className="size-7 bg-white rounded-full shadow-lg border-2 border-primary cursor-grab active:cursor-grabbing hover:scale-110 transition-transform flex items-center justify-center">
                                <div className="size-1.5 rounded-full bg-primary"></div>
                            </div>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {percentage}% Consensus
                            </div>
                        </div>
                        <div className="flex justify-between px-0.5 mt-4 text-xs font-mono text-gray-600 font-medium uppercase">
                            <span>1 Guardian</span>
                            <span>All ({data.totalGuardians})</span>
                        </div>

                        {/* Hidden range input for functionality */}
                        <input
                            type="range"
                            min="1"
                            max={data.totalGuardians}
                            value={data.threshold}
                            onChange={(e) => onUpdate({ threshold: parseInt(e.target.value) })}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <div className="flex gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10 items-start">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0 text-primary">
                            <span className="material-symbols-outlined text-xl">verified_user</span>
                        </div>
                        <div>
                            <h4 className="text-white text-sm font-semibold">Social Accountability</h4>
                            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                You are setting a rule that requires <strong className="text-gray-300">{data.threshold} trusted friends</strong> to agree before any money leaves this vault. You can deposit freely at any time.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-border/50">
                    <button className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        Cancel Setup
                    </button>
                    <button
                        onClick={onNext}
                        className="bg-primary hover:bg-primary-hover text-white text-base font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 group"
                    >
                        Next: Add Guardians
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
