# WCT DApp (WalletConnect demo)

This is a minimal React + Vite dapp that demonstrates integrating WalletConnect on Celo (Alfajores testnet) using Wagmi + WalletConnect connector.

Features:
- Connect/disconnect using WalletConnect and Injected (e.g., MetaMask)
- Status bar with network and address
- Sign a message demo
- Read current block number
- cUSD balance panel (ERC20 read on Alfajores)

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

Open the app (Vite will print the local URL). Click a Connect button (WalletConnect or Injected) and choose a wallet.

Notes
- Chain: Celo Alfajores (testnet). You can change chains by editing `src/main.jsx` chain config.
- Connectors: WalletConnect and Injected (e.g., MetaMask).
- Example actions: sign a message, read current block number, view cUSD balance.

## Switch network (injected wallets)
If your injected wallet (e.g., MetaMask) is on the wrong chain, the app shows a "Switch to Celo Alfajores" prompt. Click it to request a network switch.

## Deploy

### Netlify
1. New site from Git → connect GitHub repo `cryptonique0/my-portfolio`, branch `celo-dapp-initial`.
2. Build settings:
	- Base directory: `dapp`
	- Build command: `npm run build`
	- Publish directory: `dist`
3. Environment variables: add `VITE_WALLETCONNECT_PROJECT_ID` with your value.
4. Deploy.

### Vercel
1. Import GitHub repo and choose the `dapp` root directory.
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables: add `VITE_WALLETCONNECT_PROJECT_ID`.
6. Deploy.

 Useful links
- Alfajores faucet (test CELO): https://celo.org/developers/faucet
- WalletConnect Cloud (Project ID dashboard): https://cloud.walletconnect.com/
- Celo docs: https://docs.celo.org/
