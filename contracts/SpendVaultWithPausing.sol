// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SpendVaultWithPausing
 * @dev Enhanced vault with temporary pause mechanism for withdrawals
 * 
 * Features:
 * - Pause withdrawals while allowing deposits
 * - Emergency response to security issues
 * - Maintains full audit trail
 * - Separate pause state per vault
 * - Multi-level status checking
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

interface IVaultPausingController {
    function isPaused(address vault) external view returns (bool);
    function getPauseReason(address vault) external view returns (string memory);
    function getPauseTime(address vault) external view returns (uint256);
    function getPauseElapsedTime(address vault) external view returns (uint256);
    function isManagedVault(address vault) external view returns (bool);
}

contract SpendVaultWithPausing is Ownable, ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    // ==================== State ====================
    
    address public guardianToken;
    address public pausingController;
    
    uint256 public quorum;
    uint256 public nonce;
    
    // Emergency unlock state (from base contract pattern)
    uint256 public emergencyUnlockRequestTime;
    uint256 public constant EMERGENCY_TIMELOCK_DURATION = 30 days;

    // ==================== Events ====================
    
    event WithdrawalAttemptedWhilePaused(address indexed token, uint256 amount, uint256 timestamp);
    event VaultPauseCheckFailed(address indexed vault, string reason, uint256 timestamp);
    event DepositReceivedWhilePaused(address indexed token, uint256 amount, uint256 timestamp);
    event PauseStatusQueried(address indexed vault, bool isPaused, uint256 timestamp);
    event QuorumUpdated(uint256 newQuorum, uint256 timestamp);
    event GuardianTokenUpdated(address newAddress, uint256 timestamp);
    event PausingControllerUpdated(address newAddress, uint256 timestamp);
    event ETHDeposited(uint256 amount, uint256 timestamp);
    event TokenDeposited(address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed token, uint256 amount, address indexed recipient, string reason, uint256 timestamp);
    event EmergencyUnlockRequested(uint256 timestamp);
    event EmergencyUnlockCancelled(uint256 timestamp);

    // ==================== Constructor ====================
    
    constructor(
        address _guardianToken,
        uint256 _quorum,
        address _pausingController
    ) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_pausingController != address(0), "Invalid pausing controller");
        require(_quorum > 0, "Quorum must be at least 1");

        guardianToken = _guardianToken;
        pausingController = _pausingController;
        quorum = _quorum;
        nonce = 0;
    }

    // ==================== Receive & Fallback ====================
    
    receive() external payable {
        emit ETHDeposited(msg.value, block.timestamp);
        emit DepositReceivedWhilePaused(address(0), msg.value, block.timestamp);
    }
    
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
     * @dev Update pausing controller address
     * @param _newAddress New pausing controller address
     */
    function updatePausingController(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        pausingController = _newAddress;
        emit PausingControllerUpdated(_newAddress, block.timestamp);
    }

    // ==================== Pause Status Checking ====================
    
    /**
     * @dev Check if vault is currently paused
     */
    function isVaultPaused() public view returns (bool) {
        return IVaultPausingController(pausingController).isPaused(address(this));
    }

    /**
     * @dev Get the reason why vault is paused
     */
    function getVaultPauseReason() external view returns (string memory) {
        return IVaultPausingController(pausingController).getPauseReason(address(this));
    }

    /**
     * @dev Get time since vault was paused
     */
    function getVaultPauseElapsedTime() external view returns (uint256) {
        return IVaultPausingController(pausingController).getPauseElapsedTime(address(this));
    }

    /**
     * @dev Get when vault was paused
     */
    function getVaultPauseTime() external view returns (uint256) {
        return IVaultPausingController(pausingController).getPauseTime(address(this));
    }

    // ==================== Deposits (Always Allowed) ====================
    
    /**
     * @dev Deposit ERC-20 tokens (works even when paused)
     * @param token Token address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer from sender
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        emit TokenDeposited(token, amount, block.timestamp);
        
        // Log if paused
        if (isVaultPaused()) {
            emit DepositReceivedWhilePaused(token, amount, block.timestamp);
        }
    }

    /**
     * @dev Deposit native ETH (works even when paused)
     */
    function depositETH() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        emit ETHDeposited(msg.value, block.timestamp);
        
        // Log if paused
        if (isVaultPaused()) {
            emit DepositReceivedWhilePaused(address(0), msg.value, block.timestamp);
        }
    }

    // ==================== Withdrawals (Blocked When Paused) ====================
    
    /**
     * @dev Execute multi-sig withdrawal (BLOCKED if paused)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Reason for withdrawal
     * @param signatures Guardian signatures
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        bytes[] calldata signatures
    ) external onlyOwner nonReentrant {
        // ==================== PAUSE CHECK ====================
        require(!isVaultPaused(), "Vault is paused - withdrawals disabled");
        
        // Standard validation
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(signatures.length >= quorum, "Insufficient signatures");

        // Validate balance
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH balance");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
        }

        // Verify signatures (guardians must hold SBT)
        bytes32 messageHash = keccak256(
            abi.encodePacked(token, amount, recipient, nonce, reason)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();

        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedMessageHash.recover(signatures[i]);
            require(IGuardianSBT(guardianToken).balanceOf(signer) > 0, "Invalid guardian");
            
            // Prevent duplicate signatures
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            signers[i] = signer;
        }

        // Execute withdrawal
        nonce++;
        if (token == address(0)) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
        }

        emit Withdrawal(token, amount, recipient, reason, block.timestamp);
    }

    /**
     * @dev Attempt withdrawal when paused (will be blocked with event)
     */
    function attemptWithdrawalWhilePaused(address token, uint256 amount) external {
        require(isVaultPaused(), "Vault is not paused");
        emit WithdrawalAttemptedWhilePaused(token, amount, block.timestamp);
    }

    // ==================== Emergency Unlock (Also Blocked When Paused) ====================
    
    /**
     * @dev Request emergency unlock (BLOCKED if paused)
     */
    function requestEmergencyUnlock() external onlyOwner returns (uint256) {
        require(!isVaultPaused(), "Vault is paused - emergency unlock disabled");
        
        emergencyUnlockRequestTime = block.timestamp;
        emit EmergencyUnlockRequested(block.timestamp);
        return 0; // Simplified return
    }

    /**
     * @dev Cancel emergency unlock
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockRequestTime != 0, "Emergency unlock not requested");
        
        emergencyUnlockRequestTime = 0;
        emit EmergencyUnlockCancelled(block.timestamp);
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
     * @dev Check if vault is managed by controller
     */
    function isPausedByController() external view returns (bool) {
        return IVaultPausingController(pausingController).isManagedVault(address(this));
    }

    /**
     * @dev Get current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }
}
