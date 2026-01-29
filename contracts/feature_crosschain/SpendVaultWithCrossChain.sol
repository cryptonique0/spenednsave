// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithCrossChain
/// @notice Vault with cross-chain interoperability (LayerZero/Axelar)

interface ILayerZeroAdapter {
    function sendMessage(uint16 dstChainId, bytes calldata payload) external;
}
interface IAxelarAdapter {
    function sendMessage(string calldata dstChain, string calldata dstAddress, bytes calldata payload) external;
}

contract SpendVaultWithCrossChain {
    address public owner;
    address public layerZeroAdapter;
    address public axelarAdapter;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _layerZeroAdapter, address _axelarAdapter) {
        owner = msg.sender;
        layerZeroAdapter = _layerZeroAdapter;
        axelarAdapter = _axelarAdapter;
    }

    /// @notice Send a cross-chain message via LayerZero
    function sendLayerZero(uint16 dstChainId, bytes calldata payload) external onlyOwner {
        ILayerZeroAdapter(layerZeroAdapter).sendMessage(dstChainId, payload);
    }

    /// @notice Send a cross-chain message via Axelar
    function sendAxelar(string calldata dstChain, string calldata dstAddress, bytes calldata payload) external onlyOwner {
        IAxelarAdapter(axelarAdapter).sendMessage(dstChain, dstAddress, payload);
    }
}
