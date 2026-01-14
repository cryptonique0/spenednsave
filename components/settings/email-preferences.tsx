"use client";
import { useState } from "react";

export function EmailPreferences({ initialEmail = "", initialOptIn = false, onSave }: {
  initialEmail?: string;
  initialOptIn?: boolean;
  onSave?: (email: string, optIn: boolean) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    // TODO: Save email and opt-in status to backend (API call)
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      onSave?.(email, optIn);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  }

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg bg-white dark:bg-slate-900 shadow">
      <h2 className="text-lg font-bold mb-2">Email Notifications</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Get notified about important vault and guardian events. Your email is never shared.
      </p>
      <input
        type="email"
        className="w-full mb-2 px-3 py-2 border rounded"
        placeholder="you@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        disabled={saving}
      />
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          checked={optIn}
          onChange={e => setOptIn(e.target.checked)}
          disabled={saving}
        />
        <span>Enable email notifications</span>
      </label>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
        onClick={handleSave}
        disabled={saving || !email}
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
      {saved && <div className="mt-2 text-green-600">Preferences saved!</div>}
    </div>
  );
}
