'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Users, Gift, TrendingUp, Copy, Check, DollarSign, Zap } from 'lucide-react';
import { useState } from 'react';

interface ReferralTier {
  id: string;
  name: string;
  referrals: number;
  reward: string;
  benefits: string[];
  color: string;
}

interface ReferralReward {
  id: string;
  type: 'referral-bonus' | 'tier-bonus' | 'milestone';
  title: string;
  amount: string;
  description: string;
  earnedOn?: string;
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
    reward: '$200 bonus',
    benefits: [
      '10% referral commission',
      'Premium analytics',
      'VIP support',
      'Marketing materials',
      'Monthly leaderboard prizes'
    ],
    color: 'indigo'
  },
  {
    id: 'tier-4',
    name: 'Advocate',
    referrals: 50,
    reward: '$500 bonus',
    benefits: [
      '12% referral commission',
      'Real-time notifications',
      'Dedicated account manager',
      'Custom marketing materials',
      'Quarterly bonus',
      'Feature in newsletter'
    ],
    color: 'violet'
  }
];

const SAMPLE_REWARDS: ReferralReward[] = [
  {
    id: 'reward-1',
    type: 'referral-bonus',
    title: 'Referral Commission',
    amount: '$12.50',
    description: 'From John Smith\'s first withdrawal',
    earnedOn: 'Jan 15, 2026'
  },
  {
    id: 'reward-2',
    type: 'referral-bonus',
    title: 'Referral Commission',
    amount: '$8.75',
    description: 'From Sarah Johnson\'s withdrawal',
    earnedOn: 'Jan 12, 2026'
  },
  {
    id: 'reward-3',
    type: 'milestone',
    title: 'Tier Upgrade Bonus',
    amount: '$50.00',
    description: 'Promoted to Friend tier (5 referrals)',
    earnedOn: 'Jan 10, 2026'
  }
];

const REFERRAL_FEATURES = [
  {
    icon: Users,
    title: 'Invite Friends',
    description: 'Share your referral link with anyone. They can join SpendGuard and secure their crypto.'
  },
  {
    icon: DollarSign,
    title: 'Earn Rewards',
    description: 'Get 5-12% commission on every successful referral based on your tier.'
  },
  {
    icon: TrendingUp,
    title: 'Track Earnings',
    description: 'Monitor your referrals, earnings, and progress toward higher tiers in real-time.'
  },
  {
    icon: Zap,
    title: 'Unlock Benefits',
    description: 'Rise through tiers to unlock higher commissions, bonuses, and exclusive perks.'
  }
];

export default function ReferralProgramPage() {
  const [copied, setCopied] = useState(false);
  const [selectedRewardType, setSelectedRewardType] = useState<'all' | 'referral-bonus' | 'tier-bonus' | 'milestone'>('all');

  const referralLink = 'https://spendguard.io/join?ref=USER_123456';
  const currentTier = REFERRAL_TIERS[0];
  const nextTier = REFERRAL_TIERS[1];
  const referralCount = 2;
  const totalEarnings = '$29.25';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRewards = selectedRewardType === 'all' 
    ? SAMPLE_REWARDS 
    : SAMPLE_REWARDS.filter(r => r.type === selectedRewardType);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 dark:bg-background-dark">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Gift size={32} />
              <h1 className="text-4xl md:text-5xl font-bold">Referral Program</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8">Earn rewards by introducing your friends to SpendGuard. The more you share, the more you earn!</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-blue-100 text-sm">Your Earnings</p>
                <p className="text-3xl font-bold">{totalEarnings}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-blue-100 text-sm">Referrals</p>
                <p className="text-3xl font-bold">{referralCount}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-blue-100 text-sm">Current Tier</p>
                <p className="text-3xl font-bold">{currentTier.name}</p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-lg p-4">
                <p className="text-blue-100 text-sm">Commission Rate</p>
                <p className="text-3xl font-bold">5%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Link Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Share Your Referral Link</h2>
            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Copy and share this link with friends. They will be credited to your referral dashboard when they sign up and make their first transaction.</p>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-surface-dark-secondary border border-gray-300 dark:border-surface-dark rounded-lg text-gray-900 dark:text-gray-100 font-mono text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check size={20} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={20} /> Copy
                    </>
                  )}
                </button>
              </div>

              {/* Social Sharing */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Share on Social Media:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors">
                    Twitter
                  </button>
                  <button className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors">
                    Discord
                  </button>
                  <button className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors">
                    WhatsApp
                  </button>
                  <button className="p-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg font-semibold transition-colors">
                    Copy & Paste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-surface-dark-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">How It Works</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REFERRAL_FEATURES.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-surface-dark rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                      <Icon size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tier Progression */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Referral Tiers</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">Progress through tiers to unlock higher commissions and exclusive benefits.</p>

            {/* Progress to Next Tier */}
            <div className="bg-white dark:bg-surface-dark rounded-lg shadow-lg p-8 mb-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Progress to {nextTier.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{nextTier.referrals - referralCount} more referrals needed to reach {nextTier.name} tier and unlock {nextTier.reward}.</p>
              <div className="w-full bg-gray-200 dark:bg-surface-dark-secondary rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300"
                  style={{ width: `${(referralCount / nextTier.referrals) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span>{referralCount}/{nextTier.referrals} referrals</span>
                <span>{Math.round((referralCount / nextTier.referrals) * 100)}%</span>
              </div>
            </div>

            {/* Tier Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REFERRAL_TIERS.map((tier) => {
                const colorClasses: { [key: string]: string } = {
                  'blue': 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  'purple': 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
                  'indigo': 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
                  'violet': 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                };

                const isCurrentTier = tier.id === currentTier.id;
                const isBadge = (color: string) => {
                  const badges: { [key: string]: string } = {
                    'blue': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                    'purple': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
                    'indigo': 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
                    'violet': 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                  };
                  return badges[color];
                };

                return (
                  <div
                    key={tier.id}
                    className={`border-2 rounded-lg p-6 transition-all ${colorClasses[tier.color]} ${isCurrentTier ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-background-dark' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{tier.name}</h3>
                      {isCurrentTier && <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Current</span>}
                    </div>

                    <div className="mb-6">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{tier.reward}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{tier.referrals}+ referrals</p>
                    </div>

                    <div className={`mb-6 px-3 py-2 rounded-lg text-sm font-semibold inline-block ${isBadge(tier.color)}`}>
                      {tier.referrals === 0 ? '5%' : tier.referrals === 5 ? '7%' : tier.referrals === 20 ? '10%' : '12%'} commission
                    </div>

                    <ul className="space-y-2">
                      {tier.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Earnings History */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-surface-dark-secondary">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Earnings History</h2>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(['all', 'referral-bonus', 'tier-bonus', 'milestone'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedRewardType(type)}
                  className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                    selectedRewardType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-secondary'
                  }`}
                >
                  {type === 'all' ? 'All Rewards' : type === 'referral-bonus' ? 'Commissions' : type === 'tier-bonus' ? 'Tier Bonuses' : 'Milestones'}
                </button>
              ))}
            </div>

            {/* Rewards List */}
            <div className="space-y-4">
              {filteredRewards.length > 0 ? (
                filteredRewards.map((reward) => (
                  <div key={reward.id} className="bg-white dark:bg-surface-dark rounded-lg p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-1">{reward.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                      {reward.earnedOn && <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{reward.earnedOn}</p>}
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{reward.amount}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-surface-dark rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                  No rewards yet. Start referring to earn!
                </div>
              )}
            </div>

            {/* Total Earnings */}
            <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
              <p className="text-sm opacity-90 mb-2">Total Earnings</p>
              <p className="text-4xl font-bold">{totalEarnings}</p>
              <p className="text-sm opacity-90 mt-4">Withdrawable balance available in your account</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Referral Program FAQ</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  q: 'When do I get paid?',
                  a: 'Commissions are calculated daily and paid out weekly on Fridays. You need a minimum of $10 to request a withdrawal.'
                },
                {
                  q: 'Do referrals have to withdraw funds?',
                  a: 'No, referrals earn you a commission as soon as they deploy their vault and make their first transaction, regardless of withdrawal.'
                },
                {
                  q: 'Can I lose my tier status?',
                  a: 'Tier status is based on total lifetime referrals and never decreases. Once you reach a tier, you keep those benefits forever.'
                },
                {
                  q: 'Is there a limit to earnings?',
                  a: 'No limit! The more you refer, the more you earn. Advocates can earn unlimited commissions at 12% per referral.'
                },
                {
                  q: 'How do I track my referrals?',
                  a: 'Your referral dashboard shows real-time stats: active referrals, conversions, earnings, and tier progress.'
                },
                {
                  q: 'Can I share referral codes?',
                  a: 'Yes! You can customize your referral link and generate unique codes for different campaigns or social channels.'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-surface-dark rounded-lg p-6 shadow">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3">{item.q}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Earn?</h2>
            <p className="text-xl text-blue-100 mb-8">Share your referral link today and start earning rewards. The sooner you start, the sooner you reach higher tiers!</p>
            <button
              onClick={handleCopyLink}
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors text-lg flex items-center gap-2 mx-auto"
            >
              <Copy size={20} /> Copy My Referral Link
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
