import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/Toast'

import { WagmiConfig, createConfig, configureChains } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { alfajores } from './config/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

const { publicClient } = configureChains(
  [alfajores],
  [
    jsonRpcProvider({ rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }) }),
    publicProvider(),
  ]
)

const connectors = [
  new InjectedConnector({ chains: [alfajores] }),
  new WalletConnectConnector({
    chains: [alfajores],
    options: {
      projectId,
      metadata: {
        name: 'WCT DApp',
        description: 'Demo dapp with WalletConnect on Celo Alfajores',
        url: 'http://localhost:5173',
      },
    },
  }),
  new CoinbaseWalletConnector({
    chains: [alfajores],
    options: {
      appName: 'WCT DApp',
      jsonRpcUrl: alfajores.rpcUrls.default.http[0],
    },
  }),
]

const wagmiConfig = createConfig({ autoConnect: true, connectors, publicClient })

createRoot(document.getElementById('root')).render(
  <WagmiConfig config={wagmiConfig}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </WagmiConfig>
)
