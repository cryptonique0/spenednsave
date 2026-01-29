// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PaymasterManager
/// @notice Manages relayer/paymaster support for native gasless transactions
contract PaymasterManager {
    // Events
    event PaymasterRegistered(address indexed paymaster, uint256 timestamp);
    event PaymasterUsed(address indexed paymaster, address indexed user, uint256 value, uint256 timestamp);
    event PaymasterBalanceToppedUp(address indexed paymaster, uint256 amount, uint256 timestamp);
    event PaymasterWithdrawn(address indexed paymaster, uint256 amount, uint256 timestamp);

    // ...core logic to be implemented...
}
