// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VaultFactoryWithPausing
 * @dev Factory for deploying SpendVault instances with pausing capability
 * 
 * Features:
 * - Deploy per-user vault instances
 * - Shared VaultPausingController across all vaults
 * - Full support for pause/unpause functionality
 * - Vault registry tracking
 */

import "./SpendVaultWithPausing.sol";
import "./VaultPausingController.sol";

interface IGuardianSBT {
    function mint(address to, string memory uri) external returns (uint256);
}

contract VaultFactoryWithPausing {
    
    // ==================== State ====================
    
    address public guardianSBT;
    VaultPausingController public pausingController;
    
    address[] public allVaults;
    mapping(address => address[]) public userVaults;
    mapping(address => bool) public isVault;
    
    // Counter for vault naming
    uint256 public vaultCounter = 0;

    // ==================== Events ====================
    
    event VaultCreated(
        address indexed vault,
        address indexed owner,
        uint256 quorum,
        uint256 vaultNumber,
        uint256 timestamp
    );
    
    event PausingControllerDeployed(address indexed controller, uint256 timestamp);
    event GuardianSBTUpdated(address newAddress, uint256 timestamp);

    // ==================== Constructor ====================
    
    constructor(
        address _guardianSBT
    ) {
        require(_guardianSBT != address(0), "Invalid guardian SBT");
        
        guardianSBT = _guardianSBT;
        
        // Deploy shared pausing controller
        pausingController = new VaultPausingController();
        emit PausingControllerDeployed(address(pausingController), block.timestamp);
    }

    // ==================== Vault Creation ====================
    
    /**
     * @dev Create a new SpendVault with pausing capability
     * @param quorum Number of guardians required for withdrawal
     * @return vault Address of the newly created vault
     */
    function createVault(uint256 quorum) external returns (address) {
        require(quorum > 0, "Quorum must be at least 1");
        
        // Deploy vault instance
        SpendVaultWithPausing vault = new SpendVaultWithPausing(
            guardianSBT,
            quorum,
            address(pausingController)
        );
        
        // Transfer ownership to caller
        vault.transferOwnership(msg.sender);
        
        // Register vault
        allVaults.push(address(vault));
        userVaults[msg.sender].push(address(vault));
        isVault[address(vault)] = true;
        
        // Register with pausing controller
        pausingController.registerVault(address(vault));
        
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

    // ==================== Configuration ====================
    
    /**
     * @dev Update guardian SBT address
     * @param _newAddress New guardian SBT address
     */
    function updateGuardianSBT(address _newAddress) external {
        require(_newAddress != address(0), "Invalid address");
        require(msg.sender == tx.origin, "Only direct calls allowed");
        
        guardianSBT = _newAddress;
        emit GuardianSBTUpdated(_newAddress, block.timestamp);
    }

    // ==================== Views ====================
    
    /**
     * @dev Get all vaults created by a user
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
     * @dev Check if address is a managed vault
     */
    function isManagedVault(address vault) external view returns (bool) {
        return isVault[vault];
    }

    /**
     * @dev Get user's vault count
     */
    function getUserVaultCount(address user) external view returns (uint256) {
        return userVaults[user].length;
    }

    /**
     * @dev Get user's vault at index
     */
    function getUserVaultAt(address user, uint256 index) external view returns (address) {
        require(index < userVaults[user].length, "Index out of bounds");
        return userVaults[user][index];
    }

    /**
     * @dev Get pausing controller address
     */
    function getPausingController() external view returns (address) {
        return address(pausingController);
    }

    /**
     * @dev Check if vault is paused via controller
     */
    function isVaultPaused(address vault) external view returns (bool) {
        require(isVault[vault], "Not a managed vault");
        return pausingController.isPaused(vault);
    }

    /**
     * @dev Get vault pause reason via controller
     */
    function getVaultPauseReason(address vault) external view returns (string memory) {
        require(isVault[vault], "Not a managed vault");
        return pausingController.getPauseReason(vault);
    }

    /**
     * @dev Get vault pause elapsed time via controller
     */
    function getVaultPauseElapsedTime(address vault) external view returns (uint256) {
        require(isVault[vault], "Not a managed vault");
        return pausingController.getPauseElapsedTime(vault);
    }
}
