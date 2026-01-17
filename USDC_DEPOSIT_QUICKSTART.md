# USDC Deposit - Quick Start Guide

## What's New?
Users can now deposit USDC tokens in addition to ETH directly from the dashboard.

## Access Deposit Feature

1. Go to Dashboard
2. Click the **"Deposit"** button on the vault balance card
3. A modal will open with the new **TokenDepositForm**

## Deposit ETH (Simple)

1. Select **ETH** tab
2. Enter amount (or use quick buttons: 0.01, 0.05, 0.1)
3. Click **"Deposit ETH"**
4. Confirm in wallet
5. ✅ Done! Balance updates automatically

## Deposit USDC (Two Steps)

### Step 1: Approve USDC
1. Select **USDC** tab
2. Enter amount
3. Click **"Approve USDC"** button (yellow)
4. Confirm approval in wallet
5. Status changes to "Approval confirmed!" ✅

### Step 2: Deposit USDC
1. Click **"Deposit USDC"** button (now enabled)
2. Confirm deposit in wallet
3. ✅ Success! Your USDC is now in the vault

## Features

### Real-Time Balance Display
- Shows current vault balance for selected token
- Updates automatically after deposits

### Smart Approval Detection
- Automatically detects if approval is needed
- Shows "Approve USDC" button only when required
- One approval per session (unless amount exceeds previous approval)

### Error Handling
- Clear error messages if something fails
- Disabled buttons during processing
- Loading spinners indicate progress

### Activity Tracking
- All deposits appear in activity log
- Timestamp and amounts recorded
- Part of vault history

## Technical Details

### USDC Contract Details
- **Network**: Base (Sepolia/Mainnet)
- **Address**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Decimals**: 6
- **Standard**: ERC20

### What Happens Behind the Scenes

**ETH Deposit:**
```
User's Wallet → Transfer ETH → Vault Contract
```

**USDC Deposit:**
```
1. User's USDC Balance
2. Approve Vault to Spend USDC ← (Approval Step)
3. Vault transferFrom User's USDC
4. User's Vault USDC Balance ↑
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient balance" | Check USDC balance shown in form |
| "Approval failed" | Ensure enough ETH for gas, retry |
| "Deposit failed" | Verify approval completed, refresh page |
| No USDC address shown | Check you're on Base network |
| Deposit not showing in activity | Wait 5-10 seconds and refresh |

## Next Steps

- [View Full Documentation](./USDC_DEPOSIT_INTEGRATION.md)
- [Smart Contract Details](./contract-spec.md)
- [Report Issues](./README.md)

---

**Version**: 1.0 | **Date**: January 2026 | **Status**: ✅ Live
