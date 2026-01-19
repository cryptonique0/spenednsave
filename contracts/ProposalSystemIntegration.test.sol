// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultFactoryWithProposals.sol";
import "../contracts/SpendVaultWithProposals.sol";
import "../contracts/WithdrawalProposalManager.sol";
import "../mocks/MockGuardianSBT.sol";
import "../mocks/MockERC20.sol";

contract ProposalSystemIntegrationTest is Test {
    VaultFactoryWithProposals factory;
    MockGuardianSBT guardianSBT;
    MockERC20 token;
    
    address owner = address(0x1111111111111111111111111111111111111111);
    address guardian1 = address(0x2222222222222222222222222222222222222222);
    address guardian2 = address(0x3333333333333333333333333333333333333333);
    address guardian3 = address(0x4444444444444444444444444444444444444444);
    address recipient = address(0x5555555555555555555555555555555555555555);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        factory = new VaultFactoryWithProposals(address(guardianSBT));
        token = new MockERC20("Test", "TST");
        
        // Mint guardian SBTs
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);
        guardianSBT.mint(guardian3);
        
        // Fund token
        token.mint(owner, 100000 * 10**18);
    }

    // ==================== End-to-End Workflow Tests ====================

    function test_CompleteWithdrawalFlow() public {
        // 1. Owner creates vault
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        
        // 2. Owner deposits funds
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        vault.depositETH{value: 5 ether}();
        
        // 3. Owner proposes withdrawal
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test withdrawal"
        );
        
        // 4. Guardians approve
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        // 5. Execute withdrawal
        uint256 beforeBalance = recipient.balance;
        vault.executeProposalWithdrawal(proposalId);
        uint256 afterBalance = recipient.balance;
        
        assertEq(afterBalance - beforeBalance, 1 ether);
    }

    function test_TokenWithdrawalFlow() public {
        // Create vault
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        // Transfer tokens to vault
        vm.prank(owner);
        token.transfer(address(vault), 1000 * 10**18);
        
        // Propose withdrawal
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(token),
            500 * 10**18,
            recipient,
            "Token withdrawal"
        );
        
        // Approve
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(proposalId);
        
        // Execute
        uint256 beforeBalance = token.balanceOf(recipient);
        vault.executeProposalWithdrawal(proposalId);
        uint256 afterBalance = token.balanceOf(recipient);
        
        assertEq(afterBalance - beforeBalance, 500 * 10**18);
    }

    // ==================== Multi-Proposal Tests ====================

    function test_MultipleProposalsIndependent() public {
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        vm.deal(owner, 20 ether);
        vm.prank(owner);
        vault.depositETH{value: 10 ether}();
        
        // Create two proposals
        vm.prank(owner);
        uint256 prop1 = vault.proposeWithdrawal(address(0), 1 ether, recipient, "P1");
        
        vm.prank(owner);
        uint256 prop2 = vault.proposeWithdrawal(address(0), 2 ether, recipient, "P2");
        
        // Approve first proposal
        vm.prank(guardian1);
        vault.voteApproveProposal(prop1);
        
        vm.prank(guardian2);
        vault.voteApproveProposal(prop1);
        
        // Execute first
        uint256 before = recipient.balance;
        vault.executeProposalWithdrawal(prop1);
        assertEq(recipient.balance - before, 1 ether);
        
        // Second still pending
        vm.prank(guardian1);
        vault.voteApproveProposal(prop2);
        
        // Need another approval
        vm.prank(guardian3);
        vault.voteApproveProposal(prop2);
        
        // Execute second
        before = recipient.balance;
        vault.executeProposalWithdrawal(prop2);
        assertEq(recipient.balance - before, 2 ether);
    }

    // ==================== Multi-Vault Tests ====================

    function test_MultipleVaultsIndependent() public {
        vm.prank(owner);
        address vault1Addr = factory.createVault(2);
        
        address owner2 = address(0x7777777777777777777777777777777777777777);
        vm.prank(owner2);
        address vault2Addr = factory.createVault(2);
        
        SpendVaultWithProposals vault1 = SpendVaultWithProposals(payable(vault1Addr));
        SpendVaultWithProposals vault2 = SpendVaultWithProposals(payable(vault2Addr));
        
        // Fund both
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        vault1.depositETH{value: 5 ether}();
        
        vm.deal(owner2, 10 ether);
        vm.prank(owner2);
        vault2.depositETH{value: 5 ether}();
        
        // Create proposals in both
        vm.prank(owner);
        uint256 prop1 = vault1.proposeWithdrawal(address(0), 1 ether, recipient, "V1");
        
        vm.prank(owner2);
        uint256 prop2 = vault2.proposeWithdrawal(address(0), 2 ether, recipient, "V2");
        
        // Approve prop1
        vm.prank(guardian1);
        vault1.voteApproveProposal(prop1);
        
        vm.prank(guardian2);
        vault1.voteApproveProposal(prop1);
        
        // Approve prop2
        vm.prank(guardian1);
        vault2.voteApproveProposal(prop2);
        
        vm.prank(guardian2);
        vault2.voteApproveProposal(prop2);
        
        // Execute both
        uint256 beforeBalance = recipient.balance;
        vault1.executeProposalWithdrawal(prop1);
        vault2.executeProposalWithdrawal(prop2);
        
        assertEq(recipient.balance - beforeBalance, 3 ether);
    }

    // ==================== Guardian Vote Scenarios ====================

    function test_VotingWithDifferentGuardians() public {
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        vault.depositETH{value: 5 ether}();
        
        vm.prank(owner);
        uint256 proposalId = vault.proposeWithdrawal(
            address(0),
            1 ether,
            recipient,
            "Test"
        );
        
        // Guardian1 and Guardian3 approve (skip Guardian2)
        vm.prank(guardian1);
        vault.voteApproveProposal(proposalId);
        
        vm.prank(guardian3);
        vault.voteApproveProposal(proposalId);
        
        // Execute
        vault.executeProposalWithdrawal(proposalId);
        assertEq(recipient.balance, 1 ether);
    }

    // ==================== Guardian SBT Requirement Tests ====================

    function test_NonGuardianCannotVote() public {
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        vault.depositETH{value: 5 ether}();
        
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

    // ==================== Balance Validation Tests ====================

    function test_ProposalRequiresSufficientBalance() public {
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        // Vault has no funds
        vm.prank(owner);
        vm.expectRevert("Insufficient ETH");
        vault.proposeWithdrawal(address(0), 1 ether, recipient, "Test");
    }

    // ==================== Factory Integration Tests ====================

    function test_FactoryTracksMultipleUsersVaults() public {
        vm.prank(owner);
        address vault1 = factory.createVault(2);
        
        vm.prank(owner);
        address vault2 = factory.createVault(3);
        
        address owner2 = address(0x8888888888888888888888888888888888888888);
        vm.prank(owner2);
        address vault3 = factory.createVault(2);
        
        assertEq(factory.getVaultCount(), 3);
        assertEq(factory.getUserVaultCount(owner), 2);
        assertEq(factory.getUserVaultCount(owner2), 1);
    }

    function test_FactoryProposalManagerShared() public {
        vm.prank(owner);
        address vault1Addr = factory.createVault(2);
        
        address owner2 = address(0x9999999999999999999999999999999999999999);
        vm.prank(owner2);
        address vault2Addr = factory.createVault(2);
        
        SpendVaultWithProposals vault1 = SpendVaultWithProposals(payable(vault1Addr));
        SpendVaultWithProposals vault2 = SpendVaultWithProposals(payable(vault2Addr));
        
        // Both vaults should use same proposal manager
        assertEq(vault1.proposalManager(), vault2.proposalManager());
        assertEq(vault1.proposalManager(), factory.getProposalManager());
    }

    // ==================== State Consistency Tests ====================

    function test_ProposalStateConsistency() public {
        vm.prank(owner);
        address vaultAddr = factory.createVault(2);
        SpendVaultWithProposals vault = SpendVaultWithProposals(payable(vaultAddr));
        
        vm.deal(owner, 10 ether);
        vm.prank(owner);
        vault.depositETH{value: 5 ether}();
        
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
}
