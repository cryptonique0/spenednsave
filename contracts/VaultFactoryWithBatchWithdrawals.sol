// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BatchWithdrawalManager.sol";
import "./SpendVaultWithBatchWithdrawals.sol";

/**
 * @title VaultFactoryWithBatchWithdrawals
 * @dev Factory for deploying vaults with batch withdrawal capability
 */
contract VaultFactoryWithBatchWithdrawals {

    BatchWithdrawalManager public batchManager;
    
    mapping(address => address[]) public userVaults;
    address[] public allVaults;
    mapping(address => bool) public isManagedVault;

    address public guardianSBT;

    event VaultCreated(
        address indexed user,
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );

    constructor(address _guardianSBT) {
        guardianSBT = _guardianSBT;
        batchManager = new BatchWithdrawalManager();
    }

    /// @dev Create new vault
    function createVault(uint256 quorum) external returns (address) {
        SpendVaultWithBatchWithdrawals vault = new SpendVaultWithBatchWithdrawals();
        
        vault.setQuorum(quorum);
        vault.updateGuardianToken(guardianSBT);
        vault.updateBatchManager(address(batchManager));

        batchManager.registerVault(address(vault), quorum);

        userVaults[msg.sender].push(address(vault));
        allVaults.push(address(vault));
        isManagedVault[address(vault)] = true;

        emit VaultCreated(msg.sender, address(vault), quorum, block.timestamp);

        return address(vault);
    }

    /// @dev Get user's vaults
    function getUserVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }

    /// @dev Get all vaults
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    /// @dev Get vault count
    function getVaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /// @dev Get user vault count
    function getUserVaultCount(address user) external view returns (uint256) {
        return userVaults[user].length;
    }

    /// @dev Get batch manager
    function getBatchManager() external view returns (address) {
        return address(batchManager);
    }
}
