import React, { useState } from 'react'
import './App.css'
import React, { useMemo, useState } from 'react'
import { useAccount, useDisconnect, useSignMessage, useConnect } from 'wagmi'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import NetworkInfo from './components/NetworkInfo'
import { formatAddress } from './lib/format'

export default function App() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const [sig, setSig] = useState(null)

  async function onSign() {
    try {
      const message = 'Sign this message to prove you own the wallet.'
      const signature = await signMessageAsync({ message })
      setSig(signature)
    } catch (err) {
      console.error(err)
      setSig(null)
    }
  }

  const wcConnector = connectors.find((c) => c instanceof WalletConnectConnector)
  const injectedConnector = useMemo(
    () => connectors.find((c) => c.id === 'injected'),
    [connectors]
  )

  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
  const missingProjectId = !projectId || projectId === 'your_project_id_here'

  const connectorsReady = connectors && connectors.length > 0

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>WCT DApp (WalletConnect on Celo Alfajores)</h1>

      <div style={{ marginTop: 12 }}>
        {isConnected ? (
          <div>
            <div>Connected address: {formatAddress(address)}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => disconnect()}>Disconnect</button>
              <button onClick={onSign} style={{ marginLeft: 8 }}>
                Sign message
              </button>
            </div>
            <NetworkInfo />
            {sig && (
              <pre style={{ marginTop: 12, maxWidth: 800, whiteSpace: 'break-spaces' }}>{sig}</pre>
            )}
          </div>
        ) : (
          <div>
            <p>No wallet connected.</p>
            {missingProjectId && (
              <div style={{ marginBottom: 8, color: '#b45309', background: '#fffbeb', padding: 8, border: '1px solid #fde68a', borderRadius: 6 }}>
                WalletConnect Project ID is missing. Create one at cloud.walletconnect.com and set VITE_WALLETCONNECT_PROJECT_ID in dapp/.env
              </div>
            )}
            <div>
              {wcConnector && (
                <button
                  onClick={() => connect({ connector: wcConnector })}
                  disabled={!wcConnector.ready || isLoading}
                  style={{ marginRight: 8 }}
                >
                  Connect with WalletConnect
                  {isLoading && wcConnector.id === pendingConnector?.id && ' (connecting)'}
                </button>
              )}
              {injectedConnector && (
                <button
                  onClick={() => connect({ connector: injectedConnector })}
                  disabled={!injectedConnector.ready || isLoading}
                >
                  Connect with Injected
                  {isLoading && injectedConnector.id === pendingConnector?.id && ' (connecting)'}
                </button>
              )}
            </div>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error.message}</div>}
            <div style={{ marginTop: 8 }}>
              <small>Tip: Use a WalletConnect-compatible wallet and choose the WalletConnect option.</small>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
