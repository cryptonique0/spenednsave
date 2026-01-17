/**
 * Enhanced Token Registry with Support for Multiple Tokens
 * Includes Chainlink Oracle Configuration
 */

import type { Address } from 'viem';

/**
 * Token configuration interface
 */
export interface Token {
    symbol: string;
    name: string;
    decimals: number;
    address: Address;
    chainId: number;
    icon?: string;
    oracleAddress?: Address; // Chainlink Price Feed
    oracleFeedId?: string; // Chainlink Data Feed ID
    description?: string;
    type: 'native' | 'erc20';
    verified: boolean; // Is token verified/trusted
    custom?: boolean; // Is this a user-added custom token
}

/**
 * Chainlink Price Feed Addresses for Base Network
 */
export const CHAINLINK_ORACLES = {
    // Base Sepolia (Testnet)
    baseSepolia: {
        'ETH/USD': '0x4f3e5dA1c3D8bC07D3B1bae0e5B3e8f2A5e3c2b1' as Address,
        'USDC/USD': '0x7e860098F58bBFC8648a4aa498464e7bea7F00FF' as Address,
        'DAI/USD': '0x14866185B1962B63C3Ea9E03031fEADA95a63fd8' as Address,
        'USDT/USD': '0x7dc03B02145c0D1c3Dc5e20b72e4A6Bfc14A83C' as Address,
        'DEGEN/USD': '0x1f6d52516914ca9799b76364f7365aaf963361c8' as Address,
        'WETH/USD': '0x4f3e5dA1c3D8bC07D3B1bae0e5B3e8f2A5e3c2b1' as Address, // Same as ETH/USD
    },
    // Base Mainnet
    baseMainnet: {
        'ETH/USD': '0x71041dddad3287f98cad3d46d89e11e4ad7d1add' as Address,
        'USDC/USD': '0x7e860098F58bBFC8648a4aa498464e7bea7F00FF' as Address,
        'DAI/USD': '0x591e79239a7d679378eC23439C3F6C5f8241848b' as Address,
        'USDT/USD': '0x7e860098F58bBFC8648a4aa498464e7bea7F00FF' as Address,
        'DEGEN/USD': '0x4e844125952f32F72F3B0199d769b2aE66B8ae3F' as Address,
        'WETH/USD': '0x71041dddad3287f98cad3d46d89e11e4ad7d1add' as Address, // Same as ETH/USD
    },
} as const;

/**
 * Pre-configured tokens for Base network
 */
export const TOKENS_BY_CHAIN: Record<number, Record<string, Token>> = {
    // Base Sepolia (84532)
    84532: {
        ETH: {
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000' as Address,
            chainId: 84532,
            icon: '⟠',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['ETH/USD'],
            description: 'Native token on Base',
            type: 'native',
            verified: true,
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
            chainId: 84532,
            icon: '🔵',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['USDC/USD'],
            description: 'Stablecoin pegged to USD',
            type: 'erc20',
            verified: true,
        },
        DAI: {
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            address: '0x50c5725949A6F0c72E6C4a641F14FB3C6AF61164' as Address,
            chainId: 84532,
            icon: '🟨',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['DAI/USD'],
            description: 'Decentralized stablecoin',
            type: 'erc20',
            verified: true,
        },
        USDT: {
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            address: '0xfEd0da4584932ca4fc1d2736Ec899B67f2e5b152' as Address,
            chainId: 84532,
            icon: '💚',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['USDT/USD'],
            description: 'Popular stablecoin',
            type: 'erc20',
            verified: true,
        },
        DEGEN: {
            symbol: 'DEGEN',
            name: 'Degen',
            decimals: 18,
            address: '0x4ed4E862860beD51a9570b96d89aF5e1B0efefc7' as Address,
            chainId: 84532,
            icon: '🎰',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['DEGEN/USD'],
            description: 'Frames on Farcaster',
            type: 'erc20',
            verified: true,
        },
        WETH: {
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            address: '0x4200000000000000000000000000000000000006' as Address,
            chainId: 84532,
            icon: '⟠',
            oracleAddress: CHAINLINK_ORACLES.baseSepolia['WETH/USD'],
            description: 'Wrapped ETH token',
            type: 'erc20',
            verified: true,
        },
    },
    // Base Mainnet (8453)
    8453: {
        ETH: {
            symbol: 'ETH',
            name: 'Ethereum',
            decimals: 18,
            address: '0x0000000000000000000000000000000000000000' as Address,
            chainId: 8453,
            icon: '⟠',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['ETH/USD'],
            description: 'Native token on Base',
            type: 'native',
            verified: true,
        },
        USDC: {
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
            address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
            chainId: 8453,
            icon: '🔵',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['USDC/USD'],
            description: 'Stablecoin pegged to USD',
            type: 'erc20',
            verified: true,
        },
        DAI: {
            symbol: 'DAI',
            name: 'Dai Stablecoin',
            decimals: 18,
            address: '0x50c5725949A6F0c72E6C4a641F14FB3C6AF61164' as Address,
            chainId: 8453,
            icon: '🟨',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['DAI/USD'],
            description: 'Decentralized stablecoin',
            type: 'erc20',
            verified: true,
        },
        USDT: {
            symbol: 'USDT',
            name: 'Tether USD',
            decimals: 6,
            address: '0xfEd0da4584932ca4fc1d2736Ec899B67f2e5b152' as Address,
            chainId: 8453,
            icon: '💚',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['USDT/USD'],
            description: 'Popular stablecoin',
            type: 'erc20',
            verified: true,
        },
        DEGEN: {
            symbol: 'DEGEN',
            name: 'Degen',
            decimals: 18,
            address: '0x4ed4E862860beD51a9570b96d89aF5e1B0efefc7' as Address,
            chainId: 8453,
            icon: '🎰',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['DEGEN/USD'],
            description: 'Frames on Farcaster',
            type: 'erc20',
            verified: true,
        },
        WETH: {
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
            address: '0x4200000000000000000000000000000000000006' as Address,
            chainId: 8453,
            icon: '⟠',
            oracleAddress: CHAINLINK_ORACLES.baseMainnet['WETH/USD'],
            description: 'Wrapped ETH token',
            type: 'erc20',
            verified: true,
        },
    },
};

/**
 * Get tokens for a specific chain
 */
export function getTokensByChain(chainId: number): Record<string, Token> {
    return TOKENS_BY_CHAIN[chainId] || TOKENS_BY_CHAIN[84532]; // Default to Base Sepolia
}

/**
 * Get a specific token by symbol and chain
 */
export function getToken(chainId: number, symbol: string): Token | undefined {
    return getTokensByChain(chainId)[symbol];
}

/**
 * Get all tokens for a chain as an array
 */
export function getTokensArray(chainId: number): Token[] {
    return Object.values(getTokensByChain(chainId));
}

/**
 * Validate token address
 */
export function isValidTokenAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get token info from address (reverse lookup)
 */
export function getTokenByAddress(chainId: number, address: Address): Token | undefined {
    const tokens = getTokensByChain(chainId);
    return Object.values(tokens).find(
        (token) => token.address.toLowerCase() === address.toLowerCase()
    );
}

/**
 * Custom Token Registry (stored in localStorage)
 */
export interface CustomToken extends Token {
    customTokenId: string;
    addedAt: number;
}

/**
 * Add custom token to user's registry
 */
export function addCustomToken(
    chainId: number,
    token: Omit<Token, 'verified' | 'custom'> & { oracleAddress?: Address }
): CustomToken {
    const customToken: CustomToken = {
        ...token,
        verified: false,
        custom: true,
        customTokenId: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Date.now(),
    };

    // Store in localStorage (would be moved to database in production)
    const stored = localStorage.getItem('customTokens') || '{}';
    const customTokens = JSON.parse(stored);
    if (!customTokens[chainId]) {
        customTokens[chainId] = {};
    }
    customTokens[chainId][customToken.symbol] = customToken;
    localStorage.setItem('customTokens', JSON.stringify(customTokens));

    return customToken;
}

/**
 * Get custom tokens for a chain
 */
export function getCustomTokens(chainId: number): CustomToken[] {
    try {
        const stored = localStorage.getItem('customTokens') || '{}';
        const customTokens = JSON.parse(stored);
        return Object.values(customTokens[chainId] || {}) as CustomToken[];
    } catch {
        return [];
    }
}

/**
 * Remove custom token
 */
export function removeCustomToken(chainId: number, symbol: string): void {
    const stored = localStorage.getItem('customTokens') || '{}';
    const customTokens = JSON.parse(stored);
    if (customTokens[chainId]) {
        delete customTokens[chainId][symbol];
        localStorage.setItem('customTokens', JSON.stringify(customTokens));
    }
}

/**
 * Get all tokens including custom ones
 */
export function getAllTokens(chainId: number): Token[] {
    const verified = getTokensArray(chainId);
    const custom = getCustomTokens(chainId);
    return [...verified, ...custom];
}
