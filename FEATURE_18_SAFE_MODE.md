# Feature #18: Safe Mode Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Safe Mode States](#safe-mode-states)
4. [Integration](#integration)
5. [Security Benefits](#security-benefits)
6. [Use Cases](#use-cases)
7. [Configuration](#configuration)
8. [API Reference](#api-reference)
9. [Events and Audit Trail](#events-and-audit-trail)
10. [Gas Optimization](#gas-optimization)
11. [Error Handling](#error-handling)
12. [Testing Scenarios](#testing-scenarios)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## Overview

**Safe Mode** is a security feature that enables emergency lockdown of vault withdrawals, restricting all non-owner transfers to the owner address only. When safe mode is activated, guardians cannot authorize withdrawals even with valid signatures - only the owner can withdraw funds.

### Key Characteristics
- **Owner-Only Withdrawals**: When enabled, only the owner can withdraw funds
- **Emergency Activation**: Can be activated immediately without delay
- **Complete Audit Trail**: Every enable/disable event is logged with reason and timestamp
- **Per-Vault Control**: Each vault can have safe mode independently managed
- **Backward Compatible**: All existing vault functionality preserved when safe mode disabled
- **Centralized Management**: Single SafeModeController manages state across all vaults

### Threat Model
Safe mode protects against:
1. **Malicious Guardian Takeover**: Prevents compromised guardians from authorizing theft
2. **Smart Contract Vulnerabilities**: Allows emergency fund lockdown if exploit detected
3. **Private Key Compromise**: Owner can secure funds even if guardian keys leaked
4. **Unauthorized Withdrawals**: Blocks all non-owner transfers regardless of signatures
5. **System Maintenance**: Safely pause withdrawals during upgrades or incident response

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────┐
│         SafeModeController (Singleton)          │
│  - Manages safe mode state for all vaults       │
│  - Tracks enable/disable history                │
│  - Provides query interface                     │
│  - Emits events for all state changes           │
└──────────────────────┬──────────────────────────┘
                       │ references
                       ▼
        ┌──────────────────────────┐
        │  SpendVaultWithSafeMode  │
        │  - Checks safe mode flag │
        │  - Routes withdrawals    │
        │  - Normal vault logic    │
        └──────────────────────────┘
                       ▲
                       │ deploys
                       │
   ┌───────────────────────────────────┐
   │ VaultFactoryWithSafeMode          │
   │ - Creates SafeModeController      │
   │ - Deploys vault instances         │
   │ - Manages vault registry          │
   └───────────────────────────────────┘
```

### Workflow Diagram

```
Owner initiates emergency
         │
         ▼
[SafeModeController.enableSafeMode()]
         │
         ├─ Update safeModeConfigs[vault].enabled = true
         ├─ Record enabledAt timestamp
         ├─ Increment totalToggles
         ├─ Add history entry
         └─ Emit VaultRegisteredForSafeMode event
         │
         ▼
[User calls withdraw()]
         │
         ├─ Check: isSafeModeEnabled()?
         │
         ├─ YES: Only allow owner withdrawals
         │       ├─ If recipient != owner → Revert
         │       └─ If recipient == owner → Execute
         │
         └─ NO: Normal multi-sig flow
               ├─ Verify guardian signatures
               ├─ Check quorum met
               └─ Execute withdrawal
         │
         ▼
Safe mode remains until disabled
Owner calls: [SafeModeController.disableSafeMode()]
         │
         └─ Same workflow reversed
```

### State Machine

```
┌──────────────┐
│   DISABLED   │ ◄─────────┐
│ (Normal Ops) │           │
└──────┬───────┘           │
       │                   │
       │ enableSafeMode()  │ disableSafeMode()
       │                   │
       ▼                   │
┌──────────────┐           │
│   ENABLED    ├───────────┘
│ (Emergency)  │
│ Only Owner   │
│ Withdrawals  │
└──────────────┘
```

### State Variables

#### SafeModeController
```solidity
mapping(address => SafeModeConfig) public safeModeConfigs;
mapping(address => SafeModeHistory[]) public safeModeHistory;
address[] public managedVaults;
mapping(address => bool) public isRegistered;
```

#### SpendVaultWithSafeMode
```solidity
SafeModeController public safeModeController;
address public owner;
uint256 public quorum;
address[] public guardians;
mapping(address => bool) public isGuardian;
uint256 public ethBalance;
mapping(address => uint256) public tokenBalances;
```

---

## Safe Mode States

### State 1: DISABLED (Normal Operations)

**Characteristics**:
- Multi-signature withdrawals active
- Guardian signatures required
- Quorum enforcement enabled
- Normal vault operations

**Withdrawal Flow**:
```
User initiates withdrawal
    │
    ├─ Provides guardian signatures
    ├─ Specifies recipient (any address)
    ├─ Includes reason/metadata
    │
    ▼ Vault calls: safeModeController.isSafeModeEnabled()
    │
    └─ Returns FALSE
         │
         ▼ Normal flow
         ├─ Verify signatures
         ├─ Check quorum
         ├─ Update balances
         └─ Complete withdrawal
```

**When to Use**:
- Normal daily operations
- Routine treasury management
- Scheduled fund transfers
- Planned multi-sig withdrawals

### State 2: ENABLED (Emergency Lockdown)

**Characteristics**:
- Only owner can withdraw
- Guardian signatures ignored
- Non-owner withdrawals blocked
- Emergency mode active

**Withdrawal Flow**:
```
User initiates withdrawal
    │
    ├─ (Owner) Calls: safeModeWithdraw()
    │           │
    │           ├─ Check: isSafeModeEnabled() = TRUE
    │           ├─ Check: recipient == owner
    │           ├─ Update balances
    │           └─ Transfer funds
    │
    └─ (Non-owner) Calls: withdraw()
                 │
                 ├─ Check: isSafeModeEnabled() = TRUE
                 ├─ Revert: "Safe mode enabled"
                 └─ Transaction fails
```

**When to Use**:
- Security incident detected
- Suspected compromise
- Maintenance window
- Key rotation procedure
- Emergency incident response
- Suspicious activity on vault

### State Transitions

#### Transition: DISABLED → ENABLED

```
Trigger: SafeModeController.enableSafeMode(vault, reason)
         │
         ├─ Caller: Owner only (via vault)
         ├─ Parameters:
         │  ├─ vault: Address of vault
         │  └─ reason: Incident description
         │
         ▼ SafeModeController updates:
         ├─ config.enabled = true
         ├─ config.enabledAt = block.timestamp
         ├─ config.reason = reason
         ├─ config.totalToggles++
         ├─ Add history entry
         └─ Emit events
         │
         ▼ Effects:
         ├─ Withdrawals now owner-only
         ├─ Guardian signatures ignored
         ├─ Audit trail recorded
         └─ Owner can use safeModeWithdraw()

Time: Immediate (no delay)
Reversibility: Yes (call disableSafeMode)
```

#### Transition: ENABLED → DISABLED

```
Trigger: SafeModeController.disableSafeMode(vault, reason)
         │
         ├─ Caller: Owner only (via vault)
         ├─ Parameters:
         │  ├─ vault: Address of vault
         │  └─ reason: Resolution description
         │
         ▼ SafeModeController updates:
         ├─ config.enabled = false
         ├─ config.disabledAt = block.timestamp
         ├─ config.reason = reason
         ├─ config.totalToggles++
         ├─ Add history entry
         └─ Emit events
         │
         ▼ Effects:
         ├─ Multi-sig withdrawals restored
         ├─ Guardian signatures required again
         ├─ Audit trail recorded
         └─ Normal operations resume

Time: Immediate
Reversibility: Yes (call enableSafeMode again)
```

---

## Integration

### With Other Features

#### Feature #1-14 (Base Vault Features)
**Status**: Full Compatibility ✅
- All existing vault functionality preserved
- Safe mode overlay on withdrawal layer
- Guardian management unchanged
- No breaking changes

#### Feature #16 (Delayed Guardians)
**Status**: Enhanced Security ✅
- Pending guardians cannot bypass safe mode
- Active-only voting respected
- Safe mode adds additional protection
- Complementary security layers

#### Feature #17 (Guardian Roles - if exists)
**Status**: Compatible ✅
- Safe mode overrides all roles
- Owner is supreme authority
- Role-based access respected when safe mode disabled
- Hierarchical security model

### Integration Pattern

```solidity
// In SpendVaultWithSafeMode.sol

function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    bytes[] calldata signatures
) external nonReentrant {
    // NEW: Check safe mode status
    require(
        !safeModeController.isSafeModeEnabled(address(this)),
        "Safe mode enabled - use safeModeWithdraw"
    );
    
    // EXISTING: Verify signatures, check quorum, execute
    // ... rest of withdrawal logic ...
}

// NEW: Safe mode withdrawal (bypasses multi-sig)
function safeModeWithdraw(address token, uint256 amount)
    external
    onlyOwner
    nonReentrant
{
    require(
        safeModeController.isSafeModeEnabled(address(this)),
        "Safe mode not enabled"
    );
    
    // Execute owner-only withdrawal
    // ... transfer logic ...
}
```

---

## Security Benefits

### 1. Incident Response

**Scenario**: Exploit detected in vault logic
```
Timeline:
T+0:  Exploit detected
      └─ Owner calls enableSafeMode("Exploit detected")
T+1:  Safe mode active within 1 block
      ├─ All non-owner withdrawals blocked
      ├─ Attacker cannot steal funds
      └─ Owner maintains control
T+30: Incident resolved
      └─ Owner disables safe mode
```

**Protection**: Blocks exploitation window to single block

### 2. Guardian Compromise

**Scenario**: Multiple guardians compromised
```
Without Safe Mode:
- Attacker has N/M guardian keys
- Can authorize withdrawals immediately
- Vault drained before detection

With Safe Mode:
- Owner detects compromise
- Activates safe mode instantly
- Attacker cannot withdraw
- Owner has time to respond
```

**Protection**: Owner retains unilateral control

### 3. Private Key Compromise

**Scenario**: Owner private key leaked
```
Attack Vector Analysis:
- Attacker has owner key
- Can call enableSafeMode("I will steal funds")
- Can withdraw all owner funds
- Cannot bypass vault if safe mode designed for owner-only

Mitigation: Multi-sig owner (future feature)
- Requires M-of-N signatures to enable safe mode
- Compromised owner key insufficient alone
```

### 4. Front-Running Prevention

**Scenario**: Malicious guardian front-runs guardian removal
```
Normal Scenario:
1. Owner calls removeGuardian()
2. Guardian receives transaction notification
3. Guardian front-runs with malicious withdrawal
4. Fund theft before removal effective

With Safe Mode:
1. Detect suspicious guardian activity
2. Enable safe mode immediately
3. Guardian cannot front-run
4. Owner maintains control
```

### 5. Temporary System Lockdown

**Scenario**: Smart contract upgrade in progress
```
Upgrade Window:
- Original vault active but frozen
- New implementation being deployed
- Migration process underway
- Prevent fund loss during transition

Safe Mode:
- Pause withdrawals temporarily
- Only owner can access funds
- No guardian participation during upgrade
- Controlled transition to new system
```

---

## Use Cases

### Use Case 1: Emergency Incident Response

**Context**: Vault compromised, emergency response needed

**Procedure**:
```
1. Owner detects unusual activity
2. Calls: safeModeController.enableSafeMode(vaultAddress, "Suspicious activity")
3. All non-owner withdrawals blocked
4. Owner can still withdraw funds to secure location
5. Investigation proceeds offline
6. Issue resolved, safe mode disabled
```

**Timeline**: Seconds from detection to lockdown

### Use Case 2: Guardian Key Rotation

**Context**: Rotating guardian keys due to security concerns

**Procedure**:
```
1. Enable safe mode: "Key rotation in progress"
2. Remove old guardians from vault
3. Add new guardians
4. New guardians confirm on-chain
5. Test with small transaction
6. Disable safe mode
```

**Duration**: Hours to days depending on rotation complexity

### Use Case 3: Maintenance Window

**Context**: Vault being upgraded with new features

**Procedure**:
```
1. Schedule maintenance window
2. Notify stakeholders
3. Enable safe mode: "Maintenance - vault frozen"
4. Execute upgrade
5. Test new functionality
6. Disable safe mode
```

**Duration**: Minutes to hours

### Use Case 4: Market Instability Response

**Context**: Extreme market conditions, potential for irrational decisions

**Procedure**:
```
1. Market crashes 50% in 10 minutes
2. Guardian decision may be emotional
3. Owner enables safe mode: "Market volatility"
4. Pauses all non-owner withdrawals
5. Allows careful analysis
6. Resumes normal operations when calm returns
```

**Duration**: Minutes to hours

### Use Case 5: Compromised Guardian Isolation

**Context**: One guardian's key potentially compromised

**Procedure**:
```
1. Detect anomalous guardian signature
2. Enable safe mode immediately
3. Guardian cannot authorize withdrawal alone
4. Even with compromised key, cannot act
5. Investigate guardian activity
6. Remove if confirmed compromised
7. Restore normal operations
```

**Timeline**: Immediate protection

### Use Case 6: Bridge Migration (Cross-Chain)

**Context**: Moving vault to different blockchain

**Procedure**:
```
1. Enable safe mode on source vault: "Bridge migration"
2. Prevents new transactions on source
3. Complete cross-chain bridge process
4. Disable safe mode on destination
5. Resume operations on new chain
```

**Duration**: Hours (bridge confirmation times)

---

## Configuration

### Initial Setup

```solidity
// 1. Deploy SafeModeController
SafeModeController controller = new SafeModeController();

// 2. Deploy vault with safe mode
SpendVaultWithSafeMode vault = new SpendVaultWithSafeMode(
    guardianTokenAddress,
    address(controller),
    2  // quorum: 2-of-3 guardians
);

// 3. Register with safe mode controller
controller.registerVault(vault, ownerAddress);

// 4. Add guardians
vault.addGuardian(guardian1);
vault.addGuardian(guardian2);
vault.addGuardian(guardian3);
```

### Configuration Parameters

#### Vault Parameters
```solidity
quorum         // Number of guardian signatures required
              // Range: 1 to guardians.length
              // Default: ceil(guardians.length / 2)

owners         // Vault owner address
              // Has ultimate control
              // Can enable/disable safe mode

guardians      // Authorized signers
              // Must hold guardian SBT
              // Cannot bypass safe mode when enabled
```

#### Controller Parameters
```solidity
None currently configurable
All parameters per-vault
All state managed in SafeModeConfig struct
```

### Example Configurations

**Conservative (3-of-5 guardians)**:
```solidity
// High security, requires consensus
vault.setQuorum(3);
// Safe mode helps when guardian consensus fails
```

**Aggressive (1-of-3 guardians)**:
```solidity
// High speed, single guardian can act
vault.setQuorum(1);
// Safe mode crucial as backup security
```

---

## API Reference

### SafeModeController

#### State Management Functions

##### `registerVault(address vault, address owner)`
- **Purpose**: Register vault with safe mode management
- **Parameters**:
  - `vault`: Vault address to register
  - `owner`: Owner of the vault
- **Returns**: None
- **Events**: `VaultRegisteredForSafeMode`
- **Reverts**: If vault already registered

##### `enableSafeMode(address vault, string calldata reason)`
- **Purpose**: Enable safe mode (owner-only withdrawals)
- **Parameters**:
  - `vault`: Vault to enable safe mode for
  - `reason`: Reason for enabling (logged in events)
- **Returns**: None
- **Events**: `SafeModeEnabled`, `SafeModeToggleRecorded`
- **Reverts**: If caller not vault owner

##### `disableSafeMode(address vault, string calldata reason)`
- **Purpose**: Disable safe mode (restore multi-sig)
- **Parameters**:
  - `vault`: Vault to disable safe mode for
  - `reason`: Reason for disabling (logged in events)
- **Returns**: None
- **Events**: `SafeModeDisabled`, `SafeModeToggleRecorded`
- **Reverts**: If caller not vault owner

#### Query Functions

##### `isSafeModeEnabled(address vault) → bool`
- **Purpose**: Check if safe mode currently enabled
- **Parameters**: `vault`: Address to check
- **Returns**: `true` if safe mode enabled
- **Gas**: ~5,000 (read-only)

##### `getSafeModeConfig(address vault) → SafeModeConfig`
- **Purpose**: Get complete safe mode configuration
- **Returns**: Struct with:
  - `enabled`: Current status
  - `vault`: Vault address
  - `owner`: Owner address
  - `enabledAt`: Timestamp when last enabled
  - `disabledAt`: Timestamp when last disabled
  - `reason`: Current/last toggle reason
  - `totalToggles`: Total enable/disable events
- **Gas**: ~10,000 (read-only)

##### `getSafeModeDuration(address vault) → uint256`
- **Purpose**: Get duration safe mode has been active (seconds)
- **Returns**: Seconds since last enabled (0 if disabled)
- **Gas**: ~8,000 (read-only)

##### `getSafeModeHistory(address vault) → SafeModeHistory[]`
- **Purpose**: Get complete history of all toggles
- **Returns**: Array of all enable/disable events with timestamps
- **Note**: Large gas cost if many toggles
- **Gas**: ~20,000 + 1,000 per history entry

##### `getTotalManagedVaults() → uint256`
- **Purpose**: Get count of vaults managed by controller
- **Returns**: Total vault count
- **Gas**: ~5,000 (read-only)

##### `getTotalToggles() → uint256`
- **Purpose**: Get sum of all toggles across all vaults
- **Returns**: Total enable/disable events
- **Gas**: ~20,000 (loops through vaults)

##### `getLastToggleTime(address vault) → uint256`
- **Purpose**: Get timestamp of last toggle (enable or disable)
- **Returns**: Block timestamp of most recent toggle
- **Gas**: ~8,000 (read-only)

##### `getSafeModeStatistics() → (enabled, total, avg)`
- **Purpose**: Get aggregate statistics
- **Returns**:
  - `enabledCount`: Vaults currently in safe mode
  - `totalToggles`: Total toggles across all vaults
  - `averageToggleCount`: Average toggles per vault
- **Gas**: ~20,000 (loops through vaults)

### SpendVaultWithSafeMode

#### Safe Mode Withdrawal

##### `safeModeWithdraw(address token, uint256 amount)`
- **Purpose**: Withdraw funds to owner (bypasses multi-sig)
- **Requirements**:
  - Caller must be owner
  - Safe mode must be enabled
  - Sufficient balance available
- **Parameters**:
  - `token`: Token to withdraw (address(0) for ETH)
  - `amount`: Amount to withdraw
- **Emits**: `SafeModeWithdrawal`, `Withdrawal`
- **Reverts**:
  - If not owner
  - If safe mode not enabled
  - If insufficient balance
  - If transfer fails

#### Guardian Management

##### `addGuardian(address guardian)`
- **Purpose**: Add guardian to vault
- **Requirements**: Caller must be owner
- **Reverts**: If already a guardian
- **Emits**: `GuardianAdded`

##### `removeGuardian(address guardian)`
- **Purpose**: Remove guardian from vault
- **Requirements**: Caller must be owner
- **Reverts**: If not a guardian
- **Emits**: `GuardianRemoved`

##### `setQuorum(uint256 newQuorum)`
- **Purpose**: Update required signature count
- **Requirements**: Caller must be owner
- **Reverts**: If invalid quorum (0 or > guardian count)
- **Emits**: `QuorumUpdated`

#### View Functions

##### `isSafeModeEnabled() → bool`
- **Purpose**: Check if safe mode active
- **Returns**: `true` if safe mode enabled
- **Gas**: ~10,000 (calls controller)

##### `getSafeModeDuration() → uint256`
- **Purpose**: Get how long safe mode active
- **Returns**: Seconds (0 if disabled)
- **Gas**: ~12,000 (calls controller)

---

## Events and Audit Trail

### SafeModeController Events

#### VaultRegisteredForSafeMode
```solidity
event VaultRegisteredForSafeMode(
    address indexed vault,
    address indexed owner,
    uint256 timestamp
);
```
- **Emitted**: When vault first registered for safe mode management
- **Indexed**: vault, owner
- **Use**: Track vault enrollments

#### SafeModeEnabled
```solidity
event SafeModeEnabled(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
- **Emitted**: When safe mode activated
- **Indexed**: vault
- **Use**: Detect when safe mode activated
- **Reason**: Incident description

#### SafeModeDisabled
```solidity
event SafeModeDisabled(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
- **Emitted**: When safe mode deactivated
- **Indexed**: vault
- **Use**: Detect when safe mode deactivated
- **Reason**: Resolution description

#### SafeModeToggleRecorded
```solidity
event SafeModeToggleRecorded(
    address indexed vault,
    bool enabled,
    string reason,
    address toggler,
    uint256 timestamp
);
```
- **Emitted**: For every enable/disable
- **Indexed**: vault, toggler
- **Use**: Complete audit trail
- **Parameters**:
  - `vault`: Which vault toggled
  - `enabled`: true=enabled, false=disabled
  - `reason`: Why toggled
  - `toggler`: Who initiated toggle
  - `timestamp`: When toggled

### Audit Trail Analysis

```solidity
// Example: Analyze safe mode history
SafeModeHistory[] history = controller.getSafeModeHistory(vault);

for (uint i = 0; i < history.length; i++) {
    SafeModeHistory memory entry = history[i];
    
    string memory action = entry.enabled ? "ENABLED" : "DISABLED";
    
    console.log(
        "At %s (timestamp %d):",
        action,
        entry.timestamp
    );
    console.log("  Reason: %s", entry.reason);
    console.log("  Toggle #%d", i + 1);
}
```

---

## Gas Optimization

### Gas Costs

#### Enable Safe Mode
- **Cost**: ~35,000 gas
- **Breakdown**:
  - Update mapping: ~5,000
  - Write timestamp: ~5,000
  - Array push (history): ~15,000
  - Event emission: ~10,000

#### Check Safe Mode Status
- **Cost**: ~5,000 gas (read-only)
- **Optimization**: Can be called in view functions

#### Withdraw (Safe Mode)
- **Cost**: +5,000 gas (safe mode check)
- **vs Normal**: Adds minimal overhead

#### Get History
- **Cost**: ~20,000 + (1,000 per entry)
- **Note**: Expensive for frequently toggled vaults

### Optimization Recommendations

1. **Batch Safe Mode Queries**
   ```solidity
   // Instead of calling getSafeModeConfig per vault
   // Store controller reference and query once
   ```

2. **Use Indexed Events**
   ```solidity
   // Events indexed on vault enable efficient filtering
   event SafeModeEnabled(address indexed vault, ...);
   ```

3. **Minimize History Reads**
   ```solidity
   // Only query full history when needed
   // Use isSafeModeEnabled() for status checks
   ```

4. **Cache Controller Reference**
   ```solidity
   // Avoid repeated lookups of controller address
   SafeModeController immutable controller;
   ```

---

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Safe mode not enabled` | Called `safeModeWithdraw()` when not in safe mode | Enable safe mode first, or use normal `withdraw()` |
| `Safe mode enabled - use safeModeWithdraw` | Called normal `withdraw()` while in safe mode | Use `safeModeWithdraw()` if owner, wait for safe mode to disable otherwise |
| `Only owner` | Non-owner tried to enable/disable safe mode | Have vault owner initiate safe mode toggle |
| `Insufficient balance` | Tried to withdraw more than available | Check balance first with `getETHBalance()` or `getTokenBalance()` |
| `Invalid recipient` | Specified invalid recipient address | Use valid Ethereum address |
| `Invalid signer` | Signature from non-guardian or pending guardian | Use active guardians only |

### Debugging Guide

**Problem**: Safe mode won't disable
```
Check:
1. Caller is vault owner?
   - vault.owner() === msg.sender
2. SafeModeController.isSafeModeEnabled(vault)?
   - Should be true to disable
3. Recent toggle failures?
   - Check SafeModeToggleRecorded events
4. Gas issues?
   - Ensure sufficient gas for state change
```

**Problem**: Owner can't withdraw in safe mode
```
Check:
1. Safe mode actually enabled?
   - controller.isSafeModeEnabled(vault)
2. Have sufficient balance?
   - vault.getETHBalance() or getTokenBalance(token)
3. Using correct function?
   - Must use vault.safeModeWithdraw(), not vault.withdraw()
4. Owner address correct?
   - Verify ownership with vault.owner()
```

---

## Testing Scenarios

### Scenario 1: Basic Enable/Disable

```solidity
// 1. Setup
SpendVaultWithSafeMode vault = // ... deployed
SafeModeController controller = // ... deployed

// 2. Initially disabled
assert(!controller.isSafeModeEnabled(vault));

// 3. Enable
controller.enableSafeMode(vault, "Test");
assert(controller.isSafeModeEnabled(vault));

// 4. Disable
controller.disableSafeMode(vault, "Test resolved");
assert(!controller.isSafeModeEnabled(vault));
```

### Scenario 2: Owner Withdrawal in Safe Mode

```solidity
// 1. Fund vault
vault.deposit{value: 10 ether}();

// 2. Enable safe mode
controller.enableSafeMode(vault, "Emergency");

// 3. Owner withdraws
vault.safeModeWithdraw(address(0), 5 ether);

// 4. Verify
assert(vault.getETHBalance() == 5 ether);
```

### Scenario 3: Block Non-Owner Withdrawal

```solidity
// 1. Setup
vault.addGuardian(guardian);

// 2. Enable safe mode
controller.enableSafeMode(vault, "Emergency");

// 3. Attempt non-owner withdrawal
vm.prank(recipient);
vm.expectRevert("Safe mode enabled");
vault.withdraw(address(0), 1 ether, recipient, "Try", signatures);
```

### Scenario 4: Audit Trail

```solidity
// 1. Multiple toggles
controller.enableSafeMode(vault, "Incident 1");
controller.disableSafeMode(vault, "Resolved");
controller.enableSafeMode(vault, "Incident 2");

// 2. Query history
SafeModeController.SafeModeHistory[] memory history =
    controller.getSafeModeHistory(vault);

// 3. Verify all recorded
assert(history.length == 3);
```

---

## Deployment

### Deployment Steps

**Step 1**: Deploy SafeModeController
```solidity
SafeModeController controller = new SafeModeController();
```

**Step 2**: Deploy SafeModeController reference implementation
```solidity
SpendVaultWithSafeMode implementation =
    new SpendVaultWithSafeMode(
        guardianTokenAddress,
        address(controller),
        0  // placeholder quorum
    );
```

**Step 3**: Deploy Factory
```solidity
VaultFactoryWithSafeMode factory = new VaultFactoryWithSafeMode(
    guardianTokenAddress,
    address(implementation)
);
```

**Step 4**: Create vault
```solidity
address vault = factory.deployVault(2);  // 2-of-N quorum
```

**Step 5**: Add guardians and configure
```solidity
SpendVaultWithSafeMode(vault).addGuardian(guardian1);
SpendVaultWithSafeMode(vault).addGuardian(guardian2);
```

### Deployment Checklist
- [ ] Guardian token contract deployed
- [ ] SafeModeController deployed
- [ ] VaultImplementation created
- [ ] VaultFactory deployed
- [ ] Factory ownership verified
- [ ] Controller reference verified
- [ ] Vault creation tested
- [ ] Safe mode enable tested
- [ ] Safe mode disable tested
- [ ] Owner withdrawal tested
- [ ] Guardian withdrawal tested
- [ ] Events emitted verified
- [ ] All addresses recorded
- [ ] Documentation updated

---

## Troubleshooting

### Issue: Safe mode transactions failing

**Symptoms**: All safe mode operations reverting

**Diagnosis**:
1. Check controller address
2. Verify vault registration
3. Confirm owner status
4. Review transaction reason

**Solution**:
```solidity
// Verify vault registration
bool isRegistered = controller.isSafeModeEnabled(vault);
// May not be registered - check factory used

// Verify ownership
require(vault.owner() == msg.sender);
```

### Issue: History queries too expensive

**Symptoms**: Gas exceeded when querying history

**Diagnosis**:
1. Vault has many toggle events
2. querying full history is costly
3. Inefficient implementation

**Solution**:
```solidity
// Query only recent history
SafeModeHistory[] memory history = controller.getSafeModeHistory(vault);
// Then slice client-side for recent entries

// Or use events instead of querying history
// Filter SafeModeToggleRecorded events
```

### Issue: Cannot distinguish enable vs disable

**Symptoms**: Confused about current safe mode state

**Solution**:
```solidity
// Always use this to check current state:
bool enabled = controller.isSafeModeEnabled(vault);

// Never rely on history - state may have changed
```

