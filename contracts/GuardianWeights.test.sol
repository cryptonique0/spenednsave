// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/GuardianWeights.sol";

contract GuardianWeightsTest is Test {
    GuardianWeights weightsContract;
    address vault;
    address guardian1;
    address guardian2;
    address guardian3;
    address guardian4;
    address owner;

    event WeightAssigned(address indexed vault, address indexed guardian, uint256 weight, uint256 totalWeight);
    event WeightRemoved(address indexed vault, address indexed guardian, uint256 prevWeight);
    event QuorumThresholdSet(address indexed vault, uint256 threshold, bool enabled);
    event WeightedVotingEnabled(address indexed vault);
    event WeightedVotingDisabled(address indexed vault);

    function setUp() public {
        owner = address(this);
        weightsContract = new GuardianWeights();
        
        // Setup test addresses
        vault = address(0x1234);
        guardian1 = address(0x1111);
        guardian2 = address(0x2222);
        guardian3 = address(0x3333);
        guardian4 = address(0x4444);
    }

    // ============ Weight Assignment Tests ============

    function testSetGuardianWeight() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, 10);
    }

    function testSetGuardianWeightEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit WeightAssigned(vault, guardian1, 10, 10);
        weightsContract.setGuardianWeight(vault, guardian1, 10);
    }

    function testSetMultipleGuardianWeights() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);

        assertEq(weightsContract.getGuardianWeight(vault, guardian1), 5);
        assertEq(weightsContract.getGuardianWeight(vault, guardian2), 3);
        assertEq(weightsContract.getGuardianWeight(vault, guardian3), 2);
    }

    function testUpdateGuardianWeight() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        weightsContract.setGuardianWeight(vault, guardian1, 15);
        
        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, 15);
    }

    function testTotalWeightCalculation() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);

        uint256[] memory guardians = new uint256[](3);
        guardians[0] = uint256(uint160(guardian1));
        guardians[1] = uint256(uint160(guardian2));
        guardians[2] = uint256(uint160(guardian3));

        uint256 total = weightsContract.calculateTotalWeight(vault, guardians);
        assertEq(total, 10);
    }

    // ============ Weight Removal Tests ============

    function testRemoveGuardianWeight() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        weightsContract.removeGuardianWeight(vault, guardian1);
        
        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, 0);
    }

    function testRemoveGuardianWeightEmitsEvent() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        
        vm.expectEmit(true, true, false, true);
        emit WeightRemoved(vault, guardian1, 10);
        weightsContract.removeGuardianWeight(vault, guardian1);
    }

    function testRemoveNonexistentWeightDoesNothing() public {
        weightsContract.removeGuardianWeight(vault, guardian1);
        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, 0);
    }

    // ============ Quorum Tests ============

    function testSetWeightedQuorum() public {
        weightsContract.setWeightedQuorum(vault, 100);
        uint256 threshold = weightsContract.getWeightedQuorum(vault);
        assertEq(threshold, 100);
    }

    function testSetWeightedQuorumEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit QuorumThresholdSet(vault, 100, true);
        weightsContract.setWeightedQuorum(vault, 100);
    }

    function testIsWeightedQuorumMet() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setWeightedQuorum(vault, 7);

        bool metWith5 = weightsContract.isWeightedQuorumMet(vault, 5);
        assertFalse(metWith5);

        bool metWith7 = weightsContract.isWeightedQuorumMet(vault, 7);
        assertTrue(metWith7);

        bool metWith8 = weightsContract.isWeightedQuorumMet(vault, 8);
        assertTrue(metWith8);
    }

    function testIsWeightedQuorumMetZeroThreshold() public {
        weightsContract.setWeightedQuorum(vault, 0);
        
        bool met = weightsContract.isWeightedQuorumMet(vault, 1);
        assertTrue(met);
    }

    // ============ Voting Mode Tests ============

    function testEnableWeightedVoting() public {
        weightsContract.enableWeightedVoting(vault);
        
        (,, bool isEnabled) = weightsContract.getVotingStats(vault);
        assertTrue(isEnabled);
    }

    function testEnableWeightedVotingEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit WeightedVotingEnabled(vault);
        weightsContract.enableWeightedVoting(vault);
    }

    function testDisableWeightedVoting() public {
        weightsContract.enableWeightedVoting(vault);
        weightsContract.disableWeightedVoting(vault);
        
        (,, bool isEnabled) = weightsContract.getVotingStats(vault);
        assertFalse(isEnabled);
    }

    function testDisableWeightedVotingEmitsEvent() public {
        weightsContract.enableWeightedVoting(vault);
        
        vm.expectEmit(true, false, false, true);
        emit WeightedVotingDisabled(vault);
        weightsContract.disableWeightedVoting(vault);
    }

    function testToggleWeightedVoting() public {
        // Initially disabled
        (,, bool enabled1) = weightsContract.getVotingStats(vault);
        assertFalse(enabled1);

        // Enable
        weightsContract.enableWeightedVoting(vault);
        (,, bool enabled2) = weightsContract.getVotingStats(vault);
        assertTrue(enabled2);

        // Disable
        weightsContract.disableWeightedVoting(vault);
        (,, bool enabled3) = weightsContract.getVotingStats(vault);
        assertFalse(enabled3);
    }

    // ============ Weight Percentage Tests ============

    function testGetWeightPercentage() public {
        weightsContract.setGuardianWeight(vault, guardian1, 4);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);
        weightsContract.setGuardianWeight(vault, guardian4, 1);

        // Note: Division results in percentage * 100 for precision
        uint256 percent1 = weightsContract.getWeightPercentage(vault, guardian1);
        uint256 percent2 = weightsContract.getWeightPercentage(vault, guardian2);
        uint256 percent3 = weightsContract.getWeightPercentage(vault, guardian3);
        uint256 percent4 = weightsContract.getWeightPercentage(vault, guardian4);

        // 4/10 = 40%, 3/10 = 30%, 2/10 = 20%, 1/10 = 10%
        assertEq(percent1, 4000); // 40 * 100
        assertEq(percent2, 3000); // 30 * 100
        assertEq(percent3, 2000); // 20 * 100
        assertEq(percent4, 1000); // 10 * 100
    }

    function testGetWeightPercentageZeroTotal() public {
        uint256 percent = weightsContract.getWeightPercentage(vault, guardian1);
        assertEq(percent, 0);
    }

    // ============ Solo Guardian Tests ============

    function testCanGuardianPassAlone() public {
        weightsContract.setGuardianWeight(vault, guardian1, 100);
        weightsContract.setGuardianWeight(vault, guardian2, 50);
        weightsContract.setWeightedQuorum(vault, 100);

        bool can1 = weightsContract.canGuardianPassAlone(vault, guardian1);
        bool can2 = weightsContract.canGuardianPassAlone(vault, guardian2);

        assertTrue(can1);
        assertFalse(can2);
    }

    function testCanGuardianPassAloneWithHighQuorum() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        weightsContract.setGuardianWeight(vault, guardian2, 10);
        weightsContract.setWeightedQuorum(vault, 20);

        bool can1 = weightsContract.canGuardianPassAlone(vault, guardian1);
        assertFalse(can1);
    }

    function testCanGuardianPassAloneZeroWeight() public {
        weightsContract.setWeightedQuorum(vault, 1);
        
        bool can = weightsContract.canGuardianPassAlone(vault, guardian1);
        assertFalse(can);
    }

    // ============ Minimum Guardians Tests ============

    function testGetMinGuardiansForQuorum() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);
        weightsContract.setWeightedQuorum(vault, 6);

        uint256 minGuardians = weightsContract.getMinGuardiansForQuorum(vault);
        
        // Sorted by weight: 5 + 3 = 8 >= 6, so 2 guardians minimum
        assertEq(minGuardians, 2);
    }

    function testGetMinGuardiansForQuorumAllNeeded() public {
        weightsContract.setGuardianWeight(vault, guardian1, 2);
        weightsContract.setGuardianWeight(vault, guardian2, 2);
        weightsContract.setGuardianWeight(vault, guardian3, 2);
        weightsContract.setWeightedQuorum(vault, 6);

        uint256 minGuardians = weightsContract.getMinGuardiansForQuorum(vault);
        
        // All guardians needed: 2 + 2 + 2 = 6
        assertEq(minGuardians, 3);
    }

    function testGetMinGuardiansForQuorumZeroQuorum() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setWeightedQuorum(vault, 0);

        uint256 minGuardians = weightsContract.getMinGuardiansForQuorum(vault);
        assertEq(minGuardians, 0);
    }

    // ============ Voting Stats Tests ============

    function testGetVotingStats() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setWeightedQuorum(vault, 7);
        weightsContract.enableWeightedVoting(vault);

        (uint256 totalWeight, uint256 quorum, bool isEnabled) = weightsContract.getVotingStats(vault);

        assertEq(totalWeight, 8);
        assertEq(quorum, 7);
        assertTrue(isEnabled);
    }

    function testGetVotingStatsEmptyVault() public {
        (uint256 totalWeight, uint256 quorum, bool isEnabled) = weightsContract.getVotingStats(vault);

        assertEq(totalWeight, 0);
        assertEq(quorum, 0);
        assertFalse(isEnabled);
    }

    // ============ Weight Distribution Tests ============

    function testGetWeightDistribution() public {
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);

        (address[] memory guardians, uint256[] memory weights) = 
            weightsContract.getWeightDistribution(vault);

        assertEq(guardians.length, 3);
        assertEq(weights.length, 3);
    }

    function testGetWeightDistributionEmpty() public {
        (address[] memory guardians, uint256[] memory weights) = 
            weightsContract.getWeightDistribution(vault);

        assertEq(guardians.length, 0);
        assertEq(weights.length, 0);
    }

    // ============ Multiple Vaults Tests ============

    function testMultipleVaultsIndependentWeights() public {
        address vault2 = address(0x5555);

        weightsContract.setGuardianWeight(vault, guardian1, 10);
        weightsContract.setGuardianWeight(vault2, guardian1, 5);

        uint256 weight1 = weightsContract.getGuardianWeight(vault, guardian1);
        uint256 weight2 = weightsContract.getGuardianWeight(vault2, guardian1);

        assertEq(weight1, 10);
        assertEq(weight2, 5);
    }

    function testMultipleVaultsIndependentQuorum() public {
        address vault2 = address(0x5555);

        weightsContract.setWeightedQuorum(vault, 100);
        weightsContract.setWeightedQuorum(vault2, 50);

        uint256 quorum1 = weightsContract.getWeightedQuorum(vault);
        uint256 quorum2 = weightsContract.getWeightedQuorum(vault2);

        assertEq(quorum1, 100);
        assertEq(quorum2, 50);
    }

    // ============ Edge Cases ============

    function testSetWeightToZero() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        weightsContract.setGuardianWeight(vault, guardian1, 0);

        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, 0);
    }

    function testSetHighWeight() public {
        uint256 highWeight = type(uint256).max / 2;
        weightsContract.setGuardianWeight(vault, guardian1, highWeight);

        uint256 weight = weightsContract.getGuardianWeight(vault, guardian1);
        assertEq(weight, highWeight);
    }

    function testManyGuardians() public {
        uint256 count = 50;
        
        for (uint256 i = 0; i < count; i++) {
            address guardian = address(uint160(0x1000 + i));
            weightsContract.setGuardianWeight(vault, guardian, i + 1);
        }

        (address[] memory guardians,) = weightsContract.getWeightDistribution(vault);
        assertEq(guardians.length, count);
    }

    // ============ Authorization Tests ============

    function testOnlyOwnerCanSetWeight() public {
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        weightsContract.setGuardianWeight(vault, guardian1, 10);
    }

    function testOnlyOwnerCanRemoveWeight() public {
        weightsContract.setGuardianWeight(vault, guardian1, 10);
        
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        weightsContract.removeGuardianWeight(vault, guardian1);
    }

    function testOnlyOwnerCanSetQuorum() public {
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        weightsContract.setWeightedQuorum(vault, 100);
    }

    function testOnlyOwnerCanEnableWeightedVoting() public {
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        weightsContract.enableWeightedVoting(vault);
    }

    function testOnlyOwnerCanDisableWeightedVoting() public {
        weightsContract.enableWeightedVoting(vault);
        
        address attacker = address(0x9999);
        
        vm.prank(attacker);
        vm.expectRevert();
        weightsContract.disableWeightedVoting(vault);
    }

    // ============ Real-World Scenarios ============

    function testCorporateTreasuryScenario() public {
        // CEO (5), CFO (3), Treasurer (2)
        weightsContract.setGuardianWeight(vault, guardian1, 5);
        weightsContract.setGuardianWeight(vault, guardian2, 3);
        weightsContract.setGuardianWeight(vault, guardian3, 2);
        
        // Require 50% + 1 = 6
        weightsContract.setWeightedQuorum(vault, 6);
        weightsContract.enableWeightedVoting(vault);

        // CEO + Treasurer = 7 >= 6 ✓
        bool scenario1 = weightsContract.isWeightedQuorumMet(vault, 7);
        assertTrue(scenario1);

        // CFO + Treasurer = 5 < 6 ✗
        bool scenario2 = weightsContract.isWeightedQuorumMet(vault, 5);
        assertFalse(scenario2);

        // CEO alone = 5 < 6 ✗
        bool scenario3 = weightsContract.canGuardianPassAlone(vault, guardian1);
        assertFalse(scenario3);
    }

    function testDAOVotingScenario() public {
        // 4 equal guardians with 25% weight each
        weightsContract.setGuardianWeight(vault, guardian1, 25);
        weightsContract.setGuardianWeight(vault, guardian2, 25);
        weightsContract.setGuardianWeight(vault, guardian3, 25);
        weightsContract.setGuardianWeight(vault, guardian4, 25);
        
        // Require 50%
        weightsContract.setWeightedQuorum(vault, 50);
        weightsContract.enableWeightedVoting(vault);

        // Any 2 guardians = 50 ✓
        bool scenario = weightsContract.isWeightedQuorumMet(vault, 50);
        assertTrue(scenario);

        // Any single guardian = 25 < 50 ✗
        uint256 minGuardians = weightsContract.getMinGuardiansForQuorum(vault);
        assertEq(minGuardians, 2);
    }

    function testFamilyTrustScenario() public {
        // Patriarch (40%), Adult child 1 (30%), Adult child 2 (30%)
        weightsContract.setGuardianWeight(vault, guardian1, 40);
        weightsContract.setGuardianWeight(vault, guardian2, 30);
        weightsContract.setGuardianWeight(vault, guardian3, 30);
        
        // Require 66% = 66 (rounding up)
        weightsContract.setWeightedQuorum(vault, 66);

        // Patriarch + either child = 70 >= 66 ✓
        bool scenario1 = weightsContract.isWeightedQuorumMet(vault, 70);
        assertTrue(scenario1);

        // Both children without patriarch = 60 < 66 ✗
        bool scenario2 = weightsContract.isWeightedQuorumMet(vault, 60);
        assertFalse(scenario2);
    }
}
