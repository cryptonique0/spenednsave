// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./CrossChainGuardianProofService.sol";

/**
 * @title MultiChainVault
 * @notice Multi-chain vault accepting guardian proofs from other chains
 * @dev Enables withdrawals validated by guardians across multiple chains
 */

contract MultiChainVault is ReentrancyGuard {
    /// @notice Multi-chain withdrawal structure
    struct MultiChainWithdrawal {
        address token;
        uint256 amount;
        address recipient;
        uint256 nonce;
        string reason;
        uint256[] proofChainIds;
        bool executed;
    }

    /// @notice Guardian approval structure
    struct GuardianApproval {
        address guardian;
        uint256 chainId;
        uint256 approvalTimestamp;
        bool isRemote;
    }

    // State variables
    IERC721 public guardianToken;
    CrossChainGuardianProofService public proofService;
    address public owner;
    uint256 public quorum;
    uint256 public remoteGuardianWeight;

    address[] public guardians;
    mapping(address => bool) public isGuardian;
    mapping(address => bool) public isActiveGuardian;
    mapping(address => uint256) public guardianChainId;

    uint256 public ethBalance;
    mapping(address => uint256) public tokenBalances;
    mapping(address => uint256) public nonce;

    uint256 public totalMultiChainWithdrawals;

    // Multi-chain tracking
    mapping(address => uint256[]) public chainIds;
    mapping(address => mapping(uint256 => bool)) public isChainConnected;
    uint256[] public connectedChains;

    // Withdrawal tracking
    mapping(uint256 => MultiChainWithdrawal) public multiChainWithdrawals;
    mapping(uint256 => GuardianApproval[]) public withdrawalApprovals;

    // EIP-712
    bytes32 public DOMAIN_SEPARATOR;

    // Events
    event Deposit(address indexed depositor, address indexed token, uint256 amount, uint256 timestamp);
    event MultiChainWithdrawalProposed(
        uint256 indexed withdrawalId,
        address indexed token,
        uint256 amount,
        address recipient,
        uint256[] chainIds
    );
    event RemoteGuardianApproved(
        uint256 indexed withdrawalId,
        address indexed guardian,
        uint256 chainId,
        uint256 approvalCount
    );
    event MultiChainWithdrawalExecuted(
        uint256 indexed withdrawalId,
        address indexed token,
        uint256 amount,
        address recipient,
        uint256 timestamp
    );
    event ChainConnected(uint256 indexed chainId, uint256 timestamp);
    event ChainDisconnected(uint256 indexed chainId, uint256 timestamp);
    event GuardianAdded(address indexed guardian, uint256 chainId, uint256 timestamp);
    event GuardianRemoved(address indexed guardian, uint256 timestamp);
    event RemoteGuardianWeightUpdated(uint256 newWeight, uint256 timestamp);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // Constructor
    constructor(
        address _guardianToken,
        address _proofService,
        uint256 _quorum,
        uint256 _remoteGuardianWeight
    ) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_proofService != address(0), "Invalid proof service");
        require(_quorum > 0, "Invalid quorum");
        require(_remoteGuardianWeight > 0, "Invalid weight");

        guardianToken = IERC721(_guardianToken);
        proofService = CrossChainGuardianProofService(_proofService);
        owner = msg.sender;
        quorum = _quorum;
        remoteGuardianWeight = _remoteGuardianWeight;

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

    receive() external payable {
        ethBalance += msg.value;
        emit Deposit(msg.sender, address(0), msg.value, block.timestamp);
    }

    function deposit(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        tokenBalances[token] += amount;

        emit Deposit(msg.sender, token, amount, block.timestamp);
    }

    // Multi-Chain Withdrawal Functions

    function proposeMultiChainWithdrawal(
        address token,
        uint256 amount,
        address recipient,
        string calldata reason,
        uint256[] calldata proofChainIds
    ) external onlyOwner nonReentrant returns (uint256 withdrawalId) {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(proofChainIds.length > 0, "No proof chains");
        require(proofChainIds.length <= 5, "Too many proof chains");

        // Verify sufficient balance
        if (token == address(0)) {
            require(ethBalance >= amount, "Insufficient ETH");
        } else {
            require(tokenBalances[token] >= amount, "Insufficient token balance");
        }

        withdrawalId = totalMultiChainWithdrawals;
        totalMultiChainWithdrawals++;

        MultiChainWithdrawal storage withdrawal = multiChainWithdrawals[withdrawalId];
        withdrawal.token = token;
        withdrawal.amount = amount;
        withdrawal.recipient = recipient;
        withdrawal.nonce = nonce[msg.sender]++;
        withdrawal.reason = reason;
        withdrawal.proofChainIds = proofChainIds;
        withdrawal.executed = false;

        emit MultiChainWithdrawalProposed(withdrawalId, token, amount, recipient, proofChainIds);
    }

    function approveWithRemoteGuardian(
        uint256 withdrawalId,
        address guardian,
        uint256 guardianChainId,
        CrossChainGuardianProofService.GuardianProof calldata proof
    ) external nonReentrant {
        require(withdrawalId < totalMultiChainWithdrawals, "Invalid withdrawal");
        require(guardian != address(0), "Invalid guardian");
        require(guardianChainId != block.chainid, "Not remote");

        MultiChainWithdrawal storage withdrawal = multiChainWithdrawals[withdrawalId];
        require(!withdrawal.executed, "Already executed");

        // Verify guardian proof
        bool isValidProof = proofService.verifyGuardianProof(proof);
        require(isValidProof, "Invalid guardian proof");

        // Verify guardian from one of the proof chains
        bool isValidChain = false;
        for (uint256 i = 0; i < withdrawal.proofChainIds.length; i++) {
            if (withdrawal.proofChainIds[i] == guardianChainId) {
                isValidChain = true;
                break;
            }
        }
        require(isValidChain, "Guardian not on proof chain");

        // Check for duplicate approval
        GuardianApproval[] storage approvals = withdrawalApprovals[withdrawalId];
        for (uint256 i = 0; i < approvals.length; i++) {
            require(approvals[i].guardian != guardian || approvals[i].chainId != guardianChainId, "Already approved");
        }

        // Record approval
        GuardianApproval memory approval = GuardianApproval({
            guardian: guardian,
            chainId: guardianChainId,
            approvalTimestamp: block.timestamp,
            isRemote: true
        });

        approvals.push(approval);

        emit RemoteGuardianApproved(withdrawalId, guardian, guardianChainId, approvals.length);
    }

    function approveWithLocalGuardian(uint256 withdrawalId, bytes calldata signature) external nonReentrant {
        require(withdrawalId < totalMultiChainWithdrawals, "Invalid withdrawal");
        require(signature.length == 65, "Invalid signature");

        MultiChainWithdrawal storage withdrawal = multiChainWithdrawals[withdrawalId];
        require(!withdrawal.executed, "Already executed");

        // Hash withdrawal data
        bytes32 messageHash = keccak256(
            abi.encode(
                withdrawal.token,
                withdrawal.amount,
                withdrawal.recipient,
                withdrawal.nonce,
                withdrawal.reason
            )
        );

        // Recover signer
        address signer = _recoverSigner(messageHash, signature);
        require(isActiveGuardian[signer], "Not active guardian");
        require(guardianChainId[signer] == 0 || guardianChainId[signer] == block.chainid, "Not local guardian");

        // Check for duplicate approval
        GuardianApproval[] storage approvals = withdrawalApprovals[withdrawalId];
        for (uint256 i = 0; i < approvals.length; i++) {
            require(approvals[i].guardian != signer || !approvals[i].isRemote, "Already approved");
        }

        // Record approval
        GuardianApproval memory approval = GuardianApproval({
            guardian: signer,
            chainId: block.chainid,
            approvalTimestamp: block.timestamp,
            isRemote: false
        });

        approvals.push(approval);

        emit RemoteGuardianApproved(withdrawalId, signer, block.chainid, approvals.length);
    }

    function executeMultiChainWithdrawal(uint256 withdrawalId) external nonReentrant {
        require(withdrawalId < totalMultiChainWithdrawals, "Invalid withdrawal");

        MultiChainWithdrawal storage withdrawal = multiChainWithdrawals[withdrawalId];
        require(!withdrawal.executed, "Already executed");

        GuardianApproval[] storage approvals = withdrawalApprovals[withdrawalId];

        // Calculate weighted approvals
        uint256 localApprovals = 0;
        uint256 remoteApprovals = 0;

        for (uint256 i = 0; i < approvals.length; i++) {
            if (approvals[i].isRemote) {
                remoteApprovals++;
            } else {
                localApprovals++;
            }
        }

        // Check quorum: local + (remote * weight)
        uint256 totalWeight = localApprovals + (remoteApprovals * remoteGuardianWeight);
        require(totalWeight >= quorum, "Insufficient approvals");

        // Execute withdrawal
        withdrawal.executed = true;

        if (withdrawal.token == address(0)) {
            ethBalance -= withdrawal.amount;
            (bool success, ) = withdrawal.recipient.call{value: withdrawal.amount}("");
            require(success, "ETH transfer failed");
        } else {
            tokenBalances[withdrawal.token] -= withdrawal.amount;
            IERC20(withdrawal.token).transfer(withdrawal.recipient, withdrawal.amount);
        }

        emit MultiChainWithdrawalExecuted(
            withdrawalId,
            withdrawal.token,
            withdrawal.amount,
            withdrawal.recipient,
            block.timestamp
        );
    }

    // Chain Management

    function connectChain(uint256 chainId) external onlyOwner {
        require(chainId != 0, "Invalid chain ID");
        require(chainId != block.chainid, "Cannot connect to self");
        require(!isChainConnected[owner][chainId], "Chain already connected");

        isChainConnected[owner][chainId] = true;
        chainIds[owner].push(chainId);

        bool exists = false;
        for (uint256 i = 0; i < connectedChains.length; i++) {
            if (connectedChains[i] == chainId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            connectedChains.push(chainId);
        }

        emit ChainConnected(chainId, block.timestamp);
    }

    function disconnectChain(uint256 chainId) external onlyOwner {
        require(isChainConnected[owner][chainId], "Chain not connected");

        isChainConnected[owner][chainId] = false;

        // Remove from array
        uint256[] storage chains = chainIds[owner];
        for (uint256 i = 0; i < chains.length; i++) {
            if (chains[i] == chainId) {
                chains[i] = chains[chains.length - 1];
                chains.pop();
                break;
            }
        }

        emit ChainDisconnected(chainId, block.timestamp);
    }

    // Guardian Management

    function addGuardian(address guardian, uint256 guardianChainId) external onlyOwner {
        require(guardian != address(0), "Invalid guardian");
        require(!isGuardian[guardian], "Already guardian");

        isGuardian[guardian] = true;
        isActiveGuardian[guardian] = true;
        guardianChainId[guardian] = guardianChainId;
        guardians.push(guardian);

        emit GuardianAdded(guardian, guardianChainId, block.timestamp);
    }

    function removeGuardian(address guardian) external onlyOwner {
        require(isGuardian[guardian], "Not a guardian");

        isGuardian[guardian] = false;
        isActiveGuardian[guardian] = false;

        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }

        emit GuardianRemoved(guardian, block.timestamp);
    }

    function setRemoteGuardianWeight(uint256 newWeight) external onlyOwner {
        require(newWeight > 0, "Invalid weight");
        remoteGuardianWeight = newWeight;
        emit RemoteGuardianWeightUpdated(newWeight, block.timestamp);
    }

    // View Functions

    function getWithdrawal(uint256 withdrawalId) external view returns (MultiChainWithdrawal memory) {
        return multiChainWithdrawals[withdrawalId];
    }

    function getWithdrawalApprovals(uint256 withdrawalId) external view returns (GuardianApproval[] memory) {
        return withdrawalApprovals[withdrawalId];
    }

    function getWithdrawalApprovalCount(uint256 withdrawalId) external view returns (uint256) {
        return withdrawalApprovals[withdrawalId].length;
    }

    function getConnectedChains() external view returns (uint256[] memory) {
        return chainIds[owner];
    }

    function getGuardians() external view returns (address[] memory) {
        return guardians;
    }

    function getGuardianCount() external view returns (uint256) {
        return guardians.length;
    }

    function getETHBalance() external view returns (uint256) {
        return ethBalance;
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return tokenBalances[token];
    }

    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    function getProofService() external view returns (address) {
        return address(proofService);
    }

    // Internal Functions

    function _recoverSigner(bytes32 messageHash, bytes calldata signature) internal pure returns (address) {
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
