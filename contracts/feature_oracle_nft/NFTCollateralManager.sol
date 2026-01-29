// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title NFTCollateralManager
/// @notice Manages NFT collateralization for vaults

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
}

contract NFTCollateralManager {
    // Events
    event NFTDeposited(address indexed vault, address indexed nft, uint256 tokenId, uint256 timestamp);
    event NFTWithdrawn(address indexed vault, address indexed nft, uint256 tokenId, uint256 timestamp);
    event NFTLiquidated(address indexed vault, address indexed nft, uint256 tokenId, uint256 timestamp);

    // vault => nft => tokenId => deposited
    mapping(address => mapping(address => mapping(uint256 => bool))) public isDeposited;

    /// @notice Deposit an NFT as collateral
    function depositNFT(address nft, uint256 tokenId) external {
        IERC721(nft).transferFrom(msg.sender, address(this), tokenId);
        isDeposited[msg.sender][nft][tokenId] = true;
        emit NFTDeposited(msg.sender, nft, tokenId, block.timestamp);
    }

    /// @notice Withdraw an NFT (only vault that deposited)
    function withdrawNFT(address nft, uint256 tokenId) external {
        require(isDeposited[msg.sender][nft][tokenId], "Not deposited");
        isDeposited[msg.sender][nft][tokenId] = false;
        IERC721(nft).transferFrom(address(this), msg.sender, tokenId);
        emit NFTWithdrawn(msg.sender, nft, tokenId, block.timestamp);
    }

    /// @notice Liquidate an NFT (admin or risk logic, placeholder)
    function liquidateNFT(address vault, address nft, uint256 tokenId) external {
        require(isDeposited[vault][nft][tokenId], "Not deposited");
        isDeposited[vault][nft][tokenId] = false;
        // TODO: transfer to liquidator or auction
        emit NFTLiquidated(vault, nft, tokenId, block.timestamp);
    }
}
