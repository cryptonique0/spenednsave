# Feature #16: Delayed Guardian Additions

## Overview

**Objective**: Add guardians with a cooldown period before activation, preventing immediate account compromise through unauthorized guardian additions.

**Problem Solved**:
- Attacker gains temporary admin access, adds malicious guardian
- Guardian immediately has voting power
- Attacker can now steal funds through voting
- No recovery mechanism

**Solution**:
- New guardians enter PENDING state when added
- Pending guardians cannot vote or participate
- After cooldown (default 7 days), guardians can be activated
- Owner can cancel pending additions if suspicious
- Complete audit trail of all guardian changes

---

## Architecture

### Core Components

#### 1. GuardianDelayController (550+ lines)
**Purpose**: Central service managing guardian activation delays

**Responsibilities**:
- Register vaults for delayed guardian management
- Initiate guardian additions with pending state
- Track pending guardians with activation times
- Activate guardians after delay expires
- Cancel suspicious pending additions
- Query guardian status (pending, active, removed)

**Deployment**: Single instance per network
**Cost**: Shared resource (gas-efficient)

#### 2. SpendVaultWithDelayedGuardians (480+ lines)
**Purpose**: Vault with delayed guardian activation

**Capabilities**:
- Add guardians through delay controller
- Activate pending guardians after delay
- Cancel suspicious pending additions
- Withdraw only with active guardians
- Remove active guardians immediately
- Maintain all vault functionality

**Deployment**: One per user vault
**Backward Compatibility**: All Features #1-15 intact

#### 3. VaultFactoryWithDelayedGuardians (450+ lines)
**Purpose**: Factory for deploying vaults with delayed guardians

**Features**:
- Deploy vaults with delay controller
- Automatic guardian delay registration
- Track deployed vaults
- Manage delay configurations
- Provide vault statistics

**Deployment**: Single contract per network
**Integration**: Works with all previous features

---

## Guardian Lifecycle

### State Machine

```
                    ┌─────────────────────┐
                    │   NOT A GUARDIAN    │
                    └──────────┬──────────┘
                               │ Add guardian
                               ▼
        ┌──────────────────────────────────────────┐
        │         PENDING (COOLDOWN ACTIVE)        │
        │   - Cannot vote                          │
        │   - Cannot approve proposals             │
        │   - Cannot participate in recovery       │
        │   - Waiting for activation time          │
        └──────────────┬──────────────────┬────────┘
                       │                  │
        (Delay passes) │                  │ (Owner cancels)
                       ▼                  ▼
        ┌──────────────────────┐   ┌──────────────────┐
        │  ACTIVE GUARDIAN     │   │  REMOVED/NONE    │
        │ - Can vote           │   │ (Cooldown ended) │
        │ - Full permissions   │   └──────────────────┘
        │ - Can be removed     │
        └──────────┬───────────┘
                   │ Remove guardian
                   ▼
        ┌──────────────────────┐
        │      REMOVED         │
        │  (No privileges)     │
        └──────────────────────┘
```

### Timeline Example

```
Day 0:  Owner: "I'll add guardian@example.com"
        → Status: PENDING
        → Activation time: Day 7 (7 days from now)
        → Cannot vote yet

Day 1:  Attacker detects new pending guardian
        → Owner can still cancel if notified

Day 7:  Delay expires
        → Anyone can call activatePendingGuardian()
        → Status changes to ACTIVE
        → Now can vote on proposals

Day X:  If malicious: Owner removes immediately
        → Status: REMOVED
        → No more voting power
        → Can be re-added later if needed
```

---

## Data Structures

### PendingGuardian Struct
```solidity
struct PendingGuardian {
    address guardian;                  // Guardian address
    address vault;                    // Vault being added to
    uint256 addedAt;                  // Addition timestamp
    uint256 activationTime;           // When becomes active
    GuardianStatus status;            // Current status (PENDING/ACTIVE/REMOVED)
    bool cancelled;                   // If cancelled by owner
    string reason;                    // Reason for addition
}
```

### GuardianStatus Enum
```solidity
enum GuardianStatus {
    NONE,       // 0 - Not a guardian
    PENDING,    // 1 - Added but not yet active
    ACTIVE,     // 2 - Active guardian
    REMOVING,   // 3 - Removal in progress
    REMOVED     // 4 - Removed
}
```

---

## Delay Periods

### Default Delay
- **Duration**: 7 days (604,800 seconds)
- **Applied**: All new guardians by default
- **Customizable**: Per vault if needed
- **Fixed**: Cannot be reduced below 24 hours (security)

### Delay Enforcement
```
Addition Phase (T0):
  initiateGuardianAddition() called
  → Pending guardian created
  → Status: PENDING
  → Activation time: T0 + 7 days

Cooldown Phase (T0 to T0+7d):
  - Pending guardian cannot vote
  - Owner can cancel addition
  - Attackers cannot use this guardian

Activation Phase (T0+7d):
  - Delay expired
  - activatePendingGuardian() called
  - Status: ACTIVE
  - Can now vote
```

---

## Security Features

### 1. Pending Guardian Voting Restrictions
- **Pending Cannot Vote**: Check in withdrawal verification
- **Only Active Guardians**: Multi-sig requires all active
- **Rejection**: Signatures from pending guardians fail

### 2. Cancellation Mechanism
- **Owner Control**: Can cancel any pending addition
- **Before Activation**: Can only cancel PENDING status
- **Reason Tracking**: Logs why addition cancelled
- **Recovery**: Cancelled guardian can be re-added later

### 3. Time Delays
- **Fixed 7 Days**: Adequate for threat detection
- **No Shortcuts**: Cannot expedite activation
- **No Exceptions**: Applies to all new guardians
- **Configurable Per Vault**: Can increase if needed

### 4. Audit Trail
- **All Additions Logged**: Events track every addition
- **Activation Recorded**: Events log activation
- **Cancellations Tracked**: Reason stored
- **Immutable History**: Complete on-chain record

### 5. Vault Isolation
- **Per-Vault Delays**: Different vaults can have different delays
- **Independent Activation**: Each pending activation separate
- **No Cross-Vault**: Cannot activate for wrong vault
- **Vault-Specific Config**: Each vault controls its delay

---

## Use Cases

### Use Case 1: Normal Guardian Addition
**Scenario**:
- Vault needs more guardians (expanding from 2 to 4)
- Owner wants to add trusted team members
- Standard security process

**Process**:
1. Day 0: Owner adds 2 new guardians → Status: PENDING
2. Day 0-7: New guardians informed, can prepare keys
3. Day 7: Owner activates → Status: ACTIVE
4. Day 7+: New guardians can vote

**Result**: Safe onboarding, 7-day review period

---

### Use Case 2: Detecting Malicious Addition
**Scenario**:
- Owner's admin account temporarily compromised
- Attacker adds guardian during 12-hour compromise
- But delay prevents immediate damage

**Detection Flow**:
1. Hour 1: Attacker adds malicious guardian → PENDING
2. Hour 2: Monitoring alerts owner of new pending guardian
3. Hour 6: Owner reviews and finds suspicious guardian
4. Hour 7: Owner cancels addition → Status: REMOVED
5. Result: Attacker blocked before gaining voting power

**Timeline**: 7-day delay prevented catastrophic fund loss

---

### Use Case 3: Guardian Removal Process
**Scenario**:
- Active guardian compromised or becomes unavailable
- Vault needs to remove immediately

**Process**:
1. Owner detects compromise or unavailability
2. Calls removeGuardian() immediately
3. Status changes to REMOVED
4. Can no longer vote
5. Can be re-added later if needed

**Result**: Immediate removal, can re-add when safe

---

### Use Case 4: Rotating Guardians
**Scenario**:
- Planned guardian rotation (quarterly refresh)
- Current guardian's term ending
- New guardian ready to take over

**Process**:
1. Day 0: Add new guardian → PENDING (for 7 days)
2. Day 5: New guardian prepares setup, tests signatures
3. Day 7: Activate new guardian → ACTIVE
4. Day 7+: Remove old guardian if no longer needed
5. Day 7+: New guardian votes on future proposals

**Result**: Smooth transition with delay for verification

---

## Integration with Previous Features

### With GuardianSBT (Feature #1)
- Pending guardians still need SBT
- SBT minting can happen before activation
- Activation separate from SBT ownership

### With VaultFactory (Features #2-3)
- Factory deploys delay controller automatically
- All vaults auto-registered for delays
- Initial setup guardians bypass delay

### With Guardian Rotation (Feature #4)
- Pending guardians tracked separately from expiry
- Expiry applied after activation
- Delay + expiry = full lifecycle

### With Emergency Override (Features #7-8)
- Emergency guardians also subject to delay
- Independent delay from regular guardians
- Both systems work together

### With Pausing (Feature #9-10)
- Delayed guardian additions work while paused
- Activation can occur while paused
- Voting restricted by both pausing AND pending status

### With Proposals (Features #11-12)
- **Critical**: Pending guardians cannot vote
- Voting signature verification checks active status
- Failed if any signer is pending
- Multiple pending guardians don't weaken security

### With Recovery (Feature #14)
- Social recovery works with pending guardians
- Recovery voting requires active guardians only
- Pending guardians cannot vote on recovery

### With Reason Hashing (Feature #13)
- No direct interaction
- Both systems work independently
- Withdrawal flow unchanged

---

## Configuration & Customization

### Per-Vault Settings
```solidity
vaultGuardianDelay[vault]           // Seconds until activation
guardianStatus[vault][guardian]     // Current status
guardianActivationTime[vault][guardian] // Exact activation timestamp
```

### Global Settings
```
DEFAULT_GUARDIAN_DELAY = 7 days     // Fixed, immutable
Minimum delay = 1 day               // Enforced minimum
Maximum customization = per vault   // Each vault can override
```

### Changing Delay
```solidity
// Update default for new vaults
factory.updateDefaultDelay(10 days)

// Update for existing vault (owner only)
factory.updateVaultDelay(vaultAddress, 10 days)
```

---

## Events & Audit Trail

### Guardian Lifecycle Events
```solidity
GuardianAdditionInitiated(pendingId, vault, guardian, activationTime, reason, timestamp)
GuardianBecameActive(pendingId, vault, guardian, timestamp)
GuardianAdditionCancelled(pendingId, vault, guardian, reason, timestamp)
GuardianRemoved(vault, guardian, timestamp)
```

### Configuration Events
```solidity
VaultRegisteredForDelayedGuardians(vault, delayDuration, timestamp)
GuardianDelayUpdated(vault, newDelay, timestamp)
```

---

## Gas Optimization

### Initiation
- **Cost**: ~50K gas
- **Storage**: 1-2 storage slots
- **Repeatable**: O(1) per addition

### Activation
- **Cost**: ~40K gas
- **Storage**: 1 storage write
- **Post-delay**: Can batch multiple activations

### Removal
- **Cost**: ~30K gas
- **Storage**: 1-2 storage writes
- **Immediate**: No delay for removal

### Total Cost
```
Add + 7 days wait + Activate: ~90K total
Remove (immediate): ~30K
```

---

## Error Handling

### Common Errors

| Error | Cause | Prevention |
|-------|-------|-----------|
| `Vault not registered` | Vault not in system | Deploy via factory |
| `Guardian already active` | Adding active guardian | Check status first |
| `Guardian addition already pending` | Duplicate addition | Check status first |
| `Delay period not expired` | Activation too early | Wait for timeout |
| `Not pending` | Wrong status | Check status |
| `Already cancelled` | Double-cancellation | Track cancellations |
| `Invalid guardian` | Zero address | Validate addresses |
| `Guardian not active` | Can't use pending guardian | Use active only |

---

## Testing Scenarios

### Scenario 1: Successful Addition and Activation
```
Setup: 2 guardians, 7-day delay
1. Owner adds new guardian
2. Verify status = PENDING
3. Wait 7 days (or fast-forward in tests)
4. Call activatePendingGuardian()
5. Verify status = ACTIVE
Result: Guardian now can vote
```

### Scenario 2: Cancelled Addition
```
Setup: Guardian pending
1. Guardian pending
2. Day 3: Detect suspicious guardian
3. Owner cancels
4. Verify status = REMOVED
5. Try to activate later → Fails (cancelled)
Result: Threat neutralized
```

### Scenario 3: Voting Restriction
```
Setup: 1 pending, 2 active guardians
1. Create withdrawal proposal
2. Active guardian 1 votes → approvalsCount = 1
3. Active guardian 2 votes → approvalsCount = 2 (quorum)
4. Pending guardian tries to vote → FAILS (not active)
5. Execute withdrawal
Result: Pending guardian cannot affect voting
```

### Scenario 4: Activation Before Delay
```
Setup: 3-day delay, guardian added
1. Day 0: Guardian added
2. Day 1: Try to activate → FAILS (not yet)
3. Day 3 (exactly): Try to activate → FAILS (must be >= delay)
4. Day 3+1: Try to activate → SUCCESS
Result: Strict delay enforcement
```

---

## Deployment Checklist

- [ ] Deploy GuardianDelayController
- [ ] Deploy VaultFactoryWithDelayedGuardians
- [ ] Deploy GuardianSBT if not existing
- [ ] Set default delay (7 days recommended)
- [ ] Deploy first vault via factory
- [ ] Verify vault registered in delay controller
- [ ] Test guardian addition flow
- [ ] Test pending status prevents voting
- [ ] Test activation after delay
- [ ] Test cancellation of pending
- [ ] Test removal of active
- [ ] Deploy to mainnet

---

## Compliance & Standards

### Security Standards
- **EIP-712**: Used for withdrawal signatures
- **ERC-721**: Guardian SBT standard
- **Solidity**: ^0.8.20 (latest security)
- **OpenZeppelin**: Audited libraries

### Access Control Pattern
- **Role-based**: Owner, Active Guardian, Pending Guardian
- **Time-based**: Delay enforcement
- **Status-based**: PENDING vs ACTIVE
- **Event-based**: Complete audit trail

---

## Monitoring & Statistics

### Track Guardian Status
```
Total guardians (active + pending + removed)
Active guardian count
Pending guardian count
Pending duration (before activation)
```

### Query Functions
```solidity
getGuardianStatus(vault, guardian)      // Get current status
getTimeUntilActive(vault, guardian)     // Countdown to activation
isGuardianActive(vault, guardian)       // Can vote?
getPendingGuardians(vault)              // All pending
getActiveGuardians(vault)               // All active
```

---

## Key Takeaways

✅ **Delayed Activation** provides time to detect malicious additions
✅ **Pending Status** prevents voting before activation
✅ **Cancellation** allows removal of suspicious guardians
✅ **Fixed Delay** (7 days) adequate for threat detection
✅ **Complete Audit Trail** logs all guardian changes
✅ **Backward Compatible** with Features #1-15
✅ **Gas Efficient** shared controller architecture
✅ **Immediate Removal** for active guardian revocation
✅ **Configurable Per Vault** adjust delay as needed
✅ **Production-Ready** with comprehensive error handling

---

## Contracts Included

1. **GuardianDelayController.sol** (550+ lines)
   - Core delay management
   - Guardian status tracking
   - Activation timing

2. **SpendVaultWithDelayedGuardians.sol** (480+ lines)
   - Vault integration
   - Guardian management
   - Withdrawal voting

3. **VaultFactoryWithDelayedGuardians.sol** (450+ lines)
   - Vault deployment
   - Factory pattern
   - Configuration management

---

**Feature #16 Complete**: Guardians now activate with a cooldown period, preventing immediate account compromise through unauthorized additions.
