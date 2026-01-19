// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./MultiChainVault.sol";
import "./CrossChainGuardianProofService.sol";
import "./CrossChainMessageBridge.sol";

/**
 * @title MultiChainVaultFactory
 * @notice Factory for deploying multi-chain vaults with cross-chain guardian validation
 * @dev Manages vault deployment, bridge configuration, and cross-chain coordination
 */

contract MultiChainVaultFactory {
    using Clones for address;

    /// @notice Multi-chain vault deployment info
    struct MultiChainVaultInfo {
        address vaultAddress;
        address owner;
        uint256 quorum;
        uint256 remoteGuardianWeight;
        uint256[] connectedChains;
        uint256 deploymentTimestamp;
    }

    // State variables
    address public vaultImplementation;
    address public proofService;
    address public messageBridge;

    address public factoryOwner;

    address[] public deployedVaults;
    mapping(address => MultiChainVaultInfo) public vaultInfo;
    mapping(address => address[]) public vaultsByOwner;

    uint256 public totalVaults;

    // Bridge chain tracking
    mapping(uint256 => bool) public isBridgeChain;
    uint256[] public bridgeChains;

    // Events
    event MultiChainVaultCreated(
        address indexed vaultAddress,
        address indexed owner,
        uint256 quorum,
        uint256 remoteGuardianWeight,
        uint256 timestamp
    );

    event ProofServiceUpdated(
        address indexed newService,
        uint256 timestamp
    );

    event BridgeUpdated(
        address indexed newBridge,
        uint256 timestamp
    );

    event ChainRegisteredForBridge(
        uint256 indexed chainId,
        uint256 timestamp
    );

    event ChainUnregisteredFromBridge(
        uint256 indexed chainId,
        uint256 timestamp
    );

    // Constructor
    constructor(
        address _proofService,
        address _messageBridge
    ) {
        require(_proofService != address(0), "Invalid proof service");
        require(_messageBridge != address(0), "Invalid bridge");

        factoryOwner = msg.sender;
        proofService = _proofService;
        messageBridge = _messageBridge;

        // Deploy vault implementation
        vaultImplementation = address(new MultiChainVault(
            address(0),
            _proofService,
            1,
            1
        ));
    }

    // Vault Deployment

    function createMultiChainVault(
        address owner,
        uint256 quorum,
        uint256 remoteGuardianWeight,
        uint256[] calldata initialChains
    ) external returns (address vaultAddress) {
        require(owner != address(0), "Invalid owner");
        require(quorum > 0, "Invalid quorum");
        require(remoteGuardianWeight > 0, "Invalid weight");

        // Deploy vault via clone
        vaultAddress = vaultImplementation.clone();

        // Initialize vault
        MultiChainVault vault = MultiChainVault(vaultAddress);

        // Store vault info
        MultiChainVaultInfo memory info = MultiChainVaultInfo({
            vaultAddress: vaultAddress,
            owner: owner,
            quorum: quorum,
            remoteGuardianWeight: remoteGuardianWeight,
            connectedChains: initialChains,
            deploymentTimestamp: block.timestamp
        });

        vaultInfo[vaultAddress] = info;
        deployedVaults.push(vaultAddress);
        vaultsByOwner[owner].push(vaultAddress);

        totalVaults++;

        // Connect initial chains
        for (uint256 i = 0; i < initialChains.length; i++) {
            vault.connectChain(initialChains[i]);
        }

        emit MultiChainVaultCreated(
            vaultAddress,
            owner,
            quorum,
            remoteGuardianWeight,
            block.timestamp
        );

        return vaultAddress;
    }

    function createMultiChainVaultWithGuardians(
        address owner,
        uint256 quorum,
        uint256 remoteGuardianWeight,
        uint256[] calldata initialChains,
        address[] calldata initialGuardians,
        uint256[] calldata guardianChains
    ) external returns (address vaultAddress) {
        require(initialGuardians.length == guardianChains.length, "Guardian/chain mismatch");

        vaultAddress = createMultiChainVault(owner, quorum, remoteGuardianWeight, initialChains);

        MultiChainVault vault = MultiChainVault(vaultAddress);

        // Add initial guardians
        for (uint256 i = 0; i < initialGuardians.length; i++) {
            vault.addGuardian(initialGuardians[i], guardianChains[i]);
        }

        return vaultAddress;
    }

    // Bridge Configuration

    function registerChainForBridge(
        uint256 chainId,
        address relayerAddress,
        uint256 baseFee,
        uint256 feePerByte
    ) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(chainId != 0, "Invalid chain ID");
        require(relayerAddress != address(0), "Invalid relayer");

        CrossChainMessageBridge bridge = CrossChainMessageBridge(messageBridge);
        bridge.configureBridge(chainId, relayerAddress, baseFee, feePerByte);

        if (!isBridgeChain[chainId]) {
            isBridgeChain[chainId] = true;
            bridgeChains.push(chainId);
        }

        emit ChainRegisteredForBridge(chainId, block.timestamp);
    }

    function registerGuardianProofChain(
        uint256 chainId,
        uint256 requiredConfirmations,
        uint256 messageTimeout,
        address[] calldata relayers
    ) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(chainId != 0, "Invalid chain ID");

        CrossChainGuardianProofService service = CrossChainGuardianProofService(proofService);
        service.configureBridge(chainId, requiredConfirmations, messageTimeout, relayers);
    }

    // Service Updates

    function updateProofService(address newService) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(newService != address(0), "Invalid service");

        proofService = newService;
        emit ProofServiceUpdated(newService, block.timestamp);
    }

    function updateMessageBridge(address newBridge) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(newBridge != address(0), "Invalid bridge");

        messageBridge = newBridge;
        emit BridgeUpdated(newBridge, block.timestamp);
    }

    // Query Functions

    function getVaultCount() external view returns (uint256) {
        return deployedVaults.length;
    }

    function getVaultAtIndex(uint256 index) external view returns (address) {
        require(index < deployedVaults.length, "Index out of bounds");
        return deployedVaults[index];
    }

    function getVaultsByOwner(address owner) external view returns (address[] memory) {
        return vaultsByOwner[owner];
    }

    function getVaultCountForOwner(address owner) external view returns (uint256) {
        return vaultsByOwner[owner].length;
    }

    function getVaultInfo(address vault) external view returns (MultiChainVaultInfo memory) {
        return vaultInfo[vault];
    }

    function isFactoryVault(address vault) external view returns (bool) {
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            if (deployedVaults[i] == vault) {
                return true;
            }
        }
        return false;
    }

    function getBridgeChains() external view returns (uint256[] memory) {
        return bridgeChains;
    }

    function getRegisteredChainCount() external view returns (uint256) {
        return bridgeChains.length;
    }

    function isBridgeConfigured(uint256 chainId) external view returns (bool) {
        return isBridgeChain[chainId];
    }

    function getFactoryStats() external view returns (
        uint256 totalVaultsCreated,
        uint256 totalChainsRegistered,
        address proofServiceAddress,
        address messageBridgeAddress
    ) {
        return (totalVaults, bridgeChains.length, proofService, messageBridge);
    }

    function getDeployedVaults() external view returns (address[] memory) {
        return deployedVaults;
    }

    // Admin Functions

    function transferFactoryOwnership(address newOwner) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(newOwner != address(0), "Invalid new owner");
        factoryOwner = newOwner;
    }
}
