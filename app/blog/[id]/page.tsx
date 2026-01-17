'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Share2, MessageCircle, Bookmark, Clock, User } from 'lucide-react';
import { useI18n } from '@/lib/hooks/useI18n';
import { RelatedPosts } from '@/components/blog/related-posts';

const BLOG_POSTS_DATA = {
  'welcome-to-blog': {
    title: 'Welcome to SpendVault Blog',
    author: 'SpendVault Team',
    publishedDate: new Date('2026-01-10'),
    readTime: 5,
    category: 'announcement',
    tags: ['welcome', 'announcement', 'news'],
    image: '📰',
    content: `
      <p>Welcome to our official blog! We're excited to share the latest news, feature announcements, security updates, and helpful guides to get the most out of SpendVault.</p>
      
      <h2>What to Expect</h2>
      <p>On this blog, you'll find:</p>
      <ul>
        <li><strong>Feature Announcements:</strong> Be the first to learn about new features and improvements</li>
        <li><strong>Security Updates:</strong> Stay informed about security enhancements and best practices</li>
        <li><strong>Guides & Tutorials:</strong> Learn how to use SpendVault effectively</li>
        <li><strong>Community Spotlights:</strong> Celebrate amazing community members</li>
        <li><strong>Product Updates:</strong> Track our development progress and roadmap</li>
      </ul>
      
      <h2>Subscribe to Stay Updated</h2>
      <p>Don't miss any important updates! Subscribe to our newsletter to get the latest news delivered to your inbox.</p>
      
      <h2>Get in Touch</h2>
      <p>Have questions or feedback? We'd love to hear from you! Feel free to reach out through our contact page or social media channels.</p>
    `,
  },
  'guardian-roles': {
    title: 'Introducing Guardian Roles Management',
    author: 'Product Team',
    publishedDate: new Date('2026-01-08'),
    readTime: 7,
    category: 'feature',
    tags: ['guardians', 'roles', 'management', 'feature'],
    image: '👥',
    content: `
      <p>We're excited to announce a major update to our guardian management system. The new role hierarchy system allows you to organize guardians by their responsibilities and permissions.</p>
      
      <h2>New Role Types</h2>
      <p>With the new update, you can now assign guardians to three different roles:</p>
      <ul>
        <li><strong>Primary Guardian:</strong> Full authority over vault operations</li>
        <li><strong>Secondary Guardian:</strong> Limited approval authority</li>
        <li><strong>Tertiary Guardian:</strong> Monitoring and advisory role</li>
      </ul>
      
      <h2>Key Features</h2>
      <ul>
        <li>Flexible role assignment based on guardian responsibility</li>
        <li>Permission controls per role</li>
        <li>Easy role transitions and updates</li>
        <li>Audit logging for all role changes</li>
      </ul>
      
      <h2>How to Use</h2>
      <p>Navigate to your vault settings and select "Manage Guardians" to assign roles to your guardians. The new interface provides an intuitive way to manage permissions and responsibilities.</p>
    `,
  },
  'webauthn-security': {
    title: 'Enhanced Security with WebAuthn Support',
    author: 'Security Team',
    publishedDate: new Date('2026-01-05'),
    readTime: 8,
    category: 'security',
    tags: ['security', 'webauthn', 'authentication', 'hardware-keys'],
    image: '🔐',
    content: `
      <p>Security is our top priority. We've added WebAuthn support to provide you with even stronger authentication options using hardware security keys.</p>
      
      <h2>What is WebAuthn?</h2>
      <p>WebAuthn is a web standard that enables passwordless authentication using hardware security keys like YubiKey, Windows Hello, Touch ID, and Face ID.</p>
      
      <h2>Supported Devices</h2>
      <ul>
        <li><strong>YubiKey:</strong> Industry-standard hardware security key</li>
        <li><strong>Windows Hello:</strong> Built-in biometric authentication for Windows</li>
        <li><strong>Touch ID:</strong> Biometric authentication on Mac and iOS</li>
        <li><strong>Face ID:</strong> Facial recognition on iPhone and iPad</li>
        <li><strong>Android Biometric:</strong> Native biometric support on Android devices</li>
      </ul>
      
      <h2>Why Use WebAuthn?</h2>
      <ul>
        <li>Eliminates password-related vulnerabilities</li>
        <li>Provides phishing-proof authentication</li>
        <li>Supports passwordless sign-in</li>
        <li>Works across multiple devices</li>
      </ul>
      
      <h2>Getting Started</h2>
      <p>Go to your account security settings and click "Add Security Key" to register your WebAuthn device. Follow the on-screen prompts to complete the setup.</p>
    `,
  },
};

const ALL_POSTS = Object.entries(BLOG_POSTS_DATA).map(([id, data]) => ({
  id,
  title: data.title,
  category: data.category,
  publishedDate: data.publishedDate,
}));

export default function BlogPostPage({ params }: { params: { id: string } }) {
  const { t } = useI18n();
  const post = BLOG_POSTS_DATA[params.id as keyof typeof BLOG_POSTS_DATA];
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Post Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            The blog post you're looking for doesn't exist.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        url: `/blog/${params.id}`,
      });
    } else {
      const url = `${window.location.origin}/blog/${params.id}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('blog.backToBlog')}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <article className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase">
              {t(`blog.categories.${post.category}`)}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {post.publishedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {post.title}
          </h1>

          {/* Hero Image */}
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 aspect-video rounded-lg flex items-center justify-center text-7xl mb-8">
            {post.image || '📝'}
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-lg transition-all ${
                  liked
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Heart className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`p-2 rounded-lg transition-all ${
                  bookmarked
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Bookmark className="w-5 h-5" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none mb-12">
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
            className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-4"
          />
        </div>

        {/* Tags */}
        <div className="mb-12 pb-8 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            {t('blog.tags')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${tag}`}
                className="px-3 py-1 rounded-full text-sm bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Related Posts */}
        <RelatedPosts posts={ALL_POSTS} currentPostId={params.id} />
      </article>
    </div>
  );
}
