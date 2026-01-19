// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultFactoryWithBatchProposals.sol";
import "../contracts/SpendVaultWithBatchProposals.sol";
import "../contracts/BatchWithdrawalProposalManager.sol";
import "../mocks/MockGuardianSBT.sol";
import "../mocks/MockERC20.sol";

contract BatchProposalSystemIntegrationTest is Test {
    VaultFactoryWithBatchProposals factory;
    BatchWithdrawalProposalManager manager;
    MockGuardianSBT guardianSBT;
    MockERC20[] tokens;
    
    address owner1 = address(0x1111111111111111111111111111111111111111);
    address owner2 = address(0x2222222222222222222222222222222222222222);
    address guardian1 = address(0x3333333333333333333333333333333333333333);
    address guardian2 = address(0x4444444444444444444444444444444444444444);
    address guardian3 = address(0x5555555555555555555555555555555555555555);
    address recipient1 = address(0x6666666666666666666666666666666666666666);
    address recipient2 = address(0x7777777777777777777777777777777777777777);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        factory = new VaultFactoryWithBatchProposals(address(guardianSBT));
        manager = BatchWithdrawalProposalManager(factory.getBatchProposalManager());
        
        // Create tokens
        for (uint256 i = 0; i < 3; i++) {
            MockERC20 token = new MockERC20(string(abi.encodePacked("Token", i)), string(abi.encodePacked("TK", i)));
            tokens.push(token);
            token.mint(address(this), 1000000 * 10**18);
        }
        
        // Setup guardians
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);
        guardianSBT.mint(guardian3);
    }

    // ==================== Multi-Vault Batch Proposal Tests ====================

    function test_IndependentBatchProposalsInMultipleVaults() public {
        // Create two vaults
        vm.prank(owner1);
        address vault1Address = factory.createBatchVault(2);
        SpendVaultWithBatchProposals vault1 = SpendVaultWithBatchProposals(payable(vault1Address));
        
        vm.prank(owner2);
        address vault2Address = factory.createBatchVault(2);
        SpendVaultWithBatchProposals vault2 = SpendVaultWithBatchProposals(payable(vault2Address));
        
        // Fund both vaults
        vm.deal(vault1Address, 10 ether);
        vm.deal(vault2Address, 10 ether);
        
        // Create batch proposals in both vaults
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals1 = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals1[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals2 = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals2[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 2 ether, recipient2);
        
        vm.prank(owner1);
        uint256 proposal1 = vault1.proposeBatchWithdrawal(withdrawals1, "Test1");
        
        vm.prank(owner2);
        uint256 proposal2 = vault2.proposeBatchWithdrawal(withdrawals2, "Test2");
        
        // Verify independent proposals
        assertNotEq(proposal1, proposal2);
    }

    function test_VaultsAreFullyIsolated() public {
        vm.prank(owner1);
        address vault1Address = factory.createBatchVault(2);
        SpendVaultWithBatchProposals vault1 = SpendVaultWithBatchProposals(payable(vault1Address));
        
        vm.prank(owner2);
        address vault2Address = factory.createBatchVault(2);
        SpendVaultWithBatchProposals vault2 = SpendVaultWithBatchProposals(payable(vault2Address));
        
        // Fund only vault1
        vm.deal(vault1Address, 10 ether);
        
        // Create batch in vault1
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 5 ether, recipient1);
        
        vm.prank(owner1);
        uint256 proposal1 = vault1.proposeBatchWithdrawal(withdrawals, "Test");
        
        // Attempt to create batch in vault2 (unfunded)
        vm.prank(owner2);
        vm.expectRevert("Insufficient ETH");
        vault2.proposeBatchWithdrawal(withdrawals, "Test");
    }

    // ==================== Complex Multi-Token Batch Tests ====================

    function test_MaximumTokensPerBatch() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Fund vault with 10 different tokens
        MockERC20[] memory testTokens = new MockERC20[](10);
        for (uint256 i = 0; i < 10; i++) {
            testTokens[i] = new MockERC20("Token", "TK");
            testTokens[i].mint(address(vault), 1000 * 10**18);
        }
        
        // Create batch with 10 tokens
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](10);
        for (uint256 i = 0; i < 10; i++) {
            withdrawals[i] = BatchWithdrawalProposalManager.TokenWithdrawal(
                address(testTokens[i]), 
                100 * 10**18, 
                recipient1
            );
        }
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Max tokens test");
        assertNotEq(proposal, 0);
    }

    function test_ExceedingMaximumTokensPerBatch() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Create batch with 11 tokens (exceeds max of 10)
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](11);
        
        vm.prank(owner1);
        vm.expectRevert("Max 10 tokens per batch");
        vault.proposeBatchWithdrawal(withdrawals, "Exceeds max");
    }

    function test_MixedETHAndMultipleTokenBatch() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Fund vault
        vm.deal(vaultAddress, 10 ether);
        tokens[0].mint(address(vault), 1000 * 10**18);
        tokens[1].mint(address(vault), 1000 * 10**18);
        tokens[2].mint(address(vault), 1000 * 10**18);
        
        // Create batch with ETH + 3 tokens
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](4);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 5 ether, recipient1);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[0]), 100 * 10**18, recipient1);
        withdrawals[2] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[1]), 200 * 10**18, recipient1);
        withdrawals[3] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[2]), 300 * 10**18, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Mixed batch");
        assertNotEq(proposal, 0);
    }

    // ==================== Complex Guardian Voting Scenarios ====================

    function test_MultiGuardianBatchApproval() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(3);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 10 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        // Three guardians vote
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposal);
        assertFalse(manager.getBatchProposal(proposal).status == 1); // Not approved yet
        
        vm.prank(guardian2);
        vault.voteApproveBatchProposal(proposal);
        assertFalse(manager.getBatchProposal(proposal).status == 1); // Not approved yet
        
        vm.prank(guardian3);
        vault.voteApproveBatchProposal(proposal);
        assertTrue(manager.getBatchProposal(proposal).status == 1); // Now approved
    }

    function test_BatchProposalQuorumRequired() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(2); // Quorum = 2
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 10 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposal);
        
        // Only 1 vote, need 2
        vm.expectRevert("Insufficient approvals");
        vault.executeBatchWithdrawal(proposal);
    }

    // ==================== Batch Execution Edge Cases ====================

    function test_AtomicExecutionOfMultipleTokens() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Fund vault
        vm.deal(vaultAddress, 10 ether);
        tokens[0].mint(address(vault), 1000 * 10**18);
        tokens[1].mint(address(vault), 1000 * 10**18);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](3);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 5 ether, recipient1);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[0]), 500 * 10**18, recipient1);
        withdrawals[2] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[1]), 300 * 10**18, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Atomic test");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposal);
        
        // Check balances before execution
        uint256 beforeETH = recipient1.balance;
        uint256 beforeToken0 = tokens[0].balanceOf(recipient1);
        uint256 beforeToken1 = tokens[1].balanceOf(recipient1);
        
        vault.executeBatchWithdrawal(proposal);
        
        // All should execute together
        assertEq(recipient1.balance - beforeETH, 5 ether);
        assertEq(tokens[0].balanceOf(recipient1) - beforeToken0, 500 * 10**18);
        assertEq(tokens[1].balanceOf(recipient1) - beforeToken1, 300 * 10**18);
    }

    function test_FailedBatchExecutionDueToInsufficientBalance() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Fund vault with only 1 ETH
        vm.deal(vaultAddress, 1 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 5 ether, recipient1);
        
        vm.prank(owner1);
        vm.expectRevert("Insufficient ETH");
        vault.proposeBatchWithdrawal(withdrawals, "Will fail");
    }

    // ==================== Multi-Proposal Batch Tests ====================

    function test_MultipleSequentialBatchProposals() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 20 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        
        // Create first proposal
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        vm.prank(owner1);
        uint256 proposal1 = vault.proposeBatchWithdrawal(withdrawals, "First");
        
        // Create second proposal
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 2 ether, recipient2);
        vm.prank(owner1);
        uint256 proposal2 = vault.proposeBatchWithdrawal(withdrawals, "Second");
        
        assertNotEq(proposal1, proposal2);
        
        // Both proposals should be trackable
        address[] memory vaultProposals = manager.getVaultBatchProposals(vaultAddress);
        assertGe(vaultProposals.length, 2);
    }

    function test_BatchProposalHistoryPerVault() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 20 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        // Create 5 proposals
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(owner1);
            vault.proposeBatchWithdrawal(withdrawals, string(abi.encodePacked("Proposal", i)));
        }
        
        uint256 count = manager.getBatchProposalCount(vaultAddress);
        assertEq(count, 5);
    }

    // ==================== Voting Window Tests ====================

    function test_VotingWindowExpiration() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 10 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        // Advance time past voting window (3 days + 1 second)
        vm.warp(block.timestamp + 3 days + 1 seconds);
        
        // Attempt to vote after deadline
        vm.prank(guardian1);
        vm.expectRevert("Voting period ended");
        vault.voteApproveBatchProposal(proposal);
    }

    function test_VotingAvailableWithinWindow() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 10 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Test");
        
        // Advance time within voting window (3 days - 1 second)
        vm.warp(block.timestamp + 3 days - 1 seconds);
        
        // Should be able to vote
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposal);
        
        assertTrue(manager.hasVotedOnBatch(proposal, guardian1));
    }

    // ==================== Stress Tests ====================

    function test_LargeAmountBatchTransfer() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        // Fund with large amount
        vm.deal(vaultAddress, 1000 ether);
        tokens[0].mint(address(vault), 10000000 * 10**18);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](2);
        withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 500 ether, recipient1);
        withdrawals[1] = BatchWithdrawalProposalManager.TokenWithdrawal(address(tokens[0]), 5000000 * 10**18, recipient1);
        
        vm.prank(owner1);
        uint256 proposal = vault.proposeBatchWithdrawal(withdrawals, "Large transfer");
        
        vm.prank(guardian1);
        vault.voteApproveBatchProposal(proposal);
        
        vault.executeBatchWithdrawal(proposal);
        
        assertEq(recipient1.balance, 500 ether);
        assertEq(tokens[0].balanceOf(recipient1), 5000000 * 10**18);
    }

    function test_RapidFireBatchProposals() public {
        vm.prank(owner1);
        address vaultAddress = factory.createBatchVault(1);
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(vaultAddress, 100 ether);
        
        BatchWithdrawalProposalManager.TokenWithdrawal[] memory withdrawals = 
            new BatchWithdrawalProposalManager.TokenWithdrawal[](1);
        
        // Create 20 proposals rapidly
        for (uint256 i = 0; i < 20; i++) {
            withdrawals[0] = BatchWithdrawalProposalManager.TokenWithdrawal(address(0), 1 ether, recipient1);
            vm.prank(owner1);
            vault.proposeBatchWithdrawal(withdrawals, string(abi.encodePacked("Rapid", i)));
        }
        
        assertEq(manager.getBatchProposalCount(vaultAddress), 20);
    }
}
