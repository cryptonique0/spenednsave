# Guardian Signature Service

A comprehensive service for managing multi-signature withdrawals with guardian-based approvals using EIP-712 signatures.

## Architecture

The service consists of four main components:

1. **Types** (`lib/types/guardian-signatures.ts`) - TypeScript interfaces for all signature-related data
2. **Guardian Signature Service** (`lib/services/guardian-signatures.ts`) - Core service for EIP-712 signing and verification
3. **Storage Service** (`lib/services/signature-storage.ts`) - Local storage management for pending requests (legacy, deprecated)
4. **DB Storage** (`lib/services/guardian-signature-db.ts`) - SQLite DB management for persistent pending requests (recommended)
4. **React Hook** (`lib/hooks/useGuardianSignatures.ts`) - Easy-to-use hook for React components

## Features

✅ **EIP-712 Typed Signatures** - Guardians see readable messages in their wallet  
✅ **Signature Verification** - Validates guardian status and prevents duplicates  
✅ **Quorum Management** - Tracks when enough signatures are collected  
✅ **Persistent Storage** - Stores pending requests in SQLite DB (see guardian-signature-db.ts). LocalStorage is now legacy and only for browser fallback.
✅ **Replay Attack Prevention** - Uses nonces to prevent signature reuse  
✅ **Complete Workflow** - From creation to execution  

## Quick Start

### 1. Basic Usage with Hook

```typescript
import { useGuardianSignatures } from '@/lib/hooks/useGuardianSignatures';

function MyComponent() {
    const vaultAddress = '0x...';
    const {
        createWithdrawalRequest,
        signRequest,
        executeWithdrawal,
        getPendingRequests,
    } = useGuardianSignatures(vaultAddress);

    // Create a withdrawal request
    const createRequest = async () => {
        const request = await createWithdrawalRequest(
            '0x0000000000000000000000000000000000000000', // ETH
            parseEther('1.0'), // Amount
            '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Recipient
            'Medical emergency' // Reason
        );
        console.log('Created:', request.id);
    };

    // Guardian signs the request
    const signAsGuardian = async (requestId: string) => {
        await signRequest(requestId);
    };

    // Execute when quorum met
    const execute = async (requestId: string) => {
        const txHash = await executeWithdrawal(requestId);
        console.log('Executed:', txHash);
    };

    const requests = getPendingRequests();
    // ... render UI
}
```

### 2. Direct Service Usage

```typescript
import { createGuardianSignatureService } from '@/lib/services/guardian-signatures';
import { usePublicClient, useWalletClient } from 'wagmi';

const publicClient = usePublicClient();
const { data: walletClient } = useWalletClient();

const service = createGuardianSignatureService(publicClient, walletClient);

// Get all guardians
const guardians = await service.getAllGuardians(vaultAddress);

// Check if address is a guardian
const isGuardian = await service.isGuardian(vaultAddress, address);

// Sign a withdrawal
const signed = await service.signWithdrawal(vaultAddress, {
    token: '0x0000000000000000000000000000000000000000',
    amount: parseEther('1.0'),
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    nonce: 5n,
    reason: 'Emergency withdrawal',
});

// Verify signatures
const verification = await service.verifySignatures(
    vaultAddress,
    chainId,
    request,
    [signature1, signature2, signature3]
);

console.log('Meets quorum:', verification.meetsQuorum);
console.log('Valid signatures:', verification.valid.length);
```

### 3. Storage Management

```typescript
import { SignatureStorageService } from '@/lib/services/signature-storage';

// Get pending requests for a vault
const requests = SignatureStorageService.getVaultPendingRequests(vaultAddress);

// Add a signature to a request
SignatureStorageService.addSignatureToPendingRequest(requestId, signedWithdrawal);

// Mark as executed
SignatureStorageService.markAsExecuted(requestId, txHash);

// Export for backup
const backup = SignatureStorageService.exportData();

// Import from backup
SignatureStorageService.importData(backup);

// Cleanup old requests
SignatureStorageService.cleanupOldRequests(30 * 24 * 60 * 60 * 1000); // 30 days
```

## Complete Workflow

### Step 1: Saver Creates Withdrawal Request

```typescript
const { createWithdrawalRequest } = useGuardianSignatures(vaultAddress);

const request = await createWithdrawalRequest(
    tokenAddress,
    amount,
    recipientAddress,
    reason
);
// Request is now stored locally and pending guardian signatures
```

### Step 2: Guardians Review and Sign

```typescript
const { signRequest, getSignatureStatus } = useGuardianSignatures(vaultAddress);

// Check who has signed
const status = await getSignatureStatus(requestId);
status.forEach(guardian => {
    console.log(`${guardian.address}: ${guardian.hasSigned ? 'Signed' : 'Pending'}`);
});

// Guardian signs
await signRequest(requestId);
```

### Step 3: Execute When Quorum Met

```typescript
const { verifyRequest, executeWithdrawal } = useGuardianSignatures(vaultAddress);

// Verify signatures
const verification = await verifyRequest(requestId);

if (verification.meetsQuorum) {
    // Execute the withdrawal
    const txHash = await executeWithdrawal(requestId);
    console.log('Withdrawal executed:', txHash);
}
```

## EIP-712 Signature Format

The service uses EIP-712 for typed, readable signatures. Guardians see:

```
SpendGuard
Withdrawal Request

Token: 0x0000000000000000000000000000000000000000
Amount: 1000000000000000000 (1.0 ETH)
Recipient: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
Nonce: 5
Reason: Medical emergency
```

### Domain Separator

```typescript
{
    name: 'SpendGuard',
    version: '1',
    chainId: 84532, // Base Sepolia
    verifyingContract: vaultAddress
}
```

### Withdrawal Type

```typescript
{
    Withdrawal: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'reason', type: 'string' },
    ]
}
```

## Security Features

### 1. Guardian Verification
Every signature is verified to ensure the signer holds a Guardian SBT:
```typescript
const isGuardian = await service.isGuardian(vaultAddress, signerAddress);
```

### 2. Duplicate Prevention
The service prevents the same guardian from signing twice:
```typescript
// Checks existing signers before adding new signature
const isDuplicate = existingSigners.includes(newSigner);
```

### 3. Nonce-Based Replay Protection
Each withdrawal uses a unique nonce that increments:
```typescript
const nonce = await service.getVaultNonce(vaultAddress); // e.g., 5
// After execution, nonce becomes 6
// Old signatures for nonce 5 become invalid
```

### 4. Quorum Enforcement
Withdrawals only execute when quorum is met:
```typescript
if (validSignatures >= quorum) {
    // Execute withdrawal
}
```

## API Reference

### useGuardianSignatures Hook

```typescript
const {
    // State
    isLoading: boolean,
    error: string | null,
    service: GuardianSignatureService | null,

    // Queries
    getPendingRequests: () => PendingWithdrawalRequest[],
    getGuardians: () => Promise<Address[]>,
    isUserGuardian: () => Promise<boolean>,
    getSignatureStatus: (requestId: string) => Promise<GuardianSignatureStatus[]>,
    verifyRequest: (requestId: string) => Promise<VerificationResult>,

    // Actions
    createWithdrawalRequest: (token, amount, recipient, reason) => Promise<PendingWithdrawalRequest>,
    signRequest: (requestId: string) => Promise<void>,
    executeWithdrawal: (requestId: string) => Promise<Hex>,
    rejectRequest: (requestId: string) => void,
    deleteRequest: (requestId: string) => void,
} = useGuardianSignatures(vaultAddress);
```

### GuardianSignatureService Methods

| Method | Description |
|--------|-------------|
| `getVaultNonce(vaultAddress)` | Get current nonce |
| `getVaultQuorum(vaultAddress)` | Get required signatures |
| `getGuardianTokenAddress(vaultAddress)` | Get Guardian SBT address |
| `isGuardian(vaultAddress, address)` | Check if address is guardian |
| `getAllGuardians(vaultAddress)` | Get all current guardians |
| `signWithdrawal(vaultAddress, request)` | Sign a withdrawal request |
| `verifySignature(vaultAddress, chainId, request, signature, existingSigners)` | Verify single signature |
| `verifySignatures(vaultAddress, chainId, request, signatures)` | Verify all signatures |
| `executeWithdrawal(vaultAddress, request, signatures)` | Execute withdrawal on-chain |
| `waitForWithdrawal(hash)` | Wait for transaction confirmation |

## Error Handling

```typescript
try {
    await signRequest(requestId);
} catch (error) {
    if (error.message.includes('not a guardian')) {
        // Handle: user is not a guardian
    } else if (error.message.includes('already signed')) {
        // Handle: guardian already signed
    } else if (error.message.includes('User rejected')) {
        // Handle: user rejected in wallet
    } else {
        // Handle: other errors
    }
}
```

## Testing

```typescript
// Test guardian verification
const guardians = await service.getAllGuardians(vaultAddress);
console.log('Guardians:', guardians);

// Test signing
const request = await createWithdrawalRequest(/* ... */);
await signRequest(request.id);

// Test verification
const verification = await verifyRequest(request.id);
console.log('Valid:', verification.valid.length);
console.log('Invalid:', verification.invalid.length);
console.log('Meets quorum:', verification.meetsQuorum);
```

## Best Practices

1. **Always verify signatures before execution**
   ```typescript
   const verification = await verifyRequest(requestId);
   if (!verification.meetsQuorum) {
       throw new Error('Insufficient signatures');
   }
   ```

2. **Handle wallet rejections gracefully**
   ```typescript
   try {
       await signRequest(requestId);
   } catch (error) {
       if (error.message.includes('User rejected')) {
           // Show user-friendly message
       }
   }
   ```

3. **Cleanup old requests periodically**
   ```typescript
   useEffect(() => {
       SignatureStorageService.cleanupOldRequests();
   }, []);
   ```

4. **Backup important data**
   ```typescript
   const backup = SignatureStorageService.exportData();
   localStorage.setItem('spendguard-backup', backup);
   ```

## Troubleshooting

### "Signer is not a guardian"
- Verify the address holds a Guardian SBT
- Check the correct vault address is being used

### "Duplicate signature"
- Guardian has already signed this request
- Check signature status before attempting to sign

### "Quorum not met"
- Not enough signatures collected yet
- Verify required quorum: `await service.getVaultQuorum(vaultAddress)`

### "Invalid nonce"
- The nonce has changed (another withdrawal executed)
- Create a new request with the current nonce

## License

MIT
