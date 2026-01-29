// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithNFTCollateral
/// @notice Vault with NFT collateralization support
interface INFTCollateralManager {
    function depositNFT(address nft, uint256 tokenId) external;
    function withdrawNFT(address nft, uint256 tokenId) external;
}

contract SpendVaultWithNFTCollateral {
    address public owner;
    address public collateralManager;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _collateralManager) {
        owner = msg.sender;
        collateralManager = _collateralManager;
    }

    /// @notice Deposit an NFT as collateral
    function depositNFT(address nft, uint256 tokenId) external onlyOwner {
        INFTCollateralManager(collateralManager).depositNFT(nft, tokenId);
    }

    /// @notice Withdraw an NFT collateral
    function withdrawNFT(address nft, uint256 tokenId) external onlyOwner {
        INFTCollateralManager(collateralManager).withdrawNFT(nft, tokenId);
    }
}
