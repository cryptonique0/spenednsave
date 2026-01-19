// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GuardianSBT.sol";
import "./SpendVaultWithRecovery.sol";
import "./GuardianRotation.sol";
import "./GuardianRecovery.sol";

/**
 * @title VaultFactoryWithRecovery
 * @notice Factory for creating vaults with guardian rotation and recovery flow
 */
contract VaultFactoryWithRecovery is Ownable {
    GuardianRotation public guardianRotation;
    GuardianRecovery public guardianRecovery;

    struct VaultContracts {
        address guardianToken;
        address vault;
        address guardianRotation;
        address guardianRecovery;
    }

    mapping(address => VaultContracts) public userVaults;
    mapping(address => bool) public hasVault;

    address[] public allVaults;

    event VaultCreatedWithRecovery(
        address indexed owner,
        address indexed guardianToken,
        address indexed vault,
        address guardianRotation,
        address guardianRecovery,
        uint256 quorum
    );

    constructor() Ownable(msg.sender) {
        // Deploy shared GuardianRotation and GuardianRecovery contracts
        guardianRotation = new GuardianRotation();
        guardianRecovery = new GuardianRecovery();

        guardianRotation.transferOwnership(msg.sender);
        guardianRecovery.transferOwnership(msg.sender);
    }

    /**
     * @notice Create a complete vault system with rotation and recovery
     * @param quorum Number of guardian signatures required
     * @return guardianTokenAddr Address of GuardianSBT
     * @return vaultAddr Address of SpendVault
     */
    function createVault(uint256 quorum) external returns (address guardianTokenAddr, address vaultAddr) {
        require(!hasVault[msg.sender], "Vault already exists");
        require(quorum > 0, "Quorum must be positive");

        // Deploy GuardianSBT
        GuardianSBT token = new GuardianSBT();
        guardianTokenAddr = address(token);
        token.transferOwnership(msg.sender);

        // Deploy SpendVault with recovery
        SpendVaultWithRecovery vault = new SpendVaultWithRecovery(
            guardianTokenAddr,
            address(guardianRotation),
            address(guardianRecovery),
            quorum
        );
        vaultAddr = address(vault);
        vault.transferOwnership(msg.sender);

        // Record vault
        userVaults[msg.sender] = VaultContracts({
            guardianToken: guardianTokenAddr,
            vault: vaultAddr,
            guardianRotation: address(guardianRotation),
            guardianRecovery: address(guardianRecovery)
        });
        hasVault[msg.sender] = true;
        allVaults.push(vaultAddr);

        emit VaultCreatedWithRecovery(
            msg.sender,
            guardianTokenAddr,
            vaultAddr,
            address(guardianRotation),
            address(guardianRecovery),
            quorum
        );

        return (guardianTokenAddr, vaultAddr);
    }

    /**
     * @notice Get all vault contracts for a user
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
     * @notice Get shared GuardianRotation contract
     * @return Guardian rotation address
     */
    function getGuardianRotation() external view returns (address) {
        return address(guardianRotation);
    }

    /**
     * @notice Get shared GuardianRecovery contract
     * @return Guardian recovery address
     */
    function getGuardianRecovery() external view returns (address) {
        return address(guardianRecovery);
    }
}
