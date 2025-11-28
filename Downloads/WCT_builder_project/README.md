# WCT_builder_project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)](https://soliditylang.org/)
[![WalletConnect](https://img.shields.io/badge/WalletConnect-Enabled-blue)](https://walletconnect.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

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
export CONTRACT_ADDRESS="0x..."
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
web3joker@web3joker:~/Downloads/WCT_builder_project$ cd dapp
npm install
# or for CI-like install:
npm ci

up to date, audited 1080 packages in 26s

159 packages are looking for funding
  run `npm fund` for details

34 vulnerabilities (13 low, 3 moderate, 16 high, 2 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
npm warn deprecated safe-event-emitter@1.0.1: Renamed to @metamask/safe-event-emitter
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/types@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
npm warn deprecated memdown@1.4.1: Superseded by memory-level (https://github.com/Level/community#faq)
npm warn deprecated lodash.isequal@4.5.0: This package is deprecated. Use require('node:util').isDeepStrictEqual instead.
npm warn deprecated level-errors@1.0.5: Superseded by abstract-level (https://github.com/Level/community#faq)
npm warn deprecated har-validator@5.1.5: this library is no longer supported
npm warn deprecated eth-json-rpc-infura@5.1.0: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
npm warn deprecated eth-sig-util@1.4.2: Deprecated in favor of '@metamask/eth-sig-util'
npm warn deprecated @walletconnect/mobile-registry@1.4.0: Deprecated in favor of dynamic registry available from: https://github.com/walletconnect/walletconnect-registry
npm warn deprecated glob@8.1.0: Glob versions prior to v9 are no longer supported
npm warn deprecated deferred-leveldown@1.2.2: Superseded by abstract-level (https://github.com/Level/community#faq)
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@5.0.15: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
npm warn deprecated glob@7.1.7: Glob versions prior to v9 are no longer supported
npm warn deprecated ethereumjs-block@2.2.2: New package name format for new versions: @ethereumjs/block. Please update.
npm warn deprecated level-codec@7.0.1: Superseded by level-transcoder (https://github.com/Level/community#faq)
npm warn deprecated ethereumjs-tx@2.1.2: New package name format for new versions: @ethereumjs/tx. Please update.
npm warn deprecated uuid@3.4.0: Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.
npm warn deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142
npm warn deprecated @walletconnect/client@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated ethereumjs-tx@1.3.7: New package name format for new versions: @ethereumjs/tx. Please update.
npm warn deprecated abstract-leveldown@2.6.3: Superseded by abstract-level (https://github.com/Level/community#faq)
npm warn deprecated abstract-leveldown@2.7.2: Superseded by abstract-level (https://github.com/Level/community#faq)
npm warn deprecated ethereumjs-vm@2.6.0: New package name format for new versions: @ethereumjs/vm. Please update.
npm warn deprecated @walletconnect/modal@2.6.2: Please follow the migration guide on https://docs.reown.com/appkit/upgrade/wcm
npm warn deprecated levelup@1.3.9: Superseded by abstract-level (https://github.com/Level/community#faq)
npm warn deprecated @motionone/vue@10.16.4: Motion One for Vue is deprecated. Use Oku Motion instead https://oku-ui.com/motion
npm warn deprecated ethereumjs-block@1.7.1: New package name format for new versions: @ethereumjs/block. Please update.
npm warn deprecated @walletconnect/web3-provider@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated @walletconnect/qrcode-modal@1.8.0: WalletConnect's v1 SDKs are now deprecated. Please upgrade to a v2 SDK. For details see: https://docs.walletconnect.com/
npm warn deprecated ethereumjs-common@1.5.2: New package name format for new versions: @ethereumjs/common. Please update.
npm warn deprecated @walletconnect/sign-client@2.11.0: Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases
npm warn deprecated @walletconnect/ethereum-provider@2.11.0: Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases
npm warn deprecated web3-provider-engine@16.0.1: This package has been deprecated, see the README for details: https://github.com/MetaMask/web3-provider-engine
npm warn deprecated @walletconnect/universal-provider@2.11.0: Reliability and performance improvements. See: https://github.com/WalletConnect/walletconnect-monorepo/releases

added 1079 packages, and audited 1080 packages in 32s

159 packages are looking for funding
  run `npm fund` for details

34 vulnerabilities (13 low, 3 moderate, 16 high, 2 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues possible (including breaking changes), run:
  npm audit fix --force

Some issues need review, and may require choosing
a different dependency.

Run `npm audit` for details.
web3joker@web3joker:~/Downloads/WCT_builder_project/dapp$ npm run dev

> wct-dapp@0.1.0 dev
> vite

node:internal/fs/watchers:247
    const error = new UVException({
                  ^

Error: ENOSPC: System limit for number of file watchers reached, watch '/home/web3joker/Downloads/WCT_builder_project/dapp/vite.config.js'
    at FSWatcher.<computed> (node:internal/fs/watchers:247:19)
    at Object.watch (node:fs:2491:36)
    at createFsWatchInstance (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:42780:17)
    at setFsWatchListener (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:42827:15)
    at NodeFsHandler._watchWithNodeFs (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:42982:14)
    at NodeFsHandler._handleFile (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:43046:23)
    at NodeFsHandler._addToNodeFs (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:43288:21)
    at async file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:44285:21
    at async Promise.all (index 1)
Emitted 'error' event on FSWatcher instance at:
    at FSWatcher._handleError (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:44481:10)
    at NodeFsHandler._addToNodeFs (file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:43296:18)
    at async file:///home/web3joker/Downloads/WCT_builder_project/dapp/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:44285:21
    at async Promise.all (index 1) {
  errno: -28,
  syscall: 'watch',
  code: 'ENOSPC',
  path: '/home/web3joker/Downloads/WCT_builder_project/dapp/vite.config.js',
  filename: '/home/web3joker/Downloads/WCT_builder_project/dapp/vite.config.js'
}

Node.js v20.19.5
web3joker@web3joker:~/Downloads/WCT_builder_project/dapp$ 