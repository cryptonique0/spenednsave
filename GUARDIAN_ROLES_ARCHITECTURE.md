# Guardian Roles Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SPENDGUARD VAULT                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           SpendVaultWithRoles (Enhanced Vault)          │  │
│  │                                                          │  │
│  │  • Role-based withdrawal execution                      │  │
│  │  • EIP-712 signature verification                       │  │
│  │  • Emergency timelock (30 days)                         │  │
│  │  • Vault freezing capability                            │  │
│  │  • Nonce-based replay protection                        │  │
│  │                                                          │  │
│  │  Integrates with ↓                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         GuardianRoles (Role Management System)          │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │         Three Guardian Roles                    │   │  │
│  │  │                                                  │   │  │
│  │  │  1. SIGNER (ID: 1)                              │   │  │
│  │  │     • Regular withdrawals: ✅                    │   │  │
│  │  │     • Emergency withdrawals: ✅                  │   │  │
│  │  │     • View activity: ✅                          │   │  │
│  │  │                                                  │   │  │
│  │  │  2. OBSERVER (ID: 2)                             │   │  │
│  │  │     • Regular withdrawals: ❌                    │   │  │
│  │  │     • Emergency withdrawals: ❌                  │   │  │
│  │  │     • View activity: ✅                          │   │  │
│  │  │                                                  │   │  │
│  │  │  3. EMERGENCY_ONLY (ID: 3)                       │   │  │
│  │  │     • Regular withdrawals: ❌                    │   │  │
│  │  │     • Emergency withdrawals: ✅                  │   │  │
│  │  │     • View activity: ✅                          │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │     Role Features                              │   │  │
│  │  │                                                  │   │  │
│  │  │  • Optional expiration dates                    │   │  │
│  │  │  • Customizable permissions                    │   │  │
│  │  │  • Active guardian tracking                    │   │  │
│  │  │  • Automatic expiration                        │   │  │
│  │  │  • Permission withdrawal limits                │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          GuardianSBT (Token-based Identity)             │  │
│  │                                                          │  │
│  │  • Non-transferable ERC-721 tokens                      │  │
│  │  • Guardian verification                               │  │
│  │  • Vault association tracking                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Withdrawal Flow with Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITHDRAWAL EXECUTION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATES WITHDRAWAL
   │
   ├─ Token: 0x... (ETH or ERC-20)
   ├─ Amount: 1000 units
   ├─ Recipient: 0x...
   ├─ Reason: "Emergency expenses"
   └─ Is Emergency?: false (regular withdrawal)

2. GUARDIAN SIGNATURE COLLECTION
   │
   ├─ Get active guardians with roles
   │  ├─ Dad: SIGNER ✅
   │  ├─ Mom: SIGNER ✅
   │  ├─ Son: EMERGENCY_ONLY ❌ (not eligible for regular)
   │  └─ Lawyer: OBSERVER ❌ (cannot sign)
   │
   └─ Collect signatures from eligible signers
      ├─ Dad signs: ✅
      └─ Mom signs: ✅

3. SIGNATURE VERIFICATION & ROLE VALIDATION
   │
   ├─ Check signature count >= quorum (2)
   ├─ Verify each signer is a guardian
   ├─ Verify each signer has correct role
   │  ├─ Dad: SIGNER can approve regular ✅
   │  └─ Mom: SIGNER can approve regular ✅
   ├─ Check withdrawal amount within limits
   └─ Validate EIP-712 signature format

4. ROLE-BASED PERMISSION CHECKS
   │
   ├─ For Regular Withdrawal:
   │  ├─ canApproveRegularWithdrawal(vault, dad, 1000) → true
   │  ├─ canApproveRegularWithdrawal(vault, mom, 1000) → true
   │  └─ Both signers valid ✅
   │
   └─ For Emergency Withdrawal:
      ├─ canApproveEmergencyWithdrawal(vault, dad, 1000) → true
      └─ canApproveEmergencyWithdrawal(vault, son, 1000) → true

5. WITHDRAWAL EXECUTION
   │
   ├─ Increment nonce (replay protection)
   ├─ Update withdrawal counters
   ├─ Execute transfer
   │  └─ If ETH: Send to recipient
   │  └─ If Token: Transfer via ERC-20
   └─ Emit withdrawal event

6. POST-WITHDRAWAL
   │
   ├─ Record withdrawal metadata
   ├─ Emit signature events for audit trail
   ├─ Log guardian actions
   └─ Update role expiration status
```

## Permission Matrix

```
┌─────────────────────────────────────────────────────────────┐
│                    ROLE PERMISSION MATRIX                  │
├──────────────────┬───────┬──────────┬──────────────────────┤
│ Action           │SIGNER │OBSERVER  │ EMERGENCY_ONLY       │
├──────────────────┼───────┼──────────┼──────────────────────┤
│ Regular Approve  │  ✅   │   ❌     │      ❌              │
│ Emergency Approve│  ✅   │   ❌     │      ✅              │
│ View Activity    │  ✅   │   ✅     │      ✅              │
│ Update Guardians │  ❌   │   ❌     │      ❌              │
│ Max Amount       │   ∞   │   -      │      ∞               │
│ Daily Limit      │   ∞   │   -      │      ∞               │
└──────────────────┴───────┴──────────┴──────────────────────┘

Legend:
  ✅ = Allowed by default
  ❌ = Not allowed
  ∞  = Unlimited
  -  = Not applicable
```

## Data Flow: Role Assignment

```
┌──────────────────────────────────────────────────────────────────┐
│                     ROLE ASSIGNMENT FLOW                         │
└──────────────────────────────────────────────────────────────────┘

VAULT OWNER INITIATES:
│
├─ assignRole(
│    vault: 0xVault...,
│    guardian: 0xGuardian...,
│    role: 1,  // SIGNER
│    expiresAt: 0  // No expiration
│  )
│
└─ GuardianRoles Contract Processing:
   │
   ├─ Verify caller is vault owner
   ├─ Validate guardian address (not zero)
   ├─ Validate role (1, 2, or 3)
   ├─ Validate expiration time (future or 0)
   │
   ├─ Update State:
   │  ├─ guardianRoles[vault][guardian] = {
   │  │    role: SIGNER,
   │  │    assignedAt: block.timestamp,
   │  │    expiresAt: 0,
   │  │    isActive: true
   │  │  }
   │  └─ activeGuardians[vault].push(guardian)
   │
   └─ Emit RoleAssigned Event:
      ├─ vault: 0xVault...
      ├─ guardian: 0xGuardian...
      ├─ role: 1
      └─ expiresAt: 0
```

## Role Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│              ROLE LIFECYCLE STATE DIAGRAM                   │
└─────────────────────────────────────────────────────────────┘

                    UNASSIGNED
                        │
                        │ assignRole()
                        ▼
                     ASSIGNED
                    (isActive: true)
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        │               │               │ Time passes & 
        │               │               │ expires check
        │               │               │
        │      revokeRole()    checkAndExpireRole()
        │               │               │
        ▼               ▼               ▼
    REVOKED         REVOKED         EXPIRED
 (isActive:false) (isActive:false) (isActive:false)
                        │
                        │ (optional)
                        │ reassignRole()
                        ▼
                     ASSIGNED (again)
```

## Event Audit Trail

```
┌────────────────────────────────────────────────────────────────┐
│                   EVENT AUDIT TRAIL EXAMPLE                    │
└────────────────────────────────────────────────────────────────┘

Timeline:

[Block 1000000] RoleAssigned
  ├─ vault: 0xVault...
  ├─ guardian: 0xDad...
  ├─ role: SIGNER
  └─ expiresAt: 0 (never)

[Block 1000100] RoleAssigned
  ├─ vault: 0xVault...
  ├─ guardian: 0xMom...
  ├─ role: SIGNER
  └─ expiresAt: 0 (never)

[Block 1000200] RoleAssigned
  ├─ vault: 0xVault...
  ├─ guardian: 0xSon...
  ├─ role: EMERGENCY_ONLY
  └─ expiresAt: 1893456000 (2030-01-01)

[Block 1050000] WithdrawalApprovedByRole
  ├─ guardian: 0xDad...
  ├─ role: SIGNER
  └─ nonce: 5

[Block 1050010] WithdrawalApprovedByRole
  ├─ guardian: 0xMom...
  ├─ role: SIGNER
  └─ nonce: 5

[Block 1100000] RoleExpired
  ├─ vault: 0xVault...
  ├─ guardian: 0xSon...
  └─ role: EMERGENCY_ONLY

[Block 1100010] RoleAssigned (renewal)
  ├─ vault: 0xVault...
  ├─ guardian: 0xSon...
  ├─ role: EMERGENCY_ONLY
  └─ expiresAt: 1924992000 (2031-01-01)
```

## Integration Architecture

```
┌────────────────────────────────────────────────────────────────┐
│            FRONTEND + SMART CONTRACT INTEGRATION               │
└────────────────────────────────────────────────────────────────┘

FRONTEND LAYER
│
├─ Guardian Management UI
│  ├─ List guardians with roles
│  ├─ Show expiration dates
│  ├─ Assign new roles
│  └─ Revoke roles
│
├─ Withdrawal Form
│  ├─ Filter eligible signers by role
│  ├─ Show signer roles
│  └─ Collect signatures
│
└─ Monitoring Dashboard
   ├─ Active guardian count
   ├─ Role distribution
   ├─ Expiring roles alert
   └─ Withdrawal history

                    ↓ (API Calls)

BLOCKCHAIN LAYER
│
├─ GuardianRoles Contract
│  ├─ assignRole()
│  ├─ revokeRole()
│  ├─ getActiveGuardians()
│  ├─ canApproveRegularWithdrawal()
│  └─ checkAndExpireRole()
│
└─ SpendVaultWithRoles Contract
   ├─ withdrawWithRoles()
   ├─ freezeVault()
   └─ Events for monitoring

                    ↓ (Events)

BACKEND/INDEXING
│
├─ TheGraph (subgraph indexing)
├─ Event listeners
├─ Role expiration monitoring
└─ Alert system
```

## Expiration Timeline Example

```
┌────────────────────────────────────────────────────────────────┐
│              ROLE EXPIRATION TIMELINE                          │
└────────────────────────────────────────────────────────────────┘

SON'S EMERGENCY_ONLY ROLE
Assigned: January 1, 2024
Expires: January 1, 2030 (6 years)

Timeline:
│
├─ 2024-01-01: Role assigned, isActive=true
│  └─ Son can approve emergency withdrawals
│
├─ 2029-10-01 (90 days before expiration)
│  └─ Warning: Role expiring soon
│
├─ 2030-01-01 00:00:00 (Expiration moment)
│  └─ Role becomes INVALID
│  └─ Son can no longer sign
│
└─ 2030-01-02: checkAndExpireRole() called
   └─ isActive=false, role=NONE
   └─ RoleExpired event emitted

OPTIONAL: Renewal
└─ 2030-01-02: assignRole() called again
   └─ New expiration: 2031-01-02
   └─ Son can approve again
```

## Key Contract Interactions

```
┌────────────────────────────────────────────────────────────────┐
│           KEY CONTRACT INTERACTION PATTERNS                    │
└────────────────────────────────────────────────────────────────┘

Pattern 1: Assign Role & Check Permission
  assignRole(vault, guardian, SIGNER, 0)
        ↓
  canApproveRegularWithdrawal(vault, guardian, amount)
        ↓
  (returns: true/false)

Pattern 2: Execute Withdrawal with Role Validation
  withdrawWithRoles(token, amount, recipient, reason, isEmergency, [sigs])
        ↓
  For each signature:
    ├─ Recover signer from signature
    ├─ Check if guardian (SBT check)
    ├─ Check if role valid
    │  └─ canApproveRegularWithdrawal() or canApproveEmergencyWithdrawal()
    ├─ If invalid role: skip signature
    └─ If valid: count toward quorum
  ↓
  Require: validSignatures >= quorum
  ↓
  Execute transfer

Pattern 3: Monitor Expiring Roles
  getActiveGuardians(vault)
        ↓
  For each guardian:
    └─ getGuardianRoleInfo(vault, guardian)
        └─ Check expiresAt vs block.timestamp
  ↓
  (returns: list of expiring guardians)

Pattern 4: Clean Up Expired Roles
  For each expiring guardian:
    └─ checkAndExpireRole(vault, guardian)
        └─ If expired: isActive = false, role = NONE
        └─ Emit RoleExpired event
```

---

## Summary

This architecture enables:
- ✅ **Flexible Role Management** - Assign different roles to different guardians
- ✅ **Time-Bound Roles** - Optional expiration dates for temporary assignments
- ✅ **Permission Enforcement** - Each guardian can only do what their role allows
- ✅ **Audit Trail** - All changes logged via events
- ✅ **Emergency Controls** - Freezing and timelock capabilities
- ✅ **Integration Ready** - Clean API for frontend implementation
