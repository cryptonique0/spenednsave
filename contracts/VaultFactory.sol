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
}
