# GovDao - Quick Reference Guide

## 🎯 Quick Start

### Check Your Voting Power
```typescript
import { useVotingPower } from '@/lib/hooks/useGovernance';

function App() {
  const { metrics, votingPower, tier } = useVotingPower();
  return <div>Power: {votingPower} | Tier: {tier}</div>;
}
```

### Vote on a Proposal
```typescript
import { useSubmitVote } from '@/lib/hooks/useGovernance';
import { VoteType } from '@/lib/govdao';

const { submitVote } = useSubmitVote();
await submitVote(proposalId, VoteType.FOR);
```

### Create a Proposal
```typescript
import { useCreateProposal } from '@/lib/hooks/useGovernance';
import { ProposalType } from '@/lib/govdao';

const { createProposal } = useCreateProposal();
await createProposal({
  title: 'Your Proposal Title',
  description: 'Short description',
  type: ProposalType.FEATURE_REQUEST,
  content: 'Detailed proposal content',
});
```

---

## 📊 Voting Power Tiers

| Tier | Power | Badge | Permissions |
|------|-------|-------|-------------|
| 🥇 Founder | 1000+ | Gold | Create & Vote |
| 🥈 Lead | 500+ | Purple | Create & Vote |
| 🥉 Senior | 250+ | Blue | Create & Vote |
| ⭐ Active | 100+ | Green | Create & Vote |
| 👥 Member | 10+ | Slate | Vote Only |
| 🔵 Participant | 0+ | Gray | Earn Power |

---

## 📈 Voting Power Formula

```
Total Power = (Balance Score × 0.30)
            + (Guardian Score × 0.20)
            + (Activity Score × 0.20)
            + (Age Score × 0.15)
            + (Diversity Score × 0.15)
```

### Score Calculations
- **Balance**: ETH Amount / 10 (min 1)
- **Guardians**: n × (n+1) / 2
- **Activity**: Transactions × 0.5 (min 1)
- **Age**: Days / 100 (min 1)
- **Diversity**: 1-2 tokens=2, 3-4=5, 5-6=10

---

## 🗳️ Voting Rules

✅ **Can Vote If:**
- Have 1+ voting power
- Haven't voted on this proposal
- Proposal is active

❌ **Cannot Vote If:**
- No voting power
- Already voted
- Proposal not active

---

## 📋 Proposal Types

1. **FEATURE_REQUEST** - New features
2. **BUG_REPORT** - Bug fixes (1.5x rewards)
3. **RISK_PARAMETER** - Risk settings (1.8x rewards)
4. **VAULT_POLICY** - Vault rules (1.6x rewards)
5. **GUARDIAN_POLICY** - Guardian rules (1.4x rewards)
6. **PROTOCOL_UPGRADE** - Major updates (2.0x rewards)
7. **BUDGET_ALLOCATION** - Resource allocation (1.7x rewards)
8. **COMMUNITY_INITIATIVE** - Community projects (1.3x rewards)

---

## 🔑 Key Functions

### Core Calculations
```typescript
import {
  calculateTotalVotingPower,
  determineVotingTier,
  calculateVaultBalanceScore,
  calculateGuardianCountScore,
  calculateActivityCountScore,
  calculateVaultAgeScore,
  calculateTokenDiversityScore,
  formatVotingPower,
} from '@/lib/govdao';

// Calculate power
const power = calculateTotalVotingPower({
  vaultBalance: BigInt(10e18),
  guardianCount: 2,
  activityCount: 50,
  vaultAgeInDays: 100,
  tokenDiversity: 3,
});

// Get tier
const tier = determineVotingTier(power);

// Format for display
const formatted = formatVotingPower(power);
```

### Proposal Management
```typescript
import { ProposalStatus, VoteType } from '@/lib/govdao';

// Check proposal status
if (proposal.status === ProposalStatus.ACTIVE) {
  // Can vote
}

// Check if user can create proposals
import { canCreateProposal } from '@/lib/govdao';
if (canCreateProposal(votingPower)) {
  // Show create button
}

// Check if user can vote
import { canVoteOnProposal } from '@/lib/govdao';
if (canVoteOnProposal(votingPower, proposal, userAddress)) {
  // Show vote buttons
}
```

---

## 📊 React Hooks Reference

### useVotingPower()
```typescript
const {
  metrics,           // GovernanceMetrics object
  isLoading,         // Loading state
  error,             // Error message
  votingPower,       // Calculated power
  tier,              // User tier
  canCreateProposal, // Boolean
} = useVotingPower();
```

### useProposals(filter?)
```typescript
const {
  proposals,  // Array of proposals
  isLoading,  // Loading state
  error,      // Error message
  refetch,    // Refetch function
} = useProposals({
  status: 'active',
  type: 'feature-request',
  sortBy: 'newest',
});
```

### useProposal(proposalId)
```typescript
const {
  proposal,   // Single proposal object
  isLoading,  // Loading state
  error,      // Error message
} = useProposal(proposalId);
```

### useSubmitVote()
```typescript
const {
  submitVote, // async (id, voteType) => boolean
  isLoading,  // Loading state
  error,      // Error message
} = useSubmitVote();
```

### useCreateProposal()
```typescript
const {
  createProposal, // async (data) => Proposal | null
  isLoading,      // Loading state
  error,          // Error message
} = useCreateProposal();
```

### useGovernanceStats()
```typescript
const {
  stats: {
    totalProposals,    // Number
    activeProposals,   // Number
    totalVoters,       // Number
    averageVotingPower,// Number
    totalVotingPower,  // Number
  },
  isLoading,
  error,
} = useGovernanceStats();
```

---

## 🎨 UI Components

### GovDaoDashboard
```typescript
import { GovDaoDashboard } from '@/components/community/govdao-dashboard';

<GovDaoDashboard
  onCreateProposal={() => console.log('create')}
  onProposalClick={(id) => console.log('clicked', id)}
/>
```

### VotingPowerBreakdown
```typescript
import { VotingPowerBreakdown } from '@/components/community/voting-power-breakdown';

<VotingPowerBreakdown className="my-8" />
```

---

## 💡 Common Tasks

### Task 1: Display User's Voting Power
```typescript
const { votingPower, tier } = useVotingPower();
return (
  <div>
    <h3>Your Voting Power: {formatVotingPower(votingPower)}</h3>
    <p>Tier: {VOTING_TIERS[tier].label}</p>
  </div>
);
```

### Task 2: List All Active Proposals
```typescript
const { proposals } = useProposals({ status: 'active' });
return (
  <div>
    {proposals.map(p => (
      <div key={p.id}>
        <h4>{p.title}</h4>
        <p>{p.description}</p>
      </div>
    ))}
  </div>
);
```

### Task 3: Vote on a Proposal
```typescript
const { submitVote, isLoading } = useSubmitVote();

const handleVote = async (proposalId, voteType) => {
  const success = await submitVote(proposalId, voteType);
  if (success) {
    alert('Vote recorded!');
  }
};

return (
  <button 
    onClick={() => handleVote(proposalId, VoteType.FOR)}
    disabled={isLoading}
  >
    Vote For
  </button>
);
```

### Task 4: Create a Proposal
```typescript
const { createProposal, isLoading } = useCreateProposal();

const handleCreate = async () => {
  const proposal = await createProposal({
    title: 'Add DEGEN Token',
    description: 'Add support for DEGEN token',
    type: ProposalType.FEATURE_REQUEST,
    content: 'We should add DEGEN token support...',
  });
  
  if (proposal) {
    console.log('Proposal created:', proposal.id);
  }
};

return (
  <button onClick={handleCreate} disabled={isLoading}>
    Create Proposal
  </button>
);
```

---

## 🔍 Debugging Tips

### Check Voting Power Calculation
```typescript
import { calculateTotalVotingPower } from '@/lib/govdao';

const metrics = {
  vaultBalance: BigInt(50e18),
  guardianCount: 3,
  activityCount: 100,
  vaultAgeInDays: 200,
  tokenDiversity: 4,
};

console.log('Power:', calculateTotalVotingPower(metrics));
```

### Log Proposal Status
```typescript
const { proposal } = useProposal(proposalId);
console.log('Status:', proposal?.status);
console.log('Votes For:', proposal?.votesFor);
console.log('Votes Against:', proposal?.votesAgainst);
console.log('Quorum Met:', proposal?.quorumMet);
```

### Check User Vote Eligibility
```typescript
import { canVoteOnProposal } from '@/lib/govdao';

const canVote = canVoteOnProposal(votingPower, proposal, userAddress);
console.log('Can vote:', canVote);
```

---

## 📱 API Endpoints

```
GET  /api/governance/voting-power
GET  /api/governance/proposals
GET  /api/governance/proposals/:id
POST /api/governance/proposals
POST /api/governance/proposals/:id/vote
GET  /api/governance/voting-history
GET  /api/governance/stats
```

---

## 🔗 Navigation

- **Community Page**: `/community` → "GovDao Governance" tab
- **Governance Stats**: Built into dashboard
- **User Voting Power**: Visible in voting power card

---

## ⚡ Performance Tips

1. **Memoize Voting Power**: Cache results for 5 minutes
2. **Paginate Proposals**: Load 10 at a time
3. **Lazy Load Components**: Use code splitting
4. **Optimize Voting Power Calc**: Only recalc when vault changes

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| Voting power not loading | Refresh page, reconnect wallet |
| Can't create proposal | Need 10+ voting power |
| Vote submission fails | Check wallet connection |
| Quorum not met | Need 25% of active members |

---

**Version**: 1.0.0  
**Last Updated**: January 2026
