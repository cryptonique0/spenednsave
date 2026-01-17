"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

const generateWithdrawalData = (timeRange: '7d' | '30d' | '90d' | '1y' | 'all') => {
  const baseData = [
    { date: 'Jan 1', withdrawals: 2, amount: 5.2 },
    { date: 'Jan 5', withdrawals: 3, amount: 8.4 },
    { date: 'Jan 10', withdrawals: 2, amount: 3.1 },
    { date: 'Jan 15', withdrawals: 4, amount: 12.8 },
    { date: 'Jan 20', withdrawals: 5, amount: 15.6 },
    { date: 'Jan 25', withdrawals: 3, amount: 7.9 },
    { date: 'Jan 30', withdrawals: 6, amount: 18.2 },
  ];
  return baseData;
};

export function WithdrawalTrendsChart({ timeRange }: { timeRange: string }) {
  const data = generateWithdrawalData(timeRange as any);

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
          <p className="text-2xl font-bold">25</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avg per Withdrawal</p>
          <p className="text-2xl font-bold">2.8 ETH</p>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Withdrawn</p>
          <p className="text-2xl font-bold">71.2 ETH</p>
        </div>
      </div>
    </div>
  );
}
