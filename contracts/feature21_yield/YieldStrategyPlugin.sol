// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldStrategyPlugin
/// @notice Pluggable strategy contract for protocol integration

/// @notice Abstract base for protocol-specific yield strategy plugins
abstract contract YieldStrategyPlugin {
    /// @notice Deposit funds into the yield protocol
    function deposit(uint256 amount) external virtual;

    /// @notice Withdraw funds from the yield protocol
    function withdraw(uint256 amount) external virtual;

    /// @notice Emergency withdraw all funds from the protocol
    function emergencyWithdraw(uint256 amount) external virtual;

    /// @notice Harvest yield and send to vault
    function harvest() external virtual returns (uint256);
}
