'use client';

import { Heart, MessageCircle, Repeat2, Share, ExternalLink, TrendingUp } from 'lucide-react';

interface CommunityHighlight {
  id: string;
  type: 'tweet' | 'forum' | 'github' | 'testimonial' | 'tutorial';
  author: string;
  avatar: string;
  handle?: string;
  title: string;
  excerpt: string;
  fullText: string;
  timestamp: Date;
  likes: number;
  replies: number;
  reposts: number;
  source: string;
  sourceUrl: string;
  tags: string[];
  featured: boolean;
}

const COMMUNITY_HIGHLIGHTS: CommunityHighlight[] = [
  {
    id: 'h1',
    type: 'testimonial',
    author: 'Alex Chen',
    avatar: '👨‍💼',
    title: 'SpendGuard Saved My DAO Treasury',
    excerpt: 'Implemented SpendGuard for our community treasury and it\'s been incredibly secure and efficient...',
    fullText: 'Implemented SpendGuard for our community treasury and it\'s been incredibly secure and efficient. The guardian voting system is exactly what we needed to ensure transparent fund management. Highly recommend! 🚀',
    timestamp: new Date('2026-01-16'),
    likes: 234,
    replies: 12,
    reposts: 45,
    source: 'Twitter',
    sourceUrl: 'https://twitter.com',
    tags: ['dao', 'treasury', 'security'],
    featured: true,
  },
  {
    id: 'h2',
    type: 'tutorial',
    author: 'Sarah Mitchell',
    avatar: '👩‍🏫',
    title: 'Complete SpendGuard Guardian Setup Guide',
    excerpt: 'Just published a comprehensive guide on setting up guardians and configuring voting quorums...',
    fullText: 'Just published a comprehensive guide on setting up guardians and configuring voting quorums. The step-by-step walkthrough covers everything from adding guardians to handling emergency scenarios. Check it out! 📚',
    timestamp: new Date('2026-01-14'),
    likes: 567,
    replies: 89,
    reposts: 234,
    source: 'Mirror',
    sourceUrl: 'https://mirror.xyz',
    tags: ['tutorial', 'guide', 'guardians'],
    featured: true,
  },
  {
    id: 'h3',
    type: 'github',
    author: 'Developer Community',
    avatar: '👨‍💻',
    handle: '@spendguard-community',
    title: 'Custom Integration: SpendGuard + Snapshot DAO Governance',
    excerpt: 'Created an open-source integration that connects SpendGuard vaults with Snapshot voting...',
    fullText: 'Created an open-source integration that connects SpendGuard vaults with Snapshot voting. Now DAOs can tie treasury management directly to their governance votes! Open-source on GitHub.',
    timestamp: new Date('2026-01-12'),
    likes: 189,
    replies: 34,
    reposts: 78,
    source: 'GitHub',
    sourceUrl: 'https://github.com',
    tags: ['integration', 'open-source', 'dao'],
    featured: false,
  },
  {
    id: 'h4',
    type: 'forum',
    author: 'Jamie Rodriguez',
    avatar: '👩‍💻',
    title: 'Emergency Freeze Mechanism Saved My Vault',
    excerpt: 'When I suspected unauthorized access, hitting the emergency freeze was a lifesaver...',
    fullText: 'When I suspected unauthorized access, hitting the emergency freeze was a lifesaver. The 30-day timelock gave me time to investigate and secure the vault without losing access to funds. This is the kind of recovery option every self-custodial solution needs.',
    timestamp: new Date('2026-01-10'),
    likes: 445,
    replies: 67,
    reposts: 123,
    source: 'Forum',
    sourceUrl: 'https://forum.spendguard.io',
    tags: ['security', 'emergency', 'recovery'],
    featured: true,
  },
  {
    id: 'h5',
    type: 'tweet',
    author: 'Crypto Safety',
    avatar: '🛡️',
    handle: '@cryptosafetyorg',
    title: 'SpendGuard: A New Standard for Wallet Security',
    excerpt: 'SpendGuard represents a significant advancement in wallet security architecture...',
    fullText: 'SpendGuard represents a significant advancement in wallet security architecture. The combination of multi-signature vault security with social recovery is innovative and practical. We\'re excited about what this means for self-custody.',
    timestamp: new Date('2026-01-08'),
    likes: 1203,
    replies: 156,
    reposts: 456,
    source: 'Twitter',
    sourceUrl: 'https://twitter.com',
    tags: ['security', 'innovation', 'wallet'],
    featured: true,
  },
  {
    id: 'h6',
    type: 'tutorial',
    author: 'BlockchainEdu',
    avatar: '📚',
    title: 'DeFi Security Best Practices Using SpendGuard',
    excerpt: 'Comprehensive educational content on implementing proper vault security patterns...',
    fullText: 'Comprehensive educational content on implementing proper vault security patterns. SpendGuard is highlighted as a reference implementation for the guardian voting and emergency recovery concepts.',
    timestamp: new Date('2026-01-06'),
    likes: 789,
    replies: 102,
    reposts: 234,
    source: 'YouTube',
    sourceUrl: 'https://youtube.com',
    tags: ['education', 'defi', 'security'],
    featured: false,
  },
];

export function CommunityHighlights() {
  const featuredHighlights = COMMUNITY_HIGHLIGHTS.filter(h => h.featured);
  const allHighlights = COMMUNITY_HIGHLIGHTS;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tweet':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'forum':
        return 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400';
      case 'github':
        return 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400';
      case 'testimonial':
        return 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400';
      case 'tutorial':
        return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'tweet':
        return '𝕏 Tweet';
      case 'forum':
        return '💬 Forum';
      case 'github':
        return '🐙 GitHub';
      case 'testimonial':
        return '⭐ Testimonial';
      case 'tutorial':
        return '📚 Tutorial';
      default:
        return type;
    }
  };

  const HighlightCard = ({ highlight }: { highlight: CommunityHighlight }) => (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6 hover:shadow-lg transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl">{highlight.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">
                {highlight.author}
              </h3>
              {highlight.handle && (
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {highlight.handle}
                </span>
              )}
            </div>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(highlight.type)}`}>
              {getTypeLabel(highlight.type)}
            </span>
          </div>
        </div>
        {highlight.featured && (
          <div className="text-yellow-500 dark:text-yellow-400" title="Featured">
            ⭐
          </div>
        )}
      </div>

      {/* Content */}
      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
        {highlight.title}
      </h4>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
        {highlight.fullText}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {highlight.tags.map((tag) => (
          <span key={tag} className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats and Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-surface-border">
        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 hover:text-red-500 cursor-pointer transition-colors">
            <Heart size={16} />
            <span>{highlight.likes > 1000 ? (highlight.likes / 1000).toFixed(1) + 'k' : highlight.likes}</span>
          </div>
          <div className="flex items-center gap-1 hover:text-blue-500 cursor-pointer transition-colors">
            <MessageCircle size={16} />
            <span>{highlight.replies}</span>
          </div>
          <div className="flex items-center gap-1 hover:text-green-500 cursor-pointer transition-colors">
            <Repeat2 size={16} />
            <span>{highlight.reposts}</span>
          </div>
        </div>
        <a
          href={highlight.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
          title="Open original post"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Metadata */}
      <div className="text-xs text-slate-400 dark:text-slate-500 mt-3">
        {highlight.timestamp.toLocaleDateString()} • {highlight.source}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Trending Section */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Trending & Featured
          </h2>
        </div>

        {featuredHighlights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {featuredHighlights.slice(0, 2).map((highlight) => (
              <HighlightCard key={highlight.id} highlight={highlight} />
            ))}
          </div>
        )}

        {featuredHighlights.length > 2 && (
          <div className="mb-8">
            <HighlightCard highlight={featuredHighlights[2]} />
          </div>
        )}
      </div>

      {/* All Community Highlights */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
          Community Highlights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allHighlights.map((highlight) => (
            <HighlightCard key={highlight.id} highlight={highlight} />
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-8 text-center">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Share Your SpendGuard Story
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
          Have a great experience with SpendGuard? Share your story, tutorial, or use case with the community. We'd love to feature your content!
        </p>
        <a
          href="mailto:community@spendguard.io"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <Share className="w-5 h-5" />
          Share Your Story
        </a>
      </div>
    </div>
  );
}
