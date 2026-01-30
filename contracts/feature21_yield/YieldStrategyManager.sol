// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldStrategyManager
/// @notice Manages yield strategies and protocol integrations for SpendVaults
contract YieldStrategyManager {

    // Whitelist/blacklist storage
    mapping(address => bool) public whitelistedStrategies;
    mapping(address => bool) public blacklistedStrategies;
    event StrategyWhitelisted(address indexed strategy, bool whitelisted, uint256 timestamp);
    event StrategyBlacklisted(address indexed strategy, bool blacklisted, uint256 timestamp);

    // Governance-only modifier (placeholder)
    modifier onlyGovernance() {
        // TODO: integrate with actual governance
        _;
    }

    // Multi-chain strategy info
    struct StrategyInfo {
        uint256 chainId;
        address strategyAddress;
        string name;
        string metadata; // Optional: JSON or IPFS hash
    }
    // strategy => info
    mapping(address => StrategyInfo) public strategyInfo;


        /// @notice Suggest allocations for a user and vault, prioritizing user preferences if set
        function suggestAllocations(address user, address vault) external view returns (address[] memory strategies, uint256[] memory allocations) {
            address[] memory prefs = userStrategyPreferences[user][vault];
            address[] memory allStrategies = vaultStrategies[vault];
            uint256 n = prefs.length > 0 ? prefs.length : allStrategies.length;
            address[] memory resultStrategies = new address[](n);
            uint256[] memory resultAllocations = new uint256[](n);
            uint256 allocationPer = n > 0 ? 10000 / n : 0;
            if (prefs.length > 0) {
                for (uint256 i = 0; i < n; i++) {
                    resultStrategies[i] = prefs[i];
                    resultAllocations[i] = allocationPer;
                }
            } else {
                for (uint256 i = 0; i < n; i++) {
                    resultStrategies[i] = allStrategies[i];
                    resultAllocations[i] = allocationPer;
                }
            }
            return (resultStrategies, resultAllocations);
        }
    // Events
    event StrategyRegistered(address indexed vault, address indexed strategy, uint256 timestamp);
    event StrategyUpgraded(address indexed vault, address indexed oldStrategy, address indexed newStrategy, uint256 timestamp);
    event YieldHarvested(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);
    event EmergencyWithdrawal(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);

    // Mapping: vault => strategy
    mapping(address => address) public vaultStrategy;

    // User-defined strategy preferences: user => vault => strategies (ordered by preference)
    mapping(address => mapping(address => address[])) public userStrategyPreferences;

    event UserStrategyPreferencesSet(address indexed user, address indexed vault, address[] strategies, uint256 timestamp);

        // Mapping: strategy => performance metrics
        struct StrategyMetrics {
            uint256 apy;
            uint256 riskScore;
            uint256 lastUpdated;
        }
        mapping(address => StrategyMetrics) public strategyMetrics;

        // List of strategies per vault
        mapping(address => address[]) public vaultStrategies;

        // Automated switching config per vault
        struct SwitchingConfig {
            uint256 minAPY;
            uint256 maxRisk;
            uint256 checkInterval;
            uint256 lastCheck;
        }
        mapping(address => SwitchingConfig) public switchingConfigs;

        event StrategySwitched(address indexed vault, address indexed oldStrategy, address indexed newStrategy, uint256 timestamp);
        event StrategyMetricsUpdated(address indexed strategy, uint256 apy, uint256 riskScore, uint256 timestamp);

    // Placeholder for guardian-only modifier
    modifier onlyGuardian(address vault) {
        // TODO: integrate with guardian system
        _;
    }


    /// @notice Register a new yield strategy for a vault (with chainId and metadata)
    function registerStrategy(address vault, address strategy, uint256 chainId, string calldata name, string calldata metadata) external onlyGuardian(vault) {
        require(vaultStrategy[vault] == address(0), "Strategy already registered");
        vaultStrategy[vault] = strategy;
        vaultStrategies[vault].push(strategy);
        strategyInfo[strategy] = StrategyInfo({
            chainId: chainId,
            strategyAddress: strategy,
            name: name,
            metadata: metadata
        });
        emit StrategyRegistered(vault, strategy, block.timestamp);
    }

    /// @notice Get all strategies for a vault on a specific chain
    function getVaultStrategiesByChain(address vault, uint256 chainId) external view returns (address[] memory) {
        address[] memory all = vaultStrategies[vault];
        uint256 count = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (strategyInfo[all[i]].chainId == chainId) count++;
        }
        address[] memory filtered = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (strategyInfo[all[i]].chainId == chainId) {
                filtered[idx++] = all[i];
            }
        }
        return filtered;
    }

    /// @notice Aggregate APY, risk, and returns for all strategies of a vault (optionally by chain)
    function aggregateVaultAnalytics(address vault, uint256 chainId) external view returns (uint256 avgAPY, uint256 avgRisk, uint256 count) {
        address[] memory all = vaultStrategies[vault];
        uint256 sumAPY = 0;
        uint256 sumRisk = 0;
        uint256 n = 0;
        for (uint256 i = 0; i < all.length; i++) {
            if (chainId == 0 || strategyInfo[all[i]].chainId == chainId) {
                sumAPY += strategyMetrics[all[i]].apy;
                sumRisk += strategyMetrics[all[i]].riskScore;
                n++;
            }
        }
        if (n > 0) {
            avgAPY = sumAPY / n;
            avgRisk = sumRisk / n;
        }
        count = n;
    }

    /// @notice Upgrade the yield strategy for a vault
    function upgradeStrategy(address vault, address newStrategy) external onlyGuardian(vault) {
        address oldStrategy = vaultStrategy[vault];
        require(oldStrategy != address(0), "No strategy registered");
        require(newStrategy != address(0), "Invalid new strategy");
        vaultStrategy[vault] = newStrategy;
            vaultStrategies[vault].push(newStrategy);
        emit StrategyUpgraded(vault, oldStrategy, newStrategy, block.timestamp);
    }

    /// @notice Emergency withdraw all funds from strategy back to vault (vault or guardian)
    function emergencyWithdraw(address vault, uint256 amount) external {
        require(msg.sender == vault || isGuardian(msg.sender, vault), "Not authorized");
        address strategy = vaultStrategy[vault];
        require(strategy != address(0), "No strategy registered");
        // Call emergencyWithdraw on the strategy contract
        (bool success, ) = strategy.call(abi.encodeWithSignature("emergencyWithdraw(uint256)", amount));
        require(success, "Strategy emergency withdraw failed");
        emit EmergencyWithdrawal(vault, amount, strategy, block.timestamp);
    }

    // Internal: check if address is a guardian for the vault (placeholder, to be implemented)
    function isGuardian(address /*user*/, address /*vault*/) public pure returns (bool) {
        // TODO: integrate with actual guardian system
        return false;
    }

    /// @notice Harvest yield from strategy
    function harvestYield(address vault) external onlyGuardian(vault) {
        address strategy = vaultStrategy[vault];
        require(strategy != address(0), "No strategy registered");
        // TODO: call strategy harvest logic and transfer yield to vault
        uint256 harvested = 0; // Placeholder
        emit YieldHarvested(vault, harvested, strategy, block.timestamp);
        }

        /// @notice Update performance metrics for a strategy (to be called by oracle or off-chain bot)
        function updateStrategyMetrics(address strategy, uint256 apy, uint256 riskScore) external {
            strategyMetrics[strategy] = StrategyMetrics({
                apy: apy,
                riskScore: riskScore,
                lastUpdated: block.timestamp
            });
            emit StrategyMetricsUpdated(strategy, apy, riskScore, block.timestamp);
        }

        /// @notice Configure automated switching for a vault
        function configureSwitching(address vault, uint256 minAPY, uint256 maxRisk, uint256 checkInterval) external onlyGuardian(vault) {
            switchingConfigs[vault] = SwitchingConfig({
                minAPY: minAPY,
                maxRisk: maxRisk,
                checkInterval: checkInterval,
                lastCheck: 0
            });
        }

        /// @notice Automated strategy switching based on metrics and config
        function autoSwitchStrategy(address vault) external {
            SwitchingConfig storage config = switchingConfigs[vault];
            require(config.checkInterval > 0, "Switching not configured");
            require(block.timestamp >= config.lastCheck + config.checkInterval, "Check interval not reached");
            address current = vaultStrategy[vault];
            address[] storage strategies = vaultStrategies[vault];
            address bestStrategy = current;
            uint256 bestAPY = strategyMetrics[current].apy;
            uint256 bestRisk = strategyMetrics[current].riskScore;
            for (uint256 i = 0; i < strategies.length; i++) {
                address strat = strategies[i];
                StrategyMetrics memory metrics = strategyMetrics[strat];
                if (metrics.apy >= config.minAPY && metrics.riskScore <= config.maxRisk) {
                    if (metrics.apy > bestAPY || (metrics.apy == bestAPY && metrics.riskScore < bestRisk)) {
                        bestStrategy = strat;
                        bestAPY = metrics.apy;
                        bestRisk = metrics.riskScore;
                    }
                }
            }
            if (bestStrategy != current) {
                vaultStrategy[vault] = bestStrategy;
                emit StrategySwitched(vault, current, bestStrategy, block.timestamp);
            }
            config.lastCheck = block.timestamp;
        }

        /// @notice Set user-defined strategy preferences (ordered list)
        function setUserStrategyPreferences(address vault, address[] calldata strategies) external {
            require(strategies.length > 0, "No strategies provided");
            // Optionally: validate strategies are registered for this vault
            userStrategyPreferences[msg.sender][vault] = strategies;
            emit UserStrategyPreferencesSet(msg.sender, vault, strategies, block.timestamp);
        }

        /// @notice Get user-defined strategy preferences for a vault
        function getUserStrategyPreferences(address user, address vault) external view returns (address[] memory) {
            return userStrategyPreferences[user][vault];
        }
    }
