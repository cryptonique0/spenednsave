"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Copy, Share2, Info, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

import { useAccount, useSignTypedData, useChainId } from "wagmi";
import { parseEther, formatEther, type Address } from "viem";
import { useUserContracts, useVaultETHBalance, useVaultQuorum, useVaultNonce, useIsVaultOwner } from "@/lib/hooks/useContracts";

export function WithdrawalForm() {
    const [step, setStep] = useState<'form' | 'signing' | 'success'>('form');
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [withdrawalData, setWithdrawalData] = useState<any>(null);

    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { data: userContracts } = useUserContracts(address as any);
    const vaultAddress = userContracts ? (userContracts as any)[1] : undefined;
    const { data: vaultBalance } = useVaultETHBalance(vaultAddress);
    const { data: quorum } = useVaultQuorum(vaultAddress);
    const { data: currentNonce } = useVaultNonce(vaultAddress);
    const { data: isVaultOwner, isLoading: isCheckingOwnership } = useIsVaultOwner(vaultAddress, address);
    
    const { signTypedData, data: signature, isPending: isSigning, isSuccess: isSignSuccess } = useSignTypedData();

    // Calculate quorum value early for use in JSX
    const quorumValue = (quorum && typeof quorum === 'bigint') ? quorum.toString() : '2';

    // Handle successful signature
    useEffect(() => {
        if (isSignSuccess && signature && withdrawalData) {
            // Save withdrawal request to localStorage with owner's signature
            // In production, this would be saved to a backend or IPFS
            try {
                const requestId = `${vaultAddress}-${Date.now()}`;
                const requestData = {
                    id: requestId,
                    token: withdrawalData.token,
                    amount: withdrawalData.amount.toString(), // Convert BigInt to string
                    recipient: withdrawalData.recipient,
                    nonce: withdrawalData.nonce.toString(), // Convert BigInt to string
                    reason: withdrawalData.reason,
                    owner: address,
                    vaultAddress,
                    createdAt: Date.now(),
                    signatures: [
                        { signer: address, signature, timestamp: Date.now(), role: 'owner' }
                    ],
                    signaturesCount: 0 // Guardian signatures count
                };
                
                const existingRequests = localStorage.getItem(`withdrawal-requests-${vaultAddress}`);
                const requests = existingRequests ? JSON.parse(existingRequests) : [];
                requests.push(requestData);
                localStorage.setItem(`withdrawal-requests-${vaultAddress}`, JSON.stringify(requests));
            } catch (error) {
                console.error('Error saving withdrawal request:', error);
            }
            
            setStep('success');
        }
    }, [isSignSuccess, signature, withdrawalData, vaultAddress, address]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address || !vaultAddress) {
            alert("Please connect your wallet first");
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const amountInWei = parseEther(amount);
        
        // Check if user has sufficient balance
        if (vaultBalance && typeof vaultBalance === 'bigint' && amountInWei > vaultBalance) {
            alert("Insufficient vault balance");
            return;
        }

        // Prepare withdrawal data using the current nonce from the contract
        const withdrawalRequest = {
            token: '0x0000000000000000000000000000000000000000' as Address, // ETH
            amount: amountInWei,
            recipient: address,
            nonce: (typeof currentNonce === 'bigint' ? currentNonce : 0n), // Use contract nonce
            reason: reason || "Withdrawal request"
        };

        setWithdrawalData(withdrawalRequest);
        
        // Move to signing step to get owner's signature
        setStep('signing');
        
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
                    token: withdrawalRequest.token,
                    amount: withdrawalRequest.amount,
                    recipient: withdrawalRequest.recipient,
                    nonce: withdrawalRequest.nonce,
                    reason: withdrawalRequest.reason,
                },
            });
        } catch (error) {
            console.error("Signature failed", error);
            alert("Failed to sign withdrawal request");
            setStep('form');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const shareViaWhatsApp = () => {
        const text = `I need approval for a withdrawal request: ${window.location.origin}/voting`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareViaTelegram = () => {
        const text = `I need approval for a withdrawal request: ${window.location.origin}/voting`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/voting')}&text=${encodeURIComponent(text)}`, '_blank');
    };

    if (!isConnected) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Wallet Not Connected</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Please connect your wallet to create a withdrawal request
                    </p>
                </div>
            </div>
        );
    }

    if (!vaultAddress) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-slate-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Vault Found</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        You need to create a vault before making withdrawal requests
                    </p>
                    <Link href="/vault/setup" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold">
                        Create Vault
                    </Link>
                </div>
            </div>
        );
    }

    if (isCheckingOwnership) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
                    <Spinner className="w-8 h-8 text-primary mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Checking vault access...
                    </p>
                </div>
            </div>
        );
    }

    if (!isVaultOwner) {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Unauthorized Access</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Only the vault owner can create withdrawal requests. You are not the owner of this vault.
                    </p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (step === 'signing') {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-12 text-center">
                    <Spinner className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign Request</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Please sign the withdrawal request in your wallet to continue
                    </p>
                    <button 
                        onClick={() => setStep('form')} 
                        className="mt-6 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-8 text-center shadow-card animate-in fade-in zoom-in duration-300">
                    <div className="size-20 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mx-auto mb-6 shadow-glow">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Created</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Your withdrawal request for <strong className="text-slate-900 dark:text-white">{amount} ETH</strong> has been created. Share the link with your guardians to get approval.
                    </p>

                    <div className="bg-gray-50 dark:bg-surface-border/30 rounded-lg p-3 flex items-center gap-2 mb-6 border border-gray-200 dark:border-surface-border">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate flex-1">spendguard.app/vote/req-8a92...</span>
                        <button className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-surface-border text-slate-500 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            <Copy size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            WhatsApp
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            Telegram
                        </button>
                    </div>

                    <button onClick={() => setStep('form')} className="mt-6 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
                        Start Over
                    </button>
                </div>
            </div>
        )
    }

    const balanceETH = (vaultBalance && typeof vaultBalance === 'bigint') ? formatEther(vaultBalance) : "0";
    const formattedBalance = parseFloat(balanceETH).toFixed(4);

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-surface-border text-slate-500 dark:text-slate-400 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">New Withdrawal Request</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Initiate a withdrawal from your vault</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Asset Selection */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asset</label>
                        <span className="text-xs text-slate-500">Balance: <span className="text-slate-900 dark:text-white font-medium">{formattedBalance} ETH</span></span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-surface-border/30 rounded-lg border border-gray-200 dark:border-surface-border">
                        <div className="size-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            Ξ
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">ETH</p>
                            <p className="text-xs text-slate-500">Ethereum</p>
                        </div>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Amount (ETH)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.0001"
                            placeholder="0.0"
                            className="w-full bg-transparent text-4xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 outline-none"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setAmount("100")} className="px-3 py-1 bg-gray-100 dark:bg-surface-border rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-surface-border/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">$100</button>
                        <button type="button" onClick={() => setAmount("500")} className="px-3 py-1 bg-gray-100 dark:bg-surface-border rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-surface-border/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">$500</button>
                        <button type="button" onClick={() => setAmount("5420.50")} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary/20 transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">MAX</button>
                    </div>
                </div>

                {/* Reason */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-4 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason (Optional)</label>
                    <textarea
                        className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none resize-none min-h-[80px]"
                        placeholder="Why are you withdrawing? This helps guardians decide."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                        This withdrawal requires <strong>{quorumValue} guardian signatures</strong> to be approved and executed.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={!amount || isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    Create Withdrawal Request
                </button>
            </form>
        </div>
    );
}
