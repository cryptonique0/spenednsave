# Emergency Strategy Exit: Usage Guide

## Overview
This feature allows a vault owner or guardian to trigger an emergency withdrawal (exit) from an underperforming or risky yield strategy. The exit is coordinated via the YieldStrategyManager, which calls the strategy's emergencyWithdraw function.

## How It Works
- **Trigger:**
  - The vault owner or any guardian can call `emergencyStrategyExit` on the vault, specifying the amount to withdraw.
  - The vault calls the manager, which in turn calls the strategy's `emergencyWithdraw` function.
- **Access Control:**
  - Only the vault itself or a recognized guardian can trigger the emergency exit (guardian check is a placeholder for now).
- **Strategy Contract:**
  - Must implement an `emergencyWithdraw(uint256 amount)` function.

## Contract APIs

### In SpendVault

#### Trigger Emergency Exit
```solidity
function emergencyStrategyExit(uint256 amount) external
```
- Can be called by the vault owner or any guardian.
- Example:
  ```solidity
  vault.emergencyStrategyExit(1000 ether);
  ```

### In YieldStrategyManager

#### Emergency Withdraw
```solidity
function emergencyWithdraw(address vault, uint256 amount) external
```
- Can be called by the vault or a guardian.
- Calls the current strategy's `emergencyWithdraw` function.

## Example Workflow
1. Owner or guardian detects a risk or underperformance.
2. Calls `emergencyStrategyExit(amount)` on the vault.
3. Vault calls manager, which calls the strategy's emergency withdraw.
4. Funds are withdrawn from the strategy back to the vault.

## Notes
- Guardian check in the manager is currently a stub and should be integrated with the actual guardian system.
- The strategy contract must support the `emergencyWithdraw(uint256)` interface.

---
For further details, see the contract code or contact the development team.
