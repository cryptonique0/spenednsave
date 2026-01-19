// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultFactoryWithBatchProposals.sol";
import "../contracts/SpendVaultWithBatchProposals.sol";
import "../contracts/BatchWithdrawalProposalManager.sol";
import "../mocks/MockGuardianSBT.sol";

contract VaultFactoryWithBatchProposalsTest is Test {
    VaultFactoryWithBatchProposals factory;
    MockGuardianSBT guardianSBT;
    
    address user1 = address(0x1111111111111111111111111111111111111111);
    address user2 = address(0x2222222222222222222222222222222222222222);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        factory = new VaultFactoryWithBatchProposals(address(guardianSBT));
    }

    // ==================== Vault Creation Tests ====================

    function test_CreateBatchVault() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        assertNotEq(vaultAddress, address(0));
        assertTrue(address(vaultAddress).code.length > 0);
    }

    function test_CreateMultipleBatchVaults() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user1);
        address vault2 = factory.createBatchVault(3);
        
        assertNotEq(vault1, vault2);
    }

    function test_MultipleUsersCanCreateVaults() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user2);
        address vault2 = factory.createBatchVault(2);
        
        assertNotEq(vault1, vault2);
    }

    // ==================== Manager Tests ====================

    function test_GetBatchProposalManager() public {
        address manager = factory.getBatchProposalManager();
        assertNotEq(manager, address(0));
        assertTrue(address(manager).code.length > 0);
    }

    function test_SameBatchManagerForAllVaults() public {
        vm.prank(user1);
        factory.createBatchVault(2);
        
        vm.prank(user2);
        factory.createBatchVault(2);
        
        address manager1 = factory.getBatchProposalManager();
        address manager2 = factory.getBatchProposalManager();
        
        assertEq(manager1, manager2);
    }

    // ==================== User Vault Tracking Tests ====================

    function test_GetUserBatchVaults() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user1);
        address vault2 = factory.createBatchVault(3);
        
        address[] memory userVaults = factory.getUserBatchVaults(user1);
        
        assertEq(userVaults.length, 2);
        assertEq(userVaults[0], vault1);
        assertEq(userVaults[1], vault2);
    }

    function test_GetUserBatchVaultCount() public {
        vm.prank(user1);
        factory.createBatchVault(2);
        
        vm.prank(user1);
        factory.createBatchVault(3);
        
        assertEq(factory.getUserBatchVaultCount(user1), 2);
    }

    function test_MultipleUsersHaveIndependentVaults() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user1);
        factory.createBatchVault(2);
        
        vm.prank(user2);
        address vault3 = factory.createBatchVault(2);
        
        address[] memory user1Vaults = factory.getUserBatchVaults(user1);
        address[] memory user2Vaults = factory.getUserBatchVaults(user2);
        
        assertEq(user1Vaults.length, 2);
        assertEq(user2Vaults.length, 1);
        assertEq(user2Vaults[0], vault3);
    }

    // ==================== Global Vault Tracking Tests ====================

    function test_GetAllBatchVaults() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user2);
        address vault2 = factory.createBatchVault(2);
        
        address[] memory allVaults = factory.getAllBatchVaults();
        
        assertEq(allVaults.length, 2);
    }

    function test_GetBatchVaultCount() public {
        vm.prank(user1);
        factory.createBatchVault(2);
        
        vm.prank(user2);
        factory.createBatchVault(2);
        
        assertEq(factory.getBatchVaultCount(), 2);
    }

    // ==================== Vault Integration Tests ====================

    function test_CreatedVaultIsRegisteredWithManager() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        address manager = factory.getBatchProposalManager();
        BatchWithdrawalProposalManager managerContract = BatchWithdrawalProposalManager(manager);
        
        assertTrue(managerContract.isManagedForBatch(vaultAddress));
    }

    function test_CreatedVaultHasCorrectQuorum() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(3);
        
        address manager = factory.getBatchProposalManager();
        BatchWithdrawalProposalManager managerContract = BatchWithdrawalProposalManager(manager);
        
        assertEq(managerContract.getVaultQuorumForBatch(vaultAddress), 3);
    }

    function test_CreatedVaultHasGuardianToken() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        SpendVaultWithBatchProposals vaultContract = SpendVaultWithBatchProposals(payable(vaultAddress));
        assertEq(vaultContract.guardianToken(), address(guardianSBT));
    }

    function test_CreatedVaultHasManagerReference() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        SpendVaultWithBatchProposals vaultContract = SpendVaultWithBatchProposals(payable(vaultAddress));
        address manager = factory.getBatchProposalManager();
        
        assertEq(vaultContract.batchProposalManager(), manager);
    }

    // ==================== Edge Case Tests ====================

    function test_ZeroQuorumVault() public {
        vm.prank(user1);
        address vault = factory.createBatchVault(0);
        
        assertNotEq(vault, address(0));
    }

    function test_LargeQuorumVault() public {
        vm.prank(user1);
        address vault = factory.createBatchVault(1000);
        
        assertNotEq(vault, address(0));
    }

    function test_EmptyUserVaultsList() public {
        address[] memory userVaults = factory.getUserBatchVaults(address(0x9999999999999999999999999999999999999999));
        assertEq(userVaults.length, 0);
    }

    // ==================== Vault Functionality Tests ====================

    function test_CreatedVaultCanReceiveETH() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        
        vm.deal(user2, 10 ether);
        vm.prank(user2);
        vault.depositETH{value: 5 ether}();
        
        assertEq(vault.getETHBalance(), 5 ether);
    }

    function test_VaultOwnershipAfterCreation() public {
        vm.prank(user1);
        address vaultAddress = factory.createBatchVault(2);
        
        SpendVaultWithBatchProposals vault = SpendVaultWithBatchProposals(payable(vaultAddress));
        assertEq(vault.owner(), user1);
    }

    // ==================== Concurrent Vault Creation Tests ====================

    function test_ConcurrentVaultCreation() public {
        address[] memory vaults = new address[](5);
        
        for (uint256 i = 0; i < 5; i++) {
            address creator = address(uint160(0x1000000000000000000000000000000000000000 + i));
            vm.prank(creator);
            vaults[i] = factory.createBatchVault(2);
            assertNotEq(vaults[i], address(0));
        }
        
        assertEq(factory.getBatchVaultCount(), 5);
    }

    function test_VaultCreationIndexing() public {
        vm.prank(user1);
        address vault1 = factory.createBatchVault(2);
        
        vm.prank(user2);
        address vault2 = factory.createBatchVault(2);
        
        address[] memory allVaults = factory.getAllBatchVaults();
        assertEq(allVaults[0], vault1);
        assertEq(allVaults[1], vault2);
    }
}
