"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useUserContracts, useAddGuardian, useVaultQuorum } from "@/lib/hooks/useContracts";
import { useGuardians } from "@/lib/hooks/useVaultData";
import { useGuardianBadges } from "@/lib/hooks/useGuardianBadges";
import { Users, ShieldCheck, Clock, Plus, Trash2, Key, History } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { type Address } from "viem";

interface GuardianItemProps {
  guardian: any;
  onRevoke: (tokenId: bigint) => void;
  guardianBadgeAddress: string;
}

function GuardianItem({ guardian, onRevoke, guardianBadgeAddress }: GuardianItemProps) {
  const badges = useGuardianBadges(guardianBadgeAddress, guardian.address);
  
  return (
    <div key={guardian.address} className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-slate-100 dark:bg-surface-border flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              Guardian #{guardian.tokenId.toString()}
            </h3>
            <span className="size-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {guardian.address}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Added {new Date(guardian.addedAt).toLocaleDateString()}
          </p>
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex gap-2 mt-2">
              {badges.map((badge, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                  {badge.badgeType === 0 && "Approvals"}
                  {badge.badgeType === 1 && "Response"}
                  {badge.badgeType === 2 && "Longevity"}
                  <span className="ml-1">Lv{badge.level}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
        <button
          onClick={() => onRevoke(guardian.tokenId)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-semibold"
        >
          <Trash2 size={16} />
          Revoke
        </button>
      </div>
    </div>
  );
}

export function ManageGuardiansView() {
    const { address, isConnected } = useAccount();
    const { data: userContracts, isLoading: isLoadingContracts } = useUserContracts(address as any);
    const guardianTokenAddress = userContracts ? (userContracts as any)[0] : undefined;
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    const { data: quorum } = useVaultQuorum(vaultAddress);

    const { addGuardian, isPending, isConfirming, isSuccess } = useAddGuardian(guardianTokenAddress);
    const { guardians: guardiansList, isLoading: isLoadingGuardians } = useGuardians(guardianTokenAddress);
    
    const [isAdding, setIsAdding] = useState(false);
    const [newGuardian, setNewGuardian] = useState({ name: "", address: "" });

    const guardianCount = guardiansList.length;
    const pendingRequestsCount = 0; // TODO: Fetch from contract when available
    const recentEvents = guardiansList.map((g) => ({
        id: String(g.address),
        type: 'added' as const,
        guardian: String(g.address),
        timestamp: g.addedAt,
    })).reverse().slice(0, 5);

    // Close modal and reset form after successful add
    useEffect(() => {
        if (isSuccess) {
            setNewGuardian({ name: "", address: "" });
            setIsAdding(false);
        }
    }, [isSuccess]);

    const { enabled: simulationEnabled } = useSimulation();
    const handleAdd = () => {
        if (!newGuardian.address || !guardianTokenAddress) return;
        if (simulationEnabled) {
            alert('Simulation mode: No onchain transaction sent. This is a demo.');
            setIsAdding(false);
            setNewGuardian({ name: "", address: "" });
            return;
        }
        try {
            addGuardian(newGuardian.address as any);
        } catch (error) {
            console.error("Add guardian failed:", error);
            alert(error instanceof Error ? error.message : "Failed to add guardian");
        }
    };

    const handleRevoke = (tokenId: bigint) => {
        alert(`Revoke functionality coming soon. TokenId: ${tokenId}`);
    };

    // Show loading state
    if (!isConnected) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-slate-400 text-lg mb-4">Please connect your wallet</p>
                    <p className="text-slate-500 text-sm">Connect your wallet to manage guardians</p>
                </div>
            </div>
        );
    }

    if (isLoadingContracts) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="w-8 h-8 text-primary" />
                    <p className="text-slate-400">Loading your vault...</p>
                </div>
            </div>
        );
    }

    if (!vaultAddress || !guardianTokenAddress) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="size-16 rounded-full bg-surface-border/50 flex items-center justify-center text-slate-500 mx-auto mb-4">
                        <Users size={32} />
                    </div>
                    <p className="text-slate-400 text-lg mb-2">No vault found</p>
                    <p className="text-slate-500 text-sm mb-6">You need to create a vault first</p>
                    <a href="/vault/setup" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold">
                        <Plus size={20} />
                        Create Vault
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Guardians</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your trusted circle and approval thresholds.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Add New Guardian
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-xl text-primary">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{guardianCount}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Guardians Added</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Policy</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{quorum?.toString() || "..."} <span className="text-lg text-slate-400 dark:text-slate-500">of {guardianCount || "..."}</span></h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Signatures Required</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-500">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Queue</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{pendingRequestsCount}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Requests</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Guardians List */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Guardians</h2>

                    {isAdding && (
                        <div className="bg-white dark:bg-surface-dark border border-primary/50 dark:border-primary/50 rounded-2xl p-6 shadow-glow animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Add New Guardian</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address / ENS</label>
                                    <input
                                        type="text"
                                        placeholder="0x... or name.eth"
                                        className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={newGuardian.address}
                                        onChange={(e) => setNewGuardian({ ...newGuardian, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Label (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ledger"
                                        className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={newGuardian.name}
                                        onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Cancel</button>
                                <button 
                                    onClick={handleAdd}
                                    disabled={isPending || isConfirming || !newGuardian.address}
                                    className="px-6 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold"
                                >
                                    {isPending || isConfirming ? "Adding..." : "Add Guardian"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {isLoadingGuardians ? (
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-2xl p-12 text-center">
                                <Spinner className="w-8 h-8 text-primary mx-auto mb-4" />
                                <p className="text-slate-500">Loading guardians...</p>
                            </div>
                        ) : guardiansList.length === 0 ? (
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-2xl p-12 text-center">
                                <div className="size-16 rounded-full bg-slate-100 dark:bg-surface-border/50 flex items-center justify-center text-slate-400 mx-auto mb-4">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">No Guardians Yet</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Add trusted addresses to secure your vault</p>
                                <button
                                    onClick={() => setIsAdding(true)}
                                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold"
                                >
                                    <Plus size={20} />
                                    Add Your First Guardian
                                </button>
                            </div>
                        ) : (
                            guardiansList.map((guardian) => {
                                const GUARDIAN_BADGE_ADDRESS = process.env.NEXT_PUBLIC_GUARDIAN_BADGE_ADDRESS || "";
                                return (
                                    <GuardianItem
                                        key={guardian.address}
                                        guardian={guardian}
                                        guardianBadgeAddress={GUARDIAN_BADGE_ADDRESS}
                                        onRevoke={handleRevoke}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Threshold Card */}
                    <div className="bg-gradient-to-br from-surface-dark to-surface-darker border border-surface-border rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary" />
                            Quorum Configuration
                        </h3>
                        <div className="bg-black/20 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Current Threshold</span>
                                <span className="text-white font-bold">{quorum?.toString() || "..."}/{guardianCount || "..."}</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: quorum && guardiansList.length ? `${(Number(quorum) / guardiansList.length) * 100}%` : '66%' }}
                                ></div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Changing the threshold requires approval from existing guardians.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors">
                            Modify Policy
                        </button>
                    </div>

                    {/* Recent Events */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Recent Events</h3>
                        {recentEvents.length === 0 ? (
                            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border rounded-xl p-6 text-center">
                                <Clock size={24} className="text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500 dark:text-slate-400">No events yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentEvents.map((event, i) => {
                                    const timeAgo = Math.floor((Date.now() - event.timestamp) / 1000);
                                    const timeString = timeAgo < 60 ? 'Just now' : 
                                                     timeAgo < 3600 ? `${Math.floor(timeAgo / 60)}m ago` :
                                                     timeAgo < 86400 ? `${Math.floor(timeAgo / 3600)}h ago` :
                                                     `${Math.floor(timeAgo / 86400)}d ago`;
                                    
                                    return (
                                        <div key={event.id} className="flex gap-3">
                                            <div className="relative">
                                                <div className={`size-2 rounded-full mt-2 ${event.type === 'added' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                {i !== recentEvents.length - 1 && <div className="absolute top-4 left-1 w-px h-full bg-slate-200 dark:bg-slate-800 -ml-px"></div>}
                                            </div>
                                            <div className="pb-4 flex-1">
                                                <p className="text-sm text-slate-900 dark:text-white font-medium">
                                                    {event.type === 'added' ? 'Guardian Added' : 'Guardian Removed'}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    You {event.type === 'added' ? 'added' : 'removed'} {event.guardian.slice(0, 6)}...{event.guardian.slice(-4)} as guardian
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeString}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
