// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuardianSocialRecovery
 * @dev Enables guardians to collectively recover vault ownership
 * 
 * Purpose:
 * - Allow guardians to reset vault owner if original owner loses key
 * - Multi-signature consensus required
 * - Timelock protection (7 days) prevents immediate takeover
 * - Complete audit trail of all recovery attempts
 * 
 * Features:
 * - Initiate recovery process
 * - Guardian voting on recovery
 * - Timelock delay for security
 * - Execute owner reset after timelock
 * - Cancel recovery if needed
 * - Complete history tracking
 */

contract GuardianSocialRecovery {
    
    // ==================== Types ====================
    
    enum RecoveryStatus {
        NONE,           // 0 - No recovery active
        PENDING,        // 1 - Recovery initiated, waiting for votes
        APPROVED,       // 2 - Quorum reached, in timelock
        EXECUTED,       // 3 - Owner changed
        CANCELLED       // 4 - Recovery cancelled
    }
    
    struct OwnerRecovery {
        uint256 recoveryId;
        address vault;
        address newOwner;              // Proposed new owner
        address initiator;             // Who initiated recovery
        uint256 initiatedAt;           // When recovery started
        uint256 votingDeadline;        // When voting ends
        uint256 timelockExpiration;    // When execution becomes possible
        uint256 approvalsCount;        // Current approval count
        RecoveryStatus status;
        mapping(address => bool) hasVoted;  // Vote tracking
        bool executed;
        uint256 executedAt;
        string reason;                 // Reason for recovery attempt
    }
    
    struct RecoveryView {
        uint256 recoveryId;
        address vault;
        address newOwner;
        address initiator;
        uint256 initiatedAt;
        uint256 votingDeadline;
        uint256 timelockExpiration;
        uint256 approvalsCount;
        RecoveryStatus status;
        bool executed;
        uint256 executedAt;
        uint256 secondsUntilVotingEnd;
        uint256 secondsUntilExecution;
        string reason;
    }

    // ==================== State ====================
    
    uint256 public constant VOTING_PERIOD = 7 days;      // 7 days to vote
    uint256 public constant TIMELOCK_DURATION = 7 days;  // 7 days timelock
    uint256 public recoveryCounter = 0;
    
    mapping(uint256 recoveryId => OwnerRecovery) public recoveries;
    mapping(address vault => uint256[]) public vaultRecoveries;
    mapping(address vault => uint256) public vaultQuorum;
    mapping(address vault => address) public recoveryGuardianToken;  // Guardian SBT per vault
    
    address[] public managedVaults;
    mapping(address vault => bool) public isManaged;
    
    // Recovery history tracking
    mapping(address vault => uint256) public totalRecoveryAttempts;
    mapping(address vault => uint256) public successfulRecoveries;

    // ==================== Events ====================
    
    event RecoveryInitiated(
        uint256 indexed recoveryId,
        address indexed vault,
        address indexed newOwner,
        address initiator,
        string reason,
        uint256 votingDeadline,
        uint256 timestamp
    );
    
    event RecoveryVoteReceived(
        uint256 indexed recoveryId,
        address indexed voter,
        uint256 approvalsCount,
        uint256 timestamp
    );
    
    event RecoveryQuorumReached(
        uint256 indexed recoveryId,
        uint256 approvalsCount,
        uint256 timelockExpiration,
        uint256 timestamp
    );
    
    event RecoveryExecuted(
        uint256 indexed recoveryId,
        address indexed vault,
        address newOwner,
        uint256 timestamp
    );
    
    event RecoveryCancelled(
        uint256 indexed recoveryId,
        string reason,
        uint256 timestamp
    );
    
    event VaultRegisteredForRecovery(
        address indexed vault,
        uint256 quorum,
        address guardianToken,
        uint256 timestamp
    );

    // ==================== Vault Registration ====================
    
    /**
     * @dev Register vault for social recovery
     * @param vault Vault address
     * @param quorum Guardian votes needed for recovery
     * @param guardianToken Guardian SBT contract address
     */
    function registerVault(
        address vault,
        uint256 quorum,
        address guardianToken
    ) external {
        require(vault != address(0), "Invalid vault");
        require(guardianToken != address(0), "Invalid guardian token");
        require(quorum > 0, "Quorum must be > 0");
        require(!isManaged[vault], "Vault already registered");
        
        managedVaults.push(vault);
        isManaged[vault] = true;
        vaultQuorum[vault] = quorum;
        recoveryGuardianToken[vault] = guardianToken;
        
        emit VaultRegisteredForRecovery(vault, quorum, guardianToken, block.timestamp);
    }

    // ==================== Recovery Initiation ====================
    
    /**
     * @dev Initiate owner recovery process
     * @param vault Vault requiring recovery
     * @param newOwner Proposed new owner address
     * @param reason Reason for recovery (e.g., "Owner lost access to keys")
     * @return recoveryId ID of recovery process
     * 
     * Requirements:
     * - Vault must be registered
     * - New owner must be valid address (non-zero)
     * - Only guardians can initiate
     */
    function initiateRecovery(
        address vault,
        address newOwner,
        string calldata reason
    ) external returns (uint256) {
        require(isManaged[vault], "Vault not registered");
        require(newOwner != address(0), "Invalid new owner");
        require(bytes(reason).length > 0, "Reason required");
        
        // Verify caller is a guardian (has SBT)
        address guardianToken = recoveryGuardianToken[vault];
        require(
            IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0,
            "Only guardians can initiate recovery"
        );
        
        uint256 recoveryId = recoveryCounter++;
        uint256 votingDeadline = block.timestamp + VOTING_PERIOD;
        
        OwnerRecovery storage recovery = recoveries[recoveryId];
        recovery.recoveryId = recoveryId;
        recovery.vault = vault;
        recovery.newOwner = newOwner;
        recovery.initiator = msg.sender;
        recovery.initiatedAt = block.timestamp;
        recovery.votingDeadline = votingDeadline;
        recovery.status = RecoveryStatus.PENDING;
        recovery.reason = reason;
        
        vaultRecoveries[vault].push(recoveryId);
        totalRecoveryAttempts[vault]++;
        
        emit RecoveryInitiated(
            recoveryId,
            vault,
            newOwner,
            msg.sender,
            reason,
            votingDeadline,
            block.timestamp
        );
        
        return recoveryId;
    }

    // ==================== Guardian Voting ====================
    
    /**
     * @dev Guardian votes to approve recovery
     * @param recoveryId ID of recovery to vote on
     * @return approved True if quorum reached after this vote
     * 
     * Requirements:
     * - Recovery must be in PENDING status
     * - Voting period must not have ended
     * - Guardian must not have voted already
     */
    function approveRecovery(uint256 recoveryId) external returns (bool) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        
        require(recovery.vault != address(0), "Recovery not found");
        require(recovery.status == RecoveryStatus.PENDING, "Recovery not pending");
        require(block.timestamp <= recovery.votingDeadline, "Voting period ended");
        require(!recovery.hasVoted[msg.sender], "Already voted");
        
        // Verify caller is a guardian
        address guardianToken = recoveryGuardianToken[recovery.vault];
        require(
            IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0,
            "Only guardians can vote"
        );
        
        recovery.hasVoted[msg.sender] = true;
        recovery.approvalsCount++;
        
        emit RecoveryVoteReceived(recoveryId, msg.sender, recovery.approvalsCount, block.timestamp);
        
        // Check if quorum reached
        if (recovery.approvalsCount >= vaultQuorum[recovery.vault]) {
            recovery.status = RecoveryStatus.APPROVED;
            recovery.timelockExpiration = block.timestamp + TIMELOCK_DURATION;
            
            emit RecoveryQuorumReached(
                recoveryId,
                recovery.approvalsCount,
                recovery.timelockExpiration,
                block.timestamp
            );
            return true;
        }
        
        return false;
    }

    // ==================== Recovery Execution ====================
    
    /**
     * @dev Execute owner recovery after timelock expires
     * @param recoveryId ID of recovery to execute
     * @param vault Vault to reset owner for
     * 
     * Requirements:
     * - Recovery must be APPROVED
     * - Timelock must have expired
     * - Can be called by anyone
     */
    function executeRecovery(uint256 recoveryId, address vault) external {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        
        require(recovery.vault != address(0), "Recovery not found");
        require(recovery.vault == vault, "Vault mismatch");
        require(recovery.status == RecoveryStatus.APPROVED, "Recovery not approved");
        require(!recovery.executed, "Already executed");
        require(
            block.timestamp >= recovery.timelockExpiration,
            "Timelock not expired"
        );
        
        recovery.executed = true;
        recovery.status = RecoveryStatus.EXECUTED;
        recovery.executedAt = block.timestamp;
        
        successfulRecoveries[vault]++;
        
        emit RecoveryExecuted(
            recoveryId,
            vault,
            recovery.newOwner,
            block.timestamp
        );
    }

    // ==================== Recovery Cancellation ====================
    
    /**
     * @dev Cancel a pending recovery
     * @param recoveryId ID of recovery to cancel
     * @param reason Reason for cancellation
     * 
     * Requirements:
     * - Recovery must be PENDING
     * - Only initiator or vault can cancel
     */
    function cancelRecovery(uint256 recoveryId, string calldata reason) external {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        
        require(recovery.vault != address(0), "Recovery not found");
        require(recovery.status == RecoveryStatus.PENDING, "Cannot cancel non-pending recovery");
        require(
            msg.sender == recovery.initiator || msg.sender == recovery.vault,
            "Only initiator or vault can cancel"
        );
        
        recovery.status = RecoveryStatus.CANCELLED;
        
        emit RecoveryCancelled(recoveryId, reason, block.timestamp);
    }

    // ==================== Query Functions ====================
    
    /**
     * @dev Get recovery details
     * @param recoveryId ID of recovery
     * @return Recovery view with all details
     */
    function getRecovery(uint256 recoveryId) external view returns (RecoveryView memory) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        require(recovery.vault != address(0), "Recovery not found");
        
        uint256 secondsUntilVotingEnd = 0;
        if (block.timestamp < recovery.votingDeadline && recovery.status == RecoveryStatus.PENDING) {
            secondsUntilVotingEnd = recovery.votingDeadline - block.timestamp;
        }
        
        uint256 secondsUntilExecution = 0;
        if (block.timestamp < recovery.timelockExpiration && recovery.status == RecoveryStatus.APPROVED) {
            secondsUntilExecution = recovery.timelockExpiration - block.timestamp;
        }
        
        return RecoveryView({
            recoveryId: recovery.recoveryId,
            vault: recovery.vault,
            newOwner: recovery.newOwner,
            initiator: recovery.initiator,
            initiatedAt: recovery.initiatedAt,
            votingDeadline: recovery.votingDeadline,
            timelockExpiration: recovery.timelockExpiration,
            approvalsCount: recovery.approvalsCount,
            status: recovery.status,
            executed: recovery.executed,
            executedAt: recovery.executedAt,
            secondsUntilVotingEnd: secondsUntilVotingEnd,
            secondsUntilExecution: secondsUntilExecution,
            reason: recovery.reason
        });
    }
    
    /**
     * @dev Check if address voted on recovery
     * @param recoveryId ID of recovery
     * @param voter Address to check
     * @return True if voted
     */
    function hasVoted(uint256 recoveryId, address voter) external view returns (bool) {
        return recoveries[recoveryId].hasVoted[voter];
    }
    
    /**
     * @dev Get approvals needed for recovery
     * @param recoveryId ID of recovery
     * @return Approvals still needed
     */
    function approvalsNeeded(uint256 recoveryId) external view returns (uint256) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        require(recovery.vault != address(0), "Recovery not found");
        
        uint256 quorum = vaultQuorum[recovery.vault];
        if (recovery.approvalsCount >= quorum) {
            return 0;
        }
        return quorum - recovery.approvalsCount;
    }
    
    /**
     * @dev Get all recoveries for vault
     * @param vault Vault address
     * @return Array of recovery IDs
     */
    function getVaultRecoveries(address vault) external view returns (uint256[] memory) {
        return vaultRecoveries[vault];
    }
    
    /**
     * @dev Get recovery count for vault
     * @param vault Vault address
     * @return Count of recoveries
     */
    function getRecoveryCount(address vault) external view returns (uint256) {
        return vaultRecoveries[vault].length;
    }
    
    /**
     * @dev Get recovery statistics for vault
     * @param vault Vault address
     * @return totalAttempts Total recovery attempts
     * @return successful Successful recoveries
     * @return successRate Success rate (percentage)
     */
    function getRecoveryStats(address vault) external view returns (
        uint256 totalAttempts,
        uint256 successful,
        uint256 successRate
    ) {
        totalAttempts = totalRecoveryAttempts[vault];
        successful = successfulRecoveries[vault];
        
        if (totalAttempts == 0) {
            successRate = 0;
        } else {
            successRate = (successful * 100) / totalAttempts;
        }
    }
    
    /**
     * @dev Get vault quorum
     * @param vault Vault address
     * @return Quorum required
     */
    function getVaultQuorum(address vault) external view returns (uint256) {
        require(isManaged[vault], "Vault not managed");
        return vaultQuorum[vault];
    }
    
    /**
     * @dev Update vault quorum
     * @param vault Vault address
     * @param newQuorum New quorum value
     */
    function updateVaultQuorum(address vault, uint256 newQuorum) external {
        require(isManaged[vault], "Vault not managed");
        require(newQuorum > 0, "Quorum must be > 0");
        vaultQuorum[vault] = newQuorum;
    }
    
    /**
     * @dev Get time until voting ends
     * @param recoveryId Recovery ID
     * @return Seconds remaining (0 if ended or recovery not pending)
     */
    function getVotingTimeRemaining(uint256 recoveryId) external view returns (uint256) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        if (recovery.vault == address(0)) return 0;
        if (recovery.status != RecoveryStatus.PENDING) return 0;
        if (block.timestamp >= recovery.votingDeadline) return 0;
        return recovery.votingDeadline - block.timestamp;
    }
    
    /**
     * @dev Get time until execution is possible
     * @param recoveryId Recovery ID
     * @return Seconds remaining (0 if expired or recovery not approved)
     */
    function getTimelockRemaining(uint256 recoveryId) external view returns (uint256) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        if (recovery.vault == address(0)) return 0;
        if (recovery.status != RecoveryStatus.APPROVED) return 0;
        if (block.timestamp >= recovery.timelockExpiration) return 0;
        return recovery.timelockExpiration - block.timestamp;
    }
    
    /**
     * @dev Check if recovery can be executed now
     * @param recoveryId Recovery ID
     * @return True if all conditions met
     */
    function canExecuteNow(uint256 recoveryId) external view returns (bool) {
        OwnerRecovery storage recovery = recoveries[recoveryId];
        if (recovery.vault == address(0)) return false;
        if (recovery.status != RecoveryStatus.APPROVED) return false;
        if (recovery.executed) return false;
        if (block.timestamp < recovery.timelockExpiration) return false;
        return true;
    }
}

// ==================== Interface ====================

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}
