'use client';

import { useState } from 'react';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Package, Check, AlertCircle, Sparkles, ArrowRight, Github } from "lucide-react";
import Link from 'next/link';

interface ReleaseNote {
  version: string;
  date: Date;
  status: 'stable' | 'beta' | 'deprecated';
  title: string;
  description: string;
  features: string[];
  improvements: string[];
  bugFixes: string[];
  breakingChanges?: string[];
  downloadUrl?: string;
}

const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.5.0',
    date: new Date('2026-01-18'),
    status: 'stable',
    title: 'Guardian Signature Validation & Emergency Features',
    description: 'Major security update with enhanced signature validation and improved emergency mechanisms.',
    features: [
      'Nonce-based guardian signature validation to prevent replay attacks',
      'Enhanced emergency freeze mechanism with better timeout verification',
      'Real-time activity monitoring dashboard for guardians',
      'New WebAuthn support for additional authentication methods',
      'Community highlights section showcasing user stories and tutorials',
      'Security advisories page with vulnerability tracking'
    ],
    improvements: [
      'Improved signature validation performance by 40%',
      'Better error messages for failed withdrawals',
      'Enhanced guardian notification system',
      'Faster vault creation process',
      'Improved mobile UI responsiveness'
    ],
    bugFixes: [
      'Fixed edge case in timelock calculation',
      'Resolved issue with guardian removal timing',
      'Fixed withdrawal queue sorting',
      'Fixed spending limit calculations',
      'Fixed i18n translation loading in offline mode'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.5.0'
  },
  {
    version: '2.4.2',
    date: new Date('2026-01-10'),
    status: 'stable',
    title: 'Stability & Performance Improvements',
    description: 'Bug fixes and performance optimizations for better user experience.',
    features: [
      'Multi-language support for 8 languages (English, Spanish, French, German, Chinese, Japanese, Portuguese, Russian)',
      'Improved batch withdrawal processing'
    ],
    improvements: [
      'Reduced gas costs for withdrawals by 15%',
      'Improved dashboard loading performance',
      'Better handling of network congestion',
      'Enhanced error reporting'
    ],
    bugFixes: [
      'Fixed display of large balance numbers',
      'Corrected timezone handling in activity logs',
      'Fixed guardian voting status display',
      'Improved transaction confirmation reliability'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.4.2'
  },
  {
    version: '2.4.1',
    date: new Date('2025-12-28'),
    status: 'stable',
    title: 'Critical Security Patch',
    description: 'Security patch addressing critical vulnerabilities in the authentication system.',
    features: [],
    improvements: [
      'Enhanced session management',
      'Improved token validation'
    ],
    bugFixes: [
      'Fixed critical authentication bug',
      'Patched potential session hijacking vulnerability',
      'Improved CSRF protection'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.4.1'
  },
  {
    version: '2.4.0',
    date: new Date('2025-12-15'),
    status: 'stable',
    title: 'Batch Withdrawal Manager & Risk Scoring',
    description: 'New batch processing capabilities and advanced risk assessment tools.',
    features: [
      'Batch withdrawal manager for combining multiple requests',
      'Guardian risk scoring engine',
      'Enhanced activity tracking dashboard',
      'New spending limit tiers',
      'Emergency freeze mechanism improvements'
    ],
    improvements: [
      'Improved user onboarding flow',
      'Better vault configuration guide',
      'Enhanced transaction history UI',
      'Faster approval notifications'
    ],
    bugFixes: [
      'Fixed rare race condition in voting',
      'Resolved inconsistent guardian state',
      'Fixed withdrawal amount validation'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.4.0'
  },
  {
    version: '2.3.0',
    date: new Date('2025-11-20'),
    status: 'stable',
    title: 'Time-Locked Withdrawals & Emergency Recovery',
    description: 'New time-lock mechanism and emergency recovery features for better security.',
    features: [
      '30-day time-locked solo withdrawals',
      'Emergency freeze capability',
      'Guardian recovery mechanism',
      'Time-lock configuration UI'
    ],
    improvements: [
      'Streamlined vault creation',
      'Better guardian communication'
    ],
    bugFixes: [
      'Fixed timelock edge cases'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.3.0'
  },
  {
    version: '2.2.0',
    date: new Date('2025-10-15'),
    status: 'stable',
    title: 'Spending Limits & Enhanced Analytics',
    description: 'Advanced spending limits and analytics dashboard for better fund management.',
    features: [
      'Per-guardian spending limits',
      'Time-based spending restrictions',
      'Analytics dashboard',
      'Spending pattern reports'
    ],
    improvements: [
      'Improved dashboard UI',
      'Better data visualization'
    ],
    bugFixes: [],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.2.0'
  },
  {
    version: '2.1.0',
    date: new Date('2025-09-10'),
    status: 'stable',
    title: 'Email Notifications & Guardian Improvements',
    description: 'Better communication and improved guardian management features.',
    features: [
      'Email notifications for all vault actions',
      'Guardian role management',
      'Activity log improvements'
    ],
    improvements: [
      'Better notification UI',
      'Improved email templates'
    ],
    bugFixes: [
      'Fixed notification delivery'
    ],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.1.0'
  },
  {
    version: '2.0.0',
    date: new Date('2025-08-01'),
    status: 'stable',
    title: 'Core Vault System & Guardian Voting',
    description: 'Initial release with core vault and guardian voting functionality.',
    features: [
      'Decentralized vault system',
      'Guardian-based voting',
      'Quorum-based approvals',
      'Multi-signature support'
    ],
    improvements: [],
    bugFixes: [],
    downloadUrl: 'https://github.com/cryptonique0/spenednsave/releases/tag/v2.0.0'
  }
];

export default function FeatureReleaseNotesPage() {
  const [expandedVersion, setExpandedVersion] = useState<string>('2.5.0');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredNotes = filterStatus === 'all' 
    ? RELEASE_NOTES 
    : RELEASE_NOTES.filter(note => note.status === filterStatus);

  const latestStable = RELEASE_NOTES.find(r => r.status === 'stable');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'beta':
        return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20';
      case 'deprecated':
        return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
      default:
        return 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Package size={24} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                  Release Notes
                </h1>
              </div>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-6">
              Stay updated with the latest features, improvements, and bug fixes in SpendGuard.
            </p>
          </div>

          {/* Latest Release Alert */}
          {latestStable && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/5 dark:to-emerald-500/5 border border-green-200 dark:border-green-500/20 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-400">Latest Release</h3>
                  </div>
                  <h2 className="text-2xl font-bold text-green-900 dark:text-green-300 mb-2">
                    Version {latestStable.version} - {latestStable.title}
                  </h2>
                  <p className="text-green-800 dark:text-green-400">
                    Released on {latestStable.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <a
                  href={latestStable.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              </div>
            </div>
          )}

          {/* Filter */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-slate-900 dark:text-white block mb-3">
              Filter by Status
            </label>
            <div className="flex gap-2">
              {['all', 'stable', 'beta', 'deprecated'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Release Timeline */}
          <div className="space-y-6">
            {filteredNotes.map((note, index) => (
              <div key={note.version}>
                {/* Timeline Line */}
                {index < filteredNotes.length - 1 && (
                  <div className="absolute left-8 top-full w-0.5 h-6 bg-gradient-to-b from-primary to-transparent opacity-20 relative -ml-4" />
                )}

                {/* Release Card */}
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <button
                    onClick={() => setExpandedVersion(expandedVersion === note.version ? '' : note.version)}
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-primary">v{note.version}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(note.status)}`}>
                          {note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {note.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {note.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${expandedVersion === note.version ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Expanded Content */}
                  {expandedVersion === note.version && (
                    <div className="border-t border-gray-200 dark:border-surface-border p-6 space-y-6 bg-gray-50 dark:bg-slate-900/20">
                      <p className="text-slate-600 dark:text-slate-400">
                        {note.description}
                      </p>

                      {note.features.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            New Features
                          </h4>
                          <ul className="space-y-2">
                            {note.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.improvements.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-3">Improvements</h4>
                          <ul className="space-y-2">
                            {note.improvements.map((improvement, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.bugFixes.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-3">Bug Fixes</h4>
                          <ul className="space-y-2">
                            {note.bugFixes.map((fix, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                <Check className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                <span>{fix}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.breakingChanges && note.breakingChanges.length > 0 && (
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            Breaking Changes
                          </h4>
                          <ul className="space-y-2">
                            {note.breakingChanges.map((change, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {note.downloadUrl && (
                        <div>
                          <a
                            href={note.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
                          >
                            <Github className="w-4 h-4" />
                            View Release on GitHub
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
