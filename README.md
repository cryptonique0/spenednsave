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
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| Live Demo | [spendguard.xyz](https://spendguard.xyz) |
| Contracts | [contracts/](contracts/) |
| Frontend Code | [app/](app/), [components/](components/) |
| Smart Contract Specs | [contract-spec.md](contract-spec.md) |
| Deployment Guide | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Batch Withdrawal Docs | [BATCH_WITHDRAWAL_MANAGER.md](BATCH_WITHDRAWAL_MANAGER.md) |
| Guardian Risk Docs | [GUARDIAN_RISK_IMPLEMENTATION.md](GUARDIAN_RISK_IMPLEMENTATION.md) |
| Issues | [GitHub Issues](https://github.com/cryptonique0/spenednsave/issues) |
| Feature Requests | [Discussions](https://github.com/cryptonique0/spenednsave/discussions) |

### Implementation Status

| Feature | Status | Lines of Code | Docs |
|---------|--------|--------------|------|
| Core Vault & Guardian Voting | ✅ Complete | 1,200 | [contract-spec.md](contract-spec.md) |
| Spending Limits | ✅ Complete | 400 | [Contract](contracts/SpendVault.sol) |
| Time-Locked Withdrawals | ✅ Complete | 500 | [TIME_LOCKS_SPEC.md](TIME_LOCKS_SPEC.md) |
| Emergency Freeze Mechanism | ✅ Complete | 350 | [EMERGENCY_FREEZE_SPEC.md](EMERGENCY_FREEZE_SPEC.md) |
| Guardian Activity Dashboard | ✅ Complete | 400 | [GUARDIAN_RISK_IMPLEMENTATION.md](GUARDIAN_RISK_IMPLEMENTATION.md) |
| Risk Scoring Engine | ✅ Complete | 500 | [GUARDIAN_RISK_IMPLEMENTATION.md](GUARDIAN_RISK_IMPLEMENTATION.md) |
| Batch Withdrawal Manager | ✅ Complete | 1,300 | [BATCH_WITHDRAWAL_MANAGER.md](BATCH_WITHDRAWAL_MANAGER.md) |
| Email Notifications | ✅ Complete | 400 | [lib/services/email-notifications.ts](lib/services/email-notifications.ts) |
| Guardian Reputation System | 🔄 Proposed | — | [#1](https://github.com/cryptonique0/spenednsave/issues/1) |
| Multi-Token Batching | 🔄 Proposed | — | [#2](https://github.com/cryptonique0/spenednsave/issues/2) |
| Guardian Delegation | 🔄 Proposed | — | [#3](https://github.com/cryptonique0/spenednsave/issues/3) |
| Vault Recovery | 🔄 Proposed | — | [#4](https://github.com/cryptonique0/spenednsave/issues/4) |

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


## 📝 Changelog

- **2026-01-17**: Cleaned up dependencies and removed test files for frontend-only production build
- **2026-01-16**: Added GuardianBadge and GuardianSBT contracts with comprehensive test coverage
- **2026-01-15**: Email notification system integration with SMTP/Resend API support
- **2026-01-14**: Fixed Activity Log total deposits calculation and display. Now always sums as `bigint` and shows up to 5 decimal places for ETH values.
- **2026-01-13**: Multi-Sig Batch Withdrawal Manager fully implemented (650 lines contract, 400 lines hooks, 400 lines UI components)
- **2026-01-10**: Risk Scoring Engine and Guardian Activity Dashboard launched
- **2026-01-08**: Emergency Freeze mechanism with majority-based voting
- **2026-01-05**: Time-locked withdrawals for large transactions
- **2025-12-28**: Spending limits per token with temporal resets
- **2025-12-20**: Initial v1.0 launch with core vault, guardian voting, and email notifications

## ✨ Features


### Email Notifications

- ✅ **Email Notifications**: Owners and guardians can opt-in to receive email alerts for important events (withdrawal requests, approvals, rejections, execution, and emergency unlocks). Preferences are managed in the app settings. Uses secure backend delivery (SMTP/Resend).

### For Savers (Vault Owners)
---

## 📧 Email Notification System

SpendGuard includes a built-in email notification system for important vault and guardian events:

- **Events Covered:**
   - Withdrawal request submitted
   - Withdrawal approved
   - Withdrawal rejected
   - Withdrawal executed
   - Emergency unlock requested
- **Opt-in:** Users can provide their email and manage notification preferences in the Settings page.
- **Backend:** Uses SMTP (Nodemailer) or Resend API for secure delivery. Emails are only sent to users who have opted in.
- **Customization:** Email templates can be customized in `lib/services/email-notifications.ts`.

**How it works:**
1. User sets their email and notification preferences in Settings.
2. When a covered event occurs, the backend checks preferences and sends notifications to all involved parties.
3. Emails include event details, vault info, and relevant links.

**Environment setup:**
Set SMTP or Resend credentials in your environment:

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM="SpendGuard <no-reply@spendguard.xyz>"
```

Or configure Resend API as needed.

---

- ✅ **Create Vault**: Deploy your own SpendVault contract with custom quorum settings
- ✅ **Manage Guardians**: Add/remove trusted friends with soulbound tokens (non-transferable)
- ✅ **Request Withdrawals**: Create withdrawal requests with reason explanations
- ✅ **Track Activity**: View all withdrawal history and guardian votes
- ✅ **Emergency Mode**: Request emergency unlock (30-day timelock for solo access)
- ✅ **Multi-Asset Support**: Store ETH and ERC-20 tokens (USDC, DEGEN, etc.)

### 💰 Spending Limits

SpendGuard includes sophisticated spending limit controls to enforce daily, weekly, and monthly withdrawal caps per token:

- **Granular Limits**: Set separate daily, weekly, and monthly caps for each token
- **Enhanced Approvals**: Withdrawals exceeding limits automatically require 75% of guardians to approve (instead of standard quorum)
- **Real-Time Monitoring**: Dashboard shows current spending vs limits with color-coded warnings:
  - 🟢 **Safe** (< 75%): Green progress bar
  - 🟡 **Warning** (75-95%): Yellow progress bar
  - 🔴 **Critical** (> 95%): Red progress bar
- **Temporal Resets**: Daily limits reset every 24 hours, weekly every 7 days, monthly on the 1st
- **Smart Defaults**: Set limits based on vault's daily operational needs (e.g., $1000/day, $10,000/week, $50,000/month)

**Use Case**: Protect against compromised accounts or malicious insiders by requiring additional consensus for large withdrawals.

### ⏰ Time-Locked Withdrawals

SpendGuard protects large withdrawals with an automatic time-lock mechanism that forces a review period:

- **Smart Queuing**: Withdrawals exceeding a configurable threshold (default 1000 ETH) are automatically queued instead of executed immediately
- **Guardian Review Window**: 2-day (configurable) delay period where guardians can freeze suspicious transactions
- **Multi-Guardian Freeze**: Any guardian can freeze a withdrawal, and it stays frozen until **ALL** freezing guardians approve its execution
- **Smart Execution**: Once the delay expires and no guardian has frozen it, anyone can execute (permissionless execution)
- **Owner Emergency Cancel**: Owner can cancel any queued withdrawal at any time without waiting for delay
- **Per-Token Configuration**: Set different thresholds for different tokens (e.g., high threshold for stablecoins, lower for rare tokens)

**Statuses:**
- 🟡 **Pending**: Queued, waiting for time-lock delay
- 🟢 **Ready**: Delay expired, ready for execution
- 🔒 **Frozen**: Guardians froze it for manual review
- ✅ **Executed**: Successfully executed and withdrawn
- ❌ **Cancelled**: Owner or signers cancelled it

**Use Case**: Prevent large treasury withdrawals from being executed without proper oversight. Gives guardian team time to investigate unusual withdrawal patterns and consensus-block suspicious transactions.

**Learn More:** [TIME_LOCKS_QUICKREF.md](TIME_LOCKS_QUICKREF.md) | [TIME_LOCKS_SPEC.md](TIME_LOCKS_SPEC.md)

### 🚨 Emergency Freeze Mechanism

SpendGuard includes an emergency freeze feature that allows guardians to quickly respond to suspicious activity:

- **Majority-Based Freeze**: Any majority of guardians can vote to temporarily freeze the vault
- **Immediate Action**: Blocks all withdrawals and sensitive operations instantly when threshold reached
- **Transparent Voting**: Real-time vote tracking shows all guardians' positions
- **Recovery Path**: Guardians can vote to unfreeze once threat is resolved
- **Vote Flexibility**: Guardians can change their vote before freeze occurs or switch between freeze/unfreeze

**Freeze States:**
- 🟢 **Normal**: Vault operating normally, all functions available
- 🟡 **In Progress**: Guardians voting to freeze, withdrawals still blocked
- 🔒 **Frozen**: Majority voted to freeze, all withdrawals blocked
- 🔓 **Unfreezing**: Guardians voting to unfreeze, waiting for majority approval

**Voting Rules:**
- Threshold = (Guardian Count ÷ 2) + 1 (mathematical majority)
- Example: 3 guardians need 2 votes to freeze or unfreeze
- Each guardian can only vote once per direction (can revoke votes before freeze)
- Non-guardians cannot participate in voting

**Use Case**: Protect against compromised guardians or suspicious activity patterns. If you detect unusual withdrawal attempts or suspect account compromise, any majority of guardians can immediately freeze the vault while investigating.

**Learn More:** [EMERGENCY_FREEZE_QUICKREF.md](EMERGENCY_FREEZE_QUICKREF.md) | [EMERGENCY_FREEZE_SPEC.md](EMERGENCY_FREEZE_SPEC.md)

### For Guardians (Trusted Friends)

- ✅ **Voting Dashboard**: View and approve pending withdrawal requests
- ✅ **Readable Signatures**: EIP-712 structured data shows clear withdrawal details
- ✅ **Activity Log**: Track all requests you've approved or rejected
- ✅ **Non-Transferable Power**: Guardian status is soulbound and cannot be sold

### 📊 Guardian Activity Dashboard

Real-time tracking of guardian participation and performance:

- **Participation Metrics**: Track approval rates, response times, and voting history
- **Trust Scoring**: Automatically calculate guardian reliability scores (0-100)
- **Performance Timeline**: View recent actions with timestamps and details
- **Badge System**: Earn badges for reliability milestones (e.g., 100% approval, Fast Responder)
- **Activity Comparison**: See how your performance compares to other guardians
- **Freeze Voting Analytics**: Track emergency freeze participation and patterns

**Use Case**: Monitor guardian team effectiveness, identify inactive guardians, and recognize high-performing members.

**Learn More:** [GUARDIAN_RISK_IMPLEMENTATION.md](GUARDIAN_RISK_IMPLEMENTATION.md#1-guardian-activity-dashboard)

### ⚠️ Risk Scoring Engine

Intelligent, real-time vault risk assessment with multi-factor analysis:

**6-Factor Risk Analysis:**
1. **Withdrawal Velocity** - Tracks spending patterns and acceleration
2. **Pattern Deviation** - Identifies anomalies in timing, frequency, and amounts
3. **Guardian Consensus** - Measures approval consistency and dissent
4. **Spending Headroom** - Monitors daily/weekly/monthly limit utilization
5. **Time-Lock Utilization** - Analyzes queued and frozen withdrawals
6. **Approval Patterns** - Tracks guardian voting trends

**Risk Scoring:**
- **Overall Score**: 0-100 (lower = safer)
- **Risk Levels**:
  - 🟢 Safe (0-25)
  - 🟡 Normal (25-50)
  - 🟠 Caution (50-75)
  - 🔴 Critical (75-100)

**Alert System:**
- **Intelligent Alerts**: Automatically detects and flags unusual activity
- **Severity Levels**: Info, Warning, Critical for triage
- **Actionable Recommendations**: Suggests specific responses to detected risks
- **Alert Management**: Dismiss acknowledged alerts, track alert history

**Dashboard Integration:**
- Compact view on overview tab
- Expandable factor details
- Real-time risk metric updates
- Visual spending limit indicators
- Anomaly timeline view

**Use Case**: Proactively identify suspicious activity patterns, unusual spending behavior, or compromised guardian accounts before they pose a risk to vault security.

**Learn More:** [GUARDIAN_RISK_IMPLEMENTATION.md](GUARDIAN_RISK_IMPLEMENTATION.md#2-risk-scoring-engine)

### 📦 Multi-Sig Batch Withdrawal Manager

Efficiently bundle multiple withdrawals into a single batch for atomic execution:

**Key Benefits:**
- 🚀 **40-70% Gas Savings**: Amortize execution costs across multiple items (up to 50 per batch)
- 🤝 **Single Approval Round**: One approval vote covers entire batch instead of many
- ⚡ **Atomic Execution**: All-or-nothing processing with granular failure tracking
- 📋 **Flexible Batching**: Mix queued and direct withdrawals in same batch
- 🔄 **Concurrent Batches**: Create, approve, execute multiple batches in parallel

**Workflow:**
1. **Create**: Bundle 1-50 withdrawals with same token into batch
2. **Approve**: Guardians approve batch (all items together)
3. **Execute**: Process all items atomically with individual failure tracking
4. **Monitor**: Track execution results per item and batch

**Status Flow:**
- 🟡 **Pending**: Waiting for guardian approvals
- 🔵 **Approved**: All approvals received, ready to execute
- ⚙️ **Executing**: Currently processing items
- ✅ **Completed**: All items executed successfully
- ⚠️ **PartialFail**: Some items failed, others succeeded
- ✗ **Cancelled**: Cancelled before execution

**Use Case**: Treasury managers coordinating large-scale fund distributions (payroll, vendor payments, dividends) can batch related withdrawals, reduce gas costs by 70%, and coordinate approvals in a single round.

**Learn More:** [BATCH_WITHDRAWAL_MANAGER.md](BATCH_WITHDRAWAL_MANAGER.md) | [Quick Ref](BATCH_WITHDRAWAL_QUICKREF.md)

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
git clone https://github.com/cryptonique0/spenednsave.git
cd spenednsave

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
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=2c744d31bd68644ba0831658bbd2f1d6

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
- **Multi-Vault Associations**: Each guardian token can be linked to multiple SpendVault addresses. Guardians can serve in multiple vaults.

**Main Functions**:
```solidity
function mint(address to, address vault) external onlyOwner
function burn(uint256 tokenId, address vault) external onlyOwner
function balanceOf(address account) external view returns (uint256)
function getVaultsForGuardian(address guardian) external view returns (address[] memory)
function getGuardiansForVault(address vault) external view returns (address[] memory)
```

**Multi-Vault Guardian Associations**:
- Guardians can be associated with multiple vaults.
- Query all vaults for a guardian, or all guardians for a vault.

### SpendVault.sol

**Purpose**: Multi-sig treasury vault with guardian-based withdrawals

**Key Features**:
- Holds ETH and ERC-20 tokens
- Requires N-of-M guardian signatures for withdrawals
- EIP-712 signature verification
- Nonce-based replay protection
- Emergency timelock escape hatch
- **Guardian Reputation System**: Each guardian tracks approvals, rejections, and last activity
- **Weighted Quorum (Optional)**: Withdrawals can use trust scores for weighted voting
- **Emergency Guardian Rotation**: Owner can propose a replacement for an inactive guardian (>60 days). Requires approval from remaining active guardians or a 14-day time delay. Cannot reduce active guardians below quorum. Emits events for all steps.

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

// Guardian Reputation
function getGuardianTrustScore(address guardian) public view returns (uint256)

// Weighted Quorum Management
function setWeightedQuorum(bool enabled, uint256 threshold) external onlyOwner

// Emergency Guardian Rotation
function proposeGuardianRotation(address inactiveGuardian, address replacement) external onlyOwner
function approveGuardianRotation(address inactiveGuardian) external
function executeGuardianRotation(address inactiveGuardian) external onlyOwner

// Emergency access
function requestEmergencyUnlock() external onlyOwner
function executeEmergencyUnlock(address token) external onlyOwner

// Management
function setQuorum(uint256 _newQuorum) external onlyOwner
function updateGuardianToken(address _newToken) external onlyOwner
```

**Emergency Guardian Rotation**:
- If a guardian is inactive for more than 60 days, the owner can propose a replacement.
- Remaining active guardians can approve the rotation, or it can execute after a 14-day delay.
- Rotation cannot reduce active guardians below quorum.
- Events are emitted for proposal, approval, and completion.

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

**Framework**: Next.js 16.1 (App Router)
**Language**: TypeScript 5
**Styling**: TailwindCSS 3.4
**Web3**: 
   - Wagmi 2.19 (React hooks for Ethereum)
   - RainbowKit 2.2 (multi-wallet, WalletConnect v2, Zerion, etc.)
   - Viem 2.43 (TypeScript Ethereum library)
**Wallets**: WalletConnect v2 (Zerion, Rainbow, MetaMask, Coinbase, and more)
**State**: React Query (TanStack Query)
**Icons**: Lucide React
**Theme**: Next Themes (dark mode support)
## 🔗 WalletConnect v2 & Multi-Wallet Support

This app uses RainbowKit and WalletConnect v2 for seamless multi-wallet support, including Zerion, Rainbow, MetaMask, Coinbase, Trust, and many more.

**WalletConnect v2** is enabled by setting your project ID in `lib/config.ts` and `.env.local`:
   - Project ID: `2c744d31bd68644ba0831658bbd2f1d6`
   - Get your own at https://cloud.walletconnect.com
**Zerion Wallet** and all major wallets are available in the connect modal by default—no extra setup required.
To feature or prioritize a wallet, customize the RainbowKit config (see RainbowKit docs).

**How to use:**
1. Click "Connect Wallet" in the navbar or landing page.
2. Choose from MetaMask, Zerion, Rainbow, Coinbase, Trust, and more.
3. WalletConnect QR and mobile deep links are supported.

**Config location:**
`lib/config.ts` — RainbowKit/Wagmi config, including WalletConnect projectId and supported chains.
`.env.local` — For environment-based overrides.

**Docs:**
[RainbowKit Wallets](https://www.rainbowkit.com/docs/introduction)
[WalletConnect Cloud](https://cloud.walletconnect.com)


### Simulation Mode (Frontend-Only Demo)

SpendGuard includes a built-in simulation mode for demo and education purposes. This mode lets you experience the full vault recovery and guardian approval flow **without sending any onchain transactions**.

**How to Use Simulation Mode:**

1. **Toggle Simulation:**
   - Use the "Simulation: ON/OFF" button in the top navigation bar to enable or disable simulation mode.
2. **Demo Panel:**
   - When enabled, a floating panel appears in the bottom-right corner.
   - Simulate guardian approvals, start an emergency unlock countdown, and see the recovery success state.
3. **No Blockchain Required:**
   - All actions in simulation mode are handled in the frontend only. No real transactions are sent.
   - All onchain actions in the UI are blocked while simulation is active.

**Simulation Features:**
- Simulate vault owner loss of access
- Guardian approval workflow
- Emergency unlock countdown (demo duration)
- Recovery success state
- No wallet or blockchain required

This is ideal for onboarding, demos, and testing the user experience without risk.

---

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
│   ├── activity/            # Transaction history
│   ├── feature-requests/    # Community feature requests page
│   └── api/feature-requests # API routes for feature requests
├── components/              # React components
│   ├── community/           # Community feature requests UI
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
---

## 🌟 Community Feature Requests

SpendGuard now includes a Community Feature Requests page where users can:

- Suggest new features for the platform
- Vote on existing feature requests
- See top-voted ideas prioritized for future development

**How to use:**
- Visit the "Feature Requests" link in the navigation bar
- Submit your idea or vote for your favorites

Backend API routes handle submission and voting. For demo, requests are stored in memory; production should use a database.

---

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

## 🔐 Server & Encrypted DB

- The app now stores guardian pending requests and account activities server-side using a SQLite database (server-only). The DB is encrypted using AES-256-GCM; the encryption key must be provided via `DB_ENCRYPTION_KEY` in your environment.
- Install the native SQLite dependency on the server: `better-sqlite3` is required for the server-side service.
- Migration: if you have existing on-chain cached activity data, an import endpoint and helper script are provided. To re-encrypt or import data, run the migration script (if present) and set `DB_ENCRYPTION_KEY` prior to running:

```bash
# Ensure env contains DB_ENCRYPTION_KEY
npm run encrypt-db
```

Files of interest:
- `lib/services/guardian-signature-db.ts` — encrypted DB layer and API helpers
- `app/api/activities` — server endpoints for listing/importing activities

## 🛡️ GuardianBadge (Soulbound NFT)

- A non-transferable `GuardianBadge` ERC-721 contract (soulbound) was added to help surface guardian achievements in the UI.
- To enable badge display in the dashboard, set the deployed contract address for your network in `lib/contracts.ts` under `GUARDIAN_BADGE_ADDRESS` (e.g. `baseSepolia: '0xYOUR_ADDRESS'`).
- There is a server endpoint that computes badge eligibility recommendations at `/api/badges/eligible` — minting is manual (owner) or can be automated with a secure signer.

Files of interest:
- `contracts/GuardianBadge.sol` — the soulbound badge contract
- `lib/abis/GuardianBadge.json` and `lib/abis/GuardianBadge.ts` — ABI and wrapper
- `lib/hooks/useContracts.ts` — client hooks for reading badges and minting (owner)

## 🧭 Activity Log Troubleshooting

If the Activity page shows "No Activity Yet" even when you expect events, try the following steps:

- 1) Verify Vault addresses are discovered
   - Open the browser console and look for logs prefixed with `[ActivityLogView]` and `[useVaultActivity]` to confirm `vaultAddress` and `guardianTokenAddress` are populated.

- 2) Check the server API
   - Request server-side activities for a vault:

```bash
curl "http://localhost:3000/api/activities?account=0xYOUR_VAULT_ADDRESS" | jq '.'
```

   - A non-empty JSON array indicates the server has activity records. If the array is empty, the UI will fall back to on-chain event scanning.

- 3) Confirm on-chain events are being fetched
   - The client scans the vault contract for `Deposited` and `Withdrawn` events. Look for logs like `[useDepositHistory] Decoded log:` in the browser console.
   - If no logs appear, ensure `NEXT_PUBLIC_RPC_URL` points to a working Base Sepolia RPC and that the vault has emitted events.

- 4) Check local caches and auto-import
   - The client stores caches under keys like `deposits-cache-<vault>` and `deposits-debug-<vault>` in `localStorage`. Inspect these keys if you want debug information.
   - On first load the app attempts an automatic import of recent on-chain activity to the server. It sets a local flag `activities-migrated-<vaultAddress>` to avoid repeating imports.

- 5) Server-side DB & encryption
   - Make sure the server process has `DB_ENCRYPTION_KEY` set; otherwise encrypted DB access will fail.
   - If you recently changed the key, run the migration/encrypt script:

```bash
# Set DB_ENCRYPTION_KEY in your environment, then:
npm run encrypt-db
```

- 6) Force import (advanced)
   - The client calls an import endpoint to persist activities server-side. If needed, you can POST activity objects to `/api/activities/import` (JSON array) to seed the DB.

If you still see no activity after these checks, paste the browser console logs and the output of the `curl` command above and I will help diagnose further.


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

### Running Locally

```bash
# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Building for Production

```bash
# Create optimized build
npm run build

# Start production server
npm run start
```

---

## 🚀 Suggested Features for Enhancement

Here are high-impact features that would significantly improve SpendGuard:

### 1. **Guardian Reputation System** ⭐⭐⭐⭐⭐
Implement an on-chain reputation system that rewards reliable guardians:
- **Metrics**: Approval speed, response time, voting consistency
- **On-Chain Badges**: NFT badges for milestones (100% approval rate, Fast responder, Trusted advisor)
- **Reputation Score**: 0-1000 score visible on-chain and in dashboard
- **Incentives**: Higher reputation guardians earn protocol rewards or fee discounts
- **Penalty System**: Reputation decay for inactive guardians or policy violations
- **Implementation**: Create `GuardianReputation.sol` contract + leaderboard UI

### 2. **Advanced Multi-Token Batching** ⭐⭐⭐⭐
Extend batch withdrawal manager to handle multiple tokens:
- **Cross-Token Batches**: Bundle withdrawals of different tokens in single approval
- **Rebalancing Batches**: Automatically convert tokens during withdrawal (DEX integration)
- **Liquidity Aggregation**: Best-rate swaps across DEXs (1inch, Curve, Uniswap)
- **Atomic Swaps**: Execute swaps + transfers in single transaction
- **Implementation**: Add DEX routing, update `BatchWithdrawalManager.sol`, new UI component

### 3. **Guardian Delegation & Proxy Voting** ⭐⭐⭐⭐
Allow guardians to delegate voting power to trusted representatives:
- **Temporary Delegation**: Guardian A delegates to Guardian B for 30 days (travel, busy)
- **Partial Delegation**: Delegate only certain approval types (low-risk, emergency-only)
- **Delegation Chain**: Up to 2-level delegation chains to prevent loop vulnerabilities
- **Revocation**: Can revoke delegation anytime
- **Transparency**: Full audit trail of delegations shown in dashboard
- **Implementation**: Add delegation state to `GuardianSBT.sol`, update voting logic

### 4. **Multisig Vault Recovery** ⭐⭐⭐⭐
Enable recovery of vaults when owner becomes unresponsive:
- **Recovery Proposal**: Guardians can initiate recovery if owner dormant for 180+ days
- **Voting Requirements**: 75%+ guardian consensus required
- **Recovery Phases**: 14-day voting period, 7-day execution window
- **New Owner Assignment**: Rotating owner role among senior guardians (optional)
- **Safety Measures**: Previous owner can reclaim within 30 days if re-active
- **Implementation**: New recovery module, event logging, legal disclaimers

### 5. **Automated Payroll & Subscriptions** ⭐⭐⭐⭐
Enable recurring payments and subscriptions directly from vaults:
- **Recurring Withdrawals**: Set up monthly/weekly payments to recipients
- **Smart Scheduling**: Calendar-based scheduling with guardian pre-approval
- **Subscription Management**: Track active subscriptions, modify/cancel anytime
- **Batch Scheduling**: Pre-approve 12 months of payroll payments at once
- **Automation Limits**: Max per-subscription, total per month enforcement
- **Implementation**: `SubscriptionVault.sol` extension, cron-like UI

### 6. **Cross-Chain Vault Management** ⭐⭐⭐⭐
Sync vault state and governance across multiple blockchains:
- **Multi-Chain Deployment**: Deploy same vault on Ethereum, Optimism, Arbitrum
- **Unified Dashboard**: Single UI to manage vaults across all chains
- **Cross-Chain Messaging**: LayerZero or Wormhole for state sync
- **Atomic Withdrawal**: Execute withdrawal on one chain, mirror on others
- **Unified Governance**: Single guardian set votes across all chains
- **Implementation**: Bridge contracts, IBC integration, new dashboard tabs

### 7. **Advanced Risk Analytics** ⭐⭐⭐⭐
Expand risk scoring with ML-powered anomaly detection:
- **Behavioral Analysis**: ML model trained on guardian approval patterns
- **Anomaly Scoring**: Detect unusual approval combinations (guardian X never approves with Y)
- **Threat Intelligence**: Integrate Chainalysis/TRM for address reputation
- **Phishing Detection**: Flag if withdrawal goes to recently flagged address
- **Historical Backtesting**: "What if" analysis of withdrawal patterns
- **Implementation**: Python ML backend, enhanced dashboard visualizations

### 8. **Decentralized Governance Module** ⭐⭐⭐
Enable community voting on vault parameters:
- **Parameter Voting**: Guardians vote on spending limits, timelock durations
- **Proposal System**: Create proposals for vault policy changes
- **Weighted Voting**: Senior guardians get higher voting weight (optional)
- **Governance Tokens**: Issue non-transferable voting tokens tied to guardianship
- **Historical Record**: Track all governance decisions on-chain
- **Implementation**: `GovernanceModule.sol`, proposal tracker UI

### 9. **Guardian Insurance Pool** ⭐⭐⭐
Insurance mechanism protecting against guardian misconduct:
- **Insurance Fund**: Collateral pool funded by vault fees (0.1-0.5% annual)
- **Slashing**: Insurance covers losses from guardian collusion/theft
- **Claims Process**: Owners can claim if guardians collude to steal funds
- **Underwriting**: Guardian reputation used for insurance premiums
- **Yield Generation**: Insurance pool assets earn yield on Aave/Lido
- **Implementation**: `InsurancePool.sol`, claims management dashboard

### 10. **Social Recovery & Account Abstraction** ⭐⭐⭐
Integrate with latest AA standards for enhanced UX:
- **ERC-4337 Support**: Use Account Abstraction for paymaster-sponsored txs
- **Session Keys**: Guardians get time-limited session keys (30-day expiry)
- **Batch Operations**: Multiple actions in single signature via Account Abstraction
- **Gas Sponsorship**: Vault subsidizes guardian transaction fees
- **Portable Identity**: Guardians keep their identity across multiple vaults
- **Implementation**: Use Biconomy/Pimlico, new account recovery flows

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

- GitHub: [cryptonique0/spenednsave](https://github.com/cryptonique0/spenednsave)
- Issues: [Bug Reports & Features](https://github.com/cryptonique0/spenednsave/issues)
- Discussions: [Community Forum](https://github.com/cryptonique0/spenednsave/discussions)

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

- � Issues: [GitHub Issues](https://github.com/cryptonique0/spenednsave/issues)
- 💬 Discussions: [Community Forum](https://github.com/cryptonique0/spenednsave/discussions)
- 📚 Docs: Check [contract-spec.md](contract-spec.md) and [DEPLOYMENT.md](DEPLOYMENT.md)

---

<div align="center">

**Built with ❤️ on Base**

[GitHub](https://github.com/cryptonique0/spenednsave) • [Docs](contract-spec.md) • [Issues](https://github.com/cryptonique0/spenednsave/issues) • [Discussions](https://github.com/cryptonique0/spenednsave/discussions)

</div>
