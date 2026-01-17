'use client';

import { useState, useMemo } from 'react';
import { Play, Search, Filter, Clock, Users, Lock, Settings, BookOpen, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: 'setup' | 'guardians' | 'security' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string;
  videoUrl?: string;
  topics: string[];
  timestamps: { time: string; title: string }[];
  views: number;
  published: string;
}

const videoTutorials: VideoTutorial[] = [
  {
    id: 'vault-setup-101',
    title: 'Creating Your First Vault',
    description: 'Learn how to set up a new vault from scratch, including wallet connection and initial configuration.',
    duration: 8,
    category: 'setup',
    difficulty: 'beginner',
    topics: ['Wallet Connection', 'Vault Creation', 'Configuration', 'Deployment'],
    timestamps: [
      { time: '0:00', title: 'Introduction' },
      { time: '0:45', title: 'Connecting Wallet' },
      { time: '2:15', title: 'Creating Vault' },
      { time: '4:30', title: 'Initial Settings' },
      { time: '6:00', title: 'Deployment' },
      { time: '7:30', title: 'Verification' },
    ],
    views: 2340,
    published: '2025-12-15',
  },
  {
    id: 'adding-guardians',
    title: 'Adding and Managing Guardians',
    description: 'Complete guide to selecting, inviting, and managing guardians for your vault with best practices.',
    duration: 12,
    category: 'guardians',
    difficulty: 'beginner',
    topics: ['Guardian Selection', 'Invitations', 'Permissions', 'Management'],
    timestamps: [
      { time: '0:00', title: 'Guardian Overview' },
      { time: '1:30', title: 'Selecting Guardians' },
      { time: '3:45', title: 'Sending Invitations' },
      { time: '5:20', title: 'Setting Permissions' },
      { time: '7:15', title: 'Managing Roles' },
      { time: '9:00', title: 'Common Mistakes' },
      { time: '10:30', title: 'Best Practices' },
    ],
    views: 1890,
    published: '2025-12-18',
  },
  {
    id: 'guardian-thresholds',
    title: 'Understanding Thresholds and Approvals',
    description: 'Deep dive into guardian thresholds, approval requirements, and how multi-sig works.',
    duration: 10,
    category: 'guardians',
    difficulty: 'intermediate',
    topics: ['Thresholds', 'Multi-sig', 'Approvals', 'Voting'],
    timestamps: [
      { time: '0:00', title: 'What are Thresholds?' },
      { time: '1:45', title: 'Threshold Calculation' },
      { time: '3:30', title: 'Multi-sig Scenarios' },
      { time: '5:15', title: 'Approval Process' },
      { time: '7:00', title: 'Voting Mechanics' },
      { time: '8:30', title: 'Optimization' },
    ],
    views: 1456,
    published: '2025-12-20',
  },
  {
    id: 'security-setup',
    title: 'Securing Your Vault - Setup Edition',
    description: 'Essential security practices during vault creation including key management and guardian vetting.',
    duration: 14,
    category: 'security',
    difficulty: 'intermediate',
    topics: ['Key Management', 'Guardian Vetting', 'Backup Strategies', 'Emergency Planning'],
    timestamps: [
      { time: '0:00', title: 'Security Overview' },
      { time: '1:30', title: 'Key Management' },
      { time: '3:45', title: 'Guardian Vetting' },
      { time: '6:00', title: 'Backup Strategies' },
      { time: '8:15', title: 'Emergency Contacts' },
      { time: '10:30', title: 'Testing Recovery' },
      { time: '12:00', title: 'Final Checklist' },
    ],
    views: 2100,
    published: '2025-12-22',
  },
  {
    id: 'emergency-procedures',
    title: 'Emergency Recovery Procedures',
    description: 'How to handle account compromise, lost guardians, and emergency vault access.',
    duration: 11,
    category: 'security',
    difficulty: 'intermediate',
    topics: ['Account Compromise', 'Emergency Access', 'Guardian Loss', 'Recovery'],
    timestamps: [
      { time: '0:00', title: 'Introduction' },
      { time: '1:00', title: 'Account Compromise Steps' },
      { time: '3:30', title: 'Notifying Guardians' },
      { time: '5:15', title: 'Emergency Access' },
      { time: '7:00', title: 'Replacing Guardians' },
      { time: '8:45', title: 'Recovery Timeline' },
      { time: '10:00', title: 'Prevention Tips' },
    ],
    views: 890,
    published: '2025-12-25',
  },
  {
    id: 'advanced-settings',
    title: 'Advanced Vault Configuration',
    description: 'Power user guide to advanced vault settings, custom rules, and optimization strategies.',
    duration: 16,
    category: 'advanced',
    difficulty: 'advanced',
    topics: ['Custom Rules', 'Whitelisting', 'Rate Limits', 'Governance'],
    timestamps: [
      { time: '0:00', title: 'Advanced Overview' },
      { time: '1:30', title: 'Custom Rules' },
      { time: '3:45', title: 'Address Whitelisting' },
      { time: '6:00', title: 'Rate Limiting' },
      { time: '8:30', title: 'Governance Setup' },
      { time: '11:00', title: 'Automation' },
      { time: '13:15', title: 'Performance Tips' },
      { time: '15:00', title: 'Advanced Scenarios' },
    ],
    views: 456,
    published: '2026-01-05',
  },
  {
    id: 'testing-vault',
    title: 'Testing Your Vault in Staging',
    description: 'Complete testing guide before mainnet deployment including test scenarios and validation.',
    duration: 13,
    category: 'setup',
    difficulty: 'intermediate',
    topics: ['Staging', 'Test Scenarios', 'Validation', 'Performance'],
    timestamps: [
      { time: '0:00', title: 'Testing Overview' },
      { time: '1:30', title: 'Setting Up Staging' },
      { time: '3:30', title: 'Test Scenarios' },
      { time: '6:00', title: 'Guardian Testing' },
      { time: '8:15', title: 'Edge Cases' },
      { time: '10:30', title: 'Performance Testing' },
      { time: '11:45', title: 'Go-live Checklist' },
    ],
    views: 1200,
    published: '2026-01-08',
  },
  {
    id: 'vault-monitoring',
    title: 'Monitoring and Alerts Setup',
    description: 'Configure webhooks, alerts, and monitoring for your vault to catch issues early.',
    duration: 9,
    category: 'advanced',
    difficulty: 'intermediate',
    topics: ['Webhooks', 'Alerts', 'Monitoring', 'Notifications'],
    timestamps: [
      { time: '0:00', title: 'Monitoring Introduction' },
      { time: '1:15', title: 'Setting Up Webhooks' },
      { time: '3:30', title: 'Alert Types' },
      { time: '5:00', title: 'Notification Setup' },
      { time: '6:45', title: 'Dashboard Overview' },
      { time: '8:00', title: 'Best Practices' },
    ],
    views: 678,
    published: '2026-01-10',
  },
];

const categoryIcons = {
  setup: Settings,
  guardians: Users,
  security: Lock,
  advanced: BookOpen,
};

const difficultyColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

export function VaultSetupVideos() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    return videoTutorials.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(search.toLowerCase()) ||
        video.description.toLowerCase().includes(search.toLowerCase()) ||
        video.topics.some((topic) => topic.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = !selectedCategory || video.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || video.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  const categories = ['setup', 'guardians', 'security', 'advanced'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Video Tutorials</h2>
        <p className="text-gray-400">
          Step-by-step video guides to help you set up and manage your vault securely. Start with
          beginner tutorials and progress to advanced configurations.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Play className="w-4 h-4" />
            <span>{videoTutorials.length} tutorials</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              {Math.round(videoTutorials.reduce((sum, v) => sum + v.duration, 0) / 60)} hours total
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search tutorials by title or topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
          />
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Category</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              onClick={() => setSelectedCategory(null)}
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              className="w-full justify-center"
            >
              All
            </Button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat as keyof typeof categoryIcons];
              return (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-center gap-1"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline capitalize">{cat}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Difficulty</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedDifficulty(null)}
              variant={selectedDifficulty === null ? 'default' : 'outline'}
              size="sm"
            >
              All Levels
            </Button>
            {difficulties.map((diff) => (
              <Button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                variant={selectedDifficulty === diff ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
              >
                {diff}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Video List */}
      <div className="space-y-3">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tutorials found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredVideos.map((video) => {
            const CategoryIcon = categoryIcons[video.category as keyof typeof categoryIcons];
            const isExpanded = expandedVideo === video.id;

            return (
              <div
                key={video.id}
                className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all"
              >
                {/* Video Card Header */}
                <button
                  onClick={() => setExpandedVideo(isExpanded ? null : video.id)}
                  className="w-full p-4 text-left hover:bg-gray-900/80 transition-colors"
                >
                  <div className="flex gap-4 items-start">
                    {/* Thumbnail Placeholder */}
                    <div className="flex-shrink-0 w-24 h-16 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white" />
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-white line-clamp-2">{video.title}</h3>
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{video.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Category Tag */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50 border border-gray-700">
                          <CategoryIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400 capitalize">{video.category}</span>
                        </div>

                        {/* Difficulty Tag */}
                        <div
                          className={`px-2 py-1 rounded text-xs border capitalize font-medium ${
                            difficultyColors[video.difficulty as keyof typeof difficultyColors]
                          }`}
                        >
                          {video.difficulty}
                        </div>

                        {/* Duration */}
                        <div className="flex items-center gap-1 px-2 py-1 rounded bg-gray-800/50 border border-gray-700 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{video.duration} min</span>
                        </div>

                        {/* Views */}
                        <div className="text-xs text-gray-500 ml-auto">
                          {video.views.toLocaleString()} views
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-700 px-4 py-4 bg-gray-950/50 space-y-4">
                    {/* Topics */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Topics Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {video.topics.map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-800/50"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Timestamps */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Timeline</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {video.timestamps.map((ts, idx) => (
                          <button
                            key={idx}
                            className="text-left p-2 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                          >
                            <div className="text-xs font-mono text-blue-400 group-hover:text-blue-300">{ts.time}</div>
                            <div className="text-xs text-gray-400 group-hover:text-gray-300">{ts.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Watch Button */}
                    <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4" />
                      Watch Tutorial
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{filteredVideos.length}</div>
          <div className="text-xs text-gray-400">Tutorials</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {Math.round(filteredVideos.reduce((sum, v) => sum + v.duration, 0) / 60)}h
          </div>
          <div className="text-xs text-gray-400">Watch Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {filteredVideos.filter((v) => v.difficulty === 'beginner').length}
          </div>
          <div className="text-xs text-gray-400">Beginner</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-400">
            {filteredVideos.filter((v) => v.difficulty === 'advanced').length}
          </div>
          <div className="text-xs text-gray-400">Advanced</div>
        </div>
      </div>
    </div>
  );
}

// Placeholder icon
function PlayCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path d="M9 8.75l5 3.25-5 3.25z" fill="currentColor" />
    </svg>
  );
}
