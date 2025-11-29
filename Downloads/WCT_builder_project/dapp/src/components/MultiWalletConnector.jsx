import React from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'

export default function MultiWalletConnector() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isLoading, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()

  const walletConfigs = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect with MetaMask browser extension',
      connector: connectors.find(c => c.name === 'MetaMask') || connectors[0]
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan QR code with your mobile wallet',
      connector: connectors.find(c => c.name === 'WalletConnect')
    },
    {
      name: 'Coinbase Wallet',
      icon: '💼',
      description: 'Connect with Coinbase Wallet',
      connector: connectors.find(c => c.name === 'Coinbase Wallet')
    }
  ]

  if (isConnected) {
    return (
      <div style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #10b981',
        background: '#f0fdf4'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              ✅ Connected
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ef4444',
              background: '#fff',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: 24,
      borderRadius: 12,
      border: '2px solid #e5e7eb',
      background: '#fff'
    }}>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>
        Connect Your Wallet
      </h3>
      <p style={{ margin: '0 0 20px 0', fontSize: 14, color: '#6b7280' }}>
        Choose your preferred wallet to get started
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {walletConfigs.map((wallet) => {
          if (!wallet.connector) return null
          
          return (
            <button
              key={wallet.name}
              disabled={!wallet.connector.ready || isLoading}
              onClick={() => connect({ connector: wallet.connector })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 16,
                borderRadius: 8,
                border: '2px solid #e5e7eb',
                background: wallet.connector.ready ? '#fff' : '#f9fafb',
                cursor: wallet.connector.ready ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                if (wallet.connector.ready) {
                  e.currentTarget.style.borderColor = '#3b82f6'
                  e.currentTarget.style.background = '#eff6ff'
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.background = wallet.connector.ready ? '#fff' : '#f9fafb'
              }}
            >
              <span style={{ fontSize: 32 }}>{wallet.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                  {wallet.name}
                  {!wallet.connector.ready && ' (Not installed)'}
                  {isLoading && pendingConnector?.id === wallet.connector.id && ' (Connecting...)'}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {wallet.description}
                </div>
              </div>
              <span style={{ fontSize: 20, color: '#9ca3af' }}>→</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 6,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          fontSize: 14
        }}>
          <strong>Connection failed:</strong> {error.message}
        </div>
      )}

      <div style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 6,
        background: '#f0f9ff',
        fontSize: 12,
        color: '#1e40af'
      }}>
        💡 <strong>Tip:</strong> Don't have a wallet? 
        <a 
          href="https://metamask.io/download/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: '#2563eb', marginLeft: 4 }}
        >
          Install MetaMask
        </a>
      </div>
    </div>
  )
}
