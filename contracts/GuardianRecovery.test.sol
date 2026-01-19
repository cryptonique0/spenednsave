// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../GuardianRecovery.sol";

contract GuardianRecoveryTest is Test {
    GuardianRecovery recovery;
    address owner;
    address guardian1;
    address guardian2;
    address guardian3;
    address compromisedGuardian;
    address vault;

    function setUp() public {
        recovery = new GuardianRecovery();
        owner = address(this);
        guardian1 = makeAddr("guardian1");
        guardian2 = makeAddr("guardian2");
        guardian3 = makeAddr("guardian3");
        compromisedGuardian = makeAddr("compromised");
        vault = makeAddr("vault");
    }

    function testProposeRecovery() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        (address target, address vaultAddr, uint256 votesReq, , , , , ) = recovery.getProposalDetails(
            proposalId
        );

        assertEq(target, compromisedGuardian);
        assertEq(vaultAddr, vault);
        assertEq(votesReq, 2);
    }

    function testVoteOnRecovery() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.voteOnRecovery(proposalId, guardian1);

        (bool executed, uint256 votesReceived, uint256 votesRequired) = recovery.getProposalStatus(proposalId);

        assertFalse(executed);
        assertEq(votesReceived, 1);
        assertEq(votesRequired, 2);
    }

    function testRecoveryExecutedOnQuorum() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.voteOnRecovery(proposalId, guardian1);
        bool executed = recovery.voteOnRecovery(proposalId, guardian2);

        assertTrue(executed);

        (bool isExecuted, uint256 votesReceived, ) = recovery.getProposalStatus(proposalId);
        assertTrue(isExecuted);
        assertEq(votesReceived, 2);
    }

    function testGuardianCannotVoteTwice() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.voteOnRecovery(proposalId, guardian1);

        vm.expectRevert("Guardian already voted");
        recovery.voteOnRecovery(proposalId, guardian1);
    }

    function testTargetCannotVoteOnOwnRecovery() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        vm.expectRevert("Target cannot vote on own removal");
        recovery.voteOnRecovery(proposalId, compromisedGuardian);
    }

    function testCancelRecovery() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.cancelRecovery(proposalId, "False alarm");

        (, , , , , , bool cancelled, ) = recovery.getProposalDetails(proposalId);
        assertTrue(cancelled);
    }

    function testCannotVoteOnCancelledProposal() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.cancelRecovery(proposalId, "Cancelled");

        vm.expectRevert("Proposal cancelled");
        recovery.voteOnRecovery(proposalId, guardian1);
    }

    function testVotingPeriodExpiry() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        // Fast forward past voting period
        vm.warp(block.timestamp + 4 days);

        vm.expectRevert("Voting period expired");
        recovery.voteOnRecovery(proposalId, guardian1);
    }

    function testGetVoteCount() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 3);

        recovery.voteOnRecovery(proposalId, guardian1);
        recovery.voteOnRecovery(proposalId, guardian2);

        assertEq(recovery.getVoteCount(proposalId), 2);
    }

    function testHasGuardianVoted() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        recovery.voteOnRecovery(proposalId, guardian1);

        assertTrue(recovery.hasGuardianVoted(proposalId, guardian1));
        assertFalse(recovery.hasGuardianVoted(proposalId, guardian2));
    }

    function testGetProposalVoters() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 3);

        recovery.voteOnRecovery(proposalId, guardian1);
        recovery.voteOnRecovery(proposalId, guardian2);
        recovery.voteOnRecovery(proposalId, guardian3);

        address[] memory voters = recovery.getProposalVoters(proposalId);
        assertEq(voters.length, 3);
        assertEq(voters[0], guardian1);
        assertEq(voters[1], guardian2);
        assertEq(voters[2], guardian3);
    }

    function testGetTimeRemaining() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        uint256 remaining = recovery.getTimeRemaining(proposalId);
        assertEq(remaining, 3 days);

        vm.warp(block.timestamp + 1 days);
        remaining = recovery.getTimeRemaining(proposalId);
        assertEq(remaining, 2 days);

        vm.warp(block.timestamp + 3 days);
        remaining = recovery.getTimeRemaining(proposalId);
        assertEq(remaining, 0);
    }

    function testSetVotingPeriod() public {
        uint256 newPeriod = 7 days;
        recovery.setVotingPeriod(newPeriod);

        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 1);

        vm.warp(block.timestamp + 3 days);
        // Should still be votable after 3 days with new 7-day period
        recovery.voteOnRecovery(proposalId, guardian1);
    }

    function testGetVotesNeeded() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 3);

        assertEq(recovery.getVotesNeeded(proposalId), 3);

        recovery.voteOnRecovery(proposalId, guardian1);
        assertEq(recovery.getVotesNeeded(proposalId), 2);

        recovery.voteOnRecovery(proposalId, guardian2);
        assertEq(recovery.getVotesNeeded(proposalId), 1);
    }

    function testMultipleProposalsForSameGuardian() public {
        // Can have multiple recovery proposals for same guardian
        uint256 proposalId1 = recovery.proposeRecovery(compromisedGuardian, vault, 2);
        uint256 proposalId2 = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        assertNotEq(proposalId1, proposalId2);
    }

    function testGetProposalDetails() public {
        uint256 proposalId = recovery.proposeRecovery(compromisedGuardian, vault, 2);

        (
            address target,
            address vaultAddr,
            uint256 votesReq,
            uint256 votesRec,
            uint256 proposed,
            bool executed,
            bool cancelled,
            uint256 remaining
        ) = recovery.getProposalDetails(proposalId);

        assertEq(target, compromisedGuardian);
        assertEq(vaultAddr, vault);
        assertEq(votesReq, 2);
        assertEq(votesRec, 0);
        assertEq(proposed, block.timestamp);
        assertFalse(executed);
        assertFalse(cancelled);
        assertEq(remaining, 3 days);
    }
}
