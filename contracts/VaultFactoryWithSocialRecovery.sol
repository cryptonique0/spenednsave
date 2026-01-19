// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SpendVaultWithSocialRecovery} from "./SpendVaultWithSocialRecovery.sol";
import {GuardianSocialRecovery} from "./GuardianSocialRecovery.sol";
import {IGuardianSBT} from "./interfaces/IGuardianSBT.sol";

/**
 * @title VaultFactoryWithSocialRecovery
 * @dev Factory for deploying SpendVault instances with social recovery
 * 
 * Features:
 * - Deploy vaults with guardians and owner
 * - Automatic integration with GuardianSocialRecovery
 * - Vault tracking and management
 * - Recovery contract interaction
 * - Guardian SBT validation
 */

contract VaultFactoryWithSocialRecovery {

    // ==================== Types ====================

    struct VaultInfo {
        address vaultAddress;
        address owner;
        address[] guardians;
        uint256 requiredSignatures;
        address emergencyGuardian;
        uint256 createdAt;
        bool isActive;
    }

    // ==================== State ====================

    GuardianSocialRecovery public recoveryContract;
    IGuardianSBT public guardianSBT;
    
    address[] public deployedVaults;
    mapping(address => VaultInfo) public vaultInfo;
    mapping(address => bool) public isDeployedByFactory;
    mapping(address owner => address[]) public ownerVaults;
    
    uint256 public vaultCount = 0;
    uint256 public defaultRecoveryQuorum = 2;

    // ==================== Events ====================

    event VaultDeployed(
        address indexed vaultAddress,
        address indexed owner,
        address[] guardians,
        uint256 requiredSignatures,
        uint256 timestamp
    );
    
    event VaultRegisteredForRecovery(
        address indexed vaultAddress,
        uint256 quorum,
        uint256 timestamp
    );
    
    event VaultDeactivated(
        address indexed vaultAddress,
        uint256 timestamp
    );

    // ==================== Constructor ====================

    constructor(
        address _recoveryContract,
        address _guardianSBT
    ) {
        require(_recoveryContract != address(0), "Invalid recovery contract");
        require(_guardianSBT != address(0), "Invalid guardian SBT");
        
        recoveryContract = GuardianSocialRecovery(_recoveryContract);
        guardianSBT = IGuardianSBT(_guardianSBT);
    }

    // ==================== Vault Deployment ====================

    /**
     * @dev Deploy a new vault with social recovery
     * @param owner Vault owner address
     * @param guardians Array of guardian addresses
     * @param requiredSignatures Number of signatures needed for approval
     * @param emergencyGuardian Emergency guardian address (can freeze vault)
     * @return newVault Address of deployed vault
     * 
     * Requirements:
     * - At least 1 guardian
     * - Required signatures <= guardian count
     * - All guardians must hold guardian SBT
     */
    function deployVault(
        address owner,
        address[] calldata guardians,
        uint256 requiredSignatures,
        address emergencyGuardian
    ) external returns (address) {
        require(owner != address(0), "Invalid owner");
        require(guardians.length > 0, "Need at least 1 guardian");
        require(requiredSignatures > 0 && requiredSignatures <= guardians.length, "Invalid signature count");
        require(emergencyGuardian != address(0), "Invalid emergency guardian");
        
        // Verify all guardians have SBT
        for (uint256 i = 0; i < guardians.length; i++) {
            require(guardians[i] != address(0), "Invalid guardian");
            require(
                guardianSBT.balanceOf(guardians[i]) > 0,
                "Guardian must hold guardian SBT"
            );
        }
        
        // Deploy vault
        SpendVaultWithSocialRecovery newVault = new SpendVaultWithSocialRecovery(
            owner,
            guardians,
            requiredSignatures,
            address(recoveryContract),
            emergencyGuardian
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
        info.guardians = guardians;
        info.requiredSignatures = requiredSignatures;
        info.emergencyGuardian = emergencyGuardian;
        info.createdAt = block.timestamp;
        info.isActive = true;
        
        // Register with recovery contract
        recoveryContract.registerVault(vaultAddress, defaultRecoveryQuorum, address(guardianSBT));
        
        emit VaultDeployed(
            vaultAddress,
            owner,
            guardians,
            requiredSignatures,
            block.timestamp
        );
        
        emit VaultRegisteredForRecovery(vaultAddress, defaultRecoveryQuorum, block.timestamp);
        
        return vaultAddress;
    }

    /**
     * @dev Deploy vault with custom recovery quorum
     * @param owner Vault owner
     * @param guardians Guardian addresses
     * @param requiredSignatures Signatures needed for approval
     * @param emergencyGuardian Emergency guardian
     * @param recoveryQuorum Guardians needed for recovery voting
     * @return newVault Address of deployed vault
     */
    function deployVaultWithCustomQuorum(
        address owner,
        address[] calldata guardians,
        uint256 requiredSignatures,
        address emergencyGuardian,
        uint256 recoveryQuorum
    ) external returns (address) {
        require(recoveryQuorum > 0 && recoveryQuorum <= guardians.length, "Invalid quorum");
        
        address vaultAddress = deployVault(owner, guardians, requiredSignatures, emergencyGuardian);
        
        // Update custom quorum if different from default
        if (recoveryQuorum != defaultRecoveryQuorum) {
            recoveryContract.updateVaultQuorum(vaultAddress, recoveryQuorum);
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
     * @dev Get vault guardians
     */
    function getVaultGuardians(address vault) external view returns (address[] memory) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].guardians;
    }

    /**
     * @dev Get required signatures for vault
     */
    function getRequiredSignatures(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].requiredSignatures;
    }

    /**
     * @dev Check if address is vault owner
     */
    function isVaultOwner(address vault, address account) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].owner == account;
    }

    /**
     * @dev Check if address is vault guardian
     */
    function isVaultGuardian(address vault, address account) external view returns (bool) {
        require(isDeployedByFactory[vault], "Vault not found");
        
        address[] memory guardians = vaultInfo[vault].guardians;
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == account) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get guardian count for vault
     */
    function getGuardianCount(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return vaultInfo[vault].guardians.length;
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

    // ==================== Recovery Management ====================

    /**
     * @dev Get recovery contract address
     */
    function getRecoveryContract() external view returns (address) {
        return address(recoveryContract);
    }

    /**
     * @dev Get recovery quorum for vault
     */
    function getRecoveryQuorum(address vault) external view returns (uint256) {
        require(isDeployedByFactory[vault], "Vault not found");
        return recoveryContract.getVaultQuorum(vault);
    }

    /**
     * @dev Update default recovery quorum for new vaults
     * @param newQuorum New default quorum
     */
    function updateDefaultRecoveryQuorum(uint256 newQuorum) external {
        require(newQuorum > 0, "Quorum must be > 0");
        defaultRecoveryQuorum = newQuorum;
    }

    /**
     * @dev Update recovery quorum for existing vault
     */
    function updateVaultRecoveryQuorum(address vault, uint256 newQuorum) external {
        require(isDeployedByFactory[vault], "Vault not found");
        require(msg.sender == vaultInfo[vault].owner, "Only owner");
        recoveryContract.updateVaultQuorum(vault, newQuorum);
    }

    /**
     * @dev Get recovery stats for vault
     */
    function getRecoveryStats(address vault) external view returns (
        uint256 totalAttempts,
        uint256 successful,
        uint256 successRate
    ) {
        require(isDeployedByFactory[vault], "Vault not found");
        return recoveryContract.getRecoveryStats(vault);
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
     * @dev Get average guardians per vault
     */
    function getAverageGuardianCount() external view returns (uint256) {
        if (deployedVaults.length == 0) return 0;
        
        uint256 totalGuardians = 0;
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            totalGuardians += vaultInfo[deployedVaults[i]].guardians.length;
        }
        
        return totalGuardians / deployedVaults.length;
    }

    /**
     * @dev Get deployment summary
     */
    function getDeploymentSummary() external view returns (
        uint256 totalVaults,
        uint256 activeVaults,
        uint256 totalGuardians
    ) {
        totalVaults = deployedVaults.length;
        
        uint256 active = 0;
        uint256 guardianSum = 0;
        
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            address vault = deployedVaults[i];
            if (vaultInfo[vault].isActive) {
                active++;
            }
            guardianSum += vaultInfo[vault].guardians.length;
        }
        
        return (totalVaults, active, guardianSum);
    }
}

// Interface definitions
interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}
