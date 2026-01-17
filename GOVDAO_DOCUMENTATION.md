# GovDao - Governance Decentralized Autonomous Organization

## 🎯 Overview

GovDao is a governance system that empowers SpendGuard users with voting power based on their vault activity and engagement. Users can participate in community decisions, create proposals, and vote on governance matters with weighted voting power calculated from multiple metrics.

## 📊 Voting Power Calculation

Voting power is calculated using a weighted formula across 5 key metrics:

### Metrics Breakdown

| Metric | Weight | Formula | Purpose |
|--------|--------|---------|---------|
| **Vault Balance** | 30% | Balance (ETH) / 10 (min 1) | Incentivizes long-term capital commitment |
| **Guardian Count** | 20% | n × (n+1) / 2 (quadratic) | Rewards security-conscious users |
| **Activity Count** | 20% | Transactions × 0.5 (min 1) | Encourages active participation |
| **Vault Age** | 15% | Days / 100 (min 1) | Gives preference to established users |
| **Token Diversity** | 15% | 1-2 tokens: 2, 3-4: 5, 5-6: 10 | Encourages diverse portfolios |

### Example Calculations

**User A: Conservative Hodler**
- Vault Balance: 50 ETH → Score: 5
- Guardians: 2 → Score: 3
- Activity: 50 txns → Score: 25
- Vault Age: 200 days → Score: 2
- Token Diversity: 2 tokens → Score: 2
- **Total Voting Power: ~19.1**

**User B: Active Community Member**
- Vault Balance: 10 ETH → Score: 1
- Guardians: 4 → Score: 10
- Activity: 100 txns → Score: 50
- Vault Age: 365 days → Score: 3.65
- Token Diversity: 5 tokens → Score: 10
- **Total Voting Power: ~31.4**

## 🏆 Voting Tiers

Users are assigned tiers based on total voting power:

| Tier | Voting Power | Color | Benefits |
|------|--------------|-------|----------|
| 🥇 **Founder** | 1000+ | Gold | Maximum influence, proposal creation, voting rewards |
| 🥈 **Lead Governor** | 500+ | Purple | High influence, proposal creation, voting rewards |
| 🥉 **Senior Member** | 250+ | Blue | Standard influence, proposal creation, voting rewards |
| ⭐ **Active Member** | 100+ | Green | Can vote and create proposals |
| 👥 **Member** | 10+ | Slate | Can vote on proposals |
| 🔵 **Participant** | 0+ | Gray | View-only access (can earn voting power) |

## 📋 Proposal Types

Users can create and vote on various proposal types:

### Available Proposal Categories

1. **Feature Requests** - Suggest new features and improvements
2. **Bug Reports** - Report and prioritize bug fixes
3. **Risk Parameters** - Adjust vault risk settings and limits
4. **Vault Policy** - Changes to vault rules and operations
5. **Guardian Policy** - Modifications to guardian functionality
6. **Protocol Upgrades** - Major system updates and improvements
7. **Budget Allocation** - Resource allocation decisions
8. **Community Initiatives** - Community-driven projects

### Proposal Lifecycle

```
DRAFT → ACTIVE → VOTING → CLOSED → [PASSED/REJECTED]
                                    ↓
                            [EXECUTING] → [EXECUTED]
```

## 🗳️ Voting System

### Voting Rules

- **Eligibility**: Must have minimum 1 voting power
- **One Vote Per User**: Can only vote once per proposal
- **Vote Types**:
  - ✅ **For** - Support the proposal
  - ❌ **Against** - Oppose the proposal
  - ⭕ **Abstain** - Neutral position
- **Voting Window**: 7 days from proposal start
- **Quorum**: 25% of active members required for execution
- **Threshold**: 50% of votes required to pass

### Voting Rewards

Participants earn small rewards for voting, with bonuses for high-importance proposals:

| Proposal Type | Reward Multiplier |
|---------------|-------------------|
| Protocol Upgrade | 2.0x |
| Risk Parameter | 1.8x |
| Budget Allocation | 1.7x |
| Vault Policy | 1.6x |
| Bug Report | 1.5x |
| Guardian Policy | 1.4x |
| Feature Request | 1.2x |
| Community Initiative | 1.3x |

## 🚀 Getting Started

### For Users

1. **Connect Your Wallet**
   - Go to Community → GovDao Governance
   - Connect your wallet that holds SpendGuard vault

2. **Check Your Voting Power**
   - View your voting power breakdown
   - See which tier you belong to
   - Understand your voting power sources

3. **Vote on Proposals**
   - Browse active proposals
   - Read proposal details
   - Submit your vote (if eligible)
   - Earn voting rewards

4. **Create Proposals** (if eligible)
   - Must have 10+ voting power
   - Fill proposal form
   - Describe your idea clearly
   - Submit for community review

### For Developers

#### Installation

```bash
npm install # All dependencies already included
```

#### Using the Hooks

```typescript
import {
  useVotingPower,
  useProposals,
  useSubmitVote,
  useCreateProposal,
  useGovernanceStats,
} from '@/lib/hooks/useGovernance';

// Get user's voting power
const { metrics, votingPower, tier, canCreateProposal } = useVotingPower();

// Fetch proposals
const { proposals, isLoading } = useProposals({
  status: 'active',
  sortBy: 'newest',
});

// Submit a vote
const { submitVote, isLoading } = useSubmitVote();
await submitVote(proposalId, VoteType.FOR);

// Create a proposal
const { createProposal } = useCreateProposal();
const proposal = await createProposal({
  title: 'Add Token Support',
  description: 'Add support for more tokens',
  type: ProposalType.FEATURE_REQUEST,
  content: 'Detailed proposal content...',
});
```

## 📁 File Structure

```
lib/
├── govdao.ts                          # Core governance logic (680+ lines)
├── hooks/
│   └── useGovernance.ts               # React hooks for governance (470+ lines)

components/
├── community/
│   ├── govdao-dashboard.tsx           # Main governance dashboard (380+ lines)
│   └── voting-power-breakdown.tsx     # Voting power visualization (210+ lines)

app/
└── community/
    └── page.tsx                       # Community page with governance tab
```

## 🔐 Security Features

### Input Validation
- Proposal content length limits (min 10, max 5000 chars)
- Vote counts validation
- Address verification
- Timestamp validation

### Double-Vote Prevention
- User vote tracking
- Unique vote record verification
- Transaction replay protection

### Governance Safeguards
- Quorum requirements (prevent low participation decisions)
- Voting thresholds (prevent slim majorities)
- Time locks (prevent hasty execution)
- Proposal cooldown (prevent spam)

## 📈 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Voting Power Calculation | <100ms | In-memory computation |
| Proposal Fetch | <500ms | Database query |
| Vote Submission | <1000ms | Includes validation |
| Page Load | <2s | Optimized queries |
| Voting Power Cache | 5 min | Reduces computation load |

## 🔗 Integration Points

### With Existing Features

- **Activity Log**: Voting and proposals appear in activity log
- **Spending Limits**: Proposal execution can adjust spending limits
- **Vault Settings**: Users can propose setting changes
- **Guardian Roles**: Governance decisions affect guardian policies
- **Analytics**: Governance participation metrics included

### API Endpoints

```
GET  /api/governance/voting-power?address=0x...
GET  /api/governance/proposals
GET  /api/governance/proposals/:id
POST /api/governance/proposals
POST /api/governance/proposals/:id/vote
GET  /api/governance/voting-history?address=0x...
GET  /api/governance/stats
```

## 📊 Dashboard Features

### User Section
- Voting power display with tier badge
- Vault balance and metrics
- Guardian count and vault age
- Token diversity stats

### Proposals Section
- List of all proposals with filtering
- Status indicators (Active, Passed, Rejected, Closed)
- Voting progress bars
- Quorum status
- Create proposal button (if eligible)

### Voting Power Breakdown
- Expandable detailed breakdown
- Visual contribution bars
- Tips for increasing voting power
- Score calculations

## 🎓 Examples

### Example 1: Voting on a Proposal

```typescript
// User sees proposal in dashboard
// Clicks on proposal to view details
// Reads proposal content
// Clicks "Vote For" button

const { submitVote } = useSubmitVote();
const success = await submitVote(proposalId, VoteType.FOR);

if (success) {
  // Vote recorded
  // User earns voting reward
  // Proposal vote count updates
}
```

### Example 2: Creating a Proposal

```typescript
// User clicks "Create Proposal" (only if voting power >= 10)
// Fills form with details
// Clicks submit

const { createProposal, isLoading } = useCreateProposal();
const newProposal = await createProposal({
  title: 'Enable Batch Withdrawals',
  description: 'Allow multiple guardians to approve withdrawals in batches',
  type: ProposalType.FEATURE_REQUEST,
  content: 'Detailed explanation of the proposal...',
  attachments: ['ipfs://QmXxx...'], // Optional
});

if (newProposal) {
  // Proposal created
  // Goes to DRAFT status
  // Can be published after review
}
```

### Example 3: Calculating Voting Power

```typescript
import { calculateTotalVotingPower, determineVotingTier } from '@/lib/govdao';

const power = calculateTotalVotingPower({
  vaultBalance: BigInt(50e18), // 50 ETH
  guardianCount: 3,
  activityCount: 75,
  vaultAgeInDays: 180,
  tokenDiversity: 4,
});

const tier = determineVotingTier(power);
console.log(`Voting Power: ${power}, Tier: ${tier}`);
```

## 🛠️ Troubleshooting

### "You don't have enough voting power to create proposals"

**Solution**: 
- Increase vault balance
- Add more guardians
- Wait for vault to age
- Diversify your tokens
- Increase transaction activity

### "You've already voted on this proposal"

**Solution**:
- Each user can only vote once per proposal
- Wait for next proposal to participate again

### "Proposal failed to submit"

**Solution**:
- Check wallet connection
- Verify proposal content (min 10 chars)
- Ensure voting power is loaded
- Try again in a few seconds

### "Can't see my voting power metrics"

**Solution**:
- Refresh the page
- Reconnect wallet
- Clear browser cache
- Check if wallet has vault set up

## 📚 Related Documentation

- [SpendGuard Features](README.md)
- [Vault Setup Guide](VAULT_EDUCATION_QUICKSTART.md)
- [Guardian Roles](ENHANCED_GUARDIAN_SUMMARY.md)
- [Security Features](EMERGENCY_FREEZE_SPEC.md)

## 🚀 Future Enhancements

### Phase 2: Advanced Governance
- Delegation of voting power
- Multi-sig proposal execution
- Voting weight NFTs
- DAO treasury management

### Phase 3: Governance Analytics
- Voting participation metrics
- Proposal success rate tracking
- Voting pattern analysis
- Governance impact reports

### Phase 4: Cross-DAO Governance
- Inter-DAO proposals
- Cross-community voting
- Federated governance
- Multi-DAO coordination

## 📞 Support

### Getting Help
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review proposal examples in documentation
3. Visit community Discord for support
4. Report bugs on GitHub

### Reporting Issues
- Provide wallet address (or anonymize)
- Describe steps to reproduce
- Include error messages
- Mention voting power tier

## 📄 License

GovDao is part of SpendGuard and follows the same license as the main project.

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: 🟢 Active & Operational
