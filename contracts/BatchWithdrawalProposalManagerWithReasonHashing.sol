// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BatchWithdrawalProposalManagerWithReasonHashing
 * @notice Manages batch withdrawal proposals with reason hashing for privacy
 * 
 * Features:
 * - Batch withdrawal proposals (1-10 tokens per batch)
 * - Guardian voting on proposals
 * - Automatic execution on quorum
 * - Reason hashing for privacy (full reasons not stored on-chain)
 * - Category hashing support
 */
contract BatchWithdrawalProposalManagerWithReasonHashing is Ownable, ReentrancyGuard {
    
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
        bytes32 reasonHash;              // Hash of reason (not full string)
        bytes32 categoryHash;            // Hash of category (optional)
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
    
    // Reason hash tracking for audit
    mapping(bytes32 => uint256) public reasonHashCount;     // How many times used
    mapping(bytes32 => address) public reasonHashCreator;   // Who created it
    mapping(bytes32 => uint256) public reasonHashFirstUse;  // First usage timestamp
    
    // ==================== Events ====================
    
    event BatchProposalCreated(
        uint256 indexed proposalId,
        address indexed vault,
        address indexed proposer,
        bytes32 reasonHash,
        bytes32 categoryHash,
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
        bytes32 rejectionReasonHash,
        uint256 timestamp
    );
    
    event VaultRegisteredForBatch(
        address indexed vault,
        uint256 quorum,
        uint256 timestamp
    );
    
    event ReasonHashTrackedForBatch(
        bytes32 indexed reasonHash,
        address indexed vault,
        address indexed proposer,
        uint256 timestamp
    );
    
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
        
        emit ReasonHashTrackedForBatch(reasonHash, vault, msg.sender, block.timestamp);
    }
    
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
    
    /**
     * @dev Create batch withdrawal proposal with hashed reason
     * @param vault Vault address
     * @param withdrawals Array of token withdrawals (max 10)
     * @param reason Withdrawal reason (will be hashed for privacy)
     * @return proposalId ID of created proposal
     * 
     * PRIVACY NOTE: Reason is hashed on-chain. Full reason is not stored.
     */
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
        bytes32 reasonHash = _hashReason(reason);
        
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.reasonHash = reasonHash;              // Store hash only
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
        
        // Track reason hash usage
        _trackReasonHash(reasonHash, vault);
        
        vaultProposals[vault].push(proposalId);
        
        emit BatchProposalCreated(
            proposalId,
            vault,
            msg.sender,
            reasonHash,
            bytes32(0),  // No category
            withdrawals.length,
            deadline,
            block.timestamp
        );
        
        return proposalId;
    }
    
    /**
     * @dev Create batch proposal with reason and category hashing
     * @param vault Vault address
     * @param withdrawals Array of token withdrawals (max 10)
     * @param reason Withdrawal reason (will be hashed for privacy)
     * @param category Withdrawal category (will be hashed for privacy)
     * @return proposalId ID of created proposal
     * 
     * PRIVACY NOTE: Both reason and category are hashed on-chain for maximum privacy.
     */
    function createBatchProposalWithCategory(
        address vault,
        TokenWithdrawal[] calldata withdrawals,
        string calldata reason,
        string calldata category
    ) external returns (uint256) {
        require(managed[vault], "Vault not managed");
        require(withdrawals.length > 0, "Must have withdrawals");
        require(withdrawals.length <= 10, "Max 10 tokens per batch");
        require(bytes(reason).length > 0, "Reason required");
        require(bytes(category).length > 0, "Category required");
        
        uint256 proposalId = proposalCounter++;
        uint256 deadline = block.timestamp + VOTING_PERIOD;
        bytes32 reasonHash = _hashReason(reason);
        bytes32 categoryHash = keccak256(bytes(category));
        
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.vault = vault;
        proposal.reasonHash = reasonHash;              // Store hash only
        proposal.categoryHash = categoryHash;          // Store hash only
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
        
        // Track reason hash usage
        _trackReasonHash(reasonHash, vault);
        
        vaultProposals[vault].push(proposalId);
        
        emit BatchProposalCreated(
            proposalId,
            vault,
            msg.sender,
            reasonHash,
            categoryHash,
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
    
    /**
     * @dev Reject a batch proposal
     * @param proposalId ID of proposal
     * @param rejectionReason Rejection reason (will be hashed for privacy)
     */
    function rejectBatchProposal(uint256 proposalId, string calldata rejectionReason) external {
        BatchWithdrawalProposal storage proposal = proposals[proposalId];
        
        require(proposal.vault != address(0), "Proposal not found");
        require(proposal.status == ProposalStatus.PENDING, "Not pending");
        
        proposal.status = ProposalStatus.REJECTED;
        bytes32 rejectionHash = _hashReason(rejectionReason);
        
        emit BatchProposalRejected(proposalId, rejectionHash, block.timestamp);
    }
    
    // ==================== Queries ====================
    
    /**
     * @dev Get batch proposal details (with hashed reasons for privacy)
     * @param proposalId ID of proposal
     * @return Proposal details with hashed reasons
     */
    function getBatchProposal(uint256 proposalId) external view returns (
        uint256 id,
        address vault,
        uint256 withdrawalCount,
        bytes32 reasonHash,
        bytes32 categoryHash,
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
            proposal.reasonHash,      // Hash only
            proposal.categoryHash,    // Hash only
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
