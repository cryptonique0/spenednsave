# Proposal System API Reference

## Complete Contract API Documentation

---

## WithdrawalProposalManager

### Overview

Centralized service managing all proposals across all vaults. Handles proposal lifecycle, voting, status tracking, and quorum detection.

**Location**: `contracts/WithdrawalProposalManager.sol`  
**Type**: Service Contract  
**Deployment**: 1 per factory (shared)  

---

### State Structures

#### WithdrawalProposal Struct

```solidity
struct WithdrawalProposal {
    uint256 proposalId;              // Unique proposal identifier
    address vault;                   // Vault address (proposal owner)
    address token;                   // Token address (0x0 for ETH)
    uint256 amount;                  // Withdrawal amount (wei)
    address recipient;               // Recipient address
    string reason;                   // Withdrawal reason/description
    address proposer;                // Proposal creator
    uint256 createdAt;               // Creation timestamp (block.timestamp)
    uint256 votingDeadline;          // Deadline for voting (creation + 3 days)
    uint256 approvalsCount;          // Number of approvals received
    ProposalStatus status;           // Current status (enum)
    mapping(address => bool) hasVoted; // Vote tracking per address
    bool executed;                   // Execution flag
    uint256 executedAt;              // Execution timestamp
}
```

#### ProposalStatus Enum

```solidity
enum ProposalStatus {
    PENDING,    // 0 - Awaiting votes
    APPROVED,   // 1 - Quorum reached
    EXECUTED,   // 2 - Transfer completed
    REJECTED,   // 3 - Rejected
    EXPIRED     // 4 - Voting window expired
}
```

---

### Constants

```solidity
uint256 constant VOTING_PERIOD = 3 days;  // 259,200 seconds
```

---

### State Variables

```solidity
uint256 public proposalCounter;                              // Next proposal ID
mapping(uint256 => WithdrawalProposal) public proposals;     // Proposal storage
mapping(address => uint256[]) public vaultProposals;         // Proposals per vault
mapping(address => bool) public managed;                     // Managed vaults
mapping(address => uint256) public vaultQuorum;              // Quorum per vault
```

---

### Core Functions

#### registerVault

```solidity
function registerVault(address vault, uint256 quorum) external
```

**Purpose**: Register a vault with the manager

**Parameters**:
- `vault` (address): Vault address to register
- `quorum` (uint256): Required approvals for this vault

**Returns**: None

**Events Emitted**:
```solidity
event VaultRegistered(
    address indexed vault,
    uint256 quorum,
    uint256 timestamp
);
```

**Reverts**:
- `"Vault already registered"` - Vault already managed

**Example**:
```solidity
manager.registerVault(address(myVault), 2);
```

---

#### createProposal

```solidity
function createProposal(
    address vault,
    address token,
    uint256 amount,
    address recipient,
    string calldata reason
) external returns (uint256)
```

**Purpose**: Create a new withdrawal proposal

**Parameters**:
- `vault` (address): Vault for proposal
- `token` (address): Token address (0x0 for ETH)
- `amount` (uint256): Withdrawal amount in wei
- `recipient` (address): Recipient address
- `reason` (string): Withdrawal reason

**Returns**:
- `uint256`: Proposal ID

**Events Emitted**:
```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    address indexed vault,
    address indexed proposer,
    uint256 amount,
    uint256 deadline,
    uint256 timestamp
);
```

**Reverts**:
- `"Vault not managed"` - Vault not registered
- `"Invalid recipient"` - Recipient is address(0)
- `"Amount must be > 0"` - Amount is zero

**Gas**: ~120,000

**Example**:
```solidity
uint256 proposalId = manager.createProposal(
    address(vault),
    address(usdc),
    1000 * 10**6,
    0x1234567890123456789012345678901234567890,
    "USDC payment"
);
```

---

#### approveProposal

```solidity
function approveProposal(uint256 proposalId, address voter) external returns (bool)
```

**Purpose**: Vote approve on a proposal

**Parameters**:
- `proposalId` (uint256): Proposal ID to vote on
- `voter` (address): Voter address

**Returns**:
- `bool`: true if quorum reached, false otherwise

**Events Emitted**:
```solidity
event ProposalApproved(
    uint256 indexed proposalId,
    address indexed voter,
    uint256 approvalsCount,
    uint256 timestamp
);

// Also emitted if quorum reached:
event ProposalQuorumReached(
    uint256 indexed proposalId,
    uint256 approvalsCount,
    uint256 timestamp
);
```

**Reverts**:
- `"Proposal not found"` - Invalid proposalId
- `"Proposal not pending"` - Status not PENDING
- `"Voting period ended"` - Past voting deadline
- `"Already voted"` - Voter already voted

**Gas**: ~75,000

**Example**:
```solidity
bool quorumReached = manager.approveProposal(proposalId, guardianAddress);
if (quorumReached) {
    console.log("Proposal approved, ready to execute!");
}
```

---

#### executeProposal

```solidity
function executeProposal(uint256 proposalId) external
```

**Purpose**: Mark proposal as executed

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**: None

**Events Emitted**:
```solidity
event ProposalExecuted(
    uint256 indexed proposalId,
    uint256 timestamp
);
```

**Reverts**:
- `"Proposal not found"` - Invalid proposalId
- `"Already executed"` - Proposal already executed

**Example**:
```solidity
manager.executeProposal(proposalId);
```

---

#### rejectProposal

```solidity
function rejectProposal(uint256 proposalId, string calldata reason) external
```

**Purpose**: Reject a proposal

**Parameters**:
- `proposalId` (uint256): Proposal ID
- `reason` (string): Rejection reason

**Returns**: None

**Events Emitted**:
```solidity
event ProposalRejected(
    uint256 indexed proposalId,
    string reason,
    uint256 timestamp
);
```

**Example**:
```solidity
manager.rejectProposal(proposalId, "Insufficient funds");
```

---

### Query Functions

#### getProposal

```solidity
function getProposal(uint256 proposalId) external view returns (
    uint256 proposalId,
    address vault,
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    address proposer,
    uint256 createdAt,
    uint256 votingDeadline,
    uint256 approvalsCount,
    uint8 status,
    bool executed,
    uint256 executedAt,
    (additional return values)
)
```

**Purpose**: Get complete proposal details

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**: Complete proposal data tuple

**Gas**: <1,000 (view function)

**Example**:
```solidity
(
    uint256 id,
    address vaultAddr,
    address tokenAddr,
    uint256 amount,
    address recipientAddr,
    string memory reason,
    address proposer,
    uint256 createdAt,
    uint256 deadline,
    uint256 approvals,
    uint8 status,
    bool executed,
    uint256 executedAt,
) = manager.getProposal(proposalId);

console.log("Status:", status);  // 0=pending, 1=approved, etc.
console.log("Approvals:", approvals);
```

---

#### hasVoted

```solidity
function hasVoted(uint256 proposalId, address voter) external view returns (bool)
```

**Purpose**: Check if voter has voted on proposal

**Parameters**:
- `proposalId` (uint256): Proposal ID
- `voter` (address): Voter address

**Returns**:
- `bool`: true if voted, false otherwise

**Gas**: <1,000

**Example**:
```solidity
if (!manager.hasVoted(proposalId, guardianAddress)) {
    // Guardian can vote
}
```

---

#### approvalsNeeded

```solidity
function approvalsNeeded(uint256 proposalId) external view returns (uint256)
```

**Purpose**: Get number of votes needed to reach quorum

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**:
- `uint256`: Approvals still needed (can be 0 if quorum reached)

**Gas**: <1,000

**Example**:
```solidity
uint256 needed = manager.approvalsNeeded(proposalId);
console.log("Need", needed, "more approvals");
```

---

#### getVaultQuorum

```solidity
function getVaultQuorum(address vault) external view returns (uint256)
```

**Purpose**: Get quorum requirement for vault

**Parameters**:
- `vault` (address): Vault address

**Returns**:
- `uint256`: Required approvals

**Gas**: <1,000

**Example**:
```solidity
uint256 quorum = manager.getVaultQuorum(address(vault));
console.log("Quorum:", quorum);  // e.g., 2
```

---

#### updateVaultQuorum

```solidity
function updateVaultQuorum(address vault, uint256 newQuorum) external
```

**Purpose**: Update quorum for vault (callable by vault)

**Parameters**:
- `vault` (address): Vault address
- `newQuorum` (uint256): New quorum requirement

**Returns**: None

**Example**:
```solidity
manager.updateVaultQuorum(address(vault), 3);
```

---

#### getVaultProposals

```solidity
function getVaultProposals(address vault) external view returns (uint256[])
```

**Purpose**: Get all proposal IDs for vault

**Parameters**:
- `vault` (address): Vault address

**Returns**:
- `uint256[]`: Array of proposal IDs

**Gas**: <1,000 (view)

**Example**:
```solidity
uint256[] memory proposals = manager.getVaultProposals(address(vault));
console.log("Proposal count:", proposals.length);

for (uint256 i = 0; i < proposals.length; i++) {
    uint256 proposalId = proposals[i];
    // Process proposal
}
```

---

#### getProposalCount

```solidity
function getProposalCount(address vault) external view returns (uint256)
```

**Purpose**: Get proposal count for vault

**Parameters**:
- `vault` (address): Vault address

**Returns**:
- `uint256`: Number of proposals

**Gas**: <1,000

**Example**:
```solidity
uint256 count = manager.getProposalCount(address(vault));
```

---

#### isManaged

```solidity
function isManaged(address vault) external view returns (bool)
```

**Purpose**: Check if vault is managed

**Parameters**:
- `vault` (address): Vault address

**Returns**:
- `bool`: true if managed, false otherwise

**Gas**: <1,000

**Example**:
```solidity
if (manager.isManaged(address(vault))) {
    // Vault is registered
}
```

---

## SpendVaultWithProposals

### Overview

Multi-signature vault with proposal-based withdrawals. Handles proposal creation, guardian voting, and execution.

**Location**: `contracts/SpendVaultWithProposals.sol`  
**Type**: User Vault Contract  
**Deployment**: 1+ per user  

---

### State Variables

```solidity
address public owner;                          // Vault owner
address public guardianToken;                  // Guardian SBT address
address public proposalManager;                // Manager instance
uint256 public quorum;                         // Required approvals
mapping(uint256 => bool) public proposalExecuted; // Execution tracking
```

---

### Core Functions

#### proposeWithdrawal

```solidity
function proposeWithdrawal(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason
) external returns (uint256)
```

**Purpose**: Create withdrawal proposal (owner only)

**Parameters**:
- `token` (address): Token address (0x0 for ETH)
- `amount` (uint256): Withdrawal amount
- `recipient` (address): Recipient address
- `reason` (string): Reason for withdrawal

**Returns**:
- `uint256`: Proposal ID

**Modifiers**: onlyOwner

**Reverts**:
- `"Only owner can propose"` - Not owner
- `"Insufficient ETH"` - Not enough ETH balance
- `"Insufficient tokens"` - Not enough token balance

**Gas**: ~120,000

**Example**:
```solidity
// ETH proposal
uint256 proposalId = vault.proposeWithdrawal(
    address(0),
    1 ether,
    0x1234567890123456789012345678901234567890,
    "Payment for services"
);

// Token proposal
proposalId = vault.proposeWithdrawal(
    address(usdc),
    1000 * 10**6,
    0x1234567890123456789012345678901234567890,
    "USDC payment"
);
```

---

#### voteApproveProposal

```solidity
function voteApproveProposal(uint256 proposalId) external
```

**Purpose**: Vote approve on proposal (guardian only)

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**: None

**Reverts**:
- `"Not a guardian"` - Caller doesn't hold guardian SBT
- `"Already voted"` - Already voted on this proposal

**Gas**: ~75,000

**Example**:
```solidity
vault.voteApproveProposal(proposalId);
```

---

#### executeProposalWithdrawal

```solidity
function executeProposalWithdrawal(uint256 proposalId) external nonReentrant
```

**Purpose**: Execute approved proposal (transfers funds)

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**: None

**Events Emitted**:
```solidity
event ProposalWithdrawalExecuted(
    uint256 indexed proposalId,
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256 timestamp
);
```

**Reverts**:
- `"Already executed"` - Proposal already executed
- `"Not approved"` - Proposal not approved
- `"Insufficient approvals"` - Quorum not met
- `"ETH transfer failed"` - ETH transfer failed
- `"Token transfer failed"` - ERC-20 transfer failed

**Gas**: 65,000-95,000

**Example**:
```solidity
vault.executeProposalWithdrawal(proposalId);
// Funds transferred to recipient
```

---

### Deposit Functions

#### depositETH

```solidity
function depositETH() external payable
```

**Purpose**: Deposit ETH to vault

**Parameters**: None (ETH sent via value)

**Returns**: None

**Example**:
```solidity
vault.depositETH{value: 10 ether}();
```

---

#### deposit

```solidity
function deposit(address token, uint256 amount) external
```

**Purpose**: Deposit ERC-20 tokens to vault

**Parameters**:
- `token` (address): Token address
- `amount` (uint256): Amount to deposit

**Returns**: None

**Requirements**:
- Token must be approved first

**Example**:
```solidity
usdc.approve(address(vault), 1000 * 10**6);
vault.deposit(address(usdc), 1000 * 10**6);
```

---

### Configuration Functions

#### setQuorum

```solidity
function setQuorum(uint256 newQuorum) external
```

**Purpose**: Update quorum requirement

**Parameters**:
- `newQuorum` (uint256): New quorum

**Modifiers**: onlyOwner

**Example**:
```solidity
vault.setQuorum(3);  // Change from 2-of-3 to 3-of-5
```

---

#### updateGuardianToken

```solidity
function updateGuardianToken(address newToken) external
```

**Purpose**: Update guardian SBT address

**Parameters**:
- `newToken` (address): New SBT address

**Modifiers**: onlyOwner

**Example**:
```solidity
vault.updateGuardianToken(address(newSBT));
```

---

#### updateProposalManager

```solidity
function updateProposalManager(address newManager) external
```

**Purpose**: Update proposal manager address

**Parameters**:
- `newManager` (address): New manager address

**Modifiers**: onlyOwner

**Example**:
```solidity
vault.updateProposalManager(address(newManager));
```

---

### Query Functions

#### getETHBalance

```solidity
function getETHBalance() external view returns (uint256)
```

**Purpose**: Get ETH balance of vault

**Returns**:
- `uint256`: ETH balance in wei

**Gas**: <1,000

**Example**:
```solidity
uint256 ethBalance = vault.getETHBalance();
```

---

#### getTokenBalance

```solidity
function getTokenBalance(address token) external view returns (uint256)
```

**Purpose**: Get ERC-20 balance of vault

**Parameters**:
- `token` (address): Token address

**Returns**:
- `uint256`: Token balance

**Gas**: <1,000

**Example**:
```solidity
uint256 usdcBalance = vault.getTokenBalance(address(usdc));
```

---

#### isProposalExecuted

```solidity
function isProposalExecuted(uint256 proposalId) external view returns (bool)
```

**Purpose**: Check if proposal has been executed

**Parameters**:
- `proposalId` (uint256): Proposal ID

**Returns**:
- `bool`: true if executed

**Gas**: <1,000

**Example**:
```solidity
if (vault.isProposalExecuted(proposalId)) {
    console.log("Proposal already executed");
}
```

---

## VaultFactoryWithProposals

### Overview

Factory for deploying vaults with proposal capability. Creates shared manager and individual vaults.

**Location**: `contracts/VaultFactoryWithProposals.sol`  
**Type**: Factory Contract  
**Deployment**: 1 per network  

---

### State Variables

```solidity
WithdrawalProposalManager public proposalManager;         // Shared manager
mapping(address => address[]) public userVaults;          // Vaults per user
address[] public allVaults;                               // All vaults
mapping(address => bool) public isManagedVault;           // Vault tracking
```

---

### Constructor

```solidity
constructor(address guardianSBT)
```

**Parameters**:
- `guardianSBT` (address): Guardian SBT contract address

**Actions**:
- Deploys WithdrawalProposalManager
- Stores guardian SBT reference

**Example**:
```solidity
factory = new VaultFactoryWithProposals(address(guardianSBT));
```

---

### Core Functions

#### createVault

```solidity
function createVault(uint256 quorum) external returns (address)
```

**Purpose**: Create new vault with proposal capability

**Parameters**:
- `quorum` (uint256): Required approvals

**Returns**:
- `address`: New vault address

**Actions**:
- Deploys SpendVaultWithProposals
- Registers with manager
- Tracks in userVaults
- Marks as managed

**Example**:
```solidity
address vault = factory.createVault(2);
```

---

### Vault Enumeration Functions

#### getUserVaults

```solidity
function getUserVaults(address user) external view returns (address[])
```

**Purpose**: Get all vaults owned by user

**Parameters**:
- `user` (address): User address

**Returns**:
- `address[]`: Array of vault addresses

**Gas**: <1,000

**Example**:
```solidity
address[] memory userVaults = factory.getUserVaults(userAddress);
for (uint256 i = 0; i < userVaults.length; i++) {
    console.log("Vault", i, ":", userVaults[i]);
}
```

---

#### getVaultCount

```solidity
function getVaultCount() external view returns (uint256)
```

**Purpose**: Get total vault count

**Returns**:
- `uint256`: Number of vaults

**Gas**: <1,000

**Example**:
```solidity
uint256 count = factory.getVaultCount();
console.log("Total vaults:", count);
```

---

#### getAllVaults

```solidity
function getAllVaults() external view returns (address[])
```

**Purpose**: Get all vaults

**Returns**:
- `address[]`: Array of all vault addresses

**Gas**: <1,000

**Example**:
```solidity
address[] memory vaults = factory.getAllVaults();
```

---

#### isManagedVault

```solidity
function isManagedVault(address vault) external view returns (bool)
```

**Purpose**: Check if vault is managed

**Parameters**:
- `vault` (address): Vault address

**Returns**:
- `bool`: true if managed

**Gas**: <1,000

**Example**:
```solidity
if (factory.isManagedVault(address(vault))) {
    // Vault created by this factory
}
```

---

#### getUserVaultCount

```solidity
function getUserVaultCount(address user) external view returns (uint256)
```

**Purpose**: Get user's vault count

**Parameters**:
- `user` (address): User address

**Returns**:
- `uint256`: Number of user's vaults

**Gas**: <1,000

**Example**:
```solidity
uint256 count = factory.getUserVaultCount(userAddress);
```

---

#### getProposalManager

```solidity
function getProposalManager() external view returns (address)
```

**Purpose**: Get proposal manager address

**Returns**:
- `address`: Manager address

**Gas**: <1,000

**Example**:
```solidity
address manager = factory.getProposalManager();
```

---

## Events Reference

### ProposalCreated

```solidity
event ProposalCreated(
    uint256 indexed proposalId,
    address indexed vault,
    address indexed proposer,
    uint256 amount,
    uint256 deadline,
    uint256 timestamp
);
```

**Emitted When**: Proposal created  
**Parameters**:
- proposalId: Unique proposal ID
- vault: Vault address
- proposer: Creator address
- amount: Withdrawal amount
- deadline: Voting deadline
- timestamp: Creation block timestamp

---

### ProposalApproved

```solidity
event ProposalApproved(
    uint256 indexed proposalId,
    address indexed voter,
    uint256 approvalsCount,
    uint256 timestamp
);
```

**Emitted When**: Guardian votes  
**Parameters**:
- proposalId: Proposal ID
- voter: Voter address
- approvalsCount: Total votes
- timestamp: Voting block timestamp

---

### ProposalQuorumReached

```solidity
event ProposalQuorumReached(
    uint256 indexed proposalId,
    uint256 approvalsCount,
    uint256 timestamp
);
```

**Emitted When**: Quorum achieved  
**Parameters**:
- proposalId: Proposal ID
- approvalsCount: Final vote count
- timestamp: Achievement block timestamp

---

### ProposalExecuted

```solidity
event ProposalExecuted(
    uint256 indexed proposalId,
    uint256 timestamp
);
```

**Emitted When**: Proposal marked executed  
**Parameters**:
- proposalId: Proposal ID
- timestamp: Execution block timestamp

---

### ProposalRejected

```solidity
event ProposalRejected(
    uint256 indexed proposalId,
    string reason,
    uint256 timestamp
);
```

**Emitted When**: Proposal rejected  
**Parameters**:
- proposalId: Proposal ID
- reason: Rejection reason
- timestamp: Rejection block timestamp

---

### ProposalWithdrawalExecuted

```solidity
event ProposalWithdrawalExecuted(
    uint256 indexed proposalId,
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256 timestamp
);
```

**Emitted When**: Funds transferred  
**Parameters**:
- proposalId: Proposal ID
- token: Token address (0x0 for ETH)
- amount: Transferred amount
- recipient: Recipient address
- timestamp: Transfer block timestamp

---

### VaultRegistered

```solidity
event VaultRegistered(
    address indexed vault,
    uint256 quorum,
    uint256 timestamp
);
```

**Emitted When**: Vault registered  
**Parameters**:
- vault: Vault address
- quorum: Quorum requirement
- timestamp: Registration block timestamp

---

## Error Messages

| Error | Context | Solution |
|-------|---------|----------|
| `"Vault not managed"` | createProposal | Use registered vault |
| `"Invalid recipient"` | createProposal | Provide non-zero address |
| `"Amount must be > 0"` | createProposal | Propose positive amount |
| `"Already voted"` | approveProposal | Each guardian votes once |
| `"Not a guardian"` | voteApproveProposal | Must hold SBT |
| `"Voting period ended"` | approveProposal | Within 3 days |
| `"Insufficient approvals"` | executeProposalWithdrawal | Wait for more votes |
| `"Insufficient ETH"` | proposeWithdrawal | Check balance |
| `"Insufficient tokens"` | proposeWithdrawal | Check balance |
| `"Only owner can propose"` | proposeWithdrawal | Must be owner |
| `"Already executed"` | executeProposalWithdrawal | Each executes once |
| `"Proposal not found"` | approveProposal | Valid proposalId |
| `"Proposal not pending"` | approveProposal | Status = PENDING |
| `"ETH transfer failed"` | executeProposalWithdrawal | Check recipient |
| `"Token transfer failed"` | executeProposalWithdrawal | Check allowance |

---

## Summary Table

### Function Overview

| Category | Function | Gas | Returns |
|----------|----------|-----|---------|
| **Proposal Creation** | createProposal | 120,000 | uint256 |
| **Voting** | approveProposal | 75,000 | bool |
| **Execution** | executeProposal | Var | - |
| **Queries** | getProposal | View | Tuple |
| | getVaultProposals | View | uint256[] |
| | hasVoted | View | bool |
| | approvalsNeeded | View | uint256 |
| **Configuration** | registerVault | 45,000 | - |
| | setQuorum | Var | - |
| | updateVaultQuorum | Var | - |
| **Factory** | createVault | 180,000 | address |
| | getUserVaults | View | address[] |
| | getAllVaults | View | address[] |

---

## Complete Example Flow

```solidity
// 1. Deploy factory
guardianSBT = new GuardianSBT();
factory = new VaultFactoryWithProposals(address(guardianSBT));

// 2. Create vault
address vaultAddr = factory.createVault(2);
SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));

// 3. Mint guardians
guardianSBT.mint(guardian1);
guardianSBT.mint(guardian2);

// 4. Deposit funds
vault.depositETH{value: 10 ether}();

// 5. Propose withdrawal
uint256 proposalId = vault.proposeWithdrawal(
    address(0),
    1 ether,
    recipient,
    "Test"
);

// 6. Vote
vault.voteApproveProposal(proposalId);  // Guardian 1
vault.voteApproveProposal(proposalId);  // Guardian 2 (quorum reached)

// 7. Execute
vault.executeProposalWithdrawal(proposalId);
// ETH transferred to recipient
```
