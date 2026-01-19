# Feature #10: Vault Pausing - Implementation Guide

## Overview

Feature #10 introduces a **temporary pause mechanism** for SpendGuard vaults, allowing vault owners to halt withdrawals during security incidents or maintenance while continuing to accept deposits.

### Key Capabilities
- 🔒 **Pause withdrawals** while keeping deposits active
- 📝 **Reason tracking** for audit trails and incident documentation
- ⏱️ **Elapsed time tracking** for pause duration monitoring
- 📊 **Complete history** of all pause/unpause events
- 🛡️ **Emergency response** mechanism for security incidents

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│         VaultPausingController (Shared)         │
│                                                  │
│  • Pause/unpause state management               │
│  • Reason tracking                              │
│  • History audit trail                          │
│  • Elapsed time calculation                     │
└─────────────────────────────────────────────────┘
         △           △           △
         │           │           │
    ┌────┴──┐   ┌────┴──┐   ┌────┴──┐
    │Vault1 │   │Vault2 │   │Vault3 │
    │       │   │       │   │       │
    │Paused │   │Active │   │Paused │
    │ 2hrs  │   │       │   │ 30min │
    └───────┘   └───────┘   └───────┘

SpendVaultWithPausing Integration:
  • Checks pause state before withdraw
  • Allows deposits regardless of pause state
  • Blocks emergency unlock when paused
  • Emits pause-related events
```

### Component Responsibilities

#### VaultPausingController (Shared Service)
```solidity
contract VaultPausingController {
    // Manages pause state for all vaults
    mapping(address vault => bool) isPausedVault;
    mapping(address vault => string) pauseReason;
    mapping(address vault => uint256) pauseTime;
    mapping(address vault => PauseEvent[]) pauseHistory;
    
    function pauseVault(address vault, string reason) external;
    function unpauseVault(address vault, string reason) external;
    function updatePauseReason(address vault, string reason) external;
    function getPauseElapsedTime(address vault) returns uint256;
}
```

#### SpendVaultWithPausing (Per-User Instance)
```solidity
contract SpendVaultWithPausing {
    IVaultPausingController pausingController;
    
    function withdraw(...) external {
        require(!isVaultPaused(), "Vault is paused");
        // ... normal withdrawal logic
    }
    
    function deposit(token, amount) external {
        // Deposits work regardless of pause state
        IERC20(token).transferFrom(...);
    }
}
```

#### VaultFactoryWithPausing (Deployment)
```solidity
contract VaultFactoryWithPausing {
    VaultPausingController shared_controller;
    
    function createVault(quorum) returns vault_address {
        vault = new SpendVaultWithPausing(guardianSBT, quorum, shared_controller);
        shared_controller.registerVault(vault);
    }
}
```

---

## State Management

### Vault Pause States

```
┌─────────────────────────────────────┐
│      Vault Pause State Machine       │
│                                      │
│    ┌──────────────┐                  │
│    │    ACTIVE    │                  │
│    │  (Not Paused)│                  │
│    └──────┬───────┘                  │
│           │ pauseVault()             │
│           ▼                          │
│    ┌──────────────┐   updateReason   │
│    │    PAUSED    │ ◄───────────────┤
│    │   (Locked)   │                  │
│    └──────┬───────┘                  │
│           │ unpauseVault()           │
│           ▼                          │
│    ┌──────────────┐                  │
│    │    ACTIVE    │                  │
│    │  (Resumed)   │                  │
│    └──────────────┘                  │
└─────────────────────────────────────┘

Pause Operations:
├─ pauseVault(reason)       → ACTIVE → PAUSED
├─ updatePauseReason(new)   → PAUSED (in-place update)
└─ unpauseVault(reason)     → PAUSED → ACTIVE
```

### State Transitions with Examples

#### Scenario 1: Security Incident Response
```
Time 0:00   → Vault ACTIVE
            → Suspicious transaction detected
            → pauseVault("Suspicious activity on account")
            
Time 0:05   → Vault PAUSED (elapsed: 5 minutes)
            → Investigation ongoing
            → updatePauseReason("Investigating unauthorized access")
            
Time 1:30   → Vault PAUSED (elapsed: 1 hour 30 min)
            → Issue resolved
            → unpauseVault("Security issue resolved")
            
Time 1:35   → Vault ACTIVE
            → pauseTime reset to 0
```

#### Scenario 2: Maintenance Window
```
Time 12:00  → Vault ACTIVE (normal operation)
            → pauseVault("System maintenance 12:00-12:30 UTC")
            
Time 12:15  → Vault PAUSED (elapsed: 15 minutes)
            → Users can still deposit
            → Withdrawals blocked
            
Time 12:30  → Vault PAUSED (elapsed: 30 minutes)
            → unpauseVault("Maintenance complete")
            
Time 12:31  → Vault ACTIVE
            → Full operations resumed
```

---

## API Reference

### VaultPausingController

#### Vault Management

```solidity
function registerVault(address vault) external onlyOwner
```
**Purpose**: Register a vault for pause management
**Parameters**:
- `vault`: Address of vault to register
**Events**: `VaultRegistered(vault, timestamp)`
**Use Case**: Called during vault deployment to register with controller

```solidity
function isManagedVault(address vault) external view returns (bool)
```
**Purpose**: Check if vault is registered
**Returns**: `true` if vault is managed by this controller
**Use Case**: Verify vault registration before operations

---

#### Pause Operations

```solidity
function pauseVault(address vault, string calldata reason) external onlyOwner
```
**Purpose**: Pause withdrawals on a vault
**Parameters**:
- `vault`: Address of vault to pause
- `reason`: Human-readable reason for pause
**Requirements**:
- Vault must be managed
- Vault must not already be paused
**Events**: `VaultPaused(vault, reason, timestamp)`
**State Changes**:
- Sets `isPausedVault[vault] = true`
- Sets `pauseReason[vault] = reason`
- Sets `pauseTime[vault] = block.timestamp`
- Appends to `pauseHistory[vault]`
**Use Case**: Emergency response to security threats

```solidity
function unpauseVault(address vault, string calldata reason) external onlyOwner
```
**Purpose**: Resume normal operations on a paused vault
**Parameters**:
- `vault`: Address of vault to unpause
- `reason`: Reason for unpausing (e.g., "Issue resolved")
**Requirements**:
- Vault must be managed
- Vault must be paused
**Events**: `VaultUnpaused(vault, reason, timestamp)`
**State Changes**:
- Sets `isPausedVault[vault] = false`
- Sets `pauseReason[vault] = reason`
- Sets `pauseTime[vault] = 0`
- Appends to `pauseHistory[vault]`
**Use Case**: Resume operations after incident resolution

```solidity
function updatePauseReason(address vault, string calldata newReason) external onlyOwner
```
**Purpose**: Update the pause reason while vault is paused
**Parameters**:
- `vault`: Address of paused vault
- `newReason`: New reason text
**Requirements**:
- Vault must be managed
- Vault must be paused
**Events**: `PauseReasonUpdated(vault, oldReason, newReason, timestamp)`
**State Changes**:
- Updates `pauseReason[vault] = newReason`
- Appends to `pauseHistory[vault]`
**Use Case**: Provide real-time updates during ongoing incidents

---

#### Status Queries

```solidity
function isPaused(address vault) external view returns (bool)
```
**Purpose**: Check if vault is currently paused
**Returns**: `true` if paused, `false` if active
**Gas**: ~500 gas

```solidity
function getPauseReason(address vault) external view returns (string memory)
```
**Purpose**: Get the current pause reason
**Returns**: String describing why vault is paused (empty if not paused)
**Gas**: ~2000 gas

```solidity
function getPauseTime(address vault) external view returns (uint256)
```
**Purpose**: Get Unix timestamp when pause began
**Returns**: Block timestamp of pause, 0 if not paused
**Gas**: ~500 gas

```solidity
function getPauseElapsedTime(address vault) external view returns (uint256)
```
**Purpose**: Get duration of current pause in seconds
**Calculation**: `current_time - pause_time` or 0 if not paused
**Returns**: Seconds elapsed since pause began
**Gas**: ~700 gas

```solidity
function getPauseHistory(address vault) external view returns (PauseEvent[] memory)
```
**Purpose**: Get complete audit trail of pause/unpause events
**Returns**: Array of `PauseEvent` structs with:
- `bool isPaused`: Whether this was a pause (true) or unpause (false)
- `string reason`: Reason for the event
- `uint256 timestamp`: When event occurred
- `address initiator`: Who initiated the event
**Gas**: Variable based on history length
**Use Case**: Audit trail, forensics, compliance reporting

---

### SpendVaultWithPausing

#### Pause Status (New Methods)

```solidity
function isVaultPaused() public view returns (bool)
```
**Purpose**: Check if this vault is paused
**Returns**: `true` if paused
**Calls**: `pausingController.isPaused(address(this))`

```solidity
function getVaultPauseReason() external view returns (string memory)
```
**Purpose**: Get pause reason for this vault
**Returns**: Current pause reason or empty string

```solidity
function getVaultPauseTime() external view returns (uint256)
```
**Purpose**: Get when this vault was paused
**Returns**: Unix timestamp or 0

```solidity
function getVaultPauseElapsedTime() external view returns (uint256)
```
**Purpose**: Get how long vault has been paused
**Returns**: Elapsed seconds or 0

---

#### Withdrawal (Modified)

```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    bytes[] calldata signatures
) external onlyOwner nonReentrant
```
**NEW REQUIREMENT**: Vault must not be paused
```solidity
require(!isVaultPaused(), "Vault is paused - withdrawals disabled");
```

**Behavior When Paused**:
- Reverts with "Vault is paused - withdrawals disabled"
- Does not check guardians or signatures
- No state changes occur
- Event `WithdrawalAttemptedWhilePaused` emitted

**Full Validation Flow**:
```
1. Check pause status ← NEW
   ├─ If paused → REVERT
   └─ If not paused → continue

2. Check withdrawal parameters
   ├─ Validate recipient address
   ├─ Validate amount > 0
   └─ Check signatures count >= quorum

3. Validate balance (existing check)
4. Verify guardian signatures (existing logic)
5. Execute transfer (existing logic)
```

---

#### Deposits (Unchanged - Always Work)

```solidity
function deposit(address token, uint256 amount) external
function depositETH() external payable
```
**NEW**: These work regardless of pause state
**Behavior**:
- If paused: Emits `DepositReceivedWhilePaused` event
- If not paused: Normal operation
- No pause checks performed

---

#### Emergency Unlock (New Restriction)

```solidity
function requestEmergencyUnlock() external onlyOwner returns (uint256)
```
**NEW REQUIREMENT**: Vault must not be paused
```solidity
require(!isVaultPaused(), "Vault is paused - emergency unlock disabled");
```

**Rationale**: Emergency unlock combined with pause could create edge cases

---

### VaultFactoryWithPausing

#### Vault Creation

```solidity
function createVault(uint256 quorum) external returns (address)
```
**Purpose**: Deploy new vault with pausing capability
**Returns**: Address of new SpendVaultWithPausing
**Operations**:
1. Deploy SpendVaultWithPausing with shared controller
2. Transfer ownership to caller
3. Register vault with controller
4. Track in userVaults mapping
5. Increment vaultCounter

```solidity
function isManagedVault(address vault) external view returns (bool)
```
**Purpose**: Check if address is a factory-created vault

```solidity
function isVaultPaused(address vault) external view returns (bool)
```
**Purpose**: Convenience method to check vault pause status
**Requires**: Vault must be managed

```solidity
function getVaultPauseReason(address vault) external view returns (string memory)
```
**Purpose**: Get pause reason for managed vault

```solidity
function getVaultPauseElapsedTime(address vault) external view returns (uint256)
```
**Purpose**: Get pause duration for managed vault

---

## Events

### VaultPausingController Events

```solidity
event VaultRegistered(address indexed vault, uint256 timestamp);
```
Emitted when vault is registered with controller

```solidity
event VaultPaused(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
Emitted when pause is activated

```solidity
event VaultUnpaused(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
Emitted when pause is lifted

```solidity
event PauseReasonUpdated(
    address indexed vault,
    string oldReason,
    string newReason,
    uint256 timestamp
);
```
Emitted when pause reason is updated

---

### SpendVaultWithPausing Events

```solidity
event WithdrawalAttemptedWhilePaused(
    address indexed token,
    uint256 amount,
    uint256 timestamp
);
```
Emitted when withdrawal attempt fails due to pause

```solidity
event DepositReceivedWhilePaused(
    address indexed token,
    uint256 amount,
    uint256 timestamp
);
```
Emitted when deposit succeeds during pause (informational)

```solidity
event VaultPauseCheckFailed(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
Emitted on pause status check failures

```solidity
event PauseStatusQueried(
    address indexed vault,
    bool isPaused,
    uint256 timestamp
);
```
Emitted on pause status queries (for monitoring)

---

## Security Considerations

### 1. Pause Authority
- ✅ **OnlyOwner restriction**: Only vault owner can pause
- ✅ **Vault registration required**: Unregistered vaults cannot be paused
- ⚠️ **Owner compromise**: If owner compromised, attacker could pause vault
  - **Mitigation**: Use multi-sig wallet as owner

### 2. Deposit Allowance During Pause
- ✅ **By design**: Deposits still work to allow emergency fund accumulation
- ⚠️ **Token risk**: If vault owner compromised, attacker could add malicious tokens
  - **Mitigation**: Off-chain governance validates token before deposit

### 3. Reason Storage
- ✅ **Unlimited reason length**: No truncation
- ⚠️ **Storage cost**: Very long reasons (>1000 chars) increase gas costs
  - **Recommendation**: Use concise reasons, store details off-chain

### 4. History Growth
- ⚠️ **Unbounded array**: `pauseHistory` grows indefinitely
  - **Impact**: Later pause/unpause calls cost slightly more gas
  - **Mitigation**: Archive history off-chain after certain size
  - **Typical growth**: ~0.1-0.2 KB per pause/unpause cycle

### 5. Emergency Unlock Interaction
- ✅ **Blocked during pause**: Prevents edge cases
- ✅ **Clear state**: pauseTime reset to 0 on unpause
- ⚠️ **Manual unblock needed**: No auto-unpause after timeout
  - **Recommendation**: Set manual unblock deadline in reason

### 6. Signature Verification
- ✅ **Bypass when paused**: No expensive signature check during pause
- ✅ **Gas optimization**: Saves ~2000+ gas per blocked withdrawal
- ✅ **Security**: Pause check happens before signature verification

---

## Integration with Other Features

### Feature #7: Guardian Rotation
- ✅ **Compatible**: Guardian expiry checks run regardless of pause state
- ✅ **Layered security**: Both expiry AND pause state checked
- 🔄 **Flow**: `withdraw() → check pause → check expiry → verify signatures`

### Feature #8: Guardian Recovery
- ✅ **Compatible**: Recovery voting works regardless of pause state
- ✅ **Independent**: Pause doesn't affect recovery process
- 🔄 **Independent**: Recovery votes counted even if vault paused

### Feature #9: Emergency Guardian Override
- ⚠️ **Pause blocks emergency withdrawals**: Emergency unlock disabled when paused
- **Rationale**: Prevent combining pause + emergency mode
- 🔄 **Flow**: `requestEmergencyUnlock() → check pause (if paused, revert)`
- ✅ **30-day fallback still available**: Pause can be lifted after incident investigation

### Multi-Feature Pause Scenario
```
Scenario: Major security incident affecting multiple features

1. Pause activated
   → Blocks normal withdrawals (Feature #1)
   → Prevents emergency withdrawals (Feature #9)
   → Guardian recovery still votes (Feature #8)
   → Expiry checks continue (Feature #7)

2. Investigation complete
   → Pause lifted
   → All operations resume

Benefits:
- Comprehensive halt of fund movement
- Recovery process continues uninterrupted
- Flexible incident response
- Maintains guardian governance
```

---

## Gas Costs

### Operation Gas Costs

| Operation | Gas | Notes |
|-----------|-----|-------|
| `pauseVault()` | 15,000-20,000 | Storage writes, history append |
| `unpauseVault()` | 15,000-20,000 | Storage writes, history append |
| `updatePauseReason()` | 8,000-12,000 | Storage update, history append |
| `isPaused()` (view) | 500 | Simple mapping read |
| `getPauseReason()` (view) | 2,000 | String reading |
| `getPauseTime()` (view) | 500 | Simple mapping read |
| `getPauseElapsedTime()` (view) | 700 | Calculation only |
| `getPauseHistory()` (view) | 5,000-50,000 | Depends on history size |
| `withdraw()` - when paused | 1,000-2,000 | Early revert, low cost |
| `withdraw()` - when not paused | 35,000-60,000 | Normal withdrawal + pause check |
| `deposit()` - when paused | 30,000-50,000 | Transfer + pause event |

### Optimization Tips

```solidity
// Good: Cache pause status in local variable
bool paused = isVaultPaused();
if (paused) revert(...);
// ... rest of logic

// Expensive: Multiple calls to isPaused()
if (isVaultPaused()) { ... }
if (isVaultPaused()) { ... }  // Redundant call

// Good: Update reason instead of pause/unpause cycle
updatePauseReason("New status");  // ~10K gas

// Expensive: Unpause and re-pause
unpauseVault("temp");  // ~18K gas
pauseVault("same");    // ~18K gas = 36K total
```

---

## Deployment Checklist

- [ ] Deploy VaultPausingController (shared instance)
- [ ] Deploy VaultFactoryWithPausing with guardian SBT address
- [ ] Initialize first vault with factory
- [ ] Verify vault registered with controller
- [ ] Test pause/unpause cycle
- [ ] Verify withdrawal blocking
- [ ] Verify deposit allowance during pause
- [ ] Verify event emissions
- [ ] Check gas costs in testnet
- [ ] Update contracts/README.md

---

## Testing Coverage

### VaultPausingController.test.sol (12 tests)
- Registration (2 tests)
- Pause operations (6 tests)
- Unpause operations (2 tests)
- Reason updates (2 tests)

### SpendVaultWithPausing.test.sol (13 tests)
- Deposits (4 tests)
- Withdrawals (2 tests)
- Pause status checks (4 tests)
- Configuration (2 tests)
- Emergency unlock (1 test)

---

## Common Use Cases

### Emergency Response to Security Incident
```solidity
// 1. Incident detected
vault_owner.pauseVault(vault, "Suspicious transaction detected");

// 2. Investigation
vault_owner.updatePauseReason(vault, "Under investigation - account compromised");

// 3. Resolution
vault_owner.unpauseVault(vault, "Issue resolved - all transactions validated");
```

### Planned Maintenance Window
```solidity
// 1. Announce maintenance
vault_owner.pauseVault(vault, "Scheduled maintenance 2024-01-15 10:00 UTC");

// 2. Perform maintenance (deposits still accepted)
// ... upgrade contracts, audit, etc ...

// 3. Resume operations
vault_owner.unpauseVault(vault, "Maintenance complete");
```

### Multi-Step Recovery
```solidity
// 1. Pause for investigation
vault_owner.pauseVault(vault, "Initial security hold");

// 2. Update status as investigation progresses
vault_owner.updatePauseReason(vault, "30% through investigation");
vault_owner.updatePauseReason(vault, "60% through investigation");
vault_owner.updatePauseReason(vault, "Investigation complete - reviewing recovery plan");

// 3. Guardian recovery votes continue...
// (Feature #8 still active)

// 4. When ready, unpause
vault_owner.unpauseVault(vault, "Ready to resume operations");
```

---

## Monitoring & Analytics

### Key Metrics
- Total paused vaults vs. active
- Average pause duration
- Most common pause reasons
- Pause frequency per vault
- Deposits during pause periods
- Failed withdrawal attempts during pause

### Event Tracking
```javascript
// Monitor pause events
controller.on('VaultPaused', (vault, reason, timestamp) => {
  console.log(`Vault ${vault} paused: ${reason}`);
});

// Track pause duration
controller.on('VaultUnpaused', (vault, reason, timestamp) => {
  console.log(`Vault ${vault} unpaused after...`);
});

// Monitor attempted withdrawals during pause
vault.on('WithdrawalAttemptedWhilePaused', (token, amount, time) => {
  console.log(`Blocked ${amount} withdrawal attempt`);
});
```

---

## Future Enhancements

1. **Auto-unpause after timeout** (e.g., 7 days)
   - Security improvement: Prevent accidental permanent pause
   - Implementation: Add unpause deadline tracking

2. **Pause categories** (e.g., "security", "maintenance", "investigation")
   - Better filtering and monitoring
   - Implementation: Enum-based categorization

3. **Multi-sig pause authority**
   - Current: Only owner can pause
   - Enhancement: Require N-of-M guardians to pause

4. **Pause events to guardians**
   - Current: Only stored in chain
   - Enhancement: Emit off-chain notifications

5. **Pause whitelist for deposits**
   - Current: All deposits allowed
   - Enhancement: Block specific token deposits during pause

---

## Troubleshooting

### Issue: Vault remains paused and cannot be unpaused
**Possible Causes**:
1. Caller is not vault owner
2. Vault not registered with controller
3. Contract permissions issue

**Solution**:
```solidity
// Verify vault is managed
require(controller.isManagedVault(vault));

// Verify pause state
require(controller.isPaused(vault));

// Unpaused with correct owner
owner.unpauseVault(vault, "Override unpause");
```

### Issue: Withdrawals still blocked after unpause
**Possible Causes**:
1. Pause state not properly cleared
2. Stale cache in dependent systems
3. Wrong controller instance

**Solution**:
```solidity
// Verify pause is cleared
require(!vault.isVaultPaused());

// Check controller instance matches
require(vault.pausingController == controller);

// Attempt withdrawal
vault.withdraw(...);
```

### Issue: High gas costs for getPauseHistory()
**Possible Causes**:
1. Very long pause history (1000+ entries)
2. Very long reason strings (>1000 chars each)

**Solution**:
```solidity
// Paginate history
uint256 historyLength = pauseHistory.length;
if (historyLength > 100) {
  // Return only last 100
  PauseEvent[] memory recent = new PauseEvent[](100);
  // ... copy last 100
}

// Keep reason strings concise
"Incident response" (18 bytes)  ✓
"This is a very long reason..." (200+ bytes) ✗
```

---

## References

- [SpendGuard Guardian Features](./GUARDIAN_FEATURES_SUMMARY.md)
- [Feature #7: Guardian Rotation](./FEATURE_7_GUARDIAN_ROTATION.md)
- [Feature #8: Guardian Recovery](./FEATURE_8_GUARDIAN_RECOVERY.md)
- [Feature #9: Emergency Override](./FEATURE_9_EMERGENCY_GUARDIAN_OVERRIDE.md)
