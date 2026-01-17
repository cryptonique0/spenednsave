# USDC Deposit Integration - Complete Guide

## Overview
USDC deposit functionality has been successfully integrated into SpendGuard on the Base chain. Users can now deposit both ETH and USDC tokens to their vaults.

## Changes Made

### 1. **ERC20 ABI** (`lib/abis/ERC20.ts`)
- Created comprehensive ERC20 token standard ABI
- Includes all read-only functions (name, symbol, decimals, balanceOf, allowance)
- Includes state-changing functions (transfer, transferFrom, approve)
- Includes events (Transfer, Approval)

### 2. **Contract Configuration** (`lib/contracts.ts`)
- Added USDC token address for Base chains:
  - **Base Sepolia**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - **Base Mainnet**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Created `SUPPORTED_TOKENS` configuration object with:
  - Token symbol and name
  - Decimals (6 for USDC, 18 for ETH)
  - Token contract addresses

### 3. **New Hooks** (`lib/hooks/useContracts.ts`)
Added 5 new hooks for USDC functionality:

#### `useApproveUSDC(usdcAddress, vaultAddress)`
- Approves USDC spending by the vault
- Returns: `approve`, `hash`, `isPending`, `isConfirming`, `isSuccess`, `error`
- Usage: Call before depositing USDC

#### `useDepositUSDC(usdcAddress, vaultAddress)`
- Deposits USDC to vault (requires prior approval)
- Handles 6-decimal conversion automatically
- Returns: `deposit`, `hash`, `isPending`, `isConfirming`, `isSuccess`, `error`

#### `useUSDCBalance(usdcAddress, userAddress)`
- Gets user's USDC balance
- Returns: balance in wei (use formatUnits with 6 decimals)

#### `useVaultUSDCBalance(usdcAddress, vaultAddress)`
- Gets vault's USDC balance
- Returns: balance in wei

#### `useUSDCAllowance(usdcAddress, ownerAddress, spenderAddress)`
- Gets approved USDC amount
- Returns: allowance amount in wei

### 4. **Token Deposit Component** (`components/dashboard/token-deposit-form.tsx`)
Created comprehensive deposit form with:

**Features:**
- Toggle between ETH and USDC deposits
- Real-time balance display for user and vault
- Automatic approval requirement detection
- Two-step process for USDC:
  1. Approve spending
  2. Deposit tokens
- Error handling and status messages
- Success confirmation

**UI Elements:**
- Token selection buttons (ETH/USDC)
- Amount input with Max button
- Vault balance display
- Approval status indicator
- Loading states with spinner icons
- Success/error messages

### 5. **Updated Saver View** (`components/dashboard/saver-view.tsx`)
- Integrated `TokenDepositForm` component
- Updated deposit modal to support both ETH and USDC
- Cleaner architecture with deposit logic moved to form component
- Auto-refresh vault balance and activity on successful deposit

## How to Use

### For Users

1. **Navigate to Dashboard**
   - Click "Deposit" button on vault balance card

2. **Select Token**
   - Choose between ETH or USDC

3. **For ETH Deposits:**
   - Enter amount
   - Click "Deposit ETH"
   - Confirm in wallet

4. **For USDC Deposits:**
   - Enter amount
   - Click "Approve USDC" (first time only)
   - Confirm approval in wallet
   - Click "Deposit USDC"
   - Confirm deposit in wallet

### For Developers

#### Check USDC Balance
```typescript
const { data: balance } = useUSDCBalance(usdcAddress, userAddress);
const formattedBalance = formatUnits(balance, 6);
```

#### Approve and Deposit USDC
```typescript
const { approve } = useApproveUSDC(usdcAddress, vaultAddress);
const { deposit } = useDepositUSDC(usdcAddress, vaultAddress);

// Step 1: Approve
const amountInWei = parseUnits("100", 6); // 100 USDC
approve(amountInWei);

// Step 2: Deposit
deposit("100"); // Takes string, converts internally
```

#### Check Vault Balance
```typescript
const { data: ethBalance } = useVaultETHBalance(vaultAddress);
const { data: usdcBalance } = useVaultUSDCBalance(usdcAddress, vaultAddress);

const formattedEth = formatUnits(ethBalance, 18);
const formattedUsdc = formatUnits(usdcBalance, 6);
```

## Technical Details

### USDC Decimals
- USDC uses 6 decimals (not 18 like ETH)
- Token deposit form handles conversion automatically
- `TokenDepositForm` converts user input to wei: `parseFloat(amount) * 1e6`

### Approval Flow
- ERC20 tokens require approval before transfer
- Smart contract must be approved to spend user's tokens
- `TokenDepositForm` handles this automatically
- Shows approval status and button conditionally

### Contract Function
The vault contract must have a `deposit(address token, uint256 amount)` function:

```solidity
function deposit(address token, uint256 amount) external {
    IERC20(token).transferFrom(msg.sender, address(this), amount);
    // ... emit event, update balance
}
```

## Chain Support

### Base Sepolia (Chain ID: 84532)
- USDC Address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Factory: `0x333dA20da292858B7AfA2Af51c6dbF000B7eb23f`

### Base Mainnet (Chain ID: 8453)
- USDC Address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Factory: Update after deployment

## Testing Checklist

- [ ] ETH deposits work
- [ ] USDC balance displays correctly
- [ ] Approval flow works
- [ ] USDC deposits work after approval
- [ ] Vault balance updates after deposit
- [ ] Activity log shows deposits
- [ ] Error messages display on failure
- [ ] Form disables during transactions
- [ ] Success messages appear on completion

## Future Enhancements

1. **Multi-Token Support**
   - Add more tokens (DEGEN, etc.)
   - Dynamic token registry

2. **Better UX**
   - Gas estimation
   - Historical deposit/withdrawal charts
   - Automated staking options

3. **Advanced Features**
   - Deposit limits by token
   - Recurring deposits
   - Yield farming integration

## Troubleshooting

### "Insufficient balance"
- Check your USDC balance in TokenDepositForm display
- Get USDC from exchange or faucet if testnet

### "Approval failed"
- Ensure USDC address is correct
- Check wallet has enough ETH for gas
- Try approval again

### "Deposit failed"
- Ensure approval was successful first
- Check vault address is valid
- Verify contract has `deposit()` function

### Missing USDC Balance Display
- Ensure USDC address is configured in lib/contracts.ts
- Check wallet is connected to correct chain
- Refresh page if data doesn't load

## File Structure

```
lib/
  abis/
    ERC20.ts              # New: ERC20 token ABI
  hooks/
    useContracts.ts       # Updated: Added 5 new hooks
  contracts.ts            # Updated: Added USDC addresses

components/
  dashboard/
    token-deposit-form.tsx # New: Deposit form component
    saver-view.tsx        # Updated: Integrated deposit form
```

---

**Status**: ✅ Fully Integrated and Ready for Testing
