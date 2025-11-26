// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimplePayments
 * @notice Minimal contract to receive native payments and allow owner withdrawals.
 * Designed for Celo (EVM compatible). This is intentionally small for contest push.
 */
contract SimplePayments {
    address public owner;
    event Paid(address indexed payer, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    // Accept native payments
    receive() external payable {
        emit Paid(msg.sender, msg.value);
    }

    fallback() external payable {
        emit Paid(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external {
        require(msg.sender == owner, "only owner");
        require(address(this).balance >= amount, "insufficient balance");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        emit Withdraw(to, amount);
    }

    function balance() external view returns (uint256) {
        return address(this).balance;
    }
}
