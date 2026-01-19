// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GuardianSBT.sol";
import "./SpendVault.sol";

/**
 * @title VaultFactory
 * @notice Factory contract for deploying user-specific vaults and guardian tokens
 * @dev Each user gets their own GuardianSBT and SpendVault instance
 */
contract VaultFactory {
    // Events
    event VaultCreated(
        address indexed owner,
        address guardianToken,
        address vault,
        uint256 quorum
    );

    // Mapping from user address to their vault address
    mapping(address => address) public userVaults;
    
    // Mapping from user address to their guardian token address
    mapping(address => address) public userGuardianTokens;

    // Array of all created vaults for enumeration
    address[] public allVaults;

    /**
     * @notice Create a new vault and guardian token for the caller
     * @param _quorum Number of guardian signatures required
     * @param _name Display name for the vault (max 64 characters)
     * @param _tags Array of tags for the vault (max 10 tags)
     * @return guardianToken Address of the deployed GuardianSBT
     * @return vault Address of the deployed SpendVault
     */
    function createVault(
        uint256 _quorum,
        string memory _name,
        string[] memory _tags
    ) external returns (address guardianToken, address vault) {
        require(userVaults[msg.sender] == address(0), "Vault already exists for this user");
        require(_quorum > 0, "Quorum must be greater than 0");
        
        // Validate vault name
        _validateVaultName(_name);
        
        // Validate tags
        _validateVaultTags(_tags);

        // Deploy GuardianSBT for this user
        GuardianSBT guardianSBT = new GuardianSBT();
        guardianToken = address(guardianSBT);

        // Transfer ownership to the user
        guardianSBT.transferOwnership(msg.sender);

        // Deploy SpendVault for this user with name and tags
        SpendVault spendVault = new SpendVault(guardianToken, _quorum, _name, _tags);
        vault = address(spendVault);

        // Transfer ownership to the user
        spendVault.transferOwnership(msg.sender);

        // Store mappings
        userVaults[msg.sender] = vault;
        userGuardianTokens[msg.sender] = guardianToken;
        allVaults.push(vault);

        emit VaultCreated(msg.sender, guardianToken, vault, _quorum);

        return (guardianToken, vault);
    }

    /**
     * @notice Get vault and guardian token addresses for a user
     * @param user Address of the user
     * @return guardianToken Address of the user's GuardianSBT
     * @return vault Address of the user's SpendVault
     */
    function getUserContracts(address user) external view returns (address guardianToken, address vault) {
        return (userGuardianTokens[user], userVaults[user]);
    }

    /**
     * @notice Check if a user has created a vault
     * @param user Address to check
     * @return bool True if the user has a vault
     */
    function hasVault(address user) external view returns (bool) {
        return userVaults[user] != address(0);
    }

    /**
     * @notice Get the total number of vaults created
     * @return uint256 Total vault count
     */
    function getTotalVaults() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @notice Get vault address by index
     * @param index Index in the allVaults array
     * @return address Vault address
     */
    function getVaultByIndex(uint256 index) external view returns (address) {
        require(index < allVaults.length, "Index out of bounds");
        return allVaults[index];
    }

    /**
     * @notice Validate vault name format and length
     * @param _name The vault name to validate
     * @dev Ensures name is not empty and does not exceed 64 characters
     */
    function _validateVaultName(string memory _name) internal pure {
        bytes memory nameBytes = bytes(_name);
        require(nameBytes.length > 0, "Vault name cannot be empty");
        require(nameBytes.length <= 64, "Vault name must not exceed 64 characters");
    }

    /**
     * @notice Validate vault tags array and individual tags
     * @param _tags The tags array to validate
     * @dev Ensures tag count does not exceed 10 and each tag is valid
     */
    function _validateVaultTags(string[] memory _tags) internal pure {
        require(_tags.length <= 10, "Maximum 10 tags allowed per vault");
        
        for (uint256 i = 0; i < _tags.length; i++) {
            bytes memory tagBytes = bytes(_tags[i]);
            require(tagBytes.length > 0, "Tag cannot be empty");
            require(tagBytes.length <= 32, "Tag must not exceed 32 characters");
        }
    }
}
