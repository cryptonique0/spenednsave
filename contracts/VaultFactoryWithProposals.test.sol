// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/VaultFactoryWithProposals.sol";
import "../mocks/MockGuardianSBT.sol";

contract VaultFactoryWithProposalsTest is Test {
    VaultFactoryWithProposals factory;
    MockGuardianSBT guardianSBT;
    
    address user1 = address(0x1111111111111111111111111111111111111111);
    address user2 = address(0x2222222222222222222222222222222222222222);
    address guardian = address(0x3333333333333333333333333333333333333333);

    function setUp() public {
        guardianSBT = new MockGuardianSBT();
        factory = new VaultFactoryWithProposals(address(guardianSBT));
        guardianSBT.mint(guardian);
    }

    // ==================== Vault Creation Tests ====================

    function test_CreateVault() public {
        vm.prank(user1);
        address vault = factory.createVault(2);
        
        assertTrue(vault != address(0));
        assertTrue(factory.isManagedVault(vault));
    }

    function test_CreateVaultMultipleUsers() public {
        vm.prank(user1);
        address vault1 = factory.createVault(2);
        
        vm.prank(user2);
        address vault2 = factory.createVault(3);
        
        assertTrue(vault1 != vault2);
        assertTrue(factory.isManagedVault(vault1));
        assertTrue(factory.isManagedVault(vault2));
    }

    function test_CreateVaultTracksOwner() public {
        vm.prank(user1);
        address vault = factory.createVault(2);
        
        address[] memory userVaults = factory.getUserVaults(user1);
        assertEq(userVaults.length, 1);
        assertEq(userVaults[0], vault);
    }

    function test_CreateMultipleVaultsPerUser() public {
        vm.prank(user1);
        address vault1 = factory.createVault(2);
        
        vm.prank(user1);
        address vault2 = factory.createVault(3);
        
        address[] memory userVaults = factory.getUserVaults(user1);
        assertEq(userVaults.length, 2);
        assertEq(userVaults[0], vault1);
        assertEq(userVaults[1], vault2);
    }

    // ==================== Vault Enumeration Tests ====================

    function test_GetVaultCount() public {
        assertEq(factory.getVaultCount(), 0);
        
        vm.prank(user1);
        factory.createVault(2);
        assertEq(factory.getVaultCount(), 1);
        
        vm.prank(user2);
        factory.createVault(2);
        assertEq(factory.getVaultCount(), 2);
    }

    function test_GetAllVaults() public {
        vm.prank(user1);
        address vault1 = factory.createVault(2);
        
        vm.prank(user2);
        address vault2 = factory.createVault(2);
        
        address[] memory allVaults = factory.getAllVaults();
        assertEq(allVaults.length, 2);
        assertTrue(
            (allVaults[0] == vault1 && allVaults[1] == vault2) ||
            (allVaults[0] == vault2 && allVaults[1] == vault1)
        );
    }

    function test_IsManagedVault() public {
        address unmanagedVault = address(0x9999999999999999999999999999999999999999);
        assertFalse(factory.isManagedVault(unmanagedVault));
        
        vm.prank(user1);
        address vault = factory.createVault(2);
        
        assertTrue(factory.isManagedVault(vault));
    }

    // ==================== User Vault Queries ====================

    function test_GetUserVaultCount() public {
        assertEq(factory.getUserVaultCount(user1), 0);
        
        vm.prank(user1);
        factory.createVault(2);
        assertEq(factory.getUserVaultCount(user1), 1);
        
        vm.prank(user1);
        factory.createVault(3);
        assertEq(factory.getUserVaultCount(user1), 2);
    }

    function test_GetUserVaults() public {
        vm.prank(user1);
        address vault1 = factory.createVault(2);
        
        vm.prank(user1);
        address vault2 = factory.createVault(3);
        
        address[] memory userVaults = factory.getUserVaults(user1);
        assertEq(userVaults.length, 2);
    }

    // ==================== Proposal Manager Tests ====================

    function test_GetProposalManager() public {
        address manager = factory.getProposalManager();
        assertTrue(manager != address(0));
    }

    function test_ProposalManagerIsSingleInstance() public {
        address manager1 = factory.getProposalManager();
        address manager2 = factory.getProposalManager();
        
        assertEq(manager1, manager2);
    }

    // ==================== Factory Consistency Tests ====================

    function test_CreatedVaultIsConfigured() public {
        vm.prank(user1);
        address vault = factory.createVault(2);
        
        // Verify vault is properly configured
        assertTrue(vault != address(0));
        assertTrue(factory.isManagedVault(vault));
    }

    function test_MultipleFactoryInstances() public {
        VaultFactoryWithProposals factory2 = new VaultFactoryWithProposals(address(guardianSBT));
        
        vm.prank(user1);
        address vault1 = factory.createVault(2);
        
        vm.prank(user2);
        address vault2 = factory2.createVault(2);
        
        assertTrue(factory.isManagedVault(vault1));
        assertTrue(factory2.isManagedVault(vault2));
        assertFalse(factory.isManagedVault(vault2));
        assertFalse(factory2.isManagedVault(vault1));
    }

    // ==================== Empty State Tests ====================

    function test_EmptyFactoryState() public {
        assertEq(factory.getVaultCount(), 0);
        assertEq(factory.getAllVaults().length, 0);
        assertEq(factory.getUserVaultCount(user1), 0);
        assertEq(factory.getUserVaults(user1).length, 0);
    }

    function test_UserWithNoVaults() public {
        vm.prank(user1);
        factory.createVault(2);
        
        assertEq(factory.getUserVaultCount(user2), 0);
        assertEq(factory.getUserVaults(user2).length, 0);
    }
}
