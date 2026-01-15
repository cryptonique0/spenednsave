"use client";

import { useEffect, useState } from "react";

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchContacts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/emergency-contacts");
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (err) {
      setError("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContacts();
  }, []);

  function getErrorMessage(err: unknown): string | undefined {
    if (typeof err === "string") return err;
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as Record<string, unknown>).message === "string"
    ) {
      return (err as Record<string, string>).message;
    }
    return undefined;
  }

  async function handleAdd() {
    setLoading(true);
    setError("");
    setSuccess("");
    // Prompt for private key (for demo; use wallet integration in production)
    const privateKey = prompt("Enter your owner private key to add contact:");
    if (!privateKey) return setError("Private key required");
    try {
      const res = await fetch("/api/emergency-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: newContact, privateKey }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess("Contact added!");
      setNewContact("");
      fetchContacts();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(address: string) {
    setLoading(true);
    setError("");
    setSuccess("");
    const privateKey = prompt("Enter your owner private key to remove contact:");
    if (!privateKey) return setError("Private key required");
    try {
      const res = await fetch(`/api/emergency-contacts/${address}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privateKey }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess("Contact removed!");
      fetchContacts();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to remove contact");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6 mt-8">
      <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        Emergency Contacts
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Trusted contacts to notify in emergencies.
      </p>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded-lg px-3 py-2 dark:bg-background-dark dark:text-white dark:border-border-dark"
          placeholder="0x..."
          value={newContact}
          onChange={(e) => setNewContact(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleAdd}
          className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={loading || !newContact}
        >
          Add
        </button>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {contacts.length === 0 && (
          <li className="py-2 text-slate-500">No contacts added.</li>
        )}
        {contacts.map((c) => (
          <li key={c} className="flex items-center justify-between py-2">
            <span className="font-mono text-slate-800 dark:text-slate-200">{c}</span>
            <button
              onClick={() => handleRemove(c)}
              className="text-red-500 hover:underline text-sm disabled:opacity-50"
              disabled={loading}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
