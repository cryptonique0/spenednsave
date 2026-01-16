# Guardian-Enforced Spending Limits - Code Reference

Quick reference guide to key code snippets and their usage.

## Smart Contract: Key Functions

### checkSpendingLimitStatus()

**Purpose:** Query if a proposed withdrawal would exceed spending limits

```solidity
/**
 * @notice Check spending limits for a token
 * @param token Token contract address (address(0) for ETH)
 * @param amount Amount to check (in token units, accounting for decimals)
 * @return SpendingLimitStatus struct with usage and exceeded flags
 */
function checkSpendingLimitStatus(address token, uint256 amount)
    external view
    returns (SpendingLimitStatus memory)
{
    WithdrawalCap memory cap = withdrawalCaps[token];
    uint256 dayIndex = block.timestamp / 1 days;
    uint256 weekIndex = block.timestamp / 1 weeks;
    uint256 monthIndex = block.timestamp / 30 days;

    uint256 dailyUsed = withdrawnDaily[token][dayIndex];
    uint256 weeklyUsed = withdrawnWeekly[token][weekIndex];
    uint256 monthlyUsed = withdrawnMonthly[token][monthIndex];

    return SpendingLimitStatus({
        exceedsDaily: cap.daily > 0 && dailyUsed + amount > cap.daily,
        exceedsWeekly: cap.weekly > 0 && weeklyUsed + amount > cap.weekly,
        exceedsMonthly: cap.monthly > 0 && monthlyUsed + amount > cap.monthly,
        dailyUsed: dailyUsed,
        weeklyUsed: weeklyUsed,
        monthlyUsed: monthlyUsed
    });
}
```

### getEnhancedApprovalsRequired()

**Purpose:** Calculate 75% guardian threshold for limit violations

```solidity
/**
 * @notice Calculate enhanced approvals required (75% of guardians)
 * @return Number of guardians required to approve limit violations
 */
function getEnhancedApprovalsRequired() public view returns (uint256) {
    uint256 guardianCount = getGuardianCount();
    if (guardianCount == 0) return 1;
    // Return ceil(guardianCount * 0.75)
    return (guardianCount * 3 + 3) / 4;
}
```

### withdraw() - Modified Logic

**Key changes in withdrawal flow:**

```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    string memory category,
    uint256 createdAt,
    bytes[] memory signatures
) external nonReentrant {
    // ... existing: signature verification, guardian checks ...
    
    // [NEW] Check spending limits
    address _token = token;
    SpendingLimitStatus memory limitStatus = checkSpendingLimitStatus(_token, amount);
    bool limitViolated = limitStatus.exceedsDaily || 
                         limitStatus.exceedsWeekly || 
                         limitStatus.exceedsMonthly;
    
    uint256 requiredApprovals;
    
    if (limitViolated) {
        // Enhanced approvals required for limit violations
        requiredApprovals = getEnhancedApprovalsRequired();
        require(
            validSignatures >= requiredApprovals,
            "Enhanced approvals required for spending limit violation"
        );
        
        // Track enhanced approval requirement
        requiresEnhancedApprovals[nonce] = true;
        enhancedApprovalsNeeded[nonce] = requiredApprovals;
        
        // Emit events
        string memory limitType = limitStatus.exceedsDaily ? "daily" : 
                                  limitStatus.exceedsWeekly ? "weekly" : "monthly";
        uint256 limitAmount = limitStatus.exceedsDaily ? withdrawalCaps[_token].daily :
                             limitStatus.exceedsWeekly ? withdrawalCaps[_token].weekly :
                             withdrawalCaps[_token].monthly;
        emit SpendingLimitExceeded(_token, limitType, amount, limitAmount);
        emit EnhancedApprovalsRequired(nonce, requiredApprovals, limitType);
    } else {
        // Standard quorum validation
        if (weightedQuorumEnabled) {
            require(trustScoreSum >= weightedQuorumThreshold, "Weighted quorum not met");
        } else {
            require(validSignatures >= quorum, "Quorum not met");
        }
    }
    
    // ... existing: execute transfer, update counters ...
}
```

## Frontend: React Components

### SpendingDashboard Usage

```typescript
import { SpendingDashboard } from '@/components/spending-limits/spending-dashboard';
import { type Address } from 'viem';

export function VaultPage({ vaultAddress }: { vaultAddress: Address }) {
  const usdcAddress: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Vault Overview</h1>
      
      {/* Real-time spending dashboard */}
      <SpendingDashboard
        vaultAddress={vaultAddress}
        tokenAddress={usdcAddress}
        tokenSymbol="USDC"
        refreshInterval={30000} // Refresh every 30 seconds
      />
    </div>
  );
}
```

### SpendingLimitManager Usage

```typescript
import { SpendingLimitManager } from '@/components/spending-limits/limit-manager';
import { type Address } from 'viem';

export function VaultSettingsPage({ vaultAddress }: { vaultAddress: Address }) {
  const usdcAddress: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

  const handleLimitsUpdated = () => {
    console.log('Spending limits have been updated!');
    // Trigger refresh of spending dashboard
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Spending Limits</h1>
      
      {/* Set limits for USDC */}
      <SpendingLimitManager
        vaultAddress={vaultAddress}
        tokenAddress={usdcAddress}
        tokenSymbol="USDC"
        onLimitsUpdated={handleLimitsUpdated}
      />
    </div>
  );
}
```

## Backend: API Endpoints

### Spending Status Endpoint

**Endpoint:** `GET /api/spending/status`

**Query Parameters:**
```
vault=0x...    (required) Vault contract address
token=0x...    (required) Token contract address
```

**Example Request:**
```bash
curl "http://localhost:3000/api/spending/status?vault=0x123abc...&token=0xabc123..."
```

**Response:**
```json
{
  "vault": "0x123abc...",
  "token": "0xabc123...",
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

## Testing: Key Test Cases

### Test: Enhanced Approvals Required for Violation

```typescript
it('should require enhanced approvals for daily limit violation', async () => {
  const tokenAddr = await token.getAddress();
  const recipientAddr = await recipient.getAddress();
  const withdrawAmount = ethers.parseEther('150'); // Exceeds 100 daily limit

  // Set daily limit to 100
  await setWithdrawalLimits(
    await vault.getAddress(),
    tokenAddr,
    ethers.parseEther('100'),
    ethers.parseEther('500'),
    ethers.parseEther('1000')
  );

  // Sign with only 2 guardians (standard quorum)
  const nonce = await vault.nonce();
  const sig1 = await signWithdrawal(guardian1, tokenAddr, withdrawAmount, recipientAddr, nonce);
  const sig2 = await signWithdrawal(guardian2, tokenAddr, withdrawAmount, recipientAddr, nonce);

  // Should fail - needs enhanced approvals (3 of 4)
  await expect(
    vault.withdraw(tokenAddr, withdrawAmount, recipientAddr, 'Over limit', 'ops', now, [sig1, sig2])
  ).to.be.revertedWith('Enhanced approvals required for spending limit violation');

  // Now sign with 3 guardians
  const sig3 = await signWithdrawal(guardian3, tokenAddr, withdrawAmount, recipientAddr, nonce);

  // Should succeed with enhanced approvals
  const tx = await vault.withdraw(tokenAddr, withdrawAmount, recipientAddr, 'Over limit', 'ops', now, [sig1, sig2, sig3]);
  await expect(tx).to.not.be.reverted;
});
```

### Test: Multiple Tokens Have Independent Limits

```typescript
it('should track limits independently per token', async () => {
  const token1Addr = await token.getAddress();
  const token2Addr = await token2.getAddress();

  // Different limits for each token
  await setWithdrawalLimits(await vault.getAddress(), token1Addr, 
    ethers.parseEther('100'), ethers.parseEther('500'), ethers.parseEther('1000')
  );
  
  await setWithdrawalLimits(await vault.getAddress(), token2Addr,
    ethers.parseEther('50'), ethers.parseEther('250'), ethers.parseEther('500')
  );

  // Check limits are tracked independently
  const status1 = await vault.checkSpendingLimitStatus(token1Addr, ethers.parseEther('150'));
  const status2 = await vault.checkSpendingLimitStatus(token2Addr, ethers.parseEther('150'));

  expect(status1.exceedsDaily).to.be.true;  // 150 > 100
  expect(status2.exceedsDaily).to.be.true;  // 150 > 50
});
```

## Integrating with Existing Vault Code

### In withdraw() function signature, add spending limit check:

```solidity
// Around line 750 in SpendVault.sol
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    string memory category,
    uint256 createdAt,
    bytes[] memory signatures
) external nonReentrant {
    // ... signature verification (existing) ...
    
    // Add spending limit check HERE:
    address _token = token;
    SpendingLimitStatus memory limitStatus = checkSpendingLimitStatus(_token, amount);
    bool limitViolated = limitStatus.exceedsDaily || 
                         limitStatus.exceedsWeekly || 
                         limitStatus.exceedsMonthly;
    
    if (limitViolated) {
        uint256 required = getEnhancedApprovalsRequired();
        require(validSignatures >= required, "Enhanced approvals required");
        requiresEnhancedApprovals[nonce] = true;
        emit SpendingLimitExceeded(_token, "daily/weekly/monthly", amount, limit);
    } else {
        require(validSignatures >= quorum, "Quorum not met");
    }
    
    // ... rest of function (existing) ...
}
```

## Common Integration Patterns

### Pattern 1: Display Limits and Current Usage

```typescript
async function displaySpendingInfo(vaultAddress: Address, tokenAddress: Address) {
  // Get limits
  const caps = await publicClient.readContract({
    address: vaultAddress,
    abi: SpendVaultABI,
    functionName: 'withdrawalCaps',
    args: [tokenAddress]
  });

  // Get current status
  const status = await publicClient.readContract({
    address: vaultAddress,
    abi: SpendVaultABI,
    functionName: 'checkSpendingLimitStatus',
    args: [tokenAddress, BigInt(0)] // 0 amount to just get status
  });

  console.log('Daily:', `${status.dailyUsed} / ${caps.daily}`);
  console.log('Weekly:', `${status.weeklyUsed} / ${caps.weekly}`);
  console.log('Monthly:', `${status.monthlyUsed} / ${caps.monthly}`);
}
```

### Pattern 2: Calculate Required Approvals

```typescript
async function getRequiredGuardianCount(vaultAddress: Address): Promise<number> {
  const required = await publicClient.readContract({
    address: vaultAddress,
    abi: SpendVaultABI,
    functionName: 'getEnhancedApprovalsRequired',
    args: []
  });

  return Number(required);
}

// Usage
const approvalsNeeded = await getRequiredGuardianCount(vaultAddress);
console.log(`Need ${approvalsNeeded} guardian approvals for limit violations`);
```

## Data Types

### SpendingLimitStatus Struct

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

### WithdrawalCap Struct (Existing)

```solidity
struct WithdrawalCap {
    uint256 daily;
    uint256 weekly;
    uint256 monthly;
}
```

## Event Emission for Monitoring

```typescript
// Listen for spending limit violations
const filter = vault.filters.SpendingLimitExceeded();
vault.on(filter, (token, limitType, attemptedAmount, limitAmount, event) => {
  console.log(`⚠️  Spending limit exceeded!`);
  console.log(`  Token: ${token}`);
  console.log(`  Type: ${limitType}`);
  console.log(`  Attempted: ${ethers.formatUnits(attemptedAmount, 18)}`);
  console.log(`  Limit: ${ethers.formatUnits(limitAmount, 18)}`);
});

// Listen for enhanced approval requirements
const filter2 = vault.filters.EnhancedApprovalsRequired();
vault.on(filter2, (nonce, approvalsNeeded, limitExceeded, event) => {
  console.log(`🔐 Enhanced approvals required!`);
  console.log(`  Nonce: ${nonce}`);
  console.log(`  Approvals needed: ${approvalsNeeded}`);
  console.log(`  Reason: ${limitExceeded} limit`);
});
```

---

For more detailed information, see:
- [SPENDING_LIMITS_SPEC.md](./SPENDING_LIMITS_SPEC.md) - Complete technical specification
- [SPENDING_LIMITS_IMPLEMENTATION.md](./SPENDING_LIMITS_IMPLEMENTATION.md) - Implementation summary
- [contracts/SpendVault.spendingLimits.test.ts](./contracts/SpendVault.spendingLimits.test.ts) - Full test suite
