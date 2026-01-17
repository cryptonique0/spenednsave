"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
import { formatUnits, parseUnits, type Address } from "viem";
import { useDepositETH, useDepositUSDC, useApproveUSDC, useUSDCAllowance, useVaultETHBalance, useVaultUSDCBalance } from "@/lib/hooks/useContracts";
import { getContractAddresses } from "@/lib/contracts";
import { AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { useChainId } from "wagmi";

interface TokenDepositFormProps {
    vaultAddress?: Address;
    onDepositSuccess?: () => void;
}

export function TokenDepositForm({ vaultAddress, onDepositSuccess }: TokenDepositFormProps) {
    const { address: userAddress, chain } = useAccount();
    const chainId = useChainId();
    const [selectedToken, setSelectedToken] = useState<"ETH" | "USDC">("ETH");
    const [depositAmount, setDepositAmount] = useState("");
    const [requiresApproval, setRequiresApproval] = useState(false);
    const [approvalStatus, setApprovalStatus] = useState<"idle" | "pending" | "approved">("idle");

    // Get USDC address from contract config
    const usdcAddress = useMemo(() => {
        if (!chain) return undefined;
        try {
            const addresses = getContractAddresses(chainId) as Record<string, Address>;
            return addresses.USDC as Address;
        } catch {
            return undefined;
        }
    }, [chain, chainId]);

    // ETH Deposit Hook
    const { deposit: depositETH, isPending: ethDepositPending, isSuccess: ethDepositSuccess } = useDepositETH(vaultAddress);

    // USDC Hooks
    const { approve, isPending: approvePending, isSuccess: approveSuccess } = useApproveUSDC(usdcAddress, vaultAddress);
    const { deposit: depositUSDC, isPending: usdcDepositPending, isSuccess: usdcDepositSuccess } = useDepositUSDC(usdcAddress, vaultAddress);

    // Balance Hooks
    const { data: vaultETHBalance } = useVaultETHBalance(vaultAddress);
    const { data: vaultUSDCBalance } = useVaultUSDCBalance(usdcAddress, vaultAddress);
    const { data: allowance } = useUSDCAllowance(usdcAddress, userAddress, vaultAddress);

    // Check if approval is needed using useMemo to avoid setState in effect
    const approvalNeeded = useMemo(() => {
        if (selectedToken === "USDC" && depositAmount && allowance !== undefined) {
            const amountInWei = parseUnits(depositAmount, 6);
            return BigInt(allowance.toString()) < amountInWei;
        }
        return false;
    }, [selectedToken, depositAmount, allowance]);

    useEffect(() => {
        setRequiresApproval(approvalNeeded);
    }, [approvalNeeded]);

    // Handle approval success
    useEffect(() => {
        if (approveSuccess) {
            setApprovalStatus("approved");
        }
    }, [approveSuccess]);

    // Handle deposit success
    useEffect(() => {
        if (ethDepositSuccess || usdcDepositSuccess) {
            // Use microtask to avoid cascade
            queueMicrotask(() => {
                setDepositAmount("");
                setApprovalStatus("idle");
                onDepositSuccess?.();
            });
        }
    }, [ethDepositSuccess, usdcDepositSuccess, onDepositSuccess]);

    const handleApprove = () => {
        if (!depositAmount) return;
        const amountInWei = parseUnits(depositAmount, 6);
        approve(amountInWei);
    };

    const handleDeposit = () => {
        if (!depositAmount || !vaultAddress) return;

        if (selectedToken === "ETH") {
            depositETH(depositAmount);
        } else {
            depositUSDC(depositAmount);
        }
    };

    const isLoading = selectedToken === "ETH" ? ethDepositPending : usdcDepositPending || approvePending;
    const formattedVaultETHBalance = vaultETHBalance ? formatUnits(vaultETHBalance as bigint, 18) : "0";
    const formattedVaultUSDCBalance = vaultUSDCBalance ? formatUnits(vaultUSDCBalance as bigint, 6) : "0";

    return (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Deposit Funds</h3>

            {/* Token Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Select Token
                </label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setSelectedToken("ETH")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedToken === "ETH"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                        ETH
                    </button>
                    <button
                        onClick={() => setSelectedToken("USDC")}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedToken === "USDC"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                    >
                        USDC
                    </button>
                </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Amount ({selectedToken})
                </label>
                <div className="relative">
                    <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={`Enter amount in ${selectedToken}`}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => setDepositAmount("0.1")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                        Max
                    </button>
                </div>
            </div>

            {/* Vault Balance Display */}
            <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Vault Balance:</strong> {selectedToken === "ETH" ? formattedVaultETHBalance : formattedVaultUSDCBalance}{" "}
                    {selectedToken}
                </p>
            </div>

            {/* Approval Status */}
            {selectedToken === "USDC" && requiresApproval && (
                <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            You need to approve USDC spending first.
                        </p>
                        {approvalStatus === "approved" && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Approval confirmed!
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Approval Button */}
            {selectedToken === "USDC" && requiresApproval && approvalStatus !== "approved" && (
                <button
                    onClick={handleApprove}
                    disabled={!depositAmount || approvePending || isLoading}
                    className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
                >
                    {approvePending ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Approving...
                        </>
                    ) : (
                        "Approve USDC"
                    )}
                </button>
            )}

            {/* Deposit Button */}
            <button
                onClick={handleDeposit}
                disabled={!depositAmount || isLoading || (selectedToken === "USDC" && requiresApproval && approvalStatus !== "approved")}
                className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {selectedToken === "ETH" ? "Depositing ETH..." : "Depositing USDC..."}
                    </>
                ) : (
                    `Deposit ${selectedToken}`
                )}
            </button>

            {/* Success Message */}
            {(ethDepositSuccess || usdcDepositSuccess) && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                        Deposit successful! Your {selectedToken} has been added to the vault.
                    </p>
                </div>
            )}
        </div>
    );
}
