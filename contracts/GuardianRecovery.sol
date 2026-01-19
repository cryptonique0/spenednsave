// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GuardianRecovery
 * @notice Manages guardian recovery through quorum-based voting to remove guardians
 * @dev Allows active guardians to vote out guardians who have lost access
 */
contract GuardianRecovery is Ownable {
    // Recovery proposal structure
    struct RecoveryProposal {
        address targetGuardian;
        address vault;
        uint256 votesRequired;
        uint256 votesReceived;
        uint256 proposedAt;
        bool executed;
        bool cancelled;
        mapping(address => bool) hasVoted; // guardian => has voted
        address[] voters; // list of guardians who voted
    }

    // Proposal ID counter
    uint256 public proposalCounter;

    // proposalId => RecoveryProposal
    mapping(uint256 => RecoveryProposal) public proposals;

    // Vault => array of active proposal IDs
    mapping(address => uint256[]) public vaultProposals;

    // Guardian => array of proposal IDs where they are the target
    mapping(address => uint256[]) public guardianTargetProposals;

    // Recovery voting period (default: 3 days)
    uint256 public votingPeriod = 3 days;

    // Events
    event RecoveryProposed(
        uint256 indexed proposalId,
        address indexed targetGuardian,
        address indexed vault,
        uint256 votesRequired
    );

    event RecoveryVoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        uint256 currentVotes,
        uint256 votesRequired
    );

    event RecoveryExecuted(
        uint256 indexed proposalId,
        address indexed targetGuardian,
        address indexed vault
    );

    event RecoveryCancelled(
        uint256 indexed proposalId,
        string reason
    );

    event VotingPeriodUpdated(uint256 newPeriod);

    /**
     * @notice Propose removing a guardian via recovery vote
     * @param targetGuardian Guardian to be removed
     * @param vault Vault address
     * @param votesRequired Number of votes needed to execute (typically quorum)
     * @return proposalId ID of the new proposal
     */
    function proposeRecovery(
        address targetGuardian,
        address vault,
        uint256 votesRequired
    ) external onlyOwner returns (uint256) {
        require(targetGuardian != address(0), "Invalid target guardian");
        require(vault != address(0), "Invalid vault");
        require(votesRequired > 0, "Votes required must be positive");

        uint256 proposalId = proposalCounter++;
        RecoveryProposal storage proposal = proposals[proposalId];

        proposal.targetGuardian = targetGuardian;
        proposal.vault = vault;
        proposal.votesRequired = votesRequired;
        proposal.votesReceived = 0;
        proposal.proposedAt = block.timestamp;
        proposal.executed = false;
        proposal.cancelled = false;

        vaultProposals[vault].push(proposalId);
        guardianTargetProposals[targetGuardian].push(proposalId);

        emit RecoveryProposed(proposalId, targetGuardian, vault, votesRequired);

        return proposalId;
    }

    /**
     * @notice Cast a vote on a recovery proposal
     * @param proposalId ID of the proposal
     * @param voter Address voting (must be an active guardian)
     * @return executed True if proposal reached quorum and executed
     */
    function voteOnRecovery(uint256 proposalId, address voter) external onlyOwner returns (bool) {
        RecoveryProposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Proposal already executed");
        require(!proposal.cancelled, "Proposal cancelled");
        require(!proposal.hasVoted[voter], "Guardian already voted");
        require(block.timestamp < proposal.proposedAt + votingPeriod, "Voting period expired");
        require(voter != proposal.targetGuardian, "Target cannot vote on own removal");

        proposal.hasVoted[voter] = true;
        proposal.voters.push(voter);
        proposal.votesReceived++;

        emit RecoveryVoteCast(proposalId, voter, proposal.votesReceived, proposal.votesRequired);

        // Check if quorum reached
        if (proposal.votesReceived >= proposal.votesRequired) {
            proposal.executed = true;
            emit RecoveryExecuted(proposalId, proposal.targetGuardian, proposal.vault);
            return true;
        }

        return false;
    }

    /**
     * @notice Cancel a recovery proposal
     * @param proposalId ID of the proposal
     * @param reason Reason for cancellation
     */
    function cancelRecovery(uint256 proposalId, string calldata reason) external onlyOwner {
        RecoveryProposal storage proposal = proposals[proposalId];

        require(!proposal.executed, "Cannot cancel executed proposal");
        require(!proposal.cancelled, "Proposal already cancelled");

        proposal.cancelled = true;
        emit RecoveryCancelled(proposalId, reason);
    }

    /**
     * @notice Check if a proposal has reached quorum and execute status
     * @param proposalId ID of the proposal
     * @return executed True if proposal has been executed
     * @return votesReceived Current vote count
     * @return votesRequired Required votes for execution
     */
    function getProposalStatus(uint256 proposalId)
        external
        view
        returns (bool executed, uint256 votesReceived, uint256 votesRequired)
    {
        RecoveryProposal storage proposal = proposals[proposalId];
        return (proposal.executed, proposal.votesReceived, proposal.votesRequired);
    }

    /**
     * @notice Get vote count for a proposal
     * @param proposalId ID of the proposal
     * @return Number of votes received
     */
    function getVoteCount(uint256 proposalId) external view returns (uint256) {
        return proposals[proposalId].votesReceived;
    }

    /**
     * @notice Check if a guardian has voted on a proposal
     * @param proposalId ID of the proposal
     * @param guardian Guardian address
     * @return True if guardian has voted
     */
    function hasGuardianVoted(uint256 proposalId, address guardian) external view returns (bool) {
        return proposals[proposalId].hasVoted[guardian];
    }

    /**
     * @notice Get all voters for a proposal
     * @param proposalId ID of the proposal
     * @return Array of voter addresses
     */
    function getProposalVoters(uint256 proposalId) external view returns (address[] memory) {
        return proposals[proposalId].voters;
    }

    /**
     * @notice Get active proposal IDs for a vault
     * @param vault Vault address
     * @return Array of active proposal IDs
     */
    function getVaultProposals(address vault) external view returns (uint256[] memory) {
        return vaultProposals[vault];
    }

    /**
     * @notice Get proposals targeting a specific guardian
     * @param guardian Guardian address
     * @return Array of proposal IDs targeting this guardian
     */
    function getGuardianTargetProposals(address guardian) external view returns (uint256[] memory) {
        return guardianTargetProposals[guardian];
    }

    /**
     * @notice Get time remaining for voting on a proposal
     * @param proposalId ID of the proposal
     * @return Seconds remaining (0 if expired or executed)
     */
    function getTimeRemaining(uint256 proposalId) external view returns (uint256) {
        RecoveryProposal storage proposal = proposals[proposalId];

        if (proposal.executed || proposal.cancelled) {
            return 0;
        }

        uint256 endTime = proposal.proposedAt + votingPeriod;
        if (block.timestamp >= endTime) {
            return 0;
        }

        return endTime - block.timestamp;
    }

    /**
     * @notice Get full proposal details
     * @param proposalId ID of the proposal
     * @return targetGuardian Guardian being recovered
     * @return vault Vault address
     * @return votesRequired Required votes
     * @return votesReceived Votes received
     * @return proposedAt Proposal timestamp
     * @return executed Execution status
     * @return cancelled Cancellation status
     * @return timeRemaining Seconds until voting ends
     */
    function getProposalDetails(uint256 proposalId)
        external
        view
        returns (
            address targetGuardian,
            address vault,
            uint256 votesRequired,
            uint256 votesReceived,
            uint256 proposedAt,
            bool executed,
            bool cancelled,
            uint256 timeRemaining
        )
    {
        RecoveryProposal storage proposal = proposals[proposalId];

        uint256 endTime = proposal.proposedAt + votingPeriod;
        uint256 remaining = block.timestamp >= endTime ? 0 : (endTime - block.timestamp);

        return (
            proposal.targetGuardian,
            proposal.vault,
            proposal.votesRequired,
            proposal.votesReceived,
            proposal.proposedAt,
            proposal.executed,
            proposal.cancelled,
            remaining
        );
    }

    /**
     * @notice Check if voting period has expired for a proposal
     * @param proposalId ID of the proposal
     * @return True if voting period has ended
     */
    function isVotingExpired(uint256 proposalId) external view returns (bool) {
        RecoveryProposal storage proposal = proposals[proposalId];
        return block.timestamp >= proposal.proposedAt + votingPeriod;
    }

    /**
     * @notice Set voting period for recovery proposals
     * @param newPeriod New voting period in seconds
     */
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Voting period must be positive");
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(newPeriod);
    }

    /**
     * @notice Get total number of proposals
     * @return Total proposal count
     */
    function getTotalProposals() external view returns (uint256) {
        return proposalCounter;
    }

    /**
     * @notice Get votes needed to reach quorum
     * @param proposalId ID of the proposal
     * @return Votes still needed (0 if quorum reached or exceeded)
     */
    function getVotesNeeded(uint256 proposalId) external view returns (uint256) {
        RecoveryProposal storage proposal = proposals[proposalId];

        if (proposal.votesReceived >= proposal.votesRequired) {
            return 0;
        }

        return proposal.votesRequired - proposal.votesReceived;
    }
}
