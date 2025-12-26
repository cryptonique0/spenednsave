# Contract Deployment Information

## Base Mainnet Deployment

**Network:** Base Mainnet  
**Chain ID:** 8453  
**RPC URL:** https://mainnet.base.org  
**Explorer:** https://basescan.org  

**Contract Address:** `[PASTE YOUR CONTRACT ADDRESS HERE AFTER DEPLOYMENT]`

**Deployment Date:** December 26, 2025  
**Deployer:** [Your Address]  
**Transaction Hash:** [Deployment TX Hash]  

---

## Quick Update Instructions

After deploying on Remix, update the following files:

### 1. Update `.env.local`
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddressHere
NEXT_PUBLIC_NETWORK=base
NEXT_PUBLIC_CHAIN_ID=8453
```

### 2. Verify Contract on BaseScan
Visit: https://basescan.org/verifyContract
- Paste your contract address
- Use Solidity version 0.8.19
- Paste the contract code from `contracts/OnChainResume.sol`

### 3. Test the Contract
Use Remix or BaseScan to test:
```javascript
// Create a profile
createProfile("yourusername", "QmYourIPFSHash")

// Get profile
getProfile("0xYourAddress")
```

### 4. Commit to GitHub
```bash
cd "/home/web3joker/New PJ"
git add CONTRACT_ADDRESS.md .env.local
git commit -m "feat: Add deployed contract address on Base Mainnet"
git push origin feat/whitelist-management
```

---

## Contract Functions Ready to Use

### User Functions
- ✅ `createProfile(handle, ipfsHash)` - Create your on-chain resume
- ✅ `updateProfile(ipfsHash)` - Update resume data
- ✅ `addCredential(...)` - Add verified credentials
- ✅ `unlockAchievement(title, desc)` - Add achievements
- ✅ `verifyCredential(user, index)` - Verify others' credentials

### View Functions
- 📖 `getProfile(address)` - Get any user's profile
- 📖 `getUserByHandle(handle)` - Find user by handle
- 📖 `getCredentials(address)` - View credentials
- 📖 `getAchievements(address)` - View achievements
- 📖 `getReputation(address)` - Check reputation score
- 📖 `getTopProfiles(limit)` - Leaderboard

---

## Useful Links

- **Remix IDE:** https://remix.ethereum.org
- **Base Docs:** https://docs.base.org
- **BaseScan:** https://basescan.org
- **Your Contract:** https://basescan.org/address/[YOUR_ADDRESS]
- **GitHub Repo:** https://github.com/cryptonique0/my-portfolio

---

**Status:** ⏳ Awaiting Deployment  
**Next Step:** Deploy contract on Remix and paste address above
