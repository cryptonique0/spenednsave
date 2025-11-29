
# Contributing

Small notes for contributing to this demo project:

- Purpose: showcase a minimal Celo dApp for contest/judging.
- Do not commit any private keys or secrets. Use repository Secrets for CI (Settings → Secrets → Actions).
- Run tests locally with:
  - `cd celo-dapp && npm ci && npx hardhat test`
- Deploy locally to Alfajores (requires funded testnet key):
  - `npx hardhat run scripts/deploy.js --network alfajores`

If you add features, keep commits small and add a short test where possible.
