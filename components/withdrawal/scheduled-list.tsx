"use client";

import { useScheduledWithdrawals } from "@/lib/hooks/useScheduledWithdrawals";
import { CheckCircle } from "lucide-react";

export function ScheduledWithdrawalsList({ onExecute }: { onExecute?: (id: number) => void }) {
  const { scheduled, loading, error } = useScheduledWithdrawals();

  if (loading) return <div>Loading scheduled withdrawals...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!scheduled.length) return <div>No scheduled withdrawals.</div>;

  return (
    <div className="space-y-4">
      {scheduled.map((w) => (
        <div key={w.id} className="bg-white dark:bg-surface-dark border border-surface-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-white">{w.amount} ETH</div>
            <div className="text-xs text-slate-500">Scheduled for: {w.scheduledFor ? new Date(w.scheduledFor * 1000).toLocaleString() : "-"}</div>
            <div className="text-xs text-slate-500">Approvals: {(w.approvals || []).length}</div>
            <div className="text-xs text-slate-500">Executed: {w.executed ? "Yes" : "No"}</div>
          </div>
          {!w.executed && onExecute && (
            <button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2"
              onClick={() => onExecute(w.id)}
              disabled={Date.now() / 1000 < w.scheduledFor || (w.approvals || []).length < w.requiredSignatures}
            >
              <CheckCircle size={18} /> Execute
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
