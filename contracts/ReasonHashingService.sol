// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReasonHashingService
 * @dev Utility contract for hashing and verifying withdrawal reasons
 * 
 * Purpose:
 * - Store only reason hashes on-chain for privacy
 * - Provide verification mechanism for off-chain reason matching
 * - Enable audit trail without exposing sensitive reason data
 * 
 * Features:
 * - Hash withdrawal reasons with optional metadata
 * - Verify reason hashes match original reason
 * - Track reason hash history per vault
 * - Support for reason categories
 */

contract ReasonHashingService {
    
    // ==================== Types ====================
    
    /**
     * @dev Reason with metadata
     */
    struct ReasonData {
        bytes32 reasonHash;        // keccak256 hash of reason
        bytes32 categoryHash;      // keccak256 hash of category (optional)
        uint256 timestamp;         // When hash was created
        address proposer;          // Who proposed this
        bool verified;             // Whether reason has been verified
    }
    
    // ==================== State ====================
    
    // reasonHash => ReasonData (for global lookup)
    mapping(bytes32 => ReasonData) public reasonRegistry;
    
    // vault => reasonHash[] (history per vault)
    mapping(address => bytes32[]) public vaultReasonHistory;
    
    // vault => reasonHash => count (track frequency)
    mapping(address => mapping(bytes32 => uint256)) public reasonFrequency;
    
    // Global count of unique reason hashes
    uint256 public totalUniqueReasons;
    
    // ==================== Events ====================
    
    event ReasonHashed(
        bytes32 indexed reasonHash,
        address indexed proposer,
        address indexed vault,
        uint256 timestamp
    );
    
    event ReasonVerified(
        bytes32 indexed reasonHash,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    
    event ReasonCategoryTagged(
        bytes32 indexed reasonHash,
        bytes32 indexed categoryHash,
        string category,
        uint256 timestamp
    );

    // ==================== Main Functions ====================
    
    /**
     * @dev Hash a withdrawal reason for privacy storage
     * @param reason The withdrawal reason text
     * @return reasonHash The keccak256 hash of the reason
     */
    function hashReason(string calldata reason) external pure returns (bytes32) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        return keccak256(bytes(reason));
    }
    
    /**
     * @dev Hash a reason with category for better tracking
     * @param reason The withdrawal reason text
     * @param category The category of withdrawal
     * @return reasonHash The keccak256 hash of the reason
     * @return categoryHash The keccak256 hash of the category
     */
    function hashReasonWithCategory(
        string calldata reason,
        string calldata category
    ) external pure returns (bytes32 reasonHash, bytes32 categoryHash) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        
        reasonHash = keccak256(bytes(reason));
        categoryHash = keccak256(bytes(category));
    }
    
    /**
     * @dev Register a hashed reason for tracking
     * @param reasonHash Hash of the reason
     * @param vault Vault address
     */
    function registerReasonHash(bytes32 reasonHash, address vault) external {
        require(reasonHash != bytes32(0), "Invalid reason hash");
        require(vault != address(0), "Invalid vault");
        
        // Initialize if new
        if (reasonRegistry[reasonHash].timestamp == 0) {
            reasonRegistry[reasonHash].timestamp = block.timestamp;
            reasonRegistry[reasonHash].proposer = msg.sender;
            totalUniqueReasons++;
        }
        
        // Add to vault history
        vaultReasonHistory[vault].push(reasonHash);
        reasonFrequency[vault][reasonHash]++;
        
        emit ReasonHashed(reasonHash, msg.sender, vault, block.timestamp);
    }
    
    /**
     * @dev Register reason hash with category
     * @param reasonHash Hash of the reason
     * @param categoryHash Hash of the category
     * @param category Category string (for logging)
     * @param vault Vault address
     */
    function registerReasonHashWithCategory(
        bytes32 reasonHash,
        bytes32 categoryHash,
        string calldata category,
        address vault
    ) external {
        require(reasonHash != bytes32(0), "Invalid reason hash");
        require(categoryHash != bytes32(0), "Invalid category hash");
        require(vault != address(0), "Invalid vault");
        
        // Initialize reason if new
        if (reasonRegistry[reasonHash].timestamp == 0) {
            reasonRegistry[reasonHash].timestamp = block.timestamp;
            reasonRegistry[reasonHash].proposer = msg.sender;
            totalUniqueReasons++;
        }
        
        // Set category
        reasonRegistry[reasonHash].categoryHash = categoryHash;
        
        // Add to vault history
        vaultReasonHistory[vault].push(reasonHash);
        reasonFrequency[vault][reasonHash]++;
        
        emit ReasonHashed(reasonHash, msg.sender, vault, block.timestamp);
        emit ReasonCategoryTagged(reasonHash, categoryHash, category, block.timestamp);
    }
    
    /**
     * @dev Verify a reason matches its hash (off-chain reason must be provided)
     * @param reason The original reason text
     * @param expectedHash The hash to verify against
     * @return isValid True if reason hashes to expectedHash
     */
    function verifyReason(string calldata reason, bytes32 expectedHash) external pure returns (bool) {
        return keccak256(bytes(reason)) == expectedHash;
    }
    
    /**
     * @dev Verify reason and category hashes
     * @param reason The original reason text
     * @param category The original category text
     * @param expectedReasonHash The hash to verify against
     * @param expectedCategoryHash The category hash to verify against
     * @return isValid True if both hashes match
     */
    function verifyReasonAndCategory(
        string calldata reason,
        string calldata category,
        bytes32 expectedReasonHash,
        bytes32 expectedCategoryHash
    ) external pure returns (bool) {
        return keccak256(bytes(reason)) == expectedReasonHash &&
               keccak256(bytes(category)) == expectedCategoryHash;
    }

    // ==================== Query Functions ====================
    
    /**
     * @dev Get reason data for a hash
     * @param reasonHash The reason hash
     * @return reasonHash The stored hash
     * @return categoryHash The category hash (if set)
     * @return timestamp When it was registered
     * @return proposer Who proposed it
     * @return verified Whether it's been verified
     */
    function getReasonData(bytes32 reasonHash) external view returns (
        bytes32,
        bytes32,
        uint256,
        address,
        bool
    ) {
        ReasonData storage data = reasonRegistry[reasonHash];
        return (
            reasonHash,
            data.categoryHash,
            data.timestamp,
            data.proposer,
            data.verified
        );
    }
    
    /**
     * @dev Get reason history for vault
     * @param vault Vault address
     * @return Array of reason hashes for vault
     */
    function getVaultReasonHistory(address vault) external view returns (bytes32[] memory) {
        return vaultReasonHistory[vault];
    }
    
    /**
     * @dev Get reason history length for vault
     * @param vault Vault address
     * @return Length of reason history
     */
    function getVaultReasonHistoryLength(address vault) external view returns (uint256) {
        return vaultReasonHistory[vault].length;
    }
    
    /**
     * @dev Get reason history for vault with pagination
     * @param vault Vault address
     * @param offset Starting index
     * @param limit Number of items to return
     * @return Array of reason hashes
     */
    function getVaultReasonHistoryPaginated(
        address vault,
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        bytes32[] storage history = vaultReasonHistory[vault];
        uint256 length = history.length;
        
        require(offset < length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > length) {
            end = length;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = 0; i < end - offset; i++) {
            result[i] = history[offset + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get frequency of a reason hash for a vault
     * @param vault Vault address
     * @param reasonHash Reason hash
     * @return Number of times this reason hash was used
     */
    function getReasonFrequency(address vault, bytes32 reasonHash) external view returns (uint256) {
        return reasonFrequency[vault][reasonHash];
    }
    
    /**
     * @dev Get total reason hashes registered for a vault
     * @param vault Vault address
     * @return Total count including duplicates
     */
    function getTotalReasonsForVault(address vault) external view returns (uint256) {
        return vaultReasonHistory[vault].length;
    }

    // ==================== Privacy Helpers ====================
    
    /**
     * @dev Check if a reason hash exists in registry
     * @param reasonHash The reason hash to check
     * @return True if hash is in registry
     */
    function isReasonHashRegistered(bytes32 reasonHash) external view returns (bool) {
        return reasonRegistry[reasonHash].timestamp != 0;
    }
    
    /**
     * @dev Check if reason hash was used by vault
     * @param vault Vault address
     * @param reasonHash Reason hash to check
     * @return True if vault has used this reason hash
     */
    function didVaultUseReason(address vault, bytes32 reasonHash) external view returns (bool) {
        return reasonFrequency[vault][reasonHash] > 0;
    }
    
    /**
     * @dev Get time since reason hash was first registered
     * @param reasonHash The reason hash
     * @return Seconds elapsed since registration (0 if not registered)
     */
    function getReasonHashAge(bytes32 reasonHash) external view returns (uint256) {
        uint256 timestamp = reasonRegistry[reasonHash].timestamp;
        if (timestamp == 0) return 0;
        return block.timestamp - timestamp;
    }
}
