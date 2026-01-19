// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SpendVaultWithDelayedGuardians
 * @dev Multi-signature vault with delayed guardian activation
 * 
 * Features:
 * - Add guardians with cooldown before activation
 * - Pending guardians cannot participate in voting
 * - Cancel guardian additions if suspicious
 * - Active-only voting for withdrawals
 * - Complete guardian lifecycle tracking
 */

contract SpendVaultWithDelayedGuardians is EIP712 {
    using ECDSA for bytes32;

    // ==================== Types ====================

    struct Withdrawal {
        uint256 amount;
        address recipient;
        address token;
        uint256 nonce;
        uint256 expiration;
    }

    // ==================== State ====================

    address public vault;
    address public owner;
    address public delayController;
    
    uint256 public requiredSignatures;
    uint256 public nonce = 0;
    
    mapping(address => uint256) public tokenBalances;
    mapping(bytes32 => bool) public executedWithdrawals;
    
    bytes32 private constant WITHDRAWAL_TYPEHASH = 
        keccak256("Withdrawal(uint256 amount,address recipient,address token,uint256 nonce,uint256 expiration)");

    // ==================== Events ====================

    event WithdrawalExecuted(
        address indexed recipient,
        uint256 amount,
        address indexed token,
        uint256 timestamp
    );
    
    event GuardianAdditionInitiated(
        address indexed guardian,
        uint256 activationTime,
        uint256 timestamp
    );
    
    event GuardianActivated(
        address indexed guardian,
        uint256 timestamp
    );
    
    event GuardianRemoved(
        address indexed guardian,
        uint256 timestamp
    );
    
    event OwnerChanged(
        address indexed newOwner,
        uint256 timestamp
    );

    // ==================== Constructor ====================

    constructor(
        address _owner,
        address[] memory _initialGuardians,
        uint256 _requiredSignatures,
        address _delayController
    ) EIP712("SpendVaultWithDelayedGuardians", "1") {
        require(_owner != address(0), "Invalid owner");
        require(_delayController != address(0), "Invalid delay controller");
        require(_initialGuardians.length > 0, "Need at least 1 guardian");
        require(
            _requiredSignatures > 0 && _requiredSignatures <= _initialGuardians.length,
            "Invalid signature count"
        );
        
        owner = _owner;
        vault = address(this);
        delayController = _delayController;
        requiredSignatures = _requiredSignatures;
        
        // Initialize with active guardians (skip delay for initial setup)
        IGuardianDelayController controller = IGuardianDelayController(_delayController);
        for (uint256 i = 0; i < _initialGuardians.length; i++) {
            require(_initialGuardians[i] != address(0), "Invalid guardian");
            // Guardians are added as active during initialization
            controller.registerGuardianAsActive(address(this), _initialGuardians[i]);
        }
    }

    // ==================== Access Control ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyActiveGuardian() {
        require(
            IGuardianDelayController(delayController).isGuardianActive(vault, msg.sender),
            "Only active guardians"
        );
        _;
    }

    // ==================== Deposits ====================

    /**
     * @dev Deposit ERC20 tokens
     * @param token Token address
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
    }

    /**
     * @dev Deposit ETH
     */
    function depositETH() external payable {
        require(msg.value > 0, "Amount must be > 0");
        tokenBalances[address(0)] += msg.value;
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        tokenBalances[address(0)] += msg.value;
    }

    // ==================== Withdrawals ====================

    /**
     * @dev Withdraw tokens with multi-sig approval (active guardians only)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param signatures Packed signatures from active guardians
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        bytes calldata signatures
    ) external {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        require(tokenBalances[token] >= amount, "Insufficient balance");
        
        Withdrawal memory withdrawal = Withdrawal({
            amount: amount,
            recipient: recipient,
            token: token,
            nonce: nonce,
            expiration: block.timestamp + 1 days
        });
        
        bytes32 withdrawalHash = keccak256(abi.encode(
            WITHDRAWAL_TYPEHASH,
            withdrawal.amount,
            withdrawal.recipient,
            withdrawal.token,
            withdrawal.nonce,
            withdrawal.expiration
        ));
        
        bytes32 domainHash = _domainSeparatorV4();
        bytes32 messageHash = keccak256(abi.encodePacked("\x19\x01", domainHash, withdrawalHash));
        
        require(!executedWithdrawals[messageHash], "Already executed");
        require(block.timestamp <= withdrawal.expiration, "Withdrawal expired");
        
        _verifySignatures(messageHash, signatures);
        
        executedWithdrawals[messageHash] = true;
        nonce++;
        tokenBalances[token] -= amount;
        
        if (token == address(0)) {
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(token).transfer(recipient, amount);
        }
        
        emit WithdrawalExecuted(recipient, amount, token, block.timestamp);
    }

    // ==================== Guardian Management ====================

    /**
     * @dev Initiate guardian addition (owner only)
     * @param guardian Guardian address to add
     * @param reason Reason for addition
     * 
     * Requirements:
     * - Only owner can add guardians
     * - Guardian not already active or pending
     * - Delay will be applied before activation
     */
    function initiateGuardianAddition(address guardian, string calldata reason) 
        external onlyOwner 
    {
        require(guardian != address(0), "Invalid guardian");
        
        IGuardianDelayController controller = IGuardianDelayController(delayController);
        controller.initiateGuardianAddition(vault, guardian, reason);
        
        emit GuardianAdditionInitiated(
            guardian,
            controller.getActivationTime(vault, guardian),
            block.timestamp
        );
    }

    /**
     * @dev Activate pending guardian (after delay expires)
     * @param pendingId Pending guardian ID
     */
    function activateGuardian(uint256 pendingId) external {
        IGuardianDelayController(delayController).activatePendingGuardian(pendingId, vault);
        
        address guardian = IGuardianDelayController(delayController)
            .getPendingGuardian(pendingId).guardian;
        
        emit GuardianActivated(guardian, block.timestamp);
    }

    /**
     * @dev Cancel pending guardian addition (owner only)
     * @param pendingId Pending guardian ID
     * @param reason Cancellation reason
     */
    function cancelGuardianAddition(uint256 pendingId, string calldata reason) 
        external onlyOwner 
    {
        IGuardianDelayController(delayController).cancelPendingGuardian(pendingId, reason);
    }

    /**
     * @dev Remove active guardian (owner only)
     * @param guardian Guardian address
     */
    function removeGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "Invalid guardian");
        
        IGuardianDelayController(delayController).removeGuardian(vault, guardian);
        emit GuardianRemoved(guardian, block.timestamp);
    }

    /**
     * @dev Get active guardians
     * @return Array of active guardian addresses
     */
    function getActiveGuardians() external view returns (address[] memory) {
        return IGuardianDelayController(delayController).getActiveGuardians(vault);
    }

    /**
     * @dev Get pending guardians
     * @return Array of pending guardian addresses
     */
    function getPendingGuardians() external view returns (address[] memory) {
        return IGuardianDelayController(delayController).getPendingGuardians(vault);
    }

    /**
     * @dev Get active guardian count
     * @return Number of active guardians
     */
    function getActiveGuardianCount() external view returns (uint256) {
        return IGuardianDelayController(delayController).getActiveGuardianCount(vault);
    }

    /**
     * @dev Check if guardian is active
     * @param guardian Guardian address
     * @return True if active
     */
    function isGuardianActive(address guardian) external view returns (bool) {
        return IGuardianDelayController(delayController).isGuardianActive(vault, guardian);
    }

    /**
     * @dev Check if guardian is pending
     * @param guardian Guardian address
     * @return True if pending
     */
    function isGuardianPending(address guardian) external view returns (bool) {
        return IGuardianDelayController(delayController).isGuardianPending(vault, guardian);
    }

    /**
     * @dev Get time until guardian becomes active
     * @param guardian Guardian address
     * @return Seconds remaining (0 if not pending)
     */
    function getTimeUntilActive(address guardian) external view returns (uint256) {
        return IGuardianDelayController(delayController).getTimeUntilActive(vault, guardian);
    }

    // ==================== Configuration ====================

    /**
     * @dev Update required signatures
     * @param newRequired New signature count
     */
    function setRequiredSignatures(uint256 newRequired) external onlyOwner {
        uint256 activeCount = IGuardianDelayController(delayController)
            .getActiveGuardianCount(vault);
        require(newRequired > 0 && newRequired <= activeCount, "Invalid signature count");
        requiredSignatures = newRequired;
    }

    /**
     * @dev Change vault owner
     * @param newOwner New owner address
     */
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
        emit OwnerChanged(newOwner, block.timestamp);
    }

    // ==================== Query Functions ====================

    /**
     * @dev Get token balance
     * @param token Token address (address(0) for ETH)
     * @return Balance
     */
    function getBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /**
     * @dev Get ETH balance
     * @return Balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get owner
     * @return Owner address
     */
    function getOwner() external view returns (address) {
        return owner;
    }

    /**
     * @dev Get current nonce
     * @return Current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    /**
     * @dev Get delay controller
     * @return Controller address
     */
    function getDelayController() external view returns (address) {
        return delayController;
    }

    /**
     * @dev Get guardian delay duration
     * @return Delay in seconds
     */
    function getGuardianDelay() external view returns (uint256) {
        return IGuardianDelayController(delayController).getVaultDelay(vault);
    }

    // ==================== Internal ====================

    /**
     * @dev Verify signatures from active guardians
     */
    function _verifySignatures(bytes32 messageHash, bytes calldata signatures) internal view {
        require(signatures.length == requiredSignatures * 65, "Invalid signature length");
        
        IGuardianDelayController controller = IGuardianDelayController(delayController);
        address lastSigner = address(0);
        
        for (uint256 i = 0; i < requiredSignatures; i++) {
            bytes memory sig = signatures[i * 65:(i + 1) * 65];
            address signer = messageHash.recover(sig);
            
            require(controller.isGuardianActive(vault, signer), "Invalid or inactive signer");
            require(signer > lastSigner, "Invalid signature order");
            
            lastSigner = signer;
        }
    }
}

// ==================== Interface ====================

interface IGuardianDelayController {
    function initiateGuardianAddition(
        address vault,
        address guardian,
        string calldata reason
    ) external returns (uint256);
    
    function activatePendingGuardian(uint256 pendingId, address vault) external;
    function cancelPendingGuardian(uint256 pendingId, string calldata reason) external;
    function removeGuardian(address vault, address guardian) external;
    
    function isGuardianActive(address vault, address guardian) external view returns (bool);
    function isGuardianPending(address vault, address guardian) external view returns (bool);
    function getActiveGuardians(address vault) external view returns (address[] memory);
    function getPendingGuardians(address vault) external view returns (address[] memory);
    function getActiveGuardianCount(address vault) external view returns (uint256);
    function getTimeUntilActive(address vault, address guardian) external view returns (uint256);
    function getActivationTime(address vault, address guardian) external view returns (uint256);
    function getVaultDelay(address vault) external view returns (uint256);
    function getPendingGuardian(uint256 pendingId) external view returns (
        address guardian,
        address vault,
        uint256 addedAt,
        uint256 activationTime,
        uint256 status,
        bool cancelled,
        string memory reason
    );
    
    function registerGuardianAsActive(address vault, address guardian) external;
}
