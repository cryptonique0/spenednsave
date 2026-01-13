# Vault Data Fetching Fix - Summary

## Problem
The app wasn't fetching previous history and guardians from the blockchain.

## Solution
Created comprehensive hooks to fetch and manage vault data:

### New Hooks Created

**lib/hooks/useVaultData.ts**
- `useGuardians(guardianTokenAddress)` - Fetches all current guardians with their token IDs and metadata
- `useWithdrawalHistory(vaultAddress, limit)` - Fetches all withdrawal events
- `useDepositHistory(vaultAddress, limit)` - Fetches all deposit events  
- `useVaultActivity(vaultAddress, guardianTokenAddress, limit)` - Combines all activity types

### Components Updated

1. **components/dashboard/saver-view.tsx**
   - Now uses `useGuardians()` to show accurate guardian count
   - Uses `useVaultActivity()` to display recent activity
   - Shows loading states while fetching
   - Displays actual guardian addresses in sidebar

2. **components/activity/activity-view.tsx**
   - Completely refactored to use `useVaultActivity()`
   - Removed manual event fetching logic
   - Now shows deposits, withdrawals, and guardian changes
   - Proper filtering by activity type

3. **components/guardians/manage-view.tsx**
   - Uses `useGuardians()` to fetch and display all guardians
   - Shows guardian token IDs, addresses, and add dates
   - Loading states while data is being fetched
   - Accurate guardian count

## How It Works

### Guardian Fetching
1. Queries all `Transfer` events from GuardianSBT contract
2. Filters for mints (from = 0x0) and burns (to = 0x0)
3. Verifies current balance to ensure guardian still has token
4. Returns list with addresses, token IDs, timestamps

### Activity Fetching
1. Fetches `Deposited` events from SpendVault
2. Fetches `Withdrawn` events from SpendVault
3. Fetches `Transfer` events for guardian changes
4. Combines all into chronological list
5. Provides proper timestamps from block data

## Benefits
- ✅ Real historical data from blockchain
- ✅ Automatic updates when new blocks arrive
- ✅ Proper loading states
- ✅ Accurate guardian counts and lists
- ✅ Full activity history (deposits, withdrawals, guardian changes)
- ✅ Type-safe with TypeScript
- ✅ Reusable hooks across components
- ✅ Block-based timestamps for accuracy

## Usage Example

```typescript
import { useGuardians, useVaultActivity } from '@/lib/hooks/useVaultData';

function MyComponent() {
    const { guardians, isLoading } = useGuardians(guardianTokenAddress);
    const { activities } = useVaultActivity(vaultAddress, guardianTokenAddress, 50);
    
    // guardians: Array<{ address, tokenId, addedAt, blockNumber, txHash }>
    // activities: Array<{ type, timestamp, blockNumber, data }>
}
```

## Testing
All components now properly:
- Show "Loading..." states while fetching
- Display actual on-chain data
- Update when new events occur
- Handle empty states gracefully
