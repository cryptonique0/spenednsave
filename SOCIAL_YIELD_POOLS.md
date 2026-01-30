# Social Yield Pools

## Overview
Social Yield Pools allow users to form groups (pools) to collectively participate in yield strategies and share returns. Pools are managed by the YieldStrategyManager and integrated with SpendVaults for seamless DeFi collaboration.

## Key Features
- Users can create, join, and leave pools.
- Pool members deposit funds (tracked as shares).
- Pools can participate in yield strategies collectively.
- Yield is distributed among members based on their share.
- Analytics and reporting for pool performance, member shares, and strategies.

## Main Functions
### YieldStrategyManager
- `createSocialYieldPool(name)`: Create a new pool.
- `joinSocialYieldPool(poolId)`: Join an existing pool.
- `leaveSocialYieldPool(poolId)`: Leave a pool.
- `depositToSocialYieldPool(poolId, amount)`: Deposit funds (track shares).
- `withdrawFromSocialYieldPool(poolId, amount)`: Withdraw funds (reduce shares).
- `poolParticipateInStrategy(poolId, strategy)`: Pool participates in a strategy.
- `distributePoolYield(poolId, totalYield)`: Distribute yield to members (stub).
- Analytics: `getSocialYieldPoolInfo`, `getSocialYieldPoolMemberShare`, `getSocialYieldPoolStrategies`, `getSocialYieldPoolTotalPooled`.

### SpendVault
- Mirrors all pool management and analytics functions, calling the manager.

## Usage Flow
1. User creates a pool.
2. Other users join the pool.
3. Members deposit funds (tracked as shares).
4. Pool creator selects strategies for the pool to participate in.
5. Yield is realized and distributed among members based on shares.
6. Members can withdraw their share or leave the pool.

## Events
- Pool creation, join, leave, deposit, withdraw, and yield distribution are all logged as events for transparency.

## Notes
- Actual token transfers are not handled in the pool logic; only share tracking is implemented. Integrate with vault/strategy logic for real asset movement.
- Yield distribution is a stub for now; implement actual transfers as needed.
