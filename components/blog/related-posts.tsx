'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/hooks/useI18n';

interface RelatedPost {
  id: string;
  title: string;
  category: string;
  publishedDate: Date;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  currentPostId: string;
}

export function RelatedPosts({ posts, currentPostId }: RelatedPostsProps) {
  const { t } = useI18n();
  const relatedPosts = posts.filter((post) => post.id !== currentPostId).slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
        {t('blog.relatedPosts')}
      </h3>

      <div className="grid md:grid-cols-3 gap-4">
        {relatedPosts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                {t(`blog.categories.${post.category}`)}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>

            <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
              {post.title}
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {post.publishedDate.toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
