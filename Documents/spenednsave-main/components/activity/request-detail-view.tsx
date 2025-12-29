"use client";

import { useState } from "react";
import { ArrowLeft, Wallet, CalendarX, Lock, Send, Check, Clock, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function RequestDetailView() {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-8 mb-10 items-start">
                <div className="flex-1">
                    <Link href="/activity" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={16} />
                        Back to Activity
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Awaiting Signatures
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-sm font-mono">Ref: #1024</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Emergency Car Repair</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-2">Submitted on Oct 24, 2023 at 10:42 AM</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Left Column: Request Info */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-surface-border shadow-card overflow-hidden">
                        <div className="p-6 md:p-8 grid gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Withdrawal Amount</label>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">500.00</span>
                                    <span className="text-xl font-semibold text-slate-500 dark:text-slate-400">USDC</span>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <Wallet size={20} />
                                        <span className="text-sm font-medium">Source Vault</span>
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-semibold">Main Savings ••• 4291</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <CalendarX size={20} />
                                        <span className="text-sm font-medium">Deadline</span>
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-semibold">Oct 26, 2023</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 md:p-8 border-t border-gray-200 dark:border-surface-border">
                            <div className="flex flex-col gap-4">
                                <button className="group relative w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500" disabled>
                                    <Lock size={24} className="group-disabled:opacity-70" />
                                    <span className="z-10 tracking-wide">Execute Withdrawal</span>
                                </button>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Info size={16} className="text-amber-500" />
                                        Requires 2 more signatures to unlock
                                    </span>
                                    <button className="text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 font-medium transition-colors text-sm">Cancel Request</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Signatures */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-surface-border p-6 shadow-card relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Check size={128} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 z-10 relative">Signature Progress</h3>
                        <div className="flex flex-col items-center justify-center py-2 relative z-10">
                            <div className="relative size-56">
                                <svg className="size-full" viewBox="0 0 200 200">
                                    <circle className="text-slate-100 dark:text-slate-800" cx="100" cy="100" fill="none" r="85" stroke="currentColor" strokeWidth="12"></circle>
                                    <circle className="text-primary transition-all duration-1000 ease-out -rotate-90 origin-center" cx="100" cy="100" fill="none" r="85" stroke="currentColor" strokeDasharray="176 534" strokeLinecap="round" strokeWidth="12"></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">1<span className="text-slate-300 dark:text-slate-600 text-3xl font-bold">/3</span></span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Collected</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Waiting for <span className="font-bold text-slate-900 dark:text-white">Bob</span> and <span className="font-bold text-slate-900 dark:text-white">Charlie</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide opacity-70">Guardians</h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">3 Total</span>
                        </div>

                        {/* Guardian List Items */}
                        {[
                            { name: "Alice.base", status: "Signed", time: "2h ago", color: "bg-green-500", icon: Check },
                            { name: "Bob.eth", status: "Pending", time: null, color: "bg-amber-500", icon: Clock },
                            { name: "Charlie.base", status: "Pending", time: null, color: "bg-amber-500", icon: Clock }
                        ].map((g, i) => (
                            <div key={i} className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border hover:border-primary/30 dark:hover:border-primary/30 shadow-sm transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`size-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-500 dark:text-slate-300 ${g.status === 'Signed' ? '' : 'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100'}`}>
                                            {g.name[0]}
                                        </div>
                                        {g.status === 'Signed' && (
                                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5">
                                                <div className="bg-green-500 text-white rounded-full p-0.5">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-slate-900 dark:text-white font-bold text-sm">{g.name}</p>
                                        <span className={cn(
                                            "inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded w-fit mt-0.5",
                                            g.status === 'Signed'
                                                ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                                                : "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
                                        )}>
                                            {g.status}
                                        </span>
                                    </div>
                                </div>
                                {g.status === 'Pending' ? (
                                    <button className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1">
                                        Nudge
                                        <Send size={14} />
                                    </button>
                                ) : (
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 font-medium">{g.time}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
