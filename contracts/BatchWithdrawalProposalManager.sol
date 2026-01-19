// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BatchWithdrawalProposalManager
 * @notice Manages batch withdrawal proposals where multiple tokens can be withdrawn in single approval flow
 */
contract BatchWithdrawalProposalManager is Ownable, ReentrancyGuard {
    
    // ==================== Types ====================
    
    enum ProposalStatus {
        PENDING,      // 0 - Awaiting votes
        APPROVED,     // 1 - Quorum reached
        EXECUTED,     // 2 - Executed
        REJECTED,     // 3 - Rejected
        EXPIRED       // 4 - Voting deadline passed
    }
    
    struct TokenWithdrawal {
        address token;      // Token address (0x0 for ETH)
        uint256 amount;     // Amount to withdraw
        address recipient;  // Recipient address
    }
    
    struct BatchWithdrawalProposal {
        uint256 proposalId;              // Unique proposal ID
        address vault;                   // Vault address
        TokenWithdrawal[] withdrawals;   // Array of token withdrawals
        string reason;                   // Proposal reason/description
        address proposer;                // Who created proposal
        uint256 createdAt;               // Creation timestamp
        uint256 votingDeadline;          // Voting deadline (creation + 3 days)
        uint256 approvalsCount;          // Current approval count
        ProposalStatus status;           // Current status
        mapping(address => bool) hasVoted; // Vote tracking
        bool executed;                   // Execution flag
        uint256 executedAt;              // Execution timestamp
    }
    
    // ==================== Constants ====================
    
    uint256 constant VOTING_PERIOD = 3 days;
    
    // ==================== State ====================
    
    uint256 public proposalCounter;
    mapping(uint256 => BatchWithdrawalProposal) public proposals;
    mapping(address => uint256[]) public vaultProposals;
    mapping(address => bool) public managed;
    mapping(address => uint256) public vaultQuorum;
    
    // ==================== Events ====================
    
    event BatchProposalCreated(
        uint256 indexed proposalId,
        address indexed vault,
        address indexed proposer,
        uint256 tokenCount,
        uint256 deadline,
        uint256 timestamp
    );
    
    event BatchProposalApproved(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 approvalsCount,
        uint256 timestamp
    );
    
    event BatchProposalQuorumReached(
        uint256 indexed proposalId,
        uint256 approvalsCount,
        uint256 timestamp
    );
    
    event BatchProposalExecuted(
        uint256 indexed proposalId,
        uint256 timestamp
    );
    
    event BatchProposalRejected(
        uint256 indexed proposalId,
        string reason,
        uint256 timestamp
    );
    
    event VaultRegisteredForBatch(
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );
    
    // ==================== Registration ====================
    
    function registerVault(address vault, uint256 quorum) external {
        require(vault != address(0), "Invalid vault");
        require(!managed[vault], "Vault already registered");
        require(quorum > 0, "Quorum must be > 0");
        
        managed[vault] = true;
        vaultQuorum[vault] = quorum;
        
        emit VaultRegisteredForBatch(vault, quorum, block.timestamp);
    }
    
    // ==================== Proposal Creation ====================
    
    function createBatchProposal(
        address vault,
        TokenWithdrawal[] calldata withdrawals,
        string calldata reason
    ) external returns (uint256) {
        require(managed[vault], "Vault not managed");
        require(withdrawals.length > 0, "Must have withdrawals");
        require(withdrawals.length <= 10, "Max 10 tokens per batch");
        require(bytes(reason).length > 0, "Reason required");
        
        uint256 proposalId = proposalCounter++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;
        
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.reason = reason;
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingDeadline = deadline;
        proposal.status = ProposalStatus.PENDING;
        
        // Copy withdrawals
        for (uint256 i = 0; i < withdrawals.length; i++) {
            require(withdrawals[i].recipient != address(0), "Invalid recipient");
            require(withdrawals[i].amount > 0, "Amount must be > 0");
            proposal.withdrawals.push(withdrawals[i]);
        }
        
        vaultProposals[vault].push(proposalId);
        
        emit BatchProposalCreated(
            proposalId,
            vault,
            msg.sender,
            withdrawals.length,
            deadline,
            block.timestamp
        );
        
        return proposalId;
    }
    
    // ==================== Voting ====================
    
    function approveBatchProposal(uint256 proposalId, address voter) external returns (bool) {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Proposal not pending");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");
        require(!proposal.hasVoted[voter], "Already voted");
        
        proposal.hasVoted[voter] = true;
        proposal.approvalsCount++;
        
        emit BatchProposalApproved(proposalId, voter, proposal.approvalsCount, block.timestamp);
        
        if (proposal.approvalsCount >= vaultQuorum[proposal.vault]) {
            proposal.status = ProposalStatus.APPROVED;
            emit BatchProposalQuorumReached(proposalId, proposal.approvalsCount, block.timestamp);
            return true;
        }
        
        return false;
    }
    
    // ==================== Execution ====================
    
    function executeBatchProposal(uint256 proposalId) external {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(!proposal.executed, "Already executed");
        require(proposal.status == ProposalStatus.APPROVED, "Not approved");
        
        proposal.executed = true;
        proposal.executedAt = block.timestamp;
        
        emit BatchProposalExecuted(proposalId, block.timestamp);
    }
    
    function rejectBatchProposal(uint256 proposalId, string calldata reason) external {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Not pending");
        
        proposal.status = ProposalStatus.REJECTED;
        
        emit BatchProposalRejected(proposalId, reason, block.timestamp);
    }
    
    // ==================== Queries ====================
    
    function getBatchProposal(uint256 proposalId) external view returns (
        uint256 id,
        address vault,
        uint256 withdrawalCount,
        string memory reason,
        address proposer,
        uint256 createdAt,
        uint256 deadline,
        uint256 approvalsCount,
        uint8 status,
        bool executed,
        uint256 executedAt
    ) {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        
        return (
            proposal.proposalId,
            proposal.vault,
            proposal.withdrawals.length,
            proposal.reason,
            proposal.proposer,
            proposal.createdAt,
            proposal.votingDeadline,
            proposal.approvalsCount,
            uint8(proposal.status),
            proposal.executed,
            proposal.executedAt
        );
    }
    
    function getBatchWithdrawals(uint256 proposalId) external view returns (TokenWithdrawal[] memory) {
        return proposals[proposalId].withdrawals;
    }
    
    function getWithdrawalAtIndex(uint256 proposalId, uint256 index) external view returns (TokenWithdrawal memory) {
        return proposals[proposalId].withdrawals[index];
    }
    
    function hasVotedOnBatch(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }
    
    function approvalsNeededForBatch(uint256 proposalId) external view returns (uint256) {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        uint256 needed = vaultQuorum[proposal.vault];
        if (proposal.approvalsCount >= needed) return 0;
        return needed - proposal.approvalsCount;
    }
    
    function getVaultQuorumForBatch(address vault) external view returns (uint256) {
        return vaultQuorum[vault];
    }
    
    function updateVaultQuorumForBatch(address vault, uint256 newQuorum) external {
        require(managed[vault], "Vault not managed");
        require(newQuorum > 0, "Quorum must be > 0");
        vaultQuorum[vault] = newQuorum;
    }
    
    function getVaultBatchProposals(address vault) external view returns (uint256[] memory) {
        return vaultProposals[vault];
    }
    
    function getBatchProposalCount(address vault) external view returns (uint256) {
        return vaultProposals[vault].length;
    }
    
    function isManagedForBatch(address vault) external view returns (bool) {
        return managed[vault];
    }
}
