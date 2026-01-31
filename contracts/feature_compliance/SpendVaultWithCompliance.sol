// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SpendVaultWithCompliance
/// @notice Vault with on-chain compliance (KYC/AML) integration

interface ICompliancePlugin {
    function checkCompliance(address account) external view returns (bool);
}

contract SpendVaultWithCompliance {
    address public owner;
    address public compliancePlugin;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _compliancePlugin) {
        owner = msg.sender;
        compliancePlugin = _compliancePlugin;
    }

    /// @notice Withdraw funds if compliant
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(ICompliancePlugin(compliancePlugin).checkCompliance(owner), "Not KYC/AML compliant");
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Transfer failed");
    }

    /// @notice Deposit ETH
    function deposit() external payable {}
}
