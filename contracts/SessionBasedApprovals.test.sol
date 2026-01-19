// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/SessionBasedApprovalsVault.sol";
import "../contracts/GuardianSBT.sol";

/**
 * @title SessionBasedApprovalsVault Tests
 * @notice Comprehensive test suite for session-based approvals
 */
contract SessionBasedApprovalsVaultTest is Test {
    SessionBasedApprovalsVault vault;
    GuardianSBT guardianSBT;

    address owner;
    address guardian1;
    address guardian2;
    address guardian3;
    address recipient1;
    address recipient2;

    bytes32 sessionId;

    function setUp() public {
        // Setup actors
        owner = makeAddr("owner");
        guardian1 = makeAddr("guardian1");
        guardian2 = makeAddr("guardian2");
        guardian3 = makeAddr("guardian3");
        recipient1 = makeAddr("recipient1");
        recipient2 = makeAddr("recipient2");

        // Deploy GuardianSBT
        vm.prank(owner);
        guardianSBT = new GuardianSBT();

        // Deploy vault
        vm.prank(owner);
        vault = new SessionBasedApprovalsVault(address(guardianSBT));

        // Mint guardian tokens
        vm.prank(owner);
        guardianSBT.mint(guardian1);

        vm.prank(owner);
        guardianSBT.mint(guardian2);

        vm.prank(owner);
        guardianSBT.mint(guardian3);

        // Fund vault with ETH
        vm.deal(address(vault), 1000 ether);
    }

    // ============ Session Creation Tests ============

    function test_CreateSession_ByOwner() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,        // duration
            100 ether,     // totalApproved
            "Marketing",   // purpose
            false,         // requiresApproval
            new address[](0)  // recipients
        );

        assertNotEq(id, bytes32(0));
        
        // Session should be immediately active (owner)
        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertTrue(session.isActive);
        assertEq(session.totalApproved, 100 ether);
    }

    function test_CreateSession_ByGuardian() public {
        vm.prank(guardian1);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,
            "Operations",
            false,
            new address[](0)
        );

        assertNotEq(id, bytes32(0));

        // Session should be pending (needs approval)
        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertFalse(session.isActive);
        assertEq(session.approvalsReceived, 0);
    }

    function test_CreateSession_DurationTooShort() public {
        vm.prank(owner);
        vm.expectRevert("Duration too short");
        vault.createSession(
            10 seconds,  // Too short
            100 ether,
            "Test",
            false,
            new address[](0)
        );
    }

    function test_CreateSession_DurationTooLong() public {
        vm.prank(owner);
        vm.expectRevert("Duration too long");
        vault.createSession(
            31 days,  // Too long
            100 ether,
            "Test",
            false,
            new address[](0)
        );
    }

    function test_CreateSession_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert("Amount must be positive");
        vault.createSession(
            1 days,
            0,  // Zero amount
            "Test",
            false,
            new address[](0)
        );
    }

    function test_CreateSession_NoPurpose() public {
        vm.prank(owner);
        vm.expectRevert("Purpose required");
        vault.createSession(
            1 days,
            100 ether,
            "",  // Empty purpose
            false,
            new address[](0)
        );
    }

    // ============ Session Approval Tests ============

    function test_ApproveSession() public {
        // Guardian creates session
        vm.prank(guardian1);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,
            "Operations",
            false,
            new address[](0)
        );

        // Guardian 2 approves
        vm.prank(guardian2);
        vault.approveSession(id);

        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertTrue(session.isActive); // Should be active after quorum
    }

    function test_ApproveSession_AlreadyApproved() public {
        vm.prank(guardian1);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,
            "Operations",
            false,
            new address[](0)
        );

        vm.prank(guardian2);
        vault.approveSession(id);

        // Try to approve again
        vm.prank(guardian2);
        vm.expectRevert("Already approved");
        vault.approveSession(id);
    }

    function test_ApproveSession_NotGuardian() public {
        vm.prank(guardian1);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,
            "Operations",
            false,
            new address[](0)
        );

        // Non-guardian tries to approve
        address nonGuardian = makeAddr("nonGuardian");
        vm.prank(nonGuardian);
        vm.expectRevert("Only guardians");
        vault.approveSession(id);
    }

    // ============ Session Spending Tests ============

    function test_SpendFromSession_Success() public {
        // Create session by owner (immediately active)
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        // Spend from session
        vm.prank(guardian1);
        vault.spendFromSession(
            id,
            address(0),  // ETH
            10 ether,
            recipient1,
            "Ad spend"
        );

        uint256 remaining = vault.getSessionRemaining(id);
        assertEq(remaining, 90 ether);
    }

    function test_SpendFromSession_ExceedsLimit() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,  // Only 50 approved
            "Marketing",
            false,
            new address[](0)
        );

        vm.prank(guardian1);
        vm.expectRevert("Exceeds session limit");
        vault.spendFromSession(
            id,
            address(0),
            100 ether,  // Try to spend 100
            recipient1,
            "Ad spend"
        );
    }

    function test_SpendFromSession_Expired() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        // Warp time past expiration
        vm.warp(block.timestamp + 2 days);

        vm.prank(guardian1);
        vm.expectRevert("Session expired");
        vault.spendFromSession(
            id,
            address(0),
            10 ether,
            recipient1,
            "Ad spend"
        );
    }

    function test_SpendFromSession_WithRecipientRestriction() public {
        address[] memory allowedRecipients = new address[](1);
        allowedRecipients[0] = recipient1;

        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            allowedRecipients
        );

        // Try to spend to non-allowed recipient
        vm.prank(guardian1);
        vm.expectRevert("Recipient not approved for session");
        vault.spendFromSession(
            id,
            address(0),
            10 ether,
            recipient2,  // Not allowed
            "Ad spend"
        );

        // Spend to allowed recipient succeeds
        vm.prank(guardian1);
        vault.spendFromSession(
            id,
            address(0),
            10 ether,
            recipient1,  // Allowed
            "Ad spend"
        );
    }

    function test_SpendFromSession_DeactivatesOnFullSpend() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            50 ether,  // Exact amount
            "Marketing",
            false,
            new address[](0)
        );

        vm.prank(guardian1);
        vault.spendFromSession(
            id,
            address(0),
            50 ether,  // Spend all
            recipient1,
            "Full spend"
        );

        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertFalse(session.isActive); // Should be auto-deactivated
    }

    // ============ Session Management Tests ============

    function test_DeactivateSession() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        SessionBasedApprovalsVault.SpendingSession memory sessionBefore = vault.getSession(id);
        assertTrue(sessionBefore.isActive);

        vm.prank(owner);
        vault.deactivateSession(id, "Budget change");

        SessionBasedApprovalsVault.SpendingSession memory sessionAfter = vault.getSession(id);
        assertFalse(sessionAfter.isActive);
    }

    function test_DeactivateSession_NotAuthorized() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        address nonAuth = makeAddr("nonAuth");
        vm.prank(nonAuth);
        vm.expectRevert("Not authorized");
        vault.deactivateSession(id, "Test");
    }

    function test_ExpireSession() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        // Warp past expiration
        vm.warp(block.timestamp + 2 days);

        vault.expireSession(id);

        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertFalse(session.isActive);
    }

    // ============ Recipient Management Tests ============

    function test_AddSessionRecipient() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        vm.prank(owner);
        vault.addSessionRecipient(id, recipient1);

        address[] memory recipients = vault.getSessionRecipients(id);
        assertEq(recipients.length, 1);
        assertEq(recipients[0], recipient1);
    }

    function test_RemoveSessionRecipient() public {
        address[] memory initialRecipients = new address[](1);
        initialRecipients[0] = recipient1;

        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            initialRecipients
        );

        vm.prank(owner);
        vault.removeSessionRecipient(id, recipient1);

        address[] memory recipients = vault.getSessionRecipients(id);
        assertEq(recipients.length, 0);
    }

    // ============ View Function Tests ============

    function test_IsSessionValid() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        assertTrue(vault.isSessionValid(id));

        vm.warp(block.timestamp + 2 days);
        assertFalse(vault.isSessionValid(id));
    }

    function test_GetSessionTimeRemaining() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        uint256 remaining = vault.getSessionTimeRemaining(id);
        assertApproxEqAbs(remaining, 1 days, 1);
    }

    function test_GetSessionRemaining() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(
            1 days,
            100 ether,
            "Marketing",
            false,
            new address[](0)
        );

        assertEq(vault.getSessionRemaining(id), 100 ether);

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 30 ether, recipient1, "Spend");

        assertEq(vault.getSessionRemaining(id), 70 ether);
    }

    function test_GetActiveSessions() public {
        // Create multiple sessions
        vm.prank(owner);
        bytes32 id1 = vault.createSession(1 days, 100 ether, "Session 1", false, new address[](0));

        vm.prank(owner);
        bytes32 id2 = vault.createSession(1 days, 100 ether, "Session 2", false, new address[](0));

        bytes32[] memory active = vault.getActiveSessions();
        assertEq(active.length, 2);
    }

    // ============ Configuration Tests ============

    function test_SetMinSessionDuration() public {
        vm.prank(owner);
        vault.setMinSessionDuration(5 minutes);

        // Should now accept 5 minute sessions
        vm.prank(owner);
        bytes32 id = vault.createSession(5 minutes, 100 ether, "Test", false, new address[](0));
        assertNotEq(id, bytes32(0));
    }

    function test_SetMaxSessionDuration() public {
        vm.prank(owner);
        vault.setMaxSessionDuration(7 days);

        vm.prank(owner);
        bytes32 id = vault.createSession(7 days, 100 ether, "Test", false, new address[](0));
        assertNotEq(id, bytes32(0));
    }

    function test_SetDefaultApprovalQuorum() public {
        vm.prank(owner);
        vault.setDefaultApprovalQuorum(3);

        vm.prank(guardian1);
        bytes32 id = vault.createSession(1 days, 50 ether, "Operations", false, new address[](0));

        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertEq(session.approvalsRequired, 3);
    }

    // ============ Balance Tests ============

    function test_GetETHBalance() public {
        assertEq(vault.getETHBalance(), 1000 ether);
    }

    function test_ReceiveETH() public {
        uint256 sendAmount = 10 ether;
        (bool success, ) = payable(address(vault)).call{value: sendAmount}("");
        require(success, "Send failed");

        assertEq(vault.getETHBalance(), 1010 ether);
    }

    // ============ Spending Records Tests ============

    function test_GetSessionSpends() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(1 days, 100 ether, "Marketing", false, new address[](0));

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 10 ether, recipient1, "Spend 1");

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 20 ether, recipient2, "Spend 2");

        SessionBasedApprovalsVault.SessionSpend[] memory spends = vault.getSessionSpends(id);
        assertEq(spends.length, 2);
        assertEq(spends[0].amount, 10 ether);
        assertEq(spends[1].amount, 20 ether);
    }

    function test_GetSessionTokenSpent() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(1 days, 100 ether, "Marketing", false, new address[](0));

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 30 ether, recipient1, "Spend");

        uint256 spent = vault.getSessionTokenSpent(id, address(0));
        assertEq(spent, 30 ether);
    }

    // ============ Security Tests ============

    function test_OnlyOwner_SetMinDuration() public {
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        vm.expectRevert("Only owner");
        vault.setMinSessionDuration(5 minutes);
    }

    function test_OnlyGuardian_CreateSession() public {
        address nonGuardian = makeAddr("nonGuardian");
        vm.prank(nonGuardian);
        vm.expectRevert("Only guardians");
        vault.createSession(1 days, 100 ether, "Test", false, new address[](0));
    }

    // ============ Edge Case Tests ============

    function test_MultipleSpends_PartialBudget() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(1 days, 100 ether, "Marketing", false, new address[](0));

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 25 ether, recipient1, "Spend 1");

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 25 ether, recipient2, "Spend 2");

        vm.prank(guardian1);
        vault.spendFromSession(id, address(0), 25 ether, recipient1, "Spend 3");

        SessionBasedApprovalsVault.SpendingSession memory session = vault.getSession(id);
        assertEq(session.totalSpent, 75 ether);
        assertFalse(session.isActive); // Not deactivated yet
    }

    function test_SessionHistory() public {
        vm.prank(owner);
        bytes32 id1 = vault.createSession(1 days, 100 ether, "Session 1", false, new address[](0));

        vm.prank(owner);
        bytes32 id2 = vault.createSession(1 days, 50 ether, "Session 2", false, new address[](0));

        assertEq(vault.getSessionHistoryLength(), 2);
        assertEq(vault.getSessionByIndex(0), id1);
        assertEq(vault.getSessionByIndex(1), id2);
    }

    function test_IsRecipientAllowed_NoRestrictions() public {
        vm.prank(owner);
        bytes32 id = vault.createSession(1 days, 100 ether, "Marketing", false, new address[](0));

        // All recipients allowed when no restrictions
        assertTrue(vault.isRecipientAllowed(id, recipient1));
        assertTrue(vault.isRecipientAllowed(id, recipient2));
    }

    function test_IsRecipientAllowed_WithRestrictions() public {
        address[] memory allowed = new address[](1);
        allowed[0] = recipient1;

        vm.prank(owner);
        bytes32 id = vault.createSession(1 days, 100 ether, "Marketing", false, allowed);

        assertTrue(vault.isRecipientAllowed(id, recipient1));
        assertFalse(vault.isRecipientAllowed(id, recipient2));
    }
}
