'use client';

import { useState, useMemo } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, Lock, Eye, Database, Network, ChevronDown, Copy, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SecurityTip {
  id: string;
  title: string;
  category: 'prevention' | 'detection' | 'response' | 'best-practice';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  threat: string;
  description: string;
  actions: string[];
  tools?: string[];
  references?: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const securityTips: SecurityTip[] = [
  {
    id: 'password-management',
    title: 'Master Password Security',
    category: 'prevention',
    difficulty: 'beginner',
    threat: 'Account Compromise',
    description: 'Use strong, unique passwords to prevent unauthorized vault access',
    actions: [
      'Create passwords with 16+ characters',
      'Use mix of uppercase, lowercase, numbers, symbols',
      'Never reuse passwords across sites',
      'Store in password manager (1Password, Bitwarden, LastPass)',
      'Change vault password every 90 days',
      'Never write passwords on paper or sticky notes',
    ],
    tools: ['1Password', 'Bitwarden', 'LastPass', 'KeePass'],
    references: ['OWASP Password Guidelines', 'NIST Cybersecurity Framework'],
    priority: 'critical',
  },
  {
    id: '2fa-setup',
    title: 'Enable Two-Factor Authentication (2FA)',
    category: 'prevention',
    difficulty: 'beginner',
    threat: 'Account Takeover',
    description: 'Add a second layer of protection requiring device authentication',
    actions: [
      'Enable 2FA in vault settings',
      'Use authenticator app (Google Authenticator, Authy)',
      'Save backup codes in secure location',
      'Test 2FA login process',
      'Use hardware security key if available',
      'Never share 2FA codes with anyone',
    ],
    tools: ['Google Authenticator', 'Authy', 'YubiKey', 'Titan Security Key'],
    priority: 'critical',
  },
  {
    id: 'phishing-awareness',
    title: 'Identify and Avoid Phishing Attacks',
    category: 'prevention',
    difficulty: 'beginner',
    threat: 'Credential Theft',
    description: 'Learn to recognize fake emails, websites, and messages',
    actions: [
      'Check sender email address carefully',
      'Look for spelling/grammar errors',
      'Hover over links to see real URL before clicking',
      'Never click links in suspicious emails',
      'Always type URL directly in browser',
      'Verify requests by contacting support independently',
      'Enable email authentication (SPF, DKIM, DMARC)',
    ],
    references: ['CISA Phishing Tips', 'FTC Scam Alert'],
    priority: 'critical',
  },
  {
    id: 'device-security',
    title: 'Secure Your Devices',
    category: 'prevention',
    difficulty: 'intermediate',
    threat: 'Device Compromise',
    description: 'Protect computers, phones, and hardware from malware and physical theft',
    actions: [
      'Update OS and software regularly',
      'Install antivirus/antimalware software',
      'Enable device encryption (BitLocker, FileVault)',
      'Use strong device lock (password, biometric)',
      'Disable auto-connect for public WiFi',
      'Keep only needed apps installed',
      'Review installed apps monthly',
      'Enable automatic security updates',
    ],
    tools: ['Windows Defender', 'Malwarebytes', 'Kaspersky', 'Norton'],
    priority: 'high',
  },
  {
    id: 'network-security',
    title: 'Secure Your Network Connection',
    category: 'prevention',
    difficulty: 'intermediate',
    threat: 'Man-in-the-Middle Attack',
    description: 'Prevent attackers from intercepting vault communications',
    actions: [
      'Never access vault on public WiFi',
      'Use VPN when on untrusted networks',
      'Check for HTTPS (lock icon) before login',
      'Disable WiFi and Bluetooth when not needed',
      'Use private/home networks only',
      'Change default router password',
      'Enable WPA3 encryption on home WiFi',
      'Avoid proxy networks or public DNS',
    ],
    tools: ['ExpressVPN', 'NordVPN', 'ProtonVPN', 'Mullvad VPN'],
    priority: 'high',
  },
  {
    id: 'recovery-codes-backup',
    title: 'Safeguard Recovery and Backup Codes',
    category: 'prevention',
    difficulty: 'beginner',
    threat: 'Loss of Account Access',
    description: 'Safely store codes needed for account recovery',
    actions: [
      'Write recovery codes on paper immediately',
      'Store in safe deposit box or home safe',
      'Never photograph codes (if possible)',
      'Never store in cloud without encryption',
      'Create multiple physical copies',
      'Store copies in different locations',
      'Test recovery process annually',
      'Update copies if vault changes',
    ],
    priority: 'critical',
  },
  {
    id: 'guardian-verification',
    title: 'Verify Guardian Identities',
    category: 'prevention',
    difficulty: 'intermediate',
    threat: 'Fraudulent Guardian',
    description: 'Confirm guardians are who they claim to be before trusting them',
    actions: [
      'Verify identity through multiple channels',
      'Ask security questions only you would know',
      'Use video calls to confirm identity',
      'Check their blockchain address history',
      'Verify wallet creation date (older is better)',
      'Ask about past interactions',
      'Never add guardians through email alone',
      'Meet in person when possible',
    ],
    priority: 'high',
  },
  {
    id: 'transaction-monitoring',
    title: 'Monitor Vault Transactions',
    category: 'detection',
    difficulty: 'beginner',
    threat: 'Unauthorized Withdrawals',
    description: 'Regularly review all vault activity to spot suspicious behavior',
    actions: [
      'Review transaction history weekly',
      'Set up transaction alerts',
      'Check guardian approval logs',
      'Look for unexpected withdrawals',
      'Verify destination addresses',
      'Monitor gas fee amounts',
      'Check for unusual timing',
      'Export transaction logs monthly',
    ],
    priority: 'high',
  },
  {
    id: 'suspicious-activity-signs',
    title: 'Recognize Suspicious Activity',
    category: 'detection',
    difficulty: 'intermediate',
    threat: 'Active Attack',
    description: 'Learn signs that your vault may be under attack or compromised',
    actions: [
      'Unexpected login from new location',
      'Transactions you didn\'t approve',
      'Changed settings you didn\'t make',
      'Guardians report unusual requests',
      'Email address change attempts',
      'Password reset requests you didn\'t make',
      'New devices in account activity',
      'Unusual approval patterns',
    ],
    references: ['Vault Security Alert Guidelines'],
    priority: 'high',
  },
  {
    id: 'immediate-response',
    title: 'Immediate Response to Compromise',
    category: 'response',
    difficulty: 'intermediate',
    threat: 'Account Compromise',
    description: 'Take action immediately if you suspect compromise',
    actions: [
      'Change vault password immediately',
      'Review and revoke active sessions',
      'Check 2FA settings for unauthorized devices',
      'Contact all guardians immediately',
      'Request vault lock if available',
      'File incident report with platform',
      'Check email forwarding rules',
      'Monitor credit reports',
      'Document timeline of events',
    ],
    priority: 'critical',
  },
  {
    id: 'lost-guardian-procedure',
    title: 'Handle Lost or Unavailable Guardian',
    category: 'response',
    difficulty: 'intermediate',
    threat: 'Loss of Vault Access',
    description: 'Procedures when a guardian becomes unavailable',
    actions: [
      'Try all contact methods first',
      'Contact them through family/friends',
      'Wait 24-48 hours before taking action',
      'If truly unavailable, initiate replacement',
      'Alternative approvers sign recovery transaction',
      'Approve new guardian addition',
      'Document reason for replacement',
      'Update guardian contact list',
      'Adjust threshold if needed',
    ],
    priority: 'high',
  },
  {
    id: 'backup-strategy',
    title: 'Implement Backup Strategy',
    category: 'best-practice',
    difficulty: 'intermediate',
    threat: 'Data Loss',
    description: 'Create redundant backups of critical vault information',
    actions: [
      'Document vault configuration',
      'Create backup of guardian addresses',
      'Backup recovery codes (see separate tip)',
      'Store copies in multiple locations',
      'Use 3-2-1 backup rule (3 copies, 2 locations, 1 offsite)',
      'Use offline storage for important docs',
      'Review backups quarterly',
      'Test recovery procedures annually',
    ],
    priority: 'high',
  },
  {
    id: 'smart-contract-audits',
    title: 'Verify Smart Contract Security',
    category: 'best-practice',
    difficulty: 'advanced',
    threat: 'Smart Contract Vulnerability',
    description: 'Understand security of underlying smart contracts',
    actions: [
      'Review contract audit reports',
      'Check if contracts are verified on Etherscan',
      'Look for security firm audit certifications',
      'Check for known vulnerabilities',
      'Review contract source code',
      'Understand approval mechanisms',
      'Check upgrade history',
      'Monitor for security patches',
    ],
    references: ['Trail of Bits', 'OpenZeppelin Audit Reports', 'Certora Verification'],
    priority: 'medium',
  },
  {
    id: 'wallet-security',
    title: 'Secure Your Primary Wallet',
    category: 'prevention',
    difficulty: 'intermediate',
    threat: 'Wallet Compromise',
    description: 'Protect the wallet that owns and controls the vault',
    actions: [
      'Use hardware wallet (Ledger, Trezor)',
      'Never expose private key',
      'Store seed phrase offline',
      'Create multiple copies of seed phrase',
      'Use passphrase for extra security',
      'Keep hardware wallet updated',
      'Test recovery process',
      'Use multisig if very large amounts',
    ],
    tools: ['Ledger Nano X', 'Trezor Model T', 'ColdCard'],
    priority: 'critical',
  },
  {
    id: 'social-engineering',
    title: 'Protect Against Social Engineering',
    category: 'prevention',
    difficulty: 'intermediate',
    threat: 'Manipulation and Deception',
    description: 'Prevent attackers from tricking you into revealing sensitive info',
    actions: [
      'Never share passwords or seed phrases',
      'Verify caller identity before sharing info',
      'Be skeptical of urgent requests',
      'Check requests through multiple channels',
      'Educate guardians about social engineering',
      'Create code words for verification',
      'Document unusual requests',
      'Report attempts to support',
    ],
    references: ['CISA Social Engineering Guidance', 'Stanford Report on Phishing'],
    priority: 'high',
  },
  {
    id: 'api-key-management',
    title: 'Manage API Keys Securely',
    category: 'prevention',
    difficulty: 'advanced',
    threat: 'Unauthorized API Access',
    description: 'Protect API keys if using webhook or API integrations',
    actions: [
      'Store keys in environment variables',
      'Never commit keys to version control',
      'Rotate keys quarterly',
      'Use key scoping if available',
      'Monitor API usage for anomalies',
      'Revoke unused keys',
      'Use separate keys per service',
      'Store keys in secrets manager',
    ],
    tools: ['.env files', 'HashiCorp Vault', 'AWS Secrets Manager', '1Password'],
    priority: 'high',
  },
  {
    id: 'whitelist-addresses',
    title: 'Whitelist Recipient Addresses',
    category: 'best-practice',
    difficulty: 'beginner',
    threat: 'Wrong Address Transactions',
    description: 'Prevent sending funds to wrong addresses by pre-approving recipients',
    actions: [
      'Create approved recipients list',
      'Only approve after careful verification',
      'Add one address at a time',
      'Test with small amounts first',
      'Require multiple guardian approvals for additions',
      'Review whitelist monthly',
      'Remove unused addresses',
      'Document purpose of each address',
    ],
    priority: 'high',
  },
  {
    id: 'regular-security-audit',
    title: 'Conduct Regular Security Audits',
    category: 'best-practice',
    difficulty: 'advanced',
    threat: 'Accumulated Security Drift',
    description: 'Periodically review and update security measures',
    actions: [
      'Quarterly review of vault settings',
      'Audit guardian status and contact info',
      'Review transaction history',
      'Check device security patches',
      'Test 2FA and recovery procedures',
      'Review permissions granted',
      'Check for unusual activity',
      'Update documentation',
    ],
    priority: 'medium',
  },
];

const categories = ['prevention', 'detection', 'response', 'best-practice'];
const difficulties = ['beginner', 'intermediate', 'advanced'];

const categoryIcons = {
  prevention: Shield,
  detection: Eye,
  response: AlertTriangle,
  'best-practice': CheckCircle,
};

const categoryColors = {
  prevention: 'from-emerald-900/20 to-teal-900/20 border-emerald-500/30',
  detection: 'from-blue-900/20 to-cyan-900/20 border-blue-500/30',
  response: 'from-red-900/20 to-rose-900/20 border-red-500/30',
  'best-practice': 'from-purple-900/20 to-violet-900/20 border-purple-500/30',
};

export function SecurityTips() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const filteredTips = useMemo(() => {
    return securityTips.filter((tip) => {
      const matchesSearch =
        tip.title.toLowerCase().includes(search.toLowerCase()) ||
        tip.description.toLowerCase().includes(search.toLowerCase()) ||
        tip.threat.toLowerCase().includes(search.toLowerCase()) ||
        tip.actions.some((a) => a.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = !selectedCategory || tip.category === selectedCategory;
      const matchesDifficulty = !selectedDifficulty || tip.difficulty === selectedDifficulty;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900/20 to-pink-900/20 rounded-lg border border-rose-500/30 p-6">
        <h2 className="text-2xl font-bold text-white mb-2">Security Tips & Tricks</h2>
        <p className="text-gray-400">
          Comprehensive security guidance organized by protection type. Learn how to prevent attacks,
          detect threats, respond to incidents, and follow security best practices.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-400">
          <span>{securityTips.length} security tips</span>
          <span>•</span>
          <span>{securityTips.filter((t) => t.priority === 'critical').length} critical priorities</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search tips by title, threat, or keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Category</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setSelectedCategory(null)}
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
              >
                {cat.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-400">Difficulty</label>
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

      {/* Tips Grid */}
      <div className="space-y-3">
        {filteredTips.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No security tips match your search.</p>
          </div>
        ) : (
          filteredTips.map((tip) => {
            const CategoryIcon = categoryIcons[tip.category as keyof typeof categoryIcons];
            const isExpanded = expandedTip === tip.id;
            const priorityColor = {
              critical: 'text-red-400 bg-red-900/20',
              high: 'text-orange-400 bg-orange-900/20',
              medium: 'text-yellow-400 bg-yellow-900/20',
              low: 'text-blue-400 bg-blue-900/20',
            };

            return (
              <div
                key={tip.id}
                className={`border rounded-lg transition-all ${
                  isExpanded
                    ? `bg-gradient-to-r ${categoryColors[tip.category as keyof typeof categoryColors]} border-0`
                    : 'bg-gray-900/50 border-gray-700 hover:border-gray-600'
                }`}
              >
                <button
                  onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                  className="w-full p-4 text-left hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CategoryIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{tip.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{tip.threat}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 capitalize">
                            {tip.difficulty}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                              priorityColor[tip.priority as keyof typeof priorityColor]
                            }`}
                          >
                            {tip.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-700 px-4 py-4 bg-gray-950/50 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                      <p className="text-sm text-gray-400">{tip.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Actions to Take</h4>
                      <ol className="space-y-1.5">
                        {tip.actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-400 flex gap-3">
                            <span className="font-semibold text-blue-400 flex-shrink-0">{idx + 1}.</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {tip.tools && tip.tools.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Recommended Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {tip.tools.map((tool) => (
                            <span
                              key={tool}
                              className="px-2 py-1 rounded text-xs bg-blue-900/30 text-blue-300 border border-blue-800/50 flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {tip.references && tip.references.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">References</h4>
                        <div className="space-y-1">
                          {tip.references.map((ref) => (
                            <div key={ref} className="text-sm text-gray-400 flex items-center gap-2">
                              <ExternalLink className="w-3 h-3" />
                              {ref}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button size="sm" variant="outline" className="w-full">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Security Checklist
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Priority Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
        {['critical', 'high', 'medium', 'low'].map((priority) => {
          const count = filteredTips.filter((t) => t.priority === priority).length;
          const colors = {
            critical: 'text-red-400 bg-red-900/20',
            high: 'text-orange-400 bg-orange-900/20',
            medium: 'text-yellow-400 bg-yellow-900/20',
            low: 'text-blue-400 bg-blue-900/20',
          };
          return (
            <div key={priority} className="text-center">
              <div className={`text-2xl font-bold ${colors[priority as keyof typeof colors]}`}>{count}</div>
              <div className="text-xs text-gray-400 capitalize">{priority} Priority</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
