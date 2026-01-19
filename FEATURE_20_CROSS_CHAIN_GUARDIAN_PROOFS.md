# Feature #20: Cross-Chain Guardian Proofs - Complete Documentation

## Overview

Feature #20 implements **cross-chain guardian proof verification** enabling multi-chain vaults where guardians on other blockchains can validate and approve withdrawals. Using message bridges (Axelar, LayerZero, Wormhole) and Merkle tree proofs, guardians maintain their validator role across multiple chains with cryptographic verification of their status.

### Problem Statement

**Limitation**: Current vaults only accept local guardians on the same chain
**Challenge**: Organizations need multi-chain treasuries where guardians operate independently on different blockchains
**Solution**: Cross-chain guardian proofs with message bridges and Merkle tree validation

## Architecture

### Core Components

#### 1. CrossChainGuardianProofService.sol

**Purpose**: Central service for cross-chain guardian proof validation

**Key Features**:
- Guardian state snapshots from remote chains
- Merkle tree proof verification
- Cross-chain message handling
- Guardian proof submission and validation
- Bridge relayer management
- Complete message lifecycle tracking

**Type Definitions**:
```solidity
struct GuardianProof {
    uint256 chainId;                    // Source chain ID
    address guardianToken;              // Guardian SBT on source chain
    address guardian;                   // Guardian address
    uint256 tokenId;                    // Guardian token ID
    uint256 proofTimestamp;             // When proof was generated
    bytes32 merkleRoot;                 // Root of guardian state tree
    bytes32[] merklePath;               // Proof path from leaf to root
}

struct GuardianStateSnapshot {
    uint256 chainId;                    // Chain ID
    uint256 blockNumber;                // Block number when snapshot taken
    bytes32 merkleRoot;                 // Root of guardian state tree
    address[] guardians;                // Guardian addresses in snapshot
    uint256 timestamp;                  // Snapshot timestamp
    bool isVerified;                    // Verified by bridge relayers
}

struct CrossChainMessage {
    uint256 messageId;                  // Unique message identifier
    uint256 sourceChainId;              // Source chain
    uint256 destinationChainId;         // Destination chain
    address sender;                     // Message sender
    bytes payload;                      // Message payload
    uint256 timestamp;                  // Message timestamp
    MessageStatus status;               // Message status
}
```

**Key Functions**:
- `configureBridge(chainId, confirmations, timeout, relayers)` - Setup bridge for chain
- `verifyGuardianProof(proof)` - Verify Merkle tree proof
- `submitGuardianProof(proof)` - Record guardian proof submission
- `receiveMessage(messageId, sourceChain, sender, payload)` - Receive bridge message
- `confirmMessage(messageId)` - Relayer confirms message
- `submitGuardianStateSnapshot(chainId, block, root, guardians)` - Receive state snapshot
- `verifyGuardianStateSnapshot(snapshotId)` - Verify snapshot
- `verifyMerkleProof(proof, root, leaf)` - Verify Merkle proof

**Message States**:
```
PENDING → RECEIVED → VERIFIED → EXECUTED
                  → FAILED
```

#### 2. MultiChainVault.sol

**Purpose**: Vault accepting guardian proofs from other chains

**Key Features**:
- Dual guardian support (local + remote)
- Remote proof verification
- Weighted approval system
- Multi-chain withdrawal execution
- Proof chain linking

**Weighted Approval System**:
```
Total Weight = Local Approvals + (Remote Approvals × Remote Guardian Weight)
Example: 2 local + 3 remote (weight=1) = 5 total weight
         If quorum=4: satisfied (5 >= 4)
```

**Key Functions**:
- `proposeMultiChainWithdrawal(token, amount, recipient, reason, proofChainIds)` - Propose withdrawal
- `approveWithRemoteGuardian(withdrawalId, guardian, chainId, proof)` - Remote guardian approval
- `approveWithLocalGuardian(withdrawalId, signature)` - Local guardian approval
- `executeMultiChainWithdrawal(withdrawalId)` - Execute if quorum met
- `connectChain(chainId)` - Enable cross-chain for specific chain
- `addGuardian(guardian, guardianChainId)` - Register guardian (local or remote)

**Withdrawal Types**:
```
Local Withdrawal: Only local guardians needed
Multi-Chain Withdrawal: Mix of local and remote guardians
Remote-Only: All guardians from other chains
```

#### 3. CrossChainMessageBridge.sol

**Purpose**: Abstract bridge interface for message passing

**Features**:
- Unified bridge abstraction (Axelar, LayerZero, Wormhole compatible)
- Message fee estimation
- Relayer management
- Message status tracking
- Chain registration

**Key Functions**:
- `sendMessage(destinationChain, destinationAddress, payload)` - Send message
- `receiveMessage(sourceChain, sourceAddress, payload)` - Receive message
- `confirmMessage(messageId)` - Relayer confirmation
- `executeMessage(messageId)` - Mark executed
- `estimateFee(destinationChain, payload)` - Calculate fee
- `configureBridge(chainId, relayer, baseFee, feePerByte)` - Setup bridge

**Fee Model**:
```
Total Fee = baseFee + (payloadLength × feePerByte)
Example: baseFee=0.1 ETH, feePerByte=0.001 ETH
         100 byte payload: 0.1 + 0.1 = 0.2 ETH
```

#### 4. MultiChainVaultFactory.sol

**Purpose**: Factory for deploying multi-chain vaults

**Features**:
- Vault deployment with bridge configuration
- Chain registration for bridges
- Guardian proof service setup
- Cross-chain coordination

**Key Functions**:
- `createMultiChainVault(owner, quorum, weight, chains)` - Deploy vault
- `createMultiChainVaultWithGuardians(owner, quorum, weight, chains, guardians, guardianChains)` - Deploy with guardians
- `registerChainForBridge(chainId, relayer, baseFee, feePerByte)` - Register bridge chain
- `registerGuardianProofChain(chainId, confirmations, timeout, relayers)` - Register proof chain

## Cross-Chain Message Flow

### Guardian Proof Submission

```
Step 1: Remote Chain (Chain A)
  ├─ Guardian has SBT on Chain A
  ├─ Generate Merkle proof: leaf = hash(guardian, tokenId)
  └─ Include merkleRoot and proof path

Step 2: Bridge Transmission
  ├─ Message Bridge sends proof to destination
  ├─ Relayers confirm message on destination
  └─ Once quorum reached: Message verified

Step 3: Proof Service Validation (Destination)
  ├─ Receive guardian proof via bridge
  ├─ Verify Merkle path against stored root
  ├─ Confirm guardian is valid
  └─ Store proof for withdrawal

Step 4: Multi-Chain Withdrawal
  ├─ Propose withdrawal requiring proofs from Chain A
  ├─ Remote guardian approves using verified proof
  ├─ Local guardians also approve
  ├─ Calculate weighted quorum: local + (remote × weight)
  └─ Execute if quorum met
```

### State Snapshot Flow

```
Step 1: Chain A (Source)
  ├─ Collect all guardians at current block
  ├─ Build Merkle tree of guardian leaves
  ├─ Calculate merkleRoot
  └─ Snapshot ready

Step 2: Bridge Relay
  ├─ Relayer extracts snapshot (off-chain)
  ├─ Sends via bridge to Chain B
  ├─ Multiple relayers confirm
  └─ Once confirmed: snapshot on Chain B

Step 3: Chain B (Destination)
  ├─ Receive snapshot via bridge
  ├─ Store snapshot with merkleRoot
  ├─ Verify snapshot (multi-relayer consensus)
  └─ Ready for proof verification

Step 4: Proof Verification
  ├─ Guardian submits proof with stored merkleRoot
  ├─ Verify Merkle path: keccak256(guardian, tokenId)
  ├─ Check high bit in proof path
  └─ Proof valid: guardian verified on Chain A
```

## Merkle Tree Proof Mechanism

### Structure

```
Guardians on Chain A: [G1, G2, G3, G4, G5]

Leaf Hashing:
  leaf1 = hash(G1, tokenId1)
  leaf2 = hash(G2, tokenId2)
  leaf3 = hash(G3, tokenId3)
  leaf4 = hash(G4, tokenId4)
  leaf5 = hash(G5, tokenId5)

Tree Building:
        merkleRoot
       /           \
      H12          H345
      / \           /   \
    H1   H2       H34   H5
    |    |        / \    |
   L1   L2      L3  L4  L5

Example: To prove G3, need path: [L4, H12, H5]
```

### Verification Algorithm

```solidity
function verifyMerkleProof(proof, root, leaf) {
    bytes32 current = leaf;
    
    for (uint256 i = 0; i < proof.length; i++) {
        bytes32 sibling = proof[i];
        current = keccak256(abi.encodePacked(current, sibling));
    }
    
    return current == root;
}
```

### Proof Example

```
Guardian: 0x1234...
Token ID: 42
ChainId: 1

Step 1: Create leaf
  leaf = keccak256(0x1234..., 42)
  leaf = 0xabcd...

Step 2: Provide Merkle path
  path = [0x5678..., 0x9abc..., 0xdef0...]
  
Step 3: Reconstruct root
  current = 0xabcd...
  current = keccak256(0xabcd..., 0x5678...) = 0xaaaa...
  current = keccak256(0xaaaa..., 0x9abc...) = 0xbbbb...
  current = keccak256(0xbbbb..., 0xdef0...) = merkleRoot

Step 4: Verify
  merkleRoot == stored_root ? TRUE : FALSE
```

## Weighted Guardian System

### Guardian Weight Configuration

```solidity
// Setup in vault
quorum = 5
remoteGuardianWeight = 2

// Local guardians (Chain A): 1 weight each
// Remote guardians (Chain B, C, D): 2 weight each

Example Approval Scenario:
  Local Guardian 1 approves: weight = 1 (total: 1)
  Local Guardian 2 approves: weight = 1 (total: 2)
  Remote Guardian (Chain B) approves: weight = 2 (total: 4)
  Result: Not quorum (4 < 5)
  
  Remote Guardian (Chain C) approves: weight = 2 (total: 6)
  Result: Quorum reached (6 >= 5) → Execute
```

### Use Cases

**Balanced Multi-Chain**:
```
quorum = 3
remoteWeight = 1

All local (A) or all remote (B+C) can approve: 3 approvals
Mixed approval also works: flexible governance
```

**Remote-Heavy**:
```
quorum = 10
remoteWeight = 3

Need: 4 remote approvals (4 × 3 = 12) or
      3 local + 1 remote + (1 × 3) = 6 (not enough)
Encourages local guardian participation
```

## Security Analysis

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Forged Merkle proofs | Merkle tree validation against stored root |
| Guardian spoofing | Guardian SBT validation on source chain |
| Fake state snapshots | Relayer consensus + verification |
| Replay attacks | Message ID + timestamp tracking |
| Man-in-the-middle | Cryptographic proof verification |
| Double-spending | Withdrawal execution flag |
| Bridge compromise | Relayer quorum requirements |
| Outdated proofs | Proof timestamp validation |

### Security Properties

✅ **Cryptographic Proof Verification**
- Merkle tree proof validates guardian status
- Impossible to forge without knowing tree structure
- Hash-based verification (keccak256)

✅ **Multi-Relayer Consensus**
- No single relayer can compromise system
- Configurable quorum per chain
- Relayer confirmation before message use

✅ **State Verification**
- Multiple snapshots per chain tracked
- Latest verified snapshot used
- Block number recorded for auditability

✅ **Proof Linkage**
- Withdrawals specify which chains provide proofs
- Prevents misuse of proofs across vaults
- Clear chain-to-proof mapping

### Guardian Sybil Protection

**Method 1: SBT Limitation**
```
One guardian = one SBT token
Prevents one address holding multiple
```

**Method 2: Proof-of-Guardianship**
```
Only SBT holders can generate proofs
SBT transfers blocked (soulbound)
```

**Method 3: Chain Verification**
```
Proof must match on source chain
Remote chain validates proof independently
```

## Gas Optimization

### Merkle Proof Efficiency

| Guardians | Proof Depth | Gas Cost |
|-----------|------------|----------|
| 4 | 2 | ~6,000 |
| 8 | 3 | ~9,000 |
| 16 | 4 | ~12,000 |
| 256 | 8 | ~24,000 |
| 65536 | 16 | ~48,000 |

### Cross-Chain Costs

| Operation | Cost |
|-----------|------|
| Bridge message send | Base + (Payload × feePerByte) |
| Relayer confirmation | ~5,000 gas per relayer |
| Proof verification | ~24,000 gas |
| Withdrawal execution | ~50,000 gas |

### Cost Optimization Strategies

1. **Batch Snapshots** - Send multiple guardian updates in one message
2. **Efficient Merkle Trees** - Compact representation
3. **Local Caching** - Store snapshots to avoid repeated fetches
4. **Proof Aggregation** - Group multiple proofs per message

## Integration with Previous Features

| Feature | Integration | Notes |
|---------|-----------|-------|
| #1-5: Basic Vault | ✅ Multi-chain extends | Backward compatible |
| #10: Vault Pausing | ✅ Pause blocks all chains | Global pause |
| #11-12: Proposals | ✅ Multi-chain proposals | Remote voting |
| #13: Reason Hashing | ✅ Hashed with proofs | Privacy maintained |
| #16: Delayed Guardians | ✅ Delay per chain | Remote delay respected |
| #18: Safe Mode | ✅ Multi-chain safe mode | Owner-only all chains |
| #19: Signature Aggregation | ✅ Packed across chains | Bridge optimized |

## Deployment Steps

### Phase 1: Local Setup

1. Deploy CrossChainGuardianProofService
2. Deploy CrossChainMessageBridge
3. Deploy MultiChainVaultFactory

### Phase 2: Bridge Configuration

1. Register each chain with bridge
   ```solidity
   factory.registerChainForBridge(
       chainId=1,
       relayer=relayerAddress,
       baseFee=0.1 ether,
       feePerByte=0.001 ether
   );
   ```

2. Configure guardian proof chains
   ```solidity
   factory.registerGuardianProofChain(
       chainId=1,
       confirmations=2,
       timeout=86400,
       relayers=[relayer1, relayer2]
   );
   ```

### Phase 3: Vault Creation

1. Create multi-chain vault
   ```solidity
   address vault = factory.createMultiChainVault(
       owner=ownerAddress,
       quorum=3,
       remoteWeight=1,
       chains=[1, 137, 56]
   );
   ```

2. Add guardians from multiple chains
   ```solidity
   vault.addGuardian(guardianOnChainA, 1);
   vault.addGuardian(guardianOnChainB, 137);
   ```

### Phase 4: Bridge Relay Setup

1. Set up off-chain relayers
2. Relayers monitor for cross-chain messages
3. Relayers verify and relay state snapshots
4. Relayers confirm received messages

## Testing Scenarios

### Unit Tests

- Guardian proof verification
- Merkle tree validation
- Message sending/receiving
- Relayer confirmation
- State snapshot handling

### Integration Tests

- Multi-chain withdrawal flow
- Remote guardian approval
- Weighted quorum calculation
- Cross-chain synchronization
- Bridge message routing

### Security Tests

- Forged proof rejection
- Invalid snapshot handling
- Replay attack prevention
- Bridge failure recovery
- Guardian Sybil attacks

## Use Cases

### 1. Global Enterprise Treasury

```
Headquarters (Chain A): 2 local guardians (weight 1 each)
Asia Office (Chain B): 3 remote guardians (weight 1.5 each)
Europe Office (Chain C): 3 remote guardians (weight 1.5 each)
Quorum: 5

Approval examples:
- HQ 2 + Asia 2 (2 + 3 = 5) ✓
- HQ 1 + Europe 3 (1 + 4.5 = 5.5) ✓
- Any 4 Asia guardians (4 × 1.5 = 6) ✓
```

### 2. Multi-Chain DAO Treasury

```
Ethereum (mainnet): Treasury safe with 5 guardians
Polygon: 3 guardians
Arbitrum: 3 guardians

Withdraw needs consensus from multiple chains
Prevents single-chain compromise
```

### 3. Cross-Border Payment System

```
Sender (Chain A): Local approval
Intermediary (Chain B): Remote guardian approval
Recipient (Chain C): Receives withdrawal

All chains aware of transaction
Complete transparency
```

## Troubleshooting

### Common Issues

**Proof Verification Fails**
- Check Merkle root matches snapshot
- Verify proof path integrity
- Confirm guardian address encoding

**Bridge Message Stuck**
- Check relayer configuration
- Verify sufficient fees
- Confirm destination chain active

**Quorum Not Reached**
- Verify weighted calculation
- Check guardian chain assignment
- Confirm proof submission

## References

- OpenZeppelin: Merkle Tree Implementation
- EIP-712: Typed Structured Data Hashing
- Message Bridge Standards: Axelar, LayerZero, Wormhole
- Cross-Chain Communication Patterns
- Guardian-Based Multi-Sig Design

## Summary

Feature #20: Cross-Chain Guardian Proofs enables secure multi-chain vault governance through Merkle tree proof verification and message bridges. Guardians across different blockchains can collaboratively approve and execute withdrawals with cryptographic certainty of their guardian status, weighted voting for chain importance, and complete audit trails.

**Key Capabilities**:
- Multi-chain guardian validation
- Merkle tree proof verification
- Message bridge abstraction
- Weighted approval system
- Hybrid local/remote guardians
- Cross-chain state synchronization
