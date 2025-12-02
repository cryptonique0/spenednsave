// Constants used throughout the application

export const SUPPORTED_CHAINS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  ARBITRUM_ONE: 42161,
  OPTIMISM: 10,
  CELO_MAINNET: 42220,
  CELO_ALFAJORES: 44787
};

export const CHAIN_NAMES = {
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: 'Ethereum',
  [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA]: 'Sepolia Testnet',
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: 'Polygon',
  [SUPPORTED_CHAINS.ARBITRUM_ONE]: 'Arbitrum',
  [SUPPORTED_CHAINS.OPTIMISM]: 'Optimism',
  [SUPPORTED_CHAINS.CELO_MAINNET]: 'Celo',
  [SUPPORTED_CHAINS.CELO_ALFAJORES]: 'Alfajores Testnet'
};

export const NATIVE_TOKENS = {
  [SUPPORTED_CHAINS.ETHEREUM_MAINNET]: 'ETH',
  [SUPPORTED_CHAINS.ETHEREUM_SEPOLIA]: 'ETH',
  [SUPPORTED_CHAINS.POLYGON_MAINNET]: 'MATIC',
  [SUPPORTED_CHAINS.ARBITRUM_ONE]: 'ETH',
  [SUPPORTED_CHAINS.OPTIMISM]: 'ETH',
  [SUPPORTED_CHAINS.CELO_MAINNET]: 'CELO',
  [SUPPORTED_CHAINS.CELO_ALFAJORES]: 'CELO'
};

export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed'
};

export const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0, 3.0, 5.0]; // in percentage

export const GAS_SPEED = {
  SLOW: 'slow',
  STANDARD: 'standard',
  FAST: 'fast'
};

export const TOKEN_STANDARDS = {
  ERC20: 'ERC20',
  ERC721: 'ERC721',
  ERC1155: 'ERC1155'
};

export const VESTING_TYPES = {
  LINEAR: 'linear',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  CLIFF: 'cliff'
};

export const ORDER_TYPES = {
  MARKET: 'market',
  LIMIT: 'limit',
  STOP_LOSS: 'stop_loss',
  TAKE_PROFIT: 'take_profit'
};

export const TIER_LEVELS = {
  BRONZE: { min: 0, rate: 0.01, color: '#cd7f32' },
  SILVER: { min: 5, rate: 0.015, color: '#c0c0c0' },
  GOLD: { min: 10, rate: 0.02, color: '#ffd700' },
  PLATINUM: { min: 25, rate: 0.03, color: '#e5e4e2' },
  DIAMOND: { min: 50, rate: 0.05, color: '#b9f2ff' }
};

export const ACHIEVEMENT_CATEGORIES = {
  TRADING: 'trading',
  DEFI: 'defi',
  NFT: 'nft',
  GOVERNANCE: 'governance',
  SOCIAL: 'social'
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

export const LOCAL_STORAGE_KEYS = {
  ADDRESS_BOOK: 'addressBook_',
  SCHEDULED_TXS: 'scheduledTxs_',
  USER_SETTINGS: 'userSettings_',
  THEME: 'theme',
  SLIPPAGE: 'slippage',
  GAS_PRICE: 'gasPrice'
};

export const WALLET_TYPES = {
  METAMASK: 'metamask',
  WALLETCONNECT: 'walletconnect',
  COINBASE: 'coinbase',
  INJECTED: 'injected'
};

export const TIMEFRAMES = {
  '1H': { label: '1 Hour', seconds: 3600 },
  '24H': { label: '24 Hours', seconds: 86400 },
  '7D': { label: '7 Days', seconds: 604800 },
  '30D': { label: '30 Days', seconds: 2592000 },
  '1Y': { label: '1 Year', seconds: 31536000 }
};

export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const MAX_SLIPPAGE = 50; // 50%
export const DEFAULT_DEADLINE = 20; // 20 minutes

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const MAX_UINT256 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

// ERC20 ABI
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)'
];

// ERC721 ABI
export const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function approve(address to, uint256 tokenId)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function setApprovalForAll(address operator, bool approved)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)'
];

// Multicall ABI
export const MULTICALL_ABI = [
  'function aggregate(tuple(address target, bytes callData)[] calls) returns (uint256 blockNumber, bytes[] returnData)'
];
