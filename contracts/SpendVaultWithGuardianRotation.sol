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

interface IGuardianRotation {
    function isActiveGuardian(address guardian, address vault) external view returns (bool);
    function getActiveGuardianCount(address vault) external view returns (uint256);
}

/**
 * @title SpendVaultWithGuardianRotation
 * @notice Multi-signature treasury vault with guardian-based approvals and expiry support
 * @dev Uses EIP-712 for signature verification, soulbound tokens, and GuardianRotation for expiry management
 */
contract SpendVaultWithGuardianRotation is Ownable, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    // State variables
    address public guardianToken;
    address public guardianRotation; // Guardian rotation contract
    uint256 public quorum;
    uint256 public nonce;
    
    // Withdrawal struct for EIP-712
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,string reason)"
    );

    // Events
    event VaultInitialized(address indexed owner, address guardianToken, address guardianRotation, uint256 quorum);
    event QuorumUpdated(uint256 newQuorum);
    event GuardianTokenUpdated(address newGuardianToken);
    event GuardianRotationUpdated(address newGuardianRotation);
    event Withdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient,
        string reason,
        address[] signers
    );
    event ETHReceived(address indexed from, uint256 amount);
    event GuardianValidationFailed(address indexed guardian, string reason);

    constructor(
        address _guardianToken,
        address _guardianRotation,
        uint256 _quorum
    ) EIP712("SpendGuard", "1") Ownable(msg.sender) {
        require(_guardianToken != address(0), "Invalid guardian token address");
        require(_guardianRotation != address(0), "Invalid guardian rotation address");
        require(_quorum > 0, "Quorum must be positive");

        guardianToken = _guardianToken;
        guardianRotation = _guardianRotation;
        quorum = _quorum;

        emit VaultInitialized(msg.sender, _guardianToken, _guardianRotation, _quorum);
    }

    /**
     * @notice Update quorum requirement
     * @param _newQuorum New quorum value
     */
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be positive");
        quorum = _newQuorum;
        emit QuorumUpdated(_newQuorum);
    }

    /**
     * @notice Update guardian token contract address
     * @param _newAddress New guardian token address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(_newAddress);
    }

    /**
     * @notice Update guardian rotation contract address
     * @param _newAddress New guardian rotation address
     */
    function updateGuardianRotation(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianRotation = _newAddress;
        emit GuardianRotationUpdated(_newAddress);
    }

    /**
     * @notice Accept native ETH
     */
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Fallback for unexpected calls
     */
    fallback() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    /**
     * @notice Deposit ERC-20 tokens
     * @param token Token address
     * @param amount Amount to deposit
     */
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Get current ETH balance
     * @return Balance in wei
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get token balance
     * @param token Token address
     * @return Balance in token units
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @notice Check if an address is an active guardian
     * @param guardian Guardian address
     * @return True if guardian is active and not expired
     */
    function isActiveGuardian(address guardian) public view returns (bool) {
        // Must hold a guardian SBT
        if (IGuardianSBT(guardianToken).balanceOf(guardian) == 0) {
            return false;
        }
        
        // Must be registered in GuardianRotation and not expired
        return IGuardianRotation(guardianRotation).isActiveGuardian(guardian, address(this));
    }

    /**
     * @notice Get count of active guardians
     * @return Number of active guardians
     */
    function getActiveGuardianCount() public view returns (uint256) {
        return IGuardianRotation(guardianRotation).getActiveGuardianCount(address(this));
    }

    /**
     * @notice Verify a signature for a withdrawal
     * @param guardian Guardian address
     * @param token Token address
     * @param amount Withdrawal amount
     * @param recipient Recipient address
     * @param reason Withdrawal reason
     * @param signature Guardian's signature
     * @return True if signature is valid from an active guardian
     */
    function verifySignature(
        address guardian,
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        bytes memory signature
    ) public view returns (bool) {
        // Check if guardian is active and not expired
        if (!isActiveGuardian(guardian)) {
            return false;
        }

        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    WITHDRAWAL_TYPEHASH,
                    token,
                    amount,
                    recipient,
                    nonce,
                    keccak256(bytes(reason))
                )
            )
        );

        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner == guardian;
    }

    /**
     * @notice Execute a withdrawal with guardian signatures
     * @param token Token address
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     * @param reason Withdrawal reason
     * @param signatures Array of guardian signatures
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(signatures.length >= quorum, "Insufficient signatures");

        // Check active guardian count
        uint256 activeCount = getActiveGuardianCount();
        require(activeCount >= quorum, "Insufficient active guardians");

        // Verify all signatures
        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            bytes32 digest = _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        WITHDRAWAL_TYPEHASH,
                        token,
                        amount,
                        recipient,
                        nonce,
                        keccak256(bytes(reason))
                    )
                )
            );

            address signer = ECDSA.recover(digest, signatures[i]);
            
            // Verify signer is an active guardian
            if (!isActiveGuardian(signer)) {
                emit GuardianValidationFailed(signer, "Guardian is inactive or expired");
                revert("Guardian is inactive or expired");
            }

            // Check for duplicate signers
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signer");
            }

            signers[i] = signer;
        }

        // Increment nonce for replay protection
        nonce++;

        // Execute transfer
        if (token == address(0)) {
            // Native ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // ERC-20 token
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient token balance");
            IERC20(token).transfer(recipient, amount);
        }

        emit Withdrawal(token, amount, recipient, reason, signers);
    }

    /**
     * @notice Get EIP-712 domain separator
     * @return Domain separator
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Get current withdrawal nonce
     * @return Current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }
}
