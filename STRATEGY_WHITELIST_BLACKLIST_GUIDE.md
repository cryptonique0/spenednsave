# Strategy Whitelisting/Blacklisting: Usage Guide

## Overview
This feature allows governance to whitelist or blacklist yield strategies based on audits, performance, or risk. Only whitelisted and non-blacklisted strategies can be registered or allocated to vaults.

## How It Works
- **Governance Control:**
  - Governance can call manager functions to whitelist or blacklist strategies.
- **Enforcement:**
  - Only whitelisted and non-blacklisted strategies can be registered or suggested for allocation.
- **Vault Integration:**
  - Vaults can query the whitelist/blacklist status of any strategy via the manager.

## Contract APIs

### In YieldStrategyManager

#### Whitelist a Strategy
```solidity
function setStrategyWhitelisted(address strategy, bool whitelisted) external onlyGovernance
```
- Only callable by governance.

#### Blacklist a Strategy
```solidity
function setStrategyBlacklisted(address strategy, bool blacklisted) external onlyGovernance
```
- Only callable by governance.

#### Query Status
```solidity
function whitelistedStrategies(address strategy) external view returns (bool)
function blacklistedStrategies(address strategy) external view returns (bool)
```

### In SpendVault

#### Query Whitelist/Blacklist
```solidity
function isStrategyWhitelisted(address strategy) public view returns (bool)
function isStrategyBlacklisted(address strategy) public view returns (bool)
```
- Calls through to the manager.

## Example Workflow
1. Governance whitelists or blacklists strategies as needed.
2. Vaults and users can check the status before interacting with a strategy.
3. Only whitelisted/non-blacklisted strategies can be registered or allocated.

---
For further details, see the contract code or contact the development team.
