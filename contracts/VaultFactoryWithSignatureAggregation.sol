// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./SpendVaultWithSignatureAggregation.sol";
import "./SignatureAggregationService.sol";

/**
 * @title VaultFactoryWithSignatureAggregation
 * @notice Factory for creating vaults with signature aggregation
 * @dev Deploys and manages signature aggregation-enabled vaults
 */

contract VaultFactoryWithSignatureAggregation {
    using Clones for address;

    /// @notice Implementation contract for vaults
    address public vaultImplementation;

    /// @notice Signature aggregation service implementation
    address public aggregationServiceImplementation;

    /// @notice Factory owner
    address public factoryOwner;

    /// @notice All deployed vaults
    address[] public deployedVaults;

    /// @notice All deployed aggregation services
    address[] public deployedServices;

    /// @notice Vaults by owner
    mapping(address => address[]) public vaultsByOwner;

    /// @notice Services by vault
    mapping(address => address) public serviceByVault;

    /// @notice Vault deployment count
    uint256 public totalVaults;

    /// @notice Service deployment count
    uint256 public totalServices;

    // Events
    event VaultCreated(
        address indexed vaultAddress,
        address indexed serviceAddress,
        address indexed owner,
        address guardianToken,
        uint256 quorum,
        uint256 timestamp
    );

    event ServiceCreated(
        address indexed serviceAddress,
        address indexed owner,
        uint256 timestamp
    );

    event ImplementationUpdated(
        address indexed newVaultImpl,
        address indexed newServiceImpl,
        uint256 timestamp
    );

    // Constructor
    constructor() {
        factoryOwner = msg.sender;
        // Deploy initial implementations
        vaultImplementation = address(new SpendVaultWithSignatureAggregation(
            address(0),
            address(0),
            1
        ));
        aggregationServiceImplementation = address(new SignatureAggregationService());
    }

    // Vault Creation

    /// @notice Create new vault with aggregation service
    /// @param guardianToken Guardian SBT token address
    /// @param quorum Required signatures for withdrawal
    /// @param guardians Initial guardians
    function createVault(
        address guardianToken,
        uint256 quorum,
        address[] calldata guardians
    ) external returns (address vaultAddress, address serviceAddress) {
        require(guardianToken != address(0), "Invalid guardian token");
        require(quorum > 0 && quorum <= guardians.length, "Invalid quorum");

        // Deploy aggregation service
        serviceAddress = _deployService();

        // Deploy vault
        vaultAddress = _deployVault(guardianToken, serviceAddress, quorum);

        // Initialize vault guardians
        SpendVaultWithSignatureAggregation vault = SpendVaultWithSignatureAggregation(vaultAddress);

        for (uint256 i = 0; i < guardians.length; i++) {
            vault.addGuardian(guardians[i]);
        }

        // Track deployments
        deployedVaults.push(vaultAddress);
        deployedServices.push(serviceAddress);
        vaultsByOwner[msg.sender].push(vaultAddress);
        serviceByVault[vaultAddress] = serviceAddress;

        totalVaults++;
        totalServices++;

        emit VaultCreated(
            vaultAddress,
            serviceAddress,
            msg.sender,
            guardianToken,
            quorum,
            block.timestamp
        );
    }

    /// @notice Create vault without initial guardians
    function createEmptyVault(
        address guardianToken,
        uint256 quorum
    ) external returns (address vaultAddress, address serviceAddress) {
        require(guardianToken != address(0), "Invalid guardian token");
        require(quorum > 0, "Invalid quorum");

        // Deploy aggregation service
        serviceAddress = _deployService();

        // Deploy vault
        vaultAddress = _deployVault(guardianToken, serviceAddress, quorum);

        // Track deployments
        deployedVaults.push(vaultAddress);
        deployedServices.push(serviceAddress);
        vaultsByOwner[msg.sender].push(vaultAddress);
        serviceByVault[vaultAddress] = serviceAddress;

        totalVaults++;
        totalServices++;

        emit VaultCreated(
            vaultAddress,
            serviceAddress,
            msg.sender,
            guardianToken,
            quorum,
            block.timestamp
        );
    }

    // Internal Deployment

    /// @notice Deploy vault using clone
    function _deployVault(
        address guardianToken,
        address service,
        uint256 quorum
    ) internal returns (address) {
        address clone = vaultImplementation.clone();
        SpendVaultWithSignatureAggregation(clone).initialize(
            guardianToken,
            service,
            quorum
        );
        return clone;
    }

    /// @notice Deploy aggregation service using clone
    function _deployService() internal returns (address) {
        address clone = aggregationServiceImplementation.clone();
        // Service initializes itself in constructor, no additional setup needed
        return clone;
    }

    // Admin Functions

    /// @notice Update implementations
    function updateImplementations(
        address newVaultImpl,
        address newServiceImpl
    ) external {
        require(msg.sender == factoryOwner, "Only factory owner");
        require(newVaultImpl != address(0) && newServiceImpl != address(0), "Invalid implementations");

        vaultImplementation = newVaultImpl;
        aggregationServiceImplementation = newServiceImpl;

        emit ImplementationUpdated(newVaultImpl, newServiceImpl, block.timestamp);
    }

    // View Functions

    /// @notice Get vault count for owner
    function getVaultCountForOwner(address owner) external view returns (uint256) {
        return vaultsByOwner[owner].length;
    }

    /// @notice Get vaults for owner
    function getVaultsForOwner(address owner) external view returns (address[] memory) {
        return vaultsByOwner[owner];
    }

    /// @notice Get all deployed vaults
    function getAllVaults() external view returns (address[] memory) {
        return deployedVaults;
    }

    /// @notice Get all deployed services
    function getAllServices() external view returns (address[] memory) {
        return deployedServices;
    }

    /// @notice Get service for vault
    function getServiceForVault(address vault) external view returns (address) {
        return serviceByVault[vault];
    }

    /// @notice Get deployment stats
    function getDeploymentStats() external view returns (
        uint256 totalVaultCount,
        uint256 totalServiceCount,
        address vaultImpl,
        address serviceImpl
    ) {
        return (totalVaults, totalServices, vaultImplementation, aggregationServiceImplementation);
    }

    /// @notice Check if vault was deployed by this factory
    function isFactoryVault(address vault) external view returns (bool) {
        for (uint256 i = 0; i < deployedVaults.length; i++) {
            if (deployedVaults[i] == vault) {
                return true;
            }
        }
        return false;
    }

    /// @notice Check if service was deployed by this factory
    function isFactoryService(address service) external view returns (bool) {
        for (uint256 i = 0; i < deployedServices.length; i++) {
            if (deployedServices[i] == service) {
                return true;
            }
        }
        return false;
    }
}
