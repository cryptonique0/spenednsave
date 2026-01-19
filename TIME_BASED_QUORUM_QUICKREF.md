# Time-Based Quorum System - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Deploy Vault
```bash
forge create contracts/TimeBasedQuorumVault.sol:TimeBasedQuorumVault \
  --constructor-args 0x[guardianSBT_address]
```

### 2. Setup Guardians
```bash
# Mint SBT for each guardian
guardianSBT.mint(0xGuardian1);
guardianSBT.mint(0xGuardian2);
guardianSBT.mint(0xGuardian3);
```

### 3. Configure Tiers (Optional - defaults work)
```javascript
// Override defaults if needed
vault.createQuorumTier(0, 10e18, 1, false);    // Small
vault.createQuorumTier(10e18, 50e18, 2, false); // Medium
vault.createQuorumTier(50e18, 0, 3, true);      // Large
```

### 4. Add Time Windows (Optional)
```javascript
// During 9am-5pm, require +1 signature
vault.createTimeWindow(9, 17, 1, "Business hours");

// During 10pm-6am, require +2 signatures
vault.createTimeWindow(22, 6, 2, "Overnight");
```

### 5. Approve Recipients (Optional)
```javascript
// Pre-approved recipients don't trigger "new recipient" flag
vault.approveRecipient(0xTrustedVendor);
vault.approveRecipient(0xMainBank);
```

### 6. Execute Withdrawals
```javascript
// Collect guardian signatures
const messageHash = vault.hashWithdrawal(token, amount, recipient, nonce, reason);
const sig1 = await guardian1.signMessage(messageHash);
const sig2 = await guardian2.signMessage(messageHash);
const sig3 = await guardian3.signMessage(messageHash);

// Execute
await vault.withdraw(
  token,
  amount,
  recipient,
  "reason",
  [sig1, sig2, sig3]
);
```

---

## 📊 Quorum Calculation Quick Reference

### Quorum = Base + Sensitivity Flags + Time Window (capped at max)

### Amount-Based Tiers (Default)
| Amount | Signatures | Sensitive |
|--------|-----------|-----------|
| 0-50 | 1 | ❌ |
| 50-200 | 2 | ❌ |
| 200-500 | 3 | ✅ |
| 500+ | 4 | ✅ |

### Sensitivity Flags (+1 each)
- ☐ New recipient (not approved)
- ☐ Large amount (≥100 token threshold)
- ☐ Outside hours (outside 6am-10pm)
- ☐ Emergency level (≥500 token threshold)

### Time Windows (Additional)
- Business hours (9am-5pm): +1
- Overnight (10pm-6am): +2
- Other times: +0

---

## 🔧 Common Operations

### Add Quorum Tier
```javascript
vault.createQuorumTier(
  minAmount,              // e.g., 100e18
  maxAmount,              // e.g., 500e18 (0 = unlimited)
  requiredSignatures,     // e.g., 3
  isSensitiveAction       // e.g., true
);
```

### Update Quorum Tier
```javascript
vault.updateQuorumTier(
  tierId,                 // e.g., 0
  newRequiredSignatures,  // e.g., 4
  isActive                // e.g., true/false
);
```

### Create Time Window
```javascript
vault.createTimeWindow(
  startHour,              // 0-23 UTC, e.g., 9
  endHour,                // 0-23 UTC, e.g., 17
  additionalSignatures,   // e.g., 1
  "description"           // e.g., "Business hours"
);
```

### Update Time Window
```javascript
vault.updateTimeWindow(
  windowId,               // e.g., 0
  isActive                // true/false
);
```

### Approve Recipient
```javascript
vault.approveRecipient(recipientAddress);
```

### Revoke Recipient
```javascript
vault.revokeRecipient(recipientAddress);
```

### Set Large Threshold
```javascript
vault.setLargeWithdrawalThreshold(100e18);
```

### Set Emergency Threshold
```javascript
vault.setEmergencyThreshold(500e18);
```

### Calculate Required Quorum
```javascript
const [requiredQuorum, isSensitive] = await vault.calculateRequiredQuorum(
  tokenAddress,
  withdrawalAmount,
  recipientAddress
);
```

---

## 💡 Common Scenarios

### Scenario 1: Small Payment to Approved Vendor
```
Amount: 25 tokens
Recipient: Approved vendor
Time: 10am

Tier: 25 < 50 → 1 signature
Sensitivity: approved (0), small (0), normal hours (0) → 0
Time: business hours → +0 (no window)
Total: 1 signature needed
```

### Scenario 2: Large Transfer to New Address
```
Amount: 300 tokens
Recipient: New recipient (unknown)
Time: 3am

Tier: 200 < 300 < 500 → 3 signatures
Sensitivity: new (+1), large (+1), outside hours (+1) → +3
Time: overnight window → +2
Total: 3 + 3 + 2 = 8 → capped to maxQuorum(5)
Required: 5 signatures
```

### Scenario 3: Routine Business
```
Amount: 50 tokens
Recipient: Approved vendor
Time: 2pm

Tier: 50 < 200 → 2 signatures
Sensitivity: approved (0), borderline (0), normal (0) → 0
Time: no window → +0
Total: 2 signatures needed
```

### Scenario 4: Emergency Withdrawal
```
Amount: 1000 tokens
Recipient: New address
Time: 11pm

Tier: 1000+ → 4 signatures
Sensitivity: new (+1), emergency (+1), outside (+1) → +3
Time: overlap windows → +2
Total: 4 + 3 + 2 = 9 → capped to 5
Required: 5 signatures (all guardians)
```

---

## 🧪 Testing

### Test 1: Small Withdrawal
```bash
# Create withdrawal for 25 tokens
# Should require 1 signature
forge test -k "test_SmallWithdrawal" -v
```

### Test 2: Large Withdrawal
```bash
# Create withdrawal for 250 tokens
# Should require 3 signatures
# Should be marked sensitive
forge test -k "test_LargeWithdrawal" -v
```

### Test 3: Time Window Impact
```bash
# Warp to overnight (22:00)
# Create withdrawal
# Should add +2 signatures
vm.warp(block.timestamp + (22 hours));
```

### Test 4: New Recipient Flag
```bash
# Create withdrawal to unapproved address
# Should escalate by 1 signature
```

### Test 5: Multiple Sensitivity Flags
```bash
# Large amount + new recipient + outside hours
# Should escalate by 3 signatures
```

---

## 🔍 Debugging

### Check Current Quorum Requirement
```javascript
const [quorum, isSensitive] = await vault.calculateRequiredQuorum(
  token,
  amount,
  recipient
);

console.log("Required signatures:", quorum);
console.log("Is sensitive action:", isSensitive);
```

### List All Tiers
```javascript
const tiers = await vault.getQuorumTiers();
tiers.forEach((tier, i) => {
  console.log(`Tier ${i}: ${tier.minAmount}-${tier.maxAmount} requires ${tier.requiredSignatures}`);
});
```

### List All Time Windows
```javascript
const windows = await vault.getTimeWindows();
windows.forEach((window, i) => {
  console.log(`Window ${i}: ${window.startHour}-${window.endHour} +${window.requiredSignatures}`);
});
```

### Check Recipient Status
```javascript
const isApproved = await vault.isApprovedRecipient(recipientAddress);
console.log("Is approved:", isApproved);
```

### Verify Guardian Status
```javascript
const isGuardian = await guardianSBT.balanceOf(guardianAddress) > 0;
console.log("Is guardian:", isGuardian);
```

### Get Current UTC Hour
```javascript
const now = new Date();
const utcHour = now.getUTCHours();
console.log("UTC Hour:", utcHour);
```

---

## ⚙️ Configuration Presets

### Conservative (High Security)
```javascript
// All amounts need multiple signatures
vault.createQuorumTier(0, 20e18, 2, false);      // 0-20 = 2
vault.createQuorumTier(20e18, 100e18, 3, true);  // 20-100 = 3
vault.createQuorumTier(100e18, 0, 5, true);      // 100+ = 5 (all)

// Strict time windows
vault.createTimeWindow(9, 17, 2, "Business");    // +2 during day
vault.createTimeWindow(22, 6, 3, "Overnight");   // +3 at night

// Low thresholds
vault.setLargeWithdrawalThreshold(30e18);
vault.setEmergencyThreshold(100e18);
```

### Moderate (Balanced)
```javascript
// Default tiers already good
// (1,2,3,4 for different amounts)

// Normal time windows
vault.createTimeWindow(9, 17, 1, "Business");    // +1 during day
vault.createTimeWindow(22, 6, 2, "Overnight");   // +2 at night

// Moderate thresholds
vault.setLargeWithdrawalThreshold(100e18);       // 100 is large
vault.setEmergencyThreshold(500e18);             // 500 is emergency
```

### Permissive (Fast Operations)
```javascript
// Small amounts need only 1 sig
vault.createQuorumTier(0, 100e18, 1, false);     // 0-100 = 1
vault.createQuorumTier(100e18, 500e18, 2, false); // 100-500 = 2
vault.createQuorumTier(500e18, 0, 3, true);      // 500+ = 3

// Light time windows (or none)
// No time windows = consistent requirements

// High thresholds
vault.setLargeWithdrawalThreshold(500e18);
vault.setEmergencyThreshold(2000e18);
```

---

## 📋 Checklist

### Pre-Deployment
- [ ] Review your risk profile
- [ ] Choose security level (Conservative/Moderate/Permissive)
- [ ] Identify guardians (3-5 recommended)
- [ ] List approved recipients
- [ ] Decide on time zones for windows

### Deployment
- [ ] Deploy GuardianSBT
- [ ] Deploy TimeBasedQuorumVault
- [ ] Mint SBT for guardians
- [ ] Create quorum tiers
- [ ] Create time windows (if any)
- [ ] Approve recipients
- [ ] Fund with test tokens

### Verification
- [ ] Test withdrawal with 1 sig required
- [ ] Test withdrawal with multiple sigs
- [ ] Test new recipient escalation
- [ ] Test time window application
- [ ] Verify nonce increments
- [ ] Check event logging

### Documentation
- [ ] Document your tier configuration
- [ ] Document your time windows
- [ ] Document approved recipients
- [ ] Create runbook for withdrawals
- [ ] Brief guardians on process

---

## 🚨 Common Mistakes

### ❌ Using Local Time Instead of UTC
```javascript
// Wrong: assumes local time
const hour = new Date().getHours();

// Right: uses UTC
const hour = new Date().getUTCHours();

// Right: contract uses block.timestamp (always UTC)
```

### ❌ Creating Overlapping Tiers Incorrectly
```javascript
// Wrong: same range, confusing
vault.createQuorumTier(0, 100e18, 2, false);     // 0-100
vault.createQuorumTier(50e18, 150e18, 3, false); // 50-150

// Right: non-overlapping
vault.createQuorumTier(0, 50e18, 2, false);      // 0-50
vault.createQuorumTier(50e18, 150e18, 3, false); // 50-150
```

### ❌ Forgetting to Approve Recipients
```javascript
// Wrong: every withdrawal to new address escalates
vault.withdraw(token, amount, newRecipient, reason, sigs);

// Right: approve first
vault.approveRecipient(newRecipient);
vault.withdraw(token, amount, newRecipient, reason, sigs);
```

### ❌ Setting maxAmount < minAmount
```javascript
// Wrong
vault.createQuorumTier(500e18, 100e18, 3, true);

// Right
vault.createQuorumTier(100e18, 500e18, 3, true);
```

### ❌ Time Window Order Issues
```javascript
// Wrong: backwards
vault.createTimeWindow(17, 9, 1, "Business"); // This wraps!

// Right
vault.createTimeWindow(9, 17, 1, "Business"); // 9am-5pm
vault.createTimeWindow(22, 6, 2, "Night");    // 10pm-6am (wraps)
```

---

## 📊 Gas Costs Estimate

| Operation | Gas | Notes |
|-----------|-----|-------|
| Withdrawal (1 sig) | ~80k | Simple path |
| Withdrawal (3 sigs) | ~120k | Multiple verification |
| Withdrawal (5 sigs) | ~160k | Maximum guardians |
| Create Tier | ~30k | State modification |
| Create Time Window | ~30k | State modification |
| Approve Recipient | ~25k | Storage write |
| Query Quorum | ~5k | View function |

---

## 🔗 Integration Examples

### With Frontend
```javascript
// Before showing withdrawal form
const [requiredQuorum, isSensitive] = await vault.calculateRequiredQuorum(
  selectedToken,
  withdrawalAmount,
  selectedRecipient
);

// Update UI
showWarningIfSensitive(isSensitive);
displayRequiredSignaturesCount(requiredQuorum);
enableSubmitIfEnoughGuardians(requiredQuorum);
```

### With Guardian Notifier
```javascript
// When withdrawal requested
const [requiredQuorum] = await vault.calculateRequiredQuorum(token, amount, recipient);

// Notify guardians
notifyGuardians({
  type: 'WITHDRAWAL_REQUESTED',
  amount,
  recipient,
  requiredSignatures: requiredQuorum,
  urgency: isSensitive ? 'HIGH' : 'NORMAL'
});
```

### With Webhook
```javascript
// Listen for events
vault.on('WithdrawalExecuted', (token, amount, recipient, requiredQuorum) => {
  // Log to webhook
  fetch('/api/withdrawals', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: Date.now(),
      token,
      amount,
      recipient,
      requiredQuorum
    })
  });
});
```

---

## 📚 Contract Functions Signature

```solidity
// Quorum Management
function createQuorumTier(uint256 min, uint256 max, uint256 sigs, bool sensitive)
function updateQuorumTier(uint256 id, uint256 sigs, bool active)
function createTimeWindow(uint256 start, uint256 end, uint256 sigs, string reason)
function updateTimeWindow(uint256 id, bool active)

// Configuration
function approveRecipient(address recipient)
function revokeRecipient(address recipient)
function setLargeWithdrawalThreshold(uint256 amount)
function setEmergencyThreshold(uint256 amount)
function setDefaultQuorum(uint256 quorum)
function updateGuardianToken(address newAddress)

// Queries
function calculateRequiredQuorum(address token, uint256 amount, address recipient)
  returns (uint256 requiredQuorum, bool isSensitive)
function getQuorumTiers() returns (QuorumTier[])
function getTimeWindows() returns (TimeWindow[])
function getETHBalance() returns (uint256)
function getTokenBalance(address token) returns (uint256)
function getWithdrawalRecord(uint256 index) returns (WithdrawalRecord)

// Operations
function withdraw(address token, uint256 amount, address recipient, 
                  string reason, bytes[] signatures)
function deposit(address token, uint256 amount)
```

---

## 📞 Support

- **Smart Contract Issues**: Check contract code
- **Signature Problems**: Verify EIP-712 format
- **Gas Issues**: Some withdrawals may cost more
- **Time Zone Issues**: Remember to use UTC
- **Guardian Issues**: Verify SBT minting

---

**Quick Status**: ✅ Ready to Use  
**Version**: 1.0  
**Last Updated**: January 2025
