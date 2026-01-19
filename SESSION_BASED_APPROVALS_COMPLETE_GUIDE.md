# Session-Based Approvals - Complete Guide

## 📋 Table of Contents
1. Overview & Benefits
2. Architecture & Design
3. Session Lifecycle
4. Session Creation
5. Session Approval
6. Session Spending
7. Recipient Management
8. Real-World Examples
9. Integration Guide
10. Troubleshooting

---

## 🎯 Overview

Session-Based Approvals allow guardians to pre-approve spending sessions with:

- **Time Windows**: Valid for limited duration (1 minute to 30 days)
- **Budget Limits**: Maximum total amount that can be spent
- **Recipient Restrictions**: Optional list of approved recipients
- **Automatic Tracking**: Complete record of all spending
- **Flexible Approval**: Can require per-spending approval or allow automatic spending

### Key Benefits

✅ **Fast Transactions**: Pre-approved budgets mean no per-transaction delays  
✅ **Controlled Spending**: Hard limits prevent budget overruns  
✅ **Flexible Configuration**: Customize for different use cases  
✅ **Complete Visibility**: Track every cent spent from session  
✅ **Time-Limited Risk**: Sessions auto-expire after duration  
✅ **Recipient Control**: Restrict who can receive funds  

---

## 🏗️ Architecture

### Component Overview

```
SessionBasedApprovalsVault
├── Session Management
│   ├── Create sessions
│   ├── Approve pending sessions
│   ├── Activate sessions
│   └── Deactivate/expire sessions
│
├── Session Spending
│   ├── Execute spending from session
│   ├── Validate amounts
│   ├── Check recipients
│   └── Track spending
│
├── Recipient Management
│   ├── Add allowed recipients
│   ├── Remove recipients
│   └── Validate recipients
│
├── Monitoring & Queries
│   ├── Get active sessions
│   ├── Check session status
│   ├── Retrieve spending records
│   └── Calculate remaining budget
│
└── Configuration
    ├── Duration limits
    ├── Approval quorum
    └── Guardian management
```

### State Machine

```
Created (Pending)
    ↓
    ├─ [Receive Approvals] ──→ Activated
    │                             ↓
    │                         [Spending] (if not requiring approval)
    │                             ↓
    │                         Active
    │                             ↓
    │                         [Expired/Deactivated]
    │
    └─ [Owner creates] ──→ Immediately Active
                              ↓
                          [Spending]
                              ↓
                          Active/Expired
```

---

## 🔄 Session Lifecycle

### Phase 1: Creation
Guardian or owner initiates a spending session
```solidity
vault.createSession(
    1 days,              // Duration
    100 ether,           // Budget
    "Marketing spend",   // Purpose
    false,               // Requires per-spend approval
    recipients           // Allowed recipients (empty = all)
)
// Returns: sessionId (bytes32)
```

**Immediate Actions**:
- If created by owner: Session becomes ACTIVE immediately
- If created by guardian: Session goes to PENDING, waits for approvals

### Phase 2: Approval (if Guardian-Created)
Other guardians review and approve the session
```solidity
vault.approveSession(sessionId)
// Each guardian signs off
```

**Quorum Rules**:
- Default: 2 guardians must approve
- Configurable via setDefaultApprovalQuorum()
- Once quorum reached: Session auto-activates

### Phase 3: Active Spending
Within session, guardians can spend funds
```solidity
vault.spendFromSession(
    sessionId,
    tokenAddress,  // address(0) for ETH
    amount,
    recipient,
    "reason"
)
// Automatically deducts from session budget
```

**Validation Checks**:
- Session must be active
- Not expired
- Amount doesn't exceed remaining budget
- Recipient is allowed (if restricted)

### Phase 4: Expiration or Deactivation
Session ends when:
- **Time expires**: block.timestamp >= expiresAt
- **Budget exhausted**: totalSpent >= totalApproved
- **Owner deactivates**: Manual deactivation

---

## 📝 Session Creation Details

### Creating a Session

```solidity
bytes32 sessionId = vault.createSession(
    uint256 duration,           // e.g., 1 days, 7 days, 1 hours
    uint256 totalApproved,      // e.g., 100 ether
    string memory purpose,      // e.g., "Q1 Marketing Budget"
    bool requiresApproval,      // true = each spend needs approval, false = auto-spend
    address[] memory recipients // e.g., [0x..., 0x...] or empty array
);
```

### Duration Rules

**Minimum**: 1 minute (configurable)  
**Maximum**: 30 days (configurable)

```javascript
// Config options
vault.setMinSessionDuration(5 minutes);   // Minimum 5 min sessions
vault.setMaxSessionDuration(90 days);     // Allow up to 90 days
```

### By Owner vs Guardian

**Owner Creates**:
```
✓ Instantly ACTIVE
✓ No waiting for approvals
✓ Immediate spending available
✗ Single point of control
```

**Guardian Creates**:
```
✓ Multi-sig protection (requires 2+ approvals)
✓ More democratic process
✓ Built-in safety check
✗ Slower activation (waiting for approvals)
```

### Recipient Restrictions

**Option 1: No Restrictions (Empty Array)**
```solidity
address[] memory recipients = new address[](0);
vault.createSession(1 days, 100 ether, "Marketing", false, recipients);
// Result: Can spend to ANY address within budget
```

**Option 2: Specific Recipients**
```solidity
address[] memory recipients = new address[](3);
recipients[0] = vendorAddress;
recipients[1] = bankAddress;
recipients[2] = paymentProcessorAddress;
vault.createSession(1 days, 100 ether, "Payments", false, recipients);
// Result: Can only spend to these 3 addresses
```

**Adding Recipients Later**:
```solidity
vault.addSessionRecipient(sessionId, newRecipientAddress);
vault.removeSessionRecipient(sessionId, oldRecipientAddress);
```

---

## ✅ Session Approval Process

### For Guardian-Created Sessions

**Step 1: Guardian 1 creates**
```solidity
vm.prank(guardian1);
bytes32 sessionId = vault.createSession(1 days, 50 ether, "Ops", false, []);
// Status: PENDING (0/2 approvals)
```

**Step 2: Guardian 2 approves**
```solidity
vm.prank(guardian2);
vault.approveSession(sessionId);
// Status: ACTIVE (2/2 approvals - quorum reached!)
```

**Step 3: Can now spend**
```solidity
vault.spendFromSession(sessionId, address(0), 10 ether, recipient, "reason");
// Status: ACTIVE + SPENDING
```

### Approval Quorum

**Default**: 2 guardians required  
**Configuration**:
```solidity
vault.setDefaultApprovalQuorum(3);  // Require 3 approvals
```

**Rules**:
- Minimum: 1 approval possible
- Maximum: 5 approvals
- Cannot double-approve (same guardian can't sign twice)

### Preventing Duplicate Approvals

```solidity
// ✅ Guardian 1 approves
vm.prank(guardian1);
vault.approveSession(sessionId);

// ❌ Guardian 1 tries again
vm.prank(guardian1);
vault.approveSession(sessionId);  // Reverts: "Already approved"
```

---

## 💸 Session Spending

### Execute Spending

```solidity
vault.spendFromSession(
    bytes32 sessionId,
    address token,           // address(0) for ETH
    uint256 amount,
    address recipient,
    string memory reason
);
```

### Validation Checks

Before each spend, system verifies:

1. **Session Is Active**
   - ✓ Session.isActive == true
   - ✗ Reverts if: deactivated or not approved

2. **Not Expired**
   - ✓ block.timestamp < expiresAt
   - ✗ Reverts if: time passed, must call expireSession() first

3. **Amount Available**
   - ✓ totalSpent + newAmount <= totalApproved
   - ✗ Reverts if: would exceed budget

4. **Recipient Allowed**
   - ✓ Either no recipients restricted, or recipient in whitelist
   - ✗ Reverts if: restricted list exists and recipient not in it

5. **Caller Is Guardian**
   - ✓ msg.sender has guardian SBT
   - ✗ Reverts if: non-guardian tries to spend

### Automatic Session Termination

Sessions auto-deactivate when:
```javascript
// Budget fully spent
totalSpent >= totalApproved
→ Session becomes inactive
→ Further spending blocked

// Caller spends final 50 ETH of 100 ETH session
vault.spendFromSession(sessionId, token, 50, recipient, "Final spend");
// Session now has totalSpent = 100, matches totalApproved
// Session auto-deactivates
```

### Spending Tracking

All spends recorded with:
```solidity
struct SessionSpend {
    bytes32 sessionId;
    address token;
    uint256 amount;
    address recipient;
    uint256 timestamp;
    string reason;
}
```

**Query spending**:
```solidity
SessionSpend[] memory spends = vault.getSessionSpends(sessionId);
// Returns all spending records for session

uint256 ethSpent = vault.getSessionTokenSpent(sessionId, address(0));
// Returns total ETH spent in session
```

---

## 🎯 Recipient Management

### Adding Recipients

```solidity
// Add single recipient
vault.addSessionRecipient(sessionId, vendorAddress);

// Add multiple (manual loop)
address[] memory recipients = [...];
for (uint i = 0; i < recipients.length; i++) {
    vault.addSessionRecipient(sessionId, recipients[i]);
}
```

### Removing Recipients

```solidity
vault.removeSessionRecipient(sessionId, vendorAddress);
```

### Checking Permissions

```solidity
bool isAllowed = vault.isRecipientAllowed(sessionId, recipientAddress);
if (isAllowed) {
    // Can spend to this recipient
}
```

---

## 📊 Real-World Examples

### Example 1: Marketing Department Budget

```solidity
// Create monthly marketing budget
bytes32 sessionId = vault.createSession(
    30 days,           // Valid for 1 month
    10000 ether,       // 10,000 ETH budget
    "March Marketing", // Clear purpose
    false,             // Auto-spend (no per-item approval)
    [vendorA, vendorB, adNetwork, paymentProcessor]  // Approved vendors
);
// Session auto-activates (created by owner)

// Throughout month, marketers can spend freely
vault.spendFromSession(sessionId, USDC, 1000e18, vendorA, "Ad campaign");
vault.spendFromSession(sessionId, USDC, 500e18, vendorB, "Content creation");
vault.spendFromSession(sessionId, USDC, 2000e18, adNetwork, "Social ads");

// At month end, session expires automatically
// Can see spending breakdown
SessionSpend[] memory spends = vault.getSessionSpends(sessionId);
// Shows all March spending with details
```

### Example 2: Emergency Operations Fund

```solidity
// CEO wants emergency access to funds
// But needs guardian approval first

// CEO initiates session
bytes32 sessionId = vault.createSession(
    1 hours,           // 1-hour window only
    500 ether,         // Limited to 500 ETH
    "Emergency ops",
    false,
    []  // Any recipient in emergency
);
// Session is PENDING - needs approval

// CFO quickly reviews and approves
vault.approveSession(sessionId);
// Session is now ACTIVE

// CEO can immediately spend if needed
if (emergencyDetected) {
    vault.spendFromSession(
        sessionId,
        address(0),
        emergencyAmount,
        emergencyRecipient,
        "Incident response"
    );
}

// After 1 hour, session expires
// No more spending allowed (safety)
```

### Example 3: Multi-Team Budget Distribution

```solidity
// Owner creates sessions for different teams
address[] memory mkRecipients = [mkAgency, designStudio];
vault.createSession(30 days, 50 ether, "Marketing", false, mkRecipients);

address[] memory opsRecipients = [vendor1, vendor2, vendor3];
vault.createSession(30 days, 100 ether, "Operations", false, opsRecipients);

address[] memory rdRecipients = []; // No restrictions
vault.createSession(30 days, 200 ether, "R&D", false, rdRecipients);

// Each team works within their session
// Automatic isolation and budget control
// No interference between teams
```

### Example 4: Tiered Approval (Multiple Guardians)

```solidity
// Guardian 1 wants to do large spend
// Needs buy-in from Guardian 2 & 3

bytes32 sessionId = vault.createSession(
    7 days,
    1000 ether,        // Large amount
    "Strategic initiative",
    false,
    [approvedPartner]
);
// Status: PENDING (needs 2 more approvals)

// Guardian 2 reviews and approves
vault.approveSession(sessionId);
// Status: PENDING (1/2 approvals)

// Guardian 3 approves
vault.approveSession(sessionId);
// Status: ACTIVE (quorum reached!)

// Now spending can proceed
vault.spendFromSession(sessionId, token, 500 ether, approvedPartner, "Deployment");
```

---

## 🔐 Security Features

### 1. Time Limits
- Sessions have explicit expiration times
- Cannot be extended once created
- Auto-expire to prevent indefinite access
- Guardian must create new session for continued access

### 2. Budget Limits
- Hard cap on spending per session
- Cannot overspend
- Prevents accidental large transfers
- Each spend is deducted in real-time

### 3. Recipient Restrictions
- Optional whitelist of allowed recipients
- Prevents sending to wrong addresses
- Can be updated anytime
- All-or-nothing (either restricted or fully open)

### 4. Guardian Verification
- Only guardians can create sessions
- Only guardians can approve spending
- SBT ensures guardian status
- Non-transferable prevents guardian impersonation

### 5. Approval Quorum
- Multi-sig protection for sessions
- Configurable number of required approvals
- Cannot double-approve (duplicate prevention)
- Tracks who approved what

### 6. Spending Tracking
- Every transaction recorded
- Complete audit trail
- Timestamped entries
- Reason field for context

### 7. Owner Override
- Owner can deactivate any session
- Owner can add/remove recipients
- Owner can configure durations and quorum
- Enables emergency controls

---

## 💡 Configuration Guide

### Duration Limits

```solidity
// View current limits
uint256 min = vault.minSessionDuration();      // Default: 1 minute
uint256 max = vault.maxSessionDuration();      // Default: 30 days

// Change for your use case
vault.setMinSessionDuration(5 minutes);        // Require at least 5 min
vault.setMaxSessionDuration(90 days);          // Allow up to 90 days
```

### Approval Requirements

```solidity
// View current default
uint256 quorum = vault.defaultApprovalQuorum(); // Default: 2

// Change for your organization
vault.setDefaultApprovalQuorum(3);             // Require 3 approvals for next sessions
```

### Presets

**Conservative Setup**:
```solidity
vault.setMinSessionDuration(1 hours);          // At least 1 hour
vault.setMaxSessionDuration(7 days);           // Max 1 week
vault.setDefaultApprovalQuorum(3);             // Always need 3 approvals
// Result: Slow, safe, heavily controlled
```

**Standard Setup**:
```solidity
vault.setMinSessionDuration(1 minutes);        // Can be very short
vault.setMaxSessionDuration(30 days);          // Can be up to 1 month
vault.setDefaultApprovalQuorum(2);             // Need 2 approvals (reasonable)
// Result: Flexible but safe
```

**Fast/Startup Setup**:
```solidity
vault.setMinSessionDuration(30 seconds);       // Very quick
vault.setMaxSessionDuration(14 days);          // 2 weeks max
vault.setDefaultApprovalQuorum(1);             // Single approval
// Result: Fast, flexible, lower overhead
```

---

## 🧪 Testing Strategies

### Test 1: Basic Session Lifecycle
```javascript
// Create → Approve → Spend → Expire
describe("Session Lifecycle", () => {
    it("creates, approves, spends, and expires", async () => {
        const sessionId = await createSession();
        await approveSession(sessionId);
        await spendFromSession(sessionId);
        warp(2 days);  // Past expiration
        assertFalse(isSessionValid(sessionId));
    });
});
```

### Test 2: Budget Enforcement
```javascript
// Test that overspending is prevented
describe("Budget Limits", () => {
    it("prevents overspending", async () => {
        const sessionId = await createSession({approved: 100});
        await spendFromSession(sessionId, 50);  // OK
        await spendFromSession(sessionId, 40);  // OK
        expect(spendFromSession(sessionId, 20)) // Fails
            .to.revert("Exceeds session limit");
    });
});
```

### Test 3: Recipient Validation
```javascript
// Test recipient restrictions work
describe("Recipient Restrictions", () => {
    it("enforces recipient whitelist", async () => {
        const sessionId = await createSession({
            recipients: [vendor1, vendor2]
        });
        await spend(sessionId, vendor1);  // OK
        expect(spend(sessionId, vendor3))  // Fails
            .to.revert("Recipient not approved");
    });
});
```

### Test 4: Time Windows
```javascript
// Test expiration works
describe("Time Windows", () => {
    it("expires sessions after duration", async () => {
        const sessionId = await createSession({duration: 1 days});
        assert(isSessionValid(sessionId));
        warp(2 days);
        assert(!isSessionValid(sessionId));
    });
});
```

---

## 🛠️ Integration Points

### With Frontend
```javascript
// Before showing spending form
const sessionId = getSelectedSession();
const [isValid, timeLeft, budgetLeft] = await vault.querySession(sessionId);

if (!isValid) {
    showError("Session expired");
} else {
    showInfo(`${timeLeft} hours left, ${budgetLeft} budget remaining`);
    enableSpendForm();
}
```

### With Notifications
```javascript
// Alert when session is about to expire
const events = vault.on('SessionExpired', (sessionId, totalSpent) => {
    notifyTeam(`Session ${sessionId} expired. Total spent: ${totalSpent}`);
});
```

### With Dashboards
```javascript
// Real-time budget tracking
function updateDashboard() {
    const activeSessions = vault.getActiveSessions();
    for (const sessionId of activeSessions) {
        const session = vault.getSession(sessionId);
        const spent = session.totalSpent;
        const remaining = session.totalApproved - spent;
        const percentUsed = (spent / session.totalApproved) * 100;
        
        updateUI({
            purpose: session.purpose,
            spent,
            remaining,
            percentUsed,
            expiresAt: session.expiresAt
        });
    }
}
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Review smart contract code
- [ ] Understand session lifecycle
- [ ] Plan duration limits
- [ ] Decide on approval quorum
- [ ] List initial recipients

### Deployment
- [ ] Deploy SessionBasedApprovalsVault
- [ ] Configure guardian SBT
- [ ] Set duration limits
- [ ] Set approval quorum
- [ ] Initialize with first session

### Testing
- [ ] Test session creation
- [ ] Test guardian approval
- [ ] Test spending within budget
- [ ] Test overspending prevention
- [ ] Test time expiration
- [ ] Test recipient restrictions

### Post-Deployment
- [ ] Monitor session creation
- [ ] Track spending patterns
- [ ] Adjust limits if needed
- [ ] Train team on process
- [ ] Document procedures

---

## 📞 Quick Reference

**Key Functions**:
- `createSession()` - Start new session
- `approveSession()` - Approve pending session
- `spendFromSession()` - Execute spending
- `deactivateSession()` - Stop session manually
- `addSessionRecipient()` - Add to whitelist
- `removeSessionRecipient()` - Remove from whitelist

**View Functions**:
- `getSession()` - Get session details
- `getSessionRemaining()` - Check budget left
- `isSessionValid()` - Check if usable
- `getSessionTimeRemaining()` - Check time left
- `getActiveSessions()` - List all active
- `getSessionSpends()` - Audit trail

---

**Status**: ✅ Complete and production-ready  
**Version**: 1.0  
**Last Updated**: January 2025
