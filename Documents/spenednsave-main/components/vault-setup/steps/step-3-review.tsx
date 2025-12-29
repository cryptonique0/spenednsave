"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

interface Step3Props {
    data: {
        name: string;
        threshold: number;
        totalGuardians: number;
        guardians: any[];
    };
    onBack: () => void;
    onDeploy: () => Promise<void>;
}

export function Step3Review({ data, onBack, onDeploy }: Step3Props) {
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = async () => {
        setIsDeploying(true);
        await onDeploy();
        // setIsDeploying(false); // No need to unset if we navigate/change view
    };

    return (
        <div className="p-8 sm:p-10 flex flex-col gap-10">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Review Configuration</h1>
                <p className="text-slate-400 text-lg font-light leading-relaxed">Confirm your vault settings before deploying to Base.</p>
            </div>

            <div className="flex flex-col gap-6">

                {/* Summary Card */}
                <div className="bg-surface-dark border border-surface-border rounded-2xl overflow-hidden divide-y divide-surface-border">
                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Vault Name</p>
                            <p className="text-white font-semibold text-lg">{data.name || "Untitled Vault"}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-600">account_balance_wallet</span>
                    </div>

                    <div className="p-6 flex justify-between items-center">
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Security Policy</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-white font-semibold">{data.threshold} of {data.totalGuardians} signatures required</span>
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded uppercase">{Math.round((data.threshold / data.totalGuardians) * 100)}% Consensus</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-600">verified_user</span>
                    </div>

                    <div className="p-6">
                        <p className="text-sm text-slate-500 font-medium mb-4">Guardians ({data.guardians?.length || 0})</p>
                        <div className="flex flex-col gap-3">
                            {data.guardians?.map((g) => (
                                <div key={g.id} className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-surface-border flex items-center justify-center text-slate-400">
                                        <span className="material-symbols-outlined text-sm">person</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-white font-medium">{g.name}</p>
                                        <p className="text-slate-500 font-mono text-xs">{g.address}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Social Accountability Reiteration */}
                <div className="flex gap-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 items-start">
                    <div className="p-2 bg-orange-500/20 rounded-lg shrink-0 text-orange-500">
                        <span className="material-symbols-outlined text-xl">warning</span>
                    </div>
                    <div>
                        <h4 className="text-orange-500 text-sm font-semibold">Important</h4>
                        <p className="text-orange-200/80 text-sm mt-1 leading-relaxed">
                            Once deployed, you cannot change the Guardians without their approval. Make sure you trust them.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-border/50 mt-4">
                    <button onClick={onBack} disabled={isDeploying} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium disabled:opacity-50">
                        Back
                    </button>
                    <button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-70 disabled:cursor-not-allowed text-white text-base font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center gap-2 group w-full sm:w-auto justify-center"
                    >
                        {isDeploying ? (
                            <>
                                <Spinner className="w-5 h-5 text-white" />
                                Deploying...
                            </>
                        ) : (
                            <>
                                Confirm & Deploy
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">rocket_launch</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
