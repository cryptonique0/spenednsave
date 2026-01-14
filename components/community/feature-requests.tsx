"use client";

import { useState, useEffect } from "react";
function getErrorMessage(err: unknown): string | undefined {
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
    return (err as Record<string, string>).message;
  }
  return undefined;
}

interface FeatureRequest {
  id: number;
  title: string;
  description: string;
  votes: number;
  userVoted: boolean;
}

export default function CommunityFeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feature-requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      setError("Failed to load feature requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess("Feature request submitted!");
      setTitle("");
      setDescription("");
      fetchRequests();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(id: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      fetchRequests();
    } catch (err) {
      setError(getErrorMessage(err) || "Failed to vote");
    } finally {
      setLoading(false);
    }
  function getErrorMessage(err: unknown): string | undefined {
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as Record<string, unknown>).message === 'string') {
      return (err as Record<string, string>).message;
    }
    return undefined;
  }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">Community Feature Requests</h1>
      <p className="mb-6 text-slate-600 dark:text-slate-400">Suggest new features or vote for your favorites!</p>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}
      <form onSubmit={handleSubmit} className="mb-8 bg-white dark:bg-surface-dark border border-surface-border rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Suggest a Feature</h2>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 mb-3"
          placeholder="Feature title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          disabled={loading}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 mb-3"
          placeholder="Describe your idea..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg"
          disabled={loading || !title || !description}
        >
          Submit
        </button>
      </form>
      <div>
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Top Requests</h2>
        {loading && <div className="text-slate-500">Loading...</div>}
        <ul className="space-y-4">
          {requests.length === 0 && !loading && (
            <li className="text-slate-500">No feature requests yet.</li>
          )}
          {requests.map((req) => (
            <li key={req.id} className="bg-white dark:bg-surface-dark border border-surface-border rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{req.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">{req.description}</p>
                <span className="text-xs text-slate-400">Votes: {req.votes}</span>
              </div>
              <button
                onClick={() => handleVote(req.id)}
                className={`ml-4 px-4 py-2 rounded-lg font-bold ${req.userVoted ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                disabled={loading || req.userVoted}
              >
                {req.userVoted ? 'Voted' : 'Vote'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
