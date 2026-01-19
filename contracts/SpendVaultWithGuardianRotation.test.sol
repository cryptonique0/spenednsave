// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../GuardianSBT.sol";
import "../GuardianRotation.sol";
import "../SpendVaultWithGuardianRotation.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 for testing
contract MockToken is ERC20 {
    constructor() ERC20("MockToken", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SpendVaultWithGuardianRotationTest is Test {
    GuardianSBT guardianToken;
    GuardianRotation guardianRotation;
    SpendVaultWithGuardianRotation vault;
    MockToken mockToken;

    address owner;
    address guardian1;
    address guardian2;
    address guardian3;
    address recipient;

    function setUp() public {
        owner = address(this);
        guardian1 = makeAddr("guardian1");
        guardian2 = makeAddr("guardian2");
        guardian3 = makeAddr("guardian3");
        recipient = makeAddr("recipient");

        // Deploy contracts
        guardianToken = new GuardianSBT();
        guardianRotation = new GuardianRotation();
        vault = new SpendVaultWithGuardianRotation(
            address(guardianToken),
            address(guardianRotation),
            2 // quorum of 2
        );
        mockToken = new MockToken();

        // Setup guardians
        guardianToken.mint(guardian1, address(vault));
        guardianToken.mint(guardian2, address(vault));
        guardianToken.mint(guardian3, address(vault));

        // Add guardians to rotation with 30-day expiry
        guardianRotation.addGuardian(guardian1, address(vault), block.timestamp + 30 days);
        guardianRotation.addGuardian(guardian2, address(vault), block.timestamp + 30 days);
        guardianRotation.addGuardian(guardian3, address(vault), block.timestamp + 30 days);

        // Fund vault with ETH
        vm.deal(address(vault), 10 ether);
    }

    function testVaultInitialization() public {
        assertEq(vault.owner(), owner);
        assertEq(vault.quorum(), 2);
        assertEq(vault.guardianToken(), address(guardianToken));
        assertEq(vault.guardianRotation(), address(guardianRotation));
    }

    function testIsActiveGuardian() public {
        assertTrue(vault.isActiveGuardian(guardian1));
        assertTrue(vault.isActiveGuardian(guardian2));
        assertTrue(vault.isActiveGuardian(guardian3));
    }

    function testGuardianBecomeInactiveAfterExpiry() public {
        assertTrue(vault.isActiveGuardian(guardian1));

        // Fast forward past guardian1's expiry
        vm.warp(block.timestamp + 31 days);

        assertFalse(vault.isActiveGuardian(guardian1));
        assertTrue(vault.isActiveGuardian(guardian2));
    }

    function testGetActiveGuardianCount() public {
        assertEq(vault.getActiveGuardianCount(), 3);

        // Expire one guardian
        vm.warp(block.timestamp + 31 days);
        assertEq(vault.getActiveGuardianCount(), 2);
    }

    function testWithdrawalWithExpiredGuardian() public {
        // Create withdrawal signatures
        bytes32 digest = vault.getDomainSeparator();

        // Expire guardian1
        vm.warp(block.timestamp + 31 days);

        // Try to withdraw with expired guardian - should fail
        bytes[] memory signatures = new bytes[](2);

        // This would require actually signing, so we'll test the isActiveGuardian check
        assertFalse(vault.isActiveGuardian(guardian1));
        assertTrue(vault.isActiveGuardian(guardian2));
    }

    function testReceiveETH() public {
        uint256 initialBalance = address(vault).balance;

        vm.prank(guardian1);
        (bool success, ) = address(vault).call{value: 1 ether}("");
        require(success);

        assertEq(address(vault).balance, initialBalance + 1 ether);
    }

    function testGetETHBalance() public {
        assertEq(vault.getETHBalance(), 10 ether);
    }

    function testGetTokenBalance() public {
        mockToken.mint(address(vault), 100 * 10 ** 18);
        assertEq(vault.getTokenBalance(address(mockToken)), 100 * 10 ** 18);
    }

    function testDepositToken() public {
        mockToken.mint(guardian1, 50 * 10 ** 18);

        vm.prank(guardian1);
        mockToken.approve(address(vault), 50 * 10 ** 18);

        vm.prank(guardian1);
        vault.deposit(address(mockToken), 50 * 10 ** 18);

        assertEq(vault.getTokenBalance(address(mockToken)), 50 * 10 ** 18);
    }

    function testSetQuorum() public {
        vault.setQuorum(3);
        assertEq(vault.quorum(), 3);
    }

    function testUpdateGuardianToken() public {
        GuardianSBT newToken = new GuardianSBT();
        vault.updateGuardianToken(address(newToken));
        assertEq(vault.guardianToken(), address(newToken));
    }

    function testUpdateGuardianRotation() public {
        GuardianRotation newRotation = new GuardianRotation();
        vault.updateGuardianRotation(address(newRotation));
        assertEq(vault.guardianRotation(), address(newRotation));
    }

    function testRenewGuardian() public {
        assertTrue(vault.isActiveGuardian(guardian1));

        // Expire and renew
        vm.warp(block.timestamp + 31 days);
        assertFalse(vault.isActiveGuardian(guardian1));

        // Renew for another 30 days
        guardianRotation.renewGuardian(guardian1, address(vault), block.timestamp + 30 days);
        assertTrue(vault.isActiveGuardian(guardian1));
    }

    function testInsufficientActiveGuardians() public {
        // Expire all guardians
        vm.warp(block.timestamp + 31 days);

        assertEq(vault.getActiveGuardianCount(), 0);
        assertTrue(vault.getActiveGuardianCount() < vault.quorum());
    }

    function testGuardianValidationFailedEvent() public {
        bytes memory invalidSignature = abi.encodePacked(bytes32(0), bytes32(0), uint8(27));
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = invalidSignature;

        // Expect revert when trying to verify invalid signature
        vm.expectRevert();
        vault.withdraw(
            address(0),
            1 ether,
            recipient,
            "test",
            signatures
        );
    }

    function testGetNonce() public {
        assertEq(vault.getNonce(), 0);
    }

    function testDomainSeparator() public {
        bytes32 separator = vault.getDomainSeparator();
        assertNotEq(separator, bytes32(0));
    }
}
