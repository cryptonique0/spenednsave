// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SpendVaultWithSafeMode.sol";
import "./SafeModeController.sol";

/**
 * @title VaultFactoryWithSafeMode
 * @notice Factory for deploying SpendVault instances with safe mode support
 * @dev Uses minimal proxy pattern for gas efficiency
 */

contract VaultFactoryWithSafeMode {
    /// @notice Guardian SBT contract
    address public guardianToken;

    /// @notice Safe mode controller (singleton)
    SafeModeController public safeModeController;

    /// @notice Vault implementation for cloning
    address public vaultImplementation;

    /// @notice All deployed vaults
    address[] public deployedVaults;

    /// @notice Is address a deployed vault
    mapping(address => bool) public isVault;

    /// @notice Owner to vaults mapping
    mapping(address => address[]) public ownerVaults;

    /// @notice Vault counter
    uint256 public vaultCount;

    // Events
    event VaultDeployed(
        address indexed vault,
        address indexed owner,
        address safeModeController,
        uint256 quorum,
        uint256 timestamp
    );
    event SafeModeControllerCreated(address safeModeController, uint256 timestamp);
    event VaultImplementationUpdated(address newImplementation, uint256 timestamp);

    // Constructor
    constructor(address _guardianToken, address _vaultImplementation) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_vaultImplementation != address(0), "Invalid implementation");

        guardianToken = _guardianToken;
        vaultImplementation = _vaultImplementation;

        // Create singleton SafeModeController
        safeModeController = new SafeModeController();

        emit SafeModeControllerCreated(address(safeModeController), block.timestamp);
    }

    /// @notice Deploy a new vault with safe mode support
    function deployVault(uint256 quorum) external returns (address vault) {
        require(quorum > 0, "Invalid quorum");

        // Clone implementation
        vault = Clones.clone(vaultImplementation);

        // Initialize proxy
        SpendVaultWithSafeMode(vault).initialize(guardianToken, address(safeModeController), quorum);

        // Register with safe mode controller
        safeModeController.registerVault(vault, msg.sender);

        // Track vault
        isVault[vault] = true;
        deployedVaults.push(vault);
        ownerVaults[msg.sender].push(vault);
        vaultCount++;

        emit VaultDeployed(vault, msg.sender, address(safeModeController), quorum, block.timestamp);

        return vault;
    }

    /// @notice Get total vault count
    function getVaultCount() external view returns (uint256) {
        return vaultCount;
    }

    /// @notice Get all deployed vaults
    function getAllVaults() external view returns (address[] memory) {
        return deployedVaults;
    }

    /// @notice Get vaults for specific owner
    function getOwnerVaults(address owner) external view returns (address[] memory) {
        return ownerVaults[owner];
    }

    /// @notice Get vault count for owner
    function getOwnerVaultCount(address owner) external view returns (uint256) {
        return ownerVaults[owner].length;
    }

    /// @notice Get vault at specific index
    function getVaultAt(uint256 index) external view returns (address) {
        require(index < deployedVaults.length, "Index out of bounds");
        return deployedVaults[index];
    }

    /// @notice Check if address is a vault
    function isDeployedVault(address vault) external view returns (bool) {
        return isVault[vault];
    }

    /// @notice Get safe mode controller address
    function getSafeModeControllerAddress() external view returns (address) {
        return address(safeModeController);
    }

    /// @notice Get vault implementation address
    function getVaultImplementation() external view returns (address) {
        return vaultImplementation;
    }

    /// @notice Get guardian token address
    function getGuardianToken() external view returns (address) {
        return guardianToken;
    }

    /// @notice Get factory statistics
    function getStatistics()
        external
        view
        returns (
            uint256 totalVaults,
            uint256 totalSafeModeEnabled,
            uint256 totalToggleCount
        )
    {
        totalVaults = vaultCount;

        // Count safes with safe mode enabled
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            if (safeModeController.isSafeModeEnabled(deployedVaults[i])) {
                totalSafeModeEnabled++;
            }

            SafeModeController.SafeModeConfig memory config = safeModeController.getSafeModeConfig(deployedVaults[i]);
            totalToggleCount += config.totalToggles;
        }

        return (totalVaults, totalSafeModeEnabled, totalToggleCount);
    }
}
