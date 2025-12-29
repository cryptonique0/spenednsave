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

**Functions**:

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

1. **Recommended: Deploy VaultFactory (once per network)**
```javascript
const VaultFactory = await ethers.getContractFactory("VaultFactory");
const factory = await VaultFactory.deploy();
await factory.waitForDeployment();
const factoryAddress = await factory.getAddress();

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
