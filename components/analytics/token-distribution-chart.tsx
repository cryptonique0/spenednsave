"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const tokenData = [
  { name: 'ETH', value: 45.2, usd: 98400, percentage: 58 },
  { name: 'USDC', value: 25000, usd: 25000, percentage: 30 },
  { name: 'DEGEN', value: 50000, usd: 8500, percentage: 10 },
  { name: 'Other', value: 1200, usd: 1200, percentage: 2 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'];

export function TokenDistributionChart() {
  const totalUSD = tokenData.reduce((sum, token) => sum + token.usd, 0);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-6">Token Distribution</h3>
        <p className="text-sm text-muted-foreground mb-4">Vault assets breakdown by token type</p>
        
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={tokenData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const total = tokenData.reduce((sum, item) => sum + item.value, 0);
                const percent = ((entry.value / total) * 100).toFixed(0);
                return `${percent}%`;
              }}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {tokenData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any) => {
                const token = tokenData.find(t => t.value === value);
                return [`$${token?.usd?.toLocaleString()}`, 'Value'];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Token List */}
      <div className="space-y-3">
        <h4 className="font-semibold">Token Breakdown</h4>
        {tokenData.map((token, index) => (
          <div key={token.name} className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index] }}
                />
                <div>
                  <p className="font-semibold">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {typeof token.value === 'number' && token.value > 1000 
                      ? `${(token.value / 1000).toFixed(1)}K` 
                      : token.value}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${token.usd.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{token.percentage}%</p>
              </div>
            </div>
            <div className="w-full bg-border rounded-full h-2 overflow-hidden">
              <div 
                className="h-full transition-all" 
                style={{ 
                  width: `${token.percentage}%`,
                  backgroundColor: COLORS[index]
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-sm text-muted-foreground">Total Vault Value</p>
          <p className="text-3xl font-bold">${totalUSD.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Largest Token</p>
          <p className="text-3xl font-bold">ETH</p>
          <p className="text-xs text-muted-foreground mt-1">58% of portfolio</p>
        </div>
      </div>
    </div>
  );
}
