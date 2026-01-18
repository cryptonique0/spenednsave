// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SpendingLimits.sol";

contract SpendingLimitsTest is Test {
    SpendingLimits limitsContract;
    
    address vault;
    address token;
    address guardian1;
    address guardian2;
    address guardian3;
    address owner;
    
    event GuardianLimitSet(
        address indexed vault,
        address indexed token,
        address indexed guardian,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    );
    
    event GuardianWithdrawal(
        address indexed vault,
        address indexed token,
        address indexed guardian,
        uint256 amount,
        uint256 dailySpent,
        uint256 weeklySpent,
        uint256 monthlySpent
    );
    
    event VaultLimitSet(
        address indexed vault,
        address indexed token,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    );
    
    event VaultWithdrawal(
        address indexed vault,
        address indexed token,
        uint256 amount,
        uint256 dailySpent,
        uint256 weeklySpent,
        uint256 monthlySpent
    );
    
    function setUp() public {
        owner = address(this);
        limitsContract = new SpendingLimits();
        
        vault = address(0x1234);
        token = address(0x5678);
        guardian1 = address(0x1111);
        guardian2 = address(0x2222);
        guardian3 = address(0x3333);
    }
    
    // ============ Guardian Limit Tests ============
    
    function testSetGuardianLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        
        (bool isActive, uint256 daily, uint256 weekly, uint256 monthly,,,,) = 
            limitsContract.guardianLimits(vault, token, guardian1);
        
        assertTrue(isActive);
        assertEq(daily, 1 ether);
        assertEq(weekly, 5 ether);
        assertEq(monthly, 20 ether);
    }
    
    function testSetGuardianLimitEmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit GuardianLimitSet(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
    }
    
    function testRemoveGuardianLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        limitsContract.removeGuardianLimit(vault, token, guardian1);
        
        (bool isActive,,,,,,,,) = limitsContract.guardianLimits(vault, token, guardian1);
        assertFalse(isActive);
    }
    
    function testCheckGuardianLimitUnderLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 0.5 ether
        );
        
        assertTrue(allowed);
        assertEq(keccak256(abi.encodePacked(reason)), keccak256(abi.encodePacked("")));
    }
    
    function testCheckGuardianLimitExceedsDailyLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 1.5 ether
        );
        
        assertFalse(allowed);
        assertEq(
            keccak256(abi.encodePacked(reason)),
            keccak256(abi.encodePacked("DAILY_LIMIT_EXCEEDED"))
        );
    }
    
    function testCheckGuardianLimitExceedsWeeklyLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 10 ether, 5 ether, 20 ether);
        
        // First withdrawal within daily limit
        limitsContract.recordGuardianWithdrawal(vault, token, guardian1, 3 ether);
        
        // Second withdrawal that exceeds weekly limit
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 3 ether
        );
        
        assertFalse(allowed);
        assertEq(
            keccak256(abi.encodePacked(reason)),
            keccak256(abi.encodePacked("WEEKLY_LIMIT_EXCEEDED"))
        );
    }
    
    function testCheckGuardianLimitExceedsMonthlyLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 10 ether, 50 ether, 20 ether);
        
        // First withdrawal within daily and weekly limits
        limitsContract.recordGuardianWithdrawal(vault, token, guardian1, 12 ether);
        
        // Second withdrawal that exceeds monthly limit
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 10 ether
        );
        
        assertFalse(allowed);
        assertEq(
            keccak256(abi.encodePacked(reason)),
            keccak256(abi.encodePacked("MONTHLY_LIMIT_EXCEEDED"))
        );
    }
    
    function testCheckGuardianLimitInactive() public {
        // Don't set any limit
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 100 ether
        );
        
        assertTrue(allowed);
        assertEq(keccak256(abi.encodePacked(reason)), keccak256(abi.encodePacked("")));
    }
    
    function testRecordGuardianWithdrawal() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 10 ether, 50 ether, 100 ether);
        
        vm.expectEmit(true, true, true, true);
        emit GuardianWithdrawal(vault, token, guardian1, 3 ether, 3 ether, 3 ether, 3 ether);
        limitsContract.recordGuardianWithdrawal(vault, token, guardian1, 3 ether);
        
        (uint256 daily, uint256 weekly, uint256 monthly) = limitsContract.getGuardianSpending(
            vault, token, guardian1
        );
        
        assertEq(daily, 3 ether);
        assertEq(weekly, 3 ether);
        assertEq(monthly, 3 ether);
    }
    
    function testGetGuardianRemaining() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 10 ether, 50 ether, 100 ether);
        limitsContract.recordGuardianWithdrawal(vault, token, guardian1, 3 ether);
        
        (uint256 dailyRem, uint256 weeklyRem, uint256 monthlyRem) = 
            limitsContract.getGuardianRemaining(vault, token, guardian1);
        
        assertEq(dailyRem, 7 ether);
        assertEq(weeklyRem, 47 ether);
        assertEq(monthlyRem, 97 ether);
    }
    
    function testGetGuardianRemainingUnlimited() public {
        (uint256 dailyRem, uint256 weeklyRem, uint256 monthlyRem) = 
            limitsContract.getGuardianRemaining(vault, token, guardian1);
        
        assertEq(dailyRem, type(uint256).max);
        assertEq(weeklyRem, type(uint256).max);
        assertEq(monthlyRem, type(uint256).max);
    }
    
    function testMultipleGuardianLimits() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        limitsContract.setGuardianLimit(vault, token, guardian2, 2 ether, 10 ether, 40 ether);
        limitsContract.setGuardianLimit(vault, token, guardian3, 0.5 ether, 2 ether, 10 ether);
        
        (uint256 daily1,,) = limitsContract.getGuardianRemaining(vault, token, guardian1);
        (uint256 daily2,,) = limitsContract.getGuardianRemaining(vault, token, guardian2);
        (uint256 daily3,,) = limitsContract.getGuardianRemaining(vault, token, guardian3);
        
        assertEq(daily1, 1 ether);
        assertEq(daily2, 2 ether);
        assertEq(daily3, 0.5 ether);
    }
    
    // ============ Vault Limit Tests ============
    
    function testSetVaultLimit() public {
        limitsContract.setVaultLimit(vault, token, 5 ether, 20 ether, 100 ether);
        
        (bool isEnabled, uint256 daily, uint256 weekly, uint256 monthly,,,,) = 
            limitsContract.vaultLimits(vault, token);
        
        assertTrue(isEnabled);
        assertEq(daily, 5 ether);
        assertEq(weekly, 20 ether);
        assertEq(monthly, 100 ether);
    }
    
    function testSetVaultLimitEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit VaultLimitSet(vault, token, 5 ether, 20 ether, 100 ether);
        limitsContract.setVaultLimit(vault, token, 5 ether, 20 ether, 100 ether);
    }
    
    function testCheckVaultLimitUnderLimit() public {
        limitsContract.setVaultLimit(vault, token, 5 ether, 20 ether, 100 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkVaultLimit(vault, token, 3 ether);
        
        assertTrue(allowed);
        assertEq(keccak256(abi.encodePacked(reason)), keccak256(abi.encodePacked("")));
    }
    
    function testCheckVaultLimitExceedsDailyLimit() public {
        limitsContract.setVaultLimit(vault, token, 5 ether, 20 ether, 100 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkVaultLimit(vault, token, 6 ether);
        
        assertFalse(allowed);
        assertEq(
            keccak256(abi.encodePacked(reason)),
            keccak256(abi.encodePacked("VAULT_DAILY_LIMIT_EXCEEDED"))
        );
    }
    
    function testRecordVaultWithdrawal() public {
        limitsContract.setVaultLimit(vault, token, 10 ether, 50 ether, 100 ether);
        
        vm.expectEmit(true, true, false, true);
        emit VaultWithdrawal(vault, token, 3 ether, 3 ether, 3 ether, 3 ether);
        limitsContract.recordVaultWithdrawal(vault, token, 3 ether);
        
        (uint256 daily, uint256 weekly, uint256 monthly) = limitsContract.getVaultSpending(vault, token);
        
        assertEq(daily, 3 ether);
        assertEq(weekly, 3 ether);
        assertEq(monthly, 3 ether);
    }
    
    function testGetVaultRemaining() public {
        limitsContract.setVaultLimit(vault, token, 10 ether, 50 ether, 100 ether);
        limitsContract.recordVaultWithdrawal(vault, token, 3 ether);
        
        (uint256 dailyRem, uint256 weeklyRem, uint256 monthlyRem) = 
            limitsContract.getVaultRemaining(vault, token);
        
        assertEq(dailyRem, 7 ether);
        assertEq(weeklyRem, 47 ether);
        assertEq(monthlyRem, 97 ether);
    }
    
    // ============ Multiple Tokens/Vaults ============
    
    function testMultipleTokensIndependentLimits() public {
        address token2 = address(0x9999);
        
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        limitsContract.setGuardianLimit(vault, token2, guardian1, 2 ether, 10 ether, 40 ether);
        
        (uint256 daily1,,) = limitsContract.getGuardianRemaining(vault, token, guardian1);
        (uint256 daily2,,) = limitsContract.getGuardianRemaining(vault, token2, guardian1);
        
        assertEq(daily1, 1 ether);
        assertEq(daily2, 2 ether);
    }
    
    function testMultipleVaultsIndependentLimits() public {
        address vault2 = address(0x5555);
        
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        limitsContract.setGuardianLimit(vault2, token, guardian1, 2 ether, 10 ether, 40 ether);
        
        (uint256 daily1,,) = limitsContract.getGuardianRemaining(vault, token, guardian1);
        (uint256 daily2,,) = limitsContract.getGuardianRemaining(vault2, token, guardian1);
        
        assertEq(daily1, 1 ether);
        assertEq(daily2, 2 ether);
    }
    
    // ============ Unlimited Limits ============
    
    function testUnlimitedDailyLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 0, 5 ether, 20 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 1000 ether
        );
        
        assertTrue(allowed);
        assertEq(keccak256(abi.encodePacked(reason)), keccak256(abi.encodePacked("")));
    }
    
    function testUnlimitedWeeklyLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 0, 20 ether);
        
        limitsContract.recordGuardianWithdrawal(vault, token, guardian1, 50 ether);
        
        (bool allowed, string memory reason) = limitsContract.checkGuardianLimit(
            vault, token, guardian1, 50 ether
        );
        
        assertTrue(allowed);
    }
    
    // ============ Corporate Treasury Scenario ============
    
    function testCorporateTreasuryLimits() public {
        // CEO: $10k daily, $50k weekly, $200k monthly
        limitsContract.setGuardianLimit(vault, token, guardian1, 10000e18, 50000e18, 200000e18);
        
        // CFO: $5k daily, $25k weekly, $100k monthly
        limitsContract.setGuardianLimit(vault, token, guardian2, 5000e18, 25000e18, 100000e18);
        
        // Treasurer: $2k daily, $10k weekly, $50k monthly
        limitsContract.setGuardianLimit(vault, token, guardian3, 2000e18, 10000e18, 50000e18);
        
        // Vault total: $15k daily, $70k weekly, $300k monthly
        limitsContract.setVaultLimit(vault, token, 15000e18, 70000e18, 300000e18);
        
        // CEO can do $10k transaction
        (bool allowed1,) = limitsContract.checkGuardianLimit(vault, token, guardian1, 10000e18);
        assertTrue(allowed1);
        
        // CFO cannot do $10k transaction (exceeds daily limit)
        (bool allowed2,) = limitsContract.checkGuardianLimit(vault, token, guardian2, 10000e18);
        assertFalse(allowed2);
        
        // Treasurer cannot do $3k transaction (exceeds daily limit)
        (bool allowed3,) = limitsContract.checkGuardianLimit(vault, token, guardian3, 3000e18);
        assertFalse(allowed3);
    }
    
    // ============ DAO Spending Tiers ============
    
    function testDAOSpendingTiers() public {
        // Tier 1 (Founder): $50k daily
        limitsContract.setGuardianLimit(vault, token, guardian1, 50000e18, 200000e18, 500000e18);
        
        // Tier 2 (Senior Dev): $10k daily
        limitsContract.setGuardianLimit(vault, token, guardian2, 10000e18, 50000e18, 200000e18);
        
        // Tier 3 (Junior Dev): $2k daily
        limitsContract.setGuardianLimit(vault, token, guardian3, 2000e18, 10000e18, 50000e18);
        
        // Founder can do $50k
        (bool allowed1,) = limitsContract.checkGuardianLimit(vault, token, guardian1, 50000e18);
        assertTrue(allowed1);
        
        // Senior can do $10k
        (bool allowed2,) = limitsContract.checkGuardianLimit(vault, token, guardian2, 10000e18);
        assertTrue(allowed2);
        
        // Junior can do $2k
        (bool allowed3,) = limitsContract.checkGuardianLimit(vault, token, guardian3, 2000e18);
        assertTrue(allowed3);
    }
    
    // ============ Authorization Tests ============
    
    function testOnlyOwnerCanSetGuardianLimit() public {
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
    }
    
    function testOnlyOwnerCanRemoveGuardianLimit() public {
        limitsContract.setGuardianLimit(vault, token, guardian1, 1 ether, 5 ether, 20 ether);
        
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        limitsContract.removeGuardianLimit(vault, token, guardian1);
    }
    
    function testOnlyOwnerCanSetVaultLimit() public {
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        limitsContract.setVaultLimit(vault, token, 5 ether, 20 ether, 100 ether);
    }
}
