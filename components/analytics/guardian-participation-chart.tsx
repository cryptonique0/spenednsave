"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const generateParticipationData = () => {
  return [
    { guardian: 'Alice', approvals: 24, rejections: 2, avgTime: 2.1 },
    { guardian: 'Bob', approvals: 18, rejections: 3, avgTime: 3.4 },
    { guardian: 'Charlie', approvals: 22, rejections: 1, avgTime: 1.8 },
    { guardian: 'Diana', approvals: 20, rejections: 2, avgTime: 2.5 },
  ];
};

export function GuardianParticipationChart({ timeRange }: { timeRange: string }) {
  const data = generateParticipationData();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-6">Guardian Participation Metrics</h3>
        <p className="text-sm text-muted-foreground mb-4">Approval rates and participation statistics</p>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="guardian" stroke="var(--muted-foreground)" />
            <YAxis stroke="var(--muted-foreground)" />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="approvals" fill="var(--primary)" name="Approvals" />
            <Bar dataKey="rejections" fill="#ef4444" name="Rejections" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Guardian Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((guardian) => {
          const total = guardian.approvals + guardian.rejections;
          const approvalRate = ((guardian.approvals / total) * 100).toFixed(1);
          
          return (
            <div key={guardian.guardian} className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{guardian.guardian}</p>
                  <p className="text-sm text-muted-foreground">Guardian</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{approvalRate}%</p>
                  <p className="text-xs text-muted-foreground">Approval Rate</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approvals</span>
                  <span className="font-semibold">{guardian.approvals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rejections</span>
                  <span className="font-semibold">{guardian.rejections}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Response Time</span>
                  <span className="font-semibold">{guardian.avgTime}h</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${
                          i < 4 ? 'bg-yellow-500' : 'bg-muted-foreground/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Reliability Score: 4.0/5.0</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-800 dark:text-green-200">Total Approvals</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">84</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4 border border-red-200 dark:border-red-900">
          <p className="text-sm text-red-800 dark:text-red-200">Total Rejections</p>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">8</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-800 dark:text-blue-200">Avg Response</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">2.4h</p>
        </div>
      </div>
    </div>
  );
}
