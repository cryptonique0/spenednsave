# Multi-Chain Yield Aggregation: Usage Guide

## Overview
This feature allows vaults to support and aggregate yield strategies across multiple blockchains, providing unified analytics and selection by chain.

## How It Works
- **Strategy Registration:**
  - Each strategy is registered with a `chainId`, address, name, and metadata.
- **Cross-Chain Analytics:**
  - The manager tracks metrics (APY, risk, etc.) for each strategy, per chain.
- **Aggregation:**
  - Vaults can query all strategies for a specific chain, or aggregate analytics across all chains.

## Contract APIs

### In YieldStrategyManager

#### Register Multi-Chain Strategy
```solidity
function registerStrategy(address vault, address strategy, uint256 chainId, string calldata name, string calldata metadata) external
```
- Registers a strategy for a vault, specifying the chain and metadata.

#### Get Vault Strategies by Chain
```solidity
function getVaultStrategiesByChain(address vault, uint256 chainId) external view returns (address[] memory)
```
- Returns all strategies for a vault on a given chain.

#### Aggregate Analytics
```solidity
function aggregateVaultAnalytics(address vault, uint256 chainId) external view returns (uint256 avgAPY, uint256 avgRisk, uint256 count)
```
- Aggregates APY, risk, and count for all strategies (optionally by chain, use chainId=0 for all).

### In SpendVault

#### Get Strategies by Chain
```solidity
function getVaultStrategiesByChain(uint256 chainId) public view returns (address[] memory)
```
- Returns all strategies for this vault on a given chain.

#### Aggregate Analytics
```solidity
function aggregateVaultAnalytics(uint256 chainId) public view returns (uint256 avgAPY, uint256 avgRisk, uint256 count)
```
- Aggregates analytics for all strategies (optionally by chain, use chainId=0 for all).

## Example Workflow
1. Register strategies for a vault on different chains.
2. Query strategies and analytics by chain or globally.
3. Use aggregated data for cross-chain yield optimization.

---
For further details, see the contract code or contact the development team.
