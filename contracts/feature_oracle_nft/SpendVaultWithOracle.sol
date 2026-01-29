// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithOracle
/// @notice Vault with Chainlink oracle integration for price/risk management
interface IOracleManager {
    function getLatestPrice(address asset) external returns (int256);
}

contract SpendVaultWithOracle {
    address public owner;
    address public oracleManager;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _oracleManager) {
        owner = msg.sender;
        oracleManager = _oracleManager;
    }

    /// @notice Withdraw funds with price check (e.g., only if price above threshold)
    function withdraw(address asset, address payable to, uint256 amount, int256 minPrice) external onlyOwner {
        int256 price = IOracleManager(oracleManager).getLatestPrice(asset);
        require(price >= minPrice, "Price below threshold");
        // For ETH
        if (asset == address(0)) {
            require(address(this).balance >= amount, "Insufficient balance");
            (bool sent, ) = to.call{value: amount}("");
            require(sent, "Transfer failed");
        } else {
            // For ERC20
            // TODO: implement ERC20 transfer
        }
    }

    /// @notice Deposit ETH
    function deposit() external payable {}
}
