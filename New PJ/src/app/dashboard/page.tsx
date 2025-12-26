'use client';

import React, { useState } from 'react';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import Button from '@/components/Button';
import Tabs from '@/components/Tabs';
import Timeline from '@/components/Timeline';
import Leaderboard from '@/components/Leaderboard';
import useMediaQuery from '@/hooks/useMediaQuery';

export default function DashboardPage() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const dashboardTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      content: (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Stats Cards */}
          <Card className="p-6" border shadow="sm">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">42</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Credentials Added
            </div>
          </Card>

          <Card className="p-6" border shadow="sm">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">38</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Verified Credentials
            </div>
          </Card>

          <Card className="p-6" border shadow="sm">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Achievements Unlocked
            </div>
          </Card>

          <Card className="p-6" border shadow="sm">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">850</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Reputation Score
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'activity',
      label: 'Recent Activity',
      icon: '🔔',
      content: (
        <div className="space-y-4">
          <Timeline />
        </div>
      ),
    },
    {
      id: 'leaderboard',
      label: 'Rankings',
      icon: '🏆',
      content: (
        <div>
          <Leaderboard />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back! Here's your profile overview
              </p>
            </div>
            <Badge variant="success" icon="✓">
              Account Verified
            </Badge>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-12">
          <Button variant="primary" className="w-full">
            View Profile
          </Button>
          <Button variant="secondary" className="w-full">
            Add Credential
          </Button>
          <Button variant="secondary" className="w-full">
            Unlock Achievement
          </Button>
          <Button variant="secondary" className="w-full">
            Share Profile
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Card className="p-8" border shadow="lg">
          <Tabs
            tabs={dashboardTabs}
            variant={isMobile ? 'pill' : 'line'}
            onChange={(tabId) => console.log('Switched to tab:', tabId)}
          />
        </Card>

        {/* Footer Stats */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="p-6" border>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🔐 Data Security
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your credentials are secured on the blockchain with smart contract verification.
            </p>
          </Card>

          <Card className="p-6" border>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              🌐 Web3 Verified
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your profile is stored on Base Mainnet with immutable proof.
            </p>
          </Card>

          <Card className="p-6" border>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              ⚡ Real-time Sync
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Updates sync instantly across all connected platforms.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
