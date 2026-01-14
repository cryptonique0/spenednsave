import { useEffect, useState } from "react";

export function useScheduledWithdrawals() {
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScheduled() {
      setLoading(true);
      try {
        const res = await fetch("/api/scheduled-withdrawals");
        if (!res.ok) throw new Error("Failed to fetch scheduled withdrawals");
        const data = await res.json();
        setScheduled(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchScheduled();
  }, []);

  return { scheduled, loading, error };
}
