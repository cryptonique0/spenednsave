"use client";

import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Users, Award } from "lucide-react";
import { AvatarBlockie } from "@/components/ui/avatar-blockie";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { useScheduledWithdrawals } from "@/lib/hooks/useScheduledWithdrawals";
import { publicClient } from "@/lib/publicClient";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

// import GuardianSBT ABI and address
import GuardianSBTABI from "@/lib/abis/GuardianSBT.json";


const GUARDIAN_SBT_ADDRESS = process.env.NEXT_PUBLIC_GUARDIAN_SBT_ADDRESS;

// Move interface outside component to avoid redeclaration on every render
interface ScheduledWithdrawal {
    id: number;
    executed: boolean;
    approvals: string[];
    saverName: string;
    saverAddress: string;
    timestamp: string;
    amount: string;
    amountUSD: string;
    reason: string;
    requiredSignatures: number;
    currentSignatures: number;
    hasUserSigned: boolean;
}

function GuardianView({ badgeData }: { badgeData?: any }) {
    const { address } = useAccount();
    const [vaults, setVaults] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [reputation, setReputation] = useState<any>(null);

    // Replace with actual data fetching logic for reputation and badgeData

    useEffect(() => {
        async function fetchVaults() {
            if (!address || !GUARDIAN_SBT_ADDRESS) return;
            try {
                // Use viem to read from contract
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http(),
                });
                
                // This call may fail if the ABI or contract is not correct, so wrap in try/catch
                // If not implemented, just set empty
                try {
                    await client.readContract({
                        address: GUARDIAN_SBT_ADDRESS as `0x${string}`,
                        abi: GuardianSBTABI as any,
                        functionName: 'getVaultsForGuardian',
                        args: [address],
                    });
                } catch {
                    // fallback: not implemented
                }
                // For each vault, fetch name, owner, and pending approvals from contract/backend
                // Replace with actual contract calls in production
                setVaults([]);
            } catch {
                setVaults([]);
            }
        }
        fetchVaults();
    }, [address]);

    // EIP-712 signing for gasless guardian approval
    const handleReject = () => {
        // Rejection logic can be implemented if needed
        alert("Request rejected");
    };

    // Real contract/backend data should be loaded here
    // Scheduled withdrawals integration
    const { scheduled, loading, error } = useScheduledWithdrawals();
    function getErrorMessage(err: unknown): string | undefined {
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
            return (err as Record<string, string>).message;
        }
        return undefined;
    }
    const errorMsg = error ? getErrorMessage(error) : undefined;
    // Filter for pending scheduled withdrawals (not executed, not yet approved by this guardian)
    const addressStr = address ? String(address) : "";
    const pendingRequests: ScheduledWithdrawal[] = (scheduled || []).filter((w: ScheduledWithdrawal) => !w.executed && !(w.approvals || []).includes(addressStr));
    const completedRequests: ScheduledWithdrawal[] = (scheduled || []).filter((w: ScheduledWithdrawal) => w.executed);

    // Approve scheduled withdrawal via API
    async function approveScheduledWithdrawal(id: number) {
        try {
            const res = await fetch(`/api/scheduled-withdrawals/${id}/approve`, { method: 'POST' });
            if (!res.ok) {
                let errMsg = 'Failed to approve withdrawal';
                try {
                    const err = await res.json();
                    if (err && typeof err.error === 'string') errMsg = err.error;
                } catch {}
                alert(errMsg);
            } else {
                alert('Withdrawal approved!');
                window.location.reload();
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to approve withdrawal');
        }
    }
    return (
        <div className="w-full flex flex-col gap-8">
            {loading && (
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">Loading requests...</p>
                </div>
            )}
            {errorMsg && errorMsg.length > 0 && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">{errorMsg}</p>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Guardian Dashboard</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Review and approve withdrawal requests from your friends</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <Shield className="text-indigo-600 dark:text-indigo-400" size={20} />
                    <div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Active Guardian</p>
                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-300">{pendingRequests.length} Pending</p>
                    </div>
                </div>
                {badgeData && (
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-slate-500">Badges</div>
                        <div className="flex items-center gap-2">
                            {(badgeData[0] || []).map((tid: any, i: number) => (
                                <div key={String(tid)} className="inline-flex items-center gap-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl px-3 py-1 text-xs">
                                    <Award size={16} className="text-amber-500" />
                                    <div>
                                        <div className="font-semibold">{badgeData[1] && badgeData[1][i] ? `Type ${String(badgeData[1][i])}` : 'Badge'}</div>
                                        <div className="text-xs text-slate-500">{badgeData[2] && badgeData[2][i] ? new Date(Number(badgeData[2][i]) * 1000).toLocaleDateString() : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Cards: Reputation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <Clock className="text-orange-600 dark:text-orange-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Pending Requests</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingRequests.length}</p>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Approvals</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{reputation?.approvals ?? '-'}</p>
                </div>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Users className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Response Time</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">
                        {reputation?.avgResponseSeconds != null ? `${Math.round(reputation.avgResponseSeconds / 60)} min` : '-'}
                    </p>
                </div>
            </div>
            {/* Guardian Approval History */}
            {reputation?.history?.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Approval History</h2>
                    <div className="space-y-3">
                        {reputation.history.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                                        <span>{item.recipient.slice(0, 6)}...{item.recipient.slice(-4)}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(item.recipient)}
                                            title="Copy address"
                                            className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
                                        </button>
                                    </div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">{item.reason}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900 dark:text-white">{item.amount}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vaults Guarding */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Vaults Guarding</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vaults.map((vault) => (
                        <div key={vault.vaultAddress} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{vault.vaultName}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Owner: {vault.owner}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Pending Approvals: {vault.pendingApprovals}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Pending Requests</h2>
                    <div className="space-y-4">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                            <AvatarBlockie address={request.saverAddress} size={44} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{request.saverName}</h3>
                                            <span className="flex items-center gap-1">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{request.saverAddress.slice(0, 6)}...{request.saverAddress.slice(-4)}</p>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(request.saverAddress)}
                                                    title="Copy address"
                                                    className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
                                                </button>
                                            </span>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{request.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{request.amount}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{request.amountUSD}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Reason for withdrawal:</p>
                                    <p className="text-slate-900 dark:text-white font-medium">{request.reason}</p>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {Array.from({ length: request.requiredSignatures }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`size-8 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center text-xs font-bold ${i < request.currentSignatures
                                                            ? "bg-emerald-500 text-white"
                                                            : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                                        }`}
                                                >
                                                    {i < request.currentSignatures ? "✓" : i + 1}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {request.currentSignatures} of {request.requiredSignatures} signatures
                                        </span>
                                    </div>
                                    {request.hasUserSigned && (
                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                            <CheckCircle size={16} />
                                            You signed
                                        </div>
                                    )}
                                </div>

                                {!(request.approvals || []).includes(addressStr) && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => approveScheduledWithdrawal(request.id)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Approve
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={20} />
                                            Decline
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {pendingRequests.length === 0 && (
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <Shield className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Pending Requests</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        You&apos;re all caught up! When your friends submit withdrawal requests, they&apos;ll appear here for your review.
                    </p>
                </div>
            )}

            {/* Recent Activity */}
            {completedRequests.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
                    <div className="space-y-3">
                        {completedRequests.map((request) => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                                        </div>
                                        <AvatarBlockie address={request.saverAddress} size={24} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                                            {request.saverName}
                                            <button
                                                onClick={() => navigator.clipboard.writeText(request.saverAddress)}
                                                title="Copy address"
                                                className="ml-1 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
                                            </button>
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{request.reason}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 dark:text-white">{request.amount}</p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">Approved</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>
        );
    }

    export default GuardianView;
    export { GuardianView as DashboardGuardianView };

