'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Copy, Check, MessageCircle, Search } from 'lucide-react';

interface FAQMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedFAQs?: string[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  helpfulness?: number;
}

const FAQS: FAQ[] = [
  {
    id: 'faq-1',
    question: 'What is SpendGuard?',
    answer: 'SpendGuard is a decentralized smart vault that uses multi-signature approval and guardians to protect your cryptocurrency funds. It allows you to set spending limits, timelocks, and require multiple approvals for large transactions.',
    category: 'General',
    tags: ['getting-started', 'overview', 'what-is']
  },
  {
    id: 'faq-2',
    question: 'How do I create a vault?',
    answer: 'To create a vault: 1) Connect your wallet, 2) Go to Dashboard, 3) Click "Create Vault", 4) Set your quorum (number of guardians needed to approve), 5) Configure spending limits and timelocks, 6) Deploy your vault. You can then invite guardians to help protect your funds.',
    category: 'Getting Started',
    tags: ['setup', 'create-vault', 'first-steps']
  },
  {
    id: 'faq-3',
    question: 'What are guardians?',
    answer: 'Guardians are trusted individuals you invite to your vault. They review and approve withdrawal requests, vote on vault settings changes, and help protect your funds. You can have multiple guardians, and you set a quorum—the number of guardians whose approval is required for transactions.',
    category: 'Guardians',
    tags: ['guardians', 'approval', 'security']
  },
  {
    id: 'faq-4',
    question: 'How do I add a guardian?',
    answer: 'In your vault settings, click "Add Guardian", enter their email or wallet address, and send an invitation. They\'ll receive a notification and can accept through SpendGuard. Once accepted, they immediately gain voting power on your vault. You can also remove guardians anytime.',
    category: 'Guardians',
    tags: ['add-guardian', 'invite', 'manage']
  },
  {
    id: 'faq-5',
    question: 'What is a quorum?',
    answer: 'A quorum is the minimum number of guardians whose approval is required for a transaction. For example, if you have 3 guardians and set a quorum of 2, then any 2 of them must approve a withdrawal. This provides security through consensus.',
    category: 'Guardians',
    tags: ['quorum', 'approval-threshold', 'voting']
  },
  {
    id: 'faq-6',
    question: 'How do I withdraw funds?',
    answer: 'To withdraw: 1) Click "Request Withdrawal", 2) Enter the amount and recipient address, 3) Set the reason/description, 4) Submit the request. Your guardians will receive a notification to vote. Once the quorum approves and the timelock expires, you can execute the withdrawal.',
    category: 'Withdrawals',
    tags: ['withdraw', 'transaction', 'request']
  },
  {
    id: 'faq-7',
    question: 'What is a timelock?',
    answer: 'A timelock is a delay period set on your vault that requires transactions to wait before execution. For example, with a 7-day timelock, after guardians approve a withdrawal, you must wait 7 days before executing it. This adds an extra security layer to detect and prevent unauthorized transactions.',
    category: 'Security',
    tags: ['timelock', 'delay', 'safety']
  },
  {
    id: 'faq-8',
    question: 'Can I emergency freeze my vault?',
    answer: 'Yes! SpendGuard includes an Emergency Freeze feature. If you suspect unauthorized activity or compromise, click "Emergency Freeze" to immediately lock your vault. No transactions can occur until the freeze is lifted, giving you time to investigate and secure your account.',
    category: 'Security',
    tags: ['emergency-freeze', 'security', 'lock']
  },
  {
    id: 'faq-9',
    question: 'What spending limits can I set?',
    answer: 'You can set multiple spending limits: 1) Daily limit - max you can spend in 24 hours, 2) Weekly limit - max in 7 days, 3) Monthly limit - max in 30 days, 4) Per-transaction limit - max for single transactions. These apply to immediate withdrawals below the quorum threshold.',
    category: 'Spending',
    tags: ['spending-limits', 'daily-limit', 'constraints']
  },
  {
    id: 'faq-10',
    question: 'How does the dashboard analytics work?',
    answer: 'Your dashboard shows: spending trends over time, guardian approval rates, transaction history, security status, and vault performance. You can filter by date range, transaction type, and guardian. Charts help you identify patterns and make informed decisions about your vault settings.',
    category: 'Analytics',
    tags: ['analytics', 'dashboard', 'reports']
  },
  {
    id: 'faq-11',
    question: 'Is my vault secure?',
    answer: 'SpendGuard uses multiple security layers: 1) Smart contract audit, 2) Multi-signature requirements, 3) Timelock delays, 4) Guardian voting, 5) Emergency freeze, 6) Spending limits. Your private keys never leave your wallet. However, always verify guardian identities and be cautious with permissions.',
    category: 'Security',
    tags: ['security', 'audit', 'protection']
  },
  {
    id: 'faq-12',
    question: 'What tokens does SpendGuard support?',
    answer: 'SpendGuard supports ETH and all ERC-20 tokens on Ethereum and Sepolia testnet. You can mix different tokens in your vault. Each token can have its own spending limits and settings. Staking and special token support may be coming in future updates.',
    category: 'Tokens',
    tags: ['tokens', 'erc20', 'eth', 'supported']
  },
  {
    id: 'faq-13',
    question: 'How do I change vault settings?',
    answer: 'Settings changes (quorum, guardians, limits, timelocks) require guardian voting just like withdrawals. Click "Edit Vault Settings", make your changes, and submit for voting. Once approved by the quorum, changes take effect immediately. This prevents one person from unilaterally changing security settings.',
    category: 'Settings',
    tags: ['settings', 'edit', 'voting']
  },
  {
    id: 'faq-14',
    question: 'Can I recover a rejected withdrawal?',
    answer: 'Yes. If a withdrawal is rejected, you can submit a new withdrawal request. The previous request cannot be resubmitted—you must create a fresh one. This prevents replay attacks and ensures each transaction is independently reviewed.',
    category: 'Withdrawals',
    tags: ['rejected', 'retry', 'resubmit']
  },
  {
    id: 'faq-15',
    question: 'What happens if a guardian becomes unavailable?',
    answer: 'If a guardian can\'t approve transactions, withdrawals requiring their vote will be delayed. You can remove the unavailable guardian and add a replacement. Any pending votes from them are discarded when removed. Consider having more guardians than your quorum requires.',
    category: 'Guardians',
    tags: ['unavailable', 'remove', 'replacement']
  },
  {
    id: 'faq-16',
    question: 'How do I enable notifications?',
    answer: 'Go to Settings > Notifications and enable: withdrawal requests, guardian approvals, vault changes, security alerts, and system updates. You can choose email, in-app, or both. Critical security alerts are always enabled to keep you informed.',
    category: 'Settings',
    tags: ['notifications', 'alerts', 'preferences']
  },
  {
    id: 'faq-17',
    question: 'Is there a fee for using SpendGuard?',
    answer: 'SpendGuard is free to use on Sepolia testnet. On mainnet, there are network fees (gas costs for transactions) paid to the Ethereum network, not SpendGuard. We may introduce optional premium features in the future with additional benefits.',
    category: 'General',
    tags: ['fees', 'pricing', 'cost']
  },
  {
    id: 'faq-18',
    question: 'How do I contact support?',
    answer: 'Use our support page for common questions, reach out via Discord community for peer support, or email support@spendguard.io for technical issues. We also have security advisories at /security-advisories and detailed documentation in-app.',
    category: 'Support',
    tags: ['contact', 'help', 'support']
  }
];

const NLP_KEYWORDS: { [key: string]: string[] } = {
  'faq-1': ['what', 'is', 'spendguard', 'about', 'name'],
  'faq-2': ['create', 'make', 'setup', 'new', 'vault', 'deploy'],
  'faq-3': ['guardian', 'who', 'what', 'role', 'helper'],
  'faq-4': ['add', 'invite', 'guardian', 'new', 'manage'],
  'faq-5': ['quorum', 'approval', 'how', 'many', 'threshold'],
  'faq-6': ['withdraw', 'send', 'money', 'take', 'out'],
  'faq-7': ['timelock', 'delay', 'wait', 'period'],
  'faq-8': ['freeze', 'emergency', 'lock', 'security', 'issue'],
  'faq-9': ['limit', 'spend', 'maximum', 'cap', 'amount'],
  'faq-10': ['analytics', 'dashboard', 'report', 'chart', 'data'],
  'faq-11': ['secure', 'safe', 'safety', 'protection', 'trust'],
  'faq-12': ['token', 'erc20', 'eth', 'coin', 'support'],
  'faq-13': ['settings', 'change', 'edit', 'modify', 'configure'],
  'faq-14': ['rejected', 'failed', 'cancel', 'deny', 'recover'],
  'faq-15': ['guardian', 'unavailable', 'missing', 'remove', 'offline'],
  'faq-16': ['notification', 'alert', 'email', 'message'],
  'faq-17': ['fee', 'cost', 'price', 'payment', 'charge'],
  'faq-18': ['contact', 'support', 'help', 'email', 'reach']
};

function findRelevantFAQs(userInput: string): string[] {
  const input = userInput.toLowerCase();
  const relevant: string[] = [];

  for (const [faqId, keywords] of Object.entries(NLP_KEYWORDS)) {
    const matchCount = keywords.filter(keyword => input.includes(keyword)).length;
    if (matchCount > 0) {
      relevant.push(faqId);
    }
  }

  return relevant.sort((a, b) => {
    const aMatches = NLP_KEYWORDS[a].filter(k => input.includes(k)).length;
    const bMatches = NLP_KEYWORDS[b].filter(k => input.includes(k)).length;
    return bMatches - aMatches;
  }).slice(0, 3);
}

function generateAssistantResponse(userInput: string, relatedFAQs: string[]): string {
  const input = userInput.toLowerCase();

  if (relatedFAQs.length > 0) {
    const faqId = relatedFAQs[0];
    const faq = FAQS.find(f => f.id === faqId);
    if (faq) {
      const followUp = relatedFAQs.length > 1 ? 'I found other related articles too. Would you like me to share those?' : 'Is there anything else you would like to know?';
      return `Based on your question, I found this helpful information:\n\n**${faq.question}**\n${faq.answer}\n\n${followUp}`;
    }
  }

  if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
    return 'Hello! Welcome to SpendGuard support. I can help you with questions about vaults, guardians, withdrawals, security, and more. What would you like to know?';
  }

  if (input.includes('thanks') || input.includes('thank you')) {
    return 'You are welcome! If you have any other questions about SpendGuard, feel free to ask. Happy to help!';
  }

  if (input.includes('?')) {
    return 'I am not sure about that specific question. Try searching our FAQ database or contact our support team at support@spendguard.io. You can also ask about: vaults, guardians, withdrawals, security, spending limits, settings, and more.';
  }

  return 'I did not quite understand that. Could you rephrase your question or ask about a specific SpendGuard feature?';
}

interface FAQChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function FAQChatbot({ isOpen = false, onClose }: FAQChatbotProps) {
  const [messages, setMessages] = useState<FAQMessage[]>([
    {
      id: 'assistant-0',
      role: 'assistant',
      content: 'Welcome to SpendGuard FAQ! 👋 Ask me anything about vaults, guardians, withdrawals, security, or settings. I can also search our knowledge base for you.',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen_, setIsOpen_] = useState(isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: FAQMessage = {
      id: `user-${messages.length}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const relatedFAQs = findRelevantFAQs(inputValue);
    const response = generateAssistantResponse(inputValue, relatedFAQs);

    setTimeout(() => {
      const assistantMessage: FAQMessage = {
        id: `assistant-${messages.length + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        relatedFAQs: relatedFAQs.slice(0, 2)
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 500);
  };

  const handleQuickQuestion = (faqId: string) => {
    const faq = FAQS.find(f => f.id === faqId);
    if (!faq) return;

    const userMessage: FAQMessage = {
      id: `user-${messages.length}`,
      role: 'user',
      content: faq.question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const assistantMessage: FAQMessage = {
        id: `assistant-${messages.length + 1}`,
        role: 'assistant',
        content: faq.answer,
        timestamp: new Date(),
        relatedFAQs: [faqId]
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 300);
  };

  const handleCopyMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      navigator.clipboard.writeText(message.content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  if (!isOpen_) {
    return (
      <button
        onClick={() => setIsOpen_(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-40 flex items-center justify-center"
        aria-label="Open FAQ Chatbot"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-surface-dark rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-surface-dark-secondary">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-lg flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Search size={20} />
          <h3 className="font-semibold">FAQ Assistant</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen_(false);
            onClose?.();
          }}
          className="hover:bg-blue-700 p-1 rounded transition-colors"
          aria-label="Close chatbot"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-bl-none shadow-sm border border-gray-200 dark:border-slate-700'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words font-medium">{message.content}</p>
              {message.relatedFAQs && message.relatedFAQs.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.relatedFAQs.map(faqId => {
                    const faq = FAQS.find(f => f.id === faqId);
                    return faq ? (
                      <button
                        key={faqId}
                        onClick={() => handleQuickQuestion(faqId)}
                        className={`block w-full text-left text-xs p-2 rounded transition-colors font-semibold ${
                          message.role === 'user'
                            ? 'bg-blue-500 hover:bg-blue-400 text-white'
                            : 'bg-blue-50 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-slate-600 text-gray-800 dark:text-white'
                        }`}
                      >
                        {faq.question}
                      </button>
                    ) : null;
                  })}
                </div>
              )}
              {message.role === 'assistant' && (
                <button
                  onClick={() => handleCopyMessage(message.id)}
                  className="mt-2 text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1"
                >
                  {copiedMessageId === message.id ? (
                    <>
                      <Check size={14} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-lg rounded-bl-none p-4 border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-surface-dark">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a question..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleQuickQuestion('faq-2')}
            className="text-xs px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-gray-700 dark:text-white font-medium truncate"
          >
            Create Vault
          </button>
          <button
            onClick={() => handleQuickQuestion('faq-3')}
            className="text-xs px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-gray-700 dark:text-white font-medium truncate"
          >
            What are Guardians?
          </button>
          <button
            onClick={() => handleQuickQuestion('faq-6')}
            className="text-xs px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-gray-700 dark:text-white font-medium truncate"
          >
            Withdraw Funds
          </button>
          <button
            onClick={() => handleQuickQuestion('faq-8')}
            className="text-xs px-3 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors text-gray-700 dark:text-white font-medium truncate"
          >
            Emergency Freeze
          </button>
        </div>
      </div>
    </div>
  );
}
