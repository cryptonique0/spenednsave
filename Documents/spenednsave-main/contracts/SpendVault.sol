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
    using ECDSA for bytes32;

    // State variables
    address public guardianToken;
    uint256 public quorum;
    uint256 public nonce;

    // Emergency unlock state
    uint256 public unlockRequestTime;
    uint256 public constant TIMELOCK_DURATION = 30 days;

    // EIP-712 Type Hash
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,string reason)"
    );

    // Events
    event Deposited(address indexed token, address indexed from, uint256 amount);
    event Withdrawn(address indexed token, address indexed recipient, uint256 amount, string reason);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event GuardianTokenUpdated(address oldToken, address newToken);
    event EmergencyUnlockRequested(uint256 unlockTime);
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    constructor(
        address _guardianToken,
        uint256 _quorum
    ) Ownable(msg.sender) EIP712("SpendGuard", "1") {
        require(_guardianToken != address(0), "Invalid guardian token address");
        require(_quorum > 0, "Quorum must be greater than 0");
        
        guardianToken = _guardianToken;
        quorum = _quorum;
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
        bytes[] memory signatures
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(signatures.length >= quorum, "Insufficient signatures");

        // Build EIP-712 hash
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                nonce,
                keccak256(bytes(reason))
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);

        // Verify signatures
        address[] memory signers = new address[](signatures.length);
        uint256 validSignatures = 0;

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
        }

        require(validSignatures >= quorum, "Quorum not met");

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

        emit Withdrawn(token, recipient, amount, reason);
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
