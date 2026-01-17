'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const COMMUNITY_RESPONSES = {
  'feature': [
    'Great idea! Feature requests are important to us. Have you shared this on our GitHub Discussions? That\'s where the community votes on new features.',
    'Love your enthusiasm! Check out our Feature Roadmap to see what\'s coming next. You can also upvote features you\'d like to see prioritized.',
    'Interesting! Have you considered opening a GitHub issue to discuss this with the community? Our team loves community-driven development.'
  ],
  'help': [
    'Happy to help! What specifically do you need assistance with? Feel free to ask about vaults, guardians, withdrawals, or anything else.',
    'We\'re here to help! Check our Support & Help Center for detailed guides, or ask your question here and we\'ll do our best to assist.',
    'No problem! What can I help you with today? Whether it\'s technical support or general questions about SpendGuard, I\'m here.'
  ],
  'community': [
    'Awesome! Join our Discord server to connect with other users, share your experiences, and get real-time support from the community.',
    'The SpendGuard community is amazing! Check out our Discord, Twitter, and GitHub for community discussions, tutorials, and announcements.',
    'Love the community spirit! We have an active Discord server where you can connect with other SpendGuard users and share ideas.'
  ],
  'deploy': [
    'Great question! Check out our DEPLOYMENT.md guide for step-by-step instructions on deploying contracts to Base Sepolia or mainnet.',
    'Ready to deploy? You can find detailed deployment instructions in our documentation. It covers everything from contract deployment to verification.',
    'Deploying is easier than you think! Our deployment guide walks you through the entire process with all the necessary commands and configurations.'
  ],
  'security': [
    'Security is our top priority! We recommend choosing guardians you truly trust, setting appropriate quorum levels, and regularly monitoring vault activity.',
    'Great security question! Our smart contracts are built with reentrancy protection, signature verification, and other security best practices.',
    'Safety first! Always use multiple guardians, enable timelocks for large transactions, and use the emergency freeze for suspicious activity.'
  ],
  'default': [
    'That\'s an interesting question! Feel free to ask more about SpendGuard, the community, features, or anything else I can help with.',
    'Thanks for reaching out! I\'m here to help. Is there something specific about SpendGuard or the community you\'d like to know more about?',
    'Great question! I\'m happy to help. Let me know if you need more information or have other questions about SpendGuard.'
  ]
};

const GREETING_MESSAGES = [
  'Hey there! 👋 Welcome to the SpendGuard Community. How can I help you today?',
  'Welcome to SpendGuard! 🛡️ What would you like to know about our community or platform?',
  'Hi! I\'m the Community Assistant. Feel free to ask me anything about SpendGuard, features, deployment, or community resources!',
];

export function CommunityChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for keywords to match responses
    if (lowerMessage.includes('feature') || lowerMessage.includes('suggest') || lowerMessage.includes('idea')) {
      return COMMUNITY_RESPONSES.feature[Math.floor(Math.random() * COMMUNITY_RESPONSES.feature.length)];
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('question')) {
      return COMMUNITY_RESPONSES.help[Math.floor(Math.random() * COMMUNITY_RESPONSES.help.length)];
    } else if (lowerMessage.includes('community') || lowerMessage.includes('discord') || lowerMessage.includes('twitter') || lowerMessage.includes('connect')) {
      return COMMUNITY_RESPONSES.community[Math.floor(Math.random() * COMMUNITY_RESPONSES.community.length)];
    } else if (lowerMessage.includes('deploy') || lowerMessage.includes('contract') || lowerMessage.includes('base')) {
      return COMMUNITY_RESPONSES.deploy[Math.floor(Math.random() * COMMUNITY_RESPONSES.deploy.length)];
    } else if (lowerMessage.includes('security') || lowerMessage.includes('safe') || lowerMessage.includes('protect')) {
      return COMMUNITY_RESPONSES.security[Math.floor(Math.random() * COMMUNITY_RESPONSES.security.length)];
    } else {
      return COMMUNITY_RESPONSES.default[Math.floor(Math.random() * COMMUNITY_RESPONSES.default.length)];
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate response delay
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 size-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
        aria-label="Open chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-sm h-96 bg-white dark:bg-surface-dark rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-surface-border">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <h3 className="font-semibold">Community Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader size={16} className="animate-spin" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-surface-border p-4 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask about SpendGuard..."
          className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>

      {/* Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 px-4 pb-3 text-center">
        Community Assistant • For complex issues, visit our Support page
      </div>
    </div>
  );
}
