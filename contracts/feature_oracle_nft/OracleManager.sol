// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title OracleManager
/// @notice Integrates Chainlink oracles for price feeds, withdrawal limits, and risk triggers
interface IChainlinkAggregator {
    function latestAnswer() external view returns (int256);
}

contract OracleManager {
    // Events
    event PriceFeedUpdated(address indexed asset, address indexed feed, uint256 timestamp);
    event PriceQueried(address indexed asset, int256 price, uint256 timestamp);
    event RiskTriggered(address indexed vault, string reason, uint256 timestamp);

    // asset => price feed
    mapping(address => address) public priceFeeds;

    // Only owner placeholder
    address public owner;
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Set or update a Chainlink price feed for an asset
    function setPriceFeed(address asset, address feed) external onlyOwner {
        priceFeeds[asset] = feed;
        emit PriceFeedUpdated(asset, feed, block.timestamp);
    }

    /// @notice Get the latest price for an asset
    function getLatestPrice(address asset) public returns (int256 price) {
        address feed = priceFeeds[asset];
        require(feed != address(0), "No price feed");
        price = IChainlinkAggregator(feed).latestAnswer();
        emit PriceQueried(asset, price, block.timestamp);
    }

    /// @notice Trigger a risk event (e.g., price drop)
    function triggerRisk(address vault, string calldata reason) external onlyOwner {
        emit RiskTriggered(vault, reason, block.timestamp);
    }
}
