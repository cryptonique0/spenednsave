"use client";

import Link from "next/link";
import { ArrowRight, Plus, Shield, Lock, Users } from "lucide-react"; // Using Lucide

export function DashboardEmptyState() {
    return (
        <div className="w-full flex flex-col gap-8">
            <section className="@container">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-3xl p-8 sm:p-12 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center relative z-10">
                        {/* Hero Image / Illustration area (simplified for code) */}
                        <div className="w-full lg:w-1/2 aspect-[4/3] lg:aspect-auto h-64 sm:h-80 lg:h-[400px] relative flex items-center justify-center select-none">
                            <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-primary/10 dark:to-indigo-900/10 rounded-full blur-2xl animate-pulse"></div>
                            <div className="relative z-10 w-48 h-56 sm:w-64 sm:h-72 bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-[#0f1219] rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl shadow-blue-900/10 flex flex-col items-center justify-center gap-6 animate-float">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-50 to-white dark:from-[#1e2330] dark:to-[#252a39] shadow-inner flex items-center justify-center border border-white dark:border-white/5">
                                    <Lock className="text-4xl text-primary/80 dark:text-primary" />
                                </div>
                                <div className="w-full px-6 flex flex-col gap-2">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-surface-border rounded-full overflow-hidden">
                                        <div className="h-full w-1/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    </div>
                                    <div className="h-2 w-2/3 bg-slate-100 dark:bg-surface-border rounded-full"></div>
                                </div>
                                <div className="mt-2 px-3 py-1 bg-slate-100 dark:bg-black/30 rounded-full border border-slate-200 dark:border-white/5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vault Empty</p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-1/2 flex flex-col gap-8 text-center lg:text-left">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-primary/10 border border-blue-100 dark:border-primary/20 self-center lg:self-start mx-auto lg:mx-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">Ready to Secure</span>
                                </div>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                                    Personal <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Fortress.</span>
                                </h1>
                                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                                    Your digital vault is ready. Experience social accountability on the Base blockchain. Deposit funds and assign Guardians to secure your savings.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Link href="/vault/setup" className="group relative flex items-center justify-center gap-3 h-14 px-8 rounded-full bg-gradient-to-r from-primary to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold transition-all shadow-glow hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                                    <span className="text-lg">Setup Vault</span>
                                </Link>
                                <button className="flex items-center justify-center gap-2 h-14 px-8 rounded-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border hover:bg-gray-50 dark:hover:bg-surface-border/80 text-slate-700 dark:text-slate-200 font-semibold transition-all hover:border-gray-300 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                    <span>How it works</span>
                                </button>
                            </div>

                            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 opacity-80">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Lock className="w-4 h-4" />
                                    <span>Non-custodial</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Users className="w-4 h-4" />
                                    <span>Social Recovery</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Placeholders */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Saved", value: "$0.00", icon: Shield, color: "blue" },
                    { label: "Guardians Active", value: "0", icon: Users, color: "indigo" },
                    { label: "Current Streak", value: "0", icon: Users, color: "orange" }
                ].map((stat, i) => (
                    <div key={i} className="flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border shadow-card hover:shadow-lg transition-all duration-300 group min-h-[160px]">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-surface-border text-slate-500 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-slate-300 dark:text-slate-600 tracking-tight">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
