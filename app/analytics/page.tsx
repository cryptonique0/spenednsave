"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart, TrendingUp } from 'lucide-react';
import { WithdrawalTrendsChart } from '@/components/analytics/withdrawal-trends-chart';
import { SpendingAnalysisChart } from '@/components/analytics/spending-analysis-chart';
import { GuardianParticipationChart } from '@/components/analytics/guardian-participation-chart';
import { TokenDistributionChart } from '@/components/analytics/token-distribution-chart';
import { RiskScoreHistoryChart } from '@/components/analytics/risk-score-history-chart';
import { AnalyticsMetrics } from '@/components/analytics/analytics-metrics';
import { GuardianLeaderboard } from '@/components/analytics/guardian-leaderboard';
import SpendingAnalyticsDashboard from '@/components/analytics/spending-analytics-dashboard';
import { useAccount } from 'wagmi';

export default function AnalyticsPage() {
  const { address } = useAccount();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-background/50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Analytics</h1>
                <p className="text-sm text-muted-foreground">Vault insights and performance metrics</p>
              </div>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
              {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md transition-colors font-medium text-sm ${
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-8">
          <AnalyticsMetrics timeRange={timeRange} />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="spending-analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8 bg-card border border-border">
            <TabsTrigger value="spending-analytics" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">trending_up</span>
              <span className="hidden sm:inline">Spending</span>
              <span className="sm:hidden">$</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawal-trends" className="flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              <span className="hidden sm:inline">Withdrawals</span>
              <span className="sm:hidden">W/D</span>
            </TabsTrigger>
            <TabsTrigger value="spending" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Analysis</span>
              <span className="sm:hidden">A</span>
            </TabsTrigger>
            <TabsTrigger value="participation" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">people</span>
              <span className="hidden sm:inline">Guardians</span>
              <span className="sm:hidden">G</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Tokens</span>
              <span className="sm:hidden">T</span>
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">warning</span>
              <span className="hidden sm:inline">Risk</span>
              <span className="sm:hidden">R</span>
            </TabsTrigger>
          </TabsList>

          {/* Spending Analytics Tab */}
          <TabsContent value="spending-analytics" className="space-y-6">
            <SpendingAnalyticsDashboard />
          </TabsContent>

          {/* Withdrawal Trends Tab */}
          <TabsContent value="withdrawal-trends" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <WithdrawalTrendsChart timeRange={timeRange} />
            </div>
          </TabsContent>

          {/* Guardian Participation Tab */}
          <TabsContent value="participation" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <GuardianParticipationChart timeRange={timeRange} />
            </div>
          </TabsContent>

          {/* Token Distribution Tab */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <TokenDistributionChart />
            </div>
          </TabsContent>

          {/* Risk Score History Tab */}
          <TabsContent value="risk" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <RiskScoreHistoryChart timeRange={timeRange} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Guardian Leaderboard Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">leaderboard</span>
            Guardian Leaderboard
          </h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <GuardianLeaderboard />
          </div>
        </div>

        {/* Export & Reporting */}
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Export & Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
              <span className="material-symbols-outlined">download</span>
              Export to CSV
            </button>
            <button className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
              <span className="material-symbols-outlined">picture_as_pdf</span>
              Generate PDF
            </button>
            <button className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium">
              <span className="material-symbols-outlined">share</span>
              Share Report
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
