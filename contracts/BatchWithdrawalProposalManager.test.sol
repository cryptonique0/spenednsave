// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BatchWithdrawalProposalManager.sol";

contract BatchWithdrawalProposalManagerTest is Test {
    BatchWithdrawalProposalManager manager;
    
    address vault1 = address(0x1111111111111111111111111111111111111111);
    address vault2 = address(0x2222222222222222222222222222222222222222);
    address guardian1 = address(0x3333333333333333333333333333333333333333);
    address guardian2 = address(0x4444444444444444444444444444444444444444);
    address token1 = address(0x5555555555555555555555555555555555555555);
    address token2 = address(0x6666666666666666666666666666666666666666);
    address recipient = address(0x7777777777777777777777777777777777777777);

    function setUp() public {
        manager = new BatchWithdrawalProposalManager();
        manager.registerVault(vault1, 2);
        manager.registerVault(vault2, 2);
    }

    // ==================== Registration Tests ====================

    function test_RegisterVault() public {
        address vault3 = address(0x8888888888888888888888888888888888888888);
        manager.registerVault(vault3, 3);
        assertTrue(manager.isManagedForBatch(vault3));
    }

    function test_RegisterVaultStoresQuorum() public {
        address vault3 = address(0x8888888888888888888888888888888888888888);
        manager.registerVault(vault3, 5);
        assertEq(manager.getVaultQuorumForBatch(vault3), 5);
    }

    function test_RegisterVaultRejectsDuplicate() public {
        vm.expectRevert("Vault already registered");
        manager.registerVault(vault1, 2);
    }

    // ==================== Batch Proposal Creation Tests ====================

    function test_CreateBatchProposal() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](2);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(token2, 2000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test batch");
        assertEq(proposalId, 0);
    }

    function test_CreateBatchProposalTracksWithdrawals() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](2);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(token2, 2000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test batch");
        
        (
            ,
            ,
            uint256 withdrawalCount,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            
        ) = manager.getBatchProposal(proposalId);
        
        assertEq(withdrawalCount, 2);
    }

    function test_CreateBatchProposalRejectsEmptyBatch() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](0);
        
        vm.expectRevert("Must have withdrawals");
        manager.createBatchProposal(vault1, withdrawals, "Test batch");
    }

    function test_CreateBatchProposalRejectsTooManyTokens() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](11);
        for (uint i = 0; i < 11; i++) {
            withdrawals[i] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 100, recipient);
        }
        
        vm.expectRevert("Max 10 tokens per batch");
        manager.createBatchProposal(vault1, withdrawals, "Test batch");
    }

    function test_CreateBatchProposalRejectsZeroAmount() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 0, recipient);
        
        vm.expectRevert("Amount must be > 0");
        manager.createBatchProposal(vault1, withdrawals, "Test batch");
    }

    // ==================== Batch Voting Tests ====================

    function test_ApproveBatchProposal() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test");
        
        bool approved = manager.approveBatchProposal(proposalId, guardian1);
        assertFalse(approved);
    }

    function test_ApproveBatchProposalReachesQuorum() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test");
        
        manager.approveBatchProposal(proposalId, guardian1);
        bool approved = manager.approveBatchProposal(proposalId, guardian2);
        
        assertTrue(approved);
    }

    function test_PreventDuplicateBatchVote() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test");
        
        manager.approveBatchProposal(proposalId, guardian1);
        vm.expectRevert("Already voted");
        manager.approveBatchProposal(proposalId, guardian1);
    }

    function test_HasVotedOnBatch() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Test");
        
        assertFalse(manager.hasVotedOnBatch(proposalId, guardian1));
        manager.approveBatchProposal(proposalId, guardian1);
        assertTrue(manager.hasVotedOnBatch(proposalId, guardian1));
    }

    // ==================== Multi-Token Tests ====================

    function test_BatchWithMultipleTokens() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](3);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient);  // ETH
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        withdrawals[2] = BatchWithdrawalProposalManager.TokenWithdrawal(token2, 2000, recipient);
        
        uint256 proposalId = manager.createBatchProposal(vault1, withdrawals, "Multi-token batch");
        
        (
            ,
            ,
            uint256 withdrawalCount,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            
        ) = manager.getBatchProposal(proposalId);
        
        assertEq(withdrawalCount, 3);
        
        BatchWithdrawalProposalManager.TokenWithdrawal memory w0 = manager.getWithdrawalAtIndex(proposalId, 0);
        assertEq(w0.token, address(0));
        assertEq(w0.amount, 1 ether);
    }

    // ==================== Vault Batch Proposal Tracking ====================

    function test_GetVaultBatchProposals() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        manager.createBatchProposal(vault1, withdrawals, "P1");
        manager.createBatchProposal(vault1, withdrawals, "P2");
        
        uint256[] memory proposals = manager.getVaultBatchProposals(vault1);
        assertEq(proposals.length, 2);
        assertEq(proposals[0], 0);
        assertEq(proposals[1], 1);
    }

    function test_GetBatchProposalCount() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(token1, 1000, recipient);
        
        manager.createBatchProposal(vault1, withdrawals, "P1");
        manager.createBatchProposal(vault1, withdrawals, "P2");
        manager.createBatchProposal(vault1, withdrawals, "P3");
        
        assertEq(manager.getBatchProposalCount(vault1), 3);
    }
}
