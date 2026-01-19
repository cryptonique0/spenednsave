// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SignatureAggregationService.sol";

/**
 * @title SpendVaultWithSignatureAggregation
 * @notice Multi-signature vault using compact signature aggregation for gas optimization
 * @dev Reduces calldata and verification gas through packed signatures
 */

contract SpendVaultWithSignatureAggregation is ReentrancyGuard {
    /// @notice Guardian SBT contract
    IERC721 public guardianToken;

    /// @notice Signature aggregation service
    SignatureAggregationService public aggregationService;

    /// @notice Vault owner
    address public owner;

    /// @notice Required guardian signatures for withdrawal
    uint256 public quorum;

    /// @notice EIP-712 domain separator
    bytes32 public DOMAIN_SEPARATOR;

    /// @notice Withdrawal nonce for replay protection
    mapping(address => uint256) public nonce;

    /// @notice Active guardians for this vault
    address[] public guardians;

    /// @notice Is address a guardian
    mapping(address => bool) public isGuardian;

    /// @notice ETH balance tracker
    uint256 public ethBalance;

    /// @notice ERC-20 token balances
    mapping(address => uint256) public tokenBalances;

    /// @notice Signature aggregation statistics
    uint256 public totalAggregatedSignatures;
    uint256 public totalGasSaved;

    // Events
    event Deposit(address indexed depositor, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed token, uint256 amount, address indexed recipient, uint256 timestamp);
    event WithdrawalWithAggregation(
        address indexed token,
        uint256 amount,
        address indexed recipient,
        uint256 signatureCount,
        uint256 gasSaved,
        uint256 timestamp
    );
    event OwnerChanged(address indexed newOwner, uint256 timestamp);
    event GuardianAdded(address indexed guardian, uint256 timestamp);
    event GuardianRemoved(address indexed guardian, uint256 timestamp);
    event QuorumUpdated(uint256 newQuorum, uint256 timestamp);

    // Modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // Constructor
    constructor(
        address _guardianToken,
        address _aggregationService,
        uint256 _quorum
    ) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_aggregationService != address(0), "Invalid aggregation service");
        require(_quorum > 0, "Invalid quorum");

        guardianToken = IERC721(_guardianToken);
        aggregationService = SignatureAggregationService(_aggregationService);
        owner = msg.sender;
        quorum = _quorum;

        // Setup EIP-712
        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("SpendGuard")),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    // Deposit Functions

    /// @notice Accept native ETH
    receive() external payable {
        ethBalance += msg.value;
        emit Deposit(msg.sender, address(0), msg.value, block.timestamp);
    }

    /// @notice Deposit ERC-20 tokens
    function deposit(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;

        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    // Withdrawal with Aggregation

    /// @notice Withdraw with aggregated signatures (compact format)
    /// @param token Token to withdraw
    /// @param amount Amount to withdraw
    /// @param recipient Recipient address
    /// @param reason Withdrawal reason
    /// @param aggregatedSignatures Packed signatures from SignatureAggregationService
    function withdrawWithAggregation(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        bytes calldata aggregatedSignatures
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(aggregatedSignatures.length >= 1, "No signatures");

        // Get signature count from first byte
        uint256 signatureCount = uint8(aggregatedSignatures[0]);
        require(signatureCount >= quorum, "Insufficient signatures");
        require(signatureCount <= guardians.length, "Too many signatures");

        // Hash withdrawal data
        bytes32 messageHash = keccak256(
            abi.encode(token, amount, recipient, nonce[msg.sender], reason)
        );

        // Recover signers from aggregated signatures
        address[] memory signers = aggregationService.batchRecoverSigners(messageHash, aggregatedSignatures);

        // Verify signatures
        address[] memory validSigners;
        uint256[] memory duplicateIndices;
        (validSigners, duplicateIndices) = aggregationService.verifyAndFilterSignatures(
            messageHash,
            aggregatedSignatures,
            guardians
        );

        require(validSigners.length >= quorum, "Not enough valid signatures");
        require(duplicateIndices.length == 0, "Duplicate signatures detected");

        // Execute withdrawal
        nonce[msg.sender]++;

        if (token == address(0)) {
            // Withdraw ETH
            require(ethBalance >= amount, "Insufficient ETH balance");
            ethBalance -= amount;
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw ERC-20
            require(tokenBalances[token] >= amount, "Insufficient token balance");
            tokenBalances[token] -= amount;
            IERC20(token).transfer(recipient, amount);
        }

        // Track aggregation statistics
        totalAggregatedSignatures += signatureCount;
        (uint256 savedBytes,) = aggregationService.calculateGasSavings(signatureCount);
        uint256 gasSaved = savedBytes * 16; // Approximate gas saved per byte
        totalGasSaved += gasSaved;

        emit WithdrawalWithAggregation(token, amount, recipient, signatureCount, gasSaved, block.timestamp);
        emit Withdrawal(token, amount, recipient, block.timestamp);
    }

    /// @notice Withdraw with standard (unpacked) signatures for backward compatibility
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(signatures.length >= quorum, "Insufficient signatures");

        // Hash withdrawal data
        bytes32 messageHash = keccak256(
            abi.encode(token, amount, recipient, nonce[msg.sender], reason)
        );

        // Verify signatures
        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = _recoverSigner(messageHash, signatures[i]);
            require(isGuardian[signer], "Invalid signer");

            // Check for duplicates
            for (uint256 j = 0; j < i; j++) {
                require(signers[j] != signer, "Duplicate signer");
            }
            signers[i] = signer;
        }

        // Execute withdrawal
        nonce[msg.sender]++;

        if (token == address(0)) {
            require(ethBalance >= amount, "Insufficient ETH");
            ethBalance -= amount;
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(tokenBalances[token] >= amount, "Insufficient token balance");
            tokenBalances[token] -= amount;
            IERC20(token).transfer(recipient, amount);
        }

        emit Withdrawal(token, amount, recipient, block.timestamp);
    }

    // Guardian Management

    /// @notice Add guardian
    function addGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "Invalid guardian");
        require(!isGuardian[guardian], "Already guardian");

        isGuardian[guardian] = true;
        guardians.push(guardian);

        emit GuardianAdded(guardian, block.timestamp);
    }

    /// @notice Remove guardian
    function removeGuardian(address guardian) external onlyOwner {
        require(isGuardian[guardian], "Not a guardian");

        isGuardian[guardian] = false;

        // Remove from array
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }

        emit GuardianRemoved(guardian, block.timestamp);
    }

    /// @notice Set new quorum
    function setQuorum(uint256 newQuorum) external onlyOwner {
        require(newQuorum > 0 && newQuorum <= guardians.length, "Invalid quorum");
        quorum = newQuorum;

        emit QuorumUpdated(newQuorum, block.timestamp);
    }

    /// @notice Change owner
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid new owner");
        owner = newOwner;

        emit OwnerChanged(newOwner, block.timestamp);
    }

    // View Functions

    /// @notice Get ETH balance
    function getETHBalance() external view returns (uint256) {
        return ethBalance;
    }

    /// @notice Get token balance
    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    /// @notice Get all guardians
    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }

    /// @notice Get guardian count
    function getGuardianCount() external view returns (uint256) {
        return guardians.length;
    }

    /// @notice Get aggregation statistics
    function getAggregationStats() external view returns (uint256 totalSignatures, uint256 totalGas) {
        return (totalAggregatedSignatures, totalGasSaved);
    }

    /// @notice Get average gas saved per withdrawal
    function getAverageGasSaved() external view returns (uint256) {
        if (totalAggregatedSignatures == 0) return 0;
        return totalGasSaved / totalAggregatedSignatures;
    }

    /// @notice Get domain separator for EIP-712
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    /// @notice Get aggregation service address
    function getAggregationService() external view returns (address) {
        return address(aggregationService);
    }

    // Internal Functions

    /// @notice Recover signer from signature
    function _recoverSigner(bytes32 messageHash, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := calldataload(add(signature.offset, 0x00))
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature");

        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        address recovered = ecrecover(ethSignedMessageHash, v, r, s);
        require(recovered != address(0), "Invalid signature");

        return recovered;
    }
}
