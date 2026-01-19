# Feature #19: Signature Aggregation - Complete API Reference

## Table of Contents
1. [SignatureAggregationService](#signatureaggregationservice)
2. [SpendVaultWithSignatureAggregation](#spendvaultwithsignatureaggregation)
3. [VaultFactoryWithSignatureAggregation](#vaultfactorywithsignatureaggregation)
4. [Type Definitions](#type-definitions)
5. [Events](#events)
6. [Error Codes](#error-codes)

---

## SignatureAggregationService

### Overview
Central service managing signature packing, unpacking, and batch verification operations.

### Type Definitions

#### CompactSignature
```solidity
struct CompactSignature {
    bytes32 r;      // 32 bytes - first part of signature
    bytes32 s;      // 32 bytes - second part with v encoded in high bit
}
```

#### SignatureData
```solidity
struct SignatureData {
    address signer;     // Recovered signer address
    uint8 v;            // Recovery ID (27 or 28)
    bytes32 r;          // First component
    bytes32 s;          // Second component
    uint256 index;      // Signature index in batch
}
```

#### BatchVerificationResult
```solidity
struct BatchVerificationResult {
    bool allValid;                  // All signatures valid
    uint256 validCount;            // Number of valid signatures
    uint256 invalidCount;          // Number of invalid signatures
    address[] validSigners;        // List of valid signer addresses
    uint256[] invalidIndices;      // Indices of invalid signatures
}
```

### Functions

#### packSignatures
Compresses standard ECDSA signatures to compact 64-byte format.

**Signature**:
```solidity
function packSignatures(bytes[] calldata signatures) 
    external 
    pure 
    returns (bytes memory)
```

**Parameters**:
- `signatures`: Array of 65-byte signatures (r, s, v)

**Returns**:
- Packed bytes with format [count, r1||s1, r2||s2, ...]
- Count byte at position 0
- Each signature 64 bytes

**Gas Cost**: ~200 + 50 per signature

**Example**:
```javascript
const standardSigs = [
  "0x" + "aa".repeat(130),  // 65 bytes
  "0x" + "bb".repeat(130)   // 65 bytes
];

const packed = await service.packSignatures(standardSigs);
// packed length: 1 + 64 + 64 = 129 bytes
```

**Revert Conditions**:
- Signature length != 65 bytes

---

#### unpackSignatures
Restores compact signatures to standard 65-byte format.

**Signature**:
```solidity
function unpackSignatures(bytes calldata aggregated) 
    external 
    pure 
    returns (bytes[] memory)
```

**Parameters**:
- `aggregated`: Packed signatures from packSignatures()

**Returns**:
- Array of standard 65-byte signatures

**Gas Cost**: ~200 + 100 per signature

**Example**:
```javascript
const standard = await service.unpackSignatures(packed);
// Each element is 65 bytes
// standard.length === 2
```

**Revert Conditions**:
- Aggregated length < 2 (no count + at least 1 sig)
- Signature data too short

---

#### calculateGasSavings
Calculates gas and calldata savings for given signature count.

**Signature**:
```solidity
function calculateGasSavings(uint256 signatureCount) 
    external 
    pure 
    returns (uint256 savedBytes, uint256 percentSaved)
```

**Parameters**:
- `signatureCount`: Number of signatures

**Returns**:
- `savedBytes`: Number of bytes saved by packing
- `percentSaved`: Savings as percentage (0-100)

**Formula**:
```
savedBytes = signatureCount * 1  // 1 byte per signature
percentSaved = (savedBytes / (signatureCount * 65)) * 100
```

**Examples**:
```
1 sig:  0 bytes saved (0%)
10 sigs: 9 bytes saved (1.4%)
20 sigs: 19 bytes saved (1.5%)
```

**Gas Cost**: ~100

---

#### batchRecoverSigners
Recovers signer addresses from compact signatures.

**Signature**:
```solidity
function batchRecoverSigners(
    bytes32 messageHash,
    bytes calldata aggregated
) 
    external 
    pure 
    returns (address[] memory)
```

**Parameters**:
- `messageHash`: EIP-712 compliant message hash
- `aggregated`: Packed signatures

**Returns**:
- Array of recovered signer addresses
- Address 0x0 for failed recoveries

**Gas Cost**: ~1,900 per signature

**Example**:
```javascript
const hash = keccak256(encode(token, amount, recipient));
const signers = await service.batchRecoverSigners(hash, packed);
// signers length matches packed signature count
// signers contains recovered addresses or 0x0 for invalid
```

**Revert Conditions**:
- Aggregated length < 2
- Invalid signature format

---

#### verifyAndFilterSignatures
Verifies signatures and detects duplicates.

**Signature**:
```solidity
function verifyAndFilterSignatures(
    bytes32 messageHash,
    bytes calldata aggregated,
    address[] calldata guardians
) 
    external 
    pure 
    returns (address[] memory validSigners, uint256[] memory duplicateIndices)
```

**Parameters**:
- `messageHash`: Message that was signed
- `aggregated`: Packed signatures to verify
- `guardians`: List of valid guardian addresses

**Returns**:
- `validSigners`: Addresses of valid signers
- `duplicateIndices`: Indices of duplicate signatures

**Gas Cost**: ~2,000 + 500 per guardian check

**Example**:
```javascript
const guardians = await vault.getGuardians();
const [valid, dups] = await service.verifyAndFilterSignatures(
  hash,
  packed,
  guardians
);

console.log(`Valid signers: ${valid.length}`);
console.log(`Duplicates at indices: ${dups}`);
```

**Revert Conditions**:
- Aggregated length < 2
- Guardian array empty

**Duplicate Detection Logic**:
- Track seen signers
- Return indices of signers already seen
- Only first occurrence considered valid

---

#### getFormatSizes
Returns size comparison between formats.

**Signature**:
```solidity
function getFormatSizes(uint256 signatureCount) 
    external 
    pure 
    returns (uint256 standardBytes, uint256 compactBytes)
```

**Parameters**:
- `signatureCount`: Number of signatures

**Returns**:
- `standardBytes`: Size in standard format (65 * count)
- `compactBytes`: Size in compact format (64 * count + 1)

**Example**:
```javascript
const [std, compact] = await service.getFormatSizes(10);
// std = 650
// compact = 641
```

**Gas Cost**: ~50

---

#### hashWithdrawal
Creates EIP-712 compliant withdrawal hash.

**Signature**:
```solidity
function hashWithdrawal(
    address token,
    uint256 amount,
    address recipient,
    uint256 nonce,
    string calldata reason
) 
    external 
    pure 
    returns (bytes32)
```

**Parameters**:
- `token`: Token address (0x0 for ETH)
- `amount`: Amount to withdraw
- `recipient`: Withdrawal recipient
- `nonce`: Withdrawal nonce for replay protection
- `reason`: Withdrawal reason

**Returns**:
- Standardized hash for signing

**Gas Cost**: ~300

**Example**:
```javascript
const hash = await service.hashWithdrawal(
  tokenAddress,
  ethers.parseEther("1.0"),
  recipientAddress,
  0,
  "payment"
);
```

---

#### verifySignaturesValidity
Validates signature format and recovery.

**Signature**:
```solidity
function verifySignaturesValidity(
    bytes32 messageHash,
    bytes calldata aggregated
) 
    external 
    pure 
    returns (bool isValid, uint256 validCount, uint256 invalidCount)
```

**Parameters**:
- `messageHash`: Message that was signed
- `aggregated`: Packed signatures

**Returns**:
- `isValid`: All signatures valid
- `validCount`: Number of valid signatures
- `invalidCount`: Number of invalid signatures

**Gas Cost**: ~2,000 per signature

**Example**:
```javascript
const [isValid, valid, invalid] = await service.verifySignaturesValidity(
  hash,
  packed
);

if (isValid) {
  console.log("All signatures valid!");
}
```

---

#### _recoverSignerAtIndex
Internal function to recover single signer.

**Signature**:
```solidity
function _recoverSignerAtIndex(
    bytes32 messageHash,
    bytes calldata aggregated,
    uint256 index
) 
    internal 
    pure 
    returns (address)
```

**Parameters**:
- `messageHash`: Signed message hash
- `aggregated`: Packed signatures
- `index`: Signature index (0-based)

**Returns**:
- Recovered signer address (0x0 if invalid)

**Note**: Internal function, not called directly

---

### Events

#### SignaturePacked
```solidity
event SignaturePacked(
    bytes32 indexed messageHash,
    uint256 signatureCount,
    uint256 packedSize
);
```

Emitted when signatures are packed.

---

#### SignatureUnpacked
```solidity
event SignatureUnpacked(
    bytes32 indexed messageHash,
    uint256 signatureCount
);
```

Emitted when signatures are unpacked.

---

#### BatchVerified
```solidity
event BatchVerified(
    bytes32 indexed messageHash,
    uint256 validCount,
    uint256 totalCount
);
```

Emitted when batch verification completes.

---

---

## SpendVaultWithSignatureAggregation

### Overview
Multi-signature vault accepting both packed and standard signatures for withdrawals.

### State Variables

#### Public Variables

```solidity
IERC721 public guardianToken;                    // Guardian SBT token
SignatureAggregationService public aggregationService;  // Service reference
address public owner;                            // Vault owner
uint256 public quorum;                           // Required signatures
address[] public guardians;                      // Guardian list
mapping(address => bool) public isGuardian;      // Guardian lookup
uint256 public ethBalance;                       // ETH balance
mapping(address => uint256) public tokenBalances; // Token balances
mapping(address => uint256) public nonce;        // Withdrawal nonces
uint256 public totalAggregatedSignatures;        // Stats: total sigs
uint256 public totalGasSaved;                    // Stats: gas saved
```

---

### Constructor

```solidity
constructor(
    address _guardianToken,
    address _aggregationService,
    uint256 _quorum
)
```

**Parameters**:
- `_guardianToken`: Guardian SBT contract
- `_aggregationService`: SignatureAggregationService address
- `_quorum`: Required guardian signatures

**Revert Conditions**:
- `_guardianToken` is zero address
- `_aggregationService` is zero address
- `_quorum` is zero

---

### Functions

#### receive
Accepts native ETH deposits.

**Signature**:
```solidity
receive() external payable
```

**Example**:
```javascript
// Send ETH to vault
await signer.sendTransaction({
  to: vaultAddress,
  value: ethers.parseEther("1.0")
});
```

---

#### deposit
Deposits ERC-20 tokens.

**Signature**:
```solidity
function deposit(address token, uint256 amount) 
    external 
    nonReentrant
```

**Parameters**:
- `token`: Token contract address
- `amount`: Amount to deposit

**Revert Conditions**:
- `token` is zero address
- `amount` is zero
- Transfer fails

**Events**: Deposit

---

#### withdrawWithAggregation
Withdraws using packed signatures (optimized).

**Signature**:
```solidity
function withdrawWithAggregation(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    bytes calldata aggregatedSignatures
) 
    external 
    nonReentrant
```

**Parameters**:
- `token`: Token to withdraw (0x0 for ETH)
- `amount`: Withdrawal amount
- `recipient`: Recipient address
- `reason`: Withdrawal reason
- `aggregatedSignatures`: Packed signatures

**Process**:
1. Extract signature count from first byte
2. Check against quorum
3. Hash withdrawal data
4. Batch recover signers
5. Verify and filter for duplicates
6. Execute transfer
7. Increment nonce
8. Emit events

**Revert Conditions**:
- `recipient` is zero address
- `amount` is zero
- No signatures provided
- Insufficient signatures (< quorum)
- Insufficient balance
- Transfer fails
- Duplicate signatures detected

**Events**: WithdrawalWithAggregation, Withdrawal

**Gas Savings**: ~1.4% for typical batch

---

#### withdraw
Withdraws using standard signatures (backward compatible).

**Signature**:
```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    bytes[] calldata signatures
) 
    external 
    nonReentrant
```

**Parameters**:
- `token`: Token to withdraw (0x0 for ETH)
- `amount`: Withdrawal amount
- `recipient`: Recipient address
- `reason`: Withdrawal reason
- `signatures`: Array of 65-byte signatures

**Process**:
1. Check parameters
2. Hash withdrawal data
3. Recover and validate each signature
4. Check for duplicates manually
5. Execute transfer
6. Increment nonce
7. Emit events

**Revert Conditions**:
- Same as withdrawWithAggregation but for standard format
- Any signature is 65 bytes

**Events**: Withdrawal

---

#### addGuardian
Adds guardian to vault.

**Signature**:
```solidity
function addGuardian(address guardian) 
    external 
    onlyOwner
```

**Parameters**:
- `guardian`: Guardian address to add

**Revert Conditions**:
- Caller is not owner
- Guardian is zero address
- Guardian already exists

**Events**: GuardianAdded

---

#### removeGuardian
Removes guardian from vault.

**Signature**:
```solidity
function removeGuardian(address guardian) 
    external 
    onlyOwner
```

**Parameters**:
- `guardian`: Guardian address to remove

**Process**:
1. Check guardian exists
2. Remove from mapping
3. Remove from array (swap with last)

**Revert Conditions**:
- Caller is not owner
- Guardian not found

**Events**: GuardianRemoved

---

#### setQuorum
Updates required signature count.

**Signature**:
```solidity
function setQuorum(uint256 newQuorum) 
    external 
    onlyOwner
```

**Parameters**:
- `newQuorum`: New required signatures

**Constraints**:
- Must be > 0
- Must be <= guardian count

**Revert Conditions**:
- Caller is not owner
- New quorum invalid

**Events**: QuorumUpdated

---

#### changeOwner
Changes vault owner.

**Signature**:
```solidity
function changeOwner(address newOwner) 
    external 
    onlyOwner
```

**Parameters**:
- `newOwner`: New owner address

**Revert Conditions**:
- Caller is not owner
- New owner is zero address

**Events**: OwnerChanged

---

### View Functions

#### getETHBalance
Returns current ETH balance.

**Signature**:
```solidity
function getETHBalance() 
    external 
    view 
    returns (uint256)
```

---

#### getTokenBalance
Returns token balance.

**Signature**:
```solidity
function getTokenBalance(address token) 
    external 
    view 
    returns (uint256)
```

---

#### getGuardians
Returns all guardians.

**Signature**:
```solidity
function getGuardians() 
    external 
    view 
    returns (address[] memory)
```

---

#### getGuardianCount
Returns guardian count.

**Signature**:
```solidity
function getGuardianCount() 
    external 
    view 
    returns (uint256)
```

---

#### getAggregationStats
Returns aggregation statistics.

**Signature**:
```solidity
function getAggregationStats() 
    external 
    view 
    returns (uint256 totalSignatures, uint256 totalGas)
```

**Returns**:
- Total signatures processed
- Total gas saved

---

#### getAverageGasSaved
Returns average gas saved per signature.

**Signature**:
```solidity
function getAverageGasSaved() 
    external 
    view 
    returns (uint256)
```

---

#### getDomainSeparator
Returns EIP-712 domain separator.

**Signature**:
```solidity
function getDomainSeparator() 
    external 
    view 
    returns (bytes32)
```

---

#### getAggregationService
Returns service address.

**Signature**:
```solidity
function getAggregationService() 
    external 
    view 
    returns (address)
```

---

### Events

#### Deposit
```solidity
event Deposit(
    address indexed depositor,
    address indexed token,
    uint256 amount,
    uint256 timestamp
);
```

---

#### Withdrawal
```solidity
event Withdrawal(
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256 timestamp
);
```

---

#### WithdrawalWithAggregation
```solidity
event WithdrawalWithAggregation(
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256 signatureCount,
    uint256 gasSaved,
    uint256 timestamp
);
```

---

#### GuardianAdded
```solidity
event GuardianAdded(
    address indexed guardian,
    uint256 timestamp
);
```

---

#### GuardianRemoved
```solidity
event GuardianRemoved(
    address indexed guardian,
    uint256 timestamp
);
```

---

#### QuorumUpdated
```solidity
event QuorumUpdated(
    uint256 newQuorum,
    uint256 timestamp
);
```

---

#### OwnerChanged
```solidity
event OwnerChanged(
    address indexed newOwner,
    uint256 timestamp
);
```

---

---

## VaultFactoryWithSignatureAggregation

### Overview
Factory for deploying and managing aggregation-enabled vaults.

### State Variables

```solidity
address public vaultImplementation;                  // Vault template
address public aggregationServiceImplementation;     // Service template
address public factoryOwner;                        // Factory owner
address[] public deployedVaults;                    // All vaults
address[] public deployedServices;                  // All services
mapping(address => address[]) public vaultsByOwner;  // Vaults per owner
mapping(address => address) public serviceByVault;   // Service per vault
uint256 public totalVaults;                         // Vault count
uint256 public totalServices;                       // Service count
```

---

### Constructor

```solidity
constructor()
```

Initializes factory and deploys implementation contracts.

---

### Functions

#### createVault
Creates vault with initial guardians.

**Signature**:
```solidity
function createVault(
    address guardianToken,
    uint256 quorum,
    address[] calldata guardians
) 
    external 
    returns (address vaultAddress, address serviceAddress)
```

**Parameters**:
- `guardianToken`: Guardian SBT contract
- `quorum`: Required signatures
- `guardians`: Initial guardian addresses

**Process**:
1. Validate inputs
2. Deploy service
3. Deploy vault with service reference
4. Add initial guardians
5. Register deployments
6. Track ownership

**Returns**:
- Deployed vault address
- Deployed service address

**Revert Conditions**:
- Guardian token is zero
- Quorum invalid
- Guardian count mismatch

**Events**: ServiceCreated, VaultCreated

---

#### createEmptyVault
Creates vault without initial guardians.

**Signature**:
```solidity
function createEmptyVault(
    address guardianToken,
    uint256 quorum
) 
    external 
    returns (address vaultAddress, address serviceAddress)
```

**Parameters**:
- `guardianToken`: Guardian SBT contract
- `quorum`: Required signatures

**Returns**:
- Deployed vault address
- Deployed service address

**Note**: Guardians can be added later via vault.addGuardian()

---

#### updateImplementations
Updates contract implementations.

**Signature**:
```solidity
function updateImplementations(
    address newVaultImpl,
    address newServiceImpl
) 
    external
```

**Parameters**:
- `newVaultImpl`: New vault implementation
- `newServiceImpl`: New service implementation

**Revert Conditions**:
- Caller is not factory owner
- Invalid implementation addresses

**Events**: ImplementationUpdated

---

### View Functions

#### getVaultCountForOwner
Returns vault count for owner.

**Signature**:
```solidity
function getVaultCountForOwner(address owner) 
    external 
    view 
    returns (uint256)
```

---

#### getVaultsForOwner
Returns vaults for owner.

**Signature**:
```solidity
function getVaultsForOwner(address owner) 
    external 
    view 
    returns (address[] memory)
```

---

#### getAllVaults
Returns all deployed vaults.

**Signature**:
```solidity
function getAllVaults() 
    external 
    view 
    returns (address[] memory)
```

---

#### getAllServices
Returns all deployed services.

**Signature**:
```solidity
function getAllServices() 
    external 
    view 
    returns (address[] memory)
```

---

#### getServiceForVault
Returns service for vault.

**Signature**:
```solidity
function getServiceForVault(address vault) 
    external 
    view 
    returns (address)
```

---

#### getDeploymentStats
Returns deployment statistics.

**Signature**:
```solidity
function getDeploymentStats() 
    external 
    view 
    returns (
        uint256 totalVaultCount,
        uint256 totalServiceCount,
        address vaultImpl,
        address serviceImpl
    )
```

---

#### isFactoryVault
Checks if vault deployed by factory.

**Signature**:
```solidity
function isFactoryVault(address vault) 
    external 
    view 
    returns (bool)
```

---

#### isFactoryService
Checks if service deployed by factory.

**Signature**:
```solidity
function isFactoryService(address service) 
    external 
    view 
    returns (bool)
```

---

### Events

#### VaultCreated
```solidity
event VaultCreated(
    address indexed vaultAddress,
    address indexed serviceAddress,
    address indexed owner,
    address guardianToken,
    uint256 quorum,
    uint256 timestamp
);
```

---

#### ServiceCreated
```solidity
event ServiceCreated(
    address indexed serviceAddress,
    address indexed owner,
    uint256 timestamp
);
```

---

#### ImplementationUpdated
```solidity
event ImplementationUpdated(
    address indexed newVaultImpl,
    address indexed newServiceImpl,
    uint256 timestamp
);
```

---

---

## Type Definitions

### CompactSignature
```solidity
struct CompactSignature {
    bytes32 r;  // 32 bytes
    bytes32 s;  // 32 bytes (v encoded in high bit)
}
```

### SignatureData
```solidity
struct SignatureData {
    address signer;     // Recovered address
    uint8 v;            // Recovery ID
    bytes32 r;          // First component
    bytes32 s;          // Second component
    uint256 index;      // Batch index
}
```

### BatchVerificationResult
```solidity
struct BatchVerificationResult {
    bool allValid;              // All valid?
    uint256 validCount;        // Valid count
    uint256 invalidCount;      // Invalid count
    address[] validSigners;    // Valid signers
    uint256[] invalidIndices;  // Invalid indices
}
```

---

## Events

### SignatureAggregationService Events

- `SignaturePacked(bytes32 messageHash, uint256 count, uint256 size)`
- `SignatureUnpacked(bytes32 messageHash, uint256 count)`
- `BatchVerified(bytes32 messageHash, uint256 validCount, uint256 totalCount)`

### Vault Events

- `Deposit(address depositor, address token, uint256 amount, uint256 timestamp)`
- `Withdrawal(address token, uint256 amount, address recipient, uint256 timestamp)`
- `WithdrawalWithAggregation(address token, uint256 amount, address recipient, uint256 count, uint256 gasSaved, uint256 timestamp)`
- `GuardianAdded(address guardian, uint256 timestamp)`
- `GuardianRemoved(address guardian, uint256 timestamp)`
- `QuorumUpdated(uint256 newQuorum, uint256 timestamp)`
- `OwnerChanged(address newOwner, uint256 timestamp)`

### Factory Events

- `VaultCreated(address vault, address service, address owner, address token, uint256 quorum, uint256 timestamp)`
- `ServiceCreated(address service, address owner, uint256 timestamp)`
- `ImplementationUpdated(address vaultImpl, address serviceImpl, uint256 timestamp)`

---

## Error Codes

| Error | Context | Resolution |
|-------|---------|-----------|
| "Invalid guardian token" | Constructor | Use valid ERC-721 address |
| "Invalid aggregation service" | Constructor | Use valid service address |
| "Invalid quorum" | Constructor/setQuorum | Ensure 0 < quorum <= guardian count |
| "Only owner" | Guardian/quorum changes | Call from owner address |
| "Invalid recipient" | Withdrawal | Use non-zero recipient |
| "Invalid amount" | Deposit/Withdrawal | Use amount > 0 |
| "No signatures" | Withdrawal | Provide at least 1 signature |
| "Insufficient signatures" | Withdrawal | Need signatures >= quorum |
| "Insufficient balance" | Withdrawal | Check vault balance |
| "Transfer failed" | Withdrawal | Check token approval/balance |
| "Duplicate signatures" | Withdrawal | Remove duplicate signers |
| "Duplicate signer" | Verification | Each signer once per batch |
| "Invalid signer" | Verification | Signer must be guardian |
| "Invalid signature length" | Packing | Signatures must be 65 bytes |

---

## Summary

Feature #19 provides a comprehensive signature aggregation system with three main contracts:

1. **SignatureAggregationService**: Format conversion, recovery, verification
2. **SpendVaultWithSignatureAggregation**: Multi-sig vault with both formats
3. **VaultFactoryWithSignatureAggregation**: Deployment and management

All functions are designed for efficiency, security, and backward compatibility.
