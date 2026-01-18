// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GuardianWeights.sol";

interface IGuardianSBT {
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title SpendVaultWithWeights
 * @notice Multi-signature vault with weighted guardian voting
 * @dev Guardians can have different voting weights instead of equal 1-to-1 votes
 */
contract SpendVaultWithWeights is Ownable, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;
    
    // ============ State Variables ============
    
    address public guardianToken;
    address public guardianWeights;
    uint256 public quorum; // Traditional count-based quorum (fallback)
    uint256 public nonce;
    bool public vaultEmergencyFrozen;
    
    // Weighted voting enabled flag
    bool public useWeightedVoting;
    
    // ============ Withdrawal Tracking ============
    
    struct WithdrawalMetadata {
        string category;
        bytes32 reasonHash;
        uint256 createdAt;
        uint256 signatureWeight; // Total weight of signatures
    }
    
    mapping(uint256 => WithdrawalMetadata) public withdrawalMetadatas;
    
    // Emergency unlock
    uint256 public emergencyUnlockRequestTime;
    
    // ============ Events ============
    
    event VaultCreated(
        address indexed owner,
        address indexed guardianToken,
        address indexed guardianWeights,
        uint256 quorum,
        bool useWeighted
    );
    
    event Withdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient,
        string reason,
        uint256 signatureWeight,
        uint256 requiredWeight
    );
    
    event WeightedSignatureCollected(
        address indexed guardian,
        uint256 weight,
        uint256 totalWeightSoFar,
        uint256 nonce
    );
    
    event WeightedQuorumMet(
        uint256 nonce,
        uint256 totalWeight,
        uint256 requiredWeight
    );
    
    event WeightedVotingToggled(bool enabled);
    
    event EmergencyUnlockRequested(uint256 requestTime);
    event EmergencyUnlockExecuted(address indexed token);
    event EmergencyUnlockCancelled();
    event VaultFrozen(address indexed by);
    event VaultUnfrozen(address indexed by);
    
    // ============ Type Hashes ============
    
    bytes32 private constant WITHDRAWAL_TYPEHASH = 
        keccak256("Withdrawal(address token,uint256 amount,address recipient,uint256 nonce,bytes32 reason,bytes32 category,uint256 createdAt)");
    
    // ============ Modifiers ============
    
    modifier onlyActiveGuardian() {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not a guardian");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _guardianToken,
        address _guardianWeights,
        uint256 _quorum,
        bool _useWeightedVoting
    ) EIP712("SpendGuard", "1") Ownable(msg.sender) {
        require(_guardianToken != address(0), "Invalid guardian token");
        require(_guardianWeights != address(0), "Invalid guardian weights");
        require(_quorum > 0, "Quorum must be positive");
        
        guardianToken = _guardianToken;
        guardianWeights = _guardianWeights;
        quorum = _quorum;
        useWeightedVoting = _useWeightedVoting;
        
        emit VaultCreated(msg.sender, _guardianToken, _guardianWeights, _quorum, _useWeightedVoting);
    }
    
    // ============ Funding Functions ============
    
    receive() external payable {}
    
    fallback() external payable {}
    
    function deposit(address token, uint256 amount) external {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be positive");
        
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(success, "Transfer failed");
    }
    
    // ============ Withdrawal Functions ============
    
    /**
     * @notice Execute a withdrawal with weighted guardian approval
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     * @param recipient Address to receive funds
     * @param reason Reason for withdrawal
     * @param isEmergency Whether this is an emergency withdrawal
     * @param signatures Guardian signatures
     */
    function withdrawWithWeights(
        address token,
        uint256 amount,
        address recipient,
        string memory reason,
        bool isEmergency,
        bytes[] memory signatures
    ) external nonReentrant {
        require(!vaultEmergencyFrozen, "Vault is frozen");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be positive");
        require(signatures.length > 0, "No signatures provided");
        
        bytes32 reasonHash = keccak256(bytes(reason));
        bytes32 structHash = keccak256(
            abi.encode(
                WITHDRAWAL_TYPEHASH,
                token,
                amount,
                recipient,
                nonce,
                reasonHash,
                keccak256(bytes(isEmergency ? "emergency" : "regular")),
                block.timestamp
            )
        );
        bytes32 hash = _hashTypedDataV4(structHash);
        
        // Verify signatures and calculate total weight
        address[] memory signers = new address[](signatures.length);
        uint256 validSignatures = 0;
        uint256 totalSignatureWeight = 0;
        
        GuardianWeights weightsContract = GuardianWeights(guardianWeights);
        
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = hash.recover(signatures[i]);
            require(IGuardianSBT(guardianToken).balanceOf(signer) > 0, "Invalid guardian");
            
            // Check for duplicates
            for (uint256 j = 0; j < validSignatures; j++) {
                require(signers[j] != signer, "Duplicate signature");
            }
            
            // Get guardian weight
            uint256 weight = weightsContract.getGuardianWeight(address(this), signer);
            require(weight > 0, "Guardian has no weight assigned");
            
            signers[validSignatures] = signer;
            validSignatures++;
            totalSignatureWeight += weight;
            
            emit WeightedSignatureCollected(signer, weight, totalSignatureWeight, nonce);
        }
        
        // Check quorum based on voting mode
        uint256 requiredWeight = _getRequiredWeight();
        
        if (useWeightedVoting) {
            require(totalSignatureWeight >= requiredWeight, "Weighted quorum not met");
        } else {
            require(validSignatures >= quorum, "Traditional quorum not met");
        }
        
        emit WeightedQuorumMet(nonce, totalSignatureWeight, requiredWeight);
        
        nonce++;
        
        // Record metadata
        withdrawalMetadatas[nonce - 1] = WithdrawalMetadata({
            category: isEmergency ? "emergency" : "regular",
            reasonHash: reasonHash,
            createdAt: block.timestamp,
            signatureWeight: totalSignatureWeight
        });
        
        // Execute transfer
        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            (bool success, ) = recipient.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            bool success = IERC20(token).transfer(recipient, amount);
            require(success, "Token transfer failed");
        }
        
        emit Withdrawal(token, amount, recipient, reason, totalSignatureWeight, requiredWeight);
    }
    
    // ============ Emergency Unlock Functions ============
    
    /**
     * @notice Request emergency unlock with 30-day timelock
     * @dev Only vault owner can request
     */
    function requestEmergencyUnlock() external onlyOwner {
        require(!vaultEmergencyFrozen, "Vault already frozen");
        emergencyUnlockRequestTime = block.timestamp;
        emit EmergencyUnlockRequested(block.timestamp);
    }
    
    /**
     * @notice Execute emergency unlock after 30-day delay
     * @param token Token to withdraw in emergency
     * @dev Only vault owner can execute
     */
    function executeEmergencyUnlock(address token) external onlyOwner nonReentrant {
        require(emergencyUnlockRequestTime > 0, "No emergency unlock requested");
        require(
            block.timestamp >= emergencyUnlockRequestTime + 30 days,
            "30-day timelock not elapsed"
        );
        
        uint256 balance = token == address(0)
            ? address(this).balance
            : IERC20(token).balanceOf(address(this));
        
        require(balance > 0, "No balance to withdraw");
        
        if (token == address(0)) {
            (bool success, ) = owner().call{value: balance}("");
            require(success, "ETH transfer failed");
        } else {
            bool success = IERC20(token).transfer(owner(), balance);
            require(success, "Token transfer failed");
        }
        
        emergencyUnlockRequestTime = 0;
        emit EmergencyUnlockExecuted(token);
    }
    
    /**
     * @notice Cancel pending emergency unlock
     * @dev Only vault owner can cancel
     */
    function cancelEmergencyUnlock() external onlyOwner {
        require(emergencyUnlockRequestTime > 0, "No unlock requested");
        emergencyUnlockRequestTime = 0;
        emit EmergencyUnlockCancelled();
    }
    
    /**
     * @notice Get remaining time until emergency unlock can be executed
     * @return Seconds remaining (0 if none pending or already elapsed)
     */
    function getEmergencyUnlockTimeRemaining() external view returns (uint256) {
        if (emergencyUnlockRequestTime == 0) return 0;
        
        uint256 unlockTime = emergencyUnlockRequestTime + 30 days;
        if (block.timestamp >= unlockTime) return 0;
        
        return unlockTime - block.timestamp;
    }
    
    // ============ Freeze Functions ============
    
    /**
     * @notice Freeze vault to prevent any withdrawals
     * @dev Only vault owner can freeze
     */
    function freezeVault() external onlyOwner {
        require(!vaultEmergencyFrozen, "Vault already frozen");
        vaultEmergencyFrozen = true;
        emit VaultFrozen(msg.sender);
    }
    
    /**
     * @notice Unfreeze vault to restore withdrawal functionality
     * @dev Only vault owner can unfreeze
     */
    function unfreezeVault() external onlyOwner {
        require(vaultEmergencyFrozen, "Vault not frozen");
        vaultEmergencyFrozen = false;
        emit VaultUnfrozen(msg.sender);
    }
    
    // ============ Configuration Functions ============
    
    /**
     * @notice Toggle between weighted and traditional voting
     * @param _useWeighted Enable weighted voting if true
     */
    function setWeightedVoting(bool _useWeighted) external onlyOwner {
        require(_useWeighted != useWeightedVoting, "Already in this mode");
        
        if (_useWeighted) {
            // Verify weighted voting is properly configured
            (
                uint256 totalWeight,
                uint256 threshold,
                uint256 guardianCount,
                bool isEnabled
            ) = GuardianWeights(guardianWeights).getVotingStats(address(this));
            
            require(isEnabled, "Weighted voting not enabled in GuardianWeights");
            require(guardianCount > 0, "No guardians with weights");
            require(threshold > 0, "Quorum threshold not set");
        }
        
        useWeightedVoting = _useWeighted;
        emit WeightedVotingToggled(_useWeighted);
    }
    
    function setQuorum(uint256 _newQuorum) external onlyOwner {
        require(_newQuorum > 0, "Quorum must be positive");
        quorum = _newQuorum;
    }
    
    function updateGuardianToken(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianToken = _newAddress;
    }
    
    function updateGuardianWeights(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        guardianWeights = _newAddress;
    }
    
    // ============ Information Functions ============
    
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
    
    /**
     * @notice Get the required weight/signature count for approval
     * @return required The required weight (if weighted) or count (if traditional)
     */
    function getRequiredApprovals() external view returns (uint256 required) {
        return _getRequiredWeight();
    }
    
    /**
     * @notice Get voting statistics
     * @return votingMode "weighted" or "traditional"
     * @return totalWeight Total guardian weight (if weighted)
     * @return requiredWeight Required weight/count
     * @return guardianCount Number of active guardians
     */
    function getVotingStats()
        external
        view
        returns (
            string memory votingMode,
            uint256 totalWeight,
            uint256 requiredWeight,
            uint256 guardianCount
        )
    {
        GuardianWeights weightsContract = GuardianWeights(guardianWeights);
        guardianCount = weightsContract.getWeightedGuardianCount(address(this));
        
        if (useWeightedVoting) {
            (totalWeight, requiredWeight, , ) = weightsContract.getVotingStats(address(this));
            votingMode = "weighted";
        } else {
            votingMode = "traditional";
            requiredWeight = quorum;
            totalWeight = guardianCount;
        }
    }
    
    /**
     * @notice Get withdrawal metadata by nonce
     * @param withdrawalNonce The nonce of the withdrawal
     * @return metadata The withdrawal metadata
     */
    function getWithdrawalMetadata(uint256 withdrawalNonce)
        external
        view
        returns (WithdrawalMetadata memory metadata)
    {
        return withdrawalMetadatas[withdrawalNonce];
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Get the required weight for approval
     * @return required The required weight (if weighted) or guardian count (if traditional)
     */
    function _getRequiredWeight() internal view returns (uint256 required) {
        if (useWeightedVoting) {
            (, uint256 threshold, , bool isEnabled) = 
                GuardianWeights(guardianWeights).getVotingStats(address(this));
            require(isEnabled, "Weighted voting not enabled");
            return threshold;
        } else {
            return quorum;
        }
    }
}
