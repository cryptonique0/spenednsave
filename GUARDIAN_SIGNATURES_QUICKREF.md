# Guardian Signature Service - Quick Reference

## Files Created

### Core Services
1. **lib/types/guardian-signatures.ts** - TypeScript type definitions
2. **lib/services/guardian-signatures.ts** - Main signature service with EIP-712 support
3. **lib/services/signature-storage.ts** - LocalStorage persistence (legacy, deprecated)
4. **lib/services/guardian-signature-db.ts** - SQLite DB persistence (recommended for server-side)
4. **lib/hooks/useGuardianSignatures.ts** - React hook for easy integration

### Documentation & Examples
5. **GUARDIAN_SIGNATURES.md** - Complete documentation
6. **components/examples/guardian-signature-example.tsx** - Full working example

## Quick Integration

```typescript
import { useGuardianSignatures } from '@/lib/hooks/useGuardianSignatures';

function WithdrawComponent() {
    const vaultAddress = '0x...';
    const { 
        createWithdrawalRequest,
        signRequest,
        executeWithdrawal,
        getPendingRequests
    } = useGuardianSignatures(vaultAddress);

    // Create withdrawal
    const request = await createWithdrawalRequest(
        tokenAddress, amount, recipient, reason
    );

    // Guardian signs
    await signRequest(request.id);

    // Execute (anyone can call once quorum met)
    const txHash = await executeWithdrawal(request.id);

    // View pending
    const pending = getPendingRequests();
}
```

## Key Features

✅ **EIP-712 Signatures** - Human-readable wallet prompts  
✅ **Automatic Verification** - Validates guardians and prevents duplicates  
✅ **Quorum Tracking** - Auto-approves when threshold met  
✅ **Persistent Storage** - SQLite DB for pending requests (see guardian-signature-db.ts). LocalStorage is now legacy and only for browser fallback.
✅ **Nonce Management** - Prevents replay attacks  
✅ **Type-Safe** - Full TypeScript support  

## Service Methods

### GuardianSignatureService
- `getAllGuardians(vaultAddress)` - Get all current guardians
- `isGuardian(vaultAddress, address)` - Check guardian status
- `signWithdrawal(vaultAddress, request)` - Sign a request
- `verifySignatures(...)` - Verify all signatures
- `executeWithdrawal(...)` - Execute on-chain

### SignatureStorageService
- `getPendingRequests()` - Get all pending requests
- `getVaultPendingRequests(vaultAddress)` - Get vault-specific requests
- `savePendingRequest(request)` - Save/update request
- `addSignatureToPendingRequest(id, signature)` - Add signature
- `markAsExecuted(id, txHash)` - Mark as executed
- `cleanupOldRequests(maxAge)` - Clean up old data

## Workflow

1. **Saver** creates withdrawal request → Stored locally
2. **Guardians** review and sign → Signatures collected
3. **Auto-approve** when quorum met → Status changes to 'approved'
4. **Anyone** can execute → Transaction sent on-chain
5. **Storage updated** with TX hash → Marked as 'executed'

## Security

- ✅ Guardian verification via SBT balance check
- ✅ Duplicate signature prevention
- ✅ Nonce-based replay protection
- ✅ EIP-712 for readable signatures
- ✅ Quorum enforcement before execution

## Next Steps

1. Integrate into withdrawal UI
2. Add guardian notification system
3. Implement signature request sharing (QR code, link)
4. Add backend sync for multi-device support (optional)
5. Create guardian dashboard view
