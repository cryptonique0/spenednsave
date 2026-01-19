# Feature #14: Social Recovery - Contract Index

## Overview

Feature #14 provides guardian-based owner recovery through three integrated smart contracts:
1. **GuardianSocialRecovery** - Core recovery voting mechanism
2. **SpendVaultWithSocialRecovery** - Vault with recovery capability
3. **VaultFactoryWithSocialRecovery** - Factory for vault deployment

---

## Contract 1: GuardianSocialRecovery

**File**: `contracts/GuardianSocialRecovery.sol`
**Lines**: 420+
**Purpose**: Central recovery service managing owner reset voting
**Deployment**: Single instance per network
**Gas**: ~2M for full recovery flow

### Type Definitions

#### RecoveryStatus Enum
```solidity
enum RecoveryStatus {
    NONE,        // 0 - No recovery exists
    PENDING,     // 1 - Voting in progress
    APPROVED,    // 2 - Quorum reached, in timelock
    EXECUTED,    // 3 - Owner changed
    CANCELLED    // 4 - Cancelled by initiator/vault
}
```

#### OwnerRecovery Struct (Storage)
```solidity
struct OwnerRecovery {
    uint256 recoveryId;                    // Auto-incremented ID
    address vault;                         // Target vault address
    address newOwner;                      // Proposed new owner
    address initiator;                     // Guardian who initiated
    uint256 initiatedAt;                   // Timestamp of start
    uint256 votingDeadline;                // End of voting (initiated + 7 days)
    uint256 timelockExpiration;            // Execution available (approved + 7 days)
    uint256 approvalsCount;                // Current vote count
    RecoveryStatus status;                 // Current status
    mapping(address => bool) hasVoted;     // Vote tracking
    bool executed;                         // Execution flag
    uint256 executedAt;                    // Execution timestamp
    string reason;                         // Recovery reason text
}
```

#### RecoveryView Struct (View)
```solidity
struct RecoveryView {
    uint256 recoveryId;
    address vault;
    address newOwner;
    address initiator;
    uint256 initiatedAt;
    uint256 votingDeadline;
    uint256 timelockExpiration;
    uint256 approvalsCount;
    RecoveryStatus status;
    bool executed;
    uint256 executedAt;
    uint256 secondsUntilVotingEnd;      // Computed
    uint256 secondsUntilExecution;      // Computed
    string reason;
}
```

### State Variables

```solidity
uint256 public constant VOTING_PERIOD = 7 days;      // 604,800 seconds
uint256 public constant TIMELOCK_DURATION = 7 days;  // 604,800 seconds
uint256 public recoveryCounter = 0;                  // Next recovery ID

mapping(uint256 recoveryId => OwnerRecovery) public recoveries;
mapping(address vault => uint256[]) public vaultRecoveries;
mapping(address vault => uint256) public vaultQuorum;
mapping(address vault => address) public recoveryGuardianToken;

address[] public managedVaults;
mapping(address vault => bool) public isManaged;

mapping(address vault => uint256) public totalRecoveryAttempts;
mapping(address vault => uint256) public successfulRecoveries;
```

### Public Functions

#### `registerVault(address vault, uint256 quorum, address guardianToken)`
**Access**: External
**Returns**: void
**Gas**: ~20K

Registers a vault for social recovery capability.

**Parameters**:
- `vault`: Address to enable recovery for
- `quorum`: Number of guardians needed to approve recovery
- `guardianToken`: Guardian SBT contract address

**Requirements**:
- vault != address(0)
- guardianToken != address(0)
- quorum > 0
- !isManaged[vault]

**Events**: VaultRegisteredForRecovery

**Example**:
```solidity
recovery.registerVault(
    0x1234...5678,           // vault
    2,                       // quorum (2 of N)
    0xabcd...efgh            // guardianSBT
);
```

---

#### `initiateRecovery(address vault, address newOwner, string reason)`
**Access**: External (guardians only)
**Returns**: uint256 recoveryId
**Gas**: ~150K

Initiates a recovery process for vault owner reset.

**Parameters**:
- `vault`: Vault requiring recovery
- `newOwner`: Proposed new owner address
- `reason`: Description of why recovery needed

**Requirements**:
- isManaged[vault]
- newOwner != address(0)
- bytes(reason).length > 0
- msg.sender has guardian SBT

**Sets**:
- status = PENDING
- votingDeadline = now + 7 days
- approvalsCount = 1 (initiator)
- initiatedAt = now

**Events**: RecoveryInitiated

**Example**:
```solidity
uint256 recoveryId = recovery.initiateRecovery(
    vaultAddress,
    newOwnerAddress,
    "Owner lost hardware wallet containing private key"
);
```

---

#### `approveRecovery(uint256 recoveryId)`
**Access**: External (guardians only)
**Returns**: bool (true if quorum reached)
**Gas**: ~30K per vote

Guardian votes to approve recovery.

**Parameters**:
- `recoveryId`: Recovery to vote on

**Requirements**:
- recovery.vault != address(0)
- recovery.status == PENDING
- block.timestamp <= votingDeadline
- !hasVoted[msg.sender]
- msg.sender has guardian SBT

**Updates**:
- approvalsCount++
- hasVoted[msg.sender] = true

**On Quorum Reached**:
- status = APPROVED
- timelockExpiration = now + 7 days

**Events**: RecoveryVoteReceived, (optionally) RecoveryQuorumReached

**Example**:
```solidity
bool quorumReached = recovery.approveRecovery(recoveryId);
if (quorumReached) {
    // Recovery now waiting for 7-day timelock
}
```

---

#### `executeRecovery(uint256 recoveryId, address vault)`
**Access**: External (anyone)
**Returns**: void
**Gas**: ~40K

Executes owner reset after timelock expires.

**Parameters**:
- `recoveryId`: Recovery to execute
- `vault`: Vault being recovered

**Requirements**:
- recovery.vault != address(0)
- recovery.vault == vault
- recovery.status == APPROVED
- !recovery.executed
- block.timestamp >= timelockExpiration

**Updates**:
- executed = true
- status = EXECUTED
- executedAt = now
- successfulRecoveries[vault]++

**Calls**: vault.resetOwnerViaSocial(newOwner, recoveryId)

**Events**: RecoveryExecuted

**Example**:
```solidity
// After 7-day timelock expires
recovery.executeRecovery(recoveryId, vaultAddress);
// Owner is now newOwner
```

---

#### `cancelRecovery(uint256 recoveryId, string reason)`
**Access**: External
**Returns**: void
**Gas**: ~10K

Cancels pending recovery.

**Parameters**:
- `recoveryId`: Recovery to cancel
- `reason`: Cancellation reason

**Requirements**:
- recovery.vault != address(0)
- recovery.status == PENDING
- msg.sender == initiator OR msg.sender == vault

**Updates**:
- status = CANCELLED

**Events**: RecoveryCancelled

**Example**:
```solidity
recovery.cancelRecovery(recoveryId, "Found original key, false alarm");
```

---

### Query Functions

#### `getRecovery(uint256 recoveryId)`
**Returns**: RecoveryView memory
**Gas**: ~5K

```solidity
RecoveryView memory r = recovery.getRecovery(recoveryId);
require(r.vault != address(0), "Not found");
```

Returns all recovery details with computed time remaining.

---

#### `hasVoted(uint256 recoveryId, address voter)`
**Returns**: bool
**Gas**: ~2K

Checks if guardian has voted on recovery.

---

#### `approvalsNeeded(uint256 recoveryId)`
**Returns**: uint256
**Gas**: ~3K

Returns approvals still needed to reach quorum.

```solidity
uint256 needed = recovery.approvalsNeeded(recoveryId);
if (needed == 0) {
    // Quorum already reached
}
```

---

#### `getVaultRecoveries(address vault)`
**Returns**: uint256[] memory
**Gas**: ~3K

All recovery IDs for vault.

---

#### `getRecoveryCount(address vault)`
**Returns**: uint256
**Gas**: ~2K

Number of recovery attempts for vault.

---

#### `getRecoveryStats(address vault)`
**Returns**: (uint256 totalAttempts, uint256 successful, uint256 successRate)
**Gas**: ~3K

Statistics for vault recoveries.

```solidity
(uint256 attempts, uint256 successful, uint256 rate) 
    = recovery.getRecoveryStats(vault);
console.log("Success rate:", rate, "%");
```

---

#### `getVaultQuorum(address vault)`
**Returns**: uint256
**Gas**: ~2K

Guardians needed for recovery approval.

---

#### `updateVaultQuorum(address vault, uint256 newQuorum)`
**Access**: External
**Gas**: ~5K

Changes recovery quorum for vault.

**Requirements**:
- isManaged[vault]
- newQuorum > 0

---

#### `getVotingTimeRemaining(uint256 recoveryId)`
**Returns**: uint256 (seconds)
**Gas**: ~3K

Seconds until voting deadline. Returns 0 if deadline passed or recovery not pending.

```solidity
uint256 secondsLeft = recovery.getVotingTimeRemaining(recoveryId);
if (secondsLeft > 0) {
    console.log("Voting ends in", secondsLeft / 60 / 60 / 24, "days");
}
```

---

#### `getTimelockRemaining(uint256 recoveryId)`
**Returns**: uint256 (seconds)
**Gas**: ~3K

Seconds until execution allowed. Returns 0 if timelock expired or recovery not approved.

---

#### `canExecuteNow(uint256 recoveryId)`
**Returns**: bool
**Gas**: ~3K

True if all execution conditions met.

```solidity
if (recovery.canExecuteNow(recoveryId)) {
    recovery.executeRecovery(recoveryId, vault);
}
```

---

### Events

```solidity
event RecoveryInitiated(
    uint256 indexed recoveryId,
    address indexed vault,
    address indexed newOwner,
    address initiator,
    string reason,
    uint256 votingDeadline,
    uint256 timestamp
);

event RecoveryVoteReceived(
    uint256 indexed recoveryId,
    address indexed voter,
    uint256 approvalsCount,
    uint256 timestamp
);

event RecoveryQuorumReached(
    uint256 indexed recoveryId,
    uint256 approvalsCount,
    uint256 timelockExpiration,
    uint256 timestamp
);

event RecoveryExecuted(
    uint256 indexed recoveryId,
    address indexed vault,
    address newOwner,
    uint256 timestamp
);

event RecoveryCancelled(
    uint256 indexed recoveryId,
    string reason,
    uint256 timestamp
);

event VaultRegisteredForRecovery(
    address indexed vault,
    uint256 quorum,
    address guardianToken,
    uint256 timestamp
);
```

---

## Contract 2: SpendVaultWithSocialRecovery

**File**: `contracts/SpendVaultWithSocialRecovery.sol`
**Lines**: 480+
**Purpose**: Multi-sig vault with social recovery capability
**Extends**: EIP712 (for signature verification)
**Deployment**: One per user vault

### Type Definitions

#### Withdrawal Struct
```solidity
struct Withdrawal {
    uint256 amount;
    address recipient;
    address token;
    bytes32 reasonHash;
    bytes32 categoryHash;
    uint256 nonce;
    uint256 expiration;
}
```

#### VaultStatus Enum
```solidity
enum VaultStatus {
    ACTIVE,     // 0 - Normal operations
    PAUSED,     // 1 - No transactions allowed
    FROZEN      // 2 - Emergency freeze
}
```

### State Variables

```solidity
address public vault;                              // Self-address
address public owner;                              // Current owner
address[] public guardians;                        // Vault guardians
address public socialRecoveryContract;             // Recovery contract
address public emergencyGuardian;                  // Emergency override
uint256 public requiredSignatures;                 // Sigs for approval
VaultStatus public status;                         // Vault state
uint256 public nonce = 0;                          // Withdrawal counter

mapping(address => bool) public isGuardian;
mapping(address => uint256) public tokenBalances;
mapping(bytes32 => bool) public executedWithdrawals;

bytes32 private constant WITHDRAWAL_TYPEHASH = 
    keccak256("Withdrawal(uint256 amount,address recipient,address token,bytes32 reasonHash,bytes32 categoryHash,uint256 nonce,uint256 expiration)");
```

### Constructor

```solidity
constructor(
    address _owner,
    address[] memory _guardians,
    uint256 _requiredSignatures,
    address _socialRecoveryContract,
    address _emergencyGuardian
) EIP712("SpendVaultWithSocialRecovery", "1")
```

**Parameters**:
- `_owner`: Vault owner
- `_guardians`: Guardian addresses (must have SBT)
- `_requiredSignatures`: Signatures needed for withdrawals
- `_socialRecoveryContract`: Recovery contract address
- `_emergencyGuardian`: Emergency freeze address

**Requires**:
- All addresses non-zero
- At least 1 guardian
- 0 < requiredSignatures <= guardians.length

---

### Access Control Modifiers

```solidity
modifier onlyOwner()            // msg.sender == owner
modifier onlyGuardian()         // isGuardian[msg.sender]
modifier onlyRecoveryContract() // msg.sender == socialRecoveryContract
modifier onlyWhenActive()       // status == ACTIVE
```

---

### Deposit Functions

#### `depositToken(address token, uint256 amount)`
**Access**: External
**Gas**: ~50K

Deposit ERC20 tokens.

```solidity
vault.depositToken(tokenAddress, amount);
```

---

#### `depositETH()`
**Access**: External (payable)
**Gas**: ~5K

Deposit native ETH.

```solidity
vault.depositETH{value: msg.value}();
```

---

#### `receive()`
**Gas**: ~5K

Automatic ETH deposit via transfer.

---

### Withdrawal Functions

#### `withdraw(...)`
**Access**: External (onlyWhenActive)
**Gas**: ~120K

Withdraw tokens with multi-sig approval.

```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    bytes32 reasonHash,
    bytes32 categoryHash,
    bytes calldata signatures
) external onlyWhenActive
```

**Parameters**:
- `token`: Token to withdraw (address(0) for ETH)
- `amount`: Amount to withdraw
- `recipient`: Recipient address
- `reasonHash`: Hash of withdrawal reason
- `categoryHash`: Hash of withdrawal category
- `signatures`: Packed signatures from guardians

**Requirements**:
- amount > 0
- recipient != address(0)
- tokenBalances[token] >= amount
- Expiration not passed
- Not already executed
- Valid signatures from required guardians

**Updates**:
- tokenBalances[token] -= amount
- nonce++
- executedWithdrawals[messageHash] = true

**Effects**:
- Transfers tokens to recipient

**Events**: WithdrawalExecuted

---

### Social Recovery Functions

#### `resetOwnerViaSocial(address newOwner, uint256 recoveryId)`
**Access**: External (onlyRecoveryContract)
**Gas**: ~15K

Called by recovery contract to change owner.

**Parameters**:
- `newOwner`: New owner address
- `recoveryId`: Recovery ID for audit trail

**Requirements**:
- newOwner != address(0)
- newOwner != owner

**Updates**:
- owner = newOwner

**Events**: OwnerRecoveredViaSocial, OwnerChanged

**Note**: Only recovery contract can call this.

---

#### `getRecoveryContract()`
**Returns**: address
**Gas**: ~2K

Returns recovery contract address.

---

#### `hasSocialRecoveryEnabled()`
**Returns**: bool
**Gas**: ~2K

True if recovery contract set.

---

### Guardian Management

#### `addGuardian(address guardian)`
**Access**: External (onlyOwner)
**Gas**: ~25K

Add guardian to vault.

---

#### `removeGuardian(address guardian)`
**Access**: External (onlyOwner)
**Gas**: ~15K

Remove guardian (if enough remain for required signatures).

---

#### `getGuardians()`
**Returns**: address[] memory
**Gas**: ~3K

All guardians.

---

#### `getGuardianCount()`
**Returns**: uint256
**Gas**: ~2K

Number of guardians.

---

### Pause Control

#### `pauseVault()`
**Access**: External (onlyOwner)
**Gas**: ~10K

Pause vault (blocks withdrawals).

---

#### `resumeVault()`
**Access**: External (onlyOwner)
**Gas**: ~10K

Resume vault.

---

#### `isPaused()`
**Returns**: bool
**Gas**: ~2K

---

#### `isFrozen()`
**Returns**: bool
**Gas**: ~2K

---

### Emergency Functions

#### `emergencyFreeze()`
**Access**: External (emergencyGuardian only)
**Gas**: ~10K

Emergency guardian can freeze vault immediately.

**Status**: FROZEN (blocks all operations)

---

### Query Functions

#### `getBalance(address token)`
**Returns**: uint256
**Gas**: ~2K

Token balance in vault.

---

#### `getETHBalance()`
**Returns**: uint256
**Gas**: ~2K

ETH balance.

---

#### `getOwner()`
**Returns**: address
**Gas**: ~2K

Current owner.

---

#### `getNonce()`
**Returns**: uint256
**Gas**: ~2K

Next withdrawal nonce.

---

#### `getStatus()`
**Returns**: VaultStatus
**Gas**: ~2K

Current vault status (ACTIVE/PAUSED/FROZEN).

---

### Events

```solidity
event WithdrawalExecuted(
    address indexed recipient,
    uint256 amount,
    address indexed token,
    bytes32 reasonHash,
    bytes32 categoryHash,
    uint256 timestamp
);

event GuardianAdded(address indexed guardian, uint256 timestamp);
event GuardianRemoved(address indexed guardian, uint256 timestamp);
event OwnerChanged(address indexed newOwner, uint256 timestamp);

event OwnerRecoveredViaSocial(
    address indexed newOwner,
    uint256 recoveryId,
    uint256 timestamp
);

event EmergencyFrozen(address indexed frozenBy, uint256 timestamp);
event VaultPaused(address indexed pausedBy, uint256 timestamp);
event VaultResumed(address indexed resumedBy, uint256 timestamp);
```

---

## Contract 3: VaultFactoryWithSocialRecovery

**File**: `contracts/VaultFactoryWithSocialRecovery.sol`
**Lines**: 520+
**Purpose**: Factory deploying vaults with social recovery
**Deployment**: Single instance per network

### Type Definitions

#### VaultInfo Struct
```solidity
struct VaultInfo {
    address vaultAddress;
    address owner;
    address[] guardians;
    uint256 requiredSignatures;
    address emergencyGuardian;
    uint256 createdAt;
    bool isActive;
}
```

### State Variables

```solidity
GuardianSocialRecovery public recoveryContract;
IGuardianSBT public guardianSBT;

address[] public deployedVaults;
mapping(address => VaultInfo) public vaultInfo;
mapping(address => bool) public isDeployedByFactory;
mapping(address owner => address[]) public ownerVaults;

uint256 public vaultCount = 0;
uint256 public defaultRecoveryQuorum = 2;
```

### Constructor

```solidity
constructor(
    address _recoveryContract,
    address _guardianSBT
)
```

---

### Deployment Functions

#### `deployVault(...)`
**Access**: External
**Returns**: address (new vault address)
**Gas**: ~500K

Deploy vault with default recovery quorum.

```solidity
address newVault = factory.deployVault(
    owner,
    guardians,
    requiredSignatures,
    emergencyGuardian
);
```

**Parameters**:
- `owner`: Vault owner
- `guardians`: Guardian addresses
- `requiredSignatures`: Sigs for withdrawal approval
- `emergencyGuardian`: Emergency freeze address

**Requirements**:
- owner != address(0)
- guardians.length >= 1
- 0 < requiredSignatures <= guardians.length
- All guardians hold guardian SBT

**Actions**:
1. Deploy SpendVaultWithSocialRecovery
2. Register in factory
3. Register with recovery contract
4. Track ownership mapping

**Events**: VaultDeployed, VaultRegisteredForRecovery

---

#### `deployVaultWithCustomQuorum(..., uint256 recoveryQuorum)`
**Access**: External
**Returns**: address
**Gas**: ~520K

Deploy vault with custom recovery quorum.

---

### Vault Management

#### `getVaultCount()`
**Returns**: uint256
**Gas**: ~2K

Total vaults deployed.

---

#### `getVaultAt(uint256 index)`
**Returns**: address
**Gas**: ~3K

Vault at index.

---

#### `getAllVaults()`
**Returns**: address[] memory
**Gas**: ~3K

All vault addresses.

---

#### `getOwnerVaults(address owner)`
**Returns**: address[] memory
**Gas**: ~3K

All vaults owned by address.

---

#### `getVaultInfo(address vault)`
**Returns**: VaultInfo memory
**Gas**: ~5K

Full vault information.

---

#### `isVaultDeployed(address vault)`
**Returns**: bool
**Gas**: ~2K

Check if factory deployed vault.

---

#### `getVaultOwner(address vault)`
**Returns**: address
**Gas**: ~3K

Vault owner.

---

#### `getVaultGuardians(address vault)`
**Returns**: address[] memory
**Gas**: ~3K

Vault guardians.

---

#### `getRequiredSignatures(address vault)`
**Returns**: uint256
**Gas**: ~2K

Signatures needed for vault withdrawals.

---

#### `isVaultOwner(address vault, address account)`
**Returns**: bool
**Gas**: ~3K

---

#### `isVaultGuardian(address vault, address account)`
**Returns**: bool
**Gas**: ~3K

---

#### `getGuardianCount(address vault)`
**Returns**: uint256
**Gas**: ~2K

Number of guardians.

---

#### `deactivateVault(address vault)`
**Access**: External (vault owner only)
**Gas**: ~10K

---

#### `isVaultActive(address vault)`
**Returns**: bool
**Gas**: ~2K

---

### Recovery Management

#### `getRecoveryContract()`
**Returns**: address
**Gas**: ~2K

---

#### `getRecoveryQuorum(address vault)`
**Returns**: uint256
**Gas**: ~2K

---

#### `updateDefaultRecoveryQuorum(uint256 newQuorum)`
**Access**: External
**Gas**: ~5K

Change default for new vaults.

---

#### `updateVaultRecoveryQuorum(address vault, uint256 newQuorum)`
**Access**: External (vault owner only)
**Gas**: ~10K

Change quorum for existing vault.

---

#### `getRecoveryStats(address vault)`
**Returns**: (uint256 attempts, uint256 successful, uint256 rate)
**Gas**: ~3K

---

### Statistics

#### `getTotalVaults()`
**Returns**: uint256
**Gas**: ~2K

---

#### `getOwnerVaultCount(address owner)`
**Returns**: uint256
**Gas**: ~2K

---

#### `getAverageGuardianCount()`
**Returns**: uint256
**Gas**: ~10K

Average guardians across all vaults.

---

#### `getDeploymentSummary()`
**Returns**: (uint256 total, uint256 active, uint256 totalGuardians)
**Gas**: ~15K

Overall statistics.

---

### Events

```solidity
event VaultDeployed(
    address indexed vaultAddress,
    address indexed owner,
    address[] guardians,
    uint256 requiredSignatures,
    uint256 timestamp
);

event VaultRegisteredForRecovery(
    address indexed vaultAddress,
    uint256 quorum,
    uint256 timestamp
);

event VaultDeactivated(
    address indexed vaultAddress,
    uint256 timestamp
);
```

---

## Integration Flow

### Deploy Sequence
```
1. Deploy GuardianSBT (if needed)
   └─ Mint to initial guardians

2. Deploy GuardianSocialRecovery
   └─ Ready to register vaults

3. Deploy VaultFactoryWithSocialRecovery
   └─ Pass recovery contract + SBT addresses

4. Deploy vault via factory
   └─ Auto-registers with recovery
   └─ Ready for operation

5. Use vault
   └─ Deposits/withdrawals work
   └─ Recovery available if needed
```

---

## Cross-Feature Compatibility

### With Feature #13 (Reason Hashing)
- Vault accepts reasonHash, categoryHash
- Same parameters as WithdrawalProposalManagerWithReasonHashing
- Recovery independent of reason hashing
- Both features work in same vault

### With Feature #11-12 (Proposals)
- Factory creates vaults compatible with proposal managers
- Recovery contract separate from proposal voting
- Both voting systems independent

### With Feature #10 (Pausing)
- Status enum includes PAUSED
- pauseVault() / resumeVault() work
- Recovery executable even if vault paused

### With Features #1-9
- Guardians validated via SBT (Feature #1)
- Emergency guardian can freeze (Feature #5-8)
- Rotation still tracked per guardian

---

## Migration Guide

### From SpendVaultWithEmergencyOverride
```solidity
// Old:
SpendVaultWithEmergencyOverride vault = 
    new SpendVaultWithEmergencyOverride(...);

// New:
SpendVaultWithSocialRecovery vault = 
    factory.deployVault(...);

// Benefits:
// - Automatic recovery registration
// - Social recovery capability
// - Maintained emergency freeze
// - Better factory tracking
```

---

## Testing Scenarios

### Scenario 1: Full Recovery
```
Setup: 3 guardians, 2 quorum
1. Guardian 1 initiates recovery
2. Guardian 2 votes → quorum reached
3. Wait 7 days
4. Execute → owner changed
Result: Success
```

### Scenario 2: Withdrawal After Recovery
```
1. Execute recovery (owner changed)
2. New owner + guardians withdraw
3. Withdrawal succeeds
Result: Recovery doesn't block withdrawals
```

### Scenario 3: Pause & Recovery
```
1. Old owner pauses vault
2. Guardians recover ownership
3. New owner resumes vault
Result: New owner regains control
```

---

## Production Deployment

### Verification
```
[ ] GuardianSocialRecovery deployed
[ ] VaultFactoryWithSocialRecovery deployed
[ ] Default quorum set appropriately
[ ] First vault deployment tested
[ ] Recovery flow verified on testnet
```

### Monitoring
```
[ ] Set up event listeners
[ ] Monitor RecoveryInitiated events
[ ] Track voting participation
[ ] Alert on unusual patterns
```

---

## Summary

**Feature #14 Contracts**:
- GuardianSocialRecovery: 420+ lines, core recovery logic
- SpendVaultWithSocialRecovery: 480+ lines, vault integration
- VaultFactoryWithSocialRecovery: 520+ lines, deployment factory

**Total**: 1,420+ lines of production code

**Gas Range**: 150K-500K depending on operation

**Key Integration**: Guardian SBT, vault status, emergency guardian

**Backward Compatibility**: Full (Features #1-13 untouched)

---

**Feature #14 Complete**: Social recovery provides secure guardian-based owner reset with multi-sig consensus and timelocks.
