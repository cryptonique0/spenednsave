// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BatchWithdrawalProposalManager.sol";
import "./SpendVaultWithBatchProposals.sol";

/**
 * @title VaultFactoryWithBatchProposals
 * @notice Factory for deploying vaults with batch withdrawal capability
 */
contract VaultFactoryWithBatchProposals {
    
    BatchWithdrawalProposalManager public batchProposalManager;
    
    mapping(address => address[]) public userBatchVaults;
    address[] public allBatchVaults;
    mapping(address => bool) public isManagedBatchVault;
    
    event BatchVaultCreated(
        address indexed user,
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );
    
    constructor(address guardianSBT) {
        batchProposalManager = new BatchWithdrawalProposalManager();
    }
    
    function createBatchVault(uint256 quorum) external returns (address) {
        SpendVaultWithBatchProposals vault = new SpendVaultWithBatchProposals();
        
        vault.setQuorum(quorum);
        vault.updateGuardianToken(msg.sender); // Placeholder, should be actual guardian SBT
        vault.updateBatchProposalManager(address(batchProposalManager));
        
        // Register with manager
        batchProposalManager.registerVault(address(vault), quorum);
        
        // Track vault
        userBatchVaults[msg.sender].push(address(vault));
        allBatchVaults.push(address(vault));
        isManagedBatchVault[address(vault)] = true;
        
        emit BatchVaultCreated(msg.sender, address(vault), quorum, block.timestamp);
        
        return address(vault);
    }
    
    function getUserBatchVaults(address user) external view returns (address[] memory) {
        return userBatchVaults[user];
    }
    
    function getAllBatchVaults() external view returns (address[] memory) {
        return allBatchVaults;
    }
    
    function getBatchVaultCount() external view returns (uint256) {
        return allBatchVaults.length;
    }
    
    function getUserBatchVaultCount(address user) external view returns (uint256) {
        return userBatchVaults[user].length;
    }
    
    function getBatchProposalManager() external view returns (address) {
        return address(batchProposalManager);
    }
}
