"use client";

import { Users, Lock, CreditCard, ArrowRight, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";
import { useDepositETH, useVaultETHBalance, useUserContracts } from "@/lib/hooks/useContracts";
import { formatEther } from "viem";
import { useState } from "react";

export function DashboardSaverView() {
    const { address } = useAccount();
    const { data: userContracts } = useUserContracts(address as any);
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    
    const { deposit, isPending, isConfirming, isSuccess } = useDepositETH(vaultAddress);
    const { data: vaultBalance } = useVaultETHBalance(vaultAddress);
    const [depositAmount, setDepositAmount] = useState("0.01");

    const handleDeposit = () => {
        try {
            deposit(depositAmount);
        } catch (error) {
            console.error("Deposit failed:", error);
            alert(error instanceof Error ? error.message : "Deposit failed");
        }
    };

    // Format vault balance for display
    const formattedBalance = vaultBalance
        ? `$${(parseFloat(formatEther(vaultBalance)) * 2500).toFixed(2)}` // Assuming ETH = $2500 for demo
        : "$0.00";

    return (
        <div className="w-full flex flex-col gap-8">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Balance */}
                <div className="md:col-span-2 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-glow">
                    <div className="relative z-10 flex flex-col justify-between h-full min-h-[180px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 font-medium mb-1">Total Vault Balance</p>
                                <h2 className="text-4xl font-bold tracking-tight">{formattedBalance}</h2>
                            </div>
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <ShieldCheck className="text-blue-100" />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <button
                                onClick={handleDeposit}
                                disabled={isPending || isConfirming}
                                className="flex-1 bg-white text-primary font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isPending || isConfirming ? 'Depositing...' : 'Deposit'}</span>
                            </button>
                            <a href="/withdraw" className="flex-1 bg-white/10 backdrop-blur-md text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors text-center flex items-center justify-center">
                                Withdraw
                            </a>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>

                {/* Goal Progress */}
                <div className="bg-surface-dark border border-surface-border rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Goal</p>
                                <h3 className="text-white font-bold text-lg">New Car Fund</h3>
                            </div>
                            <span className="text-2xl font-bold text-blue-400">54%</span>
                        </div>
                        <div className="w-full h-3 bg-surface-border rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-gradient-to-r from-blue-400 to-primary w-[54%] rounded-full"></div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white">$5,420</span>
                            <span className="text-slate-500">Target: $10,000</span>
                        </div>
                    </div>

                    <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-white font-medium">Multi-Sig Active</p>
                                <p className="text-slate-500 text-xs">2 of 3 Guardians required</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Area */}
                <section className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white text-xl font-bold">Recent Activity</h3>
                        <button className="text-primary text-sm font-medium hover:text-primary-hover">View All</button>
                    </div>

                    <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-surface-border flex items-center justify-center text-slate-400">
                                        {i === 0 ? <CreditCard size={18} /> : <Users size={18} />}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{i === 0 ? "Deposit" : "Guardian Added"}</p>
                                        <p className="text-slate-500 text-xs">Today, 2:30 PM</p>
                                    </div>
                                </div>
                                <span className={i === 0 ? "text-emerald-400 font-medium" : "text-white font-medium"}>
                                    {i === 0 ? "+$500.00" : ""}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Quick Actions / Guardians */}
                <section className="flex flex-col gap-6">
                    <h3 className="text-white text-xl font-bold">The Board</h3>
                    <div className="bg-surface-dark border border-surface-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="size-8 rounded-full bg-gray-700 border-2 border-surface-dark"></div>
                                ))}
                            </div>
                            <button className="size-8 rounded-full border border-dashed border-slate-500 flex items-center justify-center text-slate-500 hover:text-white hover:border-white transition-colors">
                                <PlusIcon />
                            </button>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your guardians are active and monitoring your vault. No pending approval requests.
                        </p>
                        <a href="/guardians" className="block w-full mt-6 py-2 bg-surface-border hover:bg-surface-border/80 text-white rounded-xl text-sm font-medium transition-colors text-center">
                            Manage Guardians
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
