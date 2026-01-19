// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuardianEmergencyOverride
 * @dev Manages special emergency guardian set that only activates during emergency unlock mode
 * 
 * Emergency Guardians provide an alternative approval pathway when the vault enters emergency unlock mode.
 * Instead of waiting 30 days for the timelock to expire, emergency guardians can immediately approve
 * the emergency withdrawal if quorum is reached.
 * 
 * This creates a trusted inner circle that can bypass normal emergency procedures in true emergencies.
 * Emergency guardians are separate from regular guardians and must be explicitly designated.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

contract GuardianEmergencyOverride is Ownable {
    // ==================== State ====================
    
    /// @dev Emergency guardians per vault
    mapping(address vault => mapping(address guardian => bool)) public isEmergencyGuardian;
    
    /// @dev List of emergency guardians per vault for enumeration
    mapping(address vault => address[]) public emergencyGuardians;
    
    /// @dev Emergency override quorum requirements per vault (how many emergency guardians needed)
    mapping(address vault => uint256) public emergencyQuorumRequirement;
    
    /// @dev Track emergency approvals per vault per emergency unlock (mapping: vault -> emergencyId -> guardian -> hasApproved)
    mapping(address vault => mapping(uint256 emergencyId => mapping(address guardian => bool))) public hasApprovedEmergency;
    
    /// @dev Track approval counts per emergency unlock
    mapping(address vault => mapping(uint256 emergencyId => uint256)) public emergencyApprovalCount;
    
    /// @dev Emergency unlock activation timestamp per vault
    mapping(address vault => uint256) public emergencyActivationTime;
    
    /// @dev Whether emergency unlock has been approved by emergency guardians
    mapping(address vault => mapping(uint256 emergencyId => bool)) public emergencyApprovalStatus;
    
    /// @dev Counter for emergency unlock attempts per vault
    mapping(address vault => uint256) public emergencyIdCounter;

    // ==================== Events ====================
    
    event EmergencyGuardianAdded(address indexed vault, address indexed guardian, uint256 timestamp);
    event EmergencyGuardianRemoved(address indexed vault, address indexed guardian, uint256 timestamp);
    event EmergencyQuorumSet(address indexed vault, uint256 newQuorum, uint256 timestamp);
    event EmergencyApprovalReceived(address indexed vault, uint256 indexed emergencyId, address indexed guardian, uint256 approvalCount, uint256 timestamp);
    event EmergencyApprovalQuorumReached(address indexed vault, uint256 indexed emergencyId, uint256 approvalCount, uint256 timestamp);
    event EmergencyOverrideActivated(address indexed vault, uint256 indexed emergencyId, uint256 activationTime, uint256 timestamp);
    event EmergencyOverrideCancelled(address indexed vault, uint256 indexed emergencyId, string reason, uint256 timestamp);
    event EmergencyApprovalReset(address indexed vault, uint256 indexed emergencyId, uint256 timestamp);

    // ==================== Guardian Management ====================
    
    /**
     * @dev Add an emergency guardian to a vault
     * @param vault The vault address
     * @param guardian The address to add as emergency guardian
     */
    function addEmergencyGuardian(address vault, address guardian) external onlyOwner {
        require(vault != address(0), "Invalid vault address");
        require(guardian != address(0), "Invalid guardian address");
        require(!isEmergencyGuardian[vault][guardian], "Already an emergency guardian");

        isEmergencyGuardian[vault][guardian] = true;
        emergencyGuardians[vault].push(guardian);

        emit EmergencyGuardianAdded(vault, guardian, block.timestamp);
    }

    /**
     * @dev Remove an emergency guardian from a vault
     * @param vault The vault address
     * @param guardian The address to remove
     */
    function removeEmergencyGuardian(address vault, address guardian) external onlyOwner {
        require(isEmergencyGuardian[vault][guardian], "Not an emergency guardian");

        isEmergencyGuardian[vault][guardian] = false;

        // Remove from array
        address[] storage guardians = emergencyGuardians[vault];
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }

        emit EmergencyGuardianRemoved(vault, guardian, block.timestamp);
    }

    /**
     * @dev Set the emergency quorum requirement for a vault
     * @param vault The vault address
     * @param quorum How many emergency guardian approvals are needed
     */
    function setEmergencyQuorum(address vault, uint256 quorum) external onlyOwner {
        require(vault != address(0), "Invalid vault address");
        require(quorum > 0, "Quorum must be at least 1");
        require(quorum <= emergencyGuardians[vault].length, "Quorum cannot exceed emergency guardian count");

        emergencyQuorumRequirement[vault] = quorum;

        emit EmergencyQuorumSet(vault, quorum, block.timestamp);
    }

    // ==================== Emergency Approval ====================
    
    /**
     * @dev Approve an emergency unlock (called by emergency guardian)
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     * @return hasReachedQuorum Whether the approval reached quorum
     */
    function approveEmergencyUnlock(address vault, uint256 emergencyId) external returns (bool) {
        require(isEmergencyGuardian[vault][msg.sender], "Not an emergency guardian");
        require(!hasApprovedEmergency[vault][emergencyId][msg.sender], "Already approved this emergency");
        require(emergencyIdCounter[vault] == emergencyId || emergencyIdCounter[vault] > emergencyId, "Invalid emergency ID");

        hasApprovedEmergency[vault][emergencyId][msg.sender] = true;
        emergencyApprovalCount[vault][emergencyId]++;

        uint256 currentApprovals = emergencyApprovalCount[vault][emergencyId];
        uint256 requiredQuorum = emergencyQuorumRequirement[vault];

        emit EmergencyApprovalReceived(vault, emergencyId, msg.sender, currentApprovals, block.timestamp);

        // Check if quorum reached
        if (currentApprovals >= requiredQuorum && !emergencyApprovalStatus[vault][emergencyId]) {
            emergencyApprovalStatus[vault][emergencyId] = true;
            emit EmergencyApprovalQuorumReached(vault, emergencyId, currentApprovals, block.timestamp);
            return true;
        }

        return false;
    }

    /**
     * @dev Cancel an emergency override (reset approvals)
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     * @param reason Reason for cancellation
     */
    function cancelEmergencyOverride(address vault, uint256 emergencyId, string calldata reason) external onlyOwner {
        require(!emergencyApprovalStatus[vault][emergencyId] || emergencyIdCounter[vault] > emergencyId, "Cannot cancel active approval");

        // Reset approval tracking for this emergency
        emergencyApprovalCount[vault][emergencyId] = 0;
        emergencyApprovalStatus[vault][emergencyId] = false;

        emit EmergencyOverrideCancelled(vault, emergencyId, reason, block.timestamp);
        emit EmergencyApprovalReset(vault, emergencyId, block.timestamp);
    }

    /**
     * @dev Activate a new emergency override (called when vault enters emergency mode)
     * @param vault The vault address
     */
    function activateEmergencyOverride(address vault) external returns (uint256) {
        require(vault != address(0), "Invalid vault address");

        uint256 newEmergencyId = emergencyIdCounter[vault];
        emergencyIdCounter[vault]++;
        emergencyActivationTime[vault] = block.timestamp;

        emit EmergencyOverrideActivated(vault, newEmergencyId, block.timestamp, block.timestamp);

        return newEmergencyId;
    }

    // ==================== Status & Views ====================
    
    /**
     * @dev Check if emergency override has been approved (reached quorum)
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     */
    function isEmergencyApproved(address vault, uint256 emergencyId) external view returns (bool) {
        return emergencyApprovalStatus[vault][emergencyId];
    }

    /**
     * @dev Get the number of approvals received for an emergency
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     */
    function getEmergencyApprovalCount(address vault, uint256 emergencyId) external view returns (uint256) {
        return emergencyApprovalCount[vault][emergencyId];
    }

    /**
     * @dev Get the required quorum for a vault
     * @param vault The vault address
     */
    function getEmergencyQuorum(address vault) external view returns (uint256) {
        return emergencyQuorumRequirement[vault];
    }

    /**
     * @dev Get remaining approvals needed for quorum
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     */
    function getApprovalsNeeded(address vault, uint256 emergencyId) external view returns (uint256) {
        uint256 required = emergencyQuorumRequirement[vault];
        uint256 current = emergencyApprovalCount[vault][emergencyId];
        
        if (current >= required) {
            return 0;
        }
        
        return required - current;
    }

    /**
     * @dev Check if a specific guardian has approved an emergency
     * @param vault The vault address
     * @param emergencyId The emergency unlock ID
     * @param guardian The guardian address to check
     */
    function hasGuardianApproved(address vault, uint256 emergencyId, address guardian) external view returns (bool) {
        return hasApprovedEmergency[vault][emergencyId][guardian];
    }

    /**
     * @dev Get all emergency guardians for a vault
     * @param vault The vault address
     */
    function getEmergencyGuardians(address vault) external view returns (address[] memory) {
        return emergencyGuardians[vault];
    }

    /**
     * @dev Get the count of emergency guardians for a vault
     * @param vault The vault address
     */
    function getEmergencyGuardianCount(address vault) external view returns (uint256) {
        return emergencyGuardians[vault].length;
    }

    /**
     * @dev Get current emergency ID for a vault
     * @param vault The vault address
     */
    function getCurrentEmergencyId(address vault) external view returns (uint256) {
        return emergencyIdCounter[vault];
    }

    /**
     * @dev Get emergency activation time for a vault
     * @param vault The vault address
     */
    function getEmergencyActivationTime(address vault) external view returns (uint256) {
        return emergencyActivationTime[vault];
    }

    /**
     * @dev Get time elapsed since emergency activation
     * @param vault The vault address
     */
    function getEmergencyElapsedTime(address vault) external view returns (uint256) {
        uint256 activationTime = emergencyActivationTime[vault];
        if (activationTime == 0) {
            return 0;
        }
        
        return block.timestamp - activationTime;
    }
}
