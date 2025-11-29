// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimplePayments
 * @notice Enhanced payment contract with multiple features for Celo blockchain.
 * Features: payment tracking, multi-recipient withdrawals, payment history, and emergency pause.
 */
contract SimplePayments {
    address public owner;
    bool public paused;
    uint256 public totalReceived;
    uint256 public totalWithdrawn;
    
    struct Payment {
        address payer;
        uint256 amount;
        uint256 timestamp;
        string memo;
    }
    
    Payment[] public paymentHistory;
    mapping(address => uint256) public totalPaidByAddress;
    
    event Paid(address indexed payer, uint256 amount, string memo);
    event Withdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "contract is paused");
        _;
    }

    constructor() {
        owner = msg.sender;
        paused = false;
    }

    // Accept native payments with optional memo
    receive() external payable whenNotPaused {
        _recordPayment("");
    }

    fallback() external payable whenNotPaused {
        _recordPayment("");
    }

    /**
     * @notice Make a payment with a memo/note
     * @param memo Optional message to attach to the payment
     */
    function payWithMemo(string memory memo) external payable whenNotPaused {
        require(msg.value > 0, "payment must be greater than 0");
        _recordPayment(memo);
    }

    /**
     * @notice Internal function to record payment details
     */
    function _recordPayment(string memory memo) internal {
        totalReceived += msg.value;
        totalPaidByAddress[msg.sender] += msg.value;
        
        paymentHistory.push(Payment({
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            memo: memo
        }));
        
        emit Paid(msg.sender, msg.value, memo);
    }

    /**
     * @notice Withdraw funds to a single address
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "insufficient balance");
        require(to != address(0), "invalid recipient");
        
        totalWithdrawn += amount;
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "transfer failed");
        
        emit Withdraw(to, amount);
    }

    /**
     * @notice Withdraw entire balance to owner
     */
    function withdrawAll() external onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "no balance to withdraw");
        
        totalWithdrawn += amount;
        (bool ok, ) = payable(owner).call{value: amount}("");
        require(ok, "transfer failed");
        
        emit Withdraw(owner, amount);
    }

    /**
     * @notice Batch withdraw to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts corresponding to each recipient
     */
    function batchWithdraw(address payable[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "arrays length mismatch");
        require(recipients.length > 0, "empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(address(this).balance >= totalAmount, "insufficient balance");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "invalid recipient");
            totalWithdrawn += amounts[i];
            (bool ok, ) = recipients[i].call{value: amounts[i]}("");
            require(ok, "transfer failed");
            emit Withdraw(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice Transfer ownership to a new address
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "invalid new owner");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @notice Pause the contract (prevents new payments)
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Get current contract balance
     */
    function balance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get total number of payments received
     */
    function getPaymentCount() external view returns (uint256) {
        return paymentHistory.length;
    }

    /**
     * @notice Get payment details by index
     * @param index Index in payment history array
     */
    function getPayment(uint256 index) external view returns (
        address payer,
        uint256 amount,
        uint256 timestamp,
        string memory memo
    ) {
        require(index < paymentHistory.length, "index out of bounds");
        Payment memory p = paymentHistory[index];
        return (p.payer, p.amount, p.timestamp, p.memo);
    }

    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 currentBalance,
        uint256 totalRec,
        uint256 totalWith,
        uint256 paymentCount,
        bool isPaused
    ) {
        return (
            address(this).balance,
            totalReceived,
            totalWithdrawn,
            paymentHistory.length,
            paused
        );
    }
}
