// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GuardianSBT.sol";
import "./SpendVaultWithGuardianRotation.sol";
import "./GuardianRotation.sol";

/**
 * @title VaultFactoryWithGuardianRotation
 * @notice Factory for creating vaults with guardian rotation support
 */
contract VaultFactoryWithGuardianRotation is Ownable {
    GuardianRotation public guardianRotation;
    
    struct VaultContracts {
        address guardianToken;
        address vault;
        address guardianRotation;
    }

    mapping(address => VaultContracts) public userVaults;
    mapping(address => bool) public hasVault;
    
    address[] public allVaults;
    
    event VaultCreatedWithRotation(
        address indexed owner,
        address indexed guardianToken,
        address indexed vault,
        address guardianRotation,
        uint256 quorum
    );

    constructor() Ownable(msg.sender) {
        // Deploy single GuardianRotation contract for all vaults to use
        guardianRotation = new GuardianRotation();
        guardianRotation.transferOwnership(msg.sender);
    }

    /**
     * @notice Create a vault with guardian rotation for the caller
     * @param quorum Number of guardian signatures required for withdrawals
     * @return guardianTokenAddr Address of the GuardianSBT contract
     * @return vaultAddr Address of the SpendVault contract
     */
    function createVault(uint256 quorum) external returns (address guardianTokenAddr, address vaultAddr) {
        require(!hasVault[msg.sender], "Vault already exists for this user");
        require(quorum > 0, "Quorum must be positive");

        // Deploy GuardianSBT
        GuardianSBT token = new GuardianSBT();
        guardianTokenAddr = address(token);
        token.transferOwnership(msg.sender);

        // Deploy SpendVault with guardian rotation
        SpendVaultWithGuardianRotation vault = new SpendVaultWithGuardianRotation(
            guardianTokenAddr,
            address(guardianRotation),
            quorum
        );
        vaultAddr = address(vault);
        vault.transferOwnership(msg.sender);

        // Record vault
        userVaults[msg.sender] = VaultContracts({
            guardianToken: guardianTokenAddr,
            vault: vaultAddr,
            guardianRotation: address(guardianRotation)
        });
        hasVault[msg.sender] = true;
        allVaults.push(vaultAddr);

        emit VaultCreatedWithRotation(
            msg.sender,
            guardianTokenAddr,
            vaultAddr,
            address(guardianRotation),
            quorum
        );

        return (guardianTokenAddr, vaultAddr);
    }

    /**
     * @notice Get vault contracts for a user
     * @param user User address
     * @return VaultContracts struct
     */
    function getUserContracts(address user) external view returns (VaultContracts memory) {
        require(hasVault[user], "User has no vault");
        return userVaults[user];
    }

    /**
     * @notice Get guardian token for a user
     * @param user User address
     * @return Guardian token address
     */
    function getUserGuardianToken(address user) external view returns (address) {
        require(hasVault[user], "User has no vault");
        return userVaults[user].guardianToken;
    }

    /**
     * @notice Get vault address for a user
     * @param user User address
     * @return Vault address
     */
    function getUserVault(address user) external view returns (address) {
        require(hasVault[user], "User has no vault");
        return userVaults[user].vault;
    }

    /**
     * @notice Get total number of vaults created
     * @return Total vault count
     */
    function getTotalVaults() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @notice Get vault address by index
     * @param index Index in vault array
     * @return Vault address
     */
    function getVaultByIndex(uint256 index) external view returns (address) {
        require(index < allVaults.length, "Index out of bounds");
        return allVaults[index];
    }

    /**
     * @notice Get the shared GuardianRotation contract
     * @return Guardian rotation contract address
     */
    function getGuardianRotation() external view returns (address) {
        return address(guardianRotation);
    }
}
