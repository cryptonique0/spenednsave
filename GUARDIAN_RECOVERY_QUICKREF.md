# Guardian Recovery Quick Reference

## What is Guardian Recovery?

Allows active guardians to vote out a compromised or lost guardian through quorum-based consensus.

## Key Concepts

**Recovery Proposal**: Request to remove a guardian
**Voting Period**: 3 days (default, configurable)
**Quorum**: Same as vault quorum (e.g., 2 of 3)
**Automatic Execution**: Removes guardian when quorum reached

## Quick API

### Propose Recovery
```solidity
uint256 proposalId = vault.proposeGuardianRecovery(
    guardianAddress,
    "Reason for recovery"
);
```

### Vote for Recovery
```solidity
bool executed = vault.voteForGuardianRecovery(proposalId, voterAddress);
// Returns true if recovery executed (quorum reached)
```

### Check Status
```solidity
(bool executed, uint256 votes, uint256 votesRequired) = 
    recovery.getProposalStatus(proposalId);

uint256 remaining = recovery.getTimeRemaining(proposalId);

bool hasVoted = recovery.hasGuardianVoted(proposalId, guardianAddress);
```

## Common Tasks

### Recover Lost Guardian
```javascript
// 1. Propose
const proposalId = await vault.proposeGuardianRecovery(
    lostGuardian,
    "Lost access to private key"
);

// 2. Guardians vote
await vault.voteForGuardianRecovery(proposalId, guardian1);
await vault.voteForGuardianRecovery(proposalId, guardian2);
// Guardian removed automatically

// 3. Add replacement
await rotation.addGuardian(newGuardian, vault, futureExpiry);
```

### Respond to Compromise
```javascript
// 1. Immediately propose recovery
const proposalId = await vault.proposeGuardianRecovery(
    compromisedGuardian,
    "Unauthorized transaction detected"
);

// 2. Alert active guardians - fast-track voting
// 3. Upon quorum, guardian removed from all future operations
```

### Monitor Voting Progress
```javascript
const votesNeeded = await recovery.getVotesNeeded(proposalId);
const voters = await recovery.getProposalVoters(proposalId);
const timeLeft = await recovery.getTimeRemaining(proposalId);

console.log(`Votes needed: ${votesNeeded}`);
console.log(`Voters so far: ${voters.length}`);
console.log(`Time remaining: ${timeLeft} seconds`);
```

## Voting Requirements

- Proposer: Vault owner
- Voters: Active guardians (not the target)
- Quorum: Same as vault quorum
- Voting Window: 3 days
- Result: Automatic removal when quorum reached

## Events

```javascript
// Proposal created
vault.on("RecoveryProposed", (id, guardian, vault, votesReq) => {});

// Vote cast
vault.on("RecoveryVoteCast", (id, voter, votes, votesReq) => {});

// Recovery executed
vault.on("RecoveryExecuted", (id, guardian, vault) => {});

// Recovery cancelled
vault.on("RecoveryCancelled", (id, reason) => {});
```

## Important Notes

✅ Only active guardians can vote  
✅ Target cannot vote on own removal  
✅ Voting period: 3 days  
✅ Removal is immediate upon quorum  
✅ Must maintain quorum to propose recovery  

## Configuration

### Set Voting Period
```solidity
recovery.setVotingPeriod(7 * 24 * 60 * 60); // 7 days
```

### View Settings
```solidity
uint256 period = recovery.votingPeriod();
uint256 totalProposals = recovery.getTotalProposals();
```

## Contracts

- **GuardianRecovery.sol**: Voting logic
- **SpendVaultWithRecovery.sol**: Vault integration
- **VaultFactoryWithRecovery.sol**: Deployment factory

## Status Codes

**Active Proposal**: 
- `executed == false`
- `block.timestamp < endTime`

**Executed Proposal**:
- `executed == true`
- Guardian removed from vault

**Expired Proposal**:
- `block.timestamp >= endTime`
- No further voting possible

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Guardian already voted | Duplicate vote attempt | Use different guardian |
| Voting period expired | 3 days passed | Propose new recovery |
| Target cannot vote | Self-removal attempt | Use different voter |
| Not active guardian | Voter not approved | Use active guardian |
| Insufficient votes | Not enough votes yet | Continue voting |

## Integration Pattern

```javascript
// 1. Setup
const vault = await connect(vaultAddress);
const recovery = await connect(recoveryAddress);

// 2. Detect Issue
if (suspiciousActivity) {
    const proposalId = await vault.proposeGuardianRecovery(
        suspiciousGuardian,
        "Suspicious activity detected"
    );
    
    // 3. Alert and Vote
    await notifyGuardians(proposalId);
    
    // 4. Monitor
    while (true) {
        const status = await recovery.getProposalStatus(proposalId);
        if (status[0]) break; // executed
        await delay(1000);
    }
}
```

## Best Practices

1. **Monitor Proposals**: Watch for recovery proposals
2. **Quick Response**: Vote promptly when recovery needed
3. **Maintain Redundancy**: Keep backup guardians
4. **Document Process**: Clear escalation procedures
5. **Test Recovery**: Simulate recovery in testnet

## File Locations

```
contracts/
├── GuardianRecovery.sol
├── SpendVaultWithRecovery.sol
├── VaultFactoryWithRecovery.sol
├── GuardianRecovery.test.sol
└── SpendVaultWithRecovery.test.sol
```

## Deployment Checklist

- [ ] Deploy VaultFactoryWithRecovery
- [ ] Create vault (includes recovery support)
- [ ] Add guardians with expiry
- [ ] Test recovery on testnet
- [ ] Monitor for recovery needs
- [ ] Document guardian contacts

## See Also

- Guardian Rotation: [GUARDIAN_ROTATION_QUICKREF.md](./GUARDIAN_ROTATION_QUICKREF.md)
- Full Guide: [GUARDIAN_RECOVERY_IMPLEMENTATION.md](./GUARDIAN_RECOVERY_IMPLEMENTATION.md)
- Feature Docs: [FEATURE_8_GUARDIAN_RECOVERY.md](./FEATURE_8_GUARDIAN_RECOVERY.md)
