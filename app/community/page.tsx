'use client';

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Users, Share, Heart } from "lucide-react";
import { CommunityHighlights } from "@/components/community/community-highlights";

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                  Community Highlights
                </h1>
              </div>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Celebrate the amazing stories, tutorials, and contributions from the SpendGuard community.
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
              <div className="size-10 rounded-lg bg-heart-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-3">
                <Heart size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Featured Stories</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Read real user stories and testimonials about how SpendGuard transformed their fund management.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
              <div className="size-10 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                <Share size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Share Your Story</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Have a great experience with SpendGuard? We'd love to hear and feature your story in our community.
              </p>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
              <div className="size-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Join the Community</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Connect with other users on Discord, Twitter, and GitHub. Ask questions and share ideas.
              </p>
            </div>
          </div>

          {/* Community Highlights Component */}
          <div className="mb-16">
            <CommunityHighlights />
          </div>

          {/* Community Guidelines */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Community Guidelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Be Respectful</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Treat all community members with respect and kindness. We celebrate diverse perspectives and experiences.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Be Helpful</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Share knowledge and help others. Answering questions strengthens the entire community.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Be Constructive</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Provide feedback that helps improve SpendGuard. Critical feedback is welcome when it's constructive.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Be Secure</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Never share private keys or sensitive information. Report security issues responsibly.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/5 dark:to-pink-500/5 border border-purple-200 dark:border-purple-500/20 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Share Your SpendGuard Story
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              Have a tutorial, testimonial, or use case to share? We would love to feature your content and celebrate your contribution to the community!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:community@spendguard.io"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Share className="w-5 h-5" />
                Submit Your Story
              </a>
              <a
                href="https://discord.gg/spendguard"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border text-slate-900 dark:text-white rounded-lg font-semibold hover:shadow-md transition-all"
              >
                Join Discord Community
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
