// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DIDManager
/// @notice Manages decentralized identities (DIDs) for guardians and owners

contract DIDManager {
    // guardian/owner => DID string
    mapping(address => string) public dids;

    event DIDRegistered(address indexed account, string did, uint256 timestamp);
    event DIDUpdated(address indexed account, string did, uint256 timestamp);

    /// @notice Register a new DID for an account
    function registerDID(string calldata did) external {
        require(bytes(dids[msg.sender]).length == 0, "Already registered");
        dids[msg.sender] = did;
        emit DIDRegistered(msg.sender, did, block.timestamp);
    }

    /// @notice Update an existing DID
    function updateDID(string calldata did) external {
        require(bytes(dids[msg.sender]).length != 0, "Not registered");
        dids[msg.sender] = did;
        emit DIDUpdated(msg.sender, did, block.timestamp);
    }

    /// @notice Get DID for an account
    function getDID(address account) external view returns (string memory) {
        return dids[account];
    }
}
