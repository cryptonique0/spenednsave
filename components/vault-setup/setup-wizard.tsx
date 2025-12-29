"use client";

import { Step1Details } from "./steps/step-1-details";
import { Step2Guardians } from "./steps/step-2-guardians";
import { Step3Review } from "./steps/step-3-review";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useCreateVault, useUserContracts } from "@/lib/hooks/useContracts";

export function SetupWizard() {
    const { address } = useAccount();
    const { createVault, isPending, isConfirming, isSuccess, error, hash } = useCreateVault();
    const { data: userContracts, refetch } = useUserContracts(address as any);

    const [step, setStep] = useState(1);
    const [isDeployed, setIsDeployed] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [deployedVaultAddress, setDeployedVaultAddress] = useState<string | null>(null);
    const [deployedGuardianTokenAddress, setDeployedGuardianTokenAddress] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        threshold: 2,
        totalGuardians: 3,
        guardians: [] as any[],
    });

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const updateGuardians = (data: { guardians: any[] }) => {
        setFormData(prev => ({
            ...prev,
            guardians: data.guardians,
            // Update totalGuardians to match added count if > 0, else default
            totalGuardians: data.guardians.length > 0 ? data.guardians.length : 3
        }));
    }

    const handleDeploy = async () => {
        if (!address) return;
        setStep(4); // show deployment progress
        try {
            // Use factory to create a vault with the chosen threshold (quorum)
            await createVault(formData.threshold);
        } catch (e) {
            // Stay on progress view but you could surface error
            console.error(e);
        }
    };

    // After tx success, refetch user contracts and show success
    useEffect(() => {
        async function fetchContracts() {
            if (isSuccess && address) {
                // Wait a moment for indexing, then refetch
                await new Promise(resolve => setTimeout(resolve, 1000));
                const result = await refetch();
                if (result.data && Array.isArray(result.data)) {
                    const [guardianToken, vault] = result.data as any;
                    setDeployedGuardianTokenAddress(guardianToken as string);
                    setDeployedVaultAddress(vault as string);
                    setIsDeployed(true);
                    setShowSuccess(true);
                }
            }
        }
        fetchContracts();
    }, [isSuccess, address, refetch]);

    if (showSuccess) {
        return <SuccessView vaultName={formData.name} vaultAddress={deployedVaultAddress} />;
    }

    if (step === 4) {
        return <DeploymentProgressView />;
    }

    return (
        <div className="w-full max-w-2xl flex flex-col gap-8">
            {/* Progress Indicator */}
            <div className="w-full px-4">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-border-dark -z-10"></div>

                    <StepIndicator step={1} currentStep={step} label="Vault" />
                    <StepIndicator step={2} currentStep={step} label="Guardians" />
                    <StepIndicator step={3} currentStep={step} label="Review" />
                </div>
            </div>

            {/* Step Content */}
            <div className="rounded-2xl bg-surface-dark border border-surface-border shadow-2xl relative overflow-hidden transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary opacity-80"></div>

                {step === 1 && (
                    <Step1Details
                        data={formData}
                        onUpdate={(data) => setFormData(prev => ({ ...prev, ...data }))}
                        onNext={handleNext}
                    />
                )}
                {step === 2 && (
                    <Step2Guardians
                        data={formData}
                        onUpdate={updateGuardians}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}
                {step === 3 && (
                    <Step3Review
                        data={formData}
                        onBack={handleBack}
                        onDeploy={handleDeploy}
                    />
                )}
            </div>

            <div className="flex justify-center items-center gap-2 text-slate-500 opacity-60">
                <span className="material-symbols-outlined text-sm">lock</span>
                <p className="text-xs font-medium">Secured by Base Blockchain</p>
            </div>
        </div>
    );
}

function StepIndicator({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;

    return (
        <div className={`flex flex-col items-center gap-2 bg-background-dark px-2 z-10 ${step > currentStep ? 'opacity-50' : ''}`}>
            <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ring-4 ring-background-dark transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-glow' :
                isCompleted ? 'bg-primary text-white' :
                    'bg-surface-dark border border-surface-border text-slate-500'
                }`}>
                {isCompleted ? <span className="material-symbols-outlined text-sm">check</span> : step}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wider ${isActive || isCompleted ? 'text-white' : 'text-slate-500'}`}>
                {label}
            </span>
        </div>
    )
}

function DeploymentProgressView() {
    return (
        <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 py-12 text-center">
            <div className="relative size-24 mb-4">
                <div className="absolute inset-0 border-4 border-surface-border rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-4xl">rocket_launch</span>
                </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Deploying Fortress...</h2>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
                <p className="flex items-center gap-2 justify-center"><span className="text-emerald-500">✓</span> Validating Configuration</p>
                <p className="flex items-center gap-2 justify-center animate-pulse"><Spinner className="w-3 h-3" /> Deploying Smart Contract to Base</p>
                <p className="opacity-50">Verifying Contract</p>
            </div>
        </div>
    )
}

function SuccessView({ vaultName, vaultAddress }: { vaultName: string; vaultAddress?: string | null }) {
    const [copied, setCopied] = useState(false);

    const copyAddress = () => {
        if (vaultAddress) {
            navigator.clipboard.writeText(vaultAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (addr: string) => {
        if (!addr || addr === "0x0000000000000000000000000000000000000000") return "Loading...";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto py-8 px-4 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            <div className="size-24 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Vault Ready!</h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto mb-8">
                <strong className="text-white">{vaultName || "Your vault"}</strong> has been successfully deployed and secured on Base.
            </p>

            <div className="bg-surface-dark border border-surface-border rounded-2xl p-6 w-full max-w-md mb-8">
                <div className="flex items-center gap-4 mb-4">
                    <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div className="text-left flex-1">
                        <p className="text-sm text-slate-500 font-medium">Vault Address</p>
                        <p className="text-white font-mono text-sm" title={vaultAddress || ""}>
                            {vaultAddress ? formatAddress(vaultAddress) : "Loading..."}
                        </p>
                    </div>
                    <button 
                        onClick={copyAddress}
                        className="ml-auto text-slate-400 hover:text-white transition-colors"
                        disabled={!vaultAddress || vaultAddress === "0x0000000000000000000000000000000000000000"}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {copied ? "check" : "content_copy"}
                        </span>
                    </button>
                </div>
                <p className="text-xs text-slate-500 border-t border-surface-border pt-4 mt-4">
                    Your guardians have been notified.
                </p>
            </div>

            <div className="flex gap-4">
                <Link href="/dashboard" className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    )
}
