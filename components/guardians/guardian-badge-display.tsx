'use client';

import React, { useState } from 'react';
import { Award, Star, Trophy, Target, Zap, CheckCircle2, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BadgeInfo {
  id: string;
  type: 'fast_responder' | 'reliable' | 'consistent' | 'trusted_advisor';
  name: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  requirement: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  earnedCount: number;
  progress?: number;
}

interface GuardianBadges {
  guardian: string;
  badges: BadgeInfo[];
  totalPoints: number;
}

export function GuardianBadgeDisplay() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock badge data
  const allBadges: BadgeInfo[] = [
    {
      id: 'fast_responder',
      type: 'fast_responder',
      name: 'Fast Responder',
      description: 'Respond to requests within 2 hours on average',
      icon: <Zap className="h-6 w-6" />,
      bgColor: 'bg-blue-100 dark:bg-blue-950',
      requirement: 'Average response time < 2h',
      rarity: 'uncommon',
      earnedCount: 3,
      progress: 85,
    },
    {
      id: 'reliable',
      type: 'reliable',
      name: '100% Reliable',
      description: 'Maintain a 95%+ approval rate',
      icon: <CheckCircle2 className="h-6 w-6" />,
      bgColor: 'bg-green-100 dark:bg-green-950',
      requirement: 'Approval rate >= 95%',
      rarity: 'rare',
      earnedCount: 1,
      progress: 96,
    },
    {
      id: 'consistent',
      type: 'consistent',
      name: 'Consistent Guardian',
      description: 'Maintain 30+ consecutive days of activity',
      icon: <Target className="h-6 w-6" />,
      bgColor: 'bg-purple-100 dark:bg-purple-950',
      requirement: '30+ consecutive days active',
      rarity: 'uncommon',
      earnedCount: 2,
      progress: 95,
    },
    {
      id: 'trusted_advisor',
      type: 'trusted_advisor',
      name: 'Trusted Advisor',
      description: 'Achieve a trust score of 90+',
      icon: <Star className="h-6 w-6" />,
      bgColor: 'bg-pink-100 dark:bg-pink-950',
      requirement: 'Trust score >= 90',
      rarity: 'legendary',
      earnedCount: 1,
      progress: 95,
    },
  ];

  // Mock guardian badge data
  const guardianBadges: GuardianBadges[] = [
    {
      guardian: 'Alice Chen',
      badges: allBadges.slice(0, 4), // All 4 badges
      totalPoints: 450,
    },
    {
      guardian: 'Charlie Williams',
      badges: allBadges.slice(0, 2), // Fast responder + Consistent
      totalPoints: 320,
    },
    {
      guardian: 'Bob Johnson',
      badges: allBadges.slice(0, 1), // Fast responder only
      totalPoints: 150,
    },
    {
      guardian: 'Diana Park',
      badges: [], // No badges yet
      totalPoints: 0,
    },
  ];

  const getRarityColor = (rarity: string) => {
    const colors: { [key: string]: string } = {
      common: 'text-gray-400',
      uncommon: 'text-green-500',
      rare: 'text-blue-500',
      legendary: 'text-purple-500',
    };
    return colors[rarity] || 'text-gray-400';
  };

  const getBadgeCount = (badgeType: string) => {
    return allBadges.find((b) => b.id === badgeType)?.earnedCount || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Guardian Badges & Achievements</h2>
        <p className="text-muted-foreground">
          Earn badges and achievements through consistent guardian activity
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">All Badges</TabsTrigger>
          <TabsTrigger value="earned">Guardian Achievements</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* All Badges Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBadges.map((badge) => (
              <div
                key={badge.id}
                className={`${badge.bgColor} border rounded-lg p-6 hover:shadow-lg transition`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{badge.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1">{badge.name}</h3>
                      <p className={`text-xs font-semibold ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{badge.earnedCount}</p>
                    <p className="text-xs text-muted-foreground">earned</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm mb-4">{badge.description}</p>

                {/* Requirement */}
                <div className="bg-black/10 dark:bg-white/10 rounded p-3">
                  <p className="text-xs font-mono">{badge.requirement}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Badge Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-2xl font-bold">{allBadges.length}</p>
              <p className="text-sm text-muted-foreground">Total Badge Types</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-2xl font-bold">{allBadges.reduce((sum, b) => sum + b.earnedCount, 0)}</p>
              <p className="text-sm text-muted-foreground">Total Earned</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-2xl font-bold">
                {allBadges.filter((b) => b.rarity === 'legendary').length}
              </p>
              <p className="text-sm text-muted-foreground">Legendary Badges</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-2xl font-bold">100</p>
              <p className="text-sm text-muted-foreground">Points Per Badge</p>
            </div>
          </div>
        </TabsContent>

        {/* Guardian Achievements Tab */}
        <TabsContent value="earned" className="space-y-4">
          {guardianBadges.map((guardian, idx) => (
            <div key={idx} className="border rounded-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{guardian.guardian}</h3>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{guardian.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Achievement Points</p>
                </div>
              </div>

              {/* Badges */}
              {guardian.badges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {guardian.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`${badge.bgColor} rounded-lg px-4 py-3 flex items-center gap-2 hover:shadow-md transition`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className={`text-xs ${getRarityColor(badge.rarity)}`}>
                          {badge.rarity.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-secondary/50 rounded-lg">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No badges earned yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete requirements to unlock badges</p>
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {allBadges.map((badge) => (
            <div key={badge.id} className="border rounded-lg p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{badge.icon}</span>
                  <div>
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bars for Each Guardian */}
              <div className="space-y-3">
                {['Alice Chen', 'Charlie Williams', 'Bob Johnson', 'Diana Park'].map((guardian, idx) => {
                  // Simulate different progress for each guardian
                  const progressMap: { [key: string]: number } = {
                    'Alice Chen': badge.type === 'fast_responder' ? 100 : badge.type === 'reliable' ? 100 : badge.type === 'consistent' ? 100 : 100,
                    'Charlie Williams': badge.type === 'fast_responder' ? 95 : badge.type === 'reliable' ? 85 : badge.type === 'consistent' ? 100 : 75,
                    'Bob Johnson': badge.type === 'fast_responder' ? 80 : badge.type === 'reliable' ? 65 : badge.type === 'consistent' ? 70 : 50,
                    'Diana Park': badge.type === 'fast_responder' ? 60 : badge.type === 'reliable' ? 45 : badge.type === 'consistent' ? 55 : 30,
                  };
                  const progress = progressMap[guardian] || 0;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{guardian}</p>
                        <p className="text-sm font-semibold text-primary">{progress}%</p>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Requirement Info */}
              <div className="mt-4 p-3 bg-secondary/50 rounded text-sm">
                <p className="font-medium">Requirement:</p>
                <p className="text-muted-foreground">{badge.requirement}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Badges Leaderboard */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="text-2xl font-bold mb-4">Top Badge Earners</h3>
        <div className="space-y-3">
          {guardianBadges
            .filter((g) => g.totalPoints > 0)
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((guardian, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-primary w-8 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div>
                      <p className="font-semibold">{guardian.guardian}</p>
                      <p className="text-xs text-muted-foreground">{guardian.badges.length} badges earned</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{guardian.totalPoints}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
