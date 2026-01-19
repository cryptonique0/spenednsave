# Feature #14: Social Recovery Owner Reset

## Overview

**Objective**: Allow guardians to collectively recover vault ownership if the owner loses access to their private key.

**Problem Solved**:
- Owner loses private key (theft, accident, hardware failure)
- Vault becomes inaccessible to rightful owner
- No recovery mechanism in previous versions
- Guardians cannot take ownership, only approve withdrawals

**Solution**:
- Guardians vote to reset vault owner to new address
- Multi-signature consensus required (configurable quorum)
- 7-day voting period + 7-day timelock for security
- Complete audit trail of all recovery attempts
- Can be cancelled if recovery is not approved or if false alarm

---

## Architecture

### Core Components

#### 1. GuardianSocialRecovery Contract (420+ lines)
**Purpose**: Central recovery service managing owner reset voting

**Key Responsibilities**:
- Register vaults for recovery
- Initiate recovery processes
- Track guardian votes
- Enforce timelock delays
- Execute owner changes
- Maintain history and statistics

**Deployment**: Single contract instance per network
**Cost**: Single shared resource (gas-efficient)

#### 2. SpendVaultWithSocialRecovery (480+ lines)
**Purpose**: Vault with integrated social recovery capability

**Key Capabilities**:
- Receive owner reset requests from recovery contract
- Execute `resetOwnerViaSocial()` function
- Maintain all previous vault functionality
- Track recovery events
- Provide recovery contract address

**Deployment**: One per user vault
**Backward Compatibility**: All Features #1-13 intact

#### 3. VaultFactoryWithSocialRecovery (520+ lines)
**Purpose**: Factory for deploying vaults with recovery enabled

**Key Features**:
- Deploy vaults with guardians
- Automatic recovery registration
- Track deployed vaults
- Manage recovery quorums
- Provide vault statistics

**Deployment**: Single contract per network
**Integration**: Works with existing factory pattern

---

## Recovery Flow

### Step 1: Recovery Initiation
```
1. Guardian calls GuardianSocialRecovery.initiateRecovery()
   - Provides: vault address, new owner, reason
   - Checks: Guardian has SBT, vault registered
   
2. Recovery object created with:
   - recoveryId (auto-incremented)
   - Status: PENDING
   - Voting deadline: current time + 7 days
   - Approvals: 1 (initiator)
   - Reason stored in recovery object
```

### Step 2: Guardian Voting (7 days)
```
1. Other guardians call approveRecovery(recoveryId)
   - Each guardian votes once
   - Vote counter increments
   - Can only vote before deadline
   
2. When approvals reach quorum:
   - Status changes to APPROVED
   - Timelock starts: current time + 7 days
   - Event emitted: RecoveryQuorumReached
```

### Step 3: Timelock Period (7 days)
```
1. After quorum reached, 7-day delay enforced
   - Prevents immediate malicious takeover
   - Allows time for contested recovery to be cancelled
   - Recovery is locked in but not yet executed
   
2. During timelock:
   - guardians can verify vote authenticity
   - false alarms can be caught
   - no other action needed
```

### Step 4: Execution
```
1. Anyone can call executeRecovery(recoveryId, vault)
   - After 7-day timelock expires
   - Calls vault.resetOwnerViaSocial(newOwner, recoveryId)
   - Vault changes owner permanently
   - Recovery marked as EXECUTED
   - Event emitted: RecoveryExecuted
```

### Step 5 (Optional): Cancellation
```
1. Initiator or vault owner calls cancelRecovery(recoveryId)
   - Only works for PENDING recoveries
   - Only before quorum reached
   - Prevents execution if false alarm
   - Recovery marked as CANCELLED
```

---

## Data Structures

### OwnerRecovery Struct
```solidity
struct OwnerRecovery {
    uint256 recoveryId;                    // Unique identifier
    address vault;                         // Target vault
    address newOwner;                      // Proposed new owner
    address initiator;                     // Guardian who initiated
    uint256 initiatedAt;                   // Timestamp of initiation
    uint256 votingDeadline;                // End of voting period
    uint256 timelockExpiration;            // When execution allowed
    uint256 approvalsCount;                // Current approval count
    RecoveryStatus status;                 // PENDING/APPROVED/EXECUTED/CANCELLED
    mapping(address => bool) hasVoted;     // Vote tracker
    bool executed;                         // Execution flag
    uint256 executedAt;                    // Execution timestamp
    string reason;                         // Recovery reason
}
```

### RecoveryStatus Enum
```solidity
enum RecoveryStatus {
    NONE,        // 0 - No recovery active
    PENDING,     // 1 - Voting in progress
    APPROVED,    // 2 - Quorum reached, in timelock
    EXECUTED,    // 3 - Owner changed
    CANCELLED    // 4 - Cancelled
}
```

---

## Time Constraints

### Voting Period
- **Duration**: 7 days (604,800 seconds)
- **Start**: Recovery initiation
- **End**: Voting deadline (automatic closure)
- **Guardians can vote**: During this period only
- **Action after expiry**: Cannot vote, can execute if approved

### Timelock Period
- **Duration**: 7 days (604,800 seconds)
- **Start**: When quorum reached
- **End**: Timelock expiration
- **Execution blocked**: Until expiration passes
- **Purpose**: Security delay, prevent immediate takeover
- **Total time to ownership**: Minimum 14 days (7 voting + 7 timelock)

---

## Guardian Requirements

### Guardian Qualifications
- **Must hold**: GuardianSBT NFT (ERC-721)
- **No expiry**: SBT is permanent unless explicitly revoked
- **Multiple vaults**: Guardian can serve on multiple vaults
- **No removal during voting**: Guardian remains valid during recovery

### Guardian Permissions
- **Can initiate**: Recovery for any registered vault
- **Can vote**: On any recovery in their vault
- **Cannot execute**: Only automated after timelock
- **Cannot cancel**: Only initiator or vault owner

---

## Quorum Management

### Default Quorum
```
- Set at factory deployment: typically 2 guardians
- Used for all new vaults unless overridden
- Can be updated by factory owner
```

### Custom Quorum
```
- Set per vault at deployment time
- Vault owner can update after deployment
- Options: 1 to total guardians
- Example: 3 of 5 guardians
```

### Quorum Examples
```
3 guardians total:
- Quorum 1: Any 1 guardian needed
- Quorum 2: Any 2 guardians needed (majority)
- Quorum 3: All 3 guardians needed (unanimous)

5 guardians total:
- Quorum 2: Bare majority (40%)
- Quorum 3: Clear majority (60%)
- Quorum 4: Super majority (80%)
- Quorum 5: Unanimous
```

---

## Security Features

### 1. Multi-Signature Consensus
- **Requirement**: Quorum of guardians must approve
- **No single point failure**: One guardian cannot recover alone
- **Adaptive quorum**: Can be set 1 to N

### 2. Voting Verification
- **Vote once rule**: Each guardian votes at most once
- **Guardian validation**: Must hold SBT NFT
- **Vote tracking**: Immutable voting history

### 3. Timelock Delays
- **7-day voting window**: Sufficient time for consensus
- **7-day execution delay**: Prevents immediate takeover
- **Total 14 days minimum**: From initiation to owner change

### 4. Recovery Cancellation
- **Reversible process**: Can cancel if consensus broken
- **Initiator control**: Can pull back false alarms
- **Vault owner control**: Can reject if recovered too early

### 5. Audit Trail
- **Complete history**: All recovery attempts recorded
- **Immutable events**: Event logs for verification
- **Statistics tracking**: Attempts, successes, rates

### 6. Emergency Guardian Override
- **Vault freezing**: Emergency guardian can freeze vault
- **Prevents malicious recovery**: If recovery looks compromised
- **Independent mechanism**: Separate from recovery voting

---

## Use Cases

### Use Case 1: Lost Hardware Wallet
**Scenario**:
- Owner stored key on hardware wallet
- Hardware wallet lost/destroyed
- No backups available
- Vault inaccessible for months

**Recovery Process**:
1. Owner contacts guardians, explains situation
2. Guardian 1 initiates recovery, proposes new key
3. Guardians 2 & 3 vote in favor (if quorum = 2)
4. After 7 days voting + 7 days timelock
5. Owner has new key, can control vault again

**Time Cost**: 14 days minimum
**Trust Required**: Guardians trust owner's story
**Validation**: Owner likely knows vault details

### Use Case 2: Compromised Key
**Scenario**:
- Owner's private key was compromised
- Attacker could steal vault funds
- Owner wants ownership reset
- Previous key invalidated immediately

**Recovery Process**:
1. Owner initiates recovery immediately
2. Provides new key address for safety
3. Guardians vote within 24 hours (can be faster)
4. Timelock provides security against attacker
5. After 14 days total, ownership confirmed new

**Advantage**: Complete key rotation possible
**Window**: 14-day delay provides safety
**Owner benefit**: Provably new, secure key

### Use Case 3: Key Lost, Found Later
**Scenario**:
- Owner thought key was lost
- Guardian quorum approved recovery
- Old key was found before timelock ended
- Can cancel recovery, use original key

**Process**:
1. Recovery in APPROVED state (after quorum)
2. Owner finds old key during 7-day timelock
3. Calls cancelRecovery() before timelock expires
4. Recovery marked CANCELLED
5. Original owner continues with original key

**Safety**: Gives time to cancel false alarms
**Flexibility**: Doesn't force ownership change

### Use Case 4: Disputed Recovery
**Scenario**:
- One guardian initiates recovery
- Other guardians doubt the claim
- Recovery fails to reach quorum
- Voting deadline passes naturally

**Process**:
1. Guardian initiates with new owner
2. Other guardians refuse to vote
3. Voting deadline passes (7 days)
4. Recovery never reaches quorum
5. Status remains PENDING, never executes
6. Can try again later with better explanation

**Outcome**: Transparent process, clear rejection
**Finality**: Process naturally concludes after 7 days

---

## Integration Points

### With GuardianSBT
```
- Check: Guardian must hold SBT to vote
- Validation: Uses balanceOf() check
- No expiry: SBT is permanent
- Benefit: Proves guardian identity
```

### With SpendVault
```
- Owner reset: resetOwnerViaSocial() function
- Called by: Recovery contract only
- Parameter: newOwner, recoveryId
- Event: OwnerRecoveredViaSocial emitted
- Audit: recoveryId links to recovery process
```

### With VaultFactory
```
- Registration: All vaults auto-registered
- Tracking: Factory knows all deployed vaults
- Quorum management: Can set per-vault quorum
- Statistics: Provides vault lookup functions
```

### With Previous Features
```
Feature 1 (GuardianSBT): Guardian identity
Feature 2-3 (VaultFactory): Vault deployment
Feature 4 (Guardian Rotation): Expiry still tracked
Feature 5-8 (Emergency Override): Vault freezing
Feature 9 (Pausing): Can pause, then recover
Feature 10 (Vault Pausing): Recovery unaffected
Feature 11-12 (Proposals/Batch): Withdrawals continue
Feature 13 (Reason Hashing): No interaction
```

---

## Configuration & Customization

### Per-Vault Settings
```solidity
recoveryQuorum[vault]           // Guardians needed for recovery
recoveryGuardianToken[vault]    // Which SBT contract
```

### Global Settings
```
VOTING_PERIOD = 7 days          // Fixed, immutable
TIMELOCK_DURATION = 7 days      // Fixed, immutable
defaultRecoveryQuorum = 2       // Configurable by factory
```

### Changing Settings
```solidity
// Update default quorum for new vaults
factory.updateDefaultRecoveryQuorum(3)

// Update quorum for existing vault (owner only)
factory.updateVaultRecoveryQuorum(vaultAddress, 3)
```

---

## Events & Audit Trail

### Recovery Lifecycle Events
```solidity
RecoveryInitiated(recoveryId, vault, newOwner, initiator, reason, votingDeadline)
RecoveryVoteReceived(recoveryId, voter, approvalsCount)
RecoveryQuorumReached(recoveryId, approvalsCount, timelockExpiration)
RecoveryExecuted(recoveryId, vault, newOwner)
RecoveryCancelled(recoveryId, reason)
```

### Vault Events
```solidity
OwnerRecoveredViaSocial(newOwner, recoveryId)
OwnerChanged(newOwner)
```

### Factory Events
```solidity
VaultDeployed(vault, owner, guardians, requiredSignatures)
VaultRegisteredForRecovery(vault, quorum)
VaultDeactivated(vault)
```

---

## Gas Optimization

### Initiation
- **Cost**: ~150K gas (creation + events)
- **Storage**: 2 storage slots per recovery
- **Repeated calls**: O(1) per initiation

### Voting
- **Cost per vote**: ~30K gas
- **Storage**: 1 SSTORE per vote
- **N guardians**: N × 30K = voting cost

### Execution
- **Cost**: ~40K gas
- **Storage**: 1-2 SSTOREs
- **Benefit**: Owner change, permanent

### Total Minimum
```
Initiate: 150K
Vote (2 guardians): 60K
Execute: 40K
Total: ~250K (typical 2-of-3 recovery)
```

---

## Error Handling

### Common Errors

| Error | Cause | Prevention |
|-------|-------|-----------|
| `Vault not registered` | Vault not in recovery system | Deploy via factory |
| `Invalid new owner` | Zero address proposed | Validate address |
| `Only guardians can initiate` | Non-guardian attempted recovery | Check SBT balance |
| `Only guardians can vote` | Non-guardian voting | Check SBT balance |
| `Already voted` | Guardian voted twice | Tracking prevents double voting |
| `Voting period ended` | 7 days passed | Re-initiate if needed |
| `Recovery not approved` | Quorum not reached | Cannot execute without quorum |
| `Timelock not expired` | 7-day delay not finished | Wait for deadline |
| `Already executed` | Recovery already ran | Check status |

---

## Deployment Checklist

- [ ] Deploy GuardianSocialRecovery contract
- [ ] Deploy GuardianSBT if not existing
- [ ] Deploy VaultFactoryWithSocialRecovery
  - Provide GuardianSocialRecovery address
  - Provide GuardianSBT address
- [ ] Set default recovery quorum (typically 2-3)
- [ ] Mint guardian SBTs to initial guardians
- [ ] Deploy first vault via factory
- [ ] Verify vault registered in recovery contract
- [ ] Test recovery flow in testnet
  - Initiate recovery
  - Vote from multiple guardians
  - Wait timelock
  - Execute owner change
- [ ] Deploy to mainnet
- [ ] Monitor recovery attempts in production

---

## Testing Scenarios

### Scenario 1: Successful Recovery
```
Setup: 3 guardians, quorum = 2
1. Guardian 1 initiates recovery with new owner
2. Guardian 2 votes to approve
3. Quorum reached, timelock starts
4. Wait 7 days
5. Execute recovery
Expected: Owner changes, events emitted
```

### Scenario 2: Failed Recovery (No Quorum)
```
Setup: 3 guardians, quorum = 2
1. Guardian 1 initiates recovery
2. No other guardians vote
3. 7 days pass
4. Try to execute
Expected: Fails (recovery not approved)
```

### Scenario 3: Cancelled Recovery
```
Setup: 3 guardians, quorum = 2
1. Guardian 1 initiates recovery
2. Realizes mistake during voting period
3. Calls cancelRecovery()
4. Try to execute later
Expected: Fails (recovery cancelled)
```

### Scenario 4: Timelock Bypass Prevention
```
Setup: 3 guardians, quorum = 2
1. Guardians vote and approve
2. Try to execute immediately
Expected: Fails (timelock not expired)
3. Wait 7 days
4. Execute works
Expected: Success
```

---

## Compliance & Standards

### Standard Compliance
- **EIP-712**: Uses EIP-712 for signature verification (in vault)
- **ERC-721**: Guardian SBT is standard ERC-721
- **Solidity**: ^0.8.20 (latest security features)
- **OpenZeppelin**: Uses audited libraries

### Security Properties
- **Atomicity**: Recovery is all-or-nothing
- **Immutability**: History cannot be rewritten
- **Timelock**: Enforced delays prevent instant takeover
- **Transparency**: All events logged on-chain

### Access Control
- **RBAC**: Role-based (Owner, Guardian, Recovery)
- **SBT-based**: Guardians authenticated via NFT
- **No delegation**: Cannot delegate voting rights
- **One guardian = one vote**: No voting power centralization

---

## Monitoring & Statistics

### Track Recovery Attempts
```
Total attempts per vault
Successful recoveries
Success rate (%)
Average time to recovery
```

### Query Functions
```solidity
getRecovery(recoveryId)              // Full recovery details
getVaultRecoveries(vault)            // All recoveries for vault
getRecoveryStats(vault)              // Statistics
getVotingTimeRemaining(recoveryId)   // Deadline countdown
getTimelockRemaining(recoveryId)     // Execution countdown
canExecuteNow(recoveryId)            // Ready to execute?
```

---

## Future Enhancements

### Potential Improvements
1. **Flexible voting windows**: Configurable voting periods
2. **Multi-stage recovery**: 2-of-3-of-5 scheme (select 3, need 2)
3. **Recovery cancellation fee**: Cost to prevent spam
4. **Delegation**: Guardians can delegate their vote
5. **Recovery proposal details**: Rich metadata about recovery
6. **Emergency reverse**: Invalidate recovery within timelock
7. **Custody integration**: Support external custodians
8. **Time-weighted voting**: Newer guardians have less power
9. **Voting rewards**: Incentivize guardian participation
10. **Recovery insurance**: Bonding for recovery initiators

---

## Key Takeaways

✅ **Guardian-based recovery** provides owner key recovery mechanism
✅ **Multi-sig consensus** prevents unauthorized ownership changes
✅ **Timelocks** (7+7 days) provide security and transparency
✅ **Cancellation** allows corrections for false alarms
✅ **Complete audit trail** enables full transparency
✅ **Backward compatible** with all previous features
✅ **Gas efficient** shared service architecture
✅ **SBT-based validation** ensures guardian identity
✅ **Configurable quorum** enables customization per vault
✅ **Production-ready** with comprehensive error handling

---

## Contracts Included

1. **GuardianSocialRecovery.sol** (420+ lines)
   - Core recovery voting mechanism
   - Timelock management
   - Statistics tracking

2. **SpendVaultWithSocialRecovery.sol** (480+ lines)
   - Owner reset capability
   - Maintains all vault functionality
   - Integration with recovery contract

3. **VaultFactoryWithSocialRecovery.sol** (520+ lines)
   - Vault deployment with recovery
   - Guardian validation
   - Quorum management

---

**Feature #14 Complete**: Guardians can now collectively recover vault ownership if the owner loses their private key, with multi-sig consensus and security timelocks.
