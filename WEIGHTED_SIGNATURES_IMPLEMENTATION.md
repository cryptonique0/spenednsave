# Weighted Signatures Implementation Guide

## Overview

**Weighted Signatures** allow guardians to have different voting weights instead of the traditional 1 guardian = 1 vote model. This enables more sophisticated governance where some guardians have more authority than others.

## Key Concepts

### Traditional vs Weighted Voting

**Traditional Voting:**
```
Guardian 1 + Guardian 2 + Guardian 3 = 3 votes
Quorum: 2 votes needed
Result: Any 2 guardians can approve
```

**Weighted Voting:**
```
CEO (weight: 3) + CFO (weight: 2) + Treasurer (weight: 2) = 7 total weight
Quorum: 5 weight needed
Result: Need CEO (3) + any other (2), or both CFO (2) + Treasurer (2) + one more
```

## Smart Contracts

### GuardianWeights.sol

Core contract managing guardian weights and weighted quorum.

#### Key Data Structures

```solidity
struct GuardianWeightInfo {
    uint256 weight;        // Voting weight (e.g., 1-100)
    uint256 lastUpdated;   // When weight was assigned/updated
    bool isActive;         // Currently has weight assigned
}
```

#### Main Functions

**Setup & Configuration:**
```solidity
setGuardianWeight(address vault, address guardian, uint256 weight)
removeGuardianWeight(address vault, address guardian)
setWeightedQuorum(address vault, uint256 threshold)
enableWeightedVoting(address vault)
disableWeightedVoting(address vault)
```

**Query Functions:**
```solidity
getGuardianWeight(address vault, address guardian) → uint256
getWeightedGuardians(address vault) → address[]
getWeightedGuardianCount(address vault) → uint256
calculateTotalWeight(address vault, address[] guardians) → uint256
isWeightedQuorumMet(address vault, uint256 signingWeight) → bool
getWeightPercentage(address vault, uint256 signingWeight) → uint256
getVotingStats(address vault) → (totalWeight, threshold, count, enabled)
canGuardianPassAlone(address vault, address guardian) → bool
getMinGuardiansForQuorum(address vault) → uint256
getWeightDistribution(address vault) → (guardians[], weights[])
```

### SpendVaultWithWeights.sol

Enhanced vault that integrates with GuardianWeights for weighted signature verification.

#### Key Features

- Role-based withdrawal verification with weight calculation
- Signature validation against guardian weights
- Emergency timelock (30-day delay)
- Vault freezing capability
- Fallback to traditional quorum if needed

#### Main Functions

**Withdrawals:**
```solidity
withdrawWithWeights(
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    bool isEmergency,
    bytes[] memory signatures
) external nonReentrant
```

**Configuration:**
```solidity
setWeightedVoting(bool _useWeighted) external
setQuorum(uint256 _newQuorum) external
updateGuardianWeights(address _newAddress) external
```

**Emergency:**
```solidity
freezeVault() external
unfreezeVault() external
requestEmergencyUnlock() external
executeEmergencyUnlock(address token) external
cancelEmergencyUnlock() external
```

## Weight Distribution Strategies

### 1. Hierarchical Weights (Roles-Based)

```
CEO:              Weight 10  (most authority)
CFO:              Weight 5
Treasurer:        Weight 5
Department Head:  Weight 3
Manager:          Weight 2
Observer:         Weight 0   (no voting)
```

**Example Setup:**
```solidity
setGuardianWeight(vault, ceo, 10);
setGuardianWeight(vault, cfo, 5);
setGuardianWeight(vault, treasurer, 5);
setGuardianWeight(vault, deptHead, 3);
setGuardianWeight(vault, manager, 2);

totalWeight = 25
setWeightedQuorum(vault, 13);  // Majority (> 50%)
```

### 2. Equal Weights (Democratic)

```
Guardian 1: Weight 1
Guardian 2: Weight 1
Guardian 3: Weight 1
Guardian 4: Weight 1
Guardian 5: Weight 1
```

**Example Setup:**
```solidity
for (int i = 0; i < 5; i++) {
    setGuardianWeight(vault, guardians[i], 1);
}

totalWeight = 5
setWeightedQuorum(vault, 3);  // Majority (> 50%)
```

### 3. Weighted by Stake/Contribution

```
Alice (50% stake):    Weight 50
Bob (30% stake):      Weight 30
Charlie (20% stake):  Weight 20
```

**Example Setup:**
```solidity
setGuardianWeight(vault, alice, 50);
setGuardianWeight(vault, bob, 30);
setGuardianWeight(vault, charlie, 20);

totalWeight = 100
setWeightedQuorum(vault, 51);  // Majority
```

### 4. Voting Power Tiers

```
Tier A (Veto Power):    Weight 40
Tier B (Major Vote):    Weight 20
Tier C (Support Vote):  Weight 10
```

**Example Setup:**
```solidity
// Tier A: Veto power
setGuardianWeight(vault, tierA, 40);

// Tier B: Major votes
for (int i = 0; i < 2; i++) {
    setGuardianWeight(vault, tierB[i], 20);
}

// Tier C: Support votes
for (int i = 0; i < 3; i++) {
    setGuardianWeight(vault, tierC[i], 10);
}

totalWeight = 100
setWeightedQuorum(vault, 51);  // Multiple combinations possible
```

## Deployment & Setup

### Step 1: Deploy Contracts

```javascript
// Deploy GuardianWeights
const GuardianWeights = await ethers.getContractFactory("GuardianWeights");
const weights = await GuardianWeights.deploy();
await weights.waitForDeployment();

// Deploy SpendVaultWithWeights
const SpendVaultWithWeights = await ethers.getContractFactory("SpendVaultWithWeights");
const vault = await SpendVaultWithWeights.deploy(
    guardianSBTAddress,
    weights.address,
    2,      // fallback quorum
    false   // initially use traditional voting
);
```

### Step 2: Assign Guardian Weights

```javascript
// Set weights for guardians
const guardians = [
    { address: "0xCEO...", weight: 10 },
    { address: "0xCFO...", weight: 5 },
    { address: "0xTreasurer...", weight: 5 },
    { address: "0xManager...", weight: 2 }
];

for (const guardian of guardians) {
    await weights.setGuardianWeight(
        vault.address,
        guardian.address,
        guardian.weight
    );
}
```

### Step 3: Configure Weighted Quorum

```javascript
// Total weight = 22
// Set quorum to 12 (> 50%)
const totalWeight = 22;
const threshold = Math.ceil(totalWeight / 2) + 1; // 12

await weights.setWeightedQuorum(vault.address, threshold);

// Verify stats
const stats = await weights.getVotingStats(vault.address);
console.log("Total Weight:", stats.totalWeight);      // 22
console.log("Threshold:", stats.quorumThreshold);     // 12
console.log("Guardian Count:", stats.guardianCount);  // 4
```

### Step 4: Enable Weighted Voting

```javascript
// Enable weighted voting mode
await weights.enableWeightedVoting(vault.address);

// Or toggle in vault contract
await vault.setWeightedVoting(true);
```

## Usage Examples

### Example 1: Corporate Treasury with Weighted Votes

```javascript
// Setup: 3 executives with different authority levels
const executives = {
    ceo: "0x1111...",      // Weight 5 (highest authority)
    cfo: "0x2222...",      // Weight 3
    treasurer: "0x3333..."  // Weight 2
};

// Deploy and configure
const vault = await deployVault(...);
const weights = await deployWeights(...);

// Assign weights
await weights.setGuardianWeight(vault.address, executives.ceo, 5);
await weights.setGuardianWeight(vault.address, executives.cfo, 3);
await weights.setGuardianWeight(vault.address, executives.treasurer, 2);

// Total: 10, Quorum: 6 (majority)
await weights.setWeightedQuorum(vault.address, 6);
await weights.enableWeightedVoting(vault.address);

// Verify
const stats = await weights.getVotingStats(vault.address);
// {
//   totalWeight: 10,
//   quorumThreshold: 6,
//   guardianCount: 3,
//   isEnabled: true
// }

// Withdrawal scenarios:
// - CEO (5) + Treasurer (2) = 7 ✅ (meets 6)
// - CEO (5) + CFO (3) = 8 ✅ (meets 6)
// - CFO (3) + Treasurer (2) = 5 ❌ (needs 6)
// - CEO (5) alone = 5 ❌ (needs 6)
```

### Example 2: DAO with Stake-Weighted Voting

```javascript
// Setup: Members with different stake amounts
const members = {
    largeLP: "0xAAAA...",    // 40% stake, weight 40
    mediumLP: "0xBBBB...",   // 35% stake, weight 35
    smallLP: "0xCCCC..."     // 25% stake, weight 25
};

// Configure
for (const [role, address] of Object.entries(members)) {
    const weight = role === "largeLP" ? 40 : role === "mediumLP" ? 35 : 25;
    await weights.setGuardianWeight(vault.address, address, weight);
}

// Quorum: 51 (majority)
await weights.setWeightedQuorum(vault.address, 51);

// Check minimum guardians needed
const minGuardians = await weights.getMinGuardiansForQuorum(vault.address);
// Returns: 2 (Large + Medium = 75, or Large + Small = 65)

// Can single member pass alone?
const canLargeLPPass = await weights.canGuardianPassAlone(
    vault.address,
    members.largeLP
);
// Returns: false (40 < 51)
```

### Example 3: Family Trust with Weighted Authority

```javascript
// Setup: Parents have more authority than children
const family = {
    dad: "0x1111...",      // Weight 4
    mom: "0x2222...",      // Weight 4
    elder: "0x3333...",    // Weight 2 (teenager)
    lawyer: "0x4444...",   // Weight 1 (advisor)
    observer: "0x5555..."  // Weight 0 (monitoring only)
};

// Configure weights
await weights.setGuardianWeight(vault.address, family.dad, 4);
await weights.setGuardianWeight(vault.address, family.mom, 4);
await weights.setGuardianWeight(vault.address, family.elder, 2);
await weights.setGuardianWeight(vault.address, family.lawyer, 1);
// observer has no weight

// Total: 11, Quorum: 6 (majority)
await weights.setWeightedQuorum(vault.address, 6);

// Approval scenarios:
// - Dad (4) + Mom (4) = 8 ✅
// - Dad (4) + Elder (2) = 6 ✅
// - Mom (4) + Elder (2) = 6 ✅
// - Elder (2) + Lawyer (1) + Observer (0) = 3 ❌
// - All except parents = 3 ❌
```

## Advanced Features

### Majority Calculation Helper

```javascript
async function calculateMajorityQuorum(vault, weights) {
    const stats = await weights.getVotingStats(vault);
    const majority = Math.ceil(stats.totalWeight / 2) + 1;
    return majority;
}

// Usage
const majority = await calculateMajorityQuorum(vaultAddress, weightsAddress);
await weights.setWeightedQuorum(vaultAddress, majority);
```

### Weight Distribution Report

```javascript
async function getWeightReport(vault, weights) {
    const [guardians, weights_array] = await weights.getWeightDistribution(vault);
    const stats = await weights.getVotingStats(vault);
    
    let report = {
        totalWeight: stats.totalWeight,
        quorum: stats.quorumThreshold,
        guardians: []
    };
    
    for (let i = 0; i < guardians.length; i++) {
        const percentage = (weights_array[i] * 100) / stats.totalWeight;
        const canPassAlone = await weights.canGuardianPassAlone(vault, guardians[i]);
        
        report.guardians.push({
            address: guardians[i],
            weight: weights_array[i].toString(),
            percentage: percentage.toFixed(2) + "%",
            canPassAlone
        });
    }
    
    return report;
}
```

### Dynamic Weight Adjustment

```javascript
async function adjustWeight(vault, weights, guardian, newWeight) {
    // Get current weight
    const current = await weights.getGuardianWeight(vault, guardian);
    
    // Update to new weight
    if (newWeight > 0) {
        await weights.setGuardianWeight(vault, guardian, newWeight);
    } else {
        await weights.removeGuardianWeight(vault, guardian);
    }
    
    console.log(`Updated ${guardian} from ${current} to ${newWeight}`);
}
```

## Events

### GuardianWeights Events

```solidity
event WeightAssigned(
    address indexed vault,
    address indexed guardian,
    uint256 weight,
    uint256 totalVaultWeight
);

event WeightRemoved(
    address indexed vault,
    address indexed guardian,
    uint256 previousWeight
);

event QuorumThresholdSet(
    address indexed vault,
    uint256 threshold,
    bool enabled
);

event WeightedVotingEnabled(address indexed vault);
event WeightedVotingDisabled(address indexed vault);
```

### SpendVaultWithWeights Events

```solidity
event WeightedSignatureCollected(
    address indexed guardian,
    uint256 weight,
    uint256 totalWeightSoFar,
    uint256 nonce
);

event WeightedQuorumMet(
    uint256 nonce,
    uint256 totalWeight,
    uint256 requiredWeight
);

event WeightedVotingToggled(bool enabled);
```

## Security Considerations

✅ **Weight Validation** - Only positive weights allowed
✅ **Quorum Enforcement** - Threshold must be <= total weight
✅ **Duplicate Prevention** - Same guardian cannot sign twice
✅ **Owner-Only Configuration** - Only vault owner can set weights
✅ **EIP-712 Signing** - Type-safe signature verification
✅ **Replay Protection** - Nonce increments per withdrawal
✅ **Emergency Controls** - Freezing and timelock
✅ **Reentrancy Guard** - Protected against attacks

## Gas Optimization

| Operation | Gas Cost |
|-----------|----------|
| setGuardianWeight() | ~40,000 |
| removeGuardianWeight() | ~30,000 |
| setWeightedQuorum() | ~25,000 |
| withdrawWithWeights() | ~120,000-180,000 |
| getWeightDistribution() | View-only |

## Migration from Equal Voting

If you have an existing vault with equal voting:

```javascript
// 1. Keep traditional quorum initially
const quorum = 2;
let useWeighted = false;

// 2. Deploy weights contract
const weights = await deployWeights();

// 3. Assign equal weights first
await weights.setGuardianWeight(vault, guardian1, 1);
await weights.setGuardianWeight(vault, guardian2, 1);
await weights.setGuardianWeight(vault, guardian3, 1);
await weights.setWeightedQuorum(vault, 2);

// 4. Switch to weighted voting
await vault.setWeightedVoting(true);

// 5. Now you can adjust weights as needed
await weights.setGuardianWeight(vault, senior, 2);
```

## Troubleshooting

### "Weighted quorum not met"
- Check guardian weights: `getGuardianWeight(vault, guardian)`
- Verify quorum threshold: `getVotingStats(vault)`
- Ensure signatures from high-weight guardians

### "Weight exceeds total vault weight"
- Total weight should equal sum of all guardian weights
- Check with: `getVotingStats(vault)`

### "Guardian has no weight assigned"
- Guardian must have weight > 0
- Use: `setGuardianWeight(vault, guardian, weight)`

### "Weighted voting not enabled"
- Enable with: `weights.enableWeightedVoting(vault)`
- Or: `vault.setWeightedVoting(true)`

## Comparison: Equal vs Weighted

| Aspect | Equal | Weighted |
|--------|-------|----------|
| Authority | All equal | Different levels |
| Complexity | Simple | Advanced |
| Flexibility | Limited | High |
| Governance | Democratic | Hierarchical |
| Gas Cost | Lower | Slightly higher |
| Use Cases | Simple multi-sig | DAO, corporate, family |

## API Reference

### GuardianWeights

| Function | Returns | Description |
|----------|---------|-------------|
| setGuardianWeight | - | Assign weight to guardian |
| removeGuardianWeight | - | Remove guardian weight |
| setWeightedQuorum | - | Set quorum threshold |
| getGuardianWeight | uint256 | Get guardian's weight |
| getWeightedGuardians | address[] | List all weighted guardians |
| calculateTotalWeight | uint256 | Sum weights of guardians |
| isWeightedQuorumMet | bool | Check if quorum met |
| getVotingStats | tuple | Get all voting stats |
| canGuardianPassAlone | bool | Can single guardian approve |

### SpendVaultWithWeights

| Function | Returns | Description |
|----------|---------|-------------|
| withdrawWithWeights | - | Execute weighted withdrawal |
| setWeightedVoting | - | Toggle voting mode |
| getRequiredApprovals | uint256 | Get current requirement |
| getVotingStats | tuple | Get vault voting stats |
| freezeVault | - | Emergency freeze |
| unfreezeVault | - | Unfreeze vault |

## Version Info

- **Version**: 1.0
- **Status**: Production Ready
- **Last Updated**: January 2024
- **Solidity**: ^0.8.20
- **OpenZeppelin**: ^5.0.0
