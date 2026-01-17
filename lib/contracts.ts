/**
 * Contract Addresses for SpendGuard
 * 
 * IMPORTANT: Only the VaultFactory needs to be deployed once per network.
 * Individual vaults are created per-user through the factory.
 */

// Base Sepolia Testnet (Chain ID: 84532)
export const CONTRACTS_BASE_SEPOLIA = {
    VaultFactory: '0x333dA20da292858B7AfA2Af51c6dbF000B7eb23f', // TODO: Update after deployment
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Sepolia USDC
} as const;

// Base Mainnet (Chain ID: 8453)
export const CONTRACTS_BASE_MAINNET = {
    VaultFactory: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base Mainnet USDC
} as const;

// Optional: GuardianBadge contract (set after deployment)
export const GUARDIAN_BADGE_ADDRESS = {
    baseSepolia: '0x0000000000000000000000000000000000000000',
    baseMainnet: '0x0000000000000000000000000000000000000000',
};

/**
 * Token configuration for supported tokens
 */
export const SUPPORTED_TOKENS = {
    ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000', // Native ETH
    },
    USDC: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
    },
} as const;

/**
 * Get contract addresses for the current chain
 */
export function getContractAddresses(chainId: number) {
    switch (chainId) {
        case 84532: // Base Sepolia
            return CONTRACTS_BASE_SEPOLIA;
        case 8453: // Base Mainnet
            return CONTRACTS_BASE_MAINNET;
        default:
            throw new Error(`Unsupported chain ID: ${chainId}`);
    }
}

/**
 * Check if factory is deployed on the current chain
 */
export function isFactoryDeployed(chainId: number): boolean {
    try {
        const addresses = getContractAddresses(chainId);
        return addresses.VaultFactory !== '0x0000000000000000000000000000000000000000';
    } catch {
        return false;
    }
}
