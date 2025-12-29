import {
    getDefaultConfig,
    Chain,
} from '@rainbow-me/rainbowkit';
import {
    base,
    baseSepolia,
} from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'SpendGuard',
    projectId: 'YOUR_PROJECT_ID', // Replaced with actual ID in production
    chains: [base, baseSepolia],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
