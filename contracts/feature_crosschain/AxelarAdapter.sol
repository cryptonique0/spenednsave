// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AxelarAdapter
/// @notice Adapter for Axelar cross-chain messaging

contract AxelarAdapter {
    event MessageSent(address indexed from, string dstChain, string dstAddress, bytes payload, uint256 timestamp);
    event MessageReceived(address indexed to, string srcChain, string srcAddress, bytes payload, uint256 timestamp);

    // Simulated send message (in real use, call Axelar gateway)
    function sendMessage(string calldata dstChain, string calldata dstAddress, bytes calldata payload) external {
        // TODO: integrate with Axelar gateway
        emit MessageSent(msg.sender, dstChain, dstAddress, payload, block.timestamp);
    }

    // Simulated receive message (in real use, called by Axelar gateway)
    function receiveMessage(string calldata srcChain, string calldata srcAddress, bytes calldata payload) external {
        // TODO: access control for gateway
        emit MessageReceived(msg.sender, srcChain, srcAddress, payload, block.timestamp);
    }
}
