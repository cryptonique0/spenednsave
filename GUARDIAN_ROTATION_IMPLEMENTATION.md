# Guardian Rotation Implementation Guide

## Overview

Guardian Rotation is a feature that automatically invalidates guardians after their expiry dates pass. This adds a layer of security and ensures that access privileges are time-limited and regularly renewed.

## Components

### 1. GuardianRotation Contract
The core contract managing expiry dates and guardian rotation logic.

**Key Responsibilities**:
- Track guardian expiry dates per vault
- Determine if a guardian is active (not expired)
- Manage guardian renewal
- Calculate time-to-expiry

### 2. SpendVaultWithGuardianRotation Contract
Enhanced vault that integrates guardian rotation checks.

**Key Features**:
- Validates guardians during withdrawal signature verification
- Tracks active vs expired guardian counts
- Automatically rejects signatures from expired guardians
- Enforces quorum based on active guardians only

### 3. VaultFactoryWithGuardianRotation Contract
Factory that simplifies deployment of vault systems with rotation.

**Key Features**:
- Single deployment per network
- Creates vault + guardian token + uses shared rotation contract
- Tracks all user vaults
- Enables enumeration of all created vaults

## Architecture

```
User's Vault System:
├── GuardianSBT (ERC-721)
│   └── Manages guardian identities
├── SpendVaultWithGuardianRotation
│   └── Multi-sig treasury with expiry checks
└── GuardianRotation (Shared)
    └── Manages expiry dates & rotation logic
```

## Deployment Process

### Step 1: Deploy Factory
```javascript
const factory = await deploy("VaultFactoryWithGuardianRotation");
// This deploys the factory which creates a shared GuardianRotation contract
```

### Step 2: Create User Vault
```javascript
const tx = await factory.createVault(2); // quorum = 2
const [guardianToken, vault] = await factory.getUserContracts(userAddress);
const rotation = await factory.getGuardianRotation();
```

### Step 3: Setup Guardians
```javascript
// Add guardians with expiry dates
const expiryTime = currentTime + (30 * 24 * 60 * 60); // 30 days

await rotation.addGuardian(guardian1, vaultAddress, expiryTime);
await rotation.addGuardian(guardian2, vaultAddress, expiryTime);
await rotation.addGuardian(guardian3, vaultAddress, expiryTime);
```

## Usage Scenarios

### Scenario 1: Adding a New Guardian

```javascript
// Owner adds guardian with 90-day expiry
const expiryTime = ethers.BigNumber.from(Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60));
await rotation.addGuardian(newGuardianAddress, vaultAddress, expiryTime);
```

### Scenario 2: Checking Guardian Status

```javascript
// Check if guardian is active (not expired)
const isActive = await rotation.isActiveGuardian(guardianAddress, vaultAddress);

if (!isActive) {
    console.log("Guardian is expired or not found");
}

// Get remaining time
const secondsRemaining = await rotation.getSecondsUntilExpiry(guardianAddress, vaultAddress);
console.log(`Guardian expires in ${secondsRemaining / 86400} days`);
```

### Scenario 3: Renewing Guardian Access

```javascript
// Renew guardian for another 30 days
const newExpiry = ethers.BigNumber.from(Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60));
await rotation.renewGuardian(guardianAddress, vaultAddress, newExpiry);
```

### Scenario 4: Automatic Expiry Validation

During a withdrawal attempt, the vault automatically validates that all signers are active guardians:

```javascript
// Signer must:
// 1. Hold a guardian SBT token
// 2. Be registered in GuardianRotation
// 3. Have not yet reached their expiry date

// If any signer is expired, withdrawal reverts with:
// "Guardian is inactive or expired"
```

### Scenario 5: Monitoring Guardian Health

```javascript
// Get all active guardians
const activeGuardians = await rotation.getActiveGuardians(vaultAddress);

// Get expiry date for a specific guardian
const expiryDate = await rotation.getExpiryDate(guardianAddress, vaultAddress);

// Count expired guardians
const expiredCount = await rotation.getExpiredGuardianCount(vaultAddress);

// Get quorum-ready guardian count
const activeCount = await rotation.getActiveGuardianCount(vaultAddress);

// Check if we can meet quorum
const canWithdraw = activeCount >= requiredQuorum;
```

## Time Management

### Default Expiry Period

All vaults use a default expiry period (365 days by default):

```javascript
// Set new default for all vaults
await rotation.setDefaultExpiryPeriod(180 * 24 * 60 * 60); // 180 days
```

### Vault-Specific Period

Override the default for a specific vault:

```javascript
// Vault needs more frequent guardian renewal
await rotation.setVaultExpiryPeriod(vaultAddress, 60 * 24 * 60 * 60); // 60 days
```

## Security Considerations

### 1. Active Guardian Validation
Every withdrawal requires ALL signers to be active (not expired). This is checked during signature verification.

### 2. Quorum Enforcement
Withdrawals fail if there aren't enough active guardians to meet quorum:

```javascript
// If only 1 of 3 guardians is active and quorum is 2, withdrawal fails
```

### 3. Signature Replay Prevention
Nonce increments after each withdrawal, preventing signature replay.

### 4. Cleanup Operations
Expired guardians can be pruned from tracking to save gas:

```javascript
// Remove expired guardians from vault tracking
await rotation.cleanupExpiredGuardians(vaultAddress);
```

## Events

Guardian rotation emits events for all state changes:

```javascript
// When guardian is added
event GuardianAdded(address indexed guardian, address indexed vault, uint256 expiryDate);

// When guardian expires
event GuardianExpired(address indexed guardian, address indexed vault);

// When guardian is renewed
event GuardianRenewed(address indexed guardian, address indexed vault, uint256 newExpiryDate);

// When guardian is removed
event GuardianRemoved(address indexed guardian, address indexed vault);

// When expiry periods change
event DefaultExpiryPeriodUpdated(uint256 newPeriod);
event VaultExpiryPeriodUpdated(address indexed vault, uint256 newPeriod);
```

## Best Practices

### 1. Proactive Renewal
Set up monitoring to renew guardians before they expire:

```javascript
// Check for guardians expiring within 7 days
for (const guardian of guardians) {
    const remaining = await rotation.getSecondsUntilExpiry(guardian, vault);
    if (remaining < 7 * 24 * 60 * 60) {
        // Renew guardian
    }
}
```

### 2. Redundancy
Always maintain more active guardians than required by quorum:

```javascript
// If quorum is 2, have at least 4 active guardians
// This protects against unexpected expirations
```

### 3. Staggered Expiry
Don't set all guardians to expire on the same date:

```javascript
// Guardian 1 expires in 30 days
// Guardian 2 expires in 45 days
// Guardian 3 expires in 60 days
// This ensures continuous quorum coverage
```

### 4. Monitoring Dashboard
Implement a dashboard showing:
- Active guardian count
- Expired guardian count
- Guardians expiring within next 30 days
- Quorum status

## Testing

Guardian rotation includes comprehensive test suite:

```bash
# Run guardian rotation tests
npx hardhat test contracts/GuardianRotation.test.sol

# Run vault with rotation tests
npx hardhat test contracts/SpendVaultWithGuardianRotation.test.sol
```

## Migration Path

### From Legacy System

If migrating from a non-expiry system:

1. Deploy `GuardianRotation`
2. Deploy `SpendVaultWithGuardianRotation` (uses new rotation contract)
3. Add all existing guardians to rotation with appropriate expiry dates
4. Update vault references to point to new vault address
5. Migrate user funds to new vault

```javascript
// Add legacy guardians to rotation
const expiryTime = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);

for (const guardianAddress of legacyGuardians) {
    await rotation.addGuardian(guardianAddress, newVaultAddress, expiryTime);
}
```

## Troubleshooting

### Issue: Withdrawal fails with "Guardian is inactive or expired"

**Solution**: Check guardian expiry status:
```javascript
const isActive = await rotation.isActiveGuardian(guardianAddress, vaultAddress);
if (!isActive) {
    // Renew or replace guardian
}
```

### Issue: Insufficient active guardians for quorum

**Solution**: Renew expiring guardians:
```javascript
const activeCount = await rotation.getActiveGuardianCount(vaultAddress);
if (activeCount < quorum) {
    // Renew some guardians
}
```

### Issue: Gas costs for cleanup

**Solution**: Run cleanup periodically:
```javascript
// Removes expired guardians from tracking, saves gas on future operations
await rotation.cleanupExpiredGuardians(vaultAddress);
```

## Integration Examples

### Frontend Integration (ethers.js v6)

```javascript
// Check guardian status
async function checkGuardianStatus(guardianAddr) {
    const isActive = await rotation.isActiveGuardian(guardianAddr, vaultAddr);
    const secondsLeft = await rotation.getSecondsUntilExpiry(guardianAddr, vaultAddr);
    
    return {
        isActive,
        daysRemaining: secondsLeft / (24 * 60 * 60)
    };
}

// Renew guardian
async function renewGuardian(guardianAddr, daysToRenew) {
    const newExpiry = BigInt(Math.floor(Date.now() / 1000) + (daysToRenew * 24 * 60 * 60));
    return await rotation.renewGuardian(guardianAddr, vaultAddr, newExpiry);
}
```

### Monitoring Service

```javascript
// Periodically check guardian health
async function monitorGuardians() {
    const guardians = await rotation.getActiveGuardians(vaultAddr);
    
    for (const guardian of guardians) {
        const remaining = await rotation.getSecondsUntilExpiry(guardian, vaultAddr);
        
        if (remaining < 7 * 24 * 60 * 60) {
            console.warn(`Guardian ${guardian} expiring soon!`);
            // Alert owner or auto-renew
        }
    }
}
```

## Summary

Guardian Rotation provides:
- ✅ Automatic invalidation of inactive guardians
- ✅ Time-based access control
- ✅ Flexible expiry periods (default or per-vault)
- ✅ Easy renewal mechanism
- ✅ Active guardian tracking
- ✅ Gas-efficient operations

This ensures vault security is maintained while allowing controlled access based on time-limited guardian credentials.
