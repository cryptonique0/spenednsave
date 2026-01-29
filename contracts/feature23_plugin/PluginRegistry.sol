// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PluginRegistry
/// @notice Registry and permissioning for plugins
contract PluginRegistry {
    // Events
    event PluginRegistered(address indexed plugin, string version, uint256 timestamp);
    event PluginEnabled(address indexed vault, address indexed plugin, uint256 timestamp);
    event PluginDisabled(address indexed vault, address indexed plugin, uint256 timestamp);

    // ...core logic to be implemented...
}
