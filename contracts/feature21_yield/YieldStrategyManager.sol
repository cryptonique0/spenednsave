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

    // ...core logic to be implemented...
}
