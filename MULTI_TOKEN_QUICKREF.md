# Multi-Token Expansion - Quick Reference

## 🎯 Quick Start

### For Users

1. **Select a Token**: Click token button in deposit form (ETH, USDC, DAI, USDT, DEGEN, WETH)
2. **View Price**: See USD price updated in real-time
3. **Enter Amount**: Type token amount to deposit
4. **See USD Value**: Automatic conversion display
5. **Approve** (ERC-20 only): Click "Approve" first time only
6. **Deposit**: Click "Deposit" and confirm in wallet

### For Developers

```typescript
// Get tokens
import { getAllTokens, getToken } from '@/lib/tokens';
const tokens = getAllTokens(84532);
const usdc = getToken(84532, 'USDC');

// Get prices
import { useTokenPrice, convertToUSD } from '@/lib/hooks/useTokenPrice';
const { data } = useTokenPrice(84532, 'USDC');
const usdValue = convertToUSD(amount, 6, price);

// Handle approvals & deposits
import { useApproveToken, useDepositToken } from '@/lib/hooks/useTokenOperations';
const { approve } = useApproveToken(84532, 'USDC', vault);
const { deposit } = useDepositToken(84532, 'USDC', vault);
```

## 📊 Supported Tokens

| Token | Symbol | Decimals | Networks | Oracle |
|-------|--------|----------|----------|--------|
| Ethereum | ETH | 18 | Sepolia, Mainnet | ✅ |
| USD Coin | USDC | 6 | Sepolia, Mainnet | ✅ |
| Dai | DAI | 18 | Sepolia, Mainnet | ✅ |
| Tether | USDT | 6 | Sepolia, Mainnet | ✅ |
| Degen | DEGEN | 18 | Sepolia, Mainnet | ✅ |
| Wrapped ETH | WETH | 18 | Sepolia, Mainnet | ✅ |

## 🔗 Chainlink Oracles

### Base Sepolia
```
ETH/USD:    0x4f3e5dA1c3D8bC07D3B1bae0e5B3e8f2A5e3c2b1
USDC/USD:   0x7e860098F58bBFC8648a4aa498464e7bea7F00FF
DAI/USD:    0x14866185B1962B63C3Ea9E03031fEADA95a63fd8
USDT/USD:   0x7dc03B02145c0D1c3Dc5e20b72e4A6Bfc14A83C
DEGEN/USD:  0x1f6d52516914ca9799b76364f7365aaf963361c8
```

### Base Mainnet
```
ETH/USD:    0x71041dddad3287f98cad3d46d89e11e4ad7d1add
USDC/USD:   0x7e860098F58bBFC8648a4aa498464e7bea7F00FF
DAI/USD:    0x591e79239a7d679378eC23439C3F6C5f8241848b
USDT/USD:   0x7e860098F58bBFC8648a4aa498464e7bea7F00FF
DEGEN/USD:  0x4e844125952f32F72F3B0199d769b2aE66B8ae3F
```

## 🆕 Adding Custom Tokens

1. Go to Token Registry (Settings → Token Registry)
2. Click "Add Custom Token"
3. Fill in:
   - **Symbol**: ABC (token abbreviation)
   - **Name**: My Token (full name)
   - **Address**: 0x... (contract address)
   - **Decimals**: 18 (or your token's decimals)
   - **Oracle**: (optional) 0x... (Chainlink price feed)
4. Click "Add Token"

**⚠️ Warning**: Always verify custom token addresses before adding.

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `lib/tokens.ts` | Token registry, configuration |
| `lib/hooks/useTokenPrice.ts` | Chainlink price feeds |
| `lib/hooks/useTokenOperations.ts` | Approve, deposit operations |
| `components/dashboard/enhanced-token-deposit-form.tsx` | Multi-token deposit UI |
| `components/dashboard/token-registry.tsx` | Token management |
| `MULTI_TOKEN_EXPANSION.md` | Full documentation |

## 🔑 Key Functions

### Token Registry
```typescript
getAllTokens(chainId)           // Get verified + custom tokens
getToken(chainId, symbol)       // Get specific token
getTokensByChain(chainId)       // Get all tokens for chain
addCustomToken(chainId, token)  // Add custom token
removeCustomToken(chainId, sym) // Remove custom token
```

### Price Feeds
```typescript
useTokenPrice(chainId, symbol)     // Single token price
useTokenPrices(chainId, symbols)   // Multiple tokens
convertToUSD(amount, decimals, price) // Amount to USD
formatUSDPrice(amount, decimals)   // Format currency
```

### Token Operations
```typescript
useApproveToken(chainId, symbol, spender)  // Approve token
useDepositToken(chainId, symbol, vault)    // Deposit token
useTokenBalance(chainId, symbol, user)     // Get balance
useTokenBalances(chainId, symbols, user)   // Get balances
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Price not loading | Check oracle address, wait 30s, refresh |
| Custom token missing | Clear localStorage, reload page |
| Approval fails | Check gas, verify allowance not set |
| Deposit fails | Check balance, verify vault address |

## 📚 Full Documentation

See [MULTI_TOKEN_EXPANSION.md](MULTI_TOKEN_EXPANSION.md) for:
- Complete feature list
- Architecture diagrams
- Usage examples
- Security considerations
- Testing checklist
- Future enhancements

## ✨ What's Included

✅ 6 pre-configured tokens  
✅ Chainlink price feed integration  
✅ Dynamic token registry  
✅ Custom token support  
✅ Enhanced deposit form  
✅ Token management UI  
✅ Full type safety  
✅ Dark mode support  
✅ Mobile responsive  
✅ Comprehensive documentation  

---

**Status**: ✅ Production Ready  
**Date**: January 17, 2026  
**Version**: 2.0
