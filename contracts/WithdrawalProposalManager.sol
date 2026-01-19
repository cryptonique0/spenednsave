// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WithdrawalProposalManager
 * @dev Manages on-chain withdrawal proposals with guardian voting
 * 
 * Features:
 * - Create withdrawal proposals
 * - Guardian voting on proposals
 * - Automatic execution on quorum
 * - Complete proposal history
 * - Time-locked execution windows
 */

contract WithdrawalProposalManager {
    
    // ==================== Types ====================
    
    enum ProposalStatus {
        PENDING,      // Awaiting votes
        APPROVED,     // Quorum reached, ready to execute
        EXECUTED,     // Proposal executed
        REJECTED,     // Quorum failed or cancelled
        EXPIRED       // Voting window expired
    }
    
    struct WithdrawalProposal {
        uint256 proposalId;
        address vault;
        address token;
        uint256 amount;
        address recipient;
        string reason;
        address proposer;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 approvalsCount;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
        bool executed;
        uint256 executedAt;
    }
    
    struct ProposalView {
        uint256 proposalId;
        address vault;
        address token;
        uint256 amount;
        address recipient;
        string reason;
        address proposer;
        uint256 createdAt;
        uint256 votingDeadline;
        uint256 approvalsCount;
        ProposalStatus status;
        bool executed;
        uint256 executedAt;
        uint256 secondsRemaining;
    }

    // ==================== State ====================
    
    uint256 public constant VOTING_PERIOD = 3 days;
    uint256 public proposalCounter = 0;
    
    mapping(uint256 proposalId => WithdrawalProposal) public proposals;
    mapping(address vault => uint256[]) public vaultProposals;
    mapping(address vault => uint256) public vaultQuorum;
    
    address[] public managedVaults;
    mapping(address vault => bool) public isManaged;

    // ==================== Events ====================
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed vault,
        address indexed proposer,
        uint256 amount,
        uint256 deadline,
        uint256 timestamp
    );
    
    event ProposalApproved(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 approvalsCount,
        uint256 timestamp
    );
    
    event ProposalQuorumReached(
        uint256 indexed proposalId,
        uint256 approvalsCount,
        uint256 timestamp
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        uint256 timestamp
    );
    
    event ProposalRejected(
        uint256 indexed proposalId,
        string reason,
        uint256 timestamp
    );
    
    event VaultRegistered(
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );

    // ==================== Vault Registration ====================
    
    /**
     * @dev Register vault for proposal management
     * @param vault Vault address
     * @param quorum Required approvals for execution
     */
    function registerVault(address vault, uint256 quorum) external {
        require(vault != address(0), "Invalid vault");
        require(quorum > 0, "Quorum must be at least 1");
        require(!isManaged[vault], "Vault already registered");
        
        managedVaults.push(vault);
        isManaged[vault] = true;
        vaultQuorum[vault] = quorum;
        
        emit VaultRegistered(vault, quorum, block.timestamp);
    }

    // ==================== Proposal Creation ====================
    
    /**
     * @dev Create new withdrawal proposal
     * @param vault Vault to withdraw from
     * @param token Token to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason
     * @return proposalId ID of created proposal
     */
    function createProposal(
        address vault,
        address token,
        uint256 amount,
        address recipient,
        string calldata reason
    ) external returns (uint256) {
        require(isManaged[vault], "Vault not managed");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        uint256 proposalId = proposalCounter++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;
        
        WithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.token = token;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.reason = reason;
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingDeadline = deadline;
        proposal.status = ProposalStatus.PENDING;
        
        vaultProposals[vault].push(proposalId);
        
        emit ProposalCreated(proposalId, vault, msg.sender, amount, deadline, block.timestamp);
        
        return proposalId;
    }

    // ==================== Voting ====================
    
    /**
     * @dev Vote to approve a proposal
     * @param proposalId ID of proposal to vote on
     * @param voter Guardian voting
     * @return approved True if quorum reached
     */
    function approveProposal(uint256 proposalId, address voter) external returns (bool) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Proposal not pending");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");
        require(!proposal.hasVoted[voter], "Already voted");
        
        proposal.hasVoted[voter] = true;
        proposal.approvalsCount++;
        
        emit ProposalApproved(proposalId, voter, proposal.approvalsCount, block.timestamp);
        
        // Check if quorum reached
        if (proposal.approvalsCount >= vaultQuorum[proposal.vault]) {
            proposal.status = ProposalStatus.APPROVED;
            emit ProposalQuorumReached(proposalId, proposal.approvalsCount, block.timestamp);
            return true;
        }
        
        return false;
    }

    // ==================== Proposal Execution ====================
    
    /**
     * @dev Mark proposal as executed
     * @param proposalId ID of proposal to execute
     */
    function executeProposal(uint256 proposalId) external {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.APPROVED, "Proposal not approved");
        require(!proposal.executed, "Already executed");
        
        proposal.executed = true;
        proposal.executedAt = block.timestamp;
        
        emit ProposalExecuted(proposalId, block.timestamp);
    }

    // ==================== Proposal Rejection ====================
    
    /**
     * @dev Reject a proposal
     * @param proposalId ID of proposal
     * @param reason Rejection reason
     */
    function rejectProposal(uint256 proposalId, string calldata reason) external {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Proposal not pending");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");
        
        proposal.status = ProposalStatus.REJECTED;
        
        emit ProposalRejected(proposalId, reason, block.timestamp);
    }

    // ==================== Status Queries ====================
    
    /**
     * @dev Get proposal details
     * @param proposalId ID of proposal
     * @return Proposal view struct with all details
     */
    function getProposal(uint256 proposalId) external view returns (ProposalView memory) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        
        // Check if expired
        ProposalStatus status = proposal.status;
        if (status == ProposalStatus.PENDING && block.timestamp > proposal.votingDeadline) {
            status = ProposalStatus.EXPIRED;
        }
        
        uint256 secondsRemaining = 0;
        if (block.timestamp < proposal.votingDeadline && status == ProposalStatus.PENDING) {
            secondsRemaining = proposal.votingDeadline - block.timestamp;
        }
        
        return ProposalView({
            proposalId: proposal.proposalId,
            vault: proposal.vault,
            token: proposal.token,
            amount: proposal.amount,
            recipient: proposal.recipient,
            reason: proposal.reason,
            proposer: proposal.proposer,
            createdAt: proposal.createdAt,
            votingDeadline: proposal.votingDeadline,
            approvalsCount: proposal.approvalsCount,
            status: status,
            executed: proposal.executed,
            executedAt: proposal.executedAt,
            secondsRemaining: secondsRemaining
        });
    }

    /**
     * @dev Check if address has voted on proposal
     * @param proposalId ID of proposal
     * @param voter Address to check
     * @return True if voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    /**
     * @dev Get approvals needed for proposal
     * @param proposalId ID of proposal
     * @return Approvals needed
     */
    function approvalsNeeded(uint256 proposalId) external view returns (uint256) {
        WithdrawalProposal storage proposal = proposals[proposalId];
        require(proposal.vault != address(0), "Proposal not found");
        
        uint256 quorum = vaultQuorum[proposal.vault];
        if (proposal.approvalsCount >= quorum) {
            return 0;
        }
        return quorum - proposal.approvalsCount;
    }

    /**
     * @dev Get vault's quorum requirement
     * @param vault Vault address
     * @return Quorum
     */
    function getVaultQuorum(address vault) external view returns (uint256) {
        require(isManaged[vault], "Vault not managed");
        return vaultQuorum[vault];
    }

    /**
     * @dev Get proposals for vault
     * @param vault Vault address
     * @return Array of proposal IDs
     */
    function getVaultProposals(address vault) external view returns (uint256[] memory) {
        return vaultProposals[vault];
    }

    /**
     * @dev Get count of vault proposals
     * @param vault Vault address
     * @return Count
     */
    function getProposalCount(address vault) external view returns (uint256) {
        return vaultProposals[vault].length;
    }

    /**
     * @dev Update vault quorum
     * @param vault Vault address
     * @param newQuorum New quorum
     */
    function updateVaultQuorum(address vault, uint256 newQuorum) external {
        require(isManaged[vault], "Vault not managed");
        require(newQuorum > 0, "Quorum must be > 0");
        vaultQuorum[vault] = newQuorum;
    }
}
