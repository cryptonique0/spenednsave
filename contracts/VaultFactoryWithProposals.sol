// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultFactoryWithProposals
 * @dev Factory for deploying vaults with on-chain proposal voting
 */

import "./SpendVaultWithProposals.sol";
import "./WithdrawalProposalManager.sol";

interface IGuardianSBT {
    function mint(address to, string memory uri) external returns (uint256);
}

contract VaultFactoryWithProposals {
    
    // ==================== State ====================
    
    address public guardianSBT;
    WithdrawalProposalManager public proposalManager;
    
    address[] public allVaults;
    mapping(address => address[]) public userVaults;
    mapping(address => bool) public isVault;
    
    uint256 public vaultCounter = 0;

    // ==================== Events ====================
    
    event VaultCreated(
        address indexed vault,
        address indexed owner,
        uint256 quorum,
        uint256 vaultNumber,
        uint256 timestamp
    );
    
    event ProposalManagerDeployed(address indexed manager, uint256 timestamp);

    // ==================== Constructor ====================
    
    constructor(address _guardianSBT) {
        require(_guardianSBT != address(0), "Invalid guardian SBT");
        
        guardianSBT = _guardianSBT;
        
        // Deploy shared proposal manager
        proposalManager = new WithdrawalProposalManager();
        emit ProposalManagerDeployed(address(proposalManager), block.timestamp);
    }

    // ==================== Vault Creation ====================
    
    /**
     * @dev Create vault with proposal system
     * @param quorum Number of guardians required for withdrawal
     * @return vault Address of new vault
     */
    function createVault(uint256 quorum) external returns (address) {
        require(quorum > 0, "Quorum must be at least 1");
        
        // Deploy vault
        SpendVaultWithProposals vault = new SpendVaultWithProposals(
            guardianSBT,
            quorum,
            address(proposalManager)
        );
        
        // Transfer ownership to caller
        vault.transferOwnership(msg.sender);
        
        // Register with proposal manager
        proposalManager.registerVault(address(vault), quorum);
        
        // Track vault
        allVaults.push(address(vault));
        userVaults[msg.sender].push(address(vault));
        isVault[address(vault)] = true;
        
        uint256 currentVaultNumber = vaultCounter;
        vaultCounter++;
        
        emit VaultCreated(
            address(vault),
            msg.sender,
            quorum,
            currentVaultNumber,
            block.timestamp
        );
        
        return address(vault);
    }

    // ==================== Views ====================
    
    /**
     * @dev Get user's vaults
     */
    function getUserVaults(address user) external view returns (address[] memory) {
        return userVaults[user];
    }

    /**
     * @dev Get total vault count
     */
    function getVaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    /**
     * @dev Get all vaults
     */
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    /**
     * @dev Check if address is managed vault
     */
    function isManagedVault(address vault) external view returns (bool) {
        return isVault[vault];
    }

    /**
     * @dev Get user vault count
     */
    function getUserVaultCount(address user) external view returns (uint256) {
        return userVaults[user].length;
    }

    /**
     * @dev Get proposal manager address
     */
    function getProposalManager() external view returns (address) {
        return address(proposalManager);
    }
}
