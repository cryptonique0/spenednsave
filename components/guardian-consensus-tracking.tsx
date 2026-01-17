'use client';

import { useState } from 'react';
import { CheckCircle, Clock, User, AlertCircle, Send, Bell, X } from 'lucide-react';

interface Guardian {
  id: string;
  name: string;
  role: 'Primary' | 'Secondary' | 'Tertiary';
  status: 'approved' | 'pending' | 'declined';
  approvedAt?: string;
  contact: string;
  avatar: string;
  relationship: string;
  confidence?: number;
}

const GUARDIANS: Guardian[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Primary',
    status: 'approved',
    approvedAt: '2025-01-14 14:32',
    contact: 'sarah@example.com',
    avatar: '👩‍💼',
    relationship: 'Family Member',
    confidence: 95
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Secondary',
    status: 'pending',
    contact: 'michael@example.com',
    avatar: '👨‍💻',
    relationship: 'Business Partner',
    confidence: undefined
  },
  {
    id: '3',
    name: 'Emma Williams',
    role: 'Tertiary',
    status: 'pending',
    contact: 'emma@example.com',
    avatar: '👩',
    relationship: 'Close Friend',
    confidence: undefined
  }
];

const CONSENSUS_RULES = [
  { id: '1', rule: 'Minimum 2 of 3 guardians must approve', met: false, description: 'Currently 1/3 approved' },
  { id: '2', rule: 'All guardians must respond within 48 hours', met: false, description: 'Time remaining: 24 hours' },
  { id: '3', rule: 'No conflicting responses allowed', met: true, description: 'No conflicts detected' },
  { id: '4', rule: 'Unanimous approval for high-risk changes', met: false, description: 'Not applicable for basic recovery' }
];

export function GuardianConsensusTracking() {
  const [guardians, setGuardians] = useState<Guardian[]>(GUARDIANS);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [showGuardianDetails, setShowGuardianDetails] = useState<string | null>(null);

  const handleSendReminder = (guardianId: string) => {
    setSendingReminder(guardianId);
    setTimeout(() => setSendingReminder(null), 2000);
  };

  const handleRevokeApproval = (guardianId: string) => {
    setGuardians(guardians.map(g =>
      g.id === guardianId
        ? { ...g, status: 'pending' as const, approvedAt: undefined }
        : g
    ));
    setRevokeConfirm(null);
  };

  const approvedCount = guardians.filter(g => g.status === 'approved').length;
  const totalGuardians = guardians.length;
  const requirementsOngoing = approvedCount >= Math.ceil(totalGuardians / 2);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-pulse" />;
      case 'declined':
        return <X className="w-5 h-5 text-error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50';
      case 'declined':
        return 'bg-error/10 dark:bg-error/20 border-error/30 dark:border-error/40';
      default:
        return '';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Guardian Consensus Tracking
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Monitor guardian approvals and reach consensus for vault recovery
        </p>
      </div>

      {/* Consensus Progress */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Consensus Status
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {approvedCount} of {totalGuardians} guardians have approved
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            requirementsOngoing
              ? 'bg-success/20 text-success dark:bg-success/30'
              : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
          }`}>
            {requirementsOngoing ? '✓ Consensus Reached' : '⏳ Pending Approval'}
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Approval Progress
              </span>
              <span className="text-sm font-bold text-primary">
                {Math.round((approvedCount / totalGuardians) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary-dark h-full transition-all duration-500"
                style={{ width: `${(approvedCount / totalGuardians) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Time Remaining (48h window)
              </span>
              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                24h 15m
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-full transition-all duration-500"
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consensus Rules */}
      <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Consensus Requirements
        </h3>
        <div className="space-y-3">
          {CONSENSUS_RULES.map((rule) => (
            <div key={rule.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex-shrink-0 pt-0.5">
                {rule.met ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white text-sm">
                  {rule.rule}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {rule.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guardians */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Guardian Approvals
        </h3>

        {guardians.map((guardian) => (
          <div
            key={guardian.id}
            className={`border rounded-lg p-6 transition-all cursor-pointer hover:shadow-md ${getStatusColor(guardian.status)}`}
            onClick={() => setShowGuardianDetails(showGuardianDetails === guardian.id ? null : guardian.id)}
          >
            {/* Guardian Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-4xl flex-shrink-0">
                  {guardian.avatar}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                      {guardian.name}
                    </h4>
                    <span className="text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      {guardian.role}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize flex items-center gap-1 ${
                      guardian.status === 'approved'
                        ? 'bg-success/20 text-success dark:bg-success/30'
                        : guardian.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-error/20 text-error dark:bg-error/30'
                    }`}>
                      {getStatusIcon(guardian.status)}
                      {guardian.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {guardian.relationship}
                  </p>

                  {guardian.status === 'approved' && guardian.confidence && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${guardian.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {guardian.confidence}% confidence
                      </span>
                    </div>
                  )}

                  {guardian.status === 'approved' && guardian.approvedAt && (
                    <p className="text-xs text-success mt-2 font-semibold">
                      ✓ Approved on {guardian.approvedAt}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {guardian.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendReminder(guardian.id);
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
                      sendingReminder === guardian.id
                        ? 'bg-success text-white'
                        : 'bg-primary hover:bg-primary-dark text-white'
                    }`}
                  >
                    {sendingReminder === guardian.id ? '✓ Sent' : <><Send className="w-4 h-4" /> Remind</>}
                  </button>
                )}

                {guardian.status === 'approved' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevokeConfirm(guardian.id);
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {showGuardianDetails === guardian.id && (
              <div className="border-t border-current border-opacity-20 mt-4 pt-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Contact
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white font-mono">
                    {guardian.contact}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Guardian Comment
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white italic">
                    &quot;Comments pending&quot;
                  </p>
                </div>

                {guardian.status !== 'approved' && (
                  <button className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-sm mt-3">
                    Send Verification Link
                  </button>
                )}
              </div>
            )}

            {/* Revoke Confirmation */}
            {revokeConfirm === guardian.id && (
              <div className="border-t border-current border-opacity-20 mt-4 pt-4">
                <p className="text-sm text-slate-900 dark:text-white mb-3">
                  Are you sure you want to revoke {guardian.name}&apos;s approval? They will need to re-approve.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRevokeApproval(guardian.id);
                    }}
                    className="flex-1 px-4 py-2 bg-error text-white font-semibold rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRevokeConfirm(null);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Guardian */}
      <button className="w-full px-6 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-lg text-slate-900 dark:text-white font-semibold transition-colors flex items-center justify-center gap-2">
        <User className="w-5 h-5" />
        Add New Guardian
      </button>

      {/* Notifications */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-4">
        <div className="flex gap-3">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
              Next Steps
            </h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Waiting for Michael Chen to respond (23 hours remaining)</li>
              <li>• You can send reminders every 12 hours</li>
              <li>• Approval from Emma Williams still pending</li>
              <li>• Once 2 approve, you can proceed to contact verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
