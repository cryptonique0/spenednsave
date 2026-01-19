// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SpendVaultWithProposals
 * @dev Multi-signature vault with on-chain proposal voting system
 * 
 * Features:
 * - Create withdrawal proposals
 * - Guardian voting on proposals
 * - Automatic execution on quorum
 * - No raw signatures needed
 * - Complete proposal history
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

interface IWithdrawalProposalManager {
    function createProposal(
        address vault,
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external returns (uint256);
    
    function approveProposal(uint256 proposalId, address voter) external returns (bool);
    function executeProposal(uint256 proposalId) external;
    function getProposal(uint256 proposalId) external view returns (
        uint256 proposalId,
        address vault,
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        address proposer,
        uint256 createdAt,
        uint256 votingDeadline,
        uint256 approvalsCount,
        uint8 status,
        bool executed,
        uint256 executedAt,
        uint256 secondsRemaining
    );
    
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);
    function approvalsNeeded(uint256 proposalId) external view returns (uint256);
    function getVaultQuorum(address vault) external view returns (uint256);
}

contract SpendVaultWithProposals is Ownable, ReentrancyGuard {
    
    // ==================== State ====================
    
    address public guardianToken;
    address public proposalManager;
    uint256 public quorum;
    
    mapping(uint256 proposalId => bool) public proposalExecuted;
    mapping(uint256 proposalId => uint256) public proposalExecutionTime;

    // ==================== Events ====================
    
    event ProposalWithdrawalExecuted(
        uint256 indexed proposalId,
        address indexed token,
        uint256 amount,
        address indexed recipient,
        uint256 timestamp
    );
    
    event ETHDeposited(uint256 amount, uint256 timestamp);
    event TokenDeposited(address indexed token, uint256 amount, uint256 timestamp);
    event ProposalManagerUpdated(address newAddress, uint256 timestamp);
    event GuardianTokenUpdated(address newAddress, uint256 timestamp);
    event QuorumUpdated(uint256 newQuorum, uint256 timestamp);

    // ==================== Constructor ====================
    
    constructor(
        address _guardianToken,
        uint256 _quorum,
        address _proposalManager
    ) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_proposalManager != address(0), "Invalid proposal manager");
        require(_quorum > 0, "Quorum must be at least 1");
        
        guardianToken = _guardianToken;
        quorum = _quorum;
        proposalManager = _proposalManager;
    }

    // ==================== Receive & Fallback ====================
    
    receive() external payable {
        emit ETHDeposited(msg.value, block.timestamp);
    }
    
    fallback() external payable {}

    // ==================== Deposits ====================
    
    /**
     * @dev Deposit ERC-20 tokens
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        emit TokenDeposited(token, amount, block.timestamp);
    }

    /**
     * @dev Deposit native ETH
     */
    function depositETH() external payable {
        require(msg.value > 0, "Amount must be > 0");
        emit ETHDeposited(msg.value, block.timestamp);
    }

    // ==================== Proposals ====================
    
    /**
     * @dev Create withdrawal proposal
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason
     * @return proposalId ID of created proposal
     */
    function proposeWithdrawal(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external returns (uint256) {
        require(msg.sender == owner(), "Only owner can propose");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        // Validate balance
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient tokens");
        }
        
        return IWithdrawalProposalManager(proposalManager).createProposal(
            address(this),
            token,
            amount,
            recipient,
            reason
        );
    }

    /**
     * @dev Vote to approve proposal
     * @param proposalId ID of proposal
     */
    function voteApproveProposal(uint256 proposalId) external {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not a guardian");
        require(!IWithdrawalProposalManager(proposalManager).hasVoted(proposalId, msg.sender), "Already voted");
        
        IWithdrawalProposalManager(proposalManager).approveProposal(proposalId, msg.sender);
    }

    /**
     * @dev Execute approved proposal
     * @param proposalId ID of proposal
     */
    function executeProposalWithdrawal(uint256 proposalId) external nonReentrant {
        require(!proposalExecuted[proposalId], "Already executed");
        
        // Get proposal details
        (
            uint256 id,
            address vault,
            address token,
            uint256 amount,
            address recipient,
            ,
            ,
            ,
            ,
            uint256 approvalsCount,
            uint8 status,
            bool executed,
            ,
        ) = IWithdrawalProposalManager(proposalManager).getProposal(proposalId);
        
        require(vault == address(this), "Wrong vault");
        require(!executed, "Proposal already executed");
        require(status == 1, "Proposal not approved"); // APPROVED = 1
        require(approvalsCount >= quorum, "Insufficient approvals");
        
        // Mark as executed locally
        proposalExecuted[proposalId] = true;
        proposalExecutionTime[proposalId] = block.timestamp;
        
        // Mark as executed in manager
        IWithdrawalProposalManager(proposalManager).executeProposal(proposalId);
        
        // Execute withdrawal
        if (token == address(0)) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
        }
        
        emit ProposalWithdrawalExecuted(proposalId, token, amount, recipient, block.timestamp);
    }

    // ==================== Configuration ====================
    
    /**
     * @dev Update quorum
     */
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be at least 1");
        quorum = _newQuorum;
        emit QuorumUpdated(_newQuorum, block.timestamp);
    }

    /**
     * @dev Update guardian token
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(_newAddress, block.timestamp);
    }

    /**
     * @dev Update proposal manager
     */
    function updateProposalManager(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        proposalManager = _newAddress;
        emit ProposalManagerUpdated(_newAddress, block.timestamp);
    }

    // ==================== Views ====================
    
    /**
     * @dev Get ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Check if proposal executed
     */
    function isProposalExecuted(uint256 proposalId) external view returns (bool) {
        return proposalExecuted[proposalId];
    }

    /**
     * @dev Get proposal execution time
     */
    function getProposalExecutionTime(uint256 proposalId) external view returns (uint256) {
        return proposalExecutionTime[proposalId];
    }
}
