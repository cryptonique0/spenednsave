# Guardian Recovery Flow Implementation Guide

## Overview

Guardian Recovery enables remaining guardians to collectively vote out a compromised guardian through a quorum-based consensus mechanism. If a guardian loses access or is compromised, other active guardians can initiate a recovery proposal and vote to remove them.

## Components

### 1. GuardianRecovery Contract
Core contract managing recovery proposals and voting.

**Key Responsibilities**:
- Track recovery proposals
- Manage quorum-based voting
- Enforce voting periods
- Track vote tallies

### 2. SpendVaultWithRecovery Contract
Enhanced vault integrating recovery with rotation.

**Key Features**:
- Propose recovery of guardians
- Cast recovery votes
- Execute guardian removal upon quorum
- Track recovery executions

### 3. VaultFactoryWithRecovery Contract
Factory for simplified deployment.

**Key Features**:
- Single deployment per network
- Creates vault + token + rotation + recovery
- Shared contracts for all vaults

## Architecture

```
Guardian Recovery System:
├── GuardianRecovery (Voting)
│   └── Manages proposals and voting
├── SpendVaultWithRecovery (Execution)
│   └── Integrates recovery with vault operations
└── GuardianRotation (Tracking)
    └── Manages guardian expiry and removal
```

## Recovery Process Flow

### Step 1: Propose Recovery
Owner initiates recovery proposal for a guardian:
```javascript
uint256 proposalId = vault.proposeGuardianRecovery(
    guardianAddress,
    "Compromised credentials"
);
```

### Step 2: Active Guardians Vote
Other active guardians vote to approve recovery:
```javascript
bool executed = vault.voteForGuardianRecovery(proposalId, voterAddress);
```

### Step 3: Quorum Execution
Once quorum is reached, guardian is automatically removed:
- Removed from GuardianRotation
- Can no longer sign transactions
- Voting period expires after 3 days

## API Reference

### GuardianRecovery Contract

**Proposal Management**:
```solidity
function proposeRecovery(address guardian, address vault, uint256 votesRequired) 
    external returns (uint256 proposalId)

function voteOnRecovery(uint256 proposalId, address voter) 
    external returns (bool executed)

function cancelRecovery(uint256 proposalId, string reason) 
    external
```

**Status Checking**:
```solidity
function getProposalStatus(uint256 proposalId) 
    external view returns (bool executed, uint256 votes, uint256 votesRequired)

function getVoteCount(uint256 proposalId) 
    external view returns (uint256)

function hasGuardianVoted(uint256 proposalId, address guardian) 
    external view returns (bool)

function getProposalVoters(uint256 proposalId) 
    external view returns (address[])

function getVotesNeeded(uint256 proposalId) 
    external view returns (uint256)

function getTimeRemaining(uint256 proposalId) 
    external view returns (uint256)

function isVotingExpired(uint256 proposalId) 
    external view returns (bool)
```

**Configuration**:
```solidity
function setVotingPeriod(uint256 newPeriod) external

function getProposalDetails(uint256 proposalId) 
    external view returns (...)
```

### SpendVaultWithRecovery Contract

**Recovery Operations**:
```solidity
function proposeGuardianRecovery(address guardian, string reason) 
    external returns (uint256 proposalId)

function voteForGuardianRecovery(uint256 proposalId, address voter) 
    external returns (bool executed)

function isRecoveryExecutedInVault(uint256 proposalId) 
    external view returns (bool)
```

**Configuration**:
```solidity
function updateGuardianRecovery(address newAddress) external

function setQuorum(uint256 newQuorum) external

function updateGuardianRotation(address newAddress) external
```

## Usage Scenarios

### Scenario 1: Guardian Loses Private Key

```javascript
// 1. Owner initiates recovery
const proposalId = await vault.proposeGuardianRecovery(
    lostGuardianAddress,
    "Lost access to private key"
);

// 2. Other guardians vote
await vault.voteForGuardianRecovery(proposalId, guardian1);
await vault.voteForGuardianRecovery(proposalId, guardian2);
// Result: Lost guardian automatically removed

// 3. Replace with new guardian
const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.addGuardian(newGuardianAddress, vaultAddress, expiryTime);
```

### Scenario 2: Compromised Guardian

```javascript
// 1. Detect suspicious activity and propose recovery
const proposalId = await vault.proposeGuardianRecovery(
    compromisedAddress,
    "Detected unauthorized withdrawal attempts"
);

// 2. Guardians review and vote
await vault.voteForGuardianRecovery(proposalId, trustworthyGuardian1);
await vault.voteForGuardianRecovery(proposalId, trustworthyGuardian2);
// Result: Compromised guardian immediately removed

// 3. Audit and revoke if necessary
// (New guardian must be explicitly added)
```

### Scenario 3: Check Recovery Status

```javascript
// Get full proposal details
const {
    targetGuardian,
    vault,
    votesRequired,
    votesReceived,
    executed,
    timeRemaining
} = await recovery.getProposalDetails(proposalId);

// Check if guardian has voted
const voted = await recovery.hasGuardianVoted(proposalId, guardianAddress);

// Get votes still needed
const votesNeeded = await recovery.getVotesNeeded(proposalId);

// Get all voters
const voters = await recovery.getProposalVoters(proposalId);
```

## Security Considerations

### 1. Quorum Requirement
Recovery execution requires the same quorum as withdrawals, ensuring broad consensus.

### 2. Voting Period Limit
Proposals expire after 3 days (configurable), preventing indefinite voting windows.

### 3. Non-Target Voting
Compromised guardian cannot vote on their own removal.

### 4. Immediate Removal
Once quorum is reached, guardian is immediately removed - no additional delay.

### 5. Audit Trail
All recovery proposals and votes are logged via events for monitoring.

## Best Practices

### 1. Monitoring
Set up alerts for recovery proposals:
```javascript
// Monitor for new proposals
contract.on("RecoveryProposed", (proposalId, target, vault) => {
    console.warn(`Recovery proposed for guardian: ${target}`);
});
```

### 2. Timely Voting
Establish process for rapid voting once recovery is needed.

### 3. Guardian Redundancy
Maintain more guardians than required quorum to ensure recovery is always possible.

### 4. Backup Guardians
Keep backup guardians ready for quick replacement.

### 5. Documentation
Document guardian contact procedures for emergency situations.

## Events

```solidity
event RecoveryProposed(
    uint256 indexed proposalId,
    address indexed targetGuardian,
    address indexed vault,
    uint256 votesRequired
);

event RecoveryVoteCast(
    uint256 indexed proposalId,
    address indexed voter,
    uint256 currentVotes,
    uint256 votesRequired
);

event RecoveryExecuted(
    uint256 indexed proposalId,
    address indexed targetGuardian,
    address indexed vault
);

event RecoveryCancelled(uint256 indexed proposalId, string reason);

event VotingPeriodUpdated(uint256 newPeriod);
```

## Testing

```bash
# Run recovery tests
npx hardhat test contracts/GuardianRecovery.test.sol

# Run vault recovery integration tests
npx hardhat test contracts/SpendVaultWithRecovery.test.sol
```

## Deployment

```javascript
// 1. Deploy factory
const factory = await deploy("VaultFactoryWithRecovery");

// 2. Create vault
const [token, vault] = await factory.getUserContracts(userAddress);
const rotation = await factory.getGuardianRotation();
const recovery = await factory.getGuardianRecovery();

// 3. Setup guardians
const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.addGuardian(guardian1, vault, expiryTime);
await rotation.addGuardian(guardian2, vault, expiryTime);
await rotation.addGuardian(guardian3, vault, expiryTime);

// 4. Ready for recovery if needed
```

## Integration Points

**With GuardianRotation**:
- Removes guardian from rotation upon quorum
- Validates voter is active guardian

**With SpendVault**:
- Reduces quorum available for withdrawals
- Immediate effect on vault security

**With GuardianSBT**:
- Validators holder status during voting

## Monitoring Recommendations

1. **Active Proposals**: Track number of active recovery proposals
2. **Voting Progress**: Monitor vote count toward quorum
3. **Proposal Timeline**: Alert when proposals near expiry
4. **Execution History**: Log all executed recoveries
5. **Guardian Health**: Maintain list of compromise incidents

## Troubleshooting

### Issue: Guardian already voted on proposal
**Solution**: Each guardian can vote only once per proposal

### Issue: Voting period expired
**Solution**: Propose new recovery within 3-day window

### Issue: Insufficient votes for execution
**Solution**: Get more guardians to vote or wait for recovery deadline

### Issue: Cannot remove target on own recovery
**Solution**: Target guardian cannot self-vote; must be removed by others

## Configuration

### Voting Period
Default: 3 days (customizable)

```javascript
await recovery.setVotingPeriod(7 * 24 * 60 * 60); // 7 days
```

### Quorum Requirement
Inherits from vault quorum setting

```javascript
await vault.setQuorum(2); // Requires 2 votes for recovery
```

## Advanced Usage

### Custom Recovery Quorum
Implement if different quorum needed:
```javascript
// Manual implementation in vault
const customQuorum = 3;
const proposalId = recovery.proposeRecovery(
    guardianAddress,
    vaultAddress,
    customQuorum
);
```

### Batch Guardian Recovery
Multiple compromised guardians:
```javascript
for (const guardianAddr of compromisedGuardians) {
    const proposalId = await vault.proposeGuardianRecovery(
        guardianAddr,
        "Batch recovery - security incident"
    );
}
```

## Summary

Guardian Recovery provides:
- ✅ Quorum-based guardian removal
- ✅ Time-limited voting periods
- ✅ Immediate effect on vault security
- ✅ Full audit trail
- ✅ Integration with rotation system
- ✅ Emergency response capability

This ensures vault security is maintained even if a guardian is compromised or loses access.
