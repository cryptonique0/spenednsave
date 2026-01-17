# GovDao Integration Guide

## 📖 Complete Integration Instructions

This guide walks through integrating GovDao governance features into your SpendGuard application.

---

## 📁 File Structure

All GovDao files are already created and integrated:

```
lib/
├── govdao.ts                          # Core governance logic & calculations
└── hooks/
    └── useGovernance.ts               # React hooks for governance

components/
└── community/
    ├── govdao-dashboard.tsx           # Main governance UI
    └── voting-power-breakdown.tsx     # Voting power visualization

app/
└── community/
    └── page.tsx                       # Community page with governance tab

Documentation/
├── GOVDAO_DOCUMENTATION.md            # Full feature documentation
├── GOVDAO_QUICKREF.md                 # Quick reference guide
└── GOVDAO_INTEGRATION_GUIDE.md        # This file
```

---

## 🚀 Integration Points

### 1. Community Page Integration (✅ Done)

The GovDao dashboard is already integrated into the community page:

```typescript
// app/community/page.tsx - Already updated

import { GovDaoDashboard } from '@/components/community/govdao-dashboard';
import { VotingPowerBreakdown } from '@/components/community/voting-power-breakdown';

// Added new tab: 'governance'
type CommunityTab = 'highlights' | 'withdrawal-messages' | 'guardian-roles' | 'governance';

// Components are rendered when governance tab is active
{activeTab === 'governance' && (
  <div className="space-y-8">
    <VotingPowerBreakdown />
    <GovDaoDashboard />
  </div>
)}
```

**Access**: Navigate to `/community` and click "GovDao Governance" tab

### 2. API Endpoints (To Be Implemented)

Create these API routes to support GovDao:

#### `/api/governance/voting-power`
```typescript
// app/api/governance/voting-power/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { buildGovernanceMetrics } from '@/lib/govdao';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  if (!address) {
    return NextResponse.json(
      { error: 'Address required' },
      { status: 400 }
    );
  }

  try {
    // Fetch user's vault data from database
    // Calculate voting metrics
    // Return metrics
    
    const metrics = buildGovernanceMetrics(
      vaultBalance,      // BigInt
      guardianCount,      // Number
      activityCount,      // Number
      vaultCreatedDate,   // Date
      tokenCount,         // Number
      vaultBalanceUSD     // Optional
    );

    return NextResponse.json({ metrics });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch voting power' },
      { status: 500 }
    );
  }
}
```

#### `/api/governance/proposals`
```typescript
// app/api/governance/proposals/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Query parameters
  const status = request.nextUrl.searchParams.get('status');
  const type = request.nextUrl.searchParams.get('type');
  const proposer = request.nextUrl.searchParams.get('proposer');
  const sortBy = request.nextUrl.searchParams.get('sortBy');

  // Fetch proposals from database with filters
  // Sort results
  // Return paginated results
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate proposal
  // Create proposal in database
  // Return created proposal
}
```

#### `/api/governance/proposals/[id]`
```typescript
// app/api/governance/proposals/[id]/route.ts

export async function GET(request: NextRequest, { params }) {
  const { id } = params;
  
  // Fetch proposal from database
  // Return proposal with votes
}
```

#### `/api/governance/proposals/[id]/vote`
```typescript
// app/api/governance/proposals/[id]/vote/route.ts

export async function POST(request: NextRequest, { params }) {
  const body = await request.json();
  const { voterAddress, voteType, votingPower } = body;
  
  // Validate vote
  // Check no duplicate vote
  // Record vote in database
  // Update proposal vote counts
  // Return updated proposal
}
```

#### `/api/governance/stats`
```typescript
// app/api/governance/stats/route.ts

export async function GET() {
  // Calculate governance statistics
  // Total proposals, active proposals
  // Total voters, average voting power
  // Return stats object
}
```

#### `/api/governance/voting-history`
```typescript
// app/api/governance/voting-history/route.ts

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  
  // Fetch user's voting history
  // Return array of votes
}
```

---

## 💾 Database Schema

### Proposals Table
```typescript
interface Proposal {
  id: string;                    // UUID
  title: string;                 // Max 500 chars
  description: string;           // Max 1000 chars
  type: ProposalType;           // Enum value
  content: string;              // Full proposal text
  proposerAddress: string;      // User wallet address
  proposerVotingPower: number;  // Power at proposal time
  status: ProposalStatus;       // Current status
  createdAt: Date;
  startDate: Date;              // Voting starts
  endDate: Date;                // Voting ends
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  quorumRequired: number;
  successThreshold: number;     // Usually 50%
  attachments?: string[];       // IPFS hashes
  executeData?: string;         // Execution params
  updatedAt: Date;
  deletedAt?: Date;             // Soft delete
}

interface Vote {
  id: string;
  proposalId: string;
  voterAddress: string;
  voteType: 'for' | 'against' | 'abstain';
  votingPower: number;          // Power at vote time
  timestamp: Date;
  transactionHash?: string;
}
```

### Prisma Schema
```prisma
model Proposal {
  id                    String      @id @default(cuid())
  title                 String      @db.VarChar(500)
  description           String      @db.VarChar(1000)
  type                  String      // ProposalType enum
  content               String      @db.Text
  proposerAddress       String      @db.Char(42)
  proposerVotingPower   Float
  status                String      // ProposalStatus enum
  createdAt             DateTime    @default(now())
  startDate             DateTime
  endDate               DateTime
  votesFor              Int         @default(0)
  votesAgainst          Int         @default(0)
  votesAbstain          Int         @default(0)
  quorumRequired        Int
  successThreshold      Int
  attachments           String?
  executeData           String?
  updatedAt             DateTime    @updatedAt
  deletedAt             DateTime?

  votes                 Vote[]

  @@index([status])
  @@index([proposerAddress])
  @@index([createdAt])
}

model Vote {
  id                String    @id @default(cuid())
  proposalId        String
  voterAddress      String    @db.Char(42)
  voteType          String    // VoteType enum
  votingPower       Float
  timestamp         DateTime  @default(now())
  transactionHash   String?

  proposal          Proposal  @relation(fields: [proposalId], references: [id])

  @@unique([proposalId, voterAddress])
  @@index([proposalId])
  @@index([voterAddress])
}
```

---

## 🔄 Data Flow

### Voting Power Calculation Flow

```
User Page Load
    ↓
useVotingPower() called
    ↓
Fetch /api/governance/voting-power?address=0x...
    ↓
Server: Fetch vault data from database
    ↓
Server: Calculate metrics using govdao.ts functions
    ↓
Server: Return GovernanceMetrics object
    ↓
Component: Display voting power and tier
```

### Proposal Creation Flow

```
User fills form
    ↓
Clicks "Create Proposal"
    ↓
useCreateProposal() validates:
  - Voting power >= 10
  - Content length valid
  - User connected
    ↓
POST /api/governance/proposals
    ↓
Server: Validate and store proposal
    ↓
Server: Set status = DRAFT
    ↓
Return created proposal
    ↓
Component: Show success & redirect
```

### Voting Flow

```
User views proposal
    ↓
useCanVote() checks eligibility
    ↓
User clicks vote button
    ↓
useSubmitVote() validates
    ↓
POST /api/governance/proposals/:id/vote
    ↓
Server: Check no duplicate vote
    ↓
Server: Record vote in Vote table
    ↓
Server: Update proposal vote counts
    ↓
Return updated proposal
    ↓
Component: Show vote confirmed
```

---

## 🧪 Testing the Integration

### Test 1: Check Voting Power Calculation
```typescript
// test/govdao.test.ts

import { calculateTotalVotingPower } from '@/lib/govdao';

describe('Voting Power Calculation', () => {
  it('should calculate correct voting power', () => {
    const power = calculateTotalVotingPower({
      vaultBalance: BigInt(50e18),
      guardianCount: 3,
      activityCount: 100,
      vaultAgeInDays: 200,
      tokenDiversity: 4,
    });

    expect(power).toBeGreaterThan(0);
  });

  it('should assign correct tier', () => {
    const { tier } = buildGovernanceMetrics(
      BigInt(100e18),
      5,
      200,
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      6
    );

    expect(tier).toBe('LEAD');
  });
});
```

### Test 2: Component Rendering
```typescript
// test/govdao-dashboard.test.tsx

import { render } from '@testing-library/react';
import { GovDaoDashboard } from '@/components/community/govdao-dashboard';

describe('GovDaoDashboard', () => {
  it('should render dashboard', () => {
    const { getByText } = render(<GovDaoDashboard />);
    expect(getByText('Voting Power')).toBeInTheDocument();
  });
});
```

### Test 3: API Endpoints
```typescript
// test/api/governance.test.ts

describe('Governance API', () => {
  it('GET /api/governance/voting-power returns metrics', async () => {
    const res = await fetch(
      '/api/governance/voting-power?address=0x123...'
    );
    expect(res.status).toBe(200);
    expect(res.json()).toHaveProperty('metrics');
  });

  it('POST /api/governance/proposals creates proposal', async () => {
    const res = await fetch('/api/governance/proposals', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Proposal',
        description: 'Test',
        type: 'feature-request',
        content: 'Test content',
        proposerAddress: '0x123...',
        proposerVotingPower: 50,
      }),
    });
    expect(res.status).toBe(201);
  });
});
```

---

## 🔒 Security Checklist

- [ ] Validate all proposal inputs server-side
- [ ] Verify voter has voting power before accepting vote
- [ ] Check no duplicate votes per proposal
- [ ] Rate limit vote submissions per user
- [ ] Rate limit proposal creation
- [ ] Sanitize proposal content (no XSS)
- [ ] Verify wallet signature on sensitive operations
- [ ] Use HTTPS for all API calls
- [ ] Implement CSRF protection
- [ ] Log all governance actions
- [ ] Regular security audits

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

```typescript
// Track these in your analytics service

// Participation metrics
- Total voters this month
- Voting power distribution
- Proposal creation rate
- Average votes per proposal

// Engagement metrics
- Vote submission latency
- Proposal view duration
- Click-through rate to proposals
- Create proposal form abandonment

// System metrics
- API response times
- Vote submission success rate
- Proposal fetch cache hit rate
```

### Example Analytics Implementation

```typescript
import { analytics } from '@/lib/analytics';

// Track voting power
const { metrics } = useVotingPower();
useEffect(() => {
  if (metrics) {
    analytics.track('voting_power_loaded', {
      power: metrics.totalVotingPower,
      tier: metrics.tier,
    });
  }
}, [metrics]);

// Track vote submission
const handleVote = async (proposalId, voteType) => {
  const startTime = Date.now();
  const success = await submitVote(proposalId, voteType);
  
  analytics.track('vote_submitted', {
    proposalId,
    voteType,
    success,
    latency: Date.now() - startTime,
  });
};
```

---

## 🚀 Deployment Steps

### 1. Create API Routes
- [ ] `/api/governance/voting-power`
- [ ] `/api/governance/proposals` (GET & POST)
- [ ] `/api/governance/proposals/[id]`
- [ ] `/api/governance/proposals/[id]/vote`
- [ ] `/api/governance/stats`
- [ ] `/api/governance/voting-history`

### 2. Create Database Tables
- [ ] Proposal table
- [ ] Vote table
- [ ] Governance activity logs (optional)

### 3. Test APIs
- [ ] Test voting power calculation
- [ ] Test proposal CRUD
- [ ] Test vote submission
- [ ] Test vote validation

### 4. Deploy
- [ ] Test on testnet (Sepolia)
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error rates

### 5. Post-Deployment
- [ ] Monitor API performance
- [ ] Check vote submission success rate
- [ ] Monitor user participation
- [ ] Gather user feedback

---

## 🔄 Maintenance

### Regular Tasks
- Monitor governance health metrics
- Review proposal moderation
- Check for spam/abuse
- Update voting parameters if needed
- Archive old proposals (30+ days closed)

### Upgrades
- Add new proposal types
- Adjust voting power weights
- Implement new voting mechanics
- Enhance analytics

---

## 🆘 Troubleshooting Integration

### Issue: Voting power not updating
**Solution**: Clear browser cache, verify API is returning metrics

### Issue: Proposals not loading
**Solution**: Check database connection, verify proposals exist with proper status

### Issue: Vote submission fails
**Solution**: Check for duplicate vote record, verify user voting power

### Issue: Slow proposal loading
**Solution**: Add database indexes, implement pagination, use caching

---

## 📞 Support & Resources

- **Documentation**: See GOVDAO_DOCUMENTATION.md
- **Quick Reference**: See GOVDAO_QUICKREF.md
- **Code Files**: lib/govdao.ts, lib/hooks/useGovernance.ts
- **Components**: components/community/govdao-*

---

## 📝 Next Steps

1. ✅ Code files created (govdao.ts, useGovernance.ts, components)
2. ✅ Community page integration complete
3. 🔲 Implement API endpoints
4. 🔲 Create database schema
5. 🔲 Deploy to testnet
6. 🔲 Deploy to production
7. 🔲 Monitor and optimize

---

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: 🟡 Awaiting API Implementation
