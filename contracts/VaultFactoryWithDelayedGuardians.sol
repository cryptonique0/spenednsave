// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SpendVaultWithDelayedGuardians} from "./SpendVaultWithDelayedGuardians.sol";
import {GuardianDelayController} from "./GuardianDelayController.sol";

/**
 * @title VaultFactoryWithDelayedGuardians
 * @dev Factory for deploying vaults with delayed guardian activation
 * 
 * Features:
 * - Deploy vaults with cooldown for new guardians
 * - Automatic integration with GuardianDelayController
 * - Configurable delay per vault
 * - Vault tracking and management
 * - Guardian lifecycle management
 */

contract VaultFactoryWithDelayedGuardians {

    // ==================== Types ====================

    struct VaultInfo {
        address vaultAddress;
        address owner;
        address[] initialGuardians;
        uint256 requiredSignatures;
        uint256 guardianDelay;
        uint256 createdAt;
        bool isActive;
    }

    // ==================== State ====================

    GuardianDelayController public delayController;
    
    address[] public deployedVaults;
    mapping(address => VaultInfo) public vaultInfo;
    mapping(address => bool) public isDeployedByFactory;
    mapping(address owner => address[]) public ownerVaults;
    
    uint256 public vaultCount = 0;
    uint256 public defaultGuardianDelay = 7 days;

    // ==================== Events ====================

    event VaultDeployed(
        address indexed vaultAddress,
        address indexed owner,
        address[] guardians,
        uint256 requiredSignatures,
        uint256 guardianDelay,
        uint256 timestamp
    );
    
    event VaultDeactivated(
        address indexed vaultAddress,
        uint256 timestamp
    );
    
    event DefaultDelayUpdated(
        uint256 newDelay,
        uint256 timestamp
    );

    // ==================== Constructor ====================

    constructor() {
        delayController = new GuardianDelayController();
    }

    // ==================== Vault Deployment ====================

    /**
     * @dev Deploy a new vault with delayed guardian activation
     * @param owner Vault owner address
     * @param guardians Array of initial guardian addresses
     * @param requiredSignatures Number of signatures needed for approval
     * @return newVault Address of deployed vault
     * 
     * Requirements:
     * - At least 1 guardian
     * - Required signatures <= guardian count
     */
    function deployVault(
        address owner,
        address[] calldata guardians,
        uint256 requiredSignatures
    ) external returns (address) {
        require(owner != address(0), "Invalid owner");
        require(guardians.length > 0, "Need at least 1 guardian");
        require(
            requiredSignatures > 0 && requiredSignatures <= guardians.length,
            "Invalid signature count"
        );
        
        // Verify all guardians are valid
        for (uint256 i = 0; i < guardians.length; i++) {
            require(guardians[i] != address(0), "Invalid guardian");
        }
        
        // Deploy vault
        SpendVaultWithDelayedGuardians newVault = new SpendVaultWithDelayedGuardians(
            owner,
            guardians,
            requiredSignatures,
            address(delayController)
        );
        
        // Register vault with delay controller
        delayController.registerVault(
            address(newVault),
            defaultGuardianDelay
        );
        
        // Register in factory
        address vaultAddress = address(newVault);
        deployedVaults.push(vaultAddress);
        isDeployedByFactory[vaultAddress] = true;
        ownerVaults[owner].push(vaultAddress);
        vaultCount++;
        
        VaultInfo storage info = vaultInfo[vaultAddress];
        info.vaultAddress = vaultAddress;
        info.owner = owner;
        info.initialGuardians = guardians;
        info.requiredSignatures = requiredSignatures;
        info.guardianDelay = defaultGuardianDelay;
        info.createdAt = block.timestamp;
        info.isActive = true;
        
        emit VaultDeployed(
            vaultAddress,
            owner,
            guardians,
            requiredSignatures,
            defaultGuardianDelay,
            block.timestamp
        );
        
        return vaultAddress;
    }

    /**
     * @dev Deploy vault with custom guardian delay
     * @param owner Vault owner
     * @param guardians Guardian addresses
     * @param requiredSignatures Signatures needed for approval
     * @param customDelay Custom delay duration in seconds
     * @return newVault Address of deployed vault
     */
    function deployVaultWithCustomDelay(
        address owner,
        address[] calldata guardians,
        uint256 requiredSignatures,
        uint256 customDelay
    ) external returns (address) {
        require(customDelay > 0, "Delay must be > 0");
        
        address vaultAddress = deployVault(owner, guardians, requiredSignatures);
        
        // Update custom delay if different from default
        if (customDelay != defaultGuardianDelay) {
            delayController.updateVaultDelay(vaultAddress, customDelay);
            vaultInfo[vaultAddress].guardianDelay = customDelay;
        }
        
        return vaultAddress;
    }

    // ==================== Vault Management ====================

    /**
     * @dev Get vault count
     */
    function getVaultCount() external view returns (uint256) {
        return vaultCount;
    }

    /**
     * @dev Get vault at index
     */
    function getVaultAt(uint256 index) external view returns (address) {
        require(index < deployedVaults.length, "Index out of bounds");
        return deployedVaults[index];
    }

    /**
     * @dev Get all deployed vaults
     */
    function getAllVaults() external view returns (address[] memory) {
        return deployedVaults;
    }

    /**
     * @dev Get vaults for owner
     */
    function getOwnerVaults(address owner) external view returns (address[] memory) {
        return ownerVaults[owner];
    }

    /**
     * @dev Get vault information
     */
    function getVaultInfo(address vault) external view returns (VaultInfo memory) {
        require(isDeployedByFactory[vault], "Vault not deployed by factory");
        return vaultInfo[vault];
    }

    /**
     * @dev Check if vault is deployed by factory
     */
    function isVaultDeployed(address vault) external view returns (bool) {
        return isDeployedByFactory[vault];
    }

    /**
     * @dev Get vault owner
     */
    function getVaultOwner(address vault) external view returns (address) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].owner;
    }

    /**
     * @dev Get vault initial guardians
     */
    function getVaultGuardians(address vault) external view returns (address[] memory) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].initialGuardians;
    }

    /**
     * @dev Get required signatures for vault
     */
    function getRequiredSignatures(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].requiredSignatures;
    }

    /**
     * @dev Get guardian delay for vault
     */
    function getGuardianDelay(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].guardianDelay;
    }

    /**
     * @dev Check if address is vault owner
     */
    function isVaultOwner(address vault, address account) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].owner == account;
    }

    /**
     * @dev Check if address is initial vault guardian
     */
    function isVaultGuardian(address vault, address account) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        
        address[] memory guardians = vaultInfo[vault].initialGuardians;
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == account) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get initial guardian count for vault
     */
    function getGuardianCount(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].initialGuardians.length;
    }

    /**
     * @dev Deactivate vault
     */
    function deactivateVault(address vault) external {
        require(isDeployedByFactory[vault], "Vault not found");
        require(msg.sender == vaultInfo[vault].owner, "Only owner can deactivate");
        
        vaultInfo[vault].isActive = false;
        emit VaultDeactivated(vault, block.timestamp);
    }

    /**
     * @dev Check if vault is active
     */
    function isVaultActive(address vault) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].isActive;
    }

    // ==================== Delay Management ====================

    /**
     * @dev Get delay controller
     */
    function getDelayController() external view returns (address) {
        return address(delayController);
    }

    /**
     * @dev Get default guardian delay
     */
    function getDefaultDelay() external view returns (uint256) {
        return defaultGuardianDelay;
    }

    /**
     * @dev Update default guardian delay for new vaults
     * @param newDelay New default delay in seconds
     */
    function updateDefaultDelay(uint256 newDelay) external {
        require(newDelay > 0, "Delay must be > 0");
        defaultGuardianDelay = newDelay;
        emit DefaultDelayUpdated(newDelay, block.timestamp);
    }

    /**
     * @dev Update delay for existing vault
     * @param vault Vault address
     * @param newDelay New delay in seconds
     */
    function updateVaultDelay(address vault, uint256 newDelay) external {
        require(isDeployedByFactory[vault], "Vault not found");
        require(msg.sender == vaultInfo[vault].owner, "Only owner");
        require(newDelay > 0, "Delay must be > 0");
        
        delayController.updateVaultDelay(vault, newDelay);
        vaultInfo[vault].guardianDelay = newDelay;
    }

    // ==================== Guardian Query ====================

    /**
     * @dev Get active guardians for vault
     */
    function getActiveGuardians(address vault) external view returns (address[] memory) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.getActiveGuardians(vault);
    }

    /**
     * @dev Get pending guardians for vault
     */
    function getPendingGuardians(address vault) external view returns (address[] memory) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.getPendingGuardians(vault);
    }

    /**
     * @dev Get active guardian count
     */
    function getActiveGuardianCount(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.getActiveGuardianCount(vault);
    }

    /**
     * @dev Get pending guardian count
     */
    function getPendingGuardianCount(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.getPendingGuardianCount(vault);
    }

    /**
     * @dev Check if guardian is active
     */
    function isGuardianActive(address vault, address guardian) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.isGuardianActive(vault, guardian);
    }

    /**
     * @dev Check if guardian is pending
     */
    function isGuardianPending(address vault, address guardian) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.isGuardianPending(vault, guardian);
    }

    /**
     * @dev Get time until guardian becomes active
     */
    function getTimeUntilActive(address vault, address guardian) 
        external view returns (uint256) 
    {
        require(isDeployedByFactory[vault], "Vault not found");
        return delayController.getTimeUntilActive(vault, guardian);
    }

    // ==================== Statistics ====================

    /**
     * @dev Get total deployed vaults
     */
    function getTotalVaults() external view returns (uint256) {
        return deployedVaults.length;
    }

    /**
     * @dev Get vaults for owner count
     */
    function getOwnerVaultCount(address owner) external view returns (uint256) {
        return ownerVaults[owner].length;
    }

    /**
     * @dev Get deployment summary
     */
    function getDeploymentSummary() external view returns (
        uint256 totalVaults,
        uint256 activeVaults,
        uint256 totalGuardians,
        uint256 averageGuardianDelay
    ) {
        totalVaults = deployedVaults.length;
        
        uint256 active = 0;
        uint256 guardianSum = 0;
        uint256 delaySum = 0;
        
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            address vault = deployedVaults[i];
            if (vaultInfo[vault].isActive) {
                active++;
            }
            guardianSum += vaultInfo[vault].initialGuardians.length;
            delaySum += vaultInfo[vault].guardianDelay;
        }
        
        activeVaults = active;
        totalGuardians = guardianSum;
        averageGuardianDelay = totalVaults > 0 ? delaySum / totalVaults : 0;
    }
}
