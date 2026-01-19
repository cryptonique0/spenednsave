# Feature #14: Social Recovery - Quick Reference

## Summary
Social recovery allows guardians to vote to reset vault ownership if the owner loses their private key. Requires multi-sig consensus, 7-day voting period, 7-day timelock delay.

---

## Quick Start

### 1. Deploy & Register
```solidity
// Deploy recovery contract
GuardianSocialRecovery recovery = new GuardianSocialRecovery();

// Deploy factory
VaultFactoryWithSocialRecovery factory = 
    new VaultFactoryWithSocialRecovery(address(recovery), address(guardianSBT));

// Deploy vault with recovery
address vault = factory.deployVault(
    owner,
    guardians,              // Must have guardian SBTs
    requiredSignatures,
    emergencyGuardian
);
// Vault auto-registered for recovery
```

### 2. Initiate Recovery
```solidity
// Guardian initiates recovery
uint256 recoveryId = recovery.initiateRecovery(
    vaultAddress,
    newOwnerAddress,
    "Owner lost access to keys"
);
// Status: PENDING
// Voting deadline: block.timestamp + 7 days
```

### 3. Vote (7 days)
```solidity
// Other guardians vote
recovery.approveRecovery(recoveryId);  // Guardian 2
recovery.approveRecovery(recoveryId);  // Guardian 3

// After quorum reached
// Status: APPROVED
// Timelock starts: block.timestamp + 7 days
```

### 4. Execute (After 7 days)
```solidity
// Anyone can execute after timelock
recovery.executeRecovery(recoveryId, vaultAddress);
// Status: EXECUTED
// Vault owner changed to newOwner
```

---

## Core Functions

### GuardianSocialRecovery

#### Initiation
```solidity
function initiateRecovery(
    address vault,
    address newOwner,
    string calldata reason
) external returns (uint256 recoveryId)

// Requirements:
// - Caller must have guardian SBT
// - vault must be registered
// - newOwner != address(0)
```

#### Voting
```solidity
function approveRecovery(uint256 recoveryId) 
    external returns (bool quorumReached)

// Requirements:
// - Caller must have guardian SBT
// - Recovery must be PENDING
// - Caller hasn't voted yet
// - Voting period not ended
```

#### Execution
```solidity
function executeRecovery(uint256 recoveryId, address vault) external

// Requirements:
// - Recovery must be APPROVED
// - Timelock must be expired (7 days)
// - Not already executed
```

#### Cancellation
```solidity
function cancelRecovery(uint256 recoveryId, string calldata reason) external

// Requirements:
// - Recovery must be PENDING
// - Caller must be initiator or vault
```

#### Admin
```solidity
function registerVault(
    address vault,
    uint256 quorum,
    address guardianToken
) external

function updateVaultQuorum(address vault, uint256 newQuorum) external
```

---

### SpendVaultWithSocialRecovery

#### Owner Reset (Recovery Contract Only)
```solidity
function resetOwnerViaSocial(address newOwner, uint256 recoveryId) 
    external onlyRecoveryContract

// Called only by recovery contract
// Changes owner permanently
// Events: OwnerRecoveredViaSocial, OwnerChanged
```

#### Query
```solidity
function getRecoveryContract() external view returns (address)
function hasSocialRecoveryEnabled() external view returns (bool)
```

---

### VaultFactoryWithSocialRecovery

#### Deployment
```solidity
function deployVault(
    address owner,
    address[] calldata guardians,
    uint256 requiredSignatures,
    address emergencyGuardian
) external returns (address)

function deployVaultWithCustomQuorum(
    address owner,
    address[] calldata guardians,
    uint256 requiredSignatures,
    address emergencyGuardian,
    uint256 recoveryQuorum
) external returns (address)
```

#### Query
```solidity
function getVaultInfo(address vault) 
    external view returns (VaultInfo memory)

function getVaultOwner(address vault) 
    external view returns (address)

function getRecoveryQuorum(address vault) 
    external view returns (uint256)

function getRecoveryStats(address vault) 
    external view returns (totalAttempts, successful, successRate)
```

---

## Data Access Patterns

### Get Recovery Status
```solidity
RecoveryView memory recovery = recovery.getRecovery(recoveryId);
// Returns: all recovery details + time remaining

console.log("Status:", recovery.status);         // 0=NONE, 1=PENDING, 2=APPROVED, 3=EXECUTED, 4=CANCELLED
console.log("Votes:", recovery.approvalsCount);  // Current approvals
console.log("Voting ends in:", recovery.secondsUntilVotingEnd);
console.log("Can execute in:", recovery.secondsUntilExecution);
```

### Check Vote Status
```solidity
bool voted = recovery.hasVoted(recoveryId, guardianAddress);
uint256 needed = recovery.approvalsNeeded(recoveryId);
uint256 timeRemaining = recovery.getVotingTimeRemaining(recoveryId);
```

### Check Execution Status
```solidity
bool canExecuteNow = recovery.canExecuteNow(recoveryId);
uint256 timelockRemaining = recovery.getTimelockRemaining(recoveryId);
```

### Get Vault Recoveries
```solidity
uint256[] memory recoveryIds = recovery.getVaultRecoveries(vaultAddress);
uint256 count = recovery.getRecoveryCount(vaultAddress);

(uint256 attempts, uint256 successful, uint256 rate) 
    = recovery.getRecoveryStats(vaultAddress);
```

---

## Recovery Timeline

### Standard 2-of-3 Guardian Recovery
```
Day 0:
  T0: Guardian 1 initiates recovery
  T+0s: Status = PENDING, voting deadline = T + 604,800s

Day 1:
  T+1d: Guardian 2 votes
  T+1d: Guardian 3 votes
  T+1d: Quorum reached (2/3)
  T+1d: Status = APPROVED, timelock deadline = T + 1,209,600s

Day 8:
  T+7d: Timelock expires
  T+7d: Status can change to EXECUTED

Day 8+:
  T+7d+: Anyone can call executeRecovery()
  T+7d+: Owner officially changed
  T+7d+: Status = EXECUTED
```

**Total minimum time**: 14 days (7 voting + 7 timelock)

---

## Configuration Examples

### Example 1: Strict Security (3 of 5)
```solidity
address vault = factory.deployVaultWithCustomQuorum(
    owner,
    [guardian1, guardian2, guardian3, guardian4, guardian5],
    3,                          // 3 signatures for withdrawals
    emergencyGuardian,
    3                           // 3 guardians needed for recovery (super-majority)
);
```

### Example 2: Balanced (2 of 3)
```solidity
address vault = factory.deployVault(
    owner,
    [guardian1, guardian2, guardian3],
    2,                          // 2 signatures for withdrawals
    emergencyGuardian
    // Uses default recovery quorum (typically 2)
);
```

### Example 3: Fast Recovery (1 of 3)
```solidity
address vault = factory.deployVaultWithCustomQuorum(
    owner,
    [guardian1, guardian2, guardian3],
    2,
    emergencyGuardian,
    1                           // Only 1 guardian needed for recovery
);
```

---

## Common Patterns

### Pattern 1: Verify Guardian Status
```solidity
bool isGuardian = factory.isVaultGuardian(vaultAddress, userAddress);
require(isGuardian, "Must be vault guardian");
```

### Pattern 2: Check Recovery Eligibility
```solidity
(uint attempts, uint successes, uint rate) = recovery.getRecoveryStats(vault);
require(rate < 50, "Too many failed attempts");  // Gate recovery if many attempts
```

### Pattern 3: Auto-Execute After Timelock
```solidity
function autoExecuteIfReady(uint256 recoveryId, address vault) external {
    if (recovery.canExecuteNow(recoveryId)) {
        recovery.executeRecovery(recoveryId, vault);
    }
}
```

### Pattern 4: Guardian Dashboard
```solidity
address[] memory vaults = factory.getOwnerVaults(ownerAddress);
for (uint i = 0; i < vaults.length; i++) {
    address vault = vaults[i];
    uint256 quorum = recovery.getVaultQuorum(vault);
    (uint attempts, uint success, uint rate) = recovery.getRecoveryStats(vault);
    // Display recovery info
}
```

### Pattern 5: Recovery Dispute Resolution
```solidity
// Before timelock expires, cancel if disputed
if (block.timestamp < recovery.timelockExpiration) {
    recovery.cancelRecovery(recoveryId, "Disputed recovery");
}
```

---

## Gas Costs

| Operation | Cost | Notes |
|-----------|------|-------|
| Register vault | ~8K gas | One-time, factory |
| Initiate recovery | ~150K gas | Creates recovery object |
| Guardian votes | ~30K gas each | N guardians = N × 30K |
| Execute recovery | ~40K gas | Changes owner |
| Cancel recovery | ~10K gas | If during voting |
| **Total 2-of-3** | ~250K gas | Initiate + 2 votes + execute |

---

## Events to Monitor

### Recovery Lifecycle
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
```

---

## Error Handling

### Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Vault not registered` | Deployment outside factory | Use factory to deploy |
| `Only guardians can initiate` | No guardian SBT | Mint guardian SBT first |
| `Only guardians can vote` | No guardian SBT | Ensure SBT is held |
| `Already voted` | Voting twice | One vote per guardian per recovery |
| `Recovery not pending` | Recovery status changed | Check recovery status |
| `Voting period ended` | 7 days passed | Cannot vote after deadline |
| `Recovery not approved` | Quorum not reached | Need more votes before execution |
| `Timelock not expired` | Too early | Wait for 7-day delay |
| `Same owner` | New owner = current owner | Provide different address |

---

## Testing Checklist

- [ ] Deploy recovery, vault, factory
- [ ] Verify vault registered for recovery
- [ ] Test initiation with guardian
- [ ] Test voting by multiple guardians
- [ ] Verify quorum reached changes status
- [ ] Verify timelock prevents early execution
- [ ] Wait 7 days (or use time travel in tests)
- [ ] Execute recovery successfully
- [ ] Verify owner changed
- [ ] Verify events emitted correctly
- [ ] Test cancellation during voting
- [ ] Test non-guardian cannot initiate
- [ ] Test non-guardian cannot vote

---

## Integration Checklist

- [ ] Deploy to testnet
- [ ] Verify integration with existing features
- [ ] Test withdrawal still works after recovery
- [ ] Test pause/resume works with recovery
- [ ] Test emergency guardian freeze works
- [ ] Verify guardian rotation compatible
- [ ] Check reason hashing integration
- [ ] Validate batch withdrawals still work
- [ ] Test with multiple vaults
- [ ] Monitor all recovery events
- [ ] Verify guardian SBT integration
- [ ] Deploy to mainnet

---

## Key Differences from Previous Features

### vs. Feature #1 (GuardianSBT)
- Social recovery *uses* SBT for guardian validation
- SBT doesn't expire (unlike rotatable guardians)
- Identity proof for recovery voting

### vs. Features #11-12 (Proposals)
- Recovery is different from withdrawals
- Recovery changes owner, not just funds
- Recovery has 14-day minimum vs. instant withdrawals
- Recovery uses same guardian voting mechanism

### vs. Feature #13 (Reason Hashing)
- Recovery reason not hashed (recorded as string)
- Social recovery independent of withdrawal reasons
- No privacy concern for recovery reasons (public voting)

---

## Security Considerations

✅ **Timelock Protection**: 7 days prevents instant takeover
✅ **Multi-Sig Requirement**: Quorum prevents single guardian control
✅ **Cancellation Mechanism**: False alarms can be reverted
✅ **Guardian Validation**: SBT ensures identity
✅ **Immutable History**: On-chain events provide proof
✅ **Emergency Freeze**: Additional layer if recovery compromised
✅ **Withdrawal Independence**: Recovery doesn't affect vault funds

⚠️ **Trust Assumptions**:
- Guardians are trustworthy
- Guardians have not lost/sold their SBTs
- At least quorum number of guardians remain accessible

---

## Production Deployment

### Pre-Launch Checklist
```
Recovery Contract:
  [ ] Deployed to mainnet
  [ ] Constructor verified
  [ ] No upgrades planned (immutable)

Factory Contract:
  [ ] Deployed with correct recovery address
  [ ] Default quorum set (typically 2-3)
  [ ] Guardian SBT address verified

Initial Vaults:
  [ ] Deploy first vault via factory
  [ ] Verify registered in recovery
  [ ] Test recovery flow on testnet
  [ ] Get audited if high value

Monitoring:
  [ ] Set up event listeners
  [ ] Monitor recovery attempts
  [ ] Alert on unusual activity
  [ ] Track success/fail statistics
```

---

## Recovery vs. Emergency Scenarios

### Recovery (Social): Owner lost key
- Time: 14 days minimum
- Trigger: Multiple guardians agree
- Process: Voting + timelock
- New owner: Chosen by guardians
- Reversible: Before execution

### Emergency (Freeze): Vault compromised
- Time: Immediate (no timelock)
- Trigger: Emergency guardian alone
- Process: Single call
- Effect: Vault frozen, no transactions
- Reversible: Vault owner can unfreeze

**Both mechanisms work together** for complete safety.

---

## FAQ

**Q: How long does recovery take?**
A: Minimum 14 days (7 voting + 7 timelock) if quorum reached quickly

**Q: Can recovery be cancelled?**
A: Yes, only during voting period (before quorum reached)

**Q: What if guardians disagree?**
A: If quorum not reached, recovery fails and can be retried

**Q: Can multiple recoveries happen simultaneously?**
A: Yes, each has unique recoveryId, independent timelines

**Q: What if guardian loses SBT?**
A: Guardian cannot vote, even for previously initiated recoveries

**Q: Is recovery reversible?**
A: No, once executed, owner is permanently changed

**Q: Can new owner be a contract?**
A: Yes, any non-zero address accepted

**Q: What if new owner address is wrong?**
A: Recovery can be cancelled during voting, retry with correct address

**Q: Does recovery work if vault is paused?**
A: Yes, recovery independent of vault pause state

**Q: What prevents guardian from approving malicious recovery?**
A: Quorum requirement (multiple guardians must agree), timelock delay

---

## Resources

- Full Spec: `FEATURE_14_SOCIAL_RECOVERY.md`
- Contract Index: `FEATURE_14_SOCIAL_RECOVERY_INDEX.md`
- Implementation: `contracts/GuardianSocialRecovery.sol`
- Integration: `contracts/SpendVaultWithSocialRecovery.sol`
- Factory: `contracts/VaultFactoryWithSocialRecovery.sol`

---

**Feature #14 Enabled**: Guardian-based owner recovery with multi-sig consensus and security timelocks.
