'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, Clock, CheckCircle2, Star, Award } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Guardian {
  id: string;
  address: string;
  name: string;
  avatar?: string;
  reputationScore: number; // 0-100
  totalApprovals: number;
  totalRejections: number;
  avgResponseTime: number; // hours
  approvalRate: number; // percentage
  joined: string;
  badges: Badge[];
  lastActive?: string;
  isActive: boolean;
}

interface Badge {
  id: string;
  type: 'fast_responder' | 'reliable' | 'consistent' | 'trusted_advisor';
  level: number;
  earnedAt: string;
  color: string;
}

type SortBy = 'reputation' | 'approvals' | 'response_time' | 'approval_rate' | 'recent';
type FilterBy = 'all' | 'active' | 'with_badges' | 'top_performers';

export function GuardianReputationRankings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('reputation');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with real data from API/contract
  const guardians: Guardian[] = [
    {
      id: '1',
      address: '0x1234...5678',
      name: 'Alice Chen',
      reputationScore: 95,
      totalApprovals: 24,
      totalRejections: 1,
      avgResponseTime: 1.8,
      approvalRate: 96,
      joined: '2025-06-15',
      badges: [
        { id: 'b1', type: 'fast_responder', level: 1, earnedAt: '2025-07-01', color: '#3b82f6' },
        { id: 'b2', type: 'reliable', level: 1, earnedAt: '2025-08-01', color: '#10b981' },
        { id: 'b3', type: 'trusted_advisor', level: 1, earnedAt: '2025-09-01', color: '#ec4899' },
      ],
      lastActive: '2 hours ago',
      isActive: true,
    },
    {
      id: '2',
      address: '0x2345...6789',
      name: 'Bob Johnson',
      reputationScore: 82,
      totalApprovals: 18,
      totalRejections: 2,
      avgResponseTime: 2.5,
      approvalRate: 90,
      joined: '2025-07-20',
      badges: [
        { id: 'b4', type: 'consistent', level: 1, earnedAt: '2025-08-15', color: '#a855f7' },
      ],
      lastActive: '5 hours ago',
      isActive: true,
    },
    {
      id: '3',
      address: '0x3456...7890',
      name: 'Charlie Williams',
      reputationScore: 88,
      totalApprovals: 17,
      totalRejections: 1,
      avgResponseTime: 2.1,
      approvalRate: 94,
      joined: '2025-07-01',
      badges: [
        { id: 'b5', type: 'fast_responder', level: 1, earnedAt: '2025-08-01', color: '#3b82f6' },
        { id: 'b6', type: 'consistent', level: 1, earnedAt: '2025-09-15', color: '#a855f7' },
      ],
      lastActive: '30 minutes ago',
      isActive: true,
    },
    {
      id: '4',
      address: '0x4567...8901',
      name: 'Diana Park',
      reputationScore: 85,
      totalApprovals: 20,
      totalRejections: 2,
      avgResponseTime: 2.8,
      approvalRate: 91,
      joined: '2025-08-10',
      badges: [],
      lastActive: '1 day ago',
      isActive: false,
    },
  ];

  // Filter guardians
  const filteredGuardians = useMemo(() => {
    let result = [...guardians];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.address.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterBy === 'active') {
      result = result.filter((g) => g.isActive);
    } else if (filterBy === 'with_badges') {
      result = result.filter((g) => g.badges.length > 0);
    } else if (filterBy === 'top_performers') {
      result = result.filter((g) => g.reputationScore >= 85);
    }

    // Sort
    switch (sortBy) {
      case 'reputation':
        result.sort((a, b) => b.reputationScore - a.reputationScore);
        break;
      case 'approvals':
        result.sort((a, b) => b.totalApprovals - a.totalApprovals);
        break;
      case 'response_time':
        result.sort((a, b) => a.avgResponseTime - b.avgResponseTime);
        break;
      case 'approval_rate':
        result.sort((a, b) => b.approvalRate - a.approvalRate);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime());
        break;
    }

    return result;
  }, [searchQuery, sortBy, filterBy]);

  const getBadgeDisplay = (badge: Badge) => {
    const badgeConfig = {
      fast_responder: { icon: '⚡', label: 'Fast Responder', bgColor: 'bg-blue-50 dark:bg-blue-950' },
      reliable: { icon: '✅', label: '100% Reliable', bgColor: 'bg-green-50 dark:bg-green-950' },
      consistent: { icon: '📊', label: 'Consistent', bgColor: 'bg-purple-50 dark:bg-purple-950' },
      trusted_advisor: { icon: '💎', label: 'Trusted Advisor', bgColor: 'bg-pink-50 dark:bg-pink-950' },
    };
    const config = badgeConfig[badge.type];
    return (
      <div
        key={badge.id}
        className={`${config.bgColor} px-2 py-1 rounded-md inline-flex items-center gap-1 text-xs font-medium`}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </div>
    );
  };

  const getMedalIcon = (index: number) => {
    const medals = ['🥇', '🥈', '🥉'];
    return medals[index] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Guardian Reputation System</h2>
        <p className="text-muted-foreground">
          Browse and manage your vault guardians by reputation, activity, and badges
        </p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-secondary/50 rounded-lg">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'reputation' as SortBy, label: 'Reputation Score', icon: '⭐' },
                  { value: 'approvals' as SortBy, label: 'Most Approvals', icon: '✅' },
                  { value: 'response_time' as SortBy, label: 'Fastest Response', icon: '⚡' },
                  { value: 'approval_rate' as SortBy, label: 'Highest Approval Rate', icon: '📊' },
                  { value: 'recent' as SortBy, label: 'Recently Joined', icon: '🆕' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`text-left px-3 py-2 rounded-md text-sm transition ${
                      sortBy === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <span>{option.icon}</span> {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter By */}
            <div>
              <label className="block text-sm font-medium mb-2">Filter By</label>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'all' as FilterBy, label: 'All Guardians' },
                  { value: 'active' as FilterBy, label: 'Active Only' },
                  { value: 'with_badges' as FilterBy, label: 'With Badges' },
                  { value: 'top_performers' as FilterBy, label: 'Top Performers (85+)' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilterBy(option.value)}
                    className={`text-left px-3 py-2 rounded-md text-sm transition ${
                      filterBy === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guardian Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGuardians.map((guardian, index) => (
          <div
            key={guardian.id}
            className="border rounded-lg p-6 hover:shadow-lg transition dark:border-border"
          >
            {/* Header with Rank */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {index < 3 && <span className="text-2xl">{getMedalIcon(index)}</span>}
                  <h3 className="text-lg font-semibold">{guardian.name}</h3>
                  {guardian.isActive && (
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{guardian.address}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{guardian.reputationScore}</div>
                <p className="text-xs text-muted-foreground">Reputation</p>
              </div>
            </div>

            {/* Badges */}
            {guardian.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {guardian.badges.map((badge) => getBadgeDisplay(badge))}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-t border-b">
              {/* Approvals */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">{guardian.totalApprovals}</p>
                  <p className="text-xs text-muted-foreground">Approvals</p>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{guardian.avgResponseTime.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Avg Response</p>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">{guardian.approvalRate}%</p>
                  <p className="text-xs text-muted-foreground">Approval Rate</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">{guardian.lastActive}</p>
                  <p className="text-xs text-muted-foreground">Last Active</p>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Joined {new Date(guardian.joined).toLocaleDateString()}</span>
              <button className="text-primary hover:underline font-medium">View Profile →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGuardians.length === 0 && (
        <div className="text-center py-12">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No guardians found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold">{guardians.length}</p>
          <p className="text-sm text-muted-foreground">Total Guardians</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold">{guardians.filter((g) => g.isActive).length}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold">
            {(
              guardians.reduce((sum, g) => sum + g.totalApprovals, 0) /
              guardians.reduce((sum, g) => sum + g.totalApprovals + g.totalRejections, 1)
            ).toFixed(0)}
            %
          </p>
          <p className="text-sm text-muted-foreground">Avg Approval Rate</p>
        </div>
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold">
            {(guardians.reduce((sum, g) => sum + g.reputationScore, 0) / guardians.length).toFixed(
              0
            )}
          </p>
          <p className="text-sm text-muted-foreground">Avg Reputation</p>
        </div>
      </div>
    </div>
  );
}
