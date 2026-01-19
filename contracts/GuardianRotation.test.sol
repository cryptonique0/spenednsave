// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../GuardianRotation.sol";

contract GuardianRotationTest is Test {
    GuardianRotation rotation;
    address owner;
    address guardian1;
    address guardian2;
    address vault;

    function setUp() public {
        rotation = new GuardianRotation();
        owner = address(this);
        guardian1 = makeAddr("guardian1");
        guardian2 = makeAddr("guardian2");
        vault = makeAddr("vault");
    }

    function testAddGuardian() public {
        rotation.addGuardian(guardian1, vault, 0); // Use default period
        
        assertTrue(rotation.isActiveGuardian(guardian1, vault));
        uint256 expiry = rotation.getExpiryDate(guardian1, vault);
        assertGt(expiry, block.timestamp);
    }

    function testGuardianExpiry() public {
        uint256 expiryTime = block.timestamp + 1 days;
        rotation.addGuardian(guardian1, vault, expiryTime);
        
        assertTrue(rotation.isActiveGuardian(guardian1, vault));
        
        // Fast forward past expiry
        vm.warp(expiryTime + 1);
        
        assertFalse(rotation.isActiveGuardian(guardian1, vault));
    }

    function testRenewGuardian() public {
        rotation.addGuardian(guardian1, vault, block.timestamp + 1 days);
        
        uint256 newExpiry = block.timestamp + 30 days;
        rotation.renewGuardian(guardian1, vault, newExpiry);
        
        assertEq(rotation.getExpiryDate(guardian1, vault), newExpiry);
    }

    function testRemoveGuardian() public {
        rotation.addGuardian(guardian1, vault, 0);
        assertTrue(rotation.isActiveGuardian(guardian1, vault));
        
        rotation.removeGuardian(guardian1, vault);
        assertFalse(rotation.isActiveGuardian(guardian1, vault));
    }

    function testGetActiveGuardians() public {
        rotation.addGuardian(guardian1, vault, block.timestamp + 1 days);
        rotation.addGuardian(guardian2, vault, block.timestamp + 1 days);
        
        address[] memory active = rotation.getActiveGuardians(vault);
        assertEq(active.length, 2);
    }

    function testGetExpiredGuardians() public {
        rotation.addGuardian(guardian1, vault, block.timestamp + 1 days);
        rotation.addGuardian(guardian2, vault, block.timestamp + 30 days);
        
        vm.warp(block.timestamp + 2 days);
        
        assertFalse(rotation.isActiveGuardian(guardian1, vault));
        assertTrue(rotation.isActiveGuardian(guardian2, vault));
        assertEq(rotation.getActiveGuardianCount(vault), 1);
        assertEq(rotation.getExpiredGuardianCount(vault), 1);
    }

    function testDefaultExpiryPeriod() public {
        uint256 newPeriod = 100 days;
        rotation.setDefaultExpiryPeriod(newPeriod);
        
        rotation.addGuardian(guardian1, vault, 0);
        uint256 expiry = rotation.getExpiryDate(guardian1, vault);
        
        assertEq(expiry, block.timestamp + newPeriod);
    }

    function testVaultSpecificExpiryPeriod() public {
        uint256 customPeriod = 50 days;
        rotation.setVaultExpiryPeriod(vault, customPeriod);
        
        rotation.addGuardian(guardian1, vault, 0);
        uint256 expiry = rotation.getExpiryDate(guardian1, vault);
        
        assertEq(expiry, block.timestamp + customPeriod);
    }

    function testSecondsUntilExpiry() public {
        uint256 expiryTime = block.timestamp + 7 days;
        rotation.addGuardian(guardian1, vault, expiryTime);
        
        uint256 remaining = rotation.getSecondsUntilExpiry(guardian1, vault);
        assertEq(remaining, 7 days);
        
        vm.warp(block.timestamp + 3 days);
        remaining = rotation.getSecondsUntilExpiry(guardian1, vault);
        assertEq(remaining, 4 days);
    }

    function testCleanupExpiredGuardians() public {
        rotation.addGuardian(guardian1, vault, block.timestamp + 1 days);
        rotation.addGuardian(guardian2, vault, block.timestamp + 30 days);
        
        assertEq(rotation.getAllGuardians(vault).length, 2);
        
        vm.warp(block.timestamp + 2 days);
        
        rotation.cleanupExpiredGuardians(vault);
        
        address[] memory guardians = rotation.getAllGuardians(vault);
        assertEq(guardians.length, 1);
        assertEq(guardians[0], guardian2);
    }

    function testCannotAddGuardianInPast() public {
        vm.expectRevert("Expiry date must be in the future");
        rotation.addGuardian(guardian1, vault, block.timestamp - 1);
    }

    function testCannotRenewWithPastDate() public {
        rotation.addGuardian(guardian1, vault, block.timestamp + 1 days);
        
        vm.expectRevert("New expiry must be in the future");
        rotation.renewGuardian(guardian1, vault, block.timestamp - 1);
    }
}
