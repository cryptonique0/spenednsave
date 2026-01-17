'use client';

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Newspaper, Package, AlertTriangle, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CommunityHighlights } from "@/components/community/community-highlights";

export default function UpdatesAndAnnouncementsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col justify-start px-6 py-8 md:px-8 md:py-12">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Newspaper size={24} />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
                  Updates & Announcements
                </h1>
              </div>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
              Stay informed about the latest features, security updates, and community highlights from SpendGuard.
            </p>
          </div>

          {/* Hub Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Feature Releases */}
            <Link href="/feature-releases" className="group">
              <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="size-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <Package size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Feature Release Notes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Discover new features, improvements, and updates to SpendGuard
                </p>
                <div className="flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                  View Releases <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Security Advisories */}
            <Link href="/security-advisories" className="group">
              <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="size-12 rounded-xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Security Advisories
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Important security updates and vulnerability information
                </p>
                <div className="flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                  View Advisories <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Blog */}
            <Link href="/blog" className="group">
              <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="size-12 rounded-xl bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
                  <Newspaper size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Blog & Articles
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Read educational content, tutorials, and announcements
                </p>
                <div className="flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                  Read Blog <ArrowRight size={16} />
                </div>
              </div>
            </Link>

            {/* Community */}
            <Link href="/community" className="group">
              <div className="h-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-2xl p-6 hover:shadow-lg transition-all">
                <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Community Highlights
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Celebrate community stories, tutorials, and testimonials
                </p>
                <div className="flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                  View Highlights <ArrowRight size={16} />
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Updates Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
              Recent Updates
            </h2>

            <div className="space-y-6">
              {/* Update 1 */}
              <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                        Feature Release
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        January 18, 2026
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Version 2.5.0 Released - Guardian Signature Validation
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                      Major security update with enhanced signature validation, improved emergency freeze mechanism, and real-time activity monitoring for guardians. This release also includes new WebAuthn support and community highlights features.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-surface-border">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      #security
                    </span>
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      #features
                    </span>
                  </div>
                  <Link
                    href="/feature-releases"
                    className="text-primary hover:underline font-semibold text-sm"
                  >
                    Read Full Release Notes →
                  </Link>
                </div>
              </div>

              {/* Update 2 */}
              <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400">
                        Security Advisory
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        January 15, 2026
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      CVE-2026-1234 - Guardian Signature Replay Prevention
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                      A high-severity vulnerability has been fixed in version 2.5.0. Guardian approvals can no longer be replayed across different withdrawal requests. All users should upgrade immediately.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-surface-border">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-full font-semibold">
                      #critical
                    </span>
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      #resolved
                    </span>
                  </div>
                  <Link
                    href="/security-advisories"
                    className="text-primary hover:underline font-semibold text-sm"
                  >
                    View Advisory Details →
                  </Link>
                </div>
              </div>

              {/* Update 3 */}
              <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-surface-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                        Community Highlight
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        January 16, 2026
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      Featured: SpendGuard Saved My DAO Treasury
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                      Community member Alex Chen shares how SpendGuard protected their DAO treasury with secure multi-signature voting and transparent fund management. Check out the testimonial!
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-surface-border">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      #community
                    </span>
                    <span className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                      #dao
                    </span>
                  </div>
                  <Link
                    href="/community"
                    className="text-primary hover:underline font-semibold text-sm"
                  >
                    View Highlights →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Community Highlights Preview */}
          <div className="mb-16">
            <CommunityHighlights />
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Never Miss an Update
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to get the latest announcements, security updates, and community highlights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
