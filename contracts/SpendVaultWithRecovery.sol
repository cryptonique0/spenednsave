// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
    function burn(uint256 tokenId, address vault) external;
}

interface IGuardianRotation {
    function isActiveGuardian(address guardian, address vault) external view returns (bool);
    function getActiveGuardianCount(address vault) external view returns (uint256);
    function removeGuardian(address guardian, address vault) external;
}

interface IGuardianRecovery {
    function proposeRecovery(address guardian, address vault, uint256 votesRequired) external returns (uint256);
    function voteOnRecovery(uint256 proposalId, address voter) external returns (bool);
    function getProposalStatus(uint256 proposalId) external view returns (bool, uint256, uint256);
}

/**
 * @title SpendVaultWithRecovery
 * @notice Multi-sig vault with guardian rotation and recovery flow
 * @dev Allows active guardians to vote out compromised guardians
 */
contract SpendVaultWithRecovery is Ownable, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    // State variables
    address public guardianToken;
    address public guardianRotation;
    address public guardianRecovery;
    uint256 public quorum;
    uint256 public nonce;

    // Withdrawal struct for EIP-712
    bytes32 private constant WITHDRAWAL_TYPEHASH = keccak256(
        "Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,string reason)"
    );

    // Recovery execution tracking
    mapping(uint256 => bool) public recoveryExecutions; // proposalId => executed in vault

    // Events
    event VaultInitialized(
        address indexed owner,
        address guardianToken,
        address guardianRotation,
        address guardianRecovery,
        uint256 quorum
    );

    event RecoveryExecutedInVault(
        uint256 indexed proposalId,
        address indexed targetGuardian,
        string reason
    );

    event GuardianRemovedViaRecovery(
        address indexed guardian,
        uint256 indexed proposalId,
        string reason
    );

    event QuorumUpdated(uint256 newQuorum);
    event GuardianTokenUpdated(address newGuardianToken);
    event GuardianRotationUpdated(address newGuardianRotation);
    event GuardianRecoveryUpdated(address newGuardianRecovery);

    event Withdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient,
        string reason,
        address[] signers
    );

    event ETHReceived(address indexed from, uint256 amount);

    constructor(
        address _guardianToken,
        address _guardianRotation,
        address _guardianRecovery,
        uint256 _quorum
    ) EIP712("SpendGuard", "1") Ownable(msg.sender) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_guardianRotation != address(0), "Invalid rotation contract");
        require(_guardianRecovery != address(0), "Invalid recovery contract");
        require(_quorum > 0, "Quorum must be positive");

        guardianToken = _guardianToken;
        guardianRotation = _guardianRotation;
        guardianRecovery = _guardianRecovery;
        quorum = _quorum;

        emit VaultInitialized(msg.sender, _guardianToken, _guardianRotation, _guardianRecovery, _quorum);
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
     * @param _newAddress New address
     */
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
        emit GuardianTokenUpdated(_newAddress);
    }

    /**
     * @notice Update guardian rotation contract address
     * @param _newAddress New address
     */
    function updateGuardianRotation(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianRotation = _newAddress;
        emit GuardianRotationUpdated(_newAddress);
    }

    /**
     * @notice Update guardian recovery contract address
     * @param _newAddress New address
     */
    function updateGuardianRecovery(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianRecovery = _newAddress;
        emit GuardianRecoveryUpdated(_newAddress);
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
     * @return True if active and not expired
     */
    function isActiveGuardian(address guardian) public view returns (bool) {
        if (IGuardianSBT(guardianToken).balanceOf(guardian) == 0) {
            return false;
        }

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
     * @notice Propose recovery for a guardian
     * @param targetGuardian Guardian to be recovered
     * @param reason Reason for recovery
     * @return proposalId ID of the recovery proposal
     */
    function proposeGuardianRecovery(address targetGuardian, string calldata reason)
        external
        onlyOwner
        returns (uint256)
    {
        require(targetGuardian != address(0), "Invalid guardian");
        require(isActiveGuardian(targetGuardian), "Guardian not active");

        // Require quorum-based voting for recovery
        uint256 proposalId = IGuardianRecovery(guardianRecovery).proposeRecovery(
            targetGuardian,
            address(this),
            quorum
        );

        return proposalId;
    }

    /**
     * @notice Cast a recovery vote by an active guardian
     * @param proposalId ID of the recovery proposal
     * @param voter Guardian voting
     * @return executed True if recovery executed
     */
    function voteForGuardianRecovery(uint256 proposalId, address voter)
        external
        onlyOwner
        returns (bool)
    {
        require(isActiveGuardian(voter), "Voter is not an active guardian");

        bool executed = IGuardianRecovery(guardianRecovery).voteOnRecovery(proposalId, voter);

        if (executed && !recoveryExecutions[proposalId]) {
            recoveryExecutions[proposalId] = true;

            // Get guardian from recovery contract via direct call to extract target
            (address targetGuardian, , , , , , , ) = IGuardianRecovery(guardianRecovery)
                .getProposalDetails(proposalId);

            // Remove guardian from rotation
            IGuardianRotation(guardianRotation).removeGuardian(targetGuardian, address(this));

            emit GuardianRemovedViaRecovery(targetGuardian, proposalId, "Voted out via recovery");
            emit RecoveryExecutedInVault(proposalId, targetGuardian, "Guardian removed via recovery vote");
        }

        return executed;
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

            require(isActiveGuardian(signer), "Signer is not active guardian");

            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signer");
            }

            signers[i] = signer;
        }

        nonce++;

        // Execute transfer
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient tokens");
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
     * @notice Get current nonce
     * @return Current nonce
     */
    function getNonce() external view returns (uint256) {
        return nonce;
    }

    /**
     * @notice Check if a recovery proposal has been executed in vault
     * @param proposalId Proposal ID
     * @return True if executed in vault
     */
    function isRecoveryExecutedInVault(uint256 proposalId) external view returns (bool) {
        return recoveryExecutions[proposalId];
    }
}
