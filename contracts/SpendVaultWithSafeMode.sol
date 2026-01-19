// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./SafeModeController.sol";

/**
 * @title SpendVaultWithSafeMode
 * @notice Multi-signature vault with safe mode: restricts withdrawals to owner only when enabled
 * @dev Inherits base vault functionality, adds safe mode withdrawal restriction
 */

contract SpendVaultWithSafeMode is ReentrancyGuard {
    /// @notice Guardian SBT contract
    IERC721 public guardianToken;

    /// @notice Safe mode controller
    SafeModeController public safeModeController;

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

    // Events
    event Deposit(address indexed depositor, address indexed token, uint256 amount, uint256 timestamp);
    event Withdrawal(address indexed token, uint256 amount, address indexed recipient, uint256 timestamp);
    event SafeModeWithdrawal(address indexed recipient, uint256 amount, uint256 timestamp);
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
        address _safeModeController,
        uint256 _quorum
    ) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_safeModeController != address(0), "Invalid controller");
        require(_quorum > 0, "Invalid quorum");

        guardianToken = IERC721(_guardianToken);
        safeModeController = SafeModeController(_safeModeController);
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

    // Safe Mode Withdrawal (Owner only, bypasses multi-sig)

    /// @notice Withdraw to owner address (bypasses multi-sig when safe mode enabled)
    /// @dev Only works when safe mode is enabled and withdrawal is to owner
    function safeModeWithdraw(address token, uint256 amount) external onlyOwner nonReentrant {
        require(safeModeController.isSafeModeEnabled(address(this)), "Safe mode not enabled");
        require(amount > 0, "Invalid amount");

        if (token == address(0)) {
            // Withdraw ETH
            require(ethBalance >= amount, "Insufficient ETH balance");
            ethBalance -= amount;
            (bool success, ) = owner.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            // Withdraw ERC-20
            require(tokenBalances[token] >= amount, "Insufficient token balance");
            tokenBalances[token] -= amount;
            IERC20(token).transfer(owner, amount);
        }

        emit SafeModeWithdrawal(owner, amount, block.timestamp);
        emit Withdrawal(token, amount, owner, block.timestamp);
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

    // Multi-Sig Withdrawal (when safe mode disabled)

    /// @notice Withdraw with guardian signatures (disabled when safe mode enabled)
    function withdraw(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(!safeModeController.isSafeModeEnabled(address(this)), "Safe mode enabled - use safeModeWithdraw");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(signatures.length >= quorum, "Insufficient signatures");

        // Verify signatures
        bytes32 messageHash = keccak256(
            abi.encode(token, amount, recipient, nonce[msg.sender], reason)
        );

        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            signers[i] = _recoverSigner(messageHash, signatures[i]);
            require(isGuardian[signers[i]], "Invalid signer");

            // Check for duplicates
            for (uint256 j = 0; j < i; j++) {
                require(signers[i] != signers[j], "Duplicate signer");
            }
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

    /// @notice Check if safe mode enabled
    function isSafeModeEnabled() external view returns (bool) {
        return safeModeController.isSafeModeEnabled(address(this));
    }

    /// @notice Get safe mode duration (seconds)
    function getSafeModeDuration() external view returns (uint256) {
        return safeModeController.getSafeModeDuration(address(this));
    }

    /// @notice Get safe mode reason
    function getSafeModeReason() external view returns (string memory) {
        SafeModeController.SafeModeConfig memory config = safeModeController.getSafeModeConfig(address(this));
        return config.reason;
    }

    /// @notice Get safe mode controller address
    function getSafeModeController() external view returns (address) {
        return address(safeModeController);
    }

    /// @notice Get domain separator for EIP-712
    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
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
