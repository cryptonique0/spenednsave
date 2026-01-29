// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title VaultFactoryWithYield
/// @notice Factory for deploying yield-enabled vaults
import "./SpendVaultWithYield.sol";

contract VaultFactoryWithYield {
    address public yieldStrategyManager;
    address[] public allVaults;

    event VaultDeployed(address indexed owner, address vault, uint256 timestamp);

    constructor(address _yieldStrategyManager) {
        yieldStrategyManager = _yieldStrategyManager;
    }

    /// @notice Deploy a new SpendVaultWithYield for the caller
    function createVault() external returns (address vault) {
        vault = address(new SpendVaultWithYield(yieldStrategyManager));
        allVaults.push(vault);
        emit VaultDeployed(msg.sender, vault, block.timestamp);
        // Optionally: register with YieldStrategyManager
    }

    /// @notice Get all deployed vaults
    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }
}
