// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SpendVault
 * @notice Multi-signature treasury vault with guardian-based approvals
 * @dev Uses EIP-712 for signature verification and soulbound tokens for guardian verification
 */
contract SpendVault is Ownable, EIP712, ReentrancyGuard {

        // ============ Strategy Whitelist/Blacklist Integration ============

        /// @notice Check if a strategy is whitelisted in the manager
        function isStrategyWhitelisted(address strategy) public view returns (bool) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("whitelistedStrategies(address)", strategy));
            require(success, "Query failed");
            return abi.decode(data, (bool));
        }

        /// @notice Check if a strategy is blacklisted in the manager
        function isStrategyBlacklisted(address strategy) public view returns (bool) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("blacklistedStrategies(address)", strategy));
            require(success, "Query failed");
            return abi.decode(data, (bool));
        }

                    // ============ Multi-Chain Yield Aggregation Integration ============

                    /// @notice Get all strategies for this vault on a specific chain
                    function getVaultStrategiesByChain(uint256 chainId) public view returns (address[] memory) {
                        require(yieldStrategyManager != address(0), "Manager not set");
                        (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("getVaultStrategiesByChain(address,uint256)", address(this), chainId));
                        require(success, "Get strategies by chain failed");
                        return abi.decode(data, (address[]));
                    }

                    /// @notice Aggregate APY, risk, and count for all strategies (optionally by chain, chainId=0 for all)
                    function aggregateVaultAnalytics(uint256 chainId) public view returns (uint256 avgAPY, uint256 avgRisk, uint256 count) {
                        require(yieldStrategyManager != address(0), "Manager not set");
                        (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("aggregateVaultAnalytics(address,uint256)", address(this), chainId));
                        require(success, "Aggregate analytics failed");
                        return abi.decode(data, (uint256, uint256, uint256));
                    }
            // ============ Emergency Strategy Exit Integration ============

            /// @notice Trigger emergency exit from the current yield strategy via the manager
            function emergencyStrategyExit(uint256 amount) external {
                require(msg.sender == owner() || IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not authorized");
                require(yieldStrategyManager != address(0), "Manager not set");
                (bool success, ) = yieldStrategyManager.call(abi.encodeWithSignature("emergencyWithdraw(address,uint256)", address(this), amount));
                require(success, "Emergency exit failed");
            }
    // Guardian reputation event: logs every approval action
    event GuardianAction(address indexed guardian, string action, uint256 timestamp, address indexed vault, address indexed recipient, uint256 amount, string reason);
        // Yield strategy manager integration
        address public yieldStrategyManager;
        address public currentYieldStrategy;
        event YieldStrategyChanged(address indexed oldStrategy, address indexed newStrategy, uint256 timestamp);
        // ============ Strategy Analytics Integration ============

        // ============ User Strategy Preferences Integration ============

        /// @notice Set user strategy preferences (ordered list) in YieldStrategyManager
        function setUserStrategyPreferences(address[] calldata strategies) external {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, ) = yieldStrategyManager.call(abi.encodeWithSignature("setUserStrategyPreferences(address,address[])", address(this), strategies));
            require(success, "Set preferences failed");
        }

        /// @notice Get user strategy preferences for this vault from YieldStrategyManager
        function getUserStrategyPreferences(address user) public view returns (address[] memory) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("getUserStrategyPreferences(address,address)", user, address(this)));
            require(success, "Get preferences failed");
            return abi.decode(data, (address[]));
        }

        // Get latest analytics for a strategy from YieldStrategyManager
        function getLatestStrategyAnalytics(address strategy) public view returns (uint256 apy, uint256 riskScore, uint256 returnsAmount, uint256 timestamp) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("getLatestStrategyAnalytics(address)", strategy));
            require(success, "Get analytics failed");
            return abi.decode(data, (uint256, uint256, uint256, uint256));
        }

        // Get historical analytics for a strategy (last N snapshots)
        function getStrategyAnalyticsHistory(address strategy, uint256 n) public view returns (bytes memory) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("getStrategyAnalyticsHistory(address,uint256)", strategy, n));
            require(success, "Get analytics history failed");
            return data;
        }

                // Internal helper to check withdrawal caps
                function _checkWithdrawalCaps(address _token, uint256 amount) internal view {
                    WithdrawalCap memory cap = withdrawalCaps[_token];
                    uint256 dayIndex = block.timestamp / 1 days;
                    uint256 weekIndex = block.timestamp / 1 weeks;
                    uint256 monthIndex = block.timestamp / 30 days;
                    if (cap.daily > 0) {
                        uint256 usedDaily = withdrawnDaily[_token][dayIndex];
                        require(usedDaily + amount <= cap.daily, "Daily withdrawal cap exceeded");
                    }
                    if (cap.weekly > 0) {
                        uint256 usedWeekly = withdrawnWeekly[_token][weekIndex];
                        require(usedWeekly + amount <= cap.weekly, "Weekly withdrawal cap exceeded");
                    }
                    if (cap.monthly > 0) {
                        uint256 usedMonthly = withdrawnMonthly[_token][monthIndex];
                        require(usedMonthly + amount <= cap.monthly, "Monthly withdrawal cap exceeded");
                    }
                }
        // ============ Risk-Adjusted Yield Allocation Integration ============

        // Set user risk profile in YieldStrategyManager
        function setUserRiskProfile(uint8 profile) external {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, ) = yieldStrategyManager.call(abi.encodeWithSignature("setUserRiskProfile(uint8)", profile));
            require(success, "Set risk profile failed");
        }

        // Get vault allocation for a strategy (basis points, 0-10000)
        function getVaultStrategyAllocation(address strategy) public view returns (uint256) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("vaultStrategyAllocation(address,address)", address(this), strategy));
            require(success, "Get allocation failed");
            return abi.decode(data, (uint256));
        }

        // Suggest allocations for this vault and user
        function suggestAllocations(address user) public view returns (address[] memory strategies, uint256[] memory allocations) {
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, bytes memory data) = yieldStrategyManager.staticcall(abi.encodeWithSignature("suggestAllocations(address,address)", user, address(this)));
            require(success, "Suggest allocations failed");
            return abi.decode(data, (address[], uint256[]));
        }

                // Internal helper to update withdrawal counters
                function _updateWithdrawalCounters(address _token, uint256 amount) internal {
                    WithdrawalCap memory cap = withdrawalCaps[_token];
                    uint256 dayIndex = block.timestamp / 1 days;
                    uint256 weekIndex = block.timestamp / 1 weeks;
                    uint256 monthIndex = block.timestamp / 30 days;
                    if (cap.daily > 0) {
                        withdrawnDaily[_token][dayIndex] += amount;
                    }
                    if (cap.weekly > 0) {
                        withdrawnWeekly[_token][weekIndex] += amount;
                    }
                    if (cap.monthly > 0) {
                        withdrawnMonthly[_token][monthIndex] += amount;
                    }
                }
            // Helper struct for withdrawal cap checks (fixes stack too deep)
            struct UsedCaps { uint256 daily; uint256 weekly; uint256 monthly; }
        // ============ Vault Metadata ============
        string public name;
        string[] public tags;
        event NameChanged(string newName);
        event TagsChanged(string[] newTags);
    using ECDSA for bytes32;

    // State variables
    address public guardianToken;
    uint256 public quorum;
    uint256 public nonce;
        // Set yield strategy manager (owner only)
        function setYieldStrategyManager(address manager) external onlyOwner {
            require(manager != address(0), "Invalid manager address");
            yieldStrategyManager = manager;
        }

        // Set initial yield strategy (owner only)
        function setInitialYieldStrategy(address strategy) external onlyOwner {
            require(strategy != address(0), "Invalid strategy address");
            currentYieldStrategy = strategy;
        }

        // Called by YieldStrategyManager to switch strategy
        function onYieldStrategySwitched(address newStrategy) external {
            require(msg.sender == yieldStrategyManager, "Only manager can switch");
            address oldStrategy = currentYieldStrategy;
            currentYieldStrategy = newStrategy;
            emit YieldStrategyChanged(oldStrategy, newStrategy, block.timestamp);
        }

        // Trigger automated strategy switching (owner or guardian)
        function triggerAutoStrategySwitch() external {
            require(msg.sender == owner() || IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not authorized");
            require(yieldStrategyManager != address(0), "Manager not set");
            (bool success, ) = yieldStrategyManager.call(abi.encodeWithSignature("autoSwitchStrategy(address)", address(this)));
            require(success, "Strategy switch failed");
        }

    // ============ Policy-Based Withdrawal Rules ============

    struct WithdrawalPolicy {
        uint256 minAmount; // inclusive lower bound
        uint256 maxAmount; // inclusive upper bound (0 = no upper limit)
        uint256 requiredApprovals; // number of guardian signatures required
        uint256 cooldown; // cooldown in seconds for repeated withdrawals in this range
    }

    WithdrawalPolicy[] public withdrawalPolicies;
    mapping(address => mapping(uint256 => uint256)) public lastWithdrawalTime; // recipient => policyIdx => last timestamp

    // ============ Temporal Withdrawal Caps (per-vault, per-token) ============
    struct WithdrawalCap {
        uint256 daily;   // cap per 24h window (0 = no cap)
        uint256 weekly;  // cap per 7-day window (0 = no cap)
        uint256 monthly; // cap per 30-day window (0 = no cap)
    }

    struct SpendingLimitStatus {
        bool exceedsDaily;
        bool exceedsWeekly;
        bool exceedsMonthly;
        uint256 dailyUsed;
        uint256 weeklyUsed;
        uint256 monthlyUsed;
    }

    // caps configured by owner per token (use address(0) for native ETH)
    mapping(address => WithdrawalCap) public withdrawalCaps;

    // tracked withdrawn amounts for current period
    mapping(address => mapping(uint256 => uint256)) public withdrawnDaily;   // token => day => amount
    mapping(address => mapping(uint256 => uint256)) public withdrawnWeekly;  // token => week => amount
    mapping(address => mapping(uint256 => uint256)) public withdrawnMonthly; // token => month => amount

    // Enhanced approvals required for limit violations (stored per withdrawal nonce)
    mapping(uint256 => bool) public requiresEnhancedApprovals; // nonce => requires enhanced approvals
    mapping(uint256 => uint256) public enhancedApprovalsNeeded; // nonce => count needed
    mapping(uint256 => uint256) public enhancedApprovalsReceived; // nonce => count received

    // ============ Time-Locked Withdrawals ============
    struct QueuedWithdrawal {
        address token;
        uint256 amount;
        address recipient;
        uint256 queuedAt;
        uint256 readyAt; // block.timestamp when withdrawal can be executed
        string reason;
        string category;
        bool isFrozen;
        bool isExecuted;
        bool isCancelled;
        address[] signers; // guardians who approved this withdrawal
    }

    uint256 public timeLockDelay = 2 days; // Configurable delay for large withdrawals
    uint256 public largeTxThreshold = 1000 ether; // Threshold to trigger time-lock (configurable per token)
    mapping(address => uint256) public tokenTxThresholds; // Override per-token thresholds

    mapping(uint256 => QueuedWithdrawal) public queuedWithdrawals; // withdrawalId => QueuedWithdrawal
    uint256 public withdrawalQueueId; // Counter for unique withdrawal IDs

    mapping(uint256 => mapping(address => bool)) public frozenBy; // withdrawalId => guardian => has frozen

    // ============ Emergency Freeze Mechanism ============
    bool public vaultEmergencyFrozen; // True if vault is frozen due to suspected malicious activity
    uint256 public emergencyFreezeThreshold; // Number of guardians required to freeze (e.g., majority)
    mapping(address => bool) public emergencyFreezeVotes; // guardian => has voted to freeze
    mapping(address => bool) public emergencyUnfreezeVotes; // guardian => has voted to unfreeze
    uint256 public freezeVoteCount; // Current number of guardians voting to freeze
    uint256 public unfreezeVoteCount; // Current number of guardians voting to unfreeze
    uint256 public lastFreezeTimestamp; // Timestamp of last freeze action
    address[] public freezeVoters; // List of guardians who voted to freeze
    address[] public unfreezeVoters; // List of guardians who voted to unfreeze

    event VaultEmergencyFrozen(uint256 indexed voteCount, uint256 indexed threshold);
    event VaultEmergencyUnfrozen(uint256 indexed voteCount, uint256 indexed threshold);
    event EmergencyFreezeVoteCast(address indexed guardian, bool indexed voting_for_freeze, uint256 indexed current_votes);
    event EmergencyUnfreezeVoteCast(address indexed guardian, bool indexed voting_for_unfreeze, uint256 indexed current_votes);
    event EmergencyFreezeThresholdUpdated(uint256 newThreshold);

    event WithdrawalQueued(
        uint256 indexed withdrawalId,
        address indexed token,
        uint256 amount,
        address indexed recipient,
        uint256 readyAt
    );

    event WithdrawalExecuted(uint256 indexed withdrawalId);
    event WithdrawalCancelled(uint256 indexed withdrawalId, address indexed cancelledBy);
    event WithdrawalFrozen(uint256 indexed withdrawalId, address indexed frozenBy);
    event WithdrawalUnfrozen(uint256 indexed withdrawalId, address indexed unfrozenBy);
    event TimeLockDelayUpdated(uint256 newDelay);
    event LargeTxThresholdUpdated(address indexed token, uint256 newThreshold);

    event WithdrawalCapsSet(address indexed token, uint256 daily, uint256 weekly, uint256 monthly);
    event SpendingLimitExceeded(address indexed token, string limitType, uint256 attemptedAmount, uint256 limit);
    event EnhancedApprovalsRequired(uint256 indexed nonce, uint256 approvalsNeeded, string limitExceeded);

    event WithdrawalPolicySet(uint256 indexed policyIdx, uint256 minAmount, uint256 maxAmount, uint256 requiredApprovals, uint256 cooldown);
    event WithdrawalPoliciesCleared();

    /**
     * @notice Set withdrawal policies (overwrites all existing policies)
     * @param policies Array of WithdrawalPolicy structs
     */
    function setWithdrawalPolicies(WithdrawalPolicy[] calldata policies) external onlyOwner {
        delete withdrawalPolicies;
        for (uint256 i = 0; i < policies.length; i++) {
            require(policies[i].requiredApprovals > 0, "Approvals must be > 0");
            withdrawalPolicies.push(policies[i]);
            WithdrawalPolicy memory p = policies[i];
            emit WithdrawalPolicySet(i, p.minAmount, p.maxAmount, p.requiredApprovals, p.cooldown);
        }
        emit WithdrawalPoliciesCleared();
    }

    /**
     * @notice Set per-token temporal withdrawal caps (owner only)
     * @param token Token address (address(0) for native ETH)
     * @param daily Daily cap (in wei/token units) - 0 to disable
     * @param weekly Weekly cap (in wei/token units) - 0 to disable
     * @param monthly Monthly cap (in wei/token units) - 0 to disable
     */
    function setWithdrawalCaps(address token, uint256 daily, uint256 weekly, uint256 monthly) external onlyOwner {
        withdrawalCaps[token] = WithdrawalCap({ daily: daily, weekly: weekly, monthly: monthly });
        emit WithdrawalCapsSet(token, daily, weekly, monthly);
    }

    /**
     * @notice Check current spending status against limits
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     * @return status SpendingLimitStatus struct with current usage and violations
     */
    function checkSpendingLimitStatus(address token, uint256 amount) 
        external 
        view 
        returns (SpendingLimitStatus memory status) 
    {
        WithdrawalCap memory cap = withdrawalCaps[token];
        uint256 dayIndex = block.timestamp / 1 days;
        uint256 weekIndex = block.timestamp / 1 weeks;
        uint256 monthIndex = block.timestamp / 30 days;

        status.dailyUsed = withdrawnDaily[token][dayIndex];
        status.weeklyUsed = withdrawnWeekly[token][weekIndex];
        status.monthlyUsed = withdrawnMonthly[token][monthIndex];

        if (cap.daily > 0) {
            status.exceedsDaily = (status.dailyUsed + amount > cap.daily);
        }
        if (cap.weekly > 0) {
            status.exceedsWeekly = (status.weeklyUsed + amount > cap.weekly);
        }
        if (cap.monthly > 0) {
            status.exceedsMonthly = (status.monthlyUsed + amount > cap.monthly);
        }
    }

    /**
     * @notice Get total guardian count for this vault
     * @return Number of guardians
     */
    function getGuardianCount() public view returns (uint256) {
        return guardians.length;
    }

    /**
     * @notice Calculate required approvals for a limit-violated withdrawal
     * @return Number of additional guardian approvals required
     */
    function getEnhancedApprovalsRequired() public view returns (uint256) {
        uint256 totalGuardians = getGuardianCount();
        // Require 75% of guardians (rounded up) for limit violations
        return (totalGuardians * 3) / 4 + ((totalGuardians * 3) % 4 != 0 ? 1 : 0);
    }

    /**
     * @notice Get the number of configured policies
     */
    function withdrawalPoliciesCount() external view returns (uint256) {
        return withdrawalPolicies.length;
    }

    /**
     * @notice Get the applicable withdrawal policy index for a given amount
     */
    function getPolicyIndex(uint256 amount) public view returns (uint256) {
        for (uint256 i = 0; i < withdrawalPolicies.length; i++) {
            WithdrawalPolicy memory p = withdrawalPolicies[i];
            if (amount >= p.minAmount && (p.maxAmount == 0 || amount <= p.maxAmount)) {
                return i;
            }
        }
        revert("No policy for amount");
    }

    /**
     * @notice Get the applicable withdrawal policy for a given amount
     */
    function getPolicy(uint256 amount) public view returns (WithdrawalPolicy memory) {
        return withdrawalPolicies[getPolicyIndex(amount)];
    }


                    /**
                     * @notice Request transfer of vault ownership (owner only, requires guardian approval)
                     * @param newOwner Address to transfer ownership to
                     */
                    function requestVaultTransfer(address newOwner) external onlyOwner {
                        require(newOwner != address(0), "Invalid new owner");
                        uint256 id = transferRequestCount++;
                        TransferRequest storage tr = transferRequests[id];
                        tr.newOwner = newOwner;
                        tr.executed = false;
                        tr.createdAt = block.timestamp;
                        emit TransferRequested(id, newOwner, block.timestamp);
                    }

                    /**
                     * @notice Approve a vault transfer (guardian only)
                     * @param id Transfer request id
                     */
                    function approveVaultTransfer(uint256 id) external {
                        TransferRequest storage tr = transferRequests[id];
                        require(!tr.executed, "Already executed");
                        require(tr.newOwner != address(0), "No transfer request");
                        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Only guardians");
                        // Prevent duplicate approvals
                        for (uint256 i = 0; i < tr.approvals.length; i++) {
                            require(tr.approvals[i] != msg.sender, "Already approved");
                        }
                        tr.approvals.push(msg.sender);
                        guardianReputations[msg.sender].approvalsCount++;
                        guardianReputations[msg.sender].lastActiveTimestamp = block.timestamp;
                        emit TransferApproved(id, msg.sender);
                    }

                    /**
                     * @notice Execute vault transfer after guardian quorum
                     * @param id Transfer request id
                     */
                    function executeVaultTransfer(uint256 id) external {
                        TransferRequest storage tr = transferRequests[id];
                        require(!tr.executed, "Already executed");
                        require(tr.newOwner != address(0), "No transfer request");
                        require(tr.approvals.length >= quorum, "Quorum not met");
                        address oldOwner = owner();
                        tr.executed = true;
                        _transferOwnership(tr.newOwner);
                        emit TransferExecuted(id, oldOwner, tr.newOwner);
                    }
                /**
                 * @notice Get vault health score and status
                 * @return score Health score (0-100)
                 * @return status Status string ("Healthy", "Warning", "Critical")
                 */
                function getVaultHealth() external view returns (uint256 score, string memory status) {
                    // 1. Number of guardians
                    uint256 guardianCount = 0;
                    // This assumes GuardianSBT supports totalSupply()
                    try IGuardianSBT(guardianToken).balanceOf(address(0)) returns (uint256 supply) {
                        guardianCount = supply;
                    } catch {
                        guardianCount = quorum + 1; // fallback
                    }

                    // 2. Quorum percentage
                    uint256 quorumPercent = 0;
                    if (guardianCount > 0) {
                        quorumPercent = (quorum * 100) / guardianCount;
                    }

                    // 3. Guardian activity (average lastActiveTimestamp)
                    uint256 activeSum = 0;
                    uint256 activeCount = 0;
                    for (uint256 i = 0; i < guardianCount; i++) {
                        // This assumes a way to enumerate guardians, e.g., via GuardianSBT
                        // For demo, use owner and contract address as stand-ins
                        address g = i == 0 ? owner() : address(this);
                        GuardianReputation memory rep = guardianReputations[g];
                        if (rep.lastActiveTimestamp > 0) {
                            activeSum += block.timestamp - rep.lastActiveTimestamp;
                            activeCount++;
                        }
                    }
                    uint256 avgInactiveDays = activeCount > 0 ? (activeSum / activeCount) / 1 days : 0;

                    // 4. Emergency mode
                    bool emergency = unlockRequestTime > 0;

                    // Scoring logic
                    score = 100;
                    if (guardianCount < quorum || quorumPercent > 80) {
                        score -= 30;
                    }
                    if (avgInactiveDays > 30) {
                        score -= 30;
                    } else if (avgInactiveDays > 7) {
                        score -= 10;
                    }
                    if (emergency) {
                        score -= 40;
                    }
                    if (score >= 70) {
                        status = "Healthy";
                    } else if (score >= 40) {
                        status = "Warning";
                    } else {
                        status = "Critical";
                    }
                }
            // Withdrawal metadata struct
            struct WithdrawalMetadata {
                string category;
                bytes32 reasonHash;
                uint256 createdAt;
            }
            mapping(uint256 => WithdrawalMetadata) public withdrawalMetadatas; // nonce => metadata

            // Scheduled Withdrawals
            struct ScheduledWithdrawal {
                address token;
                uint256 amount;
                address recipient;
                string reason;
                string category;
                uint256 scheduledFor;
                uint256 createdAt;
                bool executed;
                address[] approvals;
            }
            mapping(uint256 => ScheduledWithdrawal) public scheduledWithdrawals; // id => withdrawal
            uint256 public scheduledWithdrawalCount;

            event WithdrawalScheduled(uint256 indexed id, address indexed token, uint256 amount, address indexed recipient, uint256 scheduledFor, string reason, string category);
            event ScheduledWithdrawalApproved(uint256 indexed id, address indexed guardian);
            event ScheduledWithdrawalExecuted(uint256 indexed id);
            /**
             * @notice Schedule a future withdrawal (requires guardian approval)
             * @param token Token address (address(0) for ETH)
             * @param amount Amount to withdraw
             * @param recipient Recipient address
             * @param reason Reason for withdrawal
             * @param category Category for withdrawal
             * @param scheduledFor Timestamp for execution
             */
            function scheduleWithdrawal(
                address token,
                uint256 amount,
                address recipient,
                string memory reason,
                string memory category,
                uint256 scheduledFor
            ) external onlyOwner {
                require(recipient != address(0), "Invalid recipient");
                require(amount > 0, "Amount must be greater than 0");
                require(scheduledFor > block.timestamp, "Scheduled time must be in future");
                uint256 id = scheduledWithdrawalCount++;
                ScheduledWithdrawal storage sw = scheduledWithdrawals[id];
                sw.token = token;
                sw.amount = amount;
                sw.recipient = recipient;
                sw.reason = reason;
                sw.category = category;
                sw.scheduledFor = scheduledFor;
                sw.createdAt = block.timestamp;
                sw.executed = false;
                emit WithdrawalScheduled(id, token, amount, recipient, scheduledFor, reason, category);
            }

            /**
             * @notice Approve a scheduled withdrawal (by guardian)
             * @param id Scheduled withdrawal id
             */
            function approveScheduledWithdrawal(uint256 id) external {
                ScheduledWithdrawal storage sw = scheduledWithdrawals[id];
                require(!sw.executed, "Already executed");
                require(sw.scheduledFor > 0, "Not scheduled");
                require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Only guardians");
                // Prevent duplicate approvals
                for (uint256 i = 0; i < sw.approvals.length; i++) {
                    require(sw.approvals[i] != msg.sender, "Already approved");
                }
                sw.approvals.push(msg.sender);
                guardianReputations[msg.sender].approvalsCount++;
                guardianReputations[msg.sender].lastActiveTimestamp = block.timestamp;
                emit ScheduledWithdrawalApproved(id, msg.sender);
            }

            /**
             * @notice Execute scheduled withdrawal after time and quorum
             * @param id Scheduled withdrawal id
             */
            function executeScheduledWithdrawal(uint256 id) external nonReentrant {
                ScheduledWithdrawal storage sw = scheduledWithdrawals[id];
                require(!sw.executed, "Already executed");
                require(sw.scheduledFor > 0, "Not scheduled");
                require(block.timestamp >= sw.scheduledFor, "Too early");
                require(sw.approvals.length >= quorum, "Quorum not met");
                sw.executed = true;
                // Transfer funds
                if (sw.token == address(0)) {
                    require(address(this).balance >= sw.amount, "Insufficient ETH");
                    (bool success, ) = sw.recipient.call{value: sw.amount}("");
                    require(success, "ETH transfer failed");
                } else {
                    IERC20(sw.token).transfer(sw.recipient, sw.amount);
                }
                emit ScheduledWithdrawalExecuted(id);
                emit Withdrawn(sw.token, sw.recipient, sw.amount, sw.reason, sw.category, keccak256(bytes(sw.reason)), sw.createdAt);
            }
        // Emergency guardian rotation
        struct GuardianRotation {
            address inactiveGuardian;
            address proposedReplacement;
            uint256 proposalTime;
            address[] approvals;
            bool completed;
        }
        mapping(address => GuardianRotation) public guardianRotations; // inactiveGuardian => rotation
        uint256 public constant ROTATION_DELAY = 14 days;

        event GuardianRotationProposed(address indexed inactiveGuardian, address indexed replacement, uint256 proposalTime);
        event GuardianRotationApproved(address indexed inactiveGuardian, address indexed approver);
        event GuardianRotationCompleted(address indexed oldGuardian, address indexed newGuardian);
        /**
         * @notice Propose emergency guardian rotation if inactive >60 days
         * @param inactiveGuardian Address of inactive guardian
         * @param replacement Address of proposed replacement
         */
        function proposeGuardianRotation(address inactiveGuardian, address replacement) external onlyOwner {
            require(inactiveGuardian != address(0) && replacement != address(0), "Invalid address");
            GuardianReputation memory rep = guardianReputations[inactiveGuardian];
            require(rep.lastActiveTimestamp > 0 && block.timestamp > rep.lastActiveTimestamp + 60 days, "Guardian not inactive");
            GuardianRotation storage rotation = guardianRotations[inactiveGuardian];
            require(!rotation.completed, "Rotation already completed");
            rotation.inactiveGuardian = inactiveGuardian;
            rotation.proposedReplacement = replacement;
            rotation.proposalTime = block.timestamp;
            delete rotation.approvals;
            rotation.completed = false;
            emit GuardianRotationProposed(inactiveGuardian, replacement, block.timestamp);
        }

        /**
         * @notice Approve emergency guardian rotation (by active guardian)
         * @param inactiveGuardian Address of inactive guardian
         */
        function approveGuardianRotation(address inactiveGuardian) external {
            GuardianRotation storage rotation = guardianRotations[inactiveGuardian];
            require(rotation.proposalTime > 0 && !rotation.completed, "No active proposal");
            require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Only active guardians");
            // Prevent duplicate approvals
            for (uint256 i = 0; i < rotation.approvals.length; i++) {
                require(rotation.approvals[i] != msg.sender, "Already approved");
            }
            rotation.approvals.push(msg.sender);
            emit GuardianRotationApproved(inactiveGuardian, msg.sender);
        }

        /**
         * @notice Execute guardian rotation after approvals or time delay
         * @param inactiveGuardian Address of inactive guardian
         */
        function executeGuardianRotation(address inactiveGuardian) external onlyOwner {
            GuardianRotation storage rotation = guardianRotations[inactiveGuardian];
            require(rotation.proposalTime > 0 && !rotation.completed, "No active proposal");
            // Count active guardians (excluding inactive)
            uint256 activeCount = 0;
            // This assumes a way to enumerate all guardians; for now, require at least quorum-1 approvals
            if (rotation.approvals.length >= quorum - 1 || block.timestamp > rotation.proposalTime + ROTATION_DELAY) {
                // Prevent reducing below quorum
                require(quorum <= rotation.approvals.length + 1, "Cannot reduce below quorum");
                // Remove inactive guardian and add replacement
                // This requires updating the GuardianSBT contract externally (owner must call burn/mint)
                rotation.completed = true;
                emit GuardianRotationCompleted(inactiveGuardian, rotation.proposedReplacement);
            } else {
                revert("Not enough approvals or time delay");
            }
        }
    using ECDSA for bytes32;

    // State variables
    address public guardianToken;
    uint256 public quorum;
    uint256 public nonce;

    // Guardian reputation system
    struct GuardianReputation {
        uint256 approvalsCount;
        uint256 rejectionsCount;
        uint256 lastActiveTimestamp;
    }
    mapping(address => GuardianReputation) public guardianReputations;

    // Weighted quorum mode
    bool public weightedQuorumEnabled;
    uint256 public weightedQuorumThreshold; // e.g., 1000 (trust score sum required)

    // Emergency unlock state
    uint256 public unlockRequestTime;
    uint256 public constant TIMELOCK_DURATION = 30 days;

    // EIP-712 Type Hash
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,string reason,string category,uint256 createdAt)"
    );

    // Events
    event Deposited(address indexed token, address indexed from, uint256 amount);
    event Withdrawn(address indexed token, address indexed recipient, uint256 amount, string reason, string category, bytes32 reasonHash, uint256 createdAt);
    event GuardianSignature(address indexed guardian, uint256 nonce, string category, bytes32 reasonHash, uint256 createdAt);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event GuardianTokenUpdated(address oldToken, address newToken);
    event EmergencyUnlockRequested(uint256 unlockTime);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor(
        address _guardianToken,
        uint256 _quorum,
        string memory _name,
        string[] memory _tags
    ) Ownable(msg.sender) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token address");
        require(_quorum > 0, "Quorum must be greater than 0");
        
        // Validate name and tags
        _validateName(_name);
        _validateTags(_tags);
        
        guardianToken = _guardianToken;
        quorum = _quorum;
        name = _name;
        for (uint256 i = 0; i < _tags.length; i++) {
            tags.push(_tags[i]);
        }
        // Initialize emergency freeze threshold to majority (50% + 1)
        emergencyFreezeThreshold = (_quorum / 2) + 1;
        vaultEmergencyFrozen = false;
    }

    /**
     * @notice Set the vault name (owner only)
     * @param newName New name for the vault (max 64 characters)
     */
    function setName(string memory newName) external onlyOwner {
        _validateName(newName);
        name = newName;
        emit NameChanged(newName);
    }

    /**
     * @notice Set the vault tags (owner only)
     * @param newTags New tags array (max 10 tags)
     */
    function setTags(string[] memory newTags) external onlyOwner {
        _validateTags(newTags);
        delete tags;
        for (uint256 i = 0; i < newTags.length; i++) {
            tags.push(newTags[i]);
        }
        emit TagsChanged(newTags);
    }

    // ============ Management Functions ============

    /**
     * @notice Update the required number of guardian signatures
     * @param _newQuorum New quorum value
     */
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be greater than 0");
        uint256 oldQuorum = quorum;
        quorum = _newQuorum;
        emit QuorumUpdated(oldQuorum, _newQuorum);
    }

    /**
     * @notice Enable or disable weighted quorum mode
     * @param enabled True to enable, false to disable
     * @param threshold Trust score sum required for weighted quorum
     */
    function setWeightedQuorum(bool enabled, uint256 threshold) external onlyOwner {
        weightedQuorumEnabled = enabled;
        weightedQuorumThreshold = threshold;
    }
    }

    /**
     * @notice Update the guardian token contract address
     * @param _newAddress New guardian token address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        address oldToken = guardianToken;
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(oldToken, _newAddress);
    }

    // ============ Funding Functions ============

    /**
     * @notice Receive native ETH
     */
    receive() external payable {
        emit Deposited(address(0), msg.sender, msg.value);
    }

    /**
     * @notice Fallback function to receive ETH
     */
    fallback() external payable {
        emit Deposited(address(0), msg.sender, msg.value);
    }

    /**
     * @notice Deposit ERC20 tokens
     * @param token Token address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposited(token, msg.sender, amount);
    }

    // ============ Withdrawal Functions ============

    /**
     * @notice Withdraw funds with guardian signatures
     * @param token Token address (address(0) for native ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Reason for withdrawal
     * @param signatures Array of guardian signatures
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        string memory category,
        uint256 createdAt,
        bytes[] memory signatures
    ) external nonReentrant {
        require(!vaultEmergencyFrozen, "Vault is emergency frozen");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(signatures.length > 0, "No signatures provided");

        bytes32 reasonHash = keccak256(bytes(reason));
        // Build EIP-712 hash
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                nonce,
                reasonHash,
                keccak256(bytes(category)),
                createdAt
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        // Store metadata
        withdrawalMetadatas[nonce] = WithdrawalMetadata({
            category: category,
            reasonHash: reasonHash,
            createdAt: createdAt
        });

        // Verify signatures
        address[] memory signers = new address[](signatures.length);
        uint256 validSignatures = 0;
        uint256 trustScoreSum = 0;

        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = hash.recover(signatures[i]);
            // Check if signer is a guardian
            require(
                IGuardianSBT(guardianToken).balanceOf(signer) > 0,
                "Signer is not a guardian"
            );
            // Check for duplicate signers
            for (uint256 j = 0; j < validSignatures; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[validSignatures] = signer;
            validSignatures++;

            // Update guardian reputation
            guardianReputations[signer].approvalsCount++;
            guardianReputations[signer].lastActiveTimestamp = block.timestamp;

            // Calculate trust score for weighted quorum
            trustScoreSum += getGuardianTrustScore(signer);

            // Emit event linking signature to metadata
            emit GuardianSignature(signer, nonce, category, reasonHash, createdAt);
        }

        // Check spending limits
        address _token = token;
        SpendingLimitStatus memory limitStatus = checkSpendingLimitStatus(_token, amount);
        bool limitViolated = limitStatus.exceedsDaily || limitStatus.exceedsWeekly || limitStatus.exceedsMonthly;
        
        uint256 requiredApprovals;
        
        if (limitViolated) {
            // Enhanced approvals required for limit violations
            requiredApprovals = getEnhancedApprovalsRequired();
            require(validSignatures >= requiredApprovals, "Enhanced approvals required for spending limit violation");
            
            // Track enhanced approval requirement for this withdrawal
            requiresEnhancedApprovals[nonce] = true;
            enhancedApprovalsNeeded[nonce] = requiredApprovals;
            
            // Emit event with details
            string memory limitType = limitStatus.exceedsDaily ? "daily" : 
                                      limitStatus.exceedsWeekly ? "weekly" : "monthly";
            uint256 limitAmount = limitStatus.exceedsDaily ? withdrawalCaps[_token].daily :
                                 limitStatus.exceedsWeekly ? withdrawalCaps[_token].weekly :
                                 withdrawalCaps[_token].monthly;
            emit SpendingLimitExceeded(_token, limitType, amount, limitAmount);
            emit EnhancedApprovalsRequired(nonce, requiredApprovals, limitType);
        } else {
            // Standard quorum validation for normal withdrawals
            if (weightedQuorumEnabled) {
                require(trustScoreSum >= weightedQuorumThreshold, "Weighted quorum not met");
            } else {
                require(validSignatures >= quorum, "Quorum not met");
            }
        }

        // Enforce temporal caps (per-token/per-vault)
        _checkWithdrawalCaps(_token, amount);

        // Increment nonce to prevent replay attacks
        nonce++;

        // Execute transfer
        if (token == address(0)) {
            // Native ETH transfer
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC20 transfer
            IERC20(token).transfer(recipient, amount);
        }

        _updateWithdrawalCounters(_token, amount);

        emit Withdrawn(token, recipient, amount, reason, category, reasonHash, createdAt);

        // Record withdrawal time for cooldown (moved after stack variables released)
        uint256 policyIdx = getPolicyIndex(amount);
        WithdrawalPolicy memory policy = withdrawalPolicies[policyIdx];
        if (policy.cooldown > 0) {
            lastWithdrawalTime[recipient][policyIdx] = block.timestamp;
        }
    }

    // ============ Time-Locked Withdrawal Functions ============

    /**
     * @notice Queue a large withdrawal with time-lock protection
     * Withdrawals exceeding the threshold must wait before execution
     * During the delay, guardians can cancel or freeze the transaction
     */
    function queueWithdrawal(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        string memory category,
        bytes[] memory signatures
    ) external nonReentrant returns (uint256 withdrawalId) {
        require(!vaultEmergencyFrozen, "Vault is emergency frozen");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        // Check if this withdrawal needs time-lock
        uint256 threshold = tokenTxThresholds[token] > 0 ? tokenTxThresholds[token] : largeTxThreshold;
        bool needsTimeLock = amount >= threshold;

        if (needsTimeLock) {
            // Verify signatures for queuing
            _verifyWithdrawalSignatures(token, amount, recipient, reason, category, signatures);

            // Get withdrawal ID
            withdrawalId = withdrawalQueueId++;

            // Calculate ready time
            uint256 readyAt = block.timestamp + timeLockDelay;

            // Store queued withdrawal
            queuedWithdrawals[withdrawalId] = QueuedWithdrawal({
                token: token,
                amount: amount,
                recipient: recipient,
                queuedAt: block.timestamp,
                readyAt: readyAt,
                reason: reason,
                category: category,
                isFrozen: false,
                isExecuted: false,
                isCancelled: false,
                signers: _getSignersFromSignatures(token, amount, recipient, reason, category, signatures)
            });

            emit WithdrawalQueued(withdrawalId, token, amount, recipient, readyAt);
        } else {
            // Small withdrawals execute immediately
            withdraw(token, amount, recipient, reason, category, block.timestamp, signatures);
        }
    }

    /**
     * @notice Execute a queued withdrawal after time-lock expires
     */
    function executeQueuedWithdrawal(uint256 withdrawalId) external nonReentrant {
        QueuedWithdrawal storage queued = queuedWithdrawals[withdrawalId];
        
        require(!queued.isExecuted, "Already executed");
        require(!queued.isCancelled, "Withdrawal was cancelled");
        require(!queued.isFrozen, "Withdrawal is frozen");
        require(block.timestamp >= queued.readyAt, "Time-lock not expired");

        // Mark as executed
        queued.isExecuted = true;

        // Execute transfer
        address token = queued.token;
        uint256 amount = queued.amount;
        address recipient = queued.recipient;

        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            IERC20(token).transfer(recipient, amount);
        }

        // Update counters
        _updateWithdrawalCounters(token, amount);

        emit WithdrawalExecuted(withdrawalId);
    }

    /**
     * @notice Cancel a queued withdrawal (owner or guardians)
     */
    function cancelQueuedWithdrawal(uint256 withdrawalId) external {
        QueuedWithdrawal storage queued = queuedWithdrawals[withdrawalId];
        
        require(!queued.isExecuted, "Already executed");
        require(!queued.isCancelled, "Already cancelled");

        // Only owner or signers (guardians) can cancel
        bool isOwner = msg.sender == owner();
        bool isSigner = false;
        for (uint256 i = 0; i < queued.signers.length; i++) {
            if (queued.signers[i] == msg.sender) {
                isSigner = true;
                break;
            }
        }
        
        require(isOwner || isSigner, "Only owner or signers can cancel");

        queued.isCancelled = true;
        emit WithdrawalCancelled(withdrawalId, msg.sender);
    }

    /**
     * @notice Freeze a queued withdrawal (guardians only)
     * Used when something looks wrong and additional review is needed
     */
    function freezeQueuedWithdrawal(uint256 withdrawalId) external {
        QueuedWithdrawal storage queued = queuedWithdrawals[withdrawalId];
        
        require(!queued.isExecuted, "Already executed");
        require(!queued.isCancelled, "Already cancelled");

        // Only guardians can freeze
        require(
            IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0,
            "Only guardians can freeze"
        );

        // Mark as frozen
        queued.isFrozen = true;
        frozenBy[withdrawalId][msg.sender] = true;

        emit WithdrawalFrozen(withdrawalId, msg.sender);
    }

    /**
     * @notice Unfreeze a queued withdrawal (only the guardian who froze it)
     */
    function unfreezeQueuedWithdrawal(uint256 withdrawalId) external {
        QueuedWithdrawal storage queued = queuedWithdrawals[withdrawalId];
        
        require(queued.isFrozen, "Not frozen");
        require(frozenBy[withdrawalId][msg.sender], "You didn't freeze this withdrawal");

        // Check if any other guardian still has it frozen
        bool stillFrozen = false;
        for (uint256 i = 0; i < queued.signers.length; i++) {
            if (i != i) continue; // placeholder, would iterate through guardians
            if (frozenBy[withdrawalId][queued.signers[i]] && queued.signers[i] != msg.sender) {
                stillFrozen = true;
                break;
            }
        }

        if (!stillFrozen) {
            queued.isFrozen = false;
        }
        
        frozenBy[withdrawalId][msg.sender] = false;
        emit WithdrawalUnfrozen(withdrawalId, msg.sender);
    }

    /**
     * @notice Update time-lock delay (owner only)
     */
    function setTimeLockDelay(uint256 newDelay) external onlyOwner {
        require(newDelay > 0, "Delay must be greater than 0");
        timeLockDelay = newDelay;
        emit TimeLockDelayUpdated(newDelay);
    }

    /**
     * @notice Update large transaction threshold (owner only)
     */
    function setLargeTxThreshold(uint256 newThreshold) external onlyOwner {
        largeTxThreshold = newThreshold;
        emit LargeTxThresholdUpdated(address(0), newThreshold);
    }

    /**
     * @notice Update threshold per token (owner only)
     */
    function setTokenThreshold(address token, uint256 threshold) external onlyOwner {
        tokenTxThresholds[token] = threshold;
        emit LargeTxThresholdUpdated(token, threshold);
    }

    /**
     * @notice Get queued withdrawal details
     */
    function getQueuedWithdrawal(uint256 withdrawalId)
        external
        view
        returns (
            address token,
            uint256 amount,
            address recipient,
            uint256 queuedAt,
            uint256 readyAt,
            bool isFrozen,
            bool isExecuted,
            bool isCancelled,
            uint256 freezeCount
        )
    {
        QueuedWithdrawal storage queued = queuedWithdrawals[withdrawalId];
        
        // Count how many guardians have frozen this
        uint256 freezeCount = 0;
        for (uint256 i = 0; i < queued.signers.length; i++) {
            if (frozenBy[withdrawalId][queued.signers[i]]) {
                freezeCount++;
            }
        }

        return (
            queued.token,
            queued.amount,
            queued.recipient,
            queued.queuedAt,
            queued.readyAt,
            queued.isFrozen,
            queued.isExecuted,
            queued.isCancelled,
            freezeCount
        );
    }

    // ============ Emergency Freeze Functions ============

    /**
     * @notice Cast a vote to freeze the vault due to suspected malicious activity
     * @dev Any guardian can initiate an emergency freeze vote
     * Vault freezes when majority threshold is reached
     */
    function voteEmergencyFreeze() external nonReentrant {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Only guardians can freeze vault");
        require(!emergencyFreezeVotes[msg.sender], "Guardian already voted to freeze");
        require(!vaultEmergencyFrozen, "Vault already frozen");

        // Clear any existing unfreeze votes from this guardian
        if (emergencyUnfreezeVotes[msg.sender]) {
            emergencyUnfreezeVotes[msg.sender] = false;
            unfreezeVoteCount--;
            // Remove from unfreezeVoters array
            for (uint256 i = 0; i < unfreezeVoters.length; i++) {
                if (unfreezeVoters[i] == msg.sender) {
                    unfreezeVoters[i] = unfreezeVoters[unfreezeVoters.length - 1];
                    unfreezeVoters.pop();
                    break;
                }
            }
        }

        // Record the freeze vote
        emergencyFreezeVotes[msg.sender] = true;
        freezeVoteCount++;
        freezeVoters.push(msg.sender);
        lastFreezeTimestamp = block.timestamp;

        emit EmergencyFreezeVoteCast(msg.sender, true, freezeVoteCount);

        // Freeze vault if threshold reached
        if (freezeVoteCount >= emergencyFreezeThreshold) {
            vaultEmergencyFrozen = true;
            emit VaultEmergencyFrozen(freezeVoteCount, emergencyFreezeThreshold);
        }
    }

    /**
     * @notice Revoke emergency freeze vote and/or vote to unfreeze
     * @dev If vault is frozen, this counts as a vote to unfreeze
     * If not frozen, this just revokes the freeze vote
     */
    function voteEmergencyUnfreeze() external nonReentrant {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Only guardians can unfreeze vault");
        require(vaultEmergencyFrozen || emergencyFreezeVotes[msg.sender], "No freeze to unfreeze or no freeze vote to revoke");

        // If there's a freeze vote, revoke it
        if (emergencyFreezeVotes[msg.sender]) {
            emergencyFreezeVotes[msg.sender] = false;
            freezeVoteCount--;
            // Remove from freezeVoters array
            for (uint256 i = 0; i < freezeVoters.length; i++) {
                if (freezeVoters[i] == msg.sender) {
                    freezeVoters[i] = freezeVoters[freezeVoters.length - 1];
                    freezeVoters.pop();
                    break;
                }
            }
        }

        // If vault is frozen, record unfreeze vote
        if (vaultEmergencyFrozen) {
            require(!emergencyUnfreezeVotes[msg.sender], "Guardian already voted to unfreeze");
            
            emergencyUnfreezeVotes[msg.sender] = true;
            unfreezeVoteCount++;
            unfreezeVoters.push(msg.sender);

            emit EmergencyUnfreezeVoteCast(msg.sender, true, unfreezeVoteCount);

            // Unfreeze vault if threshold reached
            if (unfreezeVoteCount >= emergencyFreezeThreshold) {
                vaultEmergencyFrozen = false;
                // Clear all freeze and unfreeze votes after unfreezing
                for (uint256 i = 0; i < freezeVoters.length; i++) {
                    emergencyFreezeVotes[freezeVoters[i]] = false;
                }
                for (uint256 i = 0; i < unfreezeVoters.length; i++) {
                    emergencyUnfreezeVotes[unfreezeVoters[i]] = false;
                }
                delete freezeVoters;
                delete unfreezeVoters;
                freezeVoteCount = 0;
                unfreezeVoteCount = 0;
                emit VaultEmergencyUnfrozen(emergencyFreezeThreshold, emergencyFreezeThreshold);
            }
        }
    }

    /**
     * @notice Update the emergency freeze threshold (owner only)
     * @param newThreshold Number of guardians required for emergency freeze
     */
    function setEmergencyFreezeThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0, "Threshold must be greater than 0");
        require(newThreshold <= quorum, "Threshold cannot exceed quorum");
        emergencyFreezeThreshold = newThreshold;
        emit EmergencyFreezeThresholdUpdated(newThreshold);
    }

    /**
     * @notice Get current emergency freeze status and vote counts
     * @return frozen Whether vault is currently frozen
     * @return freezeVotes Number of guardians voting to freeze
     * @return unfreezeVotes Number of guardians voting to unfreeze
     * @return threshold Threshold required to freeze/unfreeze
     */
    function getEmergencyFreezeStatus()
        external
        view
        returns (bool frozen, uint256 freezeVotes, uint256 unfreezeVotes, uint256 threshold)
    {
        return (vaultEmergencyFrozen, freezeVoteCount, unfreezeVoteCount, emergencyFreezeThreshold);
    }

    /**
     * @notice Get list of guardians who voted to freeze
     */
    function getFreezeVoters() external view returns (address[] memory) {
        return freezeVoters;
    }

    /**
     * @notice Get list of guardians who voted to unfreeze
     */
    function getUnfreezeVoters() external view returns (address[] memory) {
        return unfreezeVoters;
    }

    // ============ Internal Helper Functions ============

    /**
     * @notice Verify withdrawal signatures for queuing
     */
    function _verifyWithdrawalSignatures(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        string memory category,
        bytes[] memory signatures
    ) internal view {
        require(signatures.length > 0, "No signatures provided");

        bytes32 reasonHash = keccak256(bytes(reason));
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                nonce,
                reasonHash,
                keccak256(bytes(category)),
                block.timestamp
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        uint256 validSignatures = 0;
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = hash.recover(signatures[i]);
            require(
                IGuardianSBT(guardianToken).balanceOf(signer) > 0,
                "Signer is not a guardian"
            );
            validSignatures++;
        }

        require(validSignatures >= quorum, "Quorum not met");
    }

    /**
     * @notice Extract signer addresses from signatures
     */
    function _getSignersFromSignatures(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        string memory category,
        bytes[] memory signatures
    ) internal view returns (address[] memory) {
        bytes32 reasonHash = keccak256(bytes(reason));
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                nonce,
                reasonHash,
                keccak256(bytes(category)),
                block.timestamp
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            signers[i] = hash.recover(signatures[i]);
        }
        return signers;
    }

    // ============ Emergency Functions ============

    /**
     * @notice Request emergency unlock (starts 30-day timelock)
     */
    function requestEmergencyUnlock() external onlyOwner {
        unlockRequestTime = block.timestamp;
        emit EmergencyUnlockRequested(unlockRequestTime + TIMELOCK_DURATION);
    }

    /**
     * @notice Execute emergency withdrawal after timelock expires
     * @param token Token address (address(0) for native ETH)
     */
    function executeEmergencyUnlock(address token) external onlyOwner {
        require(unlockRequestTime > 0, "No unlock request pending");
        require(
            block.timestamp >= unlockRequestTime + TIMELOCK_DURATION,
            "Timelock not expired"
        );

        uint256 amount;
        
        if (token == address(0)) {
            // Withdraw all ETH
            amount = address(this).balance;
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw all ERC20
            amount = IERC20(token).balanceOf(address(this));
            IERC20(token).transfer(owner(), amount);
        }

        // Reset unlock request
        unlockRequestTime = 0;

        emit EmergencyWithdrawal(token, amount);
    }

    /**
     * @notice Cancel emergency unlock request
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(unlockRequestTime > 0, "No unlock request pending");
        unlockRequestTime = 0;
    }

    // ============ View Functions ============

    /**
     * @notice Get guardian trust score
     * @param guardian Guardian address
     * @return trustScore Calculated trust score
     */
    function getGuardianTrustScore(address guardian) public view returns (uint256 trustScore) {
        GuardianReputation memory rep = guardianReputations[guardian];
        uint256 totalActions = rep.approvalsCount + rep.rejectionsCount;
        if (totalActions == 0) {
            return 0;
        }
        // Approval ratio (scaled to 1000)
        uint256 approvalRatio = (rep.approvalsCount * 1000) / totalActions;
        // Activity bonus: 0-1000, decays if inactive >30 days
        uint256 activityBonus = 0;
        if (rep.lastActiveTimestamp > 0) {
            uint256 daysSinceActive = (block.timestamp - rep.lastActiveTimestamp) / 1 days;
            if (daysSinceActive < 30) {
                activityBonus = 1000 - (daysSinceActive * 33); // Linear decay
            }
        }
        trustScore = approvalRatio + activityBonus; // Max 2000
    }

    /**
     * @notice Get the contract's ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get the contract's ERC20 token balance
     * @param token Token address
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get the domain separator for EIP-712
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Get time remaining until emergency unlock is available
     */
    function getEmergencyUnlockTimeRemaining() external view returns (uint256) {
        if (unlockRequestTime == 0) {
            return 0;
        }
        
        uint256 unlockTime = unlockRequestTime + TIMELOCK_DURATION;
        if (block.timestamp >= unlockTime) {
            return 0;
        }
        
        return unlockTime - block.timestamp;
    }

    /**
     * @notice Validate vault name format and length
     * @param _name The vault name to validate
     * @dev Ensures name is not empty and does not exceed 64 characters
     */
    function _validateName(string memory _name) internal pure {
        bytes memory nameBytes = bytes(_name);
        require(nameBytes.length > 0, "Vault name cannot be empty");
        require(nameBytes.length <= 64, "Vault name must not exceed 64 characters");
    }

    /**
     * @notice Validate vault tags array and individual tags
     * @param _tags The tags array to validate
     * @dev Ensures tag count does not exceed 10 and each tag is valid
     */
    function _validateTags(string[] memory _tags) internal pure {
        require(_tags.length <= 10, "Maximum 10 tags allowed per vault");
        
        for (uint256 i = 0; i < _tags.length; i++) {
            bytes memory tagBytes = bytes(_tags[i]);
            require(tagBytes.length > 0, "Tag cannot be empty");
            require(tagBytes.length <= 32, "Tag must not exceed 32 characters");
        }
    }
}
