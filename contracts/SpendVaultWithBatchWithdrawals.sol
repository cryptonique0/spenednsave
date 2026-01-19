// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BatchWithdrawalManager.sol";

interface IGuardianSBT {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title SpendVaultWithBatchWithdrawals
 * @dev Vault supporting batch withdrawals of multiple ERC-20 tokens
 */
contract SpendVaultWithBatchWithdrawals is ReentrancyGuard {

    address public owner;
    address public guardianToken;
    address public batchManager;
    uint256 public quorum;

    mapping(uint256 => bool) public batchExecuted;

    event BatchWithdrawalExecuted(
        uint256 indexed batchId,
        uint256 tokenCount,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        quorum = 2;
    }

    receive() external payable {}

    fallback() external payable {}

    /// @dev Propose batch withdrawal
    function proposeBatchWithdrawal(
        BatchWithdrawalManager.TokenWithdrawal[] calldata tokens,
        string calldata reason
    ) external onlyOwner returns (uint256) {
        // Validate balance for all tokens before proposal
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].token == address(0)) {
                require(address(this).balance >= tokens[i].amount, "Insufficient ETH");
            } else {
                require(
                    IERC20(tokens[i].token).balanceOf(address(this)) >= tokens[i].amount,
                    "Insufficient tokens"
                );
            }
        }

        return IBatchWithdrawalManager(batchManager).createBatch(
            address(this),
            tokens,
            reason
        );
    }

    /// @dev Guardian votes on batch
    function voteApproveBatch(uint256 batchId) external {
        require(IGuardianSBT(guardianToken).balanceOf(msg.sender) > 0, "Not a guardian");
        require(
            !IBatchWithdrawalManager(batchManager).hasVoted(batchId, msg.sender),
            "Already voted"
        );

        IBatchWithdrawalManager(batchManager).approveBatch(batchId, msg.sender);
    }

    /// @dev Execute approved batch
    function executeBatchWithdrawal(uint256 batchId) external nonReentrant {
        require(!batchExecuted[batchId], "Already executed");

        (
            uint256 id,
            address vault,
            ,
            ,
            ,
            ,
            uint256 approvalsCount,
            uint8 status,
            bool executed,
            
        ) = IBatchWithdrawalManager(batchManager).getBatch(batchId);

        require(vault == address(this), "Wrong vault");
        require(!executed, "Already executed");
        require(status == 1, "Not approved");  // APPROVED = 1
        require(approvalsCount >= quorum, "Insufficient approvals");

        batchExecuted[batchId] = true;
        IBatchWithdrawalManager(batchManager).executeBatch(batchId);

        // Execute all transfers
        uint256 tokenCount = IBatchWithdrawalManager(batchManager).getBatchTokenCount(batchId);
        for (uint256 i = 0; i < tokenCount; i++) {
            (address token, uint256 amount, address recipient) = 
                IBatchWithdrawalManager(batchManager).getBatchToken(batchId, i);

            if (token == address(0)) {
                (bool success, ) = payable(recipient).call{value: amount}("");
                require(success, "ETH transfer failed");
            } else {
                require(IERC20(token).transfer(recipient, amount), "Token transfer failed");
            }
        }

        emit BatchWithdrawalExecuted(batchId, tokenCount, block.timestamp);
    }

    /// @dev Deposit ETH
    function depositETH() external payable {}

    /// @dev Deposit ERC-20
    function deposit(address token, uint256 amount) external {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    /// @dev Set quorum
    function setQuorum(uint256 newQuorum) external onlyOwner {
        quorum = newQuorum;
    }

    /// @dev Update guardian token
    function updateGuardianToken(address newToken) external onlyOwner {
        guardianToken = newToken;
    }

    /// @dev Update batch manager
    function updateBatchManager(address newManager) external onlyOwner {
        batchManager = newManager;
    }

    /// @dev Get ETH balance
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @dev Get token balance
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @dev Check if batch executed
    function isBatchExecuted(uint256 batchId) external view returns (bool) {
        return batchExecuted[batchId];
    }
}

interface IBatchWithdrawalManager {
    function createBatch(
        address vault,
        BatchWithdrawalManager.TokenWithdrawal[] calldata tokens,
        string calldata reason
    ) external returns (uint256);

    function approveBatch(uint256 batchId, address voter) external returns (bool);

    function executeBatch(uint256 batchId) external;

    function getBatch(uint256 batchId) external view returns (
        uint256 id,
        address vault,
        string memory reason,
        address proposer,
        uint256 createdAt,
        uint256 votingDeadline,
        uint256 approvalsCount,
        uint8 status,
        bool executed,
        uint256 executedAt
    );

    function getBatchTokens(uint256 batchId) external view returns (BatchWithdrawalManager.TokenWithdrawal[] memory);

    function getBatchTokenCount(uint256 batchId) external view returns (uint256);

    function getBatchToken(uint256 batchId, uint256 index) external view returns (
        address token,
        uint256 amount,
        address recipient
    );

    function hasVoted(uint256 batchId, address voter) external view returns (bool);

    function approvalsNeeded(uint256 batchId) external view returns (uint256);

    function getVaultQuorum(address vault) external view returns (uint256);
}
