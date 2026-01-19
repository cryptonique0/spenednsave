# Proposal System Quick Reference

## Quick Start (5 Minutes)

### Setup

```solidity
// 1. Deploy
guardianSBT = GuardianSBT();
factory = VaultFactoryWithProposals(address(guardianSBT));

// 2. Create vault
vault = factory.createVault(2);  // 2-of-3 multisig

// 3. Mint guardians
guardianSBT.mint(guardian1);
guardianSBT.mint(guardian2);
guardianSBT.mint(guardian3);

// 4. Deposit funds
vault.depositETH{value: 10 ether}();
```

### Complete Withdrawal

```solidity
// Owner proposes
proposalId = vault.proposeWithdrawal(
    address(0),           // ETH
    1 ether,              // amount
    recipient,            // destination
    "Payment"             // reason
);

// Guardians vote
vault.voteApproveProposal(proposalId);  // Guardian 1
vault.voteApproveProposal(proposalId);  // Guardian 2 (quorum reached)

// Execute
vault.executeProposalWithdrawal(proposalId);
```

---

## Common Operations

### Create Proposal (ETH)

```solidity
uint256 proposalId = vault.proposeWithdrawal(
    address(0),           // 0x0 for ETH
    1 ether,
    recipient,
    "Fund transfer"
);
```

### Create Proposal (ERC-20)

```solidity
uint256 proposalId = vault.proposeWithdrawal(
    address(usdc),        // Token address
    1000 * 10**6,         // Amount (with decimals)
    recipient,
    "USDC transfer"
);
```

### Vote on Proposal

```solidity
// Any guardian can vote
vault.voteApproveProposal(proposalId);
```

### Check Proposal Status

```solidity
(
    uint256 id,
    address vaultAddr,
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    address proposer,
    uint256 createdAt,
    uint256 deadline,
    uint256 approvalsCount,
    uint8 status,
    bool executed,
    uint256 executedAt,
) = manager.getProposal(proposalId);

// Status values:
// 0 = PENDING
// 1 = APPROVED
// 2 = EXECUTED
// 3 = REJECTED
// 4 = EXPIRED
```

### Execute Proposal

```solidity
vault.executeProposalWithdrawal(proposalId);
```

### Check Voting Status

```solidity
// Votes needed
uint256 needed = manager.approvalsNeeded(proposalId);

// Has guardian voted?
bool voted = manager.hasVoted(proposalId, guardianAddress);

// Current approvals
(, , , , , , , , , uint256 approvalsCount, , , ,) = 
    manager.getProposal(proposalId);
```

### Get Vault Proposals

```solidity
uint256[] memory proposals = manager.getVaultProposals(address(vault));

for (uint256 i = 0; i < proposals.length; i++) {
    uint256 proposalId = proposals[i];
    // Get details: manager.getProposal(proposalId)
}
```

---

## Configuration

### Update Quorum

```solidity
vault.setQuorum(3);  // Now requires 3 approvals
```

### Update Guardian SBT

```solidity
vault.updateGuardianToken(address(newSBT));
```

### Update Proposal Manager

```solidity
vault.updateProposalManager(address(newManager));
```

### Update Vault Quorum (Manager)

```solidity
manager.updateVaultQuorum(address(vault), 3);
```

---

## Query Functions

### Check if Guardian

```solidity
bool isGuardian = guardianSBT.balanceOf(guardianAddress) > 0;
```

### Get Vault Balance (ETH)

```solidity
uint256 balance = vault.getETHBalance();
```

### Get Vault Balance (ERC-20)

```solidity
uint256 balance = vault.getTokenBalance(address(token));
```

### Get User Vaults

```solidity
address[] memory vaults = factory.getUserVaults(userAddress);
```

### Get All Vaults

```solidity
address[] memory allVaults = factory.getAllVaults();
```

### Check if Vault is Managed

```solidity
bool managed = factory.isManagedVault(vaultAddress);
```

### Get Proposal Manager

```solidity
address manager = factory.getProposalManager();
```

---

## Workflow Examples

### Example 1: Simple ETH Transfer

```solidity
// 1. Propose 1 ETH to address(0xABC)
proposalId = vault.proposeWithdrawal(address(0), 1 ether, 0xABC, "Test");

// 2. Guardian 1 votes
address(guardian1).voteApproveProposal(proposalId);

// 3. Guardian 2 votes (quorum 2-of-3)
address(guardian2).voteApproveProposal(proposalId);

// 4. Execute (anyone can execute)
vault.executeProposalWithdrawal(proposalId);

// Result: 1 ETH transferred to 0xABC
```

### Example 2: Emergency Withdrawal

```solidity
// Scenario: Need to move funds due to security concern

// Owner proposes moving funds to safe address
proposalId = vault.proposeWithdrawal(
    address(0),
    address(this).balance,  // All ETH
    safeAddress,
    "SECURITY: Move all funds"
);

// Alert all guardians to vote quickly
// Guardian 1, 2 vote immediately
vault.voteApproveProposal(proposalId);  // As guardian 1
vault.voteApproveProposal(proposalId);  // As guardian 2

// Execute immediately
vault.executeProposalWithdrawal(proposalId);

// Funds secured
```

### Example 3: Multiple Proposal Voting

```solidity
// Create two proposals
prop1 = vault.proposeWithdrawal(address(0), 1 ether, recipient1, "A");
prop2 = vault.proposeWithdrawal(address(usdc), 1000e6, recipient2, "B");

// Vote for both (as guardian)
vault.voteApproveProposal(prop1);
vault.voteApproveProposal(prop2);

// Status of prop1: 1 approval
// Status of prop2: 1 approval (independent counting)

// Other guardians vote
// When either reaches quorum, execute
vault.executeProposalWithdrawal(prop1);  // If quorum reached
vault.executeProposalWithdrawal(prop2);  // If quorum reached
```

### Example 4: Tracking Voting Progress

```solidity
proposalId = vault.proposeWithdrawal(address(0), 1 ether, recipient, "Test");

// Check status
console.log("Votes needed:", manager.approvalsNeeded(proposalId));  // 2

// Guardian 1 votes
vault.voteApproveProposal(proposalId);
console.log("Guardian 1 voted:", manager.hasVoted(proposalId, guardian1));  // true
console.log("Votes needed:", manager.approvalsNeeded(proposalId));  // 1

// Guardian 2 votes
vault.voteApproveProposal(proposalId);
console.log("Votes needed:", manager.approvalsNeeded(proposalId));  // 0
console.log("Ready to execute!");

// Execute
vault.executeProposalWithdrawal(proposalId);
```

---

## Validation Checks

### Before Proposing

```solidity
// ✓ Must be owner
require(msg.sender == vault.owner(), "Only owner");

// ✓ Amount must be positive
require(amount > 0, "Amount > 0");

// ✓ Recipient must be valid
require(recipient != address(0), "Valid recipient");

// ✓ Must have funds
if (token == address(0)) {
    require(vault.getETHBalance() >= amount, "Enough ETH");
} else {
    require(vault.getTokenBalance(token) >= amount, "Enough tokens");
}
```

### Before Voting

```solidity
// ✓ Must be guardian
require(guardianSBT.balanceOf(msg.sender) > 0, "Is guardian");

// ✓ Proposal must exist
require(manager.isManaged(vaultAddress), "Vault managed");

// ✓ Haven't already voted
require(!manager.hasVoted(proposalId, msg.sender), "Not voted");

// ✓ Voting period not expired
(, , , , , , , , uint256 deadline, , , , ,) = manager.getProposal(proposalId);
require(block.timestamp <= deadline, "Voting open");
```

### Before Executing

```solidity
// ✓ Proposal approved
(, , , , , , , , , uint256 approvalsCount, uint8 status, , ,) = 
    manager.getProposal(proposalId);
require(status == 1, "Approved");  // APPROVED = 1
require(approvalsCount >= quorum, "Quorum met");

// ✓ Not already executed
require(!vault.isProposalExecuted(proposalId), "Not executed");

// ✓ Funds still available
(, , address token, uint256 amount, , , , , , , , , ,) = 
    manager.getProposal(proposalId);
if (token == address(0)) {
    require(vault.getETHBalance() >= amount, "ETH available");
} else {
    require(vault.getTokenBalance(token) >= amount, "Tokens available");
}
```

---

## Troubleshooting

### "Not a guardian" Error

**Cause**: Caller doesn't hold guardian SBT

**Fix**:
```solidity
// Check if address has SBT
bool hasNFT = guardianSBT.balanceOf(address).balanceOf > 0;

// If not, mint SBT
guardianSBT.mint(guardian);
```

### "Insufficient approvals" Error

**Cause**: Not enough guardians have voted yet

**Fix**:
```solidity
// Check votes needed
uint256 needed = manager.approvalsNeeded(proposalId);
console.log("Still need:", needed, "approvals");

// Wait for more guardians to vote, or update quorum
vault.setQuorum(2);  // Lower from 3 to 2
```

### "Voting period ended" Error

**Cause**: Trying to vote after 3-day window

**Fix**:
```solidity
// Check deadline
(, , , , , , , , uint256 deadline, , , , ,) = manager.getProposal(proposalId);
console.log("Deadline:", deadline);
console.log("Now:", block.timestamp);

// If expired, create new proposal
proposalId = vault.proposeWithdrawal(address(0), amount, recipient, reason);
```

### "Already executed" Error

**Cause**: Proposal already transferred funds

**Fix**:
```solidity
// Check if executed
bool executed = vault.isProposalExecuted(proposalId);

// If yes, confirm funds were transferred and create new proposal if needed
```

### "Insufficient balance" Error

**Cause**: Vault doesn't have enough funds

**Fix**:
```solidity
// Check current balance
uint256 balance = vault.getETHBalance();
console.log("Available:", balance);

// Propose smaller amount or deposit more funds
vault.depositETH{value: additionalFunds}();
```

### "Vault not managed" Error

**Cause**: Vault not registered with proposal manager

**Fix**:
```solidity
// Verify vault is managed
bool managed = factory.isManagedVault(vaultAddress);

// If not, use factory to create vault
vault = factory.createVault(2);
```

---

## Gas Optimization Tips

### 1. Batch Operations

Instead of:
```solidity
vault.proposeWithdrawal(...);  // Separate proposal
vault.proposeWithdrawal(...);  // Separate proposal
```

Consider combining into single proposal with multiple outputs.

### 2. Reuse Proposals

Instead of rejecting and creating new proposal:
```solidity
// Vote on existing proposal
vault.voteApproveProposal(proposalId);

// Let voting window handle expiration if consensus not reached
```

### 3. Monitor Events

Use events for tracking instead of querying:
```solidity
event ProposalCreated(...);      // Listen for new proposals
event ProposalApproved(...);     // Track votes
event ProposalQuorumReached(...); // Know when ready
event ProposalExecuted(...);     // Confirm execution
```

---

## Integration Checklist

### Pre-Deployment

- [ ] Deploy Guardian SBT contract
- [ ] Deploy Factory contract
- [ ] Verify factory deployment
- [ ] Get proposal manager address

### Setup

- [ ] Create vault using factory
- [ ] Mint guardian SBTs
- [ ] Verify guardians have SBTs
- [ ] Set quorum (if not 2-of-3 default)
- [ ] Test with small amount first

### Operations

- [ ] Create test proposal
- [ ] Have guardians vote
- [ ] Execute proposal
- [ ] Verify funds transferred
- [ ] Check events emitted

### Monitoring

- [ ] Monitor ProposalCreated events
- [ ] Track voting progress
- [ ] Alert on unusual patterns
- [ ] Log all executions

---

## Data Structures Reference

### ProposalStatus Enum

```
0 = PENDING     (Waiting for votes)
1 = APPROVED    (Quorum reached)
2 = EXECUTED    (Transfer completed)
3 = REJECTED    (Manually rejected)
4 = EXPIRED     (3-day deadline passed)
```

### Proposal Return Tuple

```solidity
(
    uint256 proposalId,              // Index
    address vault,                   // Vault address
    address token,                   // Token (0x0 for ETH)
    uint256 amount,                  // Amount
    address recipient,               // Recipient
    string memory reason,            // Description
    address proposer,                // Creator
    uint256 createdAt,               // Timestamp created
    uint256 votingDeadline,          // 3 days from creation
    uint256 approvalsCount,          // Current votes
    uint8 status,                    // Status (0-4)
    bool executed,                   // Executed flag
    uint256 executedAt,              // Timestamp executed
    (remaining fields)
)
```

---

## Key Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| VOTING_PERIOD | 3 days | Voting window duration |
| PENDING | 0 | Initial status |
| APPROVED | 1 | Quorum reached |
| EXECUTED | 2 | Transfer complete |
| REJECTED | 3 | Rejected status |
| EXPIRED | 4 | Deadline passed |

---

## Function Call Cheat Sheet

```solidity
// FACTORY
factory.createVault(quorum)
factory.getUserVaults(user)
factory.getAllVaults()
factory.getVaultCount()
factory.getUserVaultCount(user)
factory.getProposalManager()
factory.isManagedVault(vault)

// VAULT
vault.proposeWithdrawal(token, amount, recipient, reason)
vault.voteApproveProposal(proposalId)
vault.executeProposalWithdrawal(proposalId)
vault.depositETH() {value}
vault.deposit(token, amount)
vault.setQuorum(newQuorum)
vault.updateGuardianToken(newToken)
vault.updateProposalManager(newManager)
vault.getETHBalance()
vault.getTokenBalance(token)
vault.isProposalExecuted(proposalId)

// MANAGER
manager.registerVault(vault, quorum)
manager.createProposal(vault, token, amount, recipient, reason)
manager.approveProposal(proposalId, voter)
manager.executeProposal(proposalId)
manager.rejectProposal(proposalId, reason)
manager.getProposal(proposalId)
manager.hasVoted(proposalId, voter)
manager.approvalsNeeded(proposalId)
manager.getVaultQuorum(vault)
manager.updateVaultQuorum(vault, newQuorum)
manager.getVaultProposals(vault)
manager.getProposalCount(vault)
manager.isManaged(vault)

// SBT
guardianSBT.balanceOf(address)
guardianSBT.mint(address)
```

---

## Quick Debug

```solidity
// Is proposal approved?
(, , , , , , , , , uint256 approvalsCount, uint8 status, , ,) = 
    manager.getProposal(proposalId);
console.log("Status:", status);  // 0=pending, 1=approved
console.log("Approvals:", approvalsCount);

// Can guardian vote?
bool isGuardian = guardianSBT.balanceOf(guardianAddr) > 0;
bool hasVoted = manager.hasVoted(proposalId, guardianAddr);
console.log("Guardian:", isGuardian);
console.log("Already voted:", hasVoted);

// Can execute?
bool executed = vault.isProposalExecuted(proposalId);
uint256 balance = vault.getETHBalance();
(, , , uint256 amount, , , , , , , , , ,) = manager.getProposal(proposalId);
console.log("Executed:", executed);
console.log("Has funds:", balance >= amount);
```

---

## Summary

| What | How | Code |
|------|-----|------|
| Create proposal | Owner calls proposeWithdrawal | `vault.proposeWithdrawal(token, amount, recipient, reason)` |
| Vote | Guardian calls voteApproveProposal | `vault.voteApproveProposal(proposalId)` |
| Execute | Anyone calls executeProposalWithdrawal | `vault.executeProposalWithdrawal(proposalId)` |
| Check status | Query getProposal | `manager.getProposal(proposalId)` |
| Check balance | Query getETHBalance/getTokenBalance | `vault.getETHBalance()` |
| Get voting progress | Check approvalsNeeded | `manager.approvalsNeeded(proposalId)` |
