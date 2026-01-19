// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WithdrawalProposalManagerWithReasonHashing
 * @dev Manages on-chain withdrawal proposals with reason hashing for privacy
 * 
 * Features:
 * - Create withdrawal proposals with hashed reasons
 * - Guardian voting on proposals
 * - Automatic execution on quorum
 * - Complete proposal history with privacy
 * - Time-locked execution windows
 */

contract WithdrawalProposalManagerWithReasonHashing {
    
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
        bytes32 reasonHash;              // Hash of reason (not full string)
        bytes32 categoryHash;            // Optional category hash for privacy
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
        bytes32 reasonHash;              // Hash only
        bytes32 categoryHash;            // Hash only
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
    
    // Reason hash registry for audit
    mapping(bytes32 => uint256) public reasonHashCount;     // How many times used
    mapping(bytes32 => address) public reasonHashCreator;   // Who created it
    mapping(bytes32 => uint256) public reasonHashFirstUse;  // First usage timestamp

    // ==================== Events ====================
    
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed vault,
        address indexed proposer,
        bytes32 reasonHash,
        bytes32 categoryHash,
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
        bytes32 rejectionReasonHash,
        uint256 timestamp
    );
    
    event VaultRegistered(
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );
    
    event ReasonHashTracked(
        bytes32 indexed reasonHash,
        address indexed vault,
        address indexed proposer,
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

    // ==================== Reason Hashing ====================
    
    /**
     * @dev Internal function to hash a reason string
     * @param reason The reason text
     * @return The keccak256 hash of the reason
     */
    function _hashReason(string memory reason) internal pure returns (bytes32) {
        return keccak256(bytes(reason));
    }
    
    /**
     * @dev Hash a reason externally (for off-chain verification)
     * @param reason The reason text
     * @return The keccak256 hash
     */
    function hashReason(string calldata reason) external pure returns (bytes32) {
        require(bytes(reason).length > 0, "Reason cannot be empty");
        return _hashReason(reason);
    }
    
    /**
     * @dev Verify that a reason matches its hash
     * @param reason The original reason text
     * @param expectedHash The expected hash
     * @return True if reason hashes to expectedHash
     */
    function verifyReason(string calldata reason, bytes32 expectedHash) external pure returns (bool) {
        return _hashReason(reason) == expectedHash;
    }

    // ==================== Proposal Creation ====================
    
    /**
     * @dev Create new withdrawal proposal with hashed reason
     * @param vault Vault to withdraw from
     * @param token Token to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason (will be hashed)
     * @return proposalId ID of created proposal
     * 
     * PRIVACY NOTE: Reason is hashed on-chain. Full reason is not stored.
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
        require(bytes(reason).length > 0, "Reason cannot be empty");
        
        uint256 proposalId = proposalCounter++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;
        bytes32 reasonHash = _hashReason(reason);
        
        WithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.token = token;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.reasonHash = reasonHash;           // Store hash only
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingDeadline = deadline;
        proposal.status = ProposalStatus.PENDING;
        
        // Track reason hash usage
        _trackReasonHash(reasonHash, vault);
        
        vaultProposals[vault].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            vault,
            msg.sender,
            reasonHash,
            bytes32(0),  // No category
            amount,
            deadline,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Create proposal with reason and category hashing
     * @param vault Vault to withdraw from
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason (will be hashed)
     * @param category Withdrawal category (will be hashed)
     * @return proposalId ID of created proposal
     * 
     * PRIVACY NOTE: Both reason and category are hashed on-chain for maximum privacy.
     */
    function createProposalWithCategory(
        address vault,
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        string calldata category
    ) external returns (uint256) {
        require(isManaged[vault], "Vault not managed");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(bytes(reason).length > 0, "Reason cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        
        uint256 proposalId = proposalCounter++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;
        bytes32 reasonHash = _hashReason(reason);
        bytes32 categoryHash = keccak256(bytes(category));
        
        WithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.token = token;
        proposal.amount = amount;
        proposal.recipient = recipient;
        proposal.reasonHash = reasonHash;           // Store hash only
        proposal.categoryHash = categoryHash;       // Store hash only
        proposal.proposer = msg.sender;
        proposal.createdAt = block.timestamp;
        proposal.votingDeadline = deadline;
        proposal.status = ProposalStatus.PENDING;
        
        // Track reason hash usage
        _trackReasonHash(reasonHash, vault);
        
        vaultProposals[vault].push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            vault,
            msg.sender,
            reasonHash,
            categoryHash,
            amount,
            deadline,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Internal function to track reason hash usage
     * @param reasonHash The reason hash
     * @param vault The vault using it
     */
    function _trackReasonHash(bytes32 reasonHash, address vault) internal {
        if (reasonHashCount[reasonHash] == 0) {
            reasonHashCreator[reasonHash] = msg.sender;
            reasonHashFirstUse[reasonHash] = block.timestamp;
        }
        reasonHashCount[reasonHash]++;
        
        emit ReasonHashTracked(reasonHash, vault, msg.sender, block.timestamp);
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
     * @param rejectionReason Rejection reason (will be hashed for privacy)
     */
    function rejectProposal(uint256 proposalId, string calldata rejectionReason) external {
        WithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Proposal not pending");
        require(block.timestamp <= proposal.votingDeadline, "Voting period ended");
        
        proposal.status = ProposalStatus.REJECTED;
        bytes32 rejectionHash = _hashReason(rejectionReason);
        
        emit ProposalRejected(proposalId, rejectionHash, block.timestamp);
    }

    // ==================== Status Queries ====================
    
    /**
     * @dev Get proposal details (with hashed reasons for privacy)
     * @param proposalId ID of proposal
     * @return Proposal view struct with hashed reasons
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
            reasonHash: proposal.reasonHash,       // Hash only
            categoryHash: proposal.categoryHash,   // Hash only
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
    
    // ==================== Reason Hash Audit ====================
    
    /**
     * @dev Get statistics for a reason hash
     * @param reasonHash The reason hash
     * @return count Number of times used
     * @return creator Address that first created this hash
     * @return firstUse Timestamp of first usage
     */
    function getReasonHashStats(bytes32 reasonHash) external view returns (
        uint256 count,
        address creator,
        uint256 firstUse
    ) {
        return (
            reasonHashCount[reasonHash],
            reasonHashCreator[reasonHash],
            reasonHashFirstUse[reasonHash]
        );
    }
    
    /**
     * @dev Check if a reason hash is in use
     * @param reasonHash The reason hash
     * @return True if hash has been used
     */
    function isReasonHashInUse(bytes32 reasonHash) external view returns (bool) {
        return reasonHashCount[reasonHash] > 0;
    }
}
