// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/GuardianEmergencyOverride.sol";

contract GuardianEmergencyOverrideTest is Test {
    GuardianEmergencyOverride public emergencyOverride;
    
    address public vault;
    address public emergency1;
    address public emergency2;
    address public emergency3;
    address public owner;

    function setUp() public {
        emergencyOverride = new GuardianEmergencyOverride();
        
        owner = address(this);
        vault = makeAddr("vault");
        emergency1 = makeAddr("emergency1");
        emergency2 = makeAddr("emergency2");
        emergency3 = makeAddr("emergency3");
    }

    // ==================== Emergency Guardian Management ====================

    function testAddEmergencyGuardian() public {
        vm.expectEmit(true, true, false, true);
        emit GuardianEmergencyOverride.EmergencyGuardianAdded(vault, emergency1, block.timestamp);
        
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        
        assertTrue(emergencyOverride.isEmergencyGuardian(vault, emergency1));
    }

    function testRemoveEmergencyGuardian() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        assertTrue(emergencyOverride.isEmergencyGuardian(vault, emergency1));
        
        vm.expectEmit(true, true, false, true);
        emit GuardianEmergencyOverride.EmergencyGuardianRemoved(vault, emergency1, block.timestamp);
        
        emergencyOverride.removeEmergencyGuardian(vault, emergency1);
        
        assertFalse(emergencyOverride.isEmergencyGuardian(vault, emergency1));
    }

    function testCannotAddDuplicateGuardian() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        
        vm.expectRevert("Already an emergency guardian");
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
    }

    function testGetEmergencyGuardians() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        emergencyOverride.addEmergencyGuardian(vault, emergency3);
        
        address[] memory guardians = emergencyOverride.getEmergencyGuardians(vault);
        
        assertEq(guardians.length, 3);
        assertEq(guardians[0], emergency1);
        assertEq(guardians[1], emergency2);
        assertEq(guardians[2], emergency3);
    }

    function testGetEmergencyGuardianCount() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        
        assertEq(emergencyOverride.getEmergencyGuardianCount(vault), 2);
        
        emergencyOverride.removeEmergencyGuardian(vault, emergency1);
        
        assertEq(emergencyOverride.getEmergencyGuardianCount(vault), 1);
    }

    // ==================== Quorum Management ====================

    function testSetEmergencyQuorum() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        
        vm.expectEmit(true, false, false, true);
        emit GuardianEmergencyOverride.EmergencyQuorumSet(vault, 2, block.timestamp);
        
        emergencyOverride.setEmergencyQuorum(vault, 2);
        
        assertEq(emergencyOverride.getEmergencyQuorum(vault), 2);
    }

    function testCannotSetQuorumHigherThanGuardianCount() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        
        vm.expectRevert("Quorum cannot exceed emergency guardian count");
        emergencyOverride.setEmergencyQuorum(vault, 3);
    }

    // ==================== Emergency Override Activation ====================

    function testActivateEmergencyOverride() public {
        vm.expectEmit(true, true, false, true);
        emit GuardianEmergencyOverride.EmergencyOverrideActivated(vault, 0, block.timestamp, block.timestamp);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        assertEq(emergencyId, 0);
        assertEq(emergencyOverride.getCurrentEmergencyId(vault), 1);
    }

    function testMultipleEmergencyActivations() public {
        uint256 emergencyId1 = emergencyOverride.activateEmergencyOverride(vault);
        uint256 emergencyId2 = emergencyOverride.activateEmergencyOverride(vault);
        uint256 emergencyId3 = emergencyOverride.activateEmergencyOverride(vault);
        
        assertEq(emergencyId1, 0);
        assertEq(emergencyId2, 1);
        assertEq(emergencyId3, 2);
    }

    // ==================== Emergency Approval ====================

    function testApproveEmergencyUnlock() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.setEmergencyQuorum(vault, 1);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.prank(emergency1);
        vm.expectEmit(true, true, true, true);
        emit GuardianEmergencyOverride.EmergencyApprovalReceived(vault, emergencyId, emergency1, 1, block.timestamp);
        
        bool quorumReached = emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        
        assertTrue(quorumReached);
        assertTrue(emergencyOverride.isEmergencyApproved(vault, emergencyId));
    }

    function testQuorumReachedMultipleApprovals() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        emergencyOverride.addEmergencyGuardian(vault, emergency3);
        emergencyOverride.setEmergencyQuorum(vault, 2);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.prank(emergency1);
        bool quorum1 = emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        assertFalse(quorum1); // Need 2 approvals
        
        vm.prank(emergency2);
        bool quorum2 = emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        assertTrue(quorum2); // Now have 2 approvals
        
        assertEq(emergencyOverride.getEmergencyApprovalCount(vault, emergencyId), 2);
    }

    function testGuardianCannotVoteTwice() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.setEmergencyQuorum(vault, 2);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.prank(emergency1);
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        
        vm.prank(emergency1);
        vm.expectRevert("Already approved this emergency");
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
    }

    function testNonGuardianCannotApprove() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.prank(address(0x999));
        vm.expectRevert("Not an emergency guardian");
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
    }

    function testGetApprovalsNeeded() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        emergencyOverride.addEmergencyGuardian(vault, emergency3);
        emergencyOverride.setEmergencyQuorum(vault, 3);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        assertEq(emergencyOverride.getApprovalsNeeded(vault, emergencyId), 3);
        
        vm.prank(emergency1);
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        
        assertEq(emergencyOverride.getApprovalsNeeded(vault, emergencyId), 2);
        
        vm.prank(emergency2);
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        
        assertEq(emergencyOverride.getApprovalsNeeded(vault, emergencyId), 1);
    }

    function testHasGuardianApproved() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        emergencyOverride.addEmergencyGuardian(vault, emergency2);
        
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.prank(emergency1);
        emergencyOverride.approveEmergencyUnlock(vault, emergencyId);
        
        assertTrue(emergencyOverride.hasGuardianApproved(vault, emergencyId, emergency1));
        assertFalse(emergencyOverride.hasGuardianApproved(vault, emergencyId, emergency2));
    }

    // ==================== Emergency Cancellation ====================

    function testCancelEmergencyOverride() public {
        emergencyOverride.addEmergencyGuardian(vault, emergency1);
        uint256 emergencyId = emergencyOverride.activateEmergencyOverride(vault);
        
        vm.expectEmit(true, true, false, true);
        emit GuardianEmergencyOverride.EmergencyOverrideCancelled(vault, emergencyId, "Test cancellation", block.timestamp);
        
        emergencyOverride.cancelEmergencyOverride(vault, emergencyId, "Test cancellation");
        
        assertFalse(emergencyOverride.isEmergencyApproved(vault, emergencyId));
    }

    // ==================== Views ====================

    function testGetEmergencyActivationTime() public {
        uint256 timeBefore = block.timestamp;
        emergencyOverride.activateEmergencyOverride(vault);
        uint256 timeAfter = block.timestamp;
        
        uint256 activationTime = emergencyOverride.getEmergencyActivationTime(vault);
        
        assertTrue(activationTime >= timeBefore && activationTime <= timeAfter);
    }

    function testGetEmergencyElapsedTime() public {
        emergencyOverride.activateEmergencyOverride(vault);
        
        assertEq(emergencyOverride.getEmergencyElapsedTime(vault), 0);
        
        vm.warp(block.timestamp + 1 hours);
        
        assertEq(emergencyOverride.getEmergencyElapsedTime(vault), 1 hours);
    }

    function testGetCurrentEmergencyId() public {
        assertEq(emergencyOverride.getCurrentEmergencyId(vault), 0);
        
        emergencyOverride.activateEmergencyOverride(vault);
        assertEq(emergencyOverride.getCurrentEmergencyId(vault), 1);
        
        emergencyOverride.activateEmergencyOverride(vault);
        assertEq(emergencyOverride.getCurrentEmergencyId(vault), 2);
    }
}
