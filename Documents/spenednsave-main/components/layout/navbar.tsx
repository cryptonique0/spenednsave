"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // We need to create this utility
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield } from "lucide-react"; // Using Lucide for the logo icon for now, or SVG

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-surface-border bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3 group">
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

                    <div className="hidden md:flex items-center gap-1 p-1 bg-gray-100 dark:bg-surface-border rounded-full border border-gray-200 dark:border-gray-700/50">
                        {[
                            { name: "Dashboard", href: "/dashboard" },
                            { name: "Guardians", href: "/guardians" },
                            { name: "Activity", href: "/activity" },
                            { name: "Emergency", href: "/emergency" },
                        ].map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={cn(
                                        "px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
                                        isActive
                                            ? "text-slate-900 dark:text-white bg-white dark:bg-surface-dark shadow-sm font-semibold"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-4">
                        <ConnectButton
                            accountStatus={{
                                smallScreen: 'avatar',
                                largeScreen: 'full',
                            }}
                        />
                        <button className="md:hidden text-slate-900 dark:text-white p-2">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
