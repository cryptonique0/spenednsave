import {
    getDefaultConfig,
    Chain,
} from '@rainbow-me/rainbowkit';
import {
    base,
    baseSepolia,
} from 'wagmi/chains';

// IMPORTANT: To enable WalletConnect v2 and support more wallets,
// you must set your WalletConnect Cloud projectId below.
// Get one for free at https://cloud.walletconnect.com
export const config = getDefaultConfig({
    appName: 'SpendGuard',
    projectId: '2c744d31bd68644ba0831658bbd2f1d6', // <-- WalletConnect Cloud projectId
    chains: [base, baseSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
