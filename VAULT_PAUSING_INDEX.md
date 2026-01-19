# Vault Pausing API Index & Function Reference

## Complete Contract API

---

## VaultPausingController

### Vault Registration (Owner Functions)

#### `registerVault(address vault)`
```solidity
function registerVault(address vault) external onlyOwner
```

**Purpose**: Register a vault for pause management

**Parameters**:
- `vault` (address): Address of vault to register

**State Changes**:
- Sets `isManaged[vault] = true`
- Emits `VaultRegistered(vault, timestamp)`

**Access**: Owner only

**Reverts**: 
- None (no validation checks)

**Gas Cost**: ~5,000

**Events**:
```solidity
event VaultRegistered(address indexed vault, uint256 timestamp)
```

**Example**:
```solidity
pausingController.registerVault(address(myVault));
```

---

### Pause Operations

#### `pauseVault(address vault, string reason)`
```solidity
function pauseVault(address vault, string calldata reason) external onlyOwner
```

**Purpose**: Pause withdrawals on a vault

**Parameters**:
- `vault` (address): Vault to pause
- `reason` (string): Human-readable reason for pause

**State Changes**:
```solidity
isPausedVault[vault] = true;
pauseReason[vault] = reason;
pauseTime[vault] = block.timestamp;
pauseHistory[vault].push(PauseEvent({
    isPaused: true,
    reason: reason,
    timestamp: block.timestamp,
    initiator: msg.sender
}));
```

**Access**: Owner only

**Reverts**:
- "Vault not managed by this controller" - if vault not registered
- "Vault already paused" - if already paused

**Gas Cost**: ~18,000

**Events**:
```solidity
event VaultPaused(
    address indexed vault,
    string reason,
    uint256 timestamp
)
```

**Example**:
```solidity
pausingController.pauseVault(vault, "Suspicious transaction detected");
```

---

#### `unpauseVault(address vault, string reason)`
```solidity
function unpauseVault(address vault, string calldata reason) external onlyOwner
```

**Purpose**: Resume withdrawals on a vault

**Parameters**:
- `vault` (address): Vault to unpause
- `reason` (string): Reason for unpausing

**State Changes**:
```solidity
isPausedVault[vault] = false;
pauseReason[vault] = reason;
pauseTime[vault] = 0;
pauseHistory[vault].push(PauseEvent({
    isPaused: false,
    reason: reason,
    timestamp: block.timestamp,
    initiator: msg.sender
}));
```

**Access**: Owner only

**Reverts**:
- "Vault not managed by this controller" - if vault not registered
- "Vault is not paused" - if not currently paused

**Gas Cost**: ~18,000

**Events**:
```solidity
event VaultUnpaused(
    address indexed vault,
    string reason,
    uint256 timestamp
)
```

**Example**:
```solidity
pausingController.unpauseVault(vault, "Issue resolved - all transactions verified");
```

---

#### `updatePauseReason(address vault, string newReason)`
```solidity
function updatePauseReason(address vault, string calldata newReason) external onlyOwner
```

**Purpose**: Update pause reason without un-pausing

**Parameters**:
- `vault` (address): Paused vault
- `newReason` (string): New reason text

**State Changes**:
```solidity
string oldReason = pauseReason[vault];
pauseReason[vault] = newReason;
pauseHistory[vault].push(PauseEvent({
    isPaused: true,
    reason: newReason,
    timestamp: block.timestamp,
    initiator: msg.sender
}));
```

**Access**: Owner only

**Reverts**:
- "Vault not managed by this controller" - if vault not registered
- "Vault is not paused" - if not currently paused

**Gas Cost**: ~10,000

**Events**:
```solidity
event PauseReasonUpdated(
    address indexed vault,
    string oldReason,
    string newReason,
    uint256 timestamp
)
```

**Example**:
```solidity
pausingController.updatePauseReason(vault, "Investigation 30% complete - new evidence found");
```

---

### Status Query Functions (View/Public)

#### `isPaused(address vault) → bool`
```solidity
function isPaused(address vault) external view returns (bool)
```

**Purpose**: Check if vault is currently paused

**Returns**: `true` if paused, `false` if active

**Gas Cost**: ~500

**Example**:
```solidity
if (pausingController.isPaused(vault)) {
    // Vault is paused
}
```

---

#### `getPauseReason(address vault) → string`
```solidity
function getPauseReason(address vault) external view returns (string memory)
```

**Purpose**: Get current pause reason

**Returns**: String with pause reason, empty if not paused

**Gas Cost**: ~2,000

**Example**:
```solidity
string memory reason = pausingController.getPauseReason(vault);
console.log("Pause reason:", reason);
```

---

#### `getPauseTime(address vault) → uint256`
```solidity
function getPauseTime(address vault) external view returns (uint256)
```

**Purpose**: Get Unix timestamp when pause started

**Returns**: Block timestamp of pause start, 0 if not paused

**Gas Cost**: ~500

**Example**:
```solidity
uint256 pauseStartTime = pausingController.getPauseTime(vault);
if (pauseStartTime == 0) {
    // Vault is not paused
} else {
    // Vault paused at pauseStartTime
}
```

---

#### `getPauseElapsedTime(address vault) → uint256`
```solidity
function getPauseElapsedTime(address vault) external view returns (uint256)
```

**Purpose**: Get duration of current pause in seconds

**Calculation**: `block.timestamp - pauseTime[vault]` or 0 if not paused

**Returns**: Seconds elapsed since pause, 0 if not paused

**Gas Cost**: ~700

**Example**:
```solidity
uint256 secondsPaused = pausingController.getPauseElapsedTime(vault);
if (secondsPaused > 1 hours) {
    // Paused for more than 1 hour
}
```

---

#### `getPauseHistory(address vault) → PauseEvent[]`
```solidity
function getPauseHistory(address vault) external view returns (PauseEvent[] memory)
```

**Purpose**: Get complete audit trail of pause/unpause events

**Returns**: Array of `PauseEvent` structs

**Structure**:
```solidity
struct PauseEvent {
    bool isPaused;              // true = pause, false = unpause
    string reason;              // Reason text
    uint256 timestamp;          // When it occurred
    address initiator;          // Who initiated it
}
```

**Gas Cost**: Variable (base 5K + 100 per entry)

**Example**:
```solidity
PauseEvent[] memory history = pausingController.getPauseHistory(vault);
for (uint i = 0; i < history.length; i++) {
    if (history[i].isPaused) {
        console.log("Paused:", history[i].reason);
    } else {
        console.log("Unpaused:", history[i].reason);
    }
}
```

---

#### `isManagedVault(address vault) → bool`
```solidity
function isManagedVault(address vault) external view returns (bool)
```

**Purpose**: Check if vault is registered with controller

**Returns**: `true` if registered, `false` otherwise

**Gas Cost**: ~500

**Example**:
```solidity
require(pausingController.isManagedVault(vault), "Vault not managed");
```

---

## SpendVaultWithPausing

### Pause Status Methods

#### `isVaultPaused() → bool`
```solidity
function isVaultPaused() public view returns (bool)
```

**Purpose**: Check if this vault is paused

**Returns**: `true` if paused

**Implementation**: Calls `pausingController.isPaused(address(this))`

**Gas Cost**: ~500

**Example**:
```solidity
if (myVault.isVaultPaused()) {
    revert("Cannot withdraw during pause");
}
```

---

#### `getVaultPauseReason() → string`
```solidity
function getVaultPauseReason() external view returns (string memory)
```

**Purpose**: Get pause reason for this vault

**Returns**: Pause reason string or empty

**Implementation**: Calls `pausingController.getPauseReason(address(this))`

**Gas Cost**: ~2,000

**Example**:
```solidity
string memory reason = myVault.getVaultPauseReason();
```

---

#### `getVaultPauseTime() → uint256`
```solidity
function getVaultPauseTime() external view returns (uint256)
```

**Purpose**: Get when this vault was paused

**Returns**: Unix timestamp or 0

**Implementation**: Calls `pausingController.getPauseTime(address(this))`

**Gas Cost**: ~500

**Example**:
```solidity
uint256 whenPaused = myVault.getVaultPauseTime();
```

---

#### `getVaultPauseElapsedTime() → uint256`
```solidity
function getVaultPauseElapsedTime() external view returns (uint256)
```

**Purpose**: Get how long vault has been paused

**Returns**: Elapsed seconds or 0

**Implementation**: Calls `pausingController.getPauseElapsedTime(address(this))`

**Gas Cost**: ~700

**Example**:
```solidity
uint256 durationSeconds = myVault.getVaultPauseElapsedTime();
```

---

### Deposit Functions (Unchanged)

#### `deposit(address token, uint256 amount)`
```solidity
function deposit(address token, uint256 amount) external
```

**Purpose**: Deposit ERC-20 tokens (works when paused)

**Parameters**:
- `token` (address): Token address
- `amount` (uint256): Amount to deposit

**Requirements**:
- Token must not be address(0)
- Amount must be > 0
- Caller must have approved transfer

**State Changes**:
- Transfers tokens to vault
- Emits `TokenDeposited` event
- If paused: Also emits `DepositReceivedWhilePaused`

**Gas Cost**: ~40,000-50,000

**Events**:
```solidity
event TokenDeposited(address indexed token, uint256 amount, uint256 timestamp);
event DepositReceivedWhilePaused(address indexed token, uint256 amount, uint256 timestamp);
```

**Example**:
```solidity
// Approve tokens
token.approve(address(myVault), 1000e18);

// Deposit (works even if paused)
myVault.deposit(address(token), 1000e18);
```

---

#### `depositETH()`
```solidity
function depositETH() external payable
```

**Purpose**: Deposit native ETH (works when paused)

**Requirements**:
- `msg.value` must be > 0

**State Changes**:
- Receives ETH into vault
- Emits `ETHDeposited` event
- If paused: Also emits `DepositReceivedWhilePaused`

**Gas Cost**: ~30,000

**Events**:
```solidity
event ETHDeposited(uint256 amount, uint256 timestamp);
event DepositReceivedWhilePaused(address indexed token, uint256 amount, uint256 timestamp);
```

**Example**:
```solidity
// Deposit ETH (works even if paused)
myVault.depositETH{value: 1 ether}();
```

---

### Withdrawal Function (Modified)

#### `withdraw(address token, uint256 amount, address recipient, string reason, bytes[] signatures)`
```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    bytes[] calldata signatures
) external onlyOwner nonReentrant
```

**Purpose**: Execute multi-signature withdrawal (BLOCKED if paused)

**Parameters**:
- `token` (address): Token to withdraw
- `amount` (uint256): Amount to withdraw
- `recipient` (address): Recipient address
- `reason` (string): Reason for withdrawal
- `signatures` (bytes[]): Guardian signatures

**NEW REQUIREMENT**:
```solidity
require(!isVaultPaused(), "Vault is paused - withdrawals disabled");
```

**Requirements**:
- Vault must not be paused ✅ NEW
- Recipient must not be address(0)
- Amount must be > 0
- Must have at least quorum signatures
- Sufficient balance must exist
- Each signer must hold guardian SBT

**State Changes**:
- Increments nonce
- Transfers tokens to recipient
- Emits `Withdrawal` event

**Gas Cost**:
- When paused: ~1,500 (early revert)
- When not paused: ~35,000-60,000 (full withdrawal)

**Reverts When Paused**:
```
"Vault is paused - withdrawals disabled"
```

**Events**:
```solidity
event Withdrawal(address indexed token, uint256 amount, address indexed recipient, string reason, uint256 timestamp);
event WithdrawalAttemptedWhilePaused(address indexed token, uint256 amount, uint256 timestamp);  // If paused
```

**Example**:
```solidity
// This will revert if vault is paused
myVault.withdraw(
    address(token),
    500e18,
    recipient,
    "Treasury dispersal",
    signatures
);

// If paused:
// → Revert "Vault is paused - withdrawals disabled"
```

---

### Emergency Unlock (Modified)

#### `requestEmergencyUnlock()`
```solidity
function requestEmergencyUnlock() external onlyOwner returns (uint256)
```

**Purpose**: Request emergency unlock (BLOCKED if paused)

**NEW REQUIREMENT**:
```solidity
require(!isVaultPaused(), "Vault is paused - emergency unlock disabled");
```

**State Changes**:
```solidity
emergencyUnlockRequestTime = block.timestamp;
```

**Returns**: 0

**Gas Cost**: ~2,000

**Reverts When Paused**:
```
"Vault is paused - emergency unlock disabled"
```

**Events**:
```solidity
event EmergencyUnlockRequested(uint256 timestamp);
```

**Example**:
```solidity
// Works when not paused
myVault.requestEmergencyUnlock();

// Reverts when paused
// → Revert "Vault is paused - emergency unlock disabled"
```

---

#### `cancelEmergencyUnlock()`
```solidity
function cancelEmergencyUnlock() external onlyOwner
```

**Purpose**: Cancel pending emergency unlock

**Requirements**:
- Emergency unlock must have been requested

**State Changes**:
```solidity
emergencyUnlockRequestTime = 0;
```

**Gas Cost**: ~3,000

**Events**:
```solidity
event EmergencyUnlockCancelled(uint256 timestamp);
```

**Example**:
```solidity
myVault.cancelEmergencyUnlock();
```

---

### Configuration Functions

#### `setQuorum(uint256 newQuorum)`
```solidity
function setQuorum(uint256 _newQuorum) external onlyOwner
```

**Purpose**: Update required guardian quorum

**Parameters**:
- `newQuorum` (uint256): New quorum requirement

**Requirements**:
- Must be at least 1

**Gas Cost**: ~5,000

**Events**:
```solidity
event QuorumUpdated(uint256 newQuorum, uint256 timestamp);
```

---

#### `updateGuardianToken(address newAddress)`
```solidity
function updateGuardianToken(address _newAddress) external onlyOwner
```

**Purpose**: Update guardian SBT address

**Parameters**:
- `newAddress` (address): New guardian token address

**Gas Cost**: ~5,000

**Events**:
```solidity
event GuardianTokenUpdated(address newAddress, uint256 timestamp);
```

---

#### `updatePausingController(address newAddress)`
```solidity
function updatePausingController(address _newAddress) external onlyOwner
```

**Purpose**: Update pausing controller address

**Parameters**:
- `newAddress` (address): New controller address

**Gas Cost**: ~5,000

**Events**:
```solidity
event PausingControllerUpdated(address newAddress, uint256 timestamp);
```

---

### Balance Query Functions

#### `getETHBalance() → uint256`
```solidity
function getETHBalance() external view returns (uint256)
```

**Purpose**: Get vault's ETH balance

**Returns**: Balance in wei

**Gas Cost**: ~100

---

#### `getTokenBalance(address token) → uint256`
```solidity
function getTokenBalance(address token) external view returns (uint256)
```

**Purpose**: Get vault's ERC-20 token balance

**Parameters**:
- `token` (address): Token address

**Returns**: Balance in smallest units

**Gas Cost**: ~2,000

---

### Utility Functions

#### `getDomainSeparator() → bytes32`
```solidity
function getDomainSeparator() external view returns (bytes32)
```

**Purpose**: Get EIP-712 domain separator

**Returns**: Bytes32 domain separator

**Gas Cost**: ~500

---

#### `getNonce() → uint256`
```solidity
function getNonce() external view returns (uint256)
```

**Purpose**: Get current withdrawal nonce

**Returns**: Current nonce value

**Gas Cost**: ~100

---

#### `isPausedByController() → bool`
```solidity
function isPausedByController() external view returns (bool)
```

**Purpose**: Check if managed by controller

**Returns**: `true` if controlled

**Gas Cost**: ~500

---

## VaultFactoryWithPausing

### Vault Creation

#### `createVault(uint256 quorum) → address`
```solidity
function createVault(uint256 quorum) external returns (address)
```

**Purpose**: Deploy new vault with pausing capability

**Parameters**:
- `quorum` (uint256): Required guardians for withdrawal

**Returns**: Address of new SpendVaultWithPausing

**Operations**:
1. Deploy SpendVaultWithPausing
2. Transfer ownership to caller
3. Register with controller
4. Track in userVaults
5. Increment counter

**Requirements**:
- Quorum must be > 0

**Gas Cost**: ~150,000-200,000

**Events**:
```solidity
event VaultCreated(
    address indexed vault,
    address indexed owner,
    uint256 quorum,
    uint256 vaultNumber,
    uint256 timestamp
)
```

**Example**:
```solidity
address myVault = factory.createVault(2);
```

---

### Vault Query Functions

#### `isManagedVault(address vault) → bool`
```solidity
function isManagedVault(address vault) external view returns (bool)
```

**Purpose**: Check if address is factory-created vault

**Returns**: `true` if managed

**Gas Cost**: ~500

---

#### `isVaultPaused(address vault) → bool`
```solidity
function isVaultPaused(address vault) external view returns (bool)
```

**Purpose**: Check if managed vault is paused

**Requirements**:
- Vault must be managed

**Returns**: `true` if paused

**Gas Cost**: ~500

**Example**:
```solidity
require(!factory.isVaultPaused(myVault), "Vault paused");
```

---

#### `getVaultPauseReason(address vault) → string`
```solidity
function getVaultPauseReason(address vault) external view returns (string memory)
```

**Purpose**: Get pause reason for managed vault

**Requirements**:
- Vault must be managed

**Returns**: Pause reason string

**Gas Cost**: ~2,000

---

#### `getVaultPauseElapsedTime(address vault) → uint256`
```solidity
function getVaultPauseElapsedTime(address vault) external view returns (uint256)
```

**Purpose**: Get pause duration for managed vault

**Requirements**:
- Vault must be managed

**Returns**: Elapsed seconds

**Gas Cost**: ~700

---

### User Vault Tracking

#### `getUserVaults(address user) → address[]`
```solidity
function getUserVaults(address user) external view returns (address[] memory)
```

**Purpose**: Get all vaults created by user

**Parameters**:
- `user` (address): User address

**Returns**: Array of vault addresses

**Gas Cost**: ~2,000 + 100 per vault

---

#### `getUserVaultCount(address user) → uint256`
```solidity
function getUserVaultCount(address user) external view returns (uint256)
```

**Purpose**: Get count of user's vaults

**Returns**: Number of vaults

**Gas Cost**: ~500

---

#### `getUserVaultAt(address user, uint256 index) → address`
```solidity
function getUserVaultAt(address user, uint256 index) external view returns (address)
```

**Purpose**: Get user's vault at index

**Parameters**:
- `user` (address): User address
- `index` (uint256): Array index

**Returns**: Vault address at index

**Gas Cost**: ~1,000

---

### Controller Access

#### `getPausingController() → address`
```solidity
function getPausingController() external view returns (address)
```

**Purpose**: Get shared controller address

**Returns**: VaultPausingController address

**Gas Cost**: ~100

---

### Global Queries

#### `getVaultCount() → uint256`
```solidity
function getVaultCount() external view returns (uint256)
```

**Purpose**: Get total vaults deployed

**Returns**: Total count

**Gas Cost**: ~100

---

#### `getAllVaults() → address[]`
```solidity
function getAllVaults() external view returns (address[] memory)
```

**Purpose**: Get all vaults ever created

**Returns**: Array of all vault addresses

**Gas Cost**: ~2,000 + 100 per vault

---

## Data Types

### PauseEvent

```solidity
struct PauseEvent {
    bool isPaused;              // true = pause activated, false = pause lifted
    string reason;              // Human-readable reason
    uint256 timestamp;          // When event occurred (Unix timestamp)
    address initiator;          // Who initiated the event (msg.sender)
}
```

---

## Event Reference

### VaultPausingController Events

```solidity
event VaultRegistered(address indexed vault, uint256 timestamp);

event VaultPaused(
    address indexed vault,
    string reason,
    uint256 timestamp
);

event VaultUnpaused(
    address indexed vault,
    string reason,
    uint256 timestamp
);

event PauseReasonUpdated(
    address indexed vault,
    string oldReason,
    string newReason,
    uint256 timestamp
);
```

### SpendVaultWithPausing Events

```solidity
event WithdrawalAttemptedWhilePaused(
    address indexed token,
    uint256 amount,
    uint256 timestamp
);

event DepositReceivedWhilePaused(
    address indexed token,
    uint256 amount,
    uint256 timestamp
);

event TokenDeposited(
    address indexed token,
    uint256 amount,
    uint256 timestamp
);

event ETHDeposited(
    uint256 amount,
    uint256 timestamp
);

event Withdrawal(
    address indexed token,
    uint256 amount,
    address indexed recipient,
    string reason,
    uint256 timestamp
);

event QuorumUpdated(uint256 newQuorum, uint256 timestamp);
event GuardianTokenUpdated(address newAddress, uint256 timestamp);
event PausingControllerUpdated(address newAddress, uint256 timestamp);
```

### VaultFactoryWithPausing Events

```solidity
event VaultCreated(
    address indexed vault,
    address indexed owner,
    uint256 quorum,
    uint256 vaultNumber,
    uint256 timestamp
);

event PausingControllerDeployed(address indexed controller, uint256 timestamp);
event GuardianSBTUpdated(address newAddress, uint256 timestamp);
```

---

## Error Messages

### VaultPausingController

```
"Vault not managed by this controller"          → Vault not registered
"Vault already paused"                           → Attempt to pause already-paused
"Vault is not paused"                            → Attempt to unpause not-paused
"Invalid vault"                                  → Null address vault
```

### SpendVaultWithPausing

```
"Vault is paused - withdrawals disabled"         → Withdraw when paused
"Vault is paused - emergency unlock disabled"    → Emergency unlock when paused
"Invalid recipient"                              → Recipient is address(0)
"Amount must be greater than 0"                  → Amount is 0
"Insufficient signatures"                        → Fewer than quorum signatures
"Invalid guardian"                               → Signer doesn't hold SBT
"Duplicate signature"                            → Same address signed twice
"Insufficient ETH balance"                       → Not enough ETH
"Insufficient token balance"                     → Not enough tokens
"ETH transfer failed"                            → ETH transfer reverted
"Token transfer failed"                          → ERC-20 transfer reverted
"Transfer failed"                                → ERC-20 approval failed
```

---

## Return Values Summary

| Function | Returns | Type | Default |
|----------|---------|------|---------|
| `isPaused()` | Pause state | bool | false |
| `getPauseReason()` | Reason text | string | "" |
| `getPauseTime()` | Unix timestamp | uint256 | 0 |
| `getPauseElapsedTime()` | Seconds | uint256 | 0 |
| `getPauseHistory()` | Event array | PauseEvent[] | [] |
| `isManagedVault()` | Registration | bool | false |
| `createVault()` | Vault address | address | N/A |
| `getVaultCount()` | Count | uint256 | 0 |
| `getUserVaultCount()` | Count | uint256 | 0 |
| `getNonce()` | Nonce value | uint256 | 0 |

---

## Access Control Matrix

| Function | Owner | Guardian | Public | View |
|----------|-------|----------|--------|------|
| `pauseVault()` | ✅ | ❌ | ❌ | ❌ |
| `unpauseVault()` | ✅ | ❌ | ❌ | ❌ |
| `updatePauseReason()` | ✅ | ❌ | ❌ | ❌ |
| `isPaused()` | ✅ | ✅ | ✅ | ✅ |
| `getPauseReason()` | ✅ | ✅ | ✅ | ✅ |
| `withdraw()` | ✅ | ❌ | ❌ | ❌ |
| `deposit()` | ✅ | ✅ | ✅ | ❌ |
| `createVault()` | ✅ | ✅ | ✅ | ❌ |

---

## Common Patterns

### Check and Pause
```solidity
if (!pausingController.isPaused(vault)) {
    pausingController.pauseVault(vault, "Reason");
}
```

### Get Full Status
```solidity
bool paused = pausingController.isPaused(vault);
string memory reason = pausingController.getPauseReason(vault);
uint256 elapsed = pausingController.getPauseElapsedTime(vault);
```

### Recent History
```solidity
PauseEvent[] memory history = pausingController.getPauseHistory(vault);
uint256 count = history.length;
PauseEvent memory latest = history[count - 1];
```

### Safe Withdrawal
```solidity
require(!vault.isVaultPaused(), "Vault is paused");
vault.withdraw(token, amount, recipient, reason, signatures);
```

---

## Gas Optimization Tips

- Cache `isPaused()` result in local variable
- Use `updatePauseReason()` instead of unpause+pause cycle
- Filter history results instead of retrieving entire array
- Batch pause operations on multiple vaults in separate txns
- Monitor `getPauseHistory()` size for large deployments

