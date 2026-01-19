# Feature #20: Cross-Chain Guardian Proofs - Quick Reference

## 30-Second Overview

Enables vault governance where guardians across multiple blockchains can approve withdrawals using Merkle tree proofs and message bridges. Remote guardians hold weighted voting power configured per vault.

**Core Concept**: Guardian proves SBT ownership on Chain A → Bridge relays proof → Chain B vault accepts cross-chain approval

## Core Contracts (4 files)

| Contract | Size | Purpose |
|----------|------|---------|
| **CrossChainGuardianProofService.sol** | 360 lines | Proof verification + Merkle trees |
| **MultiChainVault.sol** | 410 lines | Vault with cross-chain approvals |
| **CrossChainMessageBridge.sol** | 320 lines | Bridge abstraction layer |
| **MultiChainVaultFactory.sol** | 300 lines | Deployment + configuration |

## Weighted Voting Formula

```
Total Weight = Local Approvals + (Remote Approvals × Remote Weight)

Example:
quorum = 5, remoteWeight = 1
Local Guardian approves: +1
Remote Guardian approves: +1
Result: 2 total (need 3 more)
```

## Guardian Proof Mechanism (Merkle Trees)

**Step 1**: Guardian on Chain A has SBT
**Step 2**: Create Merkle proof: `leaf = hash(guardian_address, token_id)`
**Step 3**: Include proof path array in cross-chain message
**Step 4**: Vault verifies: reconstruct root from leaf + proof path
**Step 5**: If root matches stored snapshot → Guardian verified ✅

## Quick Integration

### 1. Deploy Contracts

```solidity
// Deploy all 4 contracts
CrossChainGuardianProofService proofService = new CrossChainGuardianProofService();
CrossChainMessageBridge bridge = new CrossChainMessageBridge();
MultiChainVaultFactory factory = new MultiChainVaultFactory(
    address(proofService),
    address(bridge)
);
```

### 2. Register Chains

```solidity
// Setup chain for cross-chain messaging
factory.registerChainForBridge(
    chainId=1,  // Ethereum
    relayer=relayerAddress,
    baseFee=0.1 ether,
    feePerByte=0.001 ether
);

// Setup chain for guardian proofs
factory.registerGuardianProofChain(
    chainId=1,
    confirmations=2,
    timeout=86400,
    relayers=[relayer1, relayer2]
);
```

### 3. Create Multi-Chain Vault

```solidity
address vault = factory.createMultiChainVault(
    owner=msg.sender,
    quorum=3,                    // Need 3 weight to approve
    remoteGuardianWeight=1,      // Remote guardians worth 1 each
    chains=[1, 137, 56]          // Connect to 3 chains
);
```

### 4. Add Guardians

```solidity
// Add local guardian (same chain)
IMultiChainVault(vault).addGuardian(guardianAddress, address(0));

// Add remote guardian from Chain 137
IMultiChainVault(vault).addGuardian(guardianOnPolygon, polygonGuardianToken);
```

## Common Operations

### Propose Multi-Chain Withdrawal

```solidity
uint256 withdrawalId = IMultiChainVault(vault).proposeMultiChainWithdrawal(
    token=USDCAddress,
    amount=1000e6,              // 1000 USDC
    recipient=recipientAddress,
    reason="Monthly operational expenses",
    proofChainIds=[1, 137]      // Need proofs from Ethereum + Polygon
);
```

### Remote Guardian Approves

```solidity
bytes32[] memory merklePath = [proof1, proof2, proof3];

GuardianProof memory proof = GuardianProof({
    chainId: 1,
    guardianToken: SBTAddress,
    guardian: msg.sender,
    tokenId: 42,
    proofTimestamp: block.timestamp,
    merkleRoot: storedRoot,
    merklePath: merklePath
});

IMultiChainVault(vault).approveWithRemoteGuardian(
    withdrawalId,
    proof
);
```

### Local Guardian Approves

```solidity
bytes memory signature = abi.encodePacked(r, s, v);

IMultiChainVault(vault).approveWithLocalGuardian(
    withdrawalId,
    signature
);
```

### Execute Withdrawal

```solidity
// Checks: quorum reached?
// local_approvals + (remote_approvals × weight) >= quorum
IMultiChainVault(vault).executeMultiChainWithdrawal(withdrawalId);
```

## API Quick Reference

### CrossChainGuardianProofService

```solidity
// Configure bridge for chain
configureBridge(
    chainId: uint256,
    confirmations: uint256,
    timeout: uint256,
    relayers: address[]
)

// Submit guardian proof
submitGuardianProof(proof: GuardianProof)

// Receive cross-chain message
receiveMessage(
    messageId: uint256,
    sourceChain: uint256,
    sender: address,
    payload: bytes
)

// Verify Merkle proof
verifyMerkleProof(
    proof: bytes32[],
    root: bytes32,
    leaf: bytes32
) → bool
```

### MultiChainVault

```solidity
// Create withdrawal (max 5 chains)
proposeMultiChainWithdrawal(
    token: address,
    amount: uint256,
    recipient: address,
    reason: string,
    proofChainIds: uint256[]
) → uint256 withdrawalId

// Remote guardian approves
approveWithRemoteGuardian(
    withdrawalId: uint256,
    proof: GuardianProof
)

// Local guardian approves
approveWithLocalGuardian(
    withdrawalId: uint256,
    signature: bytes
)

// Execute if quorum met
executeMultiChainWithdrawal(withdrawalId: uint256)

// Add guardian
addGuardian(guardian: address, chainId: uint256)
```

### CrossChainMessageBridge

```solidity
// Send message to another chain
sendMessage(
    destinationChain: uint256,
    destinationAddress: address,
    payload: bytes
) payable → uint256 messageId

// Estimate transmission fee
estimateFee(
    destinationChain: uint256,
    payload: bytes
) → uint256 fee
```

### MultiChainVaultFactory

```solidity
// Deploy new multi-chain vault
createMultiChainVault(
    owner: address,
    quorum: uint256,
    remoteGuardianWeight: uint256,
    chains: uint256[]
) → address vaultAddress

// Register chain for bridging
registerChainForBridge(
    chainId: uint256,
    relayer: address,
    baseFee: uint256,
    feePerByte: uint256
)

// Get vault info
getVaultInfo(vaultAddress: address)
    → MultiChainVaultInfo
```

## Weighted Voting Examples

### Example 1: Balanced

```
Quorum: 5
remoteWeight: 1

Approval scenarios:
✓ 5 local guardians
✓ 5 remote guardians
✓ 3 local + 2 remote
✗ 4 local (only 4 weight)
✗ 3 remote (only 3 weight)
```

### Example 2: Local-Heavy

```
Quorum: 6
remoteWeight: 0.5

Approval scenarios:
✓ 6 local guardians
✓ 1 local + 10 remote
✓ 4 local + 4 remote (4 + 2 = 6)
✗ 5 local (only 5)
✗ 10 remote (only 5 weight)
```

### Example 3: Remote-Emphasizing

```
Quorum: 8
remoteWeight: 2

Approval scenarios:
✓ 8 local guardians
✓ 4 remote guardians (4 × 2 = 8)
✓ 6 local + 1 remote (6 + 2 = 8)
✗ 3 local + 2 remote (3 + 4 = 7)
✗ 3 remote (only 6)
```

## Gas Costs

| Operation | Est. Gas |
|-----------|----------|
| Send bridge message (100 bytes) | 8,500 + bridge fees |
| Submit guardian proof | 12,000 |
| Verify Merkle proof (4 levels) | 15,000 |
| Remote guardian approval | 25,000 |
| Local guardian approval | 18,000 |
| Execute withdrawal | 45,000 |

**Bridge Fees** (per chain, configurable):
```
Fee = baseFee + (payloadLength × feePerByte)
Example: 0.1 ETH + (100 × 0.001) = 0.2 ETH
```

## Integration Checklist

- [ ] Deploy CrossChainGuardianProofService
- [ ] Deploy CrossChainMessageBridge  
- [ ] Deploy MultiChainVaultFactory
- [ ] Register all chains with bridge
- [ ] Configure guardian proof validation per chain
- [ ] Create multi-chain vault
- [ ] Add local guardians
- [ ] Add remote guardians with SBT addresses
- [ ] Set remote guardian weight
- [ ] Test single-chain proposal
- [ ] Test cross-chain proof submission
- [ ] Test quorum calculation
- [ ] Test withdrawal execution
- [ ] Test failure scenarios

## Troubleshooting Guide

### Issue: "Merkle proof invalid"
**Cause**: Proof path doesn't match stored root
**Fix**: 
- Verify merkleRoot matches current snapshot
- Check proof path is correct length
- Confirm guardian hash calculation

### Issue: "Message not confirmed"
**Cause**: Insufficient relayer confirmations
**Fix**:
- Check relayer configuration
- Verify relayers are running
- Confirm required confirmations threshold
- Check bridge is active

### Issue: "Quorum not reached"
**Cause**: Insufficient approval weight
**Fix**:
- Verify local approval count
- Check remote approval count
- Calculate: local + (remote × weight) >= quorum?
- Add more guardians if needed

### Issue: "Guardian not recognized"
**Cause**: SBT not verified on source chain
**Fix**:
- Confirm guardian holds SBT on source chain
- Verify SBT address in vault
- Check guardian address matches SBT holder
- Verify proof chain is connected

### Issue: "Bridge timeout"
**Cause**: Message stuck in relay queue
**Fix**:
- Wait for relayer confirmation
- Check destination chain is active
- Verify sufficient bridge fees
- Retry if temporary network issue

## Key Benefits

✅ **Multi-Chain Governance** - Guardians across chains collaborate  
✅ **Cryptographic Verification** - Merkle proofs prove guardian status  
✅ **Weighted Voting** - Configure remote guardian importance  
✅ **Complete Transparency** - All approvals auditable  
✅ **Backward Compatible** - Works with Features #1-19  
✅ **Flexible Architecture** - Any bridge (Axelar, LayerZero, Wormhole)  

## Next Steps

1. Review full documentation: `FEATURE_20_CROSS_CHAIN_GUARDIAN_PROOFS.md`
2. Study API reference: `FEATURE_20_CROSS_CHAIN_GUARDIAN_PROOFS_INDEX.md`
3. Deploy test vault on 2+ chains
4. Configure bridge relayers
5. Test end-to-end flow
6. Deploy to production

## Version Info

- **Feature**: #20 - Cross-Chain Guardian Proofs
- **Contracts**: 4 (1,540 total lines)
- **Solidity**: ^0.8.20
- **Dependencies**: OpenZeppelin (MerkleProof, ReentrancyGuard, EIP712)
