// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../feature21_yield/YieldStrategyManager.sol";
import "../feature21_yield/YieldStrategyPlugin.sol";

import "../SpendVault.sol";

contract MockGuardianSBT {
    function balanceOf(address) external pure returns (uint256) { return 1; }
}

contract MockStrategy is YieldStrategyPlugin {
    uint256 public emergencyWithdrawn;
    function deposit(uint256) external override {}
    function withdraw(uint256) external override {}
    function emergencyWithdraw(uint256 amount) external override {
        emergencyWithdrawn += amount;
    }
    function harvest() external pure override returns (uint256) { return 0; }
}

contract SpendVaultEmergencyExitTest is Test {
    SpendVault vault;
    YieldStrategyManager manager;
    MockStrategy strategy;
    MockGuardianSBT guardianToken;
    address owner = address(0x1);

    function setUp() public {
        manager = new YieldStrategyManager();
        strategy = new MockStrategy();
        guardianToken = new MockGuardianSBT();
        string[] memory tags = new string[](1);
        tags[0] = "test";
        vault = new SpendVault(address(guardianToken), 1, "TestVault", tags);
        vault.setYieldStrategyManager(address(manager));
        vm.prank(owner);
        manager.registerStrategy(address(vault), address(strategy));
        vm.prank(owner);
        vault.setInitialYieldStrategy(address(strategy));
    }

    function testEmergencyStrategyExitByOwner() public {
        vm.prank(owner);
        vault.emergencyStrategyExit(100);
        assertEq(strategy.emergencyWithdrawn(), 100, "Emergency withdrawal should be called");
    }

    // Add more tests for guardian access and failure cases as needed
}
