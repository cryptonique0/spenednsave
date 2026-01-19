// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SpendVaultWithBatchProposals.sol";
import "../contracts/BatchWithdrawalProposalManager.sol";
import "../mocks/MockGuardianSBT.sol";
import "../mocks/MockERC20.sol";

contract SpendVaultWithBatchProposalsTest is Test {
    SpendVaultWithBatchProposals vault;
    BatchWithdrawalProposalManager manager;
    MockGuardianSBT guardianSBT;
    MockERC20 token1;
    MockERC20 token2;
    
    address owner = address(0x1111111111111111111111111111111111111111);
    address guardian1 = address(0x2222222222222222222222222222222222222222);
    address guardian2 = address(0x3333333333333333333333333333333333333333);
    address recipient = address(0x4444444444444444444444444444444444444444);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        manager = new BatchWithdrawalProposalManager();
        
        vm.prank(owner);
        vault = new SpendVaultWithBatchProposals();
        
        vault.setQuorum(2);
        vault.updateGuardianToken(address(guardianSBT));
        vault.updateBatchProposalManager(address(manager));
        
        manager.registerVault(address(vault), 2);
        
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);
        
        token1 = new MockERC20("Token1", "TK1");
        token2 = new MockERC20("Token2", "TK2");
        
        vm.deal(address(vault), 10 ether);
        token1.mint(address(vault), 10000 * 10**18);
        token2.mint(address(vault), 10000 * 10**18);
    }

    // ==================== Batch Proposal Tests ====================

    function test_ProposeBatchWithdrawal() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](2);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token2), 500 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Multi-token transfer");
        
        assertEq(proposalId, 0);
    }

    function test_ProposeBatchRequiresOwner() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(guardian1);
        vm.expectRevert("Only owner can propose");
        vault.proposeBatchWithdrawal(withdrawals, "Test");
    }

    function test_ProposeBatchValidatesETHBalance() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 20 ether, recipient);
        
        vm.prank(owner);
        vm.expectRevert("Insufficient ETH");
        vault.proposeBatchWithdrawal(withdrawals, "Test");
    }

    function test_ProposeBatchValidatesTokenBalance() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 20000 * 10**18, recipient);
        
        vm.prank(owner);
        vm.expectRevert("Insufficient tokens");
        vault.proposeBatchWithdrawal(withdrawals, "Test");
    }

    // ==================== Batch Voting Tests ====================

    function test_GuardianCanVoteOnBatchProposal() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        
        assertTrue(manager.hasVotedOnBatch(proposalId, guardian1));
    }

    function test_VotingRequiresGuardianSBT() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        address nonGuardian = address(0x9999999999999999999999999999999999999999);
        vm.prank(nonGuardian);
        vm.expectRevert("Not a guardian");
        vault.voteApproveBatchProposal(proposalId);
    }

    // ==================== Batch Execution Tests ====================

    function test_ExecuteBatchWithdrawal() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](2);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token2), 500 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveBatchProposal(proposalId);
        
        uint256 beforeToken1 = token1.balanceOf(recipient);
        uint256 beforeToken2 = token2.balanceOf(recipient);
        
        vault.executeBatchWithdrawal(proposalId);
        
        assertEq(token1.balanceOf(recipient) - beforeToken1, 1000 * 10**18);
        assertEq(token2.balanceOf(recipient) - beforeToken2, 500 * 10**18);
    }

    function test_ExecuteBatchWithETHAndTokens() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](3);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        withdrawals[2] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token2), 500 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveBatchProposal(proposalId);
        
        uint256 beforeETH = recipient.balance;
        vault.executeBatchWithdrawal(proposalId);
        
        assertEq(recipient.balance - beforeETH, 1 ether);
    }

    function test_ExecuteBatchRequiresApproval() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        // Only 1 approval, need 2
        
        vm.expectRevert("Insufficient approvals");
        vault.executeBatchWithdrawal(proposalId);
    }

    function test_ExecuteBatchPreventDoubleExecution() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveBatchProposal(proposalId);
        
        vault.executeBatchWithdrawal(proposalId);
        
        vm.expectRevert("Already executed");
        vault.executeBatchWithdrawal(proposalId);
    }

    // ==================== Query Tests ====================

    function test_IsBatchProposalExecuted() public {
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(token1), 1000 * 10**18, recipient);
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        assertFalse(vault.isBatchProposalExecuted(proposalId));
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveBatchProposal(proposalId);
        
        vault.executeBatchWithdrawal(proposalId);
        
        assertTrue(vault.isBatchProposalExecuted(proposalId));
    }

    function test_GetTokenBalance() public {
        assertEq(vault.getTokenBalance(address(token1)), 10000 * 10**18);
        assertEq(vault.getTokenBalance(address(token2)), 10000 * 10**18);
    }

    function test_GetETHBalance() public {
        assertEq(vault.getETHBalance(), 10 ether);
    }

    // ==================== Configuration Tests ====================

    function test_SetQuorum() public {
        vm.prank(owner);
        vault.setQuorum(3);
        
        assertEq(vault.quorum(), 3);
    }

    function test_UpdateGuardianToken() public {
        address newToken = address(0x6666666666666666666666666666666666666666);
        vm.prank(owner);
        vault.updateGuardianToken(newToken);
        
        assertEq(vault.guardianToken(), newToken);
    }
}
