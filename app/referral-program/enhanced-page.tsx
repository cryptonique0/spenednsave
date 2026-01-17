'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ReferralTrackingLinks } from '@/components/referral-tracking-links';
import { RewardsDashboard } from '@/components/rewards-dashboard';
import { ReferralStatistics } from '@/components/referral-statistics';
import { VaultRecoveryAssistant } from '@/components/vault-recovery-assistant';
import { Copy, Check } from 'lucide-react';

type TabType = 'tracking' | 'rewards' | 'statistics' | 'recovery';

export default function EnhancedReferralPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tracking');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://spendguard.app?ref=USER001');
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Your Referral Link
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Share this link to earn $25-50 per successful referral
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
              { id: 'tracking', label: '📊 Tracking Links', icon: '🔗' },
              { id: 'rewards', label: '🎁 Rewards', icon: '💎' },
              { id: 'statistics', label: '📈 Statistics', icon: '📉' },
              { id: 'recovery', label: '🔄 Recovery Assistant', icon: '🔐' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
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
          <div className="bg-white dark:bg-surface-dark rounded-lg border border-surface-border dark:border-gray-700 p-8">
            {activeTab === 'tracking' && <ReferralTrackingLinks userCode="REF_USER001" />}
            {activeTab === 'rewards' && <RewardsDashboard />}
            {activeTab === 'statistics' && <ReferralStatistics timeRange="month" />}
            {activeTab === 'recovery' && <VaultRecoveryAssistant vaultId="VAULT_001" />}
          </div>

          {/* Additional Info Sections */}
          {activeTab === 'tracking' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  💡 Pro Tips
                </h3>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Create unique links for each marketing channel</li>
                  <li>• Track which channels convert best</li>
                  <li>• Use seasonal campaigns for higher conversion</li>
                  <li>• Share your referral code on social media</li>
                  <li>• Monitor real-time analytics for each link</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  🎯 Optimization Guide
                </h3>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Focus on your best-performing channels first</li>
                  <li>• A/B test different messaging and links</li>
                  <li>• Engage with your referred users for better retention</li>
                  <li>• Join our referral affiliate program for higher rates</li>
                  <li>• Update your link names to stay organized</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="mt-8 bg-gradient-to-r from-success/10 to-success/5 dark:from-success/20 dark:to-success/10 border border-success/20 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                ✅ Redemption Options
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Your rewards can be redeemed through:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <li className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Bank Transfer</strong> - Direct to your account
                </li>
                <li className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Wallet Deposit</strong> - Crypto or stablecoins
                </li>
                <li className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>Premium Upgrade</strong> - Unlock features
                </li>
              </ul>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                📊 Understanding Your Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Conversion Rate:</strong> Percentage of clicks that result in signups
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>CTR:</strong> Click-through rate showing link engagement
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Revenue:</strong> Total earnings from successful referrals
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Active Referrals:</strong> Users who remain on the platform
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
