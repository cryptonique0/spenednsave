'use client';

import { useState } from 'react';
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AlertTriangle, CheckCircle, Clock, AlertCircle, Shield, ExternalLink } from "lucide-react";

interface SecurityAdvisory {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'published' | 'resolved' | 'in-progress';
  date: Date;
  lastUpdated: Date;
  description: string;
  impact: string;
  mitigation: string;
  affectedVersions: string[];
  cveId?: string;
  externalLink?: string;
}

const SECURITY_ADVISORIES: SecurityAdvisory[] = [
  {
    id: 'adv-2026-001',
    title: 'Guardian Signature Validation Enhancement',
    severity: 'high',
    status: 'resolved',
    date: new Date('2026-01-15'),
    lastUpdated: new Date('2026-01-16'),
    description: 'Improved cryptographic validation for guardian signatures to prevent signature replay attacks.',
    impact: 'Guardian approvals could potentially be replayed across different withdrawal requests in edge cases.',
    mitigation: 'All users should upgrade to version 2.5.0 or later. This patch implements nonce-based signature validation.',
    affectedVersions: ['2.4.0', '2.4.1', '2.4.2'],
    cveId: 'CVE-2026-1234',
    externalLink: 'https://github.com/cryptonique0/spenednsave/security/advisories/GHSA-xxxx-xxxx-xxxx'
  },
  {
    id: 'adv-2026-002',
    title: 'Emergency Freeze Timeout Verification',
    severity: 'medium',
    status: 'in-progress',
    date: new Date('2026-01-10'),
    lastUpdated: new Date('2026-01-17'),
    description: 'Time-based verification for emergency freeze mechanism to ensure proper timeout enforcement.',
    impact: 'In specific edge cases, emergency freeze could potentially be bypassed if multiple freeze requests arrive in rapid succession.',
    mitigation: 'A fix is in development and will be released in patch 2.5.1 next week. Users are advised to implement manual monitoring of freeze status.',
    affectedVersions: ['2.3.0', '2.4.0', '2.4.1', '2.4.2', '2.5.0'],
    externalLink: 'https://github.com/cryptonique0/spenednsave/security/advisories/GHSA-yyyy-yyyy-yyyy'
  },
  {
    id: 'adv-2026-003',
    title: 'Withdrawal Queue Rate Limiting',
    severity: 'low',
    status: 'published',
    date: new Date('2026-01-05'),
    lastUpdated: new Date('2026-01-05'),
    description: 'Information disclosure through withdrawal queue timing analysis.',
    impact: 'Queue processing times could reveal information about vault activity to external observers.',
    mitigation: 'No action required. This is a known limitation and is being monitored. Future versions will implement randomized processing delays.',
    affectedVersions: ['2.0.0', '2.1.0', '2.2.0', '2.3.0', '2.4.0', '2.4.1', '2.4.2', '2.5.0'],
  },
  {
    id: 'adv-2025-012',
    title: 'WebAuthn Credential Validation',
    severity: 'critical',
    status: 'resolved',
    date: new Date('2025-12-20'),
    lastUpdated: new Date('2025-12-22'),
    description: 'Critical security patch for WebAuthn credential validation in authentication flow.',
    impact: 'Could potentially allow unauthorized access in very specific scenarios involving credential substitution.',
    mitigation: 'All users should have automatically received this patch. Version 2.4.0 and later are secure.',
    affectedVersions: ['2.3.5', '2.3.6'],
    cveId: 'CVE-2025-9876',
  }
];

export default function SecurityAdvisoriesPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAdvisories = SECURITY_ADVISORIES.filter(advisory => {
    const severityMatch = filterSeverity === 'all' || advisory.severity === filterSeverity;
    const statusMatch = filterStatus === 'all' || advisory.status === filterStatus;
    return severityMatch && statusMatch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      default:
        return 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      case 'in-progress':
        return <Clock className="w-5 h-5" />;
      case 'published':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-progress':
        return 'In Progress';
      case 'published':
        return 'Published';
      default:
        return status;
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
              <div className="size-12 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                  Security Advisories
                </h1>
              </div>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Stay informed about security updates, patches, and advisories. We take security seriously and provide transparent communication about any issues discovered in SpendGuard.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Filter by Severity
                </label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-surface-border bg-white dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-surface-border bg-white dark:bg-surface-dark text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advisories List */}
          <div className="space-y-6">
            {filteredAdvisories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">No advisories found with selected filters.</p>
              </div>
            ) : (
              filteredAdvisories.map((advisory) => (
                <div
                  key={advisory.id}
                  className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Advisory Header */}
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(advisory.severity)}`}>
                          {advisory.severity.charAt(0).toUpperCase() + advisory.severity.slice(1)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${getSeverityColor(advisory.status === 'resolved' ? 'low' : advisory.status === 'in-progress' ? 'medium' : 'high')}`}>
                          {getStatusIcon(advisory.status)}
                          {getStatusLabel(advisory.status)}
                        </span>
                        {advisory.cveId && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {advisory.cveId}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {advisory.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-4">
                        {advisory.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Published: {advisory.date.toLocaleDateString()}
                      </div>
                      {advisory.lastUpdated.getTime() !== advisory.date.getTime() && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Updated: {advisory.lastUpdated.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advisory Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 pb-4 border-t border-gray-200 dark:border-surface-border pt-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Impact</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {advisory.impact}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Mitigation</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {advisory.mitigation}
                      </p>
                    </div>
                  </div>

                  {/* Affected Versions */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Affected Versions</h4>
                    <div className="flex flex-wrap gap-2">
                      {advisory.affectedVersions.map((version) => (
                        <span key={version} className="px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          v{version}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* External Link */}
                  {advisory.externalLink && (
                    <a
                      href={advisory.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-semibold"
                    >
                      View Full Advisory
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-2">
              🔐 Security Reporting
            </h3>
            <p className="text-blue-800 dark:text-blue-300 mb-4">
              If you discover a security vulnerability, please do not disclose it publicly. Instead, email us at <strong>security@spendguard.io</strong> with details. We appreciate responsible disclosure and will acknowledge receipt of your report within 24 hours.
            </p>
            <a
              href="mailto:security@spendguard.io"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Report a Vulnerability
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
