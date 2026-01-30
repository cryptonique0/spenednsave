// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldStrategyManager
/// @notice Manages yield strategies and protocol integrations for SpendVaults
contract YieldStrategyManager {
    // Events
    event StrategyRegistered(address indexed vault, address indexed strategy, uint256 timestamp);
    event StrategyUpgraded(address indexed vault, address indexed oldStrategy, address indexed newStrategy, uint256 timestamp);
    event YieldHarvested(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);
    event EmergencyWithdrawal(address indexed vault, uint256 amount, address indexed protocol, uint256 timestamp);

    // Mapping: vault => strategy
    mapping(address => address) public vaultStrategy;

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

    /// @notice Register a new yield strategy for a vault
    function registerStrategy(address vault, address strategy) external onlyGuardian(vault) {
        require(vaultStrategy[vault] == address(0), "Strategy already registered");
        vaultStrategy[vault] = strategy;
            vaultStrategies[vault].push(strategy);
        emit StrategyRegistered(vault, strategy, block.timestamp);
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

    /// @notice Emergency withdraw all funds from strategy back to vault
    function emergencyWithdraw(address vault, uint256 amount) external onlyGuardian(vault) {
        address strategy = vaultStrategy[vault];
        require(strategy != address(0), "No strategy registered");
        // TODO: call strategy emergency withdraw logic
        emit EmergencyWithdrawal(vault, amount, strategy, block.timestamp);
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
}
