'use client';

import { useState } from 'react';
import { Lightbulb, X, ArrowRight, CheckCircle, AlertCircle, Zap, Users, Lock, TrendingUp } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: typeof Lightbulb;
  category: 'security' | 'optimization' | 'learning' | 'engagement';
  priority: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
}

interface SmartSuggestionsProps {
  userContext?: {
    vaultCount?: number;
    guardianCount?: number;
    transactionCount?: number;
    isNewUser?: boolean;
    hasSetSpendingLimits?: boolean;
    hasSetTimelock?: boolean;
    isSecurityAware?: boolean;
    referralProgram?: boolean;
  };
}

function generateContextualSuggestions(context?: SmartSuggestionsProps['userContext']): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (!context) {
    return getDefaultSuggestions();
  }

  // New user suggestions
  if (context.isNewUser) {
    suggestions.push({
      id: 'new-user-setup',
      title: 'Complete Your Vault Setup',
      description: 'You\'re almost done! Add spending limits and a timelock for complete security.',
      icon: Zap,
      category: 'security',
      priority: 'high',
      action: { label: 'Go to Settings', href: '/settings' },
      dismissible: false
    });
  }

  // Security suggestions
  if (!context.hasSetSpendingLimits && !context.isNewUser) {
    suggestions.push({
      id: 'set-limits',
      title: 'Set Your Spending Limits',
      description: 'Protect your vault by setting daily, weekly, and monthly spending limits.',
      icon: Lock,
      category: 'security',
      priority: 'high',
      action: { label: 'Configure Limits', href: '/settings' },
      dismissible: true
    });
  }

  if (!context.hasSetTimelock && !context.isNewUser) {
    suggestions.push({
      id: 'set-timelock',
      title: 'Enable Timelock Protection',
      description: 'Add a 7-30 day delay before withdrawals are executed. This prevents unauthorized transactions.',
      icon: AlertCircle,
      category: 'security',
      priority: 'high',
      action: { label: 'Enable Timelock', href: '/settings' },
      dismissible: true
    });
  }

  // Guardian suggestions
  if ((context.guardianCount ?? 0) === 0) {
    suggestions.push({
      id: 'add-guardians',
      title: 'Add Your First Guardian',
      description: 'Invite trusted friends or family to help protect your vault. A guardian can approve withdrawals.',
      icon: Users,
      category: 'security',
      priority: 'high',
      action: { label: 'Invite Guardian', href: '/guardians' },
      dismissible: false
    });
  } else if ((context.guardianCount ?? 0) === 1) {
    suggestions.push({
      id: 'add-more-guardians',
      title: 'Add More Guardians',
      description: 'Having multiple guardians increases security. Consider adding 1-2 more trusted people.',
      icon: Users,
      category: 'security',
      priority: 'medium',
      action: { label: 'Manage Guardians', href: '/guardians' },
      dismissible: true
    });
  }

  // Learning suggestions
  if (!context.isSecurityAware) {
    suggestions.push({
      id: 'learn-security',
      title: 'Learn About Vault Security',
      description: 'Understand how SpendGuard protects your funds with multi-sig and emergency freeze.',
      icon: Lightbulb,
      category: 'learning',
      priority: 'medium',
      action: { label: 'View Security Guide', href: '/support' },
      dismissible: true
    });
  }

  // Engagement suggestions
  if (!context.referralProgram) {
    suggestions.push({
      id: 'referral-program',
      title: '💰 Earn Rewards with Referrals',
      description: 'Invite friends to SpendGuard and earn up to 12% commission. Unlock exclusive benefits as you climb the tiers!',
      icon: TrendingUp,
      category: 'engagement',
      priority: 'medium',
      action: { label: 'Start Referring', href: '/referral-program' },
      dismissible: true
    });
  }

  // Activity-based suggestions
  if ((context.transactionCount ?? 0) > 10) {
    suggestions.push({
      id: 'view-analytics',
      title: 'Track Your Spending Patterns',
      description: 'Check your analytics dashboard to understand your spending trends and vault activity.',
      icon: TrendingUp,
      category: 'optimization',
      priority: 'low',
      action: { label: 'View Analytics', href: '/analytics' },
      dismissible: true
    });
  }

  return suggestions.length > 0 ? suggestions : getDefaultSuggestions();
}

function getDefaultSuggestions(): Suggestion[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to SpendGuard',
      description: 'Learn the basics of securing your vault with guardians and spending limits.',
      icon: Lightbulb,
      category: 'learning',
      priority: 'medium',
      action: { label: 'Get Started', href: '/updates' },
      dismissible: true
    },
    {
      id: 'referral-welcome',
      title: '💰 Earn by Referring Friends',
      description: 'Share your unique link and earn 5-12% commission on each successful referral.',
      icon: TrendingUp,
      category: 'engagement',
      priority: 'medium',
      action: { label: 'Learn More', href: '/referral-program' },
      dismissible: true
    }
  ];
}

export function SmartSuggestions({ userContext }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const suggestions = useState(() => generateContextualSuggestions(userContext))[0];

  const activeSuggestions = suggestions.filter(s => !dismissed.has(s.id));
  const highPrioritySuggestions = activeSuggestions.filter(s => s.priority === 'high');

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  if (activeSuggestions.length === 0) {
    return null;
  }

  const sortedSuggestions = activeSuggestions.sort((a, b) => {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-3">
      {/* Suggestion Cards */}
      {sortedSuggestions.map((suggestion) => {
        const Icon = suggestion.icon;
        const isHighPriority = suggestion.priority === 'high';

        const priorityStyles = {
          'high': 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20',
          'medium': 'border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          'low': 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
        };

        const priorityBadgeStyles = {
          'high': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
          'medium': 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
          'low': 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
        };

        return (
          <div
            key={suggestion.id}
            className={`rounded-lg p-4 flex items-start gap-4 transition-all ${priorityStyles[suggestion.priority]}`}
          >
            <div className="flex-shrink-0 pt-0.5">
              <Icon size={20} className={isHighPriority ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{suggestion.title}</h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityBadgeStyles[suggestion.priority]}`}>
                  {suggestion.priority === 'high' ? 'Important' : suggestion.priority === 'medium' ? 'Recommended' : 'Optional'}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{suggestion.description}</p>

              {suggestion.action && (
                <a
                  href={suggestion.action.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {suggestion.action.label}
                  <ArrowRight size={14} />
                </a>
              )}
            </div>

            {suggestion.dismissible && (
              <button
                onClick={() => handleDismiss(suggestion.id)}
                className="flex-shrink-0 p-1 hover:bg-white/50 dark:hover:bg-black/20 rounded transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        );
      })}

      {/* Summary */}
      {highPrioritySuggestions.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-300">
            <strong>⚠️ {highPrioritySuggestions.length} action{highPrioritySuggestions.length > 1 ? 's' : ''} recommended</strong> to improve your vault security.
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebars/cards
export function SmartSuggestionsCompact({ userContext, limit = 3 }: SmartSuggestionsProps & { limit?: number }) {
  const suggestions = useState(() => generateContextualSuggestions(userContext).slice(0, limit))[0];

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb size={18} className="text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Smart Suggestions</h3>
      </div>

      <ul className="space-y-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.id} className="flex items-start gap-2 text-sm">
            <CheckCircle size={14} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{suggestion.title}</p>
              {suggestion.action && (
                <a
                  href={suggestion.action.href}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                >
                  {suggestion.action.label} →
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      {suggestions.length < (userContext ? 5 : 2) && (
        <a
          href="/settings"
          className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
        >
          View all suggestions <ArrowRight size={12} />
        </a>
      )}
    </div>
  );
}
