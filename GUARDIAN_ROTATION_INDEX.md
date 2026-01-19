# Guardian Rotation Feature - Complete Index

## Quick Navigation

### For Developers
- **Start Here**: [Guardian Rotation Quick Reference](./GUARDIAN_ROTATION_QUICKREF.md)
- **Full Guide**: [Guardian Rotation Implementation Guide](./GUARDIAN_ROTATION_IMPLEMENTATION.md)
- **Contracts**: [Updated README](./contracts/README.md)
- **API Docs**: [Feature 7 Complete Documentation](./FEATURE_7_GUARDIAN_ROTATION.md)

### For Reviewers
- **Implementation Summary**: [Guardian Rotation Complete](./GUARDIAN_ROTATION_COMPLETE.md)
- **Verification Checklist**: [Guardian Rotation Verification](./GUARDIAN_ROTATION_VERIFICATION.md)
- **Smart Contracts**: See `/contracts` directory

### For Deployment
1. Deploy [VaultFactoryWithGuardianRotation.sol](./contracts/VaultFactoryWithGuardianRotation.sol)
2. Follow [Deployment Steps](./GUARDIAN_ROTATION_IMPLEMENTATION.md#deployment-process)
3. Use [Setup Examples](./GUARDIAN_ROTATION_QUICKREF.md#deployment)

## What is Guardian Rotation?

Guardian Rotation automatically invalidates guardian access after an expiry date passes. This adds time-based security to the SpendVault system, ensuring that guardian credentials are regularly renewed and temporary compromises are naturally contained.

## Key Features

✅ **Automatic Expiry**: Guardians become inactive after their expiry date  
✅ **Easy Renewal**: Extend guardian access with a simple function call  
✅ **Quorum Enforcement**: Quorum calculated from active guardians only  
✅ **Time Tracking**: Get seconds until each guardian expires  
✅ **Flexible Periods**: Default (365 days) or customize per vault  
✅ **Gas Optimized**: Optional cleanup removes expired guardians  

## Contract Files

### Core Contracts
1. **GuardianRotation.sol** (262 lines)
   - Manages guardian expiry dates
   - Tracks active vs expired guardians
   - Renewal mechanism
   - Configuration management

2. **SpendVaultWithGuardianRotation.sol** (295 lines)
   - Multi-sig vault with expiry checks
   - Validates all signers are active guardians
   - Full withdrawal capability
   - EIP-712 signature support

3. **VaultFactoryWithGuardianRotation.sol** (142 lines)
   - Single factory per network
   - Creates vault + token + rotation system
   - User vault enumeration
   - Simplified deployment

### Test Contracts
1. **GuardianRotation.test.sol** (136 lines)
   - 10 test functions
   - Full rotation logic coverage

2. **SpendVaultWithGuardianRotation.test.sol** (246 lines)
   - 18 integration tests
   - Vault + rotation integration

## Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| GUARDIAN_ROTATION_QUICKREF.md | Quick reference guide | Developers |
| GUARDIAN_ROTATION_IMPLEMENTATION.md | Complete guide with examples | Developers + Integrators |
| GUARDIAN_ROTATION_COMPLETE.md | Implementation summary | Project Managers |
| FEATURE_7_GUARDIAN_ROTATION.md | Official feature docs | Technical Leads |
| GUARDIAN_ROTATION_VERIFICATION.md | Implementation checklist | Reviewers |
| contracts/README.md | All contracts reference | Everyone |

## How It Works

```
1. Factory deploys vault system
2. Owner adds guardians with expiry dates
3. Guardians can sign withdrawals (if active)
4. Expired guardians automatically rejected
5. Owner can renew or replace guardians
```

## Quick Start

```javascript
// 1. Deploy factory
const factory = await deploy("VaultFactoryWithGuardianRotation");

// 2. Create vault
const [token, vault] = await factory.getUserContracts(userAddr);
const rotation = await factory.getGuardianRotation();

// 3. Add guardian (expires in 30 days)
const expiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.addGuardian(guardianAddr, vault, expiry);

// 4. Check status
const isActive = await rotation.isActiveGuardian(guardianAddr, vault);
const remaining = await rotation.getSecondsUntilExpiry(guardianAddr, vault);

// 5. Renew before expiry
const newExpiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.renewGuardian(guardianAddr, vault, newExpiry);
```

## API Summary

### GuardianRotation Functions

**Management**
- `addGuardian(guardian, vault, expiryDate)` - Add with expiry
- `removeGuardian(guardian, vault)` - Remove guardian
- `renewGuardian(guardian, vault, newExpiryDate)` - Renew expiry

**Checking**
- `isActiveGuardian(guardian, vault)` - Is active?
- `getExpiryDate(guardian, vault)` - Get expiry timestamp
- `getSecondsUntilExpiry(guardian, vault)` - Get countdown

**Counting**
- `getActiveGuardianCount(vault)` - Count active
- `getExpiredGuardianCount(vault)` - Count expired
- `getActiveGuardians(vault)` - List active

**Configuration**
- `setDefaultExpiryPeriod(period)` - Set global period
- `setVaultExpiryPeriod(vault, period)` - Per-vault period

**Maintenance**
- `cleanupExpiredGuardians(vault)` - Remove expired entries

### SpendVaultWithGuardianRotation Functions

All SpendVault functions plus:
- `isActiveGuardian(guardian)` - Check active + not expired
- `getActiveGuardianCount()` - Get active count for this vault
- `updateGuardianRotation(address)` - Update rotation contract

### VaultFactoryWithGuardianRotation Functions

- `createVault(quorum)` - Create vault system
- `getUserContracts(user)` - Get user's contracts
- `getGuardianRotation()` - Get shared rotation contract
- `getTotalVaults()` - Count all vaults
- `getVaultByIndex(index)` - Get vault by index

## Security Features

✅ **Automatic Invalidation**
- Expired guardians rejected automatically
- No manual action required

✅ **Signature Validation**
- Every signature verified as active guardian
- Expired guardians cannot sign

✅ **Quorum Enforcement**
- Quorum based on active guardians
- Insufficient active guardians = withdrawal fails

✅ **Replay Protection**
- Nonce increments per withdrawal
- EIP-712 signature verification
- Cannot replay old signatures

✅ **Monitoring**
- All changes logged as events
- Easy to monitor guardian health

## Best Practices

1. **Stagger Expiry Dates**
   - Don't expire all guardians simultaneously
   - Ensures continuous quorum coverage

2. **Proactive Renewal**
   - Monitor guardians expiring within 7 days
   - Renew before expiry

3. **Maintain Redundancy**
   - Keep more active guardians than quorum requires
   - Protects against unexpected expirations

4. **Regular Monitoring**
   - Track active vs expired count
   - Alert on quorum issues

5. **Cleanup Regularly**
   - Run `cleanupExpiredGuardians()` periodically
   - Saves gas on future operations

## Integration with Existing System

Guardian Rotation integrates seamlessly with:
- **GuardianSBT**: Guardian identity tokens
- **SpendVault**: Base vault functionality
- **EIP-712**: Signature verification
- **OpenZeppelin**: Standard contracts

Works alongside all existing vault features.

## Testing

```bash
# Run rotation tests
npx hardhat test contracts/GuardianRotation.test.sol

# Run vault integration tests
npx hardhat test contracts/SpendVaultWithGuardianRotation.test.sol

# Run all tests
npx hardhat test
```

Coverage:
- ✅ Guardian addition/removal
- ✅ Expiry detection
- ✅ Renewal mechanism
- ✅ Period configuration
- ✅ Vault integration
- ✅ Withdrawal validation
- ✅ Edge cases

## Deployment Checklist

- [ ] Review [Implementation Guide](./GUARDIAN_ROTATION_IMPLEMENTATION.md)
- [ ] Understand [Architecture](./GUARDIAN_ROTATION_IMPLEMENTATION.md#architecture)
- [ ] Review [Security Considerations](./GUARDIAN_ROTATION_IMPLEMENTATION.md#security-considerations)
- [ ] Run [Tests](./contracts/GuardianRotation.test.sol)
- [ ] Deploy factory contract
- [ ] Create user vault
- [ ] Add guardians with expiry dates
- [ ] Fund vault
- [ ] Test withdrawal (happy path)
- [ ] Monitor guardian health
- [ ] Plan renewal schedule

## Troubleshooting

**Guardian rejected from signing**
→ Check if guardian is expired: `isActiveGuardian()`

**Withdrawal fails with insufficient guardians**
→ Renew expiring guardians: `renewGuardian()`

**High gas costs**
→ Run cleanup: `cleanupExpiredGuardians()`

See [Full Troubleshooting](./GUARDIAN_ROTATION_IMPLEMENTATION.md#troubleshooting)

## Support

For questions about:
- **Setup**: See [Deployment Process](./GUARDIAN_ROTATION_IMPLEMENTATION.md#deployment-process)
- **Usage**: See [Usage Scenarios](./GUARDIAN_ROTATION_IMPLEMENTATION.md#usage-scenarios)
- **Integration**: See [Integration Examples](./GUARDIAN_ROTATION_IMPLEMENTATION.md#integration-examples)
- **Issues**: See [Troubleshooting](./GUARDIAN_ROTATION_IMPLEMENTATION.md#troubleshooting)

## Status

**✅ COMPLETE AND PRODUCTION-READY**

- All contracts implemented and tested
- Full documentation provided
- Integration examples included
- Ready for deployment

---

**Feature 7: Guardian Rotation**  
**Implemented**: January 19, 2026  
**Version**: 1.0  
**Status**: Production Ready ✅
