// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuardianDelayController
 * @dev Manages delayed guardian activation with cooldown periods
 * 
 * Purpose:
 * - Delay guardian activation after addition
 * - Prevent immediate account compromise
 * - Allow time to detect malicious additions
 * - Cancel pending guardian additions if needed
 * - Track all guardian changes with timestamps
 * 
 * Security Model:
 * - Pending guardians cannot participate in voting
 * - Activation only after cooldown expires
 * - Owner can cancel pending additions
 * - Complete audit trail of all additions
 */

contract GuardianDelayController {
    
    // ==================== Types ====================
    
    enum GuardianStatus {
        NONE,           // 0 - Not a guardian
        PENDING,        // 1 - Added but not yet active
        ACTIVE,         // 2 - Active guardian
        REMOVING,       // 3 - Removal in progress
        REMOVED         // 4 - Removed
    }
    
    struct PendingGuardian {
        address guardian;
        address vault;
        uint256 addedAt;
        uint256 activationTime;
        GuardianStatus status;
        bool cancelled;
        string reason;  // Reason for addition (optional)
    }
    
    struct GuardianDelayConfig {
        address vault;
        uint256 guardianDelayDuration;  // Seconds until guardian active
        uint256 totalPendingGuardians;
        uint256 totalActiveGuardians;
        uint256 totalRemovedGuardians;
    }

    // ==================== State ====================
    
    uint256 public constant DEFAULT_GUARDIAN_DELAY = 7 days;  // Default 7 days
    uint256 public pendingGuardianCounter = 0;
    
    mapping(uint256 pendingId => PendingGuardian) public pendingGuardians;
    mapping(address vault => uint256) public vaultGuardianDelay;
    mapping(address vault => address[]) public vaultPendingGuardians;
    mapping(address vault => address[]) public vaultActiveGuardians;
    mapping(address vault => bool) public isManaged;
    mapping(address vault => uint256) public lastGuardianAddition;
    
    // Guardian status tracking per vault
    mapping(address vault => mapping(address guardian => GuardianStatus)) public guardianStatus;
    mapping(address vault => mapping(address guardian => uint256)) public guardianActivationTime;
    
    address[] public managedVaults;
    mapping(address => bool) public vaultExists;

    // ==================== Events ====================
    
    event VaultRegisteredForDelayedGuardians(
        address indexed vault,
        uint256 delayDuration,
        uint256 timestamp
    );
    
    event GuardianAdditionInitiated(
        uint256 indexed pendingId,
        address indexed vault,
        address indexed guardian,
        uint256 activationTime,
        string reason,
        uint256 timestamp
    );
    
    event GuardianBecameActive(
        uint256 indexed pendingId,
        address indexed vault,
        address indexed guardian,
        uint256 timestamp
    );
    
    event GuardianAdditionCancelled(
        uint256 indexed pendingId,
        address indexed vault,
        address indexed guardian,
        string reason,
        uint256 timestamp
    );
    
    event GuardianRemovalInitiated(
        address indexed vault,
        address indexed guardian,
        uint256 removalTime,
        uint256 timestamp
    );
    
    event GuardianRemoved(
        address indexed vault,
        address indexed guardian,
        uint256 timestamp
    );
    
    event GuardianDelayUpdated(
        address indexed vault,
        uint256 newDelay,
        uint256 timestamp
    );

    // ==================== Vault Registration ====================
    
    /**
     * @dev Register vault for delayed guardian management
     * @param vault Vault address
     * @param delayDuration Seconds until guardian becomes active
     */
    function registerVault(address vault, uint256 delayDuration) external {
        require(vault != address(0), "Invalid vault");
        require(!isManaged[vault], "Vault already registered");
        require(delayDuration > 0, "Delay must be > 0");
        
        managedVaults.push(vault);
        isManaged[vault] = true;
        vaultExists[vault] = true;
        vaultGuardianDelay[vault] = delayDuration;
        
        emit VaultRegisteredForDelayedGuardians(vault, delayDuration, block.timestamp);
    }

    // ==================== Guardian Addition ====================
    
    /**
     * @dev Initiate guardian addition with delay
     * @param vault Vault to add guardian to
     * @param guardian Guardian address to add
     * @param reason Reason for addition (optional)
     * @return pendingId ID of pending guardian addition
     * 
     * Requirements:
     * - Vault must be registered
     * - Guardian must not already be active
     * - Guardian must not be already pending
     */
    function initiateGuardianAddition(
        address vault,
        address guardian,
        string calldata reason
    ) external returns (uint256) {
        require(isManaged[vault], "Vault not registered");
        require(guardian != address(0), "Invalid guardian");
        
        GuardianStatus status = guardianStatus[vault][guardian];
        require(status != GuardianStatus.ACTIVE, "Guardian already active");
        require(status != GuardianStatus.PENDING, "Guardian addition already pending");
        
        uint256 pendingId = pendingGuardianCounter++;
        uint256 delayDuration = vaultGuardianDelay[vault];
        uint256 activationTime = block.timestamp + delayDuration;
        
        PendingGuardian storage pending = pendingGuardians[pendingId];
        pending.guardian = guardian;
        pending.vault = vault;
        pending.addedAt = block.timestamp;
        pending.activationTime = activationTime;
        pending.status = GuardianStatus.PENDING;
        pending.reason = reason;
        
        guardianStatus[vault][guardian] = GuardianStatus.PENDING;
        guardianActivationTime[vault][guardian] = activationTime;
        vaultPendingGuardians[vault].push(guardian);
        lastGuardianAddition[vault] = block.timestamp;
        
        emit GuardianAdditionInitiated(
            pendingId,
            vault,
            guardian,
            activationTime,
            reason,
            block.timestamp
        );
        
        return pendingId;
    }

    // ==================== Guardian Activation ====================
    
    /**
     * @dev Activate pending guardian after delay expires
     * @param pendingId ID of pending guardian
     * @param vault Vault address
     * 
     * Requirements:
     * - Pending guardian must exist
     * - Delay period must have expired
     * - Guardian must still be pending (not cancelled)
     */
    function activatePendingGuardian(uint256 pendingId, address vault) external {
        PendingGuardian storage pending = pendingGuardians[pendingId];
        
        require(pending.vault != address(0), "Pending guardian not found");
        require(pending.vault == vault, "Vault mismatch");
        require(pending.status == GuardianStatus.PENDING, "Not pending");
        require(!pending.cancelled, "Addition was cancelled");
        require(
            block.timestamp >= pending.activationTime,
            "Delay period not expired"
        );
        
        pending.status = GuardianStatus.ACTIVE;
        guardianStatus[vault][pending.guardian] = GuardianStatus.ACTIVE;
        
        // Add to active list
        vaultActiveGuardians[vault].push(pending.guardian);
        
        emit GuardianBecameActive(pendingId, vault, pending.guardian, block.timestamp);
    }

    // ==================== Guardian Cancellation ====================
    
    /**
     * @dev Cancel pending guardian addition
     * @param pendingId ID of pending guardian
     * @param reason Cancellation reason
     * 
     * Requirements:
     * - Pending guardian must exist
     * - Guardian must still be pending (not yet active)
     * - Only vault owner or initiator can cancel
     */
    function cancelPendingGuardian(uint256 pendingId, string calldata reason) external {
        PendingGuardian storage pending = pendingGuardians[pendingId];
        
        require(pending.vault != address(0), "Pending guardian not found");
        require(pending.status == GuardianStatus.PENDING, "Not pending");
        require(!pending.cancelled, "Already cancelled");
        require(
            block.timestamp < pending.activationTime,
            "Activation already occurred"
        );
        
        pending.cancelled = true;
        pending.status = GuardianStatus.REMOVED;
        guardianStatus[pending.vault][pending.guardian] = GuardianStatus.NONE;
        
        emit GuardianAdditionCancelled(
            pendingId,
            pending.vault,
            pending.guardian,
            reason,
            block.timestamp
        );
    }

    // ==================== Guardian Removal ====================
    
    /**
     * @dev Remove active guardian
     * @param vault Vault address
     * @param guardian Guardian to remove
     */
    function removeGuardian(address vault, address guardian) external {
        require(isManaged[vault], "Vault not registered");
        require(guardian != address(0), "Invalid guardian");
        
        GuardianStatus status = guardianStatus[vault][guardian];
        require(status == GuardianStatus.ACTIVE, "Guardian not active");
        
        guardianStatus[vault][guardian] = GuardianStatus.REMOVED;
        
        // Remove from active list
        address[] storage activeGuardians = vaultActiveGuardians[vault];
        for (uint256 i = 0; i < activeGuardians.length; i++) {
            if (activeGuardians[i] == guardian) {
                activeGuardians[i] = activeGuardians[activeGuardians.length - 1];
                activeGuardians.pop();
                break;
            }
        }
        
        emit GuardianRemoved(vault, guardian, block.timestamp);
    }

    // ==================== Query Functions ====================
    
    /**
     * @dev Check if guardian is active
     * @param vault Vault address
     * @param guardian Guardian address
     * @return True if guardian is active
     */
    function isGuardianActive(address vault, address guardian) external view returns (bool) {
        return guardianStatus[vault][guardian] == GuardianStatus.ACTIVE;
    }
    
    /**
     * @dev Check if guardian is pending
     * @param vault Vault address
     * @param guardian Guardian address
     * @return True if guardian is pending
     */
    function isGuardianPending(address vault, address guardian) external view returns (bool) {
        return guardianStatus[vault][guardian] == GuardianStatus.PENDING;
    }
    
    /**
     * @dev Get guardian status
     * @param vault Vault address
     * @param guardian Guardian address
     * @return Status enum value
     */
    function getGuardianStatus(address vault, address guardian) 
        external view returns (GuardianStatus) 
    {
        return guardianStatus[vault][guardian];
    }
    
    /**
     * @dev Get pending guardian details
     * @param pendingId Pending guardian ID
     * @return Pending guardian information
     */
    function getPendingGuardian(uint256 pendingId) 
        external view returns (PendingGuardian memory) 
    {
        require(pendingGuardians[pendingId].vault != address(0), "Not found");
        return pendingGuardians[pendingId];
    }
    
    /**
     * @dev Get time until guardian becomes active
     * @param vault Vault address
     * @param guardian Guardian address
     * @return Seconds remaining (0 if not pending or delay expired)
     */
    function getTimeUntilActive(address vault, address guardian) 
        external view returns (uint256) 
    {
        GuardianStatus status = guardianStatus[vault][guardian];
        if (status != GuardianStatus.PENDING) return 0;
        
        uint256 activationTime = guardianActivationTime[vault][guardian];
        if (block.timestamp >= activationTime) return 0;
        
        return activationTime - block.timestamp;
    }
    
    /**
     * @dev Check if guardian can participate in voting
     * @param vault Vault address
     * @param guardian Guardian address
     * @return True if active (can vote)
     */
    function canVote(address vault, address guardian) external view returns (bool) {
        return guardianStatus[vault][guardian] == GuardianStatus.ACTIVE;
    }
    
    /**
     * @dev Get all active guardians for vault
     * @param vault Vault address
     * @return Array of active guardian addresses
     */
    function getActiveGuardians(address vault) external view returns (address[] memory) {
        return vaultActiveGuardians[vault];
    }
    
    /**
     * @dev Get all pending guardians for vault
     * @param vault Vault address
     * @return Array of pending guardian addresses
     */
    function getPendingGuardians(address vault) external view returns (address[] memory) {
        return vaultPendingGuardians[vault];
    }
    
    /**
     * @dev Get active guardian count
     * @param vault Vault address
     * @return Number of active guardians
     */
    function getActiveGuardianCount(address vault) external view returns (uint256) {
        return vaultActiveGuardians[vault].length;
    }
    
    /**
     * @dev Get pending guardian count
     * @param vault Vault address
     * @return Number of pending guardians
     */
    function getPendingGuardianCount(address vault) external view returns (uint256) {
        return vaultPendingGuardians[vault].length;
    }
    
    /**
     * @dev Get vault delay configuration
     * @param vault Vault address
     * @return Configuration details
     */
    function getVaultConfig(address vault) 
        external view returns (GuardianDelayConfig memory) 
    {
        require(isManaged[vault], "Vault not registered");
        
        return GuardianDelayConfig({
            vault: vault,
            guardianDelayDuration: vaultGuardianDelay[vault],
            totalPendingGuardians: vaultPendingGuardians[vault].length,
            totalActiveGuardians: vaultActiveGuardians[vault].length,
            totalRemovedGuardians: 0  // Could track separately if needed
        });
    }
    
    /**
     * @dev Update vault delay duration
     * @param vault Vault address
     * @param newDelay New delay in seconds
     */
    function updateVaultDelay(address vault, uint256 newDelay) external {
        require(isManaged[vault], "Vault not registered");
        require(newDelay > 0, "Delay must be > 0");
        
        vaultGuardianDelay[vault] = newDelay;
        emit GuardianDelayUpdated(vault, newDelay, block.timestamp);
    }
    
    /**
     * @dev Get guardian activation time
     * @param vault Vault address
     * @param guardian Guardian address
     * @return Activation timestamp (0 if not pending)
     */
    function getActivationTime(address vault, address guardian) 
        external view returns (uint256) 
    {
        if (guardianStatus[vault][guardian] != GuardianStatus.PENDING) {
            return 0;
        }
        return guardianActivationTime[vault][guardian];
    }
    
    /**
     * @dev Get vault delay duration
     * @param vault Vault address
     * @return Delay in seconds
     */
    function getVaultDelay(address vault) external view returns (uint256) {
        require(isManaged[vault], "Vault not registered");
        return vaultGuardianDelay[vault];
    }
    
    /**
     * @dev Check if vault is managed
     * @param vault Vault address
     * @return True if registered
     */
    function isManagedVault(address vault) external view returns (bool) {
        return isManaged[vault];
    }
    
    /**
     * @dev Get total managed vaults
     * @return Count of vaults
     */
    function getManagedVaultCount() external view returns (uint256) {
        return managedVaults.length;
    }
    
    /**
     * @dev Get managed vault at index
     * @param index Index in vault list
     * @return Vault address
     */
    function getManagedVaultAt(uint256 index) external view returns (address) {
        require(index < managedVaults.length, "Index out of bounds");
        return managedVaults[index];
    }
    
    /**
     * @dev Get all managed vaults
     * @return Array of vault addresses
     */
    function getAllManagedVaults() external view returns (address[] memory) {
        return managedVaults;
    }
}
