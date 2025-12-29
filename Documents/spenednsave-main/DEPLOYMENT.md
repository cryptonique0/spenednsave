# Contract Deployment Guide

## Prerequisites

1. **Install Hardhat**:
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

2. **Initialize Hardhat** (if not already done):
```bash
npx hardhat init
```
Select "Create a TypeScript project" and install dependencies.

3. **Install OpenZeppelin Contracts**:
```bash
npm install @openzeppelin/contracts
```

## Deployment Steps

### 1. Configure Hardhat for Base Sepolia

Create or update `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY || ""],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;
```

### 2. Set Environment Variables

Create `.env` file:
```
PRIVATE_KEY=your_private_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

**IMPORTANT**: Add `.env` to `.gitignore`!

### 3. Recommended: Deploy the Factory (once per network)

Create `scripts/deployFactory.ts` (already added in this repo):

```typescript
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying VaultFactory to Base Sepolia...");

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const VaultFactory = await ethers.getContractFactory("VaultFactory");
  const factory = await VaultFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ VaultFactory deployed:", factoryAddress);

  console.log("\nNext: Update lib/contracts.ts -> CONTRACTS_BASE_SEPOLIA.VaultFactory =", factoryAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 4. Deploy Contracts

```bash
npx hardhat run scripts/deployFactory.ts --network baseSepolia
```

### 5. Update Frontend Configuration

After deployment, update `lib/contracts.ts` with the factory address:

```typescript
export const CONTRACTS_BASE_SEPOLIA = {
  VaultFactory: '0xYOUR_FACTORY_ADDRESS',
} as const;
```

Then use the frontend (or a script) to call `createVault(quorum)` to create your own `GuardianSBT` + `SpendVault`. Ownership of both is transferred to you automatically.

### 6. Verify Contracts (Optional but Recommended)

```bash
npx hardhat verify --network baseSepolia GUARDIAN_SBT_ADDRESS

npx hardhat verify --network baseSepolia SPEND_VAULT_ADDRESS "GUARDIAN_SBT_ADDRESS" "2"
```

## Testing Deployment

### 1. Add Test Guardians

Create `scripts/addGuardians.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const guardianSBTAddress = "YOUR_GUARDIAN_SBT_ADDRESS";
  const guardianAddresses = [
    "0xGuardian1Address",
    "0xGuardian2Address",
    "0xGuardian3Address",
  ];

  const GuardianSBT = await ethers.getContractAt("GuardianSBT", guardianSBTAddress);

  for (const address of guardianAddresses) {
    console.log(`Adding guardian: ${address}`);
    const tx = await GuardianSBT.mint(address);
    await tx.wait();
    console.log("✅ Guardian added");
  }
}

main();
```

Run:
```bash
npx hardhat run scripts/addGuardians.ts --network baseSepolia
```

### 2. Test Deposit (ETH)

```typescript
import { ethers } from "hardhat";

async function main() {
  const spendVaultAddress = "YOUR_SPEND_VAULT_ADDRESS";

  // Send 0.01 ETH directly to the vault (handled by receive())
  const [sender] = await ethers.getSigners();
  const tx = await sender.sendTransaction({ to: spendVaultAddress, value: ethers.parseEther("0.01") });
  await tx.wait();

  const SpendVault = await ethers.getContractAt("SpendVault", spendVaultAddress);
  const balance = await SpendVault.getETHBalance();
  console.log("Vault balance:", ethers.formatEther(balance), "ETH");
}

main();
```

## Troubleshooting

### "Insufficient funds for gas"
- Ensure your deployer wallet has enough ETH on Base Sepolia
- Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### "Contract deployment failed"
- Check your RPC endpoint is correct
- Verify your private key is set correctly
- Ensure you're on the right network (Base Sepolia chainId: 84532)

### "Verification failed"
- Wait a few minutes after deployment before verifying
- Ensure constructor arguments match exactly
- Check BaseScan API key is valid

## Next Steps

1. ✅ Deploy contracts
2. ✅ Update `lib/contracts.ts` with addresses
3. ✅ Add guardian addresses via frontend or script
4. ✅ Test deposit functionality
5. ✅ Implement withdrawal flow with EIP-712 signatures
6. 🔄 Deploy to Base Mainnet when ready

## Resources

- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- Base Sepolia Explorer: https://sepolia.basescan.org
- Hardhat Docs: https://hardhat.org/docs
