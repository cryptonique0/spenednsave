// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SpendVaultWithSocialRecovery
 * @dev Multi-signature treasury with guardian-based owner recovery
 * 
 * Enhanced Features:
 * - Social recovery allows guardians to reset owner if key lost
 * - Maintains all features from previous versions
 * - Integrates with GuardianSocialRecovery contract
 * - Owner recovery can only be executed by recovery contract
 * - Emergency override still available for true emergencies
 */

contract SpendVaultWithSocialRecovery is EIP712 {
    using ECDSA for bytes32;

    // ==================== Types ====================

    struct Withdrawal {
        uint256 amount;
        address recipient;
        address token;
        bytes32 reasonHash;
        bytes32 categoryHash;
        uint256 nonce;
        uint256 expiration;
    }

    enum VaultStatus {
        ACTIVE,
        PAUSED,
        FROZEN
    }

    // ==================== State ====================

    address public vault;
    address public owner;
    address[] public guardians;
    address public socialRecoveryContract;
    address public emergencyGuardian;
    
    uint256 public requiredSignatures;
    VaultStatus public status;
    uint256 public nonce = 0;
    
    mapping(address => bool) public isGuardian;
    mapping(address => uint256) public tokenBalances;
    mapping(bytes32 => bool) public executedWithdrawals;
    
    bytes32 private constant WITHDRAWAL_TYPEHASH = 
        keccak256("Withdrawal(uint256 amount,address recipient,address token,bytes32 reasonHash,bytes32 categoryHash,uint256 nonce,uint256 expiration)");

    // ==================== Events ====================

    event WithdrawalExecuted(
        address indexed recipient,
        uint256 amount,
        address indexed token,
        bytes32 reasonHash,
        bytes32 categoryHash,
        uint256 timestamp
    );
    
    event GuardianAdded(address indexed guardian, uint256 timestamp);
    event GuardianRemoved(address indexed guardian, uint256 timestamp);
    event OwnerChanged(address indexed newOwner, uint256 timestamp);
    
    event OwnerRecoveredViaSocial(
        address indexed newOwner,
        uint256 recoveryId,
        uint256 timestamp
    );
    
    event EmergencyFrozen(address indexed frozenBy, uint256 timestamp);
    event VaultPaused(address indexed pausedBy, uint256 timestamp);
    event VaultResumed(address indexed resumedBy, uint256 timestamp);

    // ==================== Constructor ====================

    constructor(
        address _owner,
        address[] memory _guardians,
        uint256 _requiredSignatures,
        address _socialRecoveryContract,
        address _emergencyGuardian
    ) EIP712("SpendVaultWithSocialRecovery", "1") {
        require(_owner != address(0), "Invalid owner");
        require(_guardians.length > 0, "Need at least 1 guardian");
        require(_requiredSignatures > 0 && _requiredSignatures <= _guardians.length, "Invalid signature count");
        require(_socialRecoveryContract != address(0), "Invalid recovery contract");
        
        owner = _owner;
        vault = address(this);
        requiredSignatures = _requiredSignatures;
        socialRecoveryContract = _socialRecoveryContract;
        emergencyGuardian = _emergencyGuardian;
        status = VaultStatus.ACTIVE;
        
        for (uint256 i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "Invalid guardian");
            require(!isGuardian[_guardians[i]], "Duplicate guardian");
            guardians.push(_guardians[i]);
            isGuardian[_guardians[i]] = true;
            emit GuardianAdded(_guardians[i], block.timestamp);
        }
    }

    // ==================== Access Control ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyGuardian() {
        require(isGuardian[msg.sender], "Only guardian");
        _;
    }

    modifier onlyRecoveryContract() {
        require(msg.sender == socialRecoveryContract, "Only recovery contract");
        _;
    }

    modifier onlyWhenActive() {
        require(status == VaultStatus.ACTIVE, "Vault not active");
        _;
    }

    // ==================== Deposits ====================

    /**
     * @dev Deposit ERC20 tokens to vault
     * @param token Token to deposit
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;
    }

    /**
     * @dev Deposit ETH to vault
     */
    function depositETH() external payable {
        require(msg.value > 0, "Amount must be > 0");
        tokenBalances[address(0)] += msg.value;
    }

    // ==================== Withdrawals ====================

    /**
     * @dev Withdraw tokens with multi-sig approval
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reasonHash Hash of withdrawal reason
     * @param categoryHash Hash of withdrawal category
     * @param signatures Packed signatures from guardians
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        bytes32 reasonHash,
        bytes32 categoryHash,
        bytes calldata signatures
    ) external onlyWhenActive {
        require(amount > 0, "Amount must be > 0");
        require(recipient != address(0), "Invalid recipient");
        require(tokenBalances[token] >= amount, "Insufficient balance");
        
        Withdrawal memory withdrawal = Withdrawal({
            amount: amount,
            recipient: recipient,
            token: token,
            reasonHash: reasonHash,
            categoryHash: categoryHash,
            nonce: nonce,
            expiration: block.timestamp + 1 days
        });
        
        bytes32 withdrawalHash = keccak256(abi.encode(
            WITHDRAWAL_TYPEHASH,
            withdrawal.amount,
            withdrawal.recipient,
            withdrawal.token,
            withdrawal.reasonHash,
            withdrawal.categoryHash,
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
        
        emit WithdrawalExecuted(
            recipient,
            amount,
            token,
            reasonHash,
            categoryHash,
            block.timestamp
        );
    }

    // ==================== Social Recovery ====================

    /**
     * @dev Reset vault owner via social recovery
     * Called only by GuardianSocialRecovery contract after quorum voting
     * @param newOwner New owner address
     * @param recoveryId Recovery ID for audit trail
     */
    function resetOwnerViaSocialRecovery(address newOwner, uint256 recoveryId) external onlyRecoveryContract {
        require(newOwner != address(0), "Invalid owner");
        require(newOwner != owner, "Same owner");
        
        address previousOwner = owner;
        owner = newOwner;
        
        emit OwnerRecoveredViaSocial(newOwner, recoveryId, block.timestamp);
        emit OwnerChanged(newOwner, block.timestamp);
    }

    /**
     * @dev Get recovery contract address
     */
    function getRecoveryContract() external view returns (address) {
        return socialRecoveryContract;
    }

    /**
     * @dev Check if vault has social recovery enabled
     */
    function hasSocialRecoveryEnabled() external view returns (bool) {
        return socialRecoveryContract != address(0);
    }

    // ==================== Guardian Management ====================

    /**
     * @dev Add guardian (owner only)
     * @param guardian Guardian address to add
     */
    function addGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "Invalid guardian");
        require(!isGuardian[guardian], "Already guardian");
        
        guardians.push(guardian);
        isGuardian[guardian] = true;
        emit GuardianAdded(guardian, block.timestamp);
    }

    /**
     * @dev Remove guardian (owner only)
     * @param guardian Guardian address to remove
     */
    function removeGuardian(address guardian) external onlyOwner {
        require(isGuardian[guardian], "Not guardian");
        require(guardians.length > requiredSignatures, "Cannot remove guardian below required signatures");
        
        isGuardian[guardian] = false;
        
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }
        
        emit GuardianRemoved(guardian, block.timestamp);
    }

    /**
     * @dev Get all guardians
     */
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }

    /**
     * @dev Get guardian count
     */
    function getGuardianCount() external view returns (uint256) {
        return guardians.length;
    }

    // ==================== Pause Control ====================

    /**
     * @dev Pause vault (owner only)
     */
    function pauseVault() external onlyOwner {
        require(status != VaultStatus.PAUSED, "Already paused");
        status = VaultStatus.PAUSED;
        emit VaultPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Resume vault (owner only)
     */
    function resumeVault() external onlyOwner {
        require(status == VaultStatus.PAUSED, "Not paused");
        status = VaultStatus.ACTIVE;
        emit VaultResumed(msg.sender, block.timestamp);
    }

    // ==================== Emergency ====================

    /**
     * @dev Emergency freeze vault (emergency guardian only)
     */
    function emergencyFreeze() external {
        require(msg.sender == emergencyGuardian, "Only emergency guardian");
        status = VaultStatus.FROZEN;
        emit EmergencyFrozen(msg.sender, block.timestamp);
    }

    /**
     * @dev Get vault status
     */
    function getStatus() external view returns (VaultStatus) {
        return status;
    }

    /**
     * @dev Check if vault is paused
     */
    function isPaused() external view returns (bool) {
        return status == VaultStatus.PAUSED;
    }

    /**
     * @dev Check if vault is frozen
     */
    function isFrozen() external view returns (bool) {
        return status == VaultStatus.FROZEN;
    }

    // ==================== Balance Management ====================

    /**
     * @dev Get token balance
     * @param token Token address (address(0) for ETH)
     */
    function getBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /**
     * @dev Get ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Get owner
     */
    function getOwner() external view returns (address) {
        return owner;
    }

    /**
     * @dev Get current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    // ==================== Internal ====================

    /**
     * @dev Verify signatures from guardians
     */
    function _verifySignatures(bytes32 messageHash, bytes calldata signatures) internal view {
        require(signatures.length == requiredSignatures * 65, "Invalid signature length");
        
        address lastSigner = address(0);
        
        for (uint256 i = 0; i < requiredSignatures; i++) {
            bytes memory sig = signatures[i * 65:(i + 1) * 65];
            address signer = messageHash.recover(sig);
            
            require(isGuardian[signer], "Invalid signer");
            require(signer > lastSigner, "Invalid signature order");
            
            lastSigner = signer;
        }
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        tokenBalances[address(0)] += msg.value;
    }
}
