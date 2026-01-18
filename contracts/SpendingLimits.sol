// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SpendingLimits
 * @notice Manages per-guardian spending limits with daily, weekly, and monthly caps
 * @dev Tracks withdrawal amounts and enforces multiple timeframe limits simultaneously
 */
contract SpendingLimits is Ownable, ReentrancyGuard {
    
    // ============ Data Structures ============
    
    /**
     * @notice Guardian limit configuration for a specific vault and token
     */
    struct GuardianLimit {
        bool isActive;                  // Whether limit is enforced
        uint256 dailyLimit;            // Max daily withdrawal amount
        uint256 weeklyLimit;           // Max weekly withdrawal amount
        uint256 monthlyLimit;          // Max monthly withdrawal amount
        uint256 lastResetDay;          // Last day limit was reset
        uint256 lastResetWeek;         // Last week limit was reset
        uint256 lastResetMonth;        // Last month limit was reset
    }
    
    /**
     * @notice Current spending tracking for a guardian
     */
    struct GuardianSpending {
        uint256 dailySpent;            // Amount spent today
        uint256 weeklySpent;           // Amount spent this week
        uint256 monthlySpent;          // Amount spent this month
    }
    
    /**
     * @notice Vault-level spending limit configuration
     */
    struct VaultLimit {
        bool isEnabled;                // Whether vault limits are enforced
        uint256 dailyLimit;            // Max daily withdrawal across all guardians
        uint256 weeklyLimit;           // Max weekly withdrawal across all guardians
        uint256 monthlyLimit;          // Max monthly withdrawal across all guardians
        uint256 lastResetDay;          // Last day limit was reset
        uint256 lastResetWeek;         // Last week limit was reset
        uint256 lastResetMonth;        // Last month limit was reset
    }
    
    /**
     * @notice Current vault-level spending
     */
    struct VaultSpending {
        uint256 dailySpent;            // Total spent today
        uint256 weeklySpent;           // Total spent this week
        uint256 monthlySpent;          // Total spent this month
    }
    
    // ============ State Variables ============
    
    // vault => token => guardian => GuardianLimit
    mapping(address => mapping(address => mapping(address => GuardianLimit))) public guardianLimits;
    
    // vault => token => guardian => GuardianSpending
    mapping(address => mapping(address => mapping(address => GuardianSpending))) public guardianSpending;
    
    // vault => token => VaultLimit
    mapping(address => mapping(address => VaultLimit)) public vaultLimits;
    
    // vault => token => VaultSpending
    mapping(address => mapping(address => VaultSpending)) public vaultSpending;
    
    // Track which day/week/month we're in (seconds since epoch divided by period)
    mapping(address => mapping(address => mapping(address => uint256))) private lastDayChecked;
    mapping(address => mapping(address => mapping(address => uint256))) private lastWeekChecked;
    mapping(address => mapping(address => mapping(address => uint256))) private lastMonthChecked;
    
    // Same for vault-level
    mapping(address => mapping(address => uint256)) private vaultLastDayChecked;
    mapping(address => mapping(address => uint256)) private vaultLastWeekChecked;
    mapping(address => mapping(address => uint256)) private vaultLastMonthChecked;
    
    // Constants
    uint256 private constant ONE_DAY = 86400;    // 24 hours in seconds
    uint256 private constant ONE_WEEK = 604800;  // 7 days in seconds
    uint256 private constant ONE_MONTH = 2592000; // 30 days in seconds
    
    // ============ Events ============
    
    event GuardianLimitSet(
        address indexed vault,
        address indexed token,
        address indexed guardian,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    );
    
    event GuardianLimitRemoved(
        address indexed vault,
        address indexed token,
        address indexed guardian
    );
    
    event GuardianLimitExceeded(
        address indexed vault,
        address indexed token,
        address indexed guardian,
        string limitType,
        uint256 currentSpent,
        uint256 limit,
        uint256 requested
    );
    
    event VaultLimitSet(
        address indexed vault,
        address indexed token,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    );
    
    event VaultLimitExceeded(
        address indexed vault,
        address indexed token,
        string limitType,
        uint256 currentSpent,
        uint256 limit,
        uint256 requested
    );
    
    event GuardianWithdrawal(
        address indexed vault,
        address indexed token,
        address indexed guardian,
        uint256 amount,
        uint256 dailySpent,
        uint256 weeklySpent,
        uint256 monthlySpent
    );
    
    event VaultWithdrawal(
        address indexed vault,
        address indexed token,
        uint256 amount,
        uint256 dailySpent,
        uint256 weeklySpent,
        uint256 monthlySpent
    );
    
    // ============ Guardian Limit Functions ============
    
    /**
     * @notice Set spending limits for a specific guardian on a vault+token pair
     * @param vault Address of the vault
     * @param token Address of the token (address(0) for ETH)
     * @param guardian Address of the guardian
     * @param dailyLimit Daily spending limit (0 = unlimited)
     * @param weeklyLimit Weekly spending limit (0 = unlimited)
     * @param monthlyLimit Monthly spending limit (0 = unlimited)
     */
    function setGuardianLimit(
        address vault,
        address token,
        address guardian,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    ) public onlyOwner {
        require(vault != address(0), "Invalid vault address");
        require(guardian != address(0), "Invalid guardian address");
        
        GuardianLimit storage limit = guardianLimits[vault][token][guardian];
        limit.isActive = true;
        limit.dailyLimit = dailyLimit;
        limit.weeklyLimit = weeklyLimit;
        limit.monthlyLimit = monthlyLimit;
        
        // Initialize reset timestamps
        if (limit.lastResetDay == 0) {
            limit.lastResetDay = block.timestamp;
            limit.lastResetWeek = block.timestamp;
            limit.lastResetMonth = block.timestamp;
        }
        
        emit GuardianLimitSet(vault, token, guardian, dailyLimit, weeklyLimit, monthlyLimit);
    }
    
    /**
     * @notice Remove spending limits for a guardian
     * @param vault Address of the vault
     * @param token Address of the token
     * @param guardian Address of the guardian
     */
    function removeGuardianLimit(
        address vault,
        address token,
        address guardian
    ) public onlyOwner {
        GuardianLimit storage limit = guardianLimits[vault][token][guardian];
        limit.isActive = false;
        limit.dailyLimit = 0;
        limit.weeklyLimit = 0;
        limit.monthlyLimit = 0;
        
        emit GuardianLimitRemoved(vault, token, guardian);
    }
    
    /**
     * @notice Check if a withdrawal is allowed under guardian limits
     * @param vault Address of the vault
     * @param token Address of the token
     * @param guardian Address of the guardian
     * @param amount Withdrawal amount to check
     * @return allowed True if withdrawal is allowed
     * @return reason Explanation if not allowed
     */
    function checkGuardianLimit(
        address vault,
        address token,
        address guardian,
        uint256 amount
    ) public nonReentrant returns (bool allowed, string memory reason) {
        GuardianLimit storage limit = guardianLimits[vault][token][guardian];
        
        // If limit is not active, allow withdrawal
        if (!limit.isActive) {
            return (true, "");
        }
        
        GuardianSpending storage spending = guardianSpending[vault][token][guardian];
        
        // Reset periods if needed
        _resetGuardianPeriods(vault, token, guardian, limit, spending);
        
        // Check daily limit
        if (limit.dailyLimit > 0) {
            if (spending.dailySpent + amount > limit.dailyLimit) {
                return (false, "DAILY_LIMIT_EXCEEDED");
            }
        }
        
        // Check weekly limit
        if (limit.weeklyLimit > 0) {
            if (spending.weeklySpent + amount > limit.weeklyLimit) {
                return (false, "WEEKLY_LIMIT_EXCEEDED");
            }
        }
        
        // Check monthly limit
        if (limit.monthlyLimit > 0) {
            if (spending.monthlySpent + amount > limit.monthlyLimit) {
                return (false, "MONTHLY_LIMIT_EXCEEDED");
            }
        }
        
        return (true, "");
    }
    
    /**
     * @notice Record a withdrawal and update spending tracking
     * @param vault Address of the vault
     * @param token Address of the token
     * @param guardian Address of the guardian
     * @param amount Amount withdrawn
     */
    function recordGuardianWithdrawal(
        address vault,
        address token,
        address guardian,
        uint256 amount
    ) public onlyOwner nonReentrant {
        GuardianLimit storage limit = guardianLimits[vault][token][guardian];
        GuardianSpending storage spending = guardianSpending[vault][token][guardian];
        
        // Reset periods if needed
        _resetGuardianPeriods(vault, token, guardian, limit, spending);
        
        // Update spending
        spending.dailySpent += amount;
        spending.weeklySpent += amount;
        spending.monthlySpent += amount;
        
        emit GuardianWithdrawal(
            vault,
            token,
            guardian,
            amount,
            spending.dailySpent,
            spending.weeklySpent,
            spending.monthlySpent
        );
    }
    
    /**
     * @notice Get current spending for a guardian
     * @param vault Address of the vault
     * @param token Address of the token
     * @param guardian Address of the guardian
     * @return daily Daily spending amount
     * @return weekly Weekly spending amount
     * @return monthly Monthly spending amount
     */
    function getGuardianSpending(
        address vault,
        address token,
        address guardian
    ) public view returns (uint256 daily, uint256 weekly, uint256 monthly) {
        GuardianSpending storage spending = guardianSpending[vault][token][guardian];
        return (spending.dailySpent, spending.weeklySpent, spending.monthlySpent);
    }
    
    /**
     * @notice Get remaining spending allowance for a guardian
     * @param vault Address of the vault
     * @param token Address of the token
     * @param guardian Address of the guardian
     * @return dailyRemaining Daily allowance remaining
     * @return weeklyRemaining Weekly allowance remaining
     * @return monthlyRemaining Monthly allowance remaining
     */
    function getGuardianRemaining(
        address vault,
        address token,
        address guardian
    ) public view returns (uint256 dailyRemaining, uint256 weeklyRemaining, uint256 monthlyRemaining) {
        GuardianLimit storage limit = guardianLimits[vault][token][guardian];
        GuardianSpending storage spending = guardianSpending[vault][token][guardian];
        
        if (!limit.isActive) {
            return (type(uint256).max, type(uint256).max, type(uint256).max);
        }
        
        dailyRemaining = limit.dailyLimit > spending.dailySpent ? limit.dailyLimit - spending.dailySpent : 0;
        weeklyRemaining = limit.weeklyLimit > spending.weeklySpent ? limit.weeklyLimit - spending.weeklySpent : 0;
        monthlyRemaining = limit.monthlyLimit > spending.monthlySpent ? limit.monthlyLimit - spending.monthlySpent : 0;
    }
    
    // ============ Vault Limit Functions ============
    
    /**
     * @notice Set spending limits at the vault level
     * @param vault Address of the vault
     * @param token Address of the token
     * @param dailyLimit Daily spending limit (0 = unlimited)
     * @param weeklyLimit Weekly spending limit (0 = unlimited)
     * @param monthlyLimit Monthly spending limit (0 = unlimited)
     */
    function setVaultLimit(
        address vault,
        address token,
        uint256 dailyLimit,
        uint256 weeklyLimit,
        uint256 monthlyLimit
    ) public onlyOwner {
        require(vault != address(0), "Invalid vault address");
        
        VaultLimit storage limit = vaultLimits[vault][token];
        limit.isEnabled = true;
        limit.dailyLimit = dailyLimit;
        limit.weeklyLimit = weeklyLimit;
        limit.monthlyLimit = monthlyLimit;
        
        // Initialize reset timestamps
        if (limit.lastResetDay == 0) {
            limit.lastResetDay = block.timestamp;
            limit.lastResetWeek = block.timestamp;
            limit.lastResetMonth = block.timestamp;
        }
        
        emit VaultLimitSet(vault, token, dailyLimit, weeklyLimit, monthlyLimit);
    }
    
    /**
     * @notice Check if a vault-level withdrawal is allowed
     * @param vault Address of the vault
     * @param token Address of the token
     * @param amount Withdrawal amount to check
     * @return allowed True if withdrawal is allowed
     * @return reason Explanation if not allowed
     */
    function checkVaultLimit(
        address vault,
        address token,
        uint256 amount
    ) public nonReentrant returns (bool allowed, string memory reason) {
        VaultLimit storage limit = vaultLimits[vault][token];
        
        // If limit is not enabled, allow withdrawal
        if (!limit.isEnabled) {
            return (true, "");
        }
        
        VaultSpending storage spending = vaultSpending[vault][token];
        
        // Reset periods if needed
        _resetVaultPeriods(vault, token, limit, spending);
        
        // Check daily limit
        if (limit.dailyLimit > 0) {
            if (spending.dailySpent + amount > limit.dailyLimit) {
                return (false, "VAULT_DAILY_LIMIT_EXCEEDED");
            }
        }
        
        // Check weekly limit
        if (limit.weeklyLimit > 0) {
            if (spending.weeklySpent + amount > limit.weeklyLimit) {
                return (false, "VAULT_WEEKLY_LIMIT_EXCEEDED");
            }
        }
        
        // Check monthly limit
        if (limit.monthlyLimit > 0) {
            if (spending.monthlySpent + amount > limit.monthlyLimit) {
                return (false, "VAULT_MONTHLY_LIMIT_EXCEEDED");
            }
        }
        
        return (true, "");
    }
    
    /**
     * @notice Record a vault-level withdrawal
     * @param vault Address of the vault
     * @param token Address of the token
     * @param amount Amount withdrawn
     */
    function recordVaultWithdrawal(
        address vault,
        address token,
        uint256 amount
    ) public onlyOwner nonReentrant {
        VaultLimit storage limit = vaultLimits[vault][token];
        VaultSpending storage spending = vaultSpending[vault][token];
        
        // Reset periods if needed
        _resetVaultPeriods(vault, token, limit, spending);
        
        // Update spending
        spending.dailySpent += amount;
        spending.weeklySpent += amount;
        spending.monthlySpent += amount;
        
        emit VaultWithdrawal(
            vault,
            token,
            amount,
            spending.dailySpent,
            spending.weeklySpent,
            spending.monthlySpent
        );
    }
    
    /**
     * @notice Get current spending for a vault
     * @param vault Address of the vault
     * @param token Address of the token
     * @return daily Daily spending amount
     * @return weekly Weekly spending amount
     * @return monthly Monthly spending amount
     */
    function getVaultSpending(
        address vault,
        address token
    ) public view returns (uint256 daily, uint256 weekly, uint256 monthly) {
        VaultSpending storage spending = vaultSpending[vault][token];
        return (spending.dailySpent, spending.weeklySpent, spending.monthlySpent);
    }
    
    /**
     * @notice Get remaining spending allowance for a vault
     * @param vault Address of the vault
     * @param token Address of the token
     * @return dailyRemaining Daily allowance remaining
     * @return weeklyRemaining Weekly allowance remaining
     * @return monthlyRemaining Monthly allowance remaining
     */
    function getVaultRemaining(
        address vault,
        address token
    ) public view returns (uint256 dailyRemaining, uint256 weeklyRemaining, uint256 monthlyRemaining) {
        VaultLimit storage limit = vaultLimits[vault][token];
        VaultSpending storage spending = vaultSpending[vault][token];
        
        if (!limit.isEnabled) {
            return (type(uint256).max, type(uint256).max, type(uint256).max);
        }
        
        dailyRemaining = limit.dailyLimit > spending.dailySpent ? limit.dailyLimit - spending.dailySpent : 0;
        weeklyRemaining = limit.weeklyLimit > spending.weeklySpent ? limit.weeklyLimit - spending.weeklySpent : 0;
        monthlyRemaining = limit.monthlyLimit > spending.monthlySpent ? limit.monthlyLimit - spending.monthlySpent : 0;
    }
    
    // ============ Internal Reset Functions ============
    
    /**
     * @notice Reset guardian spending periods if needed
     */
    function _resetGuardianPeriods(
        address vault,
        address token,
        address guardian,
        GuardianLimit storage limit,
        GuardianSpending storage spending
    ) private {
        uint256 currentDay = block.timestamp / ONE_DAY;
        uint256 currentWeek = block.timestamp / ONE_WEEK;
        uint256 currentMonth = block.timestamp / ONE_MONTH;
        
        // Reset daily
        if (currentDay > (limit.lastResetDay / ONE_DAY)) {
            spending.dailySpent = 0;
            limit.lastResetDay = block.timestamp;
        }
        
        // Reset weekly
        if (currentWeek > (limit.lastResetWeek / ONE_WEEK)) {
            spending.weeklySpent = 0;
            limit.lastResetWeek = block.timestamp;
        }
        
        // Reset monthly
        if (currentMonth > (limit.lastResetMonth / ONE_MONTH)) {
            spending.monthlySpent = 0;
            limit.lastResetMonth = block.timestamp;
        }
    }
    
    /**
     * @notice Reset vault spending periods if needed
     */
    function _resetVaultPeriods(
        address vault,
        address token,
        VaultLimit storage limit,
        VaultSpending storage spending
    ) private {
        uint256 currentDay = block.timestamp / ONE_DAY;
        uint256 currentWeek = block.timestamp / ONE_WEEK;
        uint256 currentMonth = block.timestamp / ONE_MONTH;
        
        // Reset daily
        if (currentDay > (limit.lastResetDay / ONE_DAY)) {
            spending.dailySpent = 0;
            limit.lastResetDay = block.timestamp;
        }
        
        // Reset weekly
        if (currentWeek > (limit.lastResetWeek / ONE_WEEK)) {
            spending.weeklySpent = 0;
            limit.lastResetWeek = block.timestamp;
        }
        
        // Reset monthly
        if (currentMonth > (limit.lastResetMonth / ONE_MONTH)) {
            spending.monthlySpent = 0;
            limit.lastResetMonth = block.timestamp;
        }
    }
}
