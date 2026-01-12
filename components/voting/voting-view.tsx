"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowRight, User, Check, X, AlertCircle } from "lucide-react";
import { useAccount, useSignTypedData, useChainId } from "wagmi";
import { useUserContracts, useVaultQuorum, useIsGuardian } from "@/lib/hooks/useContracts";
import { type Address, formatEther } from "viem";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

export function VotingView() {
    const [status, setStatus] = useState<'loading' | 'pending' | 'signed' | 'empty' | 'unauthorized'>('loading');
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: userContracts } = useUserContracts(address as any);
    const guardianTokenAddress = userContracts ? (userContracts as any)[0] : undefined;
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const { data: isGuardian, isLoading: isCheckingGuardian } = useIsGuardian(guardianTokenAddress, address);
    
    const { signTypedData, data: signature, isPending: isSigning, isSuccess: isSignSuccess } = useSignTypedData();

    useEffect(() => {
        // Check if user is a guardian before showing withdrawal requests
        if (isCheckingGuardian) {
            setStatus('loading');
            return;
        }

        if (!isGuardian) {
            setStatus('unauthorized');
            return;
        }

        // Fetch withdrawal requests from localStorage
        // In production, this would fetch from a backend or IPFS
        if (!vaultAddress) return;

        try {
            const storedRequests = localStorage.getItem(`withdrawal-requests-${vaultAddress}`);
            if (storedRequests) {
                const requests = JSON.parse(storedRequests);
                // Filter to only show requests for this vault and not already signed by this guardian
                const pending = requests.filter((req: any) => {
                    // Only show requests for this vault
                    if (req.vaultAddress !== vaultAddress) return false;
                    
                    const signatures = req.signatures || [];
                    // Filter out already signed requests by this guardian
                    // Don't count owner signatures when checking if guardian has signed
                    return !signatures.some((sig: any) => sig.signer === address && sig.role === 'guardian');
                });
                
                if (pending.length > 0) {
                    setPendingRequests(pending);
                    setStatus('pending');
                } else {
                    setStatus('empty');
                }
            } else {
                setStatus('empty');
            }
        } catch (error) {
            console.error('Error loading withdrawal requests:', error);
            setStatus('empty');
        }
    }, [vaultAddress, address, isGuardian, isCheckingGuardian]);

    useEffect(() => {
        if (isSignSuccess && signature && pendingRequests.length > 0) {
            // Save guardian signature to localStorage
            try {
                const currentRequest = pendingRequests[0];
                const storedRequests = localStorage.getItem(`withdrawal-requests-${vaultAddress}`);
                if (storedRequests) {
                    const requests = JSON.parse(storedRequests);
                    const updatedRequests = requests.map((req: any) => {
                        if (req.id === currentRequest.id) {
                            const guardianSignatures = (req.signatures || []).filter((s: any) => s.role !== 'owner');
                            return {
                                ...req,
                                signatures: [
                                    ...(req.signatures || []),
                                    { signer: address, signature, timestamp: Date.now(), role: 'guardian' }
                                ],
                                signaturesCount: guardianSignatures.length + 1 // Count only guardian signatures
                            };
                        }
                        return req;
                    });
                    localStorage.setItem(`withdrawal-requests-${vaultAddress}`, JSON.stringify(updatedRequests));
                }
            } catch (error) {
                console.error('Error saving signature:', error);
            }
            setStatus('signed');
        }
    }, [isSignSuccess, signature, pendingRequests, vaultAddress, address]);

    const handleSign = async (request: any) => {
        if (!vaultAddress || !chainId) return;

        setStatus('pending');

        // EIP-712 domain
        const domain = {
            name: 'SpendGuard',
            version: '1',
            chainId: chainId,
            verifyingContract: vaultAddress as Address,
        };

        // EIP-712 types
        const types = {
            Withdrawal: [
                { name: 'token', type: 'address' },
                { name: 'amount', type: 'uint256' },
                { name: 'recipient', type: 'address' },
                { name: 'nonce', type: 'uint256' },
                { name: 'reason', type: 'string' },
            ],
        };

        // Sign the withdrawal request
        try {
            signTypedData({
                domain,
                types,
                primaryType: 'Withdrawal',
                message: {
                    token: request.token as Address,
                    amount: BigInt(request.amount), // Convert string back to BigInt
                    recipient: request.recipient as Address,
                    nonce: BigInt(request.nonce), // Convert string back to BigInt
                    reason: request.reason,
                },
            });
        } catch (error) {
            console.error("Signature failed", error);
            alert("Failed to sign withdrawal request");
        }
    };

    const handleReject = () => {
        alert("Rejection recorded. The request will not receive your signature.");
    };

    if (!isConnected) {
        return (
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Wallet Not Connected</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Please connect your wallet to view and vote on withdrawal requests
                </p>
            </div>
        );
    }

    if (status === 'unauthorized') {
        return (
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unauthorized Access</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    You are not a guardian for any vault. Only guardians can sign withdrawal requests.
                </p>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                <Spinner className="w-12 h-12 text-primary mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Loading pending requests...
                </p>
            </div>
        );
    }

    if (status === 'empty') {
        return (
            <div className="relative w-full max-w-md">
                <div className="bg-[#1a1d26] dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-10 md:p-14 flex flex-col items-center shadow-card overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-surface-border shadow-lg group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition-all duration-500">
                            <Shield size={44} className="text-emerald-500" />
                        </div>
                        <div className="absolute top-1 right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-surface-border">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center text-center gap-3 mb-10">
                        <h3 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight">No active proposals</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-[280px]">
                            Your friend hasn't tried to spend any money yet. Good job!
                        </p>
                    </div>
                    <div className="flex flex-col w-full gap-3">
                        <Link href="/activity" className="w-full h-11 px-6 rounded-xl bg-slate-100 dark:bg-surface-border/50 hover:bg-slate-200 dark:hover:bg-surface-border text-slate-900 dark:text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent hover:border-slate-300 dark:hover:border-white/5 group/btn">
                            <ArrowRight size={20} className="text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white transition-colors" />
                            View Transaction History
                        </Link>
                    </div>
                    <div className="mt-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                        <Shield size={14} className="text-emerald-500" />
                        <span className="text-slate-400 text-xs font-medium tracking-wide">Secured by Base</span>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'signed') {
        return (
            <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-8 text-center shadow-card animate-in fade-in zoom-in duration-300">
                <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mx-auto mb-6 shadow-glow">
                    <Check size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Vote Cast Successfully</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                    You have securely signed this withdrawal request. The requester will need {quorum?.toString() || '2'} total guardian signatures to execute the withdrawal.
                </p>
                <div className="p-4 bg-gray-50 dark:bg-surface-border/30 rounded-xl mb-6">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Your Signature</p>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all">
                        {signature ? `${signature.slice(0, 20)}...${signature.slice(-20)}` : 'Generating...'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link 
                        href="/dashboard"
                        className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                    <button
                        onClick={() => {
                            // Reload requests
                            const storedRequests = localStorage.getItem(`withdrawal-requests-${vaultAddress}`);
                            if (storedRequests) {
                                const requests = JSON.parse(storedRequests);
                                const pending = requests.filter((req: any) => {
                                    const signatures = req.signatures || [];
                                    return !signatures.some((sig: any) => sig.signer === address && sig.role === 'guardian');
                                });
                                if (pending.length > 0) {
                                    setPendingRequests(pending);
                                    setStatus('pending');
                                } else {
                                    setStatus('empty');
                                }
                            } else {
                                setStatus('empty');
                            }
                        }}
                        className="flex-1 bg-slate-100 dark:bg-surface-border hover:bg-slate-200 dark:hover:bg-surface-border/80 text-slate-900 dark:text-white font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                        View More Requests
                    </button>
                </div>
            </div>
        )
    }

    // Get the first pending request to display
    const pendingRequest = pendingRequests.length > 0 ? pendingRequests[0] : null;

    // Render pending request if available
    if (status === 'pending' && pendingRequest) {
        return (
        <div className="relative w-full max-w-md">
            <div className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl overflow-hidden shadow-card">
                {/* Header */}
                <div className="bg-blue-50 dark:bg-blue-500/10 p-6 border-b border-gray-100 dark:border-surface-border text-center">
                    <div className="inline-flex flex-col items-center mb-4">
                        <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md mb-3 flex items-center justify-center text-white font-bold text-xl">
                            {pendingRequest.owner ? pendingRequest.owner[0].toUpperCase() : 'V'}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Withdrawal Request</h3>
                        <p className="text-xs text-slate-500">From {pendingRequest.owner?.slice(0, 6)}...{pendingRequest.owner?.slice(-4)}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-gray-100 dark:border-surface-border/50">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requesting</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {formatEther(BigInt(pendingRequest.amount))} <span className="text-sm font-medium text-slate-400">ETH</span>
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-slate-400 pt-0.5">format_quote</span>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{pendingRequest.reason}"</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Consensus Status</span>
                            <span className="text-slate-900 dark:text-white font-bold">
                                {(pendingRequest.signatures?.length || 0)} of {quorum} Signed
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-surface-border/50 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                style={{ width: `${((pendingRequest.signatures?.length || 0) / (Number(quorum) || 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Vault:</span>
                            <span className="font-mono">{vaultAddress?.slice(0, 10)}...{vaultAddress?.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Recipient:</span>
                            <span className="font-mono">{pendingRequest.recipient?.slice(0, 10)}...{pendingRequest.recipient?.slice(-8)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Nonce:</span>
                            <span className="font-mono">{pendingRequest.nonce}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 flex gap-3">
                    <button 
                        onClick={handleReject}
                        disabled={isSigning}
                        className="flex-1 py-3.5 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <X size={18} />
                        Reject
                    </button>
                    <button
                        onClick={() => handleSign(pendingRequest)}
                        disabled={isSigning}
                        className="flex-[2] py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSigning ? (
                            <>
                                <Spinner />
                                Signing...
                            </>
                        ) : (
                            <>
                                <Check size={18} />
                                Sign & Approve
                            </>
                        )}
                    </button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-background-dark/50 text-center border-t border-gray-100 dark:border-surface-border">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                        <Shield size={12} />
                        Secured by Smart Contract
                    </p>
                </div>
            </div>
        </div>
        );
    }

    // If no pending requests, show empty state
    return (
        <div className="relative w-full max-w-md">
            <div className="bg-[#1a1d26] dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-10 md:p-14 flex flex-col items-center shadow-card overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                    <div className="relative z-10 w-24 h-24 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-surface-border shadow-lg group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition-all duration-500">
                        <Shield size={44} className="text-emerald-500" />
                    </div>
                    <div className="absolute top-1 right-1 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center border border-surface-border">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                    </div>
                </div>
                <div className="flex flex-col items-center text-center gap-3 mb-10">
                    <h3 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight tracking-tight">No active proposals</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed max-w-[280px]">
                        Your friend hasn't tried to spend any money yet. Good job!
                    </p>
                </div>
                <div className="flex flex-col w-full gap-3">
                    <Link href="/activity" className="w-full h-11 px-6 rounded-xl bg-slate-100 dark:bg-surface-border/50 hover:bg-slate-200 dark:hover:bg-surface-border text-slate-900 dark:text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-transparent hover:border-slate-300 dark:hover:border-white/5 group/btn">
                        <ArrowRight size={20} className="text-slate-400 group-hover/btn:text-slate-900 dark:group-hover/btn:text-white transition-colors" />
                        View Transaction History
                    </Link>
                </div>
                <div className="mt-8 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                    <Shield size={14} className="text-emerald-500" />
                    <span className="text-slate-400 text-xs font-medium tracking-wide">Secured by Base</span>
                </div>
            </div>
        </div>
    );
}
