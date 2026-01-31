# User-Defined Strategy Preferences: Usage Guide

## Overview
This feature allows each user to set and update their own prioritized list of preferred yield strategies for their deposits in a given vault. The system will use these preferences to suggest allocations and influence automated strategy selection.

## How It Works
- **Preference Storage:**
  - Preferences are stored in `YieldStrategyManager` as an ordered list of strategy addresses per user per vault.
- **Integration:**
  - When suggesting allocations, the manager prioritizes user preferences if set; otherwise, it uses the default allocation logic.
  - The vault exposes functions to set and get preferences via the manager.

## Contract APIs

### In SpendVault

#### Set User Preferences
```solidity
function setUserStrategyPreferences(address[] calldata strategies) external
```
- Call this to set your preferred strategies (ordered by priority) for the current vault.
- Example:
  ```solidity
  address[] memory prefs = new address[](2);
  prefs[0] = 0xStrategyA;
  prefs[1] = 0xStrategyB;
  vault.setUserStrategyPreferences(prefs);
  ```

#### Get User Preferences
```solidity
function getUserStrategyPreferences(address user) public view returns (address[] memory)
```
- Returns the user's current strategy preference list for this vault.

### In YieldStrategyManager

#### Suggest Allocations
```solidity
function suggestAllocations(address user, address vault) external view returns (address[] memory strategies, uint256[] memory allocations)
```
- Returns strategies and allocation percentages (basis points, 0-10000) for the user and vault, prioritizing user preferences if set.

#### Set Preferences (Direct)
```solidity
function setUserStrategyPreferences(address vault, address[] calldata strategies) external
```
- (Usually called via the vault for access control.)

#### Get Preferences (Direct)
```solidity
function getUserStrategyPreferences(address user, address vault) external view returns (address[] memory)
```

## Example Workflow
1. User calls `setUserStrategyPreferences` on their vault with an ordered list of strategies.
2. When allocations are suggested (e.g., for new deposits), the system uses the user's preferences if set.
3. User or dApp can query preferences at any time.

## Notes
- If no preferences are set, the system falls back to default allocation logic.
- Preferences can be updated at any time by calling `setUserStrategyPreferences` again.

---
For further details, see the contract code or contact the development team.
