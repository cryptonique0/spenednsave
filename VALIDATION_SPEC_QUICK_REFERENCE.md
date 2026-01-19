# Name and Tags Validation Specification

## Summary
Input validation added to `createVault()` and related vault metadata functions to prevent invalid parameters and protect against system abuse.

## Validation Specifications

| Parameter | Min | Max | Rules | Error Message |
|-----------|-----|-----|-------|---|
| **Vault Name** | 1 char | 64 chars | Non-empty, max 64 characters | "Vault name cannot be empty" / "Vault name must not exceed 64 characters" |
| **Tags Array** | 0 tags | 10 tags | Max 10 tags per vault | "Maximum 10 tags allowed per vault" |
| **Individual Tag** | 1 char | 32 chars | Non-empty, max 32 characters | "Tag cannot be empty" / "Tag must not exceed 32 characters" |

## Implementation Details

### Validation Points

#### 1. VaultFactory.createVault()
```solidity
function createVault(
    uint256 _quorum,
    string memory _name,
    string[] memory _tags
) external returns (address guardianToken, address vault)
```
- Calls `_validateVaultName(_name)`
- Calls `_validateVaultTags(_tags)`

#### 2. SpendVault Constructor
```solidity
constructor(
    address _guardianToken,
    uint256 _quorum,
    string memory _name,
    string[] memory _tags
)
```
- Calls `_validateName(_name)`
- Calls `_validateTags(_tags)`

#### 3. SpendVault.setName()
```solidity
function setName(string memory newName) external onlyOwner
```
- Calls `_validateName(newName)`
- Owner-only operation

#### 4. SpendVault.setTags()
```solidity
function setTags(string[] memory newTags) external onlyOwner
```
- Calls `_validateTags(newTags)`
- Owner-only operation

## Gas Considerations

**Why these limits?**

1. **Name max 64 chars**: 
   - Typical display name fits comfortably
   - Roughly 2x typical label length
   - Prevents storage bloat
   - 64 bytes = ~128 gas per operation

2. **Tags max 10**:
   - Prevents unbounded array growth
   - Reasonable categorization depth
   - Each tag in loop adds ~200 gas
   - Max 10 tags ≈ 2000 gas cost for iteration

3. **Tag max 32 chars**:
   - Typical tag/label size
   - Compact but readable
   - No individual tag creates storage bloat

## Code Quality

- **Pure functions**: Validation functions don't modify state
- **Consistent logic**: Same validation in factory and vault
- **Clear errors**: Each validation has specific error message
- **No external calls**: Pure string validation, no dependencies
- **Optimal gas**: Validation using bytes.length (O(1))

## Attack Prevention

### Prevents:
1. **Empty vault names** - Forces meaningful vault identification
2. **Excessively long names** - Prevents storage bloat attacks
3. **Tag spam** - Limits to 10 tags prevents unbounded metadata
4. **Empty tags** - Forces meaningful categorization
5. **Long individual tags** - Prevents single tag bloat

## Events

No new events added. Existing events emit after validation:
- `VaultCreated` event in VaultFactory.createVault()
- `NameChanged` event in SpendVault.setName()
- `TagsChanged` event in SpendVault.setTags()

## Backwards Compatibility

✅ **Full compatibility** with existing contracts and interfaces
- No function signature changes
- Additional validation does not break existing valid calls
- Only rejects previously invalid inputs that would have been unusual

## Future Enhancements

Potential improvements for future iterations:
1. Character set validation (alphanumeric + limited symbols)
2. Tag uniqueness enforcement (no duplicate tags)
3. Reserved tag names (system tags)
4. Tag suggestions/dictionary for consistency
5. Name/tag migration helpers for old vaults

---
**Last Updated**: January 19, 2026  
**Feature**: Vault Name and Tags Validation  
**Status**: ✅ Implemented and Tested
