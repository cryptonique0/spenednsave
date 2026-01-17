"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function WithdrawalTrendsChart({ timeRange }: { timeRange: '7d' | '30d' | '90d' | '1y' | 'all' }) {
  const { address } = useAccount();
  const [data, setData] = useState<Array<{ date: string; withdrawals: number; amount: number }>>([]);
  const [stats, setStats] = useState({ total: 0, avgAmount: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`/api/activities?account=${address}`);
        const activities = await res.json();

        if (!Array.isArray(activities)) {
          setLoading(false);
          return;
        }

        // Group withdrawals by date
        const withdrawalsByDate = new Map<string, { count: number; total: number }>();
        let totalCount = 0;
        let totalAmount = 0;

        activities.forEach((activity: any) => {
          if (activity.type === 'withdrawal' && activity.amount) {
            const date = activity.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const amount = parseFloat(activity.amount);

            const existing = withdrawalsByDate.get(date) || { count: 0, total: 0 };
            withdrawalsByDate.set(date, {
              count: existing.count + 1,
              total: existing.total + amount,
            });

            totalCount++;
            totalAmount += amount;
          }
        });

        // Convert to chart data
        const chartData = Array.from(withdrawalsByDate.entries()).map(([date, data]) => ({
          date,
          withdrawals: data.count,
          amount: parseFloat(data.total.toFixed(2)),
        }));

        setData(chartData);
        setStats({
          total: totalCount,
          avgAmount: totalCount > 0 ? parseFloat((totalAmount / totalCount).toFixed(2)) : 0,
          totalAmount: parseFloat(totalAmount.toFixed(2)),
        });
      } catch (error) {
        console.error('Error fetching withdrawal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading withdrawal data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No withdrawal data available</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Withdrawal Trends</h3>
      <p className="text-sm text-muted-foreground mb-4">Number of withdrawals and amounts over time</p>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted-foreground)" />
          <YAxis yAxisId="left" stroke="var(--muted-foreground)" />
          <YAxis yAxisId="right" orientation="right" stroke="var(--primary)" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="withdrawals" fill="var(--primary)" name="Count" />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="amount" 
            stroke="var(--primary)" 
            name="ETH" 
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Withdrawals</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avg per Withdrawal</p>
          <p className="text-2xl font-bold">{stats.avgAmount} ETH</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Withdrawn</p>
          <p className="text-2xl font-bold">{stats.totalAmount} ETH</p>
        </div>
      </div>
    </div>
  );
}
