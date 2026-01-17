'use client';

import { useState } from 'react';
import { Copy, Check, QrCode, Eye, EyeOff, Plus } from 'lucide-react';

interface ReferralLink {
  id: string;
  code: string;
  url: string;
  label: string;
  clicks: number;
  signups: number;
  revenue: number;
  createdAt: string;
  isActive: boolean;
}

const SAMPLE_LINKS: ReferralLink[] = [
  {
    id: '1',
    code: 'REF_ABC123',
    url: 'https://spendguard.app?ref=REF_ABC123',
    label: 'Twitter Campaign',
    clicks: 1250,
    signups: 43,
    revenue: 1075,
    createdAt: '2024-12-15',
    isActive: true
  },
  {
    id: '2',
    code: 'REF_DEF456',
    url: 'https://spendguard.app?ref=REF_DEF456',
    label: 'Discord Community',
    clicks: 892,
    signups: 28,
    revenue: 700,
    createdAt: '2024-12-10',
    isActive: true
  },
  {
    id: '3',
    code: 'REF_GHI789',
    url: 'https://spendguard.app?ref=REF_GHI789',
    label: 'Email Newsletter',
    clicks: 456,
    signups: 12,
    revenue: 300,
    createdAt: '2024-12-05',
    isActive: true
  },
  {
    id: '4',
    code: 'REF_JKL012',
    url: 'https://spendguard.app?ref=REF_JKL012',
    label: 'Reddit Promotion',
    clicks: 234,
    signups: 5,
    revenue: 125,
    createdAt: '2024-11-28',
    isActive: false
  }
];

export function ReferralTrackingLinks() {
  const [links, setLinks] = useState<ReferralLink[]>(SAMPLE_LINKS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');

  const handleCopyLink = (link: ReferralLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateLink = () => {
    if (!newLinkLabel.trim()) return;
    
    const newCode = `REF_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const newLink: ReferralLink = {
      id: Date.now().toString(),
      code: newCode,
      url: `https://spendguard.app?ref=${newCode}`,
      label: newLinkLabel,
      clicks: 0,
      signups: 0,
      revenue: 0,
      createdAt: new Date().toISOString().split('T')[0],
      isActive: true
    };
    
    setLinks([newLink, ...links]);
    setNewLinkLabel('');
  };

  const toggleLinkStatus = (id: string) => {
    setLinks(links.map(link =>
      link.id === id ? { ...link, isActive: !link.isActive } : link
    ));
  };

  const conversionRate = (link: ReferralLink) => {
    if (link.clicks === 0) return '0%';
    return ((link.signups / link.clicks) * 100).toFixed(1) + '%';
  };

  const totalMetrics = {
    clicks: links.reduce((sum, l) => sum + l.clicks, 0),
    signups: links.reduce((sum, l) => sum + l.signups, 0),
    revenue: links.reduce((sum, l) => sum + l.revenue, 0)
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Referral Tracking Links
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Create and manage unique referral links to track performance across different channels
        </p>
      </div>

      {/* Create New Link */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Create New Tracking Link
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g., Twitter Campaign, Discord Server, etc."
            value={newLinkLabel}
            onChange={(e) => setNewLinkLabel(e.target.value)}
            className="flex-1 px-4 py-2 bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateLink()}
          />
          <button
            onClick={handleCreateLink}
            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Link
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Clicks</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalMetrics.clicks.toLocaleString()}
              </p>
            </div>
            <QrCode className="w-8 h-8 text-primary/60" />
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Signups</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {totalMetrics.signups.toLocaleString()}
              </p>
            </div>
            <Copy className="w-8 h-8 text-success/60" />
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalMetrics.revenue.toLocaleString()}
              </p>
            </div>
            <div className="text-primary/60 font-bold text-xl">💰</div>
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-surface-border border-b border-surface-border dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Link Label</th>
                <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Code</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Clicks</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Signups</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Conv. Rate</th>
                <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-white">Revenue</th>
                <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border dark:divide-gray-700">
              {links.map((link) => (
                <tr
                  key={link.id}
                  className="hover:bg-slate-50 dark:hover:bg-surface-dark/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${link.isActive ? 'bg-success' : 'bg-slate-400'}`} />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{link.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {link.createdAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded font-mono text-xs">
                      {link.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {link.clicks.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {link.signups.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 rounded font-semibold text-xs">
                      {conversionRate(link)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-success dark:text-success/80">
                      ${link.revenue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCopyLink(link)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Copy link"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleLinkStatus(link.id)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title={link.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {link.isActive ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Info */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <div className="flex gap-3">
          <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              QR Code Tracking Coming Soon
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Generate QR codes for each referral link to track offline campaigns and physical marketing materials
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
