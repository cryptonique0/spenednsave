# Emergency Guardian Override - Implementation Guide

## Overview

Feature #9 introduces an **Emergency Guardian Override** mechanism - a special guardian set that only activates during emergency unlock mode. This provides an alternative approval pathway for emergency withdrawals, allowing designated emergency guardians to immediately approve withdrawals during true emergencies without waiting for the 30-day timelock.

## Architecture

### Three-Component System

```
1. GuardianEmergencyOverride
   ├─ Manages emergency guardian identity
   ├─ Tracks approval proposals
   ├─ Enforces quorum requirements
   └─ Records voting history

2. SpendVaultWithEmergencyOverride
   ├─ Integrates emergency override into vault
   ├─ Initiates emergency unlock process
   ├─ Routes approvals to emergency override
   └─ Executes withdrawals via approval or timelock

3. VaultFactoryWithEmergencyOverride
   ├─ Deploys guardian SBT (per user)
   ├─ Deploys vault with override (per user)
   ├─ Deploys shared emergency override (per network)
   └─ Manages factory-wide registry
```

### Emergency Unlock Flow

```
Normal State (No Emergency)
├─ Vault operates normally
├─ Emergency guardians are designated but inactive
└─ Regular guardians manage withdrawals

Emergency Request
├─ Owner calls requestEmergencyUnlock()
├─ New emergency ID generated
├─ Emergency guardians can now approve
└─ Timer starts (30 days for fallback)

Guardian Approval Phase
├─ Each emergency guardian reviews
├─ Emergency guardian calls approveEmergencyUnlock()
├─ Approval tracked and counted
├─ Upon quorum: approval complete
└─ Alternative: wait 30 days for timelock

Execution Phase (Option A - Guardian Approval)
├─ Emergency guardian quorum reached
├─ Owner calls executeEmergencyWithdrawalViaApproval()
├─ Withdrawal processed immediately
├─ Emergency state cleared
└─ Audit trail recorded

Execution Phase (Option B - Timelock Expiry)
├─ 30 days elapsed from request
├─ Owner calls executeEmergencyUnlockViaTimelock()
├─ Withdrawal processed
├─ Emergency state cleared
└─ Audit trail recorded
```

## Key Concepts

### Emergency Guardians vs Regular Guardians

| Aspect | Regular Guardians | Emergency Guardians |
|--------|-------------------|-------------------|
| **Activation** | Always active | Only during emergency unlock |
| **Purpose** | Normal withdrawal approvals | Emergency override approvals |
| **Group Size** | Typically 3+ | Typically 1-3 (smaller trusted circle) |
| **Response Time** | Standard multi-sig flow | Immediate approval pathway |
| **Override Power** | Cannot bypass timelock | Can bypass 30-day timelock |
| **Risk Profile** | Standard operational | High sensitivity/trust |

### Emergency ID Tracking

Each emergency unlock attempt gets a unique emergency ID:

```javascript
// First emergency: emergencyId = 0
vault.requestEmergencyUnlock(); // emergencyId: 0

// Second emergency: emergencyId = 1
vault.requestEmergencyUnlock(); // emergencyId: 1

// Prevents vote mixing across different emergencies
```

This prevents approvals from one emergency being used for another.

### Quorum Enforcement

Emergency guardian quorum is independent from regular guardian quorum:

```javascript
// Setup: 3 regular guardians, quorum 2
// Setup: 3 emergency guardians, emergency quorum 2

// Regular withdrawal: needs 2 of 3 regular guardians
// Emergency withdrawal: needs 2 of 3 emergency guardians (separate)
```

## Contract APIs

### GuardianEmergencyOverride.sol

#### Guardian Management

```solidity
function addEmergencyGuardian(address vault, address guardian) external onlyOwner
```
- Add a new emergency guardian to a vault
- Emits: `EmergencyGuardianAdded`
- Access: Factory only

```solidity
function removeEmergencyGuardian(address vault, address guardian) external onlyOwner
```
- Remove an emergency guardian
- Emits: `EmergencyGuardianRemoved`
- Access: Factory only

```solidity
function isEmergencyGuardian(address vault, address guardian) external view returns (bool)
```
- Check if address is an emergency guardian

```solidity
function getEmergencyGuardians(address vault) external view returns (address[] memory)
```
- Get all emergency guardians for a vault

#### Quorum Management

```solidity
function setEmergencyQuorum(address vault, uint256 quorum) external onlyOwner
```
- Set how many emergency guardian approvals are needed
- Requirement: quorum <= total emergency guardians
- Emits: `EmergencyQuorumSet`

```solidity
function getEmergencyQuorum(address vault) external view returns (uint256)
```
- Get emergency quorum requirement

#### Emergency Approval

```solidity
function approveEmergencyUnlock(address vault, uint256 emergencyId) external returns (bool)
```
- Called by emergency guardian to approve emergency
- Returns: true if quorum reached
- Prevents duplicate votes: "Already approved this emergency"
- Emits: `EmergencyApprovalReceived`, and `EmergencyApprovalQuorumReached` if quorum reached

```solidity
function isEmergencyApproved(address vault, uint256 emergencyId) external view returns (bool)
```
- Check if emergency has been approved (quorum reached)

```solidity
function getEmergencyApprovalCount(address vault, uint256 emergencyId) external view returns (uint256)
```
- Get number of approvals received for specific emergency

```solidity
function getApprovalsNeeded(address vault, uint256 emergencyId) external view returns (uint256)
```
- Get remaining approvals needed to reach quorum

```solidity
function hasGuardianApproved(address vault, uint256 emergencyId, address guardian) external view returns (bool)
```
- Check if specific guardian already voted

#### Emergency Management

```solidity
function activateEmergencyOverride(address vault) external returns (uint256)
```
- Start new emergency override process
- Returns: new emergencyId
- Emits: `EmergencyOverrideActivated`
- Called by vault when emergency unlock requested

```solidity
function cancelEmergencyOverride(address vault, uint256 emergencyId, string calldata reason) external onlyOwner
```
- Cancel emergency override (reset approvals)
- Emits: `EmergencyOverrideCancelled`

### SpendVaultWithEmergencyOverride.sol

#### Emergency Guardian Setup

```solidity
function addEmergencyGuardian(address guardian) external onlyOwner
```
- Add emergency guardian to this vault (via factory during setup)
- Calls GuardianEmergencyOverride.addEmergencyGuardian

```solidity
function setEmergencyGuardianQuorum(uint256 _quorum) external onlyOwner
```
- Set emergency quorum for this vault (via factory during setup)

```solidity
function getEmergencyGuardians() external view returns (address[] memory)
```
- Get all emergency guardians for this vault

```solidity
function getEmergencyGuardianCount() external view returns (uint256)
```
- Get count of emergency guardians

#### Emergency Unlock Flow

```solidity
function requestEmergencyUnlock() external onlyOwner returns (uint256)
```
- Initiate emergency unlock process
- Returns: emergencyId for this request
- Sets: emergencyUnlockRequestTime = now
- Emits: `EmergencyUnlockRequested`
- Starts 30-day timelock counter

```solidity
function approveEmergencyUnlock(uint256 emergencyId) external returns (bool)
```
- Emergency guardian approves this emergency
- Access: Emergency guardian only
- Returns: true if quorum reached and auto-executed
- Emits: `EmergencyUnlockApprovedByGuardian`
- Validates: msg.sender is emergency guardian, emergency still valid

```solidity
function executeEmergencyWithdrawalViaApproval(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    uint256 emergencyId
) external onlyOwner nonReentrant
```
- Execute withdrawal immediately after emergency guardian approval
- Requirements:
  - Emergency has been approved (quorum reached)
  - Invalid emergencyId reverts with "Invalid emergency ID"
  - Sufficient balance available
  - Valid recipient (not address(0))
- Emits: `EmergencyWithdrawalExecutedViaApproval`
- Clears: emergency unlock state

```solidity
function executeEmergencyUnlockViaTimelock(
    address token,
    uint256 amount,
    address recipient
) external onlyOwner nonReentrant
```
- Execute withdrawal via 30-day timelock (fallback mechanism)
- Requirements:
  - Emergency unlock requested
  - 30 days elapsed: "Timelock period not yet expired"
  - Sufficient balance
- Emits: `EmergencyWithdrawalExecutedViaTimelock`
- Clears: emergency unlock state

```solidity
function cancelEmergencyUnlock() external onlyOwner
```
- Cancel pending emergency unlock
- Requirements: emergency unlock in progress
- Emits: `EmergencyUnlockCancelled`
- Clears: emergency unlock state

#### Status Views

```solidity
function isEmergencyUnlockActive() external view returns (bool)
```
- Check if emergency unlock currently active

```solidity
function getEmergencyUnlockRequestTime() external view returns (uint256)
```
- Get timestamp of emergency unlock request

```solidity
function getEmergencyUnlockTimeRemaining() external view returns (uint256)
```
- Get seconds remaining until 30-day timelock expires
- Returns 0 if no active unlock or expired

```solidity
function getEmergencyApprovalsCount() external view returns (uint256)
```
- Get current approval count for active emergency

```solidity
function getEmergencyGuardianQuorum() external view returns (uint256)
```
- Get required emergency guardian quorum

```solidity
function getCurrentEmergencyId() external view returns (uint256)
```
- Get current emergency ID

```solidity
function getEmergencyWithdrawalDetails(uint256 emergencyId, address token) 
    external view returns (uint256 amount, string memory reason, uint256 timestamp)
```
- Get details of emergency withdrawal

### VaultFactoryWithEmergencyOverride.sol

#### Vault Creation

```solidity
function createVault(uint256 quorum, uint256 emergencyQuorum) 
    external returns (address guardianTokenAddress, address vaultAddress)
```
- Create complete vault system for caller
- Parameters:
  - `quorum`: Regular guardian quorum for normal withdrawals
  - `emergencyQuorum`: Emergency guardian quorum
- Returns: (guardianTokenAddress, vaultAddress)
- Creates: GuardianSBT, SpendVaultWithEmergencyOverride
- Uses: Shared GuardianEmergencyOverride
- Emits: `VaultCreatedWithEmergencyOverride`
- Requirement: Caller doesn't already have vault

#### Registry Functions

```solidity
function getUserContracts(address user) external view returns (address guardianToken, address vault)
```
- Get vault contracts for a user

```solidity
function hasVault(address user) external view returns (bool)
```
- Check if user has created a vault

```solidity
function getEmergencyOverride() external view returns (address)
```
- Get shared emergency override contract address

```solidity
function getTotalVaults() external view returns (uint256)
```
- Get total vaults created by factory

```solidity
function getVaultByIndex(uint256 index) external view returns (address)
```
- Enumerate vaults by index

## Usage Scenarios

### Scenario 1: Emergency Guardian Approval Path

```javascript
// 1. Setup (done during vault creation via factory)
const factory = await VaultFactoryWithEmergencyOverride.deploy();
const [guardianToken, vault] = await factory.createVault(2, 2);
// Now vault has emergency guardians setup

// 2. Request Emergency
const emergencyId = await vault.requestEmergencyUnlock();
console.log("Emergency ID:", emergencyId.toString());
console.log("Time remaining:", (await vault.getEmergencyUnlockTimeRemaining()).toString(), "seconds");

// 3. Emergency Guardians Review & Approve
const signer1 = getEmergencyGuardian1();
const signer2 = getEmergencyGuardian2();

// Guardian 1 approves
const tx1 = await vault.connect(signer1).approveEmergencyUnlock(emergencyId);
const receipt1 = await tx1.wait();
console.log("Guardian 1 approved");

// Guardian 2 approves - quorum reached!
const tx2 = await vault.connect(signer2).approveEmergencyUnlock(emergencyId);
const receipt2 = await tx2.wait();
console.log("Guardian 2 approved - QUORUM REACHED");

// 4. Execute Withdrawal Immediately
const owner = getVaultOwner();
const tx3 = await vault.connect(owner).executeEmergencyWithdrawalViaApproval(
    ethers.ZeroAddress,  // token (address(0) for ETH)
    ethers.parseEther("100"),  // amount
    recipientAddress,    // recipient
    "Critical medical emergency",  // reason
    emergencyId          // emergency ID
);
const receipt3 = await tx3.wait();
console.log("Emergency withdrawal executed via approval!");
```

### Scenario 2: Timelock Fallback Path

```javascript
// If emergency guardians not responding or unreachable:

// 1. Request Emergency
const emergencyId = await vault.requestEmergencyUnlock();

// 2. Wait 30 days...
await time.increase(30 * 24 * 60 * 60);

// 3. Execute via timelock (no guardian approval needed)
const tx = await vault.executeEmergencyUnlockViaTimelock(
    ethers.ZeroAddress,
    ethers.parseEther("100"),
    recipientAddress
);
await tx.wait();
console.log("Emergency withdrawal executed via 30-day timelock!");
```

### Scenario 3: Setup Additional Emergency Guardians

```javascript
// Add more emergency guardians to existing vault
const vault = SpendVaultWithEmergencyOverride.attach(vaultAddress);
const owner = getVaultOwner();

const newEmergencyGuardian = "0x...";
await vault.connect(owner).addEmergencyGuardian(newEmergencyGuardian);

// Update emergency quorum to 3
await vault.connect(owner).setEmergencyGuardianQuorum(3);
```

## Events

### GuardianEmergencyOverride Events

```solidity
event EmergencyGuardianAdded(address indexed vault, address indexed guardian, uint256 timestamp);
event EmergencyGuardianRemoved(address indexed vault, address indexed guardian, uint256 timestamp);
event EmergencyQuorumSet(address indexed vault, uint256 newQuorum, uint256 timestamp);
event EmergencyApprovalReceived(address indexed vault, uint256 indexed emergencyId, address indexed guardian, uint256 approvalCount, uint256 timestamp);
event EmergencyApprovalQuorumReached(address indexed vault, uint256 indexed emergencyId, uint256 approvalCount, uint256 timestamp);
event EmergencyOverrideActivated(address indexed vault, uint256 indexed emergencyId, uint256 activationTime, uint256 timestamp);
event EmergencyOverrideCancelled(address indexed vault, uint256 indexed emergencyId, string reason, uint256 timestamp);
event EmergencyApprovalReset(address indexed vault, uint256 indexed emergencyId, uint256 timestamp);
```

### SpendVaultWithEmergencyOverride Events

```solidity
event EmergencyUnlockRequested(uint256 indexed emergencyId, uint256 timestamp);
event EmergencyUnlockApprovedByGuardian(uint256 indexed emergencyId, address indexed guardian, uint256 approvalCount, uint256 timestamp);
event EmergencyWithdrawalExecutedViaApproval(uint256 indexed emergencyId, address indexed token, uint256 amount, address indexed recipient, string reason, uint256 timestamp);
event EmergencyWithdrawalExecutedViaTimelock(address indexed token, uint256 amount, address indexed recipient, uint256 timestamp);
event EmergencyUnlockCancelled(uint256 indexed emergencyId, uint256 timestamp);
event EmergencyQuorumUpdated(uint256 newQuorum, uint256 timestamp);
```

## Security Considerations

### 1. Emergency Guardian Trust Model
- **Risk**: Emergency guardians have significant power
- **Mitigation**: Typically select 1-3 most trusted individuals
- **Best Practice**: Geographically distributed, different time zones

### 2. Emergency ID Prevention
- **Risk**: Approval for one emergency used for another
- **Mitigation**: Each emergency gets unique ID, stored in contract
- **Implementation**: Automatic increment, checked before execution

### 3. Duplicate Vote Prevention
- **Risk**: Same guardian votes multiple times
- **Mitigation**: `hasVoted` mapping tracks all votes
- **Enforcement**: `require(!hasVoted[emergencyId][guardian])` check

### 4. Self-Vote Prevention
- **Risk**: Compromised emergency guardian could vote for themselves
- **Mitigation**: N/A - emergency guardians inherently trusted
- **Note**: Different from recovery voting where target cannot vote

### 5. Timelock Fallback
- **Risk**: Emergency guardians become unresponsive
- **Mitigation**: 30-day timelock provides alternative path
- **Guarantee**: Withdrawal always possible after 30 days

### 6. Quorum Enforcement
- **Risk**: Single guardian could bypass system
- **Mitigation**: Quorum requirement enforced in smart contract
- **Validation**: `getApprovalsNeeded()` must reach zero

### 7. Reentrancy Protection
- **Risk**: Recursive withdrawal attempts
- **Mitigation**: ReentrancyGuard on withdrawal functions
- **Implementation**: `nonReentrant` modifier on all withdrawals

### 8. Access Control
- **Risk**: Unauthorized emergency unlock initiation
- **Mitigation**: Only owner can request emergency
- **Enforcement**: `onlyOwner` modifier on `requestEmergencyUnlock`

## Configuration Parameters

### Network-Level (set during deployment)
- Shared GuardianEmergencyOverride contract (one per network)
- Applies to all vaults on that network

### Vault-Level (set at creation)
- `quorum`: Regular guardian quorum (e.g., 2)
- `emergencyQuorum`: Emergency guardian quorum (e.g., 2)

### System-Level (hardcoded)
- `EMERGENCY_TIMELOCK_DURATION`: 30 days (fallback timelock)
- Emergency ID tracking (automatic increment)

## Testing

Total test coverage: 30+ test functions

**GuardianEmergencyOverride.test.sol (15 tests)**:
- Guardian management (add, remove, count, list)
- Quorum configuration
- Emergency activation
- Approval voting (single, multiple, duplicate prevention)
- Status checking
- Emergency cancellation

**SpendVaultWithEmergencyOverride.test.sol (20 tests)**:
- Setup and configuration
- Emergency request flow
- Guardian approval flow
- Emergency withdrawal via approval
- Emergency withdrawal via timelock
- Cancellation
- Multiple emergencies
- Reentrancy protection
- Full integration flow

## Deployment Checklist

- [ ] Deploy VaultFactoryWithEmergencyOverride
- [ ] Verify GuardianEmergencyOverride created
- [ ] Test vault creation
- [ ] Test emergency guardian setup
- [ ] Test approval flow
- [ ] Test withdrawal execution
- [ ] Test timelock fallback
- [ ] Deploy to Base Sepolia testnet
- [ ] Deploy to Base mainnet
- [ ] Document network addresses
- [ ] Create monitoring/alerting

## Integration with Other Features

### Feature #7: Guardian Rotation
- Emergency guardians are separate from rotating guardians
- No expiry on emergency guardians (always designated)
- Can be same individuals, but tracked separately

### Feature #8: Guardian Recovery
- Emergency guardians independent of recovery system
- Recovery doesn't affect emergency guardians
- Different approval pathways (recovery = quorum voting, emergency = one-time approval)

### Regular Vault Operations
- Normal withdrawals still use regular guardians + EIP-712
- Emergency withdrawals use emergency guardians only
- Both systems coexist independently
