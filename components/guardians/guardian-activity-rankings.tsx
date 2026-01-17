'use client';

import React, { useState } from 'react';
import { Award, Zap, Target, TrendingUp, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ActivityRanking {
  rank: number;
  name: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend?: number;
  change?: 'up' | 'down';
  detail?: string;
}

export function GuardianActivityRankings() {
  const [activeTab, setActiveTab] = useState('approvals');

  // Mock data - replace with real data from API/contract
  const activityData = {
    approvals: [
      { rank: 1, name: 'Alice Chen', value: 24, unit: 'approvals', icon: '✅', trend: 12, detail: 'Perfect 96% rate' },
      { rank: 2, name: 'Diana Park', value: 20, unit: 'approvals', icon: '✅', trend: 8, detail: '91% approval rate' },
      { rank: 3, name: 'Bob Johnson', value: 18, unit: 'approvals', icon: '✅', trend: 5, detail: '90% approval rate' },
      { rank: 4, name: 'Charlie Williams', value: 17, unit: 'approvals', icon: '✅', trend: 3, detail: '94% approval rate' },
    ],
    responseTime: [
      { rank: 1, name: 'Alice Chen', value: 1.8, unit: 'hours', icon: '⚡', trend: -0.2, change: 'down' as const, detail: 'Fastest responder' },
      { rank: 2, name: 'Charlie Williams', value: 2.1, unit: 'hours', icon: '⚡', trend: -0.3, change: 'down' as const, detail: 'Very fast' },
      { rank: 3, name: 'Bob Johnson', value: 2.5, unit: 'hours', icon: '⚡', trend: 0.1, change: 'up' as const, detail: 'Fast' },
      { rank: 4, name: 'Diana Park', value: 2.8, unit: 'hours', icon: '⚡', trend: 0.2, change: 'up' as const, detail: 'Moderate' },
    ],
    consistency: [
      { rank: 1, name: 'Alice Chen', value: 96, unit: '%', icon: '🎯', trend: 2, detail: '24 of 25 requests' },
      { rank: 2, name: 'Charlie Williams', value: 94, unit: '%', icon: '🎯', trend: 3, detail: '17 of 18 requests' },
      { rank: 3, name: 'Diana Park', value: 91, unit: '%', icon: '🎯', trend: 1, detail: '20 of 22 requests' },
      { rank: 4, name: 'Bob Johnson', value: 90, unit: '%', icon: '🎯', trend: 2, detail: '18 of 20 requests' },
    ],
    participation: [
      { rank: 1, name: 'Alice Chen', value: 42, unit: 'days', icon: '📊', trend: 100, detail: 'Active for 42 consecutive days' },
      { rank: 2, name: 'Charlie Williams', value: 38, unit: 'days', icon: '📊', trend: 95, detail: 'Active for 38 consecutive days' },
      { rank: 3, name: 'Bob Johnson', value: 28, unit: 'days', icon: '📊', trend: 70, detail: 'Active for 28 consecutive days' },
      { rank: 4, name: 'Diana Park', value: 22, unit: 'days', icon: '📊', trend: 55, detail: 'Active for 22 consecutive days' },
    ],
  };

  const getRankingData = () => {
    switch (activeTab) {
      case 'approvals':
        return activityData.approvals;
      case 'response':
        return activityData.responseTime;
      case 'consistency':
        return activityData.consistency;
      case 'participation':
        return activityData.participation;
      default:
        return activityData.approvals;
    }
  };

  const getMedalIcon = (rank: number) => {
    const medals: { [key: number]: string } = {
      1: '🥇',
      2: '🥈',
      3: '🥉',
    };
    return medals[rank] || `#${rank}`;
  };

  const getTrendDisplay = (item: ActivityRanking) => {
    if (activeTab === 'response') {
      const change = item.change === 'down' ? '↓' : '↑';
      const color = item.change === 'down' ? 'text-green-500' : 'text-red-500';
      return <span className={`text-sm font-medium ${color}`}>{change} {Math.abs(item.trend || 0).toFixed(1)}</span>;
    } else {
      return (
        <span className="text-sm font-medium text-green-500">
          ↑ {item.trend}%
        </span>
      );
    }
  };

  const getTabIcon = (tab: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      approvals: <Target className="h-4 w-4" />,
      response: <Zap className="h-4 w-4" />,
      consistency: <TrendingUp className="h-4 w-4" />,
      participation: <Calendar className="h-4 w-4" />,
    };
    return icons[tab];
  };

  const rankings = getRankingData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Guardian Activity Rankings</h2>
        <p className="text-muted-foreground">
          Track guardian performance across multiple activity metrics
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="approvals" className="gap-2">
            {getTabIcon('approvals')}
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="response" className="gap-2">
            {getTabIcon('response')}
            <span className="hidden sm:inline">Response</span>
          </TabsTrigger>
          <TabsTrigger value="consistency" className="gap-2">
            {getTabIcon('consistency')}
            <span className="hidden sm:inline">Rate</span>
          </TabsTrigger>
          <TabsTrigger value="participation" className="gap-2">
            {getTabIcon('participation')}
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {/* Leaderboard */}
          <div className="space-y-3">
            {rankings.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                {/* Rank and Name */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold w-8 text-center">{getMedalIcon(item.rank)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {item.value.toFixed(activeTab === 'response' ? 1 : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                </div>

                {/* Progress Bar and Trend */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min(
                            (item.value / (activeTab === 'approvals' ? 24 : activeTab === 'response' ? 4 : activeTab === 'consistency' ? 100 : 50)) *
                              100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  {getTrendDisplay(item)}
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
            {activeTab === 'approvals' && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">84</p>
                  <p className="text-xs text-muted-foreground">Total Approvals</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">Total Rejections</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">91%</p>
                  <p className="text-xs text-muted-foreground">Avg Approval Rate</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-muted-foreground">Total Guardians</p>
                </div>
              </>
            )}
            {activeTab === 'response' && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">2.3h</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">1.8h</p>
                  <p className="text-xs text-muted-foreground">Fastest</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">2.8h</p>
                  <p className="text-xs text-muted-foreground">Slowest</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">1.0h</p>
                  <p className="text-xs text-muted-foreground">Variance</p>
                </div>
              </>
            )}
            {activeTab === 'consistency' && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">93%</p>
                  <p className="text-xs text-muted-foreground">Avg Consistency</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">96%</p>
                  <p className="text-xs text-muted-foreground">Highest</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">90%</p>
                  <p className="text-xs text-muted-foreground">Lowest</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">At 90%+ Rate</p>
                </div>
              </>
            )}
            {activeTab === 'participation' && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">32</p>
                  <p className="text-xs text-muted-foreground">Avg Days Active</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">42</p>
                  <p className="text-xs text-muted-foreground">Highest Streak</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">22</p>
                  <p className="text-xs text-muted-foreground">Lowest Streak</p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-muted-foreground">Active Guardians</p>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tips */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Activity Metrics Explained</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Approvals:</strong> Total number of approval decisions made</li>
          <li>• <strong>Response Time:</strong> Average hours to respond to a request</li>
          <li>• <strong>Consistency:</strong> Approval rate (percentage of approved vs rejected)</li>
          <li>• <strong>Participation:</strong> Consecutive days of activity</li>
        </ul>
      </div>
    </div>
  );
}
