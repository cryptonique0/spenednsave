"use client";

import { useState } from "react";

interface Guardian {
    id: string;
    address: string;
    name: string;
}

interface Step2Props {
    data: {
        guardians: Guardian[];
        threshold: number;
    };
    onUpdate: (data: { guardians: Guardian[] }) => void;
    onNext: () => void;
    onBack: () => void;
}

export function Step2Guardians({ data, onUpdate, onNext, onBack }: Step2Props) {
    const [newGuardian, setNewGuardian] = useState({ address: "", name: "" });

    const addGuardian = () => {
        if (!newGuardian.address) return;
        const guardian: Guardian = {
            id: Math.random().toString(36).substr(2, 9),
            address: newGuardian.address,
            name: newGuardian.name || "Guardian",
        };
        onUpdate({ guardians: [...(data.guardians || []), guardian] });
        setNewGuardian({ address: "", name: "" });
    };

    const removeGuardian = (id: string) => {
        onUpdate({ guardians: data.guardians.filter(g => g.id !== id) });
    };

    return (
        <div className="p-8 sm:p-10 flex flex-col gap-10">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">Assemble your Guardians</h1>
                <p className="text-slate-400 text-lg font-light leading-relaxed">Add trusted friends or devices to protect your vault.</p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Add Guardian Input */}
                <div className="bg-background-dark/30 rounded-2xl p-6 border border-surface-border">
                    <h3 className="text-white font-semibold mb-4">Add New Guardian</h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <input
                                type="text"
                                placeholder="ENS or 0x Address"
                                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                value={newGuardian.address}
                                onChange={(e) => setNewGuardian({ ...newGuardian, address: e.target.value })}
                            />
                        </div>
                        <div className="sm:w-1/3 space-y-2">
                            <input
                                type="text"
                                placeholder="Label (e.g. Alice)"
                                className="w-full bg-background-dark border border-border-dark rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                value={newGuardian.name}
                                onChange={(e) => setNewGuardian({ ...newGuardian, name: e.target.value })}
                            />
                        </div>
                        <button
                            onClick={addGuardian}
                            className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Guardians List */}
                <div className="space-y-3">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Current Guardians ({data.guardians?.length || 0})</h3>

                    {(!data.guardians || data.guardians.length === 0) && (
                        <div className="text-center py-8 text-slate-500 border border-dashed border-border-dark rounded-xl">
                            No guardians added yet.
                        </div>
                    )}

                    {data.guardians?.map((guardian) => (
                        <div key={guardian.id} className="flex items-center justify-between p-4 bg-background-dark/50 border border-surface-border rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">person</span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">{guardian.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{guardian.address}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeGuardian(guardian.id)}
                                className="text-slate-500 hover:text-red-500 transition-colors p-2"
                            >
                                <span className="material-symbols-outlined">delete</span>
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-surface-border/50 mt-4">
                    <button onClick={onBack} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={!data.guardians || data.guardians.length < 1}
                        className="bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center gap-2 group"
                    >
                        Review Configuration
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
