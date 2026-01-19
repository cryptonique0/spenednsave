// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SpendVaultWithPausing.sol";
import "../contracts/VaultFactoryWithPausing.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock Guardian SBT for testing
contract MockGuardianSBT is ERC721 {
    uint256 private tokenId = 0;

    constructor() ERC721("Guardian", "GUARD") {}

    function mint(address to) external returns (uint256) {
        _safeMint(to, tokenId);
        return tokenId++;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

// Mock ERC20 for testing
contract MockToken is ERC20 {
    constructor() ERC20("Mock", "MOCK") {
        _mint(msg.sender, 10000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SpendVaultWithPausingTest is Test {
    VaultFactoryWithPausing factory;
    SpendVaultWithPausing vault;
    MockGuardianSBT guardianSBT;
    MockToken mockToken;

    address owner = address(0x1111111111111111111111111111111111111111);
    address guardian1 = address(0x2222222222222222222222222222222222222222);
    address guardian2 = address(0x3333333333333333333333333333333333333333);
    address recipient = address(0x4444444444444444444444444444444444444444);
    address attacker = address(0x5555555555555555555555555555555555555555);

    function setUp() public {
        // Deploy mock contracts
        guardianSBT = new MockGuardianSBT();
        mockToken = new MockToken();

        // Deploy factory
        factory = new VaultFactoryWithPausing(address(guardianSBT));

        // Create vault with owner
        vm.prank(owner);
        address vaultAddress = factory.createVault(2);
        vault = SpendVaultWithPausing(payable(vaultAddress));

        // Mint guardian tokens
        guardianSBT.mint(guardian1);
        guardianSBT.mint(guardian2);

        // Fund vault
        vm.deal(address(vault), 100 ether);
        mockToken.transfer(address(vault), 1000 * 10**18);
    }

    // ==================== Deposit Tests ====================

    function test_DepositETH() public {
        uint256 balanceBefore = address(vault).balance;

        vm.prank(owner);
        (bool success, ) = address(vault).call{value: 10 ether}("");
        require(success);

        assertEq(address(vault).balance, balanceBefore + 10 ether);
    }

    function test_DepositToken() public {
        mockToken.approve(address(vault), 100 * 10**18);

        vault.deposit(address(mockToken), 100 * 10**18);

        assertEq(mockToken.balanceOf(address(vault)), 1000 * 10**18 + 100 * 10**18);
    }

    function test_DepositETHWhilePaused() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Testing pause");

        uint256 balanceBefore = address(vault).balance;

        vm.prank(owner);
        (bool success, ) = address(vault).call{value: 5 ether}("");
        require(success);

        // Deposit should still work while paused
        assertEq(address(vault).balance, balanceBefore + 5 ether);
    }

    function test_DepositTokenWhilePaused() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Testing pause");

        mockToken.approve(address(vault), 100 * 10**18);

        vault.deposit(address(mockToken), 100 * 10**18);

        // Deposit should still work while paused
        assertEq(mockToken.balanceOf(address(vault)), 1000 * 10**18 + 100 * 10**18);
    }

    // ==================== Withdrawal Tests (Pause Blocking) ====================

    function test_WithdrawalBlockedWhenPaused() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Emergency pause");

        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked("dummy_signature");

        vm.prank(owner);
        vm.expectRevert("Vault is paused - withdrawals disabled");
        vault.withdraw(
            address(0),
            1 ether,
            recipient,
            "Test withdrawal",
            signatures
        );
    }

    function test_WithdrawalAllowedWhenNotPaused() public {
        // Prepare signatures (simplified for testing)
        bytes[] memory signatures = new bytes[](2);

        // For this test, we need valid signatures from guardians
        // This is simplified; real tests would use proper signing

        vm.prank(owner);
        // This will fail on signature verification but the pause check passes first
        vm.expectRevert("Invalid guardian");
        vault.withdraw(
            address(0),
            1 ether,
            recipient,
            "Test withdrawal",
            signatures
        );
    }

    // ==================== Pause Status Check Tests ====================

    function test_IsVaultPaused() public {
        assertFalse(vault.isVaultPaused());

        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Pause");

        assertTrue(vault.isVaultPaused());
    }

    function test_GetVaultPauseReason() public {
        string memory reason = "Security maintenance";

        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), reason);

        assertEq(vault.getVaultPauseReason(), reason);
    }

    function test_GetVaultPauseTime() public {
        uint256 beforePause = block.timestamp;

        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Pause");

        uint256 pauseTime = vault.getVaultPauseTime();

        assertTrue(pauseTime >= beforePause);
        assertTrue(pauseTime <= block.timestamp);
    }

    function test_GetVaultPauseElapsedTime() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Pause");

        uint256 elapsedBefore = vault.getVaultPauseElapsedTime();
        assertEq(elapsedBefore, 0);

        vm.warp(block.timestamp + 1 hours);

        uint256 elapsedAfter = vault.getVaultPauseElapsedTime();
        assertTrue(elapsedAfter >= 1 hours);
    }

    // ==================== Balance Check Tests ====================

    function test_GetETHBalance() public {
        uint256 balance = vault.getETHBalance();
        assertEq(balance, 100 ether);
    }

    function test_GetTokenBalance() public {
        uint256 balance = vault.getTokenBalance(address(mockToken));
        assertEq(balance, 1000 * 10**18);
    }

    // ==================== Configuration Tests ====================

    function test_SetQuorum() public {
        vm.prank(owner);
        vault.setQuorum(3);

        // Would need getter to verify, but this tests no revert
    }

    function test_SetQuorumRejectsZero() public {
        vm.prank(owner);
        vm.expectRevert("Quorum must be at least 1");
        vault.setQuorum(0);
    }

    function test_UpdateGuardianToken() public {
        MockGuardianSBT newSBT = new MockGuardianSBT();

        vm.prank(owner);
        vault.updateGuardianToken(address(newSBT));

        // Test passes if no revert
    }

    function test_UpdatePausingController() public {
        // Create new controller
        VaultPausingController newController = new VaultPausingController();
        newController.registerVault(address(vault));

        vm.prank(owner);
        vault.updatePausingController(address(newController));

        // Test passes if no revert
    }

    // ==================== Emergency Unlock Tests ====================

    function test_EmergencyUnlockBlockedWhenPaused() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Emergency pause");

        vm.prank(owner);
        vm.expectRevert("Vault is paused - emergency unlock disabled");
        vault.requestEmergencyUnlock();
    }

    function test_EmergencyUnlockAllowedWhenNotPaused() public {
        vm.prank(owner);
        vault.requestEmergencyUnlock();

        // Should not revert
    }

    function test_CancelEmergencyUnlock() public {
        vm.prank(owner);
        vault.requestEmergencyUnlock();

        vm.prank(owner);
        vault.cancelEmergencyUnlock();

        // Should not revert
    }

    // ==================== Event Emission Tests ====================

    function test_DepositEmitsEvent() public {
        mockToken.approve(address(vault), 100 * 10**18);

        vm.expectEmit(true, false, false, true);
        emit SpendVaultWithPausing.TokenDeposited(address(mockToken), 100 * 10**18, block.timestamp);

        vault.deposit(address(mockToken), 100 * 10**18);
    }

    function test_DepositWhilePausedEmitsSpecialEvent() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Paused");

        mockToken.approve(address(vault), 100 * 10**18);

        vm.expectEmit(true, false, false, true);
        emit SpendVaultWithPausing.DepositReceivedWhilePaused(
            address(mockToken),
            100 * 10**18,
            block.timestamp
        );

        vault.deposit(address(mockToken), 100 * 10**18);
    }

    // ==================== Nonce Tests ====================

    function test_GetNonce() public {
        uint256 nonce = vault.getNonce();
        assertEq(nonce, 0);
    }

    // ==================== Domain Separator Tests ====================

    function test_GetDomainSeparator() public {
        bytes32 separator = vault.getDomainSeparator();
        assertTrue(separator != bytes32(0));
    }

    // ==================== Factory Integration Tests ====================

    function test_FactoryCreatesVault() public {
        vm.prank(owner);
        address newVault = factory.createVault(2);

        assertTrue(factory.isManagedVault(newVault));
    }

    function test_FactoryVaultCanBePaused() public {
        vm.prank(owner);
        address newVault = factory.createVault(2);

        assertTrue(factory.isVaultPaused(newVault) == false);
    }

    function test_FactoryReturnsVaultPauseReason() public {
        vm.prank(owner);
        address newVault = factory.createVault(2);

        factory.getPausingController().pauseVault(newVault, "Test reason");

        assertEq(factory.getVaultPauseReason(newVault), "Test reason");
    }

    function test_FactoryTracksUserVaults() public {
        vm.prank(owner);
        address vault1 = factory.createVault(2);

        vm.prank(owner);
        address vault2 = factory.createVault(2);

        address[] memory vaults = factory.getUserVaults(owner);

        assertTrue(vaults.length >= 2);
    }

    // ==================== Pause Reason Update Integration ====================

    function test_VaultIntegrationUpdatePauseReason() public {
        vm.prank(owner);
        factory.getPausingController().pauseVault(address(vault), "Initial reason");

        vm.prank(owner);
        factory.getPausingController().updatePauseReason(address(vault), "Updated reason");

        assertEq(vault.getVaultPauseReason(), "Updated reason");
    }
}
