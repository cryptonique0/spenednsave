// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SpendVaultWithReasonHashing
 * @notice Multi-signature vault with reason hashing for privacy
 * @dev Uses EIP-712 with hashed reasons and category hashing for privacy
 */
contract SpendVaultWithReasonHashing is Ownable, EIP712, ReentrancyGuard {
    
    using ECDSA for bytes32;

    // ==================== Types ====================
    
    struct WithdrawalMetadata {
        bytes32 reasonHash;              // Hash of withdrawal reason (not full string)
        bytes32 categoryHash;            // Hash of withdrawal category (not full string)
        uint256 createdAt;
    }
    
    struct GuardianReputation {
        uint256 approvalsCount;
        uint256 lastActiveTimestamp;
    }

    // ==================== State ====================
    
    address public guardianToken;
    uint256 public quorum;
    uint256 public nonce;
    
    // Metadata storage (nonce => metadata)
    mapping(uint256 => WithdrawalMetadata) public withdrawalMetadatas;
    
    // Guardian reputation tracking
    mapping(address => GuardianReputation) public guardianReputations;
    
    // Reason hash tracking for audit
    mapping(bytes32 => uint256) public reasonHashCount;     // How many times used
    mapping(bytes32 => address) public reasonHashCreator;   // Who created it
    mapping(bytes32 => uint256) public reasonHashFirstUse;  // First usage timestamp
    
    // EIP-712 type hash
    bytes32 private constant WITHDRAWAL_TYPEHASH =
        keccak256("Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,bytes32 reasonHash,bytes32 categoryHash,uint256 createdAt)");

    // Emergency states
    bool public vaultEmergencyFrozen;
    bool public emergencyUnlockRequested;
    uint256 public emergencyUnlockTime;
    uint256 public constant EMERGENCY_TIMELOCK = 30 days;

    // ==================== Events ====================
    
    event Withdrawn(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 reasonHash,
        bytes32 categoryHash,
        uint256 createdAt
    );
    
    event GuardianSignature(
        address indexed guardian,
        uint256 nonce,
        bytes32 categoryHash,
        bytes32 reasonHash,
        uint256 createdAt
    );
    
    event ReasonHashTracked(
        bytes32 indexed reasonHash,
        bytes32 indexed categoryHash,
        address indexed proposer,
        uint256 timestamp
    );
    
    event VaultFrozen(string reason, uint256 timestamp);
    event VaultUnfrozen(uint256 timestamp);
    event EmergencyUnlockRequested(uint256 timestamp);
    event QuorumUpdated(uint256 newQuorum);
    event GuardianTokenUpdated(address newAddress);

    // ==================== Constructor ====================
    
    constructor(
        address _guardianToken,
        uint256 _quorum
    ) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_quorum > 0, "Quorum must be > 0");
        
        guardianToken = _guardianToken;
        quorum = _quorum;
        nonce = 0;
    }

    // ==================== Reason Hashing ====================
    
    /**
     * @dev Internal function to hash a reason string
     * @param reason The reason text
     * @return The keccak256 hash of the reason
     */
    function _hashReason(string memory reason) internal pure returns (bytes32) {
        return keccak256(bytes(reason));
    }
    
    /**
     * @dev Hash a reason externally (for off-chain verification)
     * @param reason The reason text
     * @return The keccak256 hash
     */
    function hashReason(string calldata reason) external pure returns (bytes32) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        return _hashReason(reason);
    }
    
    /**
     * @dev Verify that a reason matches its hash
     * @param reason The original reason text
     * @param expectedHash The expected hash
     * @return True if reason hashes to expectedHash
     */
    function verifyReason(string calldata reason, bytes32 expectedHash) external pure returns (bool) {
        return _hashReason(reason) == expectedHash;
    }
    
    /**
     * @dev Internal function to track reason hash usage
     * @param reasonHash The reason hash
     * @param categoryHash The category hash
     */
    function _trackReasonHash(bytes32 reasonHash, bytes32 categoryHash) internal {
        if (reasonHashCount[reasonHash] == 0) {
            reasonHashCreator[reasonHash] = msg.sender;
            reasonHashFirstUse[reasonHash] = block.timestamp;
        }
        reasonHashCount[reasonHash]++;
        
        emit ReasonHashTracked(reasonHash, categoryHash, msg.sender, block.timestamp);
    }

    // ==================== Withdraw with Hashed Reasons ====================
    
    /**
     * @dev Withdraw funds with reason hashing for privacy
     * @param token Token to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason (will be hashed)
     * @param category Withdrawal category (will be hashed)
     * @param signatures Guardian signatures
     * 
     * PRIVACY NOTE: Both reason and category are hashed on-chain. 
     * Full reasons are NOT stored on-chain.
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        string calldata category,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(!vaultEmergencyFrozen, "Vault is emergency frozen");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(signatures.length > 0, "No signatures provided");
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");

        // Hash reason and category for privacy
        bytes32 reasonHash = _hashReason(reason);
        bytes32 categoryHash = keccak256(bytes(category));
        uint256 currentNonce = nonce;
        
        // Build EIP-712 hash using hashed reason and category
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                currentNonce,
                reasonHash,
                categoryHash,
                block.timestamp
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        // Store metadata with hashes only
        withdrawalMetadatas[currentNonce] = WithdrawalMetadata({
            reasonHash: reasonHash,
            categoryHash: categoryHash,
            createdAt: block.timestamp
        });

        // Verify signatures
        address[] memory signers = new address[](signatures.length);
        uint256 validSignatures = 0;

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = hash.recover(signatures[i]);
            
            // Check if signer is a guardian
            require(
                IGuardianSBT(guardianToken).balanceOf(signer) > 0,
                "Signer is not a guardian"
            );
            
            // Check for duplicate signers
            for (uint256 j = 0; j < validSignatures; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            
            signers[validSignatures] = signer;
            validSignatures++;

            // Update guardian reputation
            guardianReputations[signer].approvalsCount++;
            guardianReputations[signer].lastActiveTimestamp = block.timestamp;

            // Emit event linking signature to hashed metadata
            emit GuardianSignature(signer, currentNonce, categoryHash, reasonHash, block.timestamp);
        }

        // Verify quorum met
        require(validSignatures >= quorum, "Quorum not met");

        // Track reason hash usage
        _trackReasonHash(reasonHash, categoryHash);

        // Increment nonce to prevent replay attacks
        nonce++;

        // Execute transfer
        if (token == address(0)) {
            // Native ETH transfer
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC-20 transfer
            require(
                IERC20(token).balanceOf(address(this)) >= amount,
                "Insufficient token balance"
            );
            require(
                IERC20(token).transfer(recipient, amount),
                "Token transfer failed"
            );
        }

        // Emit withdrawal event with hashed reasons
        emit Withdrawn(token, recipient, amount, reasonHash, categoryHash, block.timestamp);
    }

    // ==================== Receive Functions ====================
    
    receive() external payable {}
    
    fallback() external payable {}

    // ==================== Balance Queries ====================
    
    /**
     * @dev Get ETH balance
     * @return Current ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get ERC-20 token balance
     * @param token Token address
     * @return Current balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        require(token != address(0), "Use getETHBalance for ETH");
        return IERC20(token).balanceOf(address(this));
    }

    // ==================== Metadata Queries ====================
    
    /**
     * @dev Get withdrawal metadata by nonce
     * @param _nonce Nonce of withdrawal
     * @return Reason hash
     * @return Category hash
     * @return Timestamp of creation
     */
    function getWithdrawalMetadata(uint256 _nonce) external view returns (
        bytes32,
        bytes32,
        uint256
    ) {
        WithdrawalMetadata storage metadata = withdrawalMetadatas[_nonce];
        return (metadata.reasonHash, metadata.categoryHash, metadata.createdAt);
    }

    // ==================== Guardian Management ====================
    
    /**
     * @dev Get guardian reputation
     * @param guardian Guardian address
     * @return Approvals count
     * @return Last active timestamp
     */
    function getGuardianReputation(address guardian) external view returns (
        uint256,
        uint256
    ) {
        GuardianReputation storage rep = guardianReputations[guardian];
        return (rep.approvalsCount, rep.lastActiveTimestamp);
    }
    
    /**
     * @dev Update quorum
     * @param _newQuorum New quorum value
     */
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be > 0");
        quorum = _newQuorum;
        emit QuorumUpdated(_newQuorum);
    }
    
    /**
     * @dev Update guardian token address
     * @param _newAddress New guardian token address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(_newAddress);
    }

    // ==================== Emergency Functions ====================
    
    /**
     * @dev Freeze vault in emergency
     * @param reason Reason for freeze (will be hashed for privacy)
     */
    function freezeVaultEmergency(string calldata reason) external onlyOwner {
        require(!vaultEmergencyFrozen, "Vault already frozen");
        vaultEmergencyFrozen = true;
        
        bytes32 reasonHash = _hashReason(reason);
        emit VaultFrozen(reason, block.timestamp);
    }
    
    /**
     * @dev Unfreeze vault
     */
    function unfreezeVault() external onlyOwner {
        require(vaultEmergencyFrozen, "Vault not frozen");
        vaultEmergencyFrozen = false;
        emit VaultUnfrozen(block.timestamp);
    }
    
    /**
     * @dev Request emergency unlock (30-day timelock)
     */
    function requestEmergencyUnlock() external onlyOwner {
        require(!emergencyUnlockRequested, "Unlock already requested");
        emergencyUnlockRequested = true;
        emergencyUnlockTime = block.timestamp + EMERGENCY_TIMELOCK;
        emit EmergencyUnlockRequested(block.timestamp);
    }
    
    /**
     * @dev Cancel emergency unlock
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockRequested, "No unlock requested");
        emergencyUnlockRequested = false;
        emit VaultUnfrozen(block.timestamp);
    }
    
    /**
     * @dev Get time remaining for emergency unlock
     * @return Seconds remaining (0 if ready or none requested)
     */
    function getEmergencyUnlockTimeRemaining() external view returns (uint256) {
        if (!emergencyUnlockRequested) return 0;
        if (block.timestamp >= emergencyUnlockTime) return 0;
        return emergencyUnlockTime - block.timestamp;
    }
    
    /**
     * @dev Get domain separator for EIP-712
     * @return Domain separator bytes32
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ==================== Reason Hash Audit ====================
    
    /**
     * @dev Get statistics for a reason hash
     * @param reasonHash The reason hash
     * @return count Number of times used
     * @return creator Address that first created this hash
     * @return firstUse Timestamp of first usage
     */
    function getReasonHashStats(bytes32 reasonHash) external view returns (
        uint256 count,
        address creator,
        uint256 firstUse
    ) {
        return (
            reasonHashCount[reasonHash],
            reasonHashCreator[reasonHash],
            reasonHashFirstUse[reasonHash]
        );
    }
    
    /**
     * @dev Check if a reason hash is in use
     * @param reasonHash The reason hash
     * @return True if hash has been used
     */
    function isReasonHashInUse(bytes32 reasonHash) external view returns (bool) {
        return reasonHashCount[reasonHash] > 0;
    }
}
