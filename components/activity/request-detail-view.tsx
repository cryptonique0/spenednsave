"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, CalendarX, Lock, Send, Check, Clock, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAccount } from "wagmi";
import { useUserContracts, useVaultQuorum, useExecuteWithdrawal } from "@/lib/hooks/useContracts";
import { useSimulation } from "@/components/simulation/SimulationContext";
import { formatEther, type Address } from "viem";
import { Spinner } from "@/components/ui/spinner";

export function RequestDetailView() {
    const params = useParams();
    const requestId = params?.id as string;
    
    const [request, setRequest] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [guardians, setGuardians] = useState<any[]>([]);
    
    const { address } = useAccount();
    const { data: userContracts } = useUserContracts(address as any);
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const { executeWithdrawal, isPending, isConfirming, isSuccess, error } = useExecuteWithdrawal(vaultAddress);
    
    useEffect(() => {
        if (!vaultAddress || !requestId) {
            setIsLoading(false);
            return;
        }
        
        // Load request from localStorage
        try {
            const storedRequests = localStorage.getItem(`withdrawal-requests-${vaultAddress}`);
            if (storedRequests) {
                const requests = JSON.parse(storedRequests);
                const foundRequest = requests.find((req: any) => req.id === requestId);
                
                if (foundRequest) {
                    setRequest(foundRequest);
                    
                    // Mock guardian data - in production, fetch from contract
                    const guardianSignatures = (foundRequest.signatures || []).filter((s: any) => s.role === 'guardian');
                    setGuardians([
                        { 
                            address: foundRequest.owner,
                            name: `${foundRequest.owner.slice(0, 6)}...${foundRequest.owner.slice(-4)}`,
                            status: 'Owner',
                            time: new Date(foundRequest.createdAt).toLocaleString()
                        },
                        ...guardianSignatures.map((sig: any) => ({
                            address: sig.signer,
                            name: `${sig.signer.slice(0, 6)}...${sig.signer.slice(-4)}`,
                            status: 'Signed',
                            time: new Date(sig.timestamp).toLocaleString()
                        }))
                    ]);
                }
            }
        } catch (error) {
            console.error('Error loading request:', error);
        }
        
        setIsLoading(false);
    }, [vaultAddress, requestId]);
    
    const { enabled: simulationEnabled } = useSimulation();
    const handleExecute = async () => {
        if (!request) return;
        if (simulationEnabled) {
            alert('Simulation mode: No onchain transaction sent. This is a demo.');
            return;
        }
        try {
            // Get all signatures (including owner)
            const allSignatures = request.signatures.map((sig: any) => sig.signature);
            executeWithdrawal(
                request.token as Address,
                BigInt(request.amount),
                request.recipient as Address,
                request.reason,
                allSignatures
            );
        } catch (error) {
            console.error('Error executing withdrawal:', error);
            alert('Failed to execute withdrawal: ' + (error as any).message);
        }
    };
    
    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10 flex justify-center items-center min-h-[400px]">
                <Spinner className="w-12 h-12 text-primary" />
            </div>
        );
    }
    
    if (!request) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-12 text-center">
                    <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Request Not Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        The withdrawal request you're looking for doesn't exist or has been removed.
                    </p>
                    <Link href="/activity" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold">
                        <ArrowLeft size={16} />
                        Back to Activity
                    </Link>
                </div>
            </div>
        );
    }
    
    const guardianSignatures = (request.signatures || []).filter((s: any) => s.role === 'guardian');
    const signaturesCollected = guardianSignatures.length;
    const requiredQuorum = quorum ? Number(quorum) : 2;
    const canExecute = signaturesCollected >= requiredQuorum;
    const amountETH = parseFloat(formatEther(BigInt(request.amount))).toFixed(4);
    
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
                        <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
                            canExecute
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                                : isSuccess
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20"
                        )}>
                            {isSuccess ? (
                                <>
                                    <Check size={12} />
                                    Executed
                                </>
                            ) : canExecute ? (
                                <>
                                    <Check size={12} />
                                    Ready to Execute
                                </>
                            ) : (
                                <>
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                    </span>
                                    Awaiting Signatures
                                </>
                            )}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-sm font-mono">Ref: #{request.id.slice(-8)}</span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{request.reason || 'Withdrawal Request'}</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-base mt-2">
                        Submitted on {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                    </p>
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
                                    <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">{amountETH}</span>
                                    <span className="text-xl font-semibold text-slate-500 dark:text-slate-400">ETH</span>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100 dark:bg-slate-700/50 w-full"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <Wallet size={20} />
                                        <span className="text-sm font-medium">Recipient</span>
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-mono text-sm">
                                        {request.recipient.slice(0, 6)}...{request.recipient.slice(-4)}
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                                        <Info size={20} />
                                        <span className="text-sm font-medium">Nonce</span>
                                    </div>
                                    <p className="text-slate-900 dark:text-white font-semibold">{request.nonce}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 md:p-8 border-t border-gray-200 dark:border-surface-border">
                            <div className="flex flex-col gap-4">
                                {isSuccess ? (
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                                        <Check size={24} className="text-emerald-600 dark:text-emerald-500" />
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                                            Withdrawal executed successfully!
                                        </p>
                                    </div>
                                ) : canExecute && address?.toLowerCase() === request.owner.toLowerCase() ? (
                                    <button 
                                        onClick={handleExecute}
                                        disabled={isPending || isConfirming}
                                        className="group relative w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isPending || isConfirming ? (
                                            <>
                                                <Spinner className="w-5 h-5" />
                                                <span className="z-10 tracking-wide">{isPending ? 'Confirming...' : 'Executing...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={24} />
                                                <span className="z-10 tracking-wide">Execute Withdrawal</span>
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <button className="group relative w-full h-14 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500" disabled>
                                        <Lock size={24} className="group-disabled:opacity-70" />
                                        <span className="z-10 tracking-wide">
                                            {canExecute ? 'Only owner can execute' : 'Execute Withdrawal'}
                                        </span>
                                    </button>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        {canExecute ? (
                                            <>
                                                <Check size={16} className="text-emerald-500" />
                                                Quorum reached! Ready to execute
                                            </>
                                        ) : (
                                            <>
                                                <Info size={16} className="text-amber-500" />
                                                Requires {requiredQuorum - signaturesCollected} more signature{requiredQuorum - signaturesCollected !== 1 ? 's' : ''} to unlock
                                            </>
                                        )}
                                    </span>
                                </div>
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                                        <p className="text-sm text-red-700 dark:text-red-300">
                                            Error: {(error as any).message || 'Failed to execute withdrawal'}
                                        </p>
                                    </div>
                                )}
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
                                    <circle 
                                        className="text-primary transition-all duration-1000 ease-out -rotate-90 origin-center" 
                                        cx="100" 
                                        cy="100" 
                                        fill="none" 
                                        r="85" 
                                        stroke="currentColor" 
                                        strokeDasharray={`${(signaturesCollected / requiredQuorum) * 534} 534`}
                                        strokeLinecap="round" 
                                        strokeWidth="12"
                                    ></circle>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {signaturesCollected}
                                        <span className="text-slate-300 dark:text-slate-600 text-3xl font-bold">/{requiredQuorum}</span>
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">Guardian Sigs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide opacity-70">Signatures</h3>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{request.signatures.length} Total</span>
                        </div>

                        {/* Signature List */}
                        {request.signatures.map((sig: any, i: number) => (
                            <div key={i} className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border hover:border-primary/30 dark:hover:border-primary/30 shadow-sm transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="size-11 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-lg text-slate-500 dark:text-slate-300">
                                            {sig.signer.slice(2, 3).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-surface-dark rounded-full p-0.5">
                                            <div className="bg-green-500 text-white rounded-full p-0.5">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-slate-900 dark:text-white font-bold text-sm font-mono">
                                            {sig.signer.slice(0, 6)}...{sig.signer.slice(-4)}
                                        </p>
                                        <span className={cn(
                                            "inline-flex text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded w-fit mt-0.5",
                                            sig.role === 'owner' 
                                                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                                                : "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10"
                                        )}>
                                            {sig.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 font-medium">
                                        {new Date(sig.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
