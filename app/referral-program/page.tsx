'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Users, Copy, Check, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { ReferralTrackingLinks } from '@/components/referral-tracking-links';
import { RewardsDashboard } from '@/components/rewards-dashboard';
import { ReferralStatistics } from '@/components/referral-statistics';
import { VaultRecoveryAssistant } from '@/components/vault-recovery-assistant';

type TabType = 'overview' | 'tracking' | 'rewards' | 'statistics' | 'recovery';

interface ReferralTier {
  id: string;
  name: string;
  referrals: number;
  reward: string;
  benefits: string[];
  color: string;
}

const REFERRAL_TIERS: ReferralTier[] = [
  {
    id: 'tier-1',
    name: 'Starter',
    referrals: 0,
    reward: '$0',
    benefits: [
      '5% referral commission',
      'Basic referral dashboard',
      'Email support'
    ],
    color: 'blue'
  },
  {
    id: 'tier-2',
    name: 'Friend',
    referrals: 5,
    reward: '$50 bonus',
    benefits: [
      '7% referral commission',
      'Advanced analytics',
      'Priority support',
      'Exclusive Discord channel'
    ],
    color: 'purple'
  },
  {
    id: 'tier-3',
    name: 'Ambassador',
    referrals: 20,
    reward: '$250 bonus',
    benefits: [
      '10% referral commission',
      'Dedicated account manager',
      '24/7 VIP support',
      'Co-marketing opportunities'
    ],
    color: 'pink'
  },
  {
    id: 'tier-4',
    name: 'Advocate',
    referrals: 50,
    reward: '$1000 bonus',
    benefits: [
      '12% referral commission',
      'Custom solutions',
      'Direct executive access',
      'Revenue share partnership'
    ],
    color: 'yellow'
  }
];

export default function ReferralProgramPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const referralLink = 'https://spendguard.io/join?ref=USER_123456';
  const currentTier = REFERRAL_TIERS[0];
  const referralCount = 2;
  const totalEarnings = '$29.25';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-surface-border dark:to-background-dark pt-20 pb-12">
        <div className="w-full px-6 md:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Referral Program Hub
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Track, manage, and optimize your referral earnings all in one place
            </p>
          </div>

          {/* Quick Copy Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Your Referral Link
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share this link to earn rewards
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors flex items-center gap-2 flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 border-b border-surface-border dark:border-gray-700">
            {[
              { id: 'overview' as const, label: '📊 Overview' },
              { id: 'tracking' as const, label: '🔗 Tracking Links' },
              { id: 'rewards' as const, label: '🎁 Rewards' },
              { id: 'statistics' as const, label: '📈 Statistics' },
              { id: 'recovery' as const, label: '🔄 Recovery' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Hero Section */}
                <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg p-8 md:p-12">
                  <h2 className="text-3xl font-bold mb-4">Turn Your Network Into Rewards</h2>
                  <p className="text-xl text-blue-100 mb-8">Share your referral link today and start earning rewards. The sooner you start, the sooner you reach higher tiers!</p>
                  <button
                    onClick={handleCopyLink}
                    className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors text-lg flex items-center gap-2"
                  >
                    <Copy size={20} /> Copy My Referral Link
                  </button>
                </section>

                {/* Current Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Referrals</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{referralCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 dark:bg-green-950/30 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Earnings</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalEarnings}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Current Tier</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentTier.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tier Progression */}
                <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Referral Tiers</h3>
                  <div className="space-y-4">
                    {REFERRAL_TIERS.map((tier) => (
                      <div
                        key={tier.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          currentTier.id === tier.id
                            ? 'border-primary bg-primary/5 dark:bg-primary/10'
                            : 'border-surface-border dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                              {tier.name} {currentTier.id === tier.id && '(Current)'}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {tier.referrals} referrals needed • {tier.reward}
                            </p>
                          </div>
                          <Zap className={`w-6 h-6 ${
                            currentTier.id === tier.id
                              ? 'text-primary'
                              : 'text-slate-400'
                          }`} />
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <span className="text-primary">✓</span> {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tracking' && <ReferralTrackingLinks />}
            {activeTab === 'rewards' && <RewardsDashboard />}
            {activeTab === 'statistics' && <ReferralStatistics />}
            {activeTab === 'recovery' && <VaultRecoveryAssistant />}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
