"use client";

import { useAccount } from "wagmi";
import { useHasVault, useUserContracts } from "@/lib/hooks/useContracts";
import { DashboardEmptyState } from "./empty-state";
import { DashboardSaverView } from "./saver-view";
import { DashboardGuardianView } from "./guardian-view";
import { Spinner } from "@/components/ui/spinner";

interface DashboardContentProps {
    forcedView?: string;
}

export function DashboardContent({ forcedView }: DashboardContentProps) {
    const { address, isConnected } = useAccount();
    const { data: hasVault, isLoading: isCheckingVault } = useHasVault(address as any);
    const { data: userContracts } = useUserContracts(address as any);

    // If not connected, show empty state
    if (!isConnected) {
        return <DashboardEmptyState />;
    }

    // Loading state
    if (isCheckingVault) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner className="w-8 h-8 text-primary" />
                    <p className="text-slate-400">Loading your vault...</p>
                </div>
            </div>
        );
    }

    // Dev mode: force a specific view
    if (forcedView === 'saver') {
        return <DashboardSaverView />;
    }
    if (forcedView === 'guardian') {
        return <DashboardGuardianView />;
    }
    if (forcedView === 'empty') {
        return <DashboardEmptyState />;
    }

    // If user has a vault, show saver view
    if (hasVault && userContracts) {
        return <DashboardSaverView />;
    }

    // No vault - show empty state with setup option
    return <DashboardEmptyState />;
}
