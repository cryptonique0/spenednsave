"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSimulation } from "../simulation/SimulationContext";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield, X, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useLanguage } from "@/lib/i18n/i18n-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import type { Language } from "@/lib/i18n/languages";

export function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { language, setLanguage, languages } = useLanguage();
    const { t } = useI18n();
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = useSimulation();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-surface-border bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl" aria-label="Main Navigation">
            {/* DEBUG: Navbar is rendering */}
            <div className="w-full px-6 md:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md transition-shadow" aria-label="Go to homepage">
                            <div className="flex items-center justify-center size-8 text-primary group-hover:scale-105 transition-transform">
                                <svg
                                    className="w-full h-full drop-shadow-sm"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z"
                                        fill="currentColor"
                                    ></path>
                                    <path
                                        clipRule="evenodd"
                                        d="M29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z"
                                        fill="currentColor"
                                        fillOpacity="0.5"
                                        fillRule="evenodd"
                                    ></path>
                                </svg>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                SpendGuard
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-1 p-1 bg-surface-light dark:bg-surface-border rounded-full border border-surface-border dark:border-gray-700/50 shadow-sm" role="menubar" aria-label="Primary">
                        {[
                            { labelKey: "nav.dashboard", fallback: "Dashboard", href: "/dashboard" },
                            { labelKey: "common.analytics", fallback: "Analytics", href: "/analytics" },
                            { labelKey: "nav.guardians", fallback: "Guardians", href: "/guardians" },
                            { labelKey: "nav.activity", fallback: "Activity", href: "/activity" },
                            { labelKey: "common.voting", fallback: "Voting", href: "/voting" },
                            { labelKey: "common.emergency", fallback: "Emergency", href: "/emergency" },
                            { labelKey: "nav.updates", fallback: "Updates", href: "/updates" },
                            { labelKey: "common.referrals", fallback: "Referrals", href: "/referral-program" },
                            { labelKey: "blog.title", fallback: "Blog", href: "/blog" },
                        ].map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                        isActive
                                            ? "text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow font-semibold"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    )}
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    <span className="sr-only">{isActive ? "Current page: " : "Go to "}</span>{t(link.labelKey, link.fallback)}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value as Language)}
                          className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 transition-colors text-sm"
                          aria-label="Language selection"
                        >
                          {Object.entries(languages || {}).map(([code, info]) => (
                            <option key={code} value={code} className="bg-slate-900 text-white">
                              {info.flag} {info.nativeName}
                            </option>
                          ))}
                        </select>
                        <ConnectButton
                            accountStatus={{
                                smallScreen: 'avatar',
                                largeScreen: 'full',
                            }}
                            aria-label="Connect wallet"
                        />
                        <ThemeToggle />
                        <button className="md:hidden text-slate-900 dark:text-white p-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-shadow" aria-label="Open menu" tabIndex={0}>
                            <span className="material-symbols-outlined" aria-hidden="true">menu</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-surface-border" role="menu" aria-label="Mobile Navigation">
                        <div className="flex flex-col gap-2">
                            {[
                                { labelKey: "nav.dashboard", fallback: "Dashboard", href: "/dashboard" },
                                { labelKey: "nav.guardians", fallback: "Guardians", href: "/guardians" },
                                { labelKey: "common.voting", fallback: "Voting", href: "/voting" },
                                { labelKey: "nav.activity", fallback: "Activity", href: "/activity" },
                                { labelKey: "common.emergency", fallback: "Emergency", href: "/emergency" },
                                { labelKey: "common.featureRequests", fallback: "Feature Requests", href: "/feature-requests" },
                            ].map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={cn(
                                            "px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                                            isActive
                                                ? "text-slate-900 dark:text-white bg-gray-100 dark:bg-surface-dark font-semibold"
                                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-surface-dark/50"
                                        )}
                                        tabIndex={0}
                                        role="menuitem"
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <span className="sr-only">{isActive ? "Current page: " : "Go to "}</span>{t(link.labelKey, link.fallback)}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
