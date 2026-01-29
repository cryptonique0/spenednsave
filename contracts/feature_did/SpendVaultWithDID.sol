// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithDID
/// @notice Vault with DID-based identity and permissions

interface IDIDManager {
    function registerDID(string calldata did) external;
    function updateDID(string calldata did) external;
    function getDID(address account) external view returns (string memory);
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

    /// @notice Register a DID for the owner
    function registerOwnerDID(string calldata did) external onlyOwner {
        IDIDManager(didManager).registerDID(did);
    }

    /// @notice Update the owner's DID
    function updateOwnerDID(string calldata did) external onlyOwner {
        IDIDManager(didManager).updateDID(did);
    }

    /// @notice Get the owner's DID
    function getOwnerDID() external view returns (string memory) {
        return IDIDManager(didManager).getDID(owner);
    }
}
