# 🛡️ SpendGuard

**A decentralized multi-signature treasury vault with guardian-based governance on Base**

SpendGuard is a smart contract system that enables secure fund management through trusted guardians. Think of it as a "social recovery wallet" meets "multi-sig treasury" - perfect for protecting your crypto savings while maintaining emergency access through friends and family.

[![Built with Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Base Network](https://img.shields.io/badge/Base-Sepolia-blue?style=flat-square)](https://base.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Smart Contracts](#-smart-contracts)
- [Frontend Application](#-frontend-application)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

### The Problem

Traditional crypto wallets have a critical flaw: lose your private key, and your funds are gone forever. Multi-sig wallets solve this but are complex and expensive to set up.

### The Solution

SpendGuard combines the security of multi-signature wallets with the simplicity of social recovery:

- **Saver Mode**: You control a vault that requires guardian approval for withdrawals
- **Guardian Mode**: Trusted friends hold non-transferable tokens (SBTs) that give them voting power
- **Quorum-Based**: Set how many guardians must approve (e.g., 2-of-3, 3-of-5)
- **Emergency Access**: 30-day timelock for solo withdrawals in case guardians are unavailable
- **Built on Base**: Low fees, fast transactions, Ethereum-level security

### Use Cases

- 💰 **Savings Protection**: Lock away funds that require friend approval to spend
- 🏦 **Treasury Management**: Shared funds for DAOs, families, or groups
- 🎯 **Spending Accountability**: Gamify savings by adding friction to impulse purchases
- 🚨 **Emergency Recovery**: Access funds even if guardians disappear (after 30 days)

---

## ✨ Features

### For Savers (Vault Owners)

- ✅ **Create Vault**: Deploy your own SpendVault contract with custom quorum settings
- ✅ **Manage Guardians**: Add/remove trusted friends with soulbound tokens (non-transferable)
- ✅ **Request Withdrawals**: Create withdrawal requests with reason explanations
- ✅ **Track Activity**: View all withdrawal history and guardian votes
- ✅ **Emergency Mode**: Request emergency unlock (30-day timelock for solo access)
- ✅ **Multi-Asset Support**: Store ETH and ERC-20 tokens (USDC, DEGEN, etc.)

### For Guardians (Trusted Friends)

- ✅ **Voting Dashboard**: View and approve pending withdrawal requests
- ✅ **Readable Signatures**: EIP-712 structured data shows clear withdrawal details
- ✅ **Activity Log**: Track all requests you've approved or rejected
- ✅ **Non-Transferable Power**: Guardian status is soulbound and cannot be sold

### Technical Features

- 🔒 **EIP-712 Signatures**: Human-readable transaction data in wallet prompts
- 🛡️ **Reentrancy Protection**: Secure against common DeFi exploits
- 🎭 **Soulbound Tokens**: Guardians can't transfer or sell voting power
- 🔄 **Nonce-Based Replay Protection**: Each signature is single-use
- ⏰ **Timelock Emergency Escape**: 30-day delay for owner-only withdrawals
- 📊 **Event Emission**: Full on-chain audit trail of all actions

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SpendGuard Ecosystem                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐      ┌──────────────┐    ┌─────────────┐ │
│  │  Frontend   │◄────►│ RainbowKit/  │◄──►│   Wallet    │ │
│  │  (Next.js)  │      │    Wagmi     │    │ (MetaMask)  │ │
│  └─────────────┘      └──────────────┘    └─────────────┘ │
│         │                                                   │
│         │ Web3 Calls                                        │
│         ▼                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Smart Contracts (Base Network)            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │  ┌────────────────┐         ┌──────────────────┐   │  │
│  │  │ VaultFactory   │────────►│  SpendVault      │   │  │
│  │  │                │ deploys │  (User's Vault)  │   │  │
│  │  └────────────────┘         └──────────────────┘   │  │
│  │                                      │              │  │
│  │                                      │ verifies     │  │
│  │                                      ▼              │  │
│  │                              ┌──────────────────┐   │  │
│  │                              │  GuardianSBT     │   │  │
│  │                              │  (ERC-721 SBT)   │   │  │
│  │                              └──────────────────┘   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Contract Interactions

1. **Vault Creation**: VaultFactory deploys a new SpendVault + GuardianSBT pair
2. **Guardian Setup**: Owner mints SBTs to trusted friends
3. **Withdrawal Flow**:
   - Owner requests withdrawal
   - Guardians sign with EIP-712 (off-chain)
   - Owner submits transaction with signatures
   - Contract verifies signatures and guardian status
   - Funds transfer on success

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH ([faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spendguard.git
cd spendguard

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Add your wallet private key, RPC URLs, etc.
```

### Environment Setup

Create a `.env.local` file:

```env
# Blockchain Network
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# Contract Addresses (after deployment)
NEXT_PUBLIC_VAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_GUARDIAN_SBT_ADDRESS=0x...

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Deploy Contracts (Optional)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed contract deployment instructions.

---

## 📜 Smart Contracts

### GuardianSBT.sol

**Purpose**: Soulbound token (non-transferable NFT) that identifies guardians

**Key Features**:
- ERC-721 compliant
- Blocks all transfers (except mint/burn)
- Only owner can mint/burn tokens
- Used for identity verification in SpendVault

**Main Functions**:
```solidity
function mint(address to) external onlyOwner
function burn(uint256 tokenId) external onlyOwner
function balanceOf(address account) external view returns (uint256)
```

### SpendVault.sol

**Purpose**: Multi-sig treasury vault with guardian-based withdrawals

**Key Features**:
- Holds ETH and ERC-20 tokens
- Requires N-of-M guardian signatures for withdrawals
- EIP-712 signature verification
- Nonce-based replay protection
- Emergency timelock escape hatch

**Main Functions**:
```solidity
// Deposit funds
receive() external payable
function deposit(address token, uint256 amount) external

// Withdraw with guardian signatures
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    bytes[] memory signatures
) external onlyOwner nonReentrant

// Emergency access
function requestEmergencyUnlock() external onlyOwner
function executeEmergencyUnlock(address token) external onlyOwner

// Management
function setQuorum(uint256 _newQuorum) external onlyOwner
function updateGuardianToken(address _newToken) external onlyOwner
```

### VaultFactory.sol

**Purpose**: Factory contract for deploying new vault instances

**Main Functions**:
```solidity
function createVault(uint256 quorum) external returns (address, address)
function getUserVaults(address user) external view returns (address[] memory)
```

### Contract Addresses (Base Sepolia)

```
VaultFactory:  [Deployed Address]
GuardianSBT:   [Deployed Address]
SpendVault:    [User-specific deployments]
```

---

## 💻 Frontend Application

### Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 3.4
- **Web3**: 
  - Wagmi 2.19 (React hooks for Ethereum)
  - RainbowKit 2.2 (wallet connection)
  - Viem 2.43 (TypeScript Ethereum library)
- **State**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Theme**: Next Themes (dark mode support)

### Project Structure

```
spenednsave/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── dashboard/           # User dashboard
│   ├── vault/setup/         # Vault creation wizard
│   ├── guardians/           # Guardian management
│   ├── withdraw/            # Withdrawal requests
│   ├── voting/              # Guardian voting portal
│   ├── emergency/           # Emergency unlock
│   └── activity/            # Transaction history
├── components/              # React components
│   ├── landing/            # Landing page sections
│   ├── dashboard/          # Dashboard views
│   ├── vault-setup/        # Vault wizard steps
│   ├── guardians/          # Guardian UI
│   ├── withdrawal/         # Withdrawal forms
│   ├── voting/             # Voting interfaces
│   ├── emergency/          # Emergency controls
│   ├── activity/           # Activity logs
│   ├── layout/             # Nav, footer
│   └── ui/                 # Reusable UI components
├── contracts/              # Solidity smart contracts
│   ├── SpendVault.sol
│   ├── GuardianSBT.sol
│   └── VaultFactory.sol
├── lib/                    # Utilities and hooks
│   ├── contracts.ts        # Contract instances
│   ├── config.ts           # App configuration
│   ├── utils.ts            # Helper functions
│   ├── abis/               # Contract ABIs
│   └── hooks/              # Custom React hooks
├── public/                 # Static assets
├── _designs/               # HTML design prototypes
└── [config files]          # TS, Tailwind, ESLint configs
```

### Key Components

#### Vault Setup Wizard
```tsx
// components/vault-setup/setup-wizard.tsx
// 3-step wizard: Details → Guardians → Review
```

#### Dashboard Views
- **Saver View**: Shows vault balance, guardians, pending requests
- **Guardian View**: Lists vaults where user is a guardian
- **Empty States**: Onboarding prompts for new users

#### Withdrawal Flow
1. User fills withdrawal form (amount, token, recipient, reason)
2. Creates off-chain signature request
3. Guardians sign via voting portal
4. User submits transaction with collected signatures

---

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Contract Development (requires Hardhat setup)
npx hardhat compile      # Compile contracts
npx hardhat test         # Run contract tests
npx hardhat node         # Start local blockchain
```

### Adding New Features

1. **New Contract Function**:
   - Update `contracts/SpendVault.sol`
   - Recompile: `npx hardhat compile`
   - Update ABI in `lib/abis/`
   - Add hook in `lib/hooks/useContracts.ts`

2. **New UI Component**:
   - Create component in `components/[category]/`
   - Import in relevant page: `app/[route]/page.tsx`
   - Use Wagmi hooks for blockchain interactions

3. **New Page Route**:
   - Create folder: `app/[route]/`
   - Add `page.tsx` file
   - Update navigation in `components/layout/navbar.tsx`

### Code Style

- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **Styling**: Tailwind utility classes
- **Web3**: Wagmi hooks for all blockchain calls
- **Error Handling**: Try-catch blocks for async operations

---

## 📦 Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables in Vercel dashboard
```

### Contract Deployment (Base Sepolia)

See detailed guide in [DEPLOYMENT.md](DEPLOYMENT.md)

**Quick Deploy**:

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Configure .env
PRIVATE_KEY=your_private_key
BASESCAN_API_KEY=your_api_key

# Deploy contracts
npx hardhat run scripts/deploy.ts --network baseSepolia

# Verify on BaseScan
npx hardhat verify --network baseSepolia DEPLOYED_ADDRESS
```

**Post-Deployment**:
1. Copy contract addresses to `.env.local`
2. Update `lib/config.ts` with addresses
3. Test on testnet before mainnet launch

---

## 🔒 Security

### Smart Contract Security

✅ **Implemented Protections**:
- Reentrancy guards on withdrawal functions
- Signature replay protection via nonces
- Zero-address checks on all transfers
- Ownable pattern for access control
- EIP-712 for structured signature data
- Soulbound tokens prevent guardian trading

⚠️ **Security Considerations**:
- Contracts are unaudited (testnet only)
- Guardian collusion risk (choose trustworthy friends)
- Emergency unlock is irrevocable after 30 days
- Private key security is user's responsibility

### Audit Status

🚧 **Not yet audited** - Use at your own risk

Recommended auditors for future:
- OpenZeppelin
- Trail of Bits
- Consensys Diligence

### Best Practices

1. **Choose Guardians Wisely**: Select friends who won't collude
2. **Set Appropriate Quorum**: Higher quorum = more security, less convenience
3. **Test on Testnet**: Try full workflow before mainnet
4. **Backup Keys**: Store recovery phrases securely
5. **Monitor Activity**: Check dashboard regularly for suspicious requests

---

## 🧪 Testing

### Manual Testing Flow

1. **Connect Wallet**: Use MetaMask on Base Sepolia
2. **Create Vault**: 
   - Click "Create Vault"
   - Set quorum (e.g., 2 of 3)
   - Confirm transaction
3. **Add Guardians**:
   - Enter 3 guardian addresses
   - Mint SBTs to each
4. **Deposit Funds**:
   - Send ETH or tokens to vault
5. **Request Withdrawal**:
   - Fill withdrawal form
   - Submit request
6. **Guardian Approval**:
   - Switch to guardian account
   - View pending request
   - Sign approval (2 guardians)
7. **Execute Withdrawal**:
   - Switch back to owner
   - Submit transaction with signatures

### Automated Tests (Coming Soon)

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Contribution Ideas

- 🐛 Bug fixes and error handling
- 🎨 UI/UX improvements
- 📝 Documentation enhancements
- 🧪 Test coverage
- 🔐 Security audits
- 🌐 Internationalization (i18n)
- ⛓️ Multi-chain support

### Code Review Process

- All PRs require 1 reviewer approval
- Must pass CI/CD checks
- Follow existing code style
- Include tests for new features

---

## 📚 Resources

### Documentation

- [Contract Specification](contract-spec.md)
- [Deployment Guide](DEPLOYMENT.md)
- [API Reference](#) (Coming Soon)

### External Links

- [Base Network Docs](https://docs.base.org)
- [Wagmi Documentation](https://wagmi.sh)
- [RainbowKit Docs](https://rainbowkit.com)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

### Community

- Discord: [Join Server](#)
- Twitter: [@SpendGuard](#)
- GitHub Discussions: [Forum](https://github.com/yourusername/spendguard/discussions)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Base** for the L2 infrastructure
- **OpenZeppelin** for secure contract libraries
- **RainbowKit** for seamless wallet integration
- **Vercel** for Next.js and hosting platform
- **The Ethereum community** for EIP standards

---

## 📞 Support

Need help? Reach out through:

- 📧 Email: support@spendguard.xyz
- 💬 Discord: [SpendGuard Community](#)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/spendguard/issues)

---

<div align="center">

**Built with ❤️ on Base**

[Website](#) • [Docs](#) • [Twitter](#) • [Discord](#)

</div>
