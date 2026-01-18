// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianWeights
 * @notice Manages weighted voting for guardians
 * @dev Each guardian can have a different weight (voting power)
 */
contract GuardianWeights is Ownable {
    
    // ============ Structs ============
    
    /**
     * @dev Guardian weight information
     * @param weight The voting weight of the guardian
     * @param lastUpdated Timestamp when weight was last updated
     * @param isActive Whether the guardian is active with a weight
     */
    struct GuardianWeightInfo {
        uint256 weight;
        uint256 lastUpdated;
        bool isActive;
    }
    
    // ============ State Variables ============
    
    // Vault address => Guardian address => GuardianWeightInfo
    mapping(address => mapping(address => GuardianWeightInfo)) public guardianWeights;
    
    // Vault address => Total weight available
    mapping(address => uint256) public totalWeightPerVault;
    
    // Vault address => Weighted quorum threshold
    mapping(address => uint256) public weightedQuorumThreshold;
    
    // Vault address => Array of weighted guardians
    mapping(address => address[]) public weightedGuardians;
    
    // Vault address => Guardian address => index in array
    mapping(address => mapping(address => uint256)) private guardianIndex;
    
    // Vault address => Enable weighted voting
    mapping(address => bool) public isWeightedVotingEnabled;
    
    // ============ Events ============
    
    event WeightAssigned(
        address indexed vault,
        address indexed guardian,
        uint256 weight,
        uint256 totalVaultWeight
    );
    
    event WeightRemoved(
        address indexed vault,
        address indexed guardian,
        uint256 previousWeight
    );
    
    event QuorumThresholdSet(
        address indexed vault,
        uint256 threshold,
        bool enabled
    );
    
    event WeightedVotingEnabled(address indexed vault);
    event WeightedVotingDisabled(address indexed vault);
    
    event GuardianWeightActivated(
        address indexed vault,
        address indexed guardian,
        uint256 weight
    );
    
    event GuardianWeightDeactivated(
        address indexed vault,
        address indexed guardian
    );
    
    // ============ Modifiers ============
    
    modifier onlyVaultOwner(address vault) {
        require(Ownable(vault).owner() == msg.sender, "Only vault owner");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}
    
    // ============ Weight Assignment Functions ============
    
    /**
     * @notice Assign a weight to a guardian for a vault
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     * @param weight The voting weight to assign (must be > 0)
     */
    function setGuardianWeight(
        address vault,
        address guardian,
        uint256 weight
    ) external onlyVaultOwner(vault) {
        require(guardian != address(0), "Invalid guardian address");
        require(weight > 0, "Weight must be positive");
        
        GuardianWeightInfo storage info = guardianWeights[vault][guardian];
        
        // If guardian already has weight, remove old weight from total
        if (info.isActive) {
            totalWeightPerVault[vault] -= info.weight;
        } else {
            // New guardian, add to list
            _addToWeightedGuardians(vault, guardian);
        }
        
        // Update weight and total
        info.weight = weight;
        info.lastUpdated = block.timestamp;
        info.isActive = true;
        totalWeightPerVault[vault] += weight;
        
        emit WeightAssigned(vault, guardian, weight, totalWeightPerVault[vault]);
    }
    
    /**
     * @notice Remove weight from a guardian
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     */
    function removeGuardianWeight(
        address vault,
        address guardian
    ) external onlyVaultOwner(vault) {
        GuardianWeightInfo storage info = guardianWeights[vault][guardian];
        require(info.isActive, "Guardian has no weight assigned");
        
        uint256 previousWeight = info.weight;
        totalWeightPerVault[vault] -= previousWeight;
        
        _removeFromWeightedGuardians(vault, guardian);
        
        info.weight = 0;
        info.isActive = false;
        info.lastUpdated = block.timestamp;
        
        emit WeightRemoved(vault, guardian, previousWeight);
    }
    
    /**
     * @notice Set weighted quorum threshold for a vault
     * @param vault Address of the vault
     * @param threshold Minimum weight sum required (usually totalWeight/2 + 1 for majority)
     */
    function setWeightedQuorum(
        address vault,
        uint256 threshold
    ) external onlyVaultOwner(vault) {
        require(threshold > 0, "Threshold must be positive");
        require(threshold <= totalWeightPerVault[vault], "Threshold exceeds total weight");
        
        weightedQuorumThreshold[vault] = threshold;
        
        emit QuorumThresholdSet(vault, threshold, isWeightedVotingEnabled[vault]);
    }
    
    /**
     * @notice Enable weighted voting for a vault
     * @param vault Address of the vault
     */
    function enableWeightedVoting(address vault) external onlyVaultOwner(vault) {
        require(!isWeightedVotingEnabled[vault], "Already enabled");
        require(totalWeightPerVault[vault] > 0, "No guardians with weights");
        require(weightedQuorumThreshold[vault] > 0, "Quorum threshold not set");
        
        isWeightedVotingEnabled[vault] = true;
        
        emit WeightedVotingEnabled(vault);
    }
    
    /**
     * @notice Disable weighted voting for a vault (fallback to count-based)
     * @param vault Address of the vault
     */
    function disableWeightedVoting(address vault) external onlyVaultOwner(vault) {
        require(isWeightedVotingEnabled[vault], "Already disabled");
        
        isWeightedVotingEnabled[vault] = false;
        
        emit WeightedVotingDisabled(vault);
    }
    
    // ============ Query Functions ============
    
    /**
     * @notice Get the weight of a guardian for a vault
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     * @return weight The voting weight
     */
    function getGuardianWeight(address vault, address guardian) 
        external 
        view 
        returns (uint256) 
    {
        return guardianWeights[vault][guardian].weight;
    }
    
    /**
     * @notice Get complete weight information for a guardian
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     * @return info The weight information
     */
    function getGuardianWeightInfo(address vault, address guardian)
        external
        view
        returns (GuardianWeightInfo memory info)
    {
        return guardianWeights[vault][guardian];
    }
    
    /**
     * @notice Get all guardians with weights for a vault
     * @param vault Address of the vault
     * @return guardians Array of guardian addresses
     */
    function getWeightedGuardians(address vault)
        external
        view
        returns (address[] memory guardians)
    {
        return weightedGuardians[vault];
    }
    
    /**
     * @notice Get count of guardians with weights for a vault
     * @param vault Address of the vault
     * @return count Number of weighted guardians
     */
    function getWeightedGuardianCount(address vault) external view returns (uint256) {
        return weightedGuardians[vault].length;
    }
    
    /**
     * @notice Calculate total voting weight from array of guardians
     * @param vault Address of the vault
     * @param guardians Array of guardian addresses
     * @return totalWeight Sum of all weights
     */
    function calculateTotalWeight(address vault, address[] memory guardians)
        external
        view
        returns (uint256 totalWeight)
    {
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardianWeights[vault][guardians[i]].isActive) {
                totalWeight += guardianWeights[vault][guardians[i]].weight;
            }
        }
        return totalWeight;
    }
    
    /**
     * @notice Check if weighted quorum is met
     * @param vault Address of the vault
     * @param signingWeight Total weight from signers
     * @return true if quorum is met
     */
    function isWeightedQuorumMet(address vault, uint256 signingWeight)
        external
        view
        returns (bool)
    {
        if (!isWeightedVotingEnabled[vault]) return false;
        return signingWeight >= weightedQuorumThreshold[vault];
    }
    
    /**
     * @notice Get the percentage of total weight from signers
     * @param vault Address of the vault
     * @param signingWeight Total weight from signers
     * @return percentage The percentage (0-100)
     */
    function getWeightPercentage(address vault, uint256 signingWeight)
        external
        view
        returns (uint256 percentage)
    {
        uint256 total = totalWeightPerVault[vault];
        if (total == 0) return 0;
        return (signingWeight * 100) / total;
    }
    
    /**
     * @notice Get voting statistics for a vault
     * @param vault Address of the vault
     * @return totalWeight Total weight of all guardians
     * @return quorumThreshold Required weight threshold
     * @return guardianCount Number of weighted guardians
     * @return isEnabled Whether weighted voting is enabled
     */
    function getVotingStats(address vault)
        external
        view
        returns (
            uint256 totalWeight,
            uint256 quorumThreshold,
            uint256 guardianCount,
            bool isEnabled
        )
    {
        return (
            totalWeightPerVault[vault],
            weightedQuorumThreshold[vault],
            weightedGuardians[vault].length,
            isWeightedVotingEnabled[vault]
        );
    }
    
    // ============ Advanced Scenarios ============
    
    /**
     * @notice Check if a single guardian has sufficient weight to pass alone
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     * @return true if guardian weight >= threshold
     */
    function canGuardianPassAlone(address vault, address guardian)
        external
        view
        returns (bool)
    {
        uint256 weight = guardianWeights[vault][guardian].weight;
        return weight > 0 && weight >= weightedQuorumThreshold[vault];
    }
    
    /**
     * @notice Get minimum number of guardians needed to meet quorum
     * Assumes guardians are used in descending weight order
     * @param vault Address of the vault
     * @return count Minimum guardian count
     */
    function getMinGuardiansForQuorum(address vault)
        external
        view
        returns (uint256 count)
    {
        address[] memory guardians = weightedGuardians[vault];
        uint256 threshold = weightedQuorumThreshold[vault];
        uint256 currentWeight = 0;
        
        // Simple linear search - in production use sorting for efficiency
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardianWeights[vault][guardians[i]].isActive) {
                currentWeight += guardianWeights[vault][guardians[i]].weight;
                count++;
                if (currentWeight >= threshold) {
                    return count;
                }
            }
        }
        
        return guardians.length;
    }
    
    /**
     * @notice Get weight distribution for a vault
     * @param vault Address of the vault
     * @return guardians Array of guardian addresses
     * @return weights Array of corresponding weights
     */
    function getWeightDistribution(address vault)
        external
        view
        returns (address[] memory guardians, uint256[] memory weights)
    {
        guardians = weightedGuardians[vault];
        weights = new uint256[](guardians.length);
        
        for (uint256 i = 0; i < guardians.length; i++) {
            weights[i] = guardianWeights[vault][guardians[i]].weight;
        }
        
        return (guardians, weights);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Add a guardian to the weighted guardians list
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     */
    function _addToWeightedGuardians(address vault, address guardian) internal {
        address[] storage guardians = weightedGuardians[vault];
        
        // Check if already in list
        bool alreadyExists = false;
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                alreadyExists = true;
                break;
            }
        }
        
        if (!alreadyExists) {
            guardianIndex[vault][guardian] = guardians.length;
            guardians.push(guardian);
            emit GuardianWeightActivated(vault, guardian, guardianWeights[vault][guardian].weight);
        }
    }
    
    /**
     * @notice Remove a guardian from the weighted guardians list
     * @param vault Address of the vault
     * @param guardian Address of the guardian
     */
    function _removeFromWeightedGuardians(address vault, address guardian) internal {
        address[] storage guardians = weightedGuardians[vault];
        
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                // Swap with last element and pop
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                
                // Update index for swapped element
                if (i < guardians.length) {
                    guardianIndex[vault][guardians[i]] = i;
                }
                
                emit GuardianWeightDeactivated(vault, guardian);
                break;
            }
        }
    }
    
    /**
     * @notice Get role string for weight display
     * @param weight The weight to categorize
     * @param totalWeight Total weight in vault
     * @return description Human-readable weight category
     */
    function getWeightCategory(uint256 weight, uint256 totalWeight)
        external
        pure
        returns (string memory description)
    {
        if (weight == 0) return "None";
        
        uint256 percentage = (weight * 100) / totalWeight;
        
        if (percentage >= 50) return "Majority";
        if (percentage >= 33) return "Strong";
        if (percentage >= 10) return "Moderate";
        return "Light";
    }
}
