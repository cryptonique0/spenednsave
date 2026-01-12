"use client";

import { Users, Lock, CreditCard, ArrowRight, ShieldCheck } from "lucide-react";
import { useAccount, useWatchContractEvent } from "wagmi";
import { useDepositETH, useVaultETHBalance, useUserContracts, useVaultQuorum } from "@/lib/hooks/useContracts";
import { useGuardians, useVaultActivity } from "@/lib/hooks/useVaultData";
import { SpendVaultABI } from "@/lib/abis/SpendVault";
import { GuardianSBTABI } from "@/lib/abis/GuardianSBT";
import { formatEther, type Address } from "viem";
import { useState, useEffect } from "react";
import Link from "next/link";

export function DashboardSaverView() {
    const { address } = useAccount();
    const { data: userContracts } = useUserContracts(address as any);
    const guardianTokenAddress = userContracts ? (userContracts as any)[0] : undefined;
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    
    const { deposit, isPending, isConfirming, isSuccess, hash } = useDepositETH(vaultAddress);
    const { data: vaultBalance, refetch: refetchBalance } = useVaultETHBalance(vaultAddress);
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const [depositAmount, setDepositAmount] = useState("0.01");
    const [showDepositModal, setShowDepositModal] = useState(false);
    
    // Use new hooks for guardians and activity
    const { guardians, isLoading: guardiansLoading, error: guardiansError } = useGuardians(guardianTokenAddress);
    const { activities, isLoading: activitiesLoading, refetch: refetchActivities } = useVaultActivity(vaultAddress, guardianTokenAddress, 10);

    // Debug logging
    useEffect(() => {
        console.log('[DashboardSaverView] guardianTokenAddress:', guardianTokenAddress);
        console.log('[DashboardSaverView] vaultAddress:', vaultAddress);
        console.log('[DashboardSaverView] guardians:', guardians);
        console.log('[DashboardSaverView] guardiansLoading:', guardiansLoading);
        console.log('[DashboardSaverView] guardiansError:', guardiansError);
        console.log('[DashboardSaverView] activities:', activities);
    }, [guardianTokenAddress, vaultAddress, guardians, guardiansLoading, guardiansError, activities]);

    // Watch for Deposited events in real-time
    useWatchContractEvent({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        eventName: 'Deposited',
        enabled: !!vaultAddress,
        onLogs(logs) {
            console.log('[DashboardSaverView] Deposited event detected!', logs);
            // Refetch balance and activities when new deposits come in
            refetchBalance();
            refetchActivities();
        },
    });

    // Watch for GuardianAdded events in real-time
    useWatchContractEvent({
        address: guardianTokenAddress as Address,
        abi: GuardianSBTABI,
        eventName: 'GuardianAdded',
        enabled: !!guardianTokenAddress,
        onLogs(logs) {
            // Refetch activities when guardians are added
            refetchActivities();
        },
    });

    // Refetch balance after successful deposit
    useEffect(() => {
        if (isSuccess) {
            console.log('[DashboardSaverView] Deposit successful, refetching...');
            // Wait a bit for the transaction to be indexed
            const timer = setTimeout(() => {
                refetchBalance();
                refetchActivities();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, refetchBalance, refetchActivities]);

    const handleDeposit = () => {
        try {
            deposit(depositAmount);
        } catch (error) {
            console.error("Deposit failed:", error);
            alert(error instanceof Error ? error.message : "Deposit failed");
        }
    };

    // Format vault balance for display
    const ethBalance = vaultBalance && typeof vaultBalance === 'bigint' ? formatEther(vaultBalance) : "0";
    const formattedEthBalance = parseFloat(ethBalance).toFixed(4);
    const totalGuardians = guardians.length;

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
                                <h2 className="text-4xl font-bold tracking-tight">{formattedEthBalance} ETH</h2>
                            </div>
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                <ShieldCheck className="text-blue-100" />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-auto">
                            <button
                                onClick={() => setShowDepositModal(true)}
                                disabled={!vaultAddress}
                                className="flex-1 bg-white text-primary font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>Deposit</span>
                            </button>
                            <Link href="/withdraw" className="flex-1 bg-white/10 backdrop-blur-md text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors text-center flex items-center justify-center">
                                Withdraw
                            </Link>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>

                {/* Vault Info */}
                <div className="bg-surface-dark border border-surface-border rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Vault Status</p>
                                <h3 className="text-white font-bold text-lg">Protected</h3>
                            </div>
                            <div className="size-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <ShieldCheck size={24} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Vault Address</span>
                                <span className="text-white font-mono text-xs">
                                    {vaultAddress ? `${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)}` : "Loading..."}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Network</span>
                                <span className="text-white">Base Sepolia</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mt-6">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Users size={16} />
                            </div>
                            <div>
                                <p className="text-white font-medium">Multi-Sig Active</p>
                                <p className="text-slate-500 text-xs">
                                    {quorum ? `${quorum} of ${totalGuardians} Guardians required` : "Loading..."}
                                </p>
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
                        <button 
                            onClick={() => {
                                console.log('[DashboardSaverView] Manual refresh clicked');
                                refetchActivities();
                            }}
                            className="text-primary text-sm font-medium hover:text-primary-hover flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>

                    {activitiesLoading ? (
                        <div className="bg-surface-dark border border-surface-border rounded-2xl p-8 text-center">
                            <p className="text-slate-400 text-sm">Loading activity...</p>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="bg-surface-dark border border-surface-border rounded-2xl p-8 text-center">
                            <div className="size-16 rounded-full bg-surface-border/50 flex items-center justify-center text-slate-500 mx-auto mb-4">
                                <CreditCard size={24} />
                            </div>
                            <p className="text-slate-400 text-sm">No recent activity</p>
                            <p className="text-slate-500 text-xs mt-2">Your transactions will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border">
                            {activities.map((activity, i) => {
                                const isDeposit = activity.type === 'deposit';
                                const isGuardianAdded = activity.type === 'guardian_added';
                                const isWithdrawal = activity.type === 'withdrawal';
                                
                                const amount = activity.data?.amount ? formatEther(activity.data.amount) : '0';
                                const timeAgo = Math.floor((Date.now() - activity.timestamp) / 1000);
                                const timeString = timeAgo < 60 ? 'Just now' : 
                                                 timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                                                 timeAgo < 86400 ? `${Math.floor(timeAgo / 3600)}h ago` :
                                                 `${Math.floor(timeAgo / 86400)}d ago`;
                                
                                return (
                                    <div key={`${activity.blockNumber}-${i}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${
                                                isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 
                                                isWithdrawal ? 'bg-red-500/10 text-red-500' :
                                                'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {isDeposit && <CreditCard size={18} />}
                                                {isWithdrawal && <Lock size={18} />}
                                                {isGuardianAdded && <Users size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {isDeposit ? 'Deposit' : isWithdrawal ? 'Withdrawal' : 'Guardian Added'}
                                                </p>
                                                {isGuardianAdded && activity.data?.address && (
                                                    <p className="text-slate-400 text-sm">
                                                        You added {activity.data.address.slice(0, 6)}...{activity.data.address.slice(-4)} as guardian
                                                    </p>
                                                )}
                                                {isDeposit && activity.data?.from && (
                                                    <p className="text-slate-400 text-sm">
                                                        {activity.data.from.toLowerCase() === address?.toLowerCase() 
                                                            ? 'You deposited to your vault' 
                                                            : `From ${activity.data.from.slice(0, 6)}...${activity.data.from.slice(-4)}`}
                                                    </p>
                                                )}
                                                {isWithdrawal && activity.data?.reason && (
                                                    <p className="text-slate-400 text-sm">{activity.data.reason}</p>
                                                )}
                                                <p className="text-slate-500 text-xs mt-0.5">{timeString}</p>
                                            </div>
                                        </div>
                                        {(isDeposit || isWithdrawal) && (
                                            <span className={`font-medium ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isDeposit ? '+' : '-'}{parseFloat(amount).toFixed(4)} ETH
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Quick Actions / Guardians */}
                <section className="flex flex-col gap-6">
                    <h3 className="text-white text-xl font-bold">Guardians</h3>
                    <div className="bg-surface-dark border border-surface-border rounded-2xl p-6">
                        <div className="flex items-center justify-center mb-6">
                            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Users size={32} />
                            </div>
                        </div>
                        {guardiansLoading ? (
                            <p className="text-slate-400 text-sm leading-relaxed text-center">Loading guardians...</p>
                        ) : (
                            <>
                                <p className="text-slate-400 text-sm leading-relaxed text-center">
                                    {guardians.length > 0 
                                        ? `${quorum ? Number(quorum) : 0} of ${totalGuardians} signatures required`
                                        : 'No guardians added yet'}
                                </p>
                                {guardians.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {guardians.slice(0, 3).map((guardian) => (
                                            <div key={guardian.address} className="text-xs text-slate-500 text-center font-mono">
                                                {guardian.address.slice(0, 6)}...{guardian.address.slice(-4)}
                                            </div>
                                        ))}
                                        {guardians.length > 3 && (
                                            <p className="text-xs text-slate-600 text-center">+{guardians.length - 3} more</p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        <Link href="/guardians" className="block w-full mt-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors text-center">
                            Manage Guardians
                        </Link>
                    </div>
                </section>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDepositModal(false)}>
                    <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white text-xl font-bold">Deposit ETH</h3>
                            <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Amount (ETH)</label>
                                <input
                                    type="text"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    className="w-full bg-background-dark border border-border-dark rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                                    placeholder="0.01"
                                />
                            </div>
                            <div className="flex gap-2">
                                {["0.01", "0.05", "0.1"].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setDepositAmount(amount)}
                                        className="flex-1 py-2 bg-surface-border hover:bg-surface-border/80 text-white rounded-lg text-sm transition-colors"
                                    >
                                        {amount} ETH
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    handleDeposit();
                                    setShowDepositModal(false);
                                }}
                                disabled={isPending || isConfirming || !depositAmount}
                                className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                {isPending || isConfirming ? "Processing..." : "Confirm Deposit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlusIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
