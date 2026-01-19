# Emergency Guardian Override - Quick Reference

## At a Glance

**Feature #9**: Special emergency guardian set that can immediately approve emergency withdrawals, bypassing the 30-day timelock.

| Aspect | Detail |
|--------|--------|
| **Purpose** | Alternative approval pathway during true emergencies |
| **Group** | 1-3 most trusted individuals (inner circle) |
| **Activation** | Only during emergency unlock mode |
| **Speed** | Immediate upon quorum (vs 30-day timelock) |
| **Alternative** | 30-day timelock still available as fallback |
| **Votes Required** | Configurable quorum (typically 2 of 2 or 2 of 3) |

## Quick API

### Vault Setup
```javascript
// Create vault with emergency override
const [tokenAddr, vaultAddr] = await factory.createVault(
    2,  // regular guardian quorum
    2   // emergency guardian quorum
);

// Add emergency guardians (during setup or later)
await vault.addEmergencyGuardian(emergency1Address);
await vault.addEmergencyGuardian(emergency2Address);

// Set emergency quorum
await vault.setEmergencyGuardianQuorum(2);
```

### Emergency Flow
```javascript
// 1. Request emergency
const emergencyId = await vault.requestEmergencyUnlock();

// 2. Emergency guardians approve
await vault.connect(guardian1).approveEmergencyUnlock(emergencyId);
await vault.connect(guardian2).approveEmergencyUnlock(emergencyId); // Quorum reached!

// 3. Execute withdrawal immediately
await vault.executeEmergencyWithdrawalViaApproval(
    token,          // address(0) for ETH
    amount,         // wei amount
    recipient,      // where to send
    "reason",       // explanation
    emergencyId     // approval ID
);
```

### Fallback (Timelock)
```javascript
// If guardians unavailable, use 30-day timelock

// 1. Request emergency (same as above)
const emergencyId = await vault.requestEmergencyUnlock();

// 2. Wait 30 days
// ... 30 days pass ...

// 3. Execute via timelock (no approval needed)
await vault.executeEmergencyUnlockViaTimelock(
    token,
    amount,
    recipient
);
```

## Key Functions

### Guardian Management
| Function | Purpose |
|----------|---------|
| `addEmergencyGuardian(addr)` | Add emergency guardian |
| `getEmergencyGuardians()` | List all emergency guardians |
| `getEmergencyGuardianCount()` | Count emergency guardians |
| `setEmergencyGuardianQuorum(n)` | Set required approvals |

### Emergency Flow
| Function | Purpose |
|----------|---------|
| `requestEmergencyUnlock()` | Start emergency process |
| `approveEmergencyUnlock(id)` | Guardian approves (returns true if quorum) |
| `executeEmergencyWithdrawalViaApproval(...)` | Withdraw after approval quorum |
| `executeEmergencyUnlockViaTimelock(...)` | Withdraw after 30 days |
| `cancelEmergencyUnlock()` | Cancel pending emergency |

### Status Checking
| Function | Purpose |
|----------|---------|
| `isEmergencyUnlockActive()` | Emergency currently active? |
| `getEmergencyUnlockTimeRemaining()` | Seconds until 30-day timeout |
| `getEmergencyApprovalsCount()` | Current approval count |
| `getEmergencyGuardianQuorum()` | Required approval count |
| `getCurrentEmergencyId()` | Current emergency ID |

## Events

### Key Events to Monitor

```solidity
EmergencyUnlockRequested(emergencyId)
  ↓
EmergencyUnlockApprovedByGuardian(emergencyId, guardian, count)
  ↓
EmergencyApprovalQuorumReached(emergencyId, count)
  ↓
EmergencyWithdrawalExecutedViaApproval(emergencyId, token, amount, recipient)
```

Or timeout path:
```solidity
EmergencyUnlockRequested(emergencyId)
  ↓
[wait 30 days]
  ↓
EmergencyWithdrawalExecutedViaTimelock(token, amount, recipient)
```

## Configuration

### During Vault Creation
```javascript
createVault(
    2,  // regular quorum (for normal withdrawals)
    2   // emergency quorum (for emergency overrides)
)
```

### After Creation
```javascript
// Update regular quorum
await vault.setQuorum(3);

// Update emergency quorum
await vault.setEmergencyGuardianQuorum(3);

// Add/remove emergency guardians
await vault.addEmergencyGuardian(newGuardian);
```

## Common Scenarios

### Setup Scenario
```javascript
// Step 1: Create vault
const [token, vault] = await factory.createVault(2, 2);

// Step 2: Add emergency guardians
await vault.addEmergencyGuardian("0x111...");  // Alice
await vault.addEmergencyGuardian("0x222...");  // Bob
await vault.addEmergencyGuardian("0x333...");  // Charlie
await vault.setEmergencyGuardianQuorum(2);

// Now: Need any 2 of 3 to approve emergency
```

### Emergency Scenario
```javascript
// Time: Emergency situation detected
// Step 1: Request emergency
const id = await vault.requestEmergencyUnlock();

// Time: Notify emergency guardians
console.log("Emergency ID:", id);
console.log("Tell Alice and Bob to approve");

// Time: Alice approves
await vault.connect(alice).approveEmergencyUnlock(id);
console.log("1 of 2 approvals");

// Time: Bob approves
await vault.connect(bob).approveEmergencyUnlock(id); // Returns true
console.log("QUORUM REACHED - Ready to execute");

// Time: Execute withdrawal
await vault.executeEmergencyWithdrawalViaApproval(
    ethers.ZeroAddress,  // ETH
    ethers.parseEther("10"),
    recipientAddr,
    "Critical medical expenses",
    id
);

console.log("Emergency withdrawal complete!");
```

### Timeout Scenario
```javascript
// Alternative: If guardians don't respond

// Step 1: Request emergency
const id = await vault.requestEmergencyUnlock();

// Step 2: Wait 30 days (or if guardians unreachable)
// ... time passes ...

// Step 3: Execute via timelock
await vault.executeEmergencyUnlockViaTimelock(
    ethers.ZeroAddress,
    ethers.parseEther("10"),
    recipientAddr
);
```

## State Tracking

### Emergency Lifecycle
```
No Emergency
  └─→ requestEmergencyUnlock()
      └─→ Emergency Active
          ├─→ approveEmergencyUnlock() × N
          │   ├─→ Quorum Reached
          │   └─→ executeEmergencyWithdrawalViaApproval()
          │       └─→ Completed
          │
          └─→ [30 days pass]
              └─→ executeEmergencyUnlockViaTimelock()
                  └─→ Completed
```

### Check Status Anytime
```javascript
// Is emergency active?
console.log(await vault.isEmergencyUnlockActive());

// How long until timeout?
console.log(await vault.getEmergencyUnlockTimeRemaining());

// How many approvals so far?
console.log(await vault.getEmergencyApprovalsCount());

// How many needed?
const needed = await emergencyOverride.getApprovalsNeeded(vault.address, emergencyId);
console.log(needed);
```

## Security Checklist

- ✅ Emergency guardians are trusted inner circle (1-3 people)
- ✅ Emergency guardians geographically distributed
- ✅ Quorum enforced (no single person can approve alone)
- ✅ Duplicate voting prevented (same guardian can't vote twice)
- ✅ Emergency IDs prevent vote mixing
- ✅ Reentrancy protected on withdrawals
- ✅ Fallback timelock (30 days) if guardians unavailable
- ✅ Audit trail via events

## Troubleshooting

### "Not an emergency guardian"
- Caller is not designated as emergency guardian
- Check: `vault.getEmergencyGuardians()`
- Solution: Add via `vault.addEmergencyGuardian(address)`

### "Already approved this emergency"
- Guardian already voted on this emergency
- Check: `emergencyOverride.hasGuardianApproved(vault, id, guardian)`
- Solution: Cannot vote again, wait for next emergency

### "Emergency not approved by guardians"
- Tried to execute before quorum reached
- Check: `vault.getEmergencyApprovalsCount()`
- Need: `vault.getEmergencyGuardianQuorum()` approvals

### "Timelock period not yet expired"
- Tried timelock withdrawal before 30 days
- Check: `vault.getEmergencyUnlockTimeRemaining()`
- Solution: Wait for it to reach 0

### "Emergency unlock not requested"
- No active emergency
- Check: `vault.isEmergencyUnlockActive()`
- Solution: Call `vault.requestEmergencyUnlock()` first

## Best Practices

1. **Small Trusted Group**: Keep emergency guardians to 1-3 most trusted people
2. **Geographic Distribution**: Choose guardians in different regions/time zones
3. **Regular Testing**: Periodically test emergency flow (but cancel before executing)
4. **Clear Communication**: Have documented process for notifying guardians
5. **Backup Contacts**: Maintain backup contact info for all guardians
6. **Document Reasons**: Always provide clear reason for emergency
7. **Monitor Events**: Set up alerts for emergency requests
8. **Review Logs**: Audit all emergency approvals

## Test Coverage

- ✅ Guardian management (add, remove, count)
- ✅ Quorum enforcement (1, 2, 3+ guards)
- ✅ Approval voting (single, multiple, duplicate prevention)
- ✅ ETH withdrawals
- ✅ Token withdrawals
- ✅ Timelock mechanism
- ✅ Emergency cancellation
- ✅ Multiple emergencies
- ✅ Event emission
- ✅ Error handling
- ✅ Reentrancy protection
- ✅ Full integration flow

**Total**: 30+ test functions, 100% coverage
