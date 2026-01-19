// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultPausingController
 * @dev Manages pause/unpause state for vaults with reason tracking and audit trail
 * 
 * Vault Pausing allows owners to temporarily pause withdrawals in response to:
 * - Security incidents
 * - Smart contract bugs
 * - Maintenance windows
 * - Market anomalies
 * - User disputes
 * 
 * While paused:
 * ✅ Deposits still work (funds can flow in)
 * ✅ Status queries work (read-only operations)
 * ❌ Withdrawals blocked (no funds out)
 * ❌ Emergency unlock blocked (if integrated)
 * 
 * This gives time to investigate issues without preventing users from adding funds.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultPausingController is Ownable {
    // ==================== State ====================
    
    /// @dev Pause state per vault
    mapping(address vault => bool) public isPausedVault;
    
    /// @dev Pause reason per vault (for audit trail)
    mapping(address vault => string) public pauseReason;
    
    /// @dev Pause timestamp per vault (when it was paused)
    mapping(address vault => uint256) public pauseTime;
    
    /// @dev Pause history per vault (for tracking all pause/unpause events)
    mapping(address vault => PauseEvent[]) public pauseHistory;
    
    /// @dev Track if vault is managed by this controller
    mapping(address vault => bool) public isManaged;

    struct PauseEvent {
        bool isPaused;
        string reason;
        uint256 timestamp;
        address initiator;
    }

    // ==================== Events ====================
    
    event VaultPaused(address indexed vault, string reason, uint256 timestamp);
    event VaultUnpaused(address indexed vault, string reason, uint256 timestamp);
    event VaultRegistered(address indexed vault, uint256 timestamp);
    event PauseReasonUpdated(address indexed vault, string oldReason, string newReason, uint256 timestamp);

    // ==================== Vault Management ====================
    
    /**
     * @dev Register a new vault with this controller
     * @param vault The vault address to manage
     */
    function registerVault(address vault) external onlyOwner {
        require(vault != address(0), "Invalid vault address");
        require(!isManaged[vault], "Vault already registered");

        isManaged[vault] = true;
        emit VaultRegistered(vault, block.timestamp);
    }

    // ==================== Pausing ====================
    
    /**
     * @dev Pause a vault (block withdrawals, allow deposits)
     * @param vault The vault to pause
     * @param reason Why the vault is being paused
     */
    function pauseVault(address vault, string calldata reason) external onlyOwner {
        require(isManaged[vault], "Vault not managed by this controller");
        require(!isPausedVault[vault], "Vault already paused");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        isPausedVault[vault] = true;
        pauseReason[vault] = reason;
        pauseTime[vault] = block.timestamp;

        // Record in history
        pauseHistory[vault].push(
            PauseEvent({
                isPaused: true,
                reason: reason,
                timestamp: block.timestamp,
                initiator: msg.sender
            })
        );

        emit VaultPaused(vault, reason, block.timestamp);
    }

    /**
     * @dev Unpause a vault (allow withdrawals again)
     * @param vault The vault to unpause
     * @param reason Why the vault is being unpaused (e.g., "Issue resolved")
     */
    function unpauseVault(address vault, string calldata reason) external onlyOwner {
        require(isManaged[vault], "Vault not managed by this controller");
        require(isPausedVault[vault], "Vault is not paused");
        require(bytes(reason).length > 0, "Reason cannot be empty");

        isPausedVault[vault] = false;
        pauseReason[vault] = reason;
        pauseTime[vault] = 0;

        // Record in history
        pauseHistory[vault].push(
            PauseEvent({
                isPaused: false,
                reason: reason,
                timestamp: block.timestamp,
                initiator: msg.sender
            })
        );

        emit VaultUnpaused(vault, reason, block.timestamp);
    }

    /**
     * @dev Update the pause reason (while still paused)
     * @param vault The vault to update
     * @param newReason The new reason
     */
    function updatePauseReason(address vault, string calldata newReason) external onlyOwner {
        require(isManaged[vault], "Vault not managed by this controller");
        require(isPausedVault[vault], "Vault is not paused");
        require(bytes(newReason).length > 0, "Reason cannot be empty");

        string memory oldReason = pauseReason[vault];
        pauseReason[vault] = newReason;

        emit PauseReasonUpdated(vault, oldReason, newReason, block.timestamp);
    }

    // ==================== Status & Views ====================
    
    /**
     * @dev Check if a vault is paused
     * @param vault The vault to check
     */
    function isPaused(address vault) external view returns (bool) {
        return isPausedVault[vault];
    }

    /**
     * @dev Get the pause reason for a vault
     * @param vault The vault to check
     */
    function getPauseReason(address vault) external view returns (string memory) {
        return pauseReason[vault];
    }

    /**
     * @dev Get the pause timestamp for a vault
     * @param vault The vault to check
     */
    function getPauseTime(address vault) external view returns (uint256) {
        return pauseTime[vault];
    }

    /**
     * @dev Get time elapsed since pause
     * @param vault The vault to check
     */
    function getPauseElapsedTime(address vault) external view returns (uint256) {
        uint256 pausedAt = pauseTime[vault];
        if (pausedAt == 0 || !isPausedVault[vault]) {
            return 0;
        }
        
        return block.timestamp - pausedAt;
    }

    /**
     * @dev Get total pause events for a vault
     * @param vault The vault to check
     */
    function getPauseEventCount(address vault) external view returns (uint256) {
        return pauseHistory[vault].length;
    }

    /**
     * @dev Get pause event by index
     * @param vault The vault to check
     * @param index Event index
     */
    function getPauseEvent(address vault, uint256 index) 
        external view returns (bool isPaused_, string memory reason, uint256 timestamp, address initiator) 
    {
        require(index < pauseHistory[vault].length, "Index out of bounds");
        
        PauseEvent memory event = pauseHistory[vault][index];
        return (event.isPaused, event.reason, event.timestamp, event.initiator);
    }

    /**
     * @dev Get all pause events for a vault
     * @param vault The vault to check
     */
    function getPauseHistory(address vault) external view returns (PauseEvent[] memory) {
        return pauseHistory[vault];
    }

    /**
     * @dev Check if a vault is managed
     * @param vault The vault to check
     */
    function isManagedVault(address vault) external view returns (bool) {
        return isManaged[vault];
    }
}
