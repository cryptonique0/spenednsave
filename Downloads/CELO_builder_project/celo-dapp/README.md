# Celo SimplePayments — dApp scaffold

This repository folder `celo-dapp` is a minimal scaffold for a Celo dApp meant for contest submission tracking. It contains:

- `contracts/SimplePayments.sol` — small Solidity contract that accepts native payments and allows the owner to withdraw.
- `scripts/deploy.js` — minimal node script to deploy given precompiled artifacts.
- `frontend/index.html` — tiny UI stub.
- `package.json` — lists tools you can install (Hardhat, ethers, ContractKit).

How to use (local):

1. Install dependencies (optional):

```bash
cd celo-dapp
npm install
```

2. Compile and produce artifacts (recommended using Hardhat). Example (if you add a Hardhat config):

```bash
npx hardhat compile
# place compiled ABI into ./artifacts/SimplePayments.abi.json
# place bytecode into ./artifacts/SimplePayments.bytecode.txt
```

3. Deploy to Alfajores (example):

```bash
CELO_RPC=https://alfajores-forno.celo-testnet.org PRIVATE_KEY=0x... node scripts/deploy.js
```

Notes:
- This is intentionally minimal so contest updates can be pushed quickly. Next steps: add tests, CI, better frontend integration using @celo/contractkit.
