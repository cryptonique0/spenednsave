'use client';

import { useState } from 'react';
import { Settings, Clock, Fingerprint, Bell, Activity, ChevronDown } from 'lucide-react';

interface RecoveryAttempt {
  id: string;
  timestamp: string;
  method: string;
  status: 'success' | 'pending' | 'failed';
  details: string;
}

interface RecoveryPreferences {
  timelineSpeed: 'fast' | 'standard' | 'slow';
  recoveryMethods: {
    guardianApproval: boolean;
    biometric: boolean;
    hardwareKey: boolean;
    emailVerification: boolean;
  };
  notifications: {
    attemptStarted: boolean;
    guardianApproved: boolean;
    attemptFailed: boolean;
    recoveryComplete: boolean;
    hourlyReminder: boolean;
    statusUpdates: boolean;
  };
}

const TIMELINE_OPTIONS = [
  { id: 'fast', label: 'Fast Recovery', time: '24 hours', description: 'Expedited process (requires all guardians)', icon: '⚡' },
  { id: 'standard', label: 'Standard Recovery', time: '48 hours', description: 'Default secure process (requires 2 of 3)', icon: '⏱️' },
  { id: 'slow', label: 'Conservative Recovery', time: '72 hours', description: 'Extra security time for review (requires 1 of 3)', icon: '🛡️' }
];

const RECOVERY_METHODS = [
  { id: 'guardianApproval', label: 'Guardian Approval', description: 'Require guardian consensus', icon: '👥' },
  { id: 'biometric', label: 'Biometric Authentication', description: 'Fingerprint or facial recognition', icon: '🔐' },
  { id: 'hardwareKey', label: 'Hardware Key', description: 'Physical security key (FIDO2)', icon: '🔑' },
  { id: 'emailVerification', label: 'Email Verification', description: 'Confirmation via registered email', icon: '📧' }
];

const NOTIFICATION_OPTIONS = [
  { id: 'attemptStarted', label: 'Recovery Attempt Started', description: 'Notify when recovery process begins' },
  { id: 'guardianApproved', label: 'Guardian Approval Received', description: 'Alert when guardian approves request' },
  { id: 'attemptFailed', label: 'Recovery Attempt Failed', description: 'Warning if recovery verification fails' },
  { id: 'recoveryComplete', label: 'Recovery Complete', description: 'Confirmation when access is restored' },
  { id: 'hourlyReminder', label: 'Hourly Reminders', description: 'Periodic progress updates during recovery' },
  { id: 'statusUpdates', label: 'General Status Updates', description: 'Other important recovery notifications' }
];

const SAMPLE_ATTEMPTS: RecoveryAttempt[] = [
  {
    id: '1',
    timestamp: '2026-01-17 14:32:00',
    method: 'Guardian Approval',
    status: 'pending',
    details: 'Awaiting approval from Sarah Johnson'
  },
  {
    id: '2',
    timestamp: '2026-01-16 09:15:00',
    method: 'Email Verification',
    status: 'success',
    details: 'Verified via backup.email@example.com'
  },
  {
    id: '3',
    timestamp: '2026-01-15 18:45:00',
    method: 'Biometric',
    status: 'success',
    details: 'Fingerprint authentication successful'
  },
  {
    id: '4',
    timestamp: '2026-01-14 11:20:00',
    method: 'Guardian Approval',
    status: 'failed',
    details: 'Guardian approval expired (48h window)'
  }
];

export function RecoverySettings() {
  const [preferences, setPreferences] = useState<RecoveryPreferences>({
    timelineSpeed: 'standard',
    recoveryMethods: {
      guardianApproval: true,
      biometric: true,
      hardwareKey: false,
      emailVerification: true
    },
    notifications: {
      attemptStarted: true,
      guardianApproved: true,
      attemptFailed: true,
      recoveryComplete: true,
      hourlyReminder: false,
      statusUpdates: true
    }
  });

  const [attempts] = useState<RecoveryAttempt[]>(SAMPLE_ATTEMPTS);
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  const getTimelineDescription = (speed: string) => {
    const option = TIMELINE_OPTIONS.find(o => o.id === speed);
    return option ? { time: option.time, desc: option.description } : { time: '48h', desc: '' };
  };

  const getStatusColor = (status: 'success' | 'pending' | 'failed') => {
    if (status === 'success') return 'bg-success/10 text-success dark:bg-success/20';
    if (status === 'pending') return 'bg-warning/10 text-warning dark:bg-warning/20';
    return 'bg-red-100/50 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  };

  const getStatusIcon = (status: 'success' | 'pending' | 'failed') => {
    if (status === 'success') return '✓';
    if (status === 'pending') return '⧖';
    return '✗';
  };

  const toggleNotification = (key: keyof RecoveryPreferences['notifications']) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: !preferences.notifications[key]
      }
    });
  };

  const toggleRecoveryMethod = (key: keyof RecoveryPreferences['recoveryMethods']) => {
    setPreferences({
      ...preferences,
      recoveryMethods: {
        ...preferences.recoveryMethods,
        [key]: !preferences.recoveryMethods[key]
      }
    });
  };

  const enabledMethods = Object.values(preferences.recoveryMethods).filter(Boolean).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Recovery Settings & Preferences
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Customize your recovery timeline, authentication methods, notifications, and view recovery attempt history.
        </p>
      </div>

      {/* Timeline Speed Customization */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-500/10 dark:to-blue-500/5 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Recovery Timeline Customization
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose how fast or slow you want your recovery process. Faster recovery requires more guardians; slower recovery is more flexible.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TIMELINE_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setPreferences({ ...preferences, timelineSpeed: option.id as 'fast' | 'standard' | 'slow' })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                preferences.timelineSpeed === option.id
                  ? 'border-blue-500 bg-blue-100/50 dark:bg-blue-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{option.icon}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  preferences.timelineSpeed === option.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {option.time}
                </span>
              </div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{option.label}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Timeline Info */}
        <div className="bg-white dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Setting:</p>
          <p className="text-sm text-slate-900 dark:text-white font-semibold mb-1">
            {TIMELINE_OPTIONS.find(o => o.id === preferences.timelineSpeed)?.label}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {getTimelineDescription(preferences.timelineSpeed).desc}
          </p>
        </div>
      </div>

      {/* Recovery Methods */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-500/10 dark:to-purple-500/5 border border-purple-200 dark:border-purple-500/30 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Alternative Recovery Methods
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Enable multiple authentication methods for recovery. At least one method must be enabled.
        </p>

        <div className="space-y-3">
          {RECOVERY_METHODS.map(method => {
            const key = method.id as keyof RecoveryPreferences['recoveryMethods'];
            const isEnabled = preferences.recoveryMethods[key];
            return (
              <div
                key={method.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
              >
                <button
                  onClick={() => toggleRecoveryMethod(key)}
                  className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isEnabled
                      ? 'bg-purple-500 border-purple-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-purple-400'
                  }`}
                >
                  {isEnabled && '✓'}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{method.icon}</span>
                    <p className="font-semibold text-slate-900 dark:text-white">{method.label}</p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{method.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Active Methods:</p>
          <p className="text-sm text-slate-900 dark:text-white font-semibold">{enabledMethods} method{enabledMethods !== 1 ? 's' : ''} enabled</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-500/10 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/30 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Recovery Notifications
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Choose which recovery events you want to be notified about via email and in-app alerts.
        </p>

        <div className="space-y-3">
          {NOTIFICATION_OPTIONS.map(option => {
            const key = option.id as keyof RecoveryPreferences['notifications'];
            const isEnabled = preferences.notifications[key];
            return (
              <div
                key={option.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors"
              >
                <button
                  onClick={() => toggleNotification(key)}
                  className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isEnabled
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-amber-400'
                  }`}
                >
                  {isEnabled && '✓'}
                </button>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{option.label}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{option.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notification Level:</p>
          <p className="text-sm text-slate-900 dark:text-white font-semibold">
            {Object.values(preferences.notifications).filter(Boolean).length} of {Object.keys(preferences.notifications).length} enabled
          </p>
        </div>
      </div>

      {/* Recovery Attempt Tracking */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Recovery Attempt Tracking
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          View all recovery attempts with timestamps, methods used, and status. Latest attempts shown first.
        </p>

        <div className="space-y-2">
          {attempts.map(attempt => (
            <div key={attempt.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                className="w-full p-4 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStatusColor(attempt.status)}`}>
                    {getStatusIcon(attempt.status)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{attempt.method}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{attempt.timestamp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${
                    attempt.status === 'success'
                      ? 'bg-success/10 text-success dark:bg-success/20'
                      : attempt.status === 'pending'
                      ? 'bg-warning/10 text-warning dark:bg-warning/20'
                      : 'bg-red-100/50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {attempt.status}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${
                    expandedAttempt === attempt.id ? 'rotate-180' : ''
                  }`} />
                </div>
              </button>

              {expandedAttempt === attempt.id && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Details:</span> {attempt.details}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded p-3 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Attempt Summary:</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-success">{attempts.filter(a => a.status === 'success').length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Successful</p>
            </div>
            <div>
              <p className="text-lg font-bold text-warning">{attempts.filter(a => a.status === 'pending').length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
            </div>
            <div>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{attempts.filter(a => a.status === 'failed').length}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex gap-3">
        <button className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors">
          Save Preferences
        </button>
        <button className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors hover:bg-slate-300 dark:hover:bg-slate-600">
          Reset to Default
        </button>
      </div>
    </div>
  );
}
