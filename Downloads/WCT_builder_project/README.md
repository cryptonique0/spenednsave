# WCT_builder_project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)](https://soliditylang.org/)
[![WalletConnect](https://img.shields.io/badge/WalletConnect-Enabled-blue)](https://walletconnect.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()
[![Coverage](https://img.shields.io/badge/coverage-25%25-yellow.svg)]()

A lightweight dApp starter used for the WalletConnect Builder contest. This repository contains a React frontend (Vite) under `dapp/` and a small Python helper in `src/`.

Contributions are welcome — see `CONTRIBUTING.md` for how to open issues and PRs, and `ROADMAP.md` for planned work and good-first issues.

Quick links

- Code: `dapp/`
- Frontend entry: `dapp/src/main.jsx`
- Components: `dapp/src/components/`

Ready to help? See `CONTRIBUTING.md` for step-by-step contributor instructions and how to run the project locally.

## Demo & deploy (quickstart)

This project includes a small `Rewards` contract (in `dapp/contracts/`) and helper scripts to deploy and demo interactions.

Local dev (frontend):

```bash
cd dapp
npm install
npm run dev
```

Deploy a test contract (requires a funded account and RPC URL):

1. Create a `.env` file in `dapp/` with:

```
DEPLOYER_PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
ETHERSCAN_API_KEY=etherscan-api-key
```

2. Install deps and deploy:

```bash
cd dapp
npm ci
npx hardhat run scripts/deploy.js --network sepolia
```

The deploy step will print the deployed contract address. Add that address to `dapp/.env` as `CONTRACT_ADDRESS` for demo scripts.

Run the demo batch script (claim + transfer) to generate verified contract usage on a testnet (make sure wallets are funded by faucet):

```bash
cd dapp
export RPC_URL="https://sepolia.infura.io/v3/your-key"
export CONTRACT_ADDRESS=""
export PRIVATE_KEYS="pk1,pk2"
node scripts/batchTxs.js
```

CI deploy & verify

There is a GitHub Action `Hardhat deploy & verify` that will compile the contracts and can deploy when the repository secrets are configured (`DEPLOYER_PRIVATE_KEY`, `SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY`). The action currently prints deployment output; you should add verification commands or modify the workflow to capture deployed addresses and run verification.

Social & demo assets

- Add a short demo GIF in `demo/demo.gif` and reference it here for judges to preview quickly.
- Add social share links or a short Tweet template in the repo to encourage community interactions.

Notes and safety

- Do not commit private keys or API keys.
- Check contest rules before running automated transactions — prefer real user interactions where required by rules.

## Features

- **MultiWalletConnector**: Seamless wallet integration for multiple providers.
- **Dashboard**: Displays real-time stats and analytics.
- **TransactionDemo**: Demonstrates transaction flows with detailed previews.
- **GovernanceDashboard**: Manage proposals and voting for decentralized governance.
- **NotificationSystem**: Real-time notifications for user actions.

## Architecture

The project is divided into the following key sections:

1. **Frontend**: Built with React and Vite, located in `dapp/src/`.
2. **Smart Contracts**: Solidity contracts for rewards and governance, located in `dapp/contracts/`.
3. **Testing**: Unit tests for components and contracts, located in `dapp/test/`.
4. **CI/CD**: Automated workflows for testing and deployment using GitHub Actions.

## API References

### Rewards Contract

- **`mint(address recipient, uint256 amount)`**: Mints tokens to the specified address.
- **`transfer(address recipient, uint256 amount)`**: Transfers tokens to the specified address.
- **`balanceOf(address account)`**: Returns the token balance of the specified address.

### Frontend Components

- **MultiWalletConnector**: Provides wallet connection options.
- **Dashboard**: Displays user stats and analytics.
- **TransactionDemo**: Handles transaction previews and submissions.