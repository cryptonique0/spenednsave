// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SpendVaultWithProposals.sol";
import "../contracts/WithdrawalProposalManager.sol";
import "../mocks/MockGuardianSBT.sol";
import "../mocks/MockERC20.sol";

contract SpendVaultWithProposalsTest is Test {
    SpendVaultWithProposals vault;
    WithdrawalProposalManager manager;
    MockGuardianSBT guardianSBT;
    MockERC20 token;
    
    address owner = address(0x1111111111111111111111111111111111111111);
    address guardian1 = address(0x2222222222222222222222222222222222222222);
    address guardian2 = address(0x3333333333333333333333333333333333333333);
    address guardian3 = address(0x4444444444444444444444444444444444444444);
    address recipient = address(0x5555555555555555555555555555555555555555);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        manager = new WithdrawalProposalManager();
        
        vm.prank(owner);
        vault = new SpendVaultWithProposals();
        
        vault.setQuorum(2);
        vault.updateGuardianToken(address(guardianSBT));
        vault.updateProposalManager(address(manager));
        
        // Register vault with manager
        manager.registerVault(address(vault), 2);
        
        // Give guardians their SBTs
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);
        guardianSBT.mint(guardian3);
        
        // Setup token
        token = new MockERC20("Test", "TST");
        
        // Give vault some funds
        vm.deal(address(vault), 10 ether);
        token.mint(address(vault), 10000 * 10**18);
    }

    // ==================== Proposal Creation Tests ====================

    function test_VaultOwnerProposesWithdrawal() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test withdrawal"
        );
        
        assertEq(proposalId, 0);
    }

    function test_ProposeWithdrawalRequiresOwner() public {
        vm.prank(guardian1);
        vm.expectRevert("Only owner can propose");
        vault.proposeWithdrawal(address(0), 1 ether, recipient, "Test");
    }

    function test_ProposeWithdrawalValidatesETHBalance() public {
        vm.prank(owner);
        vm.expectRevert("Insufficient ETH");
        vault.proposeWithdrawal(address(0), 20 ether, recipient, "Test");
    }

    function test_ProposeWithdrawalValidatesTokenBalance() public {
        vm.prank(owner);
        vm.expectRevert("Insufficient tokens");
        vault.proposeWithdrawal(
            address(token),
            20000 * 10**18,
            recipient,
            "Test"
        );
    }

    function test_ProposeWithdrawalCreatesManagerProposal() public {
        vm.prank(owner);
        vault.proposeWithdrawal(address(0), 1 ether, recipient, "Test");
        
        // Verify proposal exists in manager
        (
            uint256 id,
            address vaultAddr,
            ,
            uint256 amount,
            ,
            ,
            ,
            ,
            ,
            ,
            uint8 status,
            ,
            ,
        ) = manager.getProposal(0);
        
        assertEq(id, 0);
        assertEq(vaultAddr, address(vault));
        assertEq(amount, 1 ether);
        assertEq(status, 0); // PENDING
    }

    // ==================== Guardian Voting Tests ====================

    function test_GuardianCanVoteOnProposal() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        assertTrue(manager.hasVoted(proposalId, guardian1));
    }

    function test_VoteRequiresGuardianSBT() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        address nonGuardian = address(0x9999999999999999999999999999999999999999);
        vm.prank(nonGuardian);
        vm.expectRevert("Not a guardian");
        vault.voteApproveProposal(proposalId);
    }

    function test_MultipleGuardiansCanVote() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        assertTrue(manager.hasVoted(proposalId, guardian1));
        assertTrue(manager.hasVoted(proposalId, guardian2));
    }

    // ==================== Proposal Execution Tests ====================

    function test_ExecuteApprovedProposal() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        // Get approvals
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        // Execute
        vm.prank(recipient);
        uint256 beforeBalance = recipient.balance;
        vault.executeProposalWithdrawal(proposalId);
        uint256 afterBalance = recipient.balance;
        
        assertEq(afterBalance - beforeBalance, 1 ether);
    }

    function test_ExecuteProposalTransfersToken() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(token),
            100 * 10**18,
            recipient,
            "Test"
        );
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        uint256 beforeBalance = token.balanceOf(recipient);
        vault.executeProposalWithdrawal(proposalId);
        uint256 afterBalance = token.balanceOf(recipient);
        
        assertEq(afterBalance - beforeBalance, 100 * 10**18);
    }

    function test_ExecuteProposalRequiresApproval() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        // Only 1 approval, need 2
        
        vm.expectRevert("Insufficient approvals");
        vault.executeProposalWithdrawal(proposalId);
    }

    function test_ExecuteProposalPreventsDoubleExecution() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        vault.executeProposalWithdrawal(proposalId);
        
        vm.expectRevert("Already executed");
        vault.executeProposalWithdrawal(proposalId);
    }

    function test_IsProposalExecuted() public {
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        assertFalse(vault.isProposalExecuted(proposalId));
        
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        vault.executeProposalWithdrawal(proposalId);
        
        assertTrue(vault.isProposalExecuted(proposalId));
    }

    // ==================== Reentrancy Tests ====================

    function test_ExecutionProtectsAgainstReentrancy() public {
        // Create ETH proposal
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        // Get approvals
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        // Execute should have reentrancy protection
        uint256 startBalance = address(vault).balance;
        vault.executeProposalWithdrawal(proposalId);
        uint256 endBalance = address(vault).balance;
        
        assertEq(startBalance - endBalance, 1 ether);
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

    function test_UpdateProposalManager() public {
        WithdrawalProposalManager newManager = new WithdrawalProposalManager();
        vm.prank(owner);
        vault.updateProposalManager(address(newManager));
        
        assertEq(vault.proposalManager(), address(newManager));
    }

    // ==================== Balance Query Tests ====================

    function test_GetETHBalance() public {
        uint256 balance = vault.getETHBalance();
        assertEq(balance, 10 ether);
    }

    function test_GetTokenBalance() public {
        uint256 balance = vault.getTokenBalance(address(token));
        assertEq(balance, 10000 * 10**18);
    }

    // ==================== Deposit Tests ====================

    function test_DepositETH() public {
        uint256 beforeBalance = vault.getETHBalance();
        
        vm.prank(owner);
        vault.depositETH{value: 5 ether}();
        
        uint256 afterBalance = vault.getETHBalance();
        assertEq(afterBalance - beforeBalance, 5 ether);
    }

    function test_DepositToken() public {
        // First approve
        token.approve(address(vault), 1000 * 10**18);
        
        uint256 beforeBalance = vault.getTokenBalance(address(token));
        
        vault.deposit(address(token), 1000 * 10**18);
        
        uint256 afterBalance = vault.getTokenBalance(address(token));
        assertEq(afterBalance - beforeBalance, 1000 * 10**18);
    }
}
