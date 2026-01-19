// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SafeModeController
 * @notice Central service managing safe mode state for all vaults
 * @dev Restricts withdrawals to owner address when safe mode is enabled
 */

contract SafeModeController {
    /// @notice Safe mode configuration for a vault
    struct SafeModeConfig {
        bool enabled;                   // Safe mode active status
        address vault;                  // Associated vault
        address owner;                  // Vault owner
        uint256 enabledAt;             // Timestamp when enabled
        uint256 disabledAt;            // Timestamp when disabled
        string reason;                  // Reason for enabling/disabling
        uint256 totalToggles;          // Total number of toggles
    }

    /// @notice Vault to safe mode configuration mapping
    mapping(address => SafeModeConfig) public safeModeConfigs;

    /// @notice Vault to safe mode history array
    mapping(address => SafeModeHistory[]) public safeModeHistory;

    /// @notice Safe mode history entry
    struct SafeModeHistory {
        bool enabled;                   // Was it enabled or disabled
        uint256 timestamp;             // When toggle occurred
        string reason;                  // Reason for toggle
        address toggler;               // Who triggered toggle
    }

    /// @notice List of all managed vaults
    address[] public managedVaults;

    /// @notice Vault to index in managed vaults array
    mapping(address => uint256) public vaultIndex;

    /// @notice Is vault registered
    mapping(address => bool) public isRegistered;

    // Events
    event VaultRegisteredForSafeMode(
        address indexed vault,
        address indexed owner,
        uint256 timestamp
    );

    event SafeModeEnabled(
        address indexed vault,
        string reason,
        uint256 timestamp
    );

    event SafeModeDisabled(
        address indexed vault,
        string reason,
        uint256 timestamp
    );

    event SafeModeToggleRecorded(
        address indexed vault,
        bool enabled,
        string reason,
        address indexed toggler,
        uint256 timestamp
    );

    // Constructor
    constructor() {}

    // Core Functions

    /// @notice Register vault for safe mode management
    function registerVault(address vault, address owner) external {
        require(vault != address(0), "Invalid vault");
        require(owner != address(0), "Invalid owner");
        require(!isRegistered[vault], "Already registered");

        // Create safe mode config
        safeModeConfigs[vault] = SafeModeConfig({
            enabled: false,
            vault: vault,
            owner: owner,
            enabledAt: 0,
            disabledAt: 0,
            reason: "Initial registration",
            totalToggles: 0
        });

        // Track vault
        vaultIndex[vault] = managedVaults.length;
        managedVaults.push(vault);
        isRegistered[vault] = true;

        emit VaultRegisteredForSafeMode(vault, owner, block.timestamp);
    }

    /// @notice Enable safe mode for a vault
    /// @dev Only withdrawals to owner address allowed when enabled
    function enableSafeMode(address vault, string calldata reason) external {
        require(isRegistered[vault], "Vault not registered");
        require(!safeModeConfigs[vault].enabled, "Already enabled");

        // Update config
        SafeModeConfig storage config = safeModeConfigs[vault];
        config.enabled = true;
        config.enabledAt = block.timestamp;
        config.disabledAt = 0;
        config.reason = reason;
        config.totalToggles++;

        // Record history
        safeModeHistory[vault].push(SafeModeHistory({
            enabled: true,
            timestamp: block.timestamp,
            reason: reason,
            toggler: msg.sender
        }));

        emit SafeModeEnabled(vault, reason, block.timestamp);
        emit SafeModeToggleRecorded(vault, true, reason, msg.sender, block.timestamp);
    }

    /// @notice Disable safe mode for a vault
    function disableSafeMode(address vault, string calldata reason) external {
        require(isRegistered[vault], "Vault not registered");
        require(safeModeConfigs[vault].enabled, "Not enabled");

        // Update config
        SafeModeConfig storage config = safeModeConfigs[vault];
        config.enabled = false;
        config.disabledAt = block.timestamp;
        config.reason = reason;
        config.totalToggles++;

        // Record history
        safeModeHistory[vault].push(SafeModeHistory({
            enabled: false,
            timestamp: block.timestamp,
            reason: reason,
            toggler: msg.sender
        }));

        emit SafeModeDisabled(vault, reason, block.timestamp);
        emit SafeModeToggleRecorded(vault, false, reason, msg.sender, block.timestamp);
    }

    // Query Functions

    /// @notice Check if safe mode is enabled for vault
    function isSafeModeEnabled(address vault) external view returns (bool) {
        return safeModeConfigs[vault].enabled;
    }

    /// @notice Get safe mode configuration for vault
    function getSafeModeConfig(address vault) external view returns (SafeModeConfig memory) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeConfigs[vault];
    }

    /// @notice Get duration safe mode has been enabled (0 if disabled)
    function getSafeModeDuration(address vault) external view returns (uint256) {
        require(isRegistered[vault], "Vault not registered");
        
        SafeModeConfig memory config = safeModeConfigs[vault];
        if (!config.enabled) {
            return 0;
        }
        
        return block.timestamp - config.enabledAt;
    }

    /// @notice Get safe mode history for vault
    function getSafeModeHistory(address vault) external view returns (SafeModeHistory[] memory) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeHistory[vault];
    }

    /// @notice Get specific history entry
    function getHistoryEntry(address vault, uint256 index) external view returns (SafeModeHistory memory) {
        require(isRegistered[vault], "Vault not registered");
        require(index < safeModeHistory[vault].length, "Invalid index");
        return safeModeHistory[vault][index];
    }

    /// @notice Get total history count
    function getHistoryCount(address vault) external view returns (uint256) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeHistory[vault].length;
    }

    /// @notice Get total toggles count
    function getTotalToggles(address vault) external view returns (uint256) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeConfigs[vault].totalToggles;
    }

    /// @notice Get last toggle timestamp
    function getLastToggleTime(address vault) external view returns (uint256) {
        require(isRegistered[vault], "Vault not registered");
        
        SafeModeHistory[] storage history = safeModeHistory[vault];
        if (history.length == 0) {
            return 0;
        }
        
        return history[history.length - 1].timestamp;
    }

    /// @notice Get total managed vaults
    function getTotalManagedVaults() external view returns (uint256) {
        return managedVaults.length;
    }

    /// @notice Get managed vault at index
    function getManagedVaultAt(uint256 index) external view returns (address) {
        require(index < managedVaults.length, "Invalid index");
        return managedVaults[index];
    }

    /// @notice Get all managed vaults
    function getAllManagedVaults() external view returns (address[] memory) {
        return managedVaults;
    }

    /// @notice Get safe mode statistics
    function getSafeModeStatistics() external view returns (
        uint256 totalVaults,
        uint256 enabledCount,
        uint256 disabledCount
    ) {
        totalVaults = managedVaults.length;
        enabledCount = 0;
        disabledCount = 0;

        for (uint256 i = 0; i < managedVaults.length; i++) {
            if (safeModeConfigs[managedVaults[i]].enabled) {
                enabledCount++;
            } else {
                disabledCount++;
            }
        }
    }

    /// @notice Get reason for current mode
    function getCurrentReason(address vault) external view returns (string memory) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeConfigs[vault].reason;
    }

    /// @notice Check if vault was ever in safe mode
    function hasEverBeenInSafeMode(address vault) external view returns (bool) {
        require(isRegistered[vault], "Vault not registered");
        return safeModeHistory[vault].length > 0;
    }

    /// @notice Get times safe mode was toggled
    function getSafeModeLengthInSeconds(address vault) external view returns (uint256 totalSeconds) {
        require(isRegistered[vault], "Vault not registered");
        
        SafeModeHistory[] storage history = safeModeHistory[vault];
        
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].enabled) {
                // Find next disable event
                for (uint256 j = i + 1; j < history.length; j++) {
                    if (!history[j].enabled) {
                        totalSeconds += history[j].timestamp - history[i].timestamp;
                        i = j; // Skip to disable event
                        break;
                    }
                }
                // If last event is enable (still in safe mode), add current duration
                if (i == history.length - 1 && safeModeConfigs[vault].enabled) {
                    totalSeconds += block.timestamp - history[i].timestamp;
                }
            }
        }
    }
}
