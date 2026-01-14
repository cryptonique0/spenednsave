"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Lock, Unlock, RefreshCw, Timer, Info, Bell, ShieldOff } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserContracts } from "@/lib/hooks/useContracts";
import {
    useRequestEmergencyUnlock,
    useCancelEmergencyUnlock,
    useExecuteEmergencyUnlock,
    useEmergencyUnlockTimeRemaining,
    useUnlockRequestTime,
    useVaultETHBalance,
} from "@/lib/hooks/useContracts";
import { useEmergencyUnlockState } from "@/lib/hooks/useVaultData";
import { formatEther, type Address } from "viem";
import { useSimulation } from "@/components/simulation/SimulationContext";

export function EmergencyView() {
    const { address } = useAccount();
    const { data: contracts } = useUserContracts(address);
    const vaultAddress = contracts?.[1] as Address | undefined;

    // Fetch emergency unlock state
    const { data: unlockRequestTime } = useUnlockRequestTime(vaultAddress);
    const { data: timeRemaining } = useEmergencyUnlockTimeRemaining(vaultAddress);
    const { data: ethBalance } = useVaultETHBalance(vaultAddress);

    // Hooks for emergency actions
    const { requestUnlock, isPending: isRequesting, isConfirming: isConfirmingRequest, isSuccess: isRequestSuccess } = useRequestEmergencyUnlock(vaultAddress);
    const { cancelUnlock, isPending: isCanceling, isConfirming: isConfirmingCancel, isSuccess: isCancelSuccess } = useCancelEmergencyUnlock(vaultAddress);
    const { executeUnlock, isPending: isExecuting, isConfirming: isConfirmingExecute, isSuccess: isExecuteSuccess } = useExecuteEmergencyUnlock(vaultAddress);

    // Get computed state
    const { isActive, canExecute, timeLeft } = useEmergencyUnlockState(unlockRequestTime as bigint | undefined, timeRemaining as bigint | undefined);

    const { enabled: simulationEnabled } = useSimulation();
    const handleStartTimer = () => {
        if (simulationEnabled) {
            alert('Simulation mode: No onchain transaction sent. This is a demo.');
            return;
        }
        requestUnlock();
    };

    const handleStopTimer = () => {
        if (simulationEnabled) {
            alert('Simulation mode: No onchain transaction sent. This is a demo.');
            return;
        }
        cancelUnlock();
    };

    const handleWithdraw = () => {
        if (simulationEnabled) {
            alert('Simulation mode: No onchain transaction sent. This is a demo.');
            return;
        }
        // Execute emergency unlock for ETH (address(0))
        executeUnlock("0x0000000000000000000000000000000000000000" as Address);
    };

    const isLoading = isRequesting || isConfirmingRequest || isCanceling || isConfirmingCancel || isExecuting || isConfirmingExecute;

    return (
        <div className="w-full flex justify-center py-10 px-6">
            <div className="w-full max-w-5xl flex flex-col gap-10">

                {/* Success/Info Messages */}
                {isRequestSuccess && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-4">
                        <p className="text-red-800 dark:text-red-300 font-medium">
                            Emergency unlock initiated! The 30-day countdown has started.
                        </p>
                    </div>
                )}
                {isCancelSuccess && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 p-4">
                        <p className="text-green-800 dark:text-green-300 font-medium">
                            Emergency unlock canceled. Your vault is now protected by guardians again.
                        </p>
                    </div>
                )}
                {isExecuteSuccess && (
                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 p-4">
                        <p className="text-green-800 dark:text-green-300 font-medium">
                            Emergency withdrawal complete! All funds have been transferred to your wallet.
                        </p>
                    </div>
                )}

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-red-500/10 p-2 rounded-lg">
                                <ShieldOff className="text-red-600 dark:text-red-500" size={32} />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Emergency Withdrawal</h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Manage your Rage Quit Protocol settings</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-500 text-xs font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Danger Zone
                    </div>
                </div>

                {/* Info Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark border border-red-200 dark:border-red-900/30 shadow-sm">
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-red-500"></div>
                    <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-start gap-4">
                                <Info className="text-red-500 mt-1 shrink-0" />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Protocol Conditions</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                        Initiating an Emergency Unlock will <span className="text-red-600 dark:text-red-400 font-bold">bypass all Guardian votes</span>.
                                        To prevent social engineering attacks, this action requires a mandatory <span className="text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-sm mx-1">30-day waiting period</span>.
                                        Your funds remain locked until the timer expires.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 shrink-0 md:w-64">
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2.5 rounded bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <Bell className="text-red-500" size={18} />
                                <span>Guardians notified instantly</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 p-2.5 rounded bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                <Lock className="text-red-500" size={18} />
                                <span>Funds frozen during timer</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Timer Section */}
                {isActive && timeLeft && (
                    <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute -top-3 left-6 z-20">
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wider">
                                Current Status: Active
                            </span>
                        </div>
                        <div className="relative bg-white dark:bg-[#1f0a0a] rounded-3xl overflow-hidden border border-red-500 shadow-glow-red transition-transform duration-500">
                            {/* Hazard stripe background pattern would go here via CSS, replaced with simple opacity layer for now */}
                            <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>

                            <div className="relative z-10 p-8 md:p-12 flex flex-col items-center justify-center text-center">
                                <div className="mb-8">
                                    <div className="inline-flex items-center justify-center size-20 rounded-full bg-red-500/10 mb-6 relative">
                                        <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-20"></div>
                                        <Timer className="text-red-600 dark:text-red-500" size={40} />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Unlocking in Progress</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-lg mx-auto">
                                        The emergency protocol has been triggered. Funds will become available when the timer reaches zero.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl mb-10">
                                    {[
                                        { val: timeLeft.d, label: 'Days' },
                                        { val: timeLeft.h, label: 'Hours' },
                                        { val: timeLeft.m, label: 'Minutes' },
                                        { val: timeLeft.s, label: 'Seconds' }
                                    ].map((t, i) => (
                                        <div key={i} className="flex flex-col gap-2">
                                            <div className="bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-red-500/30 rounded-xl h-24 md:h-32 flex items-center justify-center shadow-inner relative overflow-hidden">
                                                <span className={`font-mono text-4xl md:text-6xl font-bold z-10 ${i === 3 ? 'text-red-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                                                    {String(t.val).padStart(2, '0')}
                                                </span>
                                                <div className="absolute bottom-0 w-full h-1 bg-red-500/20"></div>
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">{t.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleStopTimer}
                                    disabled={isLoading}
                                    className="group relative overflow-hidden rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-4 transition-all hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className={`text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300 ${isLoading ? 'animate-spin' : 'group-hover:-rotate-180'}`} size={20} />
                                        <span className="font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                                            {isLoading ? 'Processing...' : 'Stop Timer & Restore Protection'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* Action Cards */}
                {!isActive && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Start Card */}
                        <div className="flex flex-col h-full opacity-80 hover:opacity-100 transition-opacity">
                            <div className="mb-2">
                                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    State: Inactive
                                </span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-2xl p-8 flex flex-col justify-between items-center text-center shadow-sm">
                                <div className="mb-8">
                                    <div className="size-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                        <Lock size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Protected by Guardians</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        Your funds are currently secured. Initiating this process will alert all assigned Guardians.
                                    </p>
                                </div>
                                <button
                                    onClick={handleStartTimer}
                                    disabled={isLoading}
                                    className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
                                    <div className="relative px-6 py-4 flex items-center justify-center gap-3">
                                        <Timer size={20} />
                                        <span className="font-bold tracking-wide">
                                            {isLoading ? 'Processing...' : 'Start 30-Day Timer'}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Withdraw Card (Simulated complete state) */}
                        <div className={`flex flex-col h-full transition-all duration-500 ${canExecute ? 'opacity-100' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                            <div className="mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${canExecute ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                    State: {canExecute ? 'Unlocked' : 'Locked'}
                                </span>
                            </div>
                            <div className="flex-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-2xl p-8 flex flex-col justify-between items-center text-center shadow-sm">
                                <div className="mb-8">
                                    <div className={`size-12 rounded-full flex items-center justify-center mx-auto mb-4 ${canExecute ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                        <Unlock size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                        {canExecute ? 'Ready to Withdraw' : 'Wait Period Complete'}
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {canExecute 
                                            ? `Vault balance: ${ethBalance && typeof ethBalance === 'bigint' ? formatEther(ethBalance) : '0'} ETH. Click below to withdraw all funds.`
                                            : 'Once the 30-day security hold expires, your funds will unlock for transfer.'
                                        }
                                    </p>
                                </div>
                                <button 
                                    disabled={!canExecute || isLoading} 
                                    onClick={handleWithdraw}
                                    className={`w-full rounded-xl px-6 py-4 font-bold transition-all ${
                                        canExecute && !isLoading
                                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02]'
                                            : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                    }`}
                                >
                                    {isLoading ? 'Processing...' : canExecute ? 'Withdraw All Funds Now' : 'Withdraw All Funds Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
