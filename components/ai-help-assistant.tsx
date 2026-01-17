'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Copy, Check, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIHelpTopic {
  id: string;
  title: string;
  icon: string;
  keywords: string[];
}

const HELP_TOPICS: AIHelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    keywords: ['setup', 'start', 'begin', 'first', 'tutorial', 'onboarding']
  },
  {
    id: 'guardians',
    title: 'Managing Guardians',
    icon: '👥',
    keywords: ['guardian', 'add', 'remove', 'voting', 'quorum', 'approval']
  },
  {
    id: 'withdrawal',
    title: 'Withdrawals & Spending',
    icon: '💰',
    keywords: ['withdraw', 'spend', 'transaction', 'limits', 'timelock']
  },
  {
    id: 'security',
    title: 'Security & Safety',
    icon: '🔒',
    keywords: ['security', 'safe', 'protection', 'freeze', 'emergency', 'safety']
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    icon: '⚙️',
    keywords: ['settings', 'preferences', 'config', 'language', 'theme', 'notification']
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    keywords: ['help', 'problem', 'error', 'issue', 'bug', 'troubleshoot', 'fix']
  }
];

const KNOWLEDGE_BASE = {
  'getting-started': {
    title: 'Getting Started with SpendGuard',
    content: `Welcome to SpendGuard! Here's how to get started:

1. **Create Your Vault**: Set up your smart vault by choosing a quorum (how many guardians must approve withdrawals)
2. **Add Guardians**: Invite trusted friends or family as guardians via email or wallet address
3. **Configure Settings**: Set spending limits, timelock periods, and notification preferences
4. **Make Your First Deposit**: Transfer funds to your vault address (works with ETH and ERC-20 tokens)
5. **Test a Withdrawal**: Request a withdrawal to familiarize yourself with the approval process

Pro tip: Start with a small amount to test the process before depositing large amounts!`
  },
  'guardians': {
    title: 'Managing Your Guardians',
    content: `Guardians are trusted individuals who help protect your vault:

**Adding Guardians**:
- Click "Add Guardian" in your vault settings
- Enter their email or wallet address
- They'll receive an invitation and can accept via our app
- Once accepted, they gain voting power immediately

**Guardian Responsibilities**:
- Review and approve/reject withdrawal requests
- Vote on vault setting changes
- Maintain account security
- Response within timelock period (default 30 days)

**Removing Guardians**:
- Click the guardian's profile in your vault
- Select "Remove Guardian"
- Change becomes effective after current voting period
- No access to funds or approvals after removal`
  },
  'withdrawal': {
    title: 'Making Withdrawals',
    content: `Three ways to withdraw from your SpendGuard vault:

**Standard Withdrawal** (Recommended):
1. Click "Request Withdrawal"
2. Enter amount and recipient
3. Guardians vote on the request
4. Withdraw once you have quorum approval
5. Funds arrive in 1-2 blocks

**Emergency Withdrawal** (After Timelock):
- Request withdrawal without guardian approval
- Wait 30 days for the timelock to expire
- Then claim funds automatically
- Use this if guardians are unavailable

**Batch Withdrawal** (Multiple Requests):
- Combine multiple withdrawal requests into one transaction
- Saves gas fees
- Requires same level of approval as standard withdrawals`
  },
  'security': {
    title: 'Security Best Practices',
    content: `Keep your vault secure:

**Vault Protection**:
- Set a reasonable quorum (majority is safest)
- Choose guardians you trust deeply
- Enable two-factor authentication
- Review guardian activity logs regularly

**Emergency Freeze**:
- Immediately pause all vault operations
- Useful if you suspect unauthorized access
- You maintain access to frozen funds
- Guardians can vote to unfreeze after review

**WebAuthn Security**:
- Use hardware keys (YubiKey, Titan) when possible
- Register multiple WebAuthn devices as backup
- Store recovery codes in a safe place
- Never share your recovery codes

**Timelock Mechanism**:
- Solo withdrawals have a 30-day timelock
- Provides recovery window if vault is compromised
- Emergency freeze blocks solo withdrawals during freeze`
  },
  'settings': {
    title: 'Customizing Your Experience',
    content: `Configure SpendGuard to suit your needs:

**General Settings**:
- Language (8 languages supported: English, Spanish, French, German, Chinese, Japanese, Portuguese, Russian)
- Theme (Light/Dark/Auto)
- Currency display preference

**Vault Settings**:
- Spending limits per guardian/period
- Timelock duration
- Guardian voting quorum
- Activity notifications

**Notifications**:
- Email alerts for withdrawal requests
- Guardian action reminders
- Security alerts
- Weekly activity summaries

**Privacy**:
- Control what data is visible to guardians
- Hide balance from certain guardians
- Customize activity log visibility`
  },
  'troubleshooting': {
    title: 'Common Issues & Solutions',
    content: `**Guardian Invitation Not Received?**
- Check spam folder
- Verify email address is correct
- Resend invitation from vault settings
- Contact support if persistent

**Withdrawal Request Stuck?**
- Check if quorum has been reached
- Verify guardians have voted
- Check timelock hasn't been exceeded
- Contact guardians if unresponsive

**Can't Connect Wallet?**
- Clear browser cache and cookies
- Try a different browser
- Check wallet extension is updated
- Ensure you're on the correct network (Base)

**Transaction Failed?**
- Ensure you have enough gas fees
- Check wallet has required token balance
- Verify no spending limit conflicts
- Try again after a few moments`
  }
};

export function AIHelpAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hi! I'm your SpendGuard AI Assistant. I'm here to help you learn about vaults, guardians, withdrawals, and more. What would you like help with today?",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findRelevantTopic = (userInput: string): AIHelpTopic | null => {
    const lowerInput = userInput.toLowerCase();
    for (const topic of HELP_TOPICS) {
      for (const keyword of topic.keywords) {
        if (lowerInput.includes(keyword)) {
          return topic;
        }
      }
    }
    return null;
  };

  const generateResponse = (userInput: string): string => {
    const topic = findRelevantTopic(userInput);
    
    if (topic && KNOWLEDGE_BASE[topic.id as keyof typeof KNOWLEDGE_BASE]) {
      const kb = KNOWLEDGE_BASE[topic.id as keyof typeof KNOWLEDGE_BASE];
      return `${kb.title}\n\n${kb.content}`;
    }

    // Default responses for common patterns
    if (userInput.toLowerCase().includes('hello') || userInput.toLowerCase().includes('hi')) {
      return "Hello! 👋 I'm here to help you with SpendGuard. You can ask me about:\n- Getting started\n- Managing guardians\n- Making withdrawals\n- Security best practices\n- Settings and preferences\n- Troubleshooting\n\nWhat would you like to know?";
    }

    if (userInput.toLowerCase().includes('help') || userInput.toLowerCase().includes('?')) {
      return "I can help you with various topics! Here are some things you might ask about:\n\n1. **Getting Started** - How to set up your vault\n2. **Managing Guardians** - Adding/removing guardians\n3. **Withdrawals** - How to request and claim withdrawals\n4. **Security** - Best practices and emergency features\n5. **Settings** - Customizing your experience\n6. **Troubleshooting** - Common issues and solutions\n\nJust ask me about any of these topics!";
    }

    return "That's a great question! Based on your query, I'd recommend checking:\n\n- Our documentation in the Help Center\n- The relevant section in Settings\n- Contacting support@spendguard.io for specific issues\n\nIs there a specific topic I can help you with?";
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `user-${messages.length}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const assistantResponse: Message = {
        id: `assistant-${messages.length + 1}`,
        role: 'assistant',
        content: generateResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
    }, 500);
  };

  const handleQuickQuestion = (topic: AIHelpTopic) => {
    const question = `Tell me about ${topic.title.toLowerCase()}`;
    setInputValue('');
    
    const userMessage: Message = {
      id: `user-${messages.length}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const kb = KNOWLEDGE_BASE[topic.id as keyof typeof KNOWLEDGE_BASE];
      const assistantResponse: Message = {
        id: `assistant-${messages.length + 1}`,
        role: 'assistant',
        content: `${kb.title}\n\n${kb.content}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
    }, 500);
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 size-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all z-40 flex items-center justify-center group"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles className="relative w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col border border-gray-200 dark:border-surface-border z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <div>
                <h3 className="font-bold text-sm">SpendGuard AI Helper</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/20">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg relative group ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-900 dark:text-white rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(message.id, message.content)}
                      className="absolute -top-8 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-lg rounded-bl-none p-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && !isLoading && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Quick topics:</p>
                {HELP_TOPICS.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleQuickQuestion(topic)}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="mr-2">{topic.icon}</span>
                    {topic.title}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-surface-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-border bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
