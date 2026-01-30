// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DIDManager
/// @notice Manages decentralized identities (DIDs) for guardians and owners


contract DIDManager {
    // guardian/owner => DID string
    mapping(address => string) public dids;

    // guardian/owner => role ("owner", "guardian", etc.)
    mapping(address => string) public roles;

    // Recovery requests: lost account => new account => approved
    mapping(address => mapping(address => bool)) public recoveryRequests;

    // Permissions: account => permission string => granted
    mapping(address => mapping(string => bool)) public permissions;

    event DIDRegistered(address indexed account, string did, uint256 timestamp);
    event DIDUpdated(address indexed account, string did, uint256 timestamp);
    event RoleAssigned(address indexed account, string role, uint256 timestamp);
    event RecoveryRequested(address indexed lostAccount, address indexed newAccount, uint256 timestamp);
    event RecoveryApproved(address indexed lostAccount, address indexed newAccount, uint256 timestamp);
    event PermissionGranted(address indexed account, string permission, uint256 timestamp);
    event PermissionRevoked(address indexed account, string permission, uint256 timestamp);

    /// @notice Register a new DID for an account
    function registerDID(string calldata did, string calldata role) external {
        require(bytes(dids[msg.sender]).length == 0, "Already registered");
        dids[msg.sender] = did;
        roles[msg.sender] = role;
        emit DIDRegistered(msg.sender, did, block.timestamp);
        emit RoleAssigned(msg.sender, role, block.timestamp);
    }

    /// @notice Update an existing DID
    function updateDID(string calldata did) external {
        require(bytes(dids[msg.sender]).length != 0, "Not registered");
        dids[msg.sender] = did;
        emit DIDUpdated(msg.sender, did, block.timestamp);
    }

    /// @notice Assign a new role to an account
    function assignRole(address account, string calldata role) external {
        // TODO: access control (e.g., only owner or admin)
        roles[account] = role;
        emit RoleAssigned(account, role, block.timestamp);
    }

    /// @notice Request recovery for a lost account
    function requestRecovery(address lostAccount, address newAccount) external {
        require(msg.sender == newAccount, "Only new account can request");
        recoveryRequests[lostAccount][newAccount] = false;
        emit RecoveryRequested(lostAccount, newAccount, block.timestamp);
    }

    /// @notice Approve recovery for a lost account (by guardian/owner)
    function approveRecovery(address lostAccount, address newAccount) external {
        // TODO: access control (e.g., only guardian/owner)
        recoveryRequests[lostAccount][newAccount] = true;
        emit RecoveryApproved(lostAccount, newAccount, block.timestamp);
    }

    /// @notice Grant a permission to an account
    function grantPermission(address account, string calldata permission) external {
        // TODO: access control (e.g., only owner/admin)
        permissions[account][permission] = true;
        emit PermissionGranted(account, permission, block.timestamp);
    }

    /// @notice Revoke a permission from an account
    function revokePermission(address account, string calldata permission) external {
        // TODO: access control (e.g., only owner/admin)
        permissions[account][permission] = false;
        emit PermissionRevoked(account, permission, block.timestamp);
    }

    /// @notice Check if an account has a permission
    function hasPermission(address account, string calldata permission) external view returns (bool) {
        return permissions[account][permission];
    }

    /// @notice Get DID for an account
    function getDID(address account) external view returns (string memory) {
        return dids[account];
    }

    /// @notice Get role for an account
    function getRole(address account) external view returns (string memory) {
        return roles[account];
    }
}
