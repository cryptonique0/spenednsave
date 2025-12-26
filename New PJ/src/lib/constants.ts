export const NETWORKS = {
  BASE_MAINNET: {
    id: 8453,
    name: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export const TALENT_PROTOCOL_API_URL = 'https://api.talentprotocol.com';

export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud',
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
];

export const APP_CONFIG = {
  name: 'Talent Resume',
  description: 'On-Chain Professional Profiles',
  url: 'https://talent-resume.vercel.app',
  maxProfileSize: 1024 * 1024, // 1MB
  maxFileSize: 5 * 1024 * 1024, // 5MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export const REPUTATION_LEVELS = [
  { min: 0, max: 99, name: 'Newcomer', color: 'gray' },
  { min: 100, max: 499, name: 'Contributor', color: 'blue' },
  { min: 500, max: 999, name: 'Influencer', color: 'purple' },
  { min: 1000, max: 4999, name: 'Expert', color: 'orange' },
  { min: 5000, max: Infinity, name: 'Legend', color: 'gold' },
];

export const SOCIAL_PLATFORMS = [
  { name: 'Twitter', icon: '🐦', baseUrl: 'https://twitter.com/' },
  { name: 'GitHub', icon: '💻', baseUrl: 'https://github.com/' },
  { name: 'LinkedIn', icon: '💼', baseUrl: 'https://linkedin.com/in/' },
  { name: 'Discord', icon: '💬', baseUrl: '' },
  { name: 'Telegram', icon: '📱', baseUrl: 'https://t.me/' },
];
