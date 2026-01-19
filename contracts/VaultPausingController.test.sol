// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultPausingController.sol";

contract VaultPausingControllerTest is Test {
    VaultPausingController controller;
    address vault1 = address(0x1111111111111111111111111111111111111111);
    address vault2 = address(0x2222222222222222222222222222222222222222);
    address admin = address(0x3333333333333333333333333333333333333333);
    address other = address(0x4444444444444444444444444444444444444444);

    function setUp() public {
        controller = new VaultPausingController();
        vm.prank(admin);
        controller.registerVault(vault1);
        vm.prank(admin);
        controller.registerVault(vault2);
    }

    // ==================== Registration Tests ====================

    function test_RegisterVault() public {
        address vault3 = address(0x5555555555555555555555555555555555555555);
        
        vm.prank(admin);
        controller.registerVault(vault3);
        
        assertTrue(controller.isManagedVault(vault3));
    }

    function test_RegisterVaultEmitsEvent() public {
        address vault3 = address(0x5555555555555555555555555555555555555555);
        
        vm.prank(admin);
        vm.expectEmit(true, false, false, false);
        emit VaultPausingController.VaultRegistered(vault3, block.timestamp);
        controller.registerVault(vault3);
    }

    // ==================== Pause Tests ====================

    function test_PauseVault() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Security maintenance");
        
        assertTrue(controller.isPaused(vault1));
    }

    function test_PauseVaultRejectsUnmanagedVault() public {
        address unmanaged = address(0x6666666666666666666666666666666666666666);
        
        vm.prank(admin);
        vm.expectRevert("Vault not managed by this controller");
        controller.pauseVault(unmanaged, "Security maintenance");
    }

    function test_PauseVaultRejectsAlreadyPaused() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "First pause");
        
        vm.prank(admin);
        vm.expectRevert("Vault already paused");
        controller.pauseVault(vault1, "Second pause");
    }

    function test_PauseVaultTracksPauseTime() public {
        uint256 beforePause = block.timestamp;
        
        vm.prank(admin);
        controller.pauseVault(vault1, "Security check");
        
        uint256 pauseTime = controller.getPauseTime(vault1);
        
        assertTrue(pauseTime >= beforePause);
        assertTrue(pauseTime <= block.timestamp);
    }

    function test_PauseVaultStoresReason() public {
        string memory reason = "Suspicious activity detected";
        
        vm.prank(admin);
        controller.pauseVault(vault1, reason);
        
        assertEq(controller.getPauseReason(vault1), reason);
    }

    function test_PauseVaultEmitsEvent() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit VaultPausingController.VaultPaused(vault1, "Security emergency", block.timestamp);
        controller.pauseVault(vault1, "Security emergency");
    }

    // ==================== Unpause Tests ====================

    function test_UnpauseVault() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Initial pause");
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Issues resolved");
        
        assertFalse(controller.isPaused(vault1));
    }

    function test_UnpauseVaultRejectsNotPaused() public {
        vm.prank(admin);
        vm.expectRevert("Vault is not paused");
        controller.unpauseVault(vault1, "Trying to unpause unpaused vault");
    }

    function test_UnpauseVaultClearsPauseTime() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Pause");
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Unpause");
        
        uint256 pauseTime = controller.getPauseTime(vault1);
        assertEq(pauseTime, 0);
    }

    function test_UnpauseVaultEmitsEvent() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Pause");
        
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit VaultPausingController.VaultUnpaused(vault1, "All clear", block.timestamp);
        controller.unpauseVault(vault1, "All clear");
    }

    // ==================== Pause Reason Update Tests ====================

    function test_UpdatePauseReason() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Initial reason");
        
        vm.prank(admin);
        controller.updatePauseReason(vault1, "Updated reason");
        
        assertEq(controller.getPauseReason(vault1), "Updated reason");
    }

    function test_UpdatePauseReasonRejectsNotPaused() public {
        vm.prank(admin);
        vm.expectRevert("Vault is not paused");
        controller.updatePauseReason(vault1, "New reason");
    }

    function test_UpdatePauseReasonEmitsEvent() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Old reason");
        
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit VaultPausingController.PauseReasonUpdated(
            vault1,
            "Old reason",
            "New reason",
            block.timestamp
        );
        controller.updatePauseReason(vault1, "New reason");
    }

    // ==================== Elapsed Time Tests ====================

    function test_GetPauseElapsedTime() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Paused");
        
        uint256 elapsedBefore = controller.getPauseElapsedTime(vault1);
        assertEq(elapsedBefore, 0);
        
        vm.warp(block.timestamp + 1 hours);
        
        uint256 elapsedAfter = controller.getPauseElapsedTime(vault1);
        assertTrue(elapsedAfter >= 1 hours);
    }

    function test_GetPauseElapsedTimeAfterUnpause() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Paused");
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Unpaused");
        
        uint256 elapsed = controller.getPauseElapsedTime(vault1);
        assertEq(elapsed, 0); // Reset after unpause
    }

    // ==================== History Tests ====================

    function test_PauseHistoryTracking() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "First pause");
        
        vm.warp(block.timestamp + 1 hours);
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "First unpause");
        
        VaultPausingController.PauseEvent[] memory history = controller.getPauseHistory(vault1);
        
        assertTrue(history.length >= 2);
        assertTrue(history[0].isPaused);
        assertFalse(history[1].isPaused);
    }

    function test_PauseHistoryReasonUpdate() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Initial");
        
        vm.prank(admin);
        controller.updatePauseReason(vault1, "Updated");
        
        VaultPausingController.PauseEvent[] memory history = controller.getPauseHistory(vault1);
        
        assertTrue(history.length >= 1);
    }

    function test_PauseHistoryMultipleCycles() public {
        // First cycle
        vm.prank(admin);
        controller.pauseVault(vault1, "Pause 1");
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Unpause 1");
        
        // Second cycle
        vm.prank(admin);
        controller.pauseVault(vault1, "Pause 2");
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Unpause 2");
        
        VaultPausingController.PauseEvent[] memory history = controller.getPauseHistory(vault1);
        
        assertTrue(history.length >= 4);
    }

    // ==================== Multi-Vault Tests ====================

    function test_PauseOneVaultDoesNotAffectOther() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Paused");
        
        assertFalse(controller.isPaused(vault2));
    }

    function test_MultipleVaultsIndependentStates() public {
        vm.prank(admin);
        controller.pauseVault(vault1, "Vault 1 paused");
        
        vm.prank(admin);
        controller.pauseVault(vault2, "Vault 2 paused");
        
        assertTrue(controller.isPaused(vault1));
        assertTrue(controller.isPaused(vault2));
        
        vm.prank(admin);
        controller.unpauseVault(vault1, "Vault 1 unpaused");
        
        assertFalse(controller.isPaused(vault1));
        assertTrue(controller.isPaused(vault2));
    }

    // ==================== View Function Tests ====================

    function test_IsManagedVault() public {
        assertTrue(controller.isManagedVault(vault1));
        assertTrue(controller.isManagedVault(vault2));
        
        address unmanaged = address(0x7777777777777777777777777777777777777777);
        assertFalse(controller.isManagedVault(unmanaged));
    }

    function test_GetPauseTimeWhenNotPaused() public {
        uint256 pauseTime = controller.getPauseTime(vault1);
        assertEq(pauseTime, 0);
    }

    function test_GetPauseReasonWhenNotPaused() public {
        string memory reason = controller.getPauseReason(vault1);
        assertEq(reason, "");
    }
}
