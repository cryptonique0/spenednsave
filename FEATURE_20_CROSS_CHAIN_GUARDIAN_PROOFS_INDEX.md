# Feature #20: Cross-Chain Guardian Proofs - Complete API Reference

## CrossChainGuardianProofService

**File**: `contracts/CrossChainGuardianProofService.sol` (360+ lines)
**Purpose**: Central proof validation service with Merkle tree verification

### Events

```solidity
event GuardianProofSubmitted(
    uint256 indexed chainId,
    address indexed guardian,
    uint256 indexed tokenId,
    bytes32 merkleRoot,
    uint256 timestamp
);

event GuardianProofVerified(
    uint256 indexed chainId,
    address indexed guardian,
    uint256 indexed tokenId,
    bool isValid,
    uint256 timestamp
);

event MessageReceived(
    uint256 indexed messageId,
    uint256 indexed sourceChain,
    address indexed sender,
    uint256 timestamp
);

event MessageConfirmed(
    uint256 indexed messageId,
    address indexed relayer,
    uint256 confirmationCount,
    uint256 timestamp
);

event GuardianStateSnapshotSubmitted(
    uint256 indexed chainId,
    uint256 indexed blockNumber,
    bytes32 merkleRoot,
    uint256 guardianCount,
    uint256 timestamp
);

event GuardianStateSnapshotVerified(
    uint256 indexed snapshotId,
    uint256 indexed chainId,
    bool isVerified,
    uint256 timestamp
);

event BridgeConfigured(
    uint256 indexed chainId,
    uint256 requiredConfirmations,
    uint256 messageTimeout,
    address[] relayers,
    uint256 timestamp
);
```

### Type Definitions

```solidity
enum MessageStatus {
    PENDING,      // Message sent but not confirmed
    RECEIVED,     // Message received by relayers
    VERIFIED,     // Message verified by quorum
    EXECUTED,     // Message successfully processed
    FAILED        // Message failed or expired
}

struct GuardianProof {
    uint256 chainId;              // Source blockchain ID
    address guardianToken;        // SBT address on source chain
    address guardian;             // Guardian's wallet address
    uint256 tokenId;              // SBT token ID held by guardian
    uint256 proofTimestamp;       // When proof was generated
    bytes32 merkleRoot;           // Root of guardian state tree
    bytes32[] merklePath;         // Path from leaf to root
}

struct CrossChainMessage {
    uint256 messageId;            // Unique message identifier
    uint256 sourceChainId;        // Origin blockchain
    uint256 destinationChainId;   // Target blockchain
    address sender;               // Message originator
    bytes payload;                // Message content
    uint256 timestamp;            // Message timestamp
    MessageStatus status;         // Current message state
}

struct GuardianStateSnapshot {
    uint256 chainId;              // Blockchain ID
    uint256 blockNumber;          // Block height when snapshot taken
    bytes32 merkleRoot;           // Root of guardian Merkle tree
    address[] guardians;          // Array of guardian addresses
    uint256 timestamp;            // Snapshot timestamp
    bool isVerified;              // Verified by relayer quorum
}

struct BridgeConfig {
    uint256 requiredConfirmations; // Confirmations needed
    uint256 messageTimeout;        // Seconds before message expires
    address[] relayers;            // Authorized relayers
    bool isActive;                 // Bridge active/inactive
}
```

### State Variables

```solidity
// Mapping: chainId => guardian => GuardianProof[]
mapping(uint256 => mapping(address => GuardianProof[]))
    public guardianProofs;

// Mapping: messageId => CrossChainMessage
mapping(uint256 => CrossChainMessage)
    public messages;

// Mapping: messageId => relayer => confirmed
mapping(uint256 => mapping(address => bool))
    public messageConfirmations;

// Mapping: messageId => confirmationCount
mapping(uint256 => uint256)
    public confirmationCounts;

// Mapping: snapshotId => GuardianStateSnapshot
mapping(uint256 => GuardianStateSnapshot)
    public guardianSnapshots;

// Mapping: chainId => BridgeConfig
mapping(uint256 => BridgeConfig)
    public bridgeConfigs;

// Mapping: chainId => relayer => isAuthorized
mapping(uint256 => mapping(address => bool))
    public authorizedRelayers;

// Message ID counter
uint256 public messageIdCounter;

// Snapshot ID counter
uint256 public snapshotIdCounter;
```

### Functions

#### configureBridge

```solidity
function configureBridge(
    uint256 chainId,
    uint256 requiredConfirmations,
    uint256 messageTimeout,
    address[] calldata relayers
) external onlyOwner
```

**Purpose**: Setup bridge for cross-chain communication  
**Parameters**:
- `chainId`: Target blockchain ID
- `requiredConfirmations`: Min relayers to confirm message
- `messageTimeout`: Seconds before message expires
- `relayers`: Array of authorized relayer addresses

**Returns**: None  
**Events**: `BridgeConfigured`  
**Reverts**:
- If `chainId` is 0
- If `requiredConfirmations` is 0
- If `relayers` array is empty
- If caller not owner

**Gas**: ~45,000  
**Example**:
```solidity
proofService.configureBridge(
    1,                              // Ethereum
    2,                              // Need 2 confirmations
    86400,                          // 24 hour timeout
    [relayer1Address, relayer2Address]
);
```

#### submitGuardianProof

```solidity
function submitGuardianProof(
    GuardianProof calldata proof
) external returns (bool verified)
```

**Purpose**: Submit guardian proof for verification  
**Parameters**:
- `proof`: Guardian proof struct with merkleRoot and merklePath

**Returns**: `verified` - True if proof is valid  
**Events**: `GuardianProofSubmitted`, `GuardianProofVerified`  
**Reverts**:
- If proof timestamp is in future
- If proof is too old (> 7 days)
- If merkleRoot is not stored for chain
- If proof verification fails

**Gas**: ~18,000 + verification  
**Example**:
```solidity
GuardianProof memory proof = GuardianProof({
    chainId: 1,
    guardianToken: 0x...,
    guardian: msg.sender,
    tokenId: 42,
    proofTimestamp: block.timestamp - 3600,
    merkleRoot: storedRoot,
    merklePath: [proof1, proof2, proof3]
});

bool verified = proofService.submitGuardianProof(proof);
```

#### receiveMessage

```solidity
function receiveMessage(
    uint256 messageId,
    uint256 sourceChainId,
    address sender,
    bytes calldata payload
) external returns (uint256 newMessageId)
```

**Purpose**: Receive cross-chain message from bridge relayer  
**Parameters**:
- `messageId`: Bridge's message identifier
- `sourceChainId`: Originating blockchain
- `sender`: Original message sender
- `payload`: Message content

**Returns**: `newMessageId` - Internal message ID  
**Events**: `MessageReceived`  
**Reverts**:
- If caller not authorized relayer
- If sourceChainId has no bridge config
- If message already received (replay protection)

**Gas**: ~12,000  
**Example**:
```solidity
uint256 internalId = proofService.receiveMessage(
    bridgeMessageId,
    1,                      // From Ethereum
    msg.sender,             // Bridge relayer
    guardianProofPayload
);
```

#### confirmMessage

```solidity
function confirmMessage(
    uint256 messageId
) external returns (bool fullyConfirmed)
```

**Purpose**: Relayer confirms receipt and validity of message  
**Parameters**:
- `messageId`: Internal message ID to confirm

**Returns**: `fullyConfirmed` - True if quorum reached  
**Events**: `MessageConfirmed`  
**Reverts**:
- If message doesn't exist
- If caller not authorized relayer
- If caller already confirmed
- If message is not in RECEIVED state

**Gas**: ~8,000  
**Example**:
```solidity
bool quorumReached = proofService.confirmMessage(messageId);

if (quorumReached) {
    // Message is verified, can be processed
}
```

#### verifyGuardianProof

```solidity
function verifyGuardianProof(
    GuardianProof calldata proof
) public view returns (bool isValid)
```

**Purpose**: Verify guardian proof without storing  
**Parameters**:
- `proof`: Guardian proof to verify

**Returns**: `isValid` - True if proof valid  
**Reverts**: None (returns false on invalid)  
**Gas**: ~15,000  
**Example**:
```solidity
bool valid = proofService.verifyGuardianProof(proof);
require(valid, "Guardian proof invalid");
```

#### submitGuardianStateSnapshot

```solidity
function submitGuardianStateSnapshot(
    uint256 chainId,
    uint256 blockNumber,
    bytes32 merkleRoot,
    address[] calldata guardians
) external returns (uint256 snapshotId)
```

**Purpose**: Submit guardian state snapshot from another chain  
**Parameters**:
- `chainId`: Source blockchain
- `blockNumber`: Block when snapshot taken
- `merkleRoot`: Root of guardian Merkle tree
- `guardians`: Array of guardian addresses

**Returns**: `snapshotId` - Unique snapshot identifier  
**Events**: `GuardianStateSnapshotSubmitted`  
**Reverts**:
- If chainId has no bridge config
- If blockNumber is in future
- If merkleRoot is zero
- If guardians array is empty

**Gas**: ~45,000 + 1,000 per guardian  
**Example**:
```solidity
uint256 snapshotId = proofService.submitGuardianStateSnapshot(
    1,                                  // Ethereum
    17000000,                          // Block number
    0xabcd...,                         // Merkle root
    [guardian1, guardian2, guardian3]
);
```

#### verifyGuardianStateSnapshot

```solidity
function verifyGuardianStateSnapshot(
    uint256 snapshotId
) external returns (bool isVerified)
```

**Purpose**: Verify snapshot with multi-relayer consensus  
**Parameters**:
- `snapshotId`: Snapshot to verify

**Returns**: `isVerified` - True if quorum confirmed  
**Events**: `GuardianStateSnapshotVerified`  
**Reverts**:
- If snapshot doesn't exist
- If snapshot already verified
- If caller not authorized relayer

**Gas**: ~12,000  
**Example**:
```solidity
bool verified = proofService.verifyGuardianStateSnapshot(snapshotId);
```

#### verifyMerkleProof

```solidity
function verifyMerkleProof(
    bytes32[] calldata proof,
    bytes32 root,
    bytes32 leaf
) public pure returns (bool isValid)
```

**Purpose**: Verify Merkle proof independently  
**Parameters**:
- `proof`: Array of sibling hashes
- `root`: Expected root
- `leaf`: Leaf to prove

**Returns**: `isValid` - True if proof valid  
**Reverts**: None  
**Gas**: ~2,000 + 3,000 per proof element  
**Example**:
```solidity
bytes32 leaf = keccak256(abi.encodePacked(guardian, tokenId));
bytes32[] memory proof = [proof1, proof2, proof3];

bool valid = proofService.verifyMerkleProof(proof, merkleRoot, leaf);
```

#### hashGuardianData

```solidity
function hashGuardianData(
    address guardian,
    uint256 tokenId
) public pure returns (bytes32)
```

**Purpose**: Hash guardian for Merkle tree  
**Parameters**:
- `guardian`: Guardian address
- `tokenId`: SBT token ID

**Returns**: Hash of (guardian, tokenId)  
**Reverts**: None  
**Gas**: ~500  
**Example**:
```solidity
bytes32 leaf = proofService.hashGuardianData(guardianAddr, 42);
```

#### calculateMerkleRoot

```solidity
function calculateMerkleRoot(
    bytes32[] calldata leaves
) public pure returns (bytes32)
```

**Purpose**: Calculate Merkle root from leaves  
**Parameters**:
- `leaves`: Array of leaf hashes

**Returns**: Root hash  
**Reverts**: If leaves array empty  
**Gas**: ~3,000 per level  
**Example**:
```solidity
bytes32[] memory leaves = [leaf1, leaf2, leaf3];
bytes32 root = proofService.calculateMerkleRoot(leaves);
```

#### addRelayer

```solidity
function addRelayer(
    uint256 chainId,
    address relayer
) external onlyOwner
```

**Purpose**: Add authorized relayer for chain  
**Parameters**:
- `chainId`: Target blockchain
- `relayer`: Relayer address to authorize

**Returns**: None  
**Reverts**:
- If chainId has no bridge config
- If relayer already authorized
- If relayer is zero address

**Gas**: ~8,000  
**Example**:
```solidity
proofService.addRelayer(1, newRelayerAddress);
```

#### removeRelayer

```solidity
function removeRelayer(
    uint256 chainId,
    address relayer
) external onlyOwner
```

**Purpose**: Remove authorized relayer  
**Parameters**:
- `chainId`: Blockchain ID
- `relayer`: Relayer to deauthorize

**Returns**: None  
**Reverts**:
- If chainId has no bridge config
- If relayer not authorized
- If would fall below required confirmations

**Gas**: ~8,000  
**Example**:
```solidity
proofService.removeRelayer(1, oldRelayerAddress);
```

---

## MultiChainVault

**File**: `contracts/MultiChainVault.sol` (410+ lines)
**Purpose**: Vault supporting cross-chain guardian approval

### Events

```solidity
event MultiChainWithdrawalProposed(
    uint256 indexed withdrawalId,
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256[] proofChainIds,
    uint256 timestamp
);

event RemoteGuardianApproved(
    uint256 indexed withdrawalId,
    address indexed guardian,
    uint256 indexed chainId,
    uint256 approvalWeight,
    uint256 timestamp
);

event LocalGuardianApproved(
    uint256 indexed withdrawalId,
    address indexed guardian,
    uint256 approvalWeight,
    uint256 timestamp
);

event MultiChainWithdrawalExecuted(
    uint256 indexed withdrawalId,
    address indexed token,
    uint256 amount,
    address indexed recipient,
    uint256 totalWeight,
    uint256 timestamp
);

event ChainConnected(
    uint256 indexed chainId,
    uint256 timestamp
);

event ChainDisconnected(
    uint256 indexed chainId,
    uint256 timestamp
);

event GuardianAdded(
    address indexed guardian,
    uint256 indexed chainId,
    uint256 timestamp
);

event GuardianRemoved(
    address indexed guardian,
    uint256 indexed chainId,
    uint256 timestamp
);

event RemoteGuardianWeightSet(
    uint256 newWeight,
    uint256 timestamp
);
```

### Type Definitions

```solidity
struct MultiChainWithdrawal {
    address token;                // Token to withdraw
    uint256 amount;               // Amount to withdraw
    address recipient;            // Withdrawal recipient
    uint256 nonce;                // Unique withdrawal number
    string reason;                // Withdrawal reason
    uint256[] proofChainIds;      // Chains providing proofs
    bool executed;                // Has been executed
}

struct GuardianApproval {
    address guardian;             // Guardian address
    uint256 chainId;              // Chain ID (0 = local)
    uint256 approvalTimestamp;    // When approved
    bool isRemote;                // Is remote guardian
}
```

### State Variables

```solidity
// Vault owner
address public owner;

// Minimum approvals needed (quorum)
uint256 public quorum;

// Weight multiplier for remote guardians
uint256 public remoteGuardianWeight;

// Connected chains
uint256[] public connectedChains;

// Local guardians (chainId = 0)
address[] public localGuardians;

// Remote guardians: chainId => guardian[]
mapping(uint256 => address[]) public remoteGuardians;

// Guardian SBT address per chain
mapping(uint256 => address) public guardianTokens;

// Withdrawals: nonce => MultiChainWithdrawal
mapping(uint256 => MultiChainWithdrawal) public withdrawals;

// Approvals: withdrawalId => GuardianApproval[]
mapping(uint256 => GuardianApproval[]) public approvals;

// Approval tracking: withdrawalId => guardian => approved
mapping(uint256 => mapping(address => bool)) public hasApproved;

// Next withdrawal nonce
uint256 public nextNonce;

// EIP-712 domain separator
bytes32 public DOMAIN_SEPARATOR;
```

### Functions

#### proposeMultiChainWithdrawal

```solidity
function proposeMultiChainWithdrawal(
    address token,
    uint256 amount,
    address recipient,
    string calldata reason,
    uint256[] calldata proofChainIds
) external returns (uint256 withdrawalId)
```

**Purpose**: Propose multi-chain withdrawal  
**Parameters**:
- `token`: ERC-20 token to withdraw (or zero address for ETH)
- `amount`: Amount to withdraw
- `recipient`: Recipient address
- `reason`: Reason string (can be hashed via Feature #13)
- `proofChainIds`: Chains that must provide proofs (max 5)

**Returns**: `withdrawalId` - Unique withdrawal ID  
**Events**: `MultiChainWithdrawalProposed`  
**Reverts**:
- If amount is 0
- If recipient is zero address
- If proofChainIds array > 5
- If token not enough balance

**Gas**: ~35,000  
**Example**:
```solidity
uint256 withdrawalId = vault.proposeMultiChainWithdrawal(
    token=USDCAddress,
    amount=1000e6,
    recipient=payeeAddress,
    reason="Operational funding",
    proofChainIds=[1, 137]
);
```

#### approveWithRemoteGuardian

```solidity
function approveWithRemoteGuardian(
    uint256 withdrawalId,
    address guardian,
    uint256 chainId,
    bytes32[] calldata merklePath
) external returns (bool approved)
```

**Purpose**: Remote guardian approves withdrawal via Merkle proof  
**Parameters**:
- `withdrawalId`: Withdrawal to approve
- `guardian`: Guardian address on source chain
- `chainId`: Source chain ID
- `merklePath`: Merkle proof path

**Returns**: `approved` - True if approval successful  
**Events**: `RemoteGuardianApproved`  
**Reverts**:
- If withdrawal doesn't exist
- If withdrawal already executed
- If guardian not in remoteGuardians[chainId]
- If guardian already approved
- If Merkle proof invalid

**Gas**: ~28,000  
**Example**:
```solidity
bytes32[] memory proof = [proof1, proof2, proof3];

vault.approveWithRemoteGuardian(
    withdrawalId,
    guardianOnChainA,
    1,
    proof
);
```

#### approveWithLocalGuardian

```solidity
function approveWithLocalGuardian(
    uint256 withdrawalId,
    bytes calldata signature
) external returns (bool approved)
```

**Purpose**: Local guardian approves via signature  
**Parameters**:
- `withdrawalId`: Withdrawal ID to approve
- `signature`: EIP-712 signature from guardian

**Returns**: `approved` - True if successful  
**Events**: `LocalGuardianApproved`  
**Reverts**:
- If withdrawal doesn't exist
- If withdrawal already executed
- If signer not in localGuardians
- If guardian already approved
- If signature invalid

**Gas**: ~22,000  
**Example**:
```solidity
bytes memory signature = abi.encodePacked(r, s, v);

vault.approveWithLocalGuardian(withdrawalId, signature);
```

#### executeMultiChainWithdrawal

```solidity
function executeMultiChainWithdrawal(
    uint256 withdrawalId
) external returns (bool executed)
```

**Purpose**: Execute withdrawal if quorum reached  
**Parameters**:
- `withdrawalId`: Withdrawal to execute

**Returns**: `executed` - True if successful  
**Events**: `MultiChainWithdrawalExecuted`  
**Reverts**:
- If withdrawal doesn't exist
- If already executed
- If quorum not reached: 
  `local_approvals + (remote_approvals × remoteWeight) < quorum`
- If token transfer fails
- If recipient is zero address

**Gas**: ~55,000 + token transfer  
**Example**:
```solidity
// After sufficient approvals...
vault.executeMultiChainWithdrawal(withdrawalId);
```

#### connectChain

```solidity
function connectChain(uint256 chainId) external onlyOwner
```

**Purpose**: Enable cross-chain for specific chain  
**Parameters**:
- `chainId`: Chain to connect

**Returns**: None  
**Events**: `ChainConnected`  
**Reverts**:
- If chainId is 0
- If chainId already connected
- If caller not owner

**Gas**: ~12,000  
**Example**:
```solidity
vault.connectChain(137);  // Connect to Polygon
```

#### disconnectChain

```solidity
function disconnectChain(uint256 chainId) external onlyOwner
```

**Purpose**: Disable cross-chain for specific chain  
**Parameters**:
- `chainId`: Chain to disconnect

**Returns**: None  
**Events**: `ChainDisconnected`  
**Reverts**:
- If chainId not connected
- If caller not owner

**Gas**: ~12,000  
**Example**:
```solidity
vault.disconnectChain(56);  // Disconnect from BSC
```

#### addGuardian

```solidity
function addGuardian(
    address guardian,
    uint256 chainId
) external onlyOwner
```

**Purpose**: Add guardian (local if chainId=0, remote otherwise)  
**Parameters**:
- `guardian`: Guardian address
- `chainId`: Chain where guardian operates (0 for local)

**Returns**: None  
**Events**: `GuardianAdded`  
**Reverts**:
- If guardian is zero address
- If guardian already exists
- If chainId not connected
- If caller not owner

**Gas**: ~15,000  
**Example**:
```solidity
// Add local guardian
vault.addGuardian(localGuardian, 0);

// Add remote guardian from Ethereum
vault.addGuardian(remoteGuardianAddr, 1);
```

#### removeGuardian

```solidity
function removeGuardian(
    address guardian,
    uint256 chainId
) external onlyOwner
```

**Purpose**: Remove guardian  
**Parameters**:
- `guardian`: Guardian to remove
- `chainId`: Chain ID where guardian operates

**Returns**: None  
**Events**: `GuardianRemoved`  
**Reverts**:
- If guardian not found
- If caller not owner

**Gas**: ~18,000  
**Example**:
```solidity
vault.removeGuardian(guardianAddr, 1);
```

#### setRemoteGuardianWeight

```solidity
function setRemoteGuardianWeight(
    uint256 newWeight
) external onlyOwner
```

**Purpose**: Set weight multiplier for remote guardians  
**Parameters**:
- `newWeight`: New weight (1 = equal to local, 2 = worth double)

**Returns**: None  
**Events**: `RemoteGuardianWeightSet`  
**Reverts**:
- If newWeight is 0
- If caller not owner

**Gas**: ~8,000  
**Example**:
```solidity
// Remote guardians now worth 1.5x local
vault.setRemoteGuardianWeight(150);  // Use basis points (10000 = 1)
```

#### deposit

```solidity
function deposit(
    address token,
    uint256 amount
) external returns (bool)
```

**Purpose**: Deposit tokens into vault  
**Parameters**:
- `token`: Token to deposit (zero address for ETH)
- `amount`: Amount to deposit

**Returns**: True if successful  
**Events**: None  
**Reverts**:
- If amount is 0
- If token transfer fails

**Gas**: ~35,000  
**Example**:
```solidity
IERC20(USDC).approve(vault, 1000e6);
vault.deposit(USDC, 1000e6);
```

#### receive

```solidity
receive() external payable
```

**Purpose**: Accept native ETH  
**Returns**: None  
**Reverts**: Never  
**Gas**: ~21,000  
**Example**:
```solidity
payable(vault).transfer(1 ether);
```

#### getApprovals

```solidity
function getApprovals(
    uint256 withdrawalId
) external view returns (GuardianApproval[] memory)
```

**Purpose**: Get all approvals for withdrawal  
**Parameters**:
- `withdrawalId`: Withdrawal ID

**Returns**: Array of approvals  
**Reverts**: None  
**Gas**: ~5,000 + 500 per approval  
**Example**:
```solidity
GuardianApproval[] memory approvals = 
    vault.getApprovals(withdrawalId);
    
for (uint i = 0; i < approvals.length; i++) {
    console.log(approvals[i].guardian);
}
```

#### getApprovalWeight

```solidity
function getApprovalWeight(
    uint256 withdrawalId
) external view returns (uint256)
```

**Purpose**: Calculate current approval weight  
**Parameters**:
- `withdrawalId`: Withdrawal ID

**Returns**: Total weight from approvals  
**Reverts**: None  
**Gas**: ~8,000  
**Example**:
```solidity
uint256 weight = vault.getApprovalWeight(withdrawalId);
console.log("Current weight:", weight);
console.log("Quorum required:", vault.quorum());
```

---

## CrossChainMessageBridge

**File**: `contracts/CrossChainMessageBridge.sol` (320+ lines)
**Purpose**: Abstract message bridge interface

### Type Definitions

```solidity
enum MessageStatus {
    PENDING,      // Sent but not confirmed
    CONFIRMED,    // Confirmed by relayer
    RECEIVED,     // Received at destination
    EXECUTED,     // Successfully executed
    FAILED        // Failed or timed out
}

struct BridgeMessage {
    uint256 messageId;            // Unique ID
    uint256 sourceChainId;        // Origin chain
    uint256 destinationChainId;   // Destination chain
    address sourceAddress;        // Sender address
    address destinationAddress;   // Recipient address
    bytes payload;                // Message content
    uint256 timestamp;            // Send timestamp
    MessageStatus status;         // Current status
}

struct BridgeConfiguration {
    address relayerAddress;       // Chain's authorized relayer
    uint256 baseFee;              // Base transmission fee
    uint256 feePerByte;           // Fee per payload byte
    bool isActive;                // Bridge enabled
}
```

### Functions

#### configureBridge

```solidity
function configureBridge(
    uint256 chainId,
    address relayer,
    uint256 baseFee,
    uint256 feePerByte
) external onlyOwner
```

**Purpose**: Setup bridge for chain  
**Parameters**:
- `chainId`: Blockchain ID
- `relayer`: Authorized relayer address
- `baseFee`: Base transmission fee in wei
- `feePerByte`: Fee per payload byte in wei

**Returns**: None  
**Reverts**:
- If chainId is 0
- If relayer is zero address
- If caller not owner

**Gas**: ~12,000  
**Example**:
```solidity
bridge.configureBridge(
    1,
    relayerAddress,
    0.1 ether,      // 0.1 ETH base
    0.001 ether     // 0.001 ETH per byte
);
```

#### sendMessage

```solidity
function sendMessage(
    uint256 destinationChainId,
    address destinationAddress,
    bytes calldata payload
) external payable returns (uint256 messageId)
```

**Purpose**: Send cross-chain message  
**Parameters**:
- `destinationChainId`: Target blockchain
- `destinationAddress`: Recipient address
- `payload`: Message content

**Returns**: `messageId` - Unique message ID  
**Events**: `MessageSent`  
**Reverts**:
- If destination chain not configured
- If insufficient fee (msg.value < estimatedFee)
- If payload is empty
- If destination address is zero

**Gas**: ~18,000 + payload processing  
**Example**:
```solidity
bytes memory payload = abi.encode(guardianProof);
uint256 fee = bridge.estimateFee(137, payload);

uint256 messageId = bridge.sendMessage{value: fee}(
    137,                          // Polygon
    destinationVault,
    payload
);
```

#### receiveMessage

```solidity
function receiveMessage(
    uint256 messageId,
    uint256 sourceChainId,
    address sourceAddress,
    address destinationAddress,
    bytes calldata payload
) external onlyRelayer(sourceChainId)
    returns (bool)
```

**Purpose**: Receive message from relayer  
**Parameters**:
- `messageId`: Bridge message ID
- `sourceChainId`: Source blockchain
- `sourceAddress`: Message sender
- `destinationAddress`: Intended recipient
- `payload`: Message content

**Returns**: True if received successfully  
**Reverts**:
- If caller not authorized relayer
- If source chain not configured
- If destination address is zero
- If message ID already used (replay protection)

**Gas**: ~15,000  
**Example**:
```solidity
bridge.receiveMessage(
    bridgeMessageId,
    1,
    senderVault,
    recipientVault,
    guardianProofPayload
);
```

#### confirmMessage

```solidity
function confirmMessage(
    uint256 messageId
) external onlyRelayer returns (bool)
```

**Purpose**: Relayer confirms message receipt  
**Parameters**:
- `messageId`: Message ID to confirm

**Returns**: True if confirmed  
**Reverts**:
- If message doesn't exist
- If caller not authorized relayer
- If message already confirmed

**Gas**: ~8,000  
**Example**:
```solidity
bridge.confirmMessage(messageId);
```

#### executeMessage

```solidity
function executeMessage(
    uint256 messageId
) external returns (bool)
```

**Purpose**: Mark message as executed  
**Parameters**:
- `messageId`: Message to execute

**Returns**: True if executed  
**Reverts**:
- If message not in RECEIVED state
- If already executed

**Gas**: ~8,000  
**Example**:
```solidity
bridge.executeMessage(messageId);
```

#### estimateFee

```solidity
function estimateFee(
    uint256 destinationChainId,
    bytes calldata payload
) external view returns (uint256)
```

**Purpose**: Calculate message transmission fee  
**Parameters**:
- `destinationChainId`: Target chain
- `payload`: Message content

**Returns**: Total fee in wei  
**Formula**: `baseFee + (payload.length × feePerByte)`  
**Reverts**:
- If destination chain not configured

**Gas**: ~3,000  
**Example**:
```solidity
bytes memory payload = abi.encode(guardianProof);
uint256 fee = bridge.estimateFee(137, payload);
console.log("Fee required:", fee);
```

#### updateRelayer

```solidity
function updateRelayer(
    uint256 chainId,
    address newRelayer
) external onlyOwner
```

**Purpose**: Change chain's relayer  
**Parameters**:
- `chainId`: Blockchain ID
- `newRelayer`: New relayer address

**Returns**: None  
**Reverts**:
- If chain not configured
- If newRelayer is zero address
- If caller not owner

**Gas**: ~8,000  
**Example**:
```solidity
bridge.updateRelayer(1, newRelayerAddress);
```

#### disableBridge

```solidity
function disableBridge(uint256 chainId) external onlyOwner
```

**Purpose**: Deactivate bridge for chain  
**Parameters**:
- `chainId`: Chain to disable

**Returns**: None  
**Reverts**:
- If chain not configured
- If already disabled
- If caller not owner

**Gas**: ~8,000  
**Example**:
```solidity
bridge.disableBridge(56);  // Disable BSC
```

#### enableBridge

```solidity
function enableBridge(uint256 chainId) external onlyOwner
```

**Purpose**: Reactivate bridge for chain  
**Parameters**:
- `chainId`: Chain to enable

**Returns**: None  
**Reverts**:
- If chain not configured
- If already enabled
- If caller not owner

**Gas**: ~8,000  
**Example**:
```solidity
bridge.enableBridge(56);  // Enable BSC
```

#### withdrawFees

```solidity
function withdrawFees(
    uint256 chainId
) external onlyOwner returns (uint256 amount)
```

**Purpose**: Withdraw accumulated bridge fees  
**Parameters**:
- `chainId`: Chain to withdraw fees from

**Returns**: Amount withdrawn  
**Reverts**:
- If no fees to withdraw
- If transfer fails

**Gas**: ~8,000 + transfer  
**Example**:
```solidity
uint256 feesCollected = bridge.withdrawFees(1);
console.log("Collected fees:", feesCollected);
```

---

## MultiChainVaultFactory

**File**: `contracts/MultiChainVaultFactory.sol` (300+ lines)
**Purpose**: Deploy and manage multi-chain vaults

### Type Definitions

```solidity
struct MultiChainVaultInfo {
    address vaultAddress;         // Deployed vault contract
    address owner;                // Vault owner
    uint256 quorum;               // Required approvals
    uint256 remoteGuardianWeight; // Remote guardian weight
    uint256[] connectedChains;    // Chains connected to vault
    uint256 deploymentTimestamp;  // When vault deployed
}
```

### State Variables

```solidity
// Proof service reference
ICrossChainGuardianProofService public proofService;

// Message bridge reference
ICrossChainMessageBridge public messageBridge;

// Vaults by owner: owner => vault[]
mapping(address => address[]) public vaultsByOwner;

// Vault info: vaultAddress => MultiChainVaultInfo
mapping(address => MultiChainVaultInfo) public vaultInfos;

// Check if vault from factory
mapping(address => bool) public isFactoryVault;

// Bridge configurations per chain
mapping(uint256 => IBridge.BridgeConfiguration)
    public bridgeConfigs;

// Total vaults deployed
uint256 public totalVaults;
```

### Functions

#### createMultiChainVault

```solidity
function createMultiChainVault(
    address owner,
    uint256 quorum,
    uint256 remoteGuardianWeight,
    uint256[] calldata chains
) external returns (address vaultAddress)
```

**Purpose**: Deploy new multi-chain vault  
**Parameters**:
- `owner`: Vault owner address
- `quorum`: Minimum approvals for execution
- `remoteGuardianWeight`: Remote guardian voting weight
- `chains`: Connected blockchain IDs

**Returns**: `vaultAddress` - Deployed vault address  
**Events**: `VaultCreated`  
**Reverts**:
- If owner is zero address
- If quorum is 0
- If chains array empty or > 10
- If any chain not configured

**Gas**: ~250,000 (proxy deployment)  
**Example**:
```solidity
address vault = factory.createMultiChainVault(
    owner=ownerAddress,
    quorum=3,
    remoteGuardianWeight=1,
    chains=[1, 137, 56]
);
```

#### createMultiChainVaultWithGuardians

```solidity
function createMultiChainVaultWithGuardians(
    address owner,
    uint256 quorum,
    uint256 remoteGuardianWeight,
    uint256[] calldata chains,
    address[] calldata guardians,
    uint256[] calldata guardianChains
) external returns (address vaultAddress)
```

**Purpose**: Deploy vault and pre-configure guardians  
**Parameters**:
- `owner`: Vault owner
- `quorum`: Minimum approvals
- `remoteGuardianWeight`: Remote voting weight
- `chains`: Connected chains
- `guardians`: Guardian addresses
- `guardianChains`: Chain for each guardian (0 = local)

**Returns**: `vaultAddress` - Vault address  
**Reverts**:
- Same as createMultiChainVault
- Plus: `guardians.length != guardianChains.length`

**Gas**: ~350,000  
**Example**:
```solidity
address vault = factory.createMultiChainVaultWithGuardians(
    ownerAddress,
    3,
    1,
    [1, 137],
    [guardian1, guardian2, guardian3],
    [0, 1, 1]      // guardian1 local, others on Polygon
);
```

#### registerChainForBridge

```solidity
function registerChainForBridge(
    uint256 chainId,
    address relayer,
    uint256 baseFee,
    uint256 feePerByte
) external onlyOwner
```

**Purpose**: Register chain for message bridging  
**Parameters**:
- `chainId`: Blockchain ID
- `relayer`: Relayer address
- `baseFee`: Base transmission fee
- `feePerByte`: Fee per payload byte

**Returns**: None  
**Reverts**:
- If caller not owner
- If chainId is 0
- If relayer is zero address

**Gas**: ~12,000  
**Example**:
```solidity
factory.registerChainForBridge(
    1,
    relayerAddress,
    0.1 ether,
    0.001 ether
);
```

#### registerGuardianProofChain

```solidity
function registerGuardianProofChain(
    uint256 chainId,
    uint256 confirmations,
    uint256 timeout,
    address[] calldata relayers
) external onlyOwner
```

**Purpose**: Register chain for guardian proof validation  
**Parameters**:
- `chainId`: Blockchain ID
- `confirmations`: Required relayer confirmations
- `timeout`: Message expiry time (seconds)
- `relayers`: Authorized relayers

**Returns**: None  
**Reverts**:
- If caller not owner
- If chainId is 0
- If confirmations is 0
- If relayers array empty

**Gas**: ~25,000  
**Example**:
```solidity
factory.registerGuardianProofChain(
    1,
    2,
    86400,
    [relayer1, relayer2, relayer3]
);
```

#### updateProofService

```solidity
function updateProofService(
    address newProofService
) external onlyOwner
```

**Purpose**: Update proof service reference  
**Parameters**:
- `newProofService`: New service address

**Returns**: None  
**Reverts**:
- If caller not owner
- If newProofService is zero address

**Gas**: ~8,000  
**Example**:
```solidity
factory.updateProofService(newProofServiceAddress);
```

#### updateMessageBridge

```solidity
function updateMessageBridge(
    address newBridge
) external onlyOwner
```

**Purpose**: Update message bridge reference  
**Parameters**:
- `newBridge`: New bridge address

**Returns**: None  
**Reverts**:
- If caller not owner
- If newBridge is zero address

**Gas**: ~8,000  
**Example**:
```solidity
factory.updateMessageBridge(newBridgeAddress);
```

#### getVaultsByOwner

```solidity
function getVaultsByOwner(
    address owner
) external view returns (address[] memory)
```

**Purpose**: Get all vaults owned by address  
**Parameters**:
- `owner`: Owner address

**Returns**: Array of vault addresses  
**Reverts**: None  
**Gas**: ~3,000  
**Example**:
```solidity
address[] memory myVaults = factory.getVaultsByOwner(msg.sender);
console.log("My vaults:", myVaults.length);
```

#### getVaultInfo

```solidity
function getVaultInfo(
    address vaultAddress
) external view returns (MultiChainVaultInfo memory)
```

**Purpose**: Get vault configuration details  
**Parameters**:
- `vaultAddress`: Vault to query

**Returns**: `MultiChainVaultInfo` struct  
**Reverts**: None (returns empty struct if not found)  
**Gas**: ~5,000  
**Example**:
```solidity
MultiChainVaultInfo memory info = factory.getVaultInfo(vault);
console.log("Quorum:", info.quorum);
console.log("Chains:", info.connectedChains.length);
```

#### isFactoryVault

```solidity
function isFactoryVault(
    address vaultAddress
) external view returns (bool)
```

**Purpose**: Verify vault was deployed by factory  
**Parameters**:
- `vaultAddress`: Address to check

**Returns**: True if factory-deployed  
**Reverts**: None  
**Gas**: ~3,000  
**Example**:
```solidity
require(factory.isFactoryVault(vault), "Not factory vault");
```

#### getBridgeChains

```solidity
function getBridgeChains() external view
    returns (uint256[] memory)
```

**Purpose**: List all registered bridge chains  
**Parameters**: None  
**Returns**: Array of chain IDs  
**Reverts**: None  
**Gas**: ~3,000  
**Example**:
```solidity
uint256[] memory chains = factory.getBridgeChains();
console.log("Registered chains:", chains.length);
```

#### getFactoryStats

```solidity
function getFactoryStats() external view
    returns (
        uint256 totalVaultsDeployed,
        uint256 totalChainRegistered,
        uint256 totalRelayers
    )
```

**Purpose**: Get factory statistics  
**Parameters**: None  
**Returns**: Deployment and configuration stats  
**Reverts**: None  
**Gas**: ~5,000  
**Example**:
```solidity
(uint256 vaults, uint256 chains, uint256 relayers) = 
    factory.getFactoryStats();
console.log("Vaults:", vaults);
```

#### transferFactoryOwnership

```solidity
function transferFactoryOwnership(
    address newOwner
) external onlyOwner
```

**Purpose**: Transfer factory admin control  
**Parameters**:
- `newOwner`: New owner address

**Returns**: None  
**Events**: `OwnershipTransferred`  
**Reverts**:
- If caller not owner
- If newOwner is zero address

**Gas**: ~8,000  
**Example**:
```solidity
factory.transferFactoryOwnership(newAdminAddress);
```

---

## Gas Cost Summary

| Operation | Estimated Gas | Notes |
|-----------|---------------|-------|
| Deploy CrossChainGuardianProofService | 900,000 | One-time |
| Deploy MultiChainVault | 450,000 | Per vault (via proxy) |
| Deploy CrossChainMessageBridge | 750,000 | One-time |
| Deploy MultiChainVaultFactory | 600,000 | One-time |
| Submit Guardian Proof | 18,000 | Verification included |
| Remote Guardian Approval | 25,000 | Merkle verification |
| Local Guardian Approval | 18,000 | Signature verification |
| Execute Multi-Chain Withdrawal | 55,000 | + token transfer |
| Send Bridge Message (100 bytes) | 8,500 | + bridge fees |
| Receive Bridge Message | 12,000 | Relayer call |
| Configure Bridge | 45,000 | Per chain |

## Integration Examples

### Complete Flow Example

```solidity
// 1. Deploy contracts
address proofService = address(new CrossChainGuardianProofService());
address bridge = address(new CrossChainMessageBridge());
address factory = address(new MultiChainVaultFactory(proofService, bridge));

// 2. Register chains
factory.registerChainForBridge(1, relayer1, 0.1 ether, 0.001 ether);
factory.registerChainForBridge(137, relayer2, 0.05 ether, 0.0005 ether);

factory.registerGuardianProofChain(1, 2, 86400, [relayer1, relayer2]);
factory.registerGuardianProofChain(137, 2, 86400, [relayer2, relayer3]);

// 3. Create vault with guardians
address vault = factory.createMultiChainVaultWithGuardians(
    msg.sender,
    5,
    1,
    [1, 137],
    [guardian1, guardian2, guardian3],
    [0, 1, 1]
);

// 4. Deposit funds
IERC20(USDC).approve(vault, 1000e6);
IMultiChainVault(vault).deposit(USDC, 1000e6);

// 5. Propose withdrawal
uint256 wId = IMultiChainVault(vault).proposeMultiChainWithdrawal(
    USDC,
    100e6,
    recipientAddress,
    "Payment",
    [1, 137]
);

// 6. Get approvals
GuardianProof memory proof = GuardianProof({
    chainId: 1,
    guardianToken: SBT_ON_ETH,
    guardian: guardian2,
    tokenId: 42,
    proofTimestamp: block.timestamp - 3600,
    merkleRoot: storedRoot,
    merklePath: [proof1, proof2]
});

IMultiChainVault(vault).approveWithRemoteGuardian(wId, guardian2, 1, merklePath);

// 7. Execute
IMultiChainVault(vault).executeMultiChainWithdrawal(wId);
```

---

## Complete API Summary

**Total Functions**: 60+  
**Total Events**: 18+  
**Total Structs**: 9  
**Total Enums**: 2  
**Production Code**: 1,540 lines  

**Feature #20 Status**: ✅ COMPLETE with full API documentation
