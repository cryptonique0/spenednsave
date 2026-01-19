# Feature #10: Vault Pausing - Quick Reference

## What Is Vault Pausing?

A temporary pause mechanism that **blocks withdrawals** while **allowing deposits**. Ideal for security responses and maintenance.

---

## Quick Start

### Deploy
```solidity
// 1. Factory creates shared controller automatically
VaultFactoryWithPausing factory = new VaultFactoryWithPausing(guardianSBT);

// 2. Create vault with pausing capability
address vault = factory.createVault(2);  // quorum = 2
```

### Pause a Vault
```solidity
// As vault owner
pausingController.pauseVault(vault, "Suspicious activity detected");
```

### Verify Pause Status
```solidity
// Check if paused
bool isPaused = vault.isVaultPaused();

// Get reason
string reason = vault.getVaultPauseReason();

// Get duration
uint256 elapsedSeconds = vault.getVaultPauseElapsedTime();
```

### Unpause a Vault
```solidity
// When ready to resume
pausingController.unpauseVault(vault, "Issue resolved");
```

---

## Key Differences from Normal Vault

| Operation | Normal Vault | Paused Vault |
|-----------|-----|----------|
| Deposit tokens | ✅ Works | ✅ Works |
| Deposit ETH | ✅ Works | ✅ Works |
| Withdraw | ✅ Works | ❌ Blocked |
| Signature checks | Yes | Skipped |
| Emergency unlock | ✅ Works | ❌ Blocked |

---

## Common Operations

### Emergency Response Workflow
```
1. Incident → pauseVault("Unauthorized access detected")
2. Investigate → updatePauseReason("30% investigated")
3. Resolved → unpauseVault("Confirmed fraudulent transactions removed")
4. Resume → Normal operations continue
```

### Maintenance Window
```
1. Schedule → pauseVault("Maintenance 8:00-8:30 UTC")
2. Work → Deploy upgrades, run audits
3. Test → Guardian recovery and rotation still work
4. Complete → unpauseVault("Maintenance complete")
5. Verify → Test withdrawals resume
```

### Multi-Day Investigation
```
pauseVault("Incident reported")
updatePauseReason("Day 1: Initial analysis")
updatePauseReason("Day 2: Cross-reference transactions")
updatePauseReason("Day 3: Implement safeguards")
unpauseVault("Recovery plan approved by guardians")
```

---

## Pause Status Queries

### Check Pause State
```solidity
// Method 1: Via vault
if (vault.isVaultPaused()) {
    revert("Cannot withdraw now");
}

// Method 2: Via controller
if (pausingController.isPaused(vault)) {
    // Handle pause...
}

// Method 3: Via factory
if (factory.isVaultPaused(vault)) {
    // Handle pause...
}
```

### Get Pause Details
```solidity
// Pause reason
string reason = vault.getVaultPauseReason();
// → "Suspicious transaction patterns"

// Time paused
uint256 whenPaused = vault.getVaultPauseTime();
// → 1704067200 (Unix timestamp)

// Duration
uint256 durationSeconds = vault.getVaultPauseElapsedTime();
// → 3600 (1 hour)

// Complete history
PauseEvent[] history = pausingController.getPauseHistory(vault);
// → Array of all pause/unpause events
```

---

## Event Monitoring

### Pause Events
```solidity
// When pause activated
event VaultPaused(address vault, string reason, uint256 timestamp);

// When pause lifted
event VaultUnpaused(address vault, string reason, uint256 timestamp);

// When reason updated
event PauseReasonUpdated(address vault, string oldReason, string newReason, uint256 timestamp);
```

### Withdrawal Events
```solidity
// When withdrawal blocked by pause
event WithdrawalAttemptedWhilePaused(address token, uint256 amount, uint256 timestamp);

// When deposit succeeds during pause
event DepositReceivedWhilePaused(address token, uint256 amount, uint256 timestamp);
```

---

## Access Control

### Who Can Pause?
```
✅ Vault owner (via pausingController)
✅ Vault owner (via factory convenience method)
❌ Guardians
❌ Other users
```

### Who Can See Pause Status?
```
✅ Anyone (view functions are public)
```

---

## Gas Costs Summary

| Operation | Cost | Notes |
|-----------|------|-------|
| Pause vault | ~18,000 | One-time pause activation |
| Unpause vault | ~18,000 | Lift pause restriction |
| Update reason | ~10,000 | Quick status update |
| Check if paused | ~500 | Cheap query |
| Get elapsed time | ~700 | Minimal computation |
| Blocked withdraw | ~1,500 | Early revert saves gas |
| Successful deposit | ~40,000 | Normal transfer cost |

---

## Feature Integration

### Works With Feature #7 (Guardian Rotation)
- Expired guardians still rejected even during pause
- Recovery process respects both expiry AND pause

### Works With Feature #8 (Guardian Recovery)
- Recovery votes continue while vault paused
- Removing compromised guardian possible during pause

### Works With Feature #9 (Emergency Override)
- Emergency withdrawals blocked when paused
- Prevents combining pause + emergency mode

---

## Troubleshooting Cheatsheet

### "Vault is paused" Error When Withdrawing
```solidity
// Solution: Check and unpause
require(vault.isVaultPaused(), "Already unpaused");
pausingController.unpauseVault(vault, "Reason for unpause");
```

### Can't Pause Vault
```solidity
// Solution: Verify caller is owner
require(msg.sender == vault.owner(), "Not owner");

// Verify vault is registered
require(pausingController.isManagedVault(vault), "Not registered");
```

### Deposits Still Blocked
```solidity
// This should NOT happen - deposits always work
// Check: Different token? Check token approval
// Check: Wrong vault address?
vault.deposit(token, amount);  // Should always work
```

### High Gas Costs for History
```solidity
// Pause history grows with each cycle
// Solution: Query only recent events
PauseEvent[] history = pausingController.getPauseHistory(vault);
// For large histories, iterate last N entries only
```

---

## Best Practices

### 1. Clear Pause Reasons
```solidity
// ✅ Good: Specific and actionable
pauseVault("Database corruption detected - vendor investigating");

// ❌ Avoid: Vague
pauseVault("Problem");

// ⚠️ Long: Okay but consider off-chain storage
pauseVault("Investigation in progress...");  // >100 chars
```

### 2. Update Status During Long Investigations
```solidity
// Instead of single pause for days:
pauseVault("Incident investigation started");
// Time passes...
updatePauseReason("50% through investigation");
// Time passes...
updatePauseReason("Ready to resume - recovery plan approved");
unpauseVault("Operations resumed");
```

### 3. Monitor Pause Events
```javascript
// Set up listening for security monitoring
vault.on('WithdrawalAttemptedWhilePaused', (token, amount) => {
  log(`Blocked ${amount} withdrawal attempt`);
  // Alert operations team
});
```

### 4. Document Pause Reason
```solidity
// Pause reason becomes audit trail
pauseVault("2024-01-15 10:30 UTC - Unauthorized access attempt");

// Later, can retrieve history
getHistory() → [
  { isPaused: true, reason: "2024-01-15 10:30 UTC - ...", timestamp: ... },
  { isPaused: false, reason: "2024-01-15 11:15 UTC - Issue resolved", timestamp: ... }
]
```

### 5. Test Pause Behavior
```solidity
// In your tests, verify:
// 1. Deposits work while paused
vault.deposit(token, amount);  // Should succeed
require(vault.isVaultPaused());

// 2. Withdrawals fail while paused
vm.expectRevert("Vault is paused");
vault.withdraw(...);

// 3. Everything resumes after unpause
unpauseVault("....");
vault.withdraw(...);  // Should now work
```

---

## Key Concepts

### Pause is Not Withdrawal Lock
```
Pause        = Temporary, owner-controlled halt of withdrawals
Withdrawal   = Permanent removal of funds (different from pause)
Lock (future)= Time-based unavailability
```

### Deposits Work Intentionally
```
Why deposits allowed during pause?
- Emergency fund accumulation
- Allow others to help restore vault
- Maintain liquidity for recovery operations
```

### History is Append-Only
```
Why keep history?
- Compliance and audit trail
- Incident documentation
- Forensic analysis
- Governance transparency
```

---

## Real-World Scenarios

### Scenario 1: 5-Minute Security Response
```
10:00:00 - Suspicious transaction detected
10:00:15 - pauseVault("Unauthorized access detected")
10:00:20 - Investigate transaction origin
10:02:00 - Verify false alarm (legitimate customer)
10:02:30 - unpauseVault("Confirmed legitimate transaction")
10:02:45 - Users can withdraw again

Cost: ~36,000 gas, ~1 min time, 100% fund safety
```

### Scenario 2: 2-Hour Maintenance
```
08:00:00 - pauseVault("Scheduled maintenance 08:00-10:00 UTC")
08:15:00 - Deploy smart contract upgrade
08:45:00 - updatePauseReason("Upgrade complete - running final tests")
09:58:00 - All tests passed
10:00:00 - unpauseVault("Maintenance complete - resume normal ops")

Users can deposit throughout maintenance, withdraw after 10:00
```

### Scenario 3: Multi-Day Investigation
```
Day 1 09:00 - pauseVault("Incident investigation initiated")
Day 1 17:00 - updatePauseReason("Day 1: Analyzed 2000 transactions")
Day 2 09:00 - updatePauseReason("Day 2: Isolated 50 suspicious txns")
Day 2 17:00 - updatePauseReason("Day 2: 40 identified as legitimate")
Day 3 10:00 - updatePauseReason("Ready to unpause - 10 txns fraud only")
Day 3 14:00 - unpauseVault("Investigation complete - fraud isolated")

Result: Complete audit trail, no gas-expensive pause/unpause cycles
```

---

## References

**Full Documentation**: [VAULT_PAUSING_IMPLEMENTATION.md](./VAULT_PAUSING_IMPLEMENTATION.md)

**Architecture**: [VAULT_PAUSING_INDEX.md](./VAULT_PAUSING_INDEX.md)

**Verification**: [VAULT_PAUSING_VERIFICATION.md](./VAULT_PAUSING_VERIFICATION.md)

**Related Features**:
- [Feature #7: Guardian Rotation](./FEATURE_7_GUARDIAN_ROTATION.md)
- [Feature #8: Guardian Recovery](./FEATURE_8_GUARDIAN_RECOVERY.md)
- [Feature #9: Emergency Override](./FEATURE_9_EMERGENCY_GUARDIAN_OVERRIDE.md)
