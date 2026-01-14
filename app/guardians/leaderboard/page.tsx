"use client";

import { useEffect, useState } from "react";
import { Award, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { AvatarBlockie } from '@/components/ui/avatar-blockie';

export default function GuardianLeaderboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guardian-leaderboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  // Filtering logic
  let filtered = data;
  if (search) {
    filtered = filtered.filter((g) => g.account.toLowerCase().includes(search.toLowerCase()));
  }
  if (filter === "fast") {
    filtered = filtered.filter((g) => g.avgResponseSeconds != null && g.avgResponseSeconds < 3600); // < 1 hour
  } else if (filter === "veteran") {
    filtered = filtered.filter((g) => g.longevityDays >= 30);
  }

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        <Award className="text-amber-500" size={32} /> Guardian Badge Leaderboard
      </h1>
      <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
        Top guardians ranked by approvals, response speed, and longevity. Data updates automatically.
      </p>
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <input
          className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 w-full md:w-64"
          placeholder="Search by address..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 w-full md:w-48"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="fast">Fast Responders (&lt;1h avg)</option>
          <option value="veteran">Veterans (&ge;30d)</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-slate-200 dark:border-slate-700 rounded-xl">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800">
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Guardian</th>
              <th className="px-4 py-2 text-left">Approvals</th>
              <th className="px-4 py-2 text-left">Avg. Response</th>
              <th className="px-4 py-2 text-left">Longevity</th>
              <th className="px-4 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8">No guardian activity yet.</td></tr>
            ) : filtered.map((g, i) => (
              <>
                <tr key={g.account} className="border-t border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-2 font-bold text-lg">{i + 1}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <AvatarBlockie address={g.account} size={24} className="mr-1" />
                    <span className="font-mono">{g.account.slice(0, 6)}...{g.account.slice(-4)}</span>
                  </td>
                  <td className="px-4 py-2">{g.approvals}</td>
                  <td className="px-4 py-2 flex items-center gap-1">
                    <Zap className="text-emerald-500" size={16} />
                    {g.avgResponseSeconds != null ? `${Math.round(g.avgResponseSeconds / 60)} min` : '-'}
                  </td>
                  <td className="px-4 py-2 flex items-center gap-1">
                    <Clock className="text-blue-500" size={16} />
                    {g.longevityDays} days
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => setExpanded(expanded === g.account ? null : g.account)} className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      {expanded === g.account ? <ChevronUp size={18} /> : <ChevronDown size={18} />} Details
                    </button>
                  </td>
                </tr>
                {expanded === g.account && (
                  <tr className="bg-slate-50 dark:bg-slate-900/40">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <div><span className="font-semibold">First Approval:</span> {g.firstAction ? new Date(g.firstAction).toLocaleString() : '-'}</div>
                        <div><span className="font-semibold">Last Approval:</span> {g.lastAction ? new Date(g.lastAction).toLocaleString() : '-'}</div>
                        <div><span className="font-semibold">Address:</span> <span className="font-mono">{g.account}</span></div>
                        {/* Add more details here as needed */}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
