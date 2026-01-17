/**
 * Vault Configuration Presets
 * Pre-configured Family, DAO, and Team vault setups with best practices
 */

export interface VaultPresetConfig {
  id: string;
  name: string;
  category: 'family' | 'dao' | 'team';
  description: string;
  useCase: string;
  setupTime: number; // minutes
  guardianCount: number;
  approvalThreshold: number;
  emergencyThreshold?: number;
  maxGuardians: number;
  maxDailyLimit: number; // in USD
  maxTransactionLimit: number; // in USD
  features: string[];
  bestPractices: string[];
  recommendedGuardianRoles: string[];
  riskLevel: 'low' | 'medium' | 'high';
  complianceNeeds: string[];
  securitySettings: {
    requireTwoFactor: boolean;
    requireBiometric: boolean;
    enforceDeviceTrust: boolean;
    deviceTrustDuration: number; // days
    lockoutDuration: number; // minutes
    sessionTimeout: number; // minutes
    ipRestrictions: boolean;
    geoRestrictions: boolean;
  };
  notificationSettings: {
    emailOnLargeTransactions: boolean;
    largeTransactionThreshold: number;
    notifyOnApprovals: boolean;
    notifyOnFailedAuth: boolean;
    dailySummary: boolean;
  };
  auditingSettings: {
    logAllTransactions: boolean;
    logAllApprovals: boolean;
    retentionDays: number;
    encryptAuditLogs: boolean;
  };
  tags: string[];
}

/**
 * FAMILY VAULT PRESET
 * Designed for family asset management with clear roles and inheritance planning
 */
export const FAMILY_VAULT_PRESET: VaultPresetConfig = {
  id: 'preset_family_standard',
  name: 'Family Vault',
  category: 'family',
  description: 'Shared family assets with clear roles for parents, adult children, and trustees',
  useCase: 'Multi-generational wealth management, estate planning, joint accounts',
  setupTime: 25,
  guardianCount: 3,
  approvalThreshold: 2,
  emergencyThreshold: 2,
  maxGuardians: 5,
  maxDailyLimit: 50000,
  maxTransactionLimit: 25000,
  features: [
    'Multi-signature approval (2-of-3)',
    'Role-based access control',
    'Inheritance pre-planning',
    'Beneficiary designation',
    'Activity audit trail',
    'Spending analytics',
    'Reconciliation tools',
    'Joint account management',
    'Recovery mechanisms',
    'Annual review prompts'
  ],
  bestPractices: [
    'Designate primary and secondary trustees',
    'Include at least one trusted third party (lawyer, accountant)',
    'Set clear spending limits for daily transactions',
    'Review and update annually or on major life events',
    'Document guardian responsibilities in writing',
    'Enable activity notifications for all members',
    'Establish clear dispute resolution process',
    'Use 2FA for all guardians',
    'Regularly test emergency access procedures',
    'Store backup access credentials securely'
  ],
  recommendedGuardianRoles: [
    'Primary Guardian (Parent/Eldest)',
    'Secondary Guardian (Spouse/Adult Child)',
    'Tertiary Guardian (Family Member/Professional)'
  ],
  riskLevel: 'low',
  complianceNeeds: [
    'Inheritance tax planning documentation',
    'Beneficiary designation forms',
    'Family governance guidelines'
  ],
  securitySettings: {
    requireTwoFactor: true,
    requireBiometric: false,
    enforceDeviceTrust: true,
    deviceTrustDuration: 30,
    lockoutDuration: 15,
    sessionTimeout: 60,
    ipRestrictions: false,
    geoRestrictions: false
  },
  notificationSettings: {
    emailOnLargeTransactions: true,
    largeTransactionThreshold: 10000,
    notifyOnApprovals: true,
    notifyOnFailedAuth: true,
    dailySummary: false
  },
  auditingSettings: {
    logAllTransactions: true,
    logAllApprovals: true,
    retentionDays: 2555, // 7 years
    encryptAuditLogs: true
  },
  tags: ['family', 'inheritance', 'joint-accounts', 'beginner-friendly', 'trusted-circle']
};

/**
 * DAO GOVERNANCE VAULT PRESET
 * Designed for decentralized autonomous organizations with community voting
 */
export const DAO_VAULT_PRESET: VaultPresetConfig = {
  id: 'preset_dao_governance',
  name: 'DAO Governance Vault',
  category: 'dao',
  description: 'Community-governed treasury with token-based voting and proposal management',
  useCase: 'Decentralized organizations, community treasuries, protocol governance',
  setupTime: 45,
  guardianCount: 7,
  approvalThreshold: 5,
  emergencyThreshold: 3,
  maxGuardians: 50,
  maxDailyLimit: 5000000,
  maxTransactionLimit: 1000000,
  features: [
    'Multi-signature governance (5-of-7)',
    'Emergency override (3-of-7)',
    'Community voting integration',
    'Proposal tracking and management',
    'Token-based voting power',
    'Timelock mechanisms',
    'Multi-chain support',
    'Delegation protocols',
    'Treasury analytics',
    'Governance logs',
    'Snapshot integration',
    'Voting escrow support'
  ],
  bestPractices: [
    'Use timelock delays for major decisions (48-72 hours recommended)',
    'Diversify guardians across different time zones and organizations',
    'Implement graduated voting power (no single guardian dominates)',
    'Use cold storage for idle funds',
    'Require voting for all major treasury moves',
    'Maintain quorum requirements in governance',
    'Document all governance decisions publicly',
    'Use multisig wallets across multiple chains',
    'Implement fund sweep mechanisms for security',
    'Regular audits of treasury health'
  ],
  recommendedGuardianRoles: [
    'Core Team Member (3)',
    'Community Delegate (2)',
    'External Advisor (2)'
  ],
  riskLevel: 'medium',
  complianceNeeds: [
    'Governance charter and bylaws',
    'Voting mechanism transparency',
    'Regulatory compliance (jurisdiction-specific)',
    'Community communication strategy'
  ],
  securitySettings: {
    requireTwoFactor: true,
    requireBiometric: false,
    enforceDeviceTrust: true,
    deviceTrustDuration: 14,
    lockoutDuration: 30,
    sessionTimeout: 30,
    ipRestrictions: true,
    geoRestrictions: false
  },
  notificationSettings: {
    emailOnLargeTransactions: true,
    largeTransactionThreshold: 100000,
    notifyOnApprovals: true,
    notifyOnFailedAuth: true,
    dailySummary: true
  },
  auditingSettings: {
    logAllTransactions: true,
    logAllApprovals: true,
    retentionDays: 3650, // 10 years
    encryptAuditLogs: true
  },
  tags: ['dao', 'governance', 'voting', 'defi', 'community', 'advanced']
};

/**
 * TEAM VAULT PRESET
 * Designed for team/business treasury with departmental controls
 */
export const TEAM_VAULT_PRESET: VaultPresetConfig = {
  id: 'preset_team_business',
  name: 'Team Vault',
  category: 'team',
  description: 'Business treasury with team approvals, budget tracking, and compliance',
  useCase: 'Startup treasury, team funds, business operations, multi-department management',
  setupTime: 30,
  guardianCount: 3,
  approvalThreshold: 2,
  emergencyThreshold: undefined, // No emergency override for team
  maxGuardians: 10,
  maxDailyLimit: 100000,
  maxTransactionLimit: 50000,
  features: [
    'Multi-level approvals (2-of-3)',
    'Departmental budget allocation',
    'Expense categorization',
    'Budget tracking and alerts',
    'Spending analytics',
    'Team member access controls',
    'Approval workflows',
    'Tax report generation',
    'Reconciliation tools',
    'Compliance logging',
    'Integration with accounting tools',
    'Monthly financial statements'
  ],
  bestPractices: [
    'Assign clear approvers for each expense category',
    'Set departmental spending limits',
    'Require receipts and documentation',
    'Monthly budget reviews and reconciliation',
    'Quarterly compliance audits',
    'Document all approval policies',
    'Integrate with accounting software',
    'Use 2FA for all signers',
    'Maintain clear audit trail',
    'Regular financial reporting to stakeholders'
  ],
  recommendedGuardianRoles: [
    'CFO / Finance Lead',
    'CEO / Operation Lead',
    'Accounting Manager / Finance Officer'
  ],
  riskLevel: 'low',
  complianceNeeds: [
    'Tax documentation (1099/1040)',
    'Corporate policies and procedures',
    'Audit trail requirements',
    'Expense categorization standards'
  ],
  securitySettings: {
    requireTwoFactor: true,
    requireBiometric: false,
    enforceDeviceTrust: true,
    deviceTrustDuration: 30,
    lockoutDuration: 15,
    sessionTimeout: 45,
    ipRestrictions: false,
    geoRestrictions: false
  },
  notificationSettings: {
    emailOnLargeTransactions: true,
    largeTransactionThreshold: 5000,
    notifyOnApprovals: true,
    notifyOnFailedAuth: true,
    dailySummary: false
  },
  auditingSettings: {
    logAllTransactions: true,
    logAllApprovals: true,
    retentionDays: 1825, // 5 years (typical business requirement)
    encryptAuditLogs: true
  },
  tags: ['team', 'business', 'startup', 'finance', 'compliance', 'intermediate']
};

/**
 * Vault Presets Service
 */
export class VaultPresetsService {
  /**
   * Get all available presets
   */
  static getAllPresets(): VaultPresetConfig[] {
    return [
      FAMILY_VAULT_PRESET,
      DAO_VAULT_PRESET,
      TEAM_VAULT_PRESET
    ];
  }

  /**
   * Get preset by ID
   */
  static getPresetById(id: string): VaultPresetConfig | undefined {
    return this.getAllPresets().find((p) => p.id === id);
  }

  /**
   * Get presets by category
   */
  static getPresetsByCategory(category: 'family' | 'dao' | 'team'): VaultPresetConfig[] {
    return this.getAllPresets().filter((p) => p.category === category);
  }

  /**
   * Get recommended presets based on use case
   */
  static getRecommendedPreset(
    guardianCount: number,
    riskProfile: 'low' | 'medium' | 'high'
  ): VaultPresetConfig | undefined {
    const presets = this.getAllPresets();

    // Filter by guardian count
    const candidates = presets.filter(
      (p) => guardianCount >= p.guardianCount && guardianCount <= p.maxGuardians
    );

    if (candidates.length === 0) return presets[0]; // Default to first preset

    // Find best match for risk profile
    return candidates.reduce((best, current) => {
      if (current.riskLevel === riskProfile) return current;
      return best;
    });
  }

  /**
   * Customize preset with specific settings
   */
  static customizePreset(
    preset: VaultPresetConfig,
    customizations: Partial<VaultPresetConfig>
  ): VaultPresetConfig {
    return {
      ...preset,
      id: `${preset.id}_custom_${Date.now()}`,
      ...customizations
    };
  }

  /**
   * Validate preset configuration
   */
  static validatePreset(preset: VaultPresetConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (preset.approvalThreshold < 1) {
      errors.push('Approval threshold must be at least 1');
    }

    if (preset.approvalThreshold > preset.guardianCount) {
      errors.push('Approval threshold cannot exceed guardian count');
    }

    if (preset.emergencyThreshold && preset.emergencyThreshold > preset.guardianCount) {
      errors.push('Emergency threshold cannot exceed guardian count');
    }

    if (preset.guardianCount < 1 || preset.guardianCount > preset.maxGuardians) {
      errors.push(
        `Guardian count must be between 1 and ${preset.maxGuardians}`
      );
    }

    if (preset.maxTransactionLimit > preset.maxDailyLimit) {
      errors.push('Max transaction limit cannot exceed max daily limit');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get setup checklist for preset
   */
  static getSetupChecklist(preset: VaultPresetConfig): Array<{
    category: string;
    items: string[];
  }> {
    return [
      {
        category: 'Guardian Setup',
        items: [
          `Add ${preset.guardianCount} guardians`,
          `Assign roles: ${preset.recommendedGuardianRoles.join(', ')}`,
          'Enable 2FA for all guardians',
          'Document guardian responsibilities'
        ]
      },
      {
        category: 'Security Configuration',
        items: [
          'Enable all recommended security settings',
          'Configure device trust settings',
          'Set session timeout and lockout duration',
          'Test 2FA with all guardians'
        ]
      },
      {
        category: 'Limits & Thresholds',
        items: [
          `Set daily spending limit: $${preset.maxDailyLimit.toLocaleString()}`,
          `Set transaction limit: $${preset.maxTransactionLimit.toLocaleString()}`,
          'Configure approval thresholds',
          'Set notification triggers'
        ]
      },
      {
        category: 'Monitoring & Auditing',
        items: [
          'Enable audit logging',
          'Configure notification preferences',
          'Set up regular reconciliation schedule',
          'Enable activity summaries'
        ]
      },
      {
        category: 'Compliance',
        items: [
          'Review and agree to governance terms',
          'Document vault policies',
          ...preset.complianceNeeds
        ]
      }
    ];
  }

  /**
   * Compare presets
   */
  static comparePresets(presetIds: string[]): Record<string, any> {
    const presets = presetIds
      .map((id) => this.getPresetById(id))
      .filter((p) => p !== undefined) as VaultPresetConfig[];

    const comparisonFields = [
      'setupTime',
      'guardianCount',
      'approvalThreshold',
      'maxDailyLimit',
      'maxTransactionLimit',
      'riskLevel'
    ];

    const comparison: Record<string, any> = {};
    comparisonFields.forEach((field) => {
      comparison[field] = {};
      presets.forEach((preset) => {
        comparison[field][preset.name] = (preset as any)[field];
      });
    });

    return comparison;
  }

  /**
   * Export preset as JSON
   */
  static exportPreset(preset: VaultPresetConfig): string {
    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON
   */
  static importPreset(json: string): { preset: VaultPresetConfig | null; error: string | null } {
    try {
      const preset = JSON.parse(json) as VaultPresetConfig;
      const validation = this.validatePreset(preset);

      if (!validation.valid) {
        return {
          preset: null,
          error: `Invalid preset: ${validation.errors.join(', ')}`
        };
      }

      return { preset, error: null };
    } catch (err) {
      return {
        preset: null,
        error: err instanceof Error ? err.message : 'Failed to parse preset JSON'
      };
    }
  }

  /**
   * Get best practices for preset
   */
  static getBestPractices(presetId: string): string[] {
    const preset = this.getPresetById(presetId);
    return preset ? preset.bestPractices : [];
  }

  /**
   * Get security recommendations
   */
  static getSecurityRecommendations(preset: VaultPresetConfig): string[] {
    const recommendations: string[] = [];

    if (preset.securitySettings.requireTwoFactor) {
      recommendations.push('✓ 2FA is required for all guardians');
    }

    if (preset.securitySettings.enforceDeviceTrust) {
      recommendations.push(`✓ Trusted devices expire after ${preset.securitySettings.deviceTrustDuration} days`);
    }

    if (preset.securitySettings.ipRestrictions) {
      recommendations.push('✓ IP address restrictions are enabled');
    }

    if (preset.securitySettings.geoRestrictions) {
      recommendations.push('✓ Geographic restrictions are enabled');
    }

    // Add risk-based recommendations
    if (preset.riskLevel === 'high') {
      recommendations.push('⚠️ Consider implementing geographic or IP restrictions');
      recommendations.push('⚠️ Use hardware security keys if available');
      recommendations.push('⚠️ Implement shorter session timeouts');
    }

    if (preset.maxDailyLimit > 100000) {
      recommendations.push('⚠️ Large daily limits require extra monitoring');
      recommendations.push('⚠️ Consider insurance coverage for high-value vaults');
    }

    return recommendations;
  }
}

export default VaultPresetsService;
