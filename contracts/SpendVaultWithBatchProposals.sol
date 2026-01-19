// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BatchWithdrawalProposalManager.sol";

interface IGuardianSBT {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title SpendVaultWithBatchProposals
 * @notice Multi-signature vault supporting batch token withdrawals in single approval flow
 */
contract SpendVaultWithBatchProposals is ReentrancyGuard {
    
    // ==================== State ====================
    
    address public owner;
    address public guardianToken;
    address public batchProposalManager;
    uint256 public quorum;
    
    mapping(uint256 => bool) public batchProposalExecuted;
    
    // ==================== Events ====================
    
    event BatchWithdrawalExecuted(
        uint256 indexed proposalId,
        uint256 tokenCount,
        uint256 timestamp
    );
    
    event BatchWithdrawalFailed(
        uint256 indexed proposalId,
        uint256 failedIndex,
        string reason,
        uint256 timestamp
    );
    
    // ==================== Constructor ====================
    
    constructor() {
        owner = msg.sender;
        quorum = 2;
    }
    
    // ==================== Deposits ====================
    
    receive() external payable {}
    
    function depositETH() external payable {
        // ETH received
    }
    
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }
    
    // ==================== Batch Proposals ====================
    
    function proposeBatchWithdrawal(
        BatchWithdrawalProposalManager.TokenWithdrawal[] calldata withdrawals,
        string calldata reason
    ) external returns (uint256) {
        require(msg.sender == owner, "Only owner can propose");
        
        // Validate all balances
        for (uint256 i = 0; i < withdrawals.length; i++) {
            if (withdrawals[i].token == address(0)) {
                require(address(this).balance >= withdrawals[i].amount, "Insufficient ETH");
            } else {
                require(
                    IERC20(withdrawals[i].token).balanceOf(address(this)) >= withdrawals[i].amount,
                    "Insufficient tokens"
                );
            }
        }
        
        return IBatchWithdrawalProposalManager(batchProposalManager).createBatchProposal(
            address(this),
            withdrawals,
            reason
        );
    }
    
    function voteApproveBatchProposal(uint256 proposalId) external {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not a guardian");
        
        IBatchWithdrawalProposalManager(batchProposalManager).approveBatchProposal(proposalId, msg.sender);
    }
    
    // ==================== Execution ====================
    
    function executeBatchWithdrawal(uint256 proposalId) external nonReentrant {
        require(!batchProposalExecuted[proposalId], "Already executed");
        
        // Get proposal details
        (
            uint256 id,
            address vault,
            uint256 withdrawalCount,
            ,
            ,
            ,
            ,
            uint256 approvalsCount,
            uint8 status,
            bool executed,
            
        ) = IBatchWithdrawalProposalManager(batchProposalManager).getBatchProposal(proposalId);
        
        require(vault == address(this), "Wrong vault");
        require(!executed, "Already executed");
        require(status == 1, "Not approved");  // APPROVED = 1
        require(approvalsCount >= quorum, "Insufficient approvals");
        
        batchProposalExecuted[proposalId] = true;
        IBatchWithdrawalProposalManager(batchProposalManager).executeBatchProposal(proposalId);
        
        // Execute all withdrawals
        for (uint256 i = 0; i < withdrawalCount; i++) {
            BatchWithdrawalProposalManager.TokenWithdrawal memory withdrawal = 
                IBatchWithdrawalProposalManager(batchProposalManager).getWithdrawalAtIndex(proposalId, i);
            
            if (withdrawal.token == address(0)) {
                // ETH transfer
                (bool success, ) = payable(withdrawal.recipient).call{value: withdrawal.amount}("");
                require(success, "ETH transfer failed");
            } else {
                // ERC-20 transfer
                bool success = IERC20(withdrawal.token).transfer(withdrawal.recipient, withdrawal.amount);
                require(success, "Token transfer failed");
            }
        }
        
        emit BatchWithdrawalExecuted(proposalId, withdrawalCount, block.timestamp);
    }
    
    // ==================== Configuration ====================
    
    function setQuorum(uint256 newQuorum) external {
        require(msg.sender == owner, "Only owner");
        quorum = newQuorum;
    }
    
    function updateGuardianToken(address newToken) external {
        require(msg.sender == owner, "Only owner");
        guardianToken = newToken;
    }
    
    function updateBatchProposalManager(address newManager) external {
        require(msg.sender == owner, "Only owner");
        batchProposalManager = newManager;
    }
    
    // ==================== Queries ====================
    
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    function isBatchProposalExecuted(uint256 proposalId) external view returns (bool) {
        return batchProposalExecuted[proposalId];
    }
}

// ==================== Interface ====================

interface IBatchWithdrawalProposalManager {
    function createBatchProposal(
        address vault,
        BatchWithdrawalProposalManager.TokenWithdrawal[] calldata withdrawals,
        string calldata reason
    ) external returns (uint256);
    
    function approveBatchProposal(uint256 proposalId, address voter) external returns (bool);
    function executeBatchProposal(uint256 proposalId) external;
    function getBatchProposal(uint256 proposalId) external view returns (
        uint256, address, uint256, string memory, address, uint256, uint256, uint256, uint8, bool, uint256
    );
    function getWithdrawalAtIndex(uint256 proposalId, uint256 index) 
        external view returns (BatchWithdrawalProposalManager.TokenWithdrawal memory);
}
