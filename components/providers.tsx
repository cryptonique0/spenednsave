'use client';

import * as React from 'react';
import { SimulationProvider } from './simulation/SimulationContext';
import { NotificationsProvider } from './notifications/NotificationsContext';
import { I18nProvider } from '@/lib/i18n';
import {
    RainbowKitProvider,
    darkTheme,
    lightTheme,
} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/config';
import { useTheme } from 'next-themes';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    return (
        <SimulationProvider>
            <NotificationsProvider>
                <I18nProvider>
                    <WagmiProvider config={config}>
                        <QueryClientProvider client={queryClient}>
                            <RainbowKitProvider
                                theme={mounted && theme === 'dark' ? darkTheme() : lightTheme()}
                                initialChain={84532} // Base Mainnet
                            >
                                {children}
                            </RainbowKitProvider>
                        </QueryClientProvider>
                    </WagmiProvider>
                </I18nProvider>
            </NotificationsProvider>
        </SimulationProvider>
    );
}
