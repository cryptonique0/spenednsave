'use client';

import { useState, useMemo } from 'react';
import { Check, ArrowRight, AlertCircle, ChevronDown, BookOpen, Clock, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  details: string[];
  tips: string[];
  warnings?: string[];
  action?: string;
  timeEstimate: number; // in minutes
}

interface Walkthrough {
  id: string;
  title: string;
  description: string;
  steps: WalkthroughStep[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  icon: string;
}

const walkthroughs: Walkthrough[] = [
  {
    id: 'vault-setup-walkthrough',
    title: 'Set Up Your First Vault',
    description: 'Complete step-by-step walkthrough to create and configure your vault',
    difficulty: 'beginner',
    estimatedTime: 15,
    icon: '🔐',
    steps: [
      {
        id: 'step-1',
        title: 'Connect Your Wallet',
        description: 'Start by connecting the wallet that will own the vault',
        details: [
          'Click "Connect Wallet" in the top right',
          'Select your wallet provider (MetaMask, WalletConnect, etc)',
          'Approve the connection request in your wallet',
          'Verify the connected address shows correctly',
        ],
        tips: [
          'Use a hardware wallet for maximum security',
          'Make sure you have enough ETH for gas fees',
          'Keep your wallet seed phrase safe and offline',
        ],
        timeEstimate: 3,
        action: 'Connect Wallet',
      },
      {
        id: 'step-2',
        title: 'Create a New Vault',
        description: 'Initialize your vault with basic settings',
        details: [
          'Navigate to the Vault section',
          'Click "Create New Vault"',
          'Enter a descriptive name (e.g., "Personal Savings")',
          'Choose your vault type (personal, team, organization)',
          'Set the vault currency (ETH, USDC, etc)',
        ],
        tips: [
          'Use clear, descriptive names for future reference',
          'Consider your use case when selecting vault type',
          'You can change some settings later',
        ],
        warnings: [
          'Vault address cannot be changed after creation',
          'Ensure you have adequate wallet balance',
        ],
        timeEstimate: 5,
        action: 'Create Vault',
      },
      {
        id: 'step-3',
        title: 'Configure Guardian Settings',
        description: 'Set up your guardians and approval thresholds',
        details: [
          'Select the number of guardians (recommended: 3-5)',
          'Set approval threshold (e.g., 2 of 3)',
          'Define response time limit (e.g., 7 days)',
          'Set emergency access parameters',
        ],
        tips: [
          'Higher thresholds = more security but slower approvals',
          'Choose guardians you trust completely',
          '2 of 3 is a good starting point',
        ],
        warnings: [
          'If threshold is too high, you might lose vault access',
          'All guardians should be reachable',
        ],
        timeEstimate: 8,
        action: 'Configure Guardians',
      },
      {
        id: 'step-4',
        title: 'Set Security Features',
        description: 'Enable additional security protections',
        details: [
          'Enable two-factor authentication (2FA)',
          'Set up emergency contacts',
          'Configure backup methods',
          'Enable transaction notifications',
          'Set withdrawal limits (optional)',
        ],
        tips: [
          'Enable every security feature available',
          'Keep backup codes in a safe place',
          'Withdrawal limits can prevent large losses',
        ],
        timeEstimate: 7,
        action: 'Enable Security',
      },
      {
        id: 'step-5',
        title: 'Review and Deploy',
        description: 'Review all settings and deploy your vault',
        details: [
          'Review summary of all settings',
          'Verify guardian addresses are correct',
          'Check approval thresholds one final time',
          'Approve transaction in your wallet',
          'Wait for blockchain confirmation',
        ],
        tips: [
          'Take a screenshot of your configuration',
          'Keep confirmation transaction hash',
          'You can view vault status on blockchain explorers',
        ],
        warnings: [
          'Deployment is irreversible',
          'This will cost gas fees',
        ],
        timeEstimate: 4,
        action: 'Deploy Vault',
      },
      {
        id: 'step-6',
        title: 'Invite Guardians',
        description: 'Send guardian invitations to your selected guardians',
        details: [
          'Go to Guardian Management section',
          'Click "Invite Guardian"',
          'Enter guardian email address',
          'Select guardian role and permissions',
          'Send invitation (guardian receives email)',
          'Guardian accepts invitation',
          'Complete verification process',
        ],
        tips: [
          'Verify email addresses are correct',
          'Send follow-up reminders for acceptance',
          'Communicate separately to explain the role',
        ],
        warnings: [
          'Invitations expire after 7 days',
          'Guardians must accept before they can approve',
        ],
        timeEstimate: 10,
        action: 'Invite Guardians',
      },
      {
        id: 'step-7',
        title: 'Test Vault Functionality',
        description: 'Verify everything works before mainnet use',
        details: [
          'Request a test transaction approval',
          'Verify guardians receive notifications',
          'Check approval process flows correctly',
          'Test emergency access procedures',
          'Verify withdrawal limits are enforced',
          'Check all notification channels work',
        ],
        tips: [
          'Test on testnet first',
          'Use small amounts to test',
          'Document any issues found',
        ],
        warnings: [
          'Do not store large amounts until tested',
          'Test emergency procedures before needed',
        ],
        timeEstimate: 10,
        action: 'Run Tests',
      },
      {
        id: 'step-8',
        title: 'Completion and Best Practices',
        description: 'Finalize setup and follow security best practices',
        details: [
          'Save all vault configuration details',
          'Document guardian contact information',
          'Create backup of recovery codes',
          'Set calendar reminders for security reviews',
          'Share emergency procedures with guardians',
          'Enable monitoring and alerts',
        ],
        tips: [
          'Review security quarterly',
          'Update guardians if circumstances change',
          'Keep documentation in a safe place',
        ],
        warnings: [
          'Do not share recovery codes via email',
          'Do not tell guardians the threshold',
        ],
        timeEstimate: 5,
        action: 'Complete Setup',
      },
    ],
  },
  {
    id: 'add-guardian-walkthrough',
    title: 'Add a New Guardian',
    description: 'Step-by-step guide to add a guardian to an existing vault',
    difficulty: 'beginner',
    estimatedTime: 10,
    icon: '👥',
    steps: [
      {
        id: 'step-1',
        title: 'Access Guardian Management',
        description: 'Navigate to the guardian management section',
        details: ['Go to Settings → Guardians', 'Click "Add New Guardian"', 'Verify current threshold requirements'],
        tips: ['You can add guardians anytime', 'Current guardians must approve additions'],
        timeEstimate: 2,
      },
      {
        id: 'step-2',
        title: 'Enter Guardian Information',
        description: 'Provide details about the new guardian',
        details: [
          'Email address (primary contact)',
          'Full name',
          'Phone number (optional but recommended)',
          'Guardian relationship (family, friend, professional)',
        ],
        tips: [
          'Use email addresses you trust to reach them',
          'Phone numbers help in emergencies',
          'Be clear about relationship for your records',
        ],
        timeEstimate: 3,
      },
      {
        id: 'step-3',
        title: 'Set Guardian Permissions',
        description: 'Configure what the guardian can do',
        details: [
          'Choose permission level (Standard, Advanced, Full)',
          'Select which transaction types they can approve',
          'Set spending limits (optional)',
          'Configure notification preferences',
        ],
        tips: [
          'Start with Standard permissions',
          'Limits help prevent abuse',
          'Different guardians can have different permissions',
        ],
        timeEstimate: 4,
      },
      {
        id: 'step-4',
        title: 'Send Invitation',
        description: 'Send the invitation to the guardian',
        details: [
          'Review all information',
          'Click "Send Invitation"',
          'Guardian receives email with invitation link',
          'Invitation valid for 7 days',
        ],
        tips: [
          'Check email address is correct before sending',
          'Send follow-up message explaining the role',
          'Resend if they dont respond in 3 days',
        ],
        warnings: ['Invitations expire after 7 days'],
        timeEstimate: 2,
      },
      {
        id: 'step-5',
        title: 'Guardian Acceptance',
        description: 'Guardian accepts the invitation',
        details: [
          'Guardian clicks email invitation link',
          'Guardian creates account (if new)',
          'Guardian reviews vault details',
          'Guardian accepts terms and conditions',
          'Guardian completes identity verification',
        ],
        tips: ['Follow up with guardian if they haven\'t accepted', 'Provide context about the vault'],
        timeEstimate: 5,
      },
      {
        id: 'step-6',
        title: 'Verification Complete',
        description: 'Guardian is now active on your vault',
        details: [
          'Guardian appears in active guardians list',
          'Guardian receives confirmation email',
          'You receive notification of addition',
          'Guardian can now approve transactions',
        ],
        tips: ['Send guardian a welcome message with instructions', 'Provide them with your contact info'],
        timeEstimate: 1,
      },
    ],
  },
  {
    id: 'emergency-access-walkthrough',
    title: 'Emergency Vault Access',
    description: 'What to do if you need emergency access to your vault',
    difficulty: 'intermediate',
    estimatedTime: 20,
    icon: '🚨',
    steps: [
      {
        id: 'step-1',
        title: 'Understand Emergency Access Types',
        description: 'Learn about different emergency scenarios',
        details: [
          'Lost wallet access → Recovery via guardians',
          'Account compromise → Security lockdown',
          'Guardian unavailable → Alternative process',
          'Time-critical withdrawal → Emergency approval',
        ],
        tips: ['Familiarize yourself with procedures now', 'Practice emergency processes before needed'],
        timeEstimate: 5,
      },
      {
        id: 'step-2',
        title: 'Initiate Emergency Access Request',
        description: 'Start the emergency access procedure',
        details: [
          'Go to Settings → Emergency Access',
          'Select type of emergency',
          'Provide brief explanation',
          'System sends alerts to all guardians',
          'Guardians receive priority notifications',
        ],
        tips: ['Be clear and specific about your emergency', 'Contact guardians directly as well'],
        timeEstimate: 3,
      },
      {
        id: 'step-3',
        title: 'Guardian Review and Decision',
        description: 'Guardians review and act on your request',
        details: [
          'All guardians receive alert notifications',
          'Guardians review request details',
          'Guardians access emergency dashboard',
          'Each guardian votes approve/deny',
          'System tracks time-sensitive votes',
        ],
        tips: [
          'Call guardians to expedite responses',
          'Be prepared to answer security questions',
        ],
        warnings: ['Guardians must meet threshold requirement'],
        timeEstimate: 10,
      },
      {
        id: 'step-4',
        title: 'Approval and Access Restoration',
        description: 'Once approved, regain vault access',
        details: [
          'Threshold of guardians approves request',
          'System verifies approvals',
          'Temporary access token generated',
          'You receive access credentials',
          'Limited-time access window (24-48 hours)',
        ],
        tips: ['Secure your access credentials immediately', 'Complete critical actions quickly'],
        timeEstimate: 2,
      },
    ],
  },
  {
    id: 'settings-configuration-walkthrough',
    title: 'Configure Vault Settings',
    description: 'Complete guide to customizing your vault settings',
    difficulty: 'intermediate',
    estimatedTime: 20,
    icon: '⚙️',
    steps: [
      {
        id: 'step-1',
        title: 'Access Settings',
        description: 'Navigate to vault settings',
        details: [
          'From dashboard, click "Settings"',
          'Select your vault from the list',
          'You\'ll see various configuration categories',
        ],
        tips: ['Settings are organized by category', 'Some settings require guardian approval'],
        timeEstimate: 2,
      },
      {
        id: 'step-2',
        title: 'Security Settings',
        description: 'Configure security features',
        details: [
          'Two-factor authentication settings',
          'Session timeout configuration',
          'IP whitelist (optional)',
          'Device management',
          'Password requirements',
        ],
        tips: ['Enable all available security features', 'Use strong, unique passwords'],
        timeEstimate: 8,
      },
      {
        id: 'step-3',
        title: 'Notification Settings',
        description: 'Configure how and when you receive alerts',
        details: [
          'Email notifications (all events)',
          'SMS alerts for critical actions',
          'Webhook endpoints',
          'Notification frequency',
          'Quiet hours configuration',
        ],
        tips: ['Enable all notification channels', 'Set up multiple contact methods'],
        timeEstimate: 5,
      },
      {
        id: 'step-4',
        title: 'Transaction Rules',
        description: 'Set rules for automatic transaction handling',
        details: [
          'Spending limits per transaction',
          'Daily withdrawal limits',
          'Recipient whitelisting',
          'Approval rules by amount',
        ],
        tips: ['Start conservative, adjust as needed'],
        timeEstimate: 8,
      },
    ],
  },
];

export function WalkthroughGuides() {
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const active = walkthroughs.find((w) => w.id === selectedWalkthrough);
  const step = active ? active.steps[currentStep] : null;

  const markStepComplete = (stepId: string) => {
    const updated = new Set(completedSteps);
    updated.add(stepId);
    setCompletedSteps(updated);
  };

  const progressPercent = active ? ((completedSteps.size) / active.steps.length) * 100 : 0;

  if (active && step) {
    return (
      <div className="space-y-6">
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-lg border border-emerald-500/30 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setSelectedWalkthrough(null);
                    setCurrentStep(0);
                    setCompletedSteps(new Set());
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ← Back
                </button>
                <span className="text-sm text-gray-400">
                  Step {currentStep + 1} of {active.steps.length}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">{active.title}</h2>
              <p className="text-gray-400">{step.title}</p>
            </div>
            <div className="text-4xl">{active.icon}</div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completedSteps.size} of {active.steps.length} steps completed
          </p>
        </div>

        {/* Step Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-2">{step.description}</h3>
              <p className="text-gray-400 text-sm">{step.title}</p>
            </div>

            {/* Details */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                What to Do
              </h4>
              <ol className="space-y-3">
                {step.details.map((detail, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-300">
                    <span className="font-semibold text-blue-400 min-w-[24px]">{idx + 1}.</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {step.tips.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-blue-300 text-sm">💡 Tips</h4>
                <ul className="space-y-1">
                  {step.tips.map((tip, idx) => (
                    <li key={idx} className="text-xs text-blue-200 flex gap-2">
                      <span>•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {step.warnings && step.warnings.length > 0 && (
              <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-amber-300 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important
                </h4>
                <ul className="space-y-1">
                  {step.warnings.map((warning, idx) => (
                    <li key={idx} className="text-xs text-amber-200 flex gap-2">
                      <span>⚠️</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar - Steps */}
          <div className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <h4 className="font-semibold text-white mb-3 text-sm">Steps</h4>
              <div className="space-y-2">
                {active.steps.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`w-full text-left p-3 rounded transition-all flex items-start gap-3 ${
                      currentStep === idx
                        ? 'bg-emerald-600/30 border border-emerald-500/50'
                        : 'hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {completedSteps.has(s.id) ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400">Step {idx + 1}</div>
                      <div className="text-sm font-medium text-white line-clamp-2">{s.title}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Estimate */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Time for this step</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{step.timeEstimate}</div>
              <p className="text-xs text-gray-500">minutes</p>
            </div>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => markStepComplete(step.id)}
            variant={completedSteps.has(step.id) ? 'outline' : 'default'}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            {completedSteps.has(step.id) ? 'Completed' : 'Mark Complete'}
          </Button>

          <Button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            variant="outline"
            disabled={currentStep === 0}
          >
            ← Previous
          </Button>

          <Button
            onClick={() => setCurrentStep(Math.min(active.steps.length - 1, currentStep + 1))}
            disabled={currentStep === active.steps.length - 1}
            className="gap-2 ml-auto"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-lg border border-emerald-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Interactive Walkthroughs</h2>
        <p className="text-gray-400">
          Step-by-step guided tours to help you complete important tasks. Each walkthrough includes
          detailed instructions, tips, and estimated completion times.
        </p>
      </div>

      {/* Walkthrough Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {walkthroughs.map((walk) => {
          const completionPercent =
            walk.steps.filter((s) => completedSteps.has(s.id)).length / walk.steps.length;

          return (
            <button
              key={walk.id}
              onClick={() => setSelectedWalkthrough(walk.id)}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 hover:border-emerald-500/50 transition-all text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{walk.icon}</div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    walk.difficulty === 'beginner'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : walk.difficulty === 'intermediate'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {walk.difficulty}
                </span>
              </div>

              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors mb-2">
                {walk.title}
              </h3>
              <p className="text-sm text-gray-400 mb-4">{walk.description}</p>

              <div className="space-y-3">
                {/* Progress Bar */}
                {completedSteps.size > 0 && (
                  <div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${(completedSteps.size / walk.steps.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {walk.steps.filter((s) => completedSteps.has(s.id)).length} of{' '}
                      {walk.steps.length} steps completed
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{walk.estimatedTime} min</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span>{walk.steps.length} steps</span>
                  </div>
                  <div className="ml-auto">
                    <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
