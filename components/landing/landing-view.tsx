"use client";

import Link from "next/link";
import { Shield, PlayCircle, ArrowRight, Wallet, Check, Lock, Users, Activity } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LandingView() {
    const { isConnected } = useAccount();
    const router = useRouter();

    useEffect(() => {
        if (isConnected) {
            router.push("/dashboard");
        }
    }, [isConnected, router]);

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-white overflow-x-hidden">
            {/* Header */}
            <header className="fixed top-0 z-50 w-full bg-white/80 dark:bg-[#020617]/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/5">
                <div className="w-full px-6 lg:px-12 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                            <Shield size={24} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">SpendGuard</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <nav className="flex items-center gap-8">
                            <Link className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="#features">Features</Link>
                            <Link className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="#governance">Governance</Link>
                            <Link className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" href="#security">Security</Link>
                        </nav>
                        <ConnectButton.Custom>
                            {({ openConnectModal, mounted }) => (
                                <button
                                    onClick={openConnectModal}
                                    disabled={!mounted}
                                    className="relative group overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                >
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#3b82f6_50%,#E2E8F0_100%)]"></span>
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-slate-950 px-6 py-2.5 text-sm font-semibold text-slate-900 dark:text-white backdrop-blur-3xl transition-all group-hover:bg-blue-50 dark:group-hover:bg-slate-900">
                                        Launch App
                                    </span>
                                </button>
                            )}
                        </ConnectButton.Custom>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-20">
                {/* Hero Section */}
                <section className="relative w-full py-20 lg:py-32 px-6 lg:px-12 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
                        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
                        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen"></div>
                    </div>

                    <div className="w-full relative z-10">
                        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                            <div className="flex flex-col gap-8 max-w-2xl">
                                <div className="inline-flex items-center gap-2 self-start rounded-full border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                    </span>
                                    Live on Base Mainnet
                                </div>
                                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Social locks for <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">better savings.</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-lg">
                                    Stop impulse buys. Lock your assets in a smart vault that only unlocks with approval from your trusted friends.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                    <ConnectButton.Custom>
                                        {({ openConnectModal, mounted }) => (
                                            <button
                                                onClick={openConnectModal}
                                                disabled={!mounted}
                                                className="group relative flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
                                            >
                                                <Wallet size={20} />
                                                Connect Wallet
                                            </button>
                                        )}
                                    </ConnectButton.Custom>
                                    <button className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-medium transition-all hover:-translate-y-0.5 backdrop-blur-sm">
                                        <PlayCircle size={20} />
                                        How it works
                                    </button>
                                </div>
                                <div className="flex items-center gap-6 pt-4">
                                    <div className="flex -space-x-3">
                                        <div className="size-10 rounded-full border-2 border-white dark:border-[#020617] bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">A</div>
                                        <div className="size-10 rounded-full border-2 border-white dark:border-[#020617] bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">B</div>
                                        <div className="size-10 rounded-full border-2 border-white dark:border-[#020617] bg-slate-400 flex items-center justify-center text-xs font-bold text-slate-600">C</div>
                                        <div className="size-10 rounded-full border-2 border-white dark:border-[#020617] bg-slate-800 flex items-center justify-center text-xs font-bold text-white">+2k</div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">$4.2M+ Secured</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-500">Trusted by the community</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hero Graphic */}
                            <div className="relative w-full aspect-square lg:aspect-[5/4] select-none pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                                    <div className="relative z-20 flex flex-col items-center justify-center w-40 h-48 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl shadow-blue-900/20 animate-float">
                                        <div className="size-16 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg mb-4 text-white">
                                            <Lock size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Status</div>
                                            <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                                LOCKED
                                            </div>
                                        </div>
                                    </div>

                                    {/* Orbiting Elements */}
                                    <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 animate-float-delayed">
                                        <div className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg">
                                            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Users size={18} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Guardian</span>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Alice.eth</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-[20%] left-[10%] z-20 animate-float">
                                        <div className="flex items-center gap-3 p-2 pr-4 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg">
                                            <div className="size-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <Activity size={18} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">Guardian</span>
                                                <span className="text-xs font-bold text-slate-900 dark:text-white">Bob_Base</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-16 sm:py-20 md:py-24 bg-slate-50 dark:bg-[#060c1f]">
                    <div className="w-full px-4 sm:px-6 lg:px-12">
                        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Bank-grade security. <br /><span className="text-slate-500 dark:text-slate-400">Friend-grade trust.</span>
                            </h2>
                            <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">
                                Three simple steps to secure your financial future through social accountability and blockchain transparency.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all hover:shadow-xl dark:hover:shadow-blue-900/10 group min-h-[220px]">
                                <div className="flex items-center justify-center size-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Wallet size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Deposit Assets</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Move funds into your personal smart vault. You retain ownership, but the "unlock" function is decentralized.
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all hover:shadow-xl dark:hover:shadow-blue-900/10 group">
                                <div className="flex items-center justify-center size-14 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Assign Guardians</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Select trusted friends or family members to hold the keys. They act as your friction layer against impulse.
                                </p>
                            </div>
                            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all hover:shadow-xl dark:hover:shadow-blue-900/10 group">
                                <div className="flex items-center justify-center size-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Check size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Unlock Together</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                    Need to withdraw? Submit a request. Funds are released only when your guardians approve the transaction.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Governance Section (anchor target for nav) */}
                <section id="governance" className="py-20 bg-white dark:bg-[#040617] border-t border-slate-100 dark:border-white/5">
                    <div className="w-full px-6 lg:px-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Governance</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Community-driven features and protocol governance ensure SpendGuard evolves securely and transparently.</p>
                        </div>
                    </div>
                </section>

                {/* Security Section (anchor target for nav) */}
                <section id="security" className="py-20 bg-slate-50 dark:bg-[#020617] border-t border-slate-100 dark:border-white/5">
                    <div className="w-full px-6 lg:px-12">
                        <div className="max-w-3xl mx-auto text-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Security</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Smart contracts audited, encrypted signature storage, and guardrails designed to protect user funds. Review our security docs for details.</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-white dark:bg-[#020617] border-t border-slate-200 dark:border-white/5 pt-16 pb-8">
                <div className="w-full px-6 lg:px-12">
                    <div className="flex justify-between items-center py-8">
                        <div className="flex items-center gap-2">
                            <Shield size={20} className="text-blue-600" />
                            <span className="font-bold">SpendGuard</span>
                        </div>
                        <p className="text-sm text-slate-500">© 2024 SpendGuard Protocol.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
