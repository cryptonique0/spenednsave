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
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
    
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: userContracts } = useUserContracts(address as any);
    const guardianTokenAddress = userContracts ? (userContracts as any)[0] : undefined;
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const { data: isGuardian, isLoading: isCheckingGuardian } = useIsGuardian(guardianTokenAddress, address);
    
    const { signTypedData, data: signature, isPending: isSigning, isSuccess: isSignSuccess } = useSignTypedData();

    useEffect(() => {
        // Fetch all withdrawal requests and show only ones user is a guardian for
        if (!address) {
            console.log('[VotingView] Missing address');
            setStatus('loading');
            return;
        }

        const fetchPendingRequests = async () => {
            try {
                console.log('[VotingView] Starting fetch for user address:', address);
                
                // Fetch ALL pending requests (not filtered by vault) from the database
                const res = await fetch('/api/guardian-signatures', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                    console.error('[VotingView] Failed to fetch pending requests:', errorData);
                    setStatus('empty');
                    return;
                }

                const allRequests = await res.json();
                console.log('[VotingView] Received', allRequests.length, 'total requests');
                
                // Filter to only show requests where user's address is in the guardians array
                const pending = allRequests.filter((req: any) => {
                    // Only show pending requests (awaiting-signature or pending-approval)
                    const validStatuses = ['awaiting-signature', 'pending-approval'];
                    if (!validStatuses.includes(req.status)) {
                        console.log('[VotingView] Filtering out request with status:', req.status);
                        return false;
                    }
                    
                    // Verify the user's wallet address is in the guardians list for this request
                    // Handle both array and encrypted string formats
                    let guardians: string[] = [];
                    if (Array.isArray(req.guardians)) {
                        guardians = req.guardians;
                    } else if (typeof req.guardians === 'string') {
                        try {
                            guardians = JSON.parse(req.guardians);
                        } catch (e) {
                            guardians = [];
                        }
                    }
                    
                    console.log('[VotingView] Request guardians:', guardians, 'User address:', address);
                    
                    const isAddressInGuardians = guardians.some((g: any) => {
                        const normalizedG = typeof g === 'string' ? g : g?.address || '';
                        return normalizedG.toLowerCase() === address?.toLowerCase();
                    });
                    
                    if (!isAddressInGuardians) {
                        console.log('[VotingView] User not in guardians list for request', req.id);
                        return false;
                    }
                    
                    // Handle both array and encrypted string formats for signatures
                    let signatures: any[] = [];
                    if (Array.isArray(req.signatures)) {
                        signatures = req.signatures;
                    } else if (typeof req.signatures === 'string') {
                        try {
                            signatures = JSON.parse(req.signatures);
                        } catch (e) {
                            signatures = [];
                        }
                    }
                    
                    // Filter out already signed requests by this guardian
                    const alreadySigned = signatures.some((sig: any) => sig.signer === address && sig.role === 'guardian');
                    if (alreadySigned) {
                        console.log('[VotingView] Guardian already signed request', req.id);
                        return false;
                    }
                    
                    console.log('[VotingView] Including request', req.id, 'for user to sign');
                    return true;
                });
                
                console.log('[VotingView] Pending requests after filtering:', pending.length);
                
                if (pending.length > 0) {
                    setPendingRequests(pending);
                    setStatus('pending');
                } else {
                    setStatus('empty');
                }
            } catch (error) {
                console.error('Error loading withdrawal requests:', error);
                setStatus('empty');
            }
        };

        fetchPendingRequests();
    }, [address]);

    // Get the selected request or the first one
    const selectedRequest = selectedRequestId 
        ? pendingRequests.find(r => r.id === selectedRequestId)
        : pendingRequests.length > 0 ? pendingRequests[0] : null;

    useEffect(() => {
        if (isSignSuccess && signature && pendingRequests.length > 0 && selectedRequest) {
            // Save guardian signature to database
            const saveGuardianSignature = async () => {
                try {
                    const currentRequest = selectedRequest;
                    console.log('[VotingView] Saving signature for request:', currentRequest.id);
                    
                    // Verify address matches guardian list before saving
                    const guardians = currentRequest.guardians || [];
                    console.log('[VotingView] Request guardians:', guardians, 'User address:', address);
                    const isAddressInGuardians = guardians.some((g: string) => g.toLowerCase() === address?.toLowerCase());
                    
                    if (!isAddressInGuardians) {
                        console.error('Guardian address does not match database records');
                        alert('Your wallet address does not match the guardian records for this vault');
                        return;
                    }
                    
                    // Add guardian signature to existing signatures
                    let existingSignatures = currentRequest.signatures || [];
                    
                    // Parse existing signatures if they're a string
                    if (typeof existingSignatures === 'string') {
                        try {
                            existingSignatures = JSON.parse(existingSignatures);
                        } catch (e) {
                            existingSignatures = [];
                        }
                    }
                    
                    // Ensure it's an array
                    if (!Array.isArray(existingSignatures)) {
                        existingSignatures = [];
                    }
                    
                    const newSignature = {
                        signer: address,
                        signature: signature?.toString?.() || String(signature),
                        signedAt: Date.now(),
                        role: 'guardian'
                    };
                    
                    const updatedSignatures = [
                        ...existingSignatures,
                        newSignature
                    ];
                    
                    console.log('[VotingView] Saving signatures:', JSON.stringify(updatedSignatures, null, 2));
                    
                    // Update the request in the database
                    const updateRes = await fetch(`/api/guardian-signatures/${currentRequest.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            signatures: updatedSignatures,
                        }),
                    });
                    
                    if (!updateRes.ok) {
                        const errorData = await updateRes.json().catch(() => ({ error: 'Unknown error' }));
                        console.error('Failed to save guardian signature:', errorData);
                        alert(`Failed to save your signature: ${errorData.error || 'Unknown error'}`);
                        return;
                    }
                    
                    console.log('Signature saved successfully');
                    
                    // Refetch the specific request to show updated signatures
                    setTimeout(async () => {
                        try {
                            const specificRes = await fetch(`/api/guardian-signatures/${currentRequest.id}`, {
                                method: 'GET',
                                headers: { 'Content-Type': 'application/json' },
                            });
                            
                            if (specificRes.ok) {
                                const updatedRequest = await specificRes.json();
                                // Temporarily update selectedRequest to show the new signature count
                                // This will show the updated progress bar
                                const requestCopy = { ...updatedRequest };
                                // Keep the selected request visible to show updated signature count
                                setPendingRequests(prev => 
                                    prev.map(r => r.id === currentRequest.id ? requestCopy : r)
                                );
                            }
                        } catch (error) {
                            console.error('Error refetching specific request:', error);
                        }
                    }, 100);
                    
                    setStatus('signed');
                    
                } catch (error) {
                    console.error('Error saving signature:', error);
                    alert(`Error saving your signature: ${error instanceof Error ? error.message : String(error)}`);
                }
            };
            
            saveGuardianSignature();
        }
    }, [isSignSuccess, signature, selectedRequest, address, pendingRequests]);

    const handleSign = async (request: any) => {
        if (!vaultAddress || !chainId || !address) return;

        console.log('[VotingView] handleSign called for request:', request.id);
        
        // Verify that the user's address matches a guardian in the database
        const guardians = request.guardians || [];
        console.log('[VotingView] Checking if', address, 'is in guardians:', guardians);
        
        const isAddressInGuardians = guardians.some((g: string) => g.toLowerCase() === address.toLowerCase());
        
        if (!isAddressInGuardians) {
            alert('Your wallet address does not match the guardian records for this request. Only the designated guardians can sign this withdrawal.');
            return;
        }

        console.log('[VotingView] Guardian verified, proceeding with signing');
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
                    token: request.request?.token || request.token as Address,
                    amount: BigInt(request.request?.amount || request.amount), // Convert string back to BigInt
                    recipient: request.request?.recipient || request.recipient as Address,
                    nonce: BigInt(request.request?.nonce || request.nonce), // Convert string back to BigInt
                    reason: request.request?.reason || request.reason,
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
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-10 md:p-14 flex flex-col items-center shadow-card overflow-hidden group">
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                        <div className="relative z-10 w-24 h-24 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-surface-border shadow-lg group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition-all duration-500">
                            <Shield size={44} className="text-emerald-500" />
                        </div>
                        <div className="absolute top-1 right-1 w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border border-gray-300 dark:border-surface-border">
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
                        onClick={async () => {
                            // Refetch pending requests from database
                            try {
                                const res = await fetch('/api/guardian-signatures', {
                                    method: 'GET',
                                    headers: { 'Content-Type': 'application/json' },
                                });

                                if (res.ok) {
                                    const allRequests = await res.json();
                                    const pending = allRequests.filter((req: any) => {
                                        const validStatuses = ['awaiting-signature', 'pending-approval'];
                                        if (!validStatuses.includes(req.status)) {
                                            return false;
                                        }
                                        
                                        let guardians: string[] = [];
                                        if (Array.isArray(req.guardians)) {
                                            guardians = req.guardians;
                                        } else if (typeof req.guardians === 'string') {
                                            try {
                                                guardians = JSON.parse(req.guardians);
                                            } catch (e) {
                                                guardians = [];
                                            }
                                        }
                                        
                                        const isAddressInGuardians = guardians.some((g: any) => {
                                            const normalizedG = typeof g === 'string' ? g : g?.address || '';
                                            return normalizedG.toLowerCase() === address?.toLowerCase();
                                        });
                                        
                                        if (!isAddressInGuardians) {
                                            return false;
                                        }
                                        
                                        let signatures: any[] = [];
                                        if (Array.isArray(req.signatures)) {
                                            signatures = req.signatures;
                                        } else if (typeof req.signatures === 'string') {
                                            try {
                                                signatures = JSON.parse(req.signatures);
                                            } catch (e) {
                                                signatures = [];
                                            }
                                        }
                                        
                                        const alreadySigned = signatures.some((sig: any) => sig.signer === address && sig.role === 'guardian');
                                        return !alreadySigned;
                                    });
                                    
                                    if (pending.length > 0) {
                                        setPendingRequests(pending);
                                        setStatus('pending');
                                    } else {
                                        setStatus('empty');
                                    }
                                }
                            } catch (error) {
                                console.error('Error loading more requests:', error);
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

    // Render pending requests list and detail view
    if (status === 'pending' && pendingRequests.length > 0) {
        return (
            <div className="w-full space-y-6 px-4">
                {/* Withdrawals List */}
                <div className="w-full">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Pending Withdrawals ({pendingRequests.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingRequests.map((request: any, index: number) => (
                            <button
                                key={request.id}
                                onClick={() => setSelectedRequestId(request.id)}
                                className={`p-5 rounded-xl border-2 text-left transition-all duration-200 transform hover:scale-105 ${
                                    selectedRequest?.id === request.id
                                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                        : 'border-gray-200 dark:border-surface-border hover:border-primary/50 hover:shadow-md'
                                } bg-white dark:bg-surface-dark/80`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500 font-mono">ID: {request.id.slice(0, 16)}...</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                                            {formatEther(BigInt(request.request?.amount || 0))} ETH
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                                            {request.signatures?.length || 0}/{quorum?.toString() || '2'}
                                        </div>
                                        <div className="w-12 h-1.5 bg-gray-200 dark:bg-surface-border rounded-full overflow-hidden mt-1">
                                            <div 
                                                className="h-full bg-emerald-500"
                                                style={{ width: `${((request.signatures?.length || 0) / (Number(quorum) || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{request.request?.reason}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selected Withdrawal Detail */}
                {selectedRequest && (
            <div className="relative w-full">
                <div className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl overflow-hidden shadow-lg">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 p-8 border-b border-gray-100 dark:border-surface-border">
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Request ID</p>
                            <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all bg-white dark:bg-surface-dark/50 p-2 rounded-lg">{selectedRequest.id}</p>
                        </div>
                        <div className="flex flex-col items-center w-full text-center mb-6">
                            <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4 flex items-center justify-center text-white font-bold text-2xl">
                                {selectedRequest.createdBy ? selectedRequest.createdBy[2].toUpperCase() : 'V'}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Withdrawal Request</h3>
                            <p className="text-sm text-slate-500 font-mono">From {selectedRequest.createdBy?.slice(0, 6)}...{selectedRequest.createdBy?.slice(-4)}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark/50 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-surface-border/50">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Requesting</p>
                            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                {formatEther(BigInt(selectedRequest.request?.amount || 0))} <span className="text-base font-semibold text-slate-400">ETH</span>
                            </p>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-8 flex flex-col gap-6">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-slate-400 pt-0.5">format_quote</span>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reason</p>
                                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{selectedRequest.request?.reason}"</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-surface-border/20 dark:to-blue-500/5 p-6 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Consensus Status</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">
                                    {(selectedRequest.signatures?.length || 0)}/{quorum} Signed
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-200 dark:bg-surface-border rounded-full overflow-hidden shadow-inner">
                                <div 
                                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-300 shadow-sm"
                                    style={{ width: `${((selectedRequest.signatures?.length || 0) / (Number(quorum) || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3 bg-gray-50 dark:bg-surface-border/10 p-5 rounded-xl border border-gray-100 dark:border-surface-border/30">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Vault:</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400 text-xs bg-white dark:bg-surface-dark px-2 py-1 rounded">{vaultAddress?.slice(0, 10)}...{vaultAddress?.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Recipient:</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400 text-xs bg-white dark:bg-surface-dark px-2 py-1 rounded">{selectedRequest.request?.recipient?.slice(0, 10)}...{selectedRequest.request?.recipient?.slice(-8)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Nonce:</span>
                                <span className="font-mono text-slate-600 dark:text-slate-400 text-xs bg-white dark:bg-surface-dark px-2 py-1 rounded">{selectedRequest.request?.nonce}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Status:</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold text-xs bg-emerald-500/10 px-2 py-1 rounded">{selectedRequest.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-8 pt-0 flex gap-4">
                        <button 
                            onClick={handleReject}
                            disabled={isSigning}
                            className="flex-1 py-4 rounded-xl border-2 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                        >
                            <X size={20} />
                            Reject
                        </button>
                        <button
                            onClick={() => handleSign(selectedRequest)}
                            disabled={isSigning}
                            className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 text-white font-bold shadow-lg shadow-primary/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {isSigning ? (
                                <>
                                    <Spinner className="w-5 h-5" />
                                    Signing...
                                </>
                            ) : (
                                <>
                                    <Check size={20} />
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
                )}
            </div>
        );
    }

    // If no pending requests, show empty state
    return (
        <div className="relative w-full max-w-md">
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-10 md:p-14 flex flex-col items-center shadow-card overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full"></div>
                    <div className="relative z-10 w-24 h-24 bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center border border-gray-200 dark:border-surface-border shadow-lg group-hover:shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition-all duration-500">
                        <Shield size={44} className="text-emerald-500" />
                    </div>
                    <div className="absolute top-1 right-1 w-6 h-6 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center border border-gray-300 dark:border-surface-border">
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
