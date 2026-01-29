// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldStrategyManager
/// @notice Manages yield strategies and protocol integrations for SpendVaults
contract YieldStrategyManager {
    // Events
    event StrategyRegistered(address indexed vault, address indexed strategy, uint256 timestamp);
    event StrategyUpgraded(address indexed vault, address indexed oldStrategy, address indexed newStrategy, uint256 timestamp);
    event YieldHarvested(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);
    event EmergencyWithdrawal(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);

    // Mapping: vault => strategy
    mapping(address => address) public vaultStrategy;

    // Placeholder for guardian-only modifier
    modifier onlyGuardian(address vault) {
        // TODO: integrate with guardian system
        _;
    }

    /// @notice Register a new yield strategy for a vault
    function registerStrategy(address vault, address strategy) external onlyGuardian(vault) {
        require(vaultStrategy[vault] == address(0), "Strategy already registered");
        vaultStrategy[vault] = strategy;
        emit StrategyRegistered(vault, strategy, block.timestamp);
    }

    /// @notice Upgrade the yield strategy for a vault
    function upgradeStrategy(address vault, address newStrategy) external onlyGuardian(vault) {
        address oldStrategy = vaultStrategy[vault];
        require(oldStrategy != address(0), "No strategy registered");
        require(newStrategy != address(0), "Invalid new strategy");
        vaultStrategy[vault] = newStrategy;
        emit StrategyUpgraded(vault, oldStrategy, newStrategy, block.timestamp);
    }

    /// @notice Emergency withdraw all funds from strategy back to vault
    function emergencyWithdraw(address vault, uint256 amount) external onlyGuardian(vault) {
        address strategy = vaultStrategy[vault];
        require(strategy != address(0), "No strategy registered");
        // TODO: call strategy emergency withdraw logic
        emit EmergencyWithdrawal(vault, amount, strategy, block.timestamp);
    }

    /// @notice Harvest yield from strategy
    function harvestYield(address vault) external onlyGuardian(vault) {
        address strategy = vaultStrategy[vault];
        require(strategy != address(0), "No strategy registered");
        // TODO: call strategy harvest logic and transfer yield to vault
        uint256 harvested = 0; // Placeholder
        emit YieldHarvested(vault, harvested, strategy, block.timestamp);
    }
}
