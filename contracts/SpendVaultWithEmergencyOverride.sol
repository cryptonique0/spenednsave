// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SpendVaultWithEmergencyOverride
 * @dev Enhanced vault with emergency guardian override mechanism
 * 
 * This vault integrates emergency guardians that can approve emergency unlocks
 * without waiting for the 30-day timelock to expire.
 * 
 * Emergency Flow:
 * 1. Owner triggers emergency unlock
 * 2. Emergency guardians have immediate opportunity to approve
 * 3. Once emergency guardian quorum is reached, withdrawal can proceed immediately
 * 4. Alternatively, if 30 days pass, regular timelock mechanism still works
 * 5. Regular guardians cannot override emergency process (only emergency guardians can)
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

interface IGuardianEmergencyOverride {
    function addEmergencyGuardian(address vault, address guardian) external;
    function isEmergencyGuardian(address vault, address guardian) external view returns (bool);
    function approveEmergencyUnlock(address vault, uint256 emergencyId) external returns (bool);
    function isEmergencyApproved(address vault, uint256 emergencyId) external view returns (bool);
    function getEmergencyApprovalCount(address vault, uint256 emergencyId) external view returns (uint256);
    function getEmergencyQuorum(address vault) external view returns (uint256);
    function activateEmergencyOverride(address vault) external returns (uint256);
    function setEmergencyQuorum(address vault, uint256 quorum) external;
    function getEmergencyGuardians(address vault) external view returns (address[] memory);
}

contract SpendVaultWithEmergencyOverride is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // ==================== State ====================
    
    address public guardianToken;
    address public emergencyOverride;
    
    uint256 public quorum;
    uint256 public nonce;
    
    // Emergency unlock state
    uint256 public emergencyUnlockRequestTime;
    uint256 public constant EMERGENCY_TIMELOCK_DURATION = 30 days;
    
    // Track which emergency unlock attempt corresponds to which vault state
    uint256 public currentEmergencyId;
    
    // Track tokens withdrawn via emergency override (for audit trail)
    mapping(uint256 emergencyId => mapping(address token => uint256)) public emergencyWithdrawals;
    mapping(uint256 emergencyId => string) public emergencyWithdrawalReasons;
    mapping(uint256 emergencyId => uint256) public emergencyWithdrawalTime;
    
    // Nonce tracking for replay protection
    uint256 private _nonce;

    // ==================== Events ====================
    
    event EmergencyUnlockRequested(uint256 indexed emergencyId, uint256 timestamp);
    event EmergencyUnlockApprovedByGuardian(uint256 indexed emergencyId, address indexed guardian, uint256 approvalCount, uint256 timestamp);
    event EmergencyWithdrawalExecutedViaApproval(uint256 indexed emergencyId, address indexed token, uint256 amount, address indexed recipient, string reason, uint256 timestamp);
    event EmergencyWithdrawalExecutedViaTimelock(address indexed token, uint256 amount, address indexed recipient, uint256 timestamp);
    event EmergencyUnlockCancelled(uint256 indexed emergencyId, uint256 timestamp);
    event EmergencyQuorumUpdated(uint256 newQuorum, uint256 timestamp);
    event QuorumUpdated(uint256 newQuorum, uint256 timestamp);
    event GuardianTokenUpdated(address newAddress, uint256 timestamp);
    event EmergencyOverrideUpdated(address newAddress, uint256 timestamp);

    // ==================== Constructor ====================
    
    constructor(
        address _guardianToken,
        uint256 _quorum,
        address _emergencyOverride
    ) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_emergencyOverride != address(0), "Invalid emergency override");
        require(_quorum > 0, "Quorum must be at least 1");

        guardianToken = _guardianToken;
        emergencyOverride = _emergencyOverride;
        quorum = _quorum;
        _nonce = 0;
    }

    // ==================== Receive & Fallback ====================
    
    receive() external payable {}
    fallback() external payable {}

    // ==================== Configuration ====================
    
    /**
     * @dev Set the required quorum for normal withdrawals
     * @param _newQuorum New quorum requirement
     */
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be at least 1");
        quorum = _newQuorum;
        emit QuorumUpdated(_newQuorum, block.timestamp);
    }

    /**
     * @dev Update guardian token address
     * @param _newAddress New guardian token address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(_newAddress, block.timestamp);
    }

    /**
     * @dev Update emergency override contract address
     * @param _newAddress New emergency override address
     */
    function updateEmergencyOverride(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        emergencyOverride = _newAddress;
        emit EmergencyOverrideUpdated(_newAddress, block.timestamp);
    }

    /**
     * @dev Set emergency guardian quorum (called by factory during setup)
     * @param _quorum Emergency quorum requirement
     */
    function setEmergencyGuardianQuorum(uint256 _quorum) external onlyOwner {
        IGuardianEmergencyOverride(emergencyOverride).setEmergencyQuorum(address(this), _quorum);
        emit EmergencyQuorumUpdated(_quorum, block.timestamp);
    }

    /**
     * @dev Add an emergency guardian (called by factory during setup)
     * @param guardian Guardian address to add
     */
    function addEmergencyGuardian(address guardian) external onlyOwner {
        IGuardianEmergencyOverride(emergencyOverride).addEmergencyGuardian(address(this), guardian);
    }

    // ==================== Emergency Unlock Flow ====================
    
    /**
     * @dev Request emergency unlock (initiates both timelock and emergency override process)
     * @return emergencyId ID for tracking this emergency unlock attempt
     */
    function requestEmergencyUnlock() external onlyOwner returns (uint256) {
        emergencyUnlockRequestTime = block.timestamp;
        
        // Activate emergency override to allow emergency guardians to approve
        uint256 emergencyId = IGuardianEmergencyOverride(emergencyOverride).activateEmergencyOverride(address(this));
        currentEmergencyId = emergencyId;

        emit EmergencyUnlockRequested(emergencyId, block.timestamp);
        
        return emergencyId;
    }

    /**
     * @dev Emergency guardian approves the emergency unlock (called by emergency guardian)
     * @param emergencyId The emergency unlock ID to approve
     * @return hasReachedQuorum Whether approval reached quorum for immediate execution
     */
    function approveEmergencyUnlock(uint256 emergencyId) external returns (bool) {
        require(
            IGuardianEmergencyOverride(emergencyOverride).isEmergencyGuardian(address(this), msg.sender),
            "Not an emergency guardian"
        );
        require(emergencyId == currentEmergencyId, "Invalid emergency ID");

        bool quorumReached = IGuardianEmergencyOverride(emergencyOverride).approveEmergencyUnlock(
            address(this),
            emergencyId
        );

        uint256 approvalCount = IGuardianEmergencyOverride(emergencyOverride).getEmergencyApprovalCount(
            address(this),
            emergencyId
        );

        emit EmergencyUnlockApprovedByGuardian(emergencyId, msg.sender, approvalCount, block.timestamp);

        return quorumReached;
    }

    /**
     * @dev Execute emergency withdrawal once emergency guardians approve (via override)
     * @param token Token to withdraw (address(0) for ETH)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Reason for emergency withdrawal
     * @param emergencyId Emergency unlock ID that was approved
     */
    function executeEmergencyWithdrawalViaApproval(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        uint256 emergencyId
    ) external onlyOwner nonReentrant {
        require(emergencyId == currentEmergencyId, "Invalid emergency ID");
        require(
            IGuardianEmergencyOverride(emergencyOverride).isEmergencyApproved(address(this), emergencyId),
            "Emergency not approved by guardians"
        );
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        // Validate balance
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        }

        // Record withdrawal
        emergencyWithdrawals[emergencyId][token] = amount;
        emergencyWithdrawalReasons[emergencyId] = reason;
        emergencyWithdrawalTime[emergencyId] = block.timestamp;

        // Execute withdrawal
        if (token == address(0)) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
        }

        // Reset emergency unlock state
        emergencyUnlockRequestTime = 0;

        emit EmergencyWithdrawalExecutedViaApproval(emergencyId, token, amount, recipient, reason, block.timestamp);
    }

    /**
     * @dev Execute emergency withdrawal via timelock expiry (fallback mechanism)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     */
    function executeEmergencyUnlockViaTimelock(
        address token,
        uint256 amount,
        address recipient
    ) external onlyOwner nonReentrant {
        require(emergencyUnlockRequestTime != 0, "Emergency unlock not requested");
        require(
            block.timestamp >= emergencyUnlockRequestTime + EMERGENCY_TIMELOCK_DURATION,
            "Timelock period not yet expired"
        );
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        // Validate balance
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        }

        // Execute withdrawal
        if (token == address(0)) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
        }

        // Reset emergency unlock state
        emergencyUnlockRequestTime = 0;

        emit EmergencyWithdrawalExecutedViaTimelock(token, amount, recipient, block.timestamp);
    }

    /**
     * @dev Cancel emergency unlock request
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockRequestTime != 0, "Emergency unlock not requested");
        
        uint256 emergencyId = currentEmergencyId;
        emergencyUnlockRequestTime = 0;

        emit EmergencyUnlockCancelled(emergencyId, block.timestamp);
    }

    // ==================== Views ====================
    
    /**
     * @dev Get ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get ERC-20 token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get EIP-712 domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @dev Get time remaining until emergency unlock timelock expires
     */
    function getEmergencyUnlockTimeRemaining() external view returns (uint256) {
        if (emergencyUnlockRequestTime == 0) {
            return 0;
        }

        uint256 expiryTime = emergencyUnlockRequestTime + EMERGENCY_TIMELOCK_DURATION;
        
        if (block.timestamp >= expiryTime) {
            return 0;
        }

        return expiryTime - block.timestamp;
    }

    /**
     * @dev Check if emergency unlock is currently active
     */
    function isEmergencyUnlockActive() external view returns (bool) {
        return emergencyUnlockRequestTime != 0;
    }

    /**
     * @dev Get emergency unlock request time
     */
    function getEmergencyUnlockRequestTime() external view returns (uint256) {
        return emergencyUnlockRequestTime;
    }

    /**
     * @dev Get emergency guardian approvals for current emergency
     */
    function getEmergencyApprovalsCount() external view returns (uint256) {
        if (emergencyUnlockRequestTime == 0) {
            return 0;
        }
        return IGuardianEmergencyOverride(emergencyOverride).getEmergencyApprovalCount(address(this), currentEmergencyId);
    }

    /**
     * @dev Get emergency guardian quorum requirement
     */
    function getEmergencyGuardianQuorum() external view returns (uint256) {
        return IGuardianEmergencyOverride(emergencyOverride).getEmergencyQuorum(address(this));
    }

    /**
     * @dev Get all emergency guardians for this vault
     */
    function getEmergencyGuardians() external view returns (address[] memory) {
        return IGuardianEmergencyOverride(emergencyOverride).getEmergencyGuardians(address(this));
    }

    /**
     * @dev Get count of emergency guardians
     */
    function getEmergencyGuardianCount() external view returns (uint256) {
        return IGuardianEmergencyOverride(emergencyOverride).getEmergencyGuardians(address(this)).length;
    }

    /**
     * @dev Get current emergency ID
     */
    function getCurrentEmergencyId() external view returns (uint256) {
        return currentEmergencyId;
    }

    /**
     * @dev Get emergency withdrawal details
     */
    function getEmergencyWithdrawalDetails(uint256 emergencyId, address token) 
        external view returns (uint256 amount, string memory reason, uint256 timestamp) 
    {
        return (
            emergencyWithdrawals[emergencyId][token],
            emergencyWithdrawalReasons[emergencyId],
            emergencyWithdrawalTime[emergencyId]
        );
    }
}
