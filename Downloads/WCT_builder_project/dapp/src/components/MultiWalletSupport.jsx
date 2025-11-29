import React from 'react'
import { useConnect } from 'wagmi'

export default function MultiWalletSupport() {
  const { connect, connectors, isLoading, pendingConnector, error } = useConnect()

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Connect your wallet</h3>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            disabled={!connector.ready || isLoading}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14, cursor: 'pointer' }}
            aria-label={`connect-${connector.name}`}
          >
            {connector.name}
            {isLoading && connector.id === pendingConnector?.id && ' (connecting)'}
          </button>
        ))}
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error.message}</div>}
      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        Supported: MetaMask, WalletConnect, Coinbase Wallet
      </div>
    </div>
  )
}
