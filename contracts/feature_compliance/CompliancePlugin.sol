// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CompliancePlugin
/// @notice KYC/AML plugin module for regulated DAOs/treasuries


contract CompliancePlugin {
    // account => KYC/AML status
    mapping(address => bool) public isCompliant;
    address public admin;

    event ComplianceStatusUpdated(address indexed account, bool status, uint256 timestamp);
    event KYCRequested(address indexed account, string provider, uint256 timestamp);
    event KYCVerified(address indexed account, string provider, bool result, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /// @notice Set compliance status (admin only)
    function setComplianceStatus(address account, bool status) external onlyAdmin {
        isCompliant[account] = status;
        emit ComplianceStatusUpdated(account, status, block.timestamp);
    }

    /// @notice Request KYC/AML verification from an external provider
    function requestKYC(address account, string calldata provider) external onlyAdmin {
        emit KYCRequested(account, provider, block.timestamp);
        // Off-chain system should listen and call verifyKYC
    }

    /// @notice Callback for external provider to verify KYC/AML
    function verifyKYC(address account, string calldata provider, bool result) external onlyAdmin {
        isCompliant[account] = result;
        emit KYCVerified(account, provider, result, block.timestamp);
        emit ComplianceStatusUpdated(account, result, block.timestamp);
    }

    /// @notice Check compliance status
    function checkCompliance(address account) external view returns (bool) {
        return isCompliant[account];
    }
}
