// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SessionBasedApprovalsVault
 * @notice Multi-signature treasury vault with session-based approvals
 * @dev Guardians can approve spending sessions with time windows, amount limits, and recipient restrictions
 */
contract SessionBasedApprovalsVault is EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    // ============ Type Definitions ============

    /**
     * @dev Spending session structure
     * Represents an approved spending window with defined limits
     */
    struct SpendingSession {
        bytes32 sessionId;              // Unique session identifier
        address initiator;              // Guardian who initiated session
        uint256 createdAt;              // When session was created
        uint256 expiresAt;              // When session expires
        uint256 totalApproved;          // Total amount approved for session
        uint256 totalSpent;             // Amount already spent
        address[] allowedRecipients;    // If empty, allow all
        bool requiresApproval;          // Whether each withdrawal needs approval
        bool isActive;                  // Whether session is active
        string purpose;                 // Reason for session (e.g., "Marketing budget")
        uint256 approvalsReceived;      // Number of guardians who approved
        uint256 approvalsRequired;      // Guardians needed to activate
        address[] approvers;            // Who has approved this session
    }

    /**
     * @dev Session spending record
     */
    struct SessionSpend {
        bytes32 sessionId;
        address token;
        uint256 amount;
        address recipient;
        uint256 timestamp;
        string reason;
    }

    /**
     * @dev Pending session requiring approval
     */
    struct PendingSession {
        SpendingSession session;
        mapping(address => bool) guardianApproved;
    }

    // ============ State Variables ============

    address public guardianToken;
    address public owner;
    uint256 public nonce;

    // Session management
    mapping(bytes32 => SpendingSession) public sessions;
    mapping(bytes32 => PendingSession) public pendingSessions;
    bytes32[] public sessionHistory;
    bytes32[] public activeSessions;

    // Spending tracking
    mapping(bytes32 => SessionSpend[]) public sessionSpends;

    // Configuration
    uint256 public minSessionDuration = 1 minutes;
    uint256 public maxSessionDuration = 30 days;
    uint256 public defaultApprovalQuorum = 2;
    uint256 public minApprovalQuorum = 1;
    uint256 public maxApprovalQuorum = 5;

    // Tracking spending per session per token
    mapping(bytes32 => mapping(address => uint256)) public sessionTokenSpent;

    // ============ Events ============

    event SessionCreated(
        bytes32 indexed sessionId,
        address indexed initiator,
        uint256 duration,
        uint256 totalApproved,
        string purpose
    );

    event SessionApproved(
        bytes32 indexed sessionId,
        address indexed approver,
        uint256 totalApprovalsReceived
    );

    event SessionActivated(
        bytes32 indexed sessionId,
        address indexed initiator,
        uint256 approvalsReceived
    );

    event SessionDeactivated(
        bytes32 indexed sessionId,
        address indexed deactivator,
        string reason
    );

    event SessionExpired(
        bytes32 indexed sessionId,
        uint256 totalSpent
    );

    event SessionSpendingExecuted(
        bytes32 indexed sessionId,
        address indexed token,
        uint256 amount,
        address indexed recipient,
        uint256 remainingApproval
    );

    event SessionSpendingBlocked(
        bytes32 indexed sessionId,
        string reason
    );

    event RecipientAddedToSession(
        bytes32 indexed sessionId,
        address indexed recipient
    );

    event RecipientRemovedFromSession(
        bytes32 indexed sessionId,
        address indexed recipient
    );

    event ApprovalQuorumUpdated(
        uint256 newQuorum
    );

    // ============ Constructor ============

    constructor(address _guardianToken) EIP712("SpendGuard-SessionApprovals", "1") {
        require(_guardianToken != address(0), "Invalid guardian token");
        guardianToken = _guardianToken;
        owner = msg.sender;
        nonce = 0;
    }

    // ============ Session Creation & Management ============

    /**
     * @notice Create a new spending session
     * @param duration Duration of session in seconds
     * @param totalApproved Total amount to approve for this session
     * @param purpose Reason for this spending session
     * @param requiresApproval Whether each withdrawal needs approval
     * @param recipients Allowed recipients (empty = all allowed)
     */
    function createSession(
        uint256 duration,
        uint256 totalApproved,
        string memory purpose,
        bool requiresApproval,
        address[] memory recipients
    ) external onlyGuardian returns (bytes32 sessionId) {
        require(duration >= minSessionDuration, "Duration too short");
        require(duration <= maxSessionDuration, "Duration too long");
        require(totalApproved > 0, "Amount must be positive");
        require(bytes(purpose).length > 0, "Purpose required");

        // Generate session ID
        sessionId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, nonce++)
        );

        // Create session
        SpendingSession memory session = SpendingSession({
            sessionId: sessionId,
            initiator: msg.sender,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            totalApproved: totalApproved,
            totalSpent: 0,
            allowedRecipients: recipients,
            requiresApproval: requiresApproval,
            isActive: false,
            purpose: purpose,
            approvalsReceived: 0,
            approvalsRequired: defaultApprovalQuorum,
            approvers: new address[](0)
        });

        // If initiator is the owner, activate immediately (owner approval)
        if (msg.sender == owner) {
            session.isActive = true;
            session.approvalsReceived = 1;
            session.approvers.push(msg.sender);
            sessions[sessionId] = session;
            activeSessions.push(sessionId);
            
            emit SessionActivated(sessionId, msg.sender, 1);
        } else {
            // Requires other guardians' approval
            pendingSessions[sessionId].session = session;
        }

        sessionHistory.push(sessionId);

        emit SessionCreated(
            sessionId,
            msg.sender,
            duration,
            totalApproved,
            purpose
        );

        return sessionId;
    }

    /**
     * @notice Approve a pending session
     * @param sessionId ID of session to approve
     */
    function approveSession(bytes32 sessionId) external onlyGuardian {
        require(!sessions[sessionId].isActive, "Session already active");

        PendingSession storage pending = pendingSessions[sessionId];
        require(pending.session.sessionId != bytes32(0), "Session not found");
        require(!pending.guardianApproved[msg.sender], "Already approved");

        // Mark as approved
        pending.guardianApproved[msg.sender] = true;
        pending.session.approvalsReceived++;
        pending.session.approvers.push(msg.sender);

        emit SessionApproved(
            sessionId,
            msg.sender,
            pending.session.approvalsReceived
        );

        // Check if reached quorum
        if (pending.session.approvalsReceived >= pending.session.approvalsRequired) {
            _activateSession(sessionId);
        }
    }

    /**
     * @notice Activate a session that has reached quorum
     */
    function _activateSession(bytes32 sessionId) internal {
        PendingSession storage pending = pendingSessions[sessionId];
        SpendingSession memory session = pending.session;

        // Move to active sessions
        session.isActive = true;
        sessions[sessionId] = session;
        activeSessions.push(sessionId);

        emit SessionActivated(
            sessionId,
            session.initiator,
            session.approvalsReceived
        );

        // Clean up pending
        delete pendingSessions[sessionId];
    }

    /**
     * @notice Deactivate an active session
     * @param sessionId Session to deactivate
     * @param reason Why deactivating
     */
    function deactivateSession(
        bytes32 sessionId,
        string memory reason
    ) external {
        require(msg.sender == owner || msg.sender == sessions[sessionId].initiator, "Not authorized");
        
        SpendingSession storage session = sessions[sessionId];
        require(session.isActive, "Session not active");

        session.isActive = false;

        emit SessionDeactivated(sessionId, msg.sender, reason);
    }

    /**
     * @notice Add recipient to session's allowed list
     * @param sessionId Session ID
     * @param recipient Recipient to add
     */
    function addSessionRecipient(bytes32 sessionId, address recipient) external onlyOwner {
        SpendingSession storage session = sessions[sessionId];
        require(session.sessionId != bytes32(0), "Session not found");
        require(recipient != address(0), "Invalid recipient");

        // Check not already added
        for (uint256 i = 0; i < session.allowedRecipients.length; i++) {
            require(session.allowedRecipients[i] != recipient, "Already added");
        }

        session.allowedRecipients.push(recipient);
        emit RecipientAddedToSession(sessionId, recipient);
    }

    /**
     * @notice Remove recipient from session's allowed list
     * @param sessionId Session ID
     * @param recipient Recipient to remove
     */
    function removeSessionRecipient(bytes32 sessionId, address recipient) external onlyOwner {
        SpendingSession storage session = sessions[sessionId];
        require(session.sessionId != bytes32(0), "Session not found");

        for (uint256 i = 0; i < session.allowedRecipients.length; i++) {
            if (session.allowedRecipients[i] == recipient) {
                // Swap with last and pop
                session.allowedRecipients[i] = session.allowedRecipients[
                    session.allowedRecipients.length - 1
                ];
                session.allowedRecipients.pop();
                emit RecipientRemovedFromSession(sessionId, recipient);
                return;
            }
        }

        revert("Recipient not found");
    }

    // ============ Session Spending ============

    /**
     * @notice Execute spending within an active session
     * @param sessionId Active session ID
     * @param token Token address (0x0 for ETH)
     * @param amount Amount to spend
     * @param recipient Recipient address
     * @param reason Reason for spending
     */
    function spendFromSession(
        bytes32 sessionId,
        address token,
        uint256 amount,
        address recipient,
        string memory reason
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");

        SpendingSession storage session = sessions[sessionId];
        
        // Validate session
        require(session.isActive, "Session not active");
        require(block.timestamp < session.expiresAt, "Session expired");

        // Check amount limits
        uint256 newTotal = session.totalSpent + amount;
        require(newTotal <= session.totalApproved, "Exceeds session limit");

        // Check recipient restrictions
        if (session.allowedRecipients.length > 0) {
            bool isAllowed = false;
            for (uint256 i = 0; i < session.allowedRecipients.length; i++) {
                if (session.allowedRecipients[i] == recipient) {
                    isAllowed = true;
                    break;
                }
            }
            require(isAllowed, "Recipient not approved for session");
        }

        // If requires approval, check signature
        if (session.requiresApproval) {
            // For now, require caller to be guardian
            require(_isGuardian(msg.sender), "Only guardians can approve spending");
        }

        // Execute spending
        session.totalSpent += amount;
        sessionTokenSpent[sessionId][token] += amount;
        nonce++;

        // Record spending
        SessionSpend memory spend = SessionSpend({
            sessionId: sessionId,
            token: token,
            amount: amount,
            recipient: recipient,
            timestamp: block.timestamp,
            reason: reason
        });
        sessionSpends[sessionId].push(spend);

        // Transfer funds
        if (token == address(0)) {
            // ETH transfer
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC-20 transfer
            IERC20(token).transfer(recipient, amount);
        }

        uint256 remaining = session.totalApproved - session.totalSpent;
        emit SessionSpendingExecuted(
            sessionId,
            token,
            amount,
            recipient,
            remaining
        );

        // Auto-deactivate if fully spent
        if (session.totalSpent >= session.totalApproved) {
            session.isActive = false;
            emit SessionDeactivated(sessionId, msg.sender, "Budget fully spent");
        }
    }

    /**
     * @notice Claim/expire sessions that are past their time
     * @param sessionId Session to expire
     */
    function expireSession(bytes32 sessionId) external {
        SpendingSession storage session = sessions[sessionId];
        require(session.sessionId != bytes32(0), "Session not found");
        require(session.isActive, "Session not active");
        require(block.timestamp >= session.expiresAt, "Session not expired yet");

        session.isActive = false;

        emit SessionExpired(sessionId, session.totalSpent);
    }

    // ============ Session Information ============

    /**
     * @notice Get session details
     * @param sessionId Session ID
     * @return Session information
     */
    function getSession(bytes32 sessionId)
        external
        view
        returns (SpendingSession memory)
    {
        SpendingSession memory session = sessions[sessionId];
        if (session.sessionId == bytes32(0)) {
            // Check pending
            session = pendingSessions[sessionId].session;
        }
        return session;
    }

    /**
     * @notice Get session spending records
     * @param sessionId Session ID
     */
    function getSessionSpends(bytes32 sessionId)
        external
        view
        returns (SessionSpend[] memory)
    {
        return sessionSpends[sessionId];
    }

    /**
     * @notice Get remaining budget for session
     * @param sessionId Session ID
     */
    function getSessionRemaining(bytes32 sessionId)
        external
        view
        returns (uint256)
    {
        SpendingSession memory session = sessions[sessionId];
        if (session.sessionId == bytes32(0)) {
            session = pendingSessions[sessionId].session;
        }
        return session.totalApproved - session.totalSpent;
    }

    /**
     * @notice Check if session is valid and active
     * @param sessionId Session ID
     */
    function isSessionValid(bytes32 sessionId) external view returns (bool) {
        SpendingSession memory session = sessions[sessionId];
        return (session.isActive && block.timestamp < session.expiresAt);
    }

    /**
     * @notice Get time remaining for session
     * @param sessionId Session ID
     */
    function getSessionTimeRemaining(bytes32 sessionId)
        external
        view
        returns (uint256)
    {
        SpendingSession memory session = sessions[sessionId];
        if (session.expiresAt <= block.timestamp) {
            return 0;
        }
        return session.expiresAt - block.timestamp;
    }

    /**
     * @notice Get all active sessions
     */
    function getActiveSessions() external view returns (bytes32[] memory) {
        // Count active
        uint256 count = 0;
        for (uint256 i = 0; i < activeSessions.length; i++) {
            SpendingSession memory session = sessions[activeSessions[i]];
            if (session.isActive && block.timestamp < session.expiresAt) {
                count++;
            }
        }

        // Build result
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < activeSessions.length; i++) {
            SpendingSession memory session = sessions[activeSessions[i]];
            if (session.isActive && block.timestamp < session.expiresAt) {
                result[index] = activeSessions[i];
                index++;
            }
        }

        return result;
    }

    /**
     * @notice Get all allowed recipients for a session
     */
    function getSessionRecipients(bytes32 sessionId)
        external
        view
        returns (address[] memory)
    {
        return sessions[sessionId].allowedRecipients;
    }

    /**
     * @notice Check if address is allowed recipient for session
     */
    function isRecipientAllowed(bytes32 sessionId, address recipient)
        external
        view
        returns (bool)
    {
        SpendingSession memory session = sessions[sessionId];
        
        // If no restrictions, all allowed
        if (session.allowedRecipients.length == 0) {
            return true;
        }

        for (uint256 i = 0; i < session.allowedRecipients.length; i++) {
            if (session.allowedRecipients[i] == recipient) {
                return true;
            }
        }

        return false;
    }

    /**
     * @notice Get session spending by token
     */
    function getSessionTokenSpent(bytes32 sessionId, address token)
        external
        view
        returns (uint256)
    {
        return sessionTokenSpent[sessionId][token];
    }

    // ============ Deposit & View Functions ============

    /**
     * @notice Receive ETH
     */
    receive() external payable {}

    /**
     * @notice Deposit ERC-20 tokens
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Get ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Get EIP-712 domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    // ============ Configuration ============

    /**
     * @notice Set minimum session duration
     */
    function setMinSessionDuration(uint256 duration) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        minSessionDuration = duration;
    }

    /**
     * @notice Set maximum session duration
     */
    function setMaxSessionDuration(uint256 duration) external onlyOwner {
        require(duration > minSessionDuration, "Invalid duration");
        maxSessionDuration = duration;
    }

    /**
     * @notice Set default approval quorum for sessions
     */
    function setDefaultApprovalQuorum(uint256 quorum) external onlyOwner {
        require(quorum >= minApprovalQuorum, "Below minimum");
        require(quorum <= maxApprovalQuorum, "Exceeds maximum");
        defaultApprovalQuorum = quorum;
        emit ApprovalQuorumUpdated(quorum);
    }

    /**
     * @notice Update guardian token address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
    }

    // ============ View Functions ============

    /**
     * @notice Check if address is guardian
     */
    function _isGuardian(address account) internal view returns (bool) {
        return IERC721(guardianToken).balanceOf(account) > 0;
    }

    /**
     * @notice Get number of sessions created
     */
    function getSessionHistoryLength() external view returns (uint256) {
        return sessionHistory.length;
    }

    /**
     * @notice Get session by index in history
     */
    function getSessionByIndex(uint256 index) external view returns (bytes32) {
        require(index < sessionHistory.length, "Invalid index");
        return sessionHistory[index];
    }

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyGuardian() {
        require(_isGuardian(msg.sender), "Only guardians");
        _;
    }
}
