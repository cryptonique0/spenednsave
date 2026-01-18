# Weighted Signatures - Quick Reference

## Core Concept

Instead of 1 guardian = 1 vote, assign different **weights** to each guardian.

```
Equal Voting:     CEO (1) + CFO (1) = 2 votes, need 2 to pass
Weighted Voting:  CEO (3) + CFO (2) = 5 votes, need 3 to pass
```

---

## Setup Checklist

- [ ] Deploy GuardianWeights contract
- [ ] Deploy SpendVaultWithWeights contract
- [ ] Assign weights to guardians
- [ ] Set weighted quorum threshold
- [ ] Enable weighted voting mode

---

## Quick Start Example

### 1. Deploy
```solidity
GuardianWeights weights = new GuardianWeights();
SpendVaultWithWeights vault = new SpendVaultWithWeights(
    guardianSBT,
    address(weights),
    2,      // fallback quorum
    false   // start with traditional
);
```

### 2. Assign Weights
```solidity
weights.setGuardianWeight(vault, ceo, 3);      // CEO: 3
weights.setGuardianWeight(vault, cfo, 2);      // CFO: 2
weights.setGuardianWeight(vault, treasurer, 1); // Treasurer: 1
// Total: 6
```

### 3. Set Quorum
```solidity
// Majority: 4 (more than 50% of 6)
weights.setWeightedQuorum(vault, 4);
```

### 4. Enable Weighted Voting
```solidity
weights.enableWeightedVoting(vault);
vault.setWeightedVoting(true);
```

### 5. Withdraw
```solidity
// Get signatures from guardians
vault.withdrawWithWeights(
    token,
    amount,
    recipient,
    reason,
    false,  // isEmergency
    signatures
);

// System calculates total weight from signers:
// CEO (3) + CFO (2) = 5 >= 4 ✅ PASS
// CEO (3) + Treasurer (1) = 4 >= 4 ✅ PASS
// CFO (2) + Treasurer (1) = 3 < 4 ❌ FAIL
```

---

## Common Weight Distributions

### Scenario 1: 3-2-2 Split
```
Guardian A: 3 (Primary)
Guardian B: 2 (Secondary)
Guardian C: 2 (Tertiary)
Total: 7, Quorum: 4

Can Approve:
✅ A + B = 5
✅ A + C = 5
✅ B + C = 4
❌ Any single guardian
```

### Scenario 2: Veto Power (5-2-1-1)
```
Guardian A: 5 (Veto power, can pass alone)
Guardian B: 2
Guardian C: 1
Guardian D: 1
Total: 9, Quorum: 5

Can Approve:
✅ A alone = 5 (veto power)
✅ B + C + D = 4 + 1 extra (majority)
❌ B + C alone = 3
```

### Scenario 3: Equal Weight Democracy (1-1-1-1-1)
```
Guardian A: 1
Guardian B: 1
Guardian C: 1
Guardian D: 1
Guardian E: 1
Total: 5, Quorum: 3

Can Approve:
✅ Any 3 guardians = 3
❌ Any 2 guardians = 2
(Same as traditional voting with 5 guardians, quorum 3)
```

---

## Configuration Commands

### Assign Weight
```solidity
weights.setGuardianWeight(vaultAddress, guardianAddress, weightValue);

// Example
weights.setGuardianWeight(vault, ceo, 5);
```

### Update Weight
```solidity
// Just assign new weight, old weight replaced
weights.setGuardianWeight(vault, ceo, 10);  // Changed from 5 to 10
```

### Remove Weight
```solidity
weights.removeGuardianWeight(vault, guardianAddress);

// Example
weights.removeGuardianWeight(vault, ceo);
```

### Set Quorum
```solidity
weights.setWeightedQuorum(vault, thresholdValue);

// Example: Total weight 10, need 6 (majority)
weights.setWeightedQuorum(vault, 6);
```

### Enable Weighted Voting
```solidity
weights.enableWeightedVoting(vault);
```

### Toggle in Vault
```solidity
vault.setWeightedVoting(true);   // Use weighted
vault.setWeightedVoting(false);  // Use traditional
```

---

## Query Functions

### Get Guardian Weight
```solidity
uint256 weight = weights.getGuardianWeight(vault, guardian);
```

### Get All Weighted Guardians
```solidity
address[] memory guardians = weights.getWeightedGuardians(vault);
```

### Get Weight Distribution
```solidity
(address[] memory addrs, uint256[] memory wts) = 
    weights.getWeightDistribution(vault);
```

### Check If Quorum Met
```solidity
bool met = weights.isWeightedQuorumMet(vault, totalSignatureWeight);
```

### Get Voting Stats
```solidity
(
    uint256 totalWeight,
    uint256 threshold,
    uint256 guardianCount,
    bool enabled
) = weights.getVotingStats(vault);
```

### Get Weight Percentage
```solidity
uint256 pct = weights.getWeightPercentage(vault, signerWeight);
// Returns: 0-100
```

### Can Guardian Pass Alone?
```solidity
bool canPass = weights.canGuardianPassAlone(vault, guardianAddress);
```

### Minimum Guardians for Quorum
```solidity
uint256 minCount = weights.getMinGuardiansForQuorum(vault);
```

---

## Withdrawal Scenarios

### Scenario A: CEO + CFO (3+2=5 >= 4) ✅
```
Vault: Total 6 weight, Quorum 4
CEO signature: +3 weight
CFO signature: +2 weight
Total: 5 >= 4 → APPROVED
```

### Scenario B: CFO + Treasurer (2+1=3 < 4) ❌
```
Vault: Total 6 weight, Quorum 4
CFO signature: +2 weight
Treasurer signature: +1 weight
Total: 3 < 4 → REJECTED
```

### Scenario C: Multiple Signatures (All 5 people)
```
If you have 5 guardians total, 3 with weights assigned:
Only signers with weights count toward quorum.
Signers without weights are skipped automatically.
```

---

## Key Formulas

### Calculate Majority Quorum
```
totalWeight = sum of all guardian weights
majorityQuorum = (totalWeight / 2) + 1

Example: 10 total weight
majorityQuorum = 5 + 1 = 6
```

### Check Quorum
```
quorumMet = (signerWeights >= quorumThreshold)

Example: 6 needed, got 7 signers with weights 3+2+2 = 7
7 >= 6 → YES
```

### Weight Percentage
```
percentage = (signatureWeight / totalWeight) * 100

Example: 6 weight out of 10 total
(6 / 10) * 100 = 60%
```

---

## Events

### Weight Changes
```solidity
event WeightAssigned(
    address vault,
    address guardian,
    uint256 weight,
    uint256 totalVaultWeight
);

event WeightRemoved(
    address vault,
    address guardian,
    uint256 previousWeight
);
```

### Voting Changes
```solidity
event QuorumThresholdSet(
    address vault,
    uint256 threshold,
    bool enabled
);

event WeightedVotingEnabled(address vault);
event WeightedVotingDisabled(address vault);
```

### Withdrawal Events
```solidity
event WeightedSignatureCollected(
    address guardian,
    uint256 weight,
    uint256 totalWeightSoFar,
    uint256 nonce
);

event WeightedQuorumMet(
    uint256 nonce,
    uint256 totalWeight,
    uint256 requiredWeight
);
```

---

## Weight Categories

For interpretation purposes:

| Weight % | Category |
|----------|----------|
| >= 50% | Majority/Veto |
| 33-49% | Strong |
| 10-32% | Moderate |
| 1-9% | Light |
| 0% | Observer (no weight) |

---

## Common Patterns

### Unanimous Approval
```
Total: 10
Quorum: 10
Result: All guardians must sign
```

### Majority
```
Total: 10
Quorum: 6
Result: More than 50% must sign
```

### Super Majority
```
Total: 10
Quorum: 8
Result: 80% threshold
```

### Veto Power
```
Guardian A: 6 (can pass alone)
Guardian B: 3
Guardian C: 1
Total: 10, Quorum: 6
```

---

## JavaScript Examples

### Get Guardian Weights
```javascript
const guardians = await weights.getWeightedGuardians(vaultAddress);
const distribution = await weights.getWeightDistribution(vaultAddress);

distribution.guardians.forEach((guardian, i) => {
    console.log(`${guardian}: ${distribution.weights[i]}`);
});
```

### Calculate Required Signers
```javascript
async function getEligibleSigners(vault, weights, amount) {
    const [guardians, weights_] = await weights.getWeightDistribution(vault);
    const stats = await weights.getVotingStats(vault);
    
    // Sort by weight descending
    const sorted = guardians
        .map((g, i) => ({ addr: g, weight: weights_[i] }))
        .sort((a, b) => b.weight - a.weight);
    
    let accumulated = 0;
    const needed = [];
    
    for (const g of sorted) {
        needed.push(g);
        accumulated += g.weight;
        if (accumulated >= stats.quorumThreshold) break;
    }
    
    return needed;
}
```

### Monitor Withdrawal
```javascript
vault.on('WeightedQuorumMet', (nonce, totalWeight, requiredWeight) => {
    console.log(`Withdrawal ${nonce}: ${totalWeight}/${requiredWeight} weight`);
});
```

---

## Switching Between Modes

### Traditional → Weighted
```solidity
// 1. Start with traditional
useWeightedVoting = false;

// 2. Assign weights
weights.setGuardianWeight(vault, guardian1, 2);
weights.setGuardianWeight(vault, guardian2, 1);

// 3. Set quorum
weights.setWeightedQuorum(vault, 2);
weights.enableWeightedVoting(vault);

// 4. Switch
vault.setWeightedVoting(true);
```

### Weighted → Traditional
```solidity
// 1. Keep weights assigned (optional)
// 2. Switch mode
vault.setWeightedVoting(false);

// 3. Now uses traditional quorum (count-based)
```

---

## Gas Costs

| Operation | Cost |
|-----------|------|
| setGuardianWeight | ~40,000 |
| removeGuardianWeight | ~30,000 |
| setWeightedQuorum | ~25,000 |
| withdrawWithWeights (single) | ~80,000 |
| withdrawWithWeights (5 sigs) | ~180,000 |

---

## Troubleshooting

### "Weighted quorum not met"
**Check:**
1. Guardian weights assigned: `getGuardianWeight(vault, guardian)`
2. Quorum threshold: `getVotingStats(vault)`
3. Signature weight total

### "Guardian has no weight assigned"
**Fix:** `setGuardianWeight(vault, guardian, weight)`

### "Threshold exceeds total weight"
**Fix:** Quorum <= total of all weights

### "Weighted voting not enabled"
**Fix:** `weights.enableWeightedVoting(vault)`

---

## Key Differences: Weighted vs Traditional

| Feature | Traditional | Weighted |
|---------|------------|----------|
| **Voting** | Count (1=1) | Weight-based |
| **Authority** | All equal | Different levels |
| **Flexibility** | Limited | High |
| **Complexity** | Simple | Moderate |
| **Use Case** | Simple multi-sig | DAO, corporate |

---

## Summary Commands

```solidity
// Setup
weights.setGuardianWeight(vault, guardian, weight);
weights.setWeightedQuorum(vault, threshold);
weights.enableWeightedVoting(vault);

// Check
weights.getGuardianWeight(vault, guardian);
weights.getVotingStats(vault);
weights.isWeightedQuorumMet(vault, signatureWeight);

// Execute
vault.withdrawWithWeights(token, amount, recipient, reason, false, sigs);
```

---

**Version:** 1.0 | **Status:** Production Ready
