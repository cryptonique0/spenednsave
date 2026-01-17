'use client';

import { useState } from 'react';
import { Send, AlertCircle, CheckCircle, Clock, Shield, RotateCcw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionButtons?: { label: string; action: string }[];
}

interface RecoveryStep {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
  action?: string;
}

interface VaultRecoveryAssistantProps {
  vaultId?: string;
}

const SAMPLE_RECOVERY_STEPS: RecoveryStep[] = [
  {
    id: '1',
    title: 'Identity Verification',
    status: 'completed',
    description: 'Verify your identity through multi-factor authentication',
    action: 'Verified'
  },
  {
    id: '2',
    title: 'Guardian Approval',
    status: 'in-progress',
    description: 'Get approval from your guardians (2 of 3 needed)',
    action: 'Awaiting approvals'
  },
  {
    id: '3',
    title: 'Recovery Confirmation',
    status: 'pending',
    description: 'Confirm recovery and receive your vault keys',
    action: 'Pending'
  },
  {
    id: '4',
    title: 'Setup Security',
    status: 'pending',
    description: 'Set up new security parameters and backup codes',
    action: 'Pending'
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: "I'm your Vault Recovery Assistant. I'm here to help you regain access to your vault safely and securely. What's your recovery issue?",
    timestamp: new Date(),
    actionButtons: [
      { label: 'Lost Access', action: 'lost-access' },
      { label: 'Forgotten Password', action: 'forgot-password' },
      { label: 'Guardian Recovery', action: 'guardian-recovery' },
      { label: 'Emergency Access', action: 'emergency-access' }
    ]
  }
];

export function VaultRecoveryAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [recoverySteps] = useState<RecoveryStep[]>(SAMPLE_RECOVERY_STEPS);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: generateAssistantResponse(inputValue),
        timestamp: new Date(),
        actionButtons: getNextActions(inputValue)
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAssistantResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes('lost') || input.includes('access')) {
      return "I understand. Let's recover your vault access. First, I'll need to verify your identity. Have you set up two-factor authentication (2FA) on this account?";
    } else if (input.includes('password') || input.includes('forgot')) {
      return "No problem! I can help you reset your password. For security, I'll need to verify your identity through your recovery email and 2FA. Do you have access to both?";
    } else if (input.includes('guardian')) {
      return "Great! Guardian recovery is one of our safest options. Your guardians can help you regain access. We'll need approval from at least 2 of your 3 guardians. Shall I send them recovery requests?";
    } else if (input.includes('emergency')) {
      return "Emergency access is available for critical situations. However, this requires additional verification steps and a 7-day waiting period for security. Would you like to proceed?";
    } else if (input.includes('yes') || input.includes('proceed')) {
      return "Excellent! I'm starting your recovery process. You're currently on Step 1 of 4. Let me guide you through each step carefully. Ready to verify your identity?";
    }
    return "I'm here to help with your vault recovery. Could you provide more details about what you need assistance with?";
  };

  const getNextActions = (userInput: string): { label: string; action: string }[] => {
    const input = userInput.toLowerCase();
    
    if (input.includes('yes') || input.includes('proceed')) {
      return [
        { label: 'Start Verification', action: 'start-verification' },
        { label: 'Contact Support', action: 'contact-support' }
      ];
    }
    return [
      { label: 'Continue', action: 'continue' },
      { label: 'Get Help', action: 'get-help' }
    ];
  };

  const handleActionClick = (action: string) => {
    let response = '';
    
    switch (action) {
      case 'lost-access':
        response = "I understand you've lost access to your vault. Let's work through this together step by step.";
        break;
      case 'forgot-password':
        response = "A password reset is a straightforward process. Let me help you verify your identity first.";
        break;
      case 'guardian-recovery':
        response = "Guardian recovery is an excellent option if you have guardians set up. Let's initiate their approval process.";
        break;
      case 'emergency-access':
        response = "Emergency access is available but comes with additional security checks. Are you sure you need this?";
        break;
      case 'start-verification':
        response = "Starting verification process... Please check your email for a verification code.";
        break;
      case 'contact-support':
        response = "I'm connecting you with our support team. A specialist will be with you shortly.";
        break;
      default:
        response = "Let me help you further with the next steps.";
    }

    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const getStepStatus = (step: RecoveryStep) => {
    switch (step.status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10' };
      case 'in-progress':
        return { icon: Clock, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-950/30' };
      default:
        return { icon: AlertCircle, color: 'text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
            <RotateCcw className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Vault Recovery Assistant
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          🔐 Your vault recovery is protected by multiple layers of security
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Steps */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Recovery Progress
            </h3>
            <div className="space-y-4">
              {recoverySteps.map((step, idx) => {
                const StatusIcon = getStepStatus(step).icon;
                return (
                  <div
                    key={step.id}
                    className="cursor-pointer group"
                  >
                    <div className={`p-4 rounded-lg border transition-all ${
                      step.status === 'completed'
                        ? 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40'
                        : step.status === 'in-progress'
                        ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getStepStatus(step).bgColor}`}>
                          <StatusIcon className={`w-4 h-4 ${getStepStatus(step).color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              Step {idx + 1}
                            </span>
                            <span className={`text-xs font-semibold capitalize ${getStepStatus(step).color}`}>
                              {step.status}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white mt-1">
                            {step.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                    Security Protected
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    All recovery data is encrypted end-to-end. Your keys are never exposed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-surface-dark border border-surface-border dark:border-gray-700 rounded-lg flex flex-col h-[500px]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    {message.actionButtons && message.actionButtons.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actionButtons.map((btn) => (
                          <button
                            key={btn.action}
                            onClick={() => handleActionClick(btn.action)}
                            className={`w-full px-3 py-2 text-xs font-medium rounded transition-colors ${
                              message.role === 'user'
                                ? 'bg-primary-dark hover:bg-primary-darker text-white'
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-surface-border dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask me about recovery options..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-surface-border dark:border-gray-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-sm mb-1">
              Important Security Reminder
            </h4>
            <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <li>• Never share your recovery codes with anyone, not even SpendGuard staff</li>
              <li>• Keep your backup codes in a secure location</li>
              <li>• Use guardians you absolutely trust</li>
              <li>• This process can take 7-10 days for security verification</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
