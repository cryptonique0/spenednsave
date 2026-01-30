// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithDID
/// @notice Vault with DID-based identity and permissions


interface IDIDManager {
    function registerDID(string calldata did, string calldata role) external;
    function updateDID(string calldata did) external;
    function getDID(address account) external view returns (string memory);
    function getRole(address account) external view returns (string memory);
    function requestRecovery(address lostAccount, address newAccount) external;
    function approveRecovery(address lostAccount, address newAccount) external;
    function grantPermission(address account, string calldata permission) external;
    function revokePermission(address account, string calldata permission) external;
    function hasPermission(address account, string calldata permission) external view returns (bool);
}


contract SpendVaultWithDID {
    address public owner;
    address public didManager;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _didManager) {
        owner = msg.sender;
        didManager = _didManager;
    }

    /// @notice Register a DID for the owner with a role
    function registerOwnerDID(string calldata did, string calldata role) external onlyOwner {
        IDIDManager(didManager).registerDID(did, role);
    }

    /// @notice Update the owner's DID
    function updateOwnerDID(string calldata did) external onlyOwner {
        IDIDManager(didManager).updateDID(did);
    }

    /// @notice Get the owner's DID and role
    function getOwnerDID() external view returns (string memory did, string memory role) {
        did = IDIDManager(didManager).getDID(owner);
        role = IDIDManager(didManager).getRole(owner);
    }

    /// @notice Request recovery for the owner (new account must call)
    function requestOwnerRecovery(address newAccount) external {
        IDIDManager(didManager).requestRecovery(owner, newAccount);
    }

    /// @notice Approve recovery for the owner (guardian/owner must call)
    function approveOwnerRecovery(address lostAccount, address newAccount) external {
        IDIDManager(didManager).approveRecovery(lostAccount, newAccount);
    }

    /// @notice Grant a permission to an account
    function grantPermission(address account, string calldata permission) external onlyOwner {
        IDIDManager(didManager).grantPermission(account, permission);
    }

    /// @notice Revoke a permission from an account
    function revokePermission(address account, string calldata permission) external onlyOwner {
        IDIDManager(didManager).revokePermission(account, permission);
    }

    /// @notice Check if an account has a permission
    function hasPermission(address account, string calldata permission) external view returns (bool) {
        return IDIDManager(didManager).hasPermission(account, permission);
    }
}
