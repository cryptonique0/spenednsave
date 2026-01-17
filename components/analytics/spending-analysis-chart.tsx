"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const generateSpendingData = (timeRange: '7d' | '30d' | '90d' | '1y' | 'all') => {
  return [
    { month: 'Jan', daily: 2.1, weekly: 8.4, monthly: 28.5, spent: 18.2 },
    { month: 'Feb', daily: 1.8, weekly: 7.2, monthly: 26.1, spent: 21.4 },
    { month: 'Mar', daily: 2.5, weekly: 10.1, monthly: 32.8, spent: 28.9 },
    { month: 'Apr', daily: 1.9, weekly: 8.6, monthly: 29.4, spent: 24.1 },
    { month: 'May', daily: 2.3, weekly: 9.8, monthly: 31.2, spent: 27.6 },
    { month: 'Jun', daily: 2.0, weekly: 8.1, monthly: 27.9, spent: 22.3 },
  ];
};

export function SpendingAnalysisChart({ timeRange }: { timeRange: string }) {
  const data = generateSpendingData(timeRange as any);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-6">Monthly/Yearly Spending Analysis</h3>
      <p className="text-sm text-muted-foreground mb-4">Spending limits utilization and trends</p>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="daily" 
            stroke="#3b82f6" 
            name="Daily Limit" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="weekly" 
            stroke="#8b5cf6" 
            name="Weekly Limit" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="monthly" 
            stroke="#ec4899" 
            name="Monthly Limit" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="spent" 
            stroke="#f59e0b" 
            name="Amount Spent" 
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Spending Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200">Daily Limit</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">2.0 ETH</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">95% Utilized</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-900">
          <p className="text-sm text-purple-800 dark:text-purple-200">Weekly Limit</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">10.0 ETH</p>
          <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">81% Utilized</p>
        </div>
        <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-4 border border-pink-200 dark:border-pink-900">
          <p className="text-sm text-pink-800 dark:text-pink-200">Monthly Limit</p>
          <p className="text-2xl font-bold text-pink-900 dark:text-pink-100">50.0 ETH</p>
          <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">52% Utilized</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
          <p className="text-sm text-amber-800 dark:text-amber-200">Total Spent</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">27.6 ETH</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">This Month</p>
        </div>
      </div>
    </div>
  );
}
