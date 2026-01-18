// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SpendingLimits.sol";

/**
 * @title SpendVaultWithLimits
 * @notice Enhanced SpendVault with spending limit enforcement
 * @dev Integrates SpendingLimits contract for multi-timeframe withdrawal caps
 */
contract SpendVaultWithLimits is Ownable, ReentrancyGuard, EIP712 {
    
    // ============ State Variables ============
    
    IERC721 public guardianToken;
    SpendingLimits public limitsContract;
    
    uint256 public quorum;
    uint256 public nonce;
    
    bool public vaultFrozen;
    bool public emergencyUnlockRequested;
    uint256 public emergencyUnlockTime;
    
    address public spendingLimitsContractAddress;
    
    // ============ Events ============
    
    event Deposit(address indexed token, uint256 amount, address indexed depositor);
    event Withdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient,
        string reason,
        uint256 sigWeight,
        uint256 requiredWeight
    );
    event QuorumUpdated(uint256 newQuorum);
    event GuardianTokenUpdated(address newAddress);
    event VaultFrozen(uint256 freezeTime);
    event VaultUnfrozen(uint256 unfreezeTime);
    event LimitsEnforced(address indexed token, address indexed guardian, uint256 amount, string limitType);
    event LimitCheckSkipped(string reason);
    
    // ============ Modifiers ============
    
    modifier vaultNotFrozen() {
        require(!vaultFrozen, "Vault is frozen");
        _;
    }
    
    modifier validGuardians(bytes[] memory signatures) {
        // Check for duplicate signatures
        for (uint256 i = 0; i < signatures.length; i++) {
            for (uint256 j = i + 1; j < signatures.length; j++) {
                require(
                    keccak256(signatures[i]) != keccak256(signatures[j]),
                    "Duplicate signature detected"
                );
            }
        }
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _guardianToken,
        uint256 _quorum,
        address _limitsContract
    ) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token address");
        require(_quorum > 0, "Quorum must be at least 1");
        require(_limitsContract != address(0), "Invalid limits contract address");
        
        guardianToken = IERC721(_guardianToken);
        limitsContract = SpendingLimits(_limitsContract);
        spendingLimitsContractAddress = _limitsContract;
        quorum = _quorum;
        nonce = 0;
        vaultFrozen = false;
        emergencyUnlockRequested = false;
        emergencyUnlockTime = 0;
    }
    
    // ============ Management Functions ============
    
    function setQuorum(uint256 _newQuorum) public onlyOwner {
        require(_newQuorum > 0, "Quorum must be at least 1");
        quorum = _newQuorum;
        emit QuorumUpdated(_newQuorum);
    }
    
    function updateGuardianToken(address _newAddress) public onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = IERC721(_newAddress);
        emit GuardianTokenUpdated(_newAddress);
    }
    
    // ============ Funding Functions ============
    
    receive() external payable {
        emit Deposit(address(0), msg.value, msg.sender);
    }
    
    fallback() external payable {
        emit Deposit(address(0), msg.value, msg.sender);
    }
    
    function deposit(address token, uint256 amount) public {
        require(token != address(0), "Use receive() for ETH");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        emit Deposit(token, amount, msg.sender);
    }
    
    // ============ Withdrawal with Limits ============
    
    /**
     * @notice Withdraw funds with spending limits enforcement
     * @param token Token address (address(0) for ETH)
     * @param amount Withdrawal amount
     * @param recipient Recipient address
     * @param reason Withdrawal reason
     * @param signatures Guardian signatures
     */
    function withdrawWithLimits(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        bytes[] calldata signatures
    ) public onlyOwner nonReentrant vaultNotFrozen validGuardians(signatures) {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");
        require(signatures.length >= quorum, "Insufficient signatures");
        
        // Get domain separator for EIP-712
        bytes32 domainSeparator = _domainSeparatorV4();
        
        // Build withdrawal hash
        bytes32 withdrawalHash = keccak256(
            abi.encode(
                keccak256("Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,bytes32 reason,bytes32 category,uint256 createdAt)"),
                token,
                amount,
                recipient,
                nonce,
                keccak256(abi.encodePacked(reason)),
                keccak256(abi.encodePacked("regular")),
                block.timestamp
            )
        );
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, withdrawalHash));
        
        // Verify signatures and check spending limits
        uint256 validSignatures = 0;
        address[] memory signingGuardians = new address[](signatures.length);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ECDSA.recover(digest, signatures[i]);
            
            // Verify signer is a guardian
            require(guardianToken.balanceOf(signer) > 0, "Signer is not a guardian");
            
            // Check guardian-level spending limits
            (bool guardianAllowed, string memory guardianReason) = limitsContract.checkGuardianLimit(
                address(this),
                token,
                signer,
                amount
            );
            
            if (!guardianAllowed) {
                emit LimitsEnforced(token, signer, amount, guardianReason);
                revert(string(abi.encodePacked("Guardian limit exceeded: ", guardianReason)));
            }
            
            signingGuardians[i] = signer;
            validSignatures++;
        }
        
        require(validSignatures >= quorum, "Insufficient valid signatures");
        
        // Check vault-level spending limits
        (bool vaultAllowed, string memory vaultReason) = limitsContract.checkVaultLimit(
            address(this),
            token,
            amount
        );
        
        if (!vaultAllowed) {
            emit LimitsEnforced(address(0), address(0), amount, vaultReason);
            revert(string(abi.encodePacked("Vault limit exceeded: ", vaultReason)));
        }
        
        // Record spending in limits contract
        for (uint256 i = 0; i < signingGuardians.length; i++) {
            limitsContract.recordGuardianWithdrawal(
                address(this),
                token,
                signingGuardians[i],
                amount
            );
        }
        limitsContract.recordVaultWithdrawal(address(this), token, amount);
        
        // Execute withdrawal
        if (token == address(0)) {
            // ETH withdrawal
            require(address(this).balance >= amount, "Insufficient balance");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC-20 withdrawal
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
            require(IERC20(token).transfer(recipient, amount), "Transfer failed");
        }
        
        nonce++;
        emit Withdrawal(token, amount, recipient, reason, validSignatures, quorum);
    }
    
    // ============ Vault Freezing ============
    
    function freezeVault() public onlyOwner {
        vaultFrozen = true;
        emit VaultFrozen(block.timestamp);
    }
    
    function unfreezeVault() public onlyOwner {
        vaultFrozen = false;
        emit VaultUnfrozen(block.timestamp);
    }
    
    // ============ Emergency Timelock ============
    
    function requestEmergencyUnlock() public onlyOwner {
        emergencyUnlockRequested = true;
        emergencyUnlockTime = block.timestamp + 30 days;
    }
    
    function executeEmergencyUnlock(address token) public onlyOwner {
        require(emergencyUnlockRequested, "Emergency unlock not requested");
        require(block.timestamp >= emergencyUnlockTime, "Timelock not elapsed");
        
        uint256 amount;
        if (token == address(0)) {
            amount = address(this).balance;
            require(amount > 0, "No ETH to withdraw");
            (bool success, ) = owner().call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            amount = IERC20(token).balanceOf(address(this));
            require(amount > 0, "No tokens to withdraw");
            require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        }
        
        emergencyUnlockRequested = false;
        emergencyUnlockTime = 0;
        nonce++;
    }
    
    function cancelEmergencyUnlock() public onlyOwner {
        emergencyUnlockRequested = false;
        emergencyUnlockTime = 0;
    }
    
    function getEmergencyUnlockTimeRemaining() public view returns (uint256) {
        if (!emergencyUnlockRequested) return 0;
        if (block.timestamp >= emergencyUnlockTime) return 0;
        return emergencyUnlockTime - block.timestamp;
    }
    
    // ============ View Functions ============
    
    function getETHBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getTokenBalance(address token) public view returns (uint256) {
        require(token != address(0), "Use getETHBalance() for ETH");
        return IERC20(token).balanceOf(address(this));
    }
    
    function getDomainSeparator() public view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    /**
     * @notice Get guardian spending status and limits
     */
    function getGuardianLimitStatus(
        address guardian,
        address token
    ) public view returns (
        uint256 dailyLimit,
        uint256 dailySpent,
        uint256 dailyRemaining,
        uint256 weeklyLimit,
        uint256 weeklySpent,
        uint256 weeklyRemaining,
        uint256 monthlyLimit,
        uint256 monthlySpent,
        uint256 monthlyRemaining
    ) {
        SpendingLimits.GuardianLimit memory limit = limitsContract.guardianLimits(address(this), token, guardian);
        (uint256 daily, uint256 weekly, uint256 monthly) = limitsContract.getGuardianSpending(address(this), token, guardian);
        (uint256 dailyRem, uint256 weeklyRem, uint256 monthlyRem) = limitsContract.getGuardianRemaining(address(this), token, guardian);
        
        return (
            limit.dailyLimit,
            daily,
            dailyRem,
            limit.weeklyLimit,
            weekly,
            weeklyRem,
            limit.monthlyLimit,
            monthly,
            monthlyRem
        );
    }
    
    /**
     * @notice Get vault spending status and limits
     */
    function getVaultLimitStatus(
        address token
    ) public view returns (
        uint256 dailyLimit,
        uint256 dailySpent,
        uint256 dailyRemaining,
        uint256 weeklyLimit,
        uint256 weeklySpent,
        uint256 weeklyRemaining,
        uint256 monthlyLimit,
        uint256 monthlySpent,
        uint256 monthlyRemaining
    ) {
        SpendingLimits.VaultLimit memory limit = limitsContract.vaultLimits(address(this), token);
        (uint256 daily, uint256 weekly, uint256 monthly) = limitsContract.getVaultSpending(address(this), token);
        (uint256 dailyRem, uint256 weeklyRem, uint256 monthlyRem) = limitsContract.getVaultRemaining(address(this), token);
        
        return (
            limit.dailyLimit,
            daily,
            dailyRem,
            limit.weeklyLimit,
            weekly,
            weeklyRem,
            limit.monthlyLimit,
            monthly,
            monthlyRem
        );
    }
}
