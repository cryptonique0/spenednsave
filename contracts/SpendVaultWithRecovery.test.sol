// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../GuardianSBT.sol";
import "../GuardianRotation.sol";
import "../GuardianRecovery.sol";
import "../SpendVaultWithRecovery.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SpendVaultWithRecoveryTest is Test {
    GuardianSBT guardianToken;
    GuardianRotation guardianRotation;
    GuardianRecovery guardianRecovery;
    SpendVaultWithRecovery vault;
    MockToken mockToken;

    address owner;
    address guardian1;
    address guardian2;
    address guardian3;
    address compromised;
    address recipient;

    function setUp() public {
        owner = address(this);
        guardian1 = makeAddr("guardian1");
        guardian2 = makeAddr("guardian2");
        guardian3 = makeAddr("guardian3");
        compromised = makeAddr("compromised");
        recipient = makeAddr("recipient");

        // Deploy contracts
        guardianToken = new GuardianSBT();
        guardianRotation = new GuardianRotation();
        guardianRecovery = new GuardianRecovery();
        vault = new SpendVaultWithRecovery(
            address(guardianToken),
            address(guardianRotation),
            address(guardianRecovery),
            2 // quorum of 2
        );
        mockToken = new MockToken();

        // Setup guardians
        guardianToken.mint(guardian1, address(vault));
        guardianToken.mint(guardian2, address(vault));
        guardianToken.mint(guardian3, address(vault));
        guardianToken.mint(compromised, address(vault));

        // Add guardians to rotation
        uint256 expiryTime = block.timestamp + 30 days;
        guardianRotation.addGuardian(guardian1, address(vault), expiryTime);
        guardianRotation.addGuardian(guardian2, address(vault), expiryTime);
        guardianRotation.addGuardian(guardian3, address(vault), expiryTime);
        guardianRotation.addGuardian(compromised, address(vault), expiryTime);

        // Fund vault
        vm.deal(address(vault), 10 ether);
    }

    function testVaultInitialization() public {
        assertEq(vault.owner(), owner);
        assertEq(vault.quorum(), 2);
        assertEq(vault.guardianToken(), address(guardianToken));
        assertEq(vault.guardianRotation(), address(guardianRotation));
        assertEq(vault.guardianRecovery(), address(guardianRecovery));
    }

    function testIsActiveGuardian() public {
        assertTrue(vault.isActiveGuardian(guardian1));
        assertTrue(vault.isActiveGuardian(compromised));
    }

    function testGetActiveGuardianCount() public {
        assertEq(vault.getActiveGuardianCount(), 4);
    }

    function testProposeGuardianRecovery() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised account");

        (address target, , uint256 votesReq, , , , , ) = guardianRecovery.getProposalDetails(proposalId);

        assertEq(target, compromised);
        assertEq(votesReq, 2); // Requires quorum
    }

    function testRecoveryVotingFlow() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Account compromised");

        // Guardian1 votes
        vault.voteForGuardianRecovery(proposalId, guardian1);

        (bool executed, uint256 votes, ) = guardianRecovery.getProposalStatus(proposalId);
        assertFalse(executed);
        assertEq(votes, 1);

        // Guardian2 votes - should execute
        bool executedInVault = vault.voteForGuardianRecovery(proposalId, guardian2);
        assertTrue(executedInVault);

        (executed, votes, ) = guardianRecovery.getProposalStatus(proposalId);
        assertTrue(executed);
        assertEq(votes, 2);
    }

    function testCompromisedGuardianRemovedAfterRecovery() public {
        assertTrue(vault.isActiveGuardian(compromised));

        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");

        vault.voteForGuardianRecovery(proposalId, guardian1);
        vault.voteForGuardianRecovery(proposalId, guardian2);

        // Guardian should be removed from rotation
        assertFalse(vault.isActiveGuardian(compromised));
        assertEq(vault.getActiveGuardianCount(), 3);
    }

    function testRecoveryExecutionTracking() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");

        assertFalse(vault.isRecoveryExecutedInVault(proposalId));

        vault.voteForGuardianRecovery(proposalId, guardian1);
        vault.voteForGuardianRecovery(proposalId, guardian2);

        assertTrue(vault.isRecoveryExecutedInVault(proposalId));
    }

    function testReceiveETH() public {
        uint256 initialBalance = address(vault).balance;

        vm.prank(guardian1);
        (bool success, ) = address(vault).call{value: 1 ether}("");
        require(success);

        assertEq(address(vault).balance, initialBalance + 1 ether);
    }

    function testGetETHBalance() public {
        assertEq(vault.getETHBalance(), 10 ether);
    }

    function testDepositToken() public {
        mockToken.mint(guardian1, 50 * 10 ** 18);

        vm.prank(guardian1);
        mockToken.approve(address(vault), 50 * 10 ** 18);

        vm.prank(guardian1);
        vault.deposit(address(mockToken), 50 * 10 ** 18);

        assertEq(vault.getTokenBalance(address(mockToken)), 50 * 10 ** 18);
    }

    function testSetQuorum() public {
        vault.setQuorum(3);
        assertEq(vault.quorum(), 3);
    }

    function testUpdateGuardianToken() public {
        GuardianSBT newToken = new GuardianSBT();
        vault.updateGuardianToken(address(newToken));
        assertEq(vault.guardianToken(), address(newToken));
    }

    function testUpdateGuardianRotation() public {
        GuardianRotation newRotation = new GuardianRotation();
        vault.updateGuardianRotation(address(newRotation));
        assertEq(vault.guardianRotation(), address(newRotation));
    }

    function testUpdateGuardianRecovery() public {
        GuardianRecovery newRecovery = new GuardianRecovery();
        vault.updateGuardianRecovery(address(newRecovery));
        assertEq(vault.guardianRecovery(), address(newRecovery));
    }

    function testRecoveryWithInsufficientVotes() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");

        // Only guardian1 votes - not enough for quorum
        vault.voteForGuardianRecovery(proposalId, guardian1);

        // Compromised should still be active
        assertTrue(vault.isActiveGuardian(compromised));
        assertEq(vault.getActiveGuardianCount(), 4);
    }

    function testMultipleRecoveryProposals() public {
        uint256 proposalId1 = vault.proposeGuardianRecovery(compromised, "First compromise");
        uint256 proposalId2 = vault.proposeGuardianRecovery(compromised, "Second compromise");

        assertNotEq(proposalId1, proposalId2);
    }

    function testOnlyOwnerCanProposeRecovery() public {
        vm.prank(guardian1);
        vm.expectRevert("Caller is not the owner");
        vault.proposeGuardianRecovery(compromised, "Compromised");
    }

    function testOnlyActiveGuardianCanVote() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");

        address nonGuardian = makeAddr("nonGuardian");

        vm.expectRevert("Voter is not an active guardian");
        vault.voteForGuardianRecovery(proposalId, nonGuardian);
    }

    function testRecoveryVotingTimeline() public {
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");

        vault.voteForGuardianRecovery(proposalId, guardian1);

        // Fast forward past voting period
        vm.warp(block.timestamp + 4 days);

        // Third vote should fail due to expired voting period
        vm.expectRevert("Voting period expired");
        vault.voteForGuardianRecovery(proposalId, guardian2);
    }

    function testActiveGuardianCountAfterRecovery() public {
        assertEq(vault.getActiveGuardianCount(), 4);

        // Execute recovery of compromised guardian
        uint256 proposalId = vault.proposeGuardianRecovery(compromised, "Compromised");
        vault.voteForGuardianRecovery(proposalId, guardian1);
        vault.voteForGuardianRecovery(proposalId, guardian2);

        assertEq(vault.getActiveGuardianCount(), 3);

        // Can still do withdrawal with remaining guardians
        // (withdrawal test would require signature generation)
    }

    function testGetNonce() public {
        assertEq(vault.getNonce(), 0);
    }

    function testDomainSeparator() public {
        bytes32 separator = vault.getDomainSeparator();
        assertNotEq(separator, bytes32(0));
    }
}
