'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Star, AlertCircle, CheckCircle, Users, TrendingUp, Shield, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GuardianProfile {
  id: string;
  name: string;
  relationship: string;
  reputationScore: number;
  traits: string[];
  strengths: string[];
  concerns?: string[];
  compatibility: number; // 0-100
  verified: boolean;
}

interface SelectionCriteria {
  id: string;
  title: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  checklist: string[];
  redFlags: string[];
  questions: string[];
}

const selectionCriteria: SelectionCriteria[] = [
  {
    id: 'trustworthiness',
    title: 'Trustworthiness & Integrity',
    description: 'The foundation of any guardian relationship',
    importance: 'critical',
    checklist: [
      'Has demonstrated integrity over time',
      'Does not have criminal history',
      'Respected in their community',
      'Has kept your secrets/confidential info',
      'You would trust with valuable items',
    ],
    redFlags: [
      'Has multiple divorces or personal disputes',
      'History of substance abuse',
      'Has stolen from or defrauded others',
      'Makes aggressive financial decisions',
      'Has unpaid debts or legal issues',
    ],
    questions: [
      'How long have you known this person?',
      'Would you trust them with your passwords?',
      'Have they ever betrayed your confidence?',
      'Do they have a strong moral compass?',
      'Are they independent thinkers?',
    ],
  },
  {
    id: 'availability',
    title: 'Reliability & Availability',
    description: 'Guardians must be reachable and responsive',
    importance: 'critical',
    checklist: [
      'Is regularly reachable via phone/email',
      'Responds to messages within reasonable time',
      'Not frequently traveling or unavailable',
      'Has stable living situation',
      'Can commit to multi-year role',
    ],
    redFlags: [
      'Frequently changes phone numbers',
      'Goes offline for weeks at a time',
      'Lives in unstable situation',
      'Has unreliable communication history',
      'Plans to move abroad soon',
    ],
    questions: [
      'How quickly can you typically respond to messages?',
      'Will you be available for the next 5+ years?',
      'Can you commit to checking on vault weekly?',
      'What is the best way to reach you?',
      'How do you handle emergencies?',
    ],
  },
  {
    id: 'financial-savvy',
    title: 'Financial Understanding',
    description: 'Guardians should understand crypto and finance basics',
    importance: 'high',
    checklist: [
      'Understands basic cryptocurrency concepts',
      'Has used blockchain before (MetaMask, etc)',
      'Can follow technical instructions',
      'Asks good security questions',
      'Keeps their own digital assets safe',
    ],
    redFlags: [
      'No understanding of crypto at all',
      'Has fallen for crypto scams before',
      'Poor personal financial management',
      'Cannot use basic internet/mobile',
      'Falls for phishing emails frequently',
    ],
    questions: [
      'Do you have experience with crypto wallets?',
      'How would you verify a legitimate request?',
      'What security practices do you follow?',
      'How would you secure your guardian credentials?',
      'Are you comfortable learning new tech?',
    ],
  },
  {
    id: 'impartiality',
    title: 'Impartiality & Sound Judgment',
    description: 'Guardians must make decisions without bias',
    importance: 'high',
    checklist: [
      'Makes decisions based on facts, not emotions',
      'Asks clarifying questions before deciding',
      'Not easily influenced or pressured',
      'Can say "no" when needed',
      'Thinks critically and independently',
    ],
    redFlags: [
      'Often acts without thinking things through',
      'Easily swayed by persuasive arguments',
      'Makes impulsive decisions',
      'Cannot stand up to pressure',
      'Let emotion cloud judgment before',
    ],
    questions: [
      'How do you make important decisions?',
      'When was the last time you said no to someone?',
      'How would you handle a pressure situation?',
      'Can you verify information independently?',
      'What are your decision-making principles?',
    ],
  },
  {
    id: 'geographic-diversity',
    title: 'Geographic & Demographic Diversity',
    description: 'Spread guardians across locations and backgrounds',
    importance: 'medium',
    checklist: [
      'Not all guardians in same city/country',
      'Different age groups represented',
      'Different professions/backgrounds',
      'Not all in same household',
      'Different timezones help during emergencies',
    ],
    redFlags: [
      'All guardians are family members',
      'All guardians in same location',
      'All similar age or background',
      'All from same company/organization',
    ],
    questions: [
      'How are your guardians distributed geographically?',
      'Do they come from different backgrounds?',
      'Are they in different timezones?',
    ],
  },
  {
    id: 'communication',
    title: 'Communication & Transparency',
    description: 'Clear, honest communication is essential',
    importance: 'high',
    checklist: [
      'You feel comfortable discussing sensitive topics',
      'They listen without judgment',
      'They ask clarifying questions',
      'They communicate clearly',
      'You have regular contact',
    ],
    redFlags: [
      'Awkward or strained relationship',
      'They don\'t ask questions',
      'Poor communication history',
      'You haven\'t talked in years',
      'You feel judged by them',
    ],
    questions: [
      'How often do you communicate?',
      'Can you have serious conversations?',
      'Would they understand your vault needs?',
      'Can you be vulnerable with them?',
    ],
  },
];

const commonMistakes = [
  {
    mistake: 'Choosing only family members',
    why: 'Family might pressure you or have conflicting interests',
    impact: 'High - Reduces impartiality',
    solution: 'Mix family and trusted non-family guardians',
  },
  {
    mistake: 'Only choosing people much older',
    why: 'Availability and health concerns',
    impact: 'High - May reduce long-term availability',
    solution: 'Include a mix of age groups',
  },
  {
    mistake: 'Choosing people without asking them first',
    why: 'They may not be willing or available',
    impact: 'Critical - They might refuse when needed',
    solution: 'Always ask and explain the role thoroughly',
  },
  {
    mistake: 'Not considering your relationship strength',
    why: 'Weak relationships break under pressure',
    impact: 'High - Lack of trust when critical',
    solution: 'Choose people you\'ve known for years',
  },
  {
    mistake: 'Choosing people who don\'t understand crypto',
    why: 'They may make poor security decisions',
    impact: 'Medium - Higher risk of compromise',
    solution: 'Provide education or choose technically literate people',
  },
  {
    mistake: 'All guardians in same location',
    why: 'Single event can compromise all guardians',
    impact: 'High - Lack of redundancy',
    solution: 'Spread guardians across different cities/countries',
  },
  {
    mistake: 'Not verifying they can actually be reached',
    why: 'Email/phone numbers might be wrong or inactive',
    impact: 'Critical - Can\'t contact them when needed',
    solution: 'Test communication channels regularly',
  },
];

export function GuardianSelectionGuide() {
  const [search, setSearch] = useState('');
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set(['trustworthiness']));
  const [showMistakes, setShowMistakes] = useState(false);

  const toggleCriteria = (id: string) => {
    const updated = new Set(expandedCriteria);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setExpandedCriteria(updated);
  };

  const filteredCriteria = useMemo(
    () =>
      selectionCriteria.filter(
        (c) =>
          c.title.toLowerCase().includes(search.toLowerCase()) ||
          c.description.toLowerCase().includes(search.toLowerCase()) ||
          c.checklist.some((item) => item.toLowerCase().includes(search.toLowerCase())),
      ),
    [search],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 rounded-lg border border-violet-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Guardian Selection Guide</h2>
        <p className="text-gray-400">
          Learn how to choose the right guardians for your vault. This guide covers essential criteria,
          common mistakes, and evaluation frameworks to help you make the best decisions.
        </p>
      </div>

      {/* Quick Start Framework */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          Quick Selection Framework
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-400 text-sm">Step 1: Make a List</h4>
            <p className="text-sm text-gray-300">Write down people who:</p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4">
              <li>• You deeply trust</li>
              <li>• Are financially responsible</li>
              <li>• Are reachable and responsive</li>
              <li>• Understand technology basics</li>
              <li>• Can make independent decisions</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-400 text-sm">Step 2: Evaluate</h4>
            <p className="text-sm text-gray-300">For each person:</p>
            <ul className="text-sm text-gray-400 space-y-1 ml-4">
              <li>• Check trustworthiness score</li>
              <li>• Verify availability for 5+ years</li>
              <li>• Assess financial understanding</li>
              <li>• Confirm geographic diversity</li>
              <li>• Test communication channels</li>
            </ul>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-400 text-sm">Step 3: Interview & Educate</h4>
          <p className="text-sm text-gray-300">
            Have conversations about the role, answer questions, provide education on crypto and security,
            explain your vault's purpose, discuss emergency procedures.
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search criteria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
        />
      </div>

      {/* Selection Criteria */}
      <div className="space-y-3">
        {filteredCriteria.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No criteria found matching your search.</p>
          </div>
        ) : (
          filteredCriteria.map((criteria) => {
            const isExpanded = expandedCriteria.has(criteria.id);
            const importanceColors = {
              critical: 'bg-red-500/20 text-red-400 border-red-500/30',
              high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
              medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
              low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            };

            return (
              <div key={criteria.id} className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCriteria(criteria.id)}
                  className="w-full p-4 text-left hover:bg-gray-900/80 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white">{criteria.title}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border capitalize ${
                          importanceColors[criteria.importance as keyof typeof importanceColors]
                        }`}
                      >
                        {criteria.importance} Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{criteria.description}</p>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-700 px-4 py-4 bg-gray-950/50 space-y-4">
                    {/* Checklist */}
                    <div>
                      <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Checklist
                      </h4>
                      <div className="space-y-1.5">
                        {criteria.checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="rounded border-gray-600 bg-gray-900 w-4 h-4"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div>
                      <h4 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Red Flags to Avoid
                      </h4>
                      <div className="space-y-1.5">
                        {criteria.redFlags.map((flag, idx) => (
                          <div key={idx} className="flex gap-2 text-sm">
                            <span className="text-rose-400 flex-shrink-0">⚠️</span>
                            <span className="text-gray-300">{flag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Questions to Ask */}
                    <div>
                      <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Questions to Ask Them
                      </h4>
                      <div className="space-y-1.5 bg-blue-900/20 border border-blue-800/50 rounded p-3">
                        {criteria.questions.map((question, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-blue-300">Q: </span>
                            <span className="text-gray-300">{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Common Mistakes Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowMistakes(!showMistakes)}
          className="flex items-center justify-between w-full p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg hover:bg-amber-900/30 transition-colors"
        >
          <h3 className="font-semibold text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Common Mistakes to Avoid
          </h3>
          <ChevronDown
            className={`w-5 h-5 text-amber-400 transition-transform ${showMistakes ? 'rotate-180' : ''}`}
          />
        </button>

        {showMistakes && (
          <div className="grid gap-3">
            {commonMistakes.map((item, idx) => (
              <div key={idx} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-white mb-1">❌ {item.mistake}</h4>
                  <p className="text-sm text-gray-400">{item.why}</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Impact</p>
                    <p className={`text-sm font-medium ${
                      item.impact.includes('Critical')
                        ? 'text-red-400'
                        : item.impact.includes('High')
                          ? 'text-orange-400'
                          : 'text-yellow-400'
                    }`}>
                      {item.impact}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Solution</p>
                    <p className="text-sm text-green-400">{item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Practices Summary */}
      <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Best Practices Summary
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-emerald-400 text-sm">✓ Optimal Setup</h4>
            <ul className="text-sm text-emerald-200/80 space-y-1">
              <li>• 3-5 guardians total</li>
              <li>• Ages 30-70 range</li>
              <li>• Different professions</li>
              <li>• Different cities/countries</li>
              <li>• Mix of family & non-family</li>
              <li>• All financially stable</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-emerald-400 text-sm">✓ Ongoing Care</h4>
            <ul className="text-sm text-emerald-200/80 space-y-1">
              <li>• Meet annually</li>
              <li>• Update on vault changes</li>
              <li>• Test contact channels</li>
              <li>• Review emergency plans</li>
              <li>• Share security updates</li>
              <li>• Keep them informed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
