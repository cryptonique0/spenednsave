"use client";

import { useAccount } from "wagmi";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner"; // Assuming we have a spinner, or I'll make a simple one

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { status } = useAccount();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Allow public access to landing page
        if (pathname === "/") {
            setIsAuthorized(true);
            return;
        }

        // Check if authentication status is resolved
        if (status === "connecting" || status === "reconnecting") {
            return;
        }

        // If disconnected, redirect to landing
        if (status === "disconnected") {
            setIsAuthorized(false);
            router.push("/");
        } else {
            setIsAuthorized(true);
        }
    }, [pathname, status, router]);

    // Show loading or nothing while checking/redirecting (except for landing page)
    if (status === "connecting" || status === "reconnecting") {
        // Optional: Show a loading screen if desired, but for now just return nothing or a spinner
        // to prevent content flash.
        // However, if we are on landing page, we should show it immediately.
        if (pathname === "/") return <>{children}</>;

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-background-dark">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Attempting to access protected route while disconnected
    if (pathname !== "/" && status === "disconnected") {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}
