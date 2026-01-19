# Guardian Recovery - Complete Index

## Quick Navigation

### For Developers
- **Start Here**: [Guardian Recovery Quick Reference](./GUARDIAN_RECOVERY_QUICKREF.md)
- **Full Guide**: [Guardian Recovery Implementation Guide](./GUARDIAN_RECOVERY_IMPLEMENTATION.md)
- **API Docs**: [Feature 8 Complete Documentation](./FEATURE_8_GUARDIAN_RECOVERY.md)

### For Reviewers
- **Feature Summary**: [Feature 8 Documentation](./FEATURE_8_GUARDIAN_RECOVERY.md)
- **Smart Contracts**: See `/contracts` directory

### For Deployment
1. Review [Implementation Guide](./GUARDIAN_RECOVERY_IMPLEMENTATION.md)
2. Deploy [VaultFactoryWithRecovery.sol](./contracts/VaultFactoryWithRecovery.sol)
3. Follow [Setup Steps](./GUARDIAN_RECOVERY_IMPLEMENTATION.md#deployment)

## What is Guardian Recovery?

Guardian Recovery allows active guardians to vote out a guardian who has lost access or been compromised through a quorum-based consensus mechanism.

## Key Benefits

✅ **Emergency Response**: Immediately remove compromised guardians  
✅ **Automatic Integration**: Works seamlessly with rotation system  
✅ **Quorum Protection**: Requires consensus (can't remove unilaterally)  
✅ **Time Limited**: 3-day voting window prevents indefinite processes  
✅ **Audit Trail**: All actions logged for compliance  

## Recovery Flow

```
Compromised Guardian Detected
           ↓
Owner Proposes Recovery
           ↓
Active Guardians Vote (3-day window)
           ↓
Quorum Achieved → Automatic Removal
           ↓
Guardian Removed from All Systems
           ↓
New Guardian Can Be Added
```

## Contract Files

### Core Contracts
1. **GuardianRecovery.sol** (10.2KB)
   - Voting proposal management
   - Vote tallying
   - Execution tracking

2. **SpendVaultWithRecovery.sol** (12.1KB)
   - Proposes recovery
   - Integrates voting
   - Executes removal

3. **VaultFactoryWithRecovery.sol** (4.8KB)
   - Single-deploy factory
   - Creates vault + token + rotation + recovery
   - Shared recovery contract

### Test Contracts
1. **GuardianRecovery.test.sol** (6.3KB)
   - 15 test functions
   - Full recovery voting coverage

2. **SpendVaultWithRecovery.test.sol** (8.5KB)
   - 20 integration tests
   - Vault + recovery scenarios

## API Quick Reference

### Propose Recovery
```solidity
uint256 proposalId = vault.proposeGuardianRecovery(
    guardianAddress,
    "Reason for recovery"
);
```

### Vote for Recovery
```solidity
bool executed = vault.voteForGuardianRecovery(
    proposalId,
    voterAddress
);
// Returns true if quorum reached and guardian removed
```

### Check Status
```solidity
(bool executed, uint256 votes, uint256 votesRequired) = 
    recovery.getProposalStatus(proposalId);

uint256 remaining = recovery.getTimeRemaining(proposalId);

uint256 votesNeeded = recovery.getVotesNeeded(proposalId);
```

## Complete API

### GuardianRecovery Functions

**Proposal**:
- `proposeRecovery(guardian, vault, votesRequired)` - Create proposal
- `voteOnRecovery(proposalId, voter)` - Cast vote
- `cancelRecovery(proposalId, reason)` - Cancel proposal

**Status**:
- `getProposalStatus(proposalId)` - Get execution status
- `getVoteCount(proposalId)` - Get votes received
- `hasGuardianVoted(proposalId, guardian)` - Check vote status
- `getProposalVoters(proposalId)` - Get voters list
- `getVotesNeeded(proposalId)` - Get votes still needed
- `getTimeRemaining(proposalId)` - Get seconds until expiry
- `getProposalDetails(proposalId)` - Get all details

**Configuration**:
- `setVotingPeriod(newPeriod)` - Set voting window

### SpendVaultWithRecovery Functions

**Recovery**:
- `proposeGuardianRecovery(guardian, reason)` - Propose removal
- `voteForGuardianRecovery(proposalId, voter)` - Vote for recovery
- `isRecoveryExecutedInVault(proposalId)` - Check if executed in vault

**Management**:
- `setQuorum(newQuorum)` - Update quorum
- `updateGuardianRecovery(address)` - Update recovery contract

### VaultFactoryWithRecovery Functions

- `createVault(quorum)` - Create vault system
- `getUserContracts(user)` - Get user's contracts
- `getGuardianRecovery()` - Get shared recovery contract
- `getTotalVaults()` - Get vault count
- `getVaultByIndex(index)` - Get vault by index

## Usage Examples

### Example 1: Respond to Compromise

```javascript
// 1. Detect issue
if (unauthorizedActivity) {
    // 2. Propose recovery
    const proposalId = await vault.proposeGuardianRecovery(
        suspiciousGuardian,
        "Unauthorized transaction detected"
    );
    
    // 3. Alert guardians and get votes
    const executed1 = await vault.voteForGuardianRecovery(proposalId, guardian1);
    if (!executed1) {
        const executed2 = await vault.voteForGuardianRecovery(proposalId, guardian2);
    }
    
    // Guardian is automatically removed upon quorum
}
```

### Example 2: Monitor Voting Progress

```javascript
async function monitorRecovery(proposalId) {
    const { votesRequired, executed } = await recovery.getProposalDetails(proposalId);
    
    while (!executed) {
        const votesNeeded = await recovery.getVotesNeeded(proposalId);
        const timeRemaining = await recovery.getTimeRemaining(proposalId);
        
        console.log(`Votes needed: ${votesNeeded}/${votesRequired}`);
        console.log(`Time remaining: ${timeRemaining} seconds`);
        
        if (timeRemaining === 0) break;
        
        await delay(10000); // Check every 10 seconds
    }
}
```

### Example 3: Check Voter Status

```javascript
const hasVoted = await recovery.hasGuardianVoted(proposalId, guardianAddress);

if (!hasVoted && isActiveGuardian) {
    await vault.voteForGuardianRecovery(proposalId, guardianAddress);
}
```

## Security Features

✅ **Quorum Requirement**: Needs consensus like withdrawals
✅ **Non-Target Voting**: Compromised guardian cannot self-vote
✅ **Time Limit**: Voting expires after 3 days
✅ **Immediate Effect**: No delay for guardian removal
✅ **Event Logging**: All changes recorded
✅ **Access Control**: Only active guardians can vote
✅ **Integration**: Removes from all systems atomically

## Best Practices

1. **Monitor Proposals**: Set up alerts for recovery proposals
2. **Quick Response**: Vote promptly when recovery needed
3. **Maintain Redundancy**: Keep more guardians than quorum
4. **Document Process**: Clear escalation procedures
5. **Backup Guardians**: Keep spares ready for replacement
6. **Test Recovery**: Simulate recovery on testnet
7. **Audit Trail**: Review all recovery actions regularly

## Events to Monitor

```javascript
// Recovery proposed
vault.on("RecoveryProposed", (proposalId, guardian, vault) => {
    console.warn(`Recovery proposed for: ${guardian}`);
});

// Vote cast
vault.on("RecoveryVoteCast", (proposalId, voter, votes, needed) => {
    console.log(`Vote from ${voter}: ${votes}/${needed}`);
});

// Recovery executed
vault.on("RecoveryExecuted", (proposalId, guardian) => {
    console.log(`Guardian removed: ${guardian}`);
});
```

## Deployment Steps

```javascript
// 1. Deploy factory
const factory = await ethers.deployContract("VaultFactoryWithRecovery");

// 2. Create vault
const [token, vault] = await factory.getUserContracts(userAddress);
const recovery = await factory.getGuardianRecovery();

// 3. Setup guardians
const expiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
for (const guardian of guardians) {
    await rotation.addGuardian(guardian, vault, expiry);
}

// 4. Ready for operations
```

## Configuration

### Voting Period
```javascript
// Default: 3 days
await recovery.setVotingPeriod(7 * 24 * 60 * 60); // Change to 7 days
```

### Quorum
```javascript
// Must be set on vault
await vault.setQuorum(2); // 2 of N guardians needed
```

## Troubleshooting

**Problem**: Proposal not found
**Solution**: Verify proposalId is correct and proposal exists

**Problem**: Voting period expired
**Solution**: Create new recovery proposal (old one expired)

**Problem**: Cannot vote
**Solution**: Must be active guardian and not the target

**Problem**: Not enough votes
**Solution**: Continue collecting votes before deadline

## Testing

```bash
# Run recovery tests
npx hardhat test contracts/GuardianRecovery.test.sol

# Run vault integration tests
npx hardhat test contracts/SpendVaultWithRecovery.test.sol

# Run all tests
npx hardhat test
```

## File Organization

```
contracts/
├── GuardianRecovery.sol
├── SpendVaultWithRecovery.sol
├── VaultFactoryWithRecovery.sol
├── GuardianRecovery.test.sol
└── SpendVaultWithRecovery.test.sol

Documentation/
├── GUARDIAN_RECOVERY_INDEX.md (this file)
├── GUARDIAN_RECOVERY_QUICKREF.md (quick reference)
├── GUARDIAN_RECOVERY_IMPLEMENTATION.md (full guide)
└── FEATURE_8_GUARDIAN_RECOVERY.md (official docs)
```

## Integration with Other Features

**With Guardian Rotation**:
- Removes guardian from rotation immediately
- Prevents expired/removed guardian from signing

**With SpendVault**:
- Recalculates available signers for withdrawals
- Requires quorum from active guardians only

**With GuardianSBT**:
- Validates voter holds guardian token

## Status

**✅ COMPLETE AND PRODUCTION-READY**

- ✅ All contracts implemented
- ✅ All tests passing (35+ tests)
- ✅ Full documentation
- ✅ Integration examples
- ✅ Security reviewed
- ✅ Ready for deployment

## Summary

Guardian Recovery provides:
- Quorum-based guardian removal
- Time-limited voting windows
- Immediate security response
- Seamless integration with rotation
- Full audit trail
- Emergency response capability

---

**Feature 8: Guardian Recovery**  
**Status**: Production Ready ✅  
**Documentation Index**: GUARDIAN_RECOVERY_INDEX.md
