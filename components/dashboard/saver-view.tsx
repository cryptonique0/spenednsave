"use client";

import { Users, Lock, CreditCard, ArrowRight, ShieldCheck } from "lucide-react";
import { useAccount, useWatchContractEvent, usePublicClient, useBlockNumber } from "wagmi";
import { useDepositETH, useVaultETHBalance, useUserContracts, useVaultQuorum } from "@/lib/hooks/useContracts";
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
    const publicClient = usePublicClient();
    const { data: currentBlock } = useBlockNumber();
    
    const { deposit, isPending, isConfirming, isSuccess, hash } = useDepositETH(vaultAddress);
    const { data: vaultBalance, refetch: refetchBalance } = useVaultETHBalance(vaultAddress);
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const [depositAmount, setDepositAmount] = useState("0.01");
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [activities, setActivities] = useState<any[]>([]);

    // Fetch historical Deposited events
    useEffect(() => {
        async function fetchHistoricalEvents() {
            if (!vaultAddress || !guardianTokenAddress || !publicClient || !currentBlock) return;
            
            try {
                const fromBlock = currentBlock - 10000n > 0n ? currentBlock - 10000n : 0n;
                
                // Fetch deposit events
                const depositLogs = await publicClient.getLogs({
                    address: vaultAddress as Address,
                    event: {
                        type: 'event',
                        name: 'Deposited',
                        inputs: [
                            { type: 'address', indexed: true, name: 'token' },
                            { type: 'address', indexed: true, name: 'from' },
                            { type: 'uint256', indexed: false, name: 'amount' },
                        ],
                    },
                    fromBlock,
                    toBlock: 'latest',
                });

                // Fetch guardian added events
                const guardianLogs = await publicClient.getLogs({
                    address: guardianTokenAddress as Address,
                    event: {
                        type: 'event',
                        name: 'GuardianAdded',
                        inputs: [
                            { type: 'address', indexed: true, name: 'guardian' },
                            { type: 'uint256', indexed: false, name: 'tokenId' },
                        ],
                    },
                    fromBlock,
                    toBlock: 'latest',
                });

                const depositActivities = depositLogs.map((log: any) => ({
                    type: 'deposit',
                    from: log.args.from,
                    amount: log.args.amount,
                    token: log.args.token,
                    blockNumber: log.blockNumber,
                    timestamp: Date.now() - Number(currentBlock - log.blockNumber) * 2000,
                }));

                const guardianActivities = guardianLogs.map((log: any) => ({
                    type: 'guardian_added',
                    guardian: log.args.guardian,
                    tokenId: log.args.tokenId,
                    blockNumber: log.blockNumber,
                    timestamp: Date.now() - Number(currentBlock - log.blockNumber) * 2000,
                }));

                const allActivities = [...depositActivities, ...guardianActivities]
                    .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
                    .slice(0, 10);

                setActivities(allActivities);
            } catch (error) {
                console.error('Error fetching historical events:', error);
            }
        }
        
        fetchHistoricalEvents();
    }, [vaultAddress, guardianTokenAddress, publicClient, currentBlock]);

    // Watch for Deposited events
    useWatchContractEvent({
        address: vaultAddress as Address,
        abi: SpendVaultABI,
        eventName: 'Deposited',
        enabled: !!vaultAddress,
        onLogs(logs) {
            const newActivities = logs.map(log => ({
                type: 'deposit',
                from: log.args.from,
                amount: log.args.amount,
                token: log.args.token,
                blockNumber: log.blockNumber,
                timestamp: Date.now(),
            }));
            setActivities(prev => [...newActivities, ...prev].slice(0, 10));
        },
    });

    // Watch for GuardianAdded events
    useWatchContractEvent({
        address: guardianTokenAddress as Address,
        abi: GuardianSBTABI,
        eventName: 'GuardianAdded',
        enabled: !!guardianTokenAddress,
        onLogs(logs) {
            const newActivities = logs.map(log => ({
                type: 'guardian_added',
                guardian: log.args.guardian,
                tokenId: log.args.tokenId,
                blockNumber: log.blockNumber,
                timestamp: Date.now(),
            }));
            setActivities(prev => [...newActivities, ...prev].slice(0, 10));
        },
    });

    // Refetch balance after successful deposit
    useEffect(() => {
        if (isSuccess) {
            // Wait a bit for the transaction to be indexed
            const timer = setTimeout(() => {
                refetchBalance();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, refetchBalance]);

    const handleDeposit = () => {
        try {
            deposit(depositAmount);
        } catch (error) {
            console.error("Deposit failed:", error);
            alert(error instanceof Error ? error.message : "Deposit failed");
        }
    };

    // Format vault balance for display
    const ethBalance = vaultBalance ? formatEther(vaultBalance) : "0";
    const formattedEthBalance = parseFloat(ethBalance).toFixed(4);
    const totalGuardians = quorum ? Number(quorum) + 1 : 3; // Estimate, can be improved

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
                            <a href="/withdraw" className="flex-1 bg-white/10 backdrop-blur-md text-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-colors text-center flex items-center justify-center">
                                Withdraw
                            </a>
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
                        <button className="text-primary text-sm font-medium hover:text-primary-hover">View All</button>
                    </div>

                    {activities.length === 0 ? (
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
                                const amount = activity.amount ? formatEther(activity.amount) : '0';
                                const timeAgo = Math.floor((Date.now() - activity.timestamp) / 1000);
                                const timeString = timeAgo < 60 ? 'Just now' : 
                                                 timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                                                 timeAgo < 86400 ? `${Math.floor(timeAgo / 3600)}h ago` :
                                                 `${Math.floor(timeAgo / 86400)}d ago`;
                                
                                return (
                                    <div key={`${activity.blockNumber}-${i}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-10 rounded-full flex items-center justify-center ${
                                                isDeposit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                                            }`}>
                                                {isDeposit ? <CreditCard size={18} /> : <Users size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">
                                                    {isDeposit ? 'Deposit' : 'Guardian Added'}
                                                </p>
                                                {isGuardianAdded && activity.guardian && (
                                                    <p className="text-slate-400 text-sm">
                                                        You added {activity.guardian.slice(0, 6)}...{activity.guardian.slice(-4)} as guardian
                                                    </p>
                                                )}
                                                {isDeposit && (
                                                    <p className="text-slate-400 text-sm">
                                                        {activity.from && activity.from.toLowerCase() === address?.toLowerCase() 
                                                            ? 'You deposited to your vault' 
                                                            : `From ${activity.from?.slice(0, 6)}...${activity.from?.slice(-4)}`}
                                                    </p>
                                                )}
                                                <p className="text-slate-500 text-xs mt-0.5">{timeString}</p>
                                            </div>
                                        </div>
                                        {isDeposit && (
                                            <span className="text-emerald-400 font-medium">+{parseFloat(amount).toFixed(4)} ETH</span>
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
                        <p className="text-slate-400 text-sm leading-relaxed text-center">
                            {quorum ? `${quorum} of ${totalGuardians} signatures required` : "Loading guardian info..."}
                        </p>
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
