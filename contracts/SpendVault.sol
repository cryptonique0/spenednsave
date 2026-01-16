
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
    // Guardian reputation event: logs every approval action
    event GuardianAction(address indexed guardian, string action, uint256 timestamp, address indexed vault, address indexed recipient, uint256 amount, string reason);

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
                    // ============ Vault Transfer ============
                    struct TransferRequest {
                        address newOwner;
                        address[] approvals;
                        bool executed;
                        uint256 createdAt;
                    }
                    mapping(uint256 => TransferRequest) public transferRequests;
                    uint256 public transferRequestCount;

                    event TransferRequested(uint256 indexed id, address indexed newOwner, uint256 createdAt);
                    event TransferApproved(uint256 indexed id, address indexed guardian);
                    event TransferExecuted(uint256 indexed id, address indexed oldOwner, address indexed newOwner);

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
        guardianToken = _guardianToken;
        quorum = _quorum;
        name = _name;
        for (uint256 i = 0; i < _tags.length; i++) {
            tags.push(_tags[i]);
        }
    }

    /**
     * @notice Set the vault name (owner only)
     */
    function setName(string memory newName) external onlyOwner {
        name = newName;
        emit NameChanged(newName);
    }

    /**
     * @notice Set the vault tags (owner only)
     */
    function setTags(string[] memory newTags) external onlyOwner {
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
}
