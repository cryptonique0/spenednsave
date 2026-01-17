# Activity Logs & Vault Templates Guide

Comprehensive documentation for the Activity Log system and Vault Templates feature set in Spend & Save.

---

## Table of Contents

1. [Activity Logs](#activity-logs)
   - [Overview](#activity-logs-overview)
   - [Types & Categories](#activity-types--categories)
   - [Filtering & Searching](#filtering--searching)
   - [Exporting](#exporting)
   - [Use Cases](#activity-log-use-cases)
   - [API Reference](#activity-log-api-reference)

2. [Vault Templates](#vault-templates)
   - [Overview](#vault-templates-overview)
   - [Available Templates](#available-templates)
   - [Template Customization](#template-customization)
   - [Deployment](#template-deployment)
   - [Use Cases](#template-use-cases)
   - [API Reference](#vault-templates-api-reference)

3. [Integration Guide](#integration-guide)
   - [Settings Page Integration](#settings-page-integration)
   - [Component Usage](#component-usage)

4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Activity Logs

### Activity Logs Overview

The Activity Log system provides comprehensive tracking of all vault operations, security events, and user actions. Every activity is recorded with:

- **Timestamp**: When the action occurred
- **Type**: What kind of action (23 types available)
- **Category**: Organizational category (vault, guardian, transaction, security, settings, emergency, user)
- **Severity**: Impact level (critical, high, medium, low, info)
- **Status**: Success or failure
- **Metadata**: Additional context-specific information
- **Changes**: Before/after snapshots for modifications
- **User Info**: Who performed the action
- **Security Details**: IP address, user agent

**Purpose**: Compliance reporting, audit trails, troubleshooting, and security monitoring.

### Activity Types & Categories

#### 23 Activity Types

**Vault Operations** (3 types)
- `vault_created` - New vault deployed
- `vault_updated` - Vault configuration modified
- `vault_deleted` - Vault destroyed

**Guardian Management** (4 types)
- `guardian_added` - New guardian enrolled
- `guardian_removed` - Guardian removed from vault
- `guardian_approved` - Guardian approved a transaction
- `guardian_rejected` - Guardian rejected a transaction

**Transactions** (5 types)
- `transaction_initiated` - User started a withdrawal
- `transaction_approved` - Guardian approved withdrawal
- `transaction_rejected` - Guardian rejected withdrawal
- `transaction_completed` - Funds successfully transferred
- `transaction_failed` - Transaction execution failed

**Settings** (2 types)
- `threshold_updated` - Approval requirements changed
- `settings_changed` - Configuration modified

**Security** (4 types)
- `password_changed` - Password updated
- `2fa_enabled` - Two-factor authentication enabled
- `2fa_disabled` - Two-factor authentication disabled
- `security_event` - Security issue detected

**Emergency & Recovery** (3 types)
- `emergency_access_requested` - Emergency access initiated
- `emergency_access_approved` - Emergency access granted
- `recovery_initiated` - Account recovery started

**User** (2 types)
- `user_login` - User logged in
- `user_logout` - User logged out

#### 5 Severity Levels

| Level | Color | Use Case | Examples |
|-------|-------|----------|----------|
| **critical** | Red (#DC2626) | System-level failures, security breaches | Unauthorized access, vault compromise, recovery initiated |
| **high** | Orange (#EA580C) | Important failures requiring immediate attention | Transaction failure, guardian removal, 2FA disabled |
| **medium** | Yellow (#CA8A04) | Significant events worth noting | Guardian added, settings changed, suspicious activity |
| **low** | Blue (#2563EB) | Normal operations requiring minimal attention | Normal transactions, approvals, standard updates |
| **info** | Gray (#6B7280) | Informational only | User login, standard operations, configuration applied |

#### 7 Categories

| Category | Icon | Color | Purpose |
|----------|------|-------|---------|
| **vault** | 🔒 Lock | Blue | Core vault operations |
| **guardian** | 🛡️ Shield | Purple | Guardian management |
| **transaction** | ⚡ Zap | Yellow | Fund movements |
| **security** | ⚠️ Alert | Red | Security events |
| **settings** | ⚙️ Settings | Gray | Configuration changes |
| **emergency** | 🚨 Alert | Red | Emergency procedures |
| **user** | 👤 User | Blue | User actions |

### Filtering & Searching

The activity log provides powerful filtering across 7 dimensions:

#### 1. **Search**
Full-text search across:
- Action name
- Description
- Activity type
- Category
- Vault address
- User email

Example: Search "guardian" to find all guardian-related activities

#### 2. **Activity Types**
Filter by one or more specific activity types.

Example: Show only `transaction_initiated`, `transaction_approved`, and `transaction_completed`

#### 3. **Categories**
Filter by operational category.

Example: Show only "security" and "emergency" categories

#### 4. **Severity Levels**
Filter by impact level.

Example: Show only "critical" and "high" severity events

#### 5. **Date Range**
Filter by time period with start and end dates.

Example: Last 7 days, current month, custom range

#### 6. **Vault Address**
Filter to a specific vault.

Example: Only show activities for vault `0x1234...abcd`

#### 7. **User**
Filter by user ID or email.

Example: Show activities by specific team member

#### Success/Failure Only
Toggle to show only successful or only failed activities.

### Exporting

Export filtered activity logs in three formats:

#### CSV Export

**Best for**: Spreadsheet analysis, audit reports, external sharing

**Includes**:
- All basic fields (timestamp, type, action, description, severity, status)
- Optional metadata (additional context)
- Optional changes (before/after snapshots)

**Example usage**:
```
Timestamp,Type,Category,Severity,Action,Description,Vault Address,User,Success,Error Message
2024-01-15T10:30:45Z,transaction_initiated,transaction,medium,Withdrawal Started,User initiated $1000 withdrawal,0x1234...abcd,user@example.com,Yes,
2024-01-15T10:32:15Z,guardian_approved,guardian,low,Guardian Approval,Guardian approved withdrawal,0x1234...abcd,guardian@example.com,Yes,
```

**File size**: Typically 50-200 KB for 100-500 records

#### JSON Export

**Best for**: API integration, programmatic processing, complete data preservation

**Includes**:
- All fields in structured format
- Export statistics and metadata
- Applied filters information

**Example structure**:
```json
{
  "exportDate": "2024-01-15T11:00:00Z",
  "totalCount": 156,
  "statistics": {
    "totalActivities": 156,
    "successRate": 0.95,
    "failureCount": 8,
    "byCategory": {
      "transaction": 89,
      "vault": 34,
      "guardian": 22,
      "security": 11
    }
  },
  "filters": {
    "dateRange": { "start": 1705276800000, "end": 1705363200000 },
    "categories": ["transaction", "vault"]
  },
  "activities": [
    {
      "id": "act-001",
      "timestamp": "2024-01-15T10:30:45Z",
      "type": "transaction_initiated",
      "category": "transaction",
      "severity": "medium",
      "action": "Withdrawal Started",
      "description": "User initiated $1000 withdrawal",
      "success": true,
      "vaultAddress": "0x1234...abcd",
      "userEmail": "user@example.com",
      "metadata": {
        "amount": "1000",
        "currency": "USD",
        "destination": "0x5678...efgh"
      }
    }
  ]
}
```

**Includes**: All data, most complete export format

#### PDF Export

**Best for**: Reports, stakeholder sharing, professional documentation

**Includes**:
- Summary statistics
- Severity breakdown
- Category distribution
- Detailed activity list with metadata

**Report sections**:
1. Header with generation date and total count
2. Summary statistics (success rate, failures, date range)
3. Breakdown by severity
4. Breakdown by category
5. Complete activity details (up to 100 per page)

**File format**: Text-based PDF (compatible with all readers)

### Activity Log Use Cases

#### 1. **Compliance & Regulatory Reporting**
- Export monthly activity logs for regulatory bodies
- Demonstrate audit trails for SOX, HIPAA, PCI compliance
- Track all admin actions and approvals
- Document security events and responses

**Recommended settings**:
- Date range: 1 month
- Include metadata: Yes
- Include changes: Yes
- Export format: PDF (for executives) or CSV (for systems)

#### 2. **Security Incident Investigation**
- Search for suspicious activities
- Filter by severity (critical, high)
- Identify unauthorized access attempts
- Trace root cause of failed transactions

**Recommended filters**:
- Severity: critical, high
- Category: security, emergency
- Time range: around incident time
- Search: relevant keywords (error, failed, unauthorized)

#### 3. **Operational Troubleshooting**
- Identify why a transaction failed
- Understand approval workflow bottlenecks
- Track guardian response times
- Monitor system stability

**Recommended filters**:
- Type: transaction_failed, guardian_rejected
- Success: failures only
- Time range: relevant period
- Search: specific transaction or user

#### 4. **Guardian Performance Review**
- Count approvals/rejections per guardian
- Track response times
- Identify inactive guardians
- Demonstrate guardian engagement

**Recommended filters**:
- Type: guardian_approved, guardian_rejected
- User: specific guardian email
- Time range: quarterly or annual

#### 5. **Activity Analysis & Dashboarding**
- Generate summary statistics
- Track trends over time
- Identify peak activity periods
- Compare vault activity metrics

**Recommended approach**:
- Export JSON format
- Use in BI tools or spreadsheets
- Create custom dashboards and reports

### Activity Log API Reference

#### ActivityLog Interface

```typescript
interface ActivityLog {
  id: string;                          // Unique identifier
  timestamp: number;                   // Unix timestamp (ms)
  type: ActivityType;                  // 23 activity types
  category: ActivityCategory;          // 7 categories
  severity: ActivitySeverity;          // 5 severity levels
  vaultAddress?: string;               // Associated vault
  userId?: string;                     // User ID
  userEmail?: string;                  // User email address
  action: string;                      // Human-readable action
  description: string;                 // Detailed explanation
  metadata: Record<string, any>;       // Context-specific data
  changes?: {                          // Before/after snapshots
    before?: any;
    after?: any;
  };
  ipAddress?: string;                  // Source IP
  userAgent?: string;                  // Browser/client info
  success: boolean;                    // Success/failure status
  errorMessage?: string;               // Error details if failed
}
```

#### ActivityFilterOptions Interface

```typescript
interface ActivityFilterOptions {
  types?: ActivityType[];              // Filter by type(s)
  categories?: ActivityCategory[];     // Filter by category
  severities?: ActivitySeverity[];     // Filter by severity
  dateRange?: {                        // Custom date range
    start: number;                     // Start timestamp (ms)
    end: number;                       // End timestamp (ms)
  };
  vaultAddress?: string;               // Specific vault
  userId?: string;                     // Specific user
  searchTerm?: string;                 // Full-text search
  successOnly?: boolean;               // Only successful
}
```

#### ActivityExportOptions Interface

```typescript
interface ActivityExportOptions {
  format: 'csv' | 'json' | 'pdf';     // Export format
  includeMetadata?: boolean;           // Include context data
  includeChanges?: boolean;            // Include before/after
  filters?: ActivityFilterOptions;     // Apply filters
  filename?: string;                   // Custom filename
}
```

#### Key Service Methods

```typescript
// Export to CSV
ActivityLogExportService.exportToCSV(logs, options): string

// Export to JSON
ActivityLogExportService.exportToJSON(logs, options): string

// Export to PDF (text-based)
ActivityLogExportService.exportToPDF(logs, options): string

// Filter logs
ActivityLogExportService.filterLogs(logs, filters): ActivityLog[]

// Get statistics
ActivityLogExportService.getStatistics(logs): ActivityStatistics

// Search activities
ActivityLogExportService.searchActivities(logs, term): ActivityLog[]

// Group by date
ActivityLogExportService.groupByDate(logs): Record<string, ActivityLog[]>

// Get recent
ActivityLogExportService.getRecent(logs, limit): ActivityLog[]

// Get critical
ActivityLogExportService.getCritical(logs): ActivityLog[]

// Get failed
ActivityLogExportService.getFailed(logs): ActivityLog[]
```

---

## Vault Templates

### Vault Templates Overview

Vault Templates provide pre-built, production-ready vault configurations for quick deployment. Each template is optimized for a specific use case, with:

- **Guardian requirements**: Recommended number and roles
- **Approval thresholds**: Multi-signature settings
- **Transaction limits**: Daily and per-transaction caps
- **Feature set**: Enabled features and capabilities
- **Risk profile**: Security level assessment
- **Setup wizard**: Step-by-step deployment guide

**Purpose**: Reduce vault setup time from hours to minutes, with best-practice configurations.

### Available Templates

#### 1. **Personal Safe** 👤
**Category**: Personal | **Difficulty**: Beginner | **Setup Time**: 10 min

Perfect for individuals managing their own digital assets with basic safeguards.

- **Guardians**: 1 recommended (spouse, trusted friend, family member)
- **Approval Threshold**: 1 of 1
- **Features**:
  - Basic withdrawal limits
  - Daily spending cap ($10,000)
  - Emergency access
  - Activity logging
- **Limits**:
  - Max Daily: $10,000
  - Max Transaction: $5,000
- **Risk Level**: Low
- **Use Cases**: Personal crypto savings, daily spending allowance, emergency backup

---

#### 2. **Family Vault** 👨‍👩‍👧‍👦
**Category**: Family | **Difficulty**: Intermediate | **Setup Time**: 25 min

Shared vault for family members with multi-signature protection.

- **Guardians**: 3 required (spouse, adult child, trusted advisor)
- **Approval Threshold**: 2 of 3
- **Features**:
  - Multi-signature approval
  - Role-based access
  - Joint ownership
  - Inheritance protection
  - Activity audit trail
  - Monthly reconciliation
- **Limits**:
  - Max Daily: $50,000
  - Max Transaction: $25,000
  - Max Guardians: 5
- **Risk Level**: Low
- **Use Cases**: Joint family savings, heritage preservation, education fund, family treasury

---

#### 3. **Business Standard** 💼
**Category**: Business | **Difficulty**: Intermediate | **Setup Time**: 30 min

Standard business vault with expense controls and reporting.

- **Guardians**: 3 required (CFO, treasurer, CTO, legal counsel)
- **Approval Threshold**: 2 of 3
- **Features**:
  - Multi-level approval workflow
  - Expense categorization
  - Budget tracking
  - Comprehensive audit logs
  - Tax report generation
  - Team access controls
- **Limits**:
  - Max Daily: $100,000
  - Max Transaction: $50,000
  - Max Guardians: 10
- **Risk Level**: Low
- **Compliance**: Standard tier
- **Use Cases**: Company operating fund, vendor payments, employee reimbursement, payroll

---

#### 4. **Business Enterprise** 🏢
**Category**: Business | **Difficulty**: Advanced | **Setup Time**: 60 min

Enterprise-grade vault with advanced compliance and security.

- **Guardians**: 5 required (CFO, treasurer, CTO, legal, compliance officer)
- **Approval Threshold**: 3 of 5
- **Emergency Threshold**: 2 of 5
- **Features**:
  - Advanced multi-level approval
  - Blockchain-verified audit trail
  - SOX/HIPAA compliance reporting
  - Real-time monitoring
  - Scheduled transaction automation
  - Multi-currency support
  - Advanced analytics
  - Regulatory dashboard
- **Limits**:
  - Max Daily: $1,000,000
  - Max Transaction: $500,000
  - Max Guardians: 20
- **Risk Level**: Low
- **Compliance**: Enterprise tier, 99.9% SLA
- **Use Cases**: Institutional treasury, multi-subsidiary distribution, compliance operations

---

#### 5. **Nonprofit Standard** ❤️
**Category**: Nonprofit | **Difficulty**: Intermediate | **Setup Time**: 25 min

Nonprofit vault with donation tracking and charitable giving controls.

- **Guardians**: 3 required (executive director, treasurer, board member, legal)
- **Approval Threshold**: 2 of 3
- **Features**:
  - Donation tracking
  - Program funding allocation
  - Grant management
  - Donor reporting
  - 990-N compliance support
  - Tax documentation
  - Impact tracking
- **Limits**:
  - Max Daily: $250,000
  - Max Transaction: $100,000
  - Max Guardians: 8
- **Risk Level**: Low
- **Compliance**: Nonprofit tier
- **Use Cases**: Charitable donations, program funding, grant disbursement, donor relations

---

#### 6. **DAO Governance** 🏛️
**Category**: DAO | **Difficulty**: Advanced | **Setup Time**: 45 min

Decentralized autonomous organization with community voting.

- **Guardians**: 7 required (founding members, treasury lead, technical lead, community manager)
- **Approval Threshold**: 5 of 7
- **Emergency Threshold**: 3 of 7
- **Features**:
  - Community voting integration
  - Treasury management
  - Proposal tracking
  - Token holder governance
  - Timelock functionality
  - Multi-chain support
  - Delegation system
- **Limits**:
  - Max Daily: $5,000,000
  - Max Transaction: $1,000,000
  - Max Guardians: 50
- **Risk Level**: Medium
- **Decentralized**: Yes
- **Use Cases**: Community treasury, governance fund, development grants, DAO operations

---

#### 7. **High Security** 🔐
**Category**: Custom | **Difficulty**: Advanced | **Setup Time**: 90 min

Maximum security vault for large-value holdings.

- **Guardians**: 7 required (primary owner, legal advisor, security expert, family members)
- **Approval Threshold**: 5 of 7
- **Emergency Threshold**: 3 of 7
- **Features**:
  - Maximum approval requirements
  - Geographic guardian distribution
  - Biometric verification
  - Advanced encryption
  - Cold storage integration
  - Insurance coordination
  - Privacy protection
  - Legal document storage
- **Limits**:
  - Max Daily: 0 (manual approval required)
  - Max Transaction: 0 (manual approval required)
  - Max Guardians: 15
- **Risk Level**: Low
- **Complexity**: 5/5
- **Recommended Insurance**: Yes
- **Use Cases**: Billionaire assets, family office, estate planning, legacy protection

---

#### 8. **Startup Treasury** 🚀
**Category**: Business | **Difficulty**: Intermediate | **Setup Time**: 20 min

Treasury management for early-stage companies and startups.

- **Guardians**: 2 required (founder, CFO, investor representative)
- **Approval Threshold**: 1 of 2
- **Features**:
  - Fundraising tracking
  - Runway monitoring
  - Burn rate analysis
  - Investor reporting
  - Budget management
  - Team expense control
- **Limits**:
  - Max Daily: $100,000
  - Max Transaction: $50,000
  - Max Guardians: 5
- **Risk Level**: Medium
- **Compliance**: Growth tier
- **Use Cases**: Seed funding management, Series A distribution, team payroll, operating expenses

---

#### 9. **Escrow Service** ⚖️
**Category**: Custom | **Difficulty**: Intermediate | **Setup Time**: 35 min

Neutral third-party escrow for transactions and agreements.

- **Guardians**: 3 required (escrow agent, buyer rep, seller rep)
- **Approval Threshold**: 2 of 3
- **Features**:
  - Transaction escrow
  - Agreement management
  - Condition verification
  - Release authorization
  - Dispute resolution
  - Documentation storage
- **Limits**:
  - Max Transaction: $1,000,000
  - Max Guardians: 5
- **Risk Level**: Low
- **Regulated**: Yes
- **Use Cases**: Real estate escrow, acquisition escrow, licensing deals

---

### Template Customization

All templates can be customized before deployment:

#### Customizable Parameters

1. **Guardian Configuration**
   - Add/remove guardians
   - Change guardian roles
   - Adjust count requirements
   - Set regional distribution

2. **Approval Thresholds**
   - Adjust approval requirements
   - Set emergency thresholds
   - Configure escalation rules

3. **Transaction Limits**
   - Custom daily limits
   - Custom per-transaction limits
   - Tiered approval amounts

4. **Features**
   - Enable/disable specific features
   - Add custom integrations
   - Configure notifications

5. **Metadata**
   - Custom naming
   - Add description
   - Set tags and categories
   - Store linked documents

#### Customization Workflow

1. **Select Template**: Choose closest match
2. **Review Configuration**: Understand current settings
3. **Modify Parameters**: Adjust to your needs
4. **Validate Configuration**: Check requirements met
5. **Deploy**: Create vault with custom settings

```typescript
// Programmatic customization example
const baseTemplate = VaultTemplatesService.getTemplate('business-standard');

const customTemplate = VaultTemplatesService.customizeTemplate(baseTemplate, {
  guardians: {
    requiredCount: 4,  // Increased from 3
    recommended: ['cfo', 'treasurer', 'cto', 'legal_counsel', 'operations']
  },
  threshold: {
    approval: 3,  // Increased from 2
    emergency: 2  // Added emergency threshold
  },
  limits: {
    maxDaily: 250000,      // Increased from 100000
    maxTransaction: 150000, // Increased from 50000
    maxGuardians: 12       // Increased from 10
  }
});
```

### Template Deployment

#### Setup Wizard Steps

**Step 1: Review Template** (5 min)
- View template details
- Understand guardian requirements
- Review feature set
- Confirm risk level

**Step 2: Configure Guardians** (10 min)
- Invite guardians
- Assign roles
- Set contact information
- Configure geographic distribution

**Step 3: Set Thresholds** (5 min)
- Define approval requirements
- Set emergency thresholds
- Configure escalation rules
- Review security implications

**Step 4: Configure Limits** (5 min)
- Set daily limits
- Set transaction limits
- Enable/disable auto-enforcement
- Configure override rules

**Step 5: Review & Deploy** (5-60 min depending on template)
- Final configuration review
- Security check
- Cost estimation
- Deploy to blockchain

#### Deployment API

```typescript
// Deploy template
const vaultConfig = VaultTemplatesService.getTemplateConfig(template);

// Customize before deployment
const customConfig = {
  ...vaultConfig,
  guardians: {
    required: 3,
    addresses: ['0x123...', '0x456...', '0x789...']
  }
};

// Deploy to network
const vaultAddress = await deployVault(customConfig);
```

### Template Use Cases

#### Scenario 1: Startup Founder
**Challenge**: Need treasury fast, limited resources

**Solution**: Startup Treasury template
- 20 min setup
- Minimal guardian requirements (2)
- Built-in investor reporting
- Runway monitoring included

**Benefits**:
- Quick deployment
- Investor-friendly reporting
- Expense tracking for burn rate
- Team payment controls

---

#### Scenario 2: Family Office
**Challenge**: Complex multi-generational wealth, regulatory requirements, privacy

**Solution**: High Security template + customization
- Start with High Security (most conservative)
- Add geographic distribution of guardians
- Integrate cold storage options
- Configure insurance coordination
- Add estate planning documents

**Benefits**:
- Maximum security
- Regulatory compliance ready
- Privacy protection
- Family dynasty optimization

---

#### Scenario 3: Nonprofit Organization
**Challenge**: Manage donations, demonstrate impact, maintain compliance

**Solution**: Nonprofit Standard template
- Donation tracking built-in
- 990-N compliance features
- Program funding allocation
- Impact metrics

**Benefits**:
- Compliance ready
- Donor transparency
- Impact documentation
- Grant management

---

#### Scenario 4: DAO Treasury
**Challenge**: Community governance, transparent voting, token holder alignment

**Solution**: DAO Governance template
- Multi-signature with community voting
- Timelock functionality
- Proposal tracking
- Token-holder delegation

**Benefits**:
- Community alignment
- Transparent governance
- Automated timelocks
- Multi-chain support

---

### Vault Templates API Reference

#### VaultTemplate Interface

```typescript
interface VaultTemplate {
  id: string;                        // Unique identifier
  name: string;                      // Display name
  description: string;               // Short description
  category: string;                  // personal, family, business, nonprofit, dao, custom
  icon: string;                      // Emoji icon
  color: string;                     // Tailwind color (blue, green, etc.)
  difficulty: string;                // beginner, intermediate, advanced
  estimatedSetupTime: number;        // Minutes
  guardians: {
    requiredCount: number;           // Minimum guardians
    recommended: string[];           // Suggested roles
  };
  threshold: {
    approval: number;                // Required approvals
    emergency: number;               // Emergency threshold
  };
  features: string[];                // Enabled features
  limits: {
    maxDaily?: number;               // Daily limit
    maxTransaction?: number;         // Per-transaction limit
    maxGuardians?: number;           // Maximum guardians
  };
  riskLevel: string;                 // low, medium, high
  useCase: string;                   // Primary use case
  exampleScenarios: string[];        // Real-world examples
  metadata: Record<string, any>;     // Custom data
  tags: string[];                    // Search tags
  createdAt: number;                 // Timestamp
  updatedAt: number;                 // Timestamp
}
```

#### Key Service Methods

```typescript
// Get all templates
VaultTemplatesService.getAllTemplates(): VaultTemplate[]

// Get by ID
VaultTemplatesService.getTemplate(id): VaultTemplate | null

// Get by category
VaultTemplatesService.getTemplatesByCategory(category): VaultTemplate[]

// Get by difficulty
VaultTemplatesService.getTemplatesByDifficulty(difficulty): VaultTemplate[]

// Get categories
VaultTemplatesService.getCategories(): VaultTemplateCategory[]

// Search templates
VaultTemplatesService.searchTemplates(query): VaultTemplate[]

// Get recommendations
VaultTemplatesService.getRecommendations(guardianCount, riskProfile, usageType): VaultTemplate[]

// Get setup config
VaultTemplatesService.getTemplateConfig(template): Config

// Customize template
VaultTemplatesService.customizeTemplate(template, customizations): VaultTemplate

// Validate template
VaultTemplatesService.validateTemplate(template): {valid, errors}

// Export as JSON
VaultTemplatesService.exportTemplate(template): string

// Import from JSON
VaultTemplatesService.importTemplate(json): {template, error}

// Get setup steps
VaultTemplatesService.getSetupWizardSteps(template): Step[]
```

---

## Integration Guide

### Settings Page Integration

The Activity Log and Vault Templates systems are fully integrated into the Settings page.

#### Accessing Features

**Via Settings Navigation**:
- Navigate to `/settings`
- Click "Activity" tab for activity logs
- Click "Templates" tab for vault templates

**Via URL Parameters**:
```
/settings?tab=activity-logs
/settings?tab=vault-templates
```

**Programmatically**:
```tsx
import { useRouter } from 'next/navigation';

function openActivityLogs() {
  const router = useRouter();
  router.push('/settings?tab=activity-logs');
}
```

### Component Usage

#### ActivityLogComponent

```tsx
import { ActivityLogComponent } from '@/components/activity/activity-log-component';
import { createSampleActivityLogs } from '@/lib/services/activity/activity-log-types';

export function MyActivityView() {
  const logs = createSampleActivityLogs();
  
  return (
    <ActivityLogComponent
      logs={logs}
      vaultAddress="0x1234..."
      userId="user-id"
      maxHeight="max-h-96"
      compact={false}
    />
  );
}
```

#### VaultTemplatesComponent

```tsx
import { VaultTemplatesComponent } from '@/components/vault-setup/vault-templates-component';
import { VaultTemplate } from '@/lib/services/vault/vault-templates-service';

export function MyTemplateGallery() {
  const [selected, setSelected] = useState<VaultTemplate | null>(null);
  
  return (
    <VaultTemplatesComponent
      onSelectTemplate={setSelected}
      viewMode="gallery"
      maxDisplayCount={12}
      showFeatured={true}
    />
  );
}
```

---

## Best Practices

### Activity Logs

1. **Regular Reviews**: Check logs weekly for security events
2. **Archive Old Logs**: Export and archive logs > 90 days old
3. **Set Retention Policy**: Choose appropriate retention (30 days default)
4. **Monitor Failures**: Set up alerts for high failure rates
5. **Document Changes**: Use metadata field for context on configuration changes
6. **Regular Exports**: Monthly exports for compliance archiving
7. **Search Strategically**: Use specific keywords for faster results

### Vault Templates

1. **Start Conservative**: Choose more restrictive template, relax later
2. **Test First**: Deploy to testnet before mainnet
3. **Document Customizations**: Record any changes to base template
4. **Review Guardian List**: Ensure guardians are current and reachable
5. **Regular Audits**: Review configuration quarterly
6. **Plan for Growth**: Choose templates with room to scale
7. **Legal Review**: Have legal team review configuration before production

---

## Troubleshooting

### Activity Logs

**Q: I don't see recent activities**
- A: Ensure logging is enabled in preferences
- A: Check date range filter
- A: Refresh the page

**Q: Export is too large**
- A: Filter by date range (30 days or less)
- A: Exclude metadata if not needed
- A: Use CSV instead of JSON

**Q: Search not finding expected results**
- A: Search is case-insensitive but requires exact matches
- A: Try partial terms (e.g., "guardian" instead of "guardian_approved")
- A: Check category/severity filters

### Vault Templates

**Q: Template validation fails**
- A: Check minimum guardian count
- A: Ensure approval threshold ≤ guardian count
- A: Verify template name is not empty

**Q: Customization not working**
- A: Ensure new settings are logically consistent
- A: Check that custom values are within allowed ranges
- A: Validate after customization

**Q: Setup wizard is slow**
- A: Network connection may be slow
- A: Ensure guardian invitations are accepted
- A: Check browser console for errors

---

## FAQ

**Q: How long are activity logs retained?**
A: Default is 30 days. You can change to 90 days, 1 year, or indefinite in preferences.

**Q: Can I edit or delete activity logs?**
A: No. Logs are immutable for compliance and security.

**Q: Which template should I choose?**
A: Start with the template closest to your use case. The Setup Wizard will guide you through customization.

**Q: Can I switch templates after deployment?**
A: No. You would need to deploy a new vault. However, you can modify the current vault's configuration.

**Q: Are activity logs encrypted?**
A: Activity logs are stored securely. Sensitive data (errors, metadata) can be excluded from exports.

**Q: Can multiple people export activity logs?**
A: Yes. Anyone with vault access can export logs.

**Q: What's the difference between CSV and JSON exports?**
A: CSV is for spreadsheets/basic analysis. JSON includes all data for programmatic processing.

**Q: Can I automate exports?**
A: Yes. The export service can be called from backend processes for automated reporting.

**Q: Do templates require smart contract deployment?**
A: Templates define configuration. Deployment depends on your vault architecture.

**Q: Can I mix template configurations?**
A: Yes. Customization allows combining features from multiple templates.

**Q: Is there a template for solo users?**
A: Yes. The "Personal Safe" template is designed for individuals with minimal overhead.

---

## Additional Resources

- [Vault Architecture Guide](./VAULT_ARCHITECTURE.md)
- [Security Guidelines](./SECURITY.md)
- [Compliance Guide](./COMPLIANCE.md)
- [API Reference](./API_REFERENCE.md)

---

## Support

For questions or issues:
- Email: support@spendandsave.app
- Discord: [Community Server]
- Docs: [Full Documentation]

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Status**: Production Ready
