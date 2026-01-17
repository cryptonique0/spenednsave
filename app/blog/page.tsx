'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronRight, Heart, Share2, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/hooks/useI18n';
import { BlogPostCard } from '@/components/blog/blog-post-card';
import { NewsletterSubscription } from '@/components/blog/newsletter-subscription';
import { RelatedPosts } from '@/components/blog/related-posts';

// Sample blog posts data
const BLOG_POSTS = [
  {
    id: 'welcome-to-blog',
    title: 'Welcome to SpendVault Blog',
    excerpt: 'Stay updated with the latest news, features, and security updates from the SpendVault team.',
    category: 'announcement',
    tags: ['welcome', 'announcement'],
    author: 'SpendVault Team',
    publishedDate: new Date('2026-01-10'),
    readTime: 5,
    featured: true,
    image: '📰',
  },
  {
    id: 'guardian-roles',
    title: 'Introducing Guardian Roles Management',
    excerpt: 'Manage guardian roles more effectively with our new role hierarchy system.',
    category: 'feature',
    tags: ['guardians', 'roles', 'management'],
    author: 'Product Team',
    publishedDate: new Date('2026-01-08'),
    readTime: 7,
    featured: true,
    image: '👥',
  },
  {
    id: 'webauthn-security',
    title: 'Enhanced Security with WebAuthn Support',
    excerpt: 'We now support WebAuthn for stronger authentication methods like YubiKey and Windows Hello.',
    category: 'security',
    tags: ['security', 'webauthn', 'authentication'],
    author: 'Security Team',
    publishedDate: new Date('2026-01-05'),
    readTime: 8,
    featured: false,
    image: '🔐',
  },
  {
    id: 'best-practices',
    title: 'Best Practices for Vault Management',
    excerpt: 'Learn how to set up and manage your vaults effectively with these best practices.',
    category: 'guide',
    tags: ['vaults', 'best-practices', 'tutorial'],
    author: 'Support Team',
    publishedDate: new Date('2026-01-03'),
    readTime: 10,
    featured: false,
    image: '📚',
  },
  {
    id: 'multi-language',
    title: 'SpendVault Now Supports 10 Languages',
    excerpt: 'Expanding our global reach with support for Arabic, Hebrew, and 8 other languages.',
    category: 'announcement',
    tags: ['languages', 'global', 'accessibility'],
    author: 'SpendVault Team',
    publishedDate: new Date('2025-12-28'),
    readTime: 5,
    featured: false,
    image: '🌍',
  },
  {
    id: 'community-update',
    title: 'Community Spotlight: December 2025',
    excerpt: 'Celebrating our amazing community members and their contributions this month.',
    category: 'community',
    tags: ['community', 'spotlight', 'update'],
    author: 'Community Team',
    publishedDate: new Date('2025-12-20'),
    readTime: 6,
    featured: false,
    image: '⭐',
  },
];

const CATEGORIES = ['all', 'announcement', 'feature', 'security', 'guide', 'community', 'development'];

export default function BlogPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t('blog.title')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {t('blog.latestNews')}
              </p>
            </div>
            <Link
              href="/blog"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {t('blog.allPosts')}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={t('blog.searchPosts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {category === 'all'
                  ? t('blog.filterByCategory')
                  : t(`blog.categories.${category}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {t('blog.latestNews')}
          </h2>
          {regularPosts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400">{t('blog.noPostsFound')}</p>
            </div>
          )}
        </div>

        {/* Newsletter Section */}
        <NewsletterSubscription />
      </div>
    </div>
  );
}
