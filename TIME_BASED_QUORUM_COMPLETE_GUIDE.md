# Time-Based Quorum System - Complete Guide

## 📋 Table of Contents
1. Overview & Architecture
2. Core Concepts
3. Quorum Tiers
4. Time Windows
5. Sensitivity Detection
6. Integration Guide
7. Real-World Examples
8. Security Considerations
9. Troubleshooting

---

## 🎯 Overview

The Time-Based Quorum system implements **dynamic signature requirements** based on:

- **Amount**: Large withdrawals require more approvals
- **Time**: Risky hours require more approvals
- **Action Sensitivity**: Unusual/risky actions require more approvals
- **Recipient Status**: New recipients require higher approval bar

### Key Benefits

✅ **Risk-Proportional Governance**: More scrutiny for riskier actions  
✅ **Flexible Rules**: Customize tiers, windows, and thresholds  
✅ **Automatic Escalation**: System detects and escalates sensitive actions  
✅ **Multi-Layer Protection**: Amount + Time + Sensitivity protection  
✅ **Easy Auditing**: Complete transparency on why each amount needed X signatures  

---

## 🏗️ Architecture

### Component Diagram

```
TimeBasedQuorumVault
│
├── Quorum Calculation Engine
│   ├── Amount-based Tiers
│   ├── Time Windows
│   └── Sensitivity Detection
│
├── Guardian Management
│   ├── Guardian SBT verification
│   ├── Signature validation
│   └── Duplicate prevention
│
├── Withdrawal Processing
│   ├── Signature verification
│   ├── Quorum enforcement
│   └── Event logging
│
└── Configuration Management
    ├── Tier management
    ├── Time window management
    └── Threshold settings
```

### State Flow

```
Withdrawal Request
      ↓
Calculate Required Quorum
  ├─ Check amount tier
  ├─ Check time window
  ├─ Detect sensitivity
  └─ Return: required, isSensitive
      ↓
Collect Signatures
      ↓
Verify Signatures
  ├─ Check guardian status
  ├─ Check signature count >= required
  └─ Check no duplicates
      ↓
Execute Transfer
      ↓
Record & Emit Event
```

---

## 💡 Core Concepts

### 1. Quorum Tiers

**What**: Rules defining required signatures based on withdrawal amount

**When Applied**: Before any withdrawal

**Structure**:
```solidity
struct QuorumTier {
    uint256 minAmount;           // 0 = always applies
    uint256 maxAmount;           // 0 = unlimited
    uint256 requiredSignatures;  // How many needed
    bool isActive;               // Can be disabled
    bool isSensitiveAction;      // Flags as sensitive
}
```

**Default Tiers**:
| Tier | Amount Range | Signatures | Sensitive |
|------|--------------|------------|-----------|
| 1 | 0 - 50 tokens | 1 | ❌ |
| 2 | 50 - 200 tokens | 2 | ❌ |
| 3 | 200 - 500 tokens | 3 | ✅ |
| 4 | 500+ tokens | 4 | ✅ |

**Example**:
```javascript
// Requires 3 signatures for 250-500 token withdrawals
vault.createQuorumTier(
  250e18,     // minAmount
  500e18,     // maxAmount
  3,          // requiredSignatures
  true        // isSensitiveAction
);
```

### 2. Time Windows

**What**: Rules requiring additional signatures during specific hours

**When Applied**: When current hour falls within window

**Structure**:
```solidity
struct TimeWindow {
    uint256 startHour;          // 0-23 UTC
    uint256 endHour;            // 0-23 UTC
    uint256 requiredSignatures; // Additional sigs
    bool isActive;
    string reason;              // "Trading hours", etc
}
```

**Example - Trading Hours**:
```javascript
// During market hours (9am-5pm), require extra signature
vault.createTimeWindow(
  9,     // startHour
  17,    // endHour
  1,     // additionalSignatures (add to base)
  "Market trading hours"
);

// During 22:00-6:00, require extra due to sleep time
vault.createTimeWindow(
  22,    // startHour
  6,     // endHour (wraps around midnight)
  2,     // additionalSignatures
  "High-risk overnight hours"
);
```

**How Wrapping Works**:
- `22` to `6` means: 22-23:59 OR 0:00-6:00
- Tests if `hour >= 22` OR `hour < 6`

### 3. Sensitivity Detection

**What**: Automatic flag system for unusual/risky actions

**Flags**:
| Flag | Triggers When | Impact |
|------|---------------|--------|
| New Recipient | First withdrawal to address | +1 signature |
| Large Amount | Amount ≥ threshold | +1 signature |
| Outside Hours | Withdrawal outside 6am-10pm | +1 signature |
| Emergency Level | Amount ≥ emergency threshold | +1 signature |

**Example**:
```
Withdrawal: 300 tokens to new recipient at 2am
Flags: new recipient (1) + outside hours (1) + large (1) = 3 flags
Base quorum: 2
Final quorum: 2 + 3 = 5 (capped at maxQuorum)
```

**Configuration**:
```javascript
// Set "large" threshold to 100 tokens
vault.setLargeWithdrawalThreshold(100e18);

// Set "emergency" threshold to 500 tokens
vault.setEmergencyThreshold(500e18);

// Approve recipient (removes new recipient flag)
vault.approveRecipient(recipientAddress);
```

### 4. Quorum Calculation

**Algorithm**:

```
1. Get base quorum from amount tier
2. Add escalation from sensitivity flags
3. Get additional from time window
4. Cap at maxQuorum
5. Floor at minQuorum

Final = min(maxQuorum, max(minQuorum, base + sensitivity + timeWindow))
```

**Real Example**:

```
Withdrawal: 250 tokens to unknown recipient at 10pm

Step 1 - Amount Tier:
  250 tokens → Tier 3 (200-500) → requires 2

Step 2 - Sensitivity:
  - New recipient? YES (+1)
  - Large amount (100+)? YES (+1)
  - Outside hours (6am-10pm)? NO (+0)
  - Emergency level? NO (+0)
  Total flags: 2, Add: 2 → 2+2 = 4

Step 3 - Time Window:
  10pm is outside trading hours (9-17) and before risky (22-6)
  No additional → +0

Step 4 - Finalize:
  Max: min(5, 4) = 4
  Result: 4 signatures required
```

---

## ⚙️ Quorum Tiers (Deep Dive)

### Creating Custom Tiers

```javascript
// Example 1: Micro withdrawals (0-20 tokens)
vault.createQuorumTier(
  0,        // Any amount >= 0
  20e18,    // Up to 20 tokens
  1,        // Only 1 signature needed
  false     // Not sensitive
);

// Example 2: Large institutional transfers (1000+)
vault.createQuorumTier(
  1000e18,  // Starting at 1000 tokens
  0,        // No upper limit
  5,        // Require all 5 guardians
  true      // Mark as sensitive
);

// Example 3: Exact range (500-1000)
vault.createQuorumTier(
  500e18,
  1000e18,
  3,
  true
);
```

### Tier Matching Logic

**Rules**:
1. Amount must satisfy: `minAmount <= amount`
2. If maxAmount > 0: also `amount <= maxAmount`
3. Highest matching quorum is used
4. Only active tiers count

**Example - Multiple Overlapping Tiers**:

```javascript
// Tier A: 0-1000 requires 2 sigs
vault.createQuorumTier(0, 1000e18, 2, false);

// Tier B: 500-1500 requires 3 sigs
vault.createQuorumTier(500e18, 1500e18, 3, false);

// Tier C: 1000+ requires 4 sigs
vault.createQuorumTier(1000e18, 0, 4, false);

// What quorum for 750 tokens?
// Matches: Tier A (2), Tier B (3)
// Uses: MAX(2, 3) = 3 signatures
```

### Managing Tiers

```javascript
// Get all tiers
const tiers = await vault.getQuorumTiers();

// Disable a tier temporarily
vault.updateQuorumTier(tierId, 3, false); // isActive = false

// Re-enable it
vault.updateQuorumTier(tierId, 3, true);

// Change signature requirement
vault.updateQuorumTier(tierId, 5, true);
```

---

## ⏰ Time Windows (Deep Dive)

### Creating Time Windows

```javascript
// Normal business hours
vault.createTimeWindow(
  9,    // 9am UTC
  17,   // 5pm UTC
  1,    // Need 1 extra signature
  "Business hours - high activity"
);

// Overnight (risky time)
vault.createTimeWindow(
  22,   // 10pm UTC
  6,    // 6am UTC (wraps to next day)
  2,    // Need 2 extra signatures
  "Overnight - skeleton crew"
);

// Weekend
vault.createTimeWindow(
  0,    // Midnight
  24,   // All day (but this won't wrap, so use separate windows)
  1,    // Extra sig
  "Weekend - reduced staff"
);
```

### Time Logic

**In-Window Detection**:
```javascript
// Current hour: 14 (2pm UTC)
// Window: 9-17 (9am-5pm)
// Result: 14 >= 9 AND 14 < 17 = TRUE → Apply window

// Current hour: 3 (3am UTC)
// Window: 22-6 (10pm-6am, wraps)
// Result: (3 >= 22 OR 3 < 6) = TRUE → Apply window

// Current hour: 12 (noon)
// Window: 22-6 (overnight)
// Result: (12 >= 22 OR 12 < 6) = FALSE → Don't apply
```

### Multiple Windows

```javascript
// Hours 9-17: +1 sig (trading hours)
vault.createTimeWindow(9, 17, 1, "Trading hours");

// Hours 22-6: +2 sigs (overnight)
vault.createTimeWindow(22, 6, 2, "Overnight");

// Current time: 11am
// Matches: trading hours window
// Add: +1 signature

// Current time: 2am
// Matches: overnight window
// Add: +2 signatures

// Current time: 8am
// Matches: neither window
// Add: +0 signatures

// If overlapping (shouldn't happen, but hypothetically):
// Uses the MAXIMUM of all matching windows
```

---

## 🔍 Sensitivity Detection (Deep Dive)

### The Four Flags

**1. New Recipient**
```javascript
// Flag triggered when: isApprovedRecipient[address] == false

// Approve recipient to remove flag
vault.approveRecipient(recipientAddress);

// Why: First withdrawal to new address is higher risk
// Cost: +1 signature
```

**2. Large Amount**
```javascript
// Flag triggered when: amount >= largeWithdrawalThreshold

// Default threshold: 100 tokens
// Change it:
vault.setLargeWithdrawalThreshold(500e18);

// Why: Large amounts carry more risk
// Cost: +1 signature
```

**3. Outside Normal Hours**
```javascript
// Flag triggered when: hour < 6 OR hour >= 22
// (Outside 6am-10pm)

// Hardcoded, but reflected in time windows
// Why: Unusual hours may indicate compromise
// Cost: +1 signature
```

**4. Emergency Level**
```javascript
// Flag triggered when: amount >= emergencyThreshold

// Default threshold: 500 tokens
// Change it:
vault.setEmergencyThreshold(1000e18);

// Why: Extremely large amounts need extra care
// Cost: +1 signature
```

### Escalation Rules

```javascript
// Sensitivity escalation logic:
// Each flag adds 1 signature requirement

totalFlags = 0;
if (!isApprovedRecipient[recipient]) totalFlags++; // Flag 1
if (amount >= largeThreshold) totalFlags++;         // Flag 2
if (hour < 6 || hour >= 22) totalFlags++;           // Flag 3
if (amount >= emergencyThreshold) totalFlags++;     // Flag 4

finalQuorum = baseQuorum + totalFlags;
finalQuorum = min(maxQuorum, finalQuorum);
```

### Real Examples

**Example 1: Routine Payment**
```
30 tokens to approved recipient at 10am
- New recipient? NO
- Large? NO
- Outside hours? NO
- Emergency? NO
Sensitivity flags: 0
Quorum: 1 (base for small amounts)
```

**Example 2: Suspicious Activity**
```
600 tokens to new recipient at 3am
- New recipient? YES (+1)
- Large? YES (100+ threshold) (+1)
- Outside hours? YES (3am) (+1)
- Emergency? YES (500+ threshold) (+1)
Sensitivity flags: 4
Base quorum: 4 (from tier)
Final: 4 + 4 = 8 → capped to maxQuorum(5)
Quorum: 5 (maximum)
```

**Example 3: Planned Large Transfer**
```
300 tokens to approved recipient at 2pm
- New recipient? NO (pre-approved)
- Large? YES (+1)
- Outside hours? NO
- Emergency? NO
Sensitivity flags: 1
Base quorum: 3 (from tier)
Final: 3 + 1 = 4
Quorum: 4
```

---

## 📊 Integration Patterns

### Pattern 1: Corporate Treasury

**Setup**:
```javascript
// CEO and approved recipients
vault.approveRecipient(ceoAddress);
vault.approveRecipient(vendorAddress);
vault.approveRecipient(payrollAddress);

// Normal hours increase quorum
vault.createTimeWindow(9, 17, 0, "Normal trading");
vault.createTimeWindow(22, 6, 2, "Off-hours");

// Set thresholds
vault.setLargeWithdrawalThreshold(100e18);
vault.setEmergencyThreshold(500e18);
```

**Result**:
- Small payments to approved recipients = 1-2 signatures
- Large payments = 3+ signatures
- Off-hours = Always higher
- New recipients = Require extra approval

### Pattern 2: DAO Governance

**Setup**:
```javascript
// Treasury addresses
vault.approveRecipient(multiSigTreasury);
vault.approveRecipient(grantVault);

// Guild members need approval
// (new recipients = flagged)

// Aggressive time windows
vault.createTimeWindow(0, 6, 3, "Midnight-6am critical");
vault.createTimeWindow(16, 20, 1, "Evening high activity");

// Conservative thresholds
vault.setLargeWithdrawalThreshold(50e18);
vault.setEmergencyThreshold(200e18);
```

**Result**:
- New member payments = extra signatures
- Time-sensitive based on UTC time
- Even moderate amounts require consensus

### Pattern 3: Emergency Fund

**Setup**:
```javascript
// Pre-approved emergency recipients
vault.approveRecipient(hospitalWallet);
vault.approveRecipient(insuranceProvider);

// Allow quick access for small amounts
vault.createQuorumTier(0, 50e18, 1, false);

// But escalate aggressively for large
vault.createQuorumTier(50e18, 200e18, 2, true);
vault.createQuorumTier(200e18, 0, 3, true);

// High thresholds
vault.setLargeWithdrawalThreshold(500e18);
```

**Result**:
- Emergency transfers up to 50 can be fast (1 sig)
- Larger amounts need full consensus
- Approved recipients can bypass some checks

---

## 🔒 Security Considerations

### 1. Quorum Bypass Protection

**Risk**: What if all guardians are compromised?

**Mitigation**:
- Require `minQuorum` (default: 1, customize as needed)
- Use trusted, distributed guardians
- Regular guardian rotation
- Monitor for unusual signing patterns

### 2. Time Window Gaming

**Risk**: What if attacker tries to exploit time zones?

**Mitigation**:
- Use UTC time (not local)
- Design windows to cover all zones if needed
- Combine multiple checks (not just time)
- Monitor off-hours transactions

### 3. Threshold Manipulation

**Risk**: What if thresholds are set too low?

**Mitigation**:
- Default values are conservative
- Owner-only threshold changes
- Events logged for all changes
- Careful review before reducing thresholds

### 4. Recipient Approval Gaming

**Risk**: Owner pre-approves risky recipients?

**Mitigation**:
- Approval only removes "new recipient" flag
- Other checks (amount, time) still apply
- Review recipient list regularly
- Consider multi-sig for approval changes

### 5. Signature Reuse Prevention

**Risk**: Attacker replays signatures?

**Mitigation**:
- Nonce increments after each withdrawal
- EIP-712 signature format prevents replay
- Duplicate signature detection (same signer can't sign twice)

### 6. Guardian Token Verification

**Risk**: Non-guardians could claim to be guardians?

**Mitigation**:
- SBT verification in withdrawal function
- Each signer must hold guardian token
- Revocation removes signing ability immediately

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Review all quorum tier configurations
- [ ] Set conservative thresholds initially
- [ ] Plan time windows for your time zone
- [ ] Identify approved recipients
- [ ] Brief guardians on new requirements
- [ ] Test with small amounts first

### Deployment
- [ ] Deploy TimeBasedQuorumVault
- [ ] Configure guardians (mint SBT)
- [ ] Create quorum tiers
- [ ] Create time windows (if any)
- [ ] Approve initial recipients
- [ ] Fund vault with test amounts

### Testing
- [ ] Test small withdrawal (1 sig)
- [ ] Test medium withdrawal (2 sigs)
- [ ] Test large withdrawal (3+ sigs)
- [ ] Test new recipient (escalated)
- [ ] Test approved recipient (normal)
- [ ] Test time window changes
- [ ] Verify nonce increments
- [ ] Check event logging

### Post-Deployment
- [ ] Monitor initial transactions
- [ ] Collect guardian feedback
- [ ] Adjust thresholds if needed
- [ ] Document your configuration
- [ ] Regular guardian rotations
- [ ] Audit trails reviewed monthly

---

## 📈 Real-World Examples

### Example 1: Small NFT DAO

**Configuration**:
```javascript
// 3 guardians total
vault.setDefaultQuorum(2); // Need 2 of 3

// Tiers
vault.createQuorumTier(0, 5e18, 1, false);      // 0-5 = 1 sig
vault.createQuorumTier(5e18, 20e18, 2, false);  // 5-20 = 2 sigs
vault.createQuorumTier(20e18, 0, 3, true);      // 20+ = all 3

// No time windows (small org)

// Recipients
vault.approveRecipient(treasuryMultiSig);
vault.approveRecipient(devFund);

// Thresholds
vault.setLargeWithdrawalThreshold(15e18);
vault.setEmergencyThreshold(50e18);
```

**In Action**:
- Dev reimbursement (3 ETH) to dev fund = 1 signature
- Treasury transfer (20 ETH) to new recipient = 3 signatures
- Emergency withdrawal (25 ETH) = requires all, extra due to amount

### Example 2: Enterprise Treasury

**Configuration**:
```javascript
// 5 guardians (C-suite + trusted advisor)
vault.setDefaultQuorum(3); // Need 3 of 5

// Strict tiers
vault.createQuorumTier(0, 10e18, 2, false);      // Petty cash
vault.createQuorumTier(10e18, 100e18, 3, false); // Regular
vault.createQuorumTier(100e18, 500e18, 4, true); // Big
vault.createQuorumTier(500e18, 0, 5, true);      // All hands

// Time windows (market hours are risky)
vault.createTimeWindow(8, 17, 1, "Market hours"); // Need +1 during day
vault.createTimeWindow(22, 6, 2, "Overnight");    // +2 at night

// Recipients
vault.approveRecipient(ceo);
vault.approveRecipient(cfo);
vault.approveRecipient(mainBank);
vault.approveRecipient(payrollProcessing);

// Conservative thresholds
vault.setLargeWithdrawalThreshold(50e18);
vault.setEmergencyThreshold(200e18);
```

**In Action**:
- Bill payment (15 ETH) to approved vendor at 10am = 2+1=3 signatures needed
- Dividend (300 ETH) to shareholder at 2am = 5+2+1=5 signatures (all required, red flag)
- Salary (25 ETH) to payroll at 3pm = 3+1+1=5 signatures

### Example 3: Angel Fund

**Configuration**:
```javascript
// 4 guardians (general partners + LP rep)
vault.setDefaultQuorum(2);

// Investment-friendly tiers
vault.createQuorumTier(0, 50e18, 1, false);      // Follow-on rounds
vault.createQuorumTier(50e18, 200e18, 2, false); // Normal investments
vault.createQuorumTier(200e18, 500e18, 3, true); // Large checks
vault.createQuorumTier(500e18, 0, 4, true);      // Strategic rounds

// Flexible time windows (global investors)
vault.createTimeWindow(12, 20, 1, "EST working hours");
vault.createTimeWindow(0, 8, 2, "Off hours");

// Recipients
vault.approveRecipient(foundingPartner1);
vault.approveRecipient(foundingPartner2);
vault.approveRecipient(legalDeps);

// Startup-friendly thresholds
vault.setLargeWithdrawalThreshold(100e18);
vault.setEmergencyThreshold(1000e18);
```

**In Action**:
- Seed investment (100 ETH) to new startup = 2 signatures (normal)
- Series A follow-up (400 ETH) to portfolio company = 3 signatures
- Large reserve deployment (1000+ ETH) = 4 signatures, all required

---

## 🛠️ Troubleshooting

### Issue: Withdrawal requires more signatures than expected

**Cause**: Sensitivity flags escalated quorum

**Check**:
```javascript
const [requiredQuorum, isSensitive] = await vault.calculateRequiredQuorum(
  tokenAddress,
  amount,
  recipient
);

console.log("Required:", requiredQuorum);
console.log("Is sensitive:", isSensitive);
```

**Solutions**:
- Approve recipient if it's a new address
- If outside hours, retry during business hours
- If large amount, reduce amount or wait for more guardians

### Issue: Time window not applying

**Cause**: Using local time instead of UTC

**Check**:
```javascript
// Current UTC hour
const now = new Date();
const utcHour = now.getUTCHours();
console.log("Current UTC hour:", utcHour);
```

**Solutions**:
- Adjust window startHour/endHour to match your time zone offset
- Remember: contract uses UTC from block.timestamp
- Document your time zones explicitly

### Issue: Guardian can't sign withdrawals

**Cause**: Guardian lost SBT or never minted

**Check**:
```javascript
const isGuardian = await guardianSBT.balanceOf(guardianAddress);
console.log("Is guardian:", isGuardian > 0);
```

**Solutions**:
- Mint SBT for guardian (owner only)
- Verify address is correct
- Check they're using same wallet

### Issue: Recipient keeps triggering new recipient flag

**Cause**: Not approved, or approval revoked

**Check**:
```javascript
const isApproved = await vault.isApprovedRecipient(recipientAddress);
console.log("Is approved:", isApproved);
```

**Solutions**:
- Call vault.approveRecipient(recipientAddress)
- Verify address matches exactly (case-sensitive)
- List all approved recipients to debug

### Issue: Can't create tier - "Invalid amount range"

**Cause**: maxAmount < minAmount

**Fix**:
```javascript
// ❌ Wrong
vault.createQuorumTier(500e18, 100e18, 3, true);

// ✅ Correct
vault.createQuorumTier(100e18, 500e18, 3, true);

// ✅ Unlimited
vault.createQuorumTier(500e18, 0, 3, true); // 0 = unlimited
```

---

## 📞 Quick Reference

### Key Functions

| Function | Purpose | Access |
|----------|---------|--------|
| `createQuorumTier()` | Add amount-based quorum rule | Owner |
| `createTimeWindow()` | Add time-based quorum rule | Owner |
| `approveRecipient()` | Reduce sensitivity for address | Owner |
| `calculateRequiredQuorum()` | Check quorum for withdrawal | Public |
| `withdraw()` | Execute withdrawal with sigs | Guardians |
| `setLargeWithdrawalThreshold()` | Change large amount threshold | Owner |
| `setEmergencyThreshold()` | Change emergency threshold | Owner |

### Key Constants

| Constant | Default | Adjustable |
|----------|---------|-----------|
| `minQuorum` | 1 | Via code |
| `maxQuorum` | 5 | Via code |
| `defaultQuorum` | 2 | Via setDefaultQuorum() |
| `largeThreshold` | 100e18 | Via setLargeWithdrawalThreshold() |
| `emergencyThreshold` | 500e18 | Via setEmergencyThreshold() |

---

## 📚 Additional Resources

- **EIP-712**: Typed structured data hashing and signing
- **GuardianSBT**: Soulbound token for identity
- **ECDSA**: Cryptographic signature verification
- **ReentrancyGuard**: Protection against reentrancy attacks

---

**Status**: ✅ Complete and production-ready  
**Version**: 1.0  
**Last Updated**: January 2025
