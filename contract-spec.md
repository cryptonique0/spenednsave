# Smart Contract Requirements Specification

**Project:** SpendGuard  
**Network:** Base (EVM Compatible)  
**Solidity Version:** ^0.8.20

---

## 1. Overview

The SpendGuard system consists of two interacting smart contracts:

- **GuardianSBT.sol** - A non-transferable NFT (Soulbound Token) contract that defines who is a Guardian
- **SpendVault.sol** - The treasury contract that holds funds and verifies signatures against the GuardianSBT list

The saver locks their funds in SpendVault and designates trusted friends as Guardians (via GuardianSBT). To withdraw, the saver must obtain signatures from their Guardians, enforcing social accountability.

---

## 2. Contract A: GuardianSBT.sol (Identity Layer)

**Standard:** ERC-721 (Soulbound)  
**Library Dependencies:** OpenZeppelin (ERC721, Ownable)

### 2.1 Core Logic

- **Soulbound Property:** The token must not be transferable between wallets. Friends cannot sell or give away their voting power
- **Admin Controlled:** Only the Owner (The Saver) can mint or burn tokens
- **Non-Transferable:** Overrides standard transfer logic to enforce soulbound behavior

### 2.2 Key Functions

| Function | Visibility | Description |
|----------|-----------|-------------|
| `mint(address to)` | `onlyOwner` | Mints a new NFT to a friend's address. Represents adding a Guardian |
| `burn(uint256 tokenId)` | `onlyOwner` | Burns a specific NFT. Represents revoking Guardian access |
| `_update()` or `transfer()` | `override` | **CRITICAL:** Override standard transfer logic. If `from != 0` (not mint) AND `to != 0` (not burn), the transaction must revert to enforce soulbound property |

---

## 3. Contract B: SpendVault.sol (Treasury Layer)

**Standard:** Custom Vault + EIP-712  
**Library Dependencies:** OpenZeppelin (IERC20, Ownable, EIP712, ECDSA, ReentrancyGuard)

### 3.1 State Variables

```solidity
address public guardianToken;          // Address of GuardianSBT contract
uint256 public quorum;                 // Number of valid signatures required (e.g., 2/3)
uint256 public nonce;                  // Prevents replay attacks; increments after each withdrawal
address public saver;                  // The vault owner (funds belong to them)
```

### 3.2 Key Functions

#### A. Management

| Function | Visibility | Description |
|----------|-----------|-------------|
| `setQuorum(uint256 _newQuorum)` | `onlyOwner` | Updates the number of required signatures |
| `updateGuardianToken(address _newAddress)` | `onlyOwner` | (Optional) Allows upgrading to a new GuardianSBT contract version |

#### B. Funding (Deposits)

| Function | Visibility | Description |
|----------|-----------|-------------|
| `receive()` / `fallback()` | `external` | Allows the contract to accept native ETH (Base ETH) |
| `deposit(address token, uint256 amount)` | `external` | Helper function for depositing ERC-20 tokens (USDC, DEGEN, etc.) |

#### C. Withdrawal (Core Logic)

**Function Signature:**
```solidity
function withdraw(
    address token,
    uint256 amount,
    address recipient,
    string memory reason,
    bytes[] memory signatures
) external nonReentrant
```

**Execution Logic (Step-by-Step):**

1. **Hash Reconstruction:** Create the EIP-712 struct hash using:
   - Token address
   - Amount
   - Recipient address
   - Current nonce
   - Reason string

2. **Quorum Verification:** Verify `signatures.length >= quorum`

3. **Signature Verification Loop:** For each signature:
   - Recover the signer's address using `ECDSA.recover()`
   - **Check 1:** Verify `GuardianSBT.balanceOf(signer) > 0` (must be a Guardian)
   - **Check 2:** Verify signer hasn't already been counted (prevent duplicate signatures)

4. **Fund Transfer (if all checks pass):**
   - Increment `nonce++` (prevent replay attacks)
   - Transfer `amount` of `token` to `recipient`
   - Emit `Withdrawal` event

---

## 4. EIP-712 Typed Data Structure

To ensure users see a readable message in their wallet (not just hex), the contract and frontend must agree on this exact data structure:

```solidity
// Domain Separator Constants
string private constant SIGNING_DOMAIN = "SpendGuard";
string private constant SIGNING_VERSION = "1";

// The Withdrawal Type Hash
bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
    "Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,string reason)"
);

// Domain Separator (computed in constructor)
bytes32 private DOMAIN_SEPARATOR;
```

The domain separator should be computed using:
```solidity
DOMAIN_SEPARATOR = keccak256(
    abi.encode(
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
        keccak256(bytes("SpendGuard")),
        keccak256(bytes("1")),
        block.chainid,
        address(this)
    )
);
```

---

## 5. Security Requirements Checklist

- [ ] **Reentrancy Guard:** Use `@nonReentrant` modifier on the `withdraw()` function
- [ ] **Zero Address Check:** Verify `recipient != address(0)` in `withdraw()`
- [ ] **Nonce Validation:** Ensure nonce is part of the signed hash (prevents replay attacks)
- [ ] **Guardian Validation:** Verify each signer holds a GuardianSBT token
- [ ] **Duplicate Prevention:** Track which signers have been used in the current withdrawal
- [ ] **Ownership:** The SpendVault owner should be the Saver's primary wallet
- [ ] **Token Balance Check:** Verify vault has sufficient balance before transfer
- [ ] **Safe Transfer:** Use `safeTransfer()` for ERC-20 tokens to handle non-standard implementations

---

## 6. Optional: Emergency Escape (Rage Quit with Timelock)

For users who want to withdraw without Guardian approval in emergencies:

### 6.1 State Variables

```solidity
uint256 public unlockRequestTime;
uint256 public constant TIMELOCK_DURATION = 30 days;
```

### 6.2 Functions

**Request Emergency Unlock:**
```solidity
function requestEmergencyUnlock() external onlyOwner
```
- Sets `unlockRequestTime = block.timestamp`
- Notifies Guardians of the request (emit event)

**Execute Emergency Unlock:**
```solidity
function executeEmergencyUnlock(address token) external onlyOwner
```
- Requires: `block.timestamp >= unlockRequestTime + TIMELOCK_DURATION`
- Allows the saver to withdraw all funds of a specific token without signatures
- Resets `unlockRequestTime = 0` after execution

---

## 7. Event Emissions

```solidity
event Withdrawal(
    address indexed token,
    uint256 amount,
    address indexed recipient,
    string reason,
    uint256 nonce
);

event EmergencyUnlockRequested(uint256 timestamp);

event EmergencyUnlockExecuted(address indexed token, uint256 amount);

event QuorumUpdated(uint256 newQuorum);

event GuardianTokenUpdated(address newGuardianToken);
```

---

## 8. Deployment Checklist

- [ ] Deploy GuardianSBT contract (with saver as owner)
- [ ] Deploy SpendVault contract (with saver as owner, link GuardianSBT)
- [ ] Set initial quorum value
- [ ] Test all withdrawal scenarios locally
- [ ] Verify EIP-712 domain separator matches on-chain and frontend
- [ ] Test signature recovery with multiple signers
- [ ] Conduct security audit before mainnet deployment
- [ ] Deploy on Base Mainnet
- [ ] Verify contract addresses and code on BaseScan
