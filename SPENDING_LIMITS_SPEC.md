# Spending Limits Feature Specification

## Overview

The Spending Limits feature adds intelligent withdrawal caps to SpendVault, enabling vault owners to enforce daily, weekly, and monthly spending limits per token. When a withdrawal exceeds any active limit, it automatically escalates to require "enhanced approvals" (75% of guardians) instead of the standard quorum threshold.

## Motivation

- **Fraud Protection**: Limits constrain the impact of a single compromised account
- **Operational Safety**: Prevents accidental large transactions
- **Risk Stratification**: Different limits for different token types
- **Governance Escalation**: Significant spends trigger broader guardian consensus

## Contract Changes

### New Structs

```solidity
struct SpendingLimitStatus {
    bool exceedsDaily;
    bool exceedsWeekly;
    bool exceedsMonthly;
    uint256 dailyUsed;
    uint256 weeklyUsed;
    uint256 monthlyUsed;
}
```

Returns detailed spending status including boolean flags for each exceeded limit and current usage amounts.

### New Events

```solidity
event SpendingLimitExceeded(
    address indexed token,
    string limitType,      // "daily", "weekly", or "monthly"
    uint256 attemptedAmount,
    uint256 limitAmount
);

event EnhancedApprovalsRequired(
    uint256 indexed nonce,
    uint256 approvalsNeeded,
    string limitExceeded   // which limit was exceeded
);
```

### New Mappings

```solidity
// Track which withdrawals require enhanced approvals
mapping(uint256 => bool) public requiresEnhancedApprovals;

// Track how many enhanced approvals are needed for each withdrawal
mapping(uint256 => uint256) public enhancedApprovalsNeeded;

// Track how many enhanced approvals have been received
mapping(uint256 => uint256) public enhancedApprovalsReceived;
```

### New Query Functions

#### `checkSpendingLimitStatus(address token, uint256 amount) -> SpendingLimitStatus`

Checks if a proposed withdrawal would exceed any active limits for the given token.

**Parameters:**
- `token`: Token contract address (address(0) for native ETH)
- `amount`: Proposed withdrawal amount in token units

**Returns:**
- `SpendingLimitStatus` struct with:
  - `exceedsDaily`: true if amount + current daily usage > daily limit
  - `exceedsWeekly`: true if amount + current weekly usage > weekly limit
  - `exceedsMonthly`: true if amount + current monthly usage > monthly limit
  - `dailyUsed`, `weeklyUsed`, `monthlyUsed`: Current usage for each period

**Example:**
```solidity
SpendingLimitStatus memory status = vault.checkSpendingLimitStatus(
    0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, // USDC
    1000000000000000000 // 1 USDC (accounting for decimals)
);

if (status.exceedsDaily || status.exceedsWeekly || status.exceedsMonthly) {
    // This withdrawal requires enhanced approvals
}
```

#### `getGuardianCount() -> uint256`

Returns the total number of guardians in the vault.

**Returns:**
- Number of addresses holding the GuardianSBT token

**Usage:**
```solidity
uint256 totalGuardians = vault.getGuardianCount();
```

#### `getEnhancedApprovalsRequired() -> uint256`

Returns the number of guardians required to approve a withdrawal that exceeds spending limits (75% of total guardians, rounded up).

**Returns:**
- `ceil(totalGuardians * 0.75)` = ceiling of 75% of guardian count

**Examples:**
- 4 guardians → 3 required
- 10 guardians → 8 required
- 5 guardians → 4 required

**Usage:**
```solidity
uint256 required = vault.getEnhancedApprovalsRequired();
require(validSignatures >= required, "Need more guardian approvals");
```

### Modified Functions

#### `withdraw(...) -> ()`

The main withdrawal function now includes spending limit enforcement:

**New Logic:**
1. Verifies EIP-712 signatures and counts valid signatures (existing)
2. **NEW**: Calls `checkSpendingLimitStatus(token, amount)`
3. **NEW**: If any limit exceeded:
   - Requires `validSignatures >= getEnhancedApprovalsRequired()`
   - Sets `requiresEnhancedApprovals[nonce] = true`
   - Records `enhancedApprovalsNeeded[nonce]`
   - Emits `SpendingLimitExceeded` event
   - Emits `EnhancedApprovalsRequired` event
4. Otherwise (limits not exceeded):
   - Uses standard quorum logic: `validSignatures >= quorum`
   - Does NOT emit SpendingLimitExceeded event
5. Executes transfer and updates counters (existing)

**Decision Tree:**
```
if (checkSpendingLimitStatus() returns limit exceeded) {
    require(validSignatures >= getEnhancedApprovalsRequired())
    emit SpendingLimitExceeded(...)
    emit EnhancedApprovalsRequired(...)
} else {
    require(validSignatures >= quorum OR trustScoreSum >= threshold)
}
```

## Integration Points

### Backend / Off-Chain

**API Endpoint:** `GET /api/spending/status?vault=0x...&token=0x...`

Returns:
```json
{
  "vault": "0x...",
  "token": "0x...",
  "timestamp": 1705500000,
  "nextDailyReset": 1705586400,
  "nextWeeklyReset": 1706105200,
  "nextMonthlyReset": 1708092000,
  "warningThresholds": {
    "warning": 75,
    "critical": 95
  }
}
```

Client-side components fetch actual spending data via wagmi hooks to `checkSpendingLimitStatus()` and `withdrawalCaps()`.

### Frontend Components

#### `<SpendingLimitManager />`

React component for setting/updating spending limits:
- Input fields for daily, weekly, monthly amounts
- Validation (amounts must be positive, weekly >= daily, monthly >= weekly)
- Confirmation dialog before submission
- Calls `setWithdrawalCaps()` on vault contract

#### `<SpendingDashboard />`

React component for visualizing spending:
- Real-time progress bars showing usage vs limits
- Color-coded warnings (green/yellow/red)
- Time-until-reset countdowns
- Enhanced approval alert when limits exceeded
- Refreshes every 30 seconds

## Limit Reset Logic

Limits reset based on time:

```solidity
dayIndex = block.timestamp / 1 days
weekIndex = block.timestamp / 1 weeks
monthIndex = block.timestamp / 30 days
```

After the time period elapses, the index increments, and usage counters reset to zero for that period.

**Important:** The `_checkWithdrawalCaps()` function uses these indices to determine which counter to check/update.

## Security Considerations

1. **No Bypass for Owner**: Limits apply to all withdrawals, including emergency unlocks
2. **Temporal Safety**: Using block.timestamp / periodLength prevents granular timing attacks
3. **Nonce Safety**: Each withdrawal has a unique nonce, preventing replay
4. **Enhanced Approvals are Mandatory**: Contract enforces 75% threshold in code (no soft checks)
5. **Immutable History**: All limit violations are emitted as events for audit trail

## Gas Optimization

- `checkSpendingLimitStatus()` is a view function (no state changes)
- Limit checks are performed before state mutations
- Single require() per limit type (fail-fast)
- Mappings use existing index structures (no new storage overhead)

## Testing

See [contracts/SpendVault.spendingLimits.test.ts](../contracts/SpendVault.spendingLimits.test.ts) for comprehensive test suite covering:

- ✅ Basic limit enforcement
- ✅ Enhanced approvals requirement
- ✅ Multiple tokens with independent limits
- ✅ Limit reset boundaries
- ✅ Edge cases (zero limits, exact limit amounts)
- ✅ Guardian count calculations
- ✅ Event emission validation

## Future Enhancements

1. **Spending Allowances**: Pre-approve certain recipients to withdraw up to a limit without guardian approval
2. **Dynamic Limits**: Adjust limits based on vault balance or rolling 30-day average
3. **Role-Based Limits**: Different limits for different guardian roles/trust levels
4. **Tiered Approvals**: Scale required guardians with withdrawal size
5. **Limit Expiry**: Set expiration dates for temporary limit increases
