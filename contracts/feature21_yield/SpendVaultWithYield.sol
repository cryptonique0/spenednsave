// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithYield
/// @notice Vault with automated yield integration
contract SpendVaultWithYield {
    address public owner;
    address public yieldStrategyManager;
    address public strategy;

    // Placeholder for guardian-only modifier
    modifier onlyGuardian() {
        // TODO: integrate with guardian system
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _yieldStrategyManager) {
        owner = msg.sender;
        yieldStrategyManager = _yieldStrategyManager;
    }

    /// @notice Deposit funds into the vault
    function deposit() external payable {
        // Accept ETH deposits
    }

    /// @notice Withdraw funds from the vault (owner or guardian)
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
    }

    /// @notice Set or update the yield strategy (guardian only)
    function setStrategy(address _strategy) external onlyGuardian {
        strategy = _strategy;
        // Register with manager
        // TODO: call YieldStrategyManager.registerStrategy
    }

    /// @notice Deposit funds into the yield strategy (guardian only)
    function depositToStrategy(uint256 amount) external onlyGuardian {
        require(strategy != address(0), "No strategy");
        // TODO: call strategy deposit logic
    }

    /// @notice Withdraw funds from the yield strategy (guardian only)
    function withdrawFromStrategy(uint256 amount) external onlyGuardian {
        require(strategy != address(0), "No strategy");
        // TODO: call strategy withdraw logic
    }

    /// @notice Emergency withdraw from strategy (guardian only)
    function emergencyWithdrawFromStrategy(uint256 amount) external onlyGuardian {
        require(strategy != address(0), "No strategy");
        // TODO: call strategy emergency withdraw logic
    }
}
