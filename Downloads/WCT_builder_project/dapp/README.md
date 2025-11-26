# WCT DApp (WalletConnect demo)

This is a minimal React + Vite dapp that demonstrates integrating WalletConnect on Celo (Alfajores testnet) using Wagmi + WalletConnect connector.

Features:
- Connect/disconnect using WalletConnect v2 (Web3Modal)
- Display connected address
- Sign a message demo

Important: WalletConnect requires a Project ID. This repo contains an example `.env` and we added your Project ID to `dapp/.env` for local dev.

Setup

1. Install dependencies:

```bash
cd dapp
npm install
```

2. Set your WalletConnect Project ID (already configured in `dapp/.env` for local dev).
	- If you want to change it, edit `dapp/.env` and update `VITE_WALLETCONNECT_PROJECT_ID`.

3. Run the dev server:

```bash
npm run dev
```

Open the app (Vite will print the local URL). Click Connect to open the WalletConnect modal and choose a wallet.

Notes
- Chain: Celo Alfajores (testnet). You can change chains by editing `src/main.jsx` chain config.
- Connectors: WalletConnect and Injected (e.g., MetaMask).
- Example actions: sign a message, read current block number.

 Useful links
- Alfajores faucet (test CELO): https://celo.org/developers/faucet
- WalletConnect Cloud (Project ID dashboard): https://cloud.walletconnect.com/
- Celo docs: https://docs.celo.org/
