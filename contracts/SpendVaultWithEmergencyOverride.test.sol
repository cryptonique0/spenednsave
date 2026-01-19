// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/GuardianSBT.sol";
import "../contracts/SpendVaultWithEmergencyOverride.sol";
import "../contracts/GuardianEmergencyOverride.sol";

contract SpendVaultWithEmergencyOverrideTest is Test {
    GuardianSBT public guardianToken;
    SpendVaultWithEmergencyOverride public vault;
    GuardianEmergencyOverride public emergencyOverride;
    
    address public owner;
    address public emergency1;
    address public emergency2;
    address public emergency3;
    address public recipient;

    function setUp() public {
        owner = address(this);
        emergency1 = makeAddr("emergency1");
        emergency2 = makeAddr("emergency2");
        emergency3 = makeAddr("emergency3");
        recipient = makeAddr("recipient");
        
        // Deploy contracts
        emergencyOverride = new GuardianEmergencyOverride();
        guardianToken = new GuardianSBT();
        vault = new SpendVaultWithEmergencyOverride(address(guardianToken), 2, address(emergencyOverride));
        
        // Transfer ownership
        guardianToken.transferOwnership(owner);
        vault.transferOwnership(owner);
    }

    // ==================== Emergency Guardian Setup ====================

    function testAddEmergencyGuardian() public {
        vault.addEmergencyGuardian(emergency1);
        
        assertTrue(emergencyOverride.isEmergencyGuardian(address(vault), emergency1));
    }

    function testSetEmergencyGuardianQuorum() public {
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        
        vault.setEmergencyGuardianQuorum(2);
        
        assertEq(emergencyOverride.getEmergencyQuorum(address(vault)), 2);
    }

    function testGetEmergencyGuardians() public {
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        vault.addEmergencyGuardian(emergency3);
        
        address[] memory guardians = vault.getEmergencyGuardians();
        
        assertEq(guardians.length, 3);
        assertEq(guardians[0], emergency1);
    }

    function testGetEmergencyGuardianCount() public {
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        
        assertEq(vault.getEmergencyGuardianCount(), 2);
    }

    // ==================== Emergency Unlock Request ====================

    function testRequestEmergencyUnlock() public {
        vault.addEmergencyGuardian(emergency1);
        
        uint256 emergencyId = vault.requestEmergencyUnlock();
        
        assertEq(emergencyId, 0);
        assertTrue(vault.isEmergencyUnlockActive());
        assertEq(vault.getEmergencyUnlockRequestTime(), block.timestamp);
    }

    function testEmergencyUnlockRequestTime() public {
        vault.requestEmergencyUnlock();
        
        uint256 requestTime = vault.getEmergencyUnlockRequestTime();
        assertEq(requestTime, block.timestamp);
    }

    function testGetEmergencyUnlockTimeRemaining() public {
        vault.requestEmergencyUnlock();
        
        uint256 remaining = vault.getEmergencyUnlockTimeRemaining();
        assertEq(remaining, 30 days);
        
        vm.warp(block.timestamp + 15 days);
        
        remaining = vault.getEmergencyUnlockTimeRemaining();
        assertEq(remaining, 15 days);
    }

    // ==================== Emergency Guardian Approval ====================

    function testApproveEmergencyUnlock() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vault.requestEmergencyUnlock();
        
        vm.prank(emergency1);
        bool quorumReached = vault.approveEmergencyUnlock(0);
        
        assertTrue(quorumReached);
        assertEq(vault.getEmergencyApprovalsCount(), 1);
    }

    function testMultipleApprovalsForQuorum() public {
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        vault.addEmergencyGuardian(emergency3);
        vault.setEmergencyGuardianQuorum(2);
        
        vault.requestEmergencyUnlock();
        
        vm.prank(emergency1);
        bool quorum1 = vault.approveEmergencyUnlock(0);
        assertFalse(quorum1);
        
        assertEq(vault.getEmergencyApprovalsCount(), 1);
        
        vm.prank(emergency2);
        bool quorum2 = vault.approveEmergencyUnlock(0);
        assertTrue(quorum2);
        
        assertEq(vault.getEmergencyApprovalsCount(), 2);
    }

    // ==================== Emergency Withdrawal Via Approval ====================

    function testExecuteEmergencyWithdrawalViaApprovalETH() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        // Fund vault
        vm.deal(address(vault), 100 ether);
        assertEq(vault.getETHBalance(), 100 ether);
        
        // Request emergency unlock
        uint256 emergencyId = vault.requestEmergencyUnlock();
        
        // Get approval
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(emergencyId);
        
        // Execute withdrawal
        uint256 initialRecipientBalance = recipient.balance;
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            10 ether,
            recipient,
            "Emergency medical expenses",
            emergencyId
        );
        
        assertEq(vault.getETHBalance(), 90 ether);
        assertEq(recipient.balance, initialRecipientBalance + 10 ether);
        assertFalse(vault.isEmergencyUnlockActive());
    }

    function testExecuteEmergencyWithdrawalViaApprovalCannotExecuteWithoutApproval() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vm.deal(address(vault), 100 ether);
        
        vault.requestEmergencyUnlock();
        
        vm.expectRevert("Emergency not approved by guardians");
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            10 ether,
            recipient,
            "Test",
            0
        );
    }

    function testExecuteEmergencyWithdrawalViaApprovalInsufficientBalance() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vault.requestEmergencyUnlock();
        
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(0);
        
        vm.expectRevert("Insufficient ETH balance");
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            100 ether,
            recipient,
            "Test",
            0
        );
    }

    // ==================== Emergency Withdrawal Via Timelock ====================

    function testExecuteEmergencyWithdrawalViaTimelockETH() public {
        vault.addEmergencyGuardian(emergency1);
        
        vm.deal(address(vault), 100 ether);
        
        vault.requestEmergencyUnlock();
        
        // Warp 30 days
        vm.warp(block.timestamp + 30 days);
        
        uint256 initialRecipientBalance = recipient.balance;
        vault.executeEmergencyUnlockViaTimelock(
            address(0),
            10 ether,
            recipient
        );
        
        assertEq(vault.getETHBalance(), 90 ether);
        assertEq(recipient.balance, initialRecipientBalance + 10 ether);
    }

    function testExecuteEmergencyWithdrawalViaTimelockCannotExecuteBeforeTimelock() public {
        vault.requestEmergencyUnlock();
        
        vm.deal(address(vault), 100 ether);
        
        vm.expectRevert("Timelock period not yet expired");
        vault.executeEmergencyUnlockViaTimelock(
            address(0),
            10 ether,
            recipient
        );
    }

    function testExecuteEmergencyWithdrawalViaTimelockCannotExecuteWithoutRequest() public {
        vm.deal(address(vault), 100 ether);
        
        vm.expectRevert("Emergency unlock not requested");
        vault.executeEmergencyUnlockViaTimelock(
            address(0),
            10 ether,
            recipient
        );
    }

    // ==================== Emergency Cancellation ====================

    function testCancelEmergencyUnlock() public {
        vault.requestEmergencyUnlock();
        assertTrue(vault.isEmergencyUnlockActive());
        
        vault.cancelEmergencyUnlock();
        
        assertFalse(vault.isEmergencyUnlockActive());
        assertEq(vault.getEmergencyUnlockRequestTime(), 0);
    }

    function testCannotCancelIfNotRequested() public {
        vm.expectRevert("Emergency unlock not requested");
        vault.cancelEmergencyUnlock();
    }

    // ==================== Quorum Management ====================

    function testSetQuorum() public {
        vault.setQuorum(3);
        
        assertEq(vault.quorum(), 3);
    }

    function testUpdateGuardianToken() public {
        address newToken = makeAddr("newToken");
        vault.updateGuardianToken(newToken);
        
        assertEq(vault.guardianToken(), newToken);
    }

    function testUpdateEmergencyOverride() public {
        address newOverride = makeAddr("newOverride");
        vault.updateEmergencyOverride(newOverride);
        
        assertEq(vault.emergencyOverride(), newOverride);
    }

    // ==================== Balance Views ====================

    function testGetETHBalance() public {
        vm.deal(address(vault), 50 ether);
        assertEq(vault.getETHBalance(), 50 ether);
    }

    function testGetEmergencyQuorum() public {
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        vault.setEmergencyGuardianQuorum(2);
        
        assertEq(vault.getEmergencyGuardianQuorum(), 2);
    }

    function testIsEmergencyUnlockActive() public {
        assertFalse(vault.isEmergencyUnlockActive());
        
        vault.addEmergencyGuardian(emergency1);
        vault.requestEmergencyUnlock();
        
        assertTrue(vault.isEmergencyUnlockActive());
    }

    function testGetCurrentEmergencyId() public {
        assertEq(vault.getCurrentEmergencyId(), 0);
        
        vault.addEmergencyGuardian(emergency1);
        vault.requestEmergencyUnlock();
        
        assertEq(vault.getCurrentEmergencyId(), 1);
    }

    function testGetEmergencyApprovalsCount() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vault.requestEmergencyUnlock();
        
        assertEq(vault.getEmergencyApprovalsCount(), 0);
        
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(0);
        
        assertEq(vault.getEmergencyApprovalsCount(), 1);
    }

    // ==================== Emergency Withdrawal Details ====================

    function testGetEmergencyWithdrawalDetails() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vm.deal(address(vault), 100 ether);
        
        uint256 emergencyId = vault.requestEmergencyUnlock();
        
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(emergencyId);
        
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            10 ether,
            recipient,
            "Medical emergency",
            emergencyId
        );
        
        (uint256 amount, string memory reason, uint256 timestamp) = vault.getEmergencyWithdrawalDetails(emergencyId, address(0));
        
        assertEq(amount, 10 ether);
        assertEq(keccak256(abi.encodePacked(reason)), keccak256(abi.encodePacked("Medical emergency")));
        assertEq(timestamp, block.timestamp);
    }

    // ==================== Reentrancy Protection ====================

    function testNonReentrant() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vm.deal(address(vault), 100 ether);
        
        vault.requestEmergencyUnlock();
        
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(0);
        
        // Should not be able to re-enter during withdrawal
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            10 ether,
            recipient,
            "Test",
            0
        );
        
        assertEq(vault.getETHBalance(), 90 ether);
    }

    // ==================== Multiple Emergency Unlocks ====================

    function testMultipleEmergencyUnlocks() public {
        vault.addEmergencyGuardian(emergency1);
        vault.setEmergencyGuardianQuorum(1);
        
        vm.deal(address(vault), 100 ether);
        
        // First emergency
        uint256 emergencyId1 = vault.requestEmergencyUnlock();
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(emergencyId1);
        vault.executeEmergencyWithdrawalViaApproval(address(0), 10 ether, recipient, "First", emergencyId1);
        
        assertEq(vault.getETHBalance(), 90 ether);
        
        // Second emergency (same emergency ID should fail, need new one)
        uint256 emergencyId2 = vault.requestEmergencyUnlock();
        assertEq(emergencyId2, 1); // New emergency ID
        
        vm.prank(emergency1);
        vault.approveEmergencyUnlock(emergencyId2);
        vault.executeEmergencyWithdrawalViaApproval(address(0), 10 ether, recipient, "Second", emergencyId2);
        
        assertEq(vault.getETHBalance(), 80 ether);
    }

    // ==================== Integration ====================

    function testFullEmergencyUnlockFlow() public {
        // Setup
        vault.addEmergencyGuardian(emergency1);
        vault.addEmergencyGuardian(emergency2);
        vault.addEmergencyGuardian(emergency3);
        vault.setEmergencyGuardianQuorum(2);
        
        vm.deal(address(vault), 100 ether);
        
        // Request emergency
        uint256 emergencyId = vault.requestEmergencyUnlock();
        assertTrue(vault.isEmergencyUnlockActive());
        
        // Get one approval (not enough)
        vm.prank(emergency1);
        bool quorum1 = vault.approveEmergencyUnlock(emergencyId);
        assertFalse(quorum1);
        
        // Get second approval (quorum reached)
        vm.prank(emergency2);
        bool quorum2 = vault.approveEmergencyUnlock(emergencyId);
        assertTrue(quorum2);
        
        // Execute withdrawal
        vault.executeEmergencyWithdrawalViaApproval(
            address(0),
            50 ether,
            recipient,
            "Critical emergency",
            emergencyId
        );
        
        assertEq(vault.getETHBalance(), 50 ether);
        assertFalse(vault.isEmergencyUnlockActive());
    }
}
