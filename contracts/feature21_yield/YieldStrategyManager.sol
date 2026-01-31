// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldStrategyManager
/// @notice Manages yield strategies and protocol integrations for SpendVaults
contract YieldStrategyManager {

    /// @notice Get info for a social yield pool
    function getSocialYieldPoolInfo(uint256 poolId) external view returns (
        string memory name,
        address creator,
        address[] memory members,
        uint256 totalPooled,
        address[] memory strategies,
        uint256 createdAt
    ) {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        name = pool.name;
        creator = pool.creator;
        members = pool.members;
        totalPooled = pool.totalPooled;
        strategies = pool.strategies;
        createdAt = pool.createdAt;
    }

    /// @notice Get a member's share in a pool
    function getSocialYieldPoolMemberShare(uint256 poolId, address user) external view returns (uint256) {
        return socialYieldPools[poolId].memberShares[user];
    }

    /// @notice Get strategies a pool participates in
    function getSocialYieldPoolStrategies(uint256 poolId) external view returns (address[] memory) {
        return socialYieldPools[poolId].strategies;
    }

    /// @notice Get total pooled in a pool
    function getSocialYieldPoolTotalPooled(uint256 poolId) external view returns (uint256) {
        return socialYieldPools[poolId].totalPooled;
    }

    /// @notice Deposit funds to a social yield pool (tracks shares, does not move tokens)
    function depositToSocialYieldPool(uint256 poolId, uint256 amount) external {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        require(pool.isMember[msg.sender], "Not a member");
        pool.totalPooled += amount;
        pool.memberShares[msg.sender] += amount;
        emit SocialYieldPoolDeposit(poolId, msg.sender, amount, block.timestamp);
    }

    /// @notice Withdraw funds from a social yield pool (tracks shares, does not move tokens)
    function withdrawFromSocialYieldPool(uint256 poolId, uint256 amount) external {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        require(pool.isMember[msg.sender], "Not a member");
        require(pool.memberShares[msg.sender] >= amount, "Insufficient share");
        pool.totalPooled -= amount;
        pool.memberShares[msg.sender] -= amount;
        emit SocialYieldPoolWithdraw(poolId, msg.sender, amount, block.timestamp);
    }

    /// @notice Pool participates in a yield strategy (adds strategy to pool)
    function poolParticipateInStrategy(uint256 poolId, address strategy) external {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        require(pool.creator == msg.sender, "Only creator");
        pool.strategies.push(strategy);
    }

    /// @notice Distribute yield to pool members (stub, to be called after yield is realized)
    function distributePoolYield(uint256 poolId, uint256 /*totalYield*/) external view {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        uint256 n = pool.members.length;
        for (uint256 i = 0; i < n; i++) {
            address member = pool.members[i];
            uint256 share = pool.memberShares[member];
            if (pool.totalPooled > 0 && share > 0) {
                // In a real implementation, transfer (totalYield * share / totalPooled) to member
                // Here, just a placeholder for off-chain or vault-side distribution
            }
        }
    }

    // ============ Social Yield Pools Logic ============
    /// @notice Create a new social yield pool
    function createSocialYieldPool(string calldata name) external returns (uint256 poolId) {
        poolId = nextPoolId++;
        SocialYieldPool storage pool = socialYieldPools[poolId];
        pool.name = name;
        pool.creator = msg.sender;
        pool.createdAt = block.timestamp;
        pool.members.push(msg.sender);
        pool.isMember[msg.sender] = true;
        userPools[msg.sender].push(poolId);
        emit SocialYieldPoolCreated(poolId, name, msg.sender, block.timestamp);
    }

    /// @notice Join an existing social yield pool
    function joinSocialYieldPool(uint256 poolId) external {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        require(!pool.isMember[msg.sender], "Already a member");
        pool.members.push(msg.sender);
        pool.isMember[msg.sender] = true;
        userPools[msg.sender].push(poolId);
        emit SocialYieldPoolJoined(poolId, msg.sender, block.timestamp);
    }

    /// @notice Leave a social yield pool
    function leaveSocialYieldPool(uint256 poolId) external {
        SocialYieldPool storage pool = socialYieldPools[poolId];
        require(pool.isMember[msg.sender], "Not a member");
        pool.isMember[msg.sender] = false;
        // Remove from members array (swap and pop)
        uint256 len = pool.members.length;
        for (uint256 i = 0; i < len; i++) {
            if (pool.members[i] == msg.sender) {
                pool.members[i] = pool.members[len - 1];
                pool.members.pop();
                break;
            }
        }
        // Remove from userPools
        uint256[] storage pools = userPools[msg.sender];
        for (uint256 i = 0; i < pools.length; i++) {
            if (pools[i] == poolId) {
                pools[i] = pools[pools.length - 1];
                pools.pop();
                break;
            }
        }
        emit SocialYieldPoolLeft(poolId, msg.sender, block.timestamp);
    }

    /// @notice Get members of a pool
    function getSocialYieldPoolMembers(uint256 poolId) external view returns (address[] memory) {
        return socialYieldPools[poolId].members;
    }

    /// @notice Get pools for a user
    function getUserSocialYieldPools(address user) external view returns (uint256[] memory) {
        return userPools[user];
    }

    // ============ Social Yield Pools ============
    struct SocialYieldPool {
        string name;
        address creator;
        address[] members;
        mapping(address => bool) isMember;
        uint256 totalPooled;
        mapping(address => uint256) memberShares; // user => share
        address[] strategies; // strategies this pool participates in
        uint256 createdAt;
    }
    // Pool id counter
    uint256 public nextPoolId;
    // Pool id => pool
    mapping(uint256 => SocialYieldPool) public socialYieldPools;
    // User => pool ids
    mapping(address => uint256[]) public userPools;
    event SocialYieldPoolCreated(uint256 indexed poolId, string name, address indexed creator, uint256 timestamp);
    event SocialYieldPoolJoined(uint256 indexed poolId, address indexed user, uint256 timestamp);
    event SocialYieldPoolLeft(uint256 indexed poolId, address indexed user, uint256 timestamp);
    event SocialYieldPoolDeposit(uint256 indexed poolId, address indexed user, uint256 amount, uint256 timestamp);
    event SocialYieldPoolWithdraw(uint256 indexed poolId, address indexed user, uint256 amount, uint256 timestamp);

    // Fee tracking per strategy (basis points, 0-10000)
    struct StrategyFeeInfo {
        uint256 baseFeeBps; // e.g. protocol fee
        uint256 withdrawalFeeBps;
        uint256 crossChainFeeBps;
        uint256 lastUpdated;
    }
    mapping(address => StrategyFeeInfo) public strategyFees;
    event StrategyFeeUpdated(address indexed strategy, uint256 baseFeeBps, uint256 withdrawalFeeBps, uint256 crossChainFeeBps, uint256 timestamp);

    /// @notice Update fees for a strategy (governance only)
    function updateStrategyFees(address strategy, uint256 baseFeeBps, uint256 withdrawalFeeBps, uint256 crossChainFeeBps) external onlyGovernance {
        strategyFees[strategy] = StrategyFeeInfo({
            baseFeeBps: baseFeeBps,
            withdrawalFeeBps: withdrawalFeeBps,
            crossChainFeeBps: crossChainFeeBps,
            lastUpdated: block.timestamp
        });
        emit StrategyFeeUpdated(strategy, baseFeeBps, withdrawalFeeBps, crossChainFeeBps, block.timestamp);
    }

    /// @notice Whitelist a strategy (governance only)
    function setStrategyWhitelisted(address strategy, bool whitelisted) external onlyGovernance {
        whitelistedStrategies[strategy] = whitelisted;
        emit StrategyWhitelisted(strategy, whitelisted, block.timestamp);
    }

    /// @notice Blacklist a strategy (governance only)
    function setStrategyBlacklisted(address strategy, bool blacklisted) external onlyGovernance {
        blacklistedStrategies[strategy] = blacklisted;
        emit StrategyBlacklisted(strategy, blacklisted, block.timestamp);
    }

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
        // Filter out blacklisted and non-whitelisted strategies, and calculate net APY
        uint256 maxN = prefs.length > 0 ? prefs.length : allStrategies.length;
        address[] memory tempStrategies = new address[](maxN);
        int256[] memory netApyScores = new int256[](maxN);
        uint256 n = 0;
        if (prefs.length > 0) {
            for (uint256 i = 0; i < prefs.length; i++) {
                address s = prefs[i];
                if (whitelistedStrategies[s] && !blacklistedStrategies[s]) {
                    tempStrategies[n] = s;
                    // Net APY = APY - total fees (all in basis points)
                    StrategyMetrics memory m = strategyMetrics[s];
                    StrategyFeeInfo memory f = strategyFees[s];
                    int256 netApy = int256(m.apy) - int256(f.baseFeeBps) - int256(f.withdrawalFeeBps) - int256(f.crossChainFeeBps);
                    netApyScores[n] = netApy;
                    n++;
                }
            }
        } else {
            for (uint256 i = 0; i < allStrategies.length; i++) {
                address s = allStrategies[i];
                if (whitelistedStrategies[s] && !blacklistedStrategies[s]) {
                    tempStrategies[n] = s;
                    StrategyMetrics memory m = strategyMetrics[s];
                    StrategyFeeInfo memory f = strategyFees[s];
                    int256 netApy = int256(m.apy) - int256(f.baseFeeBps) - int256(f.withdrawalFeeBps) - int256(f.crossChainFeeBps);
                    netApyScores[n] = netApy;
                    n++;
                }
            }
        }
        // Sort strategies by netApyScores descending (simple selection sort for small n)
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = i + 1; j < n; j++) {
                if (netApyScores[j] > netApyScores[i]) {
                    // Swap
                    (netApyScores[i], netApyScores[j]) = (netApyScores[j], netApyScores[i]);
                    (tempStrategies[i], tempStrategies[j]) = (tempStrategies[j], tempStrategies[i]);
                }
            }
        }
        address[] memory resultStrategies = new address[](n);
        uint256[] memory resultAllocations = new uint256[](n);
        uint256 allocationPer = n > 0 ? 10000 / n : 0;
        for (uint256 i = 0; i < n; i++) {
            resultStrategies[i] = tempStrategies[i];
            resultAllocations[i] = allocationPer;
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
        require(whitelistedStrategies[strategy], "Strategy not whitelisted");
        require(!blacklistedStrategies[strategy], "Strategy blacklisted");
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
