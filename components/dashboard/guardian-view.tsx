"use client";

import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Contract } from "ethers";
// import GuardianSBT ABI and address
import GuardianSBTABI from "@/lib/abis/GuardianSBT.json";


const GUARDIAN_SBT_ADDRESS = process.env.NEXT_PUBLIC_GUARDIAN_SBT_ADDRESS;

export function DashboardGuardianView() {
    const { address } = useAccount();
    const [vaults, setVaults] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVaults() {
            if (!address || !GUARDIAN_SBT_ADDRESS) return;
            // Use ethers.js to call getVaultsForGuardian
            const provider = new providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
            const contract = new Contract(GUARDIAN_SBT_ADDRESS, GuardianSBTABI, provider);
            const vaultAddresses: string[] = await contract.getVaultsForGuardian(address);
            // For each vault, fetch name, owner, and pending approvals from contract/backend
            // TODO: Replace with actual contract calls
            setVaults([]);
        }
        fetchVaults();
    }, [address]);

    // EIP-712 signing for gasless guardian approval
    const handleApprove = async (requestId: string) => {
        const request = pendingRequests.find(r => r.id === requestId);
        if (!request || !address) return;
        // Fetch nonce from contract (mocked here, replace with actual call)
        const nonce = Date.now(); // Replace with contract nonce
        // EIP-712 domain and types
        const domain = {
            name: 'SpendGuard',
            version: '1',
            chainId: 84532, // Replace with actual chainId
            verifyingContract: request.vaultAddr
        };
        const types = {
            Withdrawal: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'recipient', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'reason', type: 'string' },
                { name: 'category', type: 'string' },
                { name: 'reasonHash', type: 'string' },
                { name: 'createdAt', type: 'uint256' },
            ],
        };
        // Prepare message
        const message = {
            token: '0x0000000000000000000000000000000000000000',
            amount: parseFloat(request.amount) * 1e18,
            recipient: request.saverAddress,
            nonce,
            reason: request.reason,
            category: 'General', // Replace with actual category
            reasonHash: '', // Replace with actual reasonHash
            createdAt: Date.now(),
        };
        // Use wallet to signTypedData (wagmi, ethers, etc.)
        try {
            // @ts-ignore
            const signature = await window.ethereum.request({
                method: 'eth_signTypedData_v4',
                params: [address, JSON.stringify({ domain, types, primaryType: 'Withdrawal', message })],
            });
            // Store signature locally or send to backend for aggregation
            alert('Signature created! Share with owner to submit onchain.');
        } catch (err) {
            alert('Signature failed: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleReject = (requestId: string) => {
        console.log("Rejecting request:", requestId);
        // TODO: Implement rejection logic (optional - can just not sign)
        alert("Request rejected");
    };

    // Real contract/backend data should be loaded here
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [completedRequests, setCompletedRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        // TODO: Fetch pending/completed requests from contract or backend
        setLoading(false);
    }, [address]);

    return (
        <div className="w-full flex flex-col gap-8">
            {loading && (
                <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-12 text-center">
                    <p className="text-slate-600 dark:text-slate-400">Loading requests...</p>
                </div>
            )}
            {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
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
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <Clock className="text-orange-600 dark:text-orange-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Pending Requests</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingRequests.length}</p>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Approved This Month</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">12</p>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <Users className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">Vaults Guarding</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">3</p>
                </div>
            </div>

            {/* Vaults Guarding */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Vaults Guarding</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {vaults.map((vault) => (
                        <div key={vault.vaultAddress} className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6">
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
                                className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6 hover:border-primary/50 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                            {request.saverName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{request.saverName}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{request.saverAddress.slice(0, 6)}...{request.saverAddress.slice(-4)}</p>
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

                                {!request.hasUserSigned && (
                                    <div className="flex gap-3">
                                        <Link
                                            href="/voting"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Approve & Sign
                                        </Link>
                                        <button
                                            onClick={() => handleReject(request.id)}
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
                <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-12 text-center">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                        <Shield className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Pending Requests</h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        You're all caught up! When your friends submit withdrawal requests, they'll appear here for your review.
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
                                className="bg-white dark:bg-surface-dark border border-surface-border rounded-xl p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{request.saverName}</p>
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
