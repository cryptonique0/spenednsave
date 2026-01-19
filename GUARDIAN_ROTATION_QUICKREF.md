# Guardian Rotation Quick Reference

## Contracts

### GuardianRotation.sol
Core contract managing guardian expiry dates.

### SpendVaultWithGuardianRotation.sol  
Vault with integrated guardian expiry validation.

### VaultFactoryWithGuardianRotation.sol
Factory for easy deployment of vault systems with rotation.

## Key Functions

### Add Guardian
```solidity
rotation.addGuardian(guardianAddress, vaultAddress, expiryTimestamp);
// expiryTimestamp = 0 uses default period
```

### Check if Active
```solidity
bool isActive = rotation.isActiveGuardian(guardianAddress, vaultAddress);
```

### Renew Guardian
```solidity
rotation.renewGuardian(guardianAddress, vaultAddress, newExpiryTimestamp);
```

### Get Remaining Time
```solidity
uint256 secondsLeft = rotation.getSecondsUntilExpiry(guardianAddress, vaultAddress);
```

### Get Active Count
```solidity
uint256 count = rotation.getActiveGuardianCount(vaultAddress);
```

### Remove Guardian
```solidity
rotation.removeGuardian(guardianAddress, vaultAddress);
```

## Deployment

```javascript
// 1. Deploy factory
const factory = await deploy("VaultFactoryWithGuardianRotation");

// 2. Create vault
const [guardianToken, vault] = await factory.getUserContracts(userAddress);

// 3. Setup guardians
const rotation = await factory.getGuardianRotation();
await rotation.addGuardian(guardian1, vault, expiryTime);
```

## Important

- Guardians must be active (not expired) to sign withdrawals
- Quorum calculated based on active guardians only
- All signers are validated during withdrawal
- Expired guardians automatically rejected

## Default Expiry Period

- Default: 365 days
- Configurable per vault or globally

## Events

- `GuardianAdded` - Guardian added with expiry
- `GuardianExpired` - Guardian reached expiry time
- `GuardianRenewed` - Guardian renewed
- `GuardianRemoved` - Guardian removed

## Common Tasks

### Monitor expiring guardians
```javascript
const remaining = await rotation.getSecondsUntilExpiry(addr, vault);
// Warn if < 7 days
```

### Check withdrawal eligibility
```javascript
const active = await rotation.getActiveGuardianCount(vault);
if (active < quorum) { /* cannot withdraw */ }
```

### Bulk cleanup
```javascript
rotation.cleanupExpiredGuardians(vault); // Gas optimization
```

## Security Notes

✅ Expired guardians cannot sign  
✅ All signatures validated per withdrawal  
✅ Quorum enforced with active guardians only  
✅ Nonce prevents replay attacks  
✅ Events log all changes  

## Expiry Date Format

Use Unix timestamps (seconds since epoch):
```javascript
const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
```

Or in Solidity:
```solidity
uint256 expiryTime = block.timestamp + 30 days;
```
