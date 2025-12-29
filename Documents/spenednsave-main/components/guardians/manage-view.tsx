"use client";

import { useState } from "react";
import { Users, ShieldCheck, Clock, Plus, Trash2, Key, History } from "lucide-react";

interface Guardian {
    id: string;
    name: string;
    address: string;
    status: 'active' | 'pending';
    lastActive?: string;
    txCount?: number;
    isHardware?: boolean;
}

export function ManageGuardiansView() {
    const [guardians, setGuardians] = useState<Guardian[]>([
        { id: "1", name: "alice.base.eth", address: "0x4F...3B19", status: "active", lastActive: "2 days ago", txCount: 12 },
        { id: "2", name: "bob.lens", address: "0x3A...B789", status: "active", lastActive: "5 days ago", txCount: 8 },
        { id: "3", name: "charlie_savings", address: "0x99...12D4", status: "active", lastActive: "1 week ago", txCount: 3, isHardware: true },
    ]);

    const [isAdding, setIsAdding] = useState(false);
    const [newGuardian, setNewGuardian] = useState({ name: "", address: "" });

    const handleAdd = () => {
        if (!newGuardian.address) return;
        const g: Guardian = {
            id: Math.random().toString(),
            name: newGuardian.name || "Guardian",
            address: newGuardian.address,
            status: "pending",
            txCount: 0
        };
        setGuardians([...guardians, g]);
        setNewGuardian({ name: "", address: "" });
        setIsAdding(false);
    };

    const handleRevoke = (id: string) => {
        if (confirm("Are you sure you want to revoke this guardian?")) {
            setGuardians(guardians.filter(g => g.id !== id));
        }
    };

    return (
        <div className="w-full flex flex-col gap-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Guardians</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your trusted circle and approval thresholds.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    Add New Guardian
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-blue-50 dark:bg-primary/10 rounded-xl text-primary">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{guardians.length}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Active Keys</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-500">
                            <ShieldCheck size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Policy</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">2 <span className="text-lg text-slate-400 dark:text-slate-500">of {guardians.length}</span></h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Signatures Required</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-500">
                            <Clock size={24} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Queue</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">0</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending Requests</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Guardians List */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Guardians</h2>

                    {isAdding && (
                        <div className="bg-white dark:bg-surface-dark border border-primary/50 dark:border-primary/50 rounded-2xl p-6 shadow-glow animate-in fade-in slide-in-from-top-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Add New Guardian</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Address / ENS</label>
                                    <input
                                        type="text"
                                        placeholder="0x... or name.eth"
                                        className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={newGuardian.address}
                                        onChange={(e) => setNewGuardian({ ...newGuardian, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Label (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Ledger"
                                        className="w-full bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                        value={newGuardian.name}
                                        onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium">Cancel</button>
                                <button onClick={handleAdd} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold">Add Guardian</button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        {guardians.map((g) => (
                            <div key={g.id} className="group bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-full bg-slate-100 dark:bg-surface-border flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {g.isHardware ? <Key size={20} /> : <Users size={20} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">{g.name}</h3>
                                            {g.status === 'active' && <span className="size-2 rounded-full bg-emerald-500"></span>}
                                            {g.isHardware && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-surface-border text-slate-500 uppercase">Hardware</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                            {g.address}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 justify-end"><History size={12} /> Signed {g.txCount} txs</p>
                                        <p className="text-xs text-slate-400">Last active {g.lastActive || "Never"}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(g.id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-semibold"
                                    >
                                        <Trash2 size={16} />
                                        <span className="sm:hidden">Revoke</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* Threshold Card */}
                    <div className="bg-gradient-to-br from-surface-dark to-surface-darker border border-surface-border rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-primary" />
                            Quorum Configuration
                        </h3>
                        <div className="bg-black/20 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-400">Current Threshold</span>
                                <span className="text-white font-bold">2/3</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                            Changing the threshold requires approval from existing guardians.
                        </p>
                        <button className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-colors">
                            Modify Policy
                        </button>
                    </div>

                    {/* Recent Events */}
                    <div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-4">Recent Events</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3">
                                    <div className="relative">
                                        <div className="size-2 rounded-full bg-slate-300 dark:bg-slate-600 mt-2"></div>
                                        {i !== 3 && <div className="absolute top-4 left-1 w-px h-full bg-slate-200 dark:bg-slate-800 -ml-px"></div>}
                                    </div>
                                    <div className="pb-4">
                                        <p className="text-sm text-slate-900 dark:text-white font-medium">Guardian Added</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Alice added Bob as guardian</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
