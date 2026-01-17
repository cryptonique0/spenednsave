'use client';

import Link from 'next/link';
import { Heart, Share2, MessageCircle } from 'lucide-react';
import { useI18n } from '@/lib/hooks/useI18n';
import { useState } from 'react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  publishedDate: Date;
  readTime: number;
  featured?: boolean;
  image?: string;
}

interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  const { t } = useI18n();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100) + 10);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: `/blog/${post.id}`,
      });
    } else {
      const url = `${window.location.origin}/blog/${post.id}`;
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <article className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image/Icon */}
      <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 aspect-video flex items-center justify-center text-5xl">
        {post.image || '📝'}
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Category and Date */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
            {t(`blog.categories.${post.category}`)}
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {post.publishedDate.toLocaleDateString()}
          </span>
        </div>

        {/* Title */}
        <Link href={`/blog/${post.id}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2 cursor-pointer">
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex-1">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
            >
              #{tag}
            </span>
          ))}
          {post.tags.length > 2 && (
            <span className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400">
              +{post.tags.length - 2}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <p className="font-medium">{post.author}</p>
            <p>{post.readTime} min read</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-lg transition-all ${
                liked
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
              title={liked ? 'Unlike' : 'Like'}
            >
              <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <Link
              href={`/blog/${post.id}`}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              title="Read More"
            >
              <MessageCircle className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
