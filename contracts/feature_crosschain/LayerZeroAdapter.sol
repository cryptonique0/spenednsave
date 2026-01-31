// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LayerZeroAdapter
/// @notice Adapter for LayerZero cross-chain messaging

contract LayerZeroAdapter {
    event MessageSent(address indexed from, uint16 dstChainId, bytes payload, uint256 timestamp);
    event MessageReceived(address indexed to, uint16 srcChainId, bytes payload, uint256 timestamp);

    // Simulated send message (in real use, call LayerZero endpoint)
    function sendMessage(uint16 dstChainId, bytes calldata payload) external {
        // TODO: integrate with LayerZero endpoint
        emit MessageSent(msg.sender, dstChainId, payload, block.timestamp);
    }

    // Simulated receive message (in real use, called by LayerZero endpoint)
    function receiveMessage(uint16 srcChainId, bytes calldata payload) external {
        // TODO: access control for endpoint
        emit MessageReceived(msg.sender, srcChainId, payload, block.timestamp);
    }
}
