// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/BatchWithdrawalManager.sol";
import "../mocks/MockERC20.sol";

contract BatchWithdrawalManagerTest is Test {
    BatchWithdrawalManager manager;
    
    address vault1 = address(0x1111111111111111111111111111111111111111);
    address vault2 = address(0x2222222222222222222222222222222222222222);
    address guardian1 = address(0x3333333333333333333333333333333333333333);
    address guardian2 = address(0x4444444444444444444444444444444444444444);
    address recipient1 = address(0x5555555555555555555555555555555555555555);
    address recipient2 = address(0x6666666666666666666666666666666666666666);
    address token1 = address(0x7777777777777777777777777777777777777777);
    address token2 = address(0x8888888888888888888888888888888888888888);

    function setUp() public {
        manager = new BatchWithdrawalManager();
        manager.registerVault(vault1, 2);
        manager.registerVault(vault2, 2);
    }

    // ==================== Registration Tests ====================

    function test_RegisterVault() public {
        address vault3 = address(0x9999999999999999999999999999999999999999);
        manager.registerVault(vault3, 3);
        assertTrue(manager.isManaged(vault3));
    }

    function test_RegisterVaultStoresQuorum() public {
        address vault3 = address(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA);
        manager.registerVault(vault3, 5);
        assertEq(manager.getVaultQuorum(vault3), 5);
    }

    // ==================== Batch Creation Tests ====================

    function test_CreateBatch() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test batch");
        assertEq(batchId, 0);
    }

    function test_CreateMultipleBatches() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batch1 = manager.createBatch(vault1, tokens, "Batch 1");
        uint256 batch2 = manager.createBatch(vault1, tokens, "Batch 2");

        assertEq(batch1, 0);
        assertEq(batch2, 1);
    }

    function test_CreateBatchWithMultipleTokens() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](2);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(token2, 2000, recipient2);

        uint256 batchId = manager.createBatch(vault1, tokens, "Multi-token batch");

        assertEq(manager.getBatchTokenCount(batchId), 2);
    }

    function test_CreateBatchRejectsUnmanagedVault() public {
        address unmanagedVault = address(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB);
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        vm.expectRevert("Vault not managed");
        manager.createBatch(unmanagedVault, tokens, "Test");
    }

    function test_CreateBatchRejectsEmptyTokens() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](0);

        vm.expectRevert("Batch must have tokens");
        manager.createBatch(vault1, tokens, "Test");
    }

    function test_CreateBatchRejectsTooManyTokens() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](21);

        for (uint i = 0; i < 21; i++) {
            tokens[i] = BatchWithdrawalManager.TokenWithdrawal(token1, 100, recipient1);
        }

        vm.expectRevert("Batch too large (max 20)");
        manager.createBatch(vault1, tokens, "Test");
    }

    // ==================== Voting Tests ====================

    function test_ApproveBatch() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        bool approved = manager.approveBatch(batchId, guardian1);
        assertFalse(approved);  // Need 2 for quorum
    }

    function test_ApproveBatchReachesQuorum() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        manager.approveBatch(batchId, guardian1);
        bool approved = manager.approveBatch(batchId, guardian2);
        
        assertTrue(approved);
    }

    function test_ApproveBatchPreventsDuplicateVote() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        manager.approveBatch(batchId, guardian1);
        vm.expectRevert("Already voted");
        manager.approveBatch(batchId, guardian1);
    }

    function test_HasVotedCheck() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        assertFalse(manager.hasVoted(batchId, guardian1));
        manager.approveBatch(batchId, guardian1);
        assertTrue(manager.hasVoted(batchId, guardian1));
    }

    function test_ApprovalsNeeded() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        assertEq(manager.approvalsNeeded(batchId), 2);
        manager.approveBatch(batchId, guardian1);
        assertEq(manager.approvalsNeeded(batchId), 1);
    }

    // ==================== Batch Execution Tests ====================

    function test_ExecuteBatch() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");
        
        manager.approveBatch(batchId, guardian1);
        manager.approveBatch(batchId, guardian2);
        
        manager.executeBatch(batchId);

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            bool executed,
            uint256 executedAt
        ) = manager.getBatch(batchId);

        assertTrue(executed);
        assertGt(executedAt, 0);
    }

    // ==================== Multi-Token Tests ====================

    function test_BatchWith3Tokens() public {
        address token3 = address(0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC);
        address recipient3 = address(0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD);

        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](3);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(token2, 2000, recipient2);
        tokens[2] = BatchWithdrawalManager.TokenWithdrawal(token3, 3000, recipient3);

        uint256 batchId = manager.createBatch(vault1, tokens, "3-token batch");

        assertEq(manager.getBatchTokenCount(batchId), 3);
    }

    function test_GetBatchToken() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](2);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);
        tokens[1] = BatchWithdrawalManager.TokenWithdrawal(token2, 2000, recipient2);

        uint256 batchId = manager.createBatch(vault1, tokens, "Test");

        (address t1, uint256 a1, address r1) = manager.getBatchToken(batchId, 0);
        assertEq(t1, token1);
        assertEq(a1, 1000);
        assertEq(r1, recipient1);

        (address t2, uint256 a2, address r2) = manager.getBatchToken(batchId, 1);
        assertEq(t2, token2);
        assertEq(a2, 2000);
        assertEq(r2, recipient2);
    }

    // ==================== Vault Batch Tracking ====================

    function test_GetVaultBatches() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        manager.createBatch(vault1, tokens, "Batch 1");
        manager.createBatch(vault1, tokens, "Batch 2");
        
        uint256[] memory batches = manager.getVaultBatches(vault1);
        assertEq(batches.length, 2);
        assertEq(batches[0], 0);
        assertEq(batches[1], 1);
    }

    function test_GetBatchCount() public {
        BatchWithdrawalManager.TokenWithdrawal[] memory tokens = 
            new BatchWithdrawalManager.TokenWithdrawal[](1);
        tokens[0] = BatchWithdrawalManager.TokenWithdrawal(token1, 1000, recipient1);

        manager.createBatch(vault1, tokens, "B1");
        manager.createBatch(vault1, tokens, "B2");
        manager.createBatch(vault1, tokens, "B3");
        
        assertEq(manager.getBatchCount(vault1), 3);
    }
}
