"use client";

import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Users } from "lucide-react";
import { useAccount } from "wagmi";
import { useState } from "react";

// Mock data for pending withdrawal requests
// In production, this would come from contract events or a backend
const mockPendingRequests = [
    {
        id: "1",
        saverAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        saverName: "alice.eth",
        amount: "0.5 ETH",
        amountUSD: "$1,250.00",
        reason: "Emergency medical expenses",
        timestamp: "2 hours ago",
        requiredSignatures: 2,
        currentSignatures: 0,
        hasUserSigned: false,
        vaultAddress: "0x1234...5678",
    },
    {
        id: "2",
        saverAddress: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        saverName: "bob.base",
        amount: "1.2 ETH",
        amountUSD: "$3,000.00",
        reason: "Car repair - transmission failure",
        timestamp: "5 hours ago",
        requiredSignatures: 3,
        currentSignatures: 1,
        hasUserSigned: false,
        vaultAddress: "0x5678...9abc",
    },
    {
        id: "3",
        saverAddress: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        saverName: "charlie.eth",
        amount: "0.3 ETH",
        amountUSD: "$750.00",
        reason: "Laptop replacement for work",
        timestamp: "1 day ago",
        requiredSignatures: 2,
        currentSignatures: 2,
        hasUserSigned: true,
        vaultAddress: "0x9abc...def0",
        status: "approved",
    },
];

export function DashboardGuardianView() {
    const { address } = useAccount();
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

    const handleApprove = (requestId: string) => {
        console.log("Approving request:", requestId);
        // TODO: Sign the withdrawal request with EIP-712
        alert("Signing withdrawal request...");
    };

    const handleReject = (requestId: string) => {
        console.log("Rejecting request:", requestId);
        // TODO: Implement rejection logic (optional - can just not sign)
        alert("Request rejected");
    };

    const pendingRequests = mockPendingRequests.filter(r => !r.status);
    const completedRequests = mockPendingRequests.filter(r => r.status);

    return (
        <div className="w-full flex flex-col gap-8">
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
                                        <button
                                            onClick={() => handleApprove(request.id)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={20} />
                                            Approve & Sign
                                        </button>
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
