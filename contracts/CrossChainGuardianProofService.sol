// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CrossChainGuardianProofService
 * @notice Service for validating guardian proofs from other chains via message bridges
 * @dev Enables multi-chain vault operations with remote guardian verification
 */

contract CrossChainGuardianProofService is ReentrancyGuard {
    /// @notice Guardian proof structure for cross-chain validation
    struct GuardianProof {
        uint256 chainId;                    // Source chain ID
        address guardianToken;              // Guardian SBT on source chain
        address guardian;                   // Guardian address
        uint256 tokenId;                    // Guardian token ID
        uint256 proofTimestamp;             // When proof was generated
        bytes32 merkleRoot;                 // Root of guardian state tree
        bytes32[] merklePath;               // Proof path from leaf to root
    }

    /// @notice Cross-chain message structure
    struct CrossChainMessage {
        uint256 messageId;                  // Unique message identifier
        uint256 sourceChainId;              // Source chain
        uint256 destinationChainId;         // Destination chain
        address sender;                     // Message sender
        bytes payload;                      // Message payload
        uint256 timestamp;                  // Message timestamp
        MessageStatus status;               // Message status
    }

    /// @notice Guardian state snapshot from another chain
    struct GuardianStateSnapshot {
        uint256 chainId;                    // Chain ID
        uint256 blockNumber;                // Block number when snapshot taken
        bytes32 merkleRoot;                 // Root of guardian state tree
        address[] guardians;                // Guardian addresses in snapshot
        uint256 timestamp;                  // Snapshot timestamp
        bool isVerified;                    // Verified by bridge relayers
    }

    /// @notice Message status enum
    enum MessageStatus {
        PENDING,
        RECEIVED,
        VERIFIED,
        EXECUTED,
        FAILED
    }

    /// @notice Bridge relayer configuration
    struct BridgeConfig {
        uint256 requiredConfirmations;      // Confirmations needed for message
        uint256 messageTimeout;             // Message expiry time (seconds)
        address[] relayers;                 // Authorized relayers
        bool isActive;                      // Bridge active status
    }

    // State variables
    mapping(uint256 => BridgeConfig) public bridgeConfigs;
    mapping(uint256 => GuardianStateSnapshot) public guardianSnapshots;
    mapping(uint256 => CrossChainMessage) public messages;
    mapping(uint256 => mapping(address => bool)) public messageConfirmations;
    mapping(uint256 => uint256) public confirmationCounts;

    uint256 public nextMessageId = 1;
    uint256 public nextSnapshotId = 1;

    // Events
    event BridgeConfigured(uint256 indexed chainId, uint256 requiredConfirmations, uint256 messageTimeout);
    event GuardianProofSubmitted(address indexed guardian, uint256 indexed sourceChainId, bytes32 merkleRoot);
    event GuardianProofVerified(address indexed guardian, uint256 indexed sourceChainId, bool isValid);
    event CrossChainMessageReceived(uint256 indexed messageId, uint256 sourceChainId, address sender);
    event CrossChainMessageVerified(uint256 indexed messageId, uint256 confirmations);
    event GuardianStateSnapshotReceived(uint256 indexed snapshotId, uint256 indexed chainId, bytes32 merkleRoot);
    event RelayerAdded(uint256 indexed chainId, address indexed relayer);
    event RelayerRemoved(uint256 indexed chainId, address indexed relayer);

    // Modifiers
    modifier onlyAuthorizedRelayer(uint256 chainId) {
        BridgeConfig memory config = bridgeConfigs[chainId];
        bool isRelayer = false;
        for (uint256 i = 0; i < config.relayers.length; i++) {
            if (config.relayers[i] == msg.sender) {
                isRelayer = true;
                break;
            }
        }
        require(isRelayer, "Unauthorized relayer");
        _;
    }

    // Bridge Configuration

    /// @notice Configure bridge for a chain
    function configureBridge(
        uint256 chainId,
        uint256 requiredConfirmations,
        uint256 messageTimeout,
        address[] calldata initialRelayers
    ) external {
        require(chainId != 0, "Invalid chain ID");
        require(requiredConfirmations > 0, "Invalid confirmations");
        require(messageTimeout > 0, "Invalid timeout");

        bridgeConfigs[chainId] = BridgeConfig({
            requiredConfirmations: requiredConfirmations,
            messageTimeout: messageTimeout,
            relayers: initialRelayers,
            isActive: true
        });

        emit BridgeConfigured(chainId, requiredConfirmations, messageTimeout);
    }

    /// @notice Add relayer to bridge
    function addRelayer(uint256 chainId, address relayer) external {
        require(relayer != address(0), "Invalid relayer");
        BridgeConfig storage config = bridgeConfigs[chainId];
        require(config.isActive, "Bridge not configured");

        // Check if already relayer
        for (uint256 i = 0; i < config.relayers.length; i++) {
            require(config.relayers[i] != relayer, "Relayer already added");
        }

        config.relayers.push(relayer);
        emit RelayerAdded(chainId, relayer);
    }

    /// @notice Remove relayer from bridge
    function removeRelayer(uint256 chainId, address relayer) external {
        BridgeConfig storage config = bridgeConfigs[chainId];
        require(config.isActive, "Bridge not configured");

        for (uint256 i = 0; i < config.relayers.length; i++) {
            if (config.relayers[i] == relayer) {
                config.relayers[i] = config.relayers[config.relayers.length - 1];
                config.relayers.pop();
                emit RelayerRemoved(chainId, relayer);
                return;
            }
        }

        revert("Relayer not found");
    }

    // Guardian Proof Validation

    /// @notice Verify guardian proof with Merkle tree
    function verifyGuardianProof(GuardianProof calldata proof) external nonReentrant returns (bool) {
        require(proof.chainId != 0, "Invalid chain ID");
        require(proof.guardian != address(0), "Invalid guardian");
        require(bridgeConfigs[proof.chainId].isActive, "Bridge not configured");

        // Get guardian state snapshot for chain
        uint256 snapshotId = _getLatestSnapshotForChain(proof.chainId);
        require(snapshotId > 0, "No snapshot for chain");

        GuardianStateSnapshot memory snapshot = guardianSnapshots[snapshotId];
        require(snapshot.isVerified, "Snapshot not verified");
        require(snapshot.merkleRoot == proof.merkleRoot, "Root mismatch");

        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(proof.guardian, proof.tokenId));
        bool isValid = MerkleProof.verify(proof.merklePath, proof.merkleRoot, leaf);

        if (isValid) {
            emit GuardianProofVerified(proof.guardian, proof.chainId, true);
        } else {
            emit GuardianProofVerified(proof.guardian, proof.chainId, false);
        }

        return isValid;
    }

    /// @notice Submit guardian proof from another chain
    function submitGuardianProof(GuardianProof calldata proof) external {
        require(proof.chainId != 0, "Invalid chain ID");
        require(proof.guardian != address(0), "Invalid guardian");

        emit GuardianProofSubmitted(proof.guardian, proof.chainId, proof.merkleRoot);
    }

    // Cross-Chain Message Handling

    /// @notice Receive cross-chain message
    function receiveMessage(
        uint256 messageId,
        uint256 sourceChainId,
        address sender,
        bytes calldata payload
    ) external onlyAuthorizedRelayer(sourceChainId) {
        require(messageId > 0, "Invalid message ID");
        require(sourceChainId != 0, "Invalid source chain");
        require(sender != address(0), "Invalid sender");

        CrossChainMessage memory msg = CrossChainMessage({
            messageId: messageId,
            sourceChainId: sourceChainId,
            destinationChainId: block.chainid,
            sender: sender,
            payload: payload,
            timestamp: block.timestamp,
            status: MessageStatus.RECEIVED
        });

        messages[messageId] = msg;
        emit CrossChainMessageReceived(messageId, sourceChainId, sender);
    }

    /// @notice Confirm cross-chain message by relayer
    function confirmMessage(uint256 messageId) external onlyAuthorizedRelayer(messages[messageId].sourceChainId) {
        require(messages[messageId].timestamp > 0, "Message not found");
        require(!messageConfirmations[messageId][msg.sender], "Already confirmed");

        CrossChainMessage storage msg = messages[messageId];
        BridgeConfig memory config = bridgeConfigs[msg.sourceChainId];

        messageConfirmations[messageId][msg.sender] = true;
        confirmationCounts[messageId]++;

        // Check if quorum reached
        if (confirmationCounts[messageId] >= config.requiredConfirmations) {
            msg.status = MessageStatus.VERIFIED;
            emit CrossChainMessageVerified(messageId, confirmationCounts[messageId]);
        }
    }

    /// @notice Get message verification status
    function isMessageVerified(uint256 messageId) external view returns (bool) {
        return messages[messageId].status == MessageStatus.VERIFIED;
    }

    /// @notice Get message confirmations count
    function getMessageConfirmations(uint256 messageId) external view returns (uint256) {
        return confirmationCounts[messageId];
    }

    /// @notice Mark message as executed
    function markMessageExecuted(uint256 messageId) external {
        require(messages[messageId].status == MessageStatus.VERIFIED, "Message not verified");
        messages[messageId].status = MessageStatus.EXECUTED;
    }

    // Guardian State Snapshots

    /// @notice Submit guardian state snapshot from another chain
    function submitGuardianStateSnapshot(
        uint256 chainId,
        uint256 blockNumber,
        bytes32 merkleRoot,
        address[] calldata guardians
    ) external onlyAuthorizedRelayer(chainId) {
        require(chainId != 0, "Invalid chain ID");
        require(blockNumber > 0, "Invalid block number");
        require(merkleRoot != bytes32(0), "Invalid root");
        require(guardians.length > 0, "No guardians");

        GuardianStateSnapshot memory snapshot = GuardianStateSnapshot({
            chainId: chainId,
            blockNumber: blockNumber,
            merkleRoot: merkleRoot,
            guardians: guardians,
            timestamp: block.timestamp,
            isVerified: false
        });

        guardianSnapshots[nextSnapshotId] = snapshot;
        emit GuardianStateSnapshotReceived(nextSnapshotId, chainId, merkleRoot);

        nextSnapshotId++;
    }

    /// @notice Verify guardian state snapshot
    function verifyGuardianStateSnapshot(uint256 snapshotId) external {
        GuardianStateSnapshot storage snapshot = guardianSnapshots[snapshotId];
        require(snapshot.timestamp > 0, "Snapshot not found");

        snapshot.isVerified = true;
    }

    /// @notice Get latest snapshot for chain
    function getLatestSnapshotForChain(uint256 chainId) external view returns (uint256) {
        return _getLatestSnapshotForChain(chainId);
    }

    /// @notice Get guardian state snapshot
    function getSnapshot(uint256 snapshotId) external view returns (GuardianStateSnapshot memory) {
        return guardianSnapshots[snapshotId];
    }

    // Query Functions

    /// @notice Get bridge configuration
    function getBridgeConfig(uint256 chainId) external view returns (BridgeConfig memory) {
        return bridgeConfigs[chainId];
    }

    /// @notice Get bridge relayers
    function getBridgeRelayers(uint256 chainId) external view returns (address[] memory) {
        return bridgeConfigs[chainId].relayers;
    }

    /// @notice Check if address is relayer for chain
    function isRelayer(uint256 chainId, address account) external view returns (bool) {
        BridgeConfig memory config = bridgeConfigs[chainId];
        for (uint256 i = 0; i < config.relayers.length; i++) {
            if (config.relayers[i] == account) {
                return true;
            }
        }
        return false;
    }

    /// @notice Get message by ID
    function getMessage(uint256 messageId) external view returns (CrossChainMessage memory) {
        return messages[messageId];
    }

    /// @notice Get cross-chain message status
    function getMessageStatus(uint256 messageId) external view returns (MessageStatus) {
        return messages[messageId].status;
    }

    /// @notice Check if relayer confirmed message
    function hasRelayerConfirmed(uint256 messageId, address relayer) external view returns (bool) {
        return messageConfirmations[messageId][relayer];
    }

    // Internal Functions

    /// @notice Get latest snapshot for chain (internal)
    function _getLatestSnapshotForChain(uint256 chainId) internal view returns (uint256) {
        uint256 latestId = 0;
        uint256 latestTimestamp = 0;

        for (uint256 i = 1; i < nextSnapshotId; i++) {
            if (guardianSnapshots[i].chainId == chainId && guardianSnapshots[i].timestamp > latestTimestamp) {
                latestId = i;
                latestTimestamp = guardianSnapshots[i].timestamp;
            }
        }

        return latestId;
    }

    /// @notice Hash guardian data for Merkle tree
    function hashGuardianData(address guardian, uint256 tokenId) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(guardian, tokenId));
    }

    /// @notice Verify Merkle proof (exposed for external use)
    function verifyMerkleProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) external pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    /// @notice Calculate Merkle root from leaves
    function calculateMerkleRoot(bytes32[] calldata leaves) external pure returns (bytes32) {
        if (leaves.length == 0) return bytes32(0);
        if (leaves.length == 1) return leaves[0];

        bytes32[] memory tree = new bytes32[](leaves.length);
        for (uint256 i = 0; i < leaves.length; i++) {
            tree[i] = leaves[i];
        }

        uint256 n = leaves.length;
        while (n > 1) {
            uint256 newN = 0;
            for (uint256 i = 0; i < n; i += 2) {
                bytes32 left = tree[i];
                bytes32 right = (i + 1 < n) ? tree[i + 1] : left;
                tree[newN] = keccak256(abi.encodePacked(left, right));
                newN++;
            }
            n = newN;
        }

        return tree[0];
    }

    /// @notice Get total snapshots
    function getTotalSnapshots() external view returns (uint256) {
        return nextSnapshotId - 1;
    }

    /// @notice Get snapshots for chain
    function getSnapshotsForChain(uint256 chainId) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextSnapshotId; i++) {
            if (guardianSnapshots[i].chainId == chainId) {
                count++;
            }
        }

        uint256[] memory results = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextSnapshotId; i++) {
            if (guardianSnapshots[i].chainId == chainId) {
                results[index] = i;
                index++;
            }
        }

        return results;
    }
}
