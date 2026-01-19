// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/WithdrawalProposalManager.sol";

contract WithdrawalProposalManagerTest is Test {
    WithdrawalProposalManager manager;
    
    address vault1 = address(0x1111111111111111111111111111111111111111);
    address vault2 = address(0x2222222222222222222222222222222222222222);
    address guardian1 = address(0x3333333333333333333333333333333333333333);
    address guardian2 = address(0x4444444444444444444444444444444444444444);
    address guardian3 = address(0x5555555555555555555555555555555555555555);
    address token = address(0x6666666666666666666666666666666666666666);
    address recipient = address(0x7777777777777777777777777777777777777777);

    function setUp() public {
        manager = new WithdrawalProposalManager();
        manager.registerVault(vault1, 2);
        manager.registerVault(vault2, 2);
    }

    // ==================== Registration Tests ====================

    function test_RegisterVault() public {
        address vault3 = address(0x8888888888888888888888888888888888888888);
        manager.registerVault(vault3, 3);
        assertTrue(manager.isManaged(vault3));
    }

    function test_RegisterVaultStoresQuorum() public {
        address vault3 = address(0x8888888888888888888888888888888888888888);
        manager.registerVault(vault3, 5);
        assertEq(manager.getVaultQuorum(vault3), 5);
    }

    function test_RegisterVaultRejectsDuplicate() public {
        vm.expectRevert("Vault already registered");
        manager.registerVault(vault1, 2);
    }

    // ==================== Proposal Creation Tests ====================

    function test_CreateProposal() public {
        uint256 proposalId = manager.createProposal(
            vault1,
            token,
            1000,
            recipient,
            "Test withdrawal"
        );
        assertEq(proposalId, 0);
    }

    function test_CreateProposalIncrementsCounter() public {
        uint256 id1 = manager.createProposal(vault1, token, 1000, recipient, "Test 1");
        uint256 id2 = manager.createProposal(vault1, token, 2000, recipient, "Test 2");
        assertEq(id1, 0);
        assertEq(id2, 1);
    }

    function test_CreateProposalTracksProperly() public {
        uint256 proposalId = manager.createProposal(
            vault1,
            token,
            1000,
            recipient,
            "Test"
        );
        
        (
            uint256 id,
            address vaultAddr,
            address tokenAddr,
            uint256 amount,
            address recipientAddr,
            ,
            address proposer,
            uint256 createdAt,
            uint256 deadline,
            uint256 approvalsCount,
            uint8 status,
            bool executed,
            ,
        ) = manager.getProposal(proposalId);
        
        assertEq(id, proposalId);
        assertEq(vaultAddr, vault1);
        assertEq(tokenAddr, token);
        assertEq(amount, 1000);
        assertEq(recipientAddr, recipient);
        assertEq(proposer, address(this));
        assertEq(approvalsCount, 0);
        assertEq(status, 0); // PENDING
        assertFalse(executed);
        assertGt(deadline, createdAt);
    }

    function test_CreateProposalRejectsUnmanagedVault() public {
        address unmanagedVault = address(0x9999999999999999999999999999999999999999);
        vm.expectRevert("Vault not managed");
        manager.createProposal(unmanagedVault, token, 1000, recipient, "Test");
    }

    function test_CreateProposalRejectsInvalidRecipient() public {
        vm.expectRevert("Invalid recipient");
        manager.createProposal(vault1, token, 1000, address(0), "Test");
    }

    function test_CreateProposalRejectsZeroAmount() public {
        vm.expectRevert("Amount must be > 0");
        manager.createProposal(vault1, token, 0, recipient, "Test");
    }

    // ==================== Voting Tests ====================

    function test_ApproveProposal() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        bool approved = manager.approveProposal(proposalId, guardian1);
        assertFalse(approved); // Need 2 approvals for vault1
    }

    function test_ApproveProposalReachesQuorum() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        manager.approveProposal(proposalId, guardian1);
        bool approved = manager.approveProposal(proposalId, guardian2);
        
        assertTrue(approved); // Quorum reached
    }

    function test_ApproveProposalPreventsDuplicateVote() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        manager.approveProposal(proposalId, guardian1);
        vm.expectRevert("Already voted");
        manager.approveProposal(proposalId, guardian1);
    }

    function test_ApproveProposalTracksVotes() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        manager.approveProposal(proposalId, guardian1);
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 approvalsCount,
            ,
            ,
            ,
        ) = manager.getProposal(proposalId);
        
        assertEq(approvalsCount, 1);
    }

    function test_HasVotedCheck() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        assertFalse(manager.hasVoted(proposalId, guardian1));
        manager.approveProposal(proposalId, guardian1);
        assertTrue(manager.hasVoted(proposalId, guardian1));
    }

    function test_ApprovalsNeeded() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        assertEq(manager.approvalsNeeded(proposalId), 2);
        manager.approveProposal(proposalId, guardian1);
        assertEq(manager.approvalsNeeded(proposalId), 1);
        manager.approveProposal(proposalId, guardian2);
        assertEq(manager.approvalsNeeded(proposalId), 0);
    }

    // ==================== Proposal Rejection Tests ====================

    function test_RejectProposal() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        manager.rejectProposal(proposalId, "Invalid reason");
        
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint8 status,
            ,
            ,
        ) = manager.getProposal(proposalId);
        
        assertEq(status, 3); // REJECTED
    }

    // ==================== Proposal Execution Tests ====================

    function test_ExecuteProposal() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        manager.approveProposal(proposalId, guardian1);
        manager.approveProposal(proposalId, guardian2);
        
        manager.executeProposal(proposalId);
        
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint8 status,
            bool executed,
            uint256 executedAt,
        ) = manager.getProposal(proposalId);
        
        assertTrue(executed);
        assertEq(status, 1); // APPROVED
        assertGt(executedAt, 0);
    }

    // ==================== Multi-Vault Tests ====================

    function test_MultipleVaultsIndependent() public {
        uint256 proposal1 = manager.createProposal(vault1, token, 1000, recipient, "V1");
        uint256 proposal2 = manager.createProposal(vault2, token, 2000, recipient, "V2");
        
        // Vault1 needs 2 approvals
        manager.approveProposal(proposal1, guardian1);
        manager.approveProposal(proposal1, guardian2);
        
        // Vault2 needs 2 approvals (independent)
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 approvalsCount2,
            uint8 status2,
            ,
            ,
        ) = manager.getProposal(proposal2);
        
        assertEq(approvalsCount2, 0);
        assertEq(status2, 0); // Still PENDING
    }

    // ==================== Voting Period Tests ====================

    function test_VotingPeriodExpires() public {
        uint256 proposalId = manager.createProposal(vault1, token, 1000, recipient, "Test");
        
        // Get deadline
        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            uint256 deadline,
            ,
            ,
            ,
            ,
        ) = manager.getProposal(proposalId);
        
        // Jump past deadline
        vm.warp(deadline + 1);
        
        // Try to vote after deadline
        vm.expectRevert("Voting period ended");
        manager.approveProposal(proposalId, guardian1);
    }

    // ==================== Vault Proposal Tracking ====================

    function test_GetVaultProposals() public {
        manager.createProposal(vault1, token, 1000, recipient, "P1");
        manager.createProposal(vault1, token, 2000, recipient, "P2");
        
        uint256[] memory proposals = manager.getVaultProposals(vault1);
        assertEq(proposals.length, 2);
        assertEq(proposals[0], 0);
        assertEq(proposals[1], 1);
    }

    function test_GetProposalCount() public {
        manager.createProposal(vault1, token, 1000, recipient, "P1");
        manager.createProposal(vault1, token, 2000, recipient, "P2");
        manager.createProposal(vault1, token, 3000, recipient, "P3");
        
        assertEq(manager.getProposalCount(vault1), 3);
    }
}
