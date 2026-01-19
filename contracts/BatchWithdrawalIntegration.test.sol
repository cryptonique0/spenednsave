// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultFactoryWithBatchWithdrawals.sol";
import "../contracts/SpendVaultWithBatchWithdrawals.sol";
import "../contracts/BatchWithdrawalManager.sol";
import "../mocks/MockGuardianSBT.sol";
import "../mocks/MockERC20.sol";

contract BatchWithdrawalIntegrationTest is Test {
    VaultFactoryWithBatchWithdrawals factory;
    BatchWithdrawalManager manager;
    SpendVaultWithBatchWithdrawals vault1;
    SpendVaultWithBatchWithdrawals vault2;
    MockGuardianSBT guardianSBT;
    MockERC20 token1;
    MockERC20 token2;
    MockERC20 token3;

    address owner1 = address(0x1111111111111111111111111111111111111111);
    address owner2 = address(0x2222222222222222222222222222222222222222);
    address guardian1 = address(0x3333333333333333333333333333333333333333);
    address guardian2 = address(0x4444444444444444444444444444444444444444);
    address guardian3 = address(0x5555555555555555555555555555555555555555);
    address recipient1 = address(0x6666666666666666666666666666666666666666);
    address recipient2 = address(0x7777777777777777777777777777777777777777);

    function setUp() public {
        factory = new VaultFactoryWithBatchWithdrawals();
        manager = BatchWithdrawalManager(factory.getBatchManager());
        
        guardianSBT = new MockGuardianSBT();
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);
        guardianSBT.mint(guardian3);

        token1 = new MockERC20("Token1", "T1");
        token2 = new MockERC20("Token2", "T2");
        token3 = new MockERC20("Token3", "T3");

        // Create vaults
        vm.prank(owner1);
        vault1 = SpendVaultWithBatchWithdrawals(payable(factory.createVault(2)));
        vault1.updateGuardianToken(address(guardianSBT));

        vm.prank(owner2);
        vault2 = SpendVaultWithBatchWithdrawals(payable(factory.createVault(2)));
        vault2.updateGuardianToken(address(guardianSBT));

        // Fund vaults
        token1.mint(address(vault1), 10000 * 10**18);
        token2.mint(address(vault1), 10000 * 10**18);
        token1.mint(address(vault2), 10000 * 10**18);
        token3.mint(address(vault2), 10000 * 10**18);
        vm.deal(address(vault1), 10 ether);
        vm.deal(address(vault2), 10 ether);
    }

    // ==================== Multi-Vault Tests ====================

    function test_TwoVaultsIndependentBatches() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokensVault1 =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokensVault1[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        BatchWithdrawalManager.TokenWithdrawal[] memory tokensVault2 =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokensVault2[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token3),
            1000 * 10**18,
            recipient2
        );

        vm.prank(owner1);
        uint256 batch1 = vault1.proposeBatchWithdrawal(tokensVault1, "Batch1");

        vm.prank(owner2);
        uint256 batch2 = vault2.proposeBatchWithdrawal(tokensVault2, "Batch2");

        // Batch IDs should be different
        assertNotEq(batch1, batch2);

        // Batch 1 should have token1
        (address token, , ) = manager.getBatchToken(batch1, 0);
        assertEq(token, address(token1));

        // Batch 2 should have token3
        (token, , ) = manager.getBatchToken(batch2, 0);
        assertEq(token, address(token3));
    }

    // ==================== Multi-Token Batch Tests ====================

    function test_ThreeTokenBatch() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](3);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(
            address(token2),
            2000 * 10**18,
            recipient1
        );
        tokens[2] = BatchWithdrawalManager.TokenWithdrawal(
            address(0),
            1 ether,
            recipient1
        );

        vm.prank(owner1);
        uint256 batchId = vault1.proposeBatchWithdrawal(tokens, "Three tokens");

        vm.prank(guardian1);
        vault1.voteApproveBatch(batchId);

        vm.prank(guardian2);
        vault1.voteApproveBatch(batchId);

        uint256 beforeToken1 = token1.balanceOf(recipient1);
        uint256 beforeToken2 = token2.balanceOf(recipient1);
        uint256 beforeETH = recipient1.balance;

        vault1.executeBatchWithdrawal(batchId);

        assertEq(token1.balanceOf(recipient1) - beforeToken1, 1000 * 10**18);
        assertEq(token2.balanceOf(recipient1) - beforeToken2, 2000 * 10**18);
        assertEq(recipient1.balance - beforeETH, 1 ether);
    }

    // ==================== Concurrent Voting Tests ====================

    function test_MultipleBatchesConcurrentVoting() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens1 =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens1[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        BatchWithdrawalManager.TokenWithdrawal[] memory tokens2 =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens2[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token2),
            1000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 batch1 = vault1.proposeBatchWithdrawal(tokens1, "Batch1");

        vm.prank(owner1);
        uint256 batch2 = vault1.proposeBatchWithdrawal(tokens2, "Batch2");

        // Guardian1 votes on both
        vm.prank(guardian1);
        vault1.voteApproveBatch(batch1);

        vm.prank(guardian1);
        vault1.voteApproveBatch(batch2);

        // Guardian2 votes on batch1
        vm.prank(guardian2);
        vault1.voteApproveBatch(batch1);

        // Batch1 should be approved
        require(manager.getBatchStatus(batch1) == BatchWithdrawalManager.BatchStatus.APPROVED);

        // Batch2 should still be pending
        require(manager.getBatchStatus(batch2) == BatchWithdrawalManager.BatchStatus.PENDING);
    }

    // ==================== Multi-Guardian Tests ====================

    function test_MultiGuardianBatch() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 batchId = vault1.proposeBatchWithdrawal(tokens, "Three guardian vote");
        vault1.setQuorum(3);
        manager.updateVaultQuorum(address(vault1), 3);

        vm.prank(guardian1);
        vault1.voteApproveBatch(batchId);

        vm.prank(guardian2);
        vault1.voteApproveBatch(batchId);

        // Should not be approved yet
        require(manager.getBatchStatus(batchId) == BatchWithdrawalManager.BatchStatus.PENDING);

        vm.prank(guardian3);
        vault1.voteApproveBatch(batchId);

        // Now should be approved
        require(manager.getBatchStatus(batchId) == BatchWithdrawalManager.BatchStatus.APPROVED);
    }

    // ==================== Batch Expiration Tests ====================

    function test_BatchExpiresAfterVotingPeriod() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 batchId = vault1.proposeBatchWithdrawal(tokens, "Expiring batch");

        vm.prank(guardian1);
        vault1.voteApproveBatch(batchId);

        // Fast forward 3 days + 1 second
        vm.warp(block.timestamp + 3 days + 1 seconds);

        // Batch should be expired
        require(manager.getBatchStatus(batchId) == BatchWithdrawalManager.BatchStatus.EXPIRED);
    }

    // ==================== Atomic Execution Tests ====================

    function test_AtomicExecutionAllOrNothing() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](2);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(
            address(token2),
            2000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 batchId = vault1.proposeBatchWithdrawal(tokens, "Atomic batch");

        vm.prank(guardian1);
        vault1.voteApproveBatch(batchId);

        vm.prank(guardian2);
        vault1.voteApproveBatch(batchId);

        uint256 before1 = token1.balanceOf(recipient1);
        uint256 before2 = token2.balanceOf(recipient1);

        vault1.executeBatchWithdrawal(batchId);

        uint256 after1 = token1.balanceOf(recipient1);
        uint256 after2 = token2.balanceOf(recipient1);

        // Both should succeed
        assertEq(after1 - before1, 1000 * 10**18);
        assertEq(after2 - before2, 2000 * 10**18);
    }

    // ==================== Batch History Tests ====================

    function test_BatchHistoryTracking() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 batch1 = vault1.proposeBatchWithdrawal(tokens, "Batch1");

        vm.prank(owner1);
        uint256 batch2 = vault1.proposeBatchWithdrawal(tokens, "Batch2");

        vm.prank(owner1);
        uint256 batch3 = vault1.proposeBatchWithdrawal(tokens, "Batch3");

        uint256[] memory batchIds = manager.getVaultBatches(address(vault1));
        assertEq(batchIds.length, 3);
        assertEq(batchIds[0], batch1);
        assertEq(batchIds[1], batch2);
        assertEq(batchIds[2], batch3);
    }

    // ==================== Cross-Vault Batch Tests ====================

    function test_SeparateBatchCountersPerVault() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            1000 * 10**18,
            recipient1
        );

        vm.prank(owner1);
        uint256 vault1Batch1 = vault1.proposeBatchWithdrawal(tokens, "V1B1");

        tokens[0].token = address(token3);
        vm.prank(owner2);
        uint256 vault2Batch1 = vault2.proposeBatchWithdrawal(tokens, "V2B1");

        // Both should get batch ID 0 since they're different vaults
        assertEq(vault1Batch1, vault2Batch1);

        // But they should be stored separately
        uint256[] memory vault1Batches = manager.getVaultBatches(address(vault1));
        uint256[] memory vault2Batches = manager.getVaultBatches(address(vault2));

        assertEq(vault1Batches.length, 1);
        assertEq(vault2Batches.length, 1);
    }

    // ==================== Full Workflow Tests ====================

    function test_CompleteWorkflowMultiTokenBatch() public {
        // Prepare batch with multiple tokens
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens =
            new BatchWithdrawalManager.TokenWithdrawal[](3);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(
            address(token1),
            500 * 10**18,
            recipient1
        );
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(
            address(token2),
            1000 * 10**18,
            recipient1
        );
        tokens[2] = BatchWithdrawalManager.TokenWithdrawal(
            address(0),
            2 ether,
            recipient1
        );

        // Step 1: Owner proposes
        vm.prank(owner1);
        uint256 batchId = vault1.proposeBatchWithdrawal(tokens, "Complete workflow");
        assertEq(manager.getBatchStatus(batchId), BatchWithdrawalManager.BatchStatus.PENDING);

        // Step 2: First guardian votes
        vm.prank(guardian1);
        vault1.voteApproveBatch(batchId);
        assertTrue(manager.hasVoted(batchId, guardian1));
        assertEq(manager.getBatchStatus(batchId), BatchWithdrawalManager.BatchStatus.PENDING);

        // Step 3: Second guardian votes (reaches quorum)
        vm.prank(guardian2);
        vault1.voteApproveBatch(batchId);
        assertTrue(manager.hasVoted(batchId, guardian2));
        require(manager.getBatchStatus(batchId) == BatchWithdrawalManager.BatchStatus.APPROVED);

        // Step 4: Execute batch
        uint256 beforeT1 = token1.balanceOf(recipient1);
        uint256 beforeT2 = token2.balanceOf(recipient1);
        uint256 beforeETH = recipient1.balance;

        vault1.executeBatchWithdrawal(batchId);

        require(manager.getBatchStatus(batchId) == BatchWithdrawalManager.BatchStatus.EXECUTED);
        assertEq(token1.balanceOf(recipient1) - beforeT1, 500 * 10**18);
        assertEq(token2.balanceOf(recipient1) - beforeT2, 1000 * 10**18);
        assertEq(recipient1.balance - beforeETH, 2 ether);
    }
}
