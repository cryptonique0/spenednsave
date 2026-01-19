# SpendGuard Smart Contracts

## Overview

This directory contains the Solidity smart contracts for the SpendGuard application.

## Contracts

### 1. GuardianSBT.sol
**Purpose**: Soulbound Token (SBT) for managing guardian identities

**Key Features**:
- Non-transferable ERC-721 tokens
- Only the vault owner can mint/burn guardian tokens
- Each address can only hold one guardian token
- Implements soulbound property by overriding `_update` function

**Functions**:
- `mint(address to)`: Add a new guardian
- `burn(uint256 tokenId)`: Remove a guardian
- `isGuardian(address account)`: Check if an address is a guardian

### 2. VaultFactory.sol
**Purpose**: One-per-network factory to create per-user vaults and guardian tokens

**Key Features**:
- Single deployment per network; users create their own vault/token via the factory
- Transfers ownership of newly created contracts to the user
- Tracks user vault and guardian token addresses

**Functions**:
- `createVault(uint256 quorum)`: Deploy `GuardianSBT` + `SpendVault` for caller, set quorum, transfer ownership
- `getUserContracts(address user)`: Return `(guardianToken, vault)` for a user
- `hasVault(address user)`: Check if the user already created a vault
- `getTotalVaults()`: Total number of vaults created
- `getVaultByIndex(uint256 index)`: Enumerate created vaults

**Events**:
- `VaultCreated(owner, guardianToken, vault, quorum)`

### 3. SpendVault.sol
**Purpose**: Multi-signature treasury vault with guardian-based approvals

**Key Features**:
- EIP-712 typed signature verification
- Guardian-based multi-sig withdrawals
- Support for both native ETH and ERC-20 tokens
- Emergency timelock withdrawal (30-day delay)
- Replay attack protection via nonce

### 4. GuardianRotation.sol
**Purpose**: Manages guardian expiry dates and automatic invalidation of inactive guardians

**Key Features**:
- Guardian expiry date tracking per vault
- Automatic invalidation of expired guardians
- Configurable default expiry period (default: 365 days)
- Vault-specific expiry period overrides
- Guardian renewal mechanism
- Active/expired guardian filtering
- Gas-efficient cleanup function

**Functions**:
- `addGuardian(address guardian, address vault, uint256 expiryDate)`: Add guardian with expiry
- `removeGuardian(address guardian, address vault)`: Remove guardian
- `isActiveGuardian(address guardian, address vault)`: Check if guardian is active/not expired
- `getExpiryDate(address guardian, address vault)`: Get expiry timestamp
- `renewGuardian(address guardian, address vault, uint256 newExpiryDate)`: Extend guardian access
- `getActiveGuardians(address vault)`: Get all active guardians
- `getExpiredGuardianCount(address vault)`: Count expired guardians
- `setDefaultExpiryPeriod(uint256 newPeriod)`: Update default expiry period
- `setVaultExpiryPeriod(address vault, uint256 newPeriod)`: Set vault-specific period
- `cleanupExpiredGuardians(address vault)`: Remove expired guardians from tracking

**Events**:
- `GuardianAdded(guardian, vault, expiryDate)`
- `GuardianExpired(guardian, vault)`
- `GuardianRenewed(guardian, vault, newExpiryDate)`
- `GuardianRemoved(guardian, vault)`

### 5. SpendVaultWithGuardianRotation.sol
**Purpose**: Enhanced vault with automatic guardian expiry validation

**Key Features**:
- Inherits from SpendVault functionality
- Integrates GuardianRotation for expiry checking
- Validates guardians are active (not expired) during signature verification
- Tracks active guardian count for quorum validation
- Automatic expiry-based guardian invalidation

**Functions**:
- All SpendVault functions plus:
- `isActiveGuardian(address guardian)`: Check if guardian is both holding SBT and not expired
- `getActiveGuardianCount()`: Get count of non-expired guardians
- `updateGuardianRotation(address _newAddress)`: Update rotation contract address

### 6. VaultFactoryWithGuardianRotation.sol
**Purpose**: Factory for deploying vaults with guardian rotation

**Key Features**:
- Creates GuardianSBT + SpendVaultWithGuardianRotation + shared GuardianRotation
- Single shared GuardianRotation instance for all vaults
- Tracks all created vaults
- User vault enumeration support

**Functions**:
- `createVault(uint256 quorum)`: Deploy vault with guardian rotation
- `getUserContracts(address user)`: Get vault contracts
- `getGuardianRotation()`: Get shared rotation contract address

### 7. GuardianEmergencyOverride.sol
**Purpose**: Manages special emergency guardian set for immediate emergency withdrawals

**Key Features**:
- Designates trusted inner circle (1-3 emergency guardians)
- Independent from regular guardians and recovery guardians
- Configurable emergency quorum (must reach consensus)
- Emergency ID tracking prevents vote mixing
- Integrates with vault for immediate withdrawal execution
- Fallback 30-day timelock still available if needed

**Functions**:
- `addEmergencyGuardian(address vault, address guardian)`: Add emergency guardian
- `removeEmergencyGuardian(address vault, address guardian)`: Remove emergency guardian
- `isEmergencyGuardian(address vault, address guardian)`: Check guardian status
- `approveEmergencyUnlock(address vault, uint256 emergencyId)`: Cast approval vote
- `setEmergencyQuorum(address vault, uint256 quorum)`: Configure votes needed
- `isEmergencyApproved(address vault, uint256 emergencyId)`: Check if quorum reached
- `activateEmergencyOverride(address vault)`: Start new emergency (called by vault)
- `getEmergencyApprovalCount(address vault, uint256 emergencyId)`: Get current votes
- `getApprovalsNeeded(address vault, uint256 emergencyId)`: Get votes still needed
- `getEmergencyGuardians(address vault)`: List all emergency guardians

**Events**:
- `EmergencyGuardianAdded(vault, guardian, timestamp)`
- `EmergencyApprovalReceived(vault, emergencyId, guardian, approvalCount, timestamp)`
- `EmergencyApprovalQuorumReached(vault, emergencyId, approvalCount, timestamp)`
- `EmergencyOverrideActivated(vault, emergencyId, timestamp, timestamp)`

### 8. SpendVaultWithEmergencyOverride.sol
**Purpose**: Vault with emergency guardian override for immediate withdrawals

**Key Features**:
- Requests emergency unlock via `requestEmergencyUnlock()`
- Emergency guardians approve via `approveEmergencyUnlock()`
- Immediate withdrawal upon quorum: `executeEmergencyWithdrawalViaApproval()`
- Fallback 30-day timelock: `executeEmergencyUnlockViaTimelock()`
- Separate from regular withdrawal flow
- Audit trail via events

**Functions**:
- `requestEmergencyUnlock()`: Start emergency process
- `approveEmergencyUnlock(uint256 emergencyId)`: Guardian approves
- `executeEmergencyWithdrawalViaApproval(token, amount, recipient, reason, emergencyId)`: Withdraw after approval
- `executeEmergencyUnlockViaTimelock(token, amount, recipient)`: Withdraw after 30 days
- `addEmergencyGuardian(address guardian)`: Add emergency guardian (setup)
- `setEmergencyGuardianQuorum(uint256 quorum)`: Set emergency quorum (setup)
- `getEmergencyApprovalsCount()`: Get current approvals
- `getEmergencyGuardianQuorum()`: Get required quorum
- `getEmergencyUnlockTimeRemaining()`: Get seconds until 30-day timeout
- `isEmergencyUnlockActive()`: Check if emergency currently active

### 9. VaultFactoryWithEmergencyOverride.sol
**Purpose**: Factory for deploying complete system with emergency guardian override

**Key Features**:
- Creates GuardianSBT (per user)
- Deploys SpendVaultWithEmergencyOverride (per user)
- Manages shared GuardianEmergencyOverride (one per network)
- Single factory deployment provides everything

**Functions**:
- `createVault(uint256 quorum, uint256 emergencyQuorum)`: Deploy complete system
- `getUserContracts(address user)`: Get user's vault contracts
- `getEmergencyOverride()`: Get shared emergency override address
- `hasVault(address user)`: Check if user has vault
- `getTotalVaults()`: Get total vaults created

### 10. VaultPausingController.sol
**Purpose**: Manages temporary pause capability for vault withdrawals

**Key Features**:
- Pause/unpause withdrawals while allowing deposits
- Reason tracking for audit trail
- Pause duration tracking in seconds
- Complete history of all pause/unpause events
- Shared controller for all vaults (one per network)

**Functions**:
- `pauseVault(address vault, string reason)`: Pause withdrawals
- `unpauseVault(address vault, string reason)`: Resume withdrawals
- `updatePauseReason(address vault, string newReason)`: Update reason while paused
- `isPaused(address vault)`: Check pause status
- `getPauseReason(address vault)`: Get pause reason
- `getPauseTime(address vault)`: Get pause start time
- `getPauseElapsedTime(address vault)`: Get pause duration
- `getPauseHistory(address vault)`: Get all pause/unpause events
- `isManagedVault(address vault)`: Check if registered

### 11. SpendVaultWithPausing.sol
**Purpose**: Vault with temporary pause mechanism for emergency response

**Key Features**:
- Blocks all withdrawals when paused
- Allows all deposits regardless of pause state
- Blocks emergency unlock requests when paused
- Integrates with shared VaultPausingController
- Pause status queryable via vault contract

**Functions**:
- `isVaultPaused()`: Check if paused
- `getVaultPauseReason()`: Get pause reason
- `getVaultPauseTime()`: Get pause start time
- `getVaultPauseElapsedTime()`: Get pause duration
- `withdraw(...)`: Reverts with "Vault is paused" if paused
- `deposit(address token, uint256 amount)`: Works when paused
- `depositETH()`: Works when paused

### 12. VaultFactoryWithPausing.sol
**Purpose**: Factory for deploying vaults with pause capability

**Key Features**:
- Creates GuardianSBT (per user)
- Deploys SpendVaultWithPausing (per user)
- Manages shared VaultPausingController (one per network)
- Tracks user vaults and pause status

**Functions**:
- `createVault(uint256 quorum)`: Deploy complete system with pausing
- `getUserVaults(address user)`: Get user's vaults
- `isVaultPaused(address vault)`: Check vault pause status
- `getVaultPauseReason(address vault)`: Get pause reason
- `getVaultPauseElapsedTime(address vault)`: Get pause duration
- `getPausingController()`: Get shared controller

**SpendVault Core Functions**:

**Management**:
- `setQuorum(uint256 _newQuorum)`: Update required signature count
- `updateGuardianToken(address _newAddress)`: Update guardian token contract

**Funding**:
- `receive()` / `fallback()`: Accept native ETH
- `deposit(address token, uint256 amount)`: Deposit ERC-20 tokens

**Withdrawal**:
- `withdraw(address token, uint256 amount, address recipient, string reason, bytes[] signatures)`: Execute multi-sig withdrawal

**Emergency**:
- `requestEmergencyUnlock()`: Start 30-day timelock
- `executeEmergencyUnlock(address token)`: Withdraw after timelock
- `cancelEmergencyUnlock()`: Cancel pending unlock

**Views**:
- `getETHBalance()`: Current ETH balance
- `getTokenBalance(address token)`: ERC-20 balance for a token
- `getDomainSeparator()`: EIP-712 domain separator
- `getEmergencyUnlockTimeRemaining()`: Seconds remaining until unlock (0 if none/past)

## Deployment

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Deployment Steps

1. **Recommended: Deploy VaultFactoryWithGuardianRotation (once per network)**
```javascript
const VaultFactoryWithRotation = await ethers.getContractFactory("VaultFactoryWithGuardianRotation");
const factory = await VaultFactoryWithRotation.deploy();
await factory.waitForDeployment();
const factoryAddress = await factory.getAddress();

// For a user to create their vault + guardian token + guardian rotation
const tx = await factory.createVault(2); // quorum = 2
await tx.wait();
const [guardianTokenAddress, vaultAddress] = await factory.getUserContracts(userAddress);
const rotationAddress = await factory.getGuardianRotation();
```

2. **Add Guardians with Expiry**:
```javascript
const GuardianRotation = await ethers.getContractFactory("GuardianRotation");
const rotation = GuardianRotation.attach(rotationAddress);

// Add guardian with custom expiry date (30 days from now)
const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.addGuardian(guardianAddress1, vaultAddress, expiryTime);
await rotation.addGuardian(guardianAddress2, vaultAddress, expiryTime);
```

3. **Check Guardian Status**:
```javascript
// Check if guardian is active (not expired)
const isActive = await rotation.isActiveGuardian(guardianAddress1, vaultAddress);

// Get seconds remaining before expiry
const secondsRemaining = await rotation.getSecondsUntilExpiry(guardianAddress1, vaultAddress);

// Get active guardian count
const activeCount = await rotation.getActiveGuardianCount(vaultAddress);
```

4. **Renew Guardian Access**:
```javascript
// Extend guardian's expiry by another 30 days
const newExpiry = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
await rotation.renewGuardian(guardianAddress1, vaultAddress, newExpiry);
```

### Legacy Deployment (without Guardian Rotation)

If you need to deploy without guardian rotation features:

1. **Deploy VaultFactory (once per network)**
```javascript
const VaultFactory = await ethers.getContractFactory("VaultFactory");
const factory = await VaultFactory.deploy();
await factory.waitForDeployment();
const factoryAddress = await factory.getAddress();
````

// For a user to create their vault + guardian token
const tx = await factory.createVault(2); // quorum = 2
await tx.wait();
const [guardianTokenAddress, vaultAddress] = await factory.getUserContracts(userAddress);
```

2. **Direct deploy (optional)**
```javascript
// GuardianSBT
const GuardianSBT = await ethers.getContractFactory("GuardianSBT");
const guardianSBT = await GuardianSBT.deploy();
await guardianSBT.waitForDeployment();
const guardianSBTAddress = await guardianSBT.getAddress();

// SpendVault
const SpendVault = await ethers.getContractFactory("SpendVault");
const spendVault = await SpendVault.deploy(
  guardianSBTAddress,  // Guardian token address
  2                    // Quorum (e.g., 2 of 3 guardians)
);
await spendVault.waitForDeployment();
const vaultAddress = await spendVault.getAddress();
```

3. **Add Guardians**:
```javascript
await guardianSBT.mint("0xGuardian1Address");
await guardianSBT.mint("0xGuardian2Address");
await guardianSBT.mint("0xGuardian3Address");
```

## EIP-712 Signature Format

### Domain
```javascript
{
  name: "SpendGuard",
  version: "1",
  chainId: 84532, // Base Sepolia
  verifyingContract: spendVaultAddress
}
```

### Withdrawal Type
```javascript
{
  Withdrawal: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "reason", type: "string" }
  ]
}
```

### Example Signing (Frontend)
```javascript
const domain = {
  name: "SpendGuard",
  version: "1",
  // ethers v6: get chainId from provider
  chainId: (await signer.provider.getNetwork()).chainId,
  verifyingContract: vaultAddress
};

const types = {
  Withdrawal: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "recipient", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "reason", type: "string" }
  ]
};

const value = {
  token: tokenAddress,
  amount: ethers.parseEther("100"),
  recipient: recipientAddress,
  nonce: await vault.nonce(),
  reason: "Emergency medical expenses"
};

// ethers v6
const signature = await signer.signTypedData(domain, types, value);
```

## Security Considerations

1. **Soulbound Tokens**: Guardian tokens cannot be transferred, preventing secondary markets
2. **Replay Protection**: Nonce increments after each withdrawal
3. **Reentrancy Guard**: Protects against reentrancy attacks
4. **Signature Verification**: Each signature is verified against guardian status
5. **Duplicate Prevention**: Same guardian cannot sign twice for one withdrawal
6. **Emergency Timelock**: 30-day delay prevents immediate emergency withdrawals

## Network Configuration

- **Network**: Base Sepolia (Testnet) / Base Mainnet
- **Chain ID**: 84532 (Sepolia) / 8453 (Mainnet)
- **Solidity Version**: ^0.8.20
- **OpenZeppelin Version**: ^5.0.0

## Testing

Create a test file `test/SpendGuard.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SpendGuard", function () {
  let guardianSBT, spendVault;
  let owner, guardian1, guardian2, guardian3;

  beforeEach(async function () {
    [owner, guardian1, guardian2, guardian3] = await ethers.getSigners();

    // Deploy GuardianSBT
    const GuardianSBT = await ethers.getContractFactory("GuardianSBT");
    guardianSBT = await GuardianSBT.deploy();

    // Deploy SpendVault
    const SpendVault = await ethers.getContractFactory("SpendVault");
    spendVault = await SpendVault.deploy(guardianSBT.address, 2);

    // Add guardians
    await guardianSBT.mint(guardian1.address);
    await guardianSBT.mint(guardian2.address);
    await guardianSBT.mint(guardian3.address);
  });

  it("Should prevent guardian token transfers", async function () {
    await expect(
      guardianSBT.connect(guardian1).transferFrom(
        guardian1.address,
        guardian2.address,
        0
      )
    ).to.be.revertedWith("GuardianSBT: token is soulbound and cannot be transferred");
  });

  it("Should accept ETH deposits", async function () {
    await owner.sendTransaction({
      to: spendVault.address,
      value: ethers.utils.parseEther("1.0")
    });

    expect(await spendVault.getETHBalance()).to.equal(
      ethers.utils.parseEther("1.0")
    );
  });

  // Add more tests...
});
```

Run tests:
```bash
npx hardhat test
```

## License

MIT
