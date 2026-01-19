// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianRotation
 * @notice Manages guardian expiry dates and rotation for SpendVault
 * @dev Tracks when guardians expire and auto-invalidates inactive guardians
 */
contract GuardianRotation is Ownable {
    // Guardian address => vault address => expiry timestamp
    mapping(address => mapping(address => uint256)) public guardianExpiry;
    
    // Vault address => array of guardian addresses
    mapping(address => address[]) public vaultGuardians;
    
    // Default expiry period (e.g., 365 days)
    uint256 public defaultExpiryPeriod = 365 days;
    
    // Vault-specific expiry periods
    mapping(address => uint256) public vaultExpiryPeriod;
    
    // Events
    event GuardianAdded(address indexed guardian, address indexed vault, uint256 expiryDate);
    event GuardianExpired(address indexed guardian, address indexed vault);
    event GuardianRenewed(address indexed guardian, address indexed vault, uint256 newExpiryDate);
    event GuardianRemoved(address indexed guardian, address indexed vault);
    event DefaultExpiryPeriodUpdated(uint256 newPeriod);
    event VaultExpiryPeriodUpdated(address indexed vault, uint256 newPeriod);
    
    /**
     * @notice Add a guardian with an expiry date
     * @param guardian Guardian address
     * @param vault Vault address
     * @param expiryDate Expiry timestamp (use 0 to use default period from now)
     */
    function addGuardian(address guardian, address vault, uint256 expiryDate) external onlyOwner {
        require(guardian != address(0), "Invalid guardian address");
        require(vault != address(0), "Invalid vault address");
        
        // If no explicit expiry, use default period
        if (expiryDate == 0) {
            uint256 periodToUse = vaultExpiryPeriod[vault] > 0 ? vaultExpiryPeriod[vault] : defaultExpiryPeriod;
            expiryDate = block.timestamp + periodToUse;
        } else {
            require(expiryDate > block.timestamp, "Expiry date must be in the future");
        }
        
        // Add guardian if not already present
        if (guardianExpiry[guardian][vault] == 0) {
            vaultGuardians[vault].push(guardian);
        }
        
        guardianExpiry[guardian][vault] = expiryDate;
        emit GuardianAdded(guardian, vault, expiryDate);
    }
    
    /**
     * @notice Remove a guardian
     * @param guardian Guardian address
     * @param vault Vault address
     */
    function removeGuardian(address guardian, address vault) external onlyOwner {
        require(guardianExpiry[guardian][vault] != 0, "Guardian not found");
        
        guardianExpiry[guardian][vault] = 0;
        
        // Remove from vaultGuardians array
        address[] storage guardians = vaultGuardians[vault];
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }
        
        emit GuardianRemoved(guardian, vault);
    }
    
    /**
     * @notice Check if a guardian is active and not expired
     * @param guardian Guardian address
     * @param vault Vault address
     * @return True if guardian is active, false if expired or not found
     */
    function isActiveGuardian(address guardian, address vault) external view returns (bool) {
        uint256 expiryDate = guardianExpiry[guardian][vault];
        if (expiryDate == 0) return false; // Guardian not found
        return block.timestamp <= expiryDate;
    }
    
    /**
     * @notice Get expiry date for a guardian in a vault
     * @param guardian Guardian address
     * @param vault Vault address
     * @return Expiry timestamp (0 if guardian not found)
     */
    function getExpiryDate(address guardian, address vault) external view returns (uint256) {
        return guardianExpiry[guardian][vault];
    }
    
    /**
     * @notice Get seconds remaining until guardian expires
     * @param guardian Guardian address
     * @param vault Vault address
     * @return Seconds until expiry (0 if expired or not found)
     */
    function getSecondsUntilExpiry(address guardian, address vault) external view returns (uint256) {
        uint256 expiryDate = guardianExpiry[guardian][vault];
        if (expiryDate == 0) return 0; // Not found
        if (block.timestamp >= expiryDate) return 0; // Already expired
        return expiryDate - block.timestamp;
    }
    
    /**
     * @notice Renew a guardian's expiry date
     * @param guardian Guardian address
     * @param vault Vault address
     * @param newExpiryDate New expiry timestamp (use 0 to extend by default period)
     */
    function renewGuardian(address guardian, address vault, uint256 newExpiryDate) external onlyOwner {
        require(guardianExpiry[guardian][vault] != 0, "Guardian not found");
        
        if (newExpiryDate == 0) {
            uint256 periodToUse = vaultExpiryPeriod[vault] > 0 ? vaultExpiryPeriod[vault] : defaultExpiryPeriod;
            newExpiryDate = block.timestamp + periodToUse;
        } else {
            require(newExpiryDate > block.timestamp, "New expiry must be in the future");
        }
        
        guardianExpiry[guardian][vault] = newExpiryDate;
        emit GuardianRenewed(guardian, vault, newExpiryDate);
    }
    
    /**
     * @notice Get all active guardians for a vault
     * @param vault Vault address
     * @return Active guardian addresses
     */
    function getActiveGuardians(address vault) external view returns (address[] memory) {
        address[] memory allGuardians = vaultGuardians[vault];
        address[] memory active = new address[](allGuardians.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < allGuardians.length; i++) {
            if (block.timestamp <= guardianExpiry[allGuardians[i]][vault]) {
                active[count] = allGuardians[i];
                count++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = active[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get all guardians (active and expired) for a vault
     * @param vault Vault address
     * @return All guardian addresses
     */
    function getAllGuardians(address vault) external view returns (address[] memory) {
        return vaultGuardians[vault];
    }
    
    /**
     * @notice Get count of active guardians for a vault
     * @param vault Vault address
     * @return Number of active guardians
     */
    function getActiveGuardianCount(address vault) external view returns (uint256) {
        address[] memory allGuardians = vaultGuardians[vault];
        uint256 count = 0;
        
        for (uint256 i = 0; i < allGuardians.length; i++) {
            if (block.timestamp <= guardianExpiry[allGuardians[i]][vault]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @notice Get count of expired guardians for a vault
     * @param vault Vault address
     * @return Number of expired guardians
     */
    function getExpiredGuardianCount(address vault) external view returns (uint256) {
        address[] memory allGuardians = vaultGuardians[vault];
        uint256 count = 0;
        
        for (uint256 i = 0; i < allGuardians.length; i++) {
            if (guardianExpiry[allGuardians[i]][vault] != 0 && block.timestamp > guardianExpiry[allGuardians[i]][vault]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @notice Set default expiry period for all vaults
     * @param newPeriod Period in seconds (e.g., 365 days = 31536000 seconds)
     */
    function setDefaultExpiryPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Period must be positive");
        defaultExpiryPeriod = newPeriod;
        emit DefaultExpiryPeriodUpdated(newPeriod);
    }
    
    /**
     * @notice Set vault-specific expiry period
     * @param vault Vault address
     * @param newPeriod Period in seconds (0 to use default)
     */
    function setVaultExpiryPeriod(address vault, uint256 newPeriod) external onlyOwner {
        vaultExpiryPeriod[vault] = newPeriod;
        emit VaultExpiryPeriodUpdated(vault, newPeriod);
    }
    
    /**
     * @notice Get expiry period for a vault
     * @param vault Vault address
     * @return Period in seconds (0 means use default)
     */
    function getExpiryPeriod(address vault) external view returns (uint256) {
        return vaultExpiryPeriod[vault];
    }
    
    /**
     * @notice Cleanup expired guardians from vault tracking (optional, saves gas)
     * @param vault Vault address
     */
    function cleanupExpiredGuardians(address vault) external {
        address[] storage guardians = vaultGuardians[vault];
        uint256 writeIdx = 0;
        
        for (uint256 i = 0; i < guardians.length; i++) {
            address guardian = guardians[i];
            uint256 expiry = guardianExpiry[guardian][vault];
            
            // Keep if active
            if (expiry > 0 && block.timestamp <= expiry) {
                guardians[writeIdx] = guardian;
                writeIdx++;
            }
        }
        
        // Resize array
        while (guardians.length > writeIdx) {
            guardians.pop();
        }
    }
}
