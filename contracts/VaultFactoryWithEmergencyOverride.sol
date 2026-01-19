// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultFactoryWithEmergencyOverride
 * @dev Factory for deploying vaults with emergency guardian override mechanism
 * 
 * Single deployment per network - creates:
 * 1. Guardian SBT (per user)
 * 2. Vault with emergency override (per user)
 * 3. Shared GuardianEmergencyOverride contract (one per network, shared by all vaults)
 */

import "./GuardianSBT.sol";
import "./SpendVaultWithEmergencyOverride.sol";
import "./GuardianEmergencyOverride.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VaultFactoryWithEmergencyOverride is Ownable {
    
    // ==================== State ====================
    
    /// @dev Shared emergency override contract
    GuardianEmergencyOverride public emergencyOverride;
    
    /// @dev User vault contracts
    mapping(address user => VaultContracts) public userVaults;
    
    /// @dev Track all vaults for enumeration
    address[] public allVaults;

    struct VaultContracts {
        address guardianToken;
        address vault;
    }

    // ==================== Events ====================
    
    event VaultCreatedWithEmergencyOverride(
        address indexed owner,
        address indexed guardianToken,
        address indexed vault,
        uint256 quorum,
        uint256 emergencyQuorum
    );

    // ==================== Constructor ====================
    
    constructor() {
        // Deploy shared emergency override contract
        emergencyOverride = new GuardianEmergencyOverride();
    }

    // ==================== Vault Creation ====================
    
    /**
     * @dev Create a new vault with emergency override for the caller
     * @param quorum Required guardians for normal withdrawals
     * @param emergencyQuorum Required emergency guardians for immediate emergency approvals
     * @return guardianTokenAddress Address of newly created guardian token
     * @return vaultAddress Address of newly created vault
     */
    function createVault(uint256 quorum, uint256 emergencyQuorum) 
        external 
        returns (address guardianTokenAddress, address vaultAddress) 
    {
        require(quorum > 0, "Quorum must be at least 1");
        require(emergencyQuorum > 0, "Emergency quorum must be at least 1");
        require(userVaults[msg.sender].vault == address(0), "User already has a vault");

        // Deploy GuardianSBT for this user
        GuardianSBT guardianToken = new GuardianSBT();
        guardianTokenAddress = address(guardianToken);

        // Deploy SpendVault with emergency override for this user
        SpendVaultWithEmergencyOverride vault = new SpendVaultWithEmergencyOverride(
            guardianTokenAddress,
            quorum,
            address(emergencyOverride)
        );
        vaultAddress = address(vault);

        // Set emergency guardian quorum
        vault.setEmergencyGuardianQuorum(emergencyQuorum);

        // Transfer ownership to user
        guardianToken.transferOwnership(msg.sender);
        vault.transferOwnership(msg.sender);

        // Store vault contracts
        userVaults[msg.sender] = VaultContracts({
            guardianToken: guardianTokenAddress,
            vault: vaultAddress
        });

        // Track all vaults
        allVaults.push(vaultAddress);

        emit VaultCreatedWithEmergencyOverride(
            msg.sender,
            guardianTokenAddress,
            vaultAddress,
            quorum,
            emergencyQuorum
        );

        return (guardianTokenAddress, vaultAddress);
    }

    // ==================== Views ====================
    
    /**
     * @dev Get vault contracts for a user
     * @param user User address
     * @return guardianToken Guardian token address
     * @return vault Vault address
     */
    function getUserContracts(address user) external view returns (address guardianToken, address vault) {
        VaultContracts memory contracts = userVaults[user];
        return (contracts.guardianToken, contracts.vault);
    }

    /**
     * @dev Check if user has a vault
     * @param user User address
     */
    function hasVault(address user) external view returns (bool) {
        return userVaults[user].vault != address(0);
    }

    /**
     * @dev Get shared emergency override contract address
     */
    function getEmergencyOverride() external view returns (address) {
        return address(emergencyOverride);
    }

    /**
     * @dev Get total number of vaults created
     */
    function getTotalVaults() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @dev Get vault address by index
     * @param index Index in vaults array
     */
    function getVaultByIndex(uint256 index) external view returns (address) {
        require(index < allVaults.length, "Index out of bounds");
        return allVaults[index];
    }
}
