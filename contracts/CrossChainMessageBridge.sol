// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CrossChainMessageBridge
 * @notice Abstract bridge interface for cross-chain message passing
 * @dev Supports multiple bridge implementations (Axelar, LayerZero, Wormhole, etc.)
 */

interface ICrossChainBridge {
    function sendMessage(
        uint256 destinationChain,
        address destinationAddress,
        bytes calldata payload
    ) external payable;

    function receiveMessage(
        uint256 sourceChain,
        address sourceAddress,
        bytes calldata payload
    ) external;

    function estimateFee(
        uint256 destinationChain,
        bytes calldata payload
    ) external view returns (uint256);
}

contract CrossChainMessageBridge is ICrossChainBridge {
    /// @notice Bridge message structure
    struct BridgeMessage {
        uint256 messageId;
        uint256 sourceChainId;
        uint256 destinationChainId;
        address sourceAddress;
        address destinationAddress;
        bytes payload;
        uint256 timestamp;
        MessageStatus status;
    }

    /// @notice Message status enum
    enum MessageStatus {
        PENDING,
        CONFIRMED,
        RECEIVED,
        EXECUTED,
        FAILED
    }

    /// @notice Bridge configuration
    struct BridgeConfiguration {
        address relayerAddress;
        uint256 baseFee;
        uint256 feePerByte;
        bool isActive;
    }

    // State variables
    mapping(uint256 => BridgeMessage) public messages;
    mapping(uint256 => mapping(address => bool)) public relayerConfirmations;

    mapping(uint256 => BridgeConfiguration) public bridgeConfigurations;
    uint256[] public supportedChains;

    uint256 public nextMessageId = 1;

    address public bridgeAdmin;

    // Events
    event MessageSent(
        uint256 indexed messageId,
        uint256 indexed sourceChainId,
        uint256 indexed destinationChainId,
        address sender,
        bytes payload
    );

    event MessageReceived(
        uint256 indexed messageId,
        uint256 indexed sourceChainId,
        address sourceAddress,
        bytes payload
    );

    event MessageConfirmed(
        uint256 indexed messageId,
        address indexed relayer
    );

    event MessageExecuted(
        uint256 indexed messageId
    );

    event BridgeConfigured(
        uint256 indexed chainId,
        address relayerAddress,
        uint256 baseFee,
        uint256 feePerByte
    );

    event RelayerUpdated(
        uint256 indexed chainId,
        address newRelayer
    );

    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == bridgeAdmin, "Only admin");
        _;
    }

    modifier validChain(uint256 chainId) {
        require(bridgeConfigurations[chainId].isActive, "Chain not supported");
        _;
    }

    // Constructor
    constructor() {
        bridgeAdmin = msg.sender;
    }

    // Bridge Configuration

    function configureBridge(
        uint256 chainId,
        address relayerAddress,
        uint256 baseFee,
        uint256 feePerByte
    ) external onlyAdmin {
        require(chainId != 0, "Invalid chain ID");
        require(relayerAddress != address(0), "Invalid relayer");

        BridgeConfiguration memory config = BridgeConfiguration({
            relayerAddress: relayerAddress,
            baseFee: baseFee,
            feePerByte: feePerByte,
            isActive: true
        });

        bridgeConfigurations[chainId] = config;

        // Track supported chains
        bool exists = false;
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == chainId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedChains.push(chainId);
        }

        emit BridgeConfigured(chainId, relayerAddress, baseFee, feePerByte);
    }

    function updateRelayer(uint256 chainId, address newRelayer) external onlyAdmin validChain(chainId) {
        require(newRelayer != address(0), "Invalid relayer");
        bridgeConfigurations[chainId].relayerAddress = newRelayer;
        emit RelayerUpdated(chainId, newRelayer);
    }

    function disableBridge(uint256 chainId) external onlyAdmin {
        bridgeConfigurations[chainId].isActive = false;
    }

    function enableBridge(uint256 chainId) external onlyAdmin {
        require(chainId != 0, "Invalid chain ID");
        bridgeConfigurations[chainId].isActive = true;
    }

    // Message Sending

    function sendMessage(
        uint256 destinationChain,
        address destinationAddress,
        bytes calldata payload
    ) external payable validChain(destinationChain) override {
        require(destinationAddress != address(0), "Invalid destination");
        require(payload.length > 0, "Empty payload");
        require(destinationChain != block.chainid, "Cannot send to same chain");

        uint256 requiredFee = estimateFee(destinationChain, payload);
        require(msg.value >= requiredFee, "Insufficient fee");

        uint256 messageId = nextMessageId++;

        BridgeMessage memory message = BridgeMessage({
            messageId: messageId,
            sourceChainId: block.chainid,
            destinationChainId: destinationChain,
            sourceAddress: msg.sender,
            destinationAddress: destinationAddress,
            payload: payload,
            timestamp: block.timestamp,
            status: MessageStatus.CONFIRMED
        });

        messages[messageId] = message;

        emit MessageSent(messageId, block.chainid, destinationChain, msg.sender, payload);
    }

    // Message Receiving

    function receiveMessage(
        uint256 sourceChain,
        address sourceAddress,
        bytes calldata payload
    ) external validChain(sourceChain) override {
        require(sourceAddress != address(0), "Invalid source");
        require(payload.length > 0, "Empty payload");

        BridgeConfiguration memory config = bridgeConfigurations[sourceChain];
        require(msg.sender == config.relayerAddress, "Unauthorized relayer");

        uint256 messageId = nextMessageId++;

        BridgeMessage memory message = BridgeMessage({
            messageId: messageId,
            sourceChainId: sourceChain,
            destinationChainId: block.chainid,
            sourceAddress: sourceAddress,
            destinationAddress: address(0),
            payload: payload,
            timestamp: block.timestamp,
            status: MessageStatus.RECEIVED
        });

        messages[messageId] = message;

        emit MessageReceived(messageId, sourceChain, sourceAddress, payload);
    }

    // Message Confirmation

    function confirmMessage(uint256 messageId) external {
        require(messages[messageId].timestamp > 0, "Message not found");
        require(!relayerConfirmations[messageId][msg.sender], "Already confirmed");

        BridgeMessage storage message = messages[messageId];
        uint256 sourceChain = message.sourceChainId;

        BridgeConfiguration memory config = bridgeConfigurations[sourceChain];
        require(msg.sender == config.relayerAddress, "Not authorized relayer");

        relayerConfirmations[messageId][msg.sender] = true;
        message.status = MessageStatus.CONFIRMED;

        emit MessageConfirmed(messageId, msg.sender);
    }

    // Message Execution

    function executeMessage(uint256 messageId) external {
        require(messages[messageId].timestamp > 0, "Message not found");

        BridgeMessage storage message = messages[messageId];
        require(message.status == MessageStatus.RECEIVED || message.status == MessageStatus.CONFIRMED, "Cannot execute");

        message.status = MessageStatus.EXECUTED;

        emit MessageExecuted(messageId);
    }

    // Fee Estimation

    function estimateFee(
        uint256 destinationChain,
        bytes calldata payload
    ) public view override validChain(destinationChain) returns (uint256) {
        BridgeConfiguration memory config = bridgeConfigurations[destinationChain];
        return config.baseFee + (payload.length * config.feePerByte);
    }

    // Query Functions

    function getMessage(uint256 messageId) external view returns (BridgeMessage memory) {
        return messages[messageId];
    }

    function getMessageStatus(uint256 messageId) external view returns (MessageStatus) {
        return messages[messageId].status;
    }

    function getBridgeConfig(uint256 chainId) external view returns (BridgeConfiguration memory) {
        return bridgeConfigurations[chainId];
    }

    function isBridgeActive(uint256 chainId) external view returns (bool) {
        return bridgeConfigurations[chainId].isActive;
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    function getRelayer(uint256 chainId) external view returns (address) {
        return bridgeConfigurations[chainId].relayerAddress;
    }

    // Fallback to receive ETH
    receive() external payable {}

    // Withdraw fees
    function withdrawFees(uint256 amount) external onlyAdmin {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = bridgeAdmin.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
}
