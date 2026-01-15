"use client";

import { useScheduledWithdrawals } from "@/lib/hooks/useScheduledWithdrawals";
import { CheckCircle, Clock, Users, Shield } from "lucide-react";
import toast from "react-hot-toast";


export function ScheduledWithdrawalsList({ onExecute }: { onExecute?: (id: number) => Promise<void> }) {
  const { scheduled, loading, error } = useScheduledWithdrawals();

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-500"><Clock size={18} /> Loading scheduled withdrawals...</div>
  );
  if (error) return <div className="text-red-500">{error}</div>;
  if (!scheduled.length) return (
    <div className="flex flex-col items-center gap-2 text-slate-400">
      <Shield size={32} />
      No scheduled withdrawals.
    </div>
  );

  const handleExecute = async (id: number) => {
    toast.promise(
      (async () => {
        if (onExecute) await onExecute(id);
      })(),
      {
        loading: 'Executing withdrawal...',
        success: 'Withdrawal executed!',
        error: (err) => err?.message || 'Failed to execute withdrawal',
      }
    );
  };

  return (
    <div className="space-y-4">
      {scheduled.map((w) => (
        <div key={w.id} className={`bg-white dark:bg-surface-dark border border-surface-border rounded-xl p-4 flex items-center justify-between shadow-sm ${w.executed ? 'opacity-60' : ''}`}>
          <div>
            <div className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              {w.executed ? <CheckCircle className="text-emerald-500" size={20} /> : <Clock className="text-blue-500" size={20} />}
              {w.amount} ETH
            </div>
            <div className="text-xs text-slate-500">Scheduled for: {w.scheduledFor ? new Date(w.scheduledFor * 1000).toLocaleString() : "-"}</div>
            <div className="text-xs text-slate-500">Approvals: {(w.approvals || []).length} / {typeof w.requiredSignatures === 'number' ? w.requiredSignatures : (Array.isArray(w.requiredSignatures) ? w.requiredSignatures.length : '?')}</div>
            <div className="text-xs text-slate-500">Executed: {w.executed ? "Yes" : "No"}</div>
          </div>
          {!w.executed && onExecute && (
            <button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-xl flex items-center gap-2 shadow-md"
              onClick={() => handleExecute(w.id)}
              disabled={Date.now() / 1000 < w.scheduledFor || (w.approvals || []).length < (typeof w.requiredSignatures === 'number' ? w.requiredSignatures : (Array.isArray(w.requiredSignatures) ? w.requiredSignatures.length : 1))}
            >
              <CheckCircle size={18} /> Execute
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
