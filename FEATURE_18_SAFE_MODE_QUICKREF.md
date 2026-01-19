# Feature #18: Safe Mode - Quick Reference

## 3-Minute Setup

### Installation
```bash
# Clone or integrate contracts
cp contracts/SafeModeController.sol your-project/
cp contracts/SpendVaultWithSafeMode.sol your-project/
cp contracts/VaultFactoryWithSafeMode.sol your-project/
```

### Deployment
```solidity
// 1. Deploy
SafeModeController controller = new SafeModeController();
SpendVaultWithSafeMode implementation = new SpendVaultWithSafeMode(
    guardianToken,
    address(controller),
    2  // quorum
);
VaultFactoryWithSafeMode factory = new VaultFactoryWithSafeMode(
    guardianToken,
    address(implementation)
);

// 2. Create vault
address vault = factory.deployVault(2);

// 3. Add guardians
SpendVaultWithSafeMode(vault).addGuardian(addr1);
SpendVaultWithSafeMode(vault).addGuardian(addr2);
```

### Basic Usage
```solidity
// Enable safe mode (emergency)
safeModeController.enableSafeMode(vault, "Emergency incident");

// Owner withdraws (only way to get funds)
vault.safeModeWithdraw(token, amount);

// Disable safe mode (restore normal operations)
safeModeController.disableSafeMode(vault, "Incident resolved");

// Check status
bool enabled = safeModeController.isSafeModeEnabled(vault);
```

---

## Quick Facts Table

| Property | Value |
|----------|-------|
| **Purpose** | Emergency vault lockdown - owner-only withdrawals |
| **Activation** | Instant (no delay) |
| **Who Can Enable** | Vault owner only |
| **Who Can Disable** | Vault owner only |
| **Withdrawal When Enabled** | Owner address only |
| **Withdrawal When Disabled** | Multi-sig (normal) |
| **Cost to Enable** | ~35,000 gas |
| **Cost to Check** | ~5,000 gas |
| **History Tracked** | Yes - all toggles logged |
| **Reversible** | Yes - can be toggled multiple times |
| **Backward Compatible** | Yes - all existing features work |

---

## Common Patterns

### Pattern 1: Emergency Response (10 seconds)
```solidity
// Detect issue
if (detectedCompromise) {
    // Immediately lock vault
    safeModeController.enableSafeMode(vault, "Compromise detected");
    
    // Owner withdraws funds to secure location
    vault.safeModeWithdraw(token, vaultBalance);
    
    // Investigation proceeds
}
```

### Pattern 2: Maintenance Window (1 hour)
```solidity
// Schedule maintenance
safeModeController.enableSafeMode(vault, "Scheduled maintenance");

// Notify stakeholders
emit MaintenanceStarted(vault, block.timestamp);

// Execute upgrade logic
performUpgrade();

// Resume operations
safeModeController.disableSafeMode(vault, "Maintenance complete");
emit MaintenanceComplete(vault, block.timestamp);
```

### Pattern 3: Guardian Key Rotation (2 hours)
```solidity
// Freeze vault for security
safeModeController.enableSafeMode(vault, "Guardian rotation");

// Remove old guardians
vault.removeGuardian(oldGuardian1);
vault.removeGuardian(oldGuardian2);

// Add new guardians
vault.addGuardian(newGuardian1);
vault.addGuardian(newGuardian2);

// Resume with new guardians
safeModeController.disableSafeMode(vault, "Rotation complete");
```

### Pattern 4: Multi-Step Safe Mode Operations
```solidity
// Check current state
SafeModeController.SafeModeConfig memory config =
    safeModeController.getSafeModeConfig(vault);

if (config.enabled) {
    uint256 duration = safeModeController.getSafeModeDuration(vault);
    console.log("Safe mode active for %d seconds", duration);
    
    // Perform owner-only operations
    vault.safeModeWithdraw(address(0), 1 ether);
} else {
    // Perform multi-sig operations
    vault.withdraw(address(0), 1 ether, recipient, "Normal", signatures);
}
```

---

## Event Monitoring

### Listen for Safe Mode Activation
```javascript
// Web3.js example
const controller = new ethers.Contract(controllerAddress, ABI, provider);

controller.on('SafeModeEnabled', (vault, reason, timestamp) => {
    console.log(`Safe mode ENABLED on ${vault}`);
    console.log(`Reason: ${reason}`);
    console.log(`Time: ${new Date(timestamp * 1000)}`);
    
    // Alert stakeholders
    notifySecurityTeam(`Vault ${vault} locked down`);
});

controller.on('SafeModeDisabled', (vault, reason, timestamp) => {
    console.log(`Safe mode DISABLED on ${vault}`);
    console.log(`Time: ${new Date(timestamp * 1000)}`);
    
    // Notify operations team
    notifyOpsTeam(`Vault ${vault} restored`);
});
```

### Track All Toggles
```javascript
// Get all historical events
const allToggleEvents = await controller.queryFilter(
    controller.filters.SafeModeToggleRecorded(null, null),
    0,
    'latest'
);

// Analyze by vault
const byVault = {};
for (const event of allToggleEvents) {
    const vault = event.args.vault;
    if (!byVault[vault]) byVault[vault] = [];
    byVault[vault].push({
        enabled: event.args.enabled,
        reason: event.args.reason,
        timestamp: event.args.timestamp,
        block: event.blockNumber
    });
}

console.log('Safe mode history:', byVault);
```

---

## Safe Mode States

### DISABLED (Normal Operations)
```
State: 🟢 ENABLED
Withdrawals: Multi-signature required
Guardian Signatures: Enforced
Multi-Sig Quorum: Enforced
Owner Restriction: None (any recipient)

Actions Available:
✓ Normal withdrawals with signatures
✓ Disable safe mode (if somehow enabled)
✓ Add/remove guardians
✗ safeModeWithdraw() - will revert
```

### ENABLED (Emergency Lockdown)
```
State: 🔴 SAFE MODE
Withdrawals: Owner address ONLY
Guardian Signatures: Ignored
Multi-Sig Quorum: Bypassed
Owner Restriction: Enforced

Actions Available:
✓ safeModeWithdraw() - owner withdrawals
✓ Disable safe mode
✓ Check status/duration
✗ Normal withdraw() - will revert
✗ Guardian signatures - ignored
```

---

## Configuration Examples

### Conservative Vault (3-of-5 Guardians)
```solidity
// Setup
vault.addGuardian(addr1);
vault.addGuardian(addr2);
vault.addGuardian(addr3);
vault.addGuardian(addr4);
vault.addGuardian(addr5);
vault.setQuorum(3);  // 3 of 5 required

// Safe mode strategy:
// - Use only for serious incidents
// - Requires consensus failure for activation
// - Provides balance and oversight
```

### Aggressive Vault (1-of-3 Guardians)
```solidity
// Setup
vault.addGuardian(addr1);
vault.addGuardian(addr2);
vault.addGuardian(addr3);
vault.setQuorum(1);  // Any 1 of 3 can approve

// Safe mode strategy:
// - Use for active defense
// - Low friction, high responsiveness
// - Safe mode becomes critical backup
```

### Solo Owner Vault (1-of-1 Guardian)
```solidity
// Setup
vault.addGuardian(ownerAddress);
vault.setQuorum(1);  // Owner is only guardian

// Safe mode strategy:
// - Safe mode less critical (owner has direct control)
// - Useful for contract-controlled withdrawal restrictions
// - Maintains multi-sig pattern for compatibility
```

---

## Gas Cost Reference

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| Enable Safe Mode | ~35,000 | State update + history |
| Disable Safe Mode | ~35,000 | State update + history |
| Check Status | ~5,000 | Read-only (view) |
| Safe Mode Withdraw | +5,000 | Added to normal withdrawal |
| Get Duration | ~8,000 | Calculation (view) |
| Get Config | ~10,000 | Single read (view) |
| Get Full History | ~20,000+ | +1,000 per toggle |
| Add Guardian | ~25,000 | State + array |
| Remove Guardian | ~30,000 | Array manipulation |

### Gas Optimization Tips
1. **Batch Operations**: Call multiple functions in one transaction
2. **Cache References**: Store controller address in contract
3. **Use Events**: Filter events instead of querying full history
4. **Lazy Load**: Only fetch history when needed

---

## Troubleshooting Quick Guide

### "Safe mode not enabled"
**Problem**: Tried to call `safeModeWithdraw()` when safe mode is off

**Fix**:
```solidity
// Check first
if (controller.isSafeModeEnabled(vault)) {
    vault.safeModeWithdraw(token, amount);
} else {
    // Use normal withdrawal
}
```

### "Safe mode enabled - use safeModeWithdraw"
**Problem**: Called normal `withdraw()` while in safe mode

**Fix**:
```solidity
// If you're the owner
vault.safeModeWithdraw(token, amount);

// If not owner, wait for safe mode to disable
```

### "Only owner"
**Problem**: Non-owner tried to enable/disable safe mode

**Fix**:
```solidity
// Only vault owner can toggle
require(msg.sender == vault.owner(), "Must be owner");
controller.enableSafeMode(vault, reason);
```

### "Insufficient balance"
**Problem**: Tried to withdraw more than available

**Fix**:
```solidity
// Check balance first
uint256 balance = vault.getETHBalance();
require(amount <= balance, "Insufficient balance");
vault.safeModeWithdraw(address(0), amount);
```

---

## FAQ

**Q: Can a guardian disable safe mode?**
A: No. Only the vault owner can enable or disable safe mode.

**Q: How long can safe mode stay enabled?**
A: Unlimited. Safe mode remains until owner disables it.

**Q: What happens to pending guardian additions during safe mode?**
A: Pending guardians still cannot vote (they remain pending).

**Q: Can safe mode be enabled during a withdrawal?**
A: Yes. Existing transactions will either complete or revert.

**Q: Is there a time delay to enable safe mode?**
A: No. Safe mode enables immediately (within one block).

**Q: Can I enable safe mode, then disable it, then enable again?**
A: Yes. You can toggle multiple times. All events are logged.

**Q: What if owner key is compromised?**
A: Owner can still enable/disable safe mode, but a multi-sig owner model could be added.

**Q: Does safe mode affect token balance calculations?**
A: No. Balances unchanged. Only withdrawal authorization changes.

**Q: Can safe mode be bypassed?**
A: No. It's enforced in the withdraw() function at the contract level.

**Q: How do I verify safe mode status on-chain?**
A: Call `controller.isSafeModeEnabled(vault)`.

---

## Integration Checklist

- [ ] Deploy SafeModeController
- [ ] Deploy vault with SafeModeController reference
- [ ] Register vault with controller
- [ ] Add guardians to vault
- [ ] Test enable safe mode
- [ ] Test owner withdrawal
- [ ] Test guardian withdrawal blocked
- [ ] Test disable safe mode
- [ ] Monitor SafeModeEnabled events
- [ ] Create emergency procedures documentation
- [ ] Train team on safe mode usage
- [ ] Test incident response flow
- [ ] Document guardian rotation process
- [ ] Set up event monitoring

---

## Related Features

- **Feature #1-14**: Base Vault Functionality (compatible)
- **Feature #16**: Delayed Guardians (complementary security)
- **Feature #17**: Guardian Roles (if exists, compatible)

Safe Mode works alongside all existing features and adds an additional security layer at the withdrawal authorization level.

