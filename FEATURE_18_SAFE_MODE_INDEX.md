# Feature #18: Safe Mode - Complete API Reference

## Table of Contents
1. [Type Definitions](#type-definitions)
2. [SafeModeController API](#safemode-controller-api)
3. [SpendVaultWithSafeMode API](#spendvaultwithsafemode-api)
4. [VaultFactoryWithSafeMode API](#vaultfactorywithsafemode-api)
5. [Events Reference](#events-reference)
6. [Integration Examples](#integration-examples)

---

## Type Definitions

### SafeModeConfig Structure
```solidity
struct SafeModeConfig {
    bool enabled;              // True = safe mode active
    address vault;            // Associated vault address
    address owner;            // Vault owner address
    uint256 enabledAt;        // Timestamp when last enabled
    uint256 disabledAt;       // Timestamp when last disabled
    string reason;            // Reason for last toggle
    uint256 totalToggles;     // Total enable/disable events
}
```

**Field Descriptions**:
- `enabled`: Current safe mode status
- `vault`: Immutable vault address this config belongs to
- `owner`: Vault owner who controls toggles
- `enabledAt`: Unix timestamp of most recent enable
- `disabledAt`: Unix timestamp of most recent disable
- `reason`: Description of why last toggled
- `totalToggles`: Cumulative count of all toggles

### SafeModeHistory Structure
```solidity
struct SafeModeHistory {
    bool enabled;             // true = enabled, false = disabled
    uint256 timestamp;        // When toggle occurred
    string reason;            // Why it was toggled
    address toggler;          // Who triggered toggle (owner)
}
```

**Field Descriptions**:
- `enabled`: What action was taken (enable vs disable)
- `timestamp`: Block timestamp when event occurred
- `reason`: Explanation in user-readable format
- `toggler`: Address of person who initiated toggle

---

## SafeModeController API

### Overview
Central singleton managing safe mode for all vaults. One deployed per network.

### State Variables

#### `safeModeConfigs`
```solidity
mapping(address => SafeModeConfig) public safeModeConfigs;
```
- **Type**: Mapping from vault address to config
- **Access**: Public read
- **Use**: Check configuration for specific vault
- **Example**:
  ```solidity
  SafeModeConfig memory config = controller.safeModeConfigs(vaultAddress);
  ```

#### `safeModeHistory`
```solidity
mapping(address => SafeModeHistory[]) public safeModeHistory;
```
- **Type**: Mapping from vault to history array
- **Access**: Public read
- **Use**: Query historical toggles
- **Note**: Array grows with each toggle

#### `managedVaults`
```solidity
address[] public managedVaults;
```
- **Type**: Dynamic array of vault addresses
- **Access**: Public read
- **Use**: Iterate all managed vaults

#### `isRegistered`
```solidity
mapping(address => bool) public isRegistered;
```
- **Type**: Boolean per vault
- **Access**: Public read
- **Use**: Quick registration check

### Functions

#### `registerVault(address vault, address owner)`

**Purpose**: Register vault for safe mode management

**Parameters**:
- `vault` (address): Vault to register
- `owner` (address): Owner of the vault

**Returns**: None

**Reverts**:
- `Vault already registered` - if vault already managed
- `Invalid vault address` - if vault is address(0)
- `Invalid owner address` - if owner is address(0)

**Events Emitted**:
- `VaultRegisteredForSafeMode(vault, owner, timestamp)`

**Gas Cost**: ~25,000

**Example**:
```solidity
controller.registerVault(vaultAddress, ownerAddress);
```

**Notes**:
- Called automatically by VaultFactoryWithSafeMode
- Each vault can only be registered once
- Owner cannot be changed after registration

---

#### `enableSafeMode(address vault, string calldata reason)`

**Purpose**: Enable safe mode (owner-only withdrawals)

**Parameters**:
- `vault` (address): Vault to lock down
- `reason` (string): Explanation for enabling (stored in history)

**Returns**: None

**Reverts**:
- `Vault not registered` - if vault not found
- `Only vault owner can toggle` - if caller not owner
- `Safe mode already enabled` - if already active
- `Reason too long` - if reason > 256 characters (recommended)

**Events Emitted**:
- `SafeModeEnabled(vault, reason, timestamp)`
- `SafeModeToggleRecorded(vault, true, reason, msg.sender, timestamp)`

**Gas Cost**: ~35,000

**Example**:
```solidity
controller.enableSafeMode(
    vaultAddress,
    "Malicious activity detected"
);
```

**State Changes**:
- `safeModeConfigs[vault].enabled = true`
- `safeModeConfigs[vault].enabledAt = block.timestamp`
- `safeModeConfigs[vault].reason = reason`
- `safeModeConfigs[vault].totalToggles++`
- Appends to `safeModeHistory[vault]`

**Key Points**:
- Immediate effect (no delay)
- Vault owner required
- Reason logged for audit trail
- Can be called multiple times

---

#### `disableSafeMode(address vault, string calldata reason)`

**Purpose**: Disable safe mode (restore multi-sig)

**Parameters**:
- `vault` (address): Vault to unlock
- `reason` (string): Explanation for disabling

**Returns**: None

**Reverts**:
- `Vault not registered` - if vault not found
- `Only vault owner can toggle` - if caller not owner
- `Safe mode not enabled` - if already disabled
- `Reason too long` - if reason > 256 characters

**Events Emitted**:
- `SafeModeDisabled(vault, reason, timestamp)`
- `SafeModeToggleRecorded(vault, false, reason, msg.sender, timestamp)`

**Gas Cost**: ~35,000

**Example**:
```solidity
controller.disableSafeMode(
    vaultAddress,
    "Threat resolved, operations restored"
);
```

**State Changes**:
- `safeModeConfigs[vault].enabled = false`
- `safeModeConfigs[vault].disabledAt = block.timestamp`
- `safeModeConfigs[vault].reason = reason`
- `safeModeConfigs[vault].totalToggles++`
- Appends to `safeModeHistory[vault]`

**Key Points**:
- Immediate effect
- Vault owner required
- All state changes logged
- Reason provides context

---

### Query Functions

#### `isSafeModeEnabled(address vault) → bool`

**Purpose**: Check if safe mode currently active

**Parameters**:
- `vault` (address): Vault to check

**Returns**:
- `true` if safe mode enabled
- `false` if safe mode disabled or vault not registered

**Reverts**: None (returns false for unregistered vaults)

**Gas Cost**: ~5,000 (read-only)

**Example**:
```solidity
bool enabled = controller.isSafeModeEnabled(vaultAddress);
if (enabled) {
    // Handle safe mode logic
}
```

**Usage Pattern**:
```solidity
// In vault withdrawal function
if (safeModeController.isSafeModeEnabled(address(this))) {
    require(recipient == owner, "Safe mode: owner-only withdrawals");
}
```

---

#### `getSafeModeConfig(address vault) → SafeModeConfig`

**Purpose**: Get complete safe mode configuration

**Parameters**:
- `vault` (address): Vault to query

**Returns**: `SafeModeConfig` struct containing:
- `enabled`: Current status
- `vault`: Vault address
- `owner`: Owner address
- `enabledAt`: Last enable timestamp
- `disabledAt`: Last disable timestamp
- `reason`: Last toggle reason
- `totalToggles`: Total toggle count

**Reverts**: None (returns empty struct if not registered)

**Gas Cost**: ~10,000 (read-only)

**Example**:
```solidity
SafeModeConfig memory config = controller.getSafeModeConfig(vault);
console.log("Enabled:", config.enabled);
console.log("Owner:", config.owner);
console.log("Total toggles:", config.totalToggles);
```

**Common Usage**:
```solidity
// Check if vault is registered
SafeModeConfig memory config = controller.getSafeModeConfig(vault);
if (config.vault == address(0)) {
    revert("Vault not registered");
}
```

---

#### `getSafeModeDuration(address vault) → uint256`

**Purpose**: Get how long safe mode has been active (seconds)

**Parameters**:
- `vault` (address): Vault to check

**Returns**: Duration in seconds
- 0 if safe mode not enabled
- `block.timestamp - enabledAt` if enabled

**Reverts**: None

**Gas Cost**: ~8,000 (read-only)

**Example**:
```solidity
uint256 durationSeconds = controller.getSafeModeDuration(vault);
console.log("Safe mode active for", durationSeconds, "seconds");

uint256 hours = durationSeconds / 3600;
console.log("Which is", hours, "hours");
```

**Use Cases**:
- Monitor incident duration
- Enforce minimum/maximum safe mode periods
- Track response time

---

#### `getSafeModeHistory(address vault) → SafeModeHistory[]`

**Purpose**: Get complete toggle history for vault

**Parameters**:
- `vault` (address): Vault to query

**Returns**: Array of all enable/disable events in chronological order

**Reverts**: None (returns empty array if not registered)

**Gas Cost**: ~20,000 + (1,000 per history entry)

**Example**:
```solidity
SafeModeHistory[] memory history = controller.getSafeModeHistory(vault);

for (uint i = 0; i < history.length; i++) {
    string memory action = history[i].enabled ? "ENABLED" : "DISABLED";
    console.log(action, "at", history[i].timestamp);
    console.log("Reason:", history[i].reason);
}
```

**Warning**: Expensive for frequently-toggled vaults
- Better to query events off-chain
- Or use more granular queries

---

#### `getTotalManagedVaults() → uint256`

**Purpose**: Get count of all managed vaults

**Parameters**: None

**Returns**: Number of registered vaults

**Reverts**: None

**Gas Cost**: ~5,000 (read-only)

**Example**:
```solidity
uint256 total = controller.getTotalManagedVaults();
console.log("Total vaults managed:", total);
```

---

#### `getTotalToggles() → uint256`

**Purpose**: Get sum of all toggles across all vaults

**Parameters**: None

**Returns**: Total number of enable/disable events

**Reverts**: None

**Gas Cost**: ~20,000 (loops through all vaults)

**Example**:
```solidity
uint256 totalToggles = controller.getTotalToggles();
console.log("Total safe mode toggles:", totalToggles);
```

**Note**: Expensive operation - avoid in frequent loops

---

#### `getLastToggleTime(address vault) → uint256`

**Purpose**: Get timestamp of most recent toggle

**Parameters**:
- `vault` (address): Vault to check

**Returns**: Unix timestamp of last enable or disable

**Reverts**: None (returns 0 if not registered)

**Gas Cost**: ~8,000 (read-only)

**Example**:
```solidity
uint256 lastToggle = controller.getLastToggleTime(vault);
console.log("Last toggle at block timestamp:", lastToggle);
```

---

#### `getSafeModeStatistics() → (uint256, uint256, uint256)`

**Purpose**: Get aggregate safe mode statistics

**Parameters**: None

**Returns** (tuple):
- `enabledCount`: Number of vaults currently in safe mode
- `totalToggles`: Sum of all toggles across all vaults
- `averageToggleCount`: Mean toggles per vault

**Reverts**: None

**Gas Cost**: ~20,000 (loops through all vaults)

**Example**:
```solidity
(uint256 enabled, uint256 total, uint256 avg) =
    controller.getSafeModeStatistics();

console.log("Currently in safe mode:", enabled);
console.log("Total toggles ever:", total);
console.log("Average toggles per vault:", avg);
```

---

## SpendVaultWithSafeMode API

### Overview
Multi-signature vault with safe mode emergency withdrawal capability.

### Constructor

```solidity
constructor(
    address _guardianToken,
    address _safeModeController,
    uint256 _quorum
)
```

**Parameters**:
- `_guardianToken`: Guardian SBT contract address
- `_safeModeController`: SafeModeController contract address
- `_quorum`: Number of signatures required (2-of-5, etc)

**Requirements**:
- All addresses must be non-zero
- Quorum must be > 0

**Sets**:
- `owner = msg.sender`
- `guardianToken = _guardianToken`
- `safeModeController = _safeModeController`
- `quorum = _quorum`
- `DOMAIN_SEPARATOR` for EIP-712

---

### Safe Mode Functions

#### `safeModeWithdraw(address token, uint256 amount)`

**Purpose**: Emergency withdrawal (owner-only, bypasses multi-sig)

**Parameters**:
- `token` (address): Token to withdraw (address(0) for ETH)
- `amount` (uint256): Amount to withdraw in token units

**Requirements**:
- Caller must be vault owner
- Safe mode must be enabled
- Sufficient balance available
- No reentrancy

**Reverts**:
- `Only owner` - if caller not owner
- `Safe mode not enabled` - if not in safe mode
- `Insufficient ETH balance` - if insufficient ETH
- `Insufficient token balance` - if insufficient ERC-20
- `ETH transfer failed` - if ETH transfer fails
- `ReentrancyGuard` - on reentrancy attempt

**Events Emitted**:
- `SafeModeWithdrawal(owner, amount, timestamp)`
- `Withdrawal(token, amount, owner, timestamp)`

**Gas Cost**: ~50,000-100,000 (varies by token)

**Example**:
```solidity
// Owner withdraws all ETH during emergency
uint256 balance = vault.getETHBalance();
vault.safeModeWithdraw(address(0), balance);
```

**Important Notes**:
- Only way to withdraw when safe mode enabled
- Recipient is always owner (hardcoded)
- Bypasses all guardian signatures
- Logged in events for audit trail

---

### Guardian Management

#### `addGuardian(address guardian)`

**Purpose**: Add guardian to vault

**Parameters**:
- `guardian` (address): Address to add as guardian

**Requirements**:
- Caller must be owner
- Guardian not already added
- Guardian address non-zero

**Reverts**:
- `Only owner` - if not owner
- `Invalid guardian` - if guardian is address(0)
- `Already guardian` - if already added

**Events Emitted**:
- `GuardianAdded(guardian, timestamp)`

**Gas Cost**: ~30,000

**Example**:
```solidity
vault.addGuardian(0x1234...);
vault.addGuardian(0x5678...);
```

---

#### `removeGuardian(address guardian)`

**Purpose**: Remove guardian from vault

**Parameters**:
- `guardian` (address): Guardian to remove

**Requirements**:
- Caller must be owner
- Guardian exists in vault

**Reverts**:
- `Only owner` - if not owner
- `Not a guardian` - if address not a guardian

**Events Emitted**:
- `GuardianRemoved(guardian, timestamp)`

**Gas Cost**: ~35,000

**Example**:
```solidity
vault.removeGuardian(oldGuardian);
```

---

#### `setQuorum(uint256 newQuorum)`

**Purpose**: Update required guardian signature count

**Parameters**:
- `newQuorum` (uint256): New required signatures

**Requirements**:
- Caller must be owner
- Quorum > 0
- Quorum <= guardian count

**Reverts**:
- `Only owner` - if not owner
- `Invalid quorum` - if invalid value

**Events Emitted**:
- `QuorumUpdated(newQuorum, timestamp)`

**Gas Cost**: ~25,000

**Example**:
```solidity
vault.setQuorum(3);  // Require 3-of-N signatures
```

---

#### `changeOwner(address newOwner)`

**Purpose**: Transfer ownership

**Parameters**:
- `newOwner` (address): New owner address

**Requirements**:
- Caller must be current owner
- New owner non-zero

**Reverts**:
- `Only owner` - if not current owner
- `Invalid new owner` - if address(0)

**Events Emitted**:
- `OwnerChanged(newOwner, timestamp)`

**Gas Cost**: ~25,000

**Example**:
```solidity
vault.changeOwner(0xNewOwner);
```

---

### Deposit Functions

#### `receive()`

**Purpose**: Accept native ETH

**Usage**:
```solidity
// Send ETH
(bool success, ) = address(vault).call{value: 1 ether}("");
```

**Events Emitted**:
- `Deposit(sender, address(0), amount, timestamp)`

**Gas Cost**: ~25,000

---

#### `deposit(address token, uint256 amount)`

**Purpose**: Deposit ERC-20 tokens

**Parameters**:
- `token` (address): Token contract
- `amount` (uint256): Amount to deposit

**Requirements**:
- Token non-zero
- Amount > 0
- Caller approved vault for amount

**Reverts**:
- `Invalid token` - if address(0)
- `Invalid amount` - if amount is 0
- Transfer failures from token

**Events Emitted**:
- `Deposit(sender, token, amount, timestamp)`

**Gas Cost**: ~80,000

**Example**:
```solidity
usdc.approve(vault, 1000e6);
vault.deposit(usdc, 1000e6);
```

---

### View Functions

#### `isSafeModeEnabled() → bool`

**Purpose**: Check if safe mode active

**Returns**: true if enabled

**Gas Cost**: ~10,000

**Example**:
```solidity
if (vault.isSafeModeEnabled()) {
    // Use safeModeWithdraw
} else {
    // Use normal withdraw
}
```

---

#### `getSafeModeDuration() → uint256`

**Purpose**: Get safe mode active duration

**Returns**: Seconds

**Gas Cost**: ~12,000

**Example**:
```solidity
uint256 durationHours = vault.getSafeModeDuration() / 3600;
```

---

#### `getETHBalance() → uint256`

**Purpose**: Get vault's ETH balance

**Returns**: Balance in wei

**Gas Cost**: ~5,000

---

#### `getTokenBalance(address token) → uint256`

**Purpose**: Get vault's token balance

**Parameters**:
- `token` (address): Token to check

**Returns**: Balance in token units

**Gas Cost**: ~5,000

---

#### `getGuardians() → address[]`

**Purpose**: Get all guardians

**Returns**: Array of guardian addresses

**Gas Cost**: ~20,000

---

#### `getGuardianCount() → uint256`

**Purpose**: Get count of guardians

**Returns**: Number of guardians

**Gas Cost**: ~5,000

---

## VaultFactoryWithSafeMode API

### Overview
Factory for deploying and managing safe mode vaults.

### Constructor

```solidity
constructor(
    address _guardianToken,
    address _vaultImplementation
)
```

**Parameters**:
- `_guardianToken`: Guardian SBT address
- `_vaultImplementation`: Vault implementation for cloning

**Creates**: SafeModeController singleton

---

### Factory Functions

#### `deployVault(uint256 quorum) → address`

**Purpose**: Deploy new vault instance

**Parameters**:
- `quorum` (uint256): Required signatures

**Returns**: Deployed vault address

**Reverts**:
- `Invalid quorum` - if quorum is 0

**Events Emitted**:
- `VaultDeployed(vault, owner, controller, quorum, timestamp)`

**Gas Cost**: ~200,000

**Example**:
```solidity
address vault = factory.deployVault(2);  // 2-of-3 quorum
```

---

### Query Functions

#### `getVaultCount() → uint256`

**Purpose**: Total vaults deployed

**Gas Cost**: ~5,000

---

#### `getAllVaults() → address[]`

**Purpose**: All deployed vault addresses

**Gas Cost**: ~20,000

---

#### `getOwnerVaults(address owner) → address[]`

**Purpose**: Vaults owned by specific address

**Parameters**:
- `owner` (address): Owner to query

**Returns**: Array of vault addresses

**Gas Cost**: ~20,000

---

#### `getOwnerVaultCount(address owner) → uint256`

**Purpose**: Count of vaults for owner

**Parameters**:
- `owner` (address): Owner to query

**Returns**: Count

**Gas Cost**: ~5,000

---

#### `getVaultAt(uint256 index) → address`

**Purpose**: Get vault at specific index

**Parameters**:
- `index` (uint256): Array index

**Returns**: Vault address

**Reverts**: If index out of bounds

**Gas Cost**: ~5,000

---

#### `isDeployedVault(address vault) → bool`

**Purpose**: Check if address is a vault

**Parameters**:
- `vault` (address): Address to check

**Returns**: true if deployed by factory

**Gas Cost**: ~5,000

---

#### `getStatistics() → (uint256, uint256, uint256)`

**Purpose**: Factory-wide statistics

**Returns** (tuple):
- `totalVaults`: Total deployed
- `totalSafeModeEnabled`: Vaults currently in safe mode
- `totalToggleCount`: Sum of all toggles

**Gas Cost**: ~30,000

---

## Events Reference

### VaultRegisteredForSafeMode
```solidity
event VaultRegisteredForSafeMode(
    address indexed vault,
    address indexed owner,
    uint256 timestamp
);
```
- **Parameters**: 
  - `vault` (indexed): Vault address
  - `owner` (indexed): Owner address
  - `timestamp`: Event timestamp
- **Emitted**: When vault registered
- **Use**: Track new vault enrollments

---

### SafeModeEnabled
```solidity
event SafeModeEnabled(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
- **Parameters**:
  - `vault` (indexed): Affected vault
  - `reason`: Why enabled
  - `timestamp`: When enabled
- **Emitted**: When safe mode activated
- **Use**: Monitor incidents

---

### SafeModeDisabled
```solidity
event SafeModeDisabled(
    address indexed vault,
    string reason,
    uint256 timestamp
);
```
- **Parameters**:
  - `vault` (indexed): Affected vault
  - `reason`: Why disabled
  - `timestamp`: When disabled
- **Emitted**: When safe mode deactivated
- **Use**: Monitor recovery

---

### SafeModeToggleRecorded
```solidity
event SafeModeToggleRecorded(
    address indexed vault,
    bool enabled,
    string reason,
    address indexed toggler,
    uint256 timestamp
);
```
- **Parameters**:
  - `vault` (indexed): Affected vault
  - `enabled`: true=enabled, false=disabled
  - `reason`: Toggle reason
  - `toggler` (indexed): Who initiated
  - `timestamp`: When toggle
- **Emitted**: For every toggle
- **Use**: Complete audit trail

---

## Integration Examples

### Example 1: Emergency Response
```solidity
// Detect issue and lock vault
if (detectedCompromise) {
    controller.enableSafeMode(vault, "Private key compromised");
    
    // Owner can still withdraw
    vault.safeModeWithdraw(address(0), vault.getETHBalance());
}
```

### Example 2: Check Status
```solidity
// Check if vault in safe mode
if (controller.isSafeModeEnabled(vault)) {
    uint256 duration = controller.getSafeModeDuration(vault);
    console.log("Safe mode active for", duration, "seconds");
    
    // Respond accordingly
    if (duration > 1 hours) {
        // Disable if issue resolved
        controller.disableSafeMode(vault, "Threat resolved");
    }
}
```

### Example 3: Deployment
```solidity
// Deploy factory
VaultFactoryWithSafeMode factory = new VaultFactoryWithSafeMode(
    guardianToken,
    vaultImplementation
);

// Deploy vault
address vault = factory.deployVault(2);

// Configure
SpendVaultWithSafeMode(vault).addGuardian(guardian1);
SpendVaultWithSafeMode(vault).addGuardian(guardian2);

// Verify
require(factory.isDeployedVault(vault), "Not deployed");
```

